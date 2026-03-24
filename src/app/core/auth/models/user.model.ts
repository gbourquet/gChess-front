/**
 * User DTO - returned by the backend
 */
export interface User {
  userId: string;      // ULID format
  username: string;
  email: string;
}
