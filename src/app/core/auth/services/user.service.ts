import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '../models';
import { environment } from '../../../../environments/environment';

/**
 * User service
 * Manages user-related API calls
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/api/users`;

  // Cache pour éviter de récupérer plusieurs fois le même username
  private usernameCache = new Map<string, string>();

  /**
   * Get user by ID
   * Note: This endpoint may need to be created in the backend
   */
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${userId}`);
  }

  /**
   * Get username by user ID (with caching)
   */
  getUsernameById(userId: string): Observable<string | null> {
    // Check cache first
    if (this.usernameCache.has(userId)) {
      return of(this.usernameCache.get(userId)!);
    }

    // If not in cache, return null for now
    // TODO: Implement API call when backend endpoint is ready
    // return this.getUserById(userId).pipe(
    //   map(user => {
    //     this.usernameCache.set(userId, user.username);
    //     return user.username;
    //   }),
    //   catchError(() => of(null))
    // );

    return of(null);
  }

  /**
   * Set username in cache
   */
  setUsernameInCache(userId: string, username: string): void {
    this.usernameCache.set(userId, username);
  }

  /**
   * Clear username cache
   */
  clearCache(): void {
    this.usernameCache.clear();
  }
}
