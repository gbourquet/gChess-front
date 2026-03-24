/**
 * WebSocket message types - Discriminated Union
 */

import { AuthMessage } from './auth-messages.model';
import { MatchmakingClientMessage, MatchmakingServerMessage } from './matchmaking-messages.model';
import { GameClientMessage, GameServerMessage } from './game-messages.model';

/**
 * Generic error message
 */
export interface ErrorMessage {
  type: 'Error';
  code: string;
  message: string;
}

/**
 * All possible WebSocket messages (discriminated union)
 */
export type WebSocketMessage =
  | AuthMessage
  | MatchmakingServerMessage
  | GameServerMessage
  | ErrorMessage;

/**
 * All possible client messages
 */
export type WebSocketClientMessage =
  | MatchmakingClientMessage
  | GameClientMessage;

/**
 * Type guard to check message type
 */
export function isMessageType<T extends WebSocketMessage>(
  message: WebSocketMessage,
  type: T['type']
): message is T {
  return message.type === type;
}

/**
 * Type guard helpers for specific message types
 */
export function isAuthSuccess(message: WebSocketMessage): message is Extract<WebSocketMessage, { type: 'AuthSuccess' }> {
  return message.type === 'AuthSuccess';
}

export function isAuthFailed(message: WebSocketMessage): message is Extract<WebSocketMessage, { type: 'AuthFailed' }> {
  return message.type === 'AuthFailed';
}

export function isMatchFound(message: WebSocketMessage): message is Extract<WebSocketMessage, { type: 'MatchFound' }> {
  return message.type === 'MatchFound';
}

export function isMoveExecuted(message: WebSocketMessage): message is Extract<WebSocketMessage, { type: 'MoveExecuted' }> {
  return message.type === 'MoveExecuted';
}

export function isError(message: WebSocketMessage): message is ErrorMessage {
  return message.type === 'Error';
}

export function isTimeoutConfirmed(message: WebSocketMessage): message is Extract<WebSocketMessage, { type: 'TimeoutConfirmed' }> {
  return message.type === 'TimeoutConfirmed';
}

export function isTimeoutClaimRejected(message: WebSocketMessage): message is Extract<WebSocketMessage, { type: 'TimeoutClaimRejected' }> {
  return message.type === 'TimeoutClaimRejected';
}
