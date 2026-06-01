import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, GameService } from '@fe/services';
import {
  getHokmHandPoints,
  HOKM_SCORING,
  HOKM_ALL_CHOICES,
  HOKM_SPECIAL_CHOICES,
  HOKM_SUIT_CHOICES,
  RoomListItem,
  RoomState,
  RoomStatus,
  TeamId,
} from '@fe/shared-types';

interface PlayerDraft {
  appUserId: string;
  team: TeamId;
  isHakem: boolean;
}

@Component({
  selector: 'lib-room',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './room.html',
  styleUrl: './room.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Room implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  public gameService = inject(GameService);
  public authService = inject(AuthService);

  constructor() {
    effect(() => {
      const state = this.roomState();
      if (state?.players.length) {
        this.syncDraftsFromState(state);
      }
    });
  }

  readonly scoring = HOKM_SCORING;
  /** اسلات‌های چوب کبریت امتیاز دست (۰ تا ۶) */
  readonly handChalkSlots = Array.from({ length: HOKM_SCORING.HANDS_TO_WIN_SET }, (_, i) => i);

  public roomId = signal<string>('');
  public gameType = signal<'hokm' | 'shelem' | '11tayi'>('hokm');
  public isConnected = signal<boolean>(false);
  /** انتخاب حکم — مقدار معمولی (نه signal) برای binding در UI */
  public selectedHokm = 'پیک';
  readonly hokmSuits = [...HOKM_SUIT_CHOICES];
  readonly hokmSpecial = [...HOKM_SPECIAL_CHOICES];
  readonly allHokmChoices = [...HOKM_ALL_CHOICES];

  public playerDrafts: PlayerDraft[] = [
    { appUserId: '', team: 'team1', isHakem: true },
    { appUserId: '', team: 'team1', isHakem: false },
    { appUserId: '', team: 'team2', isHakem: false },
    { appUserId: '', team: 'team2', isHakem: false },
  ];

  public roomState = this.gameService.roomState;
  public roomList = this.gameService.roomList;
  public registeredUsers = this.gameService.registeredUsers;
  public error = this.gameService.connectionError;
  public isLoadingRooms = signal(false);

  public currentUser = this.authService.currentUser;
  public isHost = computed(() => this.gameService.isHost(this.roomState()));

  public team1Players = computed(() => {
    const state = this.roomState();
    return state ? state.players.filter((p) => p.team === 'team1') : [];
  });

  public team2Players = computed(() => {
    const state = this.roomState();
    return state ? state.players.filter((p) => p.team === 'team2') : [];
  });

  public canScore = computed(() => {
    const state = this.roomState();
    return (
      this.isHost() &&
      state?.status === 'PLAYING' &&
      !!state.hokm &&
      !state.pendingSetCelebration &&
      state.players.length === 4
    );
  });

  public canUndoScore = computed(() => {
    const state = this.roomState();
    return (
      this.isHost() &&
      state?.status === 'PLAYING' &&
      (state.scoreUndoHistory?.length ?? 0) > 0
    );
  });

  getSetupValidationError(): string | null {
    const users = this.registeredUsers();
    if (users.length < 4) {
      return `حداقل ۴ کاربر در سیستم لازم است (فعلاً ${users.length} نفر). از ثبت‌نام، کاربران بیشتری بسازید.`;
    }
    const ids = this.playerDrafts.map((d) => d.appUserId);
    if (ids.some((id) => !id)) return 'هر جایگاه باید یک کاربر انتخاب شود';
    if (new Set(ids).size !== 4) return 'هر کاربر فقط در یک جایگاه باشد';
    const team1 = this.playerDrafts.filter((d) => d.team === 'team1').length;
    if (team1 !== 2) return 'هر تیم باید دقیقاً ۲ نفر داشته باشد';
    if (this.playerDrafts.filter((d) => d.isHakem).length !== 1) return 'یک نفر را حاکم انتخاب کنید';
    return null;
  }

  ngOnInit() {
    void this.gameService.fetchRegisteredUsers();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.roomId.set(id);
        this.isConnected.set(false);
        this.prefillAndMaybeReconnect(id);
      } else {
        this.roomId.set('');
        this.isConnected.set(false);
        this.loadRoomList();
      }
    });
  }

  async prefillAndMaybeReconnect(roomId: string) {
    try {
      const state = await this.gameService.fetchRoomState(roomId);
      this.syncDraftsFromState(state);
      if (this.gameService.canReclaimHost(state)) {
        this.connectToRoom();
      }
    } catch {
      // اتاق در دسترس نیست
    }
  }

  syncDraftsFromState(state: RoomState) {
    if (state.players.length === 0) return;
    this.playerDrafts = state.players.map((p) => ({
      appUserId: p.appUserId ?? '',
      team: p.team,
      isHakem: state.hakemId === p.id,
    }));
  }

  userLabel(userId: string): string {
    const u = this.registeredUsers().find((x) => x.id === userId);
    return u ? `${u.displayName} (@${u.username})` : '';
  }

  async loadRoomList() {
    this.isLoadingRooms.set(true);
    try {
      await this.gameService.fetchRoomList();
    } catch (err) {
      console.error('خطا در بارگذاری لیست اتاق‌ها', err);
    } finally {
      this.isLoadingRooms.set(false);
    }
  }

  openRoom(item: RoomListItem) {
    this.router.navigate(['/room', item.roomId]);
  }

  goToLobby() {
    this.gameService.leaveRoom();
    this.roomId.set('');
    this.isConnected.set(false);
    this.gameService.roomState.set(null);
    this.router.navigate(['/room']);
    this.loadRoomList();
  }

  logout() {
    this.authService.logout();
    this.gameService.leaveRoom();
    void this.router.navigate(['/login']);
  }

  statusLabel(status: RoomStatus): string {
    const labels: Record<RoomStatus, string> = {
      SETUP: 'تنظیم بازیکنان',
      PLAYING: 'در حال بازی',
      PAUSED: 'متوقف',
      FINISHED: 'پایان‌یافته',
    };
    return labels[status] ?? status;
  }

  gameTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      HOKM: 'حکم',
      SHELEM: 'شلم',
      YAZDAHTAEI: '۱۱ تایی',
    };
    return labels[type] ?? type;
  }

  async createRoom() {
    try {
      const newRoomId = await this.gameService.createRoomAPI(this.gameType());
      this.roomId.set(newRoomId);
      this.router.navigate(['/room', newRoomId]);
      this.isConnected.set(false);
    } catch (err) {
      console.error('خطا در ساخت اتاق', err);
    }
  }

  connectToRoom() {
    if (!this.roomId()) return;
    this.gameService.joinRoom(this.roomId());
    this.isConnected.set(true);
  }

  isCurrentUserHost(state: RoomState): boolean {
    const me = this.currentUser();
    return !!(me && state.hostUserId === me.id);
  }

  selectHakemDraft(index: number) {
    this.playerDrafts = this.playerDrafts.map((d, i) => ({ ...d, isHakem: i === index }));
  }

  startGame() {
    if (this.getSetupValidationError() || !this.roomId()) return;
    const hakemIndex = this.playerDrafts.findIndex((d) => d.isHakem);
    const players = this.playerDrafts.map((d) => ({
      appUserId: d.appUserId,
      team: d.team,
    }));
    this.gameService.setupPlayers(this.roomId(), players, hakemIndex);
  }

  selectHokmChoice(choice: string) {
    this.selectedHokm = choice;
    this.cdr.markForCheck();
  }

  isSelectedHokm(choice: string): boolean {
    return this.selectedHokm === choice;
  }

  isSpecialHokm(hokm: string | null): boolean {
    return !!hokm && (this.hokmSpecial as readonly string[]).includes(hokm);
  }

  confirmHokm() {
    if (this.roomId() && this.selectedHokm) {
      this.gameService.setHokm(this.roomId(), this.selectedHokm);
    }
  }

  confirmSetNext() {
    if (this.roomId()) {
      this.gameService.confirmSetNext(this.roomId());
    }
  }

  undoLastScore() {
    if (!this.roomId() || !this.canUndoScore()) return;
    if (!confirm('آخرین امتیاز ثبت‌شده برگردانده شود؟')) return;
    this.gameService.undoLastScore(this.roomId());
  }

  teamLabel(teamId: TeamId): string {
    return teamId === 'team1' ? 'تیم ۱' : 'تیم ۲';
  }

  /** آرایه برای رسم N چوب کبریت (امتیاز ست) */
  setChalkSticks(count: number): number[] {
    return Array.from({ length: Math.max(0, count) }, (_, i) => i);
  }

  changeHakem(playerId: string) {
    if (this.roomId()) {
      this.gameService.setHakem(this.roomId(), playerId);
    }
  }

  scoreNormalHand(teamId: TeamId) {
    if (this.roomId()) {
      this.gameService.recordNormalHand(this.roomId(), teamId);
    }
  }

  scoreKetForTeam(teamId: TeamId) {
    const state = this.roomState();
    if (!state || !this.roomId()) return;
    const teamPlayers = state.players.filter((p) => p.team === teamId);
    const hakemOnTeam = teamPlayers.find((p) => p.id === state.hakemId);
    const playerId = hakemOnTeam?.id ?? teamPlayers[0]?.id;
    if (playerId) {
      this.gameService.recordKet(this.roomId(), playerId);
    }
  }

  hakemTeamId(state: RoomState): TeamId | null {
    const hakem = state.players.find((p) => p.id === state.hakemId);
    return hakem?.team ?? null;
  }

  isHakemTeam(state: RoomState, teamId: TeamId): boolean {
    return this.hakemTeamId(state) === teamId;
  }

  ketPointsForTeam(state: RoomState, teamId: TeamId): number {
    const hakemTeam = this.hakemTeamId(state);
    if (!hakemTeam) return 0;
    return getHokmHandPoints('KET', teamId, hakemTeam);
  }

  hakemTeamLabel(state: RoomState): string {
    const hakem = state.players.find((p) => p.id === state.hakemId);
    if (!hakem) return '';
    return hakem.team === 'team1' ? 'تیم ۱' : 'تیم ۲';
  }

  hakemTeamPlayers(state: RoomState) {
    const hakem = state.players.find((p) => p.id === state.hakemId);
    if (!hakem) return state.players;
    return state.players.filter((p) => p.team === hakem.team);
  }

  isPlayerHakem(state: RoomState, playerId: string): boolean {
    return state.hakemId === playerId;
  }

  getHakemName(state: RoomState): string {
    if (!state.hakemId) return '';
    return state.players.find((p) => p.id === state.hakemId)?.name ?? '';
  }
}
