import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Public Guard (functional approach)
 * Prevents authenticated users from accessing public routes (login, register)
 * Redirects to dashboard if user is already authenticated
 */
export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Already authenticated - redirect to dashboard
  return router.createUrlTree(['/dashboard']);
};
