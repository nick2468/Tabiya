# Chip: phase 44 - the drill board shows the answer, and the gap has a unit

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read `docs/testing.md`, `src/ui/Drill.tsx` (the board after an answer, `answerShapes`,
`Feedback` and its `preview`), `src/scheduler/index.ts` (`review`, `describeInterval`,
`Schedule`), `src/model/queue.ts`, `src/ui/prefs.ts` (the remembered Drill scope is the
pattern), `src/storage/progress.ts` (`recordAnswer`) and `help-text.ts` before starting.

Nick, 2026-09-06, on 1.10.1, three things about Drill. Every ruling is his. **No chess
content. The scheduler and the progress store change, so the phase 29 rule applies: DOM
tests shown red first.**

## The rulings

- **A right answer stays where it went.** Today the board redraws the card's position
  after any answer, so the piece Nick moved jumps back to its square and a green arrow
  points where it went. He wants the piece left on the square he moved it to, with the
  arrow kept.
- **A wrong answer shows both.** The piece he moved jumps back with the red arrow as now,
  AND the board shows the correct piece moved to its square with the green arrow, so the
  right position is what he looks at while he reads the note. His reason: the visual
  memory of the right position will serve him better than an arrow alone.
- **The gap after a right answer has a unit he chooses: minutes, hours or days.** Days is
  today's behaviour and the default. The choice is remembered like the Drill scope. When
  he wants to hammer one course in an afternoon, minutes; for ordinary spaced repetition,
  days. Decision rule for what the unit means: FSRS works out its gap in days as it does
  now; the app then applies that number in the chosen unit when it writes the due date, so
  "back in 3 days" becomes "back in 3 hours" or "back in 3 minutes" with every other
  field of the schedule (stability, difficulty, reps, lapses, state) exactly as FSRS
  computed it. Switching the unit back to days therefore costs nothing: the memory model
  was never touched, only the clock. Say this in the Help in one sentence, and say that
  minutes and hours are for practice, not for remembering.

## The work

- [ ] **44.1 The board after an answer.** In `Drill.tsx`, the position shown once a verdict
  exists is the position AFTER the repertoire move (`card.fen` with `card.san` played), for
  both a right and a wrong answer. `answerShapes` is unchanged in what it draws: green
  from `card.from` to `card.to`; red from the wrong move's squares when there was one.
  Because the board now shows the piece on `card.to`, the green arrow reads as "this is
  where it went" and the red arrow as "not there". `lastMove` on the board is the
  repertoire move. A pure helper `shownAfter(card)` with a test: the fen has the piece on
  `card.to`; a card whose repertoire move captures shows the captured piece gone.
- [ ] **44.2 The unit.** `DrillGap = 'minutes' | 'hours' | 'days'` in `prefs.ts`, key
  `london-trainer.drill-gap`, default days, a hook called once in the shell beside
  `useDrillScope` and handed down. In the scheduler, `review(schedule, rating, now, unit)`
  computes as today and then rewrites `due` as `now + scheduled gap` in the unit; a
  minimum of one minute so a zero-day gap is not "again now" in the minutes setting.
  `describeInterval` already reads `due`, so the buttons say the right words without a
  change. `recordAnswer` receives the schedule the unit produced. Tests: the same rating
  under the three units gives three due dates a factor of 24 and 1440 apart, and identical
  stability, difficulty and reps.
- [ ] **44.3 The control.** On the Drill start screen, under the two scope radios, a
  fieldset "Come back in" with three radios: Minutes, Hours, Days (default). One sentence
  under it: "Days is spaced repetition. Minutes and hours are for hammering a line today;
  the schedule's memory of each card is the same either way." The in-session feedback
  buttons keep saying "back in 3 hours" and so on from the preview. `HELP_CONTROLS`
  gains "Come back in", "Minutes", "Hours" and "Days" on `drill`.
- [ ] **44.4 DOM tests, red first**: answer a card correctly and assert the board's fen has
  the piece on the destination square; answer wrongly and assert the fen shows the
  repertoire move played and two shapes on the board; set the unit to hours, answer, and
  assert the stored card's due is within the hour and its `scheduled_days` matches what
  days would have given; reload and the unit is remembered. Mutation-check the help test on
  the new names.
- [ ] **44.5 Help and SPEC.** Help, Drill section: the two board behaviours in one sentence
  each, and the unit with its caveat. SPEC section 2, Drill: the unit in one sentence.
  Section 8: the ruling with the date and Nick's reason. `scheduler/index.ts`'s docblock
  says the parameters stay untouched and why the unit is applied to the clock alone.
- [ ] **44.6 Version 1.10.2** in the three files.
- [ ] **44.7 Prove it in the browser build at 1400x980**: a right answer leaving the piece
  where it went with the arrow; a wrong answer with the red arrow and the correct piece
  moved under the green one; the unit set to minutes and a "Got it, back in N minutes"
  button; the card back in the queue after that gap ("Include cards that are not due yet"
  is not needed for it). Clear the storage afterwards.

## Hazards

- **The FSRS parameters are untouched.** The standing ruling in `scheduler/index.ts` holds;
  the unit changes the due date and nothing else. If the two cannot be separated cleanly
  in `review`, stop and say so.
- **`scheduled_days` keeps FSRS's number**, whatever the unit, so a later review is judged
  by FSRS against the elapsed time it expects; note in the docblock that a minutes-unit
  review therefore looks "early" to FSRS, which is the practice caveat the Help states.
- **Providers and hooks are called once in the shell** and handed down, as `useDrillScope`
  is.
- **Nick's progress file is live**; never report his data folders from your own `ls`. Do
  not test against it.
- **No `tauri build` or `tauri dev`.** **Commit before you stop.**
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change; the rule is
  twenty seconds.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

A fourth unit. Per-course units. Changing the FSRS parameters or the ratings. Any chess
content. A packaged build.

## Conventions and finish

Commit style follows the log. Tick PLAN.md phase 44 boxes as you go. **The review gate
box belongs to the orchestrator: leave it.**

Acceptance: the drill board shows the position after the repertoire move for right and
wrong answers with the arrows as ruled; a remembered "Come back in" unit that scales the
due date and nothing else, defaulting to days; DOM tests red first and the help test
mutation-checked; Help and SPEC true; version 1.10.2; nothing under `courses/`; vitest
green and `tsc -b` clean; the tree committed and clean.
