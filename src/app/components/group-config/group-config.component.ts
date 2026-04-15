import { Component, Input, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { FieldsetModule } from 'primeng/fieldset';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { MenuItem} from 'primeng/api';
import { GroupService, GroupData } from '../../services/group/group.service';
import { UserService } from '../../services/user/user.service';
import { User } from '../../models/user/user.model';
import { GroupPermissionService, GroupPermissions } from './../../services/group_permissions/group-permissions.service';
import { HasGroupPermissionDirective } from '../../directives/permissions-group/has-group-permission.directive';
import { IconField, IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AlertService } from '../../services/alerts/alert.service';

@Component({
  selector: 'app-group-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    AvatarModule,
    TieredMenuModule,
    DialogModule,
    CheckboxModule,
    FieldsetModule,
    TooltipModule,
    ToastModule,
    SelectModule,
    HasGroupPermissionDirective,
    IconField,
    InputIconModule
  ],
  template: `
    <div class="group-config">
      <!-- Header con título y búsqueda -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Miembros del Grupo</h2>
        <div class="flex gap-2">
          <button
            *appHasGroupPermission="{ groupId: groupId, permission: 'addMember' }"
            pButton
            label="Añadir Miembro"
            icon="pi pi-user-plus"
            severity="success"
            (click)="openAddMemberDialog()">
          </button>
        </div>
      </div>

      <!-- Tabla de miembros -->
      <p-table
        #dt
        [value]="members()"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[5, 10, 20, 50]"
        [globalFilterFields]="['fullName', 'email', 'username']"
        [tableStyle]="{ 'min-width': '50rem' }"
        size="small"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} miembros"
        >

        <!-- Toolbar con búsqueda y filtros -->
        <ng-template #caption>
          <div class="flex justify-end w-full">
            <div class="flex gap-2">
              <p-iconfield iconPosition="left">
                <p-inputicon>
                  <i class="pi pi-search"></i>
                </p-inputicon>
                <input
                  pInputText
                  type="text"
                  (input)="onGlobalFilter(dt, $event)"
                  [value]="globalFilterValue"
                  placeholder="Buscar por nombre, email o usuario..."
                  class="w-80" />
              </p-iconfield>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 60px">Avatar</th>
            <th pSortableColumn="fullName">
              Nombre <p-sortIcon field="fullName" />
            </th>
            <th pSortableColumn="email">
              Email <p-sortIcon field="email" />
            </th>
            <th pSortableColumn="role">
              Rol <p-sortIcon field="role" />
            </th>
            <th style="width: 80px">Acciones</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-member>
          <tr>
            <td>
              <p-avatar
                [label]="getInitials(member.fullName)"
                styleClass="bg-primary text-white"
                shape="circle">
              </p-avatar>
            </td>
            <td class="font-semibold">
              {{ member.fullName }}
            </td>
            <td>{{ member.email }}</td>
            <td>
              <span
                class="px-2 py-1 rounded-full text-xs font-semibold"
                [class]="getRoleClass(getMemberRole(member.id))">
                {{ getMemberRole(member.id) }}
              </span>
            </td>
            <td>
              <!-- Botón con menú tiered -->
              <div class="relative inline-block">
                <button
                  pButton
                  type="button"
                  icon="pi pi-ellipsis-v"
                  (click)="openMenu($event, member)"
                  class="p-button-rounded p-button-text p-button-secondary"
                  [disabled]="isOwnerOrSelf(member)">
                </button>
                <p-tieredMenu
                  #menu
                  [model]="currentMenuItems"
                  [popup]="true"
                  appendTo="body">
                </p-tieredMenu>
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="5" class="text-center p-8">
              <i class="pi pi-users text-4xl text-gray-400 mb-3 block"></i>
              <p class="text-gray-500 text-lg">No se encontraron miembros</p>
              <p class="text-gray-400 text-sm mt-1">Intenta con otros criterios de búsqueda</p>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="loading">
          <tr>
            <td colspan="5" class="text-center p-4">
              <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
              <p class="mt-2">Cargando miembros...</p>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Resto del código igual... -->
      <!-- Diálogo para añadir miembro -->
      <p-dialog
        header="Añadir Miembro"
        [(visible)]="showAddMemberDialog"
        [modal]="true"
        [style]="{ width: '450px' }"
        [draggable]="false">

        <div class="p-fluid">
          <div class="field mb-4">
            <label for="email" class="font-semibold mb-2 block">Email del usuario</label>
            <input
              id="email"
              type="email"
              pInputText
              [(ngModel)]="newMemberEmail"
              placeholder="usuario@ejemplo.com">
          </div>

          <div class="field mb-4">
            <label for="role" class="font-semibold mb-2 block">Rol asignado</label>
            <p-select
              id="role"
              [(ngModel)]="newMemberRole"
              [options]="roleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar rol"
              styleClass="w-full">
            </p-select>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancelar" icon="pi pi-times" (click)="closeAddMemberDialog()" class="p-button-text"></button>
          <button pButton label="Añadir" icon="pi pi-check" (click)="addMember()" [disabled]="!newMemberEmail"></button>
        </ng-template>
      </p-dialog>

      <!-- Diálogo de permisos -->
      <p-dialog
        header="Configurar Permisos"
        [(visible)]="showPermissionsDialog"
        [modal]="true"
        [style]="{ width: '650px' }"
        [draggable]="false"
        [closable]="true"
        (onHide)="closePermissionsDialog()">

        <div *ngIf="selectedMember">
          <div class="flex items-center gap-3 mb-4 p-3 bg-gray-800 rounded-lg">
            <p-avatar
              [label]="getInitials(selectedMember.fullName)"
              styleClass="bg-primary text-white"
              shape="circle"
              size="large">
            </p-avatar>
            <div>
              <h3 class="text-lg font-semibold">{{ selectedMember.fullName }}</h3>
              <p class="text-gray-400 text-sm">{{ selectedMember.email }}</p>
            </div>
          </div>

          <div class="permissions-section max-h-[50vh] overflow-y-auto">
            <!-- Tickets Permissions -->
            <p-fieldset legend="Permisos de Tickets" [toggleable]="true" [collapsed]="false">
              <div class="grid grid-cols-2 gap-3">
                <div class="flex align-items-center">
                  <p-checkbox
                    [(ngModel)]="memberPermissions.createTicket"
                    binary="true"
                    inputId="createTicket">
                  </p-checkbox>
                  <label for="createTicket" class="ml-2">Crear Tickets</label>
                </div>
                <div class="flex align-items-center">
                  <p-checkbox
                    [(ngModel)]="memberPermissions.editTicket"
                    binary="true"
                    inputId="editTicket">
                  </p-checkbox>
                  <label for="editTicket" class="ml-2">Editar Tickets</label>
                </div>
                <div class="flex align-items-center">
                  <p-checkbox
                    [(ngModel)]="memberPermissions.deleteTicket"
                    binary="true"
                    inputId="deleteTicket">
                  </p-checkbox>
                  <label for="deleteTicket" class="ml-2">Eliminar Tickets</label>
                </div>
                <div class="flex align-items-center">
                  <p-checkbox
                    [(ngModel)]="memberPermissions.viewTicket"
                    binary="true"
                    inputId="viewTicket"
                    [disabled]="true">
                  </p-checkbox>
                  <label for="viewTicket" class="ml-2 text-gray-500">Ver Tickets (Siempre activo)</label>
                </div>
              </div>
            </p-fieldset>

            <!-- Members Permissions -->
            <p-fieldset legend="Permisos de Miembros" [toggleable]="true" [collapsed]="false" class="mt-3">
              <div class="grid grid-cols-2 gap-3">
                <div class="flex align-items-center">
                  <p-checkbox
                    [(ngModel)]="memberPermissions.addMember"
                    binary="true"
                    inputId="addMember">
                  </p-checkbox>
                  <label for="addMember" class="ml-2">Añadir Miembros</label>
                </div>
                <div class="flex align-items-center">
                  <p-checkbox
                    [(ngModel)]="memberPermissions.removeMember"
                    binary="true"
                    inputId="removeMember">
                  </p-checkbox>
                  <label for="removeMember" class="ml-2">Eliminar Miembros</label>
                </div>
                <div class="flex align-items-center">
                  <p-checkbox
                    [(ngModel)]="memberPermissions.editMemberRole"
                    binary="true"
                    inputId="editMemberRole">
                  </p-checkbox>
                  <label for="editMemberRole" class="ml-2">Editar Roles</label>
                </div>
                <div class="flex align-items-center">
                  <p-checkbox
                    [(ngModel)]="memberPermissions.viewMembers"
                    binary="true"
                    inputId="viewMembers"
                    [disabled]="true">
                  </p-checkbox>
                  <label for="viewMembers" class="ml-2 text-gray-500">Ver Miembros (Siempre activo)</label>
                </div>
              </div>
            </p-fieldset>

            <!-- Admin Permissions -->
            <p-fieldset legend="Permisos de Administración" [toggleable]="true" [collapsed]="false" class="mt-3">
              <div class="grid grid-cols-2 gap-3">
                <div class="flex align-items-center">
                  <p-checkbox
                    [(ngModel)]="memberPermissions.editGroupSettings"
                    binary="true"
                    inputId="editGroupSettings">
                  </p-checkbox>
                  <label for="editGroupSettings" class="ml-2">Editar Configuración</label>
                </div>
                <div class="flex align-items-center">
                  <p-checkbox
                    [(ngModel)]="memberPermissions.deleteGroup"
                    binary="true"
                    inputId="deleteGroup">
                  </p-checkbox>
                  <label for="deleteGroup" class="ml-2">Eliminar Grupo</label>
                </div>
                <div class="flex align-items-center">
                  <p-checkbox
                    [(ngModel)]="memberPermissions.manageGroupPrivileges"
                    binary="true"
                    inputId="manageGroupPrivileges">
                  </p-checkbox>
                  <label for="manageGroupPrivileges" class="ml-2">Gestionar Privilegios</label>
                </div>
              </div>
            </p-fieldset>
            <p-fieldset legend="Roles Predefinidos" [toggleable]="true" [collapsed]="true" class="mt-3">
              <div class="flex gap-2">
                <button pButton label="Solo Lectura" icon="pi pi-eye" (click)="setReadOnlyPermissions()" class="p-button-outlined p-button-sm"></button>
                <button pButton label="Colaborador" icon="pi pi-user" (click)="setCollaboratorPermissions()" class="p-button-outlined p-button-sm"></button>
                <button pButton label="Moderador" icon="pi pi-users" (click)="setModeratorPermissions()" class="p-button-outlined p-button-sm"></button>
                <button pButton label="Administrador" icon="pi pi-star" (click)="setAdminPermissions()" class="p-button-outlined p-button-sm"></button>
              </div>
            </p-fieldset>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <div class="flex justify-between w-full">
              <button pButton label="Cancelar" icon="pi pi-times" (click)="closePermissionsDialog()" class="p-button-text"></button>
              <button pButton label="Guardar" icon="pi pi-save" (click)="savePermissions()" severity="primary"></button>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .group-config {
      padding: 1rem;
    }

    :host ::ng-deep .p-fieldset {
      margin-bottom: 1rem;
    }

    :host ::ng-deep .p-checkbox {
      margin-right: 0.5rem;
    }

    :host ::ng-deep .p-tieredmenu {
      min-width: 200px;
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr {
      transition: background-color 0.2s;
    }

    :host ::ng-deep .p-datatable .p-datatable-tbody > tr:hover {
      background-color: var(--surface-hover);
    }

    .permissions-section {
      scrollbar-width: thin;
    }

    .permissions-section::-webkit-scrollbar {
      width: 6px;
    }

    .permissions-section::-webkit-scrollbar-track {
      background: var(--surface-border);
      border-radius: 3px;
    }

    .permissions-section::-webkit-scrollbar-thumb {
      background: var(--primary-color);
      border-radius: 3px;
    }
  `]
})
export class GroupConfigComponent implements OnInit {
  @Input() groupId!: number;
  @Input() groupInfo!: GroupData;

  private groupService = inject(GroupService);
  private userService = inject(UserService);
  private groupPermissionService = inject(GroupPermissionService);
  private alertService = inject(AlertService);
  private loadingPromises: Map<number, Promise<User | null>> = new Map();

  @ViewChild('menu') menu: any;
  @ViewChild('dt') dt: any;

  searchTerm = signal('');
  globalFilterValue: string = '';
  members = signal<User[]>([]);
  memberPermissionsMap = new Map<number, GroupPermissions>();

  showAddMemberDialog = false;
  showPermissionsDialog = false;
  newMemberEmail = '';
  newMemberRole = 'member';

  selectedMember: User | null = null;
  selectedMemberId: number | null = null;
  memberPermissions: GroupPermissions = this.getEmptyPermissions();

  currentMenuItems: MenuItem[] = [];
  private currentMember: User | null = null;

  roleOptions = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Moderador', value: 'moderator' },
    { label: 'Colaborador', value: 'collaborator' },
    { label: 'Solo Lectura', value: 'viewer' }
  ];

  ngOnInit() {
    this.loadMembers();
  }

  private async loadMembers() {
    const group = this.groupService.getAll().find(g => g.id === this.groupId);
    if (group) {
      const membersList = await Promise.all(
        group.members.map(memberId => this.getUserWithCache(memberId))
      );
      const validMembers = membersList.filter(user => user !== null) as User[];
      this.members.set(validMembers);

      for (const member of validMembers) {
        const permissions = this.groupPermissionService.getUserGroupPermissions(member.id, this.groupId);
        if (permissions) {
          this.memberPermissionsMap.set(member.id, permissions);
        }
      }
    }
  }

  private async getUserWithCache(userId: number): Promise<User | null> {
    if (this.loadingPromises.has(userId)) {
      return this.loadingPromises.get(userId)!;
    }

    const promise = this.userService.getById(userId);
    this.loadingPromises.set(userId, promise);

    try {
      const user = await promise;
      return user;
    } finally {
      this.loadingPromises.delete(userId);
    }
  }

  onGlobalFilter(table: any, event: Event) {
    const input = event.target as HTMLInputElement;
    this.globalFilterValue = input.value;
    table.filterGlobal(this.globalFilterValue, 'contains');
  }

  clearFilter(table: any) {
    this.globalFilterValue = '';
    table.filterGlobal('', 'contains');
  }

  private getEmptyPermissions(): GroupPermissions {
    return {
      createTicket: false,
      editTicket: false,
      deleteTicket: false,
      viewTicket: true,
      addMember: false,
      removeMember: false,
      editMemberRole: false,
      viewMembers: true,
      editGroupSettings: false,
      deleteGroup: false,
      manageGroupPrivileges: false
    };
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getMemberRole(userId: number): string {
    const permissions = this.memberPermissionsMap.get(userId);
    if (!permissions) return 'Miembro';

    if (permissions.manageGroupPrivileges && permissions.editGroupSettings) return 'Administrador';
    if (permissions.addMember || permissions.editMemberRole) return 'Moderador';
    if (permissions.createTicket || permissions.editTicket) return 'Colaborador';
    return 'Solo Lectura';
  }

  getRoleClass(role: string): string {
    const classes = {
      'Administrador': 'bg-purple-600 text-white',
      'Moderador': 'bg-blue-600 text-white',
      'Colaborador': 'bg-green-600 text-white',
      'Solo Lectura': 'bg-gray-500 text-white',
      'Miembro': 'bg-gray-500 text-white'
    };
    return classes[role as keyof typeof classes] || 'bg-gray-500 text-white';
  }

  isOwnerOrSelf(member: User): boolean {
    const isOwner = this.groupInfo?.authorId === member.id;
    const isCurrentUser = this.userService.currentUser()?.id === member.id;
    return isOwner || isCurrentUser;
  }

  openMenu(event: any, member: User) {
    if (!this.isOwnerOrSelf(member)) {
      this.currentMember = member;
      this.currentMenuItems = [];

      if (this.groupPermissionService.hasGroupPermission(this.groupId, 'editMemberRole')) {
        this.currentMenuItems.push({
          label: 'Editar Permisos',
          icon: 'pi pi-lock',
          command: () => {
            this.openPermissionsDialog(member);
          }
        });
      }

      if (this.groupPermissionService.hasGroupPermission(this.groupId, 'removeMember')) {
        if (this.currentMenuItems.length > 0) {
          this.currentMenuItems.push({ separator: true });
        }
        this.currentMenuItems.push({
          label: 'Expulsar del Grupo',
          icon: 'pi pi-user-minus',
          command: () => {
            this.removeMember(member);
          }
        });
      }

      if (this.menu && this.currentMenuItems.length > 0) {
        this.menu.toggle(event);
      }
    }
  }

  openPermissionsDialog(member: User) {
    this.selectedMember = member;
    this.selectedMemberId = member.id;

    const existingPermissions = this.memberPermissionsMap.get(member.id);
    if (existingPermissions) {
      this.memberPermissions = { ...existingPermissions };
    } else {
      this.memberPermissions = this.getEmptyPermissions();
    }

    this.showPermissionsDialog = true;
  }

  closePermissionsDialog() {
    this.showPermissionsDialog = false;
    this.selectedMember = null;
    this.selectedMemberId = null;
  }

  savePermissions() {
    if (this.selectedMemberId) {
      this.groupPermissionService.assignGroupPermissions(
        this.selectedMemberId,
        this.groupId,
        this.memberPermissions
      );

      this.memberPermissionsMap.set(this.selectedMemberId, { ...this.memberPermissions });

      this.alertService.success(
        'Éxito',
        'Permisos actualizados correctamente',
      );

      this.closePermissionsDialog();
      this.loadMembers();
    }
  }

  openAddMemberDialog() {
    this.newMemberEmail = '';
    this.newMemberRole = 'member';
    this.showAddMemberDialog = true;
  }

  closeAddMemberDialog() {
    this.showAddMemberDialog = false;
  }

  async addMember() {
    if (!this.newMemberEmail) {
      this.alertService.error(
        'Error',
        'Debe ingresar un email',
      );
      return;
    }

    try {
      const user = await this.userService.getByEmail(this.newMemberEmail);

      if (!user) {
        this.alertService.error(
          'Error',
          'Usuario no encontrado');
        return;
      }

      const success = await this.groupService.addMember(this.groupId, this.newMemberEmail);

      if (success) {
        // 🔥 El usuario ya lo tenemos, no necesitamos cargarlo de nuevo
        let permissions: Partial<GroupPermissions> = {};

        switch (this.newMemberRole) {
          case 'admin':
            permissions = {
              createTicket: true,
              editTicket: true,
              deleteTicket: true,
              addMember: true,
              removeMember: true,
              editMemberRole: true,
              editGroupSettings: true,
              manageGroupPrivileges: true
            };
            break;
          case 'moderator':
            permissions = {
              createTicket: true,
              editTicket: true,
              addMember: true,
              editMemberRole: true
            };
            break;
          case 'collaborator':
            permissions = {
              createTicket: true,
              editTicket: true
            };
            break;
          default:
            permissions = {};
        }

        permissions.viewTicket = true;
        permissions.viewMembers = true;

        await this.groupPermissionService.assignGroupPermissions(user.id, this.groupId, permissions);

        this.memberPermissionsMap.set(user.id, { ...this.getEmptyPermissions(), ...permissions });

        await this.loadMembers();

        this.alertService.success(
          'Éxito',
          'Miembro añadido correctamente');

        this.closeAddMemberDialog();
      } else {
        this.alertService.error('Error','No se pudo añadir el miembro');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      this.alertService.error('Error','Ocurrió un error al añadir el miembro');
    }
  }

  removeMember(member: User) {
    const success = this.groupService.removeMember(this.groupId, member.id);

    if (success) {
      this.groupPermissionService.removeUserGroupPermissions(member.id, this.groupId);
      this.memberPermissionsMap.delete(member.id);
      this.loadMembers();

      this.alertService.info('Miembro expulsado', `${member.fullName} ha sido expulsado del grupo`);
    }
  }

  setAdminPermissions() {
    this.memberPermissions = {
      createTicket: true,
      editTicket: true,
      deleteTicket: true,
      viewTicket: true,
      addMember: true,
      removeMember: true,
      editMemberRole: true,
      viewMembers: true,
      editGroupSettings: true,
      deleteGroup: true,
      manageGroupPrivileges: true
    };
  }

  setModeratorPermissions() {
    this.memberPermissions = {
      createTicket: true,
      editTicket: true,
      deleteTicket: false,
      viewTicket: true,
      addMember: true,
      removeMember: true,
      editMemberRole: true,
      viewMembers: true,
      editGroupSettings: false,
      deleteGroup: false,
      manageGroupPrivileges: false
    };
  }

  setCollaboratorPermissions() {
    this.memberPermissions = {
      createTicket: true,
      editTicket: true,
      deleteTicket: false,
      viewTicket: true,
      addMember: false,
      removeMember: false,
      editMemberRole: false,
      viewMembers: true,
      editGroupSettings: false,
      deleteGroup: false,
      manageGroupPrivileges: false
    };
  }

  setReadOnlyPermissions() {
    this.memberPermissions = {
      createTicket: false,
      editTicket: false,
      deleteTicket: false,
      viewTicket: true,
      addMember: false,
      removeMember: false,
      editMemberRole: false,
      viewMembers: true,
      editGroupSettings: false,
      deleteGroup: false,
      manageGroupPrivileges: false
    };
  }
}
