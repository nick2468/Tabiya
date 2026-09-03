# Chip: phase 26 - the Play screen laid out for playing, a hint, and the last millimetre of the bar

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read PLAN.md phases 23 to 26, `src/ui/Play.tsx`, `play.css`, `play-context.tsx`,
`Board.tsx`, `board.css`, `src/play/book.ts` and `help-text.ts` before starting.

Nick installed 1.6.8 on 2026-09-03: Play on and Copy game both work in the packaged app.
He came back with five layout findings on the Play screen and one measurement. Every
ruling below is his unless it says it is a decision rule for you. **No chess content.**

## The work

### 26.1 The bar's last millimetre

- [ ] **Nick: the bar lines up with the top edge of the board but runs about 1 mm past
  the bottom.** Phase 25's fix stretched the bar to the `.board` box, and the two boxes
  measure the same 420px in the Vite build. What he is seeing is the box against the
  squares: chessground draws eight squares inside `cg-board`, and 420 CSS px at his
  display's scale is not a whole number of device pixels per square, so the squares end
  short of the box and the bar runs to the box. **Decision rule: measure, do not guess.**
  In the browser pane at 1200x980 (device pixel ratio 1.5 there) read the bounding rects
  of `.board` and its inner `cg-board` in a running game and say what they are. If the
  inner one is shorter, the fix is a board size that is a whole number of device pixels
  per square at the common scales: **416** (52 per square; 65 at 1.25, 78 at 1.5, 104 at
  2.0). Change Play's and Drill's `size={420}` to 416 and re-measure. If the inner one is
  NOT shorter, say so, find what is, and fix that instead; do not change the size for
  its own sake.

### 26.2 The controls move under the board, as buttons

- [ ] **Undo, Redo and New game leave the header and go in a row directly under the
  board**, in this order: **New game, Undo, Redo, Hint**. Real buttons in the app's
  button style, not the `.link` text style. Their enabled and disabled rules do not
  change; Keep playing and the extend buttons stay where they are. The header keeps
  "Play", the Opening line and the status.
- [ ] `PlayHead` is the fixture the help test renders for Undo, Redo, Keep playing and New
  game. If the row becomes its own component, render that in the test too so every
  name stays held; do not let a control the help names fall out of the test.

### 26.3 Hint

- [ ] **A Hint button, fourth in the row.** Pressing it draws an arrow on the board for
  the move to play in the current position and says, beside the board, what it is and
  why. **While the position is in the book** (`studentBookMove(book, fen)` answers), the
  hint is the repertoire move with its note: arrow in the same green the Drill screen
  uses for the expected move, and the text "The line plays 5.Bg3. Step back and keep the
  bishop..." **When the book has run out**, the hint asks the engine at the analysis
  profile for 500 ms (one candidate) and draws its move with the text "The engine
  suggests Nd4. No note: the repertoire ended at move 9." Restore the playing profile in
  a `finally`, as `evaluate` does, and reuse its queue: nothing else may be asked of the
  engine while the hint search runs.
- [ ] **Enabled only when it is the trainee's move, the engine is not thinking, and no
  report is showing.** The arrow and the text clear the moment a move is played or Undo
  or Redo is pressed.
- [ ] **A hint is not free, and the report says so.** Count hints on the session
  (`hints`, reset by nothing but a new session), show "You used 2 hints." in the report
  under Your moves, and write it into the PGN as a comment before the movetext. Add
  `hints?: number` to `PlayRecord`, optional like `sans`, written at review. The Play on
  list does not show it.
- [ ] **Tests**: the hint decision (book move with note, or engine move with the "no
  note" sentence) as a pure function over a book and a fen, with the fake engine; the
  count on the session; the report line and the PGN comment. Add "Hint" to
  `HELP_CONTROLS` on `play` and write one paragraph in the Play section: what it shows
  in book, what it shows out of book, and that the report counts them.

### 26.4 The move list beside the board, at board height

- [ ] **The move list sits beside the board as its own narrow column, as tall as the
  board, scrolling inside itself.** Today it is in the side panel with `max-height: 220px`.
  Lay the in-game screen out as three columns: the bar and board (one box, from phase
  25), the move list, then the side panel with the actions or the report taking the
  remaining width. The move list column is **compact**: tabular numbers, the move number
  column no wider than "20.", the two move columns no wider than a long move like
  "Nxd4+" needs, tight row padding, and a thin scrollbar (`scrollbar-width: thin` and a
  matching `::-webkit-scrollbar` width for WebView2). Say what width it comes to.
- [ ] **The current replay move stays visible**: when the arrow keys move it, scroll the
  list so the marked move is in view (`scrollIntoView({ block: 'nearest' })`).
- [ ] **The row under the board (26.2) sits under the board only**, not under the list.
- [ ] Check the light theme too: the list's scrollbar and the button row are the two
  things that pick up theme colours here.

### 26.5 Version 1.6.9

- [ ] `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`.

### 26.6 Prove it in the browser build at 1200x980, in BOTH themes

- [ ] Measure `.board` against `cg-board` and against the bar, before and after 26.1, and
  give the numbers. Play a game past move 10 so the list scrolls; show the button row
  under the board, a book hint with its note, an out-of-book hint with the engine's move,
  the hint count in the report, and the replay marker scrolling into view. Clear the
  browser build's storage afterwards.

## Hazards

- **The provider's value is deliberately NOT memoised** (`play-context.tsx`). Do not put a
  `useMemo` back.
- **One engine, one queue.** The hint search goes through the same `run` queue as
  everything else, restores the playing profile in a `finally`, and is never started
  while `thinking` is true.
- **Study's arrow-key listener** is on `window`; Play's is added only while a report
  shows. Nothing here changes that.
- **`size` is the board's CSS size and `Board.tsx` sets it inline**; Study uses 384 and
  is not in this phase.
- **Nick's progress file is live** at `%APPDATA%\Repertoire Trainer\progress.json`, and a
  session's view of the filesystem OUTSIDE this repo can be a stale overlay. **Never
  report his data folders from your own `ls`.** This phase does not touch the file.
- **Do not run `tauri dev`.** The Vite server is 5175 with `--strictPort`; the
  orchestrator's own server may hold it, and if it does, say so and drive against it (it
  serves your source; only `__APP_VERSION__` is stale). After any reload take a
  screenshot BEFORE a coordinate click, and confirm every click by reading state.
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`, written with
  `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

A hint during Drill (Drill is the test). Hints changing the FSRS schedule or the Lines
played count. Any change to the Study or Drill boards beyond the 416 size if 26.1 needs
it. Any chess content. A packaged build.

A valid follow-up in a file you already have open: do it now, as its own commit. One
needing a ruling: the SPEC section 6 register.

## Escalation

On any contradiction between this chip, SPEC.md and the code: stop that item, record it,
continue with the rest. If the three-column layout cannot hold the report at a readable
width at 1200 wide, say what width it gets and propose the wrap rather than squeezing it.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the model you actually are. Tick PLAN.md phase 26 boxes as you go. **The review gate box
belongs to the orchestrator: leave it.**

Acceptance: the bar ends on the board's last square, measured; New game, Undo, Redo and
Hint as buttons in a row under the board; Hint drawing the book move with its note in
book and the engine's move out of book, counted on the session, in the report and in the
PGN; the move list a narrow column at board height with a thin scrollbar, the replay
marker kept in view; Help true with Hint held by the test; version 1.6.9; nothing under
`courses/`; vitest green and `tsc -b` clean; driven in both themes.
