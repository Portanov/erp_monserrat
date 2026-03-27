import { Component, OnInit, inject, signal, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Table } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TicketsService, Ticket, TicketStatus } from '../../services/tickets/tickets.service';
import { GroupService } from '../../services/group/group.service';
import { UserService } from '../../services/user/user.service';
import { TabsModule } from 'primeng/tabs';
import { Kanban } from '../../components/kanban/kanban';
import { FieldsetModule } from 'primeng/fieldset';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TicketTable } from '../../components/ticket-table/ticket-table';
import { FormsModule } from '@angular/forms';
import { TicketDialogComponent } from '../../components/ticket-dialog/ticket-dialog';
import { DataViewModule } from 'primeng/dataview';
import { HasGroupPermissionDirective } from '../../directives/permissions-group/has-group-permission.directive';
import { GroupConfigComponent } from '../../components/group-config/group-config.component';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TabsModule,
    Kanban,
    FieldsetModule,
    ToggleButtonModule,
    TicketTable,
    FormsModule,
    TicketDialogComponent,
    DataViewModule,
    HasGroupPermissionDirective,
    GroupConfigComponent
  ],
  templateUrl: './group-detail.html',
  styleUrls: ['./group-detail.css']
})
export class GroupDetail implements OnInit {
  @ViewChild(Kanban) kanbanComponent!: Kanban;
  @ViewChild(TicketTable) ticketTableComponent!: TicketTable;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ticketsService = inject(TicketsService);
  private groupService = inject(GroupService);
  private userService = inject(UserService);

  groupId: number = 0;
  groupInfo: any = null;
  tickets = signal<Ticket[]>([]);
  recentTickets = signal<Ticket[]>([]);
  loading = signal(false);
  searchValue = signal('');
  kanban: boolean = false;
  showTicketDialog: boolean = false;
  selectedTicketId: string | null = null;
  currentUser = this.userService.currentUser;
  currentUserId = computed(() => this.currentUser()?.id);

  ticketStats = {
    pending: 0,
    'in-progress': 0,
    review: 0,
    done: 0,
    blocked: 0
  };

  statusOptions = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'En Progreso', value: 'in-progress' },
    { label: 'Revisión', value: 'review' },
    { label: 'Hecho', value: 'done' },
    { label: 'Bloqueado', value: 'blocked' }
  ];

  selectedStatus: TicketStatus | null = null;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.groupId = +params['id'];
      if (this.groupId) {
        this.loadGroupInfo();
        this.loadTickets();
      }
    });
  }

  private loadGroupInfo() {
    const groups = this.groupService.getAll();
    this.groupInfo = groups.find(g => g.id === this.groupId);
  }

  private loadTickets() {
    this.loading.set(true);
    setTimeout(() => {
      const groupTickets = this.ticketsService.getTicketsByGroup(this.groupId!);
      console.log('Tickets cargados en group-detail:', groupTickets.length);
      this.tickets.set(groupTickets);
      this.calculateStats();
      this.loadRecentTickets();
      this.loading.set(false);
    }, 500);
  }

  private calculateStats() {
    const currentTickets = this.tickets();
    this.ticketStats = {
      pending: currentTickets.filter(t => t.status === 'pending').length,
      'in-progress': currentTickets.filter(t => t.status === 'in-progress').length,
      review: currentTickets.filter(t => t.status === 'review').length,
      done: currentTickets.filter(t => t.status === 'done').length,
      blocked: currentTickets.filter(t => t.status === 'blocked').length
    };
    console.log('Estadísticas actualizadas:', this.ticketStats);
  }

  private loadRecentTickets() {
    const currentTickets = this.tickets();
    const sorted = [...currentTickets].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    this.recentTickets.set(sorted.slice(0, 3));
  }

  openCreateTicketDialog() {
    this.selectedTicketId = null;
    this.showTicketDialog = true;
  }

  onTicketSaved(ticket: Ticket) {
    console.log('Ticket guardado en group-detail:', ticket);
    this.showTicketDialog = false;
    this.loadTickets();
    setTimeout(() => {
      this.refreshCurrentView();
    }, 600);
  }

  goToGroups() {
    this.router.navigate(['/group']);
  }

  private refreshCurrentView() {
    console.log('Refrescando vista actual, modo kanban:', this.kanban);

    if (!this.kanban) {
      if (this.kanbanComponent) {
        console.log('Refrescando kanban component...');
        this.kanbanComponent.refresh();
      } else {
        console.warn('Kanban component no disponible');
      }
    } else {
      if (this.ticketTableComponent) {
        console.log('Refrescando ticket table component...');
        this.ticketTableComponent.loadTickets();
      } else {
        console.warn('Ticket table component no disponible');
      }
    }
  }

  onTicketMoved() {
    console.log('Ticket movido, recargando estadísticas...');
    this.loadTickets();
  }

  onViewChanged() {
    console.log('Vista cambiada a:', this.kanban ? 'tabla' : 'kanban');
    setTimeout(() => {
      this.refreshCurrentView();
    }, 300);
  }

  getUserName(userId: number | null): string {
    if (!userId) return 'Sin asignar';
    const user = this.userService.getAll().find(u => u.id === userId);
    return user ? user.username : 'Desconocido';
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

  getStatusColor(status: string): string {
    const colors = {
      'pending': 'blue',
      'in-progress': 'yellow',
      'review': 'purple',
      'done': 'green',
      'blocked': 'red'
    };
    return colors[status as keyof typeof colors] || 'gray';
  }
}
