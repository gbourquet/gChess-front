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
        const mapped = dtos.map(dto =>
          this.historyService.toHistoryEntry(dto, currentUser.userId)
        );
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
    this.router.navigate(['/dashboard']);
  }

  resultIcon(result: GameHistoryEntry['result']): string {
    switch (result) {
      case 'WIN':  return 'emoji_events';
      case 'LOSS': return 'sentiment_dissatisfied';
      case 'DRAW': return 'handshake';
    }
  }

  resultLabel(result: GameHistoryEntry['result']): string {
    switch (result) {
      case 'WIN':  return 'Victoire';
      case 'LOSS': return 'Défaite';
      case 'DRAW': return '½-½';
    }
  }

  resultColor(result: GameHistoryEntry['result']): string {
    switch (result) {
      case 'WIN':  return 'accent';
      case 'LOSS': return 'warn';
      case 'DRAW': return 'primary';
    }
  }
}
