# London Trainer - build plan

v2.0, 2026-08-28 (v1 phases 1-5 shipped 2026-08-27). Governed by SPEC.md; where they
disagree, SPEC.md wins. One builder session executes one phase, working in
`C:\Users\nick2\Code\London` on `main`, no worktree. Read SPEC.md in full - section 10
for the v2 phases - then your phase here, before touching code. Every convention below
applies to every phase, v2 included.

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
   Dispositioned at gate 4: auto-queen stands for v1, recorded in the SPEC register.
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

- [x] 4.1 `src/engine`: Stockfish WASM in a web worker behind a UCI adapter; vitest
  with the engine mocked.
- [x] 4.2 Strength scale 1-8 per SPEC.md section 5 guidance (UCI_LimitStrength on the
  top levels, MultiPV randomisation with capped movetime below).
- [x] 4.3 Steering in `src/play`: weighted book from the repertoire tree; the three
  launch shapes - any defence, this chapter's defence, from here (wire the phase 2
  stub). Tests for book selection and exit.
- [x] 4.4 Game length caps: to move 10, to move 15, full game.
- [x] 4.5 Post-game report: first White deviation with book move and note; the
  Black-left-book case handled; blunder scan at fixed effort; verdicts in words;
  eval bar in the report view only. Deviation and verdict logic covered by a
  scripted-game test fixture.
- [x] 4.6 Engine sanity pass over every ch2 line plus spot checks of ch1 and ch5;
  each finding fixed in content or recorded under Open items.
- [x] 4.7 Progress: add play stats (games per chapter, deviation rate).

Acceptance: full games complete at strengths 3 and 6; a capped game stops and reports;
a chapter-targeted game reaches the chosen setup; the report is correct on the
scripted fixture; sanity-pass findings dispositioned; vitest green.

- [x] **Review gate 4 passed** (orchestrator, 2026-08-27)

Open items (phase 4):

1. **The ch2 pawn offer is settled, and it was understated.** Phase 1 recorded 4.Nc3 as
   an unverified gambit. The engine says the opposite of the worry: after 4...Qxb2 5.Nb5
   White is around +1.3, which is clearly better, not scrambling for compensation. The
   notes said "a pawn down with a big lead in development" and now say what is true. The
   engine does prefer 5.Nxd5 there, which holds about +2.9, so Nb5 gives up roughly a
   pawn and a half of it. Nb5 was kept: it is sound, it is clearly better for White, and
   it is the one jump the whole chapter teaches. Worth a ruling if Nick would rather have
   the stronger move at the price of a second idea to remember.
2. **Bg3 against ...Nh5 is about half a pawn behind Be5**, in a position the engine calls
   level either way (loss 0.6 to 0.8 at half a second). Kept for the same reason: one
   answer that works every time, with Be5 already listed beside it as playable.
3. **Stockfish is GPL-3.** It is bundled as a WASM build in public/engine, copied out of
   node_modules at build time. That licence attaches to anything distributed, which
   matters at phase 5 when there is an installer. For one person's own machine it is not
   a problem; it is recorded so nobody is surprised by it later.
4. **The bundle is 532 kB and past Vite's warning line** (gate 3 flagged this coming).
   The engine itself is a separate 7 MB file loaded by the worker, so it is not in that
   number. A code split is a phase 5 polish item, not a correctness one.
5. **The blunder scan is fixed at 150 ms a position.** That is enough to catch what a
   club game throws away and quick enough that a twenty move game reviews in about ten
   seconds. It will miss quiet positional drift. If the reports feel shallow, the number
   is one constant in src/ui/Play.tsx.
6. **The engine pass covered ch2 in full and ch1, ch5 and ch7 by spot check**, which is
   what the plan asked for. ch0, ch3, ch4 and ch6 have not been checked move by move.
   Given that the pass found four real faults in the chapters it did cover, the rest are
   worth the same treatment before v1 is called done. Taken at gate 4: now task 5.7.
7. **Review findings, gate 4 (orchestrator).** Both headline faults were verified by
   hand before reading the fixes: the premature ...Nh5 really does hang the knight to
   Qxh5, and the old ...Bg6 line's c3 really did lose a whole bishop to ...Bxd3. Both
   passed gate 2's human review, which is worth remembering when weighing item 6. A
   real game was driven against the live engine: chapter-targeted steering gave
   1...d5 and 2...c5 from the ch2 book, the engine took over at the exact book exit,
   and the report named the move 3 deviation with the book note, caught a
   deliberately played Qxd4 as an inaccuracy in band words, and showed the eval bar
   in the report only. The play stats record was exactly right. Touches at review:
   the ...Nh5 Bg3 node's vs-bf5 mis-tag came back with the rework and is fixed again;
   Nxd5 is now noted on the Nb5 node as the engine's stronger alternative per the
   theory-fork rule, so item 1 stands settled unless Nick asks for the stronger move;
   the promotion picker is dispositioned to the SPEC register (auto-queen stands for
   v1); and item 6 became task 5.7.

---

## Phase 5 - wrap, polish, ship

Goal: a real Windows app, reviewed against the whole spec.

- [x] 5.1 Theme and polish pass: dark default, light toggle, consistent layout.
- [x] 5.2 Rust toolchain and Tauri 2 wrap (first moment Rust touches this machine);
  window title and icon.
- [x] 5.3 ProgressStore file implementation in AppData; browser-phase export imports
  cleanly into the wrapped app (the migration path).
- [x] 5.4 Installer via the Tauri bundler; smoke test the installed app on a machine
  or profile without the dev toolchain.
- [x] 5.5 Self-review against SPEC.md section 9, every item; fix or record each gap.
- [x] 5.6 Docs sweep: content-schema.md current, SPEC.md deferred register current,
  this plan fully ticked or gaps recorded.
- [x] 5.7 Engine sanity pass over ch0, ch3, ch4 and ch6, the chapters task 4.6 did
  not cover (added at gate 4: the pass found four real faults in the chapters it
  did cover, so the rest get the same treatment before v1 is called done);
  findings fixed or recorded.

Acceptance: SPEC.md section 9 green on the installed build.

- [x] **Review gate 5 passed** (orchestrator, 2026-08-27; v1 accepted with one
  first-run check owed by Nick - open item 9)

Open items (phase 5):

1. **Task 5.7 found three more content faults, all of the same species as phase 4's.**
   The Dutch line challenged the e4 knight with Nc3 when the pawn on f5 is holding it,
   so ...Nxc3 wrecked White's queenside for nothing; it now plays h3 and challenges with
   the other knight, verified to move 10 against the engine's own line. In the ...b6
   line Bd3 was called playable and "the right square", and it hangs g2 to the bishop on
   b7. In the King's Indian chapter e4 was called a good way to take the centre while
   being undefended, and Nxe5 was called a mistake on a refutation that does not exist
   because the knight on f6 blocks the bishop. All eight chapters have now had the pass.
2. **Two moves are deliberately half a pawn to a pawn and a half behind the engine's
   first choice** (carried from phase 4): 5.Nb5 after the b2 offer, and Bg3 against
   ...Nh5. Both are sound, both are the one idea their chapter teaches, and both are
   recorded with numbers in case Nick would rather have the stronger move.
3. **The installer is unsigned.** Windows SmartScreen warns on first run, which is what
   an unsigned installer looks like rather than a fault. Signing needs a certificate;
   ruled into the SPEC.md register along with auto-update.
4. **Stockfish is GPL-3 and is bundled.** That binds anything distributed. For one
   person's own machine it is not a problem; it is written into SPEC.md section 5 so it
   is not a surprise later.
5. **A hidden browser pane throttles React's scheduler**, which cost real time in this
   phase. A move played through synthetic events lands in the session immediately but
   the screen can take a second or more to catch up, which reads exactly like a broken
   re-render. It was not one. Any future headless check must poll for the DOM to change
   rather than read once and conclude. The same throttling hid chessground's shapes in
   phase 2, so this is the second time it has been mistaken for a bug.
6. **Two checks need a human, because this session had no display.** The installer is
   built and the binary it installs has been run, but nobody has clicked through the
   installer itself: the silent flag left it waiting on a dialog that could not be seen,
   so it was stopped rather than left on screen. And nobody has moved a piece in the
   packaged window: the board ignores synthetic events outside dev builds, which is
   exactly what makes that check impossible and what makes the shipped build safe.
   Everything either side of both is verified, and docs/v1-acceptance.md says so item by
   item.
7. **The wrapped app writes progress where it should, which took a fix.** The first
   packaged run opened the window, rendered, saved its theme and saved no progress: the
   folder under AppData does not exist until something creates it, and asking for it by
   base directory with an empty relative path creates nothing. Paths are resolved in
   full now. The migration path was then driven in the shipped app: a version 1 browser
   file was read, migrated to version 3, and both learnt lines survived.
8. **The engine pass method has a blind spot worth naming.** It compares the evaluation
   before and after each White move, which finds moves that give something away. It
   does not check Black's replies or the weights, so a line where the repertoire is fine
   but the Black move chosen is unrealistic would pass unnoticed. Nick's own games are
   the check for that, which is what the deferred own-game import is for.
9. **Review findings, gate 5 (orchestrator).** Suite and production build re-run
   green at 231 tests. The Tauri capability file, store, backup and theme modules
   read in full: the grants match their stated reasons, paths resolve in full, and
   the browser build stays free of the Tauri API through lazy imports. Verified
   independently on the shipped binary: london-trainer.exe launched, the window
   confirmed, and progress.json found under AppData as version 3 still carrying
   both learnt lines from the builder's migration test, which confirms the mkdir
   fix and the migration in one check. Closing the packaged-window input check
   with real OS input was attempted and is not possible from this session (the
   access layer resolves installed applications only), so it folds into the
   installer click as Nick's single first-run task: install, open, play one move.
   The csp null default is now a register entry. And a correction to this plan's
   own record: task 5.7's ch3 finding disproves a gate 3 review claim - the
   "verified arithmetically" capture sequence relied on a bishop recapture that
   Black's own f6 knight blocks. The engine pass has now corrected the human
   review three times; treat any chess prose as unverified until a pass has been
   over it, including a reviewer's. Closed 2026-08-27: Nick ran the installer and
   played a move in the installed app. Nothing is owed; v1 is green in full.

---

## Phase 6 - v2: the course model

Goal: everything below the UI understands courses, and the London becomes the first
one with nothing visibly changed. SPEC.md section 10 governs phases 6 to 8.

- [x] 6.1 The manifest: `course.json` schema (id, title, colour, tagline, chapter
  order, format version, tag extensions) documented in docs/content-schema.md;
  `content/` moves to `courses/london-white/` with a manifest; the loader takes the
  student colour and prefixes chapter and line ids with the course id; a manifest
  with a newer format version is refused, the progress-file rule.
- [x] 6.2 The schema's colour rules generalised to student and opponent per SPEC.md
  section 10; loader tests cover a Black-course fixture, including a stem that
  starts with the opponent's move.
- [x] 6.3 Cards scoped by course: identity is course id plus position key; dedup and
  the conflict rule stay within a course; tests prove two courses can teach
  different moves from one position without corrupting each other.
- [x] 6.4 Book, session and report generalised: student and opponent maps,
  playStudent and playOpponent, the engine able to open the game, the report
  scanning the student's moves; tests with the engine mocked, both colours.
- [x] 6.5 Progress version 4: course-scoped line ids, card keys, play records and
  per-course tag history; the migration assigns all existing data to london-white;
  a migration test runs a real v3 shape through and loses nothing.
- [x] 6.6 The content suite runs per course: quality bar parameterised by student
  colour, vocabulary from core plus manifest extensions.

Acceptance: vitest green; the app runs with the London as the single course and the
UI behaving exactly as v1; Nick's real progress file migrates in place (verified on
a copy first); a hand-built Black fixture course loads, drills and plays in tests.

- [x] **Review gate 6 passed** (2026-08-28)

Open items (phase 6):

1. **The card key format is now part of the progress file, not an implementation
   detail.** A card is `<course>#<position>` and a line is `<course>/<chapter>:<moves>`,
   built in `src/model/ids.ts` and read back by the version 4 migration. Two separators
   because a position key carries slashes and spaces of its own, so a card key needs one
   a FEN cannot hold. The consequence worth stating: a course id can never change once
   the course has shipped, because it is written into every key hanging off it. The
   manifest validator refuses an id containing either separator.
2. **Nick's real progress file was migrated on a copy, and again in the running app.**
   The copy from `%APPDATA%\com.nick.london-trainer\progress.json` read as version 4
   with both learnt lines intact, and each migrated id resolved to a line that really
   exists in the loaded content - which is the check that matters, since an id that
   migrates to a name nothing answers to would look fine in the file and show nothing in
   Study. The same file was then put through the dev app: 2 of 41 lines learnt, 17 cards,
   and the chapter rows reading 1 of 7 and 1 of 4 exactly as v1 did. **His actual file is
   untouched**; the app will migrate it on its next run.
3. **A file in a course folder that the manifest does not list is now an error.** Not in
   the spec, and worth saying why it was added: it is content nobody will ever see, and
   silence about it is how a chapter goes missing for a month. It costs an author one
   line in the manifest.
4. **Drill and Progress already read across courses, ahead of their phase 7 views.**
   The queue is built with `buildCardsAcross(courses, ...)` and the play stats span every
   course, because the model supports it and the ruling asks for it. What is still
   single-course is the SCREEN: Progress shows one course's rows and Study and Play use
   `currentCourse`, which is `courses[0]`. Phase 7 replaces those three call sites with
   the catalog and the switcher.
5. **The tag vocabulary split is a behaviour change for authors, not for Nick.** A course
   may use the core ten plus whatever its manifest declares, and nothing else. The London
   declares its six `vs-` tags, so its content is unchanged; a future course that forgets
   to declare a tag fails the validator rather than quietly widening the vocabulary.
6. **The Black fixture course is a test fixture, not content.** It lives in
   `src/test/fixtures.ts` and is four moves of a Caro-Kann. It exists to prove the colour
   rules generalised rather than being renamed: its stem starts with the opponent's move,
   so the loader, the book, the session and the report are all exercised from the other
   side. The real Caro-Kann is phase 8, and nothing here is a head start on its content.
7. **The board still cannot be driven in a hidden browser pane without a viewport.**
   Carried from phase 5 and worth adding to: the pane reports a zero WIDTH, so
   chessground's hit-testing maps every click to the same square and a synthetic drag
   does nothing at all. Calling `resize_window` with a real size, then `redrawAll`, fixes
   it, and after that a drag drives Drill and Play end to end. That is how this phase
   checked the grading, the steering and the report live rather than only in tests.
8. **What the review verified independently (gate 6).** The full suite (283 tests),
   tsc and oxlint were re-run: green, and the four lint warnings predate the phase
   (checked against a worktree at the pre-phase commit). The migration was re-proven
   three ways without leaning on the builder's account: a scratch test ran a fresh
   copy of Nick's real AppData file through `parseProgressJson` and confirmed both
   learnt ids resolve to lines in the loaded content; the same v3 shape was seeded
   into the dev app's localStorage and the running app showed 2 of 41 learnt, 17
   cards, rows 1 of 7 and 1 of 4, then wrote version 4 back with course-scoped ids;
   and the real file was confirmed still at version 3, untouched. One comment fixed
   in passing: the session's length-cap note said the cap lands when White completes
   the move number, but `completedFullMoves` counts completed pairs, so it lands when
   both sides have.

---

## Phase 7 - v2: the catalog shell

Goal: the app becomes Repertoire Trainer, with the catalog as its front door and
drop-in courses working on the desktop.

- [x] 7.1 Catalog home: one tile per course (colour, title, tagline, learnt lines,
  due count) plus overall numbers; entering a course scopes Study and Play to it; a
  header switcher changes course without returning home.
- [x] 7.2 Drill and Progress move to the top level: one due queue across all courses
  with each card naming its course and a per-course filter; Progress shows the
  rollup and each course, weak areas per course.
- [x] 7.3 External courses: the desktop app scans the AppData `courses` folder at
  startup (capability grant for that folder only), merges valid courses in, shows a
  failing course in the catalog with its errors, and refuses to shadow a bundled
  course id. The browser dev build sees the bundled set only.
- [x] 7.4 The rename: Repertoire Trainer as display name, window title and installer
  name; the identifier stays `com.nick.london-trainer`; tagline updated.
- [x] 7.5 Drop-in proof: a copy of the London course with a changed id and title,
  dropped into the AppData folder, appears in the catalog after restart and its
  cards join the drill queue - which also exercises the cross-course queue with
  real content before phase 8 exists.
- [x] 7.6 Docs sweep and installer rebuild; the installed app updates in place with
  progress intact.

Acceptance: catalog navigation end to end; the drop-in proof passes with no source
change; one cross-course drill session driven live; vitest green; the installer
ships as Repertoire Trainer and updates the existing installation.

- [x] **Review gate 7 passed** (2026-08-29)

Open items (phase 7):

1. **This phase destroyed Nick's saved progress, and then found out why.** Running the
   packaged app read his progress file, failed, and saved a blank state straight over
   it. Both learnt lines were gone. They are back: the file is version 4 with both
   lines, verified in the running app as "2 of 41 lines learnt, 17 due now". Nothing
   else was in the file - no card schedules, no tag history, no games - so nothing else
   could be lost. It was restored from a copy this session had taken earlier, which is
   luck rather than design.
2. **The cause was a capability grant that never worked, and a store that turned that
   into data loss.** `fs:allow-exists` was granted `$APPDATA/*`, and that pattern does
   not match `progress.json`: `exists` on the file came back "forbidden path" while
   `read_text_file` on the same path succeeded, because reading was separately covered
   by `$HOME/**`. So `load()` threw at its first line, caught it, returned a blank
   state, and the provider's save effect wrote that blank state to disk. Two fixes,
   because either alone would have left the other. The capability now names literal
   paths (`$APPDATA/progress.json`, `$APPDATA/courses`, `$APPDATA/courses/**`) rather
   than trusting a wildcard, and it is tighter than before as a result. And `load()`
   now REPORTS a failure instead of quietly returning a blank state: the app refuses to
   save anything while a read has failed, and says so across the top of the window.
   Proven on the machine: a deliberately corrupted progress.json produced the notice
   and was still byte-for-byte corrupt afterwards, where the old code would have
   replaced it.
3. **This should have been caught at phase 5, and the lesson is about the verification,
   not the code.** Phase 5 recorded the migration as proven in the shipped app. The
   grant it was proven under is the one that fails here, so either that check was
   thinner than its record says or something moved since. Either way: the packaged app
   is a different program from the dev build, and a store that fails soft will pass any
   test that only asks "did the app open".
4. **The packaged window can be driven after all, which is new.** Phase 5 recorded that
   the shipped app cannot be checked because it ignores synthetic events. It still does,
   but the window is a WebView2 and honours
   `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9333`, so the whole
   page can be read and its buttons clicked over the DevTools protocol. Everything in
   items 1, 2 and 5 was verified that way against the real installed-shape binary. The
   client is about a hundred lines of Node with no dependencies and is now in the repo
   as `scripts/packaged-eval.mjs`, because phase 8 will want it. What still cannot be
   driven is the BOARD, because that is the part that needs a trusted event.
5. **The drop-in proof passed in full, including both refusals.** Four folders were put
   in `%APPDATA%\com.nick.london-trainer\courses`: a copy of the London with a changed
   id, a course with an illegal move in it, and a copy claiming the bundled
   `london-white` id. The catalog showed the copy with its own progress ("1 of 41 lines
   learnt, 8 due"), the broken one saying `"Bf7" is not legal in this position at
   d4 d5 Bf7` and loading nothing else, and the shadow attempt refused by name. The
   drill queue mixed both working courses - 17 cards, 9 from one and 8 from the other -
   and the filter narrowed it to 8. Progress showed the rollup and a block each. All
   four folders have been removed; the app is back to the one bundled course.
6. **The rename does not update the existing installation, and SPEC.md has been
   corrected.** Tauri's NSIS keys its uninstall entry on the product name, not the
   identifier: the v1 install is at `HKCU\...\Uninstall\London Trainer` and
   `C:\Apps\London Trainer`, with no key under `com.nick.london-trainer` anywhere. So
   the new installer registers a second application. Progress is untouched either way,
   because that lives under the identifier. Nick uninstalls "London Trainer" once by
   hand. An NSIS hook could do it for him and is in the register with the reason it was
   not taken.
7. **Nobody has clicked through the installer, again.** It builds
   (`Repertoire Trainer_1.0.0_x64-setup.exe`, 6.9 MB) and the binary it installs has
   been run and driven hard. The installer's own UI needs a human, exactly as at phase
   5. The stale `London Trainer_1.0.0_x64-setup.exe` beside it has been deleted so there
   is one artefact.
8. **The catalog is the front door every time the app opens, which is one extra click
   with one course.** That is the ruling and it is right once there are two, but worth
   a look in use. Remembering the last course opened would remove it and is a small
   change; not made, because nobody has asked for it and a front door that sometimes
   is not the front door is worse than a click.
9. **The external scan happens once, at startup.** A course dropped in while the app is
   open appears after a restart. Deliberate: a course discovered halfway through a drill
   session would change the queue under the trainee's hands. The catalog says "restart
   the app" on screen.
10. **What the review verified independently (gate 7).** The suite (299 tests), tsc and
   lint re-run green. The packaged binary was driven over the DevTools protocol with
   `scripts/packaged-eval.mjs`, after backing up the progress file and recording its
   hash: the catalog opened as Repertoire Trainer with the real progress on the London
   tile; the drop-in proof was restaged from scratch (a clone with a changed id, a
   folder with an illegal move, a shadow claiming `london-white`) and all three behaved
   as item 5 records; with a clone line marked learnt the drill queue read 26 = 17 + 9,
   the filter narrowed it to 9, and the live card named its course. The read-failure
   protection was re-proven two ways: the `.read-failure` style is present in the
   shipped binary's bundle, which settles that the 21:59 build contains the 22:03
   commit's code, and the failure path was exercised live in the dev build, where the
   notice showed and the corrupted stored text was still byte-for-byte untouched
   afterwards. The review's attempt to re-run the corruption test against the real
   packaged file was blocked by the session's permission layer (writing garbage over
   the user's file looks like what it is), so the builder's own record stands for that
   exact variant, backed by the equivalent checks above. Nick's progress file was
   restored to its pre-review bytes, hash-verified, and the AppData courses folder
   removed. Two small fixes landed at review: failure messages get a terminating full
   stop before the notice continues the paragraph, and the inspector's mangled usage
   comment line was straightened.

---

## Phase 8 - v2: the Caro-Kann course

Goal: the second course, Black against 1.e4, proving the whole structure with real
content.

- [x] 8.1 Course design: chapter list for a club-level Caro-Kann repertoire (the
  main line, the Advance, the Exchange, the Panov, sidelines and move-order tricks,
  a tactics-and-plans chapter), agreed with Nick before drafting.
- [x] 8.2 Draft the chapters to the SPEC.md section 3 bar, colour rules
  student-relative: every move noted, plans on leaves, mistake minimums, weights
  giving White's club-level choices, tags from core plus this course's extensions.
- [x] 8.3 The engine pass over every student move before the course is called done -
  the standing rule; findings fixed or recorded.
- [x] 8.4 Ship it bundled; Play mode verified with the engine opening the game and
  the book steering White's moves by weight; drill cards verified against the
  London's for key collisions (there must be none, by course scoping).

Acceptance: the course meets the quality bar with the engine pass recorded; Study,
Drill and Play work end to end as Black; the London is untouched; vitest green.

- [x] **Review gate 8 passed** (2026-08-29)

Open items (phase 8):

1. **Nick ruled the chapter list and the two repertoire forks before any drafting.**
   Seven chapters, as proposed. In the main line 4...Bf5, the classical, chosen over
   the Karpov 4...Nd7 and the Tartakower 4...Nf6: it gets the problem bishop outside
   before ...e6, which is the whole justification for the opening, and its long
   sequence is one idea repeated rather than a list to learn. Against the Advance
   3...Bf5 for the same reason, over the lower-theory 3...c5.
2. **The engine pass found thirteen student moves that cost half a pawn or more, and
   two of them were real blunders.** Method: Stockfish 18 lite over every student
   move, 500 ms a position, evaluating before and after and reporting anything that
   cost 0.5 of a pawn or more, with a second pass at 2500 ms and MultiPV on each
   finding to see what the engine would have played instead. The tooling is now in
   the repo as `scripts/engine-pass.mjs` and `scripts/engine-ask.mjs`, because every
   phase so far has rebuilt it by hand. Ten findings fixed, three checked at longer
   time and kept. What it caught:
   - The Advance main line let White trade off the knight on f3, the only piece
     defending e5, and then had Black play a quiet developing move instead of taking
     the free pawn. Worse, after 10.c3 the answer is not even ...Nxe5 but ...Nxe3
     first, which wins the same pawn and wrecks White's kingside. White now plays the
     sound 9.Bb5, and the loose version is a lower-weighted branch that says what to
     do about it. The punishment became exercise 1.
   - The Panov exercise had White playing 11.Bg5 where it simply hangs to ...Bxg5 and
     ...Qxg5, and Black answering ...Bb7.
   - The Panov chapter kept the blockading knight on d5 and played ...b6, which leaves
     h7 with nothing guarding it against Bxh7+ and Ng5+. The knight now steps back to
     f6 first, which is the lesson: the blockade is not worth a mating attack.
   - Against the Fantasy, ...Qh4+ wins the pawn back with check and leaves White's king
     in the middle. The chapter played ...c5 and let White consolidate.
   - Two exercise answers were merely second best, which for an exercise is as bad as
     wrong.
3. **One blunder the engine did not find, because a person did.** Chapter 3 played
   10...Bd6 in a position where Black's own bishop on d7 shuts the queen in, so
   11.Bxd6 cannot be answered and it drops a piece. It was spotted while building the
   exercise that ran through that position rather than by the pass. It is now taught
   as a graded mistake entry on the ...Be7 node, which is the best home for it.

   **The reason first recorded here was wrong, and gate 8 measured it.** This item
   claimed the pass cannot see a move that invites a refutation, because the loss only
   appears on the opponent's next move. That is not how the pass works: it SEARCHES
   the position after the student's move, so a refutation inside the search horizon is
   already priced in. Run on this exact position pair, the pass reports ...Bd6 as
   costing 3.97 at 500 ms against ...Be7's 0.11 - eight times the threshold and the
   top line of any report it appeared in. A move that hangs a piece to an immediate
   recapture is therefore NOT a blind spot.
   The real lesson is about timing, and it is a process rule rather than a tool
   limit: **a pass is only evidence about the content that existed when it ran.**
   This one was authored after the pass had been over chapter 3, so nothing had ever
   looked at it. Re-run the pass after the last content edit, which is what gate 8
   did - see item 12.
4. **A phase 6 or 7 escape, found by using the app rather than reading it.** The Play
   launcher offered "Any defence" and "This chapter's defence", and the play stats
   labelled untargeted games the same way. In a Black course the opponent is the side
   choosing an opening, so the word only fits half the courses. Fixed at the root with
   a test, as its own commit. The colour rules were generalised in phase 6; the copy
   sitting above them was not, and no test could have caught it because no test read
   the words.
5. **`tsc --noEmit` and `tsc -b` do not check the same files.** The suite and
   `npx tsc --noEmit` were both green with a test fixture missing a required field;
   `npm run build` failed on it, because the build config covers the test files and the
   bare `--noEmit` invocation does not. Any future "types are clean" claim should say
   which one it ran.
6. **One finding kept rather than fixed.** In chapter 1's 5.Bd3 sideline, 5...Bxe4 is
   about a quarter of a pawn behind 5...Qxd4 at 2500 ms, and dead level in absolute
   terms. It is a branch weighted 2 that keeps the chapter's one idea, so it stands.
   Two others in the same band were kept for the same reason.
7. **The engine pass still has the blind spot recorded at phase 5, and it bit here.**
   It judges the student's moves only. Half the faults above were really White moves
   that no club player would choose, which the pass reports as Black failing to punish
   them. Reading a finding therefore means asking which side is actually at fault. The
   White weights were sanity-checked by hand against what club players play, and that
   check has no test behind it. This one is real, unlike the blind spot item 3 claimed:
   the pass never evaluates a position where the opponent is to choose, so nothing in
   it can object to an opponent move nobody would play.
8. **Play, Drill and Study were driven live as Black in the dev build.** The engine
   opened the game with 1.e4, the book steered White through 2.d4, 3.Bd3, 4.Bxe4 and
   5.Bf3, all authored moves and one of them weighted 2, which is the weighting doing
   its job rather than the engine choosing. The engine took over at the exact book exit
   with 6.a4 and the report named it: "White left the repertoire on move 6 with a4".
   Drill mixed 13 Caro-Kann cards with 10 London ones in one queue, graded a correct
   ...c6 with its authored note, and graded a deliberate 2...d6 as the authored
   inaccuracy with both the mistake note and the reason for ...d5.
9. **The packaged app was checked, and Nick's progress file came back byte for byte.**
   Hashed and copied to scratch before the run, per the standing rule that cost this
   project two learnt lines in phase 7. The installed-shape binary showed both courses
   with the real progress on the London tile, opened the Caro-Kann with all seven
   chapters, and left the file at the same SHA256 afterwards. `window.__cg` is absent
   in the packaged build, which is the dev-only board hook behaving as designed.
10. **Nobody has clicked through the installer, for the third phase running.** It
   builds (`Repertoire Trainer_1.0.0_x64-setup.exe`) and the binary it installs has
   been driven over the DevTools protocol. The installer's own UI needs a human. The
   separate "London Trainer" entry from phase 7 is still Nick's one manual uninstall.
   **Closed 2026-08-29**: Nick ran the installer, clicked through it, opened the app,
   and uninstalled "London Trainer". Nothing is owed; v2 is accepted in full.
11. **The chapter 6 exercises are shallower than the chapter title suggests.** Two of
   the four end on a genuine tactic (...Nxe3 winning a pawn and the kingside, and the
   ...Na5 resource inside exercise 3's line); the other two end on a plan move, ...c5
   and ...g6. That matches the London's chapter 7, where only one of four is a
   sacrifice, and it is worth saying out loud: this chapter teaches typical positions,
   not puzzles. A real puzzle set would need positions built for the purpose and each
   one engine-verified, which is a bigger job than a chapter.
12. **What the review verified independently (gate 8).** The suite (337 tests) and
   `npx tsc -b --force` re-run green, and the London's content is byte-identical to
   its gate 7 state. **The engine pass was re-run from scratch over the final
   content**: 160 student moves, 317 positions at 500 ms, and only two findings
   survived - the ch1 ...Bxe4 and ch2 ...h6 that item 6 records as deliberately kept.
   Both were then re-checked at 2500 ms, where ...h6 falls to 0.37 (under the
   threshold, so noise) and ...Bxe4 sits at 0.54 in a position the engine calls 0.28,
   which is level. So the fixes hold and nothing new was introduced by them - the
   check item 3's correction is really about.
   Exercise 1 was verified against the engine rather than taken on trust, since the
   phase built a branch around it: the position is -2.27 for Black, **the engine's own
   first choice is ...Nxe3**, and taking the pawn first with ...Nxe5 instead costs
   0.83 - which is exactly the move-order lesson the exercise teaches. The chapter 3
   trap was confirmed by hand: after 10...Bd6 11.Bxd6 chess.js reports zero legal
   recaptures on d6.
   Driven live as Black in the dev build: the catalog shows both courses, Study opens
   the Caro-Kann with the board `orientation-black`, and a real game ran through the
   board - the engine opened 1.e4, the book steered 2.c4 and 3.exd5, and the report
   read "You stayed in the repertoire for the whole game" with a Level verdict.
   Nick's progress file was hashed before and after and is unchanged from its gate 7
   bytes; the AppData courses folder is empty. One test renamed at review: the
   two-courses position test claimed to prove course scoping was load bearing while
   asserting the opposite, so it now says what it actually checks.

---

## Phase 9 - the Slav: a Black answer to 1.d4

Goal: the third course, and the first built on a structure the app already proves.
Nick asked for an easy-to-learn answer to 1.d4 on 2026-08-29 and ruled the opening,
the chapter list and the main-line fork the same day, so this phase needs nobody:
it runs start to finish unattended. `chips/phase-9-slav.md` is the builder prompt.

The rulings, so the plan carries them and not only the chip:

- **The Slav**, 1.d4 d5 2.c4 c6, chosen over the King's Indian, the Stonewall Dutch
  and the Queen's Gambit Declined. It puts Black's pawns on c6 and d5, which is the
  Caro-Kann structure one file across, and it obeys the same rule: the light-squared
  bishop comes out before ...e6. The whole Black repertoire then runs on one
  structure, which is the London's "one setup" idea applied to Nick's Black games.
- **Against the main line 4.Nc3, the course plays 4...dxc4 5.a4 Bf5.** It is the
  answer that actually delivers the bishop outside, which is the through-line of the
  repertoire. The a6 Chebanenko was the lower-theory option and was not taken: its
  plans are more flexible and therefore easier to play aimlessly.
- **Seven chapters**, in the shape both other courses use - organised by what the
  opponent does, a concept chapter first and exercises last.

- [x] 9.1 The course folder and manifest: `courses/slav-black/`, id `slav-black`
  (permanent once shipped), colour black, tag extensions declared.
- [x] 9.2 ch0 the defence and its ideas: the c6 and d5 structure, the bishop rule,
  the ...c5 break, and what carries over from the Caro-Kann. Concept chapter,
  intro 300-500 words, mistake entries on at least four setup decisions.
- [x] 9.3 ch1 the main line 3.Nf3 Nf6 4.Nc3 dxc4 5.a4 Bf5, to the section 3 depth.
- [x] 9.4 ch2 the quiet build-up (4.e3 and 4.Bf4), where the bishop comes out easily.
- [x] 9.5 ch3 the Exchange Slav 3.cxd5, including how Black plays it for more than
  a draw rather than shaking hands.
- [x] 9.6 ch4 sidelines and move-order tricks: early queen sorties, g3 and Catalan
  setups, and the order care around ...Bf5 meeting Qb3.
- [x] 9.7 ch5 White without c4: the London, Colle and Torre. Nick plays the London
  as White, so this chapter is his own repertoire seen from the other side.
- [x] 9.8 ch6 typical tactics and plans, the exercises.
- [x] 9.9 The engine pass over every student move, **run after the last content
  edit** (phase 8 open item 3): findings fixed or recorded with numbers.
- [x] 9.10 Ship it bundled: the course's own numeric block in the content suite,
  card keys proved disjoint from both other courses, Play driven live with the
  engine opening the game, docs swept, installer rebuilt.

Acceptance: the course meets the SPEC.md section 3 quality bar with the engine pass
recorded; Study, Drill and Play work end to end; the London and the Caro-Kann are
untouched; vitest green; the packaged app shows three courses and Nick's progress
file is unchanged.

- [x] **Review gate 9 passed** (2026-08-29)

Open items (phase 9):

1. **The phase ran unattended, start to finish, which is what the chip was for.**
   Nick ruled the opening, the seven chapters and the main-line fork on 2026-08-29
   before any drafting, so no decision had to wait for him. Phase 8 stopped for a
   chapter list; this one stopped for nothing.
2. **The engine pass over the student moves found eight, and one was a lost game.**
   Method as at phase 8: Stockfish 18 lite, 500 ms a position, every finding
   re-checked at 2500 ms with MultiPV before anything was changed. What it caught:
   - Chapter 2's main quiet line had White playing 10.Qc2, which loses on the spot
     to 10...Bxh2+, and Black answering with a developing move. The bishop cannot be
     taken: the rook on h8 defends h2 down the file that ...hxg6 opened eight moves
     earlier, so 11.Kxh2 is not a legal move at all. White now plays the sound 10.h3,
     the blunder is a weighted branch that wins for Black, and the sacrifice became
     chapter 6's first exercise.
   - Against 4.Bf4 the course's own rule does not hold. With a bishop on f4 backing
     it, 4...Bf5 5.Qb3 Qb6 6.c5 clamps the queenside and Black has no comfortable
     break, so the course takes on c4 instead, which is what chapter 1 does anyway.
   - The Colle line allowed 5.dxc5, the engine's first choice and the move a Colle
     player rarely finds. It is now a branch of its own, answered by ...e5.
   The final pass leaves four findings, all between 0.55 and 0.65 at 500 ms, all
   re-checked at 2500 ms and all noise or judgement calls: see item 5.
3. **The bigger finding is what the first pass cannot see, and it needed a second
   tool.** `scripts/engine-pass.mjs` checks the moves the course tells the trainee to
   play. It never looks at the graded alternatives beside them, and those are half
   the teaching: a mistake entry says a move is wrong and says why. Three of this
   course's entries named a punishment that loses material for the side supposedly
   doing the punishing. The worst called 6...Qc7 a mistake "because 7.Qxd5 wins a
   pawn", when 7.Qxd5 loses a piece to 7...Qxc1+ and 6...Qc7 is in fact the best
   move in the position. So the phase built `scripts/engine-mistakes.mjs`, which
   evaluates every mistake entry against the repertoire move and reports where the
   grade and the engine disagree. It found eight, including ...Bf5 against the Colle
   and ...Bf5 against 4.Qc2, both graded "playable" and both simply hanging a bishop.
   The mistake pass reports nothing at all on the finished course, and the move pass
   is down to the four judgement calls in item 5.
4. **A line in the plan did not survive the engine.** Task 9.4 describes chapter 2 as
   "the quiet build-up (4.e3 and 4.Bf4), where the bishop comes out easily". Half of
   that is right. Against 4.e3 the bishop comes out for free; against 4.Bf4 it is the
   one line in the course where ...Bf5 is not the move. The chapter says so in its
   own intro rather than pretending otherwise, and the plan's one-line description is
   left as written, because it is a record of what was asked for.
5. **Four findings kept, with their numbers.** Chapter 4's two fianchetto lines both
   end on ...Be7, which the engine puts 0.62 and 0.44 behind its own choice at 2500 ms
   and at +0.41 and +0.19 in absolute terms: an ordinary opening pull rather than a
   fault, and in one of them the engine's preference is the waiting move ...h6, which
   is not a lesson worth teaching a club player over finishing development. Taking on
   c4 is recorded as a graded alternative in both, with the engine's preference stated.
   In chapter 5's Colle, 4...Nc6 reads as a loss only because it allows 5.dxc5, which
   is now a branch of its own, so the number is the pass reporting White's best reply
   rather than a fault in Black's move. The anti-London line's 10...Be7 measured 0.51
   at 500 ms and 0.25 at 2500 ms, where the engine prefers 10...b5, which is the move
   the leaf's own plan already names. All were left as they are, deliberately.
6. **A gap in the London course, found by writing the Slav.** Chapter 5 answers
   5.c3 Qb6 6.Qb3 with 6...c4, and the London course's chapter 2 covers only
   6...Qxb3. The chip put the other courses out of scope, so this went to the SPEC
   section 6 register rather than into White's content. It is a hole in the
   preparation rather than an error in it, and Nick will meet it from both sides.
7. **What neither pass can see, which matters before reading a clean report.** The
   student's moves and the graded alternatives are now covered. The opponent's own
   moves and the frequency weights are not, so a line where the repertoire is sound
   and White's move is one no club player would choose still reads as clean. And
   neither pass reads the prose: a note can name a punishment that does not exist
   while the grade beside it is perfectly fair, which is exactly what three of this
   course's notes did. Those were caught by hand, by grepping every note that made a
   concrete material claim and checking each one.
8. **Study, Play, Drill and Progress were driven live as Black.** The engine opened
   with 1.d4, the book steered White through 2.c4, 3.Nf3, 4.Bf4, 5.e3, 6.Be2 and
   7.O-O, every one an authored move, and took over at the exact book exit with 8.b3.
   The report named it: "White left the repertoire on move 8 with b3". Drill mixed 10
   London cards with 5 Slav in one queue, the per-course filter narrowed it to the
   Slav, and both a correct answer and a deliberate Qxd5 were graded with their
   authored notes. Progress showed the Slav's chapters, its concepts and the game.
9. **The packaged app shows three courses and read Nick's real progress.** It opened
   with "2 of 41 lines learnt, 17 due now" on the London tile, which is his data
   rather than a blank state, and the Slav opened with all seven chapters. The file
   was hashed and copied to scratch before the run, per the rule that cost this
   project two learnt lines at phase 7, and it came back byte for byte at
   SHA256 DB071A7F...A741. Nothing was left in the AppData folder.
10. **The lint bar is six warnings, not the four recorded at gate 6.** All six are
   pre-existing and none is from this phase: two each in progress-context and
   catalog-context about fast refresh, one in PlayableBoard, one in Play. A seventh,
   an unused import in the phase 8 engine pass, was removed in its own commit.
11. **The exercises are better than phase 8's and still not a puzzle set.** Three of
   the five end on a genuine tactic now rather than two of four, and the chapter says
   so in its own intro. The other two end on a decision, which is honest and is not
   what a chapter called "typical tactics" promises. The register item from phase 8
   stands.
12. **"Quiet" is not a stable answer at 500 ms, and the threshold is where it wobbles.**
   The finished course was passed four times over identical content and reported two,
   three, three and four findings. Every one of them came from the same small set
   hovering around the 0.5 line, and the mistake pass did the same: one entry landed
   at 0.62 on one run and outside the band on the next, and at 2500 ms it measured
   1.06, which made the original grade right. So a report is a list of things to look
   at, not a verdict, and the re-check at 2500 ms is the part that decides. Running
   the pass twice and reading both is cheap; treating one clean run as proof is not.
13. **A trap worth knowing for the next session on this machine.** `$TMPDIR` is empty
   in the Bash tool here, so `"$TMPDIR/scratch.py"` resolves to the filesystem root
   and writes into `C:\Apps\Git`. Six files went there before it was noticed, and
   they were moved out. That directory already holds a couple of dozen stray files
   from earlier sessions, which suggests this is not the first time. Use the absolute
   scratchpad path.
14. **What the review verified independently (gate 9).** 371 tests and `tsc -b --force`
   green; the London and the Caro-Kann untouched by the phase itself. Both passes were
   re-run from scratch over the finished Slav: the mistake pass reports **0**, and the
   move pass reports **3**, all between 0.57 and 0.60 and all three the ones item 5
   records as kept - which also lands inside the two-to-four spread item 12 predicts.
   The two headline claims were checked with chess.js rather than believed. After
   10...Bxh2+ White's only legal move is Kh1: nothing on the board can capture on h2,
   exactly as the note says. And 7.Qxd5 really does lose a piece to 7...Qxc1+, leaving
   Black two points up. The 9.Nxd5 Nxd5 10.Qxd5 sequence in chapter 2 was challenged
   and stands: after it there is no recapture on d5 and White is a clean pawn ahead.
15. **The new tool found unfixed faults in the two OLDER courses, which is the gate's
   real finding.** `scripts/engine-mistakes.mjs` had only ever been run on the Slav.
   Run at review on the others it disagrees with 27 of the London's 190 mistake
   entries and 12 of the Caro-Kann's 107, against 0 for the Slav. Three Caro-Kann
   faults were verified by hand and fixed in their own commit: `...Bf5` graded
   **playable** in two Exchange positions where 7.Bxf5 simply wins the bishop because
   nothing recaptures - the identical species phase 9 fixed in the Slav - and an
   Advance note claiming 6.Nxe4 wins a bishop when 6...dxe4 takes back. That last one
   is the case phase 9 named as having no checker: the grade was fair, so the mistake
   pass could not see it, and only reading the prose finds it. The rest of the sweep is
   a phase of work and went to the SPEC section 6 register rather than into this gate.
   The lesson for the delivery loop: **a new checker is a claim about every course, not
   just the one it shipped with**, and the chip that builds one should say who runs it
   over the back catalogue.
16. **A calibration note on the mistake pass, from running it on a system opening.**
   Its "graded too harshly" direction is mostly noise on the London: a system
   repertoire's mistake entries are positional judgements the engine scores at nothing,
   so "1.d4 d5 2.e3" is graded a mistake, costs 0.06, and the grade is still right for
   a course whose entire subject is getting the bishop out first. Sixteen of the
   London's 27 fall that way. The "graded too kindly" direction is where the real
   faults sit. Worth knowing before anyone reads a 27-line report as 27 bugs.
   Counted exactly when the chip was written: the London splits 13 too kindly and 14
   too harshly, the Caro-Kann 10 and 2.

---

## Phase 10 - the mistake-entry sweep of the London and the Caro-Kann

Goal: finish what gate 9 started. The mistake pass built in phase 9 had only ever run
on the Slav; run over the older two courses it disagrees with 27 London entries and 12
Caro-Kann ones. Three were verified and fixed at the gate; the rest is this phase.
`chips/phase-10-mistake-sweep.md` is the builder prompt and it runs unattended.

- [x] 10.1 The "graded too kindly" findings, 13 in the London and 10 in the
  Caro-Kann: each re-checked at 2500 ms, then regraded or kept with a reason.
- [x] 10.2 The "graded too harshly" findings, 14 and 2: read all, expect to change
  almost none, record the count kept and why. A system opening's mistake entries are
  positional judgements the engine scores at nothing.
- [x] 10.3 The prose sweep by hand: every note making a concrete material claim in
  both courses, played out and verified. This is the class with no checker, and it is
  how gate 9 found the `...Be4` note claiming a capture that never wins the bishop.
- [x] 10.4 Build the prose checker if it can be made honest, designing around the two
  false-positive traps gate 9 hit: multi-move sequences in a note, and alternatives
  that are themselves captures. A checker nobody trusts is worse than none.
- [x] 10.5 Both passes re-run over both courses after the last edit, final numbers
  recorded.

Acceptance: every "too kindly" finding fixed or recorded with its 2500 ms number and a
reason; the prose sweep done and its method stated; **no repertoire move changed**, so
Nick's two learnt line ids still resolve, proven on a copy of his real progress file;
the Slav untouched; vitest green and `tsc -b` clean.

- [x] **Review gate 10 passed** (2026-08-29)

Open items (phase 10):

1. **The loop lesson, and it is the reason this phase existed.** A new checker is a
   claim about every course, not just the one it ships with. The mistake pass was
   built at phase 9 and run on the Slav, where it reports nothing. Run over the two
   older courses it disagreed with 26 of the London's 199 entries and 11 of the
   Caro-Kann's 127. Nothing about those courses changed between their review gates
   and this phase. What changed is that something finally looked at that field.
2. **The "graded too kindly" findings: 11 in the London, 8 in the Caro-Kann, all 19
   re-measured at 2500 ms before anything was touched, all confirmed, most larger at
   the longer time.** The worst of them:
   - Caro-Kann, main line, in TWO chapters: after White castles long, ...Qa5 was an
     inaccuracy that "loses the time needed to castle". The bishop went to d2 two
     moves earlier and covers a5, so 13.Bxa5 takes the queen and nothing recaptures.
     5.54. A queen-losing move described as slow, in the chapter a trainee reads first.
   - Caro-Kann Advance: ...Qb6 graded PLAYABLE at 4.67. It walks onto a discovered
     attack, 17.Nxf5 Nxf5 18.Bxb6, and loses the queen for a bishop.
   - London, the Qxb2 gambit: Rb1 an inaccuracy that "chases the queen to a2" when
     5...Qxc3+ takes a knight with check. 5.72.
   - London, King's Indian: d5 an inaccuracy for "closing the centre" when it forgets
     that ...e5 attacks f4 as well as d4. 9...exf4 10.exf4 is a bishop for a pawn. 4.66.
   - London, Classical: Bg5 an inaccuracy that "wanders" when 4...Qxg5 takes it. 4.38.
   - Caro-Kann: ...Bg4 in two chapters, both inaccuracies for positional reasons that
     never arise, because Qxg4 wins the bishop. 4.31 and 4.06.
   - London, against the Dutch: Ne5 graded playable and then an inaccuracy a move
     later, while ...dxe5 wins a knight for a pawn either way. 3.65 and 3.68.
   Every one regraded, every rewritten note played out with chess.js first.
3. **The "graded too harshly" findings: 15 in the London and 3 in the Caro-Kann read,
   and all 18 kept.** A system opening's mistake entries are positional judgements
   the engine scores at nothing, and those judgements are the course's subject. The
   London grades 1.d4 d5 2.e3 a mistake and it costs 0.03, which is right for a course
   whose whole point is getting the bishop out before the pawn; the h4 pawn lunges
   cost 0.01 to 0.28 and are graded mistakes for the same kind of reason. Two are
   cases where the engine actually PREFERS the alternative, Bg5 at -0.62 and Qf3 at
   -0.45, and the grades still stand, because a one-setup course is teaching a setup.
4. **The prose sweep found four faults, and three sat beside grades that were
   correct.** Method: grep every note in both courses for a material word, then play
   each claim out on a board. That is the class no engine pass can see.
   - London: "The d4 pawn loses its support" is false. The pawn on e3 supports d4
     throughout; what c4 gives up is the triangle, for an isolated queen's pawn.
   - London: "It wins a pawn too" for dxc5 is false. The queen on b6 takes back.
   - London: "It wins nothing" for Nc7+ understates a move that loses a piece.
   - Caro-Kann: "taking with the queen loses the e4 pawn" names a capture that does
     not exist in the position. White's only recapture is bxc3, and both blocks lose
     a piece rather than a pawn.
5. **The checker was worth building, and it is calibrated rather than assumed.**
   `scripts/note-claims.mjs` parses the move sequence a mistake note names, plays it,
   and compares the material that changes hands with the material the note promises.
   Calibrated against the Slav, whose notes phase 9 swept by hand: 13 claims checked,
   zero false positives. Over all three courses now it reports nothing unsupported.
   Its limits are worth knowing: it reads mistake entries only, only claims that name
   a numbered move, and it cannot judge a positional claim at all. It lists the
   claims it cannot check for a human, and two of the four prose faults above came
   off that list rather than out of the checker.
6. **A false-positive trap the chip did not name, and it decided the design.** The
   obvious baseline, the position before the alternative, makes the checker lie
   whenever the repertoire move is a recapture: "4.dxc6 Nxc6 leaves Black a pawn
   down" is true against ...cxd5 and reads as nothing against the position before it.
   Measuring against the repertoire line instead fixes that and the chip's second
   trap at the same time, because an even trade nets zero either way. The third
   thing it needed was a negation guard: "it does not lose a pawn" is a note about
   why a move is safe, and reading it as a promise of material is how a checker
   earns its distrust.
7. **No repertoire move changed, and it is proven rather than asserted.** Both
   versions of all 12 touched files were re-parsed and every move path compared:
   identical, including the alternatives inside the mistake entries. Only grade and
   note strings differ.
8. **Nick's two learnt lines survive, proven on a copy of his real file with a
   negative control.** Both ids resolve against the loaded content; a deliberately
   mutated id does not, and the id set has over a hundred members, so the check
   cannot pass vacuously. The scratch test was deleted afterwards. His file was
   hashed before and after and never opened for writing: SHA256 DB071A7F...A741.
9. **Two move-pass findings that are repertoire moves, recorded and not touched.**
   The London's 1.89 at Nb5 in the Qxb2 gambit, where the position before it reads
   +3.03 and the engine prefers something else, and the Caro-Kann's 0.59 at ...Bxe4,
   which gate 8 already recorded and kept. The chip puts repertoire moves out of
   scope for this phase; the first is worth a look by whoever next opens the London,
   because it says the gambit line has a stronger move than the one taught.
10. **Three entries left deliberately at the band edge, all graded playable and all
   within a tenth of a pawn of the line.** The Caro-Kann Advance's ...e6 at 0.89, the
   London's 2.e4 against a fianchetto at 0.91, and the London's Be5 in the Gruenfeld
   chapter at 0.84, each measured at 2500 ms against a band that ends at 0.90. All
   three notes already say the move is a real try with a drawback, which is what
   playable means. The last two only appeared in the final run: at 500 ms they sit on
   either side of the threshold depending on the run, which is phase 9 open item 12
   showing up again in a different course.
11. **The final numbers, all four passes re-run after the last edit that could change
   them.** The mistake pass over the London falls from 26 findings to 18, and every
   one of the 18 is a keep: 16 positional judgements graded harshly on purpose, and
   the two band-edge entries in item 10. Over the Caro-Kann it falls from 11 to 2,
   both positional keeps, with nothing left on the "too kindly" side at all. The
   note checker reports no unsupported claim in any of the three courses. The move
   passes, which are about repertoire moves and therefore out of this phase's scope,
   report 5 in the London and 2 in the Caro-Kann, unchanged content and the same
   findings their own gates accepted, plus item 9's escalation.
   One commit lands after those runs and it changes a note, which neither engine pass
   reads: they see moves and grades only. The note checker was re-run after it.
12. **What the review verified independently (gate 10).** 371 tests and
   `tsc -b --force` green; the Slav byte-identical. The rule this phase was built
   around was checked rather than believed: both course trees were re-parsed from the
   pre-phase commit and compared move by move, **343 London node paths and 425
   Caro-Kann ones, identical**, so not one repertoire move moved, and both of Nick's
   learnt line ids resolve against the loaded content. His progress file is untouched
   at SHA256 DB071A7F...A741.
   Both mistake passes were re-run from scratch. The London reports 15 findings with
   **one** on the "too kindly" side, at 0.96 against a band ending at 0.90, which is
   the band-edge keep item 10 already records; it was 27 findings and 13 too-kindly at
   gate 9. The Caro-Kann reports 3, **all three positional keeps and nothing
   too-kindly at all**, from 12 and 10. The counts differ from item 11's by a few
   because of the 500 ms wobble phase 9 item 12 documents; the direction that matters,
   the too-kindly side, is 13 to 1 and 10 to 0. `note-claims.mjs` was run over all
   three courses and reports no unsupported claim anywhere.
   Four content claims were played out on a board rather than taken on trust. The
   headline one holds: **...Qa5 loses the queen** in two Caro-Kann chapters, because
   13.Bxa5 takes her and nothing recaptures - it was graded an inaccuracy about losing
   time. So do the three new London claims: dxc5 really wins nothing (Qxc5 takes
   back), Ne5 really loses a knight for a pawn either way, and Bd3 really hangs g2
   with no recapture.
13. **One residual fault the review found, of the species this phase existed to
   remove.** In the London's chapter 7, `Qh5` was graded a mistake with a note saying
   the queen "arrives alone" and "has to go home". It does not go home: the knight on
   f6 plays ...Nxh5 and nothing recaptures. Fixed in its own commit. It is worth
   naming why three separate checkers missed it. The mistake pass saw a correct grade
   and moved on. The note checker only tests notes that MAKE a material claim, and
   this one makes none. And the prose sweep greps for material words, which this note
   does not contain. **The gap is the note that explains a capture positionally**, and
   the way to find it is to work from the board to the prose rather than the other way
   round: list the entries a capture answers, then read what each one says. Gate 9's
   sweep surfaced this entry and did not chase it, so the miss is this reviewer's too.
14. **Item 9's Nb5 escalation is not new, and the register already holds it.** Phase 4
   open item 1 recorded the same thing after its own engine pass: the engine prefers
   5.Nxd5 at about +2.9 to the taught 5.Nb5 at about +1.3, and Nb5 was kept
   deliberately because it is sound, clearly better for White, and the one idea the
   chapter teaches. It ends "worth a ruling if Nick would rather have the stronger
   move at the price of a second idea to remember", and that ruling is still open. Two
   independent passes reaching the same conclusion is a good sign for the tooling, not
   a new finding.

---

## Phase 11 - course bundles: import, export and the author's documentation

Goal: a course becomes one file a chess player can write, share and install without
reinstalling the app. SPEC.md section 11 governs; `docs/course-bundles-concept.md`
records the reasoning. Nick ruled the format (a PGN file), the re-import behaviour
(ask, showing what survives) and the proving course (the Ruy Lopez Exchange) on
2026-08-30, so this phase runs unattended.

- [x] 11.1 The PGN parser: variations, comments, glyphs and header tags, keeping the
  tree. **chess.js discards variations silently - verified at design time - so this
  is ours.** Pure, in `src/model`, with tests over a hand-written PGN covering a
  branch, a nested variation, a glyph, a comment with tokens and a malformed file.
- [x] 11.2 PGN to course: header tags to manifest, games to chapters, the pre-move
  comment to the intro, `[%tags]`, `[%weight]`, `[%plan]`, `[%cal]` and `[%csl]` to
  their fields, glyphs to mistake grades. Errors collected, never thrown, in the
  loader's own style; a `{` or `}` in prose is a named error.
- [x] 11.3 Course to PGN, and the round-trip test: exporting every bundled course and
  parsing it back must reproduce the course exactly. This is the test that keeps the
  parser and the writer honest at the same time.
- [x] 11.4 Import in the app: a file picker, validation with every error listed, and
  compilation into the AppData folder shape phase 7 already loads. Nothing written on
  failure. Refuses to shadow a built-in course, as now.
- [x] 11.5 The re-import check: before writing over an installed course, count how
  many learnt lines still resolve against the incoming one and say so, then confirm
  or cancel. Cancel writes nothing.
- [x] 11.6 Export in the app: any course in the catalog, built-in or added, to a
  `.pgn` the trainee chooses. Reuses the dialog plumbing progress backup already has.
- [x] 11.7 Course prose renders markdown links as plain text (SPEC.md section 11): a
  link would navigate the Tauri window itself, and an opening note does not need one.
- [x] 11.8 `docs/authoring-a-course.md` for a chess player, not a programmer: build
  it in a study, one chapter per chapter, glyphs for alternatives, the optional
  tokens, what the app checks and refuses, and how to send it to someone.

Acceptance: SPEC.md section 11 items 1 to 5; vitest green and `tsc -b` clean; the
installer rebuilt; Nick's progress file unchanged, hash-verified.

- [x] **Review gate 11 passed** (2026-08-30)

Open items (phase 11):

1. **chess.js really does lose variations, checked here rather than taken on
   trust.** `loadPgn` on a file containing `3. Nc3 (3. e5 {The Advance.} Bf5)`
   returns the mainline with the sideline gone, no error and no warning, and
   `pgn()` writes it back out without it. That is the whole reason the parser is
   ours. It tokenises and descends by hand, keeps variations, comments and
   glyphs, and refuses a file rather than half-reading it: an unterminated
   comment, an unclosed variation, a brace in prose, a stray bracket, a repeated
   header tag and junk it cannot read are each a named error with a line number.
2. **The round trip earned its keep on the first run.** Exporting the London and
   reading it back reordered an arrow and a circle on one node, because writing
   all the circles and then all the arrows is the obvious thing to do and it is
   wrong. Shapes now go out in the order they were drawn, in one token per run
   of a kind, and a test pins it. That is exactly the asymmetry the test exists
   to find, and nothing but a round trip would have found it.
3. **Two additions to the mapping table in SPEC.md section 11, for the gate to
   rule on.** The table has nowhere to put two things the schema holds, and
   without them a course cannot survive a trip through its own format:
   - `defaultTags`, a chapter-level field all three courses use, is the header
     tag `[DefaultTags "development"]`. Without it every node needs its tags
     written out, and the round trip fails on all three courses.
   - `variant`, a node field no course uses today, is the comment token
     `[%variant classical]`. It is in the schema, so the format can carry it.
   Both are implemented and documented in `docs/authoring-a-course.md`. The
   escalation rule says a format that cannot express the schema is a finding
   rather than a reason to edit the schema quietly, so SPEC.md section 11 is
   left as written and this is the finding.
4. **Format decisions the spec did not settle, each made once and written down.**
   - **The stem is the leading run of moves that carry no comment, no glyph and
     no variation.** Every tree node needs a note, so the first annotated move is
     where a chapter's own content starts, and that makes the split reversible.
   - **`??` is read as a mistake; `!` and `!!` are refused** with a message
     naming the three glyphs a bundle uses. Guessing what "good move" means for
     a graded alternative would be inventing meaning.
   - **Prose may not contain `{`, `}` or `[%`, and a plan may not contain `]`.**
     The first would end the comment, the second would be read back as a token,
     the third would end the plan token. Export refuses with a named error rather
     than writing something that reads back wrong.
   - **Unknown tokens are ignored.** Lichess writes `[%clk]` and `[%eval]` into
     study comments; refusing a bundle because it remembers how long a move took
     would be absurd.
   - **Lines are wrapped between tokens and never inside a comment**, so a note
     with paragraphs in it survives exactly and a chapter is still readable in
     an editor.
   - **`[FormatVersion]` defaults to 1 when absent**, because a person writing a
     bundle by hand should not have to know the field exists.
5. **A rule moved into the loader, which is a behaviour change worth a ruling.**
   Two chapters expecting different moves in one position means one of them can
   never be asked, because drill cards are keyed by position. The card builder
   has reported it since phase 1 and the content suite fails on it, but only for
   the courses in this repo. A dropped-in folder or an imported file was never
   checked, and the trainee cannot run the suite. The check is now in
   `loadCourse`, so every course gets it. Found by writing the documentation,
   which claimed the app checked this.
6. **What a session cannot verify, and what was verified instead.** Import and
   export both go through a native file dialog, which no headless session can
   drive. So the packaged app was used to prove the parts around them:
   - the capability grants, by invoking the same `plugin:fs` commands the
     importer uses, in the same order, against the real courses folder: mkdir,
     write, read back and remove all succeeded, and the probe folder was
     deleted. This is the phase 7 hazard, and the grants are listed at each
     depth because that phase found these patterns are matched literally.
   - a course in exactly the shape the importer writes, appearing in the catalog
     after a restart with "Added by you", and its notes, its weights and its
     `[%plan]` rendering in Study.
   What is left for a human is one click in each dialog. The dialog plumbing
   itself is the same code progress backup has used since phase 5.
7. **The fixture was written by hand, which is the documentation's own claim
   under test.** A two-chapter PGN typed in a text editor, no chess GUI
   involved. It failed twice before it loaded: a weight on a White move and tags
   on a Black one in a White course, and a bishop capture through its own pawn.
   The loader named all three precisely, which is the promise the guide makes
   about error messages. The fixture was installed into AppData, opened in the
   packaged app, then deleted, and Nick's progress file came back byte for byte
   at SHA256 DB071A7F...A741.
8. **No test drives the import component itself.** This repo has no DOM test
   environment, and adding jsdom and a testing library for one component is a
   bigger change than this phase should make. The model underneath it is tested
   hard: the parser, the mapping both ways, the round trip over three real
   courses, the surviving-lines count and the link stripping, which is rendered
   to a string with `react-dom/server` rather than to a DOM. The component's own
   branching - refuse, confirm, cancel, write - is read rather than run.
9. **Installing clears the JSON already in the course folder first.** A
   replacement with fewer chapters would leave one behind, and a file the
   manifest does not list is a load error, so the course would vanish from the
   catalog and the reason would be a file nobody remembers writing.
10. **Import is desktop only and export is not.** There is nowhere to install a
   course in a browser, so the import section is hidden there; export offers a
   download, because a bundle is just a file and getting one out of the browser
   build costs nothing.
11. **A bundle could choose where its files landed, found and fixed at the gate.**
   The bundle reader names each chapter file `<ChapterId>.json` and the installer
   joins that onto the course folder before writing it. Nothing validated that id,
   so `[ChapterId "../../../evil"]` passed the whole pipeline - reader, loader,
   every check - and would have been written outside the folder. Two levels up
   from a course folder is the app's own `progress.json`, and the write scope
   includes `$HOME/**`, so the reach was real rather than theoretical: the file
   this project has protected since phase 7 was reachable by a shared file.
   Fixed in `loadChapter` rather than in the bundle reader, because that is the
   root: the same rule now guards a folder copied in by hand, and the chapter id
   also travels into every line id in the progress file. The rule is the one
   course ids already follow, and all 22 shipped chapters already satisfy it.
   `src/model/bundle-safety.test.ts` tries eight ways out of the folder.
   **The documentation already said chapter ids were "the same kind of name" as
   course ids.** The guide was right and the code did not enforce it, which is a
   reminder that writing the docs is itself a check - it caught the conflict rule
   in item 5 the same way.
12. **What the review verified independently (gate 11).** 435 tests and
   `tsc -b --force` green, and no course content changed. The round trip was
   re-run from scratch rather than trusted: all three courses exported to PGN,
   read back, loaded through `loadCourse`, and compared node by node across more
   than 700 nodes - id, title, colour, tagline, tags, chapter order, intros,
   stems, and every note, plan, tag, weight, variant, shape and mistake entry -
   identical in all three. The parser was checked on the thing chess.js gets
   wrong: it keeps a variation, and a variation nested inside a variation. Six
   kinds of malformed input were refused with errors and no course, and nine
   pieces of junk produced no throw.
   The ruled re-import safety was tested against Nick's real learnt ids: an
   unchanged course keeps 2 of 2, an unrelated course correctly reports 0 of 0
   rather than alarming him about lines it does not own, and both a removed
   chapter and a changed move report 1 of 2 and name the casualty.
   Five behaviours the author guide promises were run rather than read, including
   its claim that a marked alternative carrying a continuation is refused rather
   than silently truncated. All five hold, which is worth saying: the guide and
   the implementation agree.
   **The installer was rebuilt at the gate, twice, and checked rather than
   assumed.** The artefact the phase produced was built at 10:07 and the traversal
   fix landed at 11:18, so the shipped installer did not contain it - and shipping
   an installer without it would have shipped the hole in the one feature designed
   to accept files from strangers. The first rebuild was then found to predate a
   second, smaller fix, because `tauri build` runs the frontend build at its start
   and the edit landed after it. Both fixes were confirmed present by searching the
   built bundle for their own strings, rather than trusting the timestamp. Worth
   remembering: **a rebuild proves nothing about an edit made while it was
   running.**
   The rebuilt app was then run: it opens with three courses and Nick's real
   progress (2 of 142 lines, 17 due), each tile offers "Export as a file", and the
   import panel is there with its "It is data and cannot run anything" line. His
   progress file came back at SHA256 DB071A7F...A741 and the AppData folder holds
   nothing but that file.
13. **Two escalations from item 3 and item 5, ruled at the gate.** Both were
   raised the way the escalation rule asks, rather than resolved quietly.
   `defaultTags` as `[DefaultTags]` and `variant` as `[%variant]` are accepted and
   are now in SPEC.md section 11's mapping table: without the first, no course
   survives its own format, which the round trip proved on all three. Moving the
   two-chapters-disagree check into `loadCourse` is accepted too, and it is more
   than tidiness - the rule had only ever protected courses in this repo, and the
   trainee cannot run the test suite.

---

## Phase 12 - the Ruy Lopez Exchange, delivered as a bundle

Goal: the fourth course, and the first that arrives the way a community course would.
Its chip is written after gate 11, so it can describe the format as built rather than
as planned.

Chipped as `chips/phase-12-ruy-lopez.md`. Nick ruled the chapter list and both forks
on 2026-08-30 before any drafting: **5.O-O** after 4.Bxc6 dxc6, and **4.Bxc6 dxc6
against the Berlin** so the course teaches one structure rather than two. Course id
`ruy-lopez-exchange`, permanent. Seven chapters: the idea, `5...f6`, `5...Bg4`, the
flexible tries, `4...bxc6`, Black avoiding `3...a6`, and the exercises.

- [x] 12.1 Chapter list for a club-level Exchange Ruy (4.Bxc6 dxc6), agreed with Nick
  before drafting, in the shape the other three courses use.
- [x] 12.2 Draft to the SPEC.md section 3 bar, student White.
- [x] 12.3 All three checkers - both engine passes and the note checker - run after
  the last content edit, then the by-hand read of the entries a capture answers,
  which is the class no checker sees.
- [x] 12.4 Add the course's block to the content suite and export the bundle to
  `docs/bundles/ruy-lopez-exchange.pgn`; the phase 11 round-trip test picks the course
  up automatically, so confirm it does.
- [x] 12.5 Install the bundle by hand the way the importer would, prove the course
  works in the packaged app, then remove it so Nick's own import lands clean.
  **The importer's file dialog needs a human**, so the final click is his, like the
  installer click. The phase records it as owed rather than blocking on it.

Acceptance: the course meets the section 3 bar with all three checkers recorded; it
round-trips through its own bundle; installing that bundle by hand produces a working
course in the packaged app; the other three courses are untouched; vitest green and
`tsc -b` clean.

- [x] **Review gate 12 passed** (2026-08-30)

Open items (phase 12):

1. **A course cannot import its own bundle, so the click owed to Nick needs a ruling.**
   Task 12.2 puts the Ruy in `courses/`, so it ships with the app. Task 12.5 then asks
   for it to be installed from its bundle and imported by Nick. Those two cannot both
   happen: `mergeCourses` (`src/model/course.ts:234`) refuses a dropped-in copy of a
   bundled id, by design and rightly. Verified live, with the app's own words: `"ruy-lopez-exchange"
   is a course this app has built in, so a dropped-in copy cannot replace it.` This is
   true of all four files under `docs/bundles/`, because all four courses ship.
   What was proved instead, in the packaged app: the same bundle with its id and title
   changed to `scratch-import-check` installs into the AppData courses folder, appears
   in the catalog marked **Added by you** with all 41 lines, and **Study, Drill and Play
   all work in it** (Study renders the chapter prose, Play starts a game as White, and a
   line marked learnt produced 12 due cards that Drill served). The unchanged copy sitting
   beside it was refused with the message above while every other course kept working.
   Both fixtures were deleted afterwards and the catalog is back to four courses.
   **Nick's ruling:** either the Ruy stays bundled and its PGN is a reference and a
   worked example rather than something to import, or it ships only as a bundle and the
   repo folder goes. The import path itself is proven either way.
   **The gate confirmed the refusal at source** (`mergeCourses`, `src/model/course.ts:234`,
   on SPEC.md section 10) and recommends the first: the Ruy stays bundled. Dropping the
   folder would cost the course everything that has caught a real error in every phase -
   its content-suite block, both engine passes, the round-trip and export tests - and it
   would ship three courses instead of four to buy one click. Nick's click is a two-line
   edit away: change `[CourseId]` and `[CourseTitle]` in `docs/bundles/ruy-lopez-exchange.pgn`
   and import that, which tests the importer and the author's guide in the same minute.
   What is genuinely still untested is a course that only ever exists as a bundle, and
   that wants its own small course rather than a renamed copy of this one.

2. **Engine findings kept rather than fixed**, all re-checked at 2500 ms:
   - Taking on c6 costs half a pawn or so in the chapter 5 sidelines: 0.51 against the
     Berlin, 0.71 against 3...Bc5, 0.50 against 3...g6, 0.96 against 3...Nge7. That is
     the course's whole premise, and chapter 5's intro says so in its own section.
   - ch1, 8.Nxe5 in the 6...Bd6 line, 0.63 at 500 ms, inside the noise band, and White
     is still close to a pawn ahead after it.
   - ch1, `9.Qxd8+` graded an inaccuracy: 2.03 at 500 ms but 1.62 at 2500 ms, which is
     inside the inaccuracy band. The grade stands on the slower number.
   - ch2, `9.hxg4` graded a mistake at a measured cost of 0.36. Kept deliberately: the
     engine finds 10.Re1 and holds, but 10.Ne1 is the natural move and 10...Qh4 is mate,
     which the engine confirms at -100. A grade that says "this loses" is right for a
     move whose obvious follow-up loses.

3. **The note checker cannot read a capture that gives something back.** Four of its
   five first-round findings were notes that were true: "7...Bxd1 wins the queen" is
   what happens, but the queen goes for a bishop and a pawn, and the checker reads the
   claim as the net cost. The notes were reworded to state the net. Two things follow
   for whoever runs it next. A note that names the compensation is not checked at all,
   because the phrase no longer matches a claim pattern. And the pattern for a lost
   queen matched "the queen goes hunting", which is a queen going somewhere.

4. **The by-hand read of the capture entries earned its place again.** It found a note
   the three checkers all passed: chapter 0 and chapter 1 both illustrated 6.Nxe5 with
   the line 6...fxe5 7.Qh5+ g6 8.Qxe5+, which is not a refutation but a blunder by
   Black. The engine has White at +3.28 after it. Black's move is 7...Kd7, and 6.Nxe5
   is a mistake for a quieter reason: a piece for a pawn with no attack. Both notes now
   say that, and say what happens to a trainee who plays ...g6 from the other side.

5. **The gate found one graded alternative the phase's own final run did not, and
   fixed it** (commit `07f7b8c`). Chapter 4, after 7.Qxd8+ Kxd8: `8.Nc3` was graded an
   inaccuracy. Re-checked at 2500 ms, `8.Nxe5` is +2.58 and `8.Nc3` is +0.52, so it
   costs 2.06 - past the top of the inaccuracy band at 1.80, and not a judgement call.
   The pawn on e5 is undefended for exactly one move, and Nc3 spends it. Grade now
   `mistake`, note rewritten, bundle re-exported, suite green.
   **The lesson is about the 500 ms pass, not about this move.** It is a sampler, and
   two entries in this course sit on its border: the phase's run flagged the chapter 1
   `9.Qxd8+` entry and not this one, the gate's independent run flagged this one and
   not that. Neither run was wrong. A borderline entry needs a second run or a slower
   one, and a phase that reports "two disagreements" is reporting one sample of them.

6. **The move pass agreed, with the same borderline behaviour.** The gate's independent
   run found five moves over 0.5, four of them the same four the phase recorded. The
   fifth, chapter 1 `9.Nc3` after 8...Bd7, measured 0.64 at 500 ms and 0.32 at 2500 ms,
   which is inside the noise band and needs nothing. The note checker returned zero
   unsupported claims and one claim for a human to read, which holds: after
   4...dxc6 5.O-O Bd6 6.d4 exd4, `7.e5` is +2.38 against `7.Qxd4` at +0.20, and the
   fork is worth the piece the note says it is.

## Phase 13 - named lines, and the Study screen rebuilt around them

Goal: the first phase driven by Nick actually using the app. He opened the London,
landed on Study and could not tell what the three checkboxes were for or how to step
through a line. Naming the lines is the change everything else hangs off.

Chipped as `chips/phase-13-line-names.md`. Designed over four rounds with Nick on
2026-08-30 against a working prototype
(https://claude.ai/code/artifact/31434baa-b2ef-44b9-8fa8-192b67fb0b60), which holds the
real London chapter 1 with every ruled behaviour in it.

The rulings: every line gets a name; the lone "I have learnt this line" checkbox is
retired because the per-line boxes cover it once the table shows where you are; the
screen runs header, board, notes, lines table, chapter text; taking a branch moves the
highlight; clicking a row is a restart on that line; and the two buttons that both said
"play" become **Auto step this line** and **Play a game from here**.

- [x] 13.1 A `name` on every leaf in the content schema, required and unique within its
  chapter, with the validator rules and the schema doc. It changes no identity: a line
  id is its moves and a card key is course plus position, so no progress key moves.
- [x] 13.2 The `[%line ...]` token in the bundle format, both directions, plus the
  SPEC.md section 11 mapping row and the author's guide. A named course must survive its
  own format before any names are written.
- [x] 13.3 Name all 183 lines: London 41, Caro-Kann 53, Slav 48, Ruy Lopez 41. Named by
  what makes each different from its siblings, not by its plan. Content-suite block for
  presence, uniqueness and length; bundles re-exported.
- [x] 13.4 The Study screen rebuilt to the ruled order and mechanics, the lone checkbox
  retired, both buttons renamed, Forward following the chosen line rather than the first
  child.
- [x] 13.5 Prove it in the packaged app: the table sits where it should, Auto step walks
  a line, a branch moves the highlight, a tick still makes drill cards.

Acceptance: every line named, unique and under 40 characters; names survive the bundle
round trip; the screen matches the ruled order and mechanics; vitest green and `tsc -b`
clean; bundles current; Nick's progress file unchanged and hash-verified.

Open items (phase 13):

1. **The chip said `name` should be rejected on a non-leaf "like `plan` is", and
   `plan` was not.** The validator had only ever REQUIRED a plan on a leaf, never
   refused one above it, so a plan written on a move that continues was authored
   prose the app silently ignored. Recorded rather than guessed at, then fixed in
   its own commit, because it is the same fault the unknown-field rule exists to
   catch. No bundled course had one, so nothing that exists today is refused.
2. **The required rule landed with the names, not with the field.** Task 13.1 as
   written makes `name` required, which would have left the four courses failing to
   load until 13.3 named them. The chip also says each task lands green on its own,
   and the two cannot both hold. The field, its rules and the schema doc landed at
   13.1; the "required on every leaf" error landed at 13.3 in the same commit as the
   183 names. End state is exactly what the chip asks for and no commit in the phase
   leaves the suite red.
3. **Nick's two learnt lines survived, which is the proof the safety claim was
   right.** A line id is its moves and a card key is course plus position, so naming
   183 lines moved no key. Read back out of the packaged app after the run:
   `db071a7f...`, 315 bytes, byte-identical to the backup, both line ids still
   resolving.
4. **The app's nav bar overflows below about 600px wide, so the page scrolls
   sideways there.** Found while checking the lines table's own scrolling, which is
   correct: the table scrolls in its container and the chapter no longer stretches
   the page. What sticks out at 480px is `.app-nav` in the shell, which this phase
   did not touch and which the chip puts out of scope. It is also below the Tauri
   window's own minimum, so only a browser can reach it. Not taken.
5. **The line name is not shown in Drill or Progress.** Now possible and worth
   doing; it needs a ruling about how much Drill should give away before an answer,
   so it went to the SPEC section 6 register rather than into this phase.
6. **`scripts/note-claims.mjs` over all four courses after the last content edit:**
   0 claims the board does not support. Nine claims with no sequence to check, for a
   human, all of them the ones gates 9, 10 and 12 already read and kept. The two
   engine passes were not re-run: 13.3 added prose and moved no move.

- [x] **Review gate 13 passed** (2026-08-30)

7. **Gate 13 verified independently**: 502 tests and tsc -b re-run clean; all 183
   names re-checked by script against every rule (present on every leaf, absent on
   non-leaves, unique per chapter, 40-char cap, no brackets, no em dashes) - all
   hold; 183 [%line] tokens counted across the four bundles; the packaged dist
   carries "Auto step this line" and no trace of the retired checkbox; the
   progress file byte-identical at db071a7f and the AppData courses folder gone.
   The highlight rule lives in src/ui/study-lines.ts with its own tests, and
   Forward and Auto step share nextOnLine, so they cannot disagree again.

## Phase 14 - the Colle-Zukertort

Goal: the fifth course, and Nick's second White system against 1...d5 - chosen for
depth, because the Zukertort against the London teaches both structures. Runs AFTER
phase 13, so the course is born with named lines.

Chipped as `chips/phase-14-colle.md`. Nick ruled it on 2026-08-30 before drafting:
the **Colle-Zukertort** (b3 and Bb2) over the Koltanowski, because the c3 triangle
would duplicate the London; the ...g6 hole **covered in-course** (b3, Bb2, c4, the
solid centre) so the course stands alone as a bundle; course id `colle-zukertort`,
permanent. Seven chapters: the idea (contrasted with the London), the main line with
the Ne5/f4/Rf3 attack, ...Bf5/...Bg4 early, the ...b6 mirror, the ...g6 setups,
everything else, and the exercises with the Greek gift engine-verified per position.

- [x] 14.1 Variation, ...g6 policy and chapter list ruled with Nick before drafting.
- [x] 14.2 Draft the seven chapters to the section 3 bar, student White, named lines.
- [x] 14.3 All three checkers after the last content edit, run as samplers (twice, or
  2500 ms near band edges), then the by-hand read of capture-answered entries. The
  Greek gift positions each verified at 2500 ms.
- [x] 14.4 Content-suite block and the exported bundle; the round-trip test picks the
  course up automatically.
- [x] 14.5 Proven in the packaged app; fixtures deleted; progress file hash-verified.

Acceptance: section 3 bar met including names; bundle round-trips at
`docs/bundles/colle-zukertort.pgn`; other four courses untouched; vitest green and
`tsc -b` clean; Nick's progress file unchanged.

Open items (phase 14):

1. **The 500 ms passes are samplers, and this phase is the clearest evidence yet.**
   Four runs of `engine-pass.mjs` over the same course reported 4, then 3, then 2,
   then 0 findings. Every finding was re-checked at 2500 ms before anything was
   changed. Four were real and the course changed; the rest were band-edge noise or
   are kept with reasons below.
2. **Four moves the engine found, and the course changed:**
   - ch2, `3...Bf5 4.Bd3 c6 5.O-O`, cost 3.98. With no Black pawn yet on e6 or g6,
     NOTHING recaptures on f5, so 5.Bxf5 simply wins a bishop. That line is now the
     punished blunder rather than a quiet sideline, and the chapter intro states the
     rule: look at the recapture before assuming a trade is a trade.
   - ch4, `3...c5 ... 6.O-O O-O 7.b3`, cost 0.74 at 2500 ms. With no Black pawn on d5
     the pawn on d4 IS White's centre, and the rook belongs on e1 first. Now 7.Re1,
     with 7.b3 kept as a graded alternative that says why.
   - ch5, `1...c5 ... 5.Bd3 Nf6 6.b3`, cost 0.83. It allows ...Bg4, pinning the knight
     that defends an isolated d-pawn. Now 6.h3 first, the one place in the course where
     h3 comes before b3, and the note says so.
   - ch2, `... Bf5 Bd3 c6 O-O e6 b3`, cost 0.51. Removed with the line above.
3. **Four kept, with reasons.** `1.d4 c5 2.e3` costs 0.41 against 2.d5, which is a
   Benoni and the theory this course exists to avoid; the alternative is authored and
   says so. `3...Bg4 4.h3 Bh5 5.Be2` costs 0.45 against 5.g4, which is the critical try
   and opens the front door of the king White is about to castle behind; the g4 entry
   was regraded from an inaccuracy to playable because the engine prefers it.
   `...Bxd3 5.Qxd3 e6 6.O-O Be7 7.b3` costs 0.51 against 7.Qb5+, which wins the b7 pawn
   because the bishop that guarded it left on move four; the setup move is kept and the
   pawn grab is named in its note. And ch6's `9.Ne5` costs 0.41 at 2500 ms (0.52 at
   500 ms) in an exercise whose question is the move after it.
4. **The Greek gift is engine-verified per position, and in this repertoire it is
   mostly not there.** It needs a knight that can reach g5 with check or a rook already
   on the third rank, and the Zukertort's knight is committed to e5. Two exercises say
   so with numbers, both checked at 2500 ms: in one the sacrifice works (+1.46) and
   simply taking the hanging bishop is worth far more (+4.21); in the other it fails
   outright (-0.86 after ...Kxh7 Qh5+ Kg8, where playing Qh5 first is +0.66). The chip
   asked for the unsound case to be stated rather than cut, and it is, in the chapter
   intro and in both exercises.
5. **The by-hand read found two faults no checker sees**, both notes whose grade was
   right and whose reason was wrong. One offered `...Nd5` as a way to save a knight in
   a position where Black has a pawn on d5. The other named `...Nxe5` where no Black
   knight attacks e5, and claimed a fork that is not there. Both fixed.
6. **`note-claims.mjs` did no work on this course, and that is a finding.** 77 mistake
   entries, 0 with a material claim it could parse, 0 unsupported. Its patterns are
   "wins a piece", "loses a pawn", "a pawn down"; this course's notes say things like
   "White has given a bishop for a pawn and has nothing to show for it". So a clean run
   means less here than it does for the other four courses, and item 5 is what carried
   the load. Worth deciding later whether the checker should learn the other idioms or
   the house style should adopt its.
7. **Course scoping became load bearing in practice, and is now proved.** The Ruy was
   the second White course and opens 1.e4, so it never met the London. This one opens
   1.d4 and does: eight positions appear in both White courses and five are answered
   differently, because both meet an early ...c5 with 2.e3. Landed as its own commit
   with a test.
   **Gate 14 re-derived the numbers and they are exact, but this reason is inverted.**
   The ...c5 and 2.e3 positions are the three the two courses answer the SAME way
   (1.d4; then 2.e3; then 3.exd4). All five differences are White's SECOND move, where
   the London plays Bf4 and the Zukertort plays Nf3. The claim that scoping is load
   bearing stands untouched and the test is right; only the sentence explaining where
   the overlap comes from was wrong.
8. **The bundle landed with the content rather than as its own commit.** The chip asks
   for content, test block and bundle as three commits; the suite holds
   `docs/bundles/*.pgn` to the writer's current output, so content without the bundle
   is a red commit. Content plus bundle, then the test block, keeps every commit green.

9. **Gate 14's own runs, and what they found.** Both engine passes re-run independently
   over the finished course, the move pass three times and the mistake pass twice. The
   sampler behaviour held once more: the move pass reported 1 finding, then 4, then 0;
   the mistake pass reported 0, then 1. Across the phase and the gate that is seven runs
   of the move pass over one unchanged course returning 4, 3, 2, 0, 1, 4 and 0. Every new finding was re-checked at 2500 ms and
   none needed a content change:
   - ch0, `Ne5` graded an inaccuracy, flagged at 1.83 in one run - just over the 1.80
     band top. At 2500 ms it is 1.75 (+0.24 after Bb2, -1.51 after Ne5), inside the
     band. **The grade stands, and the deciding argument was consistency, not the
     number**: chapter 1 holds the identical position and grades it identically, and the
     course grades this whole "Ne5 a move early" class across playable, inaccuracy and
     mistake according to what each one actually costs. That calibration is right.
   - ch2, `b3` after `Bg4 h3 Bxf3 Qxf3 e6`: 0.47 at 2500 ms against `c4`. That is the
     system's own price, the same category as the four already kept in item 3, and the
     alternative is the Queen's Gambit structure this course exists to avoid.
   - ch3, `f4` after `Ne5 c5`: 0.41 at 2500 ms. Noise, and it is the move that makes
     the outpost permanent.
   - ch2, `O-O` after `... Bd3 Bd6`: 0.51 at 500 ms but **0.10** at 2500 ms. Pure noise.
10. **Content claims the gate re-derived rather than trusted.** Item 4's Greek gift
   numbers hold: the "take the piece" exercise measures `exd6` +4.08 against `Bxh7+`
   +1.36 here (the phase recorded +4.21 and +1.46), and the "gift that is not there"
   exercise measures `Qh5` at exactly +0.66 as recorded, with `Bxh7+` nowhere in the
   top four. The ch1 gift entry is emphatic: `dxe5` +3.40 against `Bxh7+` -2.68, a
   six-pawn swing, which is the course's central fork working. Item 6's finding is real
   and was reproduced: 77 mistake entries, 0 with a claim the checker can parse. Item 7
   is exact in its numbers and wrong in its reason, corrected above.
11. **The structural bar, checked by script rather than by reading.** All 36 lines named,
   unique within their chapters, under 40 characters, none on a non-leaf, every leaf
   carrying a plan and every node a note; 36 `[%line]` tokens in the exported bundle;
   mistake entries on 13, 12, 10, 11 and 12 positions across the five repertoire
   chapters against a bar of ten; every intro between 306 and 409 words with its
   typical-mistakes section; no em dashes; the other four courses untouched by diff.
   542 tests and `tsc -b` clean, both re-run. Nick's progress file byte-identical at
   `db071a7f`, 315 bytes, and no AppData courses folder, as expected for a bundled
   course.

- [x] **Review gate 14 passed** (2026-08-31)

## Phase 15 - a folder with the right name, and courses you can remove

Goal: the second phase driven by Nick using the app. He imported the Colle bundle
through the file picker on 2026-08-31 (it worked, first real use of the phase 11
feature), was made to restart to see it, deleted the folder by hand because there is
no other way, and found the data folder is called `com.nick.london-trainer` for an app
called Repertoire Trainer.

Chipped as `chips/phase-15-folder-and-courses.md`. Rulings of 2026-08-31: the folder
becomes `%APPDATA%\Roaming\Repertoire Trainer`; the Tauri IDENTIFIER does not change,
because it is what NSIS keys the uninstall entry on and Nick has already lived through
one identity change that installed a second app, so the app builds its root from
`dataDir()` plus a literal name instead of `appDataDir()`; the migration COPIES and
never deletes; import refreshes the catalog rather than asking for a restart; delete
appears on imported tiles only, because a bundled course would be back at the next
restart; and the confirm says the truth, which is that progress survives a delete and
comes back on re-import.

- [ ] 15.1 The data folder moves by copying, with one shared root function, literal
  capability grants for the new location, the old grants kept because they are what
  the migration reads, verification before the new location goes live, and a failed
  migration taking the existing blocked-saving route rather than starting blank.
- [ ] 15.2 Import refreshes the catalog; no restart. A new course has no learnt lines,
  so it cannot change a running drill queue.
- [ ] 15.3 Delete on imported tiles, in the actions row (the tile itself is a button,
  so a corner X cannot nest), with the confirm and an "Export it first" button rather
  than a pre-ticked box.
- [ ] 15.4 All three proved in the packaged app, ending with the one claim that has to
  be seen rather than reasoned about: delete a course, import it again, and the learnt
  lines come back.

Acceptance: the app reads and writes the new folder; Nick's two learnt lines live there
and the old folder is untouched; a failed migration blocks saving and says so; import
needs no restart; an imported tile deletes with its progress surviving a re-import;
bundled tiles have no delete; vitest green and `tsc -b` clean.

- [ ] **Review gate 15 passed**
