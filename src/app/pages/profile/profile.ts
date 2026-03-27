import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { UserService, UserData } from '../../services/user/user.service';
import { TicketsService, Ticket, TicketStatus } from '../../services/tickets/tickets.service';
import { AlertService } from '../../services/alerts/alert.service';
import { Router } from '@angular/router';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ImageModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    FormsModule,
    TagModule
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})

export class Profile implements OnInit {
  private userService = inject(UserService);
  private ticketsService = inject(TicketsService);
  private alertService = inject(AlertService);
  public router = inject(Router);

  user: UserData | null = null;
  showEditDialog: boolean = false;
  saving: boolean = false;

  // Estadísticas de tickets
  createdTickets: Ticket[] = [];
  assignedTickets: Ticket[] = [];

  ticketStats = {
    created: {
      total: 0
    },
    assigned: {
      inProgress: 0,
      done: 0
    }
  };

  // Formulario de edición
  editForm = {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: null as Date | null
  };

  ngOnInit() {
    this.loadUserData();
    this.loadTicketStats();
  }

  loadUserData() {
    this.user = this.userService.getCurrentUser();
    if (this.user) {
      this.editForm = {
        fullName: this.user.fullName,
        email: this.user.email,
        phone: this.user.phone,
        address: this.user.address,
        birthDate: this.user.birthDate ? new Date(this.user.birthDate) : null
      };
    }
  }

  loadTicketStats() {
    if (!this.user) return;

    this.createdTickets = this.ticketsService.getCreatedTickets(this.user.id);
    this.assignedTickets = this.ticketsService.getAssignedTickets(this.user.id);

    this.ticketStats.created = {
      total: this.createdTickets.length
    };

    this.ticketStats.assigned = {
      inProgress: this.assignedTickets.filter(t => t.status === 'in-progress').length,
      done: this.assignedTickets.filter(t => t.status === 'done').length
    };
  }

  openEditDialog() {
    this.showEditDialog = true;
  }

  saveProfile() {
    if (!this.user) {
      this.alertService.error('Error', 'No se encontró el usuario');
      return;
    }

    this.saving = true;

    setTimeout(() => {
      try {
        const currentUser = this.user;
        if (!currentUser) {
          throw new Error('Usuario no encontrado');
        }

        const updatedUser: UserData = {
          id: currentUser.id,
          username: currentUser.username,
          email: this.editForm.email,
          fullName: this.editForm.fullName,
          password: currentUser.password,
          phone: this.editForm.phone,
          address: this.editForm.address,
          birthDate: this.editForm.birthDate,
          registeredDate: currentUser.registeredDate,
          role: currentUser.role,
          status: currentUser.status
        };

        const updated = this.userService.update(updatedUser);

        if (updated) {
          this.user = updated;
          this.alertService.success('Perfil actualizado', 'Tus datos han sido actualizados correctamente');
          this.showEditDialog = false;
        } else {
          this.alertService.error('Error', 'No se pudo actualizar el perfil');
        }
      } catch (error) {
        console.error('Error al actualizar perfil:', error);
        this.alertService.error('Error', 'Ha ocurrido un error al actualizar el perfil');
      } finally {
        this.saving = false;
      }
    }, 500);
  }

  logout() {
    this.userService.logout();
  }

  getStatusColorClass(status: TicketStatus): string {
    const classes = {
      'pending': 'border-blue-500 bg-blue-50 text-blue-700',
      'in-progress': 'border-yellow-500 bg-yellow-50 text-yellow-700',
      'review': 'border-purple-500 bg-purple-50 text-purple-700',
      'done': 'border-green-500 bg-green-50 text-green-700',
      'blocked': 'border-red-500 bg-red-50 text-red-700'
    };
    return classes[status];
  }

  getStatusLabel(status: TicketStatus): string {
    return this.ticketsService.getStatusLabel(status);
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

  getSeverity(status: TicketStatus): string {
    return this.ticketsService.getStatusSeverityColors(status);
  }

  getUserName(userId: number | null): string {
    if (!userId) return 'Sin asignar';
    const user = this.ticketsService.getUserById(userId);
    return user?.fullName || 'Usuario';
  }

  isOverdue(dueDate: Date | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }
}
