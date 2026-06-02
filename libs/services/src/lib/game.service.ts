import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { firstValueFrom } from 'rxjs';
import {
  AppUser,
  HandPointType,
  RecordHandPayload,
  RoomListItem,
  RoomState,
  SetupPlayerInput,
  TeamId,
} from '@fe/shared-types';
import { AuthService } from './auth.service';
import { getApiBaseUrl } from './app-config';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private socket: Socket;

  private get apiUrl(): string {
    return `${getApiBaseUrl()}/api/rooms`;
  }

  public roomState = signal<RoomState | null>(null);
  public roomList = signal<RoomListItem[]>([]);
  public registeredUsers = signal<AppUser[]>([]);
  public connectionError = signal<string | null>(null);
  public socketId = signal<string | null>(null);

  private activeRoomId: string | null = null;

  constructor() {
    this.socket = io(getApiBaseUrl(), { autoConnect: false });
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      this.socketId.set(this.socket.id ?? null);
      this.rejoinActiveRoomIfNeeded();
    });

    this.socket.on('disconnect', () => {
      this.socketId.set(null);
    });

    this.socket.on('roomStateUpdated', (state: RoomState) => {
      this.roomState.set(state);
      this.connectionError.set(null);
      if (state.hostToken && this.isHost(state)) {
        this.saveHostToken(state.roomId, state.hostToken);
      }
    });

    this.socket.on('error', (err: { message?: string }) => {
      this.connectionError.set(err.message || 'خطایی رخ داد');
    });
  }

  private hostTokenKey(roomId: string): string {
    return `hokm_host_${roomId}`;
  }

  getHostToken(roomId: string): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.hostTokenKey(roomId));
  }

  saveHostToken(roomId: string, token: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.hostTokenKey(roomId), token);
  }

  isHost(state: RoomState | null): boolean {
    if (!state) return false;
    const me = this.auth.currentUser();
    if (!me) return false;
    const socketMatch = !!(state.hostId && this.socketId() && state.hostId === this.socketId());
    const userMatch = state.hostUserId === me.id;
    const tokenMatch =
      !!state.hostToken &&
      !!this.getHostToken(state.roomId) &&
      state.hostToken === this.getHostToken(state.roomId);
    return socketMatch || userMatch || tokenMatch;
  }

  canReclaimHost(state: RoomState | null): boolean {
    if (!state) return false;
    const me = this.auth.currentUser();
    if (!me) return false;
    return state.hostUserId === me.id || !!this.getHostToken(state.roomId);
  }

  async fetchRoomState(roomId: string): Promise<RoomState> {
    const state = await firstValueFrom(
      this.http.get<RoomState>(`${this.apiUrl}/${roomId}`, { headers: this.auth.authHeaders() }),
    );
    this.roomState.set(state);
    return state;
  }

  async fetchRoomList(): Promise<RoomListItem[]> {
    const list = await firstValueFrom(
      this.http.get<RoomListItem[]>(this.apiUrl, { headers: this.auth.authHeaders() }),
    );
    this.roomList.set(list);
    return list;
  }

  async fetchRegisteredUsers(): Promise<AppUser[]> {
    const users = await this.auth.listUsers();
    this.registeredUsers.set(users);
    return users;
  }

  async createRoomAPI(gameType: string): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<{ roomId: string }>(
        this.apiUrl,
        { gameType },
        { headers: this.auth.authHeaders() },
      ),
    );
    return response.roomId;
  }

  private rejoinActiveRoomIfNeeded(): void {
    const token = this.auth.getToken();
    const roomId = this.activeRoomId;
    if (!token || !roomId) return;

    this.socket.emit('joinRoom', {
      roomId,
      token,
      hostToken: this.getHostToken(roomId) ?? undefined,
    });
  }

  joinRoom(roomId: string) {
    const token = this.auth.getToken();
    if (!token) {
      this.connectionError.set('ابتدا وارد حساب کاربری شوید');
      return;
    }
    this.activeRoomId = roomId;

    if (!this.socket.connected) {
      this.socket.connect();
    } else {
      this.rejoinActiveRoomIfNeeded();
    }
  }

  leaveRoom(): void {
    this.activeRoomId = null;
  }

  setupPlayers(roomId: string, players: SetupPlayerInput[], hakemIndex: number) {
    this.socket.emit('setupPlayers', { roomId, players, hakemIndex });
  }

  setHakem(roomId: string, playerId: string) {
    this.socket.emit('setHakem', { roomId, playerId });
  }

  setHokm(roomId: string, hokm: string) {
    this.socket.emit('setHokm', { roomId, hokm });
  }

  recordHand(roomId: string, pointType: HandPointType, options: { teamId?: TeamId; playerId?: string }) {
    const payload: RecordHandPayload = { roomId, pointType, ...options };
    this.socket.emit('recordHand', payload);
  }

  recordNormalHand(roomId: string, teamId: TeamId) {
    this.recordHand(roomId, 'NORMAL', { teamId });
  }

  recordKet(roomId: string, playerId: string) {
    this.recordHand(roomId, 'KET', { playerId });
  }

  confirmSetNext(roomId: string) {
    this.socket.emit('confirmSetNext', { roomId });
  }

  undoLastScore(roomId: string) {
    this.socket.emit('undoLastScore', { roomId });
  }
}
