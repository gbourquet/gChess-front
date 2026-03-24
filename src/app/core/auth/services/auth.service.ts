import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { TokenStorageService } from './token-storage.service';
import { User, LoginRequest, LoginResponse, RegisterRequest } from '../models';
import { environment } from '../../../../environments/environment.development';

/**
 * Authentication service using Angular signals for state management
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly API_URL = `${environment.apiUrl}/api/auth`;

  // Private mutable signal
  private currentUserSignal = signal<User | null>(null);

  // Public readonly signal
  public currentUser = this.currentUserSignal.asReadonly();

  // Computed signal for authentication status
  public isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    // Initialize user from token if present
    this.initializeUser();
  }

  /**
   * Initialize user from stored token on app startup
   */
  private initializeUser(): void {
    const user = this.tokenStorage.getUser();
    if (user && this.tokenStorage.hasToken()) {
      // Restore user from localStorage
      this.currentUserSignal.set(user);
      console.log('User restored from localStorage:', user);
    }
  }

  /**
   * Register a new user
   */
  register(request: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/register`, request);
  }

  /**
   * Login with username and password
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, request).pipe(
      tap(response => {
        // Store token and user data
        this.tokenStorage.saveToken(response.token);
        this.tokenStorage.saveUser(response.user);
        this.currentUserSignal.set(response.user);
      })
    );
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.tokenStorage.clear();
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Set user after successful authentication
   */
  setUser(user: User): void {
    this.tokenStorage.saveUser(user);
    this.currentUserSignal.set(user);
  }
}
