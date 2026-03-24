import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject, NEVER } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { filter, retryWhen, tap, catchError, map } from 'rxjs/operators';
import { WebSocketReconnectionService } from './websocket-reconnection.service';
import { WebSocketMessage, WebSocketClientMessage, ConnectionState } from '../models';

/**
 * Generic WebSocket service with reconnection support
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private readonly reconnectionService = inject(WebSocketReconnectionService);

  private socket$: WebSocketSubject<any> | null = null;
  private messagesSubject = new Subject<WebSocketMessage>();
  private reconnectAttempts = 0;

  // Connection state signal
  private connectionStateSignal = signal<ConnectionState>('disconnected');
  public connectionState = this.connectionStateSignal.asReadonly();

  // Messages observable
  public messages$ = this.messagesSubject.asObservable();

  /**
   * Connect to WebSocket server
   * @param url - WebSocket URL
   * @param token - JWT token for authentication
   */
  connect(url: string, token: string): void {
    if (this.socket$) {
      console.warn('WebSocket already connected');
      return;
    }

    // Build WebSocket URL with token as query parameter
    const wsUrl = `${url}?token=${token}`;

    console.log('Connecting to WebSocket:', wsUrl);
    this.connectionStateSignal.set('connecting');

    this.socket$ = webSocket({
      url: wsUrl,
      openObserver: {
        next: () => {
          console.log('WebSocket connected');
          this.connectionStateSignal.set('connected');
          this.reconnectAttempts = 0;
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket closed');
          this.connectionStateSignal.set('disconnected');
        }
      }
    });

    // Subscribe to incoming messages
    this.socket$
      .pipe(
        tap((message: WebSocketMessage) => {
          console.log('WebSocket message received:', message);
        }),
        retryWhen(errors => {
          this.connectionStateSignal.set('reconnecting');
          return this.reconnectionService.reconnectStrategy(errors);
        }),
        catchError(error => {
          console.error('WebSocket error:', error);
          this.connectionStateSignal.set('failed');
          return NEVER;
        })
      )
      .subscribe({
        next: (message: WebSocketMessage) => {
          this.messagesSubject.next(message);
        },
        error: (error) => {
          console.error('WebSocket subscription error:', error);
          this.connectionStateSignal.set('failed');
        }
      });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket$) {
      console.log('Disconnecting WebSocket');
      this.socket$.complete();
      this.socket$ = null;
      this.connectionStateSignal.set('disconnected');
    }
  }

  /**
   * Send message to WebSocket server
   * @param message - Message to send
   */
  send<T extends WebSocketClientMessage>(message: T): void {
    if (!this.socket$) {
      console.error('Cannot send message: WebSocket not connected');
      return;
    }

    console.log('Sending WebSocket message:', message);
    this.socket$.next(message);
  }

  /**
   * Filter messages by type
   * @param type - Message type to filter
   */
  onMessage<T extends WebSocketMessage>(type: T['type']): Observable<T> {
    return this.messages$.pipe(
      filter((message): message is T => message.type === type)
    );
  }

  /**
   * Get current connection state value
   */
  isConnected(): boolean {
    return this.connectionState() === 'connected';
  }
}
