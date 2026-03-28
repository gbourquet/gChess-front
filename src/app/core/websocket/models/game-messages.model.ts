import { Color, GameStatus, Move, PieceType } from './common.model';

/**
 * Game WebSocket messages
 */

// Client -> Server
export interface MoveAttemptMessage {
  type: 'MoveAttempt';
  from: string;
  to: string;
  promotion?: PieceType;
}

// Server -> Client
export interface MoveExecutedMessage {
  type: 'MoveExecuted';
  move: Move;
  newPositionFen: string;
  gameStatus: GameStatus;
  currentSide: Color;
  isCheck: boolean;
  whiteTimeRemainingMs?: number;
  blackTimeRemainingMs?: number;
}

export interface MoveRejectedMessage {
  type: 'MoveRejected';
  reason: string;
}

export interface GameStateSyncMessage {
  type: 'GameStateSync';
  gameId: string;
  whitePlayerId: string;
  blackPlayerId: string;
  whiteUsername: string;
  blackUsername: string;
  positionFen: string;
  gameStatus: GameStatus;
  currentSide: Color;
  moveHistory: Move[];
  whiteTimeRemainingMs?: number;
  blackTimeRemainingMs?: number;
  totalTimeSeconds?: number;
  incrementSeconds?: number;
  lastMoveAt?: string;
}

export interface PlayerDisconnectedMessage {
  type: 'PlayerDisconnected';
  playerId: string;
}

export interface PlayerReconnectedMessage {
  type: 'PlayerReconnected';
  playerId: string;
}

// Resignation messages
export interface ResignMessage {
  type: 'Resign';
}

export interface GameResignedMessage {
  type: 'GameResigned';
  resignedPlayerId: string;
  gameStatus: 'RESIGNED';
}

// Draw offer messages
export interface OfferDrawMessage {
  type: 'OfferDraw';
}

export interface DrawOfferedMessage {
  type: 'DrawOffered';
  offeredByPlayerId: string;
}

export interface AcceptDrawMessage {
  type: 'AcceptDraw';
}

export interface DrawAcceptedMessage {
  type: 'DrawAccepted';
  acceptedByPlayerId: string;
  gameStatus: 'DRAW';
}

export interface RejectDrawMessage {
  type: 'RejectDraw';
}

export interface DrawRejectedMessage {
  type: 'DrawRejected';
  rejectedByPlayerId: string;
}

// Timeout messages
export interface ClaimTimeoutMessage {
  type: 'ClaimTimeout';
}

export interface TimeoutConfirmedMessage {
  type: 'TimeoutConfirmed';
  loserPlayerId: string;
  gameStatus: 'TIMEOUT';
}

export interface TimeoutClaimRejectedMessage {
  type: 'TimeoutClaimRejected';
  remainingMs: number;
}

export type GameClientMessage =
  | MoveAttemptMessage
  | ResignMessage
  | OfferDrawMessage
  | AcceptDrawMessage
  | RejectDrawMessage
  | ClaimTimeoutMessage;

export type GameServerMessage =
  | MoveExecutedMessage
  | MoveRejectedMessage
  | GameStateSyncMessage
  | PlayerDisconnectedMessage
  | PlayerReconnectedMessage
  | GameResignedMessage
  | DrawOfferedMessage
  | DrawAcceptedMessage
  | DrawRejectedMessage
  | TimeoutConfirmedMessage
  | TimeoutClaimRejectedMessage;
