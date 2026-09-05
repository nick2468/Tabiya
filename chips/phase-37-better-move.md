# Chip: phase 37 - the report says what was better

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read `docs/testing.md`, `src/play/session.ts` (`scanGame`), `report.ts` (`MoveReview`,
`scanForSlips`, `describeSlip`, `buildReport`), `game-pgn.ts`, `src/ui/Play.tsx` (the
report and the replay click on a slip) and `play-context.tsx` (`evaluate` and `finish`)
before starting. **After phases 35 and 36 are committed.**

Nick, 2026-09-05: the report told him 4.Nf3 was an inaccuracy and nothing told him what
was better, so he could not learn from it. Ruled: every slip sentence names the engine's
better move, and clicking the slip shows it on the board. The scan already asks the engine
about the position before every move and keeps only the score; the best move is in the
same answer. **No chess content.**

## The work

- [ ] **37.1 The scan keeps the best move.** `scanGame` returns, beside the evaluation
  map, a map from position key to the engine's best move at that position (UCI from
  `result.bestMove`, or the first candidate), and the live `evaluate` in the provider
  stores the same so a replayed game and a reviewed one carry the same facts. Keep the
  existing `Evaluations` shape for callers that only want numbers; add `BestMoves` beside
  it rather than changing the map's value type.
- [ ] **37.2 A slip knows its better move.** `MoveReview` gains `better?: string`, the SAN
  of the engine's move in the position BEFORE the slip, converted from UCI with chess.js
  on that position. Absent when the engine's move is the move that was played (which
  cannot be a slip) or when no best move was kept.
- [ ] **37.3 The sentence.** `describeSlip` appends " The engine preferred 4.Nc3." with the
  move numbered as the move list writes it (`4.Nc3` for White, `4...Nc3` for Black), so
  Nick's example reads: An inaccuracy on move 4: Nf3 turned "slightly better for white"
  into "level". The engine preferred 4.Nc3. The same for mistakes and blunders. No
  sentence when `better` is absent. Say "the engine preferred", not "better was": at the
  scan's 150 ms this is the engine's choice at a fixed effort, and the wording keeps that
  honest.
- [ ] **37.4 The board shows it.** Clicking a slip already puts the position before the
  move on the board. Add the engine's preferred move as a blue arrow (the engine hint's
  colour) while that slip is the current replay position, cleared when the replay moves
  on. The move actually played stays highlighted as the last move so both are visible.
- [ ] **37.5 The PGN comment** on a slip carries the preferred move too, in the same
  words, so a copied game says it.
- [ ] **37.6 Tests.** Report tests: a slip carries `better` from the best-move map; the
  sentence in both colours; absent when unknown; the PGN comment. `scanGame` with the
  fake engine returns the best move it was given. The arrow is UI over a pure value; a
  string test that the arrow shape is produced for the current slip is enough, or a DOM
  test if the click needs one.
- [ ] **37.7 Help**, Play section: the sentence describing Your moves gains "and what the
  engine would have played instead".
- [ ] **37.8 Version 1.8.3** in the three files.
- [ ] **37.9 Prove it in the browser build**: a game with a deliberate slip reviewed, the
  sentence naming the preferred move, the slip clicked and the blue arrow on the board,
  Copy game carrying it. Clear the storage afterwards.

## Hazards

- **The provider's value is deliberately NOT memoised** (`play-context.tsx`).
- **The scan is one engine, one queue**, and it must stay one search per position: keep
  the best move from the search that already runs, never add a second.
- **UCI to SAN needs the position before the move**: convert on that position and never
  on the position after.
- **Nick's progress file is live**; never report his data folders from your own `ls`.
- **No `tauri build` or `tauri dev`.** **Commit before you stop.**
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change; the rule is
  twenty seconds.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

A deeper search for the preferred move than the scan already makes. Storing the preferred
moves on the record. Any chess content. A packaged build.

## Conventions and finish

Commit style follows the log. Tick PLAN.md phase 37 boxes as you go. **The review gate
box belongs to the orchestrator: leave it.**

Acceptance: every slip sentence names the engine's preferred move in move-list notation;
clicking a slip shows it as a blue arrow beside the move played; the PGN says it; tests
for the scan, the sentence and the comment; Help true; version 1.8.3; vitest green and
`tsc -b` clean; the tree committed and clean.
