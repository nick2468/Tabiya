# Chip: phase 36 - the replay position survives leaving the screen

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read `docs/testing.md`, `src/ui/Play.tsx` (the `replay` state and the effect that owns
it), `play-context.tsx` and `src/play/replay.ts` before starting. **Do this after phase 35
is committed.**

Nick, 2026-09-05: reviewing a game, he stepped the replay back to the move the report
called an inaccuracy, went to Study to look the position up, and came back to find the
board at the final move again. The game survives a trip to another screen because it
lives in `PlayProvider`; the replay position does not, because it is `useState` inside
`Play`, which unmounts on a view change. **App change to the provider, so the phase 29
rule applies: a DOM test shown red first.**

## The work

- [ ] **36.1 The replay ply moves into the provider.** `PlayGame` gains `replayPly:
  number | null` and `setReplayPly`, held beside the report and cleared whenever the
  report is cleared (New game, Keep playing, Play from here, Play on) and when a new
  review is built. `Play.tsx` reads and writes it through `usePlay()` instead of its own
  state. The "which report does this ply belong to" guard that phase 25 kept beside the
  ply comes along: a ply that outlives its report would show the wrong position for one
  render.
- [ ] **36.2 The arrows, the clickable moves, the clickable slips and Play from here** all
  keep working from the provider's value. The bar follows it as now.
- [ ] **36.3 DOM test, red first**: review a game, step back two plies, click Study, click
  Play: the move list's current move and the board position are the ones stepped to, not
  the final move. Then New game: the ply is cleared. Show it red on today's code (the
  position resets) and green after.
- [ ] **36.4 Help**: the sentence in the Play section about the game keeping going while
  you look at another screen gains "and so does the position you stepped the replay to".
- [ ] **36.5 Version 1.8.2** in the three files.
- [ ] **36.6 Prove it in the browser build**: review, step back, Study, Play, the same
  position; clear the storage afterwards.

## Hazards

- **The provider's value is deliberately NOT memoised** (`play-context.tsx`).
- **The ply is view state and never touches the session's moves.** Undo, Redo and Keep
  playing are unchanged.
- **Nick's progress file is live**; never report his data folders from your own `ls`.
- **No `tauri build` or `tauri dev`.** **Commit before you stop.**
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change; the rule is
  twenty seconds.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Remembering the replay position across an app restart. Any chess content. A packaged
build.

## Conventions and finish

Commit style follows the log. Tick PLAN.md phase 36 boxes as you go. **The review gate
box belongs to the orchestrator: leave it.**

Acceptance: the replay position survives a trip to another screen and is cleared with the
report; a DOM test shown red first; the Help sentence; version 1.8.2; vitest green and
`tsc -b` clean; the tree committed and clean.
