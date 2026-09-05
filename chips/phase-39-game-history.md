# Chip: phase 39 - managing the games you have played

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read `docs/testing.md`, `src/storage/progress.ts` (`PlayRecord`, `recordGame`,
`PLAY_HISTORY`, `readPlayGames`), `src/ui/progress-context.tsx` (`recordPlay`),
`play-context.tsx` (`finish`, `reset`), `src/ui/play-on.ts` (`recentPlayable`),
`src/model/stats.ts` (`playStats`, `linesPlayed`), `Progress.tsx`, `Play.tsx` and
`help-text.ts` before starting.

Nick, 2026-09-05: three things about the games the app keeps. A game in progress should be
stoppable without a review and without a record. Every saved game should have Archive and
Delete beside it on Progress. Archived games need a page of their own where they can be
brought back or deleted. **No chess content. Provider changes, so the phase 29 rule
applies: DOM tests shown red first.**

## The rulings and the decision rules

- **"Stop and discard"** sits beside "Stop and review" in the actions block while a game is
  being played. It ends the game as New game does: no scan, no report, no record, the
  engine stopped, the start screen shown. No confirmation dialog: the app has none, and an
  unsaved game is the smallest thing it holds. It is not shown once a report exists (a
  reviewed game is already a record; Delete on Progress is its way out).
- **Archive is a flag on the record**, `archived?: boolean`, absent meaning not archived, so
  every record on disk keeps its meaning. An archived game leaves the Play on list, the
  Games played counts and table, and Lines played. It stays in the file. The history cap
  (`PLAY_HISTORY`, 100) counts every record, archived or not, and the Help says so in one
  sentence.
- **Delete removes the record for good.** Decision rule for the control: the app has no
  dialogs, so Delete is a two-step button. The first click turns it into "Delete for good?"
  for five seconds; a second click within that time deletes; anything else puts it back.
  The same control on the archive page.
- **The archive is a view inside Progress, not a sixth mode.** Under Games played, one line:
  "N archived games" as a button that switches the section to the archive: the same table
  as the Play on list (date, course, chapter, line, strength, moves, ending, position) with
  **Unarchive** and **Delete** on each row, and a "Back to your games" button. When nothing
  is archived the line is not shown. Play on and Replay are not offered on archived rows:
  unarchive first.
- **A game being played or reviewed is not deletable from Progress while it is on the Play
  screen.** Its row's Delete and Archive are disabled with the title "Finish or replace this
  game on Play first.", the same rule Play on already follows.

## The work

- [ ] **39.1 Stop and discard.** `discard()` on the provider: stops the engine, clears the
  session, report, evaluations, hint and replay ply, mints nothing. The button in the
  actions block, secondary style, beside Stop and review. `HELP_CONTROLS` gains it on
  `play`; the Help's Play section says what it does in one sentence.
- [ ] **39.2 The record flag and the three operations.** `archived?: boolean` on
  `PlayRecord`, passed through by `readPlayGames`. `archiveGame(at)`, `unarchiveGame(at)`
  and `deleteGame(at)` in `progress.ts` as pure functions with tests, exposed through
  `progress-context.tsx` beside `recordPlay`, each a save.
- [ ] **39.3 Everything that lists or counts games respects the flag.** `recentPlayable`,
  `playStats`, `linesPlayed`, `anyGameRecorded`: archived records are out. Tests for each.
- [ ] **39.4 The Progress controls.** Archive and Delete on each Play on row, after Replay.
  The two-step Delete as a small component used in both tables, with a test that the
  first click arms it, the second deletes, and a third click elsewhere or the timeout
  disarms it (the timer is the one place a fake timer is allowed; say so in the test).
  Disabled with the title for the game on the Play screen.
- [ ] **39.5 The archive view.** The "N archived games" button, the table with Unarchive and
  Delete, Back to your games. `HELP_CONTROLS` gains "Archive", "Delete", "Unarchive" and
  "Back to your games" on `progress`; the help test needs a seeded history with an
  archived record to render them.
- [ ] **39.6 DOM tests, red first**: start a game, play a move, Stop and discard: the start
  screen shows and the history is empty. Review a game, Progress, Archive: the row leaves
  the Play on list, the Games played count drops, the archived line appears; open the
  archive, Unarchive, the row is back. Delete twice within the window: the record is gone
  from the store; Delete once and wait: still there. Mutation-check the help test on the
  new names.
- [ ] **39.7 Help and SPEC.** Help, Progress section: Archive, Delete and the archive view,
  and the cap sentence. SPEC section 2, Progress and Play: one sentence each. Section 8: the
  ruling with the date.
- [ ] **39.8 Version 1.8.5** in the three files.
- [ ] **39.9 Prove it in the browser build**: the discard, the archive round trip, a delete,
  and the disabled controls on the game currently on Play. Clear the storage afterwards.

## Hazards

- **The provider's value is deliberately NOT memoised** (`play-context.tsx`).
- **Delete is the first destructive control in the app.** Two clicks, a short window, and
  the label changes between them so the second click is a choice, not a slip. Never a
  single click.
- **`archived` absent means not archived**, like every other optional field; no migration.
- **The store is written on every change**; archive, unarchive and delete each go through
  the same save path as `recordPlay`, so the second copy under `%LOCALAPPDATA%` follows.
- **Nick's progress file is live**; never report his data folders from your own `ls`. Do
  not test against it.
- **No `tauri build` or `tauri dev`.** **Commit before you stop.**
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change; the rule is
  twenty seconds.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Archiving from the Play screen. Bulk operations. Restoring a deleted game. Any chess
content. A packaged build.

## Conventions and finish

Commit style follows the log. Tick PLAN.md phase 39 boxes as you go. **The review gate
box belongs to the orchestrator: leave it.**

Acceptance: a game in progress can be stopped and discarded with nothing recorded; every
saved game has Archive and a two-step Delete; archived games leave every list and count
and live on an archive view inside Progress with Unarchive and Delete; the game on Play
cannot be archived or deleted from Progress; DOM tests red first and the help test
mutation-checked; Help and SPEC true; version 1.8.5; vitest green and `tsc -b` clean; the
tree committed and clean.
