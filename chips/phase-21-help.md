# Chip: phase 21 - help for the app, not for the chess

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 2, 10 and 8, PLAN.md phase 21, and `src/ui/App.tsx`,
`Catalog.tsx`, `Study.tsx`, `Drill.tsx`, `Play.tsx`, `Progress.tsx` and `Prose.tsx`
before starting.

Nick opened the app on 2026-09-01 and said it looks impressive and a bit daunting.
Every word of prose in it is about chess. Nothing is about the application: what it is
for, what each screen wants from you, or what order to do things in. This phase fixes
that. **It adds no chess content and changes no course.**

## The rulings, settled with Nick before any drafting

- **Written for anyone he hands a course bundle to**, not only for him. Assume a club
  chess player who has never seen this app and does not know what spaced repetition is.
  That is the same reader `docs/authoring-a-course.md` was written for.
- **Fix the label first, help second.** Where a word on screen can be made clear, make it
  clear; use help for what a label cannot carry. Help that exists to explain a confusing
  label is a wound dressing. The worked example is in 21.2.
- **Never make the reader feel like a beginner.** The wording is **"Help on this
  screen"**. Not "New here?", not "Getting started", not anything that implies the reader
  should already know.
- **Help is one document**, with a heading per section, reached from the nav and always
  available. Not a tour, not coach marks, not tooltips as the mechanism.
- **The Study screen needs nothing.** Nick's words: it is intuitive what to do there.
- **The version becomes 1.6.3.** Nick's scheme is first digit 1, second digit the number
  of built-in courses, third the patch. This adds no course, so the second digit stays 6.
  Do not invent 1.7.0. `src/version.test.ts` holds the three files together.

## The work

- [ ] **21.1 One content module holds every help string.** `src/ui/help.ts` or near it.
  The `?` panels and the sections of the Help document read from the same strings, so
  they cannot drift apart, and a control rename is one file to grep. **This is the
  structural requirement of the phase**: phase 17 renamed "Start" to "Reset" and "Play a
  game from here" to "Play from here", and help written the week before would be wrong
  today.
- [ ] **21.2 Label the Study chapter list on screen.** `src/ui/Study.tsx:46` is
  `<nav className="chapter-list" aria-label="Chapters">` with the course title as its
  heading. A screen reader is told these are chapters; a sighted reader is not. Play says
  "This chapter's line" and Progress has a "Chapters" table, so the word is used twice in
  the app and shown nowhere. Make it visible. **This is the naming-first rule in
  practice**, and it is worth more than a paragraph of help.
- [ ] **21.3 A Help mode in the nav, after a faint separator.** It goes last, after
  Progress and before the theme toggle, with a visible separator between it and the
  workflow modes so it reads as apart from them. It is **never disabled** and needs no
  course, unlike Study and Play.
- [ ] **21.4 The Help document.** One markdown string, rendered by the existing `Prose`
  component so it inherits the app's own prose styling and needs no new CSS. `Prose`
  neutralises links, which is correct here too. Sections, in this order:
  1. **What this is.** A trainer for opening repertoires. It runs offline, and your
     progress stays on this machine.
  2. **How it fits together.** The loop, stated plainly: open a course, study a chapter,
     tick the lines you have learnt, drill brings them back on a schedule, play tests
     them against Stockfish, progress shows what is sticking.
  3. **Courses.** What a course is. The ones that ship with the app and the ones you add.
     Export, hide, remove.
  4. **Study.** Chapters, lines, the table, what marking a line learnt does and why it
     matters, auto step, play from here.
  5. **Drill.** What a card is. Why a line comes back. That the gaps grow as you keep
     getting it right, and shorten when you do not. The weak-areas filter.
  6. **Play.** The three ways to start, what the length and strength settings do, and
     what the report tells you afterwards.
  7. **Progress.** What each number means.
  8. **Words we use.** Course, chapter, line, card, learnt, due, never answered, concept.
     **This section is the root fix for the vocabulary problem** and every other section
     should be readable without it.
  Keep it to something a person will actually read. Nick asked for a document that is not
  long.
- [ ] **21.5 The `?` control.** A small button beside a heading that opens a short panel
  in place: two to four sentences, from the same content module as the matching Help
  section. **Not a hover tooltip** - a real button, reachable by keyboard, `aria-expanded`
  on it, Escape closes the panel. Opening it must not move anything else on the screen
  more than the panel's own height.
  Three of them, and no more:
  - **Play, after "Who you are playing"** (`Play.tsx`, the first `<legend>`). One sentence
    for each of the three options. "This chapter's line" is the confusing one.
  - **Progress, after "Chapters"**. What Learnt, Due and New count, and what "never
    answered" means.
  - **Progress, after "Concepts"**. What a concept is and what accuracy measures. **Move
    the existing explanation paragraph into this panel**: `Progress.tsx:201` renders it
    once per course, so with six courses Nick reads the same paragraph six times. It
    should appear once, here.
- [ ] **21.6 The landing page loses its statistics.** `Catalog.tsx:57` reads like "1 of
  308 lines learnt across 6 courses. 9 of 10 cards due now", which means nothing to
  somebody who has just opened the app and belongs on Progress. Replace it with **"Select
  a course to study"** under the "Your courses" heading. Nothing is lost: `Progress.tsx:65`
  already shows the same rollup. Confirm that rather than assuming it.
- [ ] **21.7 Drill: a sentence under the heading, and a label over the grade buttons.**
  The sentence says what the screen is doing - showing you positions from lines you have
  marked learnt, and asking for the repertoire move. Then a label above the button row:
  **"How well did you know it?"** The buttons keep their wording, so the interval stays
  visible; what was missing is that a question was being asked at all. **No `?` on that
  row**: Nick ruled the label makes it unnecessary.
- [ ] **21.8 Progress: a sentence under the heading**, and then **the change Nick ruled**:
  the per-course detail follows the Course dropdown instead of rendering every course.
  Today `Progress.tsx` renders a block per course in catalog order, so the dropdown can
  say "The London System" while the page leads with the Caro-Kann and the London is far
  down. Render the course the dropdown names.
  - The **cross-course rollup at the top stays**, and it is the right home for the numbers
    21.6 takes off the landing page.
  - **With no course chosen**, show the rollup and one line saying to open a course to see
    its chapters and concepts. Do not silently select one. That matches the "Open a course
    first" idiom the nav already uses.
  - **This contradicts SPEC section 10**, which rules that Drill and Progress span every
    course. The ruling has changed, so change the spec: record it in section 8 with the
    date and the reason, and correct section 10 rather than leaving the two disagreeing.
    Progress still spans every course in its rollup and still needs no course selected;
    what follows the dropdown is the detail.
- [ ] **21.9 Hold the help to the UI in a test.** Where a help string names a control,
  assert a control with that accessible name exists. This is the same idea as
  `src/version.test.ts` and the check-marker test in `content.test.ts`, and it is what
  stops this phase's work quietly becoming false at phase 24. Prove it fails on a
  renamed control rather than assuming it passes.
- [ ] **21.10 Version 1.6.3** in `package.json`, `src-tauri/tauri.conf.json` and
  `src-tauri/Cargo.toml`.
- [ ] **21.11 Prove it in the browser build at 1280x900**, which is enough for this phase:
  every `?` opens and closes, Help renders and is reachable with no course selected, the
  landing page reads as ruled, Progress follows the dropdown, and the Drill label sits
  above the buttons. Say which of these you drove and which you only read.

## Hazards

- **Help that describes something the app does not do is worse than no help.** Every
  sentence must be checked against the screen it describes, not against this chip. If
  the chip and the code disagree, the code wins and the disagreement goes in the record.
- **Do not touch anything under `courses/`.** This phase changes no chess. If you find a
  content fault, record it; do not fix it here. The line-id set must be unchanged: there
  are 308 and there must still be 308.
- **`Prose` deliberately neutralises links** because a course bundle is a file somebody
  else wrote. Do not add an HTML plugin to render the help document. If a Help section
  needs to point at another section, say its name.
- **The `?` panels must not be hover tooltips.** They have to hold three sentences, work
  from the keyboard, and be readable by somebody who never hovers.
- **Nick's progress file is live** at `%APPDATA%\Repertoire Trainer\progress.json`, and a
  session's view of the filesystem OUTSIDE this repo can be a stale overlay. **Never
  report his data folders from your own `ls`.**
- **Do not run `tauri dev`.** If you need a Vite server it is 5175 with `--strictPort`,
  in `package.json`, `vite.config.ts` and `devUrl` alike. Check the page title before
  believing anything you drive.
- **The browser pane must be FRONTED to photograph anything**; a hidden pane reports zero
  bounds.
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change.
- **No em dashes anywhere.** Australian English. Nick's writing style: lead with the
  point, short sentences, everyday words, one name for one thing.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`, written with
  `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Chess content of any kind. A guided tour or coach marks. Tooltips as the help mechanism.
A `?` anywhere other than the three named. Changing the Drill button wording. Anything on
the Study screen except the chapter-list label. Per-course help - help is about the app,
and course intros do the chess. A packaged build.

A valid follow-up in a file you already have open: do it now, as its own commit. One
needing a ruling: the SPEC section 6 register, with what it is, why it was not taken, and
what would make it worth taking.

## Escalation

On any contradiction between this chip, SPEC.md and the code: stop that item, record it,
continue with the rest. **If a help sentence cannot be made true, do not write it** - say
what the screen actually does, or say in the record that the screen needs changing before
it can be described. A screen that cannot be explained in three sentences is usually a
screen with a problem, and that finding is worth more than the sentence.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the ACTUAL model. Land the content module, the label fixes, the Help document, the `?`
panels, the Progress change and the version bump as separate commits. Tick PLAN.md phase
21 boxes as you go. **The review gate box belongs to the orchestrator: leave it.**

Acceptance: one content module feeds both the panels and the document; the Study chapter
list is labelled on screen; Help is in the nav after a separator, never disabled, and
renders through `Prose`; the document carries the eight sections including the words
list; three `?` panels and no more, each keyboard-reachable; the landing page reads
"Select a course to study" and its rollup is verified still present on Progress; Drill
carries its sentence and its button-row label; Progress carries its sentence and follows
the Course dropdown, with SPEC sections 8 and 10 updated to match; a test holds the help
strings to the controls they name, proved to fail on a rename; version 1.6.3; 308 line
ids unchanged; vitest green and `tsc -b` clean.
