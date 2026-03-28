import { Chess } from 'chess.js';
import { Move } from '../../../core/websocket/models';

/**
 * Replay all moves from the starting position and return the SAN string for each.
 * Returns an array of the same length as `moves`.
 * Falls back to "from-to" notation on error.
 */
export function calculateMoveSans(moves: Move[]): string[] {
  const sans: string[] = [];
  try {
    const chess = new Chess();
    for (const move of moves) {
      let promotion: 'q' | 'r' | 'b' | 'n' | undefined;
      if (move.promotion) {
        switch (move.promotion) {
          case 'QUEEN':  promotion = 'q'; break;
          case 'ROOK':   promotion = 'r'; break;
          case 'BISHOP': promotion = 'b'; break;
          case 'KNIGHT': promotion = 'n'; break;
        }
      }
      const result = chess.move({ from: move.from, to: move.to, promotion });
      sans.push(result?.san ?? `${move.from}-${move.to}`);
    }
  } catch {
    // If chess.js fails partway, fill the rest with coordinate notation
    while (sans.length < moves.length) {
      sans.push(`${moves[sans.length].from}-${moves[sans.length].to}`);
    }
  }
  return sans;
}

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
