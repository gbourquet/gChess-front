import { Component, inject, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatchmakingService } from '../../services/matchmaking.service';
import { WebSocketService } from '../../../../core/websocket/services/websocket.service';
import { ConnectionIndicatorComponent } from '../../../../shared/components/connection-indicator/connection-indicator.component';

/**
 * Matchmaking page component
 * Manages the matchmaking queue UI — always entered via lobby with a pre-selected time control
 */
@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatIconModule,
    ConnectionIndicatorComponent
  ],
  templateUrl: './matchmaking.component.html',
  styleUrl: './matchmaking.component.css'
})
export class MatchmakingComponent implements OnInit, OnDestroy {
  private readonly matchmakingService = inject(MatchmakingService);
  public readonly wsService = inject(WebSocketService);
  private readonly router = inject(Router);

  // Expose queue state
  public queueState = this.matchmakingService.queueState;

  // Time control passed from lobby via router state
  private timeControl = signal<{ totalTimeMinutes: number; incrementSeconds: number } | null>(null);
  private autoJoinFired = false;

  constructor() {
    // Read time control from router navigation state (set by LobbyComponent)
    const navState = this.router.getCurrentNavigation()?.extras.state ?? history.state;
    if (navState?.totalTimeMinutes !== undefined) {
      this.timeControl.set({
        totalTimeMinutes: navState.totalTimeMinutes,
        incrementSeconds: navState.incrementSeconds ?? 0,
      });
    } else {
      // No time control provided: redirect back to lobby
      this.router.navigate(['/lobby']);
    }

    // Auto-join queue once connected when a time control was pre-selected in lobby
    effect(() => {
      const connState = this.wsService.connectionState();
      const tc = this.timeControl();
      if (connState === 'connected' && tc && !this.autoJoinFired) {
        this.autoJoinFired = true;
        this.matchmakingService.joinQueue({
          totalTimeMinutes: tc.totalTimeMinutes,
          incrementSeconds: tc.incrementSeconds,
        });
      }
    });

    // Subscribe to match found event
    this.matchmakingService.matchFound$
      .pipe(takeUntilDestroyed())
      .subscribe(matchData => {
        this.matchmakingService.navigateToGame(matchData);
      });
  }

  ngOnInit(): void {
    // Connect to matchmaking WebSocket on component init
    this.matchmakingService.connect();
  }

  ngOnDestroy(): void {
    // Leave queue and disconnect on component destroy
    this.matchmakingService.leaveQueue();
  }

  /**
   * Leave the matchmaking queue
   */
  onLeaveQueue(): void {
    this.matchmakingService.leaveQueue();
    this.router.navigate(['/lobby']);
  }

  /**
   * Retry after error
   */
  onRetry(): void {
    this.matchmakingService.connect();
  }
}
