# Chip: phase 8 - the Caro-Kann course

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
HEAD at spawn is `ba170ed` (review gate 7 passed). Read SPEC.md sections 3, 4 and 10
and PLAN.md phase 8 before starting; docs/content-schema.md is normative for content.
This chip compresses the context, but those documents rule where anything here is
thinner than they are.

**This session needs Nick at the very start.** Task 8.1 is agreeing the chapter list
with him BEFORE drafting anything. Propose the list (a starting point is below), get
his ruling, then build. Do not draft chapter content on a guessed list. After that
agreement the whole phase runs unattended.

## What exists

The app is Repertoire Trainer (Tauri 2 + React 19 + TS, vitest at 299 green). Phase 6
made everything below the UI course-shaped; phase 7 added the catalog. Concretely,
all verified at source at gate 7:

- A course is a folder under `courses/` with a `course.json` manifest: `id`, `title`,
  `colour` (the student's), `tagline`, `formatVersion` (currently 1), `chapters`
  (filenames in course order; every file in the folder must be listed), optional
  `tagExtensions`. Vite's `import.meta.glob` in `src/content/index.ts` picks a new
  folder up automatically - no source change to register a course.
- **The course id is permanent once shipped.** It is written into every line id
  (`<course>/<chapter>:<moves>`) and card key (`<course>#<position>`) in the progress
  file. Use `caro-kann-black`. Kebab case only; the validator refuses anything else.
- Chapter files are unchanged from v1: `{ id, title, intro, stem, tree }`, SAN trees,
  ply parity gives the colour (White when `stem.length + depth` is even). The course's
  colour decides which side is the STUDENT. For this course the student is Black:
  stems start with the opponent's (White's) move, `variant` / `tags` / `mistakes` sit
  on Black's moves, frequency `weight`s (1-10) sit on White's moves, `note` is
  required on every move, `plan` on every leaf.
- The board, drill, book, session and report already handle a Black course: boards
  face the student, `PlaySession.playOpponent()` opens the game when the engine moves
  first, the report scans the student's moves with White-POV evals sign-corrected.
  The test fixture `blackCourse()` in `src/test/fixtures.ts` proves all of it; you
  are adding content, not capability. If you do hit a baked-in White assumption
  anywhere, that is a phase 6/7 escape: fix it at the root with a test, as its own
  commit, and record it as an open item.
- Tags: a course may use the core set (`development`, `king-safety`,
  `bishop-placement`, `e4-break`, `c4-break`, `kingside-attack`, `dark-squares`,
  `h-file`, `tactics`, `endgame`) plus whatever `tagExtensions` its manifest
  declares, and nothing else. Declare Caro-specific tags (the `vs-` convention names
  opponent setups, e.g. `vs-advance`, `vs-exchange`, `vs-panov`); do not touch the
  core set.
- `src/content/content.test.ts` applies the generic quality bar to every bundled
  course automatically (notes, plans, tag vocabulary, no em dashes, no card
  conflicts, intro shape). The numeric bar is course-specific by design: the London
  has its own `describe` block, and this course brings its own. Write it with the
  numbers below - do not weaken the generic bar to fit.

## The work (PLAN.md phase 8 - tick boxes as you complete them)

1. **8.1 Course design, with Nick.** Propose a club-level Caro-Kann repertoire for
   Black against 1.e4 and adjust to his ruling. Starting proposal, mirroring the
   London's shape: ch0 the setup and its ideas (concept chapter, intro 300-500
   words); ch1 the main line (3.Nc3/Nd2 dxe4 4.Nxe4); ch2 the Advance (3.e5); ch3
   the Exchange (3.exd5); ch4 the Panov (3.exd5 cxd5 4.c4); ch5 sidelines and
   move-order tricks (Two Knights, the Fantasy 3.f3, 2.d3 setups, accelerated
   Panov); ch6 typical tactics and plans (exercise positions ending on the thematic
   Black blow). Seven chapters is a proposal, not a rule - the London's eight is not
   a quota.
2. **8.2 Draft the chapters** to SPEC.md section 3 depth (main lines to move 10-12,
   sidelines 6-8, club-improver prose, no engine variations in notes). Theory forks:
   where two sound choices exist, pick the one needing less memorisation and note
   the rejected one in a single sentence; a fork with real consequences you cannot
   judge goes to Open items and the simpler branch is taken.
3. **8.3 The engine pass over every student move** before the course is called done.
   This is a standing rule that exists because human review missed concrete tactics
   three times in v1 - your own chess prose is unverified until Stockfish has been
   over it. Method used in phases 4 and 5: evaluate before and after each STUDENT
   move at a fixed movetime (500 ms was the working figure; record what you use),
   flag losses, fix or record every finding. Evals arrive in pawns from White's
   point of view, so here a Black move that gives something away makes the number go
   UP - get the sign right before trusting a single verdict. Known blind spot,
   recorded at phase 5: the pass does not judge the opponent's replies or your
   weights, so also sanity-check that the White moves you weight highest are what
   club players actually play.
4. **8.4 Ship it bundled.** The suite green including your new course block; a test
   proving the London's and the Caro-Kann's card keys share no key (course scoping
   makes this structural - prove it anyway, the acceptance asks); Play driven live
   with the engine opening the game and the book steering White by weight; rebuild
   the exe and installer (`npm run tauri build` - cargo needs
   `$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"` first) and verify the
   packaged app shows both courses. The installer click-through stays Nick's.

Numeric bar for the course-specific test block, the London's bar student-relative:
concept chapter intro 300-500 words with mistakes on at least 4 positions; every
repertoire chapter runs its deepest line to move 10 or beyond, carries mistake
entries on at least 10 positions, weights every White reply 1-10, and tags every
Black move with at least one concept; the exercises chapter has at least 4 leaves,
all ending on the student's move, deepest line to move 10.

## Hazards (each cost a real incident - do not relearn them)

- **Nick's progress file is sacred.** `%APPDATA%\com.nick.london-trainer\progress.json`
  was destroyed once in phase 7 by a packaged run whose failed read saved a blank
  state. The store now refuses to save after a failed read, but the rule stands:
  before ANY packaged-app run, copy the file to scratch and record its SHA256; after
  your checks, restore anything you changed and verify the hash. Delete every test
  fixture you drop into the AppData `courses` folder. Never leave a run having
  changed his data.
- **The packaged window is inspectable**: launch with
  `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"` and drive it
  with `node scripts/packaged-eval.mjs "<expression>"` (`@file` for anything with
  quotes or backslashes). It reads and clicks everything except the board, which
  needs a trusted event and therefore a human.
- **A hidden browser pane** reports zero width and throttles React: call
  `resize_window` with a real size before board work, poll for DOM change rather
  than read once, and remember dev builds trust synthetic events while packaged
  builds ignore them by design.
- **No em dashes anywhere**, including JSON prose - the suite enforces it in content;
  hold docs to it by hand. Australian English in prose and UI copy.
- **PS 5.1 mangles commit messages**: write the message to a scratch file and
  `git commit -F`. `Out-File` writes a BOM that leaks into the subject line - write
  the file with `[IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding($false)))`.
- Run the dev server from the repo root only (`npm run dev`, or the `london-dev`
  launch config). Stage explicit paths; never `git add -A`; user WIP is inviolable
  (`git status` first).

## Out of scope

The classical London move order, PGN or own-game import, installer signing, the NSIS
hook that removes the old "London Trainer" entry, remembering the last-opened course,
and any change to the London course's content (the acceptance requires it untouched).
A valid follow-up in code you already have open: do it now as its own commit; a
follow-up needing a ruling or belonging elsewhere: record it in SPEC.md's section 6
register with why it was not taken.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc or the code: stop
work on that item, record what contradicts what as an open item, and continue with
the rest. Do not resolve a contradiction by guessing.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer
naming the ACTUAL model building (`Co-Authored-By: Claude Opus 5
<noreply@anthropic.com>` if that is what you are). Content lands as its own
commits, separate from any code fix. Tick PLAN.md phase 8 boxes as you complete
them and write your Open items honestly - the record of what you did NOT do is as
valuable as the ticks. The review gate box belongs to the orchestrator: leave it.
Finish with the full suite green (`npm test -- --run`), `npx tsc --noEmit` clean,
and everything committed on main. Do not push.

Acceptance (SPEC.md section 10 + PLAN.md): the course meets the quality bar with the
engine pass recorded (movetime, findings, dispositions); Study, Drill and Play work
end to end as Black; the London is untouched; vitest green; the packaged app shows
both courses with Nick's progress intact.
