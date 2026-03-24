import { Color, GameStatus, Move } from '../../../core/websocket/models';
import { CapturedPieces } from '../utils/captured-pieces.util';

/**
 * Player information
 */
export interface PlayerInfo {
  playerId: string;
  userId?: string;
  username?: string;
  isConnected: boolean;
  capturedPieces?: CapturedPieces;
}

/**
 * Game state
 */
export interface GameState {
  gameId: string;
  whitePlayer: PlayerInfo;
  blackPlayer: PlayerInfo;
  currentPositionFen: string;
  gameStatus: GameStatus;
  currentSide: Color;
  moveHistory: Move[];
  myColor: Color;
  myPlayerId: string;
  isCheck: boolean;
  lastMove: Move | null;
  pendingDrawOffer?: {
    offeredByPlayerId: string;
  };
  whiteTimeRemainingMs?: number;
  blackTimeRemainingMs?: number;
  totalTimeSeconds?: number;
  incrementSeconds?: number;
  loserPlayerId?: string;
}

/**
 * Initial game state
 */
export const initialGameState: Partial<GameState> = {
  moveHistory: [],
  gameStatus: 'IN_PROGRESS',
  lastMove: null
};
