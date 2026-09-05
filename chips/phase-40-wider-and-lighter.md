# Chip: phase 40 - a wider window, a lighter games table, and a Study board that stays put

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read `docs/testing.md`, `src/ui/Progress.tsx` (the `onPlay` rule and the games tables),
`progress.css`, `catalog.css`, `src-tauri/tauri.conf.json`, `Study.tsx` (its `chapterId`,
`chain`, `chosen` and `stepping` state), `App.tsx`, `play-context.tsx` (the pattern for
state that outlives a screen) and `help-text.ts` before starting.

Nick installed 1.8.5 on 2026-09-05 and came back with six findings. Every ruling below is
his unless it says it is a decision rule for you. **No chess content. One provider-style
change (Study's position), so the phase 29 rule applies there: a DOM test shown red
first.**

## The work

### 40.1 Archive and Delete after a review

- [ ] **Nick: after Stop and review, the reviewed game's Archive and Delete on Progress
  were not usable until he restarted the app.** They were disabled with a title because the
  game was still on the Play screen, and phase 39's rule covered a reviewed game as well as
  one being played. **Ruling: a reviewed game is a record and its row is free.** Only a game
  still being played (a session with no report) keeps the two buttons disabled, with the
  existing title. Archiving or deleting the record whose report is on the Play screen also
  puts that screen back to its start options (`reset`), because the game it showed is gone
  from the list or from the file. The disabled styling stays as it is for the one case
  left; if it reads as invisible in dark mode, raise its opacity to the level the greyed
  course switcher uses and say so.
- [ ] DOM test, red first: review a game, go to Progress, Archive it: the row leaves, and
  Play shows the start options. And the guard still holds for a game in progress.

### 40.2 A wider window, five tiles, and the games table given room

- [ ] **The window opens at 1400 by 980** (`tauri.conf.json`; min size unchanged). The
  catalog's cap rises so five tiles fit a row at that width (`catalog.css`, today 1160px
  and 250px tiles: 5 x 250 + 4 x 12 = 1298, so a cap of about 1360 with the shell's 24px
  sides). Eight courses then sit as five and three. Measure at 1400x980 and say the tile
  width.
- [ ] **The Progress games tables use the width they are given**: `.play-on-scroll` grows
  with the panel, so at 1400 more columns show before the sideways scroll is needed. Say
  how many columns fit at 1400 without scrolling.
- [ ] Browser proofs in this phase run at 1400x980. The phase 26 board sizes are unchanged.

### 40.3 The games table, lighter and tighter

- [ ] **Nick: the games rows stand out too strongly, especially in dark mode.** Set the Play
  on and archive table cells in the Progress lead's voice: `--text-dim` at 0.9rem, the
  header row as it is. Names of courses and lines included; the Ended and Position words
  too.
- [ ] **Thinner buttons on each row**: Play on, Replay, Archive, Delete, Unarchive at
  `padding: 2px 8px` and 0.85rem, so the row height comes down to the text's. Say the row
  height before and after. The armed "Delete for good?" keeps its colour.
- [ ] Photograph both themes.

### 40.4 The Study board stays where it was

- [ ] **Nick: leaving Study and coming back loses the position, the same fault phase 36
  fixed on Play.** Study's chapter, chain (the moves walked), chosen line and stepping flag
  are `useState` inside `Study`, which unmounts on a view change. Lift them to a small
  `StudyProvider` beside `PlayProvider`, keyed by course id so each course keeps its own
  place, in memory only (a restart starts fresh; not persisted). `Study` reads and writes
  them through `useStudy()`. Auto-stepping stops on leaving the screen (its timer must not
  run unseen) and does not resume by itself on return.
- [ ] Play from here, the arrow keys, Reset and the lines table all keep working from the
  provider's values. Changing course in the header shows that course's remembered place,
  or its first chapter if none.
- [ ] DOM test, red first: open Study, step two moves into a line, go to Play, come back:
  the trail shows the same two moves and the board the same position; switch course and
  back: still there.
- [ ] Help, Study section: one clause that the screen keeps your place while you look
  elsewhere.

### 40.5 Version 1.8.6

- [ ] `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`.

### 40.6 Prove it in the browser build at 1400x980, both themes

- [ ] Five tiles to a row; a reviewed game's Archive live on Progress and the Play screen
  back to its options after archiving; the lighter, tighter games table in both themes with
  the row height; Study stepped, left, returned. Clear the storage afterwards.

## Hazards

- **Providers are deliberately NOT memoised**; the new one follows `play-context.tsx`.
- **Study's auto-step timer** is the one timer in the app that runs on its own; it must be
  cleared on unmount and not restarted by the provider.
- **Nick's progress file is live**; never report his data folders from your own `ls`.
- **No `tauri build` or `tauri dev`.** **Commit before you stop.**
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change; the rule is
  twenty seconds.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Remembering Study's place across an app restart. New courses (a separate decision). Any
chess content. A packaged build.

## Conventions and finish

Commit style follows the log. Tick PLAN.md phase 40 boxes as you go. **The review gate
box belongs to the orchestrator: leave it.**

Acceptance: a reviewed game's Archive and Delete live on Progress with the Play screen
reset when its record goes; a 1400 by 980 window with five tiles to a row and the games
table given the width; the games rows in the muted voice with thin buttons, measured;
Study's place kept per course across screen changes with a DOM test shown red first; Help
true; version 1.8.6; nothing under `courses/`; vitest green and `tsc -b` clean; the tree
committed and clean.
