/**
 * Captured pieces utilities
 */

export interface CapturedPieces {
  pawns: number;
  rooks: number;
  knights: number;
  bishops: number;
  queens: number;
}

export interface PieceCounts {
  white: {
    pawns: number;
    rooks: number;
    knights: number;
    bishops: number;
    queens: number;
    kings: number;
  };
  black: {
    pawns: number;
    rooks: number;
    knights: number;
    bishops: number;
    queens: number;
    kings: number;
  };
}

/**
 * Starting position piece counts
 */
const STARTING_PIECES: PieceCounts = {
  white: {
    pawns: 8,
    rooks: 2,
    knights: 2,
    bishops: 2,
    queens: 1,
    kings: 1
  },
  black: {
    pawns: 8,
    rooks: 2,
    knights: 2,
    bishops: 2,
    queens: 1,
    kings: 1
  }
};

/**
 * Count pieces from FEN notation
 */
export function countPiecesFromFEN(fen: string): PieceCounts {
  const counts: PieceCounts = {
    white: { pawns: 0, rooks: 0, knights: 0, bishops: 0, queens: 0, kings: 0 },
    black: { pawns: 0, rooks: 0, knights: 0, bishops: 0, queens: 0, kings: 0 }
  };

  // Parse FEN (only board position part)
  const parts = fen.split(' ');
  const boardPart = parts[0] || '';

  for (const char of boardPart) {
    switch (char) {
      // White pieces (uppercase)
      case 'P': counts.white.pawns++; break;
      case 'R': counts.white.rooks++; break;
      case 'N': counts.white.knights++; break;
      case 'B': counts.white.bishops++; break;
      case 'Q': counts.white.queens++; break;
      case 'K': counts.white.kings++; break;
      // Black pieces (lowercase)
      case 'p': counts.black.pawns++; break;
      case 'r': counts.black.rooks++; break;
      case 'n': counts.black.knights++; break;
      case 'b': counts.black.bishops++; break;
      case 'q': counts.black.queens++; break;
      case 'k': counts.black.kings++; break;
    }
  }

  return counts;
}

/**
 * Calculate captured pieces for white player (pieces they captured from black)
 */
export function calculateWhiteCapturedPieces(fen: string): CapturedPieces {
  const currentCounts = countPiecesFromFEN(fen);

  return {
    pawns: Math.max(0, STARTING_PIECES.black.pawns - currentCounts.black.pawns),
    rooks: Math.max(0, STARTING_PIECES.black.rooks - currentCounts.black.rooks),
    knights: Math.max(0, STARTING_PIECES.black.knights - currentCounts.black.knights),
    bishops: Math.max(0, STARTING_PIECES.black.bishops - currentCounts.black.bishops),
    queens: Math.max(0, STARTING_PIECES.black.queens - currentCounts.black.queens)
  };
}

/**
 * Calculate captured pieces for black player (pieces they captured from white)
 */
export function calculateBlackCapturedPieces(fen: string): CapturedPieces {
  const currentCounts = countPiecesFromFEN(fen);

  return {
    pawns: Math.max(0, STARTING_PIECES.white.pawns - currentCounts.white.pawns),
    rooks: Math.max(0, STARTING_PIECES.white.rooks - currentCounts.white.rooks),
    knights: Math.max(0, STARTING_PIECES.white.knights - currentCounts.white.knights),
    bishops: Math.max(0, STARTING_PIECES.white.bishops - currentCounts.white.bishops),
    queens: Math.max(0, STARTING_PIECES.white.queens - currentCounts.white.queens)
  };
}

/**
 * Calculate material advantage (positive means white is ahead, negative means black is ahead)
 */
export function calculateMaterialAdvantage(fen: string): number {
  const whiteCaptured = calculateWhiteCapturedPieces(fen);
  const blackCaptured = calculateBlackCapturedPieces(fen);

  const pieceValues = {
    pawns: 1,
    knights: 3,
    bishops: 3,
    rooks: 5,
    queens: 9
  };

  const whiteValue =
    whiteCaptured.pawns * pieceValues.pawns +
    whiteCaptured.knights * pieceValues.knights +
    whiteCaptured.bishops * pieceValues.bishops +
    whiteCaptured.rooks * pieceValues.rooks +
    whiteCaptured.queens * pieceValues.queens;

  const blackValue =
    blackCaptured.pawns * pieceValues.pawns +
    blackCaptured.knights * pieceValues.knights +
    blackCaptured.bishops * pieceValues.bishops +
    blackCaptured.rooks * pieceValues.rooks +
    blackCaptured.queens * pieceValues.queens;

  return whiteValue - blackValue;
}
