import { Component, OnInit, OnDestroy, inject, signal, computed, effect, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChessBoardComponent, MoveEvent } from '../../components/chess-board/chess-board.component';
import { PlayerInfoComponent } from '../../components/player-info/player-info.component';
import { GameStatusComponent } from '../../components/game-status/game-status.component';
import { MoveHistoryComponent } from '../../components/move-history/move-history.component';
import { PromotionDialogComponent } from '../../components/promotion-dialog/promotion-dialog.component';
import { GameClockComponent } from '../../components/game-clock/game-clock.component';
import { GameService } from '../../services/game.service';
import { PieceType } from '../../../../core/websocket/models';
import { Chess } from 'chess.js';

/**
 * Game board page component
 * Main game interface integrating all game components
 */
@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [
    MatGridListModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ChessBoardComponent,
    PlayerInfoComponent,
    GameStatusComponent,
    MoveHistoryComponent,
    GameClockComponent
  ],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.css'
})
export class GameBoardComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gameService = inject(GameService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Game state from service
  gameState = this.gameService.gameState;
  isMyTurn = this.gameService.isMyTurn;
  myOrientation = this.gameService.myOrientation;
  opponentPlayer = this.gameService.opponentPlayer;
  myPlayer = this.gameService.myPlayer;
  whiteTimeMs = this.gameService.whiteTimeMs;
  blackTimeMs = this.gameService.blackTimeMs;

  // Local state
  private pendingMove = signal<{ from: string; to: string } | null>(null);
  boardSize = signal<number>(480);

  // Move history navigation
  currentMoveIndex = signal<number | null>(null); // null = at latest move

  // Computed: position to display based on currentMoveIndex
  displayPosition = computed(() => {
    const state = this.gameState();
    if (!state) return 'start';

    const index = this.currentMoveIndex();

    // If at latest move, show current position
    if (index === null || index >= state.moveHistory.length - 1) {
      return state.currentPositionFen;
    }

    // If at starting position (before any moves)
    if (index === -1) {
      return 'start';
    }

    // Calculate position at the given move index
    return this.calculatePositionAtMove(index);
  });

  // Computed: last move to highlight based on currentMoveIndex
  displayLastMove = computed(() => {
    const state = this.gameState();
    if (!state) return null;

    const index = this.currentMoveIndex();

    // If at latest move, show actual last move
    if (index === null || index >= state.moveHistory.length - 1) {
      return state.lastMove;
    }

    // If at starting position, no move to highlight
    if (index === -1) {
      return null;
    }

    // Show the move at current index
    return state.moveHistory[index] || null;
  });

  // Computed: can go to previous move
  canGoPrevious = computed(() => {
    const state = this.gameState();
    if (!state || state.moveHistory.length === 0) return false;

    const index = this.currentMoveIndex();
    // Can go previous if not at starting position (index -1)
    return index === null ? true : index > -1;
  });

  // Computed: can go to next move
  canGoNext = computed(() => {
    const state = this.gameState();
    if (!state || state.moveHistory.length === 0) return false;

    const index = this.currentMoveIndex();
    // Can go next if not at latest move
    return index !== null && index < state.moveHistory.length - 1;
  });

  // Computed: is at latest move
  isAtLatestMove = computed(() => {
    const state = this.gameState();
    if (!state || state.moveHistory.length === 0) return true;

    const index = this.currentMoveIndex();
    // At latest if index is null OR at or beyond the last move
    return index === null || index >= state.moveHistory.length - 1;
  });

  constructor() {
    // Track move history length to reset navigation when new moves arrive
    let previousHistoryLength = 0;

    effect(() => {
      const state = this.gameState();
      const currentHistoryLength = state?.moveHistory.length ?? 0;

      // Reset to latest move when history changes (new move played)
      if (currentHistoryLength > previousHistoryLength) {
        this.currentMoveIndex.set(null);
      }

      previousHistoryLength = currentHistoryLength;
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.updateBoardSize();
  }

  private updateBoardSize() {
    const width = window.innerWidth;
    if (width <= 480) {
      this.boardSize.set(Math.min(320, width - 40));
    } else if (width <= 768) {
      this.boardSize.set(Math.min(400, width - 60));
    } else if (width <= 992) {
      this.boardSize.set(Math.min(450, width - 80));
    } else {
      this.boardSize.set(480);
    }
  }

  ngOnInit(): void {
    this.updateBoardSize();
    // Get route parameters
    const gameId = this.route.snapshot.paramMap.get('gameId');
    const playerId = sessionStorage.getItem('currentPlayerId');

    if (!gameId) {
      this.showError('ID de partie manquant');
      this.router.navigate(['/dashboard']);
      return;
    }

    if (!playerId) {
      this.showError('ID de joueur manquant');
      this.router.navigate(['/dashboard']);
      return;
    }

    // Connect to game
    console.log('Connecting to game:', gameId, 'as player:', playerId);
    this.gameService.connect(gameId, playerId);
  }

  ngOnDestroy(): void {
    this.gameService.disconnect();
  }

  /**
   * Handle move attempt from chess board
   */
  async onMoveAttempt(moveEvent: MoveEvent): Promise<void> {
    if (!this.isMyTurn()) {
      this.showError('Ce n\'est pas votre tour !');
      return;
    }

    const { from, to } = moveEvent;

    // Check if move requires promotion (pawn reaching last rank)
    const promotion = await this.checkPromotion(from, to);

    // Make the move
    this.gameService.makeMove(from, to, promotion);
  }

  /**
   * Check if move requires promotion and open dialog if needed
   */
  private async checkPromotion(from: string, to: string): Promise<PieceType | undefined> {
    const state = this.gameState();
    if (!state) return undefined;

    // Check if the piece being moved is a pawn
    const piece = this.getPieceAt(from, state.currentPositionFen);
    if (!piece || (piece.toLowerCase() !== 'p')) {
      return undefined; // Not a pawn, no promotion
    }

    // Check if pawn is reaching last rank
    const toRank = to.charAt(1);
    const isPromotion =
      (state.myColor === 'WHITE' && toRank === '8') ||
      (state.myColor === 'BLACK' && toRank === '1');

    if (!isPromotion) {
      return undefined;
    }

    // Open promotion dialog
    const dialogRef = this.dialog.open(PromotionDialogComponent, {
      disableClose: true,
      data: { color: state.myColor }
    });

    const result = await dialogRef.afterClosed().toPromise();
    return result || 'QUEEN'; // Default to queen if dialog is closed
  }

  /**
   * Get the piece at a specific square from FEN notation
   */
  private getPieceAt(square: string, fen: string): string | null {
    if (!fen) return null;

    // Parse square (e.g., 'e2' -> file: 4, rank: 6)
    const file = square.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
    const rank = 8 - parseInt(square.charAt(1)); // 8=0, 7=1, ..., 1=7

    // Parse FEN (only board position part)
    const fenParts = fen.split(' ');
    const rows = fenParts[0]?.split('/') || [];

    if (rank < 0 || rank >= rows.length) return null;

    // Parse the row to find the piece at the file
    let col = 0;
    for (const char of rows[rank]) {
      if (char >= '1' && char <= '8') {
        col += parseInt(char);
      } else {
        if (col === file) {
          return char; // Found the piece
        }
        col++;
      }
    }

    return null; // Empty square
  }

  /**
   * Leave game and return to dashboard
   */
  leaveGame(): void {
    if (confirm('Voulez-vous vraiment quitter la partie ?')) {
      this.gameService.disconnect();
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Resign from the game
   */
  resign(): void {
    if (confirm('Voulez-vous vraiment abandonner la partie ? Vous perdrez automatiquement.')) {
      this.gameService.resign();
    }
  }

  /**
   * Offer a draw to the opponent
   */
  offerDraw(): void {
    const state = this.gameState();
    if (!state) return;

    if (state.pendingDrawOffer) {
      this.showError('Une proposition de nulle est déjà en cours');
      return;
    }

    if (confirm('Voulez-vous proposer la nulle à votre adversaire ?')) {
      this.gameService.offerDraw();
      this.snackBar.open('Proposition de nulle envoyée', 'Fermer', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  /**
   * Accept a draw offer from the opponent
   */
  acceptDrawOffer(): void {
    this.gameService.acceptDraw();
  }

  /**
   * Reject a draw offer from the opponent
   */
  rejectDrawOffer(): void {
    this.gameService.rejectDraw();
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Go to previous move in history
   */
  goToPreviousMove(): void {
    const state = this.gameState();
    if (!state || state.moveHistory.length === 0) return;

    const currentIndex = this.currentMoveIndex();

    if (currentIndex === null) {
      // At latest move, go to second-to-last
      this.currentMoveIndex.set(state.moveHistory.length - 2);
    } else if (currentIndex >= 0) {
      // Go one move back (can go to -1 for starting position)
      this.currentMoveIndex.set(currentIndex - 1);
    }
  }

  /**
   * Go to next move in history
   */
  goToNextMove(): void {
    const state = this.gameState();
    if (!state) return;

    const currentIndex = this.currentMoveIndex();

    if (currentIndex === null) return; // Already at latest

    if (currentIndex >= state.moveHistory.length - 1) {
      // Go to latest move
      this.currentMoveIndex.set(null);
    } else {
      // Go one move forward
      this.currentMoveIndex.set(currentIndex + 1);
    }
  }

  /**
   * Calculate FEN position at a specific move index
   */
  private calculatePositionAtMove(moveIndex: number): string {
    const state = this.gameState();
    if (!state) return 'start';

    try {
      // Start with initial position
      const chess = new Chess();

      // Play moves up to and including the target index
      for (let i = 0; i <= moveIndex && i < state.moveHistory.length; i++) {
        const move = state.moveHistory[i];

        // Convert promotion piece type to chess.js format
        let promotion: 'q' | 'r' | 'b' | 'n' | undefined;
        if (move.promotion) {
          switch (move.promotion) {
            case 'QUEEN':
              promotion = 'q';
              break;
            case 'ROOK':
              promotion = 'r';
              break;
            case 'BISHOP':
              promotion = 'b';
              break;
            case 'KNIGHT':
              promotion = 'n';
              break;
          }
        }

        chess.move({
          from: move.from,
          to: move.to,
          promotion
        });
      }

      return chess.fen();
    } catch (error) {
      console.error('Error calculating position at move', moveIndex, error);
      return state.currentPositionFen;
    }
  }

  /**
   * Get opponent color
   */
  getOpponentColor(): 'WHITE' | 'BLACK' {
    const state = this.gameState();
    return state?.myColor === 'WHITE' ? 'BLACK' : 'WHITE';
  }
}
