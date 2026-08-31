# Chip: phase 18 - the Vienna Gambit, a sixth course

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 3, 4, 10 and 11, PLAN.md phase 18, `docs/content-schema.md` and
`docs/authoring-a-course.md` before starting.

This is a content phase with one small code tail: a sixth course means a version bump,
and a test already holds the version files together.

## The rulings, settled 2026-08-31 before any drafting

- **The Vienna Gambit**: 1.e4 e5 2.Nc3 Nf6 3.f4. Nick chose it over the two quiet
  Viennas (3.g3 and 3.Bc4) deliberately, and the reason is the same one that picked the
  Zukertort over the Koltanowski: he already owns the quiet, structural answer to
  1...e5, which is the Ruy Lopez Exchange. A second quiet answer would teach him a
  shape he has. A gambit teaches him a different kind of chess.
- **This is Nick's second White course against 1...e5, and the course says so.** ch0
  contrasts the two directly: same first move, opposite question. The Ruy Exchange asks
  "what is this structure worth in an endgame"; the Vienna Gambit asks "what is a pawn
  worth for the f-file and the centre". Say it plainly and once, in ch0, the way the
  Colle's ch0 contrasts the London.
- **The course id is `vienna-gambit`, and it is permanent.** It is written into every
  line id (`<course>/<chapter>:<san moves>`) and every card key (`<course>#<position>`)
  in the trainee's progress file. A shipped course id can never change.
- **Seven chapters**, the shape the other five use:
  0. **The gambit and its idea** (concept chapter, intro 300-500 words). Why 2.Nc3
     before f4: the knight guards e4, which is exactly what the f-pawn stops doing.
     What the pawn buys - the half-open f-file, the pawn on e5 as a wedge, and a big
     centre with d4 to come. Piece homes: Nc3, f4, Nf3, Bc4 or Bd3, d4, O-O, and the
     rook already on the file it wants. The contrast with the Ruy Exchange.
  1. **The main line: 3...d5.** The correct answer and the course's centre of gravity:
     4.fxe5 Nxe4 5.Nf3 and the whole complex. Highest drill weight. This is the chapter
     that has to be known cold, because it is the one a prepared opponent plays.
  2. **The gambit accepted: 3...exf4.** 4.e5 with tempo on the f6 knight is the point of
     having the pawn on e4 in the first place. Show why the natural recaptures and
     retreats cost Black time.
  3. **Third moves that decline**: 3...d6, 3...Bc5, 3...Nc6, 3...Bb4. What each one
     concedes, and White's one recipe against each.
  4. **2...Nc6: the other move order.** The move that reaches the gambit's least
     comfortable version. See the policy below.
  5. **Everything else at move two**: 2...Bc5, 2...d6, 2...d5, 2...f5, 2...Bb4. One safe
     recipe each.
  6. **Typical tactics and plans** - the exercises. The f-file battery, the e5 wedge,
     Nd5 and Qh5 ideas, Bxf7+ where it works, and the ...Nxe4 tricks from both sides.
     Tree nodes are exercise positions where the expected move is the thematic blow.

## The 2...Nc6 policy, and why it needs one

`3.f4 exf4 4.Nf3 g5` is a King's Gambit with Nc3 already played, and the sound White
tries there (5.d4 g4 6.Bc4 gxf3 7.O-O and relatives) are a memorisation contest, not a
structure. SPEC section 3's fork rule applies: where two repertoire choices are both
sound, take the one needing less memorisation and note the rejected one in a sentence.

**Recommended:** meet 2...Nc6 with **3.Bc4**, and play f4 next when Black plays ...Nf6
anyway, so the course reaches its own main ground by a different door. Then 3...Bc5,
3...Nf6 and 3...Na5 each need a recipe.

This is a recommendation, not a ruling. Take a different branch if the engine and the
chapter both come out better for it - but then say in the chapter and in the open items
what you took and what the evidence was. What is NOT open: chapter 4 must give a
complete answer to 2...Nc6, and the answer must not be "see chapter 1".

## The work

- [ ] **18.1** is already done: the variation, the chapter list and the 2...Nc6 policy
  are ruled or given a decision rule above.
- [ ] **18.2 Draft the seven chapters** to the SPEC.md section 3 bar, student White:
  a note of 1-3 plain sentences on every move (the idea for White's moves, what Black is
  doing for Black's), a plan AND A NAME on every leaf (names unique per chapter, under
  40 characters, named by what makes the line different from its siblings), the
  typical-mistakes section in each intro, authored mistake entries on at least ten
  positions in each of ch1-ch6 and on ch0's core setup decisions, weights on Black's
  replies, tags from the core set plus whatever `tagExtensions` declares.
  The course lives in `courses/vienna-gambit/` as a folder of JSON like the other five:
  `course.json` with `id`, `title`, `colour`, `tagline`, `formatVersion`, `chapters` and
  `tagExtensions`, and one file per chapter with `id`, `title`, `intro`, `stem`, `tree`
  and `defaultTags`. Nothing registers it: `src/content/index.ts:17` globs
  `courses/*/course.json`, so the folder IS the registration.
- [ ] **18.3 Be honest where the gambit is only equal.** This course differs from the
  other five in one way that matters: it teaches a move that gives something away on
  purpose. A chapter that oversells it is worse than no chapter. Where best play leaves
  White equal rather than better, the note says so and says what White got for the pawn.
  Where a line is genuinely only playable against a human, say that too.
- [ ] **18.4 All THREE checkers, after the LAST content edit**:
  - `node scripts/engine-pass.mjs courses/vienna-gambit 500`
  - `node scripts/engine-mistakes.mjs courses/vienna-gambit 500`
  - `node scripts/note-claims.mjs courses/vienna-gambit`
  **The 500 ms passes are SAMPLERS, and here more than anywhere.** Gate 12 measured
  seven runs over one unchanged course and got 4, 3, 2, 0, 1, 4 and 0 findings. Sharp
  positions are noisier than quiet ones, and this whole course is sharp. So run each
  pass twice, and re-check every finding at 2500 ms with `engine-ask.mjs` before
  changing anything.
  **The grading rule for a gambit, which is new.** `engine-pass.mjs` reports any student
  move that costs 0.5 pawns or more against the engine's own preference at the same
  movetime. The gambit's entry moves - 3.f4 and the recaptures that follow it - will be
  flagged, and that is the checker working, not failing: the pawn IS a concession, made
  knowingly. So:
  - A flagged move that is part of the ruled gambit is KEPT if, at 2500 ms, the position
    after it is no worse than about -0.3 for White. Record the number. That floor is
    deliberately generous, because the main lines here are close to level; a gambit that
    measures worse than that is not sound enough to teach, and the fix is the line, not
    the note.
  - Any OTHER student move that still costs 0.5 or more at 2500 ms is a real fault. Fix
    the line.
  - `note-claims.mjs` found 0 parseable claims in 77 Colle entries at gate 14, because
    that course's prose used an idiom it does not read. If it reports nothing here,
    that is a finding about the checker and this course's prose, not a clean bill:
    say so, and do the by-hand read of the entries a capture answers, which is the class
    no checker sees.
- [ ] **18.5 Run a checker over every course that already shipped**, once, and record
  what it found. The standing rule: a new or changed checker is run over the whole
  catalog, not only the new course. Nothing here changes a checker, so this is one pass
  of `engine-pass.mjs` at 500 ms over the other five as a regression read. Findings on
  the other five are RECORDED, not fixed, unless one is plainly wrong - their content is
  settled and swept, and a fix there belongs in its own commit with its own evidence.
- [ ] **18.6 The course's block in `src/content/content.test.ts`.** The Colle's block at
  line 451 is the model, including the line-name assertions. Add one claim that is
  really about THIS course rather than the format - that f4 is played in every
  repertoire chapter, say, or that no chapter reaches a position with White's f-pawn
  still on f2 past the opening moves. Pick something the course would fail if somebody
  quietly turned it into a quiet Vienna.
- [ ] **18.7 Extend the course-scoping test.** The test at
  `src/content/content.test.ts:579` proves two White courses answer a shared position
  differently, using the London and the Colle after 1.d4 d5 2.e3. The Vienna gives that
  test a second and cleaner instance: the Ruy Lopez Exchange and the Vienna are both
  White courses whose chapter trees start from the initial position, so they AGREE on
  1.e4 and DISAGREE after 1...e5 - 2.Nf3 against 2.Nc3. Add it. Verify the shared and
  disagreeing sets are non-empty rather than assuming they are.
- [ ] **18.8 Export the bundle**: `node scripts/export-bundles.mjs` writes
  `docs/bundles/vienna-gambit.pgn`. `src/model/bundle.test.ts:241` globs that folder, so
  the round-trip test picks the new course up on its own - confirm it did, rather than
  assuming.
- [ ] **18.9 The version becomes 1.6.0.** Nick's rule: the second digit is the number of
  built-in courses, and this makes six. Three files carry it - `package.json`,
  `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` - and `src/version.test.ts` holds
  all three to each other and to what the app displays, so a partial bump fails the
  suite. `src-tauri/Cargo.lock` carries it too and is updated by a build, not by hand.
- [ ] **18.10 Prove it in the packaged app**: the course appears in the catalog, the
  header reads v1.6.0, and Study, Drill and Play all work inside it. Delete every
  fixture afterwards.

## Hazards

- **Nick's progress file is live, and this session cannot see his folders honestly.**
  It is `%APPDATA%\Repertoire Trainer\progress.json` now - phase 15 moved it off the
  identifier folder, so anything in this repo's older notes naming
  `com.nick.london-trainer` is stale. A session's view of the filesystem OUTSIDE this
  repo can be a stale overlay: Nick's own `cmd.exe` listed 23 directories in
  `%APPDATA%` where an agent's tools listed 26. **Never report his data folders from
  your own `ls`, and never state their contents as fact.** Verify through the app's own
  screens, and ask him to run the command for anything about his real files. Work
  against fixtures you created, with fake names that cannot collide with a real record,
  and delete them afterwards.
- **Do not touch the other five courses' content.** It is settled and swept. 18.5 reads
  them; it does not edit them.
- **A gambit will fight the checkers.** See 18.4. The failure mode to avoid is quietly
  softening a ruled line until the checker goes green - that turns the Vienna Gambit
  into a worse quiet Vienna. If the engine says a ruled line is unsound, fix the line
  and record the finding; never change a ruling.
- **`tauri build` runs the frontend build at its START**, so a rebuild proves nothing
  about an edit made while it was running. Confirm a change shipped by searching
  `dist/assets/*.js` for its own string. Cargo needs
  `$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"` first.
- **Do not run `tauri dev`.** Verify against the packaged build. If you genuinely need a
  Vite server it is 5175 with `--strictPort`, in `package.json`, `vite.config.ts` and
  `devUrl` alike; 5173 and 5174 belong to Nick's other projects.
- **`packaged-eval.mjs` connects to whatever answers the port**, so check the page title
  before believing a probe. Phase 16 got another project's page back on 9333. The
  packaged window is inspectable with
  `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"` plus
  `node scripts/packaged-eval.mjs "<expression>"`, and `--shot <file.png>` photographs
  it. The board still needs a human for moves.
- **The browser pane must be FRONTED to drive the board**; resize to a real size,
  `window.__cg.redrawAll()`, and check `__cg.state.dom.bounds()` before trusting a drag.
- **`npx tsc -b`**, and say you ran it.
- **No em dashes anywhere**, including JSON notes, PGN prose and line names. Australian
  English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`, written with
  `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
- **`$TMPDIR` is empty in the Bash tool here**; use your session's own scratchpad path.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

The quiet Viennas beyond ch0's one-sentence note on what was rejected. Any change to the
other five courses' content. Any change to the app, the import and export machinery, the
uninstaller hook or the checkers themselves. A puzzle-built exercise set. Signing.

A valid follow-up in a file you already have open: do it now, as its own commit. One
needing a ruling: the SPEC section 6 register, with what it is, why it was not taken,
and what would make it worth taking.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc or the code: stop that
item, record it in the open items, continue with the rest. If the engine says a ruled
line is unsound, fix the line and record the finding - never change a ruling. If the
2...Nc6 policy cannot be made to work, take the branch that can and say what the
evidence was.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the ACTUAL model. Land the content, the tests, the bundle and the version bump as
separate commits. Tick PLAN.md phase 18 boxes as you go. **The review gate box belongs
to the orchestrator: leave it.** The open items list every engine finding kept and why,
the 2...Nc6 branch actually taken, and what 18.5 found in the other five.

Acceptance: the course meets the section 3 bar with names on every leaf, all three
checkers run and recorded with the 2500 ms re-checks; the gambit's concessions measured
rather than asserted; it round-trips through `docs/bundles/vienna-gambit.pgn`; the
scoping test covers the Ruy against the Vienna; the version reads 1.6.0 in all three
files; it works in the packaged app and every fixture is removed; the other five courses
are untouched; vitest green and `tsc -b` clean.
