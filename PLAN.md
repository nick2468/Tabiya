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

- [ ] 7.1 Catalog home: one tile per course (colour, title, tagline, learnt lines,
  due count) plus overall numbers; entering a course scopes Study and Play to it; a
  header switcher changes course without returning home.
- [ ] 7.2 Drill and Progress move to the top level: one due queue across all courses
  with each card naming its course and a per-course filter; Progress shows the
  rollup and each course, weak areas per course.
- [ ] 7.3 External courses: the desktop app scans the AppData `courses` folder at
  startup (capability grant for that folder only), merges valid courses in, shows a
  failing course in the catalog with its errors, and refuses to shadow a bundled
  course id. The browser dev build sees the bundled set only.
- [ ] 7.4 The rename: Repertoire Trainer as display name, window title and installer
  name; the identifier stays `com.nick.london-trainer`; tagline updated.
- [ ] 7.5 Drop-in proof: a copy of the London course with a changed id and title,
  dropped into the AppData folder, appears in the catalog after restart and its
  cards join the drill queue - which also exercises the cross-course queue with
  real content before phase 8 exists.
- [ ] 7.6 Docs sweep and installer rebuild; the installed app updates in place with
  progress intact.

Acceptance: catalog navigation end to end; the drop-in proof passes with no source
change; one cross-course drill session driven live; vitest green; the installer
ships as Repertoire Trainer and updates the existing installation.

- [ ] **Review gate 7 passed**

Open items (phase 7): none yet.

---

## Phase 8 - v2: the Caro-Kann course

Goal: the second course, Black against 1.e4, proving the whole structure with real
content.

- [ ] 8.1 Course design: chapter list for a club-level Caro-Kann repertoire (the
  main line, the Advance, the Exchange, the Panov, sidelines and move-order tricks,
  a tactics-and-plans chapter), agreed with Nick before drafting.
- [ ] 8.2 Draft the chapters to the SPEC.md section 3 bar, colour rules
  student-relative: every move noted, plans on leaves, mistake minimums, weights
  giving White's club-level choices, tags from core plus this course's extensions.
- [ ] 8.3 The engine pass over every student move before the course is called done -
  the standing rule; findings fixed or recorded.
- [ ] 8.4 Ship it bundled; Play mode verified with the engine opening the game and
  the book steering White's moves by weight; drill cards verified against the
  London's for key collisions (there must be none, by course scoping).

Acceptance: the course meets the quality bar with the engine pass recorded; Study,
Drill and Play work end to end as Black; the London is untouched; vitest green.

- [ ] **Review gate 8 passed**

Open items (phase 8): none yet.
