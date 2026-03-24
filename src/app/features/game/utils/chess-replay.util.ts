import { Chess } from 'chess.js';
import { Move } from '../../../core/websocket/models';

/**
 * Replay moves up to a given index and return the resulting FEN.
 * index -1 → starting position
 * index 0 → after move 0 (first move)
 */
export function calculateFenAtMove(moves: Move[], index: number): string {
  if (index < 0 || moves.length === 0) {
    return new Chess().fen();
  }

  try {
    const chess = new Chess();
    const upTo = Math.min(index, moves.length - 1);

    for (let i = 0; i <= upTo; i++) {
      const move = moves[i];
      let promotion: 'q' | 'r' | 'b' | 'n' | undefined;

      if (move.promotion) {
        switch (move.promotion) {
          case 'QUEEN':  promotion = 'q'; break;
          case 'ROOK':   promotion = 'r'; break;
          case 'BISHOP': promotion = 'b'; break;
          case 'KNIGHT': promotion = 'n'; break;
        }
      }

      chess.move({ from: move.from, to: move.to, promotion });
    }

    return chess.fen();
  } catch {
    return new Chess().fen();
  }
}
