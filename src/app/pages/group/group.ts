import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ProgressBarModule } from 'primeng/progressbar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { GroupService, GroupData } from '../../services/group/group.service';
import { UserService } from '../../services/user/user.service';
import { User } from '../../models/user/user.model';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { PermissionService } from '../../services/permissions/permissions.service';

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
  items: MenuItem[] = [];
  groups: GroupData[] = [];
  createVisible: boolean = false;
  editVisible: boolean = false;
  editingGroupId: number | null = null;
  levels: level[] = [];
  selectedlevel: level | null = null;
  userid: number | null = null;

  
  usersMap: Map<number, User> = new Map();
  loadingUsers: boolean = false;

  newGroup: Omit<GroupData, 'id' | 'authorId'> = {
    name: '',
    categoria: '',
    nivel: '',
    members: [],
    tickets: 0
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

  loadGroups() {
    const currentUser = this.userService.getCurrentUser();
    if (currentUser) {
      this.groups = this.groupService.getUserGroups(currentUser.id);
      
      this.loadUsersForGroups();
    } else {
      this.groups = [];
    }
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
    const { id, authorId, ...rest } = group;
    this.newGroup = rest;
    this.editVisible = true;
  }

  saveGroup() {
    if (this.editingGroupId === null) {
      this.groupService.create(this.newGroup);
      this.createVisible = false;
    } else {
      this.groupService.update(this.editingGroupId, this.newGroup);
      this.editVisible = false;
    }
    this.loadGroups();
    this.resetForm();
  }

  deleteGroup(id: number) {
    if (confirm('¿Está seguro de que desea eliminar este grupo?')) {
      this.groupService.delete(id);
      this.loadGroups();
    }
  }

  resetForm() {
    this.newGroup = {
      name: '',
      categoria: '',
      nivel: '',
      members: [],
      tickets: 0
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