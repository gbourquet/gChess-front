import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, filter, tap, takeUntil, Subject } from 'rxjs';
import { WebSocketService } from '../../../core/websocket/services/websocket.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { environment } from '../../../../environments/environment';
import {
  MatchFoundMessage,
  QueuePositionUpdateMessage,
  isMatchFound,
  JoinQueueMessage,
  MatchmakingErrorMessage
} from '../../../core/websocket/models';
import { QueueState, initialQueueState } from '../models';

/**
 * Matchmaking service
 * Manages matchmaking queue via WebSocket
 */
@Injectable({
  providedIn: 'root'
})
export class MatchmakingService {
  private readonly wsService = inject(WebSocketService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private destroy$ = new Subject<void>();

  // Queue state signal
  private queueStateSignal = signal<QueueState>(initialQueueState);
  public queueState = this.queueStateSignal.asReadonly();

  // Match found observable
  public matchFound$: Observable<MatchFoundMessage>;

  constructor() {
    // Subscribe to match found messages
    this.matchFound$ = this.wsService.onMessage<MatchFoundMessage>('MatchFound').pipe(
      tap(message => {
        console.log('Match found!', message);
        this.queueStateSignal.update(state => ({
          ...state,
          status: 'match_found',
          inQueue: false
        }));
      })
    );

    // Subscribe to queue position updates
    this.wsService.onMessage<QueuePositionUpdateMessage>('QueuePositionUpdate')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('Queue position update:', message.position);
        this.queueStateSignal.update(state => ({
          ...state,
          position: message.position,
          status: 'in_queue',
          inQueue: true
        }));
      });

    // Subscribe to matchmaking errors
    this.wsService.onMessage<MatchmakingErrorMessage>('MatchmakingError')
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.error('Matchmaking error:', message.message);
        this.queueStateSignal.update(state => ({
          ...state,
          status: 'error',
          error: message.message,
          inQueue: false
        }));
      });
  }

  /**
   * Connect to matchmaking WebSocket
   */
  connect(): void {
    const token = this.tokenStorage.getToken();
    if (!token) {
      console.error('Cannot connect to matchmaking: No token found');
      return;
    }

    const wsUrl = `${environment.wsUrl}/ws/matchmaking`;
    console.log('Connecting to matchmaking WebSocket:', wsUrl);

    this.wsService.connect(wsUrl, token);
  }

  /**
   * Join the matchmaking queue
   */
  joinQueue(options?: {
    totalTimeMinutes?: number;
    incrementSeconds?: number;
  }): void {
    if (!this.wsService.isConnected()) {
      console.error('Cannot join queue: WebSocket not connected');
      return;
    }

    // Build time control label for display (e.g. "3+2")
    const timeControlLabel = options?.totalTimeMinutes !== undefined
      ? `${options.totalTimeMinutes}+${options.incrementSeconds ?? 0}`
      : undefined;

    this.queueStateSignal.update(state => ({
      ...state,
      status: 'joining',
      timeControlLabel
    }));

    const message: JoinQueueMessage = {
      type: 'JoinQueue',
      ...(options?.totalTimeMinutes !== undefined && { totalTimeMinutes: options.totalTimeMinutes }),
      ...(options?.incrementSeconds !== undefined && { incrementSeconds: options.incrementSeconds }),
    };

    this.wsService.send(message);
    console.log('Joining matchmaking queue', options);
  }

  /**
   * Leave the matchmaking queue
   */
  leaveQueue(): void {
    // Disconnect from WebSocket
    this.wsService.disconnect();

    // Reset state
    this.queueStateSignal.set(initialQueueState);
    console.log('Left matchmaking queue');
  }

  /**
   * Navigate to game when match is found
   */
  navigateToGame(matchData: MatchFoundMessage): void {
    console.log('Navigating to game:', matchData.gameId);

    // Store match data for game component
    sessionStorage.setItem('currentGameId', matchData.gameId);
    sessionStorage.setItem('currentPlayerId', matchData.playerId);
    sessionStorage.setItem('currentPlayerColor', matchData.yourColor);

    // Disconnect from matchmaking
    this.wsService.disconnect();

    // Navigate to game
    this.router.navigate(['/game', matchData.gameId]);
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsService.disconnect();
  }
}
