# Chip: phase 35 - what the second pass found

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read `docs/engine-runs/second-pass/README.md` (the triage) and the four course files it
names, SPEC.md section 8 (the floor ruling and the straddle ruling), and
`docs/engine-runs/accepted.md`, before starting.

The orchestrator ran `engine-pass.mjs` at 2500 ms over all eight courses on 2026-09-05 in
an idle window. Twenty-five reports; the triage settles twenty-one. Four remain, and Nick
ruled "fix it" on the one that changes a line id. **Content only, four small changes, then
version 1.8.1.**

## The work

- [ ] **35.1 The Scandinavian's Nge2 line takes the pawn.** `ch2-other-fourth-moves.json`,
  the line `Nge2 Nf6 d4 c6 Bf4 Qd8 Ng3 e6 Bd3 Be7 O-O` where the course answers `O-O`
  (+0.83 for White at 2500 ms). The engine's `9...Qxd4` is +0.31 with `10.Nce4 Nxe4
  11.Nxe4 O-O 12.Re1` behind it. Ruling: the line takes the pawn. Rewrite from `9...Qxd4`
  with notes (the pawn is free because the knight went to g3 and nothing else guards d4;
  White gets activity for it and Black castles next; the plan from the leaf), keep the
  line's name honest to what it now shows, and give the old `9...O-O` a `mistake`
  alternative entry saying it walks past a free pawn. Check the position is reached by
  no other chapter (the one-grade rule will say). **This changes one line id**, which Nick
  has accepted; say the old and new id in the commit.
- [ ] **35.2 The Caro-Kann lists the pawn grab.** `ch1-main-line.json`, the `5...Bxe4`
  node after `5.Bd3` (line `e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Bd3`). Add `Qxd4` as a
  `playable` alternative: it takes a pawn at -0.21 against +0.16 for the course move, the
  queen is then chased by `6.Nf3` and comes home, and the course prefers the simple
  recapture. The course move does not change. The one-grade rule applies if another
  chapter reaches the position.
- [ ] **35.3 Two notes, no grade or move change.** Najdorf `ch1-bg5.json`, the `8...Qc7`
  node after `8.Qe2`: one clause in the note that `8...b5` is the livelier try (-0.27
  against +0.26) and the course keeps the same shape as against 8.Qf3. Slav
  `ch5-no-c4.json`, the `4...Nc6` node after `4.c3`: the note says the engine slightly
  prefers `4...e6` and why the course develops the knight first. Neither move changes.
- [ ] **35.4 `accepted.md` gains the seventeen "floor holds" entries in one block**, by
  course, each with its number, so the next second pass reports nothing new on them. The
  Ruy and Vienna entries already there are not repeated.
- [ ] **35.5 The checkers, on what changed only.** `engine-ask.mjs` at 2500 ms on the new
  Scandinavian line's Black moves (each of them) and on the new `Qxd4` alternative;
  `engine-mistakes.mjs` at 2500 ms over `courses/scandinavian-black` and
  `courses/caro-kann-black` only; `note-claims.mjs` and `note-lines.mjs` over the four
  courses touched. Outputs under `docs/engine-runs/phase-35/` with conditions at the top.
  One engine at a time, machine quiet.
- [ ] **35.6 Bundles regenerated** for the four courses; `bundle.test.ts` holds them.
- [ ] **35.7 SPEC section 6**: the register entry for the engine-pass second pass is CLOSED
  at phase 35 with a pointer to the second-pass folder and this chip. Section 8: one
  paragraph logging that the second pass ran, what it found, and Nick's ruling on the
  line id.
- [ ] **35.8 Version 1.8.1** in the three files.
- [ ] **35.9 Suite green after every edit**, `tsc -b` clean, and the gate rebuilds the 378
  line ids expecting exactly one gone and one added, both in the Scandinavian.

## Hazards

- **Exactly one line id changes.** Anything else under `courses/` that moves is a fault.
- **Copied entries drift and the one-grade rule catches it**: run the suite after each
  course.
- **Nick's progress file is live**; never report his data folders from your own `ls`.
- **No `tauri build` or `tauri dev`.** **Commit before you stop**: the orchestrator builds
  from the working tree.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Any other move in any course. The seventeen floor findings beyond recording them. Any app
change. A packaged build.

## Conventions and finish

Commit style follows the log. Tick PLAN.md phase 35 boxes as you go. **The review gate
box belongs to the orchestrator: leave it.**

Acceptance: the Scandinavian line takes the pawn with the old move graded a mistake; the
Caro-Kann lists the grab as playable; the two notes; the seventeen entries in
`accepted.md`; checkers run on what changed with conditions recorded; four bundles
regenerated; the register entry closed and the ruling logged; version 1.8.1; exactly one
line id changed; vitest green and `tsc -b` clean; the tree committed and clean.
