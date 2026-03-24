import { Routes } from '@angular/router';

/**
 * Matchmaking routes
 * TODO: Implement in Phase 4
 */
export default [
  {
    path: '',
    loadComponent: () => import('./pages/matchmaking/matchmaking.component').then(m => m.MatchmakingComponent)
  }
] as Routes;
