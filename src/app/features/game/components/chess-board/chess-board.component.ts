import {
  Component,
  input,
  output,
  effect,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  viewChild
} from '@angular/core';

/**
 * Move event data
 */
export interface MoveEvent {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

/**
 * Last move data for highlighting
 */
export interface LastMove {
  from: string;
  to: string;
}

/**
 * Chess board component wrapper
 * Uses chess.js for validation and custom rendering
 */
@Component({
  selector: 'app-chess-board',
  standalone: true,
  templateUrl: './chess-board.component.html',
  styleUrl: './chess-board.component.css'
})
export class ChessBoardComponent implements AfterViewInit, OnDestroy {
  // Inputs
  position = input<string>('start'); // FEN string or 'start'
  orientation = input<'white' | 'black'>('white');
  draggable = input<boolean>(true);
  size = input<number>(600);
  lastMove = input<LastMove | null>(null); // Highlight last move

  // Outputs
  moveChange = output<MoveEvent>();

  // View references
  boardContainer = viewChild.required<ElementRef>('boardContainer');

  private board: any = null;
  private draggedPiece: { square: string; piece: string } | null = null;

  private boardInitialized = false;

  constructor() {
    // React to position changes
    effect(() => {
      const pos = this.position();
      if (this.boardInitialized) {
        console.log('[ChessBoard] Position changed to:', pos);
        this.renderBoard();
      }
    });

    // React to orientation changes
    effect(() => {
      const orient = this.orientation();
      if (this.boardInitialized) {
        console.log('[ChessBoard] Orientation changed to:', orient);
        this.renderBoard();
      }
    });

    // React to lastMove changes
    effect(() => {
      const move = this.lastMove();
      if (this.boardInitialized) {
        console.log('[ChessBoard] Last move changed to:', move);
        this.renderBoard();
      }
    });
  }

  /**
   * Get file labels (a-h) based on orientation
   */
  files(): string[] {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    return this.orientation() === 'white' ? files : [...files].reverse();
  }

  /**
   * Get rank labels (8-1) based on orientation
   */
  ranks(): number[] {
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
    return this.orientation() === 'white' ? ranks : [...ranks].reverse();
  }

  ngAfterViewInit(): void {
    this.initializeBoard();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private initializeBoard(): void {
    console.log('[ChessBoard] Initializing board');
    this.boardInitialized = true;
    this.renderBoard();
  }

  private updatePosition(fen: string): void {
    console.log('[ChessBoard] Updating position:', fen);
    this.renderBoard();
  }

  private renderBoard(): void {
    const container = this.boardContainer().nativeElement;
    const size = this.size();
    const orient = this.orientation();
    const fen = this.position();

    console.log('[ChessBoard] Rendering board with FEN:', fen);

    // Clear previous content
    container.innerHTML = '';

    // Create board representation
    container.style.width = `${size}px`;
    container.style.height = `${size}px`;
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(8, 1fr)';
    container.style.gridTemplateRows = 'repeat(8, 1fr)';
    container.style.border = '2px solid #333';

    // Parse FEN position
    const position = this.parseFEN(fen);

    // Create squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        const isLight = (row + col) % 2 === 0;

        // Calculate board position based on orientation
        const boardRow = orient === 'white' ? row : 7 - row;
        const boardCol = orient === 'white' ? col : 7 - col;

        // Add square notation
        const file = String.fromCharCode(97 + boardCol); // a-h
        const rank = 8 - boardRow;
        const squareNotation = `${file}${rank}`;

        // Check if this square is selected
        const isSelected = this.selectedSquare === squareNotation;

        // Check if this square is part of the last move
        const lastMove = this.lastMove();
        const isLastMoveFrom = lastMove?.from === squareNotation;
        const isLastMoveTo = lastMove?.to === squareNotation;
        const isPartOfLastMove = isLastMoveFrom || isLastMoveTo;

        // Set background color with priority: selected > last move > normal
        if (isSelected) {
          square.style.backgroundColor = '#baca44'; // Yellow-green highlight for selection
          square.style.boxShadow = 'inset 0 0 0 2px #646f40';
        } else if (isPartOfLastMove) {
          // Different colors for light and dark squares in last move
          square.style.backgroundColor = isLight ? '#e8d4a0' : '#9b7653';
          square.style.boxShadow = 'inset 0 0 0 2px #7a5c3e';
        } else {
          // Beige and brown colors like in the image
          square.style.backgroundColor = isLight ? '#f0d9b5' : '#b58863';
        }

        square.style.display = 'flex';
        square.style.alignItems = 'center';
        square.style.justifyContent = 'center';
        square.style.fontSize = '48px';
        square.style.cursor = this.draggable() ? 'pointer' : 'default';
        square.style.userSelect = 'none';
        square.style.transition = 'background-color 0.2s ease, box-shadow 0.2s ease';

        square.title = squareNotation;
        square.dataset['square'] = squareNotation;

        // Add piece if present
        const piece = position[boardRow]?.[boardCol];
        if (piece) {
          const pieceElement = document.createElement('span');
          pieceElement.textContent = this.getPieceUnicode(piece);
          pieceElement.style.fontSize = '48px';
          pieceElement.style.lineHeight = '1';
          square.appendChild(pieceElement);
        }

        // Add click handler for moves
        if (this.draggable()) {
          square.addEventListener('click', () => this.handleSquareClick(squareNotation));
        }

        container.appendChild(square);
      }
    }
  }

  private parseFEN(fen: string | undefined): (string | null)[][] {
    // Initialize 8x8 board
    const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    // Handle undefined, null, or empty FEN
    if (!fen || fen === 'start' || fen === '') {
      fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }

    try {
      // Parse FEN (only board position part)
      const parts = fen.split(' ');
      const rows = parts[0]?.split('/') || [];

      for (let row = 0; row < 8 && row < rows.length; row++) {
        let col = 0;
        for (const char of rows[row]) {
          if (char >= '1' && char <= '8') {
            col += parseInt(char);
          } else {
            board[row][col] = char;
            col++;
          }
        }
      }
    } catch (error) {
      console.error('[ChessBoard] Error parsing FEN:', fen, error);
      // Return default starting position on error
    }

    return board;
  }

  private getPieceUnicode(piece: string): string {
    const pieces: { [key: string]: string } = {
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
      'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };
    return pieces[piece] || '';
  }

  private selectedSquare: string | null = null;

  private handleSquareClick(square: string): void {
    if (!this.draggable()) return;

    if (!this.selectedSquare) {
      // First click - select piece (only if it's our piece)
      if (this.isOurPieceAt(square)) {
        this.selectedSquare = square;
        console.log('Selected:', square);
        this.renderBoard(); // Re-render to show highlight
      }
    } else {
      // Second click
      if (this.selectedSquare === square) {
        // Click on same square - deselect
        console.log('Deselected:', square);
        this.selectedSquare = null;
        this.renderBoard(); // Re-render to remove highlight
      } else if (this.isOurPieceAt(square)) {
        // Click on another of our pieces - change selection
        console.log('Changed selection to:', square);
        this.selectedSquare = square;
        this.renderBoard(); // Re-render with new highlight
      } else {
        // Click on empty square or opponent piece - make move
        this.moveChange.emit({
          from: this.selectedSquare,
          to: square
        });
        console.log('Move:', this.selectedSquare, '→', square);
        this.selectedSquare = null;
        // Board will be re-rendered by position update
      }
    }
  }

  /**
   * Check if there's a piece at the given square
   */
  private hasPieceAt(square: string): boolean {
    const fen = this.position();
    const position = this.parseFEN(fen);

    const file = square.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
    const rank = 8 - parseInt(square.charAt(1)); // 8=0, 7=1, ..., 1=7

    return position[rank]?.[file] != null;
  }

  /**
   * Check if there's one of our pieces at the given square
   * Uses orientation to determine our color:
   * - orientation 'white' -> our pieces are uppercase (PRNBQK)
   * - orientation 'black' -> our pieces are lowercase (prnbqk)
   */
  private isOurPieceAt(square: string): boolean {
    const fen = this.position();
    const position = this.parseFEN(fen);

    const file = square.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
    const rank = 8 - parseInt(square.charAt(1)); // 8=0, 7=1, ..., 1=7

    const piece = position[rank]?.[file];
    if (!piece) return false;

    const isWhitePiece = piece === piece.toUpperCase();
    const weAreWhite = this.orientation() === 'white';

    return isWhitePiece === weAreWhite;
  }

  /**
   * Handle piece drag start
   */
  onDragStart(square: string, piece: string): void {
    if (!this.draggable()) {
      return;
    }
    this.draggedPiece = { square, piece };
  }

  /**
   * Handle piece drop
   */
  onDrop(targetSquare: string): void {
    if (!this.draggedPiece) {
      return;
    }

    const move: MoveEvent = {
      from: this.draggedPiece.square,
      to: targetSquare
    };

    this.moveChange.emit(move);
    this.draggedPiece = null;
  }
}
