import { Component, inject, OnInit, signal, computed, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChessBoardComponent } from '../../../game/components/chess-board/chess-board.component';
import { MoveHistoryComponent } from '../../../game/components/move-history/move-history.component';
import { GameClockComponent } from '../../../game/components/game-clock/game-clock.component';
import { GameHistoryService } from '../../services/game-history.service';
import { TokenStorageService } from '../../../../core/auth/services/token-storage.service';
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
    GameClockComponent,
  ],
  templateUrl: './game-review.component.html',
  styleUrl: './game-review.component.css',
})
export class GameReviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly historyService = inject(GameHistoryService);
  private readonly tokenStorage = inject(TokenStorageService);

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

  // Clock snapshots: index 0 = initial position, index i+1 = after move i.
  // null = no per-move data (fallback to start/end times only).
  private clocksHistory = computed(() => {
    const summary = this.gameSummary();
    const totalSec = summary?.totalTimeSeconds;
    if (!totalSec) return null;

    const startMs = totalSec * 1000;
    const incrementMs = (summary!.incrementSeconds ?? 0) * 1000;
    const dtos = this.moveDTOs();
    const hasTimes = dtos.some(d => d.timeSpentMs != null);
    if (!hasTimes) return null;

    const snapshots: { whiteMs: number; blackMs: number }[] = [{ whiteMs: startMs, blackMs: startMs }];
    let whiteMs = startMs;
    let blackMs = startMs;

    for (let i = 0; i < dtos.length; i++) {
      const spent = dtos[i].timeSpentMs ?? 0;
      if (i % 2 === 0) {
        whiteMs = Math.min(startMs, Math.max(0, whiteMs - spent) + incrementMs);
      } else {
        blackMs = Math.min(startMs, Math.max(0, blackMs - spent) + incrementMs);
      }
      snapshots.push({ whiteMs, blackMs });
    }

    return snapshots;
  });

  boardFlipped = signal(false);
  boardSize = signal(460);

  @HostListener('window:resize')
  onResize() { this.updateBoardSize(); }

  private updateBoardSize() {
    const w = window.innerWidth;
    if (w <= 480) {
      this.boardSize.set(Math.min(380, w - 48));
    } else if (w <= 768) {
      this.boardSize.set(Math.min(400, w - 60));
    } else {
      this.boardSize.set(460);
    }
  }

  boardOrientation = computed<'white' | 'black'>(() => {
    const summary = this.gameSummary();
    const username = this.tokenStorage.getUser()?.username;
    const flipped = this.boardFlipped();
    let base: 'white' | 'black' = 'white';
    if (summary && username && username === summary.blackUsername) base = 'black';
    return (base === 'white') !== flipped ? 'white' : 'black';
  });

  flipBoard(): void {
    this.boardFlipped.update(v => !v);
  }

  // Top = opponent side, bottom = current player side
  topUsername = computed(() => {
    const s = this.gameSummary();
    return this.boardOrientation() === 'white' ? s?.blackUsername : s?.whiteUsername;
  });
  bottomUsername = computed(() => {
    const s = this.gameSummary();
    return this.boardOrientation() === 'white' ? s?.whiteUsername : s?.blackUsername;
  });
  topTimeMs = computed(() =>
    this.boardOrientation() === 'white' ? this.currentBlackMs() : this.currentWhiteMs()
  );
  bottomTimeMs = computed(() =>
    this.boardOrientation() === 'white' ? this.currentWhiteMs() : this.currentBlackMs()
  );

  hasClocks = computed(() => {
    const summary = this.gameSummary();
    if (!summary) return false;
    const hasTotalTime = !!summary.totalTimeSeconds;
    const hasFinalTimes = summary.whiteTimeRemainingMs != null && summary.blackTimeRemainingMs != null;
    return hasTotalTime || hasFinalTimes;
  });

  currentWhiteMs = computed(() => {
    const history = this.clocksHistory();
    const summary = this.gameSummary();
    const idx = this.currentMoveIndex();
    const moveCount = this.moveDTOs().length;

    if (history) {
      return history[idx + 1]?.whiteMs ?? null;
    }
    // Fallback: start time at initial, final time at last position
    if (summary?.totalTimeSeconds && idx < 0) {
      return summary.totalTimeSeconds * 1000;
    }
    if (summary?.whiteTimeRemainingMs != null && idx === moveCount - 1) {
      return summary.whiteTimeRemainingMs;
    }
    return null;
  });

  currentBlackMs = computed(() => {
    const history = this.clocksHistory();
    const summary = this.gameSummary();
    const idx = this.currentMoveIndex();
    const moveCount = this.moveDTOs().length;

    if (history) {
      return history[idx + 1]?.blackMs ?? null;
    }
    // Fallback: start time at initial, final time at last position
    if (summary?.totalTimeSeconds && idx < 0) {
      return summary.totalTimeSeconds * 1000;
    }
    if (summary?.blackTimeRemainingMs != null && idx === moveCount - 1) {
      return summary.blackTimeRemainingMs;
    }
    return null;
  });

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
    this.updateBoardSize();
    const gameId = this.route.snapshot.paramMap.get('gameId')!;

    const moves$ = this.historyService.getMoves(gameId);

    if (this.gameSummary()) {
      moves$.subscribe({
        next: (dtos) => {
          this.moveDTOs.set(dtos);
          this.loading.set(false);
        },
        error: () => { this.error.set('Impossible de charger les coups de cette partie'); this.loading.set(false); },
      });
    } else {
      // Nav state lost (direct URL, refresh) — fetch both in parallel
      forkJoin({ moves: moves$, games: this.historyService.getGames() }).subscribe({
        next: ({ moves, games }) => {
          const currentUserId = this.tokenStorage.getUser()?.userId;
          const dto = games.find(g => g.gameId === gameId);
          if (dto && currentUserId) {
            this.gameSummary.set(this.historyService.toHistoryEntry(dto, currentUserId));
          }
          this.moveDTOs.set(moves);
          this.loading.set(false);
        },
        error: () => { this.error.set('Impossible de charger les coups de cette partie'); this.loading.set(false); },
      });
    }
  }

  resultLabel(result: 'WIN' | 'LOSS' | 'DRAW'): string {
    switch (result) {
      case 'WIN':  return 'Victoire';
      case 'LOSS': return 'Défaite';
      case 'DRAW': return '½-½';
    }
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
