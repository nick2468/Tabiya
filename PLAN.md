# London Trainer - build plan

v1.0, 2026-08-27. Governed by SPEC.md; where they disagree, SPEC.md wins. Five phases.
One builder session executes one phase, working in `C:\Users\nick2\Code\London` on
`main`, no worktree. Read SPEC.md in full, then your phase here, before touching code.

**Checkbox rules.** The builder ticks task boxes as it completes them - Nick follows
progress from this file while a phase runs. The "Review gate" box at the end of each
phase belongs to the reviewer (the orchestrator session), never the builder: the
builder stops at the gate and reports. The next phase does not start until the gate
box is ticked.

**Conventions, every phase.**

- Commits: small and logical, short imperative subject, body only when the change is
  not obvious. PowerShell 5.1 mangles some multi-line messages - write the message to
  a scratch file and use `git commit -F` when in doubt. End every commit message with
  a trailer naming the actual model, for example:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- Do not push and do not create a remote; that is Nick's call.
- Plain hyphens only, never em dashes, in every file including JSON prose. Australian
  English in prose and UI copy.
- Run the dev server with `npm run dev` from the repo root only.
- Escalation: where this plan or SPEC.md contradict each other or reality, SPEC.md
  wins; record the conflict under your phase's "Open items" and continue elsewhere.
  Anything needing a ruling from Nick: record it there, take the simpler path if one
  exists, otherwise stop that thread and continue with the rest.
- Content quality bar and schema rules: SPEC.md sections 3 and 4. Do not gold-plate
  past the stated minimums.

---

## Phase 1 - foundation: scaffold, board, content model, chapters 0-2

Goal: a running app skeleton with a playable board, the validated content pipeline,
and the first three chapters drafted.

- [x] 1.1 `git init` on branch main; .gitignore for node/Vite; first commit: SPEC.md,
  PLAN.md, BRIEF.md, chips/ as they stand.
- [x] 1.2 Scaffold Vite + React + TypeScript; wire vitest; commit.
- [x] 1.3 chess.js plus the chessground wrapper component (CSS and piece assets
  imported); board playable with illegal moves rejected; commit.
- [x] 1.4 `docs/content-schema.md` written from SPEC.md section 4; types; loader and
  validator in `src/model` (FEN computed per node during the legality walk); vitest
  coverage including negative fixtures: illegal SAN, illegal mistake-entry SAN,
  missing leaf plan, missing White note, duplicate White siblings in one variant,
  weight on a White node, tag outside the vocabulary; commit.
- [x] 1.5 Draft ch0, ch1, ch2 per SPEC.md section 3 (notes, plans, weights, tags,
  mistake entries at the stated minimums); validator green; one commit per chapter.
- [x] 1.6 Dev status panel: per chapter - title, node count, deepest line in full
  moves, validation PASS or FAIL with first error; commit.

Acceptance: `npm run dev` serves the page with a playable board; three chapters PASS
in the panel; ch1-ch2 main lines reach move 10-12; every White move has a note, every
leaf a plan; ch1 and ch2 each carry mistake entries on at least 10 positions; ch0
intro is 300-500 words; vitest green including the negative fixtures.

- [x] **Review gate 1 passed** (orchestrator, 2026-08-27)

Open items (phase 1):

1. **ch2's answer to ...Qb6 is a pawn offer that has not been engine checked.** The
   repertoire move is 4.Nc3, letting Black take on b2 so the knight can jump to b5 with
   a fork threat. The passive 4.Qc1 was the alternative and is recorded in the content
   as a playable mistake entry. SPEC.md section 3 says a fork the builder cannot judge
   is recorded and the simpler branch taken, but Nc3 is the mainstream recommendation
   and the chapter is the one place the spec calls critical, so it was taken. The
   content deliberately claims an initiative, not a forced win. Phase 4 task 4.6
   already schedules the engine pass over every ch2 line: check this one first.
2. **The board wrapper turns on chessground's `trustAllEvents` in dev builds.** Without
   it chessground ignores synthetic events, so no automated check can drive the board.
   Real users only ever produce trusted events, so shipped behaviour is unchanged. The
   wrapper also exposes the board API on `window.__cg` in dev, which is how phase 1
   verified turn, movable colour and legal destinations from the browser.
3. **Promotion auto-queens on the phase 1 board.** The scratch board plays a queen
   without asking. Play mode needs a real picker; note it when task 4.3 lands.
4. **Review findings, gate 1 (orchestrator).** The board now re-measures on host
   resize: chessground takes one measurement at mount, so a board mounted while
   hidden stayed zero width (found driving the app through a hidden browser pane;
   fixed with a ResizeObserver calling redrawAll, which phases 2 and 3 will rely
   on when boards mount inside switched-away views). Content touches at review:
   after 4.Nc3 the ...Qxb2 grab now outweighs the declines, matching the chapter
   intro, and ch1's premature h4 note says backfires rather than loses. For the
   4.6 engine pass: the ...Nc6 decline after 4.Nc3 stops at move 5 - deepen it a
   move or two while checking it.

---

## Phase 2 - Study mode, chapters 3-5

Goal: the full Study experience over six chapters.

- [x] 2.1 Chapter list in course order with intro rendering (markdown) including the
  typical-mistakes section.
- [x] 2.2 Line navigation: step forwards and backwards, pick variations at branch
  points, jump to any node; last move auto-arrowed; authored `shapes` rendered.
- [x] 2.3 Note panel showing the current node's note (and plan on leaves).
- [x] 2.4 "Learnt" toggle per line, persisted through `src/storage` ProgressStore
  (localStorage implementation, versioned state shape from SPEC.md section 5).
- [x] 2.5 "Play from here" button present but stubbed with a "phase 4" notice.
- [x] 2.6 Draft ch3, ch4, ch5 to the section 3 bar; one commit per chapter.
- [x] 2.7 Retire the phase 1 status panel to a dev-only diagnostics view.

Acceptance: every line of the six chapters can be studied end to end with notes and
arrows; learnt state survives an app restart; validator green on all six chapters;
vitest green.

- [x] **Review gate 2 passed** (orchestrator, 2026-08-27)

Open items (phase 2):

1. **Shape rendering could not be checked by eye this session.** The browser pane was
   never displayed, so screenshots time out and chessground never runs the animation
   frame that paints its shapes: the SVG stays empty while the tab is hidden. What was
   verified instead is that the right shapes reach chessground's own state on every
   leaf of all six chapters, and the composition rule now has unit tests. The drawing
   itself was seen working earlier, before the pane went away. Worth one look by eye at
   review.
2. **Study is read-only on the board.** Moves are made through the move list and the
   arrow keys, not by dragging pieces, because a dragged move would leave the tree.
   Playing the next move on the board is Drill's job in phase 3. If it turns out to be
   wanted in Study too, it belongs behind the same node-matching check Drill will use.
3. **Chapter 0 has only two lines**, so its learnt count reads "0 of 2". That is the
   content, not the view: the chapter is a concept tour with one model line and one
   short branch. Worth a look when chapters 6 and 7 land in phase 3, in case ch0 should
   carry a few more short lines for drilling.
4. **Review findings, gate 2 (orchestrator).** Shape rendering (item 1) is verified
   to the SVG: on the ch0 Bf4 node chessground's state holds exactly one shape, the
   authored green arrow winning the dedup against the last-move blue, and a forced
   redraw paints one green SVG line. Only pixel compositing still wants a human
   glance when the pane is next visible. Read-only Study (item 2) confirmed live:
   no movable colour, zero destinations. Fixed at review: the choices heading said
   "Black plays" at chapter 0's opening position, where White is to move (it now
   follows the side to move); a wrong vs-bf5 concept tag on the ...Nh5 Bg3 node in
   ch5, which would have polluted the weak-area stats; and the ch5 Qxd3 note
   claimed the queen eyes b7 from d3, which is not a queen line - it now claims
   only h7. Item 3 (ch0's two lines) stays parked for the phase 3 look.

---

## Phase 3 - Drill mode, Progress core, chapters 6-7

Goal: the daily training loop, and content complete.

- [x] 3.1 `src/scheduler`: ts-fsrs behind a thin interface; vitest coverage of the
  grade-to-rating mapping and rescheduling.
- [x] 3.2 Card generation from learnt lines: one card per White-to-move node, keyed
  and deduplicated by FEN across chapters (SPEC.md section 2); tests.
- [x] 3.3 Drill UI: due queue; answer by playing the move on the board; grading flow -
  exact move Good (Easy button available), listed mistake by authored grade with its
  note, unlisted move Again with the honest "not the repertoire move" framing plus
  the expected move's note.
- [x] 3.4 Weak-areas filter: rolling per-tag accuracy, filter prefers the weakest
  tags; test proving the preference.
- [x] 3.5 Progress view, core: per-chapter completion, due counts, per-concept
  accuracy.
- [x] 3.6 Export and import of the whole progress state; round-trip test.
- [x] 3.7 Draft ch6 and ch7 to the section 3 bar (ch7 nodes are exercise positions);
  one commit per chapter. Content is now complete: all eight chapters PASS.

Acceptance: a full drill session runs end to end; grading matches SPEC.md section 2;
rescheduling verified; state survives restart; export/import round-trips; weak-area
preference proven by test; all eight chapters validator-green.

- [x] **Review gate 3 passed** (orchestrator, 2026-08-27)

Open items (phase 3):

1. **The Greek gift has no exercise, deliberately.** SPEC.md section 3 lists Bxh7+ as a
   chapter 7 topic. It is taught there as a checklist of the four conditions to verify
   before playing it, but there is no drill position, because a sacrifice nobody has
   checked is not something to teach and there is no engine until phase 4. Task 4.6 is
   the natural moment: build one position, verify it with Stockfish, and add it.
2. **Model games are described, not cited.** The same chapter says Kamsky is the
   reference player and names the recurring patterns, but lists no specific games. The
   app has no game database to check a citation against, and PGN import is a deferred
   v2 item in SPEC.md section 6. Revisit if that defer is ever taken.
3. **Chapter 0 keeps its two lines** (carried from phase 2 open items). Checked with
   the card machinery working: those two lines produce twelve cards, and every position
   in them is shared with chapter 1 or chapter 7, so nothing goes undrilled. Only the
   "0 of 2 learnt" line count reads thin. Left as it is: the chapter is a concept tour,
   and padding it with lines nobody needs would make the course longer, not better.
4. **A failed card returns at the end of the same session, so a session with a move
   that will not come to mind never empties by itself.** That is deliberate: the
   alternative, dropping the card, means the trainee finishes without ever getting it
   right. The session can always be ended from the header. If it turns out to be
   annoying in real use, the fix is a cap on how many times one card can come back.
5. **The export button was not clicked in this session.** It writes a file to the
   browser's downloads folder, which is Nick's machine, so it was left alone. Import was
   driven both ways through the real file input, including a deliberately corrupt file
   that correctly left the saved progress untouched, and the round trip is covered by a
   unit test. Phase 5 replaces the download with a Tauri save dialog anyway.
6. **Review findings, gate 3 (orchestrator).** Chapter 7 carried two sibling "c5"
   branches under Bf4 - the same Black move twice - which rendered two identical
   Study buttons with duplicate React keys and would have double-counted c5 in
   phase 4's steering. Merged into one c5 whose e3 node branches to both
   exercises, and the validator now rejects duplicate Black siblings outright,
   with a negative test; the green suite proves ch7 was the only case. The Bxh7+
   mistake note in exercise 4 claimed the g5 knight was gone; the knight is on f3
   and Ng5+ works - the real refutation is ...Bxg5 by the e7 bishop, and the note
   now says so. SPEC.md section 3 amended to ratify the model-games decision
   (item 2 above), with a register entry. Drill was driven live end to end: all
   three grading paths, FSRS intervals on the buttons, the failed card re-queued
   at session end, and every Progress number reconciled to the card arithmetic.
   Two notes for later: ending a session mid-feedback discards that unrated
   answer (defensible; a thought for phase 5 polish), and the bundle crossed the
   500 kB chunk warning - consider a code-split when the engine worker lands.
   The gate 1 resize fix is correct but undeliverable in a hidden browser pane:
   ResizeObserver callbacks ride the frame loop, so headless checks must call
   redrawAll manually. Real windows are unaffected.

---

## Phase 4 - Play mode and the honest report

Goal: sparring, steered into the repertoire, with truthful feedback.

- [ ] 4.1 `src/engine`: Stockfish WASM in a web worker behind a UCI adapter; vitest
  with the engine mocked.
- [ ] 4.2 Strength scale 1-8 per SPEC.md section 5 guidance (UCI_LimitStrength on the
  top levels, MultiPV randomisation with capped movetime below).
- [ ] 4.3 Steering in `src/play`: weighted book from the repertoire tree; the three
  launch shapes - any defence, this chapter's defence, from here (wire the phase 2
  stub). Tests for book selection and exit.
- [ ] 4.4 Game length caps: to move 10, to move 15, full game.
- [ ] 4.5 Post-game report: first White deviation with book move and note; the
  Black-left-book case handled; blunder scan at fixed effort; verdicts in words;
  eval bar in the report view only. Deviation and verdict logic covered by a
  scripted-game test fixture.
- [ ] 4.6 Engine sanity pass over every ch2 line plus spot checks of ch1 and ch5;
  each finding fixed in content or recorded under Open items.
- [ ] 4.7 Progress: add play stats (games per chapter, deviation rate).

Acceptance: full games complete at strengths 3 and 6; a capped game stops and reports;
a chapter-targeted game reaches the chosen setup; the report is correct on the
scripted fixture; sanity-pass findings dispositioned; vitest green.

- [ ] **Review gate 4 passed**

Open items (phase 4): none yet.

---

## Phase 5 - wrap, polish, ship

Goal: a real Windows app, reviewed against the whole spec.

- [ ] 5.1 Theme and polish pass: dark default, light toggle, consistent layout.
- [ ] 5.2 Rust toolchain and Tauri 2 wrap (first moment Rust touches this machine);
  window title and icon.
- [ ] 5.3 ProgressStore file implementation in AppData; browser-phase export imports
  cleanly into the wrapped app (the migration path).
- [ ] 5.4 Installer via the Tauri bundler; smoke test the installed app on a machine
  or profile without the dev toolchain.
- [ ] 5.5 Self-review against SPEC.md section 9, every item; fix or record each gap.
- [ ] 5.6 Docs sweep: content-schema.md current, SPEC.md deferred register current,
  this plan fully ticked or gaps recorded.

Acceptance: SPEC.md section 9 green on the installed build.

- [ ] **Review gate 5 passed** (final)

Open items (phase 5): none yet.
