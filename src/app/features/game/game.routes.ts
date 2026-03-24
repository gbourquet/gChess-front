import { Routes } from '@angular/router';

/**
 * Game routes
 * TODO: Implement in Phase 6-7
 */
export default [
  {
    path: ':gameId',
    loadComponent: () => import('./pages/game-board/game-board.component').then(m => m.GameBoardComponent)
  },
  {
    path: ':gameId/spectate',
    loadComponent: () => import('./pages/spectate/spectate.component').then(m => m.SpectateComponent)
  }
] as Routes;
