import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ProgressBarModule } from 'primeng/progressbar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { GroupService } from '../../services/group/group.service';
import { GroupData } from '../../models/groups/groups.model';
import { UserService } from '../../services/user/user.service';
import { User } from '../../models/user/user.model';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { PermissionService } from '../../services/permissions/permissions.service';
import { CreateGroupDto } from '../../models/groups/groups.model';
import { AlertService } from '../../services/alerts/alert.service';

interface level {
  label: string;
  value: string;
}

@Component({
  selector: 'app-group',
  imports: [CommonModule,
    CardModule,
    ChipModule,
    ProgressBarModule,
    PanelMenuModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    FormsModule,
    InputNumberModule,
    SelectModule
  ],
  templateUrl: './group.html',
  styleUrl: './group.css',
})
export class Group implements OnInit {
  private router = inject(Router);
  private permissionService = inject(PermissionService);
  private alertService = inject(AlertService);
  items: MenuItem[] = [];
  groups: GroupData[] = [];
  createVisible: boolean = false;
  editVisible: boolean = false;
  editingGroupId: number | null = null;
  levels: level[] = [];
  selectedlevel: level | null = null;
  userid: number | null = null;
  loading: boolean = false;

  
  usersMap: Map<number, User> = new Map();
  loadingUsers: boolean = false;

  newGroup: CreateGroupDto = {
    name: '',
    category: '',
    level: '',
    authorId: this.userid || 0,
  };

  constructor(private groupService: GroupService, private userService: UserService) { }

  ngOnInit() {
    this.levels = [
      { label: 'Alto', value: 'Alto' },
      { label: 'Medio', value: 'Medio' },
      { label: 'Bajo', value: 'Bajo' }
    ];
    const currentUser = this.userService.getCurrentUser();
    this.userid = currentUser?.id || null;
    this.setupMenuItems();
    this.loadGroups();
  }

  setupMenuItems() {
    const menuItems: MenuItem[] = [];
    if (this.permissionService.hasPermission('group', 'create')) {
      menuItems.push({
        label: 'Añadir Grupo',
        icon: 'pi pi-plus',
        command: () => this.openCreateDialog()
      });
    }
    this.items = menuItems;
  }

  async loadGroups() {
    this.loading = true;
    const currentUser = this.userService.getCurrentUser();
    if (currentUser) {
      try {
        this.groups = await this.groupService.getUserGroups(currentUser.id);
        await this.loadUsersForGroups();
      } catch (error) {
        console.error('Error loading groups:', error);
        this.groups = [];
      }
    } else {
      this.groups = [];
    }
    this.loading = false;
  }

  private async loadUsersForGroups() {
    if (this.groups.length === 0) return;

    const authorIds = [...new Set(this.groups.map(g => g.authorId))];

    for (const authorId of authorIds) {
      if (!this.usersMap.has(authorId)) {
        try {
          const user = await this.userService.getPublicUser(authorId);
          if (user) {
            this.usersMap.set(authorId, user);
          }
        } catch (error) {
          console.error(`Error loading user ${authorId}:`, error);
        }
      }
    }
  }

  getAuthorUsername(authorId: number): string {
    const user = this.usersMap.get(authorId);
    return user ? user.username : 'Cargando...';
  }

  openCreateDialog() {
    this.resetForm();
    this.editingGroupId = null;
    this.createVisible = true;
  }

  openEditDialog(group: GroupData) {
    this.editingGroupId = group.id;
    this.newGroup = {
      name: group.name,
      category: group.category,
      level: group.level,
      authorId: group.authorId,
    };
    this.editVisible = true;
  }

  async saveGroup() {
    try {
      if (this.editingGroupId === null) {
        const created = await this.groupService.create(this.newGroup);
        if (created) {
          this.createVisible = false;
          this.alertService.success('Grupo creado', `El grupo ${created.name} ha sido creado exitosamente`);
        }
      } else {
        const updated = await this.groupService.update(this.editingGroupId, this.newGroup);
        if (updated) {
          this.editVisible = false;
          this.alertService.success('Grupo actualizado', `El grupo ${updated.name} ha sido actualizado`);
        }
      }
      await this.loadGroups();
      this.resetForm();
    } catch (error) {
      console.error('Error saving group:', error);
      this.alertService.error('Error', 'No se pudo guardar el grupo');
    }
  }

  async deleteGroup(id: number) {
    if (confirm('¿Está seguro de que desea eliminar este grupo?')) {
      try {
        const success = await this.groupService.deleteGroup(id);
        if (success) {
          await this.loadGroups();
          this.alertService.success('Grupo eliminado', 'El grupo ha sido eliminado correctamente');
        } else {
          this.alertService.error('Error', 'No se pudo eliminar el grupo');
        }
      } catch (error) {
        console.error('Error deleting group:', error);
        this.alertService.error('Error', 'Ocurrió un error al eliminar el grupo');
      }
    }
  }

  resetForm() {
    this.newGroup = {
      name: '',
      category: '',
      level: '',
      authorId: this.userid || 0,
    };
  }

  viewGroupDetail(groupId: number) {
    this.router.navigate(['/group-detail', groupId]);
  }

  closeDialog() {
    this.createVisible = false;
    this.editVisible = false;
    this.resetForm();
    this.editingGroupId = null;
  }
}