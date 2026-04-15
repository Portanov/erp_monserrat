import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GatewayBaseService } from '../gateway-base/gateway.service';
import { LoginRequest, LoginResponse, RegisterRequest } from '../../models/user/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends GatewayBaseService {

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await firstValueFrom(
      this.post<LoginResponse>('/rest/auth/login', credentials, false)
    );
    return response;
  }

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await firstValueFrom(
      this.post<LoginResponse>('/rest/auth/register', userData, false)
    );
    return response;
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
