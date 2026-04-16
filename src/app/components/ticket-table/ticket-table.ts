import { Component, Input, SimpleChanges, inject, ViewChild, Output, EventEmitter } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { TicketsService } from '../../services/tickets/tickets.service';
import { Ticket } from '../../models/tickets/ticket.model';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { UserService } from '../../services/user/user.service';
import { User } from '../../models/user/user.model';
import { TicketDialogComponent } from '../ticket-dialog/ticket-dialog';
import { CommentDialogComponent } from '../comment-dialog/comment-dialog';
import { AlertService } from '../../services/alerts/alert.service';
import { firstValueFrom } from 'rxjs';

interface Column {
  field: string;
  header: string;
}

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-ticket-table',
  imports: [
    TableModule,
    CommonModule,
    FormsModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    AvatarModule,
    TooltipModule,
    SelectModule,
    IconFieldModule,
    InputIconModule,
    TicketDialogComponent,
    CommentDialogComponent
  ],
  templateUrl: './ticket-table.html',
  styleUrl: './ticket-table.css',
  standalone: true
})
export class TicketTable {
  @Input() groupId: number | null = null;
  @ViewChild('dt1') dt1!: Table;
  @Output() onTicketMoved = new EventEmitter<void>();

  public ticketsService = inject(TicketsService);
  public userService = inject(UserService);
  public alertService = inject(AlertService);

  tickets: Ticket[] = [];
  loading: boolean = true;


  get usuario(): User | null {
    return this.userService.currentUser();
  }

  showTicketDialog: boolean = false;
  showCommentDialog: boolean = false;
  selectedTicketId: number | null = null;
  currenUser: User | null = null;


  usersCache: Map<number, User> = new Map();


  loadingUsers: Set<number> = new Set();

  statusOptions: FilterOption[] = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'En Progreso', value: 'in-progress' },
    { label: 'Revisión', value: 'review' },
    { label: 'Hecho', value: 'done' },
    { label: 'Bloqueado', value: 'blocked' }
  ];

  priorityOptions: FilterOption[] = [
    { label: 'Alta', value: 'alta' },
    { label: 'Media', value: 'media' },
    { label: 'Baja', value: 'baja' },
    { label: 'Urgente', value: 'urgente' },
    { label: 'Crítica', value: 'crítica' },
    { label: 'Normal', value: 'normal' },
    { label: 'Opcional', value: 'opcional' }
  ];

  columns: Column[] = [
    { field: 'id', header: 'ID' },
    { field: 'title', header: 'Título' },
    { field: 'status', header: 'Estado' },
    { field: 'priority', header: 'Prioridad' },
    { field: 'assignedToId', header: 'Asignado a' },
    { field: 'dueDate', header: 'Fecha Límite' }
  ];

  ngOnInit() {
    this.loadTickets();
    this.currenUser = this.userService.getCurrentUser();
  }

  public async loadTickets() {
    if (!this.groupId) {
      console.log('No hay groupId, limpiando tabla');
      this.tickets = [];
      this.loading = false;
      return;
    }
    this.loading = true;
    try {
      this.tickets = await firstValueFrom(this.ticketsService.getTicketsByGroup(this.groupId!));
      console.log('Tickets cargados en tabla:', this.tickets.length);

      this.loadUsersFromTickets();
    } catch (error) {
      console.error('Error al cargar tickets:', error);
    } finally {
      this.loading = false;
    }
  }


  private async loadUsersFromTickets() {

    const userIds = new Set<number>();

    this.tickets.forEach(ticket => {
      if (ticket.assignedToId) userIds.add(Number(ticket.assignedToId));
      if (ticket.createdById) userIds.add(Number(ticket.createdById));
    });


    for (const userId of userIds) {
      if (!this.usersCache.has(userId) && !this.loadingUsers.has(userId)) {
        this.loadingUsers.add(userId);
        try {
          const user = await this.userService.getById(userId);
          if (user) {
            this.usersCache.set(userId, user);
          }
        } catch (error) {
          console.error(`Error loading user ${userId}:`, error);
        } finally {
          this.loadingUsers.delete(userId);
        }
      }
    }
  }


  getUserById(userId: number | string | null): User | null {
    if (!userId) return null;
    return this.usersCache.get(Number(userId)) || null;
  }

  private async ensureUserLoaded(userId: number): Promise<void> {
    if (!this.usersCache.has(userId) && !this.loadingUsers.has(userId)) {
      this.loadingUsers.add(userId);
      try {
        const user = await this.userService.getById(userId);
        if (user) {
          this.usersCache.set(userId, user);

          this.loadTickets();
        }
      } catch (error) {
        console.error(`Error loading user ${userId}:`, error);
      } finally {
        this.loadingUsers.delete(userId);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['groupId'] && !changes['groupId'].firstChange) {
      console.log('groupId cambiado en tabla, recargando...');
      this.loadTickets();
    }
  }

  async updateTicketStatus(ticket: Ticket) {
    if (!this.currenUser) {
      this.alertService.error('Error', 'Usuario no autenticado');
      return;
    }
    if (Number(ticket.assignedToId) !== this.currenUser.id) {
      this.alertService.error('Error', 'Solo puedes cambiar el estado de tickets asignados a ti');
      return;
    }
    try {
      const updatedTicket = await firstValueFrom(this.ticketsService.updateTicket(ticket.id, ticket, this.currenUser.id));
      const index = this.tickets.findIndex(t => t.id === ticket.id);
      if (index !== -1) {
        this.tickets[index] = updatedTicket;
      }
      this.alertService.success('Ticket Actualizado', `Ticket ${ticket.id} movido a ${this.ticketsService.getStatusLabel(ticket.status)}`)
      this.onTicketMoved.emit();
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      this.loadTickets();
    }
  }

  async onStatusEditComplete(event: any, ticket: Ticket) {
    await this.updateTicketStatus(ticket);
  }

  openEditTicket(ticket: Ticket) {
    this.selectedTicketId = ticket.id;
    this.showTicketDialog = true;
  }

  openCommentDialog(ticket: Ticket) {
    this.selectedTicketId = ticket.id;
    this.showCommentDialog = true;
  }

  onTicketSaved(ticket: Ticket) {
    this.loadTickets();
    this.showTicketDialog = false;
  }

  onCommentAdded(comment: any) {
    this.loadTickets();
    this.showCommentDialog = false;
  }

  clear(table: Table) {
    table.clear();
  }

  getStatusSeverity(status: string): string {
    return this.ticketsService.getStatusSeverity(status as any);
  }

  getPrioritySeverity(priority: string): string {
    return this.ticketsService.getPrioritySeverity(priority as any);
  }

  isOverdue(ticket: Ticket): boolean {
    if (!ticket.dueDate || ticket.status === 'done') return false;
    return new Date(ticket.dueDate) < new Date();
  }

  canEditStatus(ticket: Ticket): boolean {
    if (!this.usuario) return false;
    return Number(ticket.assignedToId) === this.usuario.id;
  }

  canEditTicket(ticket: Ticket): boolean {
    if (!this.usuario) return false;
    return Number(ticket.createdById) === this.usuario.id;
  }

  canCommentTicket(ticket: Ticket): boolean {
    if (!this.usuario) return false;
    return Number(ticket.createdById) === this.usuario.id || Number(ticket.assignedToId) === this.usuario.id;
  }
}