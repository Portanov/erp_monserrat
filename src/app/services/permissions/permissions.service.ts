import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GatewayBaseService } from '../gateway-base/gateway.service';
import { UserService } from '../user/user.service';
import {
  AssignSystemPermissionDto,
  SystemPermissionsMap
} from '../../models/permissions/permissions.model';

export interface PagePermissions {
  [permissionKey: string]: boolean | undefined;
}

export interface UserPermissions {
  [userId: number]: {
    [page: string]: PagePermissions;
  };
}

export interface PageConfig {
  name: string;
  label: string;
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class PermissionService extends GatewayBaseService {
  private userService = inject(UserService);

  private pagesConfig = signal<PageConfig[]>([
    {
      name: 'group',
      label: 'Grupos',
      permissions: ['view', 'create', 'edit', 'delete']
    },
    {
      name: 'users',
      label: 'Usuarios',
      permissions: ['view', 'create', 'edit', 'delete', 'editState']
    },
    {
      name: 'tickets',
      label: 'Tickets',
      permissions: ['view', 'create', 'edit', 'delete']
    }
  ]);

  private permissionsCache = signal<UserPermissions>({});
  private loadingUsers = new Set<number>();

  currentUserPermissions = computed(() => {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) return null;
    return this.permissionsCache()[currentUser.id] || {};
  });

  getPagesConfig(): PageConfig[] {
    return this.pagesConfig();
  }

  getPagePermissionsConfig(pageName: string): PageConfig | undefined {
    return this.pagesConfig().find(page => page.name === pageName);
  }

  hasPermission(page: string, action: string): boolean {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) return false;

    const pagePermissions = this.permissionsCache()[currentUser.id]?.[page];
    if (!pagePermissions) {
      return false;
    }

    return this.resolvePermissionValue(pagePermissions, action);
  }

  hasPermissions(page: string, actions: string[]): boolean {
    return actions.every(action => this.hasPermission(page, action));
  }

  hasAnyPermission(page: string, actions: string[]): boolean {
    return actions.some(action => this.hasPermission(page, action));
  }

  getPagePermissions(page: string): PagePermissions | null {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) return null;

    const pagePermissions = this.permissionsCache()[currentUser.id]?.[page];
    return pagePermissions || null;
  }

  canAccessPage(page: string): boolean {
    return this.hasPermission(page, 'view');
  }

  async getUserPermissions(userId: number): Promise<SystemPermissionsMap | null> {
    try {
      const permissions = await firstValueFrom(
        this.get<SystemPermissionsMap>(`/permissions/system/user/${userId}`)
      );

      const normalizedPermissions = this.normalizeSystemPermissions(permissions ?? {});
      this.updatePermissionsCache(userId, normalizedPermissions);

      return normalizedPermissions;
    } catch (error) {
      console.error(`Error fetching permissions for user ${userId}:`, error);
      return null;
    }
  }

  async checkUserPermission(userId: number, page: string, action: string): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.get<{ hasPermission: boolean }>(
          `/permissions/system/user/${userId}/page/${page}/action/${action}`
        )
      );
      return result?.hasPermission ?? false;
    } catch (error) {
      console.error(`Error checking permission for user ${userId}:`, error);
      return false;
    }
  }

  async assignPermission(
    userId: number,
    page: string,
    action: string,
    active: boolean
  ): Promise<boolean> {
    try {
      await firstValueFrom(
        this.post('/permissions/system/assign', {
          userId,
          page,
          action,
          active
        } as AssignSystemPermissionDto)
      );

      await this.refreshUserPermissions(userId);
      return true;
    } catch (error) {
      console.error(`Error assigning permission for user ${userId}:`, error);
      return false;
    }
  }

  async assignPagePermissions(
    userId: number,
    page: string,
    permissions: { [action: string]: boolean }
  ): Promise<boolean> {
    try {
      for (const [action, active] of Object.entries(permissions)) {
        await this.assignPermission(userId, page, action, active);
      }
      return true;
    } catch (error) {
      console.error(`Error assigning page permissions for user ${userId}:`, error);
      return false;
    }
  }

  async initializeUserPermissions(userId: number): Promise<boolean> {
    try {
      await firstValueFrom(this.post(`/permissions/system/initialize/${userId}`, {}));

      const defaultPermissions: { [page: string]: PagePermissions } = {};
      this.pagesConfig().forEach(pageConfig => {
        const pagePermissions: PagePermissions = {};
        pageConfig.permissions.forEach(permission => {
          pagePermissions[permission] = false;
        });
        defaultPermissions[pageConfig.name] = pagePermissions;
      });

      this.permissionsCache.update(perms => ({
        ...perms,
        [userId]: defaultPermissions
      }));

      return true;
    } catch (error) {
      console.error(`Error initializing permissions for user ${userId}:`, error);
      return false;
    }
  }

  async removeUserPermissions(userId: number): Promise<boolean> {
    try {
      await firstValueFrom(this.delete(`/permissions/system/user/${userId}`));

      this.permissionsCache.update(perms => {
        const next = { ...perms };
        delete next[userId];
        return next;
      });

      return true;
    } catch (error) {
      console.error(`Error removing permissions for user ${userId}:`, error);
      return false;
    }
  }

  async getUserPages(userId: number): Promise<string[]> {
    const permissions = await this.getUserPermissions(userId);
    return permissions ? Object.keys(permissions) : [];
  }

  async refreshUserPermissions(userId: number): Promise<void> {
    if (this.loadingUsers.has(userId)) {
      let retries = 0;
      while (this.loadingUsers.has(userId) && retries < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      return;
    }

    this.loadingUsers.add(userId);
    try {
      const permissions = await firstValueFrom(
        this.get<SystemPermissionsMap>(`/permissions/system/user/${userId}`)
      );

      if (permissions) {
        this.updatePermissionsCache(userId, this.normalizeSystemPermissions(permissions));
      }
    } catch (error) {
      console.error(`Error refreshing permissions for user ${userId}:`, error);
    } finally {
      this.loadingUsers.delete(userId);
    }
  }

  isValidPermission(page: string, action: string): boolean {
    const pageConfig = this.getPagePermissionsConfig(page);
    if (!pageConfig) return false;

    const normalizedAction = this.normalizePermissionKey(action);
    return pageConfig.permissions.some(permission => this.normalizePermissionKey(permission) === normalizedAction);
  }

  getAvailablePermissions(page: string): string[] {
    const pageConfig = this.getPagePermissionsConfig(page);
    return pageConfig ? pageConfig.permissions : [];
  }

  async loadCurrentUserPermissions(force = false): Promise<void> {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) {
      return;
    }

    if (!force && this.hasCachedPermissions(currentUser.id)) {
      return;
    }

    await this.refreshUserPermissions(currentUser.id);
  }

  hasCachedPermissions(userId: number): boolean {
    return Boolean(this.permissionsCache()[userId]);
  }

  private updatePermissionsCache(userId: number, permissions: SystemPermissionsMap): void {
    this.permissionsCache.update(perms => ({
      ...perms,
      [userId]: permissions
    }));
  }

  private normalizeSystemPermissions(permissions: SystemPermissionsMap): SystemPermissionsMap {
    const normalizedPermissions: SystemPermissionsMap = {};

    Object.entries(permissions ?? {}).forEach(([page, actions]) => {
      normalizedPermissions[page] = { ...actions };
    });

    return normalizedPermissions;
  }

  private resolvePermissionValue(pagePermissions: PagePermissions, action: string): boolean {
    const requestedKey = this.normalizePermissionKey(action);

    for (const [storedAction, active] of Object.entries(pagePermissions)) {
      if (this.normalizePermissionKey(storedAction) === requestedKey) {
        return Boolean(active);
      }
    }

    return false;
  }

  private normalizePermissionKey(value: string): string {
    return value.trim().toLowerCase().split('/')[0];
  }
}