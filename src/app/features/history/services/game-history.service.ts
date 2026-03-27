import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GameSummaryDTO, MoveSummaryDTO, GameHistoryEntry } from '../models/game-history.model';

@Injectable({
  providedIn: 'root',
})
export class GameHistoryService {
  private readonly http = inject(HttpClient);
  private readonly BASE_URL = `${environment.apiUrl}/api/history`;

  getGames(): Observable<GameSummaryDTO[]> {
    return this.http.get<GameSummaryDTO[]>(`${this.BASE_URL}/games`);
  }

  getMoves(gameId: string): Observable<MoveSummaryDTO[]> {
    return this.http.get<MoveSummaryDTO[]>(`${this.BASE_URL}/games/${gameId}/moves`);
  }

  toHistoryEntry(dto: GameSummaryDTO, currentUserId: string): GameHistoryEntry {
    const isWhite = dto.whiteUserId === currentUserId;
    const opponentUsername = isWhite ? dto.blackUsername : dto.whiteUsername;

    let result: 'WIN' | 'LOSS' | 'DRAW';
    if (!dto.winnerUserId) {
      result = 'DRAW';
    } else if (dto.winnerUserId === currentUserId) {
      result = 'WIN';
    } else {
      result = 'LOSS';
    }

    const timeControlLabel = dto.totalTimeSeconds
      ? `${dto.totalTimeSeconds / 60}+${dto.incrementSeconds ?? 0}`
      : undefined;

    const winnerSide: 'white' | 'black' | undefined = dto.winnerUserId
      ? (dto.winnerUserId === dto.whiteUserId ? 'white' : 'black')
      : undefined;

    return {
      gameId: dto.gameId,
      whiteUsername: dto.whiteUsername,
      blackUsername: dto.blackUsername,
      winnerSide,
      opponentUsername,
      result,
      status: dto.status,
      moveCount: dto.moveCount,
      timeControlLabel,
      totalTimeSeconds: dto.totalTimeSeconds,
      incrementSeconds: dto.incrementSeconds,
      whiteTimeRemainingMs: dto.whiteTimeRemainingMs,
      blackTimeRemainingMs: dto.blackTimeRemainingMs,
      playedAt: dto.playedAt ? new Date(dto.playedAt) : undefined,
    };
  }
}
