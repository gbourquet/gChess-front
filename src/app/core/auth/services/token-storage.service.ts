import { Injectable } from '@angular/core';
import { User } from '../models';

/**
 * Service for managing JWT token and user data storage in sessionStorage
 */
@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly TOKEN_KEY = 'gchess_jwt_token';
  private readonly USER_KEY = 'gchess_user';

  /**
   * Store JWT token in sessionStorage
   */
  saveToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Retrieve JWT token from sessionStorage
   */
  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Remove JWT token from sessionStorage
   */
  removeToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Check if token exists in sessionStorage
   */
  hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Store user data in sessionStorage
   */
  saveUser(user: User): void {
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Retrieve user data from sessionStorage
   */
  getUser(): User | null {
    const userJson = sessionStorage.getItem(this.USER_KEY);
    if (!userJson) {
      return null;
    }
    try {
      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error('Error parsing user from sessionStorage', error);
      return null;
    }
  }

  /**
   * Remove user data from sessionStorage
   */
  removeUser(): void {
    sessionStorage.removeItem(this.USER_KEY);
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    this.removeToken();
    this.removeUser();
  }
}
