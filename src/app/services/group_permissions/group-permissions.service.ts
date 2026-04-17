import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GatewayBaseService } from '../gateway-base/gateway.service';
import { UserService } from '../user/user.service';
import { GroupService } from '../group/group.service';
import { GroupData } from '../../models/groups/groups.model';
import {
  GroupPermissions,
  GROUP_PERMISSIONS_LIST,
  GROUP_PERMISSIONS_LABELS,
  AssignGroupPermissionDto
} from '../../models/permissions/permissions.model';

export interface UserGroupPermissions {
  [userId: number]: {
    [groupId: string]: GroupPermissions;
  };
}

@Injectable({ providedIn: 'root' })
export class GroupPermissionService extends GatewayBaseService {
  private userService = inject(UserService);
  private groupService = inject(GroupService);

  // Caché local
  private groupPermissionsCache = signal<UserGroupPermissions>({});
  private groupsCache: Map<number, GroupData> = new Map();
  private loadingGroups: Set<number> = new Set();
  private loadingPermissions: Map<string, boolean> = new Map(); // key: `${userId}-${groupId}`

  // ========== Métodos de utilidad ==========

  getAvailablePermissions(): string[] {
    return [...GROUP_PERMISSIONS_LIST];
  }

  getPermissionLabel(permission: string): string {
    return GROUP_PERMISSIONS_LABELS[permission as keyof GroupPermissions] || permission;
  }

  /**
   * Obtener grupo con caché
   */
  private async getGroup(groupId: number): Promise<GroupData | undefined> {
    if (this.groupsCache.has(groupId)) {
      return this.groupsCache.get(groupId);
    }

    if (this.loadingGroups.has(groupId)) {
      let retries = 0;
      while (this.loadingGroups.has(groupId) && retries < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      return this.groupsCache.get(groupId);
    }

    this.loadingGroups.add(groupId);
    try {
      const group = await this.groupService.getById(groupId);
      if (group) {
        this.groupsCache.set(groupId, group);
        return group;
      }
      return undefined;
    } finally {
      this.loadingGroups.delete(groupId);
    }
  }

  /**
   * Verifica si un usuario es miembro de un grupo
   */
  private async isMemberOfGroup(userId: number, groupId: number): Promise<boolean> {
    const group = await this.getGroup(groupId);
    return group?.members?.includes(userId) ?? false;
  }

  /**
   * Cargar permisos de un usuario en un grupo desde el backend
   */
  private async loadGroupPermissionsFromBackend(
    userId: number,
    groupId: number
  ): Promise<GroupPermissions | null> {
    const cacheKey = `${userId}-${groupId}`;

    if (this.loadingPermissions.get(cacheKey)) {
      let retries = 0;
      while (this.loadingPermissions.get(cacheKey) && retries < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      return this.getCachedGroupPermissions(userId, groupId);
    }

    this.loadingPermissions.set(cacheKey, true);

    try {
      const permissions = await firstValueFrom(
        this.get<Record<string, boolean>>(`/permissions/group/user/${userId}/group/${groupId}`)
      );

      if (permissions) {
        const groupPerms = this.convertToGroupPermissions(permissions);
        this.updatePermissionsCache(userId, groupId, groupPerms);
        return groupPerms;
      }
      return null;
    } catch (error) {
      console.error(`Error loading group permissions for user ${userId} in group ${groupId}:`, error);
      return null;
    } finally {
      this.loadingPermissions.delete(cacheKey);
    }
  }

  /**
   * Convierte el objeto del backend a GroupPermissions
   */
  private convertToGroupPermissions(perms: Record<string, boolean>): GroupPermissions {
    return {
      createTicket: perms['createTicket'] ?? false,
      editTicket: perms['editTicket'] ?? false,
      deleteTicket: perms['deleteTicket'] ?? false,
      viewTicket: perms['viewTicket'] ?? false,
      addMember: perms['addMember'] ?? false,
      removeMember: perms['removeMember'] ?? false,
      editMemberRole: perms['editMemberRole'] ?? false,
      viewMembers: perms['viewMembers'] ?? false,
      editGroupSettings: perms['editGroupSettings'] ?? false,
      deleteGroup: perms['deleteGroup'] ?? false,
      manageGroupPrivileges: perms['manageGroupPrivileges'] ?? false
    };
  }

  /**
   * Obtener permisos cacheados de un usuario en un grupo
   */
  private getCachedGroupPermissions(userId: number, groupId: number): GroupPermissions | null {
    return this.groupPermissionsCache()[userId]?.[groupId.toString()] || null;
  }

  /**
   * Actualizar caché de permisos
   */
  private updatePermissionsCache(userId: number, groupId: number, permissions: GroupPermissions): void {
    this.groupPermissionsCache.update(perms => {
      const newPerms = { ...perms };
      if (!newPerms[userId]) {
        newPerms[userId] = {};
      }
      newPerms[userId][groupId.toString()] = permissions;
      return newPerms;
    });
  }

  // ========== Métodos públicos (misma interfaz que antes) ==========

  /**
   * Verifica si el usuario actual tiene un permiso específico en un grupo
   * Los miembros siempre tienen viewTicket = true
   */
  async hasGroupPermission(groupId: number, permission: string): Promise<boolean> {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) return false;

    // Verificar membresía para viewTicket
    const isMember = await this.isMemberOfGroup(currentUser.id, groupId);
    if (isMember && permission === 'viewTicket') {
      return true;
    }
    if (isMember && permission === 'viewMembers') {
      return true;
    }

    // Cargar permisos si no están en caché
    let permissions = this.getCachedGroupPermissions(currentUser.id, groupId);
    if (!permissions) {
      permissions = await this.loadGroupPermissionsFromBackend(currentUser.id, groupId);
    }

    if (!permissions) return false;

    return permissions[permission as keyof GroupPermissions] ?? false;
  }

  /**
   * Verifica si el usuario actual tiene TODOS los permisos especificados
   */
  async hasAllGroupPermissions(groupId: number, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasGroupPermission(groupId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Verifica si el usuario actual tiene AL MENOS UNO de los permisos especificados
   */
  async hasAnyGroupPermission(groupId: number, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasGroupPermission(groupId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Obtiene todos los permisos del usuario actual en un grupo
   */
  async getGroupPermissions(groupId: number): Promise<GroupPermissions | null> {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) return null;

    let permissions = this.getCachedGroupPermissions(currentUser.id, groupId);
    if (!permissions) {
      permissions = await this.loadGroupPermissionsFromBackend(currentUser.id, groupId);
    }

    if (!permissions) return null;

    // Asegurar que viewTicket sea true para miembros
    const isMember = await this.isMemberOfGroup(currentUser.id, groupId);
    if (isMember) {
      return { ...permissions, viewTicket: true, viewMembers: true };
    }

    return permissions;
  }

  /**
   * Obtiene los permisos de un usuario específico en un grupo
   */
  async getUserGroupPermissions(userId: number, groupId: number): Promise<GroupPermissions | null> {
    let permissions = this.getCachedGroupPermissions(userId, groupId);
    if (!permissions) {
      permissions = await this.loadGroupPermissionsFromBackend(userId, groupId);
    }

    if (!permissions) return null;

    const isMember = await this.isMemberOfGroup(userId, groupId);
    if (isMember) {
      return { ...permissions, viewTicket: true, viewMembers: true };
    }

    return permissions;
  }

  /**
   * Asigna permisos a un usuario en un grupo
   */
  async assignGroupPermissions(
    userId: number,
    groupId: number,
    permissions: Partial<GroupPermissions>
  ): Promise<boolean> {
    try {
      // Enviar cada permiso individualmente al backend
      for (const [action, active] of Object.entries(permissions)) {
        await firstValueFrom(
          this.post('/permissions/group/assign', {
            userId,
            groupId,
            action,
            active
          } as AssignGroupPermissionDto)
        );
      }

      // Refrescar caché
      await this.refreshGroupPermissions(userId, groupId);

      return true;
    } catch (error) {
      console.error('Error assigning group permissions:', error);
      return false;
    }
  }

  /**
   * Inicializa permisos por defecto para un usuario en un grupo (como miembro normal)
   */
  async initializeGroupPermissions(userId: number, groupId: number, isMember: boolean = true): Promise<boolean> {
    try {
      if (isMember) {
        await firstValueFrom(
          this.post('/permissions/group/initialize-member', { userId, groupId })
        );
      } else {
        // Para no miembros, todos false
        const defaultPermissions: Partial<GroupPermissions> = {};
        GROUP_PERMISSIONS_LIST.forEach(permission => {
          defaultPermissions[permission] = false;
        });
        await this.assignGroupPermissions(userId, groupId, defaultPermissions);
      }

      await this.refreshGroupPermissions(userId, groupId);
      return true;
    } catch (error) {
      console.error('Error initializing group permissions:', error);
      return false;
    }
  }

  /**
   * Inicializa permisos para el creador del grupo (todos true)
   */
  async initializeOwnerPermissions(userId: number, groupId: number): Promise<boolean> {
    try {
      await firstValueFrom(
        this.post('/permissions/group/initialize-owner', { userId, groupId })
      );

      await this.refreshGroupPermissions(userId, groupId);
      return true;
    } catch (error) {
      console.error('Error initializing owner permissions:', error);
      return false;
    }
  }

  /**
   * Inicializa permisos para un miembro nuevo
   */
  async initializeMemberPermissions(userId: number, groupId: number): Promise<boolean> {
    return this.initializeGroupPermissions(userId, groupId, true);
  }

  /**
   * Elimina todos los permisos de un usuario en un grupo
   */
  async removeUserGroupPermissions(userId: number, groupId: number): Promise<boolean> {
    try {
      await firstValueFrom(
        this.delete(`/permissions/group/user/${userId}/group/${groupId}`)
      );

      // Limpiar caché
      this.groupPermissionsCache.update(perms => {
        const newPerms = { ...perms };
        if (newPerms[userId]) {
          delete newPerms[userId][groupId.toString()];
          if (Object.keys(newPerms[userId]).length === 0) {
            delete newPerms[userId];
          }
        }
        return newPerms;
      });

      return true;
    } catch (error) {
      console.error('Error removing user group permissions:', error);
      return false;
    }
  }

  /**
   * Refresca los permisos de un usuario en un grupo
   */
  async refreshGroupPermissions(userId: number, groupId: number): Promise<void> {
    const permissions = await firstValueFrom(
      this.get<Record<string, boolean>>(`/permissions/group/user/${userId}/group/${groupId}`)
    );

    if (permissions) {
      const groupPerms = this.convertToGroupPermissions(permissions);
      this.updatePermissionsCache(userId, groupId, groupPerms);
    }
  }

  /**
   * Obtiene todos los usuarios que tienen permisos en un grupo
   */
  async getUsersWithPermissions(groupId: number): Promise<{ userId: number; permissions: GroupPermissions }[]> {
    // Esto requeriría un endpoint adicional en el backend
    // Por ahora, retornamos desde caché
    const result: { userId: number; permissions: GroupPermissions }[] = [];
    const allPermissions = this.groupPermissionsCache();

    for (const userIdStr of Object.keys(allPermissions)) {
      const userId = parseInt(userIdStr);
      const groupPerms = allPermissions[userId]?.[groupId.toString()];
      if (groupPerms) {
        result.push({ userId, permissions: groupPerms });
      }
    }

    return result;
  }

  /**
   * Obtiene todos los grupos a los que un usuario tiene acceso
   */
  async getUserGroups(userId: number): Promise<{ group: GroupData; permissions: GroupPermissions }[]> {
    const result: { group: GroupData; permissions: GroupPermissions }[] = [];
    const userPerms = this.groupPermissionsCache()[userId];

    if (userPerms) {
      for (const groupId of Object.keys(userPerms)) {
        const groupIdNum = parseInt(groupId);
        const group = await this.getGroup(groupIdNum);
        if (group) {
          result.push({
            group,
            permissions: userPerms[groupId]
          });
        }
      }
    }

    return result;
  }

  /**
   * Verifica si el usuario puede ver tickets (siempre true para miembros)
   */
  async canViewTickets(groupId: number): Promise<boolean> {
    return this.hasGroupPermission(groupId, 'viewTicket');
  }

  /**
   * Verifica si el usuario actual puede administrar un grupo
   */
  async canManageGroup(groupId: number): Promise<boolean> {
    const group = await this.getGroup(groupId);
    const currentUser = this.userService.getCurrentUser();

    if (!group || !currentUser) return false;

    // El creador del grupo siempre puede administrarlo
    if (group.authorId === currentUser.id) return true;

    return this.hasGroupPermission(groupId, 'manageGroupPrivileges');
  }

  /**
   * Verifica si el usuario actual puede editar la configuración del grupo
   */
  async canEditGroupSettings(groupId: number): Promise<boolean> {
    const group = await this.getGroup(groupId);
    const currentUser = this.userService.getCurrentUser();

    if (!group || !currentUser) return false;

    if (group.authorId === currentUser.id) return true;

    return this.hasGroupPermission(groupId, 'editGroupSettings');
  }

  /**
   * Verifica si el usuario actual puede eliminar el grupo
   */
  async canDeleteGroup(groupId: number): Promise<boolean> {
    const group = await this.getGroup(groupId);
    const currentUser = this.userService.getCurrentUser();

    if (!group || !currentUser) return false;

    if (group.authorId === currentUser.id) return true;

    return this.hasGroupPermission(groupId, 'deleteGroup');
  }

  /**
   * Obtiene un resumen de permisos para un grupo
   */
  async getPermissionsSummary(groupId: number): Promise<{ granted: string[]; missing: string[] }> {
    const permissions = await this.getGroupPermissions(groupId);

    if (!permissions) {
      return {
        granted: [],
        missing: [...GROUP_PERMISSIONS_LIST].map(p => this.getPermissionLabel(p))
      };
    }

    const granted: string[] = [];
    const missing: string[] = [];

    GROUP_PERMISSIONS_LIST.forEach(permission => {
      if (permissions[permission]) {
        granted.push(this.getPermissionLabel(permission));
      } else {
        missing.push(this.getPermissionLabel(permission));
      }
    });

    return { granted, missing };
  }

  /**
   * Crea una función helper reactiva para usar en componentes
   */
  createGroupPermissionChecker(groupId: number) {
    return {
      can: (permission: string) => this.hasGroupPermission(groupId, permission),
      canAny: (permissions: string[]) => this.hasAnyGroupPermission(groupId, permissions),
      canAll: (permissions: string[]) => this.hasAllGroupPermissions(groupId, permissions),
      getAll: () => this.getGroupPermissions(groupId),
      canViewTickets: () => this.canViewTickets(groupId),
      canManage: () => this.canManageGroup(groupId),
      canEditSettings: () => this.canEditGroupSettings(groupId),
      canDelete: () => this.canDeleteGroup(groupId),
      getSummary: () => this.getPermissionsSummary(groupId)
    };
  }

  /**
   * Limpia toda la caché (útil al cerrar sesión)
   */
  clearCache(): void {
    this.groupPermissionsCache.set({});
    this.groupsCache.clear();
    this.loadingGroups.clear();
    this.loadingPermissions.clear();
  }
}