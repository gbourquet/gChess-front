# gChess front

Web client of gChess: where a User picks a Time control, waits for an opponent, plays or watches Games in real time and looks back at past Games.

Shared domain terms (User, Player, Side, Game, Move, Square, Position, Outcome, Draw offer, Time control, Clock, Timeout, Queue, Match…) are defined in the back glossary, [gChess-back/CONTEXT.md](../gChess-back/CONTEXT.md), and mean the same thing here. This file only holds the terms the client adds.

## Language

### Choosing a game

**Lobby**:
The screen where a User chooses the Time control they want before joining the Queue.
_Avoid_: Home, menu

**Preset**:
A ready-made Time control offered in the Lobby, written "base minutes + increment seconds" (e.g. 3+2).
_Avoid_: Mode, format

**Speed**:
The family of a Time control, from its estimated duration (base time + 40 × increment): Bullet under 3 minutes, Blitz under 8, Rapid under 25, Classical beyond. Every Time control has one, Preset or not.
_Avoid_: Category, cadence

**Custom time control**:
A Time control the User types in instead of picking a Preset.
_Avoid_: Free time control

### Playing and watching

**Check**:
The Side to move has its king attacked. Shown on the board, but not an Outcome: the Game goes on.
_Avoid_: Check status

**Premove**:
A Move a Player queues during the opponent's turn, sent automatically as soon as it is their turn, if it is still legal.
_Avoid_: Pre-move, queued move

**Captured pieces**:
The opponent's pieces a Side has taken so far, derived from the Position.
_Avoid_: Material, trophies

**Connection state**:
Whether the client is currently connected to the server for a Game or the Queue: connected, connecting, reconnecting, disconnected or failed.
_Avoid_: Online status

### Looking back

**History**:
The list of finished Games the signed-in User took part in.
_Avoid_: Archive, past games

**Result**:
The Outcome of a Game seen from one User's point of view: Win, Loss or Draw.
_Avoid_: Score

**Game review**:
Replaying a finished Game from the History, Move by Move.
_Avoid_: Replay, analysis
