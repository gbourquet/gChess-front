import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ChessBoardComponent } from '../../components/chess-board/chess-board.component';
import { PlayerInfoComponent } from '../../components/player-info/player-info.component';
import { GameStatusComponent } from '../../components/game-status/game-status.component';
import { MoveHistoryComponent } from '../../components/move-history/move-history.component';
import { SpectateService } from '../../services/spectate.service';

/**
 * Spectate page component
 * Allows users to watch ongoing games (read-only mode)
 */
@Component({
  selector: 'app-spectate',
  standalone: true,
  imports: [
    MatGridListModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    ChessBoardComponent,
    PlayerInfoComponent,
    GameStatusComponent,
    MoveHistoryComponent
  ],
  templateUrl: './spectate.component.html',
  styleUrl: './spectate.component.css'
})
export class SpectateComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly spectateService = inject(SpectateService);

  // Spectator state from service
  spectatorState = this.spectateService.spectatorState;

  ngOnInit(): void {
    // Get game ID from route
    const gameId = this.route.snapshot.paramMap.get('gameId');

    if (!gameId) {
      console.error('[Spectate] No game ID provided');
      this.router.navigate(['/lobby']);
      return;
    }

    // Connect to spectate WebSocket
    console.log('[Spectate] Connecting to game:', gameId);
    this.spectateService.connect(gameId);
  }

  ngOnDestroy(): void {
    this.spectateService.disconnect();
  }

  /**
   * Leave spectate mode and return to dashboard
   */
  leaveSpectate(): void {
    this.spectateService.disconnect();
    this.router.navigate(['/lobby']);
  }
}
