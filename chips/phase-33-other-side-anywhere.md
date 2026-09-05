# Chip: phase 33 - the other side from any start, and a suite budget that fits the app

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read PLAN.md phases 29 to 32, `docs/testing.md`, `src/ui/Play.tsx` (the launch radios and
the `other-side` fieldset), `play-context.tsx`, `src/ui/play-from-replay.ts`, `play-on.ts`
and `help-text.ts` before starting. **Do this phase before phase 34.**

Nick, 2026-09-05, after playing 1.7.2: he wants to play the other side from a Study
position too. Phase 32 built "Play the other side" as a fourth radio in the launch group,
which made it exclusive with "From a Study position", and added a dropdown of lines under
it that repeats the choice the first two radios already make. The fix is the shape of the
control, and Nick has ruled it. **No chess content. Provider and screen changes, so the
phase 29 rule applies: DOM tests shown red first.**

## The rulings

- **"Play the other side" becomes a checkbox that applies to whichever launch shape is
  chosen**: Any line, This chapter's line, From a Study position, or Play from here out of
  a replay. The lines dropdown under it goes: the radios above already say which lines.
  The two-setting fieldset (The course move every time, Sometimes a listed alternative)
  stays under the checkbox and shows only while it is ticked. The checkbox itself is a
  launch choice and is NOT remembered; the setting under it is, as now.
- **From a position on the other side**: the trainee takes the opponent's colour and the
  game starts at the Study position. If it is the course's side to move there, the engine
  moves first, out of the book when the book has the position and at strength otherwise,
  exactly as `start` already handles an engine-first start. The request from Study carries
  no side; the checkbox adds it at Start.
- **Play on and Replay of a recorded other-side game keep their side from the record**,
  as now, and the checkbox is ticked and disabled on the start screen for such a request,
  with a title saying the game was played on the other side. A recorded course-side game
  played on cannot be switched to the other side: that would be a different game.
- **The ten-second suite rule is relaxed to twenty.** Nick's ruling: a rule that blocks a
  better app is the wrong rule. The purpose stays and is written down: a bar nobody waits
  for is a bar nobody runs, so the suite must stay fast enough that a builder runs it after
  every change. Twenty seconds on this machine is that. `docs/testing.md` and SPEC section
  8 both say so with the date and the reason, and the phase 29 register note in the plan
  is answered.

## The work

- [ ] **33.1 The control.** Replace the fourth radio and its dropdown with a checkbox
  labelled "Play the other side" under the three launch radios, its sentence "You play
  against the course. The engine plays its moves." beside it, and the existing two-setting
  fieldset under it while ticked. Every launch shape combines with it. `HELP_CONTROLS`
  keeps "Play the other side" on `play`; the dropdown's name leaves it if it was there.
- [ ] **33.2 The start options carry the side for every shape.** `side: 'other'` goes on
  the options whenever the box is ticked, including `launch === 'here'`. For a request
  that already carries a side (Play on or Replay of an other-side record), the box is
  ticked and disabled with its title, and the record's side wins.
- [ ] **33.3 The engine-first start from a position.** Check `start` when the trainee is
  on the other side and the Study position has the course to move: the engine plays the
  book move at once and the trainee then moves. Test it with the fake engine and a
  Caro-Kann position after 1.e4 (Black, the course's side, to move: the engine plays
  1...c6 and the trainee, as White, is to move).
- [ ] **33.4 DOM tests, red first**: from Study, Play from here with the box ticked lands a
  game where the trainee holds the opponent's colour and the engine has already answered
  when the position had the course to move; the box is ticked and disabled for a Play on
  of an other-side record; the box is unticked by default and not remembered across a
  reload while the setting under it is. Mutation-check the help test on the checkbox.
- [ ] **33.5 The suite budget.** `docs/testing.md`: the rule reads twenty seconds, with the
  reason it exists in one sentence. SPEC section 8: the ruling with the date. The plan's
  phase 29 and 32 notes on the budget get one line saying it was raised at phase 33.
- [ ] **33.6 Help and SPEC.** Help, Play section: the paragraph on Play the other side says
  it is a box that goes with any of the three ways to start, including from a Study
  position and from a replay. SPEC section 2, Play: the same in one sentence.
- [ ] **33.7 Version 1.7.3** in the three files.
- [ ] **33.8 Prove it in the browser build at 1200x980**: on Study in the Caro-Kann, step to
  a position after a White move, Play from here, tick the box, Start: the engine answers as
  Black and you are White to move; the header names the other side. Then Progress, Play on
  of that record: the box ticked and disabled. Clear the browser build's storage afterwards.

## Hazards

- **The provider's value is deliberately NOT memoised** (`play-context.tsx`).
- **`side` absent means `'course'`** on every record and request.
- **The trainee colour for the bar, the board orientation and the hint** must all come
  from the SESSION's trainee colour, never the course's. Phase 32's gate found the Progress
  verdict reading the course colour; check the same class here for the from-position path.
- **Nick's progress file is live** at `%APPDATA%\Repertoire Trainer\progress.json`; never
  report his data folders from your own `ls`.
- **Do not run `tauri dev`.** The Vite server is 5175 with `--strictPort`; if another
  server holds it, drive against it and say so. Judge console errors from a fresh tab.
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first. **Commit before you
  stop and before starting phase 34**: the orchestrator builds from the working tree.

## Out of scope

Any chess content. A packaged build. Drilling the other side.

## Conventions and finish

Commit style follows the log. Tick PLAN.md phase 33 boxes as you go. **The review gate
box belongs to the orchestrator: leave it.**

Acceptance: Play the other side as a checkbox that goes with every launch shape including
from a Study position and from a replay; the engine-first start from a position tested;
Play on and Replay keeping a record's side with the box ticked and disabled; DOM tests red
first and the help test mutation-checked; the suite rule at twenty seconds in the testing
page and the SPEC with its reason; Help and SPEC true; version 1.7.3; nothing under
`courses/`; vitest green and `tsc -b` clean; the tree committed and clean.
