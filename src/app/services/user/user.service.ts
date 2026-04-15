import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { GatewayBaseService } from '../gateway-base/gateway.service';
import { User, RegisterRequest, UpdateUserRequest, LoginRequest } from '../../models/user/user.model';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService extends GatewayBaseService {
  private router = inject(Router);
  private authService = inject(AuthService);

  private currentUserSignal = signal<User | null>(null);
  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor() {
    super();
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSignal.set(user);
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
        localStorage.removeItem('user');
      }
    }
  }

  /**
   * Obtiene todos los usuarios del backend
   */
  async getAll(): Promise<User[]> {
    try {
      return await firstValueFrom(this.get<User[]>('/users'));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  async getById(id: number): Promise<User | null> {
    try {
      return await firstValueFrom(this.get<User>(`/users/${id}`));
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return null;
    }
  }

  /**
   * Sirve para encontrar al usuario
   */
  async findById(id: number): Promise<User | null> {
    try {
      return await firstValueFrom(this.get<User>(`/users/find/${id}`));
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return null;
    }
  }

  /**
   * Sirve para encontrar al usuario de forma publica
   */
  async getPublicUser(id: number): Promise<User | null> {
    try {
      return await firstValueFrom(this.get<User>(`/users/public/${id}`));
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return null;
    }
  }

  /**
   * Obtiene un usuario por username
   */
  async getByUsername(username: string): Promise<User | null> {
    try {
      return await firstValueFrom(this.get<User>(`/users/username/${username}`));
    } catch (error) {
      console.error(`Error fetching user ${username}:`, error);
      return null;
    }
  }

  /**
   * Obtiene un usuario por email
   */
  async getByEmail(email: string): Promise<User | null> {
    try {
      return await firstValueFrom(this.get<User>(`/users/email/${email}`));
    } catch (error) {
      console.error(`Error fetching user ${email}:`, error);
      return null;
    }
  }

  /**
   * Registra un nuevo usuario (usa AuthService)
   */
  async register(userData: RegisterRequest): Promise<boolean> {
    try {
      const response = await this.authService.register({
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
        username: userData.username,
        phone: userData.phone,
        address: userData.address,
        birthDate: userData.birthDate
      });

      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  }

  /**
   * Actualiza un usuario
   */
  async update(id: number, userData: UpdateUserRequest): Promise<User | null> {
    try {
      const updatedUser = await firstValueFrom(this.put<User>(`/users/${id}`, userData));

      const current = this.currentUserSignal();
      if (current && current.id === id) {
        const newCurrent = { ...current, ...updatedUser };
        this.currentUserSignal.set(newCurrent);
        localStorage.setItem('user', JSON.stringify(newCurrent));
      }

      return updatedUser;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      return null;
    }
  }

  /***
   * Actualiza el estado de un usuario (activo/inactivo)
   */
  async updateStatus(id: number, status: boolean): Promise<User | null> {
    try {
      const updatedUser = await firstValueFrom(this.patch<User>(`/users/${id}/status`, { status }));

      return updatedUser;
    } catch (error) {
      console.error(`Error updating status for user ${id}:`, error);
      return null;
    }
  }

  /**
   * Elimina un usuario
   */
  async deleteUser(username: string): Promise<boolean> {
    try {
      await firstValueFrom(this.delete(`/users/username/${username}`));

      const current = this.currentUserSignal();
      if (current && current.username === username) {
        this.logout();
      }

      return true;
    } catch (error) {
      console.error(`Error deleting user ${username}:`, error);
      return false;
    }
  }

  /**
   * Login
   */
  async login(dto: LoginRequest): Promise<boolean> {
    try {
      const response = await this.authService.login(dto);

      const userData: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        fullName: response.user.fullName,
        phone: '',
        address: '',
        birthDate: null,
        status: true,
        created_at: new Date().toISOString()
      };

      const token = response.token;

      this.currentUserSignal.set(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('access_token', token);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  /**
   * Carga el usuario completo desde el backend después del login
   */
  async loadFullUserProfile(userId: number): Promise<void> {
    try {
      const fullUser = await this.getById(userId);
      if (fullUser) {
        this.currentUserSignal.set(fullUser);
        localStorage.setItem('user', JSON.stringify(fullUser));
      }
    } catch (error) {
      console.error('Error loading full user profile:', error);
    }
  }

  /**
   * Logout
   */
  logout(): void {
    this.authService.logout();
    this.currentUserSignal.set(null);
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }

  /**
   * Obtiene el usuario actual (síncrono)
   */
  getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  /**
   * Reescribe la información
   * @param user
   */
  setCurrentUser(user: User | null): void {
    this.currentUserSignal.set(user);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }


  /**
   * Verifica si un teléfono es válido
   */
  private isPhoneValid(phone: string): boolean {
    return /^\d{10}$/.test(phone);
  }

  /**
   * Valida teléfono (método público)
   */
  validatePhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    return this.isPhoneValid(cleanPhone);
  }

}
