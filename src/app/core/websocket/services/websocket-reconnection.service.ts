import { Injectable } from '@angular/core';
import { Observable, timer, throwError } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment.development';

/**
 * WebSocket reconnection service with exponential backoff
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketReconnectionService {
  private readonly maxAttempts = environment.reconnectMaxAttempts;
  private readonly baseDelay = environment.reconnectBaseDelay;
  private readonly maxDelay = environment.reconnectMaxDelay;

  /**
   * Reconnection strategy with exponential backoff
   * @param error$ - The error observable
   * @returns Observable that retries with exponential backoff
   */
  reconnectStrategy(error$: Observable<any>): Observable<number> {
    return error$.pipe(
      mergeMap((error, attempt) => {
        // Check if max attempts reached
        if (attempt >= this.maxAttempts) {
          console.error(`WebSocket reconnection failed after ${this.maxAttempts} attempts`);
          return throwError(() => new Error('Max reconnection attempts reached'));
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay);

        console.log(`WebSocket reconnection attempt ${attempt + 1}/${this.maxAttempts} in ${delay}ms`);

        return timer(delay);
      })
    );
  }

  /**
   * Calculate delay for a specific attempt
   */
  calculateDelay(attempt: number): number {
    return Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay);
  }
}
