/**
 * Authentication WebSocket messages
 */

export interface AuthSuccessMessage {
  type: 'AuthSuccess';
  userId: string;  // ULID format
}

export interface AuthFailedMessage {
  type: 'AuthFailed';
  reason: string;
}

export type AuthMessage = AuthSuccessMessage | AuthFailedMessage;
