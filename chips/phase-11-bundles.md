# Chip: phase 11 - course bundles, import and export

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read **SPEC.md section 11** (normative), `docs/course-bundles-concept.md` (the
reasoning), PLAN.md phase 11, and `docs/content-schema.md` before starting.

This phase runs unattended. Nick ruled the format, the re-import behaviour and the
proving course on 2026-08-30; nothing here needs him.

## What this is for

A course is currently a folder of JSON files. Phase 7 already loads such a folder
from `%APPDATA%\com.nick.london-trainer\courses\`, so installing a course without
reinstalling the app **already works manually**. What is missing is that a course is
not one artefact, there is no way to get one out, and no chess player could write
one: the JSON nests a single move thirty spaces deep.

The ruling: **a bundle is a PGN file.** Chess players already author trees of moves
with comments and alternatives, in tools that already export exactly that. The
authoring tool is Lichess or any chess GUI, and the only app-specific syntax is three
optional comment tokens.

## The one piece of real engineering

**Write the PGN parser. chess.js cannot be used for this and it fails silently.**
Verified at design time: `loadPgn` on a PGN containing `(3. e5 {The Advance.} Bf5)`
returns the mainline with the variation gone, no error and no warning. A repertoire
is a tree, so a parser that drops variations would delete most of a course without
saying so. Write your own: tokenise move numbers, SAN, `(`, `)`, `{...}` and glyphs,
then recursive descent. It is pure, it belongs in `src/model`, and it is very
testable. Cover a branch, a nested variation, a glyph, a comment carrying tokens, and
a malformed file, and assert the malformed one produces an error rather than partial
silence.

## The mapping, both ways (SPEC.md section 11 has the full table)

- Course identity in header tags: `[CourseId]`, `[CourseTitle]`, `[StudentColour]`,
  `[Tagline]`, `[FormatVersion]`, `[TagExtensions]`, repeated on every game so an
  extracted chapter still identifies its course. They must agree across games;
  disagreement is an error.
- `[ChapterId]` and `[ChapterTitle]` per game. Chapter order is game order.
- The comment before the first move is the chapter intro.
- A `{comment}` after a move is its note. Inside it, `[%tags a b]`, `[%weight 7]`,
  `[%plan ...]`, and Lichess's own `[%cal Gc1f4]` / `[%csl Gd4]` for the `shapes`
  field. Every token is optional and a PGN of bare moves and comments is a valid
  course.
- A variation whose first move carries a glyph is a **mistake entry**: `!?` playable,
  `?!` inaccuracy, `?` mistake. A variation with no glyph is a genuine alternative
  line. A glyphed move with a continuation is an error naming the fix - put the
  refutation in the comment, because the schema has nowhere to store it.
- A `{` or `}` inside prose is an error with a clear message, never a silent
  truncation.

## The work

1. **11.1 and 11.2, the parser and PGN to course.** Errors collected, never thrown on
   the first, in the same style as `src/model/loader.ts`. Feed the result through the
   existing `loadCourse` so a bundle gets exactly the validation a folder gets.
2. **11.3, course to PGN and the round trip.** Export every bundled course, parse it
   back, and assert the result equals the course. Make this a real test in the suite,
   because it is the only thing that keeps the reader and the writer in step, and it
   costs nothing to run. Expect it to find asymmetries: that is what it is for.
3. **11.4, import in the app.** File picker (copy the plumbing in `src/ui/backup.ts`,
   which already does exactly this for progress), validate, then compile into the
   AppData folder shape phase 7 loads. **Nothing is written when validation fails**,
   and every error is listed. The shadowing rules are already in `mergeCourses` and do
   not change.
4. **11.5, the re-import check.** Before overwriting an installed course, load the
   incoming one and count how many of the trainee's learnt line ids still resolve
   against it, then say so plainly - "replacing this keeps 7 of your 9 learnt lines" -
   and confirm or cancel. **Cancel writes nothing.** This is the check gate 10 relied
   on, moved in front of the trainee.
5. **11.6, export.** Any course in the catalog, built-in or added. Exporting the
   London and opening it in a chess GUI is a fair thing for a trainee to want.
6. **11.7, links as plain text.** `react-markdown` already blocks raw HTML, so a
   bundle cannot inject script, but a markdown link renders as an anchor and clicking
   one navigates the Tauri window itself. Render link text without the link in course
   prose, and test it.
7. **11.8, `docs/authoring-a-course.md`.** Written for a chess player who has never
   seen JSON. Build it in a study, one study chapter per course chapter, right-click
   an alternative to mark it `?`, the three optional tokens with one example each,
   what the app checks, what it refuses and why, and how to send it to somebody. Say
   plainly that a bundle is data and cannot run code, and that one should still be
   treated like any other downloaded file. The Ruy Lopez bundle becomes its worked
   example at phase 12, so leave a named gap for it rather than inventing one.

## Hazards

- **Nick's progress file is sacred.** `%APPDATA%\com.nick.london-trainer\progress.json`
  was destroyed once at phase 7 and he is using the app now. Copy it to scratch and
  record its SHA256 before any packaged-app run; restore and verify after. Delete
  every fixture you drop into the AppData `courses` folder - the catalog reads it at
  every start.
- **Import is the first feature that writes files the trainee chose.** Check the
  capability grants cover what you actually do: `$HOME/**` read and write already
  exist for progress backup, and the `courses` folder grants are literal paths, since
  phase 7 proved a wildcard there does not match what you expect.
- **The packaged window is inspectable**: launch with
  `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"` and drive it
  with `node scripts/packaged-eval.mjs "<expression>"` (`@file` for anything with
  quotes or backslashes). The board still needs a human.
- **The browser pane must be FRONTED to drive the board**: a hidden pane reports zero
  bounds. Front the tab, resize, `window.__cg.redrawAll()`, then check
  `__cg.state.dom.bounds()` before trusting a drag.
- **`npx tsc --noEmit` and `npx tsc -b` do not check the same files.** Run `tsc -b`
  and say which you ran.
- **No em dashes anywhere**, including JSON and PGN prose. Australian English.
- **PS 5.1 mangles commit messages**: write to a scratch file and `git commit -F`,
  written with `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`,
  because `Out-File` adds a BOM that leaks into the subject line.
- **`$TMPDIR` is empty in the Bash tool here** and resolves to the filesystem root.
  Use the absolute scratchpad path.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

The Ruy Lopez course itself (phase 12, chipped after this gate so it can describe the
format as built). Any registry, signing, rating or download mechanism - bundles are
files. Any change to the three existing courses' content. Any change to the catalog,
merge or shadowing rules, which already work. A valid follow-up in a file you have
open: do it now, as its own commit. One needing a ruling: the SPEC section 6 register.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc or the code: stop that
item, record what contradicts what in the open items, and continue with the rest. If
the round trip proves the format cannot express something the schema holds, that is a
finding for the gate, not a reason to change the schema quietly.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer
naming the ACTUAL model. Land the parser, the app wiring and the documentation as
separate commits. Tick PLAN.md phase 11 boxes as you go. **The review gate box belongs
to the orchestrator: leave it.** Write your open items honestly, including anything
the round trip could not preserve.

Acceptance (SPEC.md section 11 items 1 to 5): a PGN with variations, comments and
glyphs parses into a course and a course exports to a PGN that parses back identical;
import installs a course that appears in the catalog after a restart with no reinstall
and no source change; importing over an installed course reports how many learnt lines
survive and does nothing if cancelled; an invalid bundle is refused with its errors
listed and writes nothing; the documentation takes a chess player from a study to an
installed course. Plus vitest green, `tsc -b` clean, the installer rebuilt, and Nick's
progress file unchanged and hash-verified.
