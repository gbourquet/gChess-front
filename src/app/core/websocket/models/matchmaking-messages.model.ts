import { Color } from './common.model';

/**
 * Matchmaking WebSocket messages
 */

// Client -> Server
export interface JoinQueueMessage {
  type: 'JoinQueue';
  totalTimeMinutes?: number;  // Fischer time control: total time per player in minutes
  incrementSeconds?: number;  // Fischer time control: increment per move in seconds
}

// Server -> Client
export interface QueuePositionUpdateMessage {
  type: 'QueuePositionUpdate';
  position: number;
}

export interface MatchFoundMessage {
  type: 'MatchFound';
  gameId: string;       // ULID format
  yourColor: Color;
  playerId: string;     // ULID format
  opponentUserId: string; // ULID format
}

export interface MatchmakingErrorMessage {
  type: 'MatchmakingError';
  message: string;
}

export type MatchmakingClientMessage = JoinQueueMessage;

export type MatchmakingServerMessage =
  | QueuePositionUpdateMessage
  | MatchFoundMessage
  | MatchmakingErrorMessage;
