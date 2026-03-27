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
import { TicketsService, Ticket, Priority, TicketStatus } from '../../services/tickets/tickets.service';
import { UserService } from '../../services/user/user.service';
import { UserData } from '../../services/user/user.service';

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
  @Input() ticketId: string | null = null;
  @Input() groupId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Ticket>();

  private ticketsService = inject(TicketsService);
  private userService = inject(UserService);

  loading: boolean = false;
  saving: boolean = false;
  submitted: boolean = false;

  users: UserData[] = [];

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

  ngOnInit() {
    this.loadUsers();
  }

  ngOnChanges() {
    if (this.visible && this.ticketId) {
      this.loadTicket();
    } else if (this.visible && !this.ticketId) {
      this.resetForm();
    }
  }

  loadUsers() {
    this.users = this.userService.getAll();
  }

  loadTicket() {
    if (!this.ticketId) return;

    this.loading = true;
    setTimeout(() => {
      const ticket = this.ticketsService.getTicketById(this.ticketId!);
      if (ticket) {
        this.formData = { ...ticket };
      }
      this.loading = false;
    }, 500);
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

  save() {
    this.submitted = true;

    if (!this.formData.title || !this.formData.priority) {
      return;
    }

    this.saving = true;

    setTimeout(() => {
      try {
        let savedTicket: Ticket;

        if (this.ticketId) {
          const existingTicket = this.ticketsService.getTicketById(this.ticketId!);
          if (existingTicket) {
            const updatedTicket = {
              ...existingTicket,
              ...this.formData
            };
            savedTicket = this.ticketsService.updateTicket(updatedTicket);
          } else {
            throw new Error('Ticket no encontrado');
          }
        } else {
          savedTicket = this.ticketsService.createTicket({
            ...this.formData,
            groupId: this.groupId!
          });
        }

        this.saved.emit(savedTicket);
        this.close();
      } catch (error) {
        console.error('Error al guardar ticket:', error);
      } finally {
        this.saving = false;
      }
    }, 500);
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
