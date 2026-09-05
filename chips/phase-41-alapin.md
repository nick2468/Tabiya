# Chip: phase 41 - the Alapin Sicilian, a ninth course

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 3, 4, 8 and 10, PLAN.md phases 31, 34 and 35 (the last two courses
and the second pass), `docs/content-schema.md`, `docs/authoring-a-course.md`,
`docs/engine-runs/accepted.md`, `docs/engine-runs/second-pass/README.md`, and the Vienna
course folder (`courses/vienna-gambit/`) as the model of a White course, before starting.
**After phase 40 is committed.**

Nick commissioned the Alapin on 2026-09-05. His White repertoire answers 1...d5 twice
(London, Colle) and 1...e5 twice (Ruy Exchange, Vienna) and has nothing against 1...c5, the
most common reply to 1.e4 at club level. This is the structural answer: c3 and d4 for a
pawn centre, the same kind of chess the London and the Colle teach. A ninth course means
version 1.9.0.

## The rulings, settled before any drafting

- **The Alapin Sicilian**: 1.e4 c5 2.c3. Chosen over the Grand Prix Attack (2.Nc3 and f4)
  because Nick's White courses are structural and this one is too; ch0 says so in one
  sentence and names the rejected alternative once.
- **The course id is `alapin-sicilian`, and it is permanent.** Title: "The Alapin
  Sicilian". Colour white. Tagline in the house voice: the pawn centre against the
  Sicilian.
- **Two main lines, one chapter each.** 2...Nf6 3.e5 Nd5 4.d4 cxd4 5.Nf3 and 2...d5 3.exd5
  Qxd5 4.d4 Nf6 5.Nf3 are both main and both get a full chapter. Where a fork has two
  sound White choices (5.Bc4 or 5.Nf3 orders, cxd4 or Nxd4 recaptures, 6.Be2 or 6.Bc4),
  the fork rule applies: less to memorise, the rejected one in a sentence.
- **Seven chapters**, the house shape:
  0. **The idea** (300-500 words): what 2.c3 wants (d4 with a pawn behind it), what it gives
     up (the knight's square, a tempo), the two structures White gets (the e5 wedge with a
     knight on d5 to chase, or the isolated d-pawn with open lines), piece homes, and how
     this is the London player's centre reached by 1.e4. The contrast with the Vienna:
     same first move, opposite temperament.
  1. **2...Nf6: the e5 wedge.** 3.e5 Nd5 4.d4 cxd4 5.Nf3 with Black's main choices (5...Nc6,
     5...e6, 5...d6) and White's recipe for each; depth to move 10-12 on the main branch.
  2. **2...d5: the isolated pawn.** 3.exd5 Qxd5 4.d4 Nf6 5.Nf3 with 5...e6, 5...Bg4,
     5...Nc6 and the ...cxd4 recapture question; the IQP plans in the notes.
  3. **Black's other second moves**: 2...e6, 2...d6, 2...g6, 2...Nc6, 2...e5, 2...b6, one
     recipe each, most reaching ch1 or ch2 shapes and the chapter says which.
  4. **Black delays or avoids ...cxd4**: the closed centre after 2...Nf6 3.e5 Nd5 4.d4 d6,
     2...d5 3.exd5 Qxd5 4.d4 e6 and the like; what White does with the full centre.
  5. **Everything else**: 2...a6, 2...Qc7, 2...Qa5, 2...f5, 2...Nc6 3.d4 with early
     ...cxd4 and ...Qb6 tries. One safe recipe each.
  6. **Typical tactics and plans**: the d5 break against the IQP, Bxh7+ and Ng5 ideas with
     the e5 wedge, the Bb5 pin against ...Nc6, Qb3 hitting b7 and d5, the a3 and b4
     expansion, and two defensive exercises where Black's ...Qb6 or ...Bg4 has to be
     answered exactly. **At least ten authored mistake entries in ch6**, on identical
     positions only where copied, and the one-grade rule holds.

## The work

- [ ] **41.1** is done: the variation, the id, the forks and the chapters.
- [ ] **41.2 Draft the seven chapters** to the SPEC.md section 3 bar, student WHITE: a note
  on every move, a plan and a NAME on every leaf, the typical-mistakes section in each
  intro, at least ten authored mistake entries in each of ch1 to ch6 and on ch0's core
  decisions, weights on BLACK's replies, tags from the core set plus `tagExtensions`. The
  folder is the registration. Depth 10-12 on main branches, 6-8 on the rest.
- [ ] **41.3 Run the suite after every chapter.** It holds the check marks, the direction
  claims, the note-line rules and one grade per position.
- [ ] **41.4 The checkers after the LAST content edit**, outputs under
  `docs/engine-runs/phase-41/` with the run conditions at the top of each file:
  `engine-pass.mjs` at 500 ms twice with findings re-checked at 2500 ms, **and then
  `engine-pass.mjs` at 2500 ms once over the whole course** (the second-pass standard, about
  twelve minutes); `engine-mistakes.mjs` at 2500 ms once with a confirming run if it moves
  anything; `note-claims.mjs`; `note-lines.mjs` with zero HARD findings. **Movetime is wall
  clock**: one engine process, never beside a build or a test run; sample the load before
  the 2500 ms passes and if the machine is busy, wait for it to settle rather than run
  noisy, and say what you waited for. A flagged WHITE repertoire move is KEPT if at 2500 ms
  the position after it is no worse than about -0.3 for White and it is the move the
  theory plays; judge a move by its cost against the engine's best at the same position,
  not its absolute number. Record every kept number.
- [ ] **41.5 The course's block in `content.test.ts`**, modelled on the Vienna's, with two
  claims about THIS course: that every repertoire chapter has White's pawn on c3 by move
  2, say, and that no chapter's White moves include an early Nc3 before d4.
- [ ] **41.6 Extend the course-scoping test**: the Ruy, the Vienna and the Alapin agree on
  1.e4; the Alapin is the only one with an answer to 1...c5, and the two others have none,
  which the test states rather than assumes.
- [ ] **41.7 Export the bundle** and confirm the round trip picked it up.
- [ ] **41.8 The count of courses in prose**: grep `eight courses` and `8 courses` across
  SPEC.md, `help-text.ts` and `docs/` and correct every one describing the present.
- [ ] **41.9 The version becomes 1.9.0.**
- [ ] **41.10 Prove it in the browser build at 1400x980**: nine tiles as five and four; the
  new tile with its tagline; Study opens ch0 and names every line; Drill takes a learnt
  line; Play as White with the book steering Black into 1...c5 lines; Play the other side
  with the engine answering 1.e4 c5 with 2.c3. Clear the storage afterwards. The packaged
  build is the orchestrator's.

## Hazards

- **Do not touch the other eight courses' content.** The gate rebuilds their 378 line ids
  and expects every one unchanged.
- **Copied mistake entries drift**; the one-grade rule in the suite is the guard.
- **Nick's progress file is live**; never report his data folders from your own `ls`.
- **No `tauri build` or `tauri dev`.** If another server holds 5175, drive against it.
- **`npx tsc -b`**, and say you ran it. **Commit before you stop.**
- **No em dashes anywhere**, including JSON notes, PGN prose and line names. Australian
  English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

The Grand Prix Attack beyond ch0's sentence. Any change to the other eight courses. Any
change to the app beyond the version and the prose counts. Any change to the checkers. A
packaged build.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc or the code: stop that
item, record it, continue with the rest. If the engine says a ruled line is unsound at
2500 ms, fix the line and record the finding. If the machine stays busy, wait; do not run
the verdict-strength passes noisy.

## Conventions and finish

Commit style follows the log. Content in two or three commits, then the tests, the bundle,
the prose counts and the version bump separately. Tick PLAN.md phase 41 boxes as you go.
**The review gate box belongs to the orchestrator: leave it.** The open items list every
engine finding kept and why, every fork taken with its sentence, and the conditions the
2500 ms passes ran under. **Then go straight on to `chips/phase-42-kings-indian.md`.**

Acceptance: the course meets the section 3 bar with names on every leaf, weights on Black's
replies only and at least ten mistake entries in every chapter from ch1 to ch6; the
checkers run and recorded with conditions, including the 2500 ms pass over the whole
course; the bundle round-trips; the scoping test covers the three 1.e4 courses; the prose
counts say nine; version 1.9.0; the other eight courses untouched with 378 line ids intact;
vitest green and `tsc -b` clean; the tree committed and clean.
