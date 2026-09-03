# Chip: phase 27 - the replay you can see, the Study table in step, and how each game ended

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read PLAN.md phases 25 to 27, `src/ui/Play.tsx`, `play.css`, `play-context.tsx`,
`Study.tsx`, `study.css`, `Prose.tsx`, `Progress.tsx`, `src/play/report.ts`,
`src/play/replay.ts`, `src/storage/progress.ts` and `help-text.ts` before starting.

Nick installed 1.6.10 on 2026-09-04 and came back with six findings. Every ruling below
is his unless it says it is a decision rule for you. **No chess content.**

## The work

### 27.1 The replayed move you can see

- [ ] **On the Play screen during a review, the highlight on the current move in the move
  list is too faint.** Make it a dull green: the `--accent-wash` background is what Study
  uses for its active row and it is too faint here too, so use a solid darker green for
  the background with the text in `--text`. Decision rule: add one token,
  `--mark`, defined in BOTH theme blocks of `index.css` (a dull green that reads on each
  ground; something near `#3a5b3f` on dark and `#c9e2cc` on light are the existing
  `--accent-solid-hover` values, which is the right family), and use it for the current
  replay move and for the board's last-move squares in replay if those are faint too.
  Photograph both themes.

### 27.2 The stepping arrows move to the button row

- [ ] **The two replay arrows (Back one move, Forward one move) leave the report header
  and sit on the same row as New game, Undo, Redo and Hint, right-justified to the
  board's right edge** (Nick: "level to the Hint button and right justified to the H1
  corner"). The row becomes: buttons on the left starting at the board's left edge, the
  two arrows on the right ending at the board's right edge, so the row spans exactly the
  board's width. They show only while a report exists, as now, and keep their names,
  so `HELP_CONTROLS` and the help test are unchanged unless the names move files.

### 27.3 The Study lines table keeps its rows in step

- [ ] **Nick: as a line is stepped through, the moves on the active row turn green and
  slightly bigger, and the size change puts that row's moves out of vertical sync with
  the other rows, so the point where lines diverge is harder to see.** The active row's
  `.line-link` goes to `font-weight: 600` (`study.css`) and `.line-moves .walked` to 500,
  and a heavier weight is wider, which is what shifts the columns. **Ruling: the moves
  column of every row is set in the SAME size and weight as the active row's, so nothing
  moves when a row becomes active.** He also finds the other rows' moves hard to read:
  `.line-moves` is `0.8rem` in `--text-faint`. Raise every row's moves to the size and
  weight the active row uses, in `--text-dim` rather than faint, and keep the walked
  moves green. Check with a chapter whose lines share a long trunk that the shared moves
  sit in one vertical column across rows, active or not, and photograph it.

### 27.4 The notes section in dark mode

- [ ] **Nick: in the lower scrollable notes section (the chapter intro under the
  separator) the body text in dark mode looks as bold as its headings; in light mode it
  looks right.** Measure before changing: read the computed `font-weight` and `color` of
  `.intro-detail p` and `.intro-detail h2` in both themes. If the weights are equal, the
  cause is light-on-dark rendering making 400 look heavy, and the fix is contrast, not
  weight: body text in `--text-soft` (it may already be) and headings in `--text` with
  `font-weight: 600`, so the headings stand off the body. If the weights differ, say
  where the bold comes from (`Prose.tsx` markdown, a `strong`, or a rule) and fix that.
  Photograph both themes.

### 27.5 Progress says how each game ended, and offers Replay

- [ ] **Each recorded game carries how it ended.** Add to `PlayRecord`, optional like
  `sans`: `outcome?: string` (the session's own outcome sentence when the game ended by
  itself: "You won by checkmate", "Drawn by stalemate", and so on) and `finalEval?:
  number` (pawns from White's point of view, from the report). Written at review in
  `finish`, beside `sans` and `hints`.
- [ ] **The Play on list shows an "Ended" column** built from those: a game with an
  outcome shows it as recorded; a stopped game shows "Stopped, <verdict>" where the
  verdict is `verdictInWords(finalEval)` turned to the trainee's side and lower-cased, so
  a Black course reads "Stopped, clearly better for you" rather than "for black". Say
  "you" and "the engine", never a bare colour, because the trainee's colour changes with
  the course. Records from before this phase have neither field and show "Stopped".
  Nick's examples: "checkmate by black/white, stopped black/white level/ahead/winning";
  the wording above is the decision rule that keeps to the report's own vocabulary.
- [ ] **A "Replay" button beside "Play on" on each row.** Replay loads the recorded game
  the way Play on does (same request path, same identity by `at`) and then runs the
  review at once, so the trainee lands on the Play screen with the report showing and
  the viewer live: arrows, clickable moves, the bar following. The scan is a few seconds
  and the existing "Scanning n of m" text covers it. A second review from Replay
  replaces the record under the phase 25 rule, so nothing is double counted. Decision
  rule: Replay does NOT change `moves`, `hints` or the ending on the record unless the
  trainee presses Keep playing and reviews again; a replay is reading, not playing.
- [ ] **Help, Progress section**: the Ended column and Replay, one sentence each. Add
  "Replay" to `HELP_CONTROLS` on `progress`.
- [ ] **Tests**: the Ended text for an outcome, for a stopped game in a White course and
  in a Black course, and for an old record; the request built by Replay carries a
  "review at once" flag; `readPlayGames` passes the two new fields through.

### 27.6 Version 1.6.11

- [ ] `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`.

### 27.7 Prove it in the browser build at 1200x980, in BOTH themes

- [ ] A reviewed game with the current move visibly marked; the arrows on the button
  row ending at the board's right edge; the Study table with a long shared trunk showing
  the moves in one column across rows while stepping; the notes section in both themes
  with the measurements; Progress showing Ended for a stopped game and a mated one, and
  Replay landing on a report with the viewer live. Clear the browser build's storage
  afterwards.

## Hazards

- **The provider's value is deliberately NOT memoised** (`play-context.tsx`).
- **One engine, one queue.** Replay's review goes through `finish` as it is.
- **The record's `at` is the game's identity.** Replay keeps it.
- **Nick's progress file is live** at `%APPDATA%\Repertoire Trainer\progress.json`, and a
  session's view of the filesystem OUTSIDE this repo can be a stale overlay. **Never
  report his data folders from your own `ls`.** This phase does not touch the file.
- **Do not run `tauri dev`.** The Vite server is 5175 with `--strictPort`; the
  orchestrator's server may hold it, and if it does, drive against it and say so. After
  any reload take a screenshot BEFORE a coordinate click, and confirm every click by
  reading state. `read_console_messages` keeps a tab's buffer across reloads: judge
  console errors from a FRESH tab.
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`, written with
  `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Anything about engine strength (Nick's note that Club level blundered mid-game is
answered by the orchestrator, not fixed here). Any chess content. A packaged build.

A valid follow-up in a file you already have open: do it now, as its own commit. One
needing a ruling: the SPEC section 6 register.

## Escalation

On any contradiction between this chip, SPEC.md and the code: stop that item, record it,
continue with the rest.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the model you actually are. Tick PLAN.md phase 27 boxes as you go. **The review gate box
belongs to the orchestrator: leave it.**

Acceptance: the replayed move marked in a dull green in both themes; the arrows on the
button row at the board's right edge; the Study table's move columns in step across rows
while stepping, readable on every row; the notes section measured and its headings
standing off the body in dark mode; games recording how they ended, Progress showing it
and offering Replay that lands on a live report without double counting; Help true with
Replay held by the test; version 1.6.11; nothing under `courses/`; vitest green and
`tsc -b` clean; driven in both themes.
