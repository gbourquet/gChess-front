import { User } from './user.model';

/**
 * Login request payload
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Login response with JWT token and user data
 */
export interface LoginResponse {
  token: string;
  user: User;
}
