import { Injectable, inject, signal, computed } from '@angular/core';
import { Subject, Subscription, interval, takeUntil } from 'rxjs';
import { WebSocketService } from '../../../core/websocket/services/websocket.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { environment } from '../../../../environments/environment';
import {
  MoveAttemptMessage,
  MoveExecutedMessage,
  MoveRejectedMessage,
  GameStateSyncMessage,
  PlayerDisconnectedMessage,
  PlayerReconnectedMessage,
  GameResignedMessage,
  DrawOfferedMessage,
  DrawAcceptedMessage,
  DrawRejectedMessage,
  ResignMessage,
  OfferDrawMessage,
  AcceptDrawMessage,
  RejectDrawMessage,
  ClaimTimeoutMessage,
  TimeoutConfirmedMessage,
  TimeoutClaimRejectedMessage,
  PieceType
} from '../../../core/websocket/models';
import { GameState, initialGameState } from '../models';
import { calculateWhiteCapturedPieces, calculateBlackCapturedPieces } from '../utils/captured-pieces.util';

/**
 * Game service
 * Manages game state and WebSocket communication
 */
@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly wsService = inject(WebSocketService);
  private readonly tokenStorage = inject(TokenStorageService);

  private destroy$ = new Subject<void>();

  // Game state signal
  private gameStateSignal = signal<GameState | null>(null);
  public gameState = this.gameStateSignal.asReadonly();

  // Clock signals (updated every second client-side + re-synced from server)
  private whiteTimeMsSignal = signal<number | null>(null);
  private blackTimeMsSignal = signal<number | null>(null);
  public readonly whiteTimeMs = this.whiteTimeMsSignal.asReadonly();
  public readonly blackTimeMs = this.blackTimeMsSignal.asReadonly();
  private clockSubscription: Subscription | null = null;

  // Computed signals
  public isMyTurn = computed(() => {
    const state = this.gameState();
    return state && state.currentSide === state.myColor;
  });

  public myOrientation = computed(() => {
    const state = this.gameState();
    return state?.myColor === 'WHITE' ? 'white' : 'black';
  });

  public opponentPlayer = computed(() => {
    const state = this.gameState();
    if (!state) return null;
    return state.myColor === 'WHITE' ? state.blackPlayer : state.whitePlayer;
  });

  public myPlayer = computed(() => {
    const state = this.gameState();
    if (!state) return null;
    return state.myColor === 'WHITE' ? state.whitePlayer : state.blackPlayer;
  });

  public winnerColor = computed(() => {
    const state = this.gameState();
    if (!state?.loserPlayerId) return null;
    return state.whitePlayer.playerId === state.loserPlayerId ? 'BLACK' : 'WHITE';
  });

  constructor() {
    this.setupMessageHandlers();
  }

  /**
   * Setup WebSocket message handlers
   */
  private setupMessageHandlers(): void {
    // Game state sync
    this.wsService.onMessage<GameStateSyncMessage>('GameStateSync')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('Game state sync received:', message);
        this.handleGameStateSync(message);
      });

    // Move executed
    this.wsService.onMessage<MoveExecutedMessage>('MoveExecuted')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('Move executed:', message);
        this.handleMoveExecuted(message);
      });

    // Move rejected
    this.wsService.onMessage<MoveRejectedMessage>('MoveRejected')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.error('Move rejected:', message.reason);
        alert(`Coup invalide : ${message.reason}`);
      });

    // Player disconnected
    this.wsService.onMessage<PlayerDisconnectedMessage>('PlayerDisconnected')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('Player disconnected:', message.playerId);
        this.handlePlayerDisconnected(message.playerId);
      });

    // Player reconnected
    this.wsService.onMessage<PlayerReconnectedMessage>('PlayerReconnected')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('Player reconnected:', message.playerId);
        this.handlePlayerReconnected(message.playerId);
      });

    // Game resigned
    this.wsService.onMessage<GameResignedMessage>('GameResigned')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('Game resigned:', message);
        this.handleGameResigned(message);
      });

    // Draw offered
    this.wsService.onMessage<DrawOfferedMessage>('DrawOffered')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('Draw offered:', message);
        this.handleDrawOffered(message);
      });

    // Draw accepted
    this.wsService.onMessage<DrawAcceptedMessage>('DrawAccepted')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('Draw accepted:', message);
        this.handleDrawAccepted(message);
      });

    // Draw rejected
    this.wsService.onMessage<DrawRejectedMessage>('DrawRejected')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('Draw rejected:', message);
        this.handleDrawRejected(message);
      });

    // Timeout confirmed
    this.wsService.onMessage<TimeoutConfirmedMessage>('TimeoutConfirmed')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('Timeout confirmed:', message);
        this.stopClock();
        this.gameStateSignal.update(state => {
          if (!state) return state;
          return { ...state, gameStatus: message.gameStatus, loserPlayerId: message.loserPlayerId };
        });
      });

    // Timeout claim rejected (server corrects remaining time)
    this.wsService.onMessage<TimeoutClaimRejectedMessage>('TimeoutClaimRejected')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('Timeout claim rejected, remaining:', message.remainingMs);
        const state = this.gameState();
        if (!state) return;
        if (state.currentSide === 'WHITE') {
          this.whiteTimeMsSignal.set(message.remainingMs);
        } else {
          this.blackTimeMsSignal.set(message.remainingMs);
        }
        this.startClock();
      });
  }

  /**
   * Start the client-side 1-second clock tick
   */
  private startClock(): void {
    this.stopClock();
    this.clockSubscription = interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.tickClock());
  }

  /**
   * Stop the clock
   */
  private stopClock(): void {
    this.clockSubscription?.unsubscribe();
    this.clockSubscription = null;
  }

  /**
   * Decrement clock by 1s for the active side.
   * The clock only starts after each player has made their first move
   * (moveHistory.length < 2 means one or both sides haven't moved yet).
   */
  private tickClock(): void {
    const state = this.gameState();
    if (!state) return;
    if (state.moveHistory.length < 2) return;

    const isWhiteTurn = state.currentSide === 'WHITE';
    if (isWhiteTurn) {
      const current = this.whiteTimeMsSignal();
      if (current === null || current <= 0) return;
      const next = Math.max(0, current - 1000);
      this.whiteTimeMsSignal.set(next);
      if (next === 0) this.claimTimeout();
    } else {
      const current = this.blackTimeMsSignal();
      if (current === null || current <= 0) return;
      const next = Math.max(0, current - 1000);
      this.blackTimeMsSignal.set(next);
      if (next === 0) this.claimTimeout();
    }
  }

  /**
   * Claim timeout (client-initiated when clock reaches 0)
   */
  claimTimeout(): void {
    if (!this.wsService.isConnected()) return;
    const message: ClaimTimeoutMessage = { type: 'ClaimTimeout' };
    this.wsService.send(message);
    this.stopClock();
  }

  /**
   * Connect to game WebSocket
   */
  connect(gameId: string, playerId: string): void {
    const token = this.tokenStorage.getToken();
    if (!token) {
      console.error('Cannot connect to game: No token found');
      return;
    }

    const wsUrl = `${environment.wsUrl}/ws/game/${gameId}`;
    console.log('Connecting to game WebSocket:', wsUrl);

    this.wsService.connect(wsUrl, token);

    // Don't pre-initialize the game state - wait for GameStateSync from server
    // This ensures we display the actual game position, not the starting position
  }

  /**
   * Make a move
   */
  makeMove(from: string, to: string, promotion?: PieceType): void {
    if (!this.wsService.isConnected()) {
      console.error('Cannot make move: WebSocket not connected');
      return;
    }

    if (!this.isMyTurn()) {
      console.warn('Not your turn!');
      return;
    }

    const message: MoveAttemptMessage = {
      type: 'MoveAttempt',
      from,
      to,
      promotion
    };

    this.wsService.send(message);
    console.log('Move sent:', message);
  }

  /**
   * Resign from the game
   */
  resign(): void {
    if (!this.wsService.isConnected()) {
      console.error('Cannot resign: WebSocket not connected');
      return;
    }

    const message: ResignMessage = {
      type: 'Resign'
    };

    this.wsService.send(message);
    console.log('Resign message sent');
  }

  /**
   * Offer a draw to the opponent
   */
  offerDraw(): void {
    if (!this.wsService.isConnected()) {
      console.error('Cannot offer draw: WebSocket not connected');
      return;
    }

    const message: OfferDrawMessage = {
      type: 'OfferDraw'
    };

    this.wsService.send(message);
    console.log('Draw offer sent');
  }

  /**
   * Accept a draw offer
   */
  acceptDraw(): void {
    if (!this.wsService.isConnected()) {
      console.error('Cannot accept draw: WebSocket not connected');
      return;
    }

    const message: AcceptDrawMessage = {
      type: 'AcceptDraw'
    };

    this.wsService.send(message);
    console.log('Draw accepted');
  }

  /**
   * Reject a draw offer
   */
  rejectDraw(): void {
    if (!this.wsService.isConnected()) {
      console.error('Cannot reject draw: WebSocket not connected');
      return;
    }

    const message: RejectDrawMessage = {
      type: 'RejectDraw'
    };

    this.wsService.send(message);
    console.log('Draw rejected');
  }

  /**
   * Handle game state sync
   */
  private handleGameStateSync(message: GameStateSyncMessage): void {
    const currentState = this.gameState();

    // Get my info from current state or sessionStorage
    const myColor = currentState?.myColor ||
                    (sessionStorage.getItem('currentPlayerColor') as 'WHITE' | 'BLACK') ||
                    'WHITE';
    const myPlayerId = currentState?.myPlayerId ||
                       sessionStorage.getItem('currentPlayerId') ||
                       '';

    // Get last move from history
    const lastMove = message.moveHistory.length > 0
      ? message.moveHistory[message.moveHistory.length - 1]
      : null;

    // Calculate captured pieces
    const whiteCaptured = calculateWhiteCapturedPieces(message.positionFen);
    const blackCaptured = calculateBlackCapturedPieces(message.positionFen);

    this.gameStateSignal.set({
      gameId: message.gameId,
      whitePlayer: {
        playerId: message.whitePlayerId,
        username: message.whiteUsername,
        isConnected: true,
        capturedPieces: whiteCaptured
      },
      blackPlayer: {
        playerId: message.blackPlayerId,
        username: message.blackUsername,
        isConnected: true,
        capturedPieces: blackCaptured
      },
      currentPositionFen: message.positionFen,
      gameStatus: message.gameStatus,
      currentSide: message.currentSide,
      moveHistory: message.moveHistory,
      myColor,
      myPlayerId,
      isCheck: message.gameStatus === 'CHECK',
      lastMove,
      whiteTimeRemainingMs: message.whiteTimeRemainingMs,
      blackTimeRemainingMs: message.blackTimeRemainingMs,
      totalTimeSeconds: message.totalTimeSeconds,
      incrementSeconds: message.incrementSeconds
    });

    // Initialize clock signals
    this.whiteTimeMsSignal.set(message.whiteTimeRemainingMs ?? null);
    this.blackTimeMsSignal.set(message.blackTimeRemainingMs ?? null);

    // Start clock for active games
    if (message.gameStatus === 'IN_PROGRESS' || message.gameStatus === 'CHECK') {
      this.startClock();
    } else {
      this.stopClock();
    }
  }

  /**
   * Handle move executed
   */
  private handleMoveExecuted(message: MoveExecutedMessage): void {
    // Re-sync clock values from server (authoritative after each move)
    if (message.whiteTimeRemainingMs !== undefined) {
      this.whiteTimeMsSignal.set(message.whiteTimeRemainingMs);
    }
    if (message.blackTimeRemainingMs !== undefined) {
      this.blackTimeMsSignal.set(message.blackTimeRemainingMs);
    }

    // Manage clock based on resulting game status
    const isGameOver = message.gameStatus === 'CHECKMATE'
      || message.gameStatus === 'STALEMATE'
      || message.gameStatus === 'DRAW'
      || message.gameStatus === 'TIMEOUT';

    if (isGameOver) {
      this.stopClock();
    } else {
      // Restart the tick aligned with the new move timestamp
      this.startClock();
    }

    this.gameStateSignal.update(state => {
      if (!state) return state;

      // Calculate captured pieces after move
      const whiteCaptured = calculateWhiteCapturedPieces(message.newPositionFen);
      const blackCaptured = calculateBlackCapturedPieces(message.newPositionFen);

      return {
        ...state,
        currentPositionFen: message.newPositionFen,
        gameStatus: message.gameStatus,
        currentSide: message.currentSide,
        moveHistory: [...state.moveHistory, message.move],
        isCheck: message.isCheck,
        lastMove: message.move,
        whitePlayer: {
          ...state.whitePlayer,
          capturedPieces: whiteCaptured
        },
        blackPlayer: {
          ...state.blackPlayer,
          capturedPieces: blackCaptured
        }
      };
    });
  }

  /**
   * Handle player disconnected
   */
  private handlePlayerDisconnected(playerId: string): void {
    this.gameStateSignal.update(state => {
      if (!state) return state;

      const newState = { ...state };
      if (state.whitePlayer.playerId === playerId) {
        newState.whitePlayer = { ...state.whitePlayer, isConnected: false };
      } else if (state.blackPlayer.playerId === playerId) {
        newState.blackPlayer = { ...state.blackPlayer, isConnected: false };
      }
      return newState;
    });
  }

  /**
   * Handle player reconnected
   */
  private handlePlayerReconnected(playerId: string): void {
    this.gameStateSignal.update(state => {
      if (!state) return state;

      const newState = { ...state };
      if (state.whitePlayer.playerId === playerId) {
        newState.whitePlayer = { ...state.whitePlayer, isConnected: true };
      } else if (state.blackPlayer.playerId === playerId) {
        newState.blackPlayer = { ...state.blackPlayer, isConnected: true };
      }
      return newState;
    });
  }

  /**
   * Handle game resigned
   */
  private handleGameResigned(message: GameResignedMessage): void {
    this.stopClock();
    this.gameStateSignal.update(state => {
      if (!state) return state;
      return {
        ...state,
        gameStatus: message.gameStatus
      };
    });
  }

  /**
   * Handle draw offered
   */
  private handleDrawOffered(message: DrawOfferedMessage): void {
    this.gameStateSignal.update(state => {
      if (!state) return state;
      return {
        ...state,
        pendingDrawOffer: {
          offeredByPlayerId: message.offeredByPlayerId
        }
      };
    });
  }

  /**
   * Handle draw accepted
   */
  private handleDrawAccepted(message: DrawAcceptedMessage): void {
    this.stopClock();
    this.gameStateSignal.update(state => {
      if (!state) return state;
      return {
        ...state,
        gameStatus: message.gameStatus,
        pendingDrawOffer: undefined
      };
    });
  }

  /**
   * Handle draw rejected
   */
  private handleDrawRejected(message: DrawRejectedMessage): void {
    this.gameStateSignal.update(state => {
      if (!state) return state;
      return {
        ...state,
        pendingDrawOffer: undefined
      };
    });
  }

  /**
   * Disconnect from game
   */
  disconnect(): void {
    this.stopClock();
    this.wsService.disconnect();
    this.gameStateSignal.set(null);
    this.whiteTimeMsSignal.set(null);
    this.blackTimeMsSignal.set(null);
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
