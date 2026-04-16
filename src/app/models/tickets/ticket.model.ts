export type TicketStatus = 'pending' | 'in-progress' | 'review' | 'done' | 'blocked';
export type Priority = 'alta' | 'media' | 'baja' | 'urgente' | 'crítica' | 'normal' | 'opcional';

export interface Comment {
    id: string;
    ticketId: number;
    userId: number;
    content: string;
    createdAt: string;
}

export interface TicketHistory {
    id: string;
    ticketId: number;
    userId: number;
    action: string;
    timestamp: string;
}

export interface Ticket {
    id: number;
    title: string;
    description: string;
    status: TicketStatus;
    assignedToId: number | null;
    createdById: number;
    priority: Priority;
    createdAt: string;
    dueDate: string | null;
    groupId: number;
    comments: Comment[];
    history: TicketHistory[];
}

export interface CreateTicketDto {
    title: string;
    description?: string;
    assignedToId?: number | null;
    priority?: Priority;
    dueDate?: string | null;
}

export interface UpdateTicketDto {
    title?: string;
    description?: string;
    status?: TicketStatus;
    assignedToId?: number | null;
    priority?: Priority;
    dueDate?: string | null;
}

export interface ChangeStatusDto {
    status: TicketStatus;
}

export interface AddCommentDto {
    content: string;
}

export interface GroupStatsDto {
    total: number;
    byStatus: Record<TicketStatus, number>;
    byPriority: Record<Priority, number>;
    overdue: number;
}