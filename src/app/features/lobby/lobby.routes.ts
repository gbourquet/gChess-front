import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./pages/lobby/lobby.component').then(m => m.LobbyComponent),
  },
] as Routes;
