import { GameStatus } from '../../../core/websocket/models/common.model';

export interface GameSummaryDTO {
  gameId: string;
  whiteUserId: string;
  blackUserId: string;
  whiteUsername: string;
  blackUsername: string;
  status: GameStatus;
  moveCount: number;
  winnerUserId?: string;
  whiteTimeRemainingMs?: number;
  blackTimeRemainingMs?: number;
  totalTimeSeconds?: number;
  incrementSeconds?: number;
  playedAt?: string; // ISO-8601
}

export interface MoveSummaryDTO {
  moveNumber: number;
  from: string;
  to: string;
  promotion?: string;
  timeSpentMs?: number;
}

export interface GameHistoryEntry {
  gameId: string;
  whiteUsername: string;
  blackUsername: string;
  winnerSide?: 'white' | 'black';
  opponentUsername: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  status: GameStatus;
  moveCount: number;
  timeControlLabel?: string; // e.g. "3+2", "10+0"
  playedAt?: Date;
}
