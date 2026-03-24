import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./pages/history-list/history-list.component').then(m => m.HistoryListComponent),
  },
  {
    path: ':gameId',
    loadComponent: () =>
      import('./pages/game-review/game-review.component').then(m => m.GameReviewComponent),
  },
] as Routes;
