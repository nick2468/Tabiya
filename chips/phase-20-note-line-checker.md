# Chip: phase 20 - the note-line checker

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md section 6 (the register entry "A note can name a line that cannot be
played"), PLAN.md phase 20 and the gate 19 findings above it, and all of
`scripts/note-claims.mjs` before starting.

Build the fourth checker: the one that plays the lines the prose names and reports the
ones the board refuses. Then fix what it finds.

## Why this exists

`note-claims.mjs` plays a note's moves only when the note ALSO makes a material claim in
its vocabulary. Over the whole catalogue that reaches **40 of 797 mistake entries**, one
in twenty, so "0 unsupported claims" is a statement about five per cent of the prose. A
note that names a line and ends "and Black is better" is never played at all.

Phase 19 found four entries carrying a line that cannot be played, in two courses, by
hand and then with a scratch tool. Gate 19 found two more the phase had missed: the
Caro-Kann answered 6...e6 with "7.h5 Bh7" in two chapters, where **h7 is Black's own
pawn** - the note used the very point it was teaching as if it had already happened.
Both are fixed. A wrong line in a note is usually a line copied from a position that was
nearly the same, which is why this class survives careful review and needs a machine.

## Decisions already taken, so you are not guessing

- **A script first, a test second, and the test only for rules that reach zero.** The
  other three checkers are scripts because they need Stockfish. This one needs no engine
  and runs in milliseconds, so it belongs in the suite where it cannot be forgotten - but
  only for the rules that are provably clean. So: build `scripts/note-lines.mjs`
  reporting in graded categories, get its hard categories to **zero across all six
  courses**, and then move exactly those rules into `src/content/content.test.ts`, in the
  per-course `describe.each` block beside "never marks a move as check or mate unless it
  is". Categories that still need a human stay in the script and never fail the build.
- **Reuse the parser, do not write a second one.** `scripts/note-claims.mjs:97-124` has
  `SAN`, `TOKEN` and `sequenceIn`, which already solve the trap that a bare square in
  prose is indistinguishable from a pawn move: the run starts at the first NUMBERED move
  and ends where the prose resumes. Lift it into a shared module both scripts import
  rather than copying it. `claimOf` at `:83` has clause-scoped negation detection you
  will need for one of the false-positive classes below.
- **Place a sequence by its own move number and side, not by where the entry sits.** This
  is the single technique that makes the tool usable. Playing from the entry's position
  reports **36 lines across 3269 notes and every one is a false positive**. Rebuilding
  the stations of the line the note hangs off, and starting at the station whose move
  number and side match the note's first token, cuts that to **12 - and two of those
  twelve were real**. Keep the dots: `7.` is White, `7...` is Black.
- **What prose to read.** Mistake notes and node notes, both of which have a known
  position. **Chapter intros are a separate mode that reports and never fails**, because
  an intro has no anchor: the only way to place its sequences is to try every station of
  every line in the chapter and report only what plays nowhere. Phase 19 found an intro
  fault by hand, so the mode is worth having; whether it is trustworthy enough to promote
  is a judgement to make from what it reports, and to record either way.
- **Prefer a false negative to a false positive for anything that becomes a test.** A
  checker that cries wolf gets ignored, and this one has to survive years of new courses.
  Where a rule has to widen its search to stay quiet, widen it, and say in the script's
  output what it widened.

## The three rules, and each has already caught a real fault

- [ ] **20.1 Legality.** Every move in a named sequence must be playable from where the
  note places it.
- [ ] **20.2 The move number.** The first token's number and side must match the board
  the sequence starts from. This is the Vienna renumbering phase 19 fixed by hand.
- [ ] **20.3 Check and mate markers, in both directions.** A `+` or `#` in prose that the
  board does not give, or a check written without one. This is the `Qxc1+` that was mate.
  Same rule as the SAN test already in `content.test.ts`, applied to prose.

## The three false-positive classes you have to handle

Each is different and each needs its own answer. Do not solve them by loosening the
legality rule until everything passes.

- [ ] **20.4 The back-reference.** A note naming a move already played, or a move in
  another chapter's line: "The same position and the same answer as the 3...d6 line in
  chapter 3", and the Slav's bare "4.Nc3" on a line five plies long. Move-number
  placement already removes most of these. What is left is a sequence whose number
  matches nothing on this line, which the script should report as **unplaceable** rather
  than illegal - a different category, and not one the test fails on.
- [ ] **20.5 The deliberate illegality.** A note that names an illegal move in order to
  SAY it is illegal: the Slav's "The rook on h8 defends h2 down the file that ...hxg6
  opened, so 11.Kxh2 is not even legal." That note is correct and the checker calling it
  a fault is the checker agreeing with it. `claimOf`'s clause-scoped negation test is the
  model: look at the clause the move sits in, not the whole note.
- [ ] **20.6 The omitted recapture.** A note that skips an obvious reply: the Ruy's
  "10.Ne1 Qh4 is mate again", which assumes 10...hxg4 first. Three entries carry it. Try
  starting one ply later as well as at the matched station, and report what you widened.

## What the tool must reproduce, and what it must not

Gate 19's probe, with move-number placement, reports exactly ten lines. **Your tool
should find these, classified correctly.** Four are real faults for you to fix, six are
false positives for you to silence, and getting either group wrong is the finding.

Real, fix them:

1. `caro-kann-black/ch3-exchange`, alt `Bh5` after `... Nf3 Bg4 h3`: the note says
   "6.g4 Bg6 7.Ne5" where the board is at White's move 7. Misnumbered by one.
2. `slav-black/ch3-exchange`, alt `e5` after `... O-O O-O Rfc1`: the note says
   "11.dxe5 Nxe5 12.Nxe5 Qxe5" where the board is at White's move 13. Misnumbered by two.
3. `ruy-lopez-exchange/ch3-flexible`, the node note after `... Nxg6 fxg6`: the note writes
   `Qxh8` where the board says `Qxh8+`.
4. Whatever the intro mode finds, judged one at a time.

False positives, silence them without loosening 20.1:

5. and 6. `slav-black/ch2-quiet` and `ch6-tactics-and-plans`, the node note after
   `... Qc2 Bxh2+`: "11.Kxh2 is not even legal". Class 20.5.
7. `vienna-gambit/ch5-everything-else`, the node note after `... Nc6 d4`: "the 3...d6
   line in chapter 3". Class 20.4.
8. `slav-black/ch4-sidelines`, the node note after `d4 d5 c4 c6 Nf3`: bare "4.Nc3".
   Class 20.4.
9. 10. and 11. the three `ruy-lopez-exchange` `hxg4` entries in `ch2-bg4` twice and
   `ch6-tactics-and-plans`: "Ne1 Qh4". Class 20.6.

## The rest of the work

- [ ] **20.7 Fix what it finds**, in the notes, as its own commit separate from the tool.
  A misnumbered move is a small fault and a cheap fix; say what the board is at and write
  that. Do not change a grade unless the note's rewrite changes what the move is worth,
  and if it does, measure it at 2500 ms first and say the number.
- [ ] **20.8 Promote the clean rules into `content.test.ts`** and prove each fails on a
  restored fault rather than merely passing. That mutation check is how gates 18 and 19
  verified their tests and it is not optional here: a test that cannot fail is worse than
  no test, because it reads as coverage.
- [ ] **20.9 Run the other three checkers** over any course whose prose you touched, after
  your last content edit: `engine-pass.mjs`, `engine-mistakes.mjs` at 2500 ms, and
  `note-claims.mjs`. A rewritten note can change what `note-claims.mjs` parses - gate 18
  wrote one that led with the failing line and the checker called it a false claim.
- [ ] **20.10 Re-export and version.** `node scripts/export-bundles.mjs` after any content
  change. If anything changed, take the version to **1.6.2** in `package.json`,
  `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`; `src/version.test.ts` holds the
  three together.
- [ ] **20.11 Close the register entry** in SPEC section 6 with what the checker does and
  does not cover, including the intro mode's verdict. Say what a future course author has
  to keep true for it to keep working.

## Hazards

- **Touch prose only. Never a `san` on a line path.** A line id is
  `<course>/<chapter>:<san moves>` and it is written into the trainee's progress file, so
  changing a move on a path silently unlearns every line through it. Check it rather than
  assume it: rebuild the id set from `git show <ref>:courses/...` on both sides and diff
  them. There are **308** and there must still be 308, with none gone and none added.
- **Movetime is wall clock.** If 20.9 needs an engine run, run one course at a time with
  nothing else on the CPU. Anything else running takes nodes away and the output looks
  identical.
- **`note-claims.mjs` reads the FIRST sequence a note names**, so a rewrite that opens
  with the line that fails reads as a false claim. Lead with the line that works.
- **Nick's progress file is live** at `%APPDATA%\Repertoire Trainer\progress.json`, and a
  session's view of the filesystem OUTSIDE this repo can be a stale overlay. **Never
  report his data folders from your own `ls`.** This phase needs no packaged run.
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every content change.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`, written with
  `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
- **`$TMPDIR` is empty in the Bash tool here**; use your session's own scratchpad path.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Changing any repertoire move or any grade that the note rewrite does not force. New
content. The `engine-pass.mjs` second pass, which is its own register entry. Anything in
the app. A packaged build.

A valid follow-up in a file you already have open: do it now, as its own commit. One
needing a ruling: the SPEC section 6 register, with what it is, why it was not taken, and
what would make it worth taking.

## Escalation

On any contradiction between this chip, SPEC.md and the code: stop that item, record it,
continue with the rest. **If a rule cannot be made quiet without going blind, leave it in
the script and out of the test**, and say which rule and why - a reporting checker that a
person runs is a real deliverable, and a test that fails on good prose is a liability.
If the intro mode cannot be trusted, say so and leave it reporting only.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the ACTUAL model. Land the shared parser, the script, the content fixes, the test and the
version bump as separate commits. Tick PLAN.md phase 20 boxes as you go. **The review gate
box belongs to the orchestrator: leave it.**

Acceptance: `scripts/note-lines.mjs` exists, shares its parser with `note-claims.mjs`
rather than copying it, and classifies all ten known lines correctly; the intro mode runs
and its verdict is recorded; the real faults are fixed and the false positives are silent
without the legality rule being loosened; the clean rules are in `content.test.ts` and
each is proved to fail on a restored fault; the other three checkers re-run over any
course whose prose changed; bundles re-exported and the version at 1.6.2 if anything
changed; 308 line ids before and after; the register entry closed; vitest green and
`tsc -b` clean.
