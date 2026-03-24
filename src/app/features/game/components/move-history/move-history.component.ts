import { Component, input, computed, effect, viewChild, ElementRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Move } from '../../../../core/websocket/models';

/**
 * Move history component
 * Displays the list of moves in algebraic notation
 */
@Component({
  selector: 'app-move-history',
  standalone: true,
  imports: [MatCardModule, MatListModule, MatDividerModule, MatIconModule],
  templateUrl: './move-history.component.html',
  styleUrl: './move-history.component.css'
})
export class MoveHistoryComponent {
  // Inputs
  moveHistory = input.required<Move[]>();

  // View reference to the scrollable container
  moveListContainer = viewChild<ElementRef>('moveListContainer');

  constructor() {
    // Auto-scroll to bottom when move history changes
    effect(() => {
      const history = this.moveHistory();
      const container = this.moveListContainer();

      if (container && history.length > 0) {
        // Use setTimeout to ensure DOM has been updated
        setTimeout(() => {
          const element = container.nativeElement;
          element.scrollTop = element.scrollHeight;
        }, 0);
      }
    });
  }

  /**
   * Group moves by pairs (white move + black move)
   */
  movePairs = computed(() => {
    const moves = this.moveHistory();
    const pairs: { number: number; white: Move | null; black: Move | null }[] = [];

    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1,
        white: moves[i] || null,
        black: moves[i + 1] || null
      });
    }

    return pairs;
  });

  /**
   * Format move to algebraic notation
   */
  formatMove(move: Move | null): string {
    if (!move) return '-';

    let notation = `${move.from}-${move.to}`;

    if (move.promotion) {
      const pieceSymbol = this.getPieceSymbol(move.promotion);
      notation += `=${pieceSymbol}`;
    }

    return notation;
  }

  /**
   * Get piece symbol for promotion
   */
  private getPieceSymbol(piece: string): string {
    switch (piece) {
      case 'QUEEN':
        return 'D';
      case 'ROOK':
        return 'T';
      case 'BISHOP':
        return 'F';
      case 'KNIGHT':
        return 'C';
      default:
        return '';
    }
  }

  /**
   * Check if move history is empty
   */
  isEmpty = computed(() => this.moveHistory().length === 0);
}
