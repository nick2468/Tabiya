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
