export interface SystemPermission {
    userId: number;
    page: string;
    action: string;
    active: boolean;
}

export type SystemPages = 'group' | 'users' | 'tickets';
export type SystemActions = 'view' | 'create' | 'edit' | 'delete' | 'editState';

export interface SystemPermissionsMap {
    [page: string]: {
        [action: string]: boolean;
    };
}

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

export interface AssignSystemPermissionDto {
    userId: number;
    page: string;
    action: string;
    active: boolean;
}

export interface AssignGroupPermissionDto {
    userId: number;
    groupId: number;
    action: string;
    active: boolean;
}

export const GROUP_PERMISSIONS_LIST: (keyof GroupPermissions)[] = [
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

export const GROUP_PERMISSIONS_LABELS: Record<keyof GroupPermissions, string> = {
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