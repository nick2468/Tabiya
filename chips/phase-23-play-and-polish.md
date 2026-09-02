# Chip: phase 23 - a live evaluation bar, undo and redo, a game that survives leaving the screen, drilling early, and the wording that was still chess

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 2, 6 and 8, PLAN.md phase 23, and `src/ui/App.tsx`, `Play.tsx`,
`Drill.tsx`, `Progress.tsx`, `Study.tsx`, `help-text.ts`, `prefs.ts`, `src/play/session.ts`,
`src/engine/stockfish.ts` and `src/model/queue.ts` before starting.

Nick used 1.6.4 for a day and came back with ten findings on 2026-09-03. Nine of them
are this phase; the tenth was "chip it". Every one below is his ruling unless it says it
is a decision rule for you.

## The work, in the order to land it

Each numbered item is its own commit or two. The version bump is last.

### 23.1 A live evaluation bar on the Play screen

- [ ] **A vertical evaluation bar to the LEFT of the board while the game is going.** Board
  height, so 420px to match `size={420}`. White's share at the bottom when the student is
  White, at the top when the student is Black: the bar follows the board's orientation, so
  "more of my colour" always reads as "good for me" from where the student sits. Squash
  with the same `tanh(pawns / 3)` the report's `EvalBar` uses, and give it an `aria-label`
  in the report's words (`verdictInWords`), never a bare number. No number on the bar at
  all: the spec's "verdicts in words, never bare numbers" still binds.
- [ ] **Where the number comes from.** One engine, not two. After every move that lands
  on the board (the student's and the opponent's), set the engine to the same fixed
  analysis profile the report's scan uses (`strengthProfile(8)`, `multiPv: 1`,
  `movetime: SCAN_MOVETIME`), search the new position, convert with `whitePovPawns`,
  then set the playing profile back before the opponent thinks. That is two `isready`
  round trips per move on top of 150 ms of search, which is not noticeable. Do NOT read
  the evaluation off the opponent's own search: levels 4 to 8 run with
  `UCI_LimitStrength`, so their score is the score of a weakened engine, and levels 1
  to 3 search for 50 to 150 ms with several candidates. The bar would lie.
- [ ] **Keep every evaluation you make, keyed by `positionKey`, and hand the map to the
  scan.** `scanGame` already keys its results the same way; give it a starting map and
  make it skip positions it has been given. The report is then judged by the exact
  numbers the bar showed, at the same effort, and the scan at the end gets shorter.
- [ ] **While the engine is thinking, the bar holds the last value** and is not greyed or
  animated; the status line already says who is thinking.
- [ ] **The heading and the prose that say there is no bar all change.** `Play.tsx`: the
  module docblock, the start-screen paragraph "No evaluation while you play...", and the
  `EvalBar` docblock "The one place an evaluation bar is allowed". `help-text.ts`, Play
  section: the paragraph "There is no evaluation on screen while you play. That is on
  purpose..." goes; say instead that the bar to the left of the board is the engine's
  view of the position at full strength, that it follows your colour, and that the
  report afterwards is built from the same numbers. **SPEC section 2, Play:** "No
  evaluation bar during play - it is a crutch" and "The eval bar is allowed here, in
  review, only" are reversed. Rewrite both sentences to what is now true and log the
  reversal in section 8 with the date: Nick asked for it after playing with the app, and
  the v1 ruling was made before anyone had.
- [ ] **A test on the bar's geometry**: white share at 50% for 0.0, above 50% for a
  positive number, and the orientation flip for a Black student. Extract the share and
  the "which end is white" decision into a small pure function so the test does not need
  the DOM.

### 23.2 Undo and redo on the Play screen

- [ ] **Undo takes the game back to the last position where the student was to move**,
  and redo puts it forward again. Both are buttons in the in-game header beside "New
  game", labelled **Undo** and **Redo**, and both are disabled when there is nothing to
  do, while the engine is thinking, and once the report exists (a reviewed game is
  finished; New game is the way on).
- [ ] **Undo is a pair, not a ply.** If it is the student's move, undo removes the
  opponent's last reply and the student's move before it. If the game just finished on
  the student's move (mate, or the length cap), undo removes that one move. The session
  must never be left with the opponent to move, because nothing would then move.
- [ ] **Undo cannot go back past where the game started.** A game launched with "From a
  Study position" replays `startMoves` in the constructor; those plies are the floor.
- [ ] **This belongs in `PlaySession`, with tests.** Add `undo()` and `redo()` to the
  session, a redo stack of `PlayedMove`s that a new student move empties, and put
  `outcome` right: clear it and re-run `noteOutcome()` after every undo and redo, or a
  game undone out of a checkmate stays "finished". `bookReplies` counts the opponent's
  book moves; record `fromBook` on each opponent `PlayedMove` so undo can decrement it
  honestly. The `play.test.ts` fake engine is the fixture. Test: undo after an opponent
  reply removes two plies; undo with the student to move and one ply played removes
  one; undo at the floor is a no-op; redo replays what undo removed; a new move after
  undo empties the redo stack; undo out of a mate clears the outcome.
- [ ] **The evaluation bar follows undo and redo** from the map in 23.1: every position
  you go back to has already been evaluated, so no search is needed.
- [ ] **Undo and Redo go in `HELP_CONTROLS` on the `play` screen and the Help names
  them.** The help test walks the Play START screen and cannot see the in-game header.
  Do not add them unheld. Extract the in-game header into a component that takes a
  `PlaySession` and render it in `help.test.ts` with a session built on the fake engine.
  While that fixture exists, **take the phase 21 register item along**: build a small
  `GameReport` fixture, render `Report` with it, and hold "The repertoire", "Your
  moves" and "The final position" the same way. Then remove that item from the SPEC
  section 6 register and say in section 6 that it was closed at phase 23. This is the
  do-it-now rule: the fixture that makes Undo testable is the fixture that item was
  waiting for.

### 23.3 A game survives leaving the Play screen

- [ ] **Today the game is torn down because it lives in `Play`'s state**, and `Play`
  unmounts when the view changes (`App.tsx`, `showing === 'play'`), which also stops
  the engine worker in the unmount effect. Move the game out of the screen. A
  `PlayProvider` beside `ProgressProvider` and `CatalogProvider`, holding the
  session, the report, the scan progress, the engine handle and the evaluation map,
  is the seam; `Play` becomes the screen that renders it. `useProgress()` is the
  pattern to copy, down to the exported-context lint suppression and its reason.
- [ ] **The engine worker lives while a game or a report exists** and is stopped on New
  game. It is no longer stopped on leaving the screen. Nothing else changes about when
  it starts.
- [ ] **A game belongs to the course it was started in, so the course switcher is
  greyed while a game is in progress**, on every screen, exactly the way it is greyed
  on Drill while Drill mixed is chosen: `disabled`, `.course-switch.idle`, and a title
  saying why: "A game is in progress. Finish it or start a new one on Play to change
  course." "In progress" means a session exists and no report does. Once the report is
  showing, the switcher is live again, because a reviewed game is over. Reuse
  `switcherIdle` in the shell; it becomes `(drill mixing) || (game in progress)`, and the
  title picks the sentence that applies.
- [ ] **`key={course.id}` on `<Play>` stays**, because the switcher cannot change while
  a game runs, so the remount it causes can only happen with no game to lose.
- [ ] **Help, "How it fits together" and the Play section**: say that a game keeps going
  while you look at another screen, and that the Course dropdown waits for it.
- [ ] **Test**: the session in the provider survives a view change. The shell renders
  to a string in the existing tests, so test the provider's own logic (start, leave,
  return) as a hook or a plain object rather than through the nav, and put the greyed
  switcher beside the phase 22 register item as the second thing that would pay for a
  DOM test environment.

### 23.4 Drill cards before they are due

- [ ] **A checkbox on the Drill start screen, under "Drill my weak areas first":
  "Include cards that are not due yet".** Not remembered between sessions: it is a
  one-off decision each time, and remembering it would make "due" mean nothing for
  ever after. Default off.
- [ ] **Decision rule: an early answer is an ordinary answer.** It goes through the same
  `answer` path and the same FSRS review. FSRS handles a review before the due date on
  its own: it knows how much time has passed, so an early Good grows the gap less than
  a due Good, and an early wrong answer shortens it as usual. No second recording path,
  no special casing. The buttons already say what gap each answer gives, and those
  numbers will simply be smaller than usual for an early card. Nothing about the
  schedule is hidden, which is the promise the Help already makes.
- [ ] **Queue order with the box ticked: every due card first, in the order `dueQueue`
  gives them today, then the cards not yet due, soonest due first.** "Drill my weak areas
  first" keeps applying to the due part. Add an option to `dueQueue` (or a sibling
  function) rather than a filter in the component, and test the order.
- [ ] **The summary line says what it is doing.** Unticked it reads as today. Ticked:
  "<strong>N</strong> cards, M of them due now" when M is smaller than N, so the count
  never silently changes meaning. The radio labels ("every course, 12 due") keep saying
  due, because that is what they count. Start drilling is enabled whenever the queue is
  not empty.
- [ ] **Help, Drill section**: one paragraph, in the voice of the paragraph above it:
  the box, what it does, and that an early answer still counts and is scheduled from
  when you actually answered. Add "Include cards that are not due yet" to
  `HELP_CONTROLS` on `drill`.
- [ ] **SPEC section 2, Drill**: one sentence recording the option. Section 8: the
  ruling, with the reason - after one full session Nick could not drill a course
  again for a week, and the app gave him no way to say "I want to anyway".
- [ ] **Do NOT touch the FSRS parameters.** `scheduler/index.ts` says tuning is a later
  question and a wrong answer is worse than the default. The gaps are not the bug; the
  missing override is.

### 23.5 Content: five notes that describe the wrong board

All of these are `note` text only. No `san` changes anywhere. 308 line ids before and
after, and `docs/bundles/*.pgn` regenerated with `scripts/export-bundles.mjs` because
`bundle.test.ts` compares them to what the writer produces.

- [ ] **Colle, `ch0-the-zukertort.json`, White's 5.b3**: "The Zukertort move. The
  bishop is going to b2, not to c1 and not out to f4." The bishop is ON c1; it has not
  moved. Say what the note means: it is going to b2, not staying on c1 (which is the
  Colle-Koltanowski, the `c3` alternative listed on the same node) and not out to f4
  (the London, the `Bf4` alternative on the node before). The ch1 twin of this note,
  "The bishop goes behind the pawns, not out in front of them", is already right.
- [ ] **The Ruy Lopez Exchange says 4...dxc6 recaptures "towards the centre" in seven
  places, and it does not.** d7 to c6 is a step AWAY from the centre; b7 to c6 is the
  recapture towards it. The reasons the notes give (it opens the c8 bishop and keeps a
  pawn on e5) are correct; only the direction word is wrong. Nodes: `ch0-the-exchange.json`
  line 79, `ch5-no-a6.json` lines 41, 589, 667 and 824, `ch6-tactics-and-plans.json` lines
  29 and 399 (grep `Towards the centre`). Rewrite each without the false claim.
  **And the `ch4-bxc6.json` intro opens "Black recaptures towards the edge"**, which is
  the same error from the other side: 4...bxc6 recaptures towards the centre and leaves
  the queenside pawns in a heap; say that.
- [ ] **Slav, `ch1-main-line.json` line 440, Black's ...exf5**: "Take towards the centre.
  The pawn on f5 covers e4..." e6 to f5 is away from the centre. The rest of the note is
  right; fix the first sentence.
- [ ] **Vienna, `ch5-everything-else.json` line 208, White's dxc3**: "Take towards the
  centre, opening the queen and the c1 bishop." d2 to c3 is away from the centre. Fix the
  first sentence.
- [ ] **Make this a rule the build enforces, the way phase 18 did for check and mate
  markers.** In `content.test.ts`, per course: for every node and every alternative whose
  note or plan says a capture goes "towards the centre" or "towards the middle" (case
  insensitive, `toward` and `towards`), the capture's destination file must be nearer
  the d and e files than its origin file. A recapture between the d and e files
  (`exd4`) passes: same distance is not a lie. Prove it fails on any one of the notes
  above before you fix them, then fix them, then it is green. Nick found one of these by
  eye; the suite found four more the same afternoon. That is the memory rule about
  content checkers, and it is why this is a test and not a one-off script.
- [ ] Run `node scripts/note-claims.mjs` and `node scripts/note-lines.mjs` over the
  touched chapters afterwards and say what they reported. No engine run is needed: no
  move changed.

### 23.6 The frequency number comes off the move button

- [ ] **Study, the "Black plays" / "White plays" / "Continue with" buttons**: today an
  opponent reply shows its `weight` as a small badge ("d5 7"). Nick read it as a count
  and it gets between the eye and the move. **Remove the badge.** Put the number in the
  button's `title` instead, in words that are true: the weight is a whole number from 1
  to 10 (`loader.ts` enforces that) and Play picks among the replies in proportion to it
  (`book.ts`, `chooseOpponentReply`). So: "How often club players choose this reply, on
  a scale of 1 to 10: 7. Play picks your opponent's moves in that proportion." The
  student's own moves carry no weight and get no title.
- [ ] **Help, Study section**: one sentence saying that hovering an opponent's reply
  shows how often club players choose it, from 1 to 10, and that Play uses those
  numbers to choose your opponent's moves. `study.css` `.weight` goes if nothing else
  uses it.

### 23.7 Progress and Drill say "ready" and "not yet drilled", not "due" and "New"

Nick: "I don't know what '0 due now, 0 never answered' and New means, they always seem to
be zeroes." They were zero because he had drilled everything, which is the one state the
words did not explain. Fix the label first, help second.

- [ ] **One name for one thing.** The Drill screen already says "N cards ready". Use
  that word everywhere a person reads a count of cards whose gap has run out: Progress
  rollup and course totals ("<strong>N</strong> ready to drill now, M not yet drilled"),
  the Chapters table columns ("Ready" and "Not yet drilled" replace "Due" and "New"), the
  Drill radio labels ("every course, 12 ready"), and the catalog tile's "due now"
  (`Catalog.tsx:108`). Grep `due now`, `never answered` and `New` in `src/ui` and do the
  lot; the internal names (`due`, `fresh`, `dueCount`) stay.
- [ ] **When nothing is ready, say when something will be.** Under the rollup totals on
  Progress, when the ready count is zero and there are cards: "The next card comes back
  in 3 days." `Drill.tsx` has `nextDueLine`; move it somewhere both screens can import it
  rather than copying it.
- [ ] **Help follows.** `PANELS['progress-chapters']`, the Progress section, and the two
  entries in "Words we use" ("Due" becomes "Ready", "Never answered" becomes "Not yet
  drilled"). Read every sentence in the Drill and Progress sections against the new
  words; the help test holds names, not sentences.

### 23.8 The course dropdown moves up

- [ ] **The gap under the header separator to the Course dropdown is 16px
  (`.app-header` `margin-bottom`) and the gap above the separator is 8px (`padding-bottom`).**
  Nick wants the dropdown 1 to 2 mm higher so the two gaps balance. Make the gap below
  match the gap above: `margin-bottom: 8px` on `.app-header`, and give `.course-switch`
  the 8px back on its bottom margin so the content under it does not move. Zoom a
  screenshot on the separator and say what the two gaps measure.

### 23.9 The window opens narrower and taller

- [ ] `src-tauri/tauri.conf.json`: `width` 1280 to **1200**, `height` 900 to **980**.
  Two centimetres is about 76 logical pixels; these are the round numbers nearest. Min
  size stays. Update the "prove it at 1280x900" habit: browser proofs in this phase run
  at 1200x980.

### 23.10 Version 1.6.5

- [ ] `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`. No course is
  added, so the second digit stays 6.

### 23.11 Prove it in the browser build at 1200x980

- [ ] Start a game as White and as Black (the Caro-Kann): the bar sits left of the board
  at board height, the student's colour is at the bottom in both, and it moves after each
  move. Undo twice and redo twice and show the move list and the bar agree. Leave to
  Study mid-game, show the switcher greyed with its title, come back and the game is
  where it was; review it and the switcher is live. On Drill with everything answered,
  tick the new box and show the summary and that Start drilling is enabled; answer one
  and show the button's gap. Hover a Black reply on Study and show the title with no
  badge on the button. Progress with the new words. Zoom the header gap. Clear the
  browser build's storage afterwards.

## Hazards

- **The engine is one worker with a promise queue** (`stockfish.ts`, `run`). Every
  evaluation search and every strength change goes through that queue, so nothing can
  interleave, but a search you forget to await can leave the engine at the analysis
  profile when the opponent moves. Restore the playing profile in a `finally`.
- **Level 1 to 3 profiles have `multiPv` above 1.** The analysis profile must set it back
  to 1 and the restore must set it to the level's value. `optionCommands` is what
  `setStrength` sends; read it.
- **`positionKey` drops the move counters** so a position reached by two routes shares
  one evaluation. That is what the report scan relies on and it is what the bar's map
  must use too.
- **Notes only under `courses/`.** No `san` changes. 308 line ids before and after; run the
  bundle writer; `bundle.test.ts` will tell you if you forgot.
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

A toggle to hide the evaluation bar (Nick asked for the bar; if he wants a switch he will
say so). Any change to FSRS parameters or to how a due card is ordered. Remembering the
"not due yet" box. Keeping more than one game alive (one game, one course). A second
engine worker. Any `san` change under `courses/`. A packaged build.

A valid follow-up in a file you already have open: do it now, as its own commit. One
needing a ruling: the SPEC section 6 register, with what it is, why it was not taken, and
what would make it worth taking.

## Escalation

On any contradiction between this chip, SPEC.md and the code: stop that item, record it,
continue with the rest. Two places you might hit one: if switching the engine profile
around every evaluation costs more than about 200 ms per move in practice, measure it,
say so, and propose the fix rather than shipping a slow game; and if lifting the game
into a provider makes `Play.tsx` harder to read rather than easier, say where and why
before you split it further.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer
`Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` if that is the model you are,
else the model you actually are. Land each numbered item as its own commit or two; the
content fixes and their test are separate commits so a bisect can tell the rule from the
fixes. Tick PLAN.md phase 23 boxes as you go. **The review gate box belongs to the
orchestrator: leave it.**

Acceptance: a live evaluation bar left of the board that follows the student's colour and
feeds the report; Undo and Redo on the session with tests and held by the help test; a
game that survives leaving the screen with the switcher greyed while it runs; the "not
due yet" box drilling early through the ordinary answer path; five wrong notes fixed and
a test that would have caught them; the weight badge gone and its number in a title;
"ready" and "not yet drilled" throughout with a next-card line on Progress; the header
gap balanced; the window 1200 by 980; SPEC sections 2, 6 and 8 corrected; version 1.6.5;
308 line ids and regenerated bundles; vitest green and `tsc -b` clean.
