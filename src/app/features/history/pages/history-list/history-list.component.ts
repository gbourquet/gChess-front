import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { GameHistoryService } from '../../services/game-history.service';
import { TokenStorageService } from '../../../../core/auth/services/token-storage.service';
import { GameHistoryEntry } from '../../models/game-history.model';

@Component({
  selector: 'app-history-list',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatListModule,
  ],
  templateUrl: './history-list.component.html',
  styleUrl: './history-list.component.css',
})
export class HistoryListComponent implements OnInit {
  protected readonly Math = Math;
  private readonly historyService = inject(GameHistoryService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  entries = signal<GameHistoryEntry[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const currentUser = this.tokenStorage.getUser();
    if (!currentUser) {
      this.error.set('Utilisateur non connecté');
      this.loading.set(false);
      return;
    }

    this.historyService.getGames().subscribe({
      next: (dtos) => {
        const mapped = dtos
          .map(dto => this.historyService.toHistoryEntry(dto, currentUser.userId))
          .sort((a, b) => {
            if (!a.playedAt && !b.playedAt) return 0;
            if (!a.playedAt) return 1;
            if (!b.playedAt) return -1;
            return new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime();
          });
        this.entries.set(mapped);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger l\'historique');
        this.loading.set(false);
      },
    });
  }

  onGameClick(entry: GameHistoryEntry): void {
    this.router.navigate(['/history', entry.gameId], { state: { entry } });
  }

  goToDashboard(): void {
    this.router.navigate(['/lobby']);
  }

  resultLabel(result: GameHistoryEntry['result']): string {
    switch (result) {
      case 'WIN':  return 'Victoire';
      case 'LOSS': return 'Défaite';
      case 'DRAW': return '½-½';
    }
  }

  playerColor(entry: GameHistoryEntry): 'white' | 'black' {
    return entry.opponentUsername === entry.blackUsername ? 'white' : 'black';
  }
}
