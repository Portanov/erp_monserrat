import { Component, OnInit, inject, signal, ViewChild, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TicketsService } from '../../services/tickets/tickets.service';
import { Ticket, TicketStatus, Priority } from '../../models/tickets/ticket.model';
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
import { User } from '../../models/user/user.model';
import { GroupData } from '../../models/groups/groups.model';
import { Subject, takeUntil } from 'rxjs';
import { firstValueFrom } from 'rxjs';

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
export class GroupDetail implements OnInit, OnDestroy {
  @ViewChild(Kanban) kanbanComponent!: Kanban;
  @ViewChild(TicketTable) ticketTableComponent!: TicketTable;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ticketsService = inject(TicketsService);
  private groupService = inject(GroupService);
  private userService = inject(UserService);

  private destroy$ = new Subject<void>();
  private userCache: Map<number, User> = new Map();

  groupId: number = 0;
  groupInfo: GroupData | null = null;
  tickets = signal<Ticket[]>([]);
  recentTickets = signal<Ticket[]>([]);
  loading = signal(false);
  searchValue = signal('');
  kanban: boolean = false;
  showTicketDialog: boolean = false;
  selectedTicketId: number | null = null;
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
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(async params => {
      this.groupId = +params['id'];
      if (this.groupId) {
        await this.loadGroupInfo();
        await this.loadTickets();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadGroupInfo() {
    try {
      const group = await this.groupService.getById(this.groupId);
      this.groupInfo = group;

      if (this.groupInfo?.authorId) {
        await this.ensureUserLoaded(this.groupInfo.authorId);
      }
    } catch (error) {
      console.error('Error loading group info:', error);
    }
  }

  private async loadTickets() {
    this.loading.set(true);
    try {
      // Cargar tickets del grupo usando Observable convertido a Promise
      const groupTickets = await firstValueFrom(this.ticketsService.getTicketsByGroup(this.groupId));
      console.log('Tickets cargados en group-detail:', groupTickets.length);
      this.tickets.set(groupTickets);

      await this.loadUsersFromTickets(groupTickets);

      this.calculateStats();
      this.loadRecentTickets();
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadUsersFromTickets(tickets: Ticket[]) {
    const userIds = new Set<number>();
    tickets.forEach(ticket => {
      if (ticket.assignedToId) userIds.add(ticket.assignedToId);
      if (ticket.createdById) userIds.add(ticket.createdById);
    });

    for (const userId of userIds) {
      await this.ensureUserLoaded(userId);
    }
  }

  private async ensureUserLoaded(userId: number): Promise<void> {
    if (this.userCache.has(userId)) return;

    try {
      const user = await this.userService.getById(userId);
      if (user) {
        this.userCache.set(userId, user);
      }
    } catch (error) {
      console.error(`Error loading user ${userId}:`, error);
    }
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
    const sorted = [...currentTickets].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    this.recentTickets.set(sorted.slice(0, 3));
  }

  openCreateTicketDialog() {
    this.selectedTicketId = null;
    this.showTicketDialog = true;
  }

  async onTicketSaved(ticket: Ticket) {
    console.log('Ticket guardado en group-detail:', ticket);
    this.showTicketDialog = false;
    await this.loadTickets();
    setTimeout(() => {
      this.refreshCurrentView();
    }, 300);
  }

  goToGroups() {
    this.router.navigate(['/group']);
  }

  private refreshCurrentView() {
    console.log('Refrescando vista actual, modo kanban:', this.kanban);

    if (this.kanban) {
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

  async onTicketMoved() {
    console.log('Ticket movido, recargando estadísticas...');
    await this.loadTickets();
  }

  onViewChanged() {
    console.log('Vista cambiada a:', this.kanban ? 'tabla' : 'kanban');
    setTimeout(() => {
      this.refreshCurrentView();
    }, 300);
  }

  getUserName(userId: number | null): string {
    if (!userId) return 'Sin asignar';
    const user = this.userCache.get(userId);
    return user ? (user.fullName || user.username || 'Usuario') : 'Cargando...';
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

  getStatusColor(status: TicketStatus): string {
    const colors: Record<TicketStatus, string> = {
      'pending': 'blue',
      'in-progress': 'yellow',
      'review': 'purple',
      'done': 'green',
      'blocked': 'red'
    };
    return colors[status] || 'gray';
  }

  // Método para refrescar desde el template
  async refresh() {
    await this.loadTickets();
  }
}