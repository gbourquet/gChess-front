import { Injectable, inject, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WebSocketService } from '../../../core/websocket/services/websocket.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { environment } from '../../../../environments/environment.development';
import {
  GameStateSyncMessage,
  MoveExecutedMessage,
  PlayerDisconnectedMessage,
  PlayerReconnectedMessage,
  GameResignedMessage,
  DrawAcceptedMessage
} from '../../../core/websocket/models';
import { GameState, initialGameState } from '../models';
import { calculateWhiteCapturedPieces, calculateBlackCapturedPieces } from '../utils/captured-pieces.util';

/**
 * Spectator state
 */
export interface SpectatorState extends Omit<GameState, 'myColor' | 'myPlayerId'> {
  isSpectating: boolean;
}

/**
 * Spectate service
 * Manages spectator mode (read-only game observation)
 */
@Injectable({
  providedIn: 'root'
})
export class SpectateService {
  private readonly wsService = inject(WebSocketService);
  private readonly tokenStorage = inject(TokenStorageService);

  private destroy$ = new Subject<void>();

  // Spectator state signal
  private spectatorStateSignal = signal<SpectatorState | null>(null);
  public spectatorState = this.spectatorStateSignal.asReadonly();

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
        console.log('[Spectate] Game state sync received:', message);
        this.handleGameStateSync(message);
      });

    // Move executed
    this.wsService.onMessage<MoveExecutedMessage>('MoveExecuted')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('[Spectate] Move executed:', message);
        this.handleMoveExecuted(message);
      });

    // Player disconnected
    this.wsService.onMessage<PlayerDisconnectedMessage>('PlayerDisconnected')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('[Spectate] Player disconnected:', message.playerId);
        this.handlePlayerDisconnected(message.playerId);
      });

    // Player reconnected
    this.wsService.onMessage<PlayerReconnectedMessage>('PlayerReconnected')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('[Spectate] Player reconnected:', message.playerId);
        this.handlePlayerReconnected(message.playerId);
      });

    // Game resigned
    this.wsService.onMessage<GameResignedMessage>('GameResigned')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('[Spectate] Game resigned:', message);
        this.handleGameResigned(message);
      });

    // Draw accepted
    this.wsService.onMessage<DrawAcceptedMessage>('DrawAccepted')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('[Spectate] Draw accepted:', message);
        this.handleDrawAccepted(message);
      });
  }

  /**
   * Connect to spectate WebSocket
   */
  connect(gameId: string): void {
    const token = this.tokenStorage.getToken();
    if (!token) {
      console.error('[Spectate] Cannot connect: No token found');
      return;
    }

    const wsUrl = `${environment.wsUrl}/ws/game/${gameId}/spectate`;
    console.log('[Spectate] Connecting to spectate WebSocket:', wsUrl);

    this.wsService.connect(wsUrl, token);

    // Initialize spectator state
    this.spectatorStateSignal.set({
      ...initialGameState,
      gameId,
      currentPositionFen: 'start',
      whitePlayer: { playerId: '', isConnected: true },
      blackPlayer: { playerId: '', isConnected: true },
      moveHistory: [],
      currentSide: 'WHITE',
      gameStatus: 'IN_PROGRESS',
      isCheck: false,
      lastMove: null,
      isSpectating: true
    } as SpectatorState);
  }

  /**
   * Handle game state sync
   */
  private handleGameStateSync(message: GameStateSyncMessage): void {
    // Get last move from history
    const lastMove = message.moveHistory.length > 0
      ? message.moveHistory[message.moveHistory.length - 1]
      : null;

    // Calculate captured pieces
    const whiteCaptured = calculateWhiteCapturedPieces(message.positionFen);
    const blackCaptured = calculateBlackCapturedPieces(message.positionFen);

    // For spectators, we don't know the usernames yet
    // They will be displayed as "Joueur blanc" / "Joueur noir" or fetched later
    this.spectatorStateSignal.set({
      gameId: message.gameId,
      whitePlayer: {
        playerId: message.whitePlayerId,
        username: undefined,  // Could be fetched from API later
        isConnected: true,
        capturedPieces: whiteCaptured
      },
      blackPlayer: {
        playerId: message.blackPlayerId,
        username: undefined,  // Could be fetched from API later
        isConnected: true,
        capturedPieces: blackCaptured
      },
      currentPositionFen: message.positionFen,
      gameStatus: message.gameStatus,
      currentSide: message.currentSide,
      moveHistory: message.moveHistory,
      isCheck: message.gameStatus === 'CHECK',
      lastMove,
      isSpectating: true
    });
  }

  /**
   * Handle move executed
   */
  private handleMoveExecuted(message: MoveExecutedMessage): void {
    this.spectatorStateSignal.update(state => {
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
    this.spectatorStateSignal.update(state => {
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
    this.spectatorStateSignal.update(state => {
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
    this.spectatorStateSignal.update(state => {
      if (!state) return state;
      return {
        ...state,
        gameStatus: message.gameStatus
      };
    });
  }

  /**
   * Handle draw accepted
   */
  private handleDrawAccepted(message: DrawAcceptedMessage): void {
    this.spectatorStateSignal.update(state => {
      if (!state) return state;
      return {
        ...state,
        gameStatus: message.gameStatus
      };
    });
  }

  /**
   * Disconnect from spectate
   */
  disconnect(): void {
    this.wsService.disconnect();
    this.spectatorStateSignal.set(null);
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
