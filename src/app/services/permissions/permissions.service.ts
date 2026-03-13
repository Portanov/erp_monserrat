import { Injectable, signal, computed, inject } from '@angular/core';
import { UserService } from '../user/user.service';

export interface PagePermissions {
  create?: boolean;
  view?: boolean;
  edit?: boolean;
  delete?: boolean;
  [key: string]: boolean | undefined;
}

export interface UserPermissions {
  [userId: number]: {
    [page: string]: PagePermissions;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private userService = inject(UserService);

  private permissions = signal<UserPermissions>({
    1: {
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
      },
      'profile': {
        view: true,
        create: true,
        edit: true,
        delete: true
      },
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
        delete: false
      },
      'profile': {
        view: true,
        create: false,
        edit: false,
        delete: false
      },
    }
  });

  currentUserPermissions = computed(() => {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) return null;

    return this.permissions()[currentUser.id] || {};
  });

  constructor() { }

  hasPermission(page: string, action: string): boolean {
    const currentUser = this.userService.getCurrentUser();
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
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) return null;

    const userPermissions = this.permissions()[currentUser.id];
    return userPermissions ? userPermissions[page] || null : null;
  }

  assignPermissions(userId: number, page: string, permissions: PagePermissions): void {
    this.permissions.update(perms => {
      if (!perms[userId]) {
        perms[userId] = {};
      }

      if (!perms[userId][page]) {
        perms[userId][page] = {};
      }

      perms[userId][page] = {
        ...perms[userId][page],
        ...permissions
      };

      return { ...perms };
    });
  }

  updatePermissions(userId: number, page: string, permissions: PagePermissions): void {
    this.permissions.update(perms => {
      if (perms[userId] && perms[userId][page]) {
        perms[userId][page] = {
          ...perms[userId][page],
          ...permissions
        };
      }
      return { ...perms };
    });
  }

  removePermissions(userId: number, page: string): void {
    this.permissions.update(perms => {
      if (perms[userId]) {
        delete perms[userId][page];
      }
      return { ...perms };
    });
  }

  getUserPermissions(userId: number): { [page: string]: PagePermissions } | null {
    return this.permissions()[userId] || null;
  }

  getAllUsersWithPermissions(): number[] {
    return Object.keys(this.permissions()).map(key => Number(key));
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

  copyPermissions(fromUserId: number, toUserId: number): void {
    const sourcePermissions = this.permissions()[fromUserId];
    if (!sourcePermissions) return;

    this.permissions.update(perms => {
      perms[toUserId] = JSON.parse(JSON.stringify(sourcePermissions));
      return { ...perms };
    });
  }

  initializeUserPermissions(userId: number, defaultPermissions?: { [page: string]: PagePermissions }): void {
    const defaultPerms = defaultPermissions || {
      'group': {
        view: false,
        create: false,
        edit: false,
        delete: false
      },
      'users': {
        view: false,
        create: false,
        edit: false,
        delete: false
      },
      'profile': {
        view: false,
        create: false,
        edit: false,
        delete: false
      },
    };

    this.permissions.update(perms => {
      perms[userId] = defaultPerms;
      return { ...perms };
    });
  }

  removeUser(userId: number): void {
    this.permissions.update(perms => {
      delete perms[userId];
      return { ...perms };
    });
  }
}
