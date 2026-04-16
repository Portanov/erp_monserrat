import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ImageModule } from 'primeng/image';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user/user.service';
import { User } from '../../models/user/user.model';
import { Ticket, TicketStatus, Priority } from '../../models/tickets/ticket.model';
import { AlertService } from '../../services/alerts/alert.service';
import { Router } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { TicketsService } from '../../services/tickets/tickets.service';

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

  user: User | null = null;
  showEditDialog: boolean = false;
  saving: boolean = false;
  loading: boolean = true;

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

  editForm = {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: null as Date | null
  };

  usersCache: Map<number, User> = new Map();

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
        phone: this.user.phone || '',
        address: this.user.address || '',
        birthDate: this.user.birthDate ? new Date(this.user.birthDate) : null
      };
    }
  }

  async loadTicketStats() {
    if (!this.user) {
      console.log('No hay usuario para cargar estadísticas');
      this.loading = false;
      return;
    }

    this.loading = true;

    try {
      this.createdTickets = await firstValueFrom(this.ticketsService.getCreatedTickets(this.user.id));
      this.assignedTickets = await firstValueFrom(this.ticketsService.getAssignedTickets(this.user.id));

      this.ticketStats.created = {
        total: this.createdTickets.length
      };

      this.ticketStats.assigned = {
        inProgress: this.assignedTickets.filter(t => t.status === 'in-progress').length,
        done: this.assignedTickets.filter(t => t.status === 'done').length
      };
    } catch (error) {
      console.error('Error loading ticket stats:', error);
      this.alertService.error('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      this.loading = false;
    }
  }

  openEditDialog() {
    this.showEditDialog = true;
  }

  async saveProfile() {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) {
      this.alertService.error('Error', 'No se encontró el usuario');
      return;
    }

    this.saving = true;

    try {
      const updateData = {
        id: currentUser.id,
        username: currentUser.username,
        fullName: this.editForm.fullName,
        email: this.editForm.email,
        phone: this.editForm.phone || '',
        address: this.editForm.address || '',
        birthDate: this.editForm.birthDate
          ? this.editForm.birthDate.toISOString().split('T')[0]
          : '',
      };

      const updatedUser = await this.userService.update(currentUser.id, updateData);

      if (updatedUser) {
        this.user = updatedUser;

        this.editForm = {
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone || '',
          address: updatedUser.address || '',
          birthDate: updatedUser.birthDate ? new Date(updatedUser.birthDate) : null
        };

        this.alertService.success('Perfil actualizado', 'Tus datos han sido actualizados correctamente');
        this.showEditDialog = false;

        // Recargar estadísticas por si afecta algo
        await this.loadTicketStats();
      } else {
        this.alertService.error('Error', 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      this.alertService.error('Error', 'Ha ocurrido un error al actualizar el perfil');
    } finally {
      this.saving = false;
    }
  }

  logout() {
    this.userService.logout();
  }

  async loadUserForTicket(userId: number): Promise<User | null> {
    if (this.usersCache.has(userId)) {
      return this.usersCache.get(userId) || null;
    }

    try {
      const user = await this.userService.getById(userId);
      if (user) {
        this.usersCache.set(userId, user);
      }
      return user;
    } catch (error) {
      console.error(`Error loading user ${userId}:`, error);
      return null;
    }
  }

  getStatusColorClass(status: TicketStatus): string {
    const classes: Record<TicketStatus, string> = {
      'pending': 'border-blue-500 bg-blue-50 text-blue-700',
      'in-progress': 'border-yellow-500 bg-yellow-50 text-yellow-700',
      'review': 'border-purple-500 bg-purple-50 text-purple-700',
      'done': 'border-green-500 bg-green-50 text-green-700',
      'blocked': 'border-red-500 bg-red-50 text-red-700'
    };
    return classes[status] || 'pending';
  }

  getStatusLabel(status: TicketStatus): string {
    return this.ticketsService.getStatusLabel(status);
  }

  getPriorityClass(priority: Priority | string): string {
    const classes: Record<string, string> = {
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

  getSeverity(status: TicketStatus): string {
    return this.ticketsService.getStatusSeverityColors(status);
  }

  async getUserName(userId: number | null): Promise<string> {
    if (!userId) return 'Sin asignar';

    if (this.usersCache.has(userId)) {
      return this.usersCache.get(userId)?.fullName || 'Usuario';
    }

    try {
      const user = await this.userService.getById(userId);
      if (user) {
        this.usersCache.set(userId, user);
        return user.fullName || user.username || 'Usuario';
      }
    } catch (error) {
      console.error(`Error loading user ${userId}:`, error);
    }

    return `Usuario ${userId}`;
  }

  isOverdue(dueDate: string | Date | null): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  refreshData() {
    this.loadTicketStats();
  }
}