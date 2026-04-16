// ticket-dialog.ts
import { Component, Input, Output, EventEmitter, inject, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AvatarModule } from 'primeng/avatar';
import { TicketsService } from '../../services/tickets/tickets.service';
import { Ticket, Priority, TicketStatus, CreateTicketDto, UpdateTicketDto } from '../../models/tickets/ticket.model';
import { UserService } from '../../services/user/user.service';
import { User } from '../../models/user/user.model';
import { firstValueFrom } from 'rxjs';

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    TagModule,
    ProgressSpinnerModule,
    AvatarModule,
    TextareaModule
  ],
  templateUrl: './ticket-dialog.html',
  styleUrls: ['./ticket-dialog.css']
})
export class TicketDialogComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() ticketId: number | null = null;
  @Input() groupId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Ticket>();

  private ticketsService = inject(TicketsService);
  private userService = inject(UserService);

  loading: boolean = false;
  saving: boolean = false;
  submitted: boolean = false;
  currentUser: User | null = null;

  users: User[] = [];

  priorityOptions: FilterOption[] = [
    { label: 'Alta', value: 'alta' },
    { label: 'Media', value: 'media' },
    { label: 'Baja', value: 'baja' },
    { label: 'Urgente', value: 'urgente' },
    { label: 'Crítica', value: 'crítica' },
    { label: 'Normal', value: 'normal' },
    { label: 'Opcional', value: 'opcional' }
  ];

  statusOptions: FilterOption[] = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'En Progreso', value: 'in-progress' },
    { label: 'Revisión', value: 'review' },
    { label: 'Hecho', value: 'done' },
    { label: 'Bloqueado', value: 'blocked' }
  ];

  formData: Partial<Ticket> = {
    title: '',
    description: '',
    priority: 'media',
    status: 'pending',
    assignedToId: null,
    dueDate: null
  };

  async ngOnInit() {
    this.currentUser = this.userService.getCurrentUser();
    await this.loadUsers();
  }

  async ngOnChanges() {
    if (this.visible && this.ticketId) {
      await this.loadTicket();
    } else if (this.visible && !this.ticketId) {
      this.resetForm();
    }
  }

  async loadUsers() {
    try {
      this.users = await this.userService.getAll();
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [];
    }
  }

  async loadTicket() {
    if (!this.ticketId) return;

    this.loading = true;
    try {
      const ticket = await firstValueFrom(this.ticketsService.getTicketById(this.ticketId));
      if (ticket) {
        this.formData = {
          ...ticket,
          dueDate: ticket.dueDate
        };
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      this.loading = false;
    }
  }

  resetForm() {
    this.formData = {
      title: '',
      description: '',
      priority: 'media',
      status: 'pending',
      assignedToId: null,
      dueDate: null
    };
    this.submitted = false;
  }

  async save() {
    this.submitted = true;

    if (!this.formData.title || !this.formData.priority || !this.currentUser || !this.groupId) {
      return;
    }

    this.saving = true;

    try {
      let savedTicket: Ticket;

      const ticketData: CreateTicketDto | UpdateTicketDto = {
        title: this.formData.title,
        description: this.formData.description || '',
        status: 'pending',
        priority: this.formData.priority as Priority,
        assignedToId: this.formData.assignedToId || null,
        dueDate: this.formData.dueDate,
      };

      if (this.ticketId) {
        savedTicket = await firstValueFrom(
          this.ticketsService.updateTicket(this.ticketId, ticketData as UpdateTicketDto, this.currentUser.id)
        );
      } else {
        savedTicket = await firstValueFrom(
          this.ticketsService.createTicket(ticketData as CreateTicketDto, this.currentUser.id, this.groupId)
        );
      }

      this.saved.emit(savedTicket);
      this.close();
    } catch (error) {
      console.error('Error al guardar ticket:', error);
    } finally {
      this.saving = false;
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForm();
  }

  onHide() {
    this.close();
  }

  getPrioritySeverity(priority: string): string {
    return this.ticketsService.getPrioritySeverity(priority as Priority);
  }

  getStatusSeverity(status: string): string {
    return this.ticketsService.getStatusSeverity(status as TicketStatus);
  }
}