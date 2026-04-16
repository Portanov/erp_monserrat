/*import { Injectable, inject, signal, computed } from '@angular/core';
import { User } from '../../models/user/user.model';
import { UserService } from '../user/user.service';
import { GroupService } from '../group/group.service';
import { GroupData } from '../../models/groups/groups.model';

export type TicketStatus = 'pending' | 'in-progress' | 'review' | 'done' | 'blocked';
export type Priority = 'alta' | 'media' | 'baja' | 'urgente' | 'crítica' | 'normal' | 'opcional';

export interface HistoryEntry {
  id: string;
  userId: number;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: Date;
}

export interface Comment {
  id: string;
  userId: number;
  content: string;
  createdAt: Date;
}

export interface Ticket {
  id: string;
  title: string;
  status: TicketStatus;
  description: string;
  assignedToId: number | null;
  createdById: number;
  priority: Priority;
  createdAt: Date;
  dueDate: Date | null;
  comments: Comment[];
  history: HistoryEntry[];
  groupId: number;
}

@Injectable({
  providedIn: 'root',
})
export class TicketsServiceOld {
  private userService = inject(UserService);
  private groupService = inject(GroupService);

  private tickets = signal<Ticket[]>([]);
  private currentGroup = signal<GroupData | null>(null);

  // Caché de usuarios para evitar múltiples peticiones
  private usersCache: Map<number, User> = new Map();
  private loadingUsers: Set<number> = new Set();

  currentGroupTickets = computed(() => {
    const group = this.currentGroup();
    const allTickets = this.tickets();
    return group ? allTickets.filter(t => t.groupId === group.id) : [];
  });

  constructor() {
    this.loadMockData();
  }

  private loadMockData() {
    const tickets: Ticket[] = [
      {
        id: 'TK-001',
        title: 'Error en el login',
        description: 'Los usuarios no pueden iniciar sesión en el sistema',
        status: 'in-progress',
        assignedToId: 13,
        createdById: 7,
        priority: 'urgente',
        createdAt: new Date('2024-03-10'),
        dueDate: new Date('2024-03-15'),
        groupId: 1,
        comments: [
          {
            id: 'c1',
            userId: 13,
            content: 'Ya estoy revisando el problema',
            createdAt: new Date('2024-03-10T10:30:00')
          }
        ],
        history: [
          {
            id: 'h1',
            userId: 7,
            action: 'creación',
            timestamp: new Date('2024-03-10T10:00:00')
          }
        ]
      },
      {
        id: 'TK-002',
        title: 'Implementar exportación PDF',
        description: 'Agregar funcionalidad para exportar reportes a PDF',
        status: 'pending',
        assignedToId: null,
        createdById: 7,
        priority: 'media',
        createdAt: new Date('2024-03-11'),
        dueDate: new Date('2024-03-20'),
        groupId: 2,
        comments: [],
        history: []
      },
      {
        id: 'TK-003',
        title: 'Problemas de rendimiento',
        description: 'Las consultas son muy lentas en el módulo de reportes',
        status: 'review',
        assignedToId: 13,
        createdById: 7,
        priority: 'alta',
        createdAt: new Date('2024-03-09'),
        dueDate: new Date('2024-03-14'),
        groupId: 1,
        comments: [],
        history: []
      },
      {
        id: 'TK-004',
        title: 'Actualizar documentación',
        description: 'Actualizar el manual de usuario con nuevas funcionalidades',
        status: 'review',
        assignedToId: 13,
        createdById: 7,
        priority: 'baja',
        createdAt: new Date('2024-03-08'),
        dueDate: new Date('2024-03-25'),
        groupId: 3,
        comments: [],
        history: []
      }
    ];

    this.tickets.set(tickets);

    // 🔥 MODIFICADO: Usar getById en lugar de getAll
    this.loadCurrentGroupFromService();
  }

  // 🔥 NUEVO: Cargar grupo actual desde el servicio
  private async loadCurrentGroupFromService() {
    if (this.currentGroup()?.id) {
      const group = await this.groupService.getById(this.currentGroup()!.id);
      if (group) {
        this.currentGroup.set(group);
      }
    } else {
      const groups = await this.groupService.getAll();
      if (groups.length > 0) {
        this.currentGroup.set(groups[0]);
      }
    }
  }

  // 🔥 MODIFICADO: setCurrentGroup ahora es async
  async setCurrentGroup(groupId: number) {
    const group = await this.groupService.getById(groupId);
    this.currentGroup.set(group || null);
  }

  getCurrentGroup(): GroupData | null {
    return this.currentGroup();
  }

  getAllTickets(): Ticket[] {
    return this.tickets();
  }

  getTicketById(ticketId: string): Ticket | undefined {
    return this.tickets().find(t => t.id === ticketId);
  }

  getUserTickets(userId: number): Ticket[] {
    return this.tickets().filter(t => t.assignedToId === userId || t.createdById === userId);
  }

  getAssignedTickets(userId: number): Ticket[] {
    return this.tickets().filter(t => t.assignedToId === userId);
  }

  getCreatedTickets(userId: number): Ticket[] {
    return this.tickets().filter(t => t.createdById === userId);
  }

  getTicketsByGroup(groupId: number): Ticket[] {
    return this.tickets().filter(t => t.groupId === groupId);
  }

  async createTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) throw new Error('Usuario no autenticado');

    const currentGroup = this.currentGroup();
    if (!currentGroup) throw new Error('No hay grupo seleccionado');

    const tickets = this.tickets();
    const lastId = tickets.length > 0
      ? Math.max(...tickets.map(t => parseInt(t.id.split('-')[1])))
      : 0;
    const newId = `TK-${String(lastId + 1).padStart(3, '0')}`;

    const newTicket: Ticket = {
      id: newId,
      title: ticketData.title || 'Sin título',
      description: ticketData.description || '',
      status: 'pending',
      assignedToId: ticketData.assignedToId || null,
      createdById: currentUser.id,
      priority: ticketData.priority || 'media',
      createdAt: new Date(),
      dueDate: ticketData.dueDate || null,
      groupId: currentGroup.id,
      comments: [],
      history: [{
        id: `hist-${Date.now()}`,
        userId: currentUser.id,
        action: 'Ticket creado',
        timestamp: new Date()
      }]
    };

    this.tickets.update(tickets => [...tickets, newTicket]);

    return newTicket;
  }

  async updateTicket(updatedTicket: Ticket): Promise<Ticket> {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) throw new Error('Usuario no autenticado');

    const index = this.tickets().findIndex(t => t.id === updatedTicket.id);
    if (index === -1) throw new Error('Ticket no encontrado');

    const oldTicket = this.tickets()[index];

    const ticketWithHistory = {
      ...updatedTicket,
      history: [...oldTicket.history]
    };

    const changes = await this.getChanges(oldTicket, updatedTicket, currentUser.id);
    changes.forEach(change => {
      ticketWithHistory.history.push({
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUser.id,
        action: 'actualización',
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        timestamp: new Date()
      });
    });

    this.tickets.update(tickets => {
      const newTickets = [...tickets];
      newTickets[index] = ticketWithHistory;
      return newTickets;
    });

    return ticketWithHistory;
  }

  private async getChanges(oldTicket: Ticket, newTicket: Ticket, currentUserId: number): Promise<{ field: string; oldValue: string; newValue: string }[]> {
    const changes: { field: string; oldValue: string; newValue: string }[] = [];

    if (oldTicket.status !== newTicket.status) {
      changes.push({
        field: 'estado',
        oldValue: this.getStatusLabel(oldTicket.status),
        newValue: this.getStatusLabel(newTicket.status)
      });
    }

    if (oldTicket.assignedToId !== newTicket.assignedToId) {
      let oldUserName = 'Sin asignar';
      let newUserName = 'Sin asignar';

      if (oldTicket.assignedToId) {
        const oldUser = await this.getUserById(oldTicket.assignedToId);
        oldUserName = oldUser?.fullName || 'Sin asignar';
      }

      if (newTicket.assignedToId) {
        const newUser = await this.getUserById(newTicket.assignedToId);
        newUserName = newUser?.fullName || 'Sin asignar';
      }

      changes.push({
        field: 'asignado',
        oldValue: oldUserName,
        newValue: newUserName
      });
    }

    if (oldTicket.priority !== newTicket.priority) {
      changes.push({
        field: 'prioridad',
        oldValue: this.getPriorityLabel(oldTicket.priority),
        newValue: this.getPriorityLabel(newTicket.priority)
      });
    }

    return changes;
  }

  // 🔥 MODIFICADO: addComment ahora es async
  async addComment(ticketId: string, content: string): Promise<Comment> {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) throw new Error('Usuario no autenticado');

    const ticket = this.getTicketById(ticketId);
    if (!ticket) throw new Error('Ticket no encontrado');

    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      content,
      createdAt: new Date()
    };

    const updatedTicket = {
      ...ticket,
      comments: [...ticket.comments, newComment]
    };

    await this.updateTicket(updatedTicket);
    return newComment;
  }

  // 🔥 MODIFICADO: changeTicketStatus ahora es async
  async changeTicketStatus(ticketId: string, newStatus: TicketStatus): Promise<Ticket> {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) throw new Error('Ticket no encontrado');

    const updatedTicket = { ...ticket, status: newStatus };
    return this.updateTicket(updatedTicket);
  }

  async deleteTicket(ticketId: string): Promise<boolean> {
    const index = this.tickets().findIndex(t => t.id === ticketId);
    if (index === -1) return false;

    this.tickets.update(tickets => tickets.filter((_, i) => i !== index));

    return true;
  }

  async getUserById(userId: number | null): Promise<User | undefined> {
    if (!userId) return undefined;

    if (this.usersCache.has(userId)) {
      return this.usersCache.get(userId);
    }

    if (this.loadingUsers.has(userId)) {
      let retries = 0;
      while (this.loadingUsers.has(userId) && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      return this.usersCache.get(userId);
    }

    this.loadingUsers.add(userId);
    try {
      const user = await this.userService.getById(userId);
      if (user) {
        this.usersCache.set(userId, user);
      }
      return user || undefined;
    } finally {
      this.loadingUsers.delete(userId);
    }
  }

  async getGroupById(groupId: number): Promise<GroupData | undefined> {
    const group = await this.groupService.getById(groupId);
    return group || undefined;
  }

  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      'pending': 'Pendiente',
      'in-progress': 'En Progreso',
      'review': 'Revisión',
      'done': 'Hecho',
      'blocked': 'Bloqueado'
    };
    return labels[status];
  }

  getPriorityLabel(priority: Priority): string {
    const labels: Record<Priority, string> = {
      'alta': 'Alta',
      'media': 'Media',
      'baja': 'Baja',
      'urgente': 'Urgente',
      'crítica': 'Crítica',
      'normal': 'Normal',
      'opcional': 'Opcional'
    };
    return labels[priority];
  }

  getPrioritySeverity(priority: Priority): string {
    const severities: Record<Priority, string> = {
      'alta': 'danger',
      'urgente': 'danger',
      'crítica': 'danger',
      'media': 'warning',
      'normal': 'info',
      'baja': 'success',
      'opcional': 'secondary'
    };
    return severities[priority];
  }

  getStatusSeverity(status: TicketStatus): string {
    const severities: Record<TicketStatus, string> = {
      'pending': 'warning',
      'in-progress': 'info',
      'review': 'help',
      'done': 'success',
      'blocked': 'danger'
    };
    return severities[status];
  }

  getStatusSeverityColors(status: TicketStatus): string {
    const severities: Record<TicketStatus, string> = {
      'pending': 'info',
      'in-progress': 'warn',
      'review': 'secondary',
      'done': 'success',
      'blocked': 'danger'
    };
    return severities[status];
  }

  getGroupStats() {
    const tickets = this.currentGroupTickets();

    return {
      total: tickets.length,
      byStatus: {
        pending: tickets.filter(t => t.status === 'pending').length,
        'in-progress': tickets.filter(t => t.status === 'in-progress').length,
        review: tickets.filter(t => t.status === 'review').length,
        done: tickets.filter(t => t.status === 'done').length,
        blocked: tickets.filter(t => t.status === 'blocked').length
      },
      byPriority: {
        alta: tickets.filter(t => t.priority === 'alta').length,
        urgente: tickets.filter(t => t.priority === 'urgente').length,
        crítica: tickets.filter(t => t.priority === 'crítica').length,
        media: tickets.filter(t => t.priority === 'media').length,
        normal: tickets.filter(t => t.priority === 'normal').length,
        baja: tickets.filter(t => t.priority === 'baja').length,
        opcional: tickets.filter(t => t.priority === 'opcional').length
      },
      overdue: tickets.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length
    };
  }

  canEditTicket(ticket: Ticket, userId: number): boolean {
    return ticket.createdById === userId;
  }

  canChangeStatus(ticket: Ticket, userId: number): boolean {
    return ticket.assignedToId === userId || ticket.createdById === userId;
  }

  canComment(ticket: Ticket, userId: number): boolean {
    return ticket.assignedToId === userId || ticket.createdById === userId;
  }

  async getCurrentGroupUsers(): Promise<User[]> {
    const currentGroup = this.currentGroup();
    if (!currentGroup) return [];

    const allUsers = await this.userService.getAll();
    return allUsers.filter(user => currentGroup.members.includes(user.id));
  }
}*/