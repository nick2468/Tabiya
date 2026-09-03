# Chip: phase 25 - replay a reviewed game, and copy it out as text

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 2 and 8, PLAN.md phases 23 to 25, and `src/ui/Play.tsx`,
`play-context.tsx`, `Study.tsx` (the arrow-key stepping), `src/play/session.ts`,
`src/play/report.ts`, `src/play/evalbar.ts`, `src/model/pgn.ts` and `help-text.ts` before
starting.

Nick reviewed a London game on 1.6.7 (2026-09-03), thought the report had the wrong side
winning, and had no way to look again: the board shows the final position only, and the
only way to show anyone else the game was a screenshot. The report was right (the engine
confirms +4.5 for White at 3 seconds), but the two gaps are real. **No chess content in
this phase.**

## The work

### 25.1 Step through a reviewed game

- [ ] **Once the report exists, the move list becomes a viewer.** Click any move to put
  the position after it on the board; the left and right arrow keys step one ply either
  way, the way Study's arrows do (`Study.tsx`, the `keydown` handler, is the idiom to
  copy, including the written names on the arrow buttons). The current move is marked
  in the list. The board is not movable during replay, and the last move is highlighted
  as it is during play.
- [ ] **The evaluation bar follows the replay.** Every position of a reviewed game is in
  the evaluation map (the scan filled it), so `shownEvaluation` for the replayed
  position is a lookup. No search.
- [ ] **The report's slips are clickable too.** "A mistake on move 19: Qh6..." puts the
  board on the position BEFORE that move, so the reader sees what was on offer. The
  deviation line ("You left the repertoire on move 5 with Bd3") does the same.
- [ ] **Replay is view state, not game state.** Hold the replay ply in `Play.tsx` (or a
  small hook), never in `PlaySession`: the session's `moves` and `fen` are the game and
  they do not move. `New game` clears it with everything else. Undo and Redo stay dead
  during a reviewed game as they are now.
- [ ] **Tests**: the pure part, "position at ply n of these moves" and "which ply a slip
  points at", in `src/play` with tests. The keyboard wiring is proved in the browser.
- [ ] **Help, Play section**: one paragraph after the report's three parts. Add "Back one
  move" and "Forward one move" (or whatever the arrow buttons are named) to
  `HELP_CONTROLS` on `play`; the `Report` fixture from phase 23 reaches them if they are
  rendered with the report, so render them there.

### 25.2 Copy the game as text

- [ ] **A "Copy game" button on the report.** It puts the whole game on the clipboard as
  PGN: the seven tag pairs the app can fill honestly (`Event` "Repertoire Trainer",
  `Site` the course title, `Date` from the record, `Round` "-", `White` and `Black` as
  "You" and "Stockfish level N" the right way round for the course's colour, `Result`
  from the outcome or "*"), then the moves, with the report written in as PGN comments:
  the deviation as a comment on the move that left the book, each slip as a comment on
  its move ("mistake: winning for white to clearly better for white"), and the final
  verdict as a comment after the last move. `src/model/pgn.ts` parses PGN and
  `bundle.ts` writes it; reuse the writing helpers rather than concatenating by hand,
  and prove the output parses back with `parsePgn`.
- [ ] **Clipboard in both builds.** The browser has `navigator.clipboard.writeText`. The
  installed app is WebView2 and has the same API; check it works there and say so, and
  if it does not, use the Tauri clipboard plugin the way `backup.ts` uses the fs plugin.
  On success the button says "Copied" for a moment; on failure it says why.
- [ ] **A "Save game" beside it is NOT wanted yet.** Copy is enough: the point is to paste
  the text into a chat or a file, and the orchestrator can replay a pasted PGN against
  the engine without a screenshot.
- [ ] **Tests**: the PGN text for a fixture report round-trips through `parsePgn`, the
  colours are the right way round for a Black course, and every slip appears as a
  comment on its move. Add "Copy game" to `HELP_CONTROLS` on `play` and name it in the
  Help.

### 25.3 Version 1.6.8

- [ ] `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`. The
  orchestrator's bar-alignment fix is already on `main` and rides in this build.

### 25.4 Prove it in the browser build at 1200x980, in both themes

- [ ] Play a short game as White and one as Black, review each, step through with the
  keys and by clicking, click a slip, and show the bar moving with the replay. Copy the
  game and paste the clipboard into the console to show the PGN. Clear the browser
  build's storage afterwards.

## Hazards

- **The provider's value is deliberately NOT memoised** (`play-context.tsx`). Do not put a
  `useMemo` back.
- **The session's `moves` are the record.** Replay reads them and never writes them.
- **Study's keydown handler is on `window`.** Two screens each listening for arrows would
  fight; Play's listener must be added only while a reviewed game is showing and removed
  when it is not, and Study is never mounted at the same time, but check that the
  listener is gone after New game.
- **Nick's progress file is live** at `%APPDATA%\Repertoire Trainer\progress.json`, and a
  session's view of the filesystem OUTSIDE this repo can be a stale overlay. **Never
  report his data folders from your own `ls`.** This phase does not touch the file.
- **Do not run `tauri dev`.** The Vite server is 5175 with `--strictPort`. After any
  reload take a screenshot BEFORE a coordinate click, and confirm every click by reading
  state.
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`, written with
  `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Replaying a game that was not reviewed (the report is what makes the moves worth
walking). Importing a PGN game. Saving to a file. Any change to the scan or the bar's
numbers. Any chess content. A packaged build.

A valid follow-up in a file you already have open: do it now, as its own commit. One
needing a ruling: the SPEC section 6 register.

## Escalation

On any contradiction between this chip, SPEC.md and the code: stop that item, record it,
continue with the rest.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the model you actually are. Tick PLAN.md phase 25 boxes as you go. **The review gate box
belongs to the orchestrator: leave it.**

Acceptance: a reviewed game can be stepped through by key and by click with the bar
following; slips and the deviation jump to their positions; Copy game puts a PGN on the
clipboard that parses back, with the report as comments; Help true with the new controls
held by the test; version 1.6.8; nothing under `courses/`; vitest green and `tsc -b`
clean; driven in both themes.
