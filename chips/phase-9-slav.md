# Chip: phase 9 - the Slav, a Black answer to 1.d4

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 3, 4 and 10 and PLAN.md phase 9 before starting;
`docs/content-schema.md` is normative for content. This chip compresses the context,
but those documents rule wherever it is thinner than they are.

**This phase runs unattended, start to finish.** Nick settled the opening, the chapter
list and the main-line fork on 2026-08-29, and they are recorded in PLAN.md phase 9.
Nothing here needs a ruling from him. That is deliberate: phase 8 had to stop and wait
for a chapter list, and this chip exists so phase 9 does not.

## The rulings you are building to

- **The Slav**, 1.d4 d5 2.c4 c6. Chosen because it puts Black's pawns on c6 and d5,
  which is the Caro-Kann structure one file across, and it obeys the same rule the
  whole Black repertoire runs on: **the light-squared bishop comes out before ...e6.**
  Say this explicitly in ch0. A trainee who already knows the Caro-Kann is learning a
  dialect here, not a language, and the course should lean on that at every turn.
- **Against the main line 3.Nf3 Nf6 4.Nc3: 4...dxc4 5.a4 Bf5.** Ruled over the a6
  Chebanenko (lower theory, but vaguer plans) and the Semi-Slav 4...e6 (locks in the
  c8 bishop, which is the one thing this repertoire exists to avoid). If the engine
  pass says something in this line is unsound, fix the line - do not change the
  ruling; record the finding and, if it is serious enough to threaten the fork,
  record that as an open item for the gate rather than choosing a different fourth
  move yourself.
- **Seven chapters**, listed as tasks 9.2 to 9.8 in PLAN.md. Follow that list.

## What exists, verified at gate 8

The app is Repertoire Trainer (Tauri 2 + React 19 + TS, vitest at 337 green, `tsc -b`
clean). Two courses ship: `courses/london-white/` and `courses/caro-kann-black/`.
Adding a third is content plus one test block - **no source change registers a
course**, because `src/content/index.ts` picks up `courses/*/course.json` through
Vite's `import.meta.glob`.

- A course folder holds `course.json` plus its chapter files. The manifest carries
  `id`, `title`, `colour` (the student's), `tagline`, `formatVersion` (1), `chapters`
  (filenames in course order - every file in the folder must be listed and every
  listed file must exist), and optional `tagExtensions`.
- **The course id is permanent once shipped**: it is written into every line id
  (`<course>/<chapter>:<moves>`) and card key (`<course>#<position>`) in Nick's
  progress file. Use `slav-black`. Kebab case only.
- Chapter files: `{ id, title, intro, stem, tree }`, SAN trees, ply parity gives the
  colour (White when `stem.length + depth` is even). The course's colour decides which
  side is the STUDENT. Here the student is Black: stems start with White's move,
  `variant` / `tags` / `mistakes` sit on Black's moves, frequency `weight`s (1-10) sit
  on White's, `note` is required on every move, `plan` on every leaf.
- Tags: the core set (`development`, `king-safety`, `bishop-placement`, `e4-break`,
  `c4-break`, `kingside-attack`, `dark-squares`, `h-file`, `tactics`, `endgame`) plus
  what your manifest declares, and nothing else. The Caro-Kann's precedent for naming
  opponent setups is the `vs-` convention (`vs-advance`, `vs-exchange`, ...); expect to
  declare something like `vs-exchange-slav`, `vs-quiet`, `vs-london`, `light-squares`,
  `c5-break`. Do not touch the core set. **`light-squares` and `c5-break` are already
  declared by the Caro-Kann** - a course declares its own; sharing a name is fine and
  intended, since the Progress view compares courses by exactly these strings.
- `src/content/content.test.ts` applies the generic bar to every bundled course
  automatically. Add a `describe('the Slav course')` block with the numeric bar, using
  the Caro-Kann's block as the model: seven chapters, colour black; ch0 intro 300-500
  words with mistakes on 4+ positions; ch1-ch5 deepest line to move 10+, mistakes on
  10+ positions, every White reply weighted 1-10, every Black move tagged; ch6 at
  least four exercises, all ending on the student's move, deepest line to move 10+.
  **Do not weaken the generic bar to fit.**

## Two things worth building well

**Chapter 5 is the interesting one.** White without c4 - the London, Colle and Torre -
is very common at club level, and Nick plays the London himself. Write that chapter as
his own repertoire seen from the other side: what White is trying to do, and where the
setup is least comfortable to face. You have `courses/london-white/` in the repo to
read for exactly what White intends. Do not contradict it; if you find something in
the London course that this chapter shows to be wrong, that is a finding worth an open
item, not a quiet edit to the other course.

**Chapter 3, the Exchange Slav, has to earn its place.** After 3.cxd5 cxd5 the position
is symmetrical and most books shrug. Give the trainee something to do: the plan, the
piece placement, and where the winning attempts actually come from. A chapter that
says "this is equal" teaches nothing.

## The engine pass - the standing rule

`node scripts/engine-pass.mjs courses/slav-black 500` walks every student move and
reports anything costing half a pawn or more; `node scripts/engine-ask.mjs "<moves>"
2500` says what the engine would have played instead. Scores are flipped into White's
point of view, so **a Black move that gives something away makes the number go up.**

Three things gate 8 established about it, all of which apply to you:

1. **Run it after your LAST content edit.** A pass is evidence only about the content
   that existed when it ran. Phase 8's worst blunder was authored after its chapter had
   been passed, so nothing ever looked at it - and the pass scores that position at
   3.97 when actually run over it. Re-run after every fix round until it is quiet.
2. **Findings between about 0.5 and 0.7 at 500 ms are usually noise.** Re-check at
   2500 ms before changing anything; two of phase 8's survivors were level in absolute
   terms and were rightly kept.
3. **The pass judges the student's moves only.** It never evaluates a position where
   White chooses, so it cannot object to a White move no club player would play, and
   half of phase 8's findings were really that. Read every finding by asking which side
   is at fault, and sanity-check your weights by hand against what club players
   actually do.

Fix or record every finding with its number. A finding kept deliberately is recorded
with why, in the open items - that is the format both previous courses used.

## Hazards (each cost a real incident)

- **Nick's progress file is sacred.** `%APPDATA%\com.nick.london-trainer\progress.json`
  was destroyed once in phase 7. Before ANY packaged-app run, copy it to scratch and
  record its SHA256; afterwards restore anything you changed and verify the hash.
  Delete every fixture you drop into the AppData `courses` folder. He is now using the
  app for real, so that file has content worth more than it did a week ago.
- **The packaged window is inspectable**: launch with
  `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"` and drive it
  with `node scripts/packaged-eval.mjs "<expression>"` (`@file` for anything with
  quotes or backslashes). It reads and clicks everything except the board.
- **The browser pane must be FRONTED to drive the board.** A hidden pane reports zero
  bounds and every click lands nowhere. Front the tab, `resize_window` to a real size,
  call `window.__cg.redrawAll()`, then check `__cg.state.dom.bounds()` returns a real
  rectangle before trusting a drag. Screenshot coordinates are scaled from CSS pixels -
  compute from the screenshot, not from `getBoundingClientRect`.
- **`npx tsc --noEmit` and `npx tsc -b` do not check the same files.** Run `tsc -b`
  and say which one you ran.
- **No em dashes anywhere**, including JSON prose (the suite enforces it in content).
  Australian English.
- **PS 5.1 mangles commit messages**: write to a scratch file and `git commit -F`.
  `Out-File` adds a BOM that leaks into the subject line - write with
  `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
- Dev server from the repo root only. Stage explicit paths, never `git add -A`,
  `git status` first.

## Out of scope

Any change to the London or Caro-Kann content (the acceptance requires both
untouched), PGN or own-game import, a puzzle-built exercise set, engine-checking the
opponent's moves, installer signing, and the classical London move order. A valid
follow-up in code you already have open: do it now, as its own commit. One needing a
ruling or belonging elsewhere: record it in SPEC.md's section 6 register with why it
was not taken.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc or the code: stop that
item, record what contradicts what in the open items, and continue with the rest. Do
not resolve a contradiction by guessing.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer
naming the ACTUAL model. Content lands as its own commits, separate from any code
fix. Tick PLAN.md phase 9 boxes as you go and write your open items honestly - what
you did NOT do is as valuable as what you did. **The review gate box belongs to the
orchestrator: leave it.** Finish with the full suite green, `npx tsc -b` clean, and
everything committed on main. Do not push.

Acceptance: the course meets the section 3 bar with the engine pass recorded
(movetime, findings, dispositions); Study, Drill and Play work end to end; the London
and the Caro-Kann are untouched; vitest green; the packaged app shows three courses
and Nick's progress file is unchanged, hash-verified.
