# Chip: phase 38 - the report and the game list name the line

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read `src/model/stats.ts` (`playedLine`, `forkDepth`, `linesPlayed`), `src/model/lines.ts`
(`chapterLines`, `Line.name`), `src/play/report.ts` (`findDeviation`, `describeDeviation`),
`game-pgn.ts`, `src/ui/play-on.ts` and `Progress.tsx` (the Play on list), `Play.tsx` (the
in-game header) and `help-text.ts` before starting.

Nick, 2026-09-05, reading his own PGN: the report and the game list say which course and
chapter a game was against and where it left the course, but never which LINE it was in.
He also asked what the difference between a chapter and a line is, which says the words
need to appear where the game is described. **No chess content.**

## The ruling and the decision rules

- **The line a game followed is the named line the game agreed with for longest, past the
  point where that line parts from its siblings.** That is the Lines played rule
  (`playedLine` plus `forkDepth`) applied to one game and reduced to one answer: of the
  lines the game "played" under that rule, the one whose path shares the most plies with
  the game. A game that left the course in a trunk shared by several lines, before any of
  them separates, has no line: it has a chapter (the chapter whose stem it followed, or
  the chosen chapter), and the words say "in the <chapter title> chapter" instead.
- **Where it is said.** Three places, one wording:
  1. The report's repertoire paragraph. Today: "You left the repertoire on move 3 with
     Nd5. The line plays Nc3." Becomes: "You were in <line name> and left it on move 3
     with Nd5. The line plays Nc3." With no line: "You were in the <chapter title> chapter
     and left it on move 3 with Nd5." When the opponent left first: "The engine left <line
     name> on move N with X." When the game stayed in the course to the end: "You stayed
     in <line name> for the whole game." The other-side report's "The course" paragraph
     says the same about the course's own line.
  2. The Play on list on Progress gains a **Line** column between Sparring against and
     Strength, the line's name or "<chapter title>" in `--text-faint` when there is no
     line, blank for a record without moves.
  3. The PGN's deviation comment carries the line name.
- **The in-game header does not change.** It names the course and the chosen chapter; the
  line is only known once the game is over.

## The work

- [ ] **38.1 The pure part.** `lineFollowed(course, sans): { line?: Line; chapter?:
  LoadedChapter }` in `src/model/stats.ts` beside `linesPlayed`, built on `playedLine` and
  `forkDepth`, with tests: a game through a leaf names it; a game that stopped past the
  fork names the line; a game that stopped in the trunk names the chapter and no line; a
  game that left the course on move 1 names the chapter it started in when the stem is
  known and nothing otherwise; the other-side case uses the same function.
- [ ] **38.2 The report.** `Deviation` gains `lineName?` and `chapterTitle?`, filled by
  `buildReport` from `lineFollowed` on the game's moves up to the deviation ply (or all
  moves when it stayed in). `describeDeviation` says the sentences above. Tests for each
  sentence, both colours, and the other side.
- [ ] **38.3 The Play on list** gains the Line column from `lineFollowed(course,
  record.sans)`. Test the three cases on a seeded history.
- [ ] **38.4 The PGN comment** carries the line name; the round-trip test holds it.
- [ ] **38.5 Help.** The Play section's sentence about The repertoire says it names the
  line; the Progress section names the Line column; "Words we use" already has Chapter
  and Line, so check they read as the sentence above does and tighten them if not.
- [ ] **38.6 Version 1.8.4** in the three files.
- [ ] **38.7 Prove it in the browser build**: a London game that follows the King's Indian
  chapter past its fork and leaves, reviewed: the sentence names the line; a game that
  leaves at move 2 in the shared trunk: the sentence names the chapter; Progress with the
  Line column showing both. Clear the storage afterwards.

## Hazards

- **The provider's value is deliberately NOT memoised** (`play-context.tsx`).
- **`lineFollowed` must agree with `linesPlayed`** on which lines a game played; the new
  function narrows to one, it does not use a different rule. A test holds that the named
  line is one of the lines `linesPlayed` would count.
- **Nick's progress file is live**; never report his data folders from your own `ls`.
- **No `tauri build` or `tauri dev`.** **Commit before you stop.**
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change; the rule is
  twenty seconds.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Naming the line in the in-game header while a game is running. Any chess content. A
packaged build.

## Conventions and finish

Commit style follows the log. Tick PLAN.md phase 38 boxes as you go. **The review gate
box belongs to the orchestrator: leave it.**

Acceptance: the report, the Play on list and the PGN name the line a game followed, or the
chapter when it never reached a line; one function decides it and agrees with Lines
played; tests for every sentence; Help true; version 1.8.4; vitest green and `tsc -b`
clean; the tree committed and clean.
