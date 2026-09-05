# Chip: phase 34 - the Scandinavian Defence, an eighth course

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 3, 4, 8 and 10, PLAN.md phases 18 and 31 (the Vienna and the
Najdorf, the two most recent courses, with their gate findings), `docs/content-schema.md`,
`docs/authoring-a-course.md`, `docs/engine-runs/accepted.md`, and the Najdorf course
folder (`courses/najdorf-black/`) as the model of a Black course, before starting. **Do
phase 33 first and commit it.**

Nick commissioned the Scandinavian Defence on 2026-09-05 as his fourth Black course and his
third answer to 1.e4. This is a content phase with the usual code tail: an eighth course
means version 1.8.0.

## The rulings, settled before any drafting

- **The Scandinavian Defence**: 1.e4 d5. Beside the Caro-Kann (solid) and the Najdorf
  (counterpunching), this is the SIMPLE answer: Black trades the centre pawn at once, puts
  the queen out, and develops into one structure with ...c6, ...Bf5 or ...Bg4, ...e6 and
  ...Nbd7 that looks a great deal like a Caro-Kann with the moves in a different order.
  ch0 says that in one paragraph and contrasts all three, the way the Najdorf's ch0
  contrasts the Caro-Kann.
- **The course id is `scandinavian-black`, and it is permanent.** Title: "The Scandinavian
  Defence". Colour black.
- **The queen recapture, 2...Qxd5.** The knight recapture 2...Nf6 (the Portuguese and
  Icelandic gambits) is out by the fork rule and rejected in one sentence in ch0.
- **The queen's square after 3.Nc3 is a decision rule, not a ruling.** 3...Qd6 (the modern
  line, Tiviakov's) needs less memorisation than 3...Qa5 (the classical line with its Bd2
  and Nd5 tricks against the queen), so the fork rule points at 3...Qd6. Take it unless the
  engine at 2500 ms and the chapter both come out better for 3...Qa5, and say in ch0 and
  the open items which you took and why. The rejected square gets one sentence.
- **Seven chapters**, the house shape:
  0. **The defence and its idea** (concept chapter, intro 300-500 words): what the early
     trade buys and costs, the queen out early and why it is not a target, the one
     structure Black builds against nearly everything, piece homes, the contrast with the
     other two answers to 1.e4.
  1. **The main line: 3.Nc3 and 4.d4.** 3...Qd6 4.d4 Nf6 5.Nf3 and the choices there
     (5...a6, 5...c6, 5...Bg4: one, by the fork rule, the others in a sentence), then
     6.Bd3 or 6.Ne5 or 6.g3 as White's tries. Highest drill weight.
  2. **3.Nc3 with the other fourth moves**: 4.Nf3, 4.Bc4, 4.g3, 4.Nge2 and 4.d3. What each
     concedes and one recipe each.
  3. **Third moves other than 3.Nc3**: 3.Nf3 (Nf6 or Bg4 with the fork rule), 3.d4,
     3.Be2, 3.Qf3 and the offbeat tries. One recipe each, most reaching the same
     structure.
  4. **White does not take: 2.Nc3, 2.e5, 2.d3, 2.exd5 delayed, and 2.d4 (the
     Blackmar-Diemer, 2...dxe4 3.Nc3 Nf6 4.f3 and a DECLINE by the fork rule, chosen with
     the engine).** One recipe each. 2.Nc3 d4 or 2...dxe4 is a fork; take one and say why.
  5. **Everything else at move two and three**: 2.Nf3, 2.f3, 2.Bd3 and the rest, one
     recipe each, most transposing to a chapter the trainee already knows, and the chapter
     says which.
  6. **Typical tactics and plans** - the exercises: the ...Bg4 pin against Nf3 and the
     e-pawn, the queen's escapes from Nb5 and Bb5+ ideas, the ...c5 break against d4, the
     ...e5 break in the Qd6 line, the ...Nb4 jump against Bd3, and defensive exercises
     against the early Bc4 and Qf3 attacks on f7. **At least ten authored mistake entries
     in ch6**, not copied from other chapters unless the position is identical, and the
     one-grade-per-position rule holds either way. Tree nodes are exercise positions where
     the expected move is the thematic blow or the right defence.

## The work

- [ ] **34.1** is done: the variation, the id, the queen square rule and the chapters.
- [ ] **34.2 Draft the seven chapters** to the SPEC.md section 3 bar, student BLACK: a
  note on every move, a plan and a NAME on every leaf, the typical-mistakes section in
  each intro, at least ten authored mistake entries in each of ch1 to ch6 and on ch0's
  core decisions, weights on WHITE's replies, tags from the core set plus
  `tagExtensions`. The folder is the registration. Depth to about move 10-12 on main
  branches, 6-8 on the rest.
- [ ] **34.3 Run the suite after every chapter**, not at the end. It now holds the check
  marks, the direction claims, the note-line rules AND one grade per position.
- [ ] **34.4 All FOUR checkers after the LAST content edit**, outputs under
  `docs/engine-runs/phase-34/` with the run conditions written at the top of each file
  as phase 31 did: `engine-pass.mjs` at 500 ms twice with every finding re-checked at
  2500 ms; `engine-mistakes.mjs` at 2500 ms once, with a confirming run if it moves
  anything; `note-claims.mjs`; `note-lines.mjs` with zero HARD findings. **Movetime is wall
  clock**: one engine process, never beside a build or a test run; measure the load
  before the 2500 ms passes and if the machine is busy, stop and say "ready for the
  verdict-strength passes". The Scandinavian concedes less than the Najdorf and should
  measure closer to level, so a flagged BLACK repertoire move is KEPT only if at 2500 ms
  the position after it is no worse than about +0.4 for White and it is the move the
  theory plays; record the number.
- [ ] **34.5 The course's block in `content.test.ts`**, modelled on the Najdorf's, with two
  claims about THIS course: that every repertoire chapter from ch1 to ch3 has Black's
  queen off d8 by move 3, say, and that no chapter's Black moves include 2...Nf6.
- [ ] **34.6 Extend the course-scoping test**: the Caro-Kann, the Najdorf and the
  Scandinavian agree that White plays 1.e4 and disagree on Black's reply three ways.
- [ ] **34.7 Export the bundle** and confirm the round trip picked it up.
- [ ] **34.8 The count of courses in prose**: grep `seven courses` and `7 courses` across
  SPEC.md, `help-text.ts` and `docs/` and correct every one describing the present.
- [ ] **34.9 The version becomes 1.8.0.** Eight built-in courses.
- [ ] **34.10 Prove it in the browser build**: eight tiles in two rows of four, the new
  tile with its tagline, Study opens ch0 and names every line, Drill takes a learnt line,
  Play starts as Black with the engine's 1.e4 out of the book, and Play the other side
  has the engine answer 1.e4 with 1...d5. Clear the storage afterwards. The packaged build
  is the orchestrator's.

## Hazards

- **Do not touch the other seven courses' content.** The gate rebuilds their 344 line ids
  and expects every one unchanged.
- **A Black course flips every "you"**: read every note as Black before committing it.
- **Copied mistake entries drift**: phase 31 proved it. The one-grade rule in the suite is
  the guard; run it after every chapter.
- **Nick's progress file is live**; never report his data folders from your own `ls`.
- **Do not run `tauri build` or `tauri dev`.** If another server holds 5175, drive against
  it and say so.
- **`npx tsc -b`**, and say you ran it.
- **No em dashes anywhere**, including JSON notes, PGN prose and line names. Australian
  English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first. **Commit before you
  stop**: the orchestrator builds from the working tree.

## Out of scope

2...Nf6 and the gambits, 3...Qa5 beyond ch0's sentence unless the decision rule chose
it, any change to the other seven courses, any change to the app beyond the version and
the prose counts, any change to the checkers, a packaged build.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc or the code: stop that
item, record it, continue with the rest. If the engine says a ruled line is unsound at
2500 ms, fix the line and record the finding. If the machine is busy when the
verdict-strength passes are due, stop and say so.

## Conventions and finish

Commit style follows the log. Land the content in two or three commits, then the tests,
the bundle, the prose counts and the version bump separately. Tick PLAN.md phase 34 boxes
as you go. **The review gate box belongs to the orchestrator: leave it.** The open items
list every engine finding kept and why, every fork taken with its one-sentence reason,
the queen square taken, and whether the 2500 ms passes ran clean or wait for a quiet
window.

Acceptance: the course meets the section 3 bar with names on every leaf, weights on
White's replies only and at least ten mistake entries in every chapter from ch1 to ch6;
all four checkers run and recorded with conditions; Black's concessions measured; the
bundle round-trips; the scoping test covers the three Black answers to 1.e4; the prose
counts say eight; version 1.8.0; the other seven courses untouched with 344 line ids
intact; vitest green and `tsc -b` clean; the tree committed and clean.
