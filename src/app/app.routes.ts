import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { publicGuard } from './core/auth/guards/public.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'lobby',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes'),
    canActivate: [publicGuard]
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes'),
    canActivate: [authGuard]
  },
  {
    path: 'lobby',
    loadChildren: () => import('./features/lobby/lobby.routes'),
    canActivate: [authGuard]
  },
  {
    path: 'matchmaking',
    loadChildren: () => import('./features/matchmaking/matchmaking.routes'),
    canActivate: [authGuard]
  },
  {
    path: 'game',
    loadChildren: () => import('./features/game/game.routes'),
    canActivate: [authGuard]
  },
  {
    path: 'history',
    loadChildren: () => import('./features/history/history.routes'),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'lobby'
  }
];
