# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

gChess frontend: an Angular 21 real-time chess client for the gChess backend (`../gChess-back`, Kotlin/Ktor, in-house bitboard engine).

- **Domain language**: [`CONTEXT.md`](CONTEXT.md) holds the client terms (Lobby, Preset, Speed, Premove, History, Result…) and points to the back glossary for the domain terms (Player vs User, Side, Outcome, Timeout…). Use these terms in code, tests and issues.
- **Decisions**: [`docs/adr/`](docs/adr/) for client decisions; system-wide ones (server-authoritative clock, PlayerId…) are in `../gChess-back/docs/adr/`.
- **Protocol source of truth**: `../gChess-back/src/main/resources/asyncapi/asyncapi.yaml` and the back's OpenAPI spec. The `asyncapi.yaml` / `openapi.json` copies at this repo's root may be stale.

## Commands

```bash
npm install
npm start        # ng serve, http://localhost:4200
npm run build    # ng build
npm test         # ng test (Vitest + jsdom)
```

The backend URLs come from `src/environments/environment.ts` (production, domain compiled in) and `environment.development.ts` (localhost:8080).

## Structure

- `core/auth`: `AuthService`, `TokenStorageService` (JWT in **sessionStorage**, see ADR-0001), `jwt.interceptor`, `authGuard` / `publicGuard`
- `core/websocket`: `WebSocketService`, `WebSocketReconnectionService`, message models (discriminated unions on `type`)
- `features/`: `auth`, `dashboard`, `lobby` (Presets, Custom time control), `matchmaking`, `game` (play + spectate), `history` (list + Game review)
- State: services with Angular signals, no state library.
- Chess libraries: `chess.js` (legal-move hints, premoves, SAN) and `@chrisoakman/chessboardjs` (board). Both are meant to go: see GCH-8 and GCH-9.

Routes: `/auth/login`, `/auth/register`, `/dashboard`, `/lobby`, `/matchmaking`, `/game/:gameId`, `/game/:gameId/spectate`, `/history`, `/history/:gameId`. Everything but `/auth` is behind `authGuard`.

## Backend API

### REST (JWT Bearer, added by `jwt.interceptor`)
- `POST /api/auth/register`: registration (username, email, password)
- `POST /api/auth/login`: returns the JWT + user
- `GET /api/history/games`: the signed-in User's finished Games (`GameSummaryDTO`)
- `GET /api/history/games/{gameId}/moves`: the Moves of a Game (participants only)

### WebSocket

Authentication: `?token=<JWT>` query parameter (the server also accepts `Sec-WebSocket-Protocol`). The server answers `AuthSuccess` or `AuthFailed`.

**Matchmaking** `/ws/matchmaking`: one connection per UserId
- Client → Server: `JoinQueue` (`totalTimeMinutes`, `incrementSeconds`; 0/0 = untimed)
- Server → Client: `QueuePositionUpdate`, `MatchFound` (`gameId`, `playerId`, `yourColor`, `opponentUserId`), `MatchmakingError`
- Then the client connects to the game channel with the received `playerId`.

**Game** `/ws/game/{gameId}`: one connection per PlayerId (a User can play several Games)
- Client → Server: `MoveAttempt` (`from`, `to`, `promotion?`), `Resign`, `OfferDraw`, `AcceptDraw`, `RejectDraw`, `ClaimTimeout`
- Server → Client: `GameStateSync` (on connect/reconnect), `MoveExecuted` (`newPositionFen`, `gameStatus`, `currentSide`, `isCheck`, Clocks), `MoveRejected`, `PlayerDisconnected` / `PlayerReconnected`, `GameResigned`, `DrawOffered` / `DrawAccepted` / `DrawRejected`, `TimeoutConfirmed` (broadcast), `TimeoutClaimRejected` (to the claimer, with `remainingMs`), `Error`

**Spectate** `/ws/game/{gameId}/spectate`: read-only; receives `GameStateSync`, `MoveExecuted`, player connection events, `TimeoutConfirmed`.

### Game state
- `gameStatus`: `IN_PROGRESS`, `CHECKMATE`, `STALEMATE`, `DRAW`, `RESIGNED`, `TIMEOUT`. Check is **not** a status: it comes as `isCheck` (the `'CHECK'` value in `GameStatus` is dead, see GCH-7).
- `currentSide`: `WHITE` / `BLACK` (named "Color" in the client code until GCH-6).
- Promotion pieces: `QUEEN`, `ROOK`, `BISHOP`, `KNIGHT`.

### Clocks
The server is the only authority on Clocks (back ADR-0004). The client ticks locally every second for display only, resyncs on each `MoveExecuted` / `GameStateSync`, and sends `ClaimTimeout` when the opponent's Clock reaches zero. Each Side's first Move is free: Clocks only run once `moveHistory.length >= 2`.
