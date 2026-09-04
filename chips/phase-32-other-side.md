# Chip: phase 32 - play the other side

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read PLAN.md phases 23 to 31, `docs/testing.md`, `src/play/book.ts`, `session.ts`,
`report.ts`, `game-pgn.ts`, `src/ui/Play.tsx`, `play-context.tsx`, `Progress.tsx`,
`play-on.ts`, `prefs.ts`, `src/storage/progress.ts` and `help-text.ts` before starting.

Nick, 2026-09-05: he wants to play AGAINST the opening he has learnt, with the engine
playing the course, so he gets experience on the other side of his own lines. Ruled the
same day: a before-play choice of whether the engine plays the course move every time or
sometimes a listed alternative, defaulting to every time. **No chess content. This touches
the game provider and the session, so the phase 29 rule applies: DOM tests shown red
first.**

## The rulings

- **A fourth way to start a game: "Play the other side".** The trainee takes the
  opponent's colour and the engine plays the course. It combines with the existing
  launch shapes: any line, this chapter's line, or from a position. It does not combine
  with Play on or Play from here of a recorded game played the normal way (those resume
  the trainee's own side); Play on of a game that was itself played on the other side
  resumes it on the other side.
- **While the game is inside the course, the engine plays the repertoire move.** Under
  the default setting, every time. Under the second setting, **"Sometimes a listed
  alternative"**, the engine plays the course move three times in four and otherwise one
  of the alternatives the course lists and grades at that position, chosen at random
  among them; where a position lists none, the course move. Decision rule from the
  orchestrator; the numbers are constants in one place so Nick can tune them.
- **Once the game leaves the course**, on either side's move, the engine plays at the
  chosen strength as it does today.
- **The setting is remembered** the way the drill scope is (`prefs.ts`, key
  `london-trainer.other-side`), default "every time". The side itself is NOT remembered:
  it is a launch choice like the others.
- **The report changes shape** because there is no repertoire for the trainee's side to
  be judged against. Keep The final position and Your moves (the blunder scan of the
  trainee's moves). Replace The repertoire with **"The course"**: "The course's book ran
  out at move N" or "The course played its book to the end"; under the second setting,
  also list which alternatives the engine played and their grades, so the trainee can
  see where the game left the pure line. No "you left the repertoire" sentence exists
  in this mode.
- **Hint in this mode shows the reply club players make most often**, from the same
  weights the book already carries, worded "Club players most often play 6.Bg5 here",
  with the engine's move once the book has nothing. The hint count is recorded as now.
- **The record carries the side.** `side?: 'course' | 'other'` on `PlayRecord`, absent
  meaning `'course'` for every game recorded so far. Games on the other side are counted
  in Games played with their own line ("N of them playing the other side") and are
  EXCLUDED from Lines played, which counts the trainee's own repertoire games. The Play
  on list shows them with "other side" in the Sparring against column, and Play on
  resumes them on the other side; Replay reviews them with the other-side report.

## The work

- [ ] **32.1 The book carries the alternatives.** `BookMove` gains
  `alternatives: { san: string; grade: MistakeGrade }[]` from the node's `mistakes`, so
  the session can pick among them without reaching back into the course. `buildBook`
  fills it; a test proves a node's listed alternatives reach the book at its position.
- [ ] **32.2 The session plays either side.** `SessionOptions` gains `side: 'course' |
  'other'` (default `'course'`, so nothing that exists changes). With `'other'`, the
  trainee colour is `book.opponentColour`, `playOpponent` plays from `book.student` (the
  course move, or an alternative under the second setting, with the random source
  injected as it is for replies), and the engine takes over when `book.student` has no
  entry. Record on each `PlayedMove` whether it came from the book, as now, and which
  alternative grade it carried if it was one. Tests: the engine plays the course move
  every time under the default; under the second setting with a fixed random source it
  plays an alternative at the expected draws; a position with no alternatives plays the
  course move; the book runs out and the engine is asked.
- [ ] **32.3 The report for the other side.** `buildReport` takes the side. For `'other'`,
  `deviation` becomes a new kind, `course-book-ended`, with the ply and, under the second
  setting, the list of alternatives played with their grades. `describeDeviation` says the
  sentences above. The scan of the trainee's moves is unchanged. The PGN comments follow:
  `White` and `Black` tags the right way round for the swapped colours, and the report
  comment says the game was played against the course. Tests for each.
- [ ] **32.4 The start screen.** Under "Who you are playing", a fourth radio **"Play the
  other side"** with one sentence under it: "You play against the course. The engine plays
  its moves." When chosen, a second radio pair appears: **"The course move every time"**
  (default, remembered) and **"Sometimes a listed alternative"**, with one sentence each.
  The board orients to the trainee's new colour and the engine opens the game where the
  course is a White course. The in-game Opening line reads "Opening: The Sicilian Najdorf,
  playing the other side, against 4. Club".
- [ ] **32.5 Hint on the other side**: the most-weighted book reply at the position, with
  the wording above and the blue arrow the engine hint uses; the engine's move once the
  book has nothing. Test the pure part.
- [ ] **32.6 Progress.** The Games played line gains "N of them playing the other side"
  when N is above zero. Lines played excludes `side === 'other'`; test it. The Play on
  list shows "other side" in Sparring against and resumes on the other side; test the
  request carries the side.
- [ ] **32.7 DOM tests, red first**: start a game on the other side in a Black course
  and assert the trainee's first move is White's and the engine's reply is the course's
  1...c5; review and assert the report's first heading is "The course" and the record
  carries `side: 'other'`; flip the setting and assert it is remembered across a reload
  of the shell. Mutation-check the help test on the new controls.
- [ ] **32.8 Help and SPEC.** Help, Play section: a paragraph on Play the other side and
  its two settings, and the changed report. Add "Play the other side", "The course move
  every time" and "Sometimes a listed alternative" to `HELP_CONTROLS` on `play`. SPEC
  section 2, Play: the fourth launch shape. Section 8: log the ruling with the date.
- [ ] **32.9 Version 1.7.2** in the three files.
- [ ] **32.10 Prove it in the browser build at 1200x980**: a Najdorf game on the other
  side (you as White, the engine answering 1.e4 with 1...c5 and 2...d6), Hint showing the
  most common White reply, the report with "The course"; then the London on the other
  side (the engine opens 1.d4); flip the setting, reload, show it held. Clear the
  browser build's storage afterwards.

## Hazards

- **The provider's value is deliberately NOT memoised** (`play-context.tsx`).
- **One engine, one queue.** Nothing here adds a second search.
- **`side` absent means `'course'`** everywhere a record is read, so every existing record
  and every existing test keeps its meaning. Do not migrate the progress file.
- **The evaluation bar's orientation follows the trainee's colour**, which is now the
  opponent colour of the book: check `evalBarLayout` is given the SESSION's student
  colour, not the course's.
- **Lines played must not count other-side games**, or a game where the engine played
  the whole line would be credited to the trainee. The test in 32.6 holds this.
- **Nick's progress file is live** at `%APPDATA%\Repertoire Trainer\progress.json`, and a
  session's view of the filesystem OUTSIDE this repo can be a stale overlay. **Never
  report his data folders from your own `ls`.**
- **Do not run `tauri dev`.** The Vite server is 5175 with `--strictPort`; if another
  server holds it, drive against it and say so. Judge console errors from a fresh tab.
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first. **Commit before you
  stop**: the orchestrator builds from the working tree and must find it clean.

## Out of scope

Weighting the alternatives by grade (all listed alternatives are equally likely under the
second setting). Drilling the other side. Any chess content. A packaged build.

## Conventions and finish

Commit style follows the log. Tick PLAN.md phase 32 boxes as you go. **The review gate
box belongs to the orchestrator: leave it.**

Acceptance: a fourth launch shape that swaps the sides, with the engine playing the
course move every time by default and sometimes a listed alternative under a remembered
setting; a report whose repertoire part becomes "The course"; hints from the book's
weights; records carrying the side, counted apart on Progress and excluded from Lines
played; DOM tests shown red first and the help test mutation-checked; Help and SPEC true;
version 1.7.2; nothing under `courses/`; vitest green and `tsc -b` clean; the tree
committed and clean at the end.
