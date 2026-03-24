/**
 * Common WebSocket types
 */

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

export type Color = 'WHITE' | 'BLACK';

export type GameStatus = 'IN_PROGRESS' | 'CHECK' | 'CHECKMATE' | 'STALEMATE' | 'DRAW' | 'RESIGNED' | 'TIMEOUT';

export type PieceType = 'QUEEN' | 'ROOK' | 'BISHOP' | 'KNIGHT';

/**
 * Move representation
 */
export interface Move {
  from: string;  // e.g., "e2"
  to: string;    // e.g., "e4"
  promotion?: PieceType;
}
