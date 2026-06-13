import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, GameService } from '@fe/services';
import {
  getHokmHandPoints,
  HOKM_SCORING,
  HOKM_ALL_CHOICES,
  HOKM_SPECIAL_CHOICES,
  HOKM_SUIT_CHOICES,
  HandHistoryEntry,
  RoomListItem,
  RoomState,
  RoomStatus,
  TeamId,
} from '@fe/shared-types';

import {AXButtonComponent} from '@acorex/components/button'

interface PlayerDraft {
  appUserId: string;
  team: TeamId;
  isHakem: boolean;
  quickUsername?: string;
  userFilter?: string;
  userQuery?: string;
}

@Component({
  selector: 'lib-room',
  imports: [CommonModule, FormsModule, RouterLink, AXButtonComponent],
  templateUrl: './room.html',
  styleUrl: './room.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Room implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private injector = inject(Injector);
  public gameService = inject(GameService);
  public authService = inject(AuthService);

  @ViewChild('roomSwiper') roomSwiperRef?: ElementRef<HTMLElement>;
  @ViewChild('swiperPrev') swiperPrevRef?: ElementRef<HTMLElement>;
  @ViewChild('swiperNext') swiperNextRef?: ElementRef<HTMLElement>;
  @ViewChild('swiperPagination') swiperPaginationRef?: ElementRef<HTMLElement>;
  private roomSwiper?: Swiper;

  constructor() {
    effect(() => {
      const state = this.roomState();
      if (state?.players.length) {
        this.syncDraftsFromState(state);
      }
      if (state?.hokm) {
        this.selectedHokm = state.hokm;
      }
    });

    effect(() => {
      const rooms = this.filteredRoomList();
      if (!rooms.length) {
        this.destroyRoomSwiper();
        return;
      }
      afterNextRender(() => this.initRoomSwiper(), { injector: this.injector });
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
    { appUserId: '', team: 'team1', isHakem: true, quickUsername: '', userFilter: '', userQuery: '' },
    { appUserId: '', team: 'team1', isHakem: false, quickUsername: '', userFilter: '', userQuery: '' },
    { appUserId: '', team: 'team2', isHakem: false, quickUsername: '', userFilter: '', userQuery: '' },
    { appUserId: '', team: 'team2', isHakem: false, quickUsername: '', userFilter: '', userQuery: '' },
  ];

  public roomState = this.gameService.roomState;
  public roomList = this.gameService.roomList;
  public registeredUsers = this.gameService.registeredUsers;
  public roomSearch = signal('');
  public error = this.gameService.connectionError;
  public isLoadingRooms = signal(false);
  public copyToast = signal(false);
  public creatingDraftIndex = signal<number | null>(null);
  public createUserSuccess = signal<string | null>(null);
  public draftCreateError = signal<{ index: number; message: string } | null>(null);
  public draftUserPickError = signal<{ index: number; message: string } | null>(null);
  public openUserPickerIndex = signal<number | null>(null);

  public currentUser = this.authService.currentUser;
  public isAdmin = this.authService.isAdmin;
  public isHost = computed(() => this.gameService.isHost(this.roomState()));

  public team1Players = computed(() => {
    const state = this.roomState();
    return state ? state.players.filter((p) => p.team === 'team1') : [];
  });

  public team2Players = computed(() => {
    const state = this.roomState();
    return state ? state.players.filter((p) => p.team === 'team2') : [];
  });

  public filteredRoomList = computed(() => {
    const q = this.roomSearch().trim().toLowerCase();
    const list = this.roomList();
    if (!q) return list;
    return list.filter((item) => {
      const haystack = [
        item.roomId,
        item.gameType,
        item.status,
        item.hostUsername ?? '',
        item.playerNames.join(' '),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
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

  private toSafeUsername(raw: string): string {
    return raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
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
      quickUsername: '',
      userFilter: '',
      userQuery: p.name,
    }));
  }

  async createAndAssignUserForDraft(index: number) {
    this.draftCreateError.set(null);
    this.createUserSuccess.set(null);
    const draft = this.playerDrafts[index];
    if (!draft) return;

    const username = this.toSafeUsername(draft.quickUsername || '');
    if (!username) {
      this.draftCreateError.set({ index, message: 'username را وارد کنید' });
      return;
    }
    if (username.length < 3) {
      this.draftCreateError.set({ index, message: 'username باید حداقل ۳ کاراکتر باشد' });
      return;
    }

    this.creatingDraftIndex.set(index);
    try {
      const created = await this.authService.registerPlayerForRoom(username, username, username);
      await this.gameService.fetchRegisteredUsers();
      this.playerDrafts[index] = {
        ...this.playerDrafts[index],
        appUserId: created.id,
        quickUsername: '',
        userQuery: created.username,
      };
      this.createUserSuccess.set(`@${created.username} ساخته شد و روی سطر ${index + 1} قرار گرفت`);
      this.cdr.markForCheck();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string | string[] }; message?: string };
      const msg = err.error?.message;
      this.draftCreateError.set({
        index,
        message: Array.isArray(msg) ? msg.join('، ') : msg || err.message || 'خطا در ساخت کاربر',
      });
    } finally {
      this.creatingDraftIndex.set(null);
    }
  }

  userLabel(userId: string): string {
    const u = this.registeredUsers().find((x) => x.id === userId);
    return u ? `${u.displayName} (@${u.username})` : '';
  }

  isUserPickedInAnotherDraft(userId: string, draftIndex: number): boolean {
    if (!userId) return false;
    return this.playerDrafts.some((draft, index) => index !== draftIndex && draft.appUserId === userId);
  }

  filteredUsersForDraft(draftIndex: number) {
    const q = this.playerDrafts[draftIndex]?.userQuery?.trim().toLowerCase() ?? '';
    const selected = this.playerDrafts[draftIndex]?.appUserId;
    const users = this.registeredUsers();
    if (!q) return users;
    return users.filter((u) => {
      if (selected && u.id === selected) return true;
      const haystack = `${u.displayName} ${u.username}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  userQueryValue(draft: PlayerDraft): string {
    if (draft.userQuery?.trim()) return draft.userQuery;
    if (!draft.appUserId) return '';
    const selected = this.registeredUsers().find((u) => u.id === draft.appUserId);
    return selected?.username ?? '';
  }

  onDraftUserQueryInput(index: number, raw: string): void {
    const value = raw.trim().toLowerCase();
    this.draftUserPickError.set(null);
    this.playerDrafts[index] = {
      ...this.playerDrafts[index],
      userQuery: raw,
    };
    if (!value) {
      this.playerDrafts[index] = { ...this.playerDrafts[index], appUserId: '' };
    }
  }

  toggleUserPicker(index: number): void {
    const current = this.openUserPickerIndex();
    if (current === index) {
      this.openUserPickerIndex.set(null);
      return;
    }
    const draft = this.playerDrafts[index];
    if (!draft) return;
    const selected = draft?.appUserId
      ? this.registeredUsers().find((u) => u.id === draft.appUserId)
      : null;
    this.playerDrafts[index] = {
      ...draft,
      userQuery: selected?.username ?? '',
    };
    this.openUserPickerIndex.set(index);
  }

  closeUserPicker(): void {
    this.openUserPickerIndex.set(null);
  }

  onDraftUserSelect(index: number, userId: string): void {
    this.draftUserPickError.set(null);
    if (!userId) {
      this.playerDrafts[index] = { ...this.playerDrafts[index], appUserId: '' };
      return;
    }

    if (this.isUserPickedInAnotherDraft(userId, index)) {
      this.draftUserPickError.set({ index, message: 'این کاربر قبلاً در سطر دیگری انتخاب شده است' });
      return;
    }

    const selected = this.registeredUsers().find((u) => u.id === userId);
    this.playerDrafts[index] = {
      ...this.playerDrafts[index],
      appUserId: userId,
      userQuery: selected?.username ?? this.playerDrafts[index].userQuery ?? '',
    };
    this.openUserPickerIndex.set(null);
  }

  selectedUserLabel(userId: string): string {
    if (!userId) return 'انتخاب کاربر';
    const u = this.registeredUsers().find((x) => x.id === userId);
    return u ? `${u.displayName} (@${u.username})` : 'انتخاب کاربر';
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

  async editMyCredentials() {
    const me = this.currentUser();
    if (!me) return;

    const nextUsername = prompt('نام کاربری جدید (انگلیسی، اختیاری):', me.username)?.trim();
    if (nextUsername === null) return;
    const nextDisplayName = prompt('نام نمایشی جدید (اختیاری):', me.displayName)?.trim();
    if (nextDisplayName === null) return;
    const nextPassword = prompt('رمز عبور جدید (حداقل ۴ کاراکتر، خالی=بدون تغییر):')?.trim();
    if (nextPassword === null) return;

    try {
      await this.authService.updateMyCredentials({
        username: nextUsername || undefined,
        displayName: nextDisplayName || undefined,
        password: nextPassword || undefined,
      });
      this.createUserSuccess.set('اطلاعات حساب شما به‌روزرسانی شد');
    } catch (e: unknown) {
      const err = e as { error?: { message?: string | string[] }; message?: string };
      const msg = err.error?.message;
      this.error.set(Array.isArray(msg) ? msg.join('، ') : msg || err.message || 'خطا در بروزرسانی حساب');
    }
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

  statusBadgeClass(status: RoomStatus): string {
    const classes: Record<RoomStatus, string> = {
      SETUP: 'bg-amber-100 text-amber-800',
      PLAYING: 'bg-emerald-100 text-emerald-800',
      PAUSED: 'bg-slate-200 text-slate-600',
      FINISHED: 'bg-red-100 text-red-800',
    };
    return classes[status] ?? 'bg-amber-100 text-amber-800';
  }

  onRoomSearchChange(value: string): void {
    this.roomSearch.set(value);
  }

  onGameTypeChange(value: 'hokm' | 'shelem' | '11tayi'): void {
    this.gameType.set(value);
  }

  ngOnDestroy(): void {
    this.destroyRoomSwiper();
  }

  private initRoomSwiper(): void {
    const el = this.roomSwiperRef?.nativeElement;
    if (!el) {
      return;
    }

    if (this.roomSwiper) {
      this.roomSwiper.update();
      return;
    }

    this.roomSwiper = new Swiper(el, {
      modules: [Navigation, Pagination],
      slidesPerView: 'auto',
      spaceBetween: 16,
      grabCursor: true,
      watchOverflow: true,
      breakpoints: {
        480: { slidesPerView: 1.35, spaceBetween: 16 },
        640: { slidesPerView: 2.1, spaceBetween: 16 },
        1024: { slidesPerView: 2.6, spaceBetween: 20 },
        1280: { slidesPerView: 3, spaceBetween: 20 },
      },
      navigation: {
        nextEl: this.swiperNextRef?.nativeElement ?? null,
        prevEl: this.swiperPrevRef?.nativeElement ?? null,
      },
      pagination: {
        el: this.swiperPaginationRef?.nativeElement ?? null,
        clickable: true,
      },
    });
  }

  private destroyRoomSwiper(): void {
    this.roomSwiper?.destroy(true, true);
    this.roomSwiper = undefined;
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

  pickHokm(choice: string) {
    this.selectHokmChoice(choice);
    const state = this.roomState();
    if (this.roomId() && this.isHost() && state?.hokm) {
      this.gameService.setHokm(this.roomId(), choice);
    }
  }

  async copyRoomCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      this.copyToast.set(true);
      setTimeout(() => {
        this.copyToast.set(false);
        this.cdr.markForCheck();
      }, 2000);
    } catch {
      /* clipboard denied */
    }
  }

  historyEntries(state: RoomState): HandHistoryEntry[] {
    return state.handHistory ?? [];
  }

  historyTypeLabel(type: HandHistoryEntry['type']): string {
    const labels: Record<HandHistoryEntry['type'], string> = {
      NORMAL: 'دست',
      KET: 'کت',
      SET_WON: 'ست',
      UNDO: 'برگشت',
    };
    return labels[type];
  }

  historyTimeAgo(iso: string): string {
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return 'همین الان';
    return `${min} دقیقه پیش`;
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
