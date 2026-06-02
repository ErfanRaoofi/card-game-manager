// src/room/room.service.ts

import { randomUUID } from 'crypto';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { RoomEntity } from './room.entity';
import {
  RoomState,
  GameType,
  TeamId,
  HandPointType,
  SetupPlayerInput,
  getHokmHandPoints,
  HOKM_SCORING,
  ScoreUndoSnapshot,
  HandHistoryEntry,
} from '@fe/shared-types';

const MAX_SCORE_UNDO = 25;

const GAME_TYPE_ALIASES: Record<string, GameType> = {
  hokm: 'HOKM',
  HOKM: 'HOKM',
  shelem: 'SHELEM',
  SHELEM: 'SHELEM',
  '11tayi': 'YAZDAHTAEI',
  YAZDAHTAEI: 'YAZDAHTAEI',
};

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(RoomEntity)
    private roomRepository: Repository<RoomEntity>,
    private readonly userService: UserService,
  ) {}

  normalizeGameType(raw: string | undefined): GameType {
    if (!raw) return 'HOKM';
    const mapped = GAME_TYPE_ALIASES[raw];
    if (!mapped) throw new BadRequestException(`نوع بازی نامعتبر: ${raw}`);
    return mapped;
  }

  private assertHost(state: RoomState, clientId: string, userId?: string): void {
    if (state.hostId === clientId) return;
    if (userId && state.hostUserId === userId) return;
    throw new BadRequestException('فقط میزبان می‌تواند این کار را انجام دهد');
  }

  private async enrichStateFromDb(roomId: string, state: RoomState): Promise<RoomState> {
    const normalized = this.normalizeState(state);
    normalized.members = await this.userService.getRoomMembers(roomId);
    const host = await this.userService.getRoomHost(roomId);
    if (host) {
      normalized.hostUserId = host.userId;
      normalized.hostUsername = host.username;
    }
    return normalized;
  }

  private assignHost(state: RoomState, clientId: string, userId: string, username: string): void {
    state.hostId = clientId;
    state.hostUserId = userId;
    state.hostUsername = username.trim();
    if (!state.hostToken) state.hostToken = randomUUID();
  }

  async createRoom(gameType: GameType | string): Promise<RoomState> {
    const type = typeof gameType === 'string' ? this.normalizeGameType(gameType) : gameType;

    const initialState: Partial<RoomState> = {
      gameType: type,
      status: 'SETUP',
      hostId: null,
      hostUserId: null,
      hostUsername: null,
      hostToken: null,
      members: [],
      hakemId: null,
      hokm: null,
      scores: {
        team1: { handsWon: 0, setsWon: 0 },
        team2: { handsWon: 0, setsWon: 0 },
      },
      players: [],
      pendingSetCelebration: null,
      scoreUndoHistory: [],
      handHistory: [],
    };

    const room = this.roomRepository.create({ state: initialState as RoomState });
    const savedRoom = await this.roomRepository.save(room);

    savedRoom.state.roomId = savedRoom.roomId;
    await this.roomRepository.save(savedRoom);

    return this.enrichStateFromDb(savedRoom.roomId, savedRoom.state);
  }

  async listRoomsForAdmin() {
    return this.listRooms();
  }

  async deleteRoom(roomId: string): Promise<{ deleted: boolean }> {
    const room = await this.roomRepository.findOne({ where: { roomId } });
    if (!room) throw new NotFoundException('اتاق یافت نشد');
    await this.roomRepository.remove(room);
    return { deleted: true };
  }

  async listRooms() {
    const rooms = await this.roomRepository.find({
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      rooms.map(async (room) => {
        const host = await this.userService.getRoomHost(room.roomId);
        return {
          roomId: room.roomId,
          gameType: room.state.gameType,
          status: room.state.status,
          playerCount: room.state.players.length,
          playerNames: room.state.players.map((p) => p.name),
          hasHost: !!host || !!room.state.hostUserId,
          hostUsername: host?.username ?? room.state.hostUsername,
          setsTeam1: room.state.scores.team1.setsWon,
          setsTeam2: room.state.scores.team2.setsWon,
          createdAt: room.createdAt.toISOString(),
        };
      }),
    );
  }

  private normalizeState(state: RoomState): RoomState {
    if (!state.members) state.members = [];
    if (state.pendingSetCelebration === undefined) state.pendingSetCelebration = null;
    if (!state.scoreUndoHistory) state.scoreUndoHistory = [];
    if (!state.handHistory) state.handHistory = [];
    return state;
  }

  private pushHandHistory(
    state: RoomState,
    entry: Omit<HandHistoryEntry, 'at'> & { at?: string },
  ): void {
    if (!state.handHistory) state.handHistory = [];
    state.handHistory.unshift({
      at: entry.at ?? new Date().toISOString(),
      type: entry.type,
      teamId: entry.teamId,
      points: entry.points,
      hokm: entry.hokm,
      setNumber: entry.setNumber,
    });
    if (state.handHistory.length > 50) {
      state.handHistory.length = 50;
    }
  }

  private captureScoreUndoSnapshot(state: RoomState): ScoreUndoSnapshot {
    return {
      scores: {
        team1: { ...state.scores.team1 },
        team2: { ...state.scores.team2 },
      },
      hakemId: state.hakemId,
      hokm: state.hokm,
      pendingSetCelebration: state.pendingSetCelebration
        ? { ...state.pendingSetCelebration }
        : null,
    };
  }

  private pushScoreUndo(state: RoomState): void {
    if (!state.scoreUndoHistory) state.scoreUndoHistory = [];
    state.scoreUndoHistory.push(this.captureScoreUndoSnapshot(state));
    if (state.scoreUndoHistory.length > MAX_SCORE_UNDO) {
      state.scoreUndoHistory.shift();
    }
  }

  private applyScoreUndo(state: RoomState, snap: ScoreUndoSnapshot): void {
    state.scores = {
      team1: { ...snap.scores.team1 },
      team2: { ...snap.scores.team2 },
    };
    state.hakemId = snap.hakemId;
    state.hokm = snap.hokm;
    state.pendingSetCelebration = snap.pendingSetCelebration
      ? { ...snap.pendingSetCelebration }
      : null;
  }

  async getRoomState(roomId: string): Promise<RoomState> {
    const room = await this.roomRepository.findOne({ where: { roomId } });
    if (!room) throw new NotFoundException('Room not found');
    return this.enrichStateFromDb(roomId, room.state);
  }

  private async saveState(roomId: string, state: RoomState): Promise<RoomState> {
    const persisted: RoomState = { ...state, members: [] };
    await this.roomRepository.update(roomId, { state: persisted });
    return this.enrichStateFromDb(roomId, state);
  }

  /**
   * ورود به اتاق با userId + username پایدار.
   * میزبان: اولین ورود، یا hostToken / hostUserId قبلی برای بازگشت بعد از رفرش.
   */
  async joinRoom(
    roomId: string,
    clientId: string,
    userId: string,
    username: string,
    hostToken?: string,
  ): Promise<RoomState> {
    const state = await this.getRoomState(roomId);
    const trimmedUsername = username?.trim();

    if (!userId?.trim()) {
      throw new BadRequestException('شناسه کاربر الزامی است');
    }
    if (!trimmedUsername || trimmedUsername.length < 2) {
      throw new BadRequestException('نام کاربری باید حداقل ۲ حرف باشد');
    }

    const tokenMatch = !!(hostToken && state.hostToken && state.hostToken === hostToken);
    const userMatch = !!(state.hostUserId && state.hostUserId === userId);
    const noHostYet = !state.hostUserId;

    if (tokenMatch || userMatch || noHostYet) {
      this.assignHost(state, clientId, userId, trimmedUsername);
      await this.userService.setRoomHost(roomId, userId, trimmedUsername, clientId);
      return this.saveState(roomId, state);
    }

    if (state.hostId === clientId) {
      state.hostUsername = trimmedUsername;
      await this.userService.setRoomHost(roomId, userId, trimmedUsername, clientId);
      return this.saveState(roomId, state);
    }

    await this.userService.upsertRoomMember(roomId, userId, trimmedUsername, clientId, false);
    return this.saveState(roomId, state);
  }

  async setupPlayers(
    roomId: string,
    clientId: string,
    userId: string,
    players: SetupPlayerInput[],
    hakemIndex: number,
  ): Promise<RoomState> {
    const state = await this.getRoomState(roomId);
    this.assertHost(state, clientId, userId);

    if (state.status !== 'SETUP') {
      throw new BadRequestException('تنظیم بازیکنان فقط قبل از شروع بازی ممکن است');
    }
    if (players.length !== 4) {
      throw new BadRequestException('باید دقیقاً ۴ بازیکن وارد شود');
    }

    const appUserIds = players.map((p) => p.appUserId);
    if (appUserIds.some((id) => !id)) {
      throw new BadRequestException('هر جایگاه باید یک کاربر از لیست انتخاب شود');
    }
    if (new Set(appUserIds).size !== 4) {
      throw new BadRequestException('هر بازیکن فقط یک‌بار انتخاب شود');
    }

    const team1Count = players.filter((p) => p.team === 'team1').length;
    if (team1Count !== 2) {
      throw new BadRequestException('هر تیم باید دقیقاً ۲ بازیکن داشته باشد');
    }

    const resolved = await Promise.all(
      players.map(async (p) => {
        const user = await this.userService.findById(p.appUserId);
        if (!user) {
          throw new BadRequestException(`کاربر با شناسه ${p.appUserId} یافت نشد`);
        }
        return { user, team: p.team };
      }),
    );

    state.players = resolved.map(({ user, team }) => ({
      id: randomUUID(),
      name: user.displayName,
      team,
      appUserId: user.id,
    }));

    if (hakemIndex < 0 || hakemIndex > 3) {
      throw new BadRequestException('ایندکس حاکم نامعتبر است');
    }

    state.hakemId = state.players[hakemIndex].id;
    state.hokm = null;
    state.status = 'PLAYING';
    state.pendingSetCelebration = null;
    state.scoreUndoHistory = [];
    state.handHistory = [];

    return this.saveState(roomId, state);
  }

  async setHakem(roomId: string, clientId: string, userId: string, playerId: string): Promise<RoomState> {
    const state = await this.getRoomState(roomId);
    this.assertHost(state, clientId, userId);

    if (state.status !== 'PLAYING') {
      throw new BadRequestException('بازی شروع نشده است');
    }

    const player = state.players.find((p) => p.id === playerId);
    if (!player) throw new BadRequestException('بازیکن یافت نشد');

    state.hakemId = playerId;
    state.hokm = null;
    return this.saveState(roomId, state);
  }

  async setHokm(roomId: string, clientId: string, userId: string, hokm: string): Promise<RoomState> {
    const state = await this.getRoomState(roomId);
    this.assertHost(state, clientId, userId);

    if (state.status !== 'PLAYING') {
      throw new BadRequestException('بازی شروع نشده است');
    }
    if (!state.hakemId) {
      throw new BadRequestException('ابتدا حاکم را مشخص کنید');
    }

    state.hokm = hokm;
    return this.saveState(roomId, state);
  }

  private getHakemTeamId(state: RoomState): TeamId | null {
    const hakem = state.players.find((p) => p.id === state.hakemId);
    return hakem?.team ?? null;
  }

  private setHakemOnTeam(state: RoomState, teamId: TeamId, preferredPlayerId?: string): void {
    const teamPlayers = state.players.filter((p) => p.team === teamId);
    if (teamPlayers.length === 0) return;

    if (preferredPlayerId && teamPlayers.some((p) => p.id === preferredPlayerId)) {
      state.hakemId = preferredPlayerId;
      return;
    }
    const partner = teamPlayers.find((p) => p.id !== state.hakemId);
    state.hakemId = partner?.id ?? teamPlayers[0].id;
  }

  private rotateHakemWithinTeam(state: RoomState, teamId: TeamId): void {
    this.setHakemOnTeam(state, teamId);
  }

  /** بعد از پایان دست: حکم پاک؛ در صورت باخت حاکم، تیم مقابل حاکم می‌شود */
  private afterHandResolved(
    state: RoomState,
    scoringTeamId: TeamId,
    pointType: HandPointType,
    ketPlayerId?: string,
  ): void {
    const hakemTeamId = this.getHakemTeamId(state);
    if (!hakemTeamId) return;

    state.hokm = null;

    const hakemLostHand = pointType === 'NORMAL' && scoringTeamId !== hakemTeamId;
    const opponentKet = pointType === 'KET' && scoringTeamId !== hakemTeamId;

    if (hakemLostHand || opponentKet) {
      this.setHakemOnTeam(state, scoringTeamId, ketPlayerId);
      return;
    }

    if (pointType === 'KET' && ketPlayerId) {
      state.hakemId = ketPlayerId;
    } else {
      this.rotateHakemWithinTeam(state, hakemTeamId);
    }
  }

  async recordHand(
    roomId: string,
    clientId: string,
    userId: string,
    pointType: HandPointType,
    options: { teamId?: TeamId; playerId?: string },
  ): Promise<RoomState> {
    const state = await this.getRoomState(roomId);
    if (state.hostUserId === userId && state.hostId !== clientId) {
      state.hostId = clientId;
    }
    this.assertHost(state, clientId, userId);

    if (state.status !== 'PLAYING') {
      throw new BadRequestException('بازی در جریان نیست');
    }
    if (!state.hokm) {
      throw new BadRequestException('ابتدا باید حکم تعیین شود');
    }
    if (state.pendingSetCelebration) {
      throw new BadRequestException('ابتدا پیروزی ست را تأیید کنید');
    }

    const hakemTeamId = this.getHakemTeamId(state);
    if (!hakemTeamId) {
      throw new BadRequestException('حاکم مشخص نیست');
    }

    let scoringTeamId: TeamId;
    let ketPlayerId: string | undefined;

    if (pointType === 'NORMAL') {
      if (!options.teamId) {
        throw new BadRequestException('تیم برنده مشخص نشده است');
      }
      scoringTeamId = options.teamId;
    } else if (pointType === 'KET') {
      if (!options.playerId) {
        throw new BadRequestException('بازیکن کت‌کننده مشخص نشده است');
      }
      const scorer = state.players.find((p) => p.id === options.playerId);
      if (!scorer) throw new BadRequestException('بازیکن یافت نشد');
      scoringTeamId = scorer.team;
      ketPlayerId = scorer.id;
    } else {
      throw new BadRequestException('نوع امتیاز نامعتبر است');
    }

    this.pushScoreUndo(state);

    const points = getHokmHandPoints(pointType, scoringTeamId, hakemTeamId);
    const hokmAtHand = state.hokm;
    state.scores[scoringTeamId].handsWon += points;

    if (state.scores[scoringTeamId].handsWon >= HOKM_SCORING.HANDS_TO_WIN_SET) {
      state.scores[scoringTeamId].setsWon += 1;
      this.pushHandHistory(state, {
        type: pointType === 'KET' ? 'KET' : 'NORMAL',
        teamId: scoringTeamId,
        points,
        hokm: hokmAtHand,
        setNumber: state.scores[scoringTeamId].setsWon,
      });
      state.pendingSetCelebration = {
        winnerTeam: scoringTeamId,
        scoringTeamId,
        pointType,
        ketPlayerId,
      };
      return this.saveState(roomId, state);
    }

    this.pushHandHistory(state, {
      type: pointType === 'KET' ? 'KET' : 'NORMAL',
      teamId: scoringTeamId,
      points,
      hokm: hokmAtHand,
      setNumber: state.scores[scoringTeamId].setsWon,
    });

    this.afterHandResolved(state, scoringTeamId, pointType, ketPlayerId);

    return this.saveState(roomId, state);
  }

  async confirmSetNext(
    roomId: string,
    clientId: string,
    userId: string,
  ): Promise<RoomState> {
    const state = await this.getRoomState(roomId);
    this.assertHost(state, clientId, userId);

    if (!state.pendingSetCelebration) {
      throw new BadRequestException('ستی در انتظار تأیید نیست');
    }

    this.pushScoreUndo(state);

    const { scoringTeamId, pointType, ketPlayerId } = state.pendingSetCelebration;
    state.pendingSetCelebration = null;
    state.scores.team1.handsWon = 0;
    state.scores.team2.handsWon = 0;

    this.afterHandResolved(state, scoringTeamId, pointType, ketPlayerId);

    return this.saveState(roomId, state);
  }

  async undoLastScore(
    roomId: string,
    clientId: string,
    userId: string,
  ): Promise<RoomState> {
    const state = await this.getRoomState(roomId);
    this.assertHost(state, clientId, userId);

    if (state.status !== 'PLAYING') {
      throw new BadRequestException('فقط در حین بازی می‌توان امتیاز را برگرداند');
    }

    const history = state.scoreUndoHistory ?? [];
    if (history.length === 0) {
      throw new BadRequestException('امتیازی برای برگشت وجود ندارد');
    }

    const snap = history.pop()!;
    this.applyScoreUndo(state, snap);
    if (state.handHistory?.length) {
      state.handHistory.shift();
    }

    return this.saveState(roomId, state);
  }
}
