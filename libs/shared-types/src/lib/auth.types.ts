export type UserRole = 'admin' | 'player';

export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export interface AdminUserDetail extends AppUser {
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDto {
  displayName?: string;
  role?: UserRole;
  password?: string;
}

export interface AuthResponse {
  token: string;
  user: AppUser;
}

export interface RegisterDto {
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginDto {
  username: string;
  password: string;
}
