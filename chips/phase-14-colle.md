# Chip: phase 14 - the Colle-Zukertort

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 3, 4, 10 and 11, PLAN.md phase 14, `docs/content-schema.md` and
`docs/authoring-a-course.md` before starting.

**Prerequisite: phase 13 must be landed before this phase starts.** Phase 13 adds a
required `name` on every leaf and the `[%line ...]` bundle token, and this course is
born with named lines. If `git log` shows no phase 13 commits, stop and say so.

## The rulings, settled 2026-08-30 before any drafting

- **The Colle-Zukertort**: 1.d4 d5 2.Nf3 Nf6 3.e3, with **b3 and Bb2** instead of the
  c3 triangle. Nick chose it over the Colle-Koltanowski deliberately: he already plays
  the London, so the c3 triangle would duplicate a structure he knows, and the b2
  bishop supporting the Ne5/f4 attack is a genuinely second structure to learn.
- **The known hole is covered in-course**: against the ...g6 fianchetto setups the
  Bd3/e4 plan misfires, and the course teaches the standard answer (b3, Bb2, c4 and a
  solid centre, close to a Queen's Indian shape) rather than pointing at the London.
  The course stands alone, and its prose says honestly that this is the system's least
  comfortable ground.
- **This is Nick's second White course against 1...d5, and the course says so.** The
  point is depth: understanding the Zukertort against the London teaches both. ch0
  contrasts them directly - same quiet spirit, opposite decision about the queenside
  bishop.
- **Seven chapters**, in the shape the other courses use:
  0. The Zukertort and its idea (concept chapter, intro 300-500 words): d4, Nf3, e3,
     Bd3, b3, Bb2, Nbd2, O-O, then Ne5 and f4. Contrast with the London up front.
  1. The main line: ...d5, ...e6 and ...c5 - the classical ground, and the full
     Ne5 / f4 / Rf3-lift attack
  2. Black gets the bishop out first: ...Bf5 and ...Bg4 before ...e6
  3. Black mirrors: ...b6 and ...Bb7, the Queen's Indian-style defence, and ...Bd6
     setups that contest e5
  4. The ...g6 setups: King's Indian and Grunfeld shapes, with c4 and the solid centre
  5. Everything else: early ...c5 without ...d5, the Dutch, symmetric tries, move
     orders that dodge the system
  6. Typical tactics and plans - the exercises. The Greek gift Bxh7+ is THE Colle
     tactic and belongs here, engine-verified in each specific position it is shown in.
- **The course id is `colle-zukertort`, and it is permanent**, because it is written
  into every line id and card key in the progress file.

## The work

- [ ] **14.1** is already done: the variation, the ...g6 policy and the chapter list
  are ruled above.
- [ ] **14.2 Draft the seven chapters** to the SPEC.md section 3 bar, student White:
  a note on every move, a plan AND A NAME on every leaf (names unique per chapter,
  under 40 characters, named by what makes the line different from its siblings),
  the typical-mistakes section in each intro, mistake entries on at least ten
  positions in each repertoire chapter, weights on Black's replies, tags from the
  core set plus what the manifest declares. The course lives in
  `courses/colle-zukertort/` as a folder of JSON, like the other four. Draft as PGN
  and import if you prefer - the guide held at phase 12; either way the repo holds
  the folder and the bundle is exported from it.
- [ ] **14.3 All THREE checkers, after the LAST content edit**:
  - `node scripts/engine-pass.mjs courses/colle-zukertort 500`
  - `node scripts/engine-mistakes.mjs courses/colle-zukertort 500`
  - `node scripts/note-claims.mjs courses/colle-zukertort`
  Re-check each finding at 2500 ms with `engine-ask.mjs` before changing anything.
  **The 500 ms passes are SAMPLERS** (gate 12's lesson): a borderline entry can be
  flagged by one run and not another, so run each pass twice, or re-check anything
  within 0.3 of a band edge at 2500 ms. Then the by-hand read of the entries a
  capture answers, which is the class no checker sees.
  **The Greek gift needs special honesty**: Bxh7+ is only sound in positions meeting
  its conditions, and an engine will punish a speculative one. Every position the
  course shows it in must survive `engine-ask.mjs` at 2500 ms; where the sacrifice is
  NOT sound, that is a teaching moment the course states, not a line to quietly cut.
- [ ] **14.4 The course's block in `src/content/content.test.ts`** (the Ruy's is the
  model, including the line-name assertions phase 13 adds), and the bundle exported
  via `node scripts/export-bundles.mjs` - the suite holds `docs/bundles/*.pgn` to the
  writer's current output, and the round-trip test picks the course up automatically;
  confirm it does.
- [ ] **14.5 Prove it in the packaged app**: the course appears in the catalog, and
  Study (with the phase 13 screen), Drill and Play work in it. Delete every fixture
  afterwards.

## Hazards

- **Nick's progress file is sacred.** `%APPDATA%\com.nick.london-trainer\progress.json`.
  Copy to scratch and record its SHA256 before any packaged-app run; restore and
  verify after. Delete every AppData fixture.
- **Do not touch the other four courses.** Their content is settled and swept.
- **`tauri build` runs the frontend build at its START**; confirm a change shipped by
  searching `dist/assets/*.js` for its own string. Cargo needs
  `$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"` first.
- **The packaged window is inspectable**: `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"`
  plus `node scripts/packaged-eval.mjs "<expression>"`. The board still needs a human.
- **The browser pane must be FRONTED to drive the board**; resize to a real size,
  `window.__cg.redrawAll()`, and check `__cg.state.dom.bounds()` before trusting a drag.
- **`npx tsc -b`**, and say you ran it.
- **No em dashes anywhere**, including JSON, PGN prose and line names. Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`, written with
  `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
- **`$TMPDIR` is empty in the Bash tool here**; use the absolute scratchpad path.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

The Colle-Koltanowski beyond ch0's contrast, any change to the other courses, any
change to the app or the import/export machinery, a puzzle-built exercise set, and
signing. A valid follow-up in a file you already have open: do it now, as its own
commit. One needing a ruling: the SPEC section 6 register, with why it was not taken.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc or the code: stop
that item, record it in the open items, continue with the rest. If the engine says a
ruled line is unsound, fix the line and record the finding - never change a ruling.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer
naming the ACTUAL model. Land the content, the test block and the bundle as separate
commits. Tick PLAN.md phase 14 boxes as you go. **The review gate box belongs to the
orchestrator: leave it.** Open items list every engine finding kept and why.

Acceptance: the course meets the section 3 bar (names included) with all three
checkers recorded; it round-trips through its own bundle at
`docs/bundles/colle-zukertort.pgn`; it works in the packaged app and every fixture is
removed; the other four courses are untouched; vitest green and `tsc -b` clean;
Nick's progress file unchanged and hash-verified.
