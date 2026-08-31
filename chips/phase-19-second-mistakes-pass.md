# Chip: phase 19 - the second mistakes pass, at verdict strength

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 3, 4 and 6 (the register entry named below), PLAN.md phase 19 and
the gate 18 findings above it, and `scripts/engine-mistakes.mjs` before starting.

This phase changes no chess and adds no content. It settles a question: **are the graded
alternatives in all six courses right?** A wrong grade teaches a wrong lesson exactly as
effectively as a wrong repertoire move, which is why that checker exists.

## Why this phase exists, and the one decision already taken

Review gate 18 found two alternatives in the Vienna graded `playable` that cost about a
pawn, one of them 1.35, where the phase's own last two runs of the mistake checker had
reported **zero**. Every earlier note in this project treats a short engine run as
something that INVENTS findings. That was the first proof it can also MISS them.

So the register entry in SPEC section 6 asked for a pass over the five older courses. It
was run at the gate at 900 ms and found exactly one real fault, the London's `3.e4`. What
the register still carries is the **second** pass, because one run proves little. This
phase is that pass.

**The decision already taken: run it ONCE at 2500 ms, not twice at 900 ms.** 2500 ms is
already this project's arbiter - every re-check at every gate has used it, and a finding
at that movetime is treated as settled without further argument. So a 2500 ms pass
reports findings that need no re-check, and its silence is as strong a statement as this
project has ever asked for. Two more 900 ms passes would widen the pile of borderline
noise and still leave every finding needing the same 2500 ms look.

**Run the Vienna too**, not only the five older courses. It has had one 900 ms pass and
two of its grades were changed at the gate on the strength of it, so it is the course
with the least settled grades in the catalogue, not the most.

## The work

- [ ] **19.1 Run the pass, one course at a time, in the background.**
  `node scripts/engine-mistakes.mjs courses/<id> 2500` for each of the six.
  **Sequentially, and with nothing else heavy running.** See the first hazard: movetime
  is wall clock, so anything else using the CPU silently turns a 2500 ms verdict into a
  shallower one, and you would not be able to tell from the output.
  Sizes, from the 900 ms runs, so you can plan: Slav 278 positions, London 281,
  Caro-Kann 182, Ruy 158, Colle 132, Vienna 179. **1210 positions**, so expect somewhere
  around an hour and a half of wall clock for the set. Start it early and do the reading
  in 19.2 while it runs.
- [ ] **19.2 Compare against the first pass, do not start fresh.** PLAN.md's gate 18
  finding 22 records what 900 ms found: Slav 0, Colle 0, Caro-Kann 3, Ruy 1, London 15,
  and of those nineteen exactly ONE was on the "graded too kindly" side. Report three
  groups: findings in both passes, findings only the first pass saw, and **findings only
  this pass sees**. That third group is the interesting one - it is more evidence about
  the sampler, and every entry in it is a fault that survived a run.
- [ ] **19.3 The "graded too kindly" side holds the real faults. Fix them.** An
  alternative graded more gently than it deserves tells a trainee a bad move is fine.
  Change the grade to the band the number lands in, and rewrite the note so it says what
  the move actually costs. Two worked examples from gate 18, both worth reading before
  you start: the Vienna's `4.Bc4` went from playable to inaccuracy because it takes White
  from +0.71 to -0.25, and the London's `3.e4` went the same way because `3...Nxe4`
  simply takes an unguarded pawn while the note called it "a real try".
- [ ] **19.4 The "graded too harshly" side: do NOT change the grade. Read the note.**
  This side is the known noise class, and it is a limitation of the band model rather
  than a content fault: the London's whole teaching is positional, so a move graded a
  mistake because it shuts the bishop in is one the engine scores at 0.03 and is still
  correctly graded. Bands cannot express that and are not being asked to.
  What the finding IS good for is as a pointer. For each one, read the note and check the
  REASON it gives is true on the board. A grade can be right while its reason is wrong,
  which is the class gate 10 found and no checker sees. Fix wrong reasons, keep the
  grades, and say in the record how many you read and how many you changed.
- [ ] **19.5 `note-claims.mjs` over all six**, which is fast and needs no engine time, plus
  the by-hand read it cannot do. Read the counts and not just the verdict: "0 with a
  material claim and a move sequence to check it" means the checker did no work, not that
  the course is clean. The by-hand read is the entries a CAPTURE answers - work from the
  board to the prose, not the other way round.
  **Lead with the working line when you rewrite a note.** The checker takes the first
  move sequence a note names and measures that one, so a note that opens with the line
  that fails reads as a false claim. Gate 18 wrote one that way and the checker said so.
- [ ] **19.6 The boundary, and it is not negotiable: touch `mistakes` entries only.**
  A line id is `<course>/<chapter>:<san moves>` and it is written into the trainee's
  progress file, so changing a `san` on a line PATH silently unlearns every line through
  it. Graded alternatives are not on any path and not in any card key, so changing their
  grade, their note or their SAN is safe. Changing a repertoire move is not, and is out
  of scope here in any case - see the escalation rule.
- [ ] **19.7 Re-export and version.** Any content change means
  `node scripts/export-bundles.mjs`, because the suite holds `docs/bundles/*.pgn` to the
  writer's current output and content without its bundle is a red commit. If anything
  changed, take the version to **1.6.1** in `package.json`, `src-tauri/tauri.conf.json`
  and `src-tauri/Cargo.toml` - `src/version.test.ts` holds the three together, and this
  is the first use of Nick's patch digit, which is exactly what a corrections release is.
  If NOTHING changed, leave the version alone and say so.
- [ ] **19.8 Record what the pass settles and what it does not.** The register entry in
  SPEC section 6 is this phase's to close or to narrow. Closing it honestly means saying
  which courses had two passes with what result. If the second pass finds nothing new
  anywhere, say that plainly - it is a real result and the most likely one.

## Hazards

- **Movetime is WALL CLOCK, so CPU contention silently weakens the pass.** `go movetime
  2500` searches for 2500 ms of real time, not for a fixed number of nodes, and the
  engine runs with `Threads 1`. Anything else on the machine takes nodes away from it,
  and the output looks identical. So run the six courses one after another, never in
  parallel, and do not run `engine-ask.mjs`, a build, a test suite or a dev server beside
  them. If you must measure something mid-sweep, wait. This hazard was found at gate 18,
  where measurements were taken beside a running sweep; nothing there turned out wrong,
  because the numbers agreed with independently measured ones, but nothing guaranteed it.
- **A grade change is safe; a line change is not.** See 19.6. If you find yourself editing
  a `san` outside a `mistakes` array, stop.
- **The engine is a floor, not a chooser** (SPEC section 8, ruled at gate 18). Where two
  moves both leave the student clearly better, the section 3 fork rule governs and a
  threshold does not overrule it. That ruling is about repertoire moves, and it applies
  here in one way: do not "fix" a grade by changing what the course plays.
- **Nick's progress file is live** at `%APPDATA%\Repertoire Trainer\progress.json`, and a
  session's view of the filesystem OUTSIDE this repo can be a stale overlay. **Never
  report his data folders from your own `ls`.** Nothing in this phase should go near
  them: it is a content phase and needs no packaged run.
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every content change - the
  bundle round trip and the check-marker test both cover this work.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`, written with
  `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
- **`$TMPDIR` is empty in the Bash tool here**; use your session's own scratchpad path.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

`engine-pass.mjs` over the student moves. It has the same sampler problem and deserves
the same treatment, but it is roughly three times the positions and it is a different
question, so it is its own phase. If this pass makes the case for it, say so in the
record and let Nick rule.

Also out: any new content, any change to a repertoire move, any change to the checkers
themselves, anything in the app, and a packaged build.

A valid follow-up in a file you already have open: do it now, as its own commit. One
needing a ruling: the SPEC section 6 register, with what it is, why it was not taken, and
what would make it worth taking.

## Escalation

On any contradiction between this chip, SPEC.md and the code: stop that item, record it,
continue with the rest. **If the pass suggests a REPERTOIRE move is wrong, record it and
change nothing** - that is an `engine-pass` question, it is out of scope here, and the
line id it would change is in the trainee's progress file. If a grade sits genuinely on a
band edge after a 2500 ms measurement, say which way you went and why, rather than
picking silently.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the ACTUAL model. Land the grade fixes, the note fixes and the version bump as separate
commits. Tick PLAN.md phase 19 boxes as you go. **The review gate box belongs to the
orchestrator: leave it.**

Acceptance: all six courses passed at 2500 ms with the results recorded per course and
compared against the 900 ms run; every "graded too kindly" finding fixed in grade and in
note; every "graded too harshly" finding read for a false reason and the count recorded;
`note-claims.mjs` run over all six with its counts, not just its verdict; bundles
re-exported and the version at 1.6.1 if anything changed; the register entry closed or
narrowed with what two passes now say; vitest green and `tsc -b` clean.
