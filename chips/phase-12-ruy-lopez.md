# Chip: phase 12 - the Ruy Lopez Exchange, delivered as a bundle

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 3, 4, 10 and 11, PLAN.md phase 12, `docs/content-schema.md` and
`docs/authoring-a-course.md` before starting.

**One step in this phase needs Nick, and it is the last one.** Everything up to and
including the exported bundle runs unattended. The final proof - importing that bundle
through the app's own file picker - goes through a native dialog that no session can
click, exactly like the installer. Do not block on it: finish everything else, record
it as owed in the open items, and say so plainly. Task 12.5 below says how far you can
get on your own.

## The rulings, settled 2026-08-30 before any drafting

- **The Ruy Lopez, Exchange Variation**: 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Bxc6 dxc6. The
  idea the whole course teaches is structural: White gives up the bishop pair and gets
  a healthy four-against-three kingside majority against Black's crippled queenside
  one, where the doubled c-pawns cannot easily make a passer. Say that in ch0 and keep
  returning to it.
- **5.O-O, Fischer's move**, over 5.d4 heading straight for the endgame and over
  5.Nc3. It keeps pieces on and real winning chances while carrying little theory.
- **Against the Berlin, 3...Nf6: 4.Bxc6 dxc6**, reaching the same structure, over
  4.d3 and 4.O-O. One structure to understand rather than two, which is the entire
  argument for choosing the Exchange.
- **Seven chapters**, organised by what the opponent does, in the shape the other
  three courses use:
  0. The Exchange and its idea (concept chapter, intro 300-500 words)
  1. `5...f6`, holding e5 - the most common club reply
  2. `5...Bg4`, pinning the knight
  3. `5...Qd6`, `5...Bd6` and `5...Ne7`, the flexible tries
  4. `4...bxc6`, the other recapture
  5. Black avoids `3...a6` - the Berlin and the other third moves
     (`3...Bc5`, `3...d6`, `3...f5`, `3...g6`, `3...Nge7`)
  6. Typical tactics and plans - the exercises
- **The course id is `ruy-lopez-exchange`, and it is permanent**, because it is
  written into every line id and card key in Nick's progress file. The illustrative
  snippet in `docs/course-bundles-concept.md` says `ruy-exchange`; that was an example,
  and this is the id.

Nick knows this makes him dangerous against 1...e5 rather than a complete 1.e4 player.
Do not widen the scope to the Sicilian, the French or anything else.

## The work

- [ ] **12.1** is already done: the chapter list and both forks are ruled above.
- [ ] **12.2 Draft the seven chapters** to the SPEC.md section 3 bar, student White:
  a note on every move, a plan on every leaf, the typical-mistakes section in each
  intro, mistake entries on at least ten positions in each repertoire chapter, weights
  on Black's replies, tags from the core set plus what the manifest declares. The
  course lives in `courses/ruy-lopez-exchange/` as a folder of JSON, like the other
  three, so the content suite and both engine passes cover it.
- [ ] **12.3 All THREE checkers, run after the LAST content edit** - the standing rule,
  and the timing is the part that matters (a pass is evidence only about the content
  that existed when it ran):
  - `node scripts/engine-pass.mjs courses/ruy-lopez-exchange 500` over your moves
  - `node scripts/engine-mistakes.mjs courses/ruy-lopez-exchange 500` over the graded
    alternatives
  - `node scripts/note-claims.mjs courses/ruy-lopez-exchange` over the material the
    notes claim
  Re-check each finding at 2500 ms with `engine-ask.mjs` before changing anything;
  findings around 0.5 to 0.7 at 500 ms are usually noise. Fix or record every one with
  its number. **Then read the entries a capture answers and check what their notes
  say** - gate 10 found a note explaining a capture positionally, which is the class
  all three checkers miss.
- [ ] **12.4 Add the course's block to `src/content/content.test.ts`**, using the
  Caro-Kann's and the Slav's as the model, and export the bundle to
  `docs/bundles/ruy-lopez-exchange.pgn`. The round-trip test added at phase 11 covers
  every bundled course automatically, so this course joins it without being told;
  confirm it does.
- [ ] **12.5 Prove the delivery as far as a session can.** The importer's file dialog
  needs a human, so: install the exported bundle by writing it into
  `%APPDATA%\com.nick.london-trainer\courses\` the way the importer would, restart the
  packaged app, and confirm the course appears in the catalog with "Added by you" and
  that Study, Drill and Play work in it. Then **delete the folder** so Nick's own
  import lands on a clean profile, and record in the open items that the one remaining
  step is his click.

## What the bundle format actually is, as built at phase 11

You do not need to design any of this; `docs/authoring-a-course.md` is the reference
and it is accurate. In short: a course is one PGN, chapters are games in course order,
course headers repeat on every game and must agree. `[CourseId]`, `[CourseTitle]`,
`[StudentColour]`, `[Tagline]`, `[FormatVersion]`, `[TagExtensions]`, `[ChapterId]`,
`[ChapterTitle]`, `[DefaultTags]`. The chapter intro is the comment before the first
move. Notes are `{comments}`; `[%tags]`, `[%weight]`, `[%plan]`, `[%variant]`, and
Lichess's `[%cal]` / `[%csl]` for shapes. Mistake grades are glyphs: `!?` playable,
`?!` inaccuracy, `?` mistake. A glyphed move takes no continuation - put the refutation
in the note. Prose may not contain `{`, `}` or `[%`.

**Chapter ids are validated as strictly as course ids** (lower case letters, numbers
and hyphens), because a chapter id becomes a filename when a bundle is installed. That
was a path-traversal hole found at gate 11. Name your chapters the way the other
courses do and you will never meet it.

If you would rather draft in PGN and import it than write JSON by hand, do - it is a
genuine test of the guide, and anything the guide gets wrong is worth an open item.
Either way the repo holds the course folder and the bundle is exported from it.

## Hazards

- **Nick's progress file is sacred.** `%APPDATA%\com.nick.london-trainer\progress.json`
  was destroyed once at phase 7 and he is using the app. Copy it to scratch and record
  its SHA256 before any packaged-app run; restore and verify after. Delete every
  fixture you put in the AppData `courses` folder - the catalog reads it at startup.
- **Do not touch the other three courses.** Their content is settled and swept.
- **`tauri build` runs the frontend build at its START**, so a rebuild proves nothing
  about an edit made while it was running. If you rebuild, confirm a change shipped by
  searching `dist/assets/*.js` for its own string, not by comparing timestamps. Cargo
  needs `$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"` first.
- **The packaged window is inspectable**: launch with
  `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"` and drive it
  with `node scripts/packaged-eval.mjs "<expression>"` (`@file` for anything with
  quotes or backslashes). The board still needs a human.
- **The browser pane must be FRONTED to drive the board**: a hidden pane reports zero
  bounds. Front the tab, resize to a real size, call `window.__cg.redrawAll()`, then
  check `__cg.state.dom.bounds()` returns a real rectangle before trusting a drag.
- **`npx tsc --noEmit` and `npx tsc -b` do not check the same files.** Run `tsc -b` and
  say which you ran.
- **No em dashes anywhere**, including JSON and PGN prose. Australian English.
- **PS 5.1 mangles commit messages**: write to a scratch file and `git commit -F`,
  written with `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`,
  because `Out-File` adds a BOM that leaks into the subject line.
- **`$TMPDIR` is empty in the Bash tool here** and resolves to the filesystem root. Use
  the absolute scratchpad path.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Any other opening, any change to the import and export machinery, any change to the
other three courses, a puzzle-built exercise set, and signing. A valid follow-up in a
file you already have open: do it now, as its own commit. One needing a ruling: the
SPEC section 6 register, with why it was not taken.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc or the code: stop that
item, record what contradicts what in the open items, and continue with the rest. If
the engine says a ruled line is unsound, fix the line and record the finding - do not
change the ruling yourself.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the ACTUAL model. Land the content, the test block and the bundle as separate commits.
Tick PLAN.md phase 12 boxes as you go. **The review gate box belongs to the
orchestrator: leave it.** Write your open items honestly, including every engine
finding you kept and why, and the fact that Nick's import click is still owed.

Acceptance: the course meets the section 3 bar with all three checkers recorded; it
round-trips through its own bundle; the bundle is at
`docs/bundles/ruy-lopez-exchange.pgn`; installing that bundle by hand produces a
working course in the packaged app, and the folder is removed afterwards; the other
three courses are untouched; vitest green and `tsc -b` clean; Nick's progress file
unchanged and hash-verified.
