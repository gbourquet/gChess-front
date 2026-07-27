import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { WebSocketService } from '../../../core/websocket/services/websocket.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { Subject, filter } from 'rxjs';

describe('Bug Reproducer: Game Resignation - Wrong Winner', () => {
  let service: GameService;
  let wsServiceSpy: any;
  let tokenStorageSpy: any;

  let mockMessage$: Subject<any>;

  const whitePlayerId = 'player-white-123';
  const blackPlayerId = 'player-black-456';

  beforeEach(() => {
    // Sujet recréé à chaque test : sinon les services des tests précédents
    // restent abonnés et réagissent aux messages des tests suivants.
    mockMessage$ = new Subject<any>();

    wsServiceSpy = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      isConnected: vi.fn(() => true),
      // Le vrai WebSocketService filtre par type de message. Sans ce filtre,
      // chaque message était livré à TOUS les handlers : un GameResigned
      // atteignait handleMoveExecuted, qui plantait sur newPositionFen absent.
      onMessage: vi.fn((type: string) =>
        mockMessage$.pipe(filter((message: any) => message.type === type))
      )
    };

    tokenStorageSpy = {
      getToken: vi.fn(() => 'test-jwt-token')
    };

    TestBed.configureTestingModule({
      providers: [
        GameService,
        { provide: WebSocketService, useValue: wsServiceSpy },
        { provide: TokenStorageService, useValue: tokenStorageSpy }
      ]
    });

    service = TestBed.inject(GameService);
  });

  describe('When a player resigns', () => {
    it('BUG REPRODUCER: should set loserPlayerId so winnerColor is correctly calculated (white resigns)', async () => {
      service.connect('game-123', whitePlayerId);
      mockMessage$.next({
        type: 'GameStateSync',
        gameId: 'game-123',
        positionFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moveHistory: [],
        gameStatus: 'IN_PROGRESS',
        currentSide: 'WHITE',
        whitePlayerId,
        blackPlayerId,
        whiteUsername: 'WhitePlayer',
        blackUsername: 'BlackPlayer',
        totalTimeSeconds: 600,
        incrementSeconds: 0,
        whiteTimeRemainingMs: 600000,
        blackTimeRemainingMs: 600000
      });

      mockMessage$.next({
        type: 'GameResigned',
        resignedPlayerId: whitePlayerId,
        gameStatus: 'RESIGNED'
      });

      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check state directly instead of relying on computed
      const gameState = (service as any).gameStateSignal();
      expect(gameState.loserPlayerId).toBe(whitePlayerId);
      const winnerColor = (service as any).winnerColor();
      expect(winnerColor).toBe('BLACK');
    });

    it('BUG REPRODUCER: should set loserPlayerId so winnerColor is correctly calculated (black resigns)', async () => {
      service.connect('game-123', whitePlayerId);
      mockMessage$.next({
        type: 'GameStateSync',
        gameId: 'game-123',
        positionFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moveHistory: [],
        gameStatus: 'IN_PROGRESS',
        currentSide: 'WHITE',
        whitePlayerId,
        blackPlayerId,
        whiteUsername: 'WhitePlayer',
        blackUsername: 'BlackPlayer',
        totalTimeSeconds: 600,
        incrementSeconds: 0,
        whiteTimeRemainingMs: 600000,
        blackTimeRemainingMs: 600000
      });

      mockMessage$.next({
        type: 'GameResigned',
        resignedPlayerId: blackPlayerId,
        gameStatus: 'RESIGNED'
      });

      // Wait for async update
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check state directly instead of relying on computed
      const gameState = (service as any).gameStateSignal();
      expect(gameState.loserPlayerId).toBe(blackPlayerId);
      const winnerColor = (service as any).winnerColor();
      expect(winnerColor).toBe('WHITE');
    });
  });
});
