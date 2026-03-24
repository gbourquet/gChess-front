import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChessBoardComponent } from '../../../game/components/chess-board/chess-board.component';
import { MoveHistoryComponent } from '../../../game/components/move-history/move-history.component';
import { GameHistoryService } from '../../services/game-history.service';
import { GameHistoryEntry, MoveSummaryDTO } from '../../models/game-history.model';
import { GameStatus } from '../../../../core/websocket/models/common.model';
import { Move } from '../../../../core/websocket/models';
import { calculateFenAtMove } from '../../../game/utils/chess-replay.util';

@Component({
  selector: 'app-game-review',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ChessBoardComponent,
    MoveHistoryComponent,
  ],
  templateUrl: './game-review.component.html',
  styleUrl: './game-review.component.css',
})
export class GameReviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly historyService = inject(GameHistoryService);

  moveDTOs = signal<MoveSummaryDTO[]>([]);
  currentMoveIndex = signal<number>(-1);
  loading = signal(true);
  error = signal<string | null>(null);
  gameSummary = signal<GameHistoryEntry | null>(null);

  // Convert DTOs to Move[] for display and replay
  moves = computed<Move[]>(() =>
    this.moveDTOs().map(dto => ({
      from: dto.from,
      to: dto.to,
      promotion: dto.promotion as Move['promotion'],
    }))
  );

  currentFen = computed(() =>
    calculateFenAtMove(this.moves(), this.currentMoveIndex())
  );

  canGoPrevious = computed(() => this.currentMoveIndex() > -1);
  canGoNext = computed(() => this.currentMoveIndex() < this.moves().length - 1);
  isAtEnd = computed(() =>
    this.moves().length > 0 && this.currentMoveIndex() === this.moves().length - 1
  );

  resultBanner = computed(() => {
    const summary = this.gameSummary();
    if (!summary) return null;
    const reason = this.statusLabel(summary.status);
    const winner = summary.winnerSide === 'white'
      ? summary.whiteUsername
      : summary.winnerSide === 'black'
      ? summary.blackUsername
      : null;
    const winnerSide = summary.winnerSide === 'white' ? 'Blancs' : summary.winnerSide === 'black' ? 'Noires' : null;
    return { winner, winnerSide, reason };
  });

  constructor() {
    const navState = this.router.getCurrentNavigation()?.extras.state ?? history.state;
    if (navState?.entry) {
      this.gameSummary.set(navState.entry as GameHistoryEntry);
    }
  }

  ngOnInit(): void {
    const gameId = this.route.snapshot.paramMap.get('gameId')!;
    this.historyService.getMoves(gameId).subscribe({
      next: (dtos) => {
        this.moveDTOs.set(dtos);
        this.currentMoveIndex.set(-1);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les coups de cette partie');
        this.loading.set(false);
      },
    });
  }

  private statusLabel(status: GameStatus): string {
    switch (status) {
      case 'CHECKMATE': return 'Échec et mat';
      case 'STALEMATE': return 'Pat';
      case 'DRAW':      return 'Nulle';
      case 'RESIGNED':  return 'Abandon';
      case 'TIMEOUT':   return 'Temps écoulé';
      default:          return status;
    }
  }

  goToFirst(): void    { this.currentMoveIndex.set(-1); }
  goToPrevious(): void {
    if (this.canGoPrevious()) this.currentMoveIndex.update(i => i - 1);
  }
  goToNext(): void {
    if (this.canGoNext()) this.currentMoveIndex.update(i => i + 1);
  }
  goToLast(): void     { this.currentMoveIndex.set(this.moves().length - 1); }

  goBack(): void { this.router.navigate(['/history']); }
}
