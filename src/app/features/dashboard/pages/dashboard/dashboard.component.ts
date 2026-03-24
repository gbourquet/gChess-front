import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/auth/services/auth.service';

/**
 * Dashboard page component
 * Main landing page after login
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Get current user
  currentUser = this.authService.currentUser;

  /**
   * Navigate to lobby for game mode and time control selection
   */
  findGame(): void {
    this.router.navigate(['/lobby']);
  }

  /**
   * Navigate to game history
   */
  viewHistory(): void {
    this.router.navigate(['/history']);
  }

  /**
   * Logout
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
