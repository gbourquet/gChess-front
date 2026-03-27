import {
  Component,
  input,
  output,
  effect,
  signal,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  viewChild
} from '@angular/core';
import { Chess } from 'chess.js';

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
  premoveAllowed = input<boolean>(false);
  size = input<number>(600);
  lastMove = input<LastMove | null>(null); // Highlight last move
  isCheck = input<boolean>(false);
  currentSide = input<'white' | 'black'>('white');

  // Outputs
  moveChange = output<MoveEvent>();
  flipRequest = output<void>();

  // Local state
  showCoords = signal(true);

  // View references
  boardContainer = viewChild.required<ElementRef>('boardContainer');
  coordWrapper = viewChild.required<ElementRef>('coordWrapper');

  private board: any = null;
  private draggedPiece: { square: string; piece: string } | null = null;
  private boardInitialized = false;

  // Regular move selection state (our turn)
  private selectedSquare: string | null = null;
  private legalMoveTargets: Set<string> = new Set();

  // Premove state (opponent's turn)
  private premoveSelectingFrom: string | null = null;  // piece being aimed for premove
  private premoveTargets: Set<string> = new Set();     // candidate destinations shown
  private premoveFrom: string | null = null;           // confirmed premove origin
  private premoveTo: string | null = null;             // confirmed premove destination

  constructor() {
    // React to position changes — also fires premove when it becomes our turn
    effect(() => {
      const pos = this.position();
      const canMove = this.draggable();
      if (this.boardInitialized) {
        if (this.premoveFrom && this.premoveTo && canMove) {
          // It's now our turn: execute the queued premove
          const from = this.premoveFrom;
          const to = this.premoveTo;
          this.clearPremove();
          this.renderBoard();
          this.moveChange.emit({ from, to });
        } else {
          // New position while opponent is playing: keep premove but clear selection
          this.selectedSquare = null;
          this.legalMoveTargets = new Set();
          this.renderBoard();
        }
      }
    });

    // React to orientation changes
    effect(() => {
      const orient = this.orientation();
      if (this.boardInitialized) {
        this.renderBoard();
      }
    });

    // React to lastMove changes
    effect(() => {
      const move = this.lastMove();
      if (this.boardInitialized) {
        this.renderBoard();
      }
    });

    // React to isCheck changes
    effect(() => {
      const check = this.isCheck();
      if (this.boardInitialized) {
        this.renderBoard();
      }
    });
  }

  toggleCoords(): void {
    this.showCoords.update(v => !v);
  }

  onFlipRequest(): void {
    this.flipRequest.emit();
  }

  files(): string[] {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    return this.orientation() === 'white' ? files : [...files].reverse();
  }

  ranks(): number[] {
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
    return this.orientation() === 'white' ? ranks : [...ranks].reverse();
  }

  ngAfterViewInit(): void {
    this.initializeBoard();
  }

  ngOnDestroy(): void {}

  private initializeBoard(): void {
    this.boardInitialized = true;
    this.renderBoard();
  }

  private updatePosition(fen: string): void {
    this.renderBoard();
  }

  /**
   * Compute legal move targets for the given square using chess.js
   */
  private computeLegalMoves(square: string): Set<string> {
    const targets = new Set<string>();
    try {
      let fen = this.position();
      if (!fen || fen === 'start' || fen === '') {
        fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      }
      const chess = new Chess(fen);
      const moves = chess.moves({ square: square as any, verbose: true });
      for (const m of moves) {
        targets.add(m.to);
      }
    } catch (e) {
      // Ignore parse errors
    }
    return targets;
  }

  /**
   * Compute premove candidate destinations: all squares the piece could
   * legally reach from the current board, ignoring whose turn it actually is.
   * Uses only the piece placement + our color — strips castling/en passant to
   * avoid creating an invalid position for chess.js.
   */
  private computePremoveTargets(square: string): Set<string> {
    const targets = new Set<string>();
    try {
      let fen = this.position();
      if (!fen || fen === 'start' || fen === '') {
        fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      }
      // Keep only the board part and set the active side to ours
      const boardPart = fen.split(' ')[0];
      const ourColor = this.orientation() === 'white' ? 'w' : 'b';
      const chess = new Chess(`${boardPart} ${ourColor} - - 0 1`);
      const moves = chess.moves({ square: square as any, verbose: true });
      for (const m of moves) {
        targets.add(m.to);
      }
    } catch (e) {
      console.error('[ChessBoard] computePremoveTargets error:', e);
    }
    return targets;
  }

  private clearPremove(): void {
    this.premoveSelectingFrom = null;
    this.premoveTargets = new Set();
    this.premoveFrom = null;
    this.premoveTo = null;
  }

  private renderBoard(): void {
    const container = this.boardContainer().nativeElement;
    const size = this.size();
    this.coordWrapper().nativeElement.style.setProperty('--sq', `${size / 8}px`);
    const orient = this.orientation();
    const fen = this.position();

    container.innerHTML = '';

    container.style.width = `${size}px`;
    container.style.height = `${size}px`;
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(8, 1fr)';
    container.style.gridTemplateRows = 'repeat(8, 1fr)';
    container.style.border = '2px solid #333';

    const position = this.parseFEN(fen);

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        const isLight = (row + col) % 2 === 0;

        const boardRow = orient === 'white' ? row : 7 - row;
        const boardCol = orient === 'white' ? col : 7 - col;

        const file = String.fromCharCode(97 + boardCol);
        const rank = 8 - boardRow;
        const squareNotation = `${file}${rank}`;

        const isSelected = this.selectedSquare === squareNotation;
        const isLegalTarget = this.legalMoveTargets.has(squareNotation);

        const isPremoveFrom = this.premoveFrom === squareNotation;
        const isPremoveTo = this.premoveTo === squareNotation;
        const isPremoveSelecting = this.premoveSelectingFrom === squareNotation;
        const isPremoveTarget = this.premoveTargets.has(squareNotation);

        const lastMove = this.lastMove();
        const isPartOfLastMove =
          lastMove?.from === squareNotation || lastMove?.to === squareNotation;

        const hasPiece = position[boardRow]?.[boardCol] != null;

        square.classList.remove('last-move-square', 'check-square');

        // Background priority: selected > premove > lastMove > normal
        if (isSelected) {
          square.style.backgroundColor = isLight ? '#6a8f6a' : '#3d6a3d';
          square.style.boxShadow = 'inset 0 0 0 2px rgba(255,255,255,0.35)';
        } else if (isPremoveFrom || isPremoveTo || isPremoveSelecting) {
          square.style.backgroundColor = isLight ? '#8a6a30' : '#5a4010';
          square.style.boxShadow = 'inset 0 0 0 2px rgba(255,200,80,0.5)';
        } else if (isPartOfLastMove) {
          square.classList.add('last-move-square');
          square.style.backgroundColor = isLight ? '#7a8a5a' : '#3a4a20';
          square.style.boxShadow = '';
        } else {
          square.style.backgroundColor = isLight ? '#5c7a8a' : '#2a3f4f';
          square.style.boxShadow = '';
        }

        square.style.display = 'flex';
        square.style.alignItems = 'center';
        square.style.justifyContent = 'center';
        square.style.fontSize = '48px';
        square.style.cursor = (this.draggable() || this.premoveAllowed()) ? 'pointer' : 'default';
        square.style.userSelect = 'none';
        square.style.position = 'relative';
        square.style.transition = 'background-color 0.2s ease, box-shadow 0.2s ease';

        // Check highlight
        const inCheck = this.isCheck();
        if (inCheck) {
          const kingChar = this.currentSide() === 'white' ? 'K' : 'k';
          const pieceHere = position[boardRow]?.[boardCol];
          if (pieceHere === kingChar) {
            square.classList.add('check-square');
            square.style.backgroundColor = '';
            square.style.boxShadow = '';
          }
        }

        square.title = squareNotation;
        square.dataset['square'] = squareNotation;

        // Piece rendering
        const piece = position[boardRow]?.[boardCol];
        if (piece) {
          const isWhitePiece = piece === piece.toUpperCase();

          const pieceElement = document.createElement('span');
          pieceElement.textContent = this.getPieceUnicode(piece);
          pieceElement.style.fontSize = '48px';
          pieceElement.style.lineHeight = '1';
          pieceElement.style.display = 'block';

          if (isWhitePiece) {
            pieceElement.style.color = '#c8bfaa';
            pieceElement.style.filter =
              'drop-shadow(0 1px 3px rgba(0,0,0,0.85))';
          } else {
            pieceElement.style.color = '#050505';
            pieceElement.style.filter =
              'drop-shadow(0 0 2px rgba(150,150,150,0.65)) drop-shadow(0 1px 2px rgba(0,0,0,0.9))';
          }
          square.appendChild(pieceElement);
        }

        // Legal move hint (our turn) — cyan
        if (isLegalTarget) {
          square.appendChild(this.makeMoveHint(hasPiece, 'rgba(0,229,255,0.45)', 'rgba(0,229,255,0.7)', '0 0 6px rgba(0,229,255,0.4)'));
        }

        // Premove hint — same cyan as regular move hints
        if (isPremoveTarget) {
          square.appendChild(this.makeMoveHint(hasPiece, 'rgba(0,229,255,0.45)', 'rgba(0,229,255,0.7)', '0 0 6px rgba(0,229,255,0.4)'));
        }

        // Click handlers
        if (this.draggable()) {
          square.addEventListener('click', () => this.handleSquareClick(squareNotation));
        } else if (this.premoveAllowed()) {
          square.addEventListener('click', () => this.handlePremoveClick(squareNotation));
        }

        container.appendChild(square);
      }
    }
  }

  /** Build a dot (empty square) or ring (capture) hint overlay */
  private makeMoveHint(hasPiece: boolean, dotColor: string, ringColor: string, dotShadow: string): HTMLElement {
    const hint = document.createElement('div');
    hint.style.position = 'absolute';
    hint.style.pointerEvents = 'none';
    hint.style.zIndex = '2';
    if (hasPiece) {
      hint.style.width = '100%';
      hint.style.height = '100%';
      hint.style.boxShadow = `inset 0 0 0 4px ${ringColor}`;
    } else {
      hint.style.width = '33%';
      hint.style.height = '33%';
      hint.style.borderRadius = '50%';
      hint.style.background = dotColor;
      hint.style.boxShadow = dotShadow;
    }
    return hint;
  }

  private parseFEN(fen: string | undefined): (string | null)[][] {
    const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    if (!fen || fen === 'start' || fen === '') {
      fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }

    try {
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
    }

    return board;
  }

  private getPieceUnicode(piece: string): string {
    const pieces: { [key: string]: string } = {
      'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟',
      'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };
    return pieces[piece] || '';
  }

  /** Handle click during our turn (regular move) */
  private handleSquareClick(square: string): void {
    if (!this.draggable()) return;

    if (!this.selectedSquare) {
      if (this.isOurPieceAt(square)) {
        this.selectedSquare = square;
        this.legalMoveTargets = this.computeLegalMoves(square);
        this.renderBoard();
      }
    } else {
      if (this.selectedSquare === square) {
        // Deselect
        this.selectedSquare = null;
        this.legalMoveTargets = new Set();
        this.renderBoard();
      } else if (this.isOurPieceAt(square) && !this.legalMoveTargets.has(square)) {
        // Switch to another piece
        this.selectedSquare = square;
        this.legalMoveTargets = this.computeLegalMoves(square);
        this.renderBoard();
      } else if (this.legalMoveTargets.has(square)) {
        // Emit move
        this.moveChange.emit({ from: this.selectedSquare, to: square });
        this.selectedSquare = null;
        this.legalMoveTargets = new Set();
      } else {
        // Click elsewhere — deselect
        this.selectedSquare = null;
        this.legalMoveTargets = new Set();
        this.renderBoard();
      }
    }
  }

  /** Handle click during opponent's turn (premove) */
  private handlePremoveClick(square: string): void {
    if (!this.premoveAllowed()) return;

    // If clicking on a confirmed premove square, cancel the premove
    if (this.premoveFrom && square === this.premoveFrom) {
      this.clearPremove();
      this.renderBoard();
      return;
    }

    // If a premove is already confirmed, a click on any of our pieces resets it
    if (this.premoveFrom && this.isOurPieceAt(square)) {
      this.clearPremove();
      this.premoveSelectingFrom = square;
      this.premoveTargets = this.computePremoveTargets(square);
      this.renderBoard();
      return;
    }

    if (!this.premoveSelectingFrom) {
      // Start premove selection
      if (this.isOurPieceAt(square)) {
        this.premoveSelectingFrom = square;
        this.premoveTargets = this.computePremoveTargets(square);
        this.renderBoard();
      }
    } else {
      if (this.premoveSelectingFrom === square) {
        // Deselect
        this.premoveSelectingFrom = null;
        this.premoveTargets = new Set();
        this.renderBoard();
      } else if (this.isOurPieceAt(square)) {
        // Switch selection to another of our pieces
        this.premoveSelectingFrom = square;
        this.premoveTargets = this.computePremoveTargets(square);
        this.renderBoard();
      } else if (this.premoveTargets.has(square)) {
        // Confirm premove
        this.premoveFrom = this.premoveSelectingFrom;
        this.premoveTo = square;
        this.premoveSelectingFrom = null;
        this.premoveTargets = new Set();
        this.renderBoard();
      } else {
        // Click elsewhere — cancel
        this.premoveSelectingFrom = null;
        this.premoveTargets = new Set();
        this.renderBoard();
      }
    }
  }

  private isOurPieceAt(square: string): boolean {
    const fen = this.position();
    const position = this.parseFEN(fen);

    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square.charAt(1));

    const piece = position[rank]?.[file];
    if (!piece) return false;

    const isWhitePiece = piece === piece.toUpperCase();
    const weAreWhite = this.orientation() === 'white';

    return isWhitePiece === weAreWhite;
  }

  onDragStart(square: string, piece: string): void {
    if (!this.draggable()) return;
    this.draggedPiece = { square, piece };
  }

  onDrop(targetSquare: string): void {
    if (!this.draggedPiece) return;
    this.moveChange.emit({ from: this.draggedPiece.square, to: targetSquare });
    this.draggedPiece = null;
  }
}
