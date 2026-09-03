# Phase 25 addendum: carry on playing after the review

Nick, 2026-09-03, after the phase 25 chip was already running: once a game is reviewed
he wants to be able to get back into it and carry on playing from where it stopped. This
is 25.5, and it lands after 25.1 and 25.2 and before the version bump. The rulings are
his; the decision rules are the orchestrator's and he can overrule them at the gate.

### 25.5 Keep playing from a reviewed game

- [ ] **A "Keep playing" button in the in-game header of a reviewed game**, beside New
  game. It takes the game back to its final position with the report put away and the
  board movable again. The session's moves are untouched: the game continues from where
  it stopped, not from a replayed position (replay is a viewer; playing on from an
  earlier ply is out of scope and would need a rule about the moves it discards).
- [ ] **What "carry on" means for the length.** A game stopped early with "Stop and
  review" resumes under its original cap. A game that had reached its cap cannot carry
  on under it, so for that case the button reads **"Keep playing"** and, once pressed,
  the two existing extend buttons ("Play 5 more moves", "Play to the end") are what the
  actions block shows, exactly as they do for an unreviewed capped game. Do not invent a
  third path: the reviewed capped game becomes an unreviewed capped game, and the
  existing screen takes it from there. A game that ended by mate, stalemate or a draw
  has no Keep playing: there is nothing to play.
- [ ] **The engine is still alive**: it is stopped only by New game. Undo and Redo come
  back to life with the report gone, subject to their usual rules. The evaluation map is
  kept, so the bar continues and nothing already evaluated is searched again.
- [ ] **One game, one record.** The first review wrote a `PlayRecord` and a second review
  must REPLACE it rather than add a second game to the history, or "Games played" and
  "Lines played" count one game twice. Decision rule: the provider keeps the `at` of the
  record it wrote for this game, and `finish` on a resumed game writes a record with the
  same `at`; `recordPlay` in `progress-context.tsx` (and `recordGame` in `progress.ts`)
  replaces an existing record with that `at` instead of appending. Test it in
  `progress.test.ts`: two records with the same `at`, one game in the history, the later
  one's numbers. A new game gets a new `at`.
- [ ] **Replay state is cleared by Keep playing**, so the board shows the live position.
- [ ] **Help, Play section**: one sentence after the report paragraph. Add "Keep playing"
  to `HELP_CONTROLS` on `play`; the `PlayHead` fixture reaches it if it is rendered
  there with a reviewed session.
- [ ] **Tests**: the provider's resume is logic on the session and the report state, so
  test what can be tested without an engine (the record replacement above, and that
  `PlayHead` shows Keep playing for a reviewed game stopped early and for a reviewed
  capped game, and not for a mated one). The rest is driven: review a game stopped at
  move 3, Keep playing, play two more moves, review again, and show Progress counts one
  game.

### Hazards added

- **The record's `at` is the game's identity now.** Do not regenerate it on the second
  review. Games recorded before this phase are untouched.
- **`SPEC section 2`**, Play: one sentence that a reviewed game can be resumed. Section 8:
  log it with the date.

Acceptance adds: a reviewed game can be resumed from its final position with the report
put away, extended if it was capped, reviewed again without a second record, and the bar
carrying on from the same numbers.

### 25.6 Play on from a recorded game

Nick's own case, 2026-09-03: he stopped a London game at move 20 not trusting the bar, the
report said winning for White, and he wants to carry on as though he had not stopped. The
moves are in his progress file (every review since 1.6.7 writes `sans`), and nothing can
turn them back into a game. The upgrade to 1.6.8 restarts the app, so 25.5 alone does
not reach this game.

- [ ] **On Progress, under "Games played", a short list of the recent games that kept
  their moves**: newest first, at most the last ten, each row the date, the course title,
  the chapter when there was one, how many moves it ran to, and a **"Play on"** button.
  Games without `sans` are not listed. Nothing else about the Games played section
  changes.
- [ ] **Play on starts a live game from the end of that record.** It selects the game's
  course in the header (`switchTo` in the shell, the way Study's "Play from here" hands
  over a request), builds the book from that course, restricted to the chapter if the
  record has one, and starts a session with the record's `sans` as `startMoves`, at the
  record's `level`, with **no length cap** (the game has already run past any cap that
  would apply). Then it shows the Play screen. `PlayRequest` and `playFrom` in `App.tsx`
  are the channel Study already uses; extend the request with the level and the "no cap"
  rather than inventing a second channel, and let Play's start screen show it as the
  "From ..." radio does today, with a label like "From your game of 3 September, move 20".
- [ ] **The record's identity carries over.** The resumed game keeps the record's `at`, so
  reviewing it again replaces that record under the 25.5 rule rather than adding a second
  game. A record with no `at` cannot exist (`readPlayGames` drops it).
- [ ] **A game whose moves the current course cannot replay** (the course was edited or
  removed since) is not playable: catch the constructor's replay throwing, show one
  sentence on the Play screen saying the game's moves no longer fit the course, and do
  not start. Test that path with a doctored record.
- [ ] **Help, Progress section**: one sentence. Add "Play on" to `HELP_CONTROLS` on
  `progress`; it only renders with a record that has moves, so the test needs a state
  with one such record, which `selection.test.ts` shows how to supply.
- [ ] **Tests**: the list picks only records with moves, newest first, at most ten; the
  request built from a record carries the right course, chapter, level, moves and `at`.
  Driven: review a short game, go to Progress, Play on, play two more moves, review, and
  show one game in the history with the longer move count.
