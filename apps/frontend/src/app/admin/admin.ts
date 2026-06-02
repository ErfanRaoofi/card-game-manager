import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@fe/services';
import { AdminUserDetail, RoomListItem, UserRole } from '@fe/shared-types';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin implements OnInit {
  auth = inject(AuthService);

  tab = signal<'users' | 'rooms'>('users');
  users = signal<AdminUserDetail[]>([]);
  rooms = signal<RoomListItem[]>([]);
  usersSearch = signal('');
  roomsSearch = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  filteredUsers = computed(() => {
    const q = this.usersSearch().trim().toLowerCase();
    const list = this.users();
    if (!q) return list;
    return list.filter((u) =>
      `${u.displayName} ${u.username} ${u.role}`.toLowerCase().includes(q),
    );
  });

  filteredRooms = computed(() => {
    const q = this.roomsSearch().trim().toLowerCase();
    const list = this.rooms();
    if (!q) return list;
    return list.filter((r) =>
      `${r.roomId} ${r.gameType} ${r.status} ${r.hostUsername ?? ''} ${r.playerNames.join(' ')}`.toLowerCase().includes(q),
    );
  });

  editUserId = signal<string | null>(null);
  editDisplayName = '';
  editRole: UserRole = 'player';
  editPassword = '';

  ngOnInit(): void {
    void this.loadUsers();
  }

  setTab(t: 'users' | 'rooms') {
    this.tab.set(t);
    this.error.set(null);
    if (t === 'users') void this.loadUsers();
    else void this.loadRooms();
  }

  async loadUsers() {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.users.set(await this.auth.adminListUsers());
    } catch (e: unknown) {
      this.error.set(this.formatError(e));
    } finally {
      this.loading.set(false);
    }
  }

  async loadRooms() {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.rooms.set(await this.auth.adminListRooms());
    } catch (e: unknown) {
      this.error.set(this.formatError(e));
    } finally {
      this.loading.set(false);
    }
  }

  startEdit(u: AdminUserDetail) {
    this.editUserId.set(u.id);
    this.editDisplayName = u.displayName;
    this.editRole = u.role;
    this.editPassword = '';
  }

  cancelEdit() {
    this.editUserId.set(null);
  }

  async saveUser() {
    const id = this.editUserId();
    if (!id) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const dto: { displayName: string; role: UserRole; password?: string } = {
        displayName: this.editDisplayName,
        role: this.editRole,
      };
      if (this.editPassword.trim()) dto.password = this.editPassword;
      const updated = await this.auth.adminUpdateUser(id, dto);
      this.users.update((list) => list.map((u) => (u.id === id ? updated : u)));
      if (this.auth.currentUser()?.id === id) {
        await this.auth.loadSession();
      }
      this.cancelEdit();
    } catch (e: unknown) {
      this.error.set(this.formatError(e));
    } finally {
      this.loading.set(false);
    }
  }

  async deleteUser(id: string, username: string) {
    if (!confirm(`حذف کاربر «${username}»؟`)) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.adminDeleteUser(id);
      this.users.update((list) => list.filter((u) => u.id !== id));
    } catch (e: unknown) {
      this.error.set(this.formatError(e));
    } finally {
      this.loading.set(false);
    }
  }

  async deleteRoom(roomId: string) {
    if (!confirm(`حذف اتاق ${roomId.slice(0, 8)}…؟`)) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.adminDeleteRoom(roomId);
      this.rooms.update((list) => list.filter((r) => r.roomId !== roomId));
    } catch (e: unknown) {
      this.error.set(this.formatError(e));
    } finally {
      this.loading.set(false);
    }
  }

  private formatError(e: unknown): string {
    const err = e as { error?: { message?: string | string[] }; message?: string };
    const msg = err.error?.message;
    return Array.isArray(msg) ? msg.join('، ') : msg || err.message || 'خطا';
  }
}
