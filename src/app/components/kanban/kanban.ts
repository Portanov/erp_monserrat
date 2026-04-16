import { Component, OnInit, inject, Input, OnChanges, SimpleChanges, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from 'primeng/dragdrop';
import { PanelModule } from 'primeng/panel';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { TicketsService } from '../../services/tickets/tickets.service';
import { Ticket, TicketStatus, Priority } from '../../models/tickets/ticket.model';
import { AlertService } from '../../services/alerts/alert.service';
import { UserService } from '../../services/user/user.service';
import { User } from '../../models/user/user.model';
import { TicketDialogComponent } from '../ticket-dialog/ticket-dialog';
import { CommentDialogComponent } from '../comment-dialog/comment-dialog';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    PanelModule,
    CardModule,
    BadgeModule,
    TicketDialogComponent,
    CommentDialogComponent
  ],
  templateUrl: './kanban.html',
  styleUrls: ['./kanban.css'],
})
export class Kanban implements OnInit, OnChanges, OnDestroy {
  private ticketService = inject(TicketsService);
  private alertService = inject(AlertService);
  private userService = inject(UserService);

  @Input() groupId: number | null = null;
  @Output() ticketMoved = new EventEmitter<void>();


  draggedTicket: Ticket | null = null;
  currentUser: User | null = null;
  showTicketDialog: boolean = false;
  showCommentDialog: boolean = false;
  selectedTicket: Ticket | null = null;
  loading: boolean = false;


  private ticketsCache: Map<string, Ticket[]> = new Map();
  private userCache: Map<number, User> = new Map();
  private cacheTimestamps: Map<string, number> = new Map();
  private CACHE_DURATION_MS = 60000;
  private isRefreshing = false;

  ticketsByStatus: Record<TicketStatus, Ticket[]> = {
    'pending': [],
    'in-progress': [],
    'review': [],
    'done': [],
    'blocked': []
  };

  statusConfig = [
    { status: 'pending' as TicketStatus, label: 'Pendiente', color: 'blue', icon: 'pi-clock', border: 'border-blue-400', text: 'text-blue-400' },
    { status: 'in-progress' as TicketStatus, label: 'En Progreso', color: 'yellow', icon: 'pi-spinner', border: 'border-yellow-500', text: 'text-yellow-500' },
    { status: 'review' as TicketStatus, label: 'Revisión', color: 'purple', icon: 'pi-search', border: 'border-purple-500', text: 'text-purple-500' },
    { status: 'done' as TicketStatus, label: 'Hecho', color: 'green', icon: 'pi-check', border: 'border-green-500', text: 'text-green-500' },
    { status: 'blocked' as TicketStatus, label: 'Bloqueado', color: 'red', icon: 'pi-ban', border: 'border-red-500', text: 'text-red-500' }
  ];

  ngOnInit() {
    this.currentUser = this.userService.getCurrentUser();
    console.log('Usuario actual:', this.currentUser);
    this.loadTickets();
  }

  ngOnDestroy() {

    this.ticketsCache.clear();
    this.cacheTimestamps.clear();
  }

  async refresh() {
    console.log('Refrescando kanban manualmente...');
    this.invalidateTicketsCache();
    await this.loadTickets();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['groupId']) {
      console.log('groupId cambiado en kanban, recargando...');
      this.loadTickets();
    }
  }

  private async loadTickets() {
    if (this.isRefreshing) return;

    Object.keys(this.ticketsByStatus).forEach(key => {
      this.ticketsByStatus[key as TicketStatus] = [];
    });

    this.loading = true;
    this.isRefreshing = true;

    try {
      let tickets: Ticket[] = [];
      const cacheKey = this.groupId ? `group_${this.groupId}` : 'all_tickets';


      if (this.isCacheValid(cacheKey)) {
        tickets = this.ticketsCache.get(cacheKey) || [];
        console.log(`✓ Tickets cargados desde caché (${cacheKey}):`, tickets.length);
      } else {

        if (this.groupId) {
          tickets = await firstValueFrom(this.ticketService.getTicketsByGroup(this.groupId));
          console.log(`Tickets cargados del servidor para el grupo ${this.groupId}:`, tickets.length);
        } else {
          tickets = await firstValueFrom(this.ticketService.getAllTickets());
          console.log('Todos los tickets cargados del servidor:', tickets.length);
        }


        this.ticketsCache.set(cacheKey, tickets);
        this.cacheTimestamps.set(cacheKey, Date.now());
      }


      const uniqueTicketsMap = new Map<number, Ticket>();
      tickets.forEach(ticket => {
        if (!uniqueTicketsMap.has(ticket.id)) {
          uniqueTicketsMap.set(ticket.id, ticket);
        }
      });

      const uniqueTickets = Array.from(uniqueTicketsMap.values());

      if (uniqueTickets.length !== tickets.length) {
        console.warn(`⚠️ Se eliminaron ${tickets.length - uniqueTickets.length} tickets duplicados`);
      }


      const statusSet = new Map<TicketStatus, Set<number>>();

      uniqueTickets.forEach(ticket => {
        if (this.ticketsByStatus[ticket.status]) {
          if (!statusSet.has(ticket.status)) {
            statusSet.set(ticket.status, new Set());
          }
          statusSet.get(ticket.status)!.add(ticket.id);
          this.ticketsByStatus[ticket.status].push(ticket);
        }
      });


      Object.keys(this.ticketsByStatus).forEach(key => {
        const status = key as TicketStatus;
        const idSet = new Set<number>();
        this.ticketsByStatus[status] = this.ticketsByStatus[status].filter(ticket => {
          if (idSet.has(ticket.id)) {
            console.warn(`🗑️ Ticket duplicado eliminado: ID ${ticket.id} en estado ${status}`);
            return false;
          }
          idSet.add(ticket.id);
          return true;
        });
      });

      this.sortTicketsByPriority();
      await this.loadUsersFromTickets();
    } catch (error) {
      console.error('Error loading tickets in kanban:', error);
      this.alertService.error('Error', 'No se pudieron cargar los tickets');
      this.invalidateTicketsCache();
    } finally {
      this.loading = false;
      this.isRefreshing = false;
    }
  }

  private isCacheValid(cacheKey: string): boolean {
    const timestamp = this.cacheTimestamps.get(cacheKey);
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_DURATION_MS;
  }

  private invalidateTicketsCache() {
    this.ticketsCache.clear();
    this.cacheTimestamps.clear();
  }

  private async loadUsersFromTickets() {
    const userIds = new Set<number>();

    Object.values(this.ticketsByStatus).forEach(tickets => {
      tickets.forEach(ticket => {
        if (ticket.assignedToId) userIds.add(ticket.assignedToId);
        if (ticket.createdById) userIds.add(ticket.createdById);
      });
    });

    const usersToLoad = Array.from(userIds).filter(id => !this.userCache.has(id));

    if (usersToLoad.length === 0) {
      console.log('✓ Todos los usuarios ya están en caché');
      return;
    }

    console.log(`Cargando ${usersToLoad.length} usuarios del servidor...`);

    for (const userId of usersToLoad) {
      try {
        const user = await this.userService.getById(userId);
        if (user) {
          this.userCache.set(userId, user);
        }
      } catch (error) {
        console.error(`Error loading user ${userId}:`, error);
      }
    }
  }

  getUserName(userId: number | null): string {
    if (!userId) return 'Sin asignar';

    const user = this.userCache.get(userId);
    if (user) {
      return user.fullName || user.username || 'Usuario';
    }

    this.userService.getById(userId)
      .then(user => {
        if (user) {
          this.userCache.set(userId, user);
        }
      })
      .catch(error => {
        console.error(`Error loading user ${userId}:`, error);
      });

    return 'Cargando...';
  }

  private sortTicketsByPriority() {
    const priorityOrder: Record<Priority, number> = {
      'crítica': 1,
      'urgente': 2,
      'alta': 3,
      'media': 4,
      'normal': 5,
      'baja': 6,
      'opcional': 7
    };

    Object.keys(this.ticketsByStatus).forEach(key => {
      const status = key as TicketStatus;
      this.ticketsByStatus[status].sort((a, b) => {
        return (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5);
      });
    });
  }

  canMoveTicket(ticket: Ticket): boolean {
    if (!this.currentUser) return false;
    return Number(ticket.assignedToId) === this.currentUser.id;
  }

  canEditTicket(ticket: Ticket): boolean {
    if (!this.currentUser) return false;
    return Number(ticket.createdById) === this.currentUser.id;
  }

  canViewComments(ticket: Ticket): boolean {
    if (!this.currentUser) return false;
    return Number(ticket.assignedToId) === this.currentUser.id || Number(ticket.createdById) === this.currentUser.id;
  }

  dragStart(ticket: Ticket) {
    if (!this.currentUser) {
      this.alertService.error('Error', 'Usuario no authenticado');
      return;
    }
    if (Number(ticket.assignedToId) === this.currentUser.id) {
      this.draggedTicket = ticket;
    } else {
      this.alertService.warn('Sin permisos', 'Solo puedes mover tickets que te están asignados');
    }
  }

  dragEnd() {
    this.draggedTicket = null;
  }

  async onDrop(status: TicketStatus) {
    if (!this.currentUser) {
      this.alertService.error('Error', 'Usuario no authenticado');
      return;
    }
    if (this.draggedTicket && this.draggedTicket.status !== status) {
      try {
        if (Number(this.draggedTicket.assignedToId) !== this.currentUser.id) {
          this.alertService.warn('Sin permisos', 'No tienes permisos para mover este ticket');
          this.draggedTicket = null;
          return;
        }

        const userId = this.currentUser.id;
        const ticketId = this.draggedTicket.id;

        await firstValueFrom(this.ticketService.changeTicketStatus(ticketId, status, userId));

        this.alertService.success(
          'Ticket movido',
          `Ticket ${ticketId} movido a ${this.getStatusLabel(status)}`
        );

        this.invalidateTicketsCache();
        await this.loadTickets();
        this.ticketMoved.emit();
      } catch (error) {
        console.error('Error moving ticket:', error);
        this.alertService.error('Error', 'Ha ocurrido un error al mover el ticket');
      } finally {
        this.draggedTicket = null;
      }
    } else {
      this.draggedTicket = null;
    }
  }

  onDragOver(event: Event) {
    event.preventDefault();
  }

  openEditTicket(ticket: Ticket) {
    if (ticket.createdById == this.currentUser?.id) {
      this.selectedTicket = ticket;
      this.showTicketDialog = true;
    } else {
      this.alertService.warn('Sin permisos', 'Solo puedes editar tickets que tú creaste');
    }
  }

  openCommentDialog(ticket: Ticket) {
    if (ticket.createdById == this.currentUser?.id || ticket.assignedToId == this.currentUser?.id) {
      this.selectedTicket = ticket;
      this.showCommentDialog = true;
    } else {
      this.alertService.warn('Sin permisos', 'No tienes permisos para ver los comentarios de este ticket');
    }
  }

  async onTicketSaved(ticket: Ticket) {
    this.invalidateTicketsCache();
    await this.loadTickets();
    this.showTicketDialog = false;
    this.selectedTicket = null;
    this.ticketMoved.emit();
  }

  async onCommentAdded(comment: any) {
    this.invalidateTicketsCache();
    await this.loadTickets();
    this.showCommentDialog = false;
    this.selectedTicket = null;
  }

  getStatusLabel(status: TicketStatus): string {
    return this.ticketService.getStatusLabel(status);
  }

  getPrioritySeverity(priority: Priority): string {
    return this.ticketService.getPrioritySeverity(priority);
  }

  isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    const dueDateTime = new Date(dueDate).getTime();
    const nowTime = new Date().getTime();
    const dueDateAtMidnight = new Date(dueDateTime);
    dueDateAtMidnight.setHours(0, 0, 0, 0);
    const todayAtMidnight = new Date(nowTime);
    todayAtMidnight.setHours(0, 0, 0, 0);
    return dueDateAtMidnight < todayAtMidnight;
  }

  getStatusColor(status: TicketStatus): string {
    const colors: Record<TicketStatus, string> = {
      'pending': 'blue',
      'in-progress': 'yellow',
      'review': 'purple',
      'done': 'green',
      'blocked': 'red'
    };
    return colors[status];
  }

  getPriorityClass(priority: Priority): string {
    const classes: Record<Priority, string> = {
      'alta': 'border border-red-600 text-red-600 bg-red-50',
      'urgente': 'border border-orange-600 text-orange-600 bg-orange-50',
      'crítica': 'border border-red-800 text-red-800 bg-red-100',
      'media': 'border border-yellow-600 text-yellow-600 bg-yellow-50',
      'normal': 'border border-blue-400 text-blue-400 bg-blue-50',
      'baja': 'border border-green-400 text-green-400 bg-green-50',
      'opcional': 'border border-gray-400 text-gray-400 bg-gray-50'
    };
    return classes[priority] || classes['normal'];
  }

  trackByTicketId(index: number, ticket: Ticket): number {
    return ticket.id;
  }
}