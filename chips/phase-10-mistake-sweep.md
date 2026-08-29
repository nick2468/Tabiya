# Chip: phase 10 - the mistake-entry sweep of the London and the Caro-Kann

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 3 and 4, PLAN.md phase 10, and `docs/content-schema.md` before
starting. This phase runs unattended: every decision it needs is settled below.

## Why this phase exists

Phase 9 built `scripts/engine-mistakes.mjs`, a Stockfish pass over the authored
MISTAKE entries - the graded alternatives beside each repertoire move. Nothing had
ever checked those. It ran only on the Slav, correctly, because that chip scoped the
other courses out.

Review gate 9 ran it on the other two. It disagrees with **27 of the London's 190
entries and 12 of the Caro-Kann's 107**, against **0** for the Slav. Three Caro-Kann
faults were verified and fixed at the gate (commit `3e80b99`); the rest was too big
for a review and became this phase.

The loop lesson, which is the real reason this is worth doing: **a new checker is a
claim about every course, not just the one it ships with.**

## What was already fixed at gate 9 - do not redo

In `courses/caro-kann-black/`:

- `ch3-exchange`, two entries: `...Bf5` was graded **playable** in positions where
  `Bxf5` simply wins the bishop, because with no pawn on e6 and none on g6 nothing
  recaptures. Both regraded `mistake` with notes saying so.
- `ch2-advance`, one entry: `...Be4` was called a mistake "because 6.Nxe4 wins the
  bishop". It does not - `6...dxe4` takes back. The grade was right (the engine puts
  `...Be4` 1.26 behind `...Bg6`); the reason was invented. The note now names the
  doubled e-pawns and the lost light-squared bishop.

The third is the important precedent: **the grade was fair, so the mistake pass could
not see it.** Only reading the prose finds that class.

## The work

Start by re-running both passes yourself. Do not work from the numbers below: they
were measured at 500 ms and phase 9 open item 12 records that identical content
reports two to four different findings run to run. The numbers below are a map, not a
work list.

```
node scripts/engine-mistakes.mjs courses/london-white 500
node scripts/engine-mistakes.mjs courses/caro-kann-black 500
node scripts/engine-pass.mjs courses/london-white 500
node scripts/engine-pass.mjs courses/caro-kann-black 500
```

- [ ] 10.1 **The "graded too kindly" findings, which is where the real faults are.**
  13 in the London and 10 in the Caro-Kann at gate 9. Re-check each at 2500 ms with
  `scripts/engine-ask.mjs` before changing anything, then either regrade it, or leave
  it and record why. The largest London ones to expect: `ch2-c5-qb6` grading `Rb1`
  an inaccuracy at 5.68; `ch1-classical` grading `Bg5` an inaccuracy at 4.47;
  `ch3-kings-indian` grading `d5` an inaccuracy at 4.23; `ch6-everything-else`
  grading `Ne5` **playable** at 3.64. The Caro-Kann's largest: `ch0` and `ch1`
  grading `Qa5` an inaccuracy at 5.56, and `ch2-advance` grading `Qb6` playable at
  4.73. A `playable` grade on a move that loses material is the worst case in the
  set, because it tells the trainee the move is fine.
- [ ] 10.2 **The "graded too harshly" findings, which are mostly not faults.** 14 in
  the London, 2 in the Caro-Kann. Read them all and expect to change almost none. A
  system opening's mistake entries are positional judgements the engine scores at
  nothing: the London grades `1.d4 d5 2.e3` a mistake, it costs 0.06, and the grade is
  right for a course whose entire subject is getting the bishop out before the pawn.
  Record the count you kept and one line on why, rather than silently leaving them.
- [ ] 10.3 **The prose sweep, which has no checker.** A note can name a punishment
  that does not exist while the grade beside it is perfectly fair - the `...Be4` case
  above. Sweep every note in both courses that makes a concrete material claim
  (grep for `wins`, `loses`, `drops`, `hangs`, `a piece`, `a pawn`, `the exchange`)
  and verify each one by playing it out with chess.js. Phase 9 did this by hand for
  the Slav and it is how two of its three worst faults were found.
- [ ] 10.4 **Build the prose checker, if you can make it honest.** For a mistake entry
  the check is automatable: the wrong move is authored, so play it, play the sequence
  the note names, and see whether the material claim holds. Gate 9 prototyped this and
  hit two false-positive traps you should design around from the start. First, notes
  often name a MULTI-MOVE sequence ("9.Nxd5 Nxd5 10.Qxd5 wins a pawn") and a checker
  that plays only the first capture will report a loss that the next move recovers -
  parse and play the whole sequence. Second, when the alternative is ITSELF a capture
  ("...Bxc3", punished by "bxc3"), the material the alternative won must be counted or
  every trade reads as a blunder. If you cannot get the false-positive rate low enough
  to be useful, say so in the open items and leave 10.3's hand sweep as the method -
  a checker nobody trusts is worse than no checker.
- [ ] 10.5 Re-run both passes over both courses after the LAST edit (phase 8 open
  item 3: a pass is evidence only about the content that existed when it ran), and
  record the final numbers.

## The hazard that matters most: do not change a repertoire move

This sweep is about the mistake entries beside the repertoire moves - their grades
and their notes. **It is not a re-examination of the repertoire itself.**

The reason is Nick's progress file. A line id is `<course>/<chapter>:<san moves>`, so
changing any repertoire move rewrites the id of every line through it and orphans
whatever he has marked learnt. He currently has two learnt lines, and one of them runs
straight through a flagged position:

```
london-white/ch3-kings-indian:d4 Nf6 Bf4 g6 e3 Bg7 Nf3 O-O Be2 d6 h3 Nbd7 O-O Re8 c4 e5 dxe5 dxe5 Bh2
```

The 4.23 finding sits at exactly `... c4 e5 : dxe5 not d5` - the fault is the GRADE on
the alternative `d5`, and `dxe5` stays. Fix the grade, never the move.

If a finding genuinely shows a repertoire move is wrong, that is an escalation, not a
task: record it in the open items with its numbers and leave the move alone. The
review will put it to Nick, because it costs him a learnt line and he should know.

## Everything else out of scope

The Slav (0 findings - leave it alone), the opponent's moves and the frequency
weights, a puzzle-built exercise set, own-game or PGN import, and any UI or model
change. A valid follow-up in a file you already have open: do it now, as its own
commit. One needing a ruling: SPEC.md section 6 register with why it was not taken.

## Hazards

- **Nick's progress file is sacred.** `%APPDATA%\com.nick.london-trainer\progress.json`
  was destroyed once at phase 7. Copy it to scratch and record its SHA256 before any
  packaged-app run; restore and verify afterwards. He is using the app now, so it may
  hold more than it did.
- **Acceptance includes proving his learnt lines survive.** After the sweep, load the
  content and assert that both ids in his file still resolve to lines that exist. Do
  it on a COPY of the file, in a scratch test you delete afterwards - phase 6's
  review did exactly this and it is the check that catches an orphaned id, which
  otherwise looks fine in the file and shows nothing in Study.
- **The packaged window is inspectable**: launch with
  `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"` and drive it
  with `node scripts/packaged-eval.mjs "<expression>"` (`@file` for anything with
  quotes or backslashes).
- **The browser pane must be FRONTED to drive the board**: a hidden pane reports zero
  bounds. Front the tab, resize to a real size, call `window.__cg.redrawAll()`, and
  check `__cg.state.dom.bounds()` before trusting a drag.
- **`npx tsc --noEmit` and `npx tsc -b` do not check the same files.** Run `tsc -b`
  and say which you ran.
- **No em dashes anywhere**, including JSON prose. Australian English.
- **PS 5.1 mangles commit messages**: write to a scratch file and `git commit -F`,
  written with `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`
  because `Out-File` adds a BOM that leaks into the subject line.
- **`$TMPDIR` is empty in the Bash tool here** and resolves to the filesystem root.
  Use the absolute scratchpad path.
- Stage explicit paths, never `git add -A`, `git status` first.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc or the code: stop that
item, record what contradicts what in the open items, and continue with the rest. Do
not resolve a contradiction by guessing. A finding you cannot decide is a finding you
record with its numbers, not one you act on.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer
naming the ACTUAL model. Land the London and the Caro-Kann as separate commits so a
bisect can tell them apart, and any new checker as its own. Tick PLAN.md phase 10
boxes as you go. **The review gate box belongs to the orchestrator: leave it.** Write
your open items honestly, including the count of findings you read and deliberately
left - that number is the useful part of this phase's record.

Acceptance: both passes re-run over both courses after the last edit with their final
numbers recorded; every "graded too kindly" finding either fixed or recorded with its
2500 ms number and a reason; the prose sweep done and its method stated; no repertoire
move changed; Nick's two learnt line ids still resolve, proven on a copy of his real
file; the Slav untouched; vitest green and `tsc -b` clean.
