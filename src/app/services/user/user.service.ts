import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

export interface UserData {
  id: number;
  username: string;
  email: string;
  fullName: string;
  password: string;
  phone: string;
  address: string;
  birthDate: Date | null;
  registeredDate: string;
  role: string;
  status: string;
}


@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users: UserData[] = [
    {
      id: 1,
      username: 'admin',
      email: 'pollo@example.com',
      fullName: 'Carlos Martínez López',
      password: 'pattern123@',
      phone: '5512345678',
      address: 'Av. Revolución 123, CDMX',
      birthDate: new Date(1990, 2, 15),
      registeredDate: '01/01/2024',
      role: 'Administrador',
      status: 'Activo'
    },
    {
      id: 2,
      username: 'usuario',
      email: 'pollodos@example.com',
      fullName: 'María García Pérez',
      password: 'pattern123@',
      phone: '5598765432',
      address: 'Calle Reforma 456, CDMX',
      birthDate: new Date(1995, 7, 20),
      registeredDate: '15/06/2024',
      role: 'Usuario',
      status: 'Activo'
    }
  ];

  currentUser = signal<UserData | null>(null);
  private router = inject(Router);

  getAll(): UserData[] {
    return [...this.users];
  }

  private isPhoneValid(phone: string): boolean {
    return /^\d{10}$/.test(phone);
  }

  register(user: Omit<UserData, 'registeredDate' | 'status' | 'id'>): boolean {
    const exists = this.users.some(u => u.username === user.username || u.email === user.email);
    if (exists) return false;
    if (user.phone) {
      const cleanPhone = user.phone.replace(/\D/g, '');
      if (!this.isPhoneValid(cleanPhone)) return false;
    }
    this.users.push({
      ...user,
      registeredDate: new Date().toLocaleDateString('es-MX'),
      status: 'Activo',
      id: this.users.length ? Math.max(...this.users.map(u => u.id)) + 1 : 1
    });
    return true;
  }

  update(user: UserData): boolean {
    const index = this.users.findIndex(u => u.username === user.username);
    if (index === -1) return false;
    if (user.phone) {
      const cleanPhone = user.phone.replace(/\D/g, '');
      if (!this.isPhoneValid(cleanPhone)) return false;
    }
    this.users[index] = { ...user };
    const cur = this.currentUser();
    if (cur && cur.username === user.username) this.currentUser.set({ ...user });
    return true;
  }

    getByUsername(username: string): UserData | undefined {
      const found = this.users.find(u => u.username === username);
      return found ? { ...found } : undefined;
    }

    delete (username: string): boolean {
      const idx = this.users.findIndex(u => u.username === username);
      if (idx === -1) return false;
      const removed = this.users.splice(idx, 1);
      const cur = this.currentUser();
      if (cur && cur.username === username) this.logout();
      return removed.length > 0;
    }

    login(identifier: string, password: string): boolean {
      const user = this.users.find(u => (u.username === identifier || u.email === identifier) && u.password === password);
      if (!user) return false;
      this.currentUser.set({ ...user });
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    }

    logout() {
      this.currentUser.set(null);
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    }

    getCurrentUser(): UserData | null {
      localStorage.getItem('user') && this.currentUser.set(JSON.parse(localStorage.getItem('user')!));
      return this.currentUser();
    }

    isAuthenticated(): boolean {
      return !!localStorage.getItem('user');
    }
  }
