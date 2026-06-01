// // shared-types/src/lib/game.types.ts

// export type Team = 'TEAM_1' | 'TEAM_2';
// export type GameType = 'HOKM' | 'SHELEM' | 'ELEVEN';

// export interface Player {
//   userId: string;
//   username: string;
//   team: Team;
//   isHakem: boolean;
// }

// export interface RoomState {
//   roomId: string;
//   gameType: 'HOKM' | 'SHELEM' | 'ELEVEN';
//   status: 'WAITING' | 'PLAYING' | 'PAUSED' | 'FINISHED';
//   hakemId?: string;
//   hokm?: string;

//   scores: {
//     team1: { handsWon: number; setsWon: number };
//     team2: { handsWon: number; setsWon: number };
//   };

//   players: Player[];
// }
