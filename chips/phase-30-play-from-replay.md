# Chip: phase 30 - play from here, out of a replay

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read PLAN.md phases 25 to 29, `docs/testing.md`, `src/ui/Play.tsx` (the request shape,
the replay state and `replayOptions`), `play-context.tsx`, `src/play/replay.ts`,
`src/ui/play-on.ts` and `help-text.ts` before starting.

Nick, 2026-09-04, replaying a game on 1.6.12: the report told him move 35 was a blunder
because there was a forced mate, and he could not see it. He wants, from the replay, a
"Play from here" that starts a NEW game from the position on the board, the same as Study
offers. **No chess content. This touches the game provider, so the phase 29 rule applies:
a DOM test for the behaviour, shown red against the missing feature.**

## The work

### 30.1 Play from here, from a replay

- [ ] **A "Play from here" button on the button row while a report is showing**, after
  Hint and before the two arrows. It is enabled whenever the replay is on a position
  where it is the trainee's move and the game is not over at that position; disabled
  otherwise, with a title saying "It is the engine's move here. Step one move on or
  back." or "The game is over here." It is the same idea and the same words as Study's
  button, so it goes in `HELP_CONTROLS` on `play` (the name is already held on `study`;
  a second row for `play` is right, and `PlayHead` or the row component is the fixture).
- [ ] **What it starts is a new game, not the old one.** Build a `PlayRequest` from the
  replay position: `moves` are the game's SAN up to the replay ply, `fen` is
  `positionAtPly`, `courseId` is the game's own course (`setup.courseId`, which may not
  be the header's), `chapterId` and `chapterOnly` from the game's setup, `level` the
  game's level, **`at` absent** so a fresh identity is minted at its first review, and
  **`reviewAtOnce` absent**. The label reads "From your game of 3 September, after move
  17" (the full move number of the ply). Send it through the same `playFrom` channel Study
  and Progress use, so the header switches course if it must and the Play start screen
  shows the "From ..." radio checked with the length and strength pickers live, exactly
  as Study's Play from here does today.
- [ ] **The reviewed game is over and is replaced** when Start is pressed, the way New game
  replaces it. Until Start is pressed the report stays on screen behind the start
  options as it does for a Study request today; check what the screen actually does
  there and say so.
- [ ] **The new game's record** is an ordinary record: its `sans` include the moves it
  started from, so "Lines played" and the report's deviation work from the chapter root
  as they do for a Study start. The old game's record is untouched: test that.
- [ ] **Hint works in the new game from the first move**, which is the whole point here:
  Nick wants to find the mate. Nothing to build, but drive it and say what the hint said.

### 30.2 Tests

- [ ] **DOM test** (`*.dom.test.tsx`, jsdom, fake engine): review a game, step back two
  plies, press Play from here, press Start, play one move, review. Assert two records in
  the history with different `at`, the first unchanged, the second with `sans` beginning
  with the first's prefix. Show it red before the feature exists (the button is not
  there) and green after.
- [ ] **String test** for the request builder: the pure function that turns (moves, ply,
  setup) into a `PlayRequest`, covering the disabled cases (opponent's move, game over
  at that ply) and the label.
- [ ] Mutation-check the help test on the new row.

### 30.3 Help and SPEC

- [ ] Help, Play section: one sentence after the replay paragraph. SPEC section 2, Play:
  the "From here" launch shape now also comes from a replay. Section 8: log it with the
  date and Nick's reason.

### 30.4 Version 1.6.13

- [ ] `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`.

### 30.5 Prove it in the browser build at 1200x980

- [ ] Review a game, step back, Play from here, Start, press Hint, play on, review, and
  show Progress with two games. Clear the browser build's storage afterwards.

## Hazards

- **The provider's value is deliberately NOT memoised** (`play-context.tsx`).
- **`at` absent means a new game.** A request that carried the old `at` would make the
  first review REPLACE the old record with the new game, which is the one thing Nick did
  not ask for. The DOM test above is what holds this.
- **Replay's `holdOpponent` must NOT be set on this request**: this is a game, and if the
  replay position has the opponent to move the button is disabled rather than the engine
  held.
- **Nick's progress file is live** at `%APPDATA%\Repertoire Trainer\progress.json`, and a
  session's view of the filesystem OUTSIDE this repo can be a stale overlay. **Never
  report his data folders from your own `ls`.**
- **Do not run `tauri dev`.** The Vite server is 5175 with `--strictPort`; if another
  server holds it, drive against it and say so. Judge console errors from a fresh tab.
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Playing from a position where it is the opponent's move (the button is disabled there).
Any change to Study's Play from here. Any chess content. A packaged build.

## Conventions and finish

Commit style follows the log. Tick PLAN.md phase 30 boxes as you go. **The review gate
box belongs to the orchestrator: leave it.**

Acceptance: Play from here on the button row during a replay, enabled on the trainee's
positions only; a new game with a fresh identity from the replayed position, the old
record untouched, proved by a DOM test shown red first; Help and SPEC true; version
1.6.13; nothing under `courses/`; vitest green and `tsc -b` clean.

### 30.6 Keep playing becomes a button, and says what it does

Nick, 2026-09-04, after the chip was sent: nearly every control is a button and Keep
playing is styled as a link in the header, which reads as odd, and it needs explaining
beside Play from here because the two are easy to confuse.

- [ ] **Two rows under the board, not one.** Nick's ruling 2026-09-04: the board is 416px
  wide and the present row already reaches 374px, so there is no room for two more
  buttons. **Row 1, whenever a game exists:** New game, Undo, Redo, Hint, unchanged.
  **Row 2, only while a report is showing:** Keep playing and Play from here on the left,
  the two arrows on the right ending at the board's edge. Keep playing is in the app's
  button style and leaves the header; it shows only when it applies (a reviewed game that
  did not end by itself), so row 2 sometimes starts with Play from here. Both rows start
  at the board's left edge and neither exceeds its width; measure and say so.
- [ ] **A title on each of the two so the difference is on the screen.** Keep playing:
  "Carry on this game from its final position. Reviewing again replaces this game's
  record." Play from here: "Start a new game from the position on the board. This game's
  record is kept as it is."
- [ ] Help, Play section: the sentence on Keep playing and the new one on Play from here
  sit together and say the same distinction in one breath. The help test holds both
  names on `play`; `PlayHead` or the row component is the fixture for both.
