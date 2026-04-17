/*import { Injectable, signal, computed, inject } from '@angular/core';
import { UserService } from '../user/user.service';

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

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
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
    }
  ]);

  private permissions = signal<UserPermissions>({
    7: {
      'group': {
        view: true,
        create: true,
        edit: true,
        delete: true
      },
      'users': {
        view: true,
        create: true,
        edit: true,
        delete: true,
        editState: true,
      }
    },
    2: {
      'group': {
        view: true,
        create: false,
        edit: false,
        delete: false
      },
      'users': {
        view: false,
        create: false,
        edit: false,
        delete: false,
        editState: false
      }
    },
    3: {
      'group': {
        view: true,
        create: false,
        edit: false,
        delete: false
      },
      'users': {
        view: false,
        create: false,
        edit: false,
        delete: false,
        editState: false
      }
    },
    13: {
      'group': {
        view: true,
        create: false,
        edit: false,
        delete: false
      },
      'users': {
        view: false,
        create: false,
        edit: false,
        delete: false,
        editState: false
      }
    }
  });

  currentUserPermissions = computed(() => {
    const currentUser = this.userService.currentUser();
    if (!currentUser) return null;
    return this.permissions()[currentUser.id] || {};
  });

  getPagesConfig(): PageConfig[] {
    return this.pagesConfig();
  }

  getPagePermissionsConfig(pageName: string): PageConfig | undefined {
    return this.pagesConfig().find(p => p.name === pageName);
  }

  hasPermission(page: string, action: string): boolean {
    const currentUser = this.userService.currentUser(); // Usar el signal
    if (!currentUser) return false;

    const userPermissions = this.permissions()[currentUser.id];
    if (!userPermissions || !userPermissions[page]) {
      return false;
    }

    return userPermissions[page][action] || false;
  }

  hasPermissions(page: string, actions: string[]): boolean {
    return actions.every(action => this.hasPermission(page, action));
  }

  hasAnyPermission(page: string, actions: string[]): boolean {
    return actions.some(action => this.hasPermission(page, action));
  }

  getPagePermissions(page: string): PagePermissions | null {
    const currentUser = this.userService.currentUser(); // Usar el signal
    if (!currentUser) return null;

    const userPermissions = this.permissions()[currentUser.id];
    return userPermissions ? userPermissions[page] || null : null;
  }

  assignPermissions(userId: number, page: string, permissions: PagePermissions): void {
    this.permissions.update(perms => {
      const newPerms = { ...perms };
      if (!newPerms[userId]) {
        newPerms[userId] = {};
      }

      newPerms[userId][page] = {
        ...newPerms[userId][page],
        ...permissions
      };

      return newPerms;
    });
  }

  getUserPermissions(userId: number): { [page: string]: PagePermissions } | null {
    return this.permissions()[userId] || null;
  }

  getUserPages(userId: number): string[] {
    const userPermissions = this.permissions()[userId];
    return userPermissions ? Object.keys(userPermissions) : [];
  }

  checkUserPermission(userId: number, page: string, action: string): boolean {
    const userPermissions = this.permissions()[userId];
    if (!userPermissions || !userPermissions[page]) {
      return false;
    }
    return userPermissions[page][action] || false;
  }

  canAccessPage(page: string): boolean {
    return this.hasPermission(page, 'view');
  }

  initializeUserPermissions(userId: number): void {
    const defaultPermissions: { [page: string]: PagePermissions } = {};

    this.pagesConfig().forEach(pageConfig => {
      const pagePermissions: PagePermissions = {};
      pageConfig.permissions.forEach(permission => {
        pagePermissions[permission] = false;
      });
      defaultPermissions[pageConfig.name] = pagePermissions;
    });

    this.permissions.update(perms => {
      const newPerms = { ...perms };
      newPerms[userId] = defaultPermissions;
      return newPerms;
    });
  }

  removeUser(userId: number): void {
    this.permissions.update(perms => {
      const newPerms = { ...perms };
      delete newPerms[userId];
      return newPerms;
    });
  }

  isValidPermission(page: string, action: string): boolean {
    const pageConfig = this.getPagePermissionsConfig(page);
    return pageConfig ? pageConfig.permissions.includes(action) : false;
  }

  getAvailablePermissions(page: string): string[] {
    const pageConfig = this.getPagePermissionsConfig(page);
    return pageConfig ? pageConfig.permissions : [];
  }
}*/
