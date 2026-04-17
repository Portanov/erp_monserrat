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
import { UserService } from '../../services/user/user.service';
import { User as UserData, UserWithPass } from '../../models/user/user.model';
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
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
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

  newUser = {
    id: 0,
    username: '',
    email: '',
    fullName: '',
    password: '',
    phone: '',
    address: '',
    birthDate: null as Date | null,
    created_at: '',
    status: true
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
      created_at: '',
      status: true
    };
    this.initializeDefaultPermissions();
  }

  editUser(user: UserData) {
    this.isEditing = true;
    this.editingUserId = user.id;
    this.createdVisible = true;
    this.activeStep = 1;
    this.newUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      password: '',
      phone: user.phone || '',
      address: user.address || '',
      birthDate: user.birthDate ? new Date(user.birthDate) : null,
      created_at: user.created_at || '',
      status: user.status || false,
    };
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

  async loadUserPermissions(userId: number) {
    const existingPermissions = await this.permissionService.getUserPermissions(userId);
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
      'editState': 'Editar Estado'
    };
    return labels[permission] || permission;
  }

  async loadUsers() {
    try {
      this.users = await this.userService.getAll();
    } catch (error) {
      console.error('Error loading users:', error);
      this.alertService.error('Error', 'No se pudieron cargar los usuarios');
    }
  }

  getSeverity(status: boolean) {
    return status ? 'success' : 'danger';
  }

  getStatusLabel(status: boolean): string {
    return status ? 'Activo' : 'Inactivo';
  }

  onRowEditInit(user: UserData) {
    this.clonedUsers[user.username] = { ...user };
  }

  onRowEditCancel(user: UserData, index: number) {
    this.users[index] = this.clonedUsers[user.username];
    delete this.clonedUsers[user.username];
  }

  async deleteUser(username: string) {
    const userToDelete = this.users.find(u => u.username === username);
    if (userToDelete) {
      const success = await this.userService.deleteUser(username);
      if (success) {
        await this.permissionService.removeUserPermissions(userToDelete.id);
        await this.loadUsers();
        this.alertService.success('Éxito', 'Usuario eliminado correctamente');
      } else {
        this.alertService.error('Error', 'Error al eliminar el usuario');
      }
    }
  }

  async saveUser() {
    if (this.isEditing && this.editingUserId) {
      const updatedUser = await this.userService.update(this.editingUserId, {
        id: this.editingUserId,
        username: this.newUser.username,
        fullName: this.newUser.fullName,
        email: this.newUser.email,
        phone: this.newUser.phone,
        address: this.newUser.address,
        birthDate: this.newUser.birthDate?.toISOString(),
        status: this.newUser.status
      });

      if (updatedUser) {
        // Guardar todos los permisos
        for (const [page, pagePermissions] of Object.entries(this.userPermissions)) {
          for (const [action, isActive] of Object.entries(pagePermissions)) {
            await this.permissionService.assignPermission(
              this.editingUserId,
              page,
              action,
              isActive || false
            );
          }
        }
        await this.loadUsers();
        this.createdVisible = false;
        this.alertService.success('Éxito', 'Usuario y permisos actualizados correctamente');
      } else {
        this.alertService.error('Error', 'Error al actualizar el usuario');
      }
    } else {
      const success = await this.userService.register({
        username: this.newUser.username,
        email: this.newUser.email,
        password: this.newUser.password,
        fullName: this.newUser.fullName,
        phone: this.newUser.phone,
        address: this.newUser.address,
        birthDate: this.newUser.birthDate?.toISOString().split('T')[0] || ''
      });

      if (success) {
        const newUser = await this.userService.getByUsername(this.newUser.username);
        if (newUser) {
          // Initialize user permissions in backend
          await this.permissionService.initializeUserPermissions(newUser.id);

          // Assign selected permissions
          for (const [page, pagePermissions] of Object.entries(this.userPermissions)) {
            for (const [action, isActive] of Object.entries(pagePermissions)) {
              if (isActive) {
                await this.permissionService.assignPermission(
                  newUser.id,
                  page,
                  action,
                  true
                );
              }
            }
          }
        }
        await this.loadUsers();
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

  async updateUserStatus(user: UserData) {
    const updated = await this.userService.updateStatus(user.id, user.status || false);
    if (updated) {
      this.alertService.success('Éxito', 'Estado del usuario actualizado correctamente');
    }
  }

  onStatusEditComplete(event: any, user: UserData) {
    this.updateUserStatus(user);
  }
}