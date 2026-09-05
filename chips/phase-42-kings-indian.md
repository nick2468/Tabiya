# Chip: phase 42 - the King's Indian Defence, a tenth course

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 3, 4, 8 and 10, PLAN.md phases 34, 35 and 41, `docs/content-schema.md`,
`docs/authoring-a-course.md`, `docs/engine-runs/accepted.md`, the Najdorf course folder
(`courses/najdorf-black/`) as the model of a Black course, and **`courses/london-white/ch3-kings-indian.json`**,
which is what White plays against this defence in Nick's own London course. **After phase
41 is committed.**

Nick commissioned the King's Indian on 2026-09-05 as his fifth Black course and his second
answer to 1.d4: the counterpunching partner to the solid Slav, the same pairing the Najdorf
makes with the Caro-Kann. It also fills a real gap: the same setup answers 1.c4 and 1.Nf3,
which no course covers today. A tenth course means version 1.10.0.

## The rulings, settled before any drafting

- **The King's Indian Defence**: 1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6, and the same four
  Black moves against every other White setup, so the trainee learns one shape. The course
  id is `kings-indian-black`, permanent. Title: "The King's Indian Defence". Colour black.
- **The fork rule governs the Classical.** After 5.Nf3 O-O 6.Be2 e5 7.O-O the theory's
  heaviest line is 7...Nc6 8.d5 Ne7 (the Mar del Plata race), which is a memorisation
  contest. Decision rule: take **7...Na6** (the Glek line) unless the engine at 2500 ms and
  the chapter both come out better for 7...Nbd7 or 7...exd4; say in ch1 and the open
  items which you took and why; 7...Nc6 is rejected in one sentence.
- **Seven chapters**, the house shape:
  0. **The defence and its idea** (300-500 words): the fianchetto and the delayed centre,
     the ...e5 lever and what it asks of White, the two pawn structures (the closed centre
     after d5 with play on the wings, and the open centre after ...exd4), piece homes, the
     contrast with the Slav (solid, decides the centre early) and the promise that one
     setup answers 1.d4, 1.c4 and 1.Nf3.
  1. **The Classical: 5.Nf3 O-O 6.Be2 e5.** 7.O-O and the chosen seventh move; also 7.d5,
     7.dxe5 (the Exchange, drawn out for White and Black must know the endgame shape), and
     7.Be3. Highest drill weight.
  2. **The Sämisch: 5.f3.** One answer (5...O-O 6.Be3 and ...c5 or ...Nc6 by the fork rule),
     the plans against White's pawn wall.
  3. **The Fianchetto: 3.g3 and the 1.Nf3 and 1.c4 move orders that reach it.** 3...Bg7
     4.Bg2 O-O 5.Nf3 d6 6.O-O Nbd7 (or ...Nc6, one choice) and ...e5; this chapter is where
     1.c4 and 1.Nf3 are shown to arrive at the same house.
  4. **The Four Pawns, the Averbakh and the h3 systems**: 5.f4, 5.Be2 O-O 6.Bg5, 5.h3 and
     6.Bd3, one recipe each.
  5. **White does not play c4 and e4: the London, the Colle, the Trompowsky (2.Bg5), the
     Torre (2.Nf3 and 3.Bg5), 2.Nf3 with 3.e3.** One recipe each with the same four Black
     moves. **Read `london-white/ch3-kings-indian.json` first**: Nick's own London course
     says what White plays here, and this chapter's Black moves should be answers to
     THAT, and where the London course does not list the move this chapter plays as a
     Black reply, record it in the open items as a possible gap in the London (do not edit
     the London).
  6. **Typical tactics and plans**: the ...f5 break, ...Nh5 and ...Nf4, the ...exd4 and
     ...Nxe4 tricks, the g-file and the ...Bh6 exchange of the dark bishop when it is right,
     and two defensive exercises against White's queenside pawn storm and the c5 break. **At
     least ten authored mistake entries in ch6**, and the one-grade rule holds.

## The work

- [ ] **42.1** is done: the variation, the id, the fork rule and the chapters.
- [ ] **42.2 Draft the seven chapters** to the SPEC.md section 3 bar, student BLACK: a note
  on every move, a plan and a NAME on every leaf, the typical-mistakes section in each
  intro, at least ten authored mistake entries in each of ch1 to ch6 and on ch0's core
  decisions, weights on WHITE's replies, tags from the core set plus `tagExtensions`. Depth
  10-12 on main branches, 6-8 on the rest. Read every note as Black before committing it.
- [ ] **42.3 Run the suite after every chapter.**
- [ ] **42.4 The checkers after the LAST content edit**, outputs under
  `docs/engine-runs/phase-42/` with conditions: `engine-pass.mjs` at 500 ms twice with
  re-checks at 2500 ms, then **at 2500 ms once over the whole course**; `engine-mistakes.mjs`
  at 2500 ms once with a confirming run if it moves anything; `note-claims.mjs`;
  `note-lines.mjs` with zero HARD findings. One engine, quiet machine, conditions recorded,
  wait rather than run noisy. The King's Indian concedes the centre on purpose and its main
  lines measure +0.3 to +0.7 for White at 2500 ms: a flagged BLACK repertoire move is KEPT
  if the position after it is no worse than about +0.6 for White AND it is the theory move,
  judged by its cost against the engine's best rather than its absolute number; record
  every kept number.
- [ ] **42.5 The course's block in `content.test.ts`**, with two claims about THIS course:
  that every repertoire chapter has Black's bishop on g7 by move 4, and that no chapter
  plays 7...Nc6 in the Classical.
- [ ] **42.6 Extend the course-scoping test**: the Slav and the King's Indian agree that
  White plays 1.d4 and disagree on Black's first move; and the King's Indian is the only
  course that answers 1.c4 and 1.Nf3, stated rather than assumed.
- [ ] **42.7 Export the bundle** and confirm the round trip picked it up.
- [ ] **42.8 The count of courses in prose**: `nine courses`, `9 courses`, corrected to ten.
- [ ] **42.9 The version becomes 1.10.0.** Ten built-in courses: the second digit is 10.
  `src/version.test.ts` must accept a two-digit minor; if it pins a shape, fix the test with
  its reason.
- [ ] **42.10 Prove it in the browser build at 1400x980**: ten tiles as two rows of five;
  Study opens ch0 and names every line; Play as Black with the engine's 1.d4 out of the
  book; Play the other side with the engine answering 1.d4 with 1...Nf6 and 2.c4 with
  2...g6. Clear the storage afterwards. The packaged build is the orchestrator's.

## Hazards

- **Do not touch the other nine courses' content**, the London's ch3 included. The gate
  rebuilds their line ids and expects every one unchanged.
- **A Black course flips every "you".**
- **Copied mistake entries drift**; the one-grade rule is the guard.
- **Nick's progress file is live**; never report his data folders from your own `ls`.
- **No `tauri build` or `tauri dev`.** **Commit before you stop.**
- **`npx tsc -b`**, and say you ran it.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

The Mar del Plata beyond ch1's sentence unless the decision rule chose it, the Grünfeld,
the Benoni, any change to the other nine courses (London gaps are recorded, not fixed), any
change to the app beyond the version and the prose counts, any change to the checkers, a
packaged build.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc or the code: stop that
item, record it, continue with the rest. If the engine says a ruled line is unsound at
2500 ms, fix the line and record the finding. If the machine stays busy, wait.

## Conventions and finish

Commit style follows the log. Content in two or three commits, then the tests, the bundle,
the prose counts and the version bump separately. Tick PLAN.md phase 42 boxes as you go.
**The review gate box belongs to the orchestrator: leave it.** The open items list every
engine finding kept and why, every fork taken with its sentence, the seventh move taken in
the Classical, the London gaps found, and the conditions the 2500 ms passes ran under.
**Then stop and report: the orchestrator reviews phases 40 to 42 and packages 1.10.0.**

Acceptance: the course meets the section 3 bar with names on every leaf, weights on White's
replies only and at least ten mistake entries in every chapter from ch1 to ch6; the
checkers run and recorded with conditions, including the 2500 ms pass over the whole
course; the bundle round-trips; the scoping test covers the two 1.d4 Black courses and the
flank openings; the prose counts say ten; version 1.10.0; the other nine courses untouched
with their line ids intact; vitest green and `tsc -b` clean; the tree committed and clean.
