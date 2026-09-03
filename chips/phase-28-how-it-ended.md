# Chip: phase 28 - how every game ended, including the ones played before we kept it

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read PLAN.md phases 25 to 28, `src/ui/play-on.ts`, `Progress.tsx`, `play-context.tsx`,
`src/play/session.ts`, `src/play/report.ts`, `src/storage/progress.ts` and
`help-text.ts` before starting.

Nick installed 1.6.11 on 2026-09-04 and found the Ended column saying "Stopped" for games
that ended in checkmate, and no verdict on the stopped ones. Both are the same cause: a
record only carries `outcome` and `finalEval` if it was reviewed on 1.6.11 or later, and
`endedText` says "Stopped" for everything older. Every one of his games has its moves,
though, and the moves say how most of them ended. **No chess content.**

## The work

### 28.1 Work the ending out from the moves when the record does not say

- [ ] **A record without `outcome` is not a record that was stopped.** Replay its `sans`
  through chess.js and read the final position: checkmate, stalemate, insufficient
  material, threefold repetition, the fifty move rule. A checkmate is "You won by
  checkmate" or "You were checkmated" by whose move it was and the course's colour; the
  draws use the session's own sentences (`noteOutcome` in `session.ts` has them, and the
  wording must stay one wording, so lift them into a shared function both call).
  A record with `outcome` keeps it. A record with no moves at all stays "Stopped".
- [ ] **A game that reached its length cap says "Move limit", not "Stopped".** Add
  `length?: GameLength` to `PlayRecord`, written at review from `setup.length`. A record
  whose moves equal its cap, or whose final position is not an ending, shows "Move
  limit" when it has a length and the count matches, "Stopped" otherwise. Records from
  before this phase have no `length`, so they read "Stopped" unless the moves say
  otherwise; say that in the hint in one clause rather than a sentence.
- [ ] **Tests** on the derived ending: a mated record with no `outcome` in a White course
  and in a Black course, a stalemate, a record at its cap with `length`, a record at 10
  moves with no `length`, a record with moves that run past its cap after Play on.

### 28.2 Two columns, not one

- [ ] **Nick: the ending and the position are two different facts, and he expected to
  see both.** Split the Ended column into **Ended** (Checkmate, Stalemate, Draw by ...,
  Move limit, Stopped, in the words above) and **Position** (`verdictForYou(finalEval)`,
  capitalised: "Level", "Slightly better for you", "Winning for the engine"). Position is
  blank for a record with no `finalEval`, which is every game reviewed before 1.6.11. A
  mated game's Position is blank too: the ending says it all, and a number beside a mate
  is noise.
- [ ] **A record with moves but no `finalEval` can be given one by Replay**, and that is
  the one case where a replay is allowed to write: decision rule, Replay's review fills
  in `finalEval` (and `outcome` where the moves say it) on a record that has NEITHER,
  and never overwrites one it already has. Extend the `untouched` guard in `finish`
  accordingly: skip the write unless the record is missing those fields. Test that a
  record with `finalEval` is left alone and one without gets it.
- [ ] `endedText` becomes two functions or one returning both; the Play on tests and
  `help.test.ts` follow. Help, Progress section: the two columns in one sentence each.

### 28.3 The greyed Play on and Replay

- [ ] **Nick: the buttons are sometimes greyed, apparently while a replayed game is being
  reviewed.** Today they are disabled while `game.inProgress` is true, which is a session
  with no report: a game being played, AND a game whose review scan has not finished yet.
  So a Replay that is still scanning greys them, which is right but reads as odd. Keep
  the rule, and make the title say which it is: "A game is being played. Finish or replace
  it on Play first." while the trainee is mid-game, and "The game is being reviewed;
  wait for the report." while `scanning` is set. If he sees them greyed with the report
  SHOWING, that is a bug: reproduce it (Replay, wait for the report, go to Progress) and
  fix it; say what you found either way.

### 28.4 Version 1.6.12

- [ ] `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`.

### 28.5 Prove it in the browser build at 1200x980

- [ ] Seed the browser build's storage with records shaped like Nick's: one mated with
  no `outcome`, one stopped with no `finalEval`, one at 10 moves with no `length`, and
  show the two columns for each. Replay the one without `finalEval` and show Position
  filled and the other rows untouched. Go to Progress during a Replay's scan and show
  the greyed buttons with the scanning title, then after the report with them live.
  Clear the storage afterwards.

## Hazards

- **The provider's value is deliberately NOT memoised** (`play-context.tsx`).
- **The record's `at` is the game's identity.** Nothing here mints one.
- **Nick's progress file is live** at `%APPDATA%\Repertoire Trainer\progress.json`, and a
  session's view of the filesystem OUTSIDE this repo can be a stale overlay. **Never
  report his data folders from your own `ls`.** This phase does not touch the file.
- **Do not run `tauri dev`.** The Vite server is 5175 with `--strictPort`; if another
  server holds it, drive against it and say so. Screenshot before a coordinate click,
  confirm every click by reading state, judge console errors from a fresh tab.
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Any change to what a live game records beyond `length`. Any chess content. A packaged
build.

## Conventions and finish

Commit style follows the log. Tick PLAN.md phase 28 boxes as you go. **The review gate
box belongs to the orchestrator: leave it.**

Acceptance: every record with moves shows how it ended, worked out from the moves when
the record does not say; Move limit for capped games that recorded a length; Ended and
Position as two columns with Position blank where nothing honest can be shown; Replay
filling in a missing verdict and never overwriting one; the greyed buttons saying why;
Help true; version 1.6.12; nothing under `courses/`; vitest green and `tsc -b` clean.
