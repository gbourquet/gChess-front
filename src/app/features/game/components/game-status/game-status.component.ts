import { Component, input, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Color, GameStatus } from '../../../../core/websocket/models';

/**
 * Game status component
 * Displays current turn and game status
 */
@Component({
  selector: 'app-game-status',
  standalone: true,
  imports: [MatCardModule, MatChipsModule, MatIconModule],
  templateUrl: './game-status.component.html',
  styleUrl: './game-status.component.css'
})
export class GameStatusComponent {
  // Inputs
  currentSide = input.required<Color>();
  gameStatus = input.required<GameStatus>();
  isMyTurn = input<boolean>(false);
  isCheck = input<boolean>(false);

  /**
   * Get turn label
   */
  turnLabel = computed(() => {
    return this.currentSide() === 'WHITE' ? 'Au tour des Blancs' : 'Au tour des Noirs';
  });

  /**
   * Get status label
   */
  statusLabel = computed(() => {
    const status = this.gameStatus();
    const isCheck = this.isCheck();

    switch (status) {
      case 'IN_PROGRESS':
      case 'CHECK':
        if (isCheck) {
          return this.isMyTurn() ? 'Échec ! C\'est votre tour' : 'Échec ! Tour de l\'adversaire';
        }
        return this.isMyTurn() ? 'C\'est votre tour !' : 'Tour de l\'adversaire';
      case 'CHECKMATE':
        const winner = this.currentSide() === 'WHITE' ? 'Noirs' : 'Blancs';
        return `Échec et mat ! ${winner} gagnent`;
      case 'STALEMATE':
        return 'Pat - Match nul';
      case 'DRAW':
        return 'Match nul';
      case 'RESIGNED':
        return 'Abandon';
      case 'TIMEOUT':
        return 'Temps écoulé';
      default:
        return 'En cours';
    }
  });

  /**
   * Get status chip color
   */
  statusColor = computed(() => {
    const status = this.gameStatus();
    const isCheck = this.isCheck();

    switch (status) {
      case 'IN_PROGRESS':
      case 'CHECK':
        if (isCheck) {
          return 'warn';
        }
        return this.isMyTurn() ? 'accent' : 'primary';
      case 'CHECKMATE':
      case 'RESIGNED':
      case 'TIMEOUT':
        return 'warn';
      case 'STALEMATE':
      case 'DRAW':
        return 'primary';
      default:
        return 'primary';
    }
  });

  /**
   * Get status icon
   */
  statusIcon = computed(() => {
    const status = this.gameStatus();
    const isCheck = this.isCheck();

    switch (status) {
      case 'IN_PROGRESS':
      case 'CHECK':
        if (isCheck) {
          return 'warning';
        }
        return this.isMyTurn() ? 'play_arrow' : 'hourglass_empty';
      case 'CHECKMATE':
        return 'emoji_events';
      case 'RESIGNED':
        return 'flag';
      case 'TIMEOUT':
        return 'timer_off';
      case 'STALEMATE':
      case 'DRAW':
        return 'handshake';
      default:
        return 'info';
    }
  });

  /**
   * Check if game is over
   */
  isGameOver = computed(() => {
    const status = this.gameStatus();
    return status === 'CHECKMATE' || status === 'STALEMATE' || status === 'DRAW' || status === 'RESIGNED' || status === 'TIMEOUT';
  });
}
