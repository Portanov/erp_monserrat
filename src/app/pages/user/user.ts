import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { UserService, UserData } from '../../services/user/user.service';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { PasswordModule } from 'primeng/password';
import { InputMaskModule } from 'primeng/inputmask';
import { DatePickerModule } from 'primeng/datepicker';
import { StepperModule } from 'primeng/stepper';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PermissionService, PagePermissions, PageConfig } from '../../services/permissions/permissions.service';
import { ToggleSwitchChangeEvent } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { AlertService } from '../../services/alerts/alert.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { FieldsetModule } from 'primeng/fieldset';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-user',
  imports: [
    CommonModule,
    PanelMenuModule,
    ButtonModule,
    FormsModule,
    SelectModule,
    TableModule,
    TagModule,
    InputTextModule,
    RippleModule,
    DialogModule,
    InputNumberModule,
    PasswordModule,
    InputMaskModule,
    DatePickerModule,
    StepperModule,
    ToggleSwitchModule,
    TooltipModule,
    HasPermissionDirective,
    FieldsetModule,
    CheckboxModule
  ],
  templateUrl: './user.html',
  styleUrl: './user.css'
})
export class User implements OnInit {
  private userService = inject(UserService);
  private permissionService = inject(PermissionService);
  private alertService = inject(AlertService);

  items: MenuItem[] = [];
  users: UserData[] = [];
  statuses = [
    { label: 'Activo', value: 'Activo' },
    { label: 'Inactivo', value: 'Inactivo' }
  ];
  roles = [
    { label: 'Administrador', value: 'Administrador' },
    { label: 'Usuario', value: 'Usuario' }
  ];
  clonedUsers: { [s: string]: UserData } = {};
  createdVisible: boolean = false;
  isEditing: boolean = false;
  editingUserId: number | null = null;
  activeStep: number = 1;
  currentUser = this.userService.currentUser;
  currentUserId = computed(() => this.currentUser()?.id);

  pages: PageConfig[] = [];

  userPermissions: { [page: string]: PagePermissions } = {};

  newUser: UserData = {
    id: 0,
    username: '',
    email: '',
    fullName: '',
    password: '',
    phone: '',
    address: '',
    birthDate: null,
    registeredDate: '',
    role: 'Usuario',
    status: 'Activo'
  };

  hasPermission(page: string, action: string): boolean {
    return this.permissionService.hasPermission(page, action);
  }

  getInitials(username: string): string {
    if (!username || username === 'NuevoUsuario') return 'NU';
    return username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  ngOnInit() {
    this.items = [
      { label: 'Añadir Usuario', icon: 'pi pi-plus', command: () => this.openCreateDialog() },
    ];
    this.pages = this.permissionService.getPagesConfig();
    this.loadUsers();
  }

  openCreateDialog() {
    this.isEditing = false;
    this.editingUserId = null;
    this.createdVisible = true;
    this.activeStep = 1;
    this.newUser = {
      id: 0,
      username: '',
      email: '',
      fullName: '',
      password: '',
      phone: '',
      address: '',
      birthDate: null,
      registeredDate: '',
      role: 'Usuario',
      status: 'Activo'
    };
    this.initializeDefaultPermissions();
  }

  editUser(user: UserData) {
    this.isEditing = true;
    this.editingUserId = user.id;
    this.createdVisible = true;
    this.activeStep = 1;
    this.newUser = { ...user };
    this.loadUserPermissions(user.id);
  }

  initializeDefaultPermissions() {
    this.userPermissions = {};
    this.pages.forEach(page => {
      const pagePermissions: PagePermissions = {};
      page.permissions.forEach(permission => {
        pagePermissions[permission] = false;
      });
      this.userPermissions[page.name] = pagePermissions;
    });
  }

  loadUserPermissions(userId: number) {
    const existingPermissions = this.permissionService.getUserPermissions(userId);
    if (existingPermissions) {
      this.userPermissions = { ...existingPermissions };
    } else {
      this.initializeDefaultPermissions();
    }
  }

  onPermissionChange(page: string, permission: string, event: ToggleSwitchChangeEvent) {
    const value = event.checked;
    if (permission === 'view' && value === false) {
      const pagePermissions: PagePermissions = {};
      this.pages.find(p => p.name === page)?.permissions.forEach(perm => {
        pagePermissions[perm] = false;
      });
      this.userPermissions[page] = pagePermissions;
    }
    else if (permission !== 'view' && value === true) {
      this.userPermissions[page] = {
        ...this.userPermissions[page],
        [permission]: true,
        view: true
      };
    }
    else {
      this.userPermissions[page] = {
        ...this.userPermissions[page],
        [permission]: value
      };
    }
  }

  isPermissionDisabled(page: string, permission: string): boolean {
    if (permission === 'view') return false;
    return !this.userPermissions[page]?.['view'];
  }

  getAvailablePermissions(pageName: string): string[] {
    return this.permissionService.getAvailablePermissions(pageName);
  }

  getPermissionLabel(permission: string): string {
    const labels: { [key: string]: string } = {
      'view': 'Ver',
      'create': 'Crear',
      'edit': 'Editar',
      'delete': 'Eliminar',
      'editState': 'Editar Estado',
      'manageMembers': 'Gestionar Miembros',
      'resetPassword': 'Resetear Password'
    };
    return labels[permission] || permission;
  }

  loadUsers() {
    this.users = this.userService.getAll();
  }

  getSeverity(status: string) {
    switch (status) {
      case 'Activo':
        return 'success';
      case 'Inactivo':
        return 'danger';
      default:
        return 'info';
    }
  }

  onRowEditInit(user: UserData) {
    this.clonedUsers[user.username] = { ...user };
  }

  onRowEditSave(user: UserData) {
    if (user.username && user.email && user.fullName) {
      this.userService.update(user);
      delete this.clonedUsers[user.username];
      this.loadUsers();
      this.alertService.success('Éxito', 'Usuario actualizado correctamente');
    }
  }

  onRowEditCancel(user: UserData, index: number) {
    this.users[index] = this.clonedUsers[user.username];
    delete this.clonedUsers[user.username];
  }

  deleteUser(username: string) {
    const userToDelete = this.users.find(u => u.username === username);
    if (userToDelete) {
      this.userService.delete(username);
      this.permissionService.removeUser(userToDelete.id);
      this.loadUsers();
      this.alertService.success('Éxito', 'Usuario eliminado correctamente');
    }
  }

  saveUser() {
    if (this.isEditing && this.editingUserId) {
      const updatedUser = this.userService.update(this.newUser);
      if (updatedUser) {
        // Guardar todos los permisos
        Object.keys(this.userPermissions).forEach(page => {
          this.permissionService.assignPermissions(
            this.editingUserId!,
            page,
            this.userPermissions[page]
          );
        });
        this.loadUsers();
        this.createdVisible = false;
        this.alertService.success('Éxito', 'Usuario y permisos actualizados correctamente');
      } else {
        this.alertService.error('Error', 'Error al actualizar el usuario');
      }
    } else {
      if (this.userService.register(this.newUser)) {
        const newUser = this.userService.getByUsername(this.newUser.username);
        if (newUser) {
          Object.keys(this.userPermissions).forEach(page => {
            this.permissionService.assignPermissions(
              newUser.id,
              page,
              this.userPermissions[page]
            );
          });
        }
        this.loadUsers();
        this.createdVisible = false;
        this.alertService.success('Éxito', 'Usuario creado correctamente');
      } else {
        this.alertService.error('Error', 'Error al crear el usuario. Verifique que el username y email no existan');
      }
    }
  }

  closeCreateDialog() {
    this.createdVisible = false;
  }

  updateUserStatus(user: UserData) {
    this.userService.update(user);
    this.alertService.success('Éxito', 'Estado del usuario actualizado correctamente');
  }

  onStatusEditComplete(event: any, user: UserData) {
    this.updateUserStatus(user);
  }
}
