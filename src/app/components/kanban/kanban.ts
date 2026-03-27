import { Component, OnInit, inject, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from 'primeng/dragdrop';
import { PanelModule } from 'primeng/panel';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { TicketsService, Ticket, TicketStatus } from '../../services/tickets/tickets.service';
import { AlertService } from '../../services/alerts/alert.service';
import { UserService } from '../../services/user/user.service';
import { TicketDialogComponent } from '../ticket-dialog/ticket-dialog';
import { CommentDialogComponent } from '../comment-dialog/comment-dialog';

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
export class Kanban implements OnInit, OnChanges {
  private ticketsService = inject(TicketsService);
  private alertService = inject(AlertService);
  private userService = inject(UserService);

  @Input() groupId: number | null = null;
  @Output() ticketMoved = new EventEmitter<void>();

  draggedTicket: Ticket | null = null;
  currentUser: any = null;
  showTicketDialog: boolean = false;
  showCommentDialog: boolean = false;
  selectedTicket: Ticket | null = null;

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
    this.loadTickets();
  }

  refresh() {
    console.log('Refrescando kanban manualmente...');
    this.loadTickets();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['groupId']) {
      console.log('groupId cambiado en kanban, recargando...');
      this.loadTickets();
    }
  }

  private loadTickets() {
    Object.keys(this.ticketsByStatus).forEach(key => {
      this.ticketsByStatus[key as TicketStatus] = [];
    });

    let tickets: Ticket[] = [];

    if (this.groupId) {
      tickets = this.ticketsService.getTicketsByGroup(this.groupId);
      console.log(`Cargando tickets para el grupo ${this.groupId}:`, tickets.length);
    } else {
      tickets = this.ticketsService.currentGroupTickets();
      console.log('Cargando todos los tickets del grupo actual:', tickets.length);
    }
    tickets.forEach(ticket => {
      if (this.ticketsByStatus[ticket.status]) {
        this.ticketsByStatus[ticket.status].push(ticket);
      }
    });
    this.sortTicketsByPriority();
  }

  private sortTicketsByPriority() {
    const priorityOrder = ['crítica', 'urgente', 'alta', 'media', 'normal', 'baja', 'opcional'];

    Object.keys(this.ticketsByStatus).forEach(key => {
      const status = key as TicketStatus;
      this.ticketsByStatus[status].sort((a, b) => {
        const priorityA = priorityOrder.indexOf(a.priority);
        const priorityB = priorityOrder.indexOf(b.priority);
        return priorityA - priorityB;
      });
    });
  }

  canMoveTicket(ticket: Ticket): boolean {
    if (!this.currentUser) return false;
    return ticket.assignedToId === this.currentUser.id;
  }

  canEditTicket(ticket: Ticket): boolean {
    if (!this.currentUser) return false;
    return ticket.createdById === this.currentUser.id;
  }

  canViewComments(ticket: Ticket): boolean {
    if (!this.currentUser) return false;
    return ticket.assignedToId === this.currentUser.id || ticket.createdById === this.currentUser.id;
  }

  dragStart(ticket: Ticket) {
    if (this.canMoveTicket(ticket)) {
      this.draggedTicket = ticket;
    } else {
      this.alertService.warn('Sin permisos', 'Solo puedes mover tickets que te están asignados');
    }
  }

  dragEnd() {
    this.draggedTicket = null;
  }

  onDrop(status: TicketStatus) {
    if (this.draggedTicket && this.draggedTicket.status !== status) {
      try {
        if (!this.canMoveTicket(this.draggedTicket)) {
          this.alertService.warn('Sin permisos', 'No tienes permisos para mover este ticket');
          this.draggedTicket = null;
          return;
        }

        const updatedTicket = this.ticketsService.changeTicketStatus(
          this.draggedTicket.id,
          status
        );

        this.alertService.success(
          'Ticket movido',
          `Ticket ${this.draggedTicket.id} movido a ${this.getStatusLabel(status)}`
        );
        this.loadTickets();
        this.ticketMoved.emit();
      } catch (error) {
        this.alertService.error('Error', 'Ha ocurrido un error al mover el ticket');
        console.error('Error moving ticket:', error);
      }
    }
    this.draggedTicket = null;
  }

  onDragOver(event: Event) {
    event.preventDefault();
  }

  openEditTicket(ticket: Ticket) {
    if (this.canEditTicket(ticket)) {
      this.selectedTicket = ticket;
      this.showTicketDialog = true;
    } else {
      this.alertService.warn('Sin permisos', 'Solo puedes editar tickets que tú creaste');
    }
  }

  openCommentDialog(ticket: Ticket) {
    if (this.canViewComments(ticket)) {
      this.selectedTicket = ticket;
      this.showCommentDialog = true;
    } else {
      this.alertService.warn('Sin permisos', 'No tienes permisos para ver los comentarios de este ticket');
    }
  }

  onTicketSaved(ticket: Ticket) {
    this.loadTickets();
    this.showTicketDialog = false;
    this.selectedTicket = null;
  }

  onCommentAdded(comment: any) {
    this.loadTickets();
    this.showCommentDialog = false;
    this.selectedTicket = null;
  }

  getStatusLabel(status: TicketStatus): string {
    return this.ticketsService.getStatusLabel(status);
  }

  getPrioritySeverity(priority: string): string {
    return this.ticketsService.getPrioritySeverity(priority as any);
  }

  getUserName(userId: number | null): string {
    if (!userId) return 'Sin asignar';
    const user = this.ticketsService.getUserById(userId);
    return user?.username || 'Usuario';
  }

  isOverdue(dueDate: Date | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  getStatusColor(status: TicketStatus): string {
    const colors = {
      'pending': 'blue',
      'in-progress': 'yellow',
      'review': 'purple',
      'done': 'green',
      'blocked': 'red'
    };
    return colors[status];
  }

  getPriorityClass(priority: string): string {
    const classes = {
      'alta': 'border border-red-600 text-red-600',
      'urgente': 'border border-orange-600 text-orange-600',
      'crítica': 'border border-red-300 text-red-300',
      'media': 'border border-yellow-600 text-yellow-600',
      'normal': 'border border-blue-400 text-blue-400',
      'baja': 'border border-green-400 text-green-400',
      'opcional': 'border border-gray-400 text-gray-400'
    };
    return classes[priority as keyof typeof classes] || 'border border-gray-400 text-gray-400';
  }

  trackByTicketId(index: number, ticket: Ticket): string {
    return ticket.id;
  }
}
