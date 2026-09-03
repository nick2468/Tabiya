# Chip: phase 24 - a game that names its own course, a longer game on request, lines played, and two gaps

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 2 and 8, PLAN.md phases 23 and 24, and `src/ui/App.tsx`,
`Play.tsx`, `play-context.tsx`, `Progress.tsx`, `help-text.ts`, `src/play/session.ts`,
`src/play/report.ts`, `src/model/stats.ts`, `src/model/lines.ts` and
`src/storage/progress.ts` before starting.

Nick installed 1.6.6 on 2026-09-03 and came back with five findings. Every ruling below
is his unless it says it is a decision rule for you. **Phase 23's greyed course switcher
during a game was the orchestrator's decision, and Nick has overruled it.** No chess
content in this phase: nothing under `courses/` changes.

## The work, in the order to land it

### 24.1 A game names its own course, and the switcher is free

- [ ] **The Course dropdown is never greyed for a game.** Remove `inProgress` from
  `switcherIdle` in `App.tsx` and the "A game is in progress..." title. The Drill mixed
  greying stays: that one is Drill's own and Nick has not asked for it to go.
- [ ] **The running game says what it is, in fixed text in the in-game header** (`PlayHead`),
  beside the status: the course title, and for a "This chapter's line" game the chapter
  title too. Nick's wording was "Opening: London System". Use the course's own title as the
  catalog prints it: **"Opening: The London System"**, and for a chapter game **"Opening:
  The London System, sparring against Classical setups"** (the chapter title). This is
  the thing the game was steered by and the thing the report is judged against, so it is
  written where the game is, not read off a header that can now change.
- [ ] **One game at a time, and it belongs to the course it was started in, whatever the
  header says.** `PlayProvider` already holds `courseId` and `book`. The Play SCREEN shows
  the running game whenever there is one, even if the header now names another course.
  With no game, the start screen follows the header as it does today. So: remove the
  `key={course.id}` on `<Play>` in `App.tsx`, and remove the effect in `Play.tsx` that
  resets the game when `courseId !== course.id`. A reviewed game left on screen under a
  different header course is fine: it names its own course in the header line above.
- [ ] **"From a Study position" still belongs to the header's course**, because the request
  came from Study of that course. `switchTo` clearing the play request stays.
- [ ] **New game after a game from another course** starts on the header's course, which
  is what the start screen shows. Nothing else to do; check it.
- [ ] **Help.** The two phase 23 sentences that say the Course dropdown waits for the game
  ("How it fits together" and the Play section) become false. Say instead: a game keeps
  going while you look at another screen, and you can study, drill or check progress on
  any course while it does; the game names its own course above the board, and the
  report is judged against that one. Add "Opening" to `HELP_CONTROLS` on `play` only if
  the prose names it; the `PlayHead` fixture already reaches it.
- [ ] **SPEC section 8**: log the reversal with the date and Nick's reason (he wants to
  study, drill and check progress on other openings while a game is open, and a greyed
  selector nearly invisible on the Play screen answered a question nobody asked).
  Section 2, Play: one sentence that the game names its course.

### 24.2 A capped game can go on

- [ ] **When a 10 or 15 move game reaches its cap, two more buttons beside "Review the
  game": "Play 5 more moves" and "Play to the end".** They appear only when the game
  finished BY THE CAP, not on mate, stalemate or a draw, and not once the report exists.
- [ ] **In `PlaySession`, with tests.** Add `extend(by: 5 | 'full')`: the cap becomes the
  current completed full move count plus five, or no cap. `lengthCap(this.options.length)`
  is read on every `status` call, so hold the live cap in a field set from the options in
  the constructor and changed by `extend`. Test: a move10 game at move 10 is finished,
  `extend(5)` makes it playing with a cap of 15, reaching 15 finishes it again,
  `extend('full')` never finishes by cap; `extend` on a mated game does nothing.
- [ ] **After extending, the opponent may be to move** (a Black course reaches the cap on
  White's move, then White's reply is due). `play-context.tsx` handles that the way
  `start` does: if the opponent is to move, ask it, then evaluate for the bar.
- [ ] **`PlayRecord.moves` keeps recording how far the game actually ran.** Nothing to
  change there; check it still does after an extension.
- [ ] **Help, Play section**: one sentence under "How long". Add both button names to
  `HELP_CONTROLS` on `play`; the `PlayHead` fixture does not render them, so render the
  actions block the same way (a component that takes a finished-by-cap session) or extend
  the fixture. Prove a rename fails the test.

### 24.3 Progress counts the lines you have played

- [ ] **Each game records its moves.** Add `sans?: string[]` to `PlayRecord`: every SAN of
  the game in order. Optional, so files written before this phase still read; the reader
  in `progress.ts` (`readPlayGames`) already passes unknown fields through, and
  `PROGRESS_VERSION` stays at 4 because nothing old needs rewriting. Check
  `migrate.test.ts` and `progress.test.ts` for a pinned shape and extend rather than
  break them.
- [ ] **A game "played" a line when it never left it.** Decision rule: compare the game's
  SAN list with the line's `path` (from `chapterLines`); the game played the line when
  the two agree for the whole length of the shorter one. A game that ran past the leaf
  played it; a game that stopped inside it played it. A game that stopped in a trunk
  shared by several lines played into every one of them, and that is the honest reading:
  it did play into each. Say this in the section's hint so the numbers cannot surprise.
  Put the matching in `src/model/stats.ts` with tests: played through, stopped short,
  diverged at ply n does not count, a game with no `sans` counts for nothing.
- [ ] **On Progress, under "Games played", a new section "Lines played"** for the course
  the dropdown names: one row per line with at least one game, the line's name as the
  Study table prints it, its chapter, and the count, most played first. When no game
  carries moves yet, one hint line: "Counted from games played since version 1.6.7."
  That sentence is true and it is the reason a trainee with fifty games sees nothing.
- [ ] **Help, Progress section**: one paragraph. Add "Lines played" to `HELP_CONTROLS` on
  `progress`.
- [ ] **The history cap is 100 games** (`PLAY_HISTORY`). The counts are over those; say
  "your last 100 games" in the hint if the count on screen could be wrong without it.

### 24.4 The heading moves up

- [ ] Nick: the space between the Course dropdown and the screen heading is a bit big, and
  the heading should come up about 3 mm. Phase 23 set `.course-switch` bottom margin to
  24px to keep the content where it was. That is the gap he is seeing. **Set it to 12px.**
  Every screen's `h2` then rises by 12px, which is his 3 mm. Zoom a screenshot on the
  dropdown and the heading and say what the gap measures, on the Courses screen and on
  Play.

### 24.5 Version 1.6.7

- [ ] `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`. No course is
  added, so the second digit stays 6.

### 24.6 Prove it in the browser build at 1200x980, in BOTH themes

- [ ] Start a London game, change the dropdown to the Caro-Kann, open Study and Drill and
  Progress on it, come back to Play: the London game is there with "Opening: The London
  System" above the board and the dropdown still says the Caro-Kann. Review it: the
  report judges it against the London. New game: the start screen offers the Caro-Kann.
  Play a "To move 10" game to its cap, press "Play 5 more moves", show the cap at 15,
  then "Play to the end" and show it running on. Review two games and show "Lines played"
  with the line the games followed. Zoom the dropdown-to-heading gap. **Switch to the
  light theme and repeat the Play screen check**: phase 23's bar colour bug was only ever
  visible in the light theme, and the gate only drove the dark one. Clear the browser
  build's storage afterwards.

## Hazards

- **The provider's value is deliberately NOT memoised** (`play-context.tsx`, the comment at
  the bottom). Do not put a `useMemo` back. Phase 23 lost an afternoon to that.
- **`extend` must not touch `outcome`.** A game that ended by mate stays ended; the cap is
  the only thing extend changes. `status` reads outcome first, so test that path.
- **The `sans` list is the game record, so it is written once at review** (`finish` in
  `play-context.tsx`, where `recordPlay` is called), from `session.moves`, which already
  holds every SAN including any `startMoves` replayed by the constructor. A game started
  from a Study position therefore matches lines from the chapter root, which is right.
- **Nick's progress file is live** at `%APPDATA%\Repertoire Trainer\progress.json`, and a
  session's view of the filesystem OUTSIDE this repo can be a stale overlay. **Never
  report his data folders from your own `ls`.** This phase does not touch the file.
- **Do not run `tauri dev`.** The Vite server is 5175 with `--strictPort`. After any
  reload take a screenshot BEFORE a coordinate click, and confirm every click by reading
  state: a click in the pane can miss silently.
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`, written with
  `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

More than one game alive at once. Extending a game more than once by "5 more" is fine and
needs nothing special; a per-extension limit is not wanted. Counting lines for games
recorded before this phase (their moves were never kept). Any change to the Drill
greying. Any chess content. A packaged build.

A valid follow-up in a file you already have open: do it now, as its own commit. One
needing a ruling: the SPEC section 6 register, with what it is, why it was not taken, and
what would make it worth taking.

## Escalation

On any contradiction between this chip, SPEC.md and the code: stop that item, record it,
continue with the rest. If holding a game from one course while the header names another
breaks something in Play the chip did not foresee (the start screen's book, the request
from Study), say where and propose the seam rather than forcing it.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the model you actually are. Land each numbered item as its own commit or two. Tick
PLAN.md phase 24 boxes as you go. **The review gate box belongs to the orchestrator:
leave it.**

Acceptance: the switcher never greyed for a game, the game naming its course and chapter
above the board and surviving a header change; "Play 5 more moves" and "Play to the end"
on a capped game, with the cap held in the session and tested; games recording their
moves and Progress listing lines played for the selected course; the dropdown-to-heading
gap at 12px; Help and SPEC true against all of it with the new controls held by the test;
version 1.6.7; nothing under `courses/`; vitest green and `tsc -b` clean; driven in both
themes.
