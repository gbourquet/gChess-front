# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

gChess frontend application - a real-time chess game client that integrates with the gChess backend API (Kotlin-based DDD architecture with bitboard chess engine).

## Backend API Integration

### REST API (OpenAPI)
- Base URL: `http://localhost:8080`
- Authentication: JWT Bearer tokens
- Endpoints:
  - `POST /api/auth/register` - User registration (username, email, password)
  - `POST /api/auth/login` - Authentication (returns JWT token + UserDTO)

### WebSocket API (AsyncAPI)

Three separate WebSocket channels, all requiring JWT authentication:

**1. Matchmaking** (`/ws/matchmaking`)
- Connection scope: One per UserId
- Flow:
  1. Client sends `JoinQueue` message
  2. Server sends `QueuePositionUpdate` (position in queue)
  3. Server sends `MatchFound` (gameId, yourColor, playerId, opponentUserId)
  4. Client disconnects and connects to game channel

**2. Game Participation** (`/ws/game/{gameId}`)
- Connection scope: One per PlayerId (players can be in multiple games)
- Client → Server: `MoveAttempt` (from, to, optional promotion)
- Server → Client:
  - `MoveExecuted` (move, newPositionFen, gameStatus, currentSide) - broadcast to all
  - `MoveRejected` (reason) - sent only to player who attempted
  - `GameStateSync` - full state on connect/reconnect
  - `PlayerDisconnected` / `PlayerReconnected`

**3. Spectate** (`/ws/game/{gameId}/spectate`)
- Connection scope: One per UserId (observers only)
- Read-only: receives `GameStateSync`, `MoveExecuted`, player connection events
- Cannot send moves

### Authentication Flow
1. Register/login via REST API to obtain JWT token
2. Include JWT in WebSocket connections via:
   - Query parameter: `ws://localhost:8080/ws/matchmaking?token=YOUR_JWT`
   - OR Sec-WebSocket-Protocol header: `Bearer YOUR_JWT`
3. Server sends `AuthSuccess` (userId) or `AuthFailed` (reason)

### Key Concepts
- **UserId**: Permanent user identity (ULID format)
- **PlayerId**: Per-game participation identity (ULID format)
- **GameId**: Unique game identifier (ULID format)
- **FEN Notation**: Board positions encoded as Forsyth-Edwards Notation
- **Algebraic Notation**: Moves represented as positions (e.g., "e2", "e4")

### Message Types
All WebSocket messages include a `type` field for discriminated unions:
- Authentication: `AuthSuccess`, `AuthFailed`
- Matchmaking: `JoinQueue`, `QueuePositionUpdate`, `MatchFound`, `MatchmakingError`
- Gameplay: `MoveAttempt`, `MoveExecuted`, `MoveRejected`, `GameStateSync`
- Connection: `PlayerDisconnected`, `PlayerReconnected`
- Errors: `Error` (code, message)

### Game State
- `gameStatus`: `IN_PROGRESS`, `CHECK`, `CHECKMATE`, `STALEMATE`, `DRAW`
- `currentSide`: `WHITE`, `BLACK`
- Move history: array of moves (from, to, optional promotion)
- Promotion pieces: `QUEEN`, `ROOK`, `BISHOP`, `KNIGHT`

## Architecture Notes

The backend follows Domain-Driven Design with:
- Matchmaking indexed by UserId (permanent identity)
- Gameplay indexed by PlayerId (per-game participation)
- Spectators indexed by UserId (observer role)
- Shared WebSocketJwtAuth component across all bounded contexts
- Bitboard-based chess engine for move validation
