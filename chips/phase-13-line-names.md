# Chip: phase 13 - named lines, and the Study screen rebuilt around them

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 3, 4, 10 and 11, `docs/content-schema.md`, `docs/authoring-a-course.md`
and `src/ui/Study.tsx` before starting.

This phase came out of Nick using the app for the first time. He opened the London,
landed on the Study screen and could not tell what the three checkboxes were for or how
to step through a line. Everything below is his design, settled over four rounds on
2026-08-30 against a working prototype.

**It is a big phase and it has clean stopping points.** Do the tasks in order. Each one
lands green on its own, so if you run long, stop after a finished task rather than
leaving a half-built screen.

## What is wrong today, stated once

`src/ui/Study.tsx` puts "Lines in this chapter" at the very bottom of the page, below
the whole chapter narrative. That list is the only thing that creates a drill card, and
nothing on the screen says so. Its rows are labelled with move strings: all seven lines
of the London's chapter 1 begin `2...e6 3.e3 Nf6 4.Nf3`, so the move that tells them
apart is buried mid-string. Above it sits a second, lonely "I have learnt this line"
checkbox that marks whichever line you are standing in, and is disabled until you reach
the end of one.

## The rulings, settled 2026-08-30

- **Every line gets a NAME.** "Black trades on g3", not `2...e6 3.e3 Nf6 4.Nf3 Bd6 5.Bg3
  Bxg3 6.hxg3 O-O 7.Bd3 c5 8.c3 Nc6 9.Nbd2`. This is the change the rest depends on.
- **The lone "I have learnt this line" checkbox is retired.** The per-line boxes do the
  job, once the table can show which line you are standing in.
- **The Study screen, top to bottom, in this order:**
  1. Chapter title and the one-line lead, as today
  2. Column 1: the board, with Start / Back / Forward under it
  3. Column 2: mostly as today - the moves played, the "Continue with" choices, the
     move note and the leaf plan - plus **Play a game from here**
  4. **A table of named lines**: name, the line's move list, a learnt checkbox, with
     **Auto step this line** on the right of its header
  5. The chapter text, scrolling in its own panel
- **Taking a branch moves the highlight.** Play a move that leaves the highlighted line
  and the highlight follows you to the line you are now in.
- **Clicking a row is a restart on that line.** The board goes back to the top of the
  chapter and that row becomes the chosen one, wherever you were. Nick ruled this
  against a version that kept the shared prefix: that one saved a few clicks and cost a
  rule nobody could predict from looking at the screen.
- **Two buttons, two names.** They used to both say "play" a screen apart, and one of
  them starts a game against the engine. **Auto step this line** walks the highlighted
  line forward. **Play a game from here** hands the position to Play mode.

**The working prototype of all of it** is at
https://claude.ai/code/artifact/31434baa-b2ef-44b9-8fa8-192b67fb0b60 - the real London
chapter 1, all 52 nodes and 7 lines, with every behaviour above. Where this chip and the
prototype disagree, this chip wins; where the chip is silent, copy the prototype.

## The work

- [ ] **13.1 A line name in the schema.** A `name` field on LEAF nodes, beside `plan`,
  which is also leaf-only and also required. Rules for the validator, in its own style
  (collect, never throw):
  - Required on every leaf. A leaf without one is an error naming the chapter and the move.
  - **Unique within its chapter.** Two rows reading the same thing is the bug this
    replaces, not a new one.
  - At most 40 characters, so it fits the table column without wrapping.
  - May not contain `]`, for the same reason `plan` may not: the PGN token ends at one.
  - Rejected on a non-leaf, like `plan` is.
  Update `docs/content-schema.md`: the node example, the field-rules table, and the
  leaf paragraph. `Line` in `src/model/lines.ts` gains `name`, read from the leaf.
  **This changes no identity.** A line id is its moves (`lineId`, `src/model/lines.ts:31`)
  and a card key is course plus position, so naming lines cannot touch a single key in
  Nick's progress file. Say so in the commit; it is the reason this is safe to do at all.

- [ ] **13.2 The name in the bundle format.** The token is **`[%line The Nh5 trade]`**,
  parsed in `applyToken` (`src/model/bundle.ts:342`) beside `plan` and `variant`, and
  written in the same place `plan` is (`src/model/bundle.ts:513`). Then:
  - SPEC.md section 11's mapping table gains a row: `| Line name (on the leaf) | [%line The Nh5 trade] |`.
  - `docs/authoring-a-course.md` explains it where it explains `[%plan]`, and its worked
    example shows one, quoted from the exported file as the rest of that section is.
  - The round-trip test already covers every bundled course, so it will catch a name
    that does not survive export and re-import. Confirm it does rather than assuming.
  A course whose leaves have names must survive its own format. That is the phase 11
  rule and it is why this task comes before the content.

- [ ] **13.3 Name all 183 lines.** London 41, Caro-Kann 53, Slav 48, Ruy Lopez 41.
  **This is the bulk of the phase and the part only a person can judge.** How to name:
  - **Name a line by what makes it different from its siblings**, which is almost always
    the opponent's choice at the branch: "Black trades on g3", "The modest ...Be7",
    "...c5 before the bishop".
  - **Not by the plan** ("Attack on the h-file") and **not by the chapter** - the chapter
    title is already on the screen above the table.
  - Two to six words. Australian English. No em dashes. It is read in a table, so it
    reads better as a noun phrase than a sentence.
  - The main line of a chapter says so: "The full main line, with ...b6".
  - Add a block to `src/content/content.test.ts`, beside the existing per-course blocks:
    every line has a name, names are unique within a chapter, none is over 40 characters.
  Re-export the bundles (`node scripts/export-bundles.mjs`) - the suite holds
  `docs/bundles/*.pgn` to the writer's current output, so a forgotten export is a red bar.

- [ ] **13.4 The Study screen.** Rebuild `src/ui/Study.tsx` and `src/ui/study.css` to the
  order above. The mechanics, which are the part worth getting exactly right:
  - **The highlighted row** is the one last chosen, for as long as every move played is
    still inside it. Step off it and it falls to the first line that does contain them.
    Hold the chosen line in state; derive the fallback. The prototype's `contains` and
    `activeLine` are the shape of it.
  - **Clicking a row** clears the walked moves and makes that row the chosen one.
  - **Auto step this line** steps forward one move every 850 ms from wherever the board
    is, reads **Stop stepping** while it runs, stops at the end of the line, and is
    stopped by any manual interaction (Start, Back, Forward, an arrow key, a choice, a
    row click). It is disabled at the end of a line.
  - **Forward follows the CHOSEN line**, not `children[0]` as it does today
    (`src/ui/Study.tsx:86`). Otherwise Forward and Auto step disagree with each other,
    which is the kind of thing nobody reports and everybody notices.
  - **The move list doubles as a progress bar**: on the highlighted row, the moves already
    walked read in the accent colour and the rest stay quiet.
  - **The learnt count moves up** with the table: "2 of 7 learnt" in its header.
  - **Retire** the "I have learnt this line" checkbox, its hint and its `atLine` logic.
  - **Rename** "Play from here" to "Play a game from here".
  - The table scrolls sideways in its own container on a narrow window; the page body
    must not.
  Keep the existing keyboard stepping and the move trail's click-to-jump. Test what you
  can in `src/ui`'s existing style, and at minimum: the highlight rule, the row-click
  restart, Forward following the chosen line, and the learnt count.

- [ ] **13.5 Prove it against the packaged app.** Rebuild and check the screen in the
  real window: the table sits above the chapter text and below the board, Auto step
  walks a line, a branch moves the highlight, and a tick still produces drill cards.
  Nick's own click is not needed for any of this.

## Hazards

- **Nick's progress file is sacred.** `%APPDATA%\com.nick.london-trainer\progress.json`
  was destroyed once at phase 7 and he has two learnt lines in it. Copy it to scratch
  and record its SHA256 before any packaged-app run; restore and verify after. Delete
  every fixture you put in the AppData `courses` folder.
- **Content edits mean the checkers run again.** 13.3 adds prose, not moves, so the two
  engine passes have nothing new to judge - but `scripts/note-claims.mjs` reads prose,
  so run it over all four courses after the names land and record the result. If you
  edit a single move for any reason, all three run, after the last edit.
- **The 500 ms passes are SAMPLERS.** Gate 12's lesson: two entries in the Ruy sat on the
  band border and two runs of the same script disagreed about which one to report. If you
  do end up running them, re-check anything near a band edge at 2500 ms.
- **`tauri build` runs the frontend build at its START**, so a rebuild proves nothing
  about an edit made while it was running. Confirm a change shipped by searching
  `dist/assets/*.js` for its own string, not by comparing timestamps. Cargo needs
  `$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"` first.
- **The packaged window is inspectable**: launch with
  `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"` and drive it with
  `node scripts/packaged-eval.mjs "<expression>"` (`@file` for anything with quotes or
  backslashes). Only the board itself needs a human.
- **The browser pane must be FRONTED to drive the board**: a hidden pane reports zero
  bounds. Front the tab, resize to a real size, call `window.__cg.redrawAll()`, then check
  `__cg.state.dom.bounds()` returns a real rectangle before trusting a drag.
- **`npx tsc --noEmit` and `npx tsc -b` do not check the same files.** Run `tsc -b` and
  say which you ran.
- **No em dashes anywhere**, including JSON, PGN prose and line names. Australian English.
- **PS 5.1 mangles commit messages**: write to a scratch file and `git commit -F`, written
  with `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`,
  because `Out-File` adds a BOM that leaks into the subject line.
- **`$TMPDIR` is empty in the Bash tool here** and resolves to the filesystem root. Use the
  absolute scratchpad path.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Showing the line name in Drill or Progress (it becomes possible here and is worth doing
later - put it in the SPEC section 6 register with that reasoning). Any change to the
courses' moves, grades or notes. Any change to the import and export machinery beyond the
one new token. The Catalog, Play and Drill screens. A new course.

A valid follow-up in a file you already have open: do it now, as its own commit. One
needing a ruling: the register, with why it was not taken.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc and the code: stop that
item, record what contradicts what in the open items, and continue with the rest. If a
line genuinely resists a good name - two siblings that differ only in move order, say -
name them both honestly and record it rather than inventing a distinction that is not
there.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the ACTUAL model. Land the schema and format, the names, and the screen as separate
commits. Tick PLAN.md phase 13 boxes as you go. **The review gate box belongs to the
orchestrator: leave it.**

Acceptance: every line in all four courses has a unique, named, under-40-character name;
the name survives export and re-import through the bundle format; the Study screen matches
the order and mechanics above; the "I have learnt this line" checkbox is gone; both buttons
carry their new names; vitest green and `tsc -b` clean; `docs/bundles/*.pgn` re-exported
and current; Nick's progress file unchanged and hash-verified.
