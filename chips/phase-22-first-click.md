# Chip: phase 22 - a course is always selected, and every mode works from the first click

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 8 and 10, PLAN.md phase 22, and `src/ui/App.tsx`, `Drill.tsx`,
`Progress.tsx`, `theme.ts`, `catalog-context.tsx` and `help-text.ts` before starting.

Nick installed 1.6.3 on 2026-09-02, launched it, clicked Progress first and was told to
open a course. He clicked Drill first and got a London card with nothing at screen level
saying so. Study and Play were greyed out. He named the inconsistency exactly: either
block every mode until a course is chosen, or allow all of them. **He ruled allow all.**

## What is actually happening, so you fix the cause

- **Nothing remembers a course.** `App.tsx:73` starts `courseId` at `null` on every
  launch. Nick's impression that the app "knew" his last course came from Drill: its
  queue mixes every course by ruling, and the first due card happened to be a London one.
- **`IN_COURSE = ['study', 'play']`** disables those two nav buttons and tooltips "Open a
  course first". Drill and Progress are not in it, because the v2 ruling in SPEC section
  10 put them at the top level as screens that span courses.
- **Phase 21 made Progress follow the header switcher**, so Progress now wants a course
  while still being classed as a screen that needs none. With none chosen it shows the
  rollup and a line saying to open one. That is the gap Nick fell into.
- **The course switcher renders only when a course is chosen** (`App.tsx`, the
  `course && catalog.courses.length > 1` guard), which is why he saw no dropdown.

## The rulings, all Nick's, 2026-09-02

- **A course is always selected.** On launch it is the course the trainee was on last
  time; if there is no memory, or the remembered course is hidden or gone, it is the
  first visible course in catalog order. Never `null` once the catalog has loaded.
- **Every mode is enabled from the first click.** `IN_COURSE`, the disabled state and the
  "Open a course first" tooltip all go.
- **The course switcher always shows** whenever there is more than one visible course,
  on every view.
- **Drill gets a remembered preference: "Drill selected" or "Drill mixed".** A radio pair
  on the Drill start screen. **Default is mixed**, which is today's behaviour and the v2
  one-queue ruling: cards due in every course, interleaved, each card naming its course.
  "Selected" narrows the queue to the course the header switcher names. The choice is
  persisted between sessions. **While "mixed" is chosen, the header switcher is greyed
  out on the Drill screen** - still visible, disabled - so the header cannot appear to
  name a course Drill is ignoring.
- **The version becomes 1.6.4.** No course is added, so the second digit stays 6.

## The work

- [ ] **22.1 Remember the selected course the way the theme is remembered.**
  `src/ui/theme.ts` is the idiom: one `localStorage` key, a `saved()` that falls back
  safely when storage refuses, a hook. Key it `london-trainer.course`. **Not in the
  progress file**: a display preference is not progress, `progress.json` is versioned and
  exported, and a course id in it would travel with an export to a machine that may not
  have that course. `localStorage` lives in the WebView2 profile under
  `Repertoire Trainer Data`, which survives an upgrade and goes on a ticked uninstall,
  which is the right life for a preference.
- [ ] **22.2 Resolve the selection at startup, and validate it.** The remembered id is
  checked against `catalog.visible` (hidden courses are not candidates; a deleted or
  renamed folder is not there at all). Fall back to the first visible course. The catalog
  loads asynchronously in the installed app, so the selection resolves when the catalog
  does, and nothing renders as "no course" in the meantime that a person could act on.
  Write the resolved id back so the memory heals itself.
- [ ] **22.3 Enable every mode.** Remove `IN_COURSE` and the tooltip. `open()` from a
  tile still switches to Study; `switchTo()` from the header still clears any play
  request, because the position it names belongs to the course being left.
- [ ] **22.4 The switcher always shows** when there is more than one visible course.
  Whether it shows with exactly one course is unchanged.
- [ ] **22.5 Drill: the radio, the memory, the greyed switcher.** "Drill selected" and
  "Drill mixed" as a radio pair on the start screen, above the counts. Persisted the same
  way as 22.1, key `london-trainer.drill`, default mixed. **This replaces the existing
  filter row** (`Drill.tsx`, `course-filter`, the Everything button and one button per
  course): two selectors for one thing would be worse than the inconsistency this phase
  is fixing. Keep the information the row carried by putting the due count in each radio
  label - "Drill mixed: every course, 12 due" and "Drill selected: The Vienna Gambit, 7
  due" - so nothing a person could read is lost. The `only` state becomes derived from
  the preference and the header's course rather than held separately.
  The greyed switcher is a shell concern and the preference is a Drill concern, so the
  preference lives in a small shared hook both read, exactly as `useTheme` is shared. The
  switcher is `disabled` on the Drill view when the preference is mixed, and carries a
  `title` saying why.
- [ ] **22.6 Progress: remove the fallback.** With a course always selected, the "open a
  course to see its chapters and concepts" line is unreachable. Delete it rather than
  leave dead prose, and delete the branch that rendered it.
- [ ] **22.7 The Help document has to change, and the test cannot tell you where.**
  `help-text.ts:109-112` says Study and Play "stay greyed out until you open one" and
  that Drill and Progress do not need a course. Both sentences become false. Rewrite that
  paragraph: every screen works from the first click; the app opens on the course you
  were on last time; the switcher changes it. The Drill section gains the two radio
  options in the same voice as the Play section explains its three. Add "Drill selected"
  and "Drill mixed" to `HELP_CONTROLS` on the `drill` screen so the test holds them.
  **Read every sentence of the document against the new behaviour**, not only the ones
  named here; this is the class of lie `help.test.ts` cannot see.
- [ ] **22.8 Correct the spec.** SPEC section 10's navigation ruling says Study and Play
  open inside a course and Drill and Progress sit at the top level because they span
  courses. Rewrite it to say what is now true: a course is always selected, every mode
  works from the first click, the drill queue still spans every course by default with a
  remembered per-course option. Log the ruling in section 8 with the date and the reason,
  as phase 21 did.
- [ ] **22.9 Tests.** The help test gains the two radio controls. `App` and `Drill`
  behaviour that changed gets a test: the selection resolves to the remembered course,
  falls back when it is hidden, and falls back when it is missing; the Drill preference
  narrows the queue and the default is mixed. The mutation check is not optional: prove
  the help test fails on a renamed radio label.
- [ ] **22.10 Version 1.6.4** in `package.json`, `src-tauri/tauri.conf.json` and
  `src-tauri/Cargo.toml`.
- [ ] **22.11 Prove it in the browser build at 1280x900**, first click into each of the
  four modes with a cleared `localStorage`: every one opens, the switcher shows, and the
  landing page's "Select a course to study" still opens Study from a tile. Then choose a
  course, reload, and show it is remembered. Then on Drill, flip the radio both ways and
  show the switcher greying and ungreying. Clear the browser build's storage afterwards.

## Hazards

- **A remembered id that no longer exists must fall back, never throw or render empty.**
  Hidden courses, a deleted folder, a renamed id, and a fresh install are all the same
  case: first visible course. Test each.
- **Do not touch anything under `courses/`.** No chess moves in this phase. 308 line ids
  before and after.
- **Help that describes the old behaviour is now a lie the test cannot catch.** 22.7 is
  the reason this phase touches the help at all; do not skip it because the suite is green.
- **`localStorage` can be refused** (private windows, locked-down profiles). `theme.ts`
  shows the fallback shape: catch, default, carry on, tell nobody.
- **Nick's progress file is live** at `%APPDATA%\Repertoire Trainer\progress.json`, and a
  session's view of the filesystem OUTSIDE this repo can be a stale overlay. **Never
  report his data folders from your own `ls`.** This phase does not touch the file.
- **Do not run `tauri dev`.** The Vite server is 5175 with `--strictPort`. Check the page
  title before believing anything you drive. The browser pane must be fronted to
  photograph anything.
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`, written with
  `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Chess content. Any change to how the drill queue orders cards or to FSRS. A per-course
remembered preference for Drill (one preference, not one per course). Changing what a
tile does. A packaged build.

A valid follow-up in a file you already have open: do it now, as its own commit. One
needing a ruling: the SPEC section 6 register, with what it is, why it was not taken, and
what would make it worth taking.

## Escalation

On any contradiction between this chip, SPEC.md and the code: stop that item, record it,
continue with the rest. If the switcher cannot be greyed on Drill without the shell
knowing Drill's preference in a way that tangles the two, say so and propose the seam
rather than forcing it.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the ACTUAL model. Land the remembered selection, the enabled modes, the Drill preference,
the help and spec changes, and the version bump as separate commits. Tick PLAN.md phase
22 boxes as you go. **The review gate box belongs to the orchestrator: leave it.**

Acceptance: a course is always selected, remembered, and falls back safely; all four
modes enabled from the first click with the switcher showing; Drill carries the two
radios, remembers the choice, defaults to mixed, narrows when selected, and greys the
switcher when mixed; the old filter row is gone with its counts carried into the labels;
Progress's fallback line gone; the Help document true against the new behaviour with the
two radios held by the test and proved to fail on a rename; SPEC sections 8 and 10
corrected; version 1.6.4; 308 line ids unchanged; vitest green and `tsc -b` clean.
