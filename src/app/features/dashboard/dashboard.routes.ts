import { Routes } from '@angular/router';

/**
 * Dashboard routes
 * TODO: Implement dashboard page component in Phase 8
 */
export default [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  }
] as Routes;
