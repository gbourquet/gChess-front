import { Component, input, output, computed, effect, viewChild, ElementRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Move } from '../../../../core/websocket/models';
import { calculateMoveSans } from '../../utils/chess-replay.util';

/**
 * Move history component
 * Displays the list of moves in algebraic notation
 */
@Component({
  selector: 'app-move-history',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './move-history.component.html',
  styleUrl: './move-history.component.css'
})
export class MoveHistoryComponent {
  // Inputs
  moveHistory = input.required<Move[]>();
  canGoPrevious = input<boolean>(false);
  canGoNext = input<boolean>(false);
  activeIndex = input<number | null>(null); // null = live (last move), -1 = initial, 0..n = specific move

  // Outputs
  goToFirst = output<void>();
  goPrevious = output<void>();
  goNext = output<void>();
  goToLast = output<void>();

  // View reference to the scrollable container
  moveListContainer = viewChild<ElementRef>('moveListContainer');

  constructor() {
    // Auto-scroll to active move when history or activeIndex changes
    effect(() => {
      const history = this.moveHistory();
      const active = this.activeIndex();
      const container = this.moveListContainer();

      if (!container || history.length === 0) return;

      setTimeout(() => {
        const element = container.nativeElement;
        // Resolve the actual active move index
        const resolvedIndex = active === null ? history.length - 1 : active;
        if (resolvedIndex < 0) {
          element.scrollTop = 0;
          return;
        }
        const activeEl = element.querySelector('[data-move-index="' + resolvedIndex + '"]');
        if (activeEl) {
          (activeEl as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
          element.scrollTop = element.scrollHeight;
        }
      }, 0);
    });
  }

  /** SAN strings for all moves, computed once per history change */
  moveSans = computed(() => calculateMoveSans(this.moveHistory()));

  /**
   * Group moves by pairs (white move + black move)
   */
  movePairs = computed(() => {
    const moves = this.moveHistory();
    const pairs: { number: number; whiteIdx: number | null; blackIdx: number | null }[] = [];

    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1,
        whiteIdx: i < moves.length ? i : null,
        blackIdx: i + 1 < moves.length ? i + 1 : null
      });
    }

    return pairs;
  });

  san(index: number | null): string {
    if (index === null) return '';
    return this.moveSans()[index] ?? '';
  }

  /**
   * Check if move history is empty
   */
  isEmpty = computed(() => this.moveHistory().length === 0);

  /**
   * Whether the half-move at the given 0-based index is the currently active one
   */
  isActive(halfMoveIndex: number): boolean {
    const active = this.activeIndex();
    const resolved = active === null ? this.moveHistory().length - 1 : active;
    return halfMoveIndex === resolved;
  }
}
