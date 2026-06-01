// src/room/room.types.ts

import { RoomMember } from './user.types';

export type GameType = 'HOKM' | 'SHELEM' | 'YAZDAHTAEI';
export type RoomStatus = 'SETUP' | 'PLAYING' | 'PAUSED' | 'FINISHED';
export type TeamId = 'team1' | 'team2';

/** انتخاب بازیکن از لیست کاربران ثبت‌شده */
export interface SetupPlayerInput {
  /** شناسه کاربر در جدول users */
  appUserId: string;
  team: TeamId;
}

export interface SetupPlayersPayload {
  roomId: string;
  players: SetupPlayerInput[];
  hakemIndex: number;
}

export interface Player {
  /** شناسه بازیکن در این بازی (دست/کت) */
  id: string;
  name: string;
  team: TeamId;
  /** کاربر ثبت‌شده در سیستم */
  appUserId: string;
}

export interface TeamScore {
  handsWon: number;
  setsWon: number;
}

/** پس از رسیدن به ۷ دست — تا تأیید میزبان ست بعدی شروع نمی‌شود */
export interface PendingSetCelebration {
  winnerTeam: TeamId;
  scoringTeamId: TeamId;
  pointType: 'NORMAL' | 'KET';
  ketPlayerId?: string;
}

/** وضعیت بازی قبل از یک ثبت امتیاز (برای برگشت) */
export interface ScoreUndoSnapshot {
  scores: {
    team1: TeamScore;
    team2: TeamScore;
  };
  hakemId: string | null;
  hokm: string | null;
  pendingSetCelebration: PendingSetCelebration | null;
}

export interface RoomListItem {
  roomId: string;
  gameType: GameType;
  status: RoomStatus;
  playerCount: number;
  playerNames: string[];
  hasHost: boolean;
  hostUsername: string | null;
  setsTeam1: number;
  setsTeam2: number;
  createdAt: string;
}

export interface RoomState {
  roomId: string;
  gameType: GameType;
  status: RoomStatus;
  hostId: string | null;
  hostUserId: string | null;
  hostUsername: string | null;
  hostToken: string | null;
  members: RoomMember[];
  hakemId: string | null;
  hokm: string | null;
  scores: {
    team1: TeamScore;
    team2: TeamScore;
  };
  players: Player[];
  /** نمایش پیام پیروزی ست؛ با confirmSetNext پاک می‌شود */
  pendingSetCelebration?: PendingSetCelebration | null;
  /** تاریخچه برای «برگشت آخرین امتیاز» (فقط میزبان) */
  scoreUndoHistory?: ScoreUndoSnapshot[];
}
