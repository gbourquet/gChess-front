import { Injectable } from '@angular/core';
import { User } from '../models';

/**
 * Service for managing JWT token and user data storage in localStorage
 */
@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly TOKEN_KEY = 'gchess_jwt_token';
  private readonly USER_KEY = 'gchess_user';

  /**
   * Store JWT token in localStorage
   */
  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Retrieve JWT token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Remove JWT token from localStorage
   */
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Check if token exists in localStorage
   */
  hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Store user data in localStorage
   */
  saveUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Retrieve user data from localStorage
   */
  getUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) {
      return null;
    }
    try {
      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error('Error parsing user from localStorage', error);
      return null;
    }
  }

  /**
   * Remove user data from localStorage
   */
  removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    this.removeToken();
    this.removeUser();
  }
}
