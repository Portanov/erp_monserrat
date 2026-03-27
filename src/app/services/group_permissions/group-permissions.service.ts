import { Injectable, signal, inject } from '@angular/core';
import { UserService } from '../user/user.service';
import { GroupService, GroupData } from '../group/group.service';

export interface GroupPermissions {
  createTicket: boolean;
  editTicket: boolean;
  deleteTicket: boolean;
  viewTicket: boolean;
  addMember: boolean;
  removeMember: boolean;
  editMemberRole: boolean;
  viewMembers: boolean;
  editGroupSettings: boolean;
  deleteGroup: boolean;
  manageGroupPrivileges: boolean;
}

export interface UserGroupPermissions {
  [userId: number]: {
    [groupId: string]: GroupPermissions;
  };
}

const GROUP_PERMISSIONS_LIST: string[] = [
  'createTicket',
  'editTicket',
  'deleteTicket',
  'viewTicket',
  'addMember',
  'removeMember',
  'editMemberRole',
  'viewMembers',
  'editGroupSettings',
  'deleteGroup',
  'manageGroupPrivileges'
];

const GROUP_PERMISSIONS_LABELS: { [key: string]: string } = {
  createTicket: 'Crear Ticket',
  editTicket: 'Editar Ticket',
  deleteTicket: 'Eliminar Ticket',
  viewTicket: 'Ver Tickets',
  addMember: 'Añadir Miembro',
  removeMember: 'Eliminar Miembro',
  editMemberRole: 'Editar Rol de Miembro',
  viewMembers: 'Ver Miembros',
  editGroupSettings: 'Editar Configuración del Grupo',
  deleteGroup: 'Eliminar Grupo',
  manageGroupPrivileges: 'Gestionar Privilegios'
};

@Injectable({
  providedIn: 'root'
})
export class GroupPermissionService {
  private userService = inject(UserService);
  private groupService = inject(GroupService);

  private groupPermissions = signal<UserGroupPermissions>({
    1: { // Usuario admin
      '1': {
        createTicket: true,
        editTicket: true,
        deleteTicket: true,
        viewTicket: true,
        addMember: true,
        removeMember: true,
        editMemberRole: true,
        viewMembers: true,
        editGroupSettings: true,
        deleteGroup: true,
        manageGroupPrivileges: true
      },
      '2': {
        createTicket: true,
        editTicket: true,
        deleteTicket: true,
        viewTicket: true,
        addMember: true,
        removeMember: true,
        editMemberRole: true,
        viewMembers: true,
        editGroupSettings: true,
        deleteGroup: true,
        manageGroupPrivileges: true
      },
      '3': {
        createTicket: true,
        editTicket: true,
        deleteTicket: true,
        viewTicket: true,
        addMember: true,
        removeMember: true,
        editMemberRole: true,
        viewMembers: true,
        editGroupSettings: true,
        deleteGroup: true,
        manageGroupPrivileges: true
      }
    },
    2: { // Usuario normal
      '1': {
        createTicket: true,
        editTicket: true,
        deleteTicket: false,
        viewTicket: true,
        addMember: false,
        removeMember: false,
        editMemberRole: false,
        viewMembers: true,
        editGroupSettings: false,
        deleteGroup: false,
        manageGroupPrivileges: false
      },
      '2': {
        createTicket: false,
        editTicket: false,
        deleteTicket: false,
        viewTicket: true,
        addMember: false,
        removeMember: false,
        editMemberRole: false,
        viewMembers: true,
        editGroupSettings: false,
        deleteGroup: false,
        manageGroupPrivileges: false
      }
    },
    3: { // Usuario viewer
      '1': {
        createTicket: false,
        editTicket: false,
        deleteTicket: false,
        viewTicket: true,
        addMember: false,
        removeMember: false,
        editMemberRole: false,
        viewMembers: true,
        editGroupSettings: false,
        deleteGroup: false,
        manageGroupPrivileges: false
      }
    }
  });

  getAvailablePermissions(): string[] {
    return [...GROUP_PERMISSIONS_LIST];
  }

  getPermissionLabel(permission: string): string {
    return GROUP_PERMISSIONS_LABELS[permission] || permission;
  }

  /**
   * Verifica si el usuario actual tiene un permiso específico en un grupo
   * Los miembros siempre tienen viewTicket = true
   */
  hasGroupPermission(groupId: number, permission: string): boolean {
    const currentUser = this.userService.currentUser();
    if (!currentUser) return false;
    const group = this.groupService.getAll().find(g => g.id === groupId);
    const isMember = group?.members.includes(currentUser.id) || false;
    if (isMember && permission === 'viewTicket') {
      return true;
    }
    const userPerms = this.groupPermissions()[currentUser.id];
    if (!userPerms) return false;
    const groupPerms = userPerms[groupId.toString()];
    if (!groupPerms) return false;
    return groupPerms[permission as keyof GroupPermissions] || false;
  }

  /**
   * Verifica si el usuario actual tiene todos los permisos especificados
   */
  hasAllGroupPermissions(groupId: number, permissions: string[]): boolean {
    return permissions.every(permission => this.hasGroupPermission(groupId, permission));
  }

  /**
   * Verifica si el usuario actual tiene al menos uno de los permisos especificados
   */
  hasAnyGroupPermission(groupId: number, permissions: string[]): boolean {
    return permissions.some(permission => this.hasGroupPermission(groupId, permission));
  }

  /**
   * Obtiene todos los permisos del usuario actual en un grupo
   */
  getGroupPermissions(groupId: number): GroupPermissions | null {
    const currentUser = this.userService.currentUser();
    if (!currentUser) return null;
    const userPerms = this.groupPermissions()[currentUser.id];
    if (!userPerms) return null;
    const groupPerms = userPerms[groupId.toString()];
    if (!groupPerms) return null;
    const group = this.groupService.getAll().find(g => g.id === groupId);
    const isMember = group?.members.includes(currentUser.id) || false;
    if (isMember && groupPerms) {
      return { ...groupPerms, viewTicket: true };
    }
    return groupPerms;
  }

  /**
   * Obtiene los permisos de un usuario específico en un grupo
   */
  getUserGroupPermissions(userId: number, groupId: number): GroupPermissions | null {
    const userPerms = this.groupPermissions()[userId];
    if (!userPerms) return null;
    const groupPerms = userPerms[groupId.toString()];
    if (!groupPerms) return null;
    const group = this.groupService.getAll().find(g => g.id === groupId);
    const isMember = group?.members.includes(userId) || false;
    if (isMember && groupPerms) {
      return { ...groupPerms, viewTicket: true };
    }

    return groupPerms;
  }

  /**
   * Asigna permisos a un usuario en un grupo
   */
  assignGroupPermissions(userId: number, groupId: number, permissions: Partial<GroupPermissions>): void {
    this.groupPermissions.update(perms => {
      const newPerms = { ...perms };

      if (!newPerms[userId]) {
        newPerms[userId] = {};
      }

      const groupIdStr = groupId.toString();
      newPerms[userId][groupIdStr] = {
        ...newPerms[userId][groupIdStr],
        ...permissions
      } as GroupPermissions;

      return newPerms;
    });
  }

  /**
   * Inicializa permisos por defecto para un usuario en un grupo
   * Los miembros siempre tienen viewTicket = true
   */
  initializeGroupPermissions(userId: number, groupId: number, isMember: boolean = true): void {
    const defaultPermissions: Partial<GroupPermissions> = {};

    GROUP_PERMISSIONS_LIST.forEach(permission => {
      if (isMember && permission === 'viewTicket') {
        defaultPermissions[permission as keyof GroupPermissions] = true;
      } else if (permission === 'viewMembers' && isMember) {
        defaultPermissions[permission as keyof GroupPermissions] = true;
      } else {
        defaultPermissions[permission as keyof GroupPermissions] = false;
      }
    });

    this.assignGroupPermissions(userId, groupId, defaultPermissions);
  }

  /**
   * Inicializa permisos para el creador del grupo (todos true)
   */
  initializeOwnerPermissions(userId: number, groupId: number): void {
    const ownerPermissions: Partial<GroupPermissions> = {};

    GROUP_PERMISSIONS_LIST.forEach(permission => {
      ownerPermissions[permission as keyof GroupPermissions] = true;
    });

    this.assignGroupPermissions(userId, groupId, ownerPermissions);
  }

  /**
   * Inicializa permisos para un miembro nuevo
   */
  initializeMemberPermissions(userId: number, groupId: number): void {
    const memberPermissions: Partial<GroupPermissions> = {
      viewTicket: true,
      viewMembers: true,
      createTicket: false,
      editTicket: false,
      deleteTicket: false,
      addMember: false,
      removeMember: false,
      editMemberRole: false,
      editGroupSettings: false,
      deleteGroup: false,
      manageGroupPrivileges: false
    };

    this.assignGroupPermissions(userId, groupId, memberPermissions);
  }

  /**
   * Elimina todos los permisos de un usuario en un grupo
   */
  removeUserGroupPermissions(userId: number, groupId: number): void {
    this.groupPermissions.update(perms => {
      const newPerms = { ...perms };
      if (newPerms[userId]) {
        delete newPerms[userId][groupId.toString()];
        if (Object.keys(newPerms[userId]).length === 0) {
          delete newPerms[userId];
        }
      }
      return newPerms;
    });
  }

  /**
   * Obtiene todos los usuarios que tienen permisos en un grupo
   */
  getUsersWithPermissions(groupId: number): { userId: number; permissions: GroupPermissions }[] {
    const result: { userId: number; permissions: GroupPermissions }[] = [];
    const allPermissions = this.groupPermissions();

    Object.keys(allPermissions).forEach(userId => {
      const userIdNum = parseInt(userId);
      const groupPerms = allPermissions[userIdNum]?.[groupId.toString()];
      if (groupPerms) {
        result.push({ userId: userIdNum, permissions: groupPerms });
      }
    });

    return result;
  }

  /**
   * Obtiene todos los grupos a los que un usuario tiene acceso
   */
  getUserGroups(userId: number): { group: GroupData; permissions: GroupPermissions }[] {
    const result: { group: GroupData; permissions: GroupPermissions }[] = [];
    const userPerms = this.groupPermissions()[userId];

    if (userPerms) {
      Object.keys(userPerms).forEach(groupId => {
        const groupIdNum = parseInt(groupId);
        const group = this.groupService.getAll().find(g => g.id === groupIdNum);
        if (group) {
          result.push({
            group,
            permissions: userPerms[groupId]
          });
        }
      });
    }

    return result;
  }

  /**
   * Verifica si el usuario puede ver tickets (siempre true para miembros)
   */
  canViewTickets(groupId: number): boolean {
    const currentUser = this.userService.currentUser();
    if (!currentUser) return false;

    const group = this.groupService.getAll().find(g => g.id === groupId);
    const isMember = group?.members.includes(currentUser.id) || false;

    return isMember || this.hasGroupPermission(groupId, 'viewTicket');
  }

  /**
   * Verifica si el usuario actual puede administrar un grupo
   */
  canManageGroup(groupId: number): boolean {
    const group = this.groupService.getAll().find(g => g.id === groupId);
    const currentUser = this.userService.currentUser();

    if (!group || !currentUser) return false;

    return group.authorId === currentUser.id ||
      this.hasGroupPermission(groupId, 'manageGroupPrivileges');
  }

  /**
   * Verifica si el usuario actual puede editar la configuración del grupo
   */
  canEditGroupSettings(groupId: number): boolean {
    const group = this.groupService.getAll().find(g => g.id === groupId);
    const currentUser = this.userService.currentUser();

    if (!group || !currentUser) return false;

    return group.authorId === currentUser.id ||
      this.hasGroupPermission(groupId, 'editGroupSettings');
  }

  /**
   * Verifica si el usuario actual puede eliminar el grupo
   */
  canDeleteGroup(groupId: number): boolean {
    const group = this.groupService.getAll().find(g => g.id === groupId);
    const currentUser = this.userService.currentUser();

    if (!group || !currentUser) return false;

    return group.authorId === currentUser.id ||
      this.hasGroupPermission(groupId, 'deleteGroup');
  }

  /**
   * Obtiene un resumen de permisos para un grupo
   */
  getPermissionsSummary(groupId: number): { granted: string[]; missing: string[] } {
    const permissions = this.getGroupPermissions(groupId);
    if (!permissions) {
      return {
        granted: [],
        missing: [...GROUP_PERMISSIONS_LIST].map(p => this.getPermissionLabel(p))
      };
    }

    const granted: string[] = [];
    const missing: string[] = [];

    GROUP_PERMISSIONS_LIST.forEach(permission => {
      if (permissions[permission as keyof GroupPermissions]) {
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
}
