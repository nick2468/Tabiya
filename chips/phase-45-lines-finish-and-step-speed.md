# Chip: phase 45 - every line ends on your own move, and auto step has a speed

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 2, 3 and 8, PLAN.md phase 43 (the cross-course rule and its gate
notes), `docs/content-schema.md` (what a leaf carries), `docs/authoring-a-course.md`,
`docs/engine-runs/accepted.md`, `src/ui/Study.tsx` (`STEP_MS`, the auto-step effect and
the `lines-head` button), `src/ui/prefs.ts` (the phase 44 shape) and `help-text.ts`
before starting.

Nick, 2026-09-06, on 1.10.2: fix the two courses that gate 43 recorded and left, and give
auto step a speed he can change. **Content plus one small screen change; version 1.10.3.**

## The rulings

- **A line ends on the student's own move.** The Slav has ten leaves that end on a WHITE
  move, so the student is left looking at a position it is their turn to answer with
  nothing prepared. The newer courses are written to this rule and the loader only allows
  the old shape because these courses predate it. Nick: fix it.
- **A course does not stop one move before the other course's point.** The Najdorf's
  Alapin line ends at `9...Bd7` where Nick's own Alapin course plays `10.Nxd7` and keeps
  going for another ten plies. The cross-course test excludes leaves on purpose, so no
  test will ever catch this; a reader of both courses notices it at once.
- **Auto step is too fast and the speed is his to set.** The gap is `STEP_MS = 850`
  today, which he reads as about a second. **The default becomes 2000 ms**, and a pair of
  buttons moves it in 0.5 second steps.

## The work

### 45.1 The Slav's ten lines get their last move

- [ ] Ten leaves end on White's move. **The move to add is the one the leaf's own plan
  already names**, which is the decision rule for all ten and makes this a mechanical
  change rather than a fresh authoring job:

  | Chapter | Line, from move 1 | The plan already says | So add |
  |---|---|---|---|
  | ch2-quiet | 1.d4 d5 2.c4 c6 3.Nf3 Nf6 4.Bf4 dxc4 5.Nc3 e6 6.a4 | "Play ...Nd5" | `6...Nd5` |
  | ch4-sidelines | 1.d4 d5 2.c4 c6 3.Nc3 Nf6 4.Nf3 | "take on c4" | `4...dxc4` |
  | ch4-sidelines | 1.d4 d5 2.c4 c6 3.Nc3 Nf6 4.e3 Bf5 5.Nf3 | "Play ...e6" | `5...e6` |
  | ch4-sidelines | 1.d4 d5 2.c4 c6 3.Nc3 Nf6 4.cxd5 cxd5 5.Bf4 Nc6 6.e3 | "Play ...Bf5" | `6...Bf5` |
  | ch4-sidelines | 1.d4 d5 2.c4 c6 3.e3 Nf6 4.Nf3 | "Play ...Bf5 at once" | `4...Bf5` |
  | ch4-sidelines | 1.d4 d5 2.c4 c6 3.e3 Nf6 4.Nc3 | "Play ...Bf5" | `4...Bf5` |
  | ch5-no-c4 | 1.d4 d5 2.Bf4 Nf6 3.Nf3 c5 4.e3 | "Play ...Nc6" | `4...Nc6` |
  | ch5-no-c4 | 1.d4 d5 2.Nf3 Nf6 3.Bg5 Ne4 4.Bh4 c5 5.e3 | "Play ...Nc6" | `5...Nc6` |
  | ch5-no-c4 | 1.d4 d5 2.Nf3 Nf6 3.Bf4 | "Play ...c5" | `3...c5` |
  | ch5-no-c4 | 1.d4 d5 2.e3 Nf6 3.Bd3 c5 4.c3 Nc6 5.Nf3 | "Play ...Bg4 at once" | `5...Bg4` |

- [ ] Each new move carries a NOTE saying why it is played, in the Black voice. The
  `plan` and the `name` move to the new leaf, and **the plan is rewritten from one move
  later**: it must not still be telling the student to play the move that is now on the
  board. The name stays as it is unless it named the White move that is no longer the
  end, and if you change one, say so in the commit.
- [ ] **If the engine at 2500 ms prefers a different move to the one the plan names**,
  that is a finding, not a licence to substitute quietly: record both moves and both
  numbers in the open items, and take the engine's move only if the plan's move costs
  more than about 0.3 against it. Then the plan's prose is wrong too and must be fixed
  with it. Every kept number goes in the records.
- [ ] Re-run the leaf check afterwards and say the count is zero. A one-off script is
  fine for the sweep; the rule ships as the test in 45.2.

### 45.2 The rule that made it a rule

- [ ] **A test in `content.test.ts`: every leaf of every course ends on a move of the
  student's own colour.** This is the rule the newer courses were written to and it has
  never been enforced. Run it BEFORE 45.1 and record what it finds, which should be
  exactly the ten above; if it finds more, that list is the scope and say so.
- [ ] `docs/content-schema.md`, "What a leaf carries": the rule in one sentence with the
  reason (a leaf is where the student is left standing, so it must be their own move that
  put them there). SPEC section 3 likewise, one sentence.

### 45.3 The Najdorf goes as far as the Alapin does

- [ ] The Najdorf's `ch5-anti-sicilians` line named "The Alapin, 2...Nf6 and the trade"
  ends at `9...Bd7`. The Alapin course plays on: `10.Nxd7 Qxd7 11.Nc3 e6 12.O-O Be7
  13.Qg4 O-O 14.Bxc6` and beyond, in both `ch0-the-idea` and `ch1-nf6-the-wedge`.
  **Extend the Najdorf line to at least `10.Nxd7 Qxd7 11.Nc3 e6`**, with a note on each
  move and the plan and name moved to the new leaf. Go further only if the position is
  still unclear there; depth 10 to 12 is the house bar and this line is already at 9.
- [ ] The two courses must AGREE over every move added: White's moves here are the
  Alapin's own, so take them from the Alapin course rather than inventing them, and where
  the Najdorf and the Alapin would say different things about the same move, say so in
  the open items rather than choosing in silence.

### 45.4 The consequence 45.1 will probably have

- [ ] **Adding a Black move at a shared position brings it under the phase 43
  cross-course rule for the first time**, because that rule excludes leaves on purpose.
  Three of the ten are London, Torre and Colle positions that Nick's own White courses
  also reach, so the test may go red on moves that were invisible to it yesterday.
  **Close any new mismatch the phase 43 way**: list the other course's move as a weighted
  reply with a note in the course that was silent, never by changing a repertoire move.
  If that means touching `london-white` or `colle-zukertort`, do it and say so; if the
  list runs past about eight positions, stop, record the rest with counts, and say so.
- [ ] The 45.3 extension should IMPROVE agreement rather than break it, because it walks
  toward what the Alapin already plays. Confirm that rather than assuming it.

### 45.5 The checkers on what changed

- [ ] `engine-ask.mjs` at 2500 ms on every new Black move added and every new White move
  in 45.3; `engine-mistakes.mjs` at 2500 ms over each course whose entries changed;
  `note-claims.mjs` and `note-lines.mjs` over every course touched, zero HARD findings.
  Outputs under `docs/engine-runs/phase-45/` with the run conditions at the top of each
  file. **Movetime is wall clock**: one engine process, never beside a build or a test
  run; if the machine is busy, wait and say what you waited for.
- [ ] The Slav is a solid defence and its lines measure small numbers for White: a Black
  repertoire move is KEPT if its cost against the engine's best at the same position is
  no more than about 0.3, judged by that cost and not by its absolute number. Record
  every kept number. Anything standing that a later pass will report again goes in
  `docs/engine-runs/accepted.md`.
- [ ] Bundles regenerated for every course touched.

### 45.6 Auto step has a speed

- [ ] **The default gap becomes 2000 ms.** `STEP_MS` is 850 today, not the 1000 Nick read
  it as; say so in the commit so the change is not mistaken for 1000 to 2000.
- [ ] **Two buttons beside Auto step this line**: slower and faster, moving the gap in
  **500 ms steps between 500 ms and 5000 ms**. Name them so they read without the board:
  "Slower" and "Faster", each disabled at its end of the range. **The current gap is on
  the screen** beside them, as "2.0s", because a button that moves an invisible number is
  a button you press twice to see what it did.
- [ ] **The speed is remembered between sessions**, key `london-trainer.study.step-ms` in
  `prefs.ts`, read and written the way phase 44's settings are, with a value outside the
  range or unparseable falling back to 2000. This is a decision, not Nick's words: he
  ruled on 2026-09-06 that the app should stop making him re-choose things, and a step
  speed is a preference in exactly that sense. Study's PLACE stays in memory only, as
  phase 40 ruled; this is a different thing and the SPEC should not blur them.
- [ ] Changing the speed while the board is stepping applies from the next move. The
  timer effect already reruns on its dependencies, so the change restarts the pending
  step rather than serving out a whole old gap; that is the right behaviour, and a
  comment says it is deliberate rather than accidental.
- [ ] `HELP_CONTROLS` gains "Slower" and "Faster" on `study`. The Study help sentence
  about auto step gains a clause: the speed is yours to set and is remembered.
- [ ] **DOM tests**: pressing Faster twice and Slower once leaves the gap where it
  started; the buttons stop at both ends of the range; the speed survives a remount; a
  stored value of rubbish falls back to 2000. Use fake timers for the stepping itself
  rather than waiting two real seconds in the suite.

### 45.7 Version 1.10.3

- [ ] `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`.

### 45.8 Prove it in the browser build at 1400x980

- [ ] A Slav line that used to stop on White's move now ending on Black's, with its plan
  reading from the new position. The Najdorf's Alapin line reaching move 11. Auto step at
  the new default, then two presses of Slower and the board visibly slower, then a reload
  showing the speed held. Clear the storage afterwards.

## Hazards

- **Every extended line changes its id**, and there are eleven of them. Name the old and
  the new id for each in the commit that changes it. **A learnt tick is keyed by line id,
  so each of these silently loses its tick and its drill cards**: an unknown id matches
  no line, nothing errors, the tick just stops counting. That is the price of the fix and
  Nick has ruled it; the open items must list the eleven so he knows which lines to tick
  again.
- **Never change a repertoire move to make two courses agree.** Phase 43's rule:
  agreement is reached by listing the other course's move as a reply, or by extending a
  line.
- **The one-grade rule, the check-mark rule and the direction rule** bind every note
  added.
- **Do not touch the other courses' content** beyond what 45.4 forces, and say exactly
  what it forced.
- **Nick's progress file is live**; never report his data folders from your own `ls`. Do
  not test against it.
- **No `tauri build` or `tauri dev`.** **Commit before you stop.**
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change; the rule is
  twenty seconds.
- **No em dashes anywhere**, including JSON notes and line names. Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Any other course's leaves; the sweep says there are none, and if the 45.2 test disagrees
that list is the scope and you say so. A third auto-step control or a speed slider.
Remembering Study's place across a restart, which phase 40 ruled out. A packaged build.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc or the code: stop that
item, record it, continue with the rest. If the engine says one of the ten plan-named
moves is unsound at 2500 ms, that is a finding: record it, fix the line AND its prose,
and say so. If 45.4's list runs long, follow its stop rule rather than working through a
pile of content nobody has reviewed.

## Conventions and finish

Commit style follows the log. The leaf test first (red, with its list), then the Slav,
then the Najdorf, then whatever 45.4 forced, then the records and the bundles, then the
auto-step change, then the docs and the version, each its own commit. Tick PLAN.md phase
45 boxes as you go. **The review gate box belongs to the orchestrator: leave it.** The
open items list every engine number kept and why, every line id that changed old and new,
every cross-course mismatch 45.4 turned up and how it was closed, and the conditions the
2500 ms passes ran under.

Acceptance: no leaf in any course ends on the opponent's move, held by a test that was
shown red first; the Najdorf's Alapin line reaching at least move 11 with the Alapin's own
White moves; every new move noted, engine-checked at 2500 ms and recorded with conditions;
any cross-course mismatch the change created closed by listing a reply; bundles
regenerated; the leaf rule in the schema doc and SPEC section 3; auto step defaulting to
2000 ms with Slower and Faster in 500 ms steps between 500 and 5000, the gap shown, the
speed remembered, and DOM tests for the bounds and the memory; Help and SPEC true;
version 1.10.3; vitest green and `tsc -b` clean; the tree committed and clean.
