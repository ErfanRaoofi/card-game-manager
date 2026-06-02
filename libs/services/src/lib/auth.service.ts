import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  AdminUserDetail,
  AppUser,
  AuthResponse,
  RoomListItem,
  UpdateUserDto,
} from '@fe/shared-types';
import { getApiUrl } from './app-config';

const TOKEN_KEY = 'hokm_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private get apiUrl(): string {
    return getApiUrl('/api');
  }

  public currentUser = signal<AppUser | null>(null);
  public sessionReady = signal(false);
  public isAdmin = computed(() => this.currentUser()?.role === 'admin');

  async initSession(): Promise<void> {
    if (typeof localStorage === 'undefined') {
      this.sessionReady.set(true);
      return;
    }
    const token = this.getToken();
    if (!token) {
      this.sessionReady.set(true);
      return;
    }
    await this.loadSession();
    this.sessionReady.set(true);
  }

  async ensureSession(): Promise<void> {
    if (!this.sessionReady()) {
      await this.initSession();
    }
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  authHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  async register(username: string, password: string, displayName?: string): Promise<AuthResponse> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, {
        username,
        password,
        displayName,
      }),
    );
    this.applyAuth(res);
    return res;
  }

  async registerPlayerForRoom(
    username: string,
    displayName?: string,
    password?: string,
  ): Promise<AppUser> {
    return firstValueFrom(
      this.http.post<AppUser>(
        `${this.apiUrl}/auth/register-player`,
        {
          username,
          password: password || username,
          displayName,
        },
        { headers: this.authHeaders() },
      ),
    );
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { username, password }),
    );
    this.applyAuth(res);
    return res;
  }

  async loadSession(): Promise<AppUser | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      const user = await firstValueFrom(
        this.http.get<AppUser>(`${this.apiUrl}/auth/me`, { headers: this.authHeaders() }),
      );
      this.currentUser.set(user);
      return user;
    } catch {
      this.logout();
      return null;
    }
  }

  async updateMyCredentials(dto: {
    username?: string;
    password?: string;
    displayName?: string;
  }): Promise<AppUser> {
    const user = await firstValueFrom(
      this.http.patch<AppUser>(`${this.apiUrl}/auth/me`, dto, {
        headers: this.authHeaders(),
      }),
    );
    this.currentUser.set(user);
    return user;
  }

  async listUsers(): Promise<AppUser[]> {
    return firstValueFrom(
      this.http.get<AppUser[]>(`${this.apiUrl}/users`, { headers: this.authHeaders() }),
    );
  }

  async adminListUsers(): Promise<AdminUserDetail[]> {
    return firstValueFrom(
      this.http.get<AdminUserDetail[]>(`${this.apiUrl}/admin/users`, {
        headers: this.authHeaders(),
      }),
    );
  }

  async adminUpdateUser(id: string, dto: UpdateUserDto): Promise<AdminUserDetail> {
    return firstValueFrom(
      this.http.patch<AdminUserDetail>(`${this.apiUrl}/admin/users/${id}`, dto, {
        headers: this.authHeaders(),
      }),
    );
  }

  async adminDeleteUser(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/admin/users/${id}`, { headers: this.authHeaders() }),
    );
  }

  async adminListRooms(): Promise<RoomListItem[]> {
    return firstValueFrom(
      this.http.get<RoomListItem[]>(`${this.apiUrl}/admin/rooms`, {
        headers: this.authHeaders(),
      }),
    );
  }

  async adminDeleteRoom(roomId: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/admin/rooms/${roomId}`, {
        headers: this.authHeaders(),
      }),
    );
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    this.currentUser.set(null);
  }

  private applyAuth(res: AuthResponse): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, res.token);
    }
    this.currentUser.set(res.user);
    this.sessionReady.set(true);
  }
}
