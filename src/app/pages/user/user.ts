import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { UserService, UserData } from '../../services/user/user.service';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { PasswordModule } from 'primeng/password';
import { InputMaskModule } from 'primeng/inputmask'
import { DatePickerModule } from 'primeng/datepicker';

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
    ToastModule,
    InputTextModule,
    RippleModule,
    DialogModule,
    InputNumberModule,
    PasswordModule,
    InputMaskModule,
    DatePickerModule
  ],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User implements OnInit {
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

  constructor(private userService: UserService) { }

  ngOnInit() {
    this.items = [
      { label: 'Añadir Usuario', icon: 'pi pi-plus', command: () => this.openCreateDialog() },
    ];
    this.loadUsers();
  }

  openCreateDialog() {
    this.createdVisible = true;
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
    }
  }

  onRowEditCancel(user: UserData, index: number) {
    this.users[index] = this.clonedUsers[user.username];
    delete this.clonedUsers[user.username];
  }

  deleteUser(username: string) {
    this.userService.delete(username);
    this.loadUsers();
  }

  saveUser() {
    if (this.userService.register(this.newUser)) {
      this.loadUsers();
      this.createdVisible = false;
    }
  }

  closeCreateDialog() {
    this.createdVisible = false;
  }
}
