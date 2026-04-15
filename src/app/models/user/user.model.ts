export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  birthDate?: string | null;
  status?: boolean;
  created_at?: string;
}

export interface UserWithPass {
  id: number;
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
  birthDate?: string | null;
  status?: boolean;
  created_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  username: string;
  phone: string;
  address: string;
  birthDate: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface UpdateUserRequest {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  birthDate?: string | null;
  status?: boolean;
}



