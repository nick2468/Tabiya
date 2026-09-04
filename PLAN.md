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

- [x] 15.1 The data folder moves by copying, with one shared root function, literal
  capability grants for the new location, the old grants kept because they are what
  the migration reads, verification before the new location goes live, and a failed
  migration taking the existing blocked-saving route rather than starting blank.
- [x] 15.2 Import refreshes the catalog; no restart. A new course has no learnt lines,
  so it cannot change a running drill queue.
- [x] 15.3 Delete on imported tiles, in the actions row (the tile itself is a button,
  so a corner X cannot nest), with the confirm and an "Export it first" button rather
  than a pre-ticked box.
- [x] 15.4 All three proved in the packaged app, ending with the one claim that has to
  be seen rather than reasoned about: delete a course, import it again, and the learnt
  lines come back.

Acceptance: the app reads and writes the new folder; Nick's two learnt lines live there
and the old folder is untouched; a failed migration blocks saving and says so; import
needs no restart; an imported tile deletes with its progress surviving a re-import;
bundled tiles have no delete; vitest green and `tsc -b` clean.

What the packaged run showed, 2026-08-31: the app started on the new folder with Nick's
two learnt lines and the Progress screen named both paths; the old folder kept its
11:10 timestamp and its hash; a scratch fixture course imported and its tile appeared
without a restart; the bundled tiles carried no delete and the added one did; Cancel
removed nothing; Delete took the tile and the eight files and left all five learnt
lines in the file; and re-importing brought back "3 of 41 lines learnt, 14 due now".
Both folders finished on hash `db071a7f`, 315 bytes, and every fixture was removed.

Open items from phase 15:

1. **The packaged app's file picker cannot be driven from a script.** Tauri 2 defines
   `invoke`, `ipc` and `postMessage` on `window.__TAURI_INTERNALS__` as non-writable
   and non-configurable, so a stubbed dialog answer, which is how phase 14 would have
   done it, silently fails and a real Open dialog appears instead. The import legs were
   driven from OUTSIDE the page: find the window titled "Open" belonging to the
   process, `SetForegroundWindow`, then SendKeys the full path and Enter. The picker is
   now the second thing in this app that a script cannot work, after the board. Two
   more notes for whoever needs this next: launched from a background shell the window
   comes up minimized and parked off-screen, so `ShowWindow(SW_RESTORE)` plus
   `SetWindowPos` is needed before anything can be seen; and a stray dialog can be
   cancelled with `PostMessage(hwnd, WM_CLOSE)`.
2. **The migration's failure path is proved by tests, not by the packaged app.**
   Fourteen unit tests plus three cases run against copies of Nick's real folder on the
   real filesystem: a source that will not parse, a copy that lands truncated, and a
   target that cannot be written. Each one ends blocked rather than blank, with nothing
   left in the new folder. Proving it inside the packaged app would mean corrupting the
   real old file or hiding the real new one, which is the one thing this phase must not
   do.
3. **The drill-schedule half of the delete promise is unproved by use.** The confirm
   says learnt lines and their drill schedule both survive. The learnt lines were seen
   to survive a delete and a re-import. The schedule could not be: writing a card
   schedule needs a drill answer, a drill answer needs a move on the board, and the
   packaged build refuses synthetic moves. Nothing in this phase touches
   `src/storage/progress.ts`, and cards are pruned by nothing, which is why the claim
   is made.
4. **`fs:allow-remove` now covers the new progress file.** The migration needs it to
   sweep away a copy that fails verification, because a bad copy left behind would be
   taken as live at the next start. It is the only place in the app that removes a
   progress file. Worth a second look at any review that touches storage.
5. **The old folder is deliberately still readable.** The capability keeps read, exists
   and read-dir on `$APPDATA` and drops write, mkdir and remove, so no future build can
   write there by mistake. When Nick has deleted the folder, those grants and
   `oldDataRoots()` can go with it.
6. **A folder copied in by hand still needs a restart**, which is what SPEC section 10
   promises. Only the app's own writes trigger a rescan, because only they tell the app
   something changed. A folder watcher was not built and is not obviously wanted.
7. **A count that is worth watching.** `survivingLines(course, learnt).total` counts
   learnt lines by course id, so the delete confirm counts lines the trainee learnt in
   a version of the course they may no longer have. That is the honest number for
   "what stays saved", and it is the same number the re-import confirm uses.

8. **Gate 15 drove the migration itself, against real copies of Nick's file.** The
   phase's own tests are thorough, but this phase moves the file the project has already
   lost once, so the gate ran the real `migrateDataFolder` through a node-backed
   filesystem over real folders holding a real copy of `progress.json`. Seventeen
   checks, all passing: the copy is byte-identical and counts two learnt lines, the old
   file stays, a second run reports not-needed and does NOT overwrite live data that has
   moved on, and each of the four failure shapes (unreadable source, unparseable source,
   uncheckable target, corrupted copy) ends blocked with nothing left behind. The
   corrupted-copy case is the one that matters most and it holds: the bad file is
   removed, so the next start cannot mistake it for live data.
9. **The delete promise checked at the model layer.** Marking a Colle line learnt gives
   8 cards; removing the course from the catalog gives 0 while the line id stays in
   progress; putting it back gives 8 again. That is open item 3's unproved half answered
   as far as it can be without a drill answer, and it is the claim the confirm dialog
   makes.
10. **The remove grant reviewed, as item 4 asks.** `fs:allow-remove` names four literal
   paths and only one is a progress file. Exactly one call site touches it
   (`src/storage/migrate.ts:124`) and it is unreachable unless the app wrote that file
   itself moments earlier: the function returns not-needed if the target already exists,
   and treats an unanswerable existence check as failure rather than as a no. So it can
   sweep its own bad copy and nothing else. The literal `exists` grant on the new
   progress file is present, which is the phase 7 lesson applied.
11. **Verified for the gate:** 561 tests and `tsc -b` clean, both re-run; the new folder
   at `%APPDATA%\Roaming\Repertoire Trainer` holding both learnt lines; the old
   folder still there, still `db071a7f`, 315 bytes, mtime unchanged at 11:10; the new
   courses folder empty, so every fixture was removed; no write, mkdir or remove grant
   anywhere on the old folder; no em dashes; trailers naming the actual model.

- [x] **Review gate 15 passed** (2026-08-31)

## Phase 16 - never start blank, one name everywhere, and hiding a course

Goal: close the hole that cost Nick his learnt lines on 2026-08-31, finish the renaming
phase 15 started, and give him a way to get a course out of his way without deleting it.

Chipped as `chips/phase-16-safety-names-hide.md`. Two findings sit behind it. The data
loss was the app's own design: a missing progress file is indistinguishable from a new
trainee, so deleting the data folder and reopening the app started blank and saved blank
over the gap. And the reason nobody caught it for a day is that an agent shell's view of
the filesystem OUTSIDE this repo can be a stale overlay, proved by Nick's own `cmd.exe`
listing 23 directories in Roaming where the agent's tools listed 26. Both are written
into the chip, the second as the rule that governs how this phase is verified at all.

Rulings of 2026-08-31: blank is a claim, not a default; a backup copy goes in a SECOND
folder, because a marker inside the data folder dies with it; the executable, the crate
and the WebView2 profile folder are renamed while the Tauri identifier still is not; the
version bumps to 1.1.0 and bumps per installer thereafter; and courses are HIDDEN rather
than deleted, without bumping the progress version, because an older build refuses a
newer file outright and a cosmetic flag should not become a downgrade wall.

- [x] 16.1 Never start blank when there is evidence of a previous run: a marker beside
  the progress file, the blocked-saving banner rather than a fresh blank file, and a
  backup copy under `%LOCALAPPDATA%` offered for restore when the main file has gone.
- [x] 16.2 One name everywhere: the Cargo package and lib, the installed executable, and
  the WebView2 profile folder, which needs the first real Rust in the project because
  the window is built entirely from config today. Version to 1.1.0.
- [x] 16.3 Hide a course, reversibly, on any tile; hidden courses leave the catalog, the
  switcher and the drill queue, and leave every learnt line exactly where it was.
- [x] 16.4 All three proved in the packaged app, with the names proved across a CLEAN
  uninstall and reinstall so an orphaned `london-trainer.exe` cannot hide, and every
  claim about Nick's own data folder confirmed by Nick rather than by a shell.

Acceptance: the app refuses to start blank when it has evidence it should not and offers
the backup; the exe, crate and WebView2 folder all say Repertoire Trainer with no orphan
left behind; the version reads 1.1.0; any course hides and unhides with its progress
untouched; vitest green and `tsc -b` clean.

Also landed, on Nick's ruling of 2026-08-31 rather than as part of the phase: this repo's
dev server moved to port 5175 with `--strictPort`, in the `dev` script, `devUrl` and
`.claude/launch.json`. He holds 5173 and 5174 for other projects. The failure it prevents
is silent: Vite finds 5173 taken and walks to the next free port while the window still
loads 5173, which is how a DataCrafter page ended up inside a window titled Repertoire
Trainer.

What the packaged run showed, 2026-08-31, all of it read through the app's own screens
and the app's own filesystem calls over the DevTools protocol:

- The app opened on Nick's real data: "2 of 219 lines learnt across 5 courses. 17 of 17
  cards due now", the London at 2 of 41. Both learnt lines are `london-white`.
- **The marker and the second copy are real.** `progress.marker.json` sits beside the
  progress file saying it was written with 2 learnt lines, and explaining itself to
  whoever finds it. `progress.backup.json` is byte-identical to the progress file. The
  Progress screen names it and says it holds 2 learnt lines, so Nick can check the
  promise rather than believe it.
- **The WebView2 profile moved.** The Progress screen reports the profile folder as
  `%LOCALAPPDATA%\Repertoire Trainer Data\WebView2` and says the old
  `com.nick.london-trainer` folder is still there for him to delete.
- **Hiding works end to end.** Hiding the London took its tile off the catalog, took it
  out of the course switcher, and took the catalog from "2 of 219 across 5 courses, 17
  of 17 cards" to "0 of 178 across 4 courses, 0 of 0". Drill went from "17 cards ready"
  to nothing to drill. The Progress rollup agreed exactly with the catalog at every
  step. The progress file held `hiddenCourses: ["london-white"]` with `learntLines`
  still at 2 throughout. Unhide put all of it back, to the same numbers.
- **The names, across a clean uninstall and reinstall.** The 1.0.0 install was removed
  with its own uninstaller, then 1.1.0 was installed from
  `Repertoire Trainer_1.1.0_x64-setup.exe`. After the uninstall the install folder was
  gone entirely and the uninstall registry key with it, while all four data folders
  survived. After the install, `%LOCALAPPDATA%\Repertoire Trainer` holds exactly
  `repertoire-trainer.exe` and `uninstall.exe`, with **no leftover `london-trainer.exe`**,
  which is the orphan the SPEC register named when this was deferred at phase 15. The
  registry reads `DisplayVersion 1.1.0` and `MainBinaryName repertoire-trainer.exe`.
- **The installed app then opened on Nick's data unchanged**: 2 of 219 lines learnt
  across 5 courses, 17 of 17 cards due, no failure banner, `hiddenCourses` empty, the
  second copy still byte-identical to the progress file, and the learnt lines identical
  to a copy taken before the uninstall. A Hide control on all five tiles.

Open items from phase 16:

1. **The blank-start block could not be triggered in the packaged app, and the reason is
   worth keeping.** Phase 15's migration runs BEFORE the guard, and it copies the
   progress file back from the folder the app moved away from. Removing
   `%APPDATA%\Repertoire Trainer\progress.json` through the app's own filesystem call
   was verified gone, the app was restarted, and it came up with both learnt lines and
   the phase 15 migration note. So on this machine the incident cannot recur at all
   while the old folder holds a progress file. The guard is the layer underneath, and it
   becomes the active one the moment Nick deletes the old folder, which the app has been
   telling him to do since phase 15. Forcing the case would have meant emptying that old
   folder, which is the one original copy this phase must not touch.
2. **So the guard is proved on a real filesystem instead, not in a map.**
   `src/storage/blank-start-real.test.ts` runs the real `checkBlankStart` over real
   folders under the OS temp folder: a new trainee starts blank; a save writes both
   pieces of evidence into two different folders; deleting the progress file blocks with
   the marker's reason and an offer of 2 lines; deleting the WHOLE data folder, which is
   Nick's incident exactly, blocks on the copy alone and offers it; a copy holding
   nothing starts blank; a copy that will not parse blocks with no offer; the guard
   writes nothing whatever it finds; and putting the offer back gives a byte-identical
   file. Eight cases, plus the 17 in-memory ones next door.
3. **The second copy is NOT where the chip put it, and this is the most important
   correction in the phase.** The chip said `%LOCALAPPDATA%\Repertoire Trainer`. That is
   the INSTALL folder: `HKCU\...\Uninstall\Repertoire Trainer` gives `InstallLocation` as
   exactly that path, and it held `london-trainer.exe` and `uninstall.exe`. A backup an
   uninstall deletes is not a backup, and this phase calls for a clean uninstall. Both
   the copy and the WebView2 profile now live in `%LOCALAPPDATA%\Repertoire Trainer Data`.
   If the review dislikes the sibling-folder name, the name is all that changes.
4. **The theme choice is gone, once.** It lived in `localStorage` inside the old WebView2
   profile. Nothing else did: progress is a file. The Progress screen says so.
5. **`package.json` still says `london-trainer`,** as do the browser-only localStorage
   keys `london-trainer.progress` and `london-trainer.theme`. None is visible to Nick:
   the package name is private and never published, and the two keys exist only in the
   browser dev build, where renaming them would silently drop whatever a dev session had
   saved. Left deliberately; the exported filename, which he DOES read, was renamed to
   `repertoire-trainer-progress.json`.
6. **The `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS` trick needs a port nothing else holds.**
   The first probe of this phase came back describing a DataCrafter page, because 9333
   was already taken by another of Nick's projects and `packaged-eval.mjs` connects to
   whatever answers. It reports the page title, so check that it says Repertoire Trainer
   before believing anything it returns. That check was discarded and redone on 9666.
   Two more notes for whoever uses it next: a debugging port that is already taken fails
   silently rather than loudly, and a wait loop built out of `curl` against a dead port
   returns instantly, so it waits for nothing.
7. **The window is built in Rust now, and no setting was copied by hand.** The window is
   still declared in `tauri.conf.json`, with `"create": false`, and
   `WebviewWindowBuilder::from_config` reads that same declaration back. Title, size,
   minimum size, resizable, centre and the label `main` cannot drift, because there is
   still only one place they are written.
8. **The silent uninstall would not run from Git Bash.** `uninstall.exe /S` returned 0
   and did nothing, three times, including with `_?=`, whose path may not contain spaces
   and so cannot name this install folder anyway. From PowerShell,
   `Start-Process -FilePath ... -ArgumentList '/S' -PassThru -Wait` did the whole job at
   once. Whoever has to drive an installer from a session again should start there. It
   is a session-tooling problem and not a product one: Nick uninstalls from Apps and
   Features, which is not silent.
9. **The uninstall removed the install folder completely, which is the sibling folder's
   receipt.** The uninstaller deletes its own two files and then calls a NON-recursive
   `RMDir` on the install folder, so it only disappears when nothing else is in it. Had
   the WebView2 profile been put inside it, as the chip's folder name would have meant,
   the uninstall would have left the folder behind with about 32 MB in it, and the
   second copy of the progress file would have been deleted outright.

Gate 16 findings (2026-08-31):

10. **The chip put the backup in the install folder, and the build caught it.** This was
    the orchestrator's error, not the builder's. `%LOCALAPPDATA%\Repertoire Trainer` is
    `$INSTDIR`: `src-tauri/target/release/nsis/x64/installer.nsi:504` sets it to
    `$LOCALAPPDATA\${PRODUCTNAME}`. So the safety backup would have been written where an
    uninstall deletes, and the 32 MB WebView2 profile would have gone there too, where
    the uninstaller's **non-recursive** `RMDir "$INSTDIR"` (line 770) would have left it
    orphaned for ever. Both now live in `Repertoire Trainer Data`. The deviation was
    right and the chip was wrong.
11. **The uninstaller's data-removal step now points at the wrong folders, and that
    needs a ruling.** Lines 832 and 833 remove `$APPDATA\${BUNDLEID}` and
    `$LOCALAPPDATA\${BUNDLEID}` - the *identifier* folders. Phases 15 and 16 renamed
    every folder a person reads while deliberately keeping the identifier, so **"remove
    my application data" no longer removes any of it**. Today that was a mercy: Nick
    clicked Uninstall twice and his progress and its backup were untouched, because the
    uninstaller has never heard of `Repertoire Trainer` or `Repertoire Trainer Data`. In
    principle it is wrong, and neither phase noticed. The fix is an NSIS hook naming the
    real folders, which is installer code that deletes things, so it wants Nick's ruling
    rather than a quiet edit. Recorded in the SPEC section 6 register.
12. **The guard's real-machine trigger is unproven, and the reason given does not match
    the machine.** Open item 1 says the phase 15 migration kept restoring from
    `Roaming\com.nick.london-trainer` and so the guard could never fire. Nick's own
    `dir /b "%APPDATA%"` shows only `Repertoire Trainer`, and said the same hours
    earlier. The likeliest explanation is that the builder met a migration fixture of
    its own making. This is an evidence gap, not a code gap - the guard has 25 tests
    including 8 on real folders - but the stated reason should not stand as written.
13. **The gate drove the guard itself, over real folders.** Nine checks. A new trainee
    starts blank; a deleted progress file blocks and offers the copy; **Nick's exact
    incident - the whole data folder deleted, marker gone with it - blocks and offers
    both learnt lines and the hidden-course list back, byte for byte, with the date it
    was written**; both folders destroyed starts blank because nothing survives to
    contradict it; the guard writes nothing in any path; and the copy is genuinely
    outside the data folder. One check failed first time on the gate's own wrong guess
    at the API (the offer carries the parsed state, not raw text) and passes as written.
14. **Nick verified 16.2's acceptance on his own machine**, which no agent could do
    honestly after today: `dir /b "%LOCALAPPDATA%\Repertoire Trainer"` returns
    `repertoire-trainer.exe` and `uninstall.exe`. No orphaned `london-trainer.exe`, and
    no `WebView2` folder inside the install folder either.
15. **Verified for the gate from the repo:** 604 tests (up from 561) and `tsc -b` clean,
    both re-run; five commits with trailers naming the actual model; the port change in
    both `package.json` and `devUrl` with `--strictPort`; `hiddenCourses` parsed through
    the same string filter as `learntLines` with no progress-version bump, so an older
    build drops a cosmetic flag instead of refusing the file.

- [x] **Review gate 16 passed** (2026-08-31)

## Phase 17 - screen polish, a visible version, and an uninstaller that finishes the job

Goal: eight items from Nick using the app on 2026-08-31. Seven are presentation; one is
the uninstaller ruling the gate 16 register was waiting for.

Chipped as `chips/phase-17-polish-and-uninstall.md`. The dangerous item is 17.7. Tauri's
`installerHooks` can define `NSIS_HOOK_POSTUNINSTALL`, which the generated script already
calls, but the stock data-removal block is guarded by `$DeleteAppDataCheckboxState = 1`
and `$UpdateMode <> 1`, and a hook without the same guard would delete the progress file,
its marker and its backup on every routine upgrade. The chip says so twice and tells the
builder to ship the other seven and leave 17.7 undone rather than guess.

Nick's version ruling: **1.5.0**, five built-in courses, last digit the patch number.
Three files carry a version and all three disagree today (`package.json` 0.0.0,
`tauri.conf.json` and `Cargo.toml` 1.1.0), so the phase aligns them and adds a test.

- [x] 17.1 Centre the Course dropdown in its row.
- [x] 17.2 Board controls: Start becomes Reset, Back and Forward become arrows with real
  accessible names, and "Play a game from here" joins that row as "Play from here".
- [x] 17.3 Left-justify "Auto step this line" with the moves column.
- [x] 17.4 Show the version after the heading, injected at build time so the browser
  build has it too.
- [x] 17.5 Version 1.5.0 in all three files, with a test that holds them together.
- [x] 17.6 Board coordinates snug to the top left and bottom right of their squares, and
  contrasting with them: rank 1 light because a1 is dark. Correct when flipped for Black.
- [x] 17.7 The uninstaller removes the real data folders when the trainee asks it to, and
  never on an upgrade. Its own commit, proved four ways against fixtures.
- [x] 17.8 Right padding inside the scrolling chapter prose.
- [x] 17.9 The seven presentation items proved in the packaged app, with a screenshot of
  the board for 17.6.

Acceptance: the eight items done as described; 1.5.0 in all three files, held by a test
and visible in the app; coordinates snug and contrasting in both orientations; ticked
uninstall removes both data folders while an upgrade and an unticked uninstall leave them
alone, each proved against fixtures; vitest green and `tsc -b` clean.

**Proved in the packaged 1.5.0 window**, measured at 1280x900 through the DevTools port,
with the app started from `src-tauri/target/release`:

1. The header reads "Repertoire Trainer v1.5.0", the version at 12.8px and weight 400 in
   the faint colour, against the heading's 24px and 700.
2. The Course row sits 16px below the header and 16px above the view, and the label and
   the select share a centre line at y=121.
3. The control row under the board is Reset, an arrow labelled "Back one move", an arrow
   labelled "Forward one move", and Play from here. Nothing named play is left in the
   side column.
4. "Auto step this line" starts at x=684. The column beside the board starts at x=684.
5. The chapter panel scrolls, its scrollbar is 15px wide, and the lead paragraph's right
   edge is 14px clear of it - padding inside the panel, so the gap does not depend on the
   scrollbar being there.
6. Board coordinates, white orientation: rank 1 at the top of the bottom row in the light
   shade on the dark a1, rank 8 at the top of the top row in the dark shade on the light
   a8, file a hard against the right edge of the a-file. Flipped for the Caro-Kann every
   label swaps shade and stays right, which is the case that could have gone wrong.
7. The Progress screen still reads "2 of 219 lines learnt across 5 courses. 17 cards, 17
   due now" - the app's own view of Nick's real progress file, which is the only view of
   it a session is allowed to report.

**What the phase found, and what it left open.**

1. **The chip was wrong about the board coordinates in two ways, and both mattered.** The
   brown theme DOES colour the rank and file labels, not only `coords.squares`; it
   colours them for a board that draws its ranks down the RIGHT edge, painting ranks 1,
   3, 5 and 7 dark, which is exactly the set that sits on dark squares on the a-file
   where they actually are. That is why rank 1 was dark grey on the dark a1. And
   chessground does not build a wrapper inside its host element - it adds `cg-wrap` to
   that same div - so the rule already in `board.css` written as `.board .cg-wrap` had
   never applied to anything. The first attempt at 17.6 inherited that mistake and
   changed nothing on screen.
2. **The uninstaller hook cannot be tested end to end on this machine, and saying so is
   the honest answer.** The shipped hook names `%APPDATA%\Repertoire Trainer` and
   `%LOCALAPPDATA%\Repertoire Trainer Data`, which are Nick's live folders; no fixture
   can stand in for them at those paths, and today's standing rule says a session cannot
   verify his data folders from its own view of the filesystem anyway. What IS proved:
   `scripts/check-uninstall-hook.mjs` compiles the same macro text with the two folder
   names redirected at scratch folders and runs all four combinations, and the guard is
   character-identical to the stock block three lines above where Tauri inserts the hook.
3. **The check earned its keep twice.** It failed first on the one case that deletes,
   because NSIS has no backslash escaping and the doubled separators in the generated
   paths were a path `RMDir` would not take - so it can tell a working macro from a
   broken one. Then, with the upgrade half of the guard deliberately removed, it failed
   exactly the second case and nothing else. That is the incident this hook exists to
   prevent, demonstrated.
4. **For Nick to run, if he wants the fourth proof.** Install 1.5.0 over the top and
   check both folders are still there; uninstall with the box UNTICKED and check the
   same; uninstall with the box TICKED and check they are gone; reinstall and confirm a
   clean first start. `dir /b "%APPDATA%\Repertoire Trainer"` and
   `dir /b "%LOCALAPPDATA%\Repertoire Trainer Data"` answer it. Take an export first,
   from the Progress screen, because the third step is the one that means it.
5. **The trail's first chip still says "Start".** With the control-row button renamed to
   Reset, "Start" now appears once on the screen, on the move trail, where it means the
   position the line starts from. Left alone deliberately: it names a position, not an
   action, and renaming it was not asked for.
6. **The installer built as `Repertoire Trainer_1.5.0_x64-setup.exe`** and is in
   `src-tauri/target/release/bundle/nsis`. Nothing was installed: the running app on this
   machine was Nick's own installed 1.1.0 copy, and it was closed only because two
   instances cannot share one WebView2 profile, then left closed rather than upgraded
   behind his back.
7. **`scripts/packaged-eval.mjs` grew a `--shot` mode**, because the board is the one
   thing in this phase a measurement cannot settle.
8. **Three adjustments after that record was written**, all from Nick looking at the
   packaged window and all inside item 17.6's ground. The file letters went right 1px
   and down 2px, then 1px further each way, so they now sit in the corner of their
   square with the row on the board's bottom edge; the rank numbers went left 1px. And
   the pieces are drawn at 95% of their square, centred, which is a `--piece-size`
   custom property on `.board`. The piece BOX keeps its full square: chessground writes
   `transform: translate(...)` onto every piece on every move and the box is what a
   click and a drag land on, so only the background image shrinks. The installer was
   rebuilt after each.
9. **Shrinking the pieces was only half of what the letters needed.** At 95% the piece
   bases still ran through the file letters, which a 3x view of rank 1 showed plainly:
   the bishops' and the king's bases crossed C, E and F. Shrinking alone takes half its
   room off the TOP of the piece, where nothing needed it. So the image is also anchored
   low in its box - `--piece-lift: 30%`, meaning 30% of the freed space above and 70%
   below - and at `--piece-size: 90%` the bases now end above the letters. Measure that
   way round if it comes up again: the letters are about 10px of a 48px square, and a
   centred shrink buys half of what it looks like it should.
10. **Both labels are now set the same way round**, which is what makes the two corners
    match: the letters' row sits on the board's bottom edge with each glyph 1px in from
    the right of its file, so the numbers' column sits 1px in from the left edge with
    each glyph on the top of its own rank. Measured on a1 in the packaged window: the
    number 1px from the left and 0 from the top of its square, the letter 1px from the
    right and 0 from the bottom. Still right flipped for the Caro-Kann.

Gate 17 findings (2026-08-31):

11. **The hook's guard was re-proved at the gate, including the mutant.** Both halves of
    the guard are character-identical to the stock block, which the generated script
    puts three lines above the `!insertmacro` at `installer.nsi:838`, and the hook is
    included at line 31 of that script, so it is genuinely wired in. Running
    `scripts/check-uninstall-hook.mjs` unchanged passed all four cases; running it with
    the `${AndIf} $UpdateMode <> 1` line deleted failed case two - ticked, but an
    upgrade - and nothing else. The builder's claim holds exactly as written. The hook
    also fails closed on an uninitialised checkbox: NSIS reads an empty variable as 0 in
    a numeric compare, so a silent uninstall removes nothing.
12. **The folder names had nothing holding them, and now do.** The literals in
    `installer-hooks.nsh` match `DATA_FOLDER` in `src/storage/paths.ts` and
    `LOCAL_FOLDER` in `src-tauri/src/lib.rs`, checked by hand at the gate - but only a
    comment said they had to. `check-uninstall-hook.mjs` cannot cover it, because it
    redirects both names at scratch folders in order to run at all, and it needs
    makensis so it is run by hand. Phase 17 added a test to hold three version strings
    together and left the more dangerous constant on trust. `src/storage/installer-hook.test.ts`
    now holds both folder names and both halves of the guard on every `npm test`, and
    was verified to FAIL on a renamed folder rather than merely to pass. Landed at the
    gate as its own commit.
13. **`vite.config.ts` still fell back to 5173.** `package.json`'s `dev` script and
    `devUrl` both name 5175, so `npm run dev` was safe, but a bare `npx vite` would have
    served this app where another project answers - the exact setup that once showed
    DataCrafter inside a window titled Repertoire Trainer. One line, fixed at the gate as
    its own commit. Pre-existing, not phase 17's doing.
14. **The seven presentation items were re-measured at the gate**, in the browser build
    at 1280x900 rather than the packaged window, so they are a second and independent
    reading: the header shows `v1.5.0`; the Course label and select share a centre at
    y=121.3; the control row is Reset, an arrow labelled "Back one move", an arrow
    labelled "Forward one move", Play from here, with `.line-actions` gone and only the
    move trail's "Start" chip left in the side column; "Auto step this line" starts at
    x=684 and the side column starts at x=684; the chapter panel carries 14px of padding
    inside a 15px scrollbar. Every number matches the builder's record.
15. **17.6 was verified numerically in both orientations, which is the case that could
    have gone wrong.** White, the London: every rank number sits 1px from the left edge
    at the exact top of its own rank, every file letter on the board's bottom edge, and
    rank 1 and file a read `#fff6e3` on their dark squares while rank 2 and file b read
    `#6b4c30` on their light ones. Flipped, the Caro-Kann: rank 1 is now on h1 and reads
    dark, file a is now on a8 and reads dark, and the alternation is right the whole way
    round. The DOM order does not flip - chessground writes ranks 1-8 and files a-h and
    turns the flex direction round instead - so the `.black` rules are what carry it, and
    they do.
16. **The chip was wrong about the brown theme and the builder was right.** The chip said
    it colours only `coords.squares`. It also colours `.orientation-white .ranks` and
    `.files` by `nth-child`, at `chessground.brown.css:46-62`, which is why rank 1 read
    dark grey on the dark a1 before this phase. The app's rules beat it on specificity,
    (0,3,2) against (0,3,0), and the `.black` ones by more. Removing `.board .cg-wrap` was
    also right: chessground adds `cg-wrap` to the host div rather than building a child,
    and the host carries its size inline from `Board.tsx`.
17. **Verified for the gate from the repo:** 613 tests and `tsc -b` clean, both re-run
    after the gate's own two commits; oxlint reports only the six warnings that predate
    the phase; no em dashes; six builder commits with trailers naming the actual model.
18. **Still Nick's to run**, and it cannot honestly be anyone else's: install 1.5.0 over
    the top and check both data folders survive; uninstall with the box unticked and
    check the same; uninstall with it ticked and check they are gone; reinstall for a
    clean first start. Take an export from the Progress screen first.
    **Run by Nick on 2026-09-02, all four steps, on 1.6.3 and 1.6.4, and every one
    passed.** Install over the top: both folders and all three progress copies survived
    (`courses/` absent is correct - the app only creates it on import). Uninstall with the
    box unticked: listing identical. Uninstall with it ticked: both folders gone. Fresh
    install of 1.6.4: clean first start, and Import progress restored his export. The
    three guard cases are now proved on his machine, not only on fixtures, and the gate
    16 register item is settled for good.

- [x] **Review gate 17 passed** (2026-08-31)

## Phase 18 - the Vienna Gambit, a sixth course

Goal: a sixth built-in course, and Nick's second White answer to 1...e5.

Chipped as `chips/phase-18-vienna-gambit.md`. Nick ruled the variation on 2026-08-31,
choosing the gambit (1.e4 e5 2.Nc3 Nf6 3.f4) over the two quiet Viennas for the same
reason that picked the Zukertort over the Koltanowski: he already owns the quiet,
structural answer to 1...e5 in the Ruy Lopez Exchange, so a second quiet one would teach
a shape he has. The course id is `vienna-gambit` and it is permanent.

Two things make this phase different from the other course builds. The checkers were
tuned on quiet structural courses, and a gambit gives something away on purpose, so the
chip carries a grading rule: the ruled gambit moves are kept when 2500 ms says the
position after them is no worse than about -0.3 for White, and every other 0.5-pawn
finding is a real fault. And the course has to be honest where the gambit is only equal,
because a chapter that oversells it is worse than no chapter.

The 2...Nc6 move order gets a decision rule rather than a ruling: 3.f4 exf4 4.Nf3 g5 is
a memorisation contest, so the chip recommends 3.Bc4 reaching the same ground by another
door, and lets the builder take a different branch on evidence as long as chapter 4
answers 2...Nc6 completely.

- [x] 18.1 The variation, the chapter list and the 2...Nc6 policy - ruled in the chip.
- [x] 18.2 Draft the seven chapters to the section 3 bar, names on every leaf.
- [x] 18.3 Say honestly where the gambit is only equal.
- [x] 18.4 All three checkers, run twice at 500 ms, every finding re-checked at 2500 ms.
- [x] 18.5 One regression pass over the five courses that already shipped, recorded.
- [x] 18.6 The course's block in `src/content/content.test.ts`, with one claim that is
  really about this course.
- [x] 18.7 Extend the course-scoping test: the Ruy and the Vienna agree on 1.e4 and
  disagree after 1...e5.
- [x] 18.8 Export `docs/bundles/vienna-gambit.pgn` and confirm the round trip picked it
  up.
- [x] 18.9 Version 1.6.0 in all three files, held by `src/version.test.ts`.
- [x] 18.10 Prove it in the packaged app; delete every fixture.

Acceptance: the course meets the section 3 bar with names on every leaf; all three
checkers run and recorded with the 2500 ms re-checks; the gambit's concessions measured
rather than asserted; it round-trips through its own bundle; the scoping test covers the
Ruy against the Vienna; 1.6.0 in all three files; it works in the packaged app; the
other five courses untouched; vitest green and `tsc -b` clean.

Open items (phase 18):

1. **The gambit's concessions, measured rather than asserted.** At 2500 ms the position
   after 3.f4 is **-0.22** for White, inside the chip's -0.3 floor, and the engine's own
   preference at move three is only +0.24, so `engine-pass.mjs` never flagged the entry
   move at all in six runs. The other f-pawn pushes: 2...d6 3.f4 costs 0.32 and leaves
   **+0.20**; 3...Nf6 4.d3 Bc5 5.f4 costs 0.38 and leaves **-0.12**. All three are kept
   and all three numbers are in the course, not just in this list.
2. **The 500 ms passes are samplers, and this course says so again.** Four runs over an
   identical move set reported 4, 4, 5 and 2 findings; only one move was flagged in all
   four. Every finding was re-checked at 2500 ms before anything changed, and three of
   the four run-specific ones came back under the threshold: ch6's `9.Bd2` at 0.37,
   ch6's `10.O-O` at 0.29, ch3's `7.exd6` at 0.07 against 0.63 on the run that found it.
3. **Two things the checkers found, and the course changed for them.**
   - ch5, `2...f5 3.exf5 Nf6 4.Nf3`, cost 0.51 at 2500 ms. Replaced by **4.g4**, which
     holds the extra pawn with a pawn and prepares g5 to drive the knight home. That
     branch is now four lines instead of one and White is a pawn up in all of them.
   - ch4, the `4.Bxf7+` sacrifice was oversold and the best defence was missing. After
     `4...Kxf7 5.Qh5+ g6 6.Qxe5`, 6...Bg7 7.Qxa5 wins a knight and two pawns for the
     bishop, but Black's best is **6...Nc6**, when 7.Qxh8 is the only good move (7.Qd5+
     is -1.41 and 7.Qf4+ is -1.59) and White still needs 8.Nd5 and 9.Qh7 to free the
     queen, ending about **+0.5**. That whole line is now the main branch and the
     chapter intro says what the sacrifice is really worth.
4. **Five findings kept, with their numbers.** ch2's `7.Nxf3` costs 1.51 at 2500 ms
   against 7.Ke3 and is the only move flagged in every run (see item 5). ch4's `4.Bxf7+`
   costs 0.58, which is the horizon effect of a sacrifice: the engine picks Bxf7+ itself
   at the parent and then re-values the child from a piece down. ch6's `9.Bd2` (0.37),
   ch6's `10.O-O` (0.29) and ch3's `7.exd6` (0.07) are all under the threshold at 2500 ms.
5. **The chip's grading rule and SPEC section 3 disagree about one move, and it is
   recorded rather than resolved.** The chip says any non-gambit student move still
   costing 0.5 at 2500 ms is a real fault; SPEC section 3 says that where two choices
   are both sound, take the one needing less memorisation. ch2's `7.Nxf3` is both: it
   costs 1.51 against 7.Ke3, and it leaves White **+1.07** with the king reaching f2 next
   move instead of walking to e3 in a sharp position. The course keeps 7.Nxf3, authors
   7.Ke3 as a graded alternative that names both numbers, and leaves the rule question
   for the gate. Nothing was softened: the ruled line is unchanged.
6. **Eleven mistake grades were wrong and `engine-mistakes.mjs` said so.** The first run
   found six disagreements, all "graded too kindly" except one band-edge "too harshly".
   Two were real blunders sold as inaccuracies: ch0 and ch1's `10.Bc4+`, which loses a
   piece to 10...Nxc3 11.bxc3 dxc4, and ch0's `12.Bxb7`, which drops the bishop straight
   back. One was the opposite: `2.f4` instead of 2.Nc3 costs 0.64, under the mistake
   band's floor, and is now an inaccuracy. A second run flagged ch4's `Bxf7+` alternative
   at 1.88 against the 1.80 band edge, and it turned out to be worse than a band edge:
   at 2500 ms that sacrifice leaves White **-1.72**, so it is graded a mistake now. The
   last two runs over the finished content found **0 and 0**.
7. **`note-claims.mjs` did work on this course, which is a finding about the checker.**
   Gate 14 recorded 0 parseable claims in 77 Colle entries, because that course's prose
   used idioms the checker does not read. Here it parsed 7 claims out of 100 entries and
   said 4 of them were not supported by the board. Three were real prose faults and one
   was the checker's documented baseline effect: ch4's "loses a bishop" is true in
   absolute terms, and the checker measures against the repertoire line, where White has
   already given the bishop for two pawns on f7. All four notes were rewritten anyway,
   and the final runs report **0 unsupported** with 5 claims checked. So the difference
   between the Colle and this course is the prose, not the checker.
8. **The by-hand read found two more notes the board does not support**, both the class
   no checker sees. ch1's `6.Bb5` entry said 6.d3 lets Black "take on e5", when
   6...Nxc3 7.bxc3 Nxe5 8.Nxe5 loses a piece for Black; the real answer is 7...d4, and
   the note says so now. ch5's `4.g4` entry claimed Black "wins the pawn on f5 back"
   after 4.Nf3, which the engine does not show in either main try. Both rewritten.
9. **18.5, one pass over the five courses that already shipped: 12 findings, none
   fixed.** The Caro-Kann reported 0. The Colle reported 2 (`d4 c5 e3` at 0.51 and a b3
   at 0.50), the London 4 (the 2.02 on `Nb5` after ...Qxb2 is the pawn-grab punishment,
   plus three around 0.5), the Slav 3 and the Ruy 3. **The Ruy's three are all `Bxc6`**,
   which is the Exchange Variation's defining move: the checker penalises a repertoire's
   own concession in every course, not only in a gambit. Their content is settled and
   swept, so this is a regression read, not a to-do list.
10. **The 2...Nc6 branch took the chip's door and not its move.** 3.f4 exf4 4.Nf3 g5
    measures -0.5 for White with every try, so 3.Bc4 stands. But the chip's follow-up,
    "play f4 next when Black plays ...Nf6 anyway", loses a pawn: 3.Bc4 Nf6 4.f4 Nxe4
    5.Nxe4 d5 forks bishop and knight, and after 6.Bd3 dxe4 7.Bxe4 exf4 Black is a pawn
    up. So the f-pawn waits for **d3** first, and against an early ...Bc5 it waits for
    **Na4** to trade the bishop off, because 3...Bc5 4.d3 d6 5.f4 runs into 5...Bxg1 and
    6...Qh4+. Both are authored as graded mistakes with the reason, and the chapter's
    rule is one sentence: deal with the bishop on c5 before the pawn moves.
11. **The bundle landed with the content**, for the reason gate 14 recorded: the suite
    holds `docs/bundles/*.pgn` to the writer's current output, so content without its
    bundle is a red commit. The round trip picked the new course up on its own, checked
    rather than assumed: `exports vienna-gambit and reads it back as the same course`.
12. **Proved in the packaged 1.6.0 app, driven over the DevTools port.** Six tiles with
    the Vienna last, "0 of 89 lines learnt"; the header reads v1.6.0; Study opens all
    seven chapters and auto step walked `4...Nd5 and the king walk` to 10.Bd3 with the
    note, the plan and the `bishop-placement` tag showing and the forward arrow disabled;
    Play from here started a game from that exact position and Stockfish answered
    10...g5. Ticking one Vienna line took Drill from 17 cards to 24 and offered "The
    Vienna Gambit 7 due" as its own queue, seven cards for the line's seven White moves,
    and a card rendered saying "White to move. Play the move the repertoire plays."
13. **The fixture was one tick, and it is gone.** Nothing was dropped into AppData,
    because the course is bundled. The one write was the learnt flag, and the app's own
    screens read the same numbers before and after: 2 of 308 lines learnt across 6
    courses, 17 cards, 17 due now, 17 never answered, and the Vienna tile back at 0 of
    89. No drill card was answered and no game was finished, so nothing else could have
    been written. **Nick's own files are still his to check**: this session cannot list
    his folders honestly and did not try.

Gate 18 findings (2026-08-31):

14. **Three moves claimed a check they do not give, and two of them dragged a note along.**
    Both `Bc4+` in the Vienna sit where the pawn on d5 blocks the diagonal; the Slav's
    second `Qa5+` sits where a pawn on c3 does, and its note went further and offered
    6.Nc3 as a way to block a check that is not there, on a square White's own pawn is
    standing on. Nothing caught these because **chess.js accepts a spurious marker and
    normalises it away** rather than refusing the move, so the two have to be compared
    explicitly. `content.test.ts` now does, in both directions, inside the per-course
    block that every future course joins automatically. Verified to fail on a restored
    marker. Three notes rewritten, each now leading with the line that works - which is
    also what `note-claims.mjs` reads, as the first rewrite found out when the checker
    measured the failing line instead. A fourth note in the same sweep said nothing
    defended the knight on d5 and then described the queen defending it: the queen is the
    only defender and cannot use the square, because 5...Qxd5 6.Nxd5 wins it.
15. **Two Vienna alternatives were graded too kindly, and the phase's own last runs said
    zero.** 4.Bc4 instead of 4.e5 costs 0.96 at 2500 ms, taking White from +0.71 to
    -0.25, so Black gets ...c6 and ...d5 in and is the one standing better. 7.Bd3 instead
    of 7.Bb5+ costs 1.35, from +0.72 to -0.63, because the check is what stops ...exd4
    arriving with the pawn intact. Both are over the playable band's 0.9 ceiling and are
    inaccuracies now, with notes that say what the move gives up. **This is the sampler
    lesson from the direction nobody had seen it from**: every previous record treats a
    500 ms run as capable of inventing findings, and this one missed two real ones. Two
    independent measurements, at 900 ms and 2500 ms, agree.
16. **The rule conflict in open item 5 is ruled: the engine is a floor, not a chooser.**
    SPEC section 8 carries it. Where two moves both leave the student clearly better, the
    section 3 fork rule governs and the chip's half-pawn threshold does not overrule it;
    where only one move keeps the position, the threshold binds. So ch2 keeps 7.Nxf3 at
    about +1.3 over 7.Ke3 at about +2.4, and 7.Ke3 stays authored with both numbers. A
    course that teaches a king walk to e3 in the sharpest position in the repertoire is
    teaching a line its reader will get wrong under pressure.
17. **The gate re-ran engine-pass itself at 1200 ms and got the phase's own three**, which
    is corroboration rather than a new finding: ch2's Nxf3 at 1.24, ch6's Bd2 at 0.62 and
    ch3's exd6 at 0.61. Re-checked at 2500 ms the last two are **0.46 and 0.31**, both
    under the threshold, so the phase's conclusion stands even though its numbers were
    lower still. Open item 4's horizon-effect explanation for ch4's `4.Bxf7+` checks out
    exactly: at the parent the engine's own first choice is Bxf7+ at **+1.37**, with Be2
    a distant +0.59. And the replacement in open item 3 is the engine's top move: after
    2...f5 3.exf5 Nf6, **4.g4 is +1.61** against 4.Nf3 at +1.09.
18. **Open item 10's correction of the chip is right, and the chip was wrong.** After
    3.Bc4 Nf6 4.f4 Nxe4 5.Nxe4 d5 White's best is 6.Bd3 at **-1.15**: the fork really
    does win a pawn, so the f-pawn has to wait for d3. The orchestrator's suggested
    follow-up would have shipped a pawn-down line.
19. **The structural bar, audited independently**: 89 leaves across seven chapters, every
    one named, planned and noted, no duplicate names, none over 40 characters; mistake
    entries on 12, 10, 16, 13, 16 and 13 positions in ch1 to ch6 and 6 in ch0; every tag
    in the core set or the manifest; ch0's intro 378 words. The Vienna's own test block
    holds two claims that are really about this course - f4 is played in every chapter,
    and never before the knight reaches c3 - and the scoping test names the two positions
    rather than only counting them.
20. **Verified in the browser build at 1280x900**: six tiles with the Vienna last, "0 of
    308 lines learnt across 6 courses", the Vienna tile at 0 of 89, the header at v1.6.0,
    and the Vienna's Study screen stepping to 3.f4 with its arrow, its note, its
    `gambit-pawn` and `f-file` tags and "continue with d5" weighted 8. Independent of the
    packaged run in open item 12, and every number matches it.
21. **Verified for the gate from the repo:** 659 tests and `tsc -b` clean, both re-run
    after the gate's own two commits; oxlint reports the same six warnings that predate
    the phase; no em dashes; six builder commits with trailers naming the actual model;
    the other five courses' content untouched by the builder, and touched by the gate only
    in the one Slav note above.
22. **`engine-mistakes.mjs` over the five older courses: run at the gate, one fault found
    and fixed.** Item 15 shows a single run can miss a real grade error, and those five
    were each signed off on runs of the same kind, so the sweep was worth the hour. The
    "graded too kindly" side came back with exactly ONE entry across all five: the
    London's `3.e4` against a King's Indian setup, graded playable and sold as "a real
    try", where **3...Nxe4 simply takes the pawn** - nothing guards e4, and 4.Bd3 hits
    the knight without getting it back. It costs 0.93 at 2500 ms against a 0.9 ceiling
    and is an inaccuracy now, with a note that says the pawn hangs. The Slav and the
    Colle reported nothing; the London's other 14, the Caro-Kann's 3 and the Ruy's 1 are
    all "graded too harshly", the known noise class. The Ruy's was read by hand because
    its note claims a mate: `10.hxg4 hxg4 11.Ne1 Qh4` is NOT mate, it is a mate threat,
    but the engine scores every White reply there at forced mate, so the shorthand stands
    and the entry is left alone. What is still open is the SECOND pass, which is what
    would let anyone call those five clean; the register says so.
23. **Nick's own files were not listed and not reported**, as the standing rule requires.

- [x] **Review gate 18 passed** (2026-08-31)

## Phase 19 - the second mistakes pass, at verdict strength

Goal: settle whether the graded alternatives in all six courses are right. No new
content, no change to any repertoire move.

Chipped as `chips/phase-19-second-mistakes-pass.md`. This is the register entry SPEC
section 6 has carried since gate 18, where two Vienna alternatives graded playable turned
out to cost about a pawn while the phase's own last two runs of the mistake checker
reported zero. That was the first proof a short run can MISS a finding rather than only
invent one. The gate then ran one 900 ms pass over the five older courses and found one
real fault, the London's `3.e4`. What was left open is the second pass.

**The decision taken in the chip: once at 2500 ms, not twice at 900 ms.** 2500 ms is
already the arbiter every gate uses, so a finding at that movetime needs no re-check and
silence at it is as strong as this project has ever asked for. The Vienna is included,
because two of its grades were changed at the gate and it is the course with the least
settled grades, not the most.

- [x] 19.1 Run the pass at 2500 ms over all six, one at a time, nothing else on the CPU.
- [x] 19.2 Compare against the 900 ms run: in both, only the first, only this one.
- [x] 19.3 Fix every "graded too kindly" finding, in grade and in note.
- [x] 19.4 Read every "graded too harshly" note for a false reason; keep the grades.
- [x] 19.5 `note-claims.mjs` over all six, plus the by-hand read of entries a capture
  answers.
- [x] 19.6 Touch `mistakes` entries only: a `san` on a line path is a line id in Nick's
  progress file.
- [x] 19.7 Re-export the bundles, and take the version to 1.6.1 if anything changed.
- [x] 19.8 Close or narrow the register entry with what two passes now say.

Acceptance: all six passed at 2500 ms with per-course results compared against the 900 ms
run; every too-kindly finding fixed; every too-harshly note read for a false reason with
the count recorded; `note-claims.mjs` run with its counts read; bundles re-exported and
the version at 1.6.1 if anything changed; the register entry closed or narrowed; vitest
green and `tsc -b` clean.

Open items (phase 19):

1. **The pass, once at 2500 ms over all six, one course at a time with nothing else on
   the CPU. 1210 positions, just over 50 minutes, 22 findings, and three of them real.** Per
   course, as findings and then as the too-kindly count that matters: Vienna 0 and 0,
   Colle 1 and 0, Ruy 1 and 0, London 14 and 0, Caro-Kann 5 and **2**, Slav 1 and **1**.
   The three on the too-kindly side are the whole result. The other nineteen are the
   known noise class and none of them changed a grade.
2. **Two of the three are new, which is the sampler lesson again and from the same
   direction gate 18 found it.** Gate 18's 900 ms pass reported the Caro-Kann's three
   findings all on the harmless side and the Slav's as none at all. This pass found
   8...e6 in the Caro-Kann's Exchange costing **1.88**, over the inaccuracy band's 1.8
   ceiling, and 5...Bg4 in the Slav at **0.94**. A 900 ms run had looked at both
   positions and reported nothing. So a short run does not merely invent findings, and it
   does not merely miss small ones either: it missed a grade that was wrong by most of
   two pawns.
3. **The comparison in 19.2 is against this plan's own record, not against a saved list,
   and that is a gap worth naming.** Gate 18's raw 900 ms output is not on disk anywhere
   this session can reach, so "in both, only the first, only this one" could only be done
   at the level of counts and the two entries finding 22 names. Counts: London 15 to 14,
   which is exactly the `3.e4` the gate fixed, so that one is "only the first pass" by
   construction; Ruy 1 to 1, the same mate-shorthand entry read again below; Caro-Kann 3
   to 5 with both new ones too-kindly; Slav 0 to 1; Colle 0 to 1; Vienna 2 to 0, the two
   being the grades gate 18 fixed. **Whoever runs a third pass should save the output
   next to the plan**, because a count is a much weaker comparison than a list.
4. **The three fixes.** 8...e6 in the Caro-Kann Exchange goes from inaccuracy to mistake:
   it guards d5 and leaves b7, which is what the queen came out for, and 8.Qxb7 takes the
   pawn with the rook on a8 attacked as well. Its note said "it defends nothing", which
   is false twice over. 6...Nf6 against the f3 lines (0.91) and 5...Bg4 in the Slav
   (0.94) are inaccuracies now rather than playable, and both notes said "also
   reasonable" without saying what the move gives up.
5. **Two of the three sit on a band edge, and two runs at the same movetime disagree
   about which side.** A single-PV re-measurement at 2500 ms, the same search the checker
   runs, puts them at **0.79 and 0.80** against the checker's 0.91 and 0.94, so the two
   straddle the 0.90 playable ceiling. The 1.88 finding re-measures at 1.37, likewise
   straddling the 1.8 ceiling it crossed. **This qualifies the chip's premise**: 2500 ms
   settles the size of a cost well enough to teach from, and it does not settle which
   side of a band edge that cost falls. Both went to the stricter grade, decided on what
   the lines actually do rather than on the number: one sends the knight straight back to
   g8, the other hands White the pawn back and the centre with it.
6. **19.4: nineteen "graded too harshly" notes read, no grades changed, two reasons
   wrong.** The class is what SPEC section 6 says it is, positional judgements the engine
   scores at nothing, and fourteen of the nineteen are the London's. The two faults were
   both reasons rather than grades, which is the class no checker sees. The London's
   5.Bg5 note said the bishop has nothing to attack, when it is looking straight at d8
   through an empty f6, and the ...h6 the note recommends **loses the queen** to 6.Bxd8.
   The Caro-Kann's Panov note said 5.Bxc4 develops with tempo, and the bishop on c4
   attacks nothing at all. Both rewritten, both grades kept. The Ruy's single finding is
   the mate shorthand gate 18 ruled on, and it was checked here rather than inherited:
   after 10.Ne1 Qh4 the position is not mate, White has nineteen legal replies, and at
   2500 ms every one of them is a forced mate. The shorthand stands.
7. **19.5, and the counts matter more than the verdict.** `note-claims.mjs` reports 0
   unsupported claims in all six courses, out of 797 mistake entries. It reached **40 of
   them**, one in twenty: Caro-Kann 12, Slav 13, Ruy 8, Vienna 5, London 2 and the Colle
   **0**, which is gate 14's finding standing exactly where it was. Twelve more entries
   claim material without naming a move, and those are the human's list. So "0
   unsupported" means the checker found nothing wrong in the twentieth of the prose it
   can read.
8. **The twelve claims with no sequence were each played out on a board, and eleven hold.**
   The London's ...Nxc7 piece-loss line, its ...dxe5 knight-for-a-pawn, its ...Bxg2 and
   its ...Nxh5 queen win all check out; so do the Caro-Kann's "nearly two pawns", which
   measures 1.79, and its ...Nxe3 line, where Black really does win the e5 pawn a move
   later because ...e6 defends d5 and the recapture there loses the queen. The one fault
   is the Vienna's 5.Nxd5 note, which said taking with the bishop is what keeps a guard
   on d5. Taking with the knight leaves the bishop guarding it to exactly the same
   effect, and both recaptures win the piece. The real difference is 0.79 and it is that
   the knight on d5 gets chased.
9. **A fourth class of prose fault exists, four entries carried it, and no checker in the
   repo can see it: a note that names a line that cannot be played.** `note-claims.mjs`
   only plays a note's moves when the note also makes a material claim it recognises, so
   a note that names a line and ends "and Black is better" is never played at all. A
   scratch tool that plays **every** sequence in every mistake note found both Caro-Kann
   notes on the premature 3...Bf5 offering "4.exd5 cxd5 5.Qb3" where Qb3 is illegal,
   White's pawn still being on c2, and both Slav notes on 11...Re8 offering 12.Bxg6 with
   White's own pawn on e4 in the way. The Caro-Kann pair had been borrowed from the Slav,
   where the c-pawn has left and the queen does have the square. **The borrowed line also
   hid the real point**: 3...Bf5 hangs the bishop to 4.exf5, which is the whole reason the
   Caro-Kann bishop waits for the e-pawn to go. The tool is in the session scratchpad and
   not in the repo, because changing the checkers was out of scope. It is proposed for
   the register.
10. **Two smaller prose faults, from the same tool.** The Vienna's greedy-order note
    numbered its moves a full move late, saying 10...Kd8 and 11...g2+ where the board says
    9...Kd8 and 10...g2+; the move itself is real and really is a discovered check from
    the queen on h4. A Slav note wrote 7...Qxc1+ where the position is mate.
11. **One change outside the chip's boundary, in its own commit so it can be dropped on
    its own.** The illegal 5.Qb3 line is also in the Caro-Kann chapter 1 **intro**, in its
    typical-mistakes list. The chip scoped this phase to mistake entries, and the reason
    it gives is that a `san` on a line path is a line id in the progress file. An intro is
    prose that no line id or card key can contain, so the reason does not reach it, and
    leaving a known-false line two screens from the entry that now states it correctly
    was the worse of the two errors. Commit `fa935ea` is the whole of it.
12. **What two passes now say, per course, which is what closes the register entry.**
    Colle: two passes, nothing on the too-kindly side either time. Ruy: two passes, one
    finding each time and it is the same entry, read by hand at both gates and correct
    both times. London: 15 then 14, the difference being the one real fault gate 18 fixed,
    and nothing new. Vienna: 2 at the gate, both fixed, then 0. Caro-Kann and Slav: clean
    at 900 ms and three real faults between them at 2500 ms, now fixed. **The honest
    summary is not "these courses are clean"**, it is that every course has now had two
    passes, that the second one found what the first missed in two of them, and that a
    third would be a smaller bet than the second was.
13. **The case for the same treatment of `engine-pass.mjs` is now made, and it is Nick's
    to rule.** That pass judges the moves the course tells the trainee to play, it has the
    identical sampler problem, and it is roughly three times the positions. Everything
    this phase learnt argues for it: two of three real faults here were invisible to a
    900 ms run, and a repertoire move that is wrong is worse than a grade that is wrong.
    Recorded in SPEC section 6 rather than taken.
14. **Nothing was measured beside the sweep**, which is the hazard the chip leads with.
    The six courses ran one after another, and every other engine question in this phase
    was asked after the last one finished. Movetime is wall clock, so a measurement taken
    beside a running sweep weakens both and neither output shows it.
15. **Nick's own files were not listed and not reported.** This phase needed no packaged
    run and went nowhere near them.

Gate 19 findings (2026-09-01):

16. **The boundary in 19.6 held exactly, checked mechanically rather than read.** All 308
    line ids before the phase and all 308 after, none gone and none added, so nothing in
    Nick's progress file can have been unlearnt by this work. That is the check the item
    deserved and the phase did not state.
17. **Every number in the record survives re-measurement, and the ones that moved moved
    the way the record says they do.** The Caro-Kann's `7...e6` re-measures at 1.52
    against the checker's 1.88 and the phase's 1.37; the Slav's `5...Bg4` at 0.75 against
    0.94 and 0.80; the Caro-Kann's `6...Nf6` at 0.85 against 0.91 and 0.79. Three
    measurements of each, no two alike, all straddling a band edge - which is exactly the
    ruling the phase wrote into SPEC section 8, demonstrated a third time. **All three
    grades stand**: at those sizes both bands are legal, so the checker is content either
    way and the call is a teaching one, which is how the phase made it.
18. **The claims that could be settled by the board were, and every one holds.** `4.exf5`
    really does win the bishop and `5.Qb3` really is illegal in that position, the queen
    having only Qd2, Qd3, Qe2, Qf3, Qg4 and Qh5. `12.Bxg6` really was impossible, the
    bishop's ten legal moves not including it. `6.Bxd8` really does win the queen through
    the empty f6. `Qxc1` really is mate, so the rewrite from `+` to "mate" is right. The
    Vienna renumbering is right: the position is at move 9, `g2+` is a discovered check
    and `Qxg3+` is a check. And "the best it can do is go back to g8" is right by a hair,
    Ng8 at +0.83 against Nfd7 at +0.96.
19. **Item 7's counts are exact.** 797 mistake entries across the six, 40 carrying a
    sequence the checker can play, 12 claiming material without naming a move, the Colle
    at 0 - every figure reproduced, and 0 unsupported claims in all six.
20. **The registered checker was probed at the gate, and the probe found two live faults
    the phase had not.** The Caro-Kann answered `6...e6` with "7.h5 Bh7" in two chapters,
    where h7 is Black's own pawn: the note used the point it was teaching as if it had
    already happened. What follows is 7.h5 Bf5 8.Nxf5 exf5, the good bishop for a knight
    with doubled f-pawns, and the move costs 1.32 rather than being a lost tempo. Both are
    graded mistake now, in commit `c4dd1eb`.
21. **The probe also settled that the checker is a phase and not a gate fix**, which
    is why it was not built here. Naive, it reports 36 lines across 3269 notes and every
    one is a false positive. Placed by the note's own move number and side it reports 12,
    two of them real. The three remaining false-positive classes each need different
    handling and are written into the register entry with the two extra checks the same
    parse gives nearly free. That entry is now a design brief rather than a wish.
22. **Verified for the gate from the repo:** 659 tests and `tsc -b` clean, re-run after
    the gate's own commit; oxlint reports the same six warnings that predate the phase; no
    em dashes; six builder commits with trailers naming the actual model; version 1.6.1 in
    all three files.
23. **Nick's own files were not listed and not reported.**

- [x] **Review gate 19 passed** (2026-09-01)

## Phase 20 - the note-line checker

Goal: build the fourth checker, the one that plays the lines the prose names, and fix
what it finds. No new content, no repertoire move touched.

Chipped as `chips/phase-20-note-line-checker.md`. This is the register entry SPEC section
6 opened at phase 19 and gate 19 turned into a design brief. `note-claims.mjs` plays a
note's moves only when the note also makes a material claim it recognises, which reaches
40 of 797 mistake entries, so "0 unsupported claims" is a statement about five per cent of
the prose. Phase 19 found four entries naming an unplayable line; gate 19's probe found
two more the phase had missed.

**The decisions taken in the chip.** A script first and a test second, the test carrying
only the rules that reach zero across all six courses. Reuse `note-claims.mjs`'s parser
through a shared module rather than copying it. Place a sequence by its own move number
and side, which is the technique that takes the report from 36 false positives to 12 with
two real faults among them. Mistake notes and node notes are checked; chapter intros are
a separate mode that reports and never fails, because an intro has no anchor position.

The chip lists the ten lines gate 19's probe reports, four real and six false, so the tool
can be held to classifying them correctly rather than merely to running.

- [x] 20.1 Legality: every move in a named sequence plays from where the note places it.
- [x] 20.2 The first token's move number and side match the board.
- [x] 20.3 Check and mate markers in prose, both directions.
- [x] 20.4 Handle the back-reference class: report unplaceable, do not report illegal.
- [x] 20.5 Handle the deliberate illegality class, with clause-scoped negation.
- [x] 20.6 Handle the omitted-recapture class by widening the start, and say so.
- [x] 20.7 Fix the real faults, in their own commit.
- [x] 20.8 Promote the clean rules into `content.test.ts`, each proved to fail on a
  restored fault.
- [x] 20.9 Re-run the other three checkers over any course whose prose changed.
- [x] 20.10 Re-export the bundles; version 1.6.2 if anything changed.
- [x] 20.11 Close the register entry with what the checker does and does not cover.

Acceptance: the script exists, shares its parser, and classifies all ten known lines
correctly; the intro mode runs and its verdict is recorded; real faults fixed and false
positives silent without loosening the legality rule; the clean rules in the test suite,
each proved to fail on a restored fault; the other checkers re-run where prose changed;
bundles re-exported and the version at 1.6.2 if anything changed; 308 line ids before and
after; the register entry closed; vitest green and `tsc -b` clean.

Open items (phase 20):

1. **The checker reads 3577 pieces of prose across the six courses and reports 8 faults
   and 16 lines for a human.** Node notes, plans and mistake notes, all of which have a
   known position: Caro-Kann 605, Colle 436, London 583, Ruy 444, Slav 692, Vienna 817.
   Against gate 19's probe, which reported 36 lines naively and 12 with move-number
   placement, this reports 24 in total and gets every one of them into a category that
   says what to do about it. **All eight faults are real**, each verified on a board
   before the note was touched, and all eight are now fixed.
2. **Two ideas the chip did not name were needed, and without either the tool is
   unusable.** The first is that a note names a line in FRAGMENTS: "7.Qxd5 loses a piece
   to 7...Qxc1+" is two runs, and the second starts where the first ended. So every
   position a working reading reaches joins the pool the next run can be placed against.
   That single change took the report from 45 lines for a human to 13. The second is that
   prose BRANCHES: "7...Kd7 keeps everything. Only 7...g6?? hands it back to 8.Qxe5+"
   names two different Black seventh moves, so two positions in the pool are at White's
   eighth and the checker took the first. It reported the Ruy's `Qxe5+` as a wrongly
   marked check when the fault was its own branch. A reading with no marker mismatch is
   now preferred over one with, which removed three false markers.
3. **The eight faults, and seven of them are one class the chip found once.** A note that
   describes a real line correctly and counts it wrongly. Five are off by one, which is
   the drift of counting the entry's own move twice: the Caro-Kann Panov's `8.Bxc4` at
   move 7, the Caro-Kann Exchange's `6.g4` at 7, and three Vienna notes. Two are bigger
   and reading was never going to catch them: the Caro-Kann Advance answers a queen
   sortie with `17.Nxf5` where the board is at 10, and the Slav Exchange answers `13...e5`
   with `11.dxe5`. The eighth is the Ruy's `9.Qxh8`, which is check; the board says
   `Qxh8+` and it is not mate. **No grade changed**, because a number in front of a move
   does not change what the move is worth.
4. **The chip's ten lines, all classified, none of them by loosening legality.** Its three
   real ones are here: the Caro-Kann `6.g4` and the Slav `11.dxe5` as `misnumbered`, the
   Ruy `Qxh8` as `marker`. The two Slav `11.Kxh2` notes are `deliberate`, silenced by a
   legality-scoped negation test that looks at the clause the move sits in. The Vienna's
   "3...d6 line in chapter 3" is `back-reference`. The three Ruy `Ne1 Qh4` entries are
   `widened`, each reported with the move it needed - `hxg4`, the recapture the note
   leaves out. **One landed in a different soft category than the chip predicted**: the
   Slav's bare `4.Nc3` on a five-ply line comes out `widened` rather than `unplaceable`,
   because inserting the line's own next move reaches move 4. Both are soft and neither
   fails a build, and the two cases are structurally the same as the Ruy's, so separating
   them would have been a rule with no principle behind it.
5. **The intro mode runs, and the verdict is that it cannot be promoted.** An intro has no
   one position to be written from, so every sequence is tried against every position the
   chapter reaches, and prose branching then has hundreds of candidates rather than two.
   It reports three lines and all three are benign: two Caro-Kann intros naming a move
   from a line the chapter does not carry, and the Slav's `7...Qxc1+`, which is correct -
   check and not mate, verified on a board - and which the checker reaches by a coincidental
   route because an earlier paragraph polluted the pool. **A reporting mode is still worth
   having**: phase 19 found a real intro fault by hand, and the one parser change the mode
   forced - a line break ends a run, so a markdown heading ending on a move does not join
   the paragraph below it - fixed a genuine false positive.
6. **The marker rule has to read English, and this is the part most likely to break on a
   future course.** This content writes mate as a word: "7...Qxc1 mate" is right and
   `Qxc1#` would be worse. So a BARE move whose clause says mate or check is accepted. The
   reverse is never accepted: a move written `+` where the board says `#` is exactly the
   fault gate 19 found, and no word in the clause excuses it.
7. **Three rules are in the suite and three are not, and the split is the whole design.**
   In: illegal, misnumbered, marker, all at zero across all six courses. Out: the
   back-reference, the deliberate illegality and the omitted recapture, which are good
   prose. A test that fails on good prose is worse than no test, because it reads as
   coverage and then gets switched off.
8. **Each promoted rule was mutation-checked, not assumed.** Restoring the Panov's
   `8.Bxc4` fails the caro-kann-black block with "written as 8., the board is at 7.";
   restoring the Ruy's bare `Qxh8` fails ruy-lopez-exchange with "wrote Qxh8, the board
   gives Qxh8+"; restoring phase 19's `4.exd5 cxd5 5.Qb3` with White's pawn still on c2
   fails caro-kann-black with "the board refuses Qb3, move 3 of the run, at 4." Each was
   reverted and the tree left clean.
9. **The suite costs half a second more.** The naive version cost ten, because it replayed
   every line from move one for every note on it. Stations are built once per node and
   extended, which is the difference between the suite carrying this check and nobody
   agreeing to keep it.
10. **The boundary held, checked mechanically.** 308 line ids before the phase and 308
    after, rebuilt from `git show HEAD:courses/...` on one side and the working tree on
    the other, none gone and none added. Only prose changed.
11. **`note-claims.mjs` is byte-identical over all six courses after the parser moved out
    of it**, which was checked before the new checker was written and again after the
    line-break change. Its counts are gate 19's exactly: 797 mistake entries, 40 with a
    sequence it can play, 12 claiming material with no sequence, the Colle at 0, and 0
    unsupported claims in all six.
12. **What a future course author has to keep true**, now in `docs/content-schema.md`
    beside the `note` field rather than only in a register entry: number the first move of
    a sequence and keep the dots, because `7.` and `7...` are what place it; count from
    the position the note is written from, which for a mistake entry is the position after
    the wrong move. And what the checker deliberately allows, so nobody rewrites good
    prose to appease it.
13. **20.9 found something the phase did not go looking for, and it is the biggest result
    here after the checker itself.** `engine-mistakes.mjs` at 2500 ms over the four
    courses whose prose changed: Slav 0, Vienna 0, Caro-Kann 3 and all three on the known
    harmless side, Ruy **2 including one graded too kindly at 1.90**. That entry is
    `9.Qxd8+` in the Ruy's chapter 1, graded an inaccuracy against a band ceiling of 1.80,
    in a course phase 19 passed at the same 2500 ms with nothing on that side. **The
    fields this pass reads were byte-identical** - this phase changed prose only, checked
    by rebuilding the line-id set - so the same script gave two different answers about
    the same content at verdict strength. SPEC section 6's closed entry now says so.
14. **The grade stands and the note did not.** Single-line at 2500 ms: 3.39 after the
    repertoire `9.Qh5+` against 1.51 after `9.Qxd8+`, a cost of 1.88 against the checker's
    1.90. Within a tenth of a band edge, which SPEC section 8 already rules is a teaching
    call rather than a number, and the teaching call is easy here because the move keeps a
    real advantage instead of throwing one away. Its note said the move "trades into a
    level ending"; three lines at 2500 ms put that ending at about plus one and a half for
    White. The reason was wrong, so the reason was fixed, in its own commit with the
    numbers in the message.
15. **`engine-pass.mjs` at 500 ms over the same four courses, 1465 positions, eight moves
    at half a pawn or more and nothing structural.** Three of the eight are the Ruy's own
    `Bxc6` in the no-a6 chapter, which is the variation the course is named after. The
    largest is the Vienna's 1.36 inside a sacrificial line the engine still scores at plus
    one and a quarter for White. At 500 ms this is a sampler and settles nothing, which is
    why the second pass for it is still a register entry and still Nick's to rule.
16. **Nothing was measured beside the sweep.** The four courses ran one after another,
    mistakes first and then the move pass, from 09:11 to 09:57, and the three
    re-measurements that settled the Ruy entry were asked after the last one finished.
    Movetime is wall clock and neither output would show the difference.
17. **Nick's own files were not listed and not reported.** This phase needed no packaged
    run and went nowhere near them.


Gate 20 findings (2026-09-01):

18. **The checker was run at the gate and reproduces exactly**: 3577 pieces of prose,
    0 faults, 16 for a human, and the per-course counts sum to the record's figure. The
    seven renumberings were then re-checked by INDEPENDENT code that only compares the
    first token's number and side against the board, and all seven come out right.
19. **Gate 19's own probe, which is different code, now reports only the benign classes
    and zero markers.** It had reported two misnumberings and one marker before this
    phase; all three are gone, and what is left is two `deliberate`, two `back-reference`
    and three omitted-recapture lines. So the fixes are verified by something that does
    not share a line with the tool that found them.
20. **All three promoted rules were mutation-checked here, not taken on trust.**
    Renumbering the Panov note fails caro-kann-black with "written as 8., the board is at
    7."; restoring phase 19's `5.Qb3` fails it with "the board refuses Qb3, move 3 of the
    run, at 4."; restoring the bare `Qxh8` fails ruy-lopez-exchange with "wrote Qxh8, the
    board gives Qxh8+". Each reverted, tree clean.
21. **The classification order is the design and it is right.** A run is read from the
    note's own earlier readings first, then placed by number and side; only then is it
    tested for deliberate illegality, then for one inserted reply, then against the
    anchor for a misnumbering, then for a back-reference. `illegal` is the last resort,
    which is what stops it being the catch-all. **The hole is real and is documented**:
    a sequence that is legal where the number places it and wrong for the position the
    note MEANS reads as fine, because legality is the test and sense is not.
22. **The parser move did not change `note-claims.mjs`.** Its counts are gate 19's to the
    entry: 797 mistake entries, 40 with a playable sequence, 12 claiming material without
    one, the Colle at 0, and 0 unsupported in all six.
23. **Open items 13 and 14 check out, and the numbers are closer than the record claims.**
    At 2500 ms the Ruy's `9.Qh5+` measures 3.39 and `9.Qxd8+` measures 1.48, a cost of
    **1.91** against the checker's 1.90 and the phase's 1.88. The ending after `9.Qxd8+
    Kxd8` runs 1.54, 1.44 and 1.39, so the note that called it level was plainly wrong and
    the rewrite is right.
24. **But that entry is not a straddle, and the difference matters enough to rule on.**
    Phase 19's band-edge ruling was written from findings whose repeated measurements
    disagreed about which side of the edge they fell. Here 1.90, 1.88 and 1.91 all agree
    the move is over the 1.80 ceiling. The teaching call stands and the grade stays. The
    consequence does not: a straddle goes quiet on the next run, an overshoot is reported
    for ever, and a checker that always complains is one people stop reading.
25. **So the gate built the thing that was missing: `docs/engine-runs/accepted.md`.**
    Three entries come back on every pass and each is a deliberate choice the band model
    or the half-pawn threshold cannot express - the Ruy's `9.Qxd8+`, the Vienna's
    `7.Nxf3` ruled at gate 18, and the Ruy's `Bxc6` in the chapter where Black has not
    played ...a6, measured at gate 12 and again here. **Every decision already existed**,
    scattered across three gate records and two SPEC sections, which is why each pass has
    re-derived them and this one has now been argued twice. The file holds the number, the
    decision and where it was taken; the phase 20 run record points at it; SPEC section 8
    carries the rule that puts an entry there.
26. **One structural change to the app's config, and it is sound.** `allowJs` in
    `tsconfig.app.json`, so the test can import the checker's `.mjs`. `npm run build`
    passes and no chunk in `dist/` contains the checker, so nothing reaches the shipped
    app.
27. **Verified for the gate from the repo:** 665 tests, `tsc -b` clean and `npm run build`
    clean, all re-run after the gate's own commit; 308 line ids before the phase and 308
    after; oxlint reports the same six warnings that predate the phase; no em dashes; ten
    builder commits with trailers naming the actual model; version 1.6.2 in all three
    files.
28. **Nick's own files were not listed and not reported.**

- [x] **Review gate 20 passed** (2026-09-01)

## Phase 21 - help for the app, not for the chess

Goal: an app-help framework. No chess content, no course touched.

Chipped as `chips/phase-21-help.md`. Nick opened 1.6.2 on 2026-09-01 and said it looks
impressive and a bit daunting: every word of prose in the app is chess, and nothing is
about the application - what it is for, what each screen wants, or what order to do
things in.

**The rulings he gave.** Written for anyone he hands a bundle to, not only for him. Help
is one document with a heading per section, reached from a Help item in the nav after a
faint separator, never disabled. The per-screen wording is "Help on this screen", never
"New here?", because nobody should feel like a beginner every time they need a hand.
Study needs nothing. The landing page drops its statistics for "Select a course to study".
Drill gets a sentence and a label over the grade buttons rather than a `?`. Progress gets
a sentence, a `?` on Chapters and one on Concepts, and **renders the course the dropdown
names** instead of all six.

**One rule shapes the phase: fix the label first, help second.** The worked example is
the Study chapter list, which carries `aria-label="Chapters"` so a screen reader is told
and a sighted reader is not, while Play and Progress both use the word. One visible label
is worth more than a paragraph of help.

- [x] 21.1 One content module feeds both the `?` panels and the Help document.
- [x] 21.2 Label the Study chapter list on screen.
- [x] 21.3 A Help mode in the nav, after a separator, never disabled.
- [x] 21.4 The Help document, eight sections, rendered through `Prose`.
- [x] 21.5 Three `?` panels: Play's "Who you are playing", Progress's "Chapters" and
  "Concepts". Keyboard-reachable, not hover tooltips.
- [x] 21.6 The landing page loses its statistics for "Select a course to study".
- [x] 21.7 Drill: a sentence under the heading and "How well did you know it?" over the
  grade buttons.
- [x] 21.8 Progress: a sentence, and the detail follows the Course dropdown. SPEC
  sections 8 and 10 updated, because section 10 currently rules otherwise.
- [x] 21.9 A test holding every help string to the control it names.
- [x] 21.10 Version 1.6.3, because the second digit is the course count and no course is
  added.
- [x] 21.11 Prove it in the browser build.

Acceptance: one content module feeding both surfaces; the chapter list labelled; Help in
the nav and never disabled; the eight sections including the words list; three `?` panels
and no more; the landing page reading as ruled with its rollup verified still on Progress;
Drill's sentence and label; Progress following the dropdown with the spec corrected; a
test that fails on a renamed control; version 1.6.3; 308 line ids unchanged; vitest green
and `tsc -b` clean.


Open items (phase 21):

1. **One module, two surfaces, and the panels are paragraphs of the document rather than
   copies of it.** `src/ui/help-text.ts` holds the eight sections, the three `?` panels
   and the list of controls the prose names. Each panel's text is interpolated into its
   section, so the Help document literally contains the panel word for word, and
   `help.test.ts` asserts that rather than trusting it. It is named `help-text.ts` and not
   `help.ts` because Windows treats `help.ts` and `Help.tsx` as the same file and `tsc`
   refuses the pair.
2. **The naming-first rule paid for itself twice.** The Study chapter list carried
   `aria-label="Chapters"`, so a screen reader was told what it is and a sighted reader
   was not; it is now a visible heading the nav points at with `aria-labelledby`, one
   source for both readers. The landing page's rollup went the same way: "1 of 308 lines
   learnt across 6 courses" is written in vocabulary the app has not taught by the time
   somebody reads it, and the front door now says what to do. **Verified in the running
   app rather than assumed**: Progress carries the identical rollup, from the same
   `courseTotals` and `dueCount` over the same visible courses, and it read "0 of 308
   lines learnt across 6 courses" with no course open.
3. **The test needed three seams, and each one is the same fact.** Rendering to a string
   runs no effects, so the progress provider always renders the empty state and the
   catalog's folder scan never finishes. Drill's start screen only exists once something
   is learnt, and the installed app's own controls only render once a folder is known, so
   neither is reachable through the providers. `ProgressContext` and `CatalogContext` are
   exported for a test to hand a value to, and `Feedback` is exported because a drill
   session cannot be reached at all. The lint rule that wants a context in its own file is
   answered where it applies, with the reason, so the warning count is still **6** and
   they are the same six that predate the phase.
4. **Proved by mutation, six times.** Renaming `Auto step this line`, `Start drilling`,
   the Study `Chapters` label, the Progress `Concepts` heading, `Who you are playing` and
   `How well did you know it?` each turns the suite red and names the string that went
   missing. Every one was put back and the tree left clean. Two of the six were written
   only BECAUSE the mutation found them silent: the prose named no control called Help and
   none called "How well did you know it?", so the list could not hold them, and both
   sentences were added to the document.
5. **One deliberate deviation, in 21.7.** The chip asked for a label above the button row.
   It is there only after the repertoire move, where the row is two buttons and there is a
   choice to make. After a wrong move the row is one Continue button, and "How well did
   you know it?" over a move you did not know is a question with no answer. The label is
   the row's `aria-labelledby` where it appears.
6. **The `?` is a button in the flow, not a tooltip.** Three of them, no more. Each has
   `aria-expanded`, an `aria-label` of "Help on this screen: <what>", and closes on Escape
   from the button, which is where focus is. The panel opens underneath in the flow, so
   opening it moves what is below it by the panel's own height and moves nothing else.
   Play's is the one shaped differently: the button goes in the `<legend>`, beside the
   words it explains, and the panel does not, because a legend is read out again for every
   radio under it.
7. **Two places where the code won over the chip, both recorded rather than papered
   over.** Help is last in the nav in the shipped app, but in a dev build `Diagnostics`
   renders after it, so the order there is Help then Diagnostics then the theme toggle.
   And `Add a course from a file` does not exist in the browser build at all: `ImportCourse`
   returns null without a courses folder. The help names it because the help is written for
   the installed app, and the test renders a catalog whose scan has finished so it can
   still hold the name.
8. **What was driven, and what was only read.** Driven live at 1280x900 against the Vite
   build, title checked first: Help opens from the nav with no course selected and renders
   through `Prose`; the landing page reads "Select a course to study"; Progress with no
   course shows the rollup and says to open one; Progress with the Vienna chosen shows the
   Vienna and nothing else; both Progress `?` panels open in place and Escape closes the
   focused one; Play's `?` opens inside its fieldset; Drill's sentence sits under the
   heading and "HOW WELL DID YOU KNOW IT?" sits over the two grade buttons, reached by
   ticking a line and playing e4. Only read, not driven: the light theme, the packaged
   Windows build, and the installed app's courses folder. The line ticked for the drill
   was unticked afterwards and `learntLines` in the browser build confirmed back to empty.
9. **The heading level was a browser-only finding.** The document's sections were `##`,
   the same level as the "Help" heading above them, so "What this is" rendered larger than
   the page it was on. Nothing in the suite could see that. They are `###` now.
10. **The spec disagreed and was corrected, not left.** Section 10 ruled that Progress
    shows the rollup and each course. Section 8 now carries the phase 21 ruling with the
    date and the reason, and section 10 says what Progress does and points at it.
11. **No chess moved.** Nothing under `courses/` differs from the commit this phase
    started on, checked with `git diff`, and the running app still counts 308 lines across
    six courses.

Gate 21 findings (2026-09-02):

12. **Every screen was driven at the gate, not read.** The landing page reads "Select a
    course to study" with the statistic gone. The nav is Courses, Study, Play, Drill,
    Progress, a 1px `nav-separator` span carrying `aria-hidden`, then Help, which is
    enabled with no course while Study and Play are disabled. Help renders eight `h3`
    sections under one `h2`, in the ruled order. Progress with no course shows the rollup
    and says to open one; with the Vienna chosen it shows the Vienna and nothing else,
    matching the switcher. Both Progress panels open in place and Escape closes the
    focused one. Play's panel opens inside its fieldset, above the three radios it
    explains. Study shows CHAPTERS above the list. Drill's start screen carries its
    sentence, and after ticking a line and playing e4, **HOW WELL DID YOU KNOW IT?** sits
    over the two grade buttons. The browser build's progress was cleared afterwards and
    `learntLines` confirmed back to empty.
13. **The help test was mutation-checked at the gate.** Renaming the Study `Chapters`
    label and `How well did you know it?` each turns the suite red naming the string that
    went missing, from a test that really renders the screen rather than grepping the
    source. Both reverted.
14. **The controls the prose names were checked against the code, not against the chip.**
    `Very casual` through `Unpleasant` are the eight strength labels in
    `src/engine/strength.ts`; `The repertoire`, `Your moves` and `The final position` are
    the three report headings in `Play.tsx`; `Start drilling` and `Drill my weak areas
    first` are on the Drill screen. Nothing named is missing.
15. **One real fault in the prose, and it is the class the phase exists to prevent.** The
    Drill section said "Get it wrong and the gap shortens, and the card also comes round
    again before the session ends". `Drill.tsx:112` requeues only on Again, and
    `grade.ts:43` maps a listed playable or inaccuracy to Hard, so a reader who plays a
    listed inaccuracy is promised a card that never comes. Fixed in `b078891`. **The help
    test could not have caught it**: it holds the help to the controls it NAMES, and this
    was a claim about what the app does with them. Worth stating in the record, because
    the test's green is not the same as the prose being true.
16. **The 21.7 deviation is right.** The label sits over the row only after the repertoire
    move, where there are two buttons and a choice; after a wrong move the row is one
    Continue button and "How well did you know it?" would be a question with no answer.
    Only the correct-move case was driven at the gate; the wrong-move reasoning was read.
17. **One judgement for Nick rather than a fault.** The `?` is 20x20 at 12px in
    `rgb(122, 128, 138)`, eight pixels after its heading. It works and it is quiet. Given
    the complaint that started this phase was about guidance, whether it announces itself
    enough is his call, not a builder's.
18. **The document is 1625 words**, spread 89 to 274 a section, so no section is more than
    about a minute. That is a reference to dip into rather than a manual to read, which is
    what "not long" has to mean for eight sections.
19. **Verified for the gate from the repo:** 699 tests and `tsc -b` clean, re-run after
    the gate's own commit; oxlint reports the same six warnings that predate the phase; no
    em dashes; version 1.6.3 in all three files; **not one byte under `courses/` or
    `docs/bundles/` differs** from the commit the phase started on, so no chess moved.
20. **Nick's own files were not listed and not reported.**

- [x] **Review gate 21 passed** (2026-09-02)

## Phase 22 - a course is always selected, and every mode works from the first click

Goal: remove the inconsistency Nick met on first launch of 1.6.3. No chess content.

Chipped as `chips/phase-22-first-click.md`. Nothing remembered a course, so `courseId`
started null on every launch; Study and Play were disabled until one was chosen, Drill
mixed every course without saying so at screen level, and Progress, which phase 21 made
follow the switcher, told him to open a course. He named it: block all or allow all.

**His rulings.** Allow all. A course is always selected: the one he was on last time,
else the first visible course. The switcher always shows. Drill gets a remembered
"Drill selected" or "Drill mixed" radio, default mixed (the v2 one-queue ruling stands as
the default), and the switcher is greyed out on Drill while mixed is chosen so the header
cannot appear to name a course Drill is ignoring. The preference is remembered the way
the theme is, not in the progress file.

- [x] 22.1 Remember the selected course in localStorage, the theme's idiom.
- [x] 22.2 Resolve it at startup against the visible courses, fall back to the first.
- [x] 22.3 Enable every mode; remove `IN_COURSE` and the tooltip.
- [x] 22.4 The switcher always shows with more than one visible course.
- [x] 22.5 Drill: the radio pair, remembered, default mixed; replaces the filter row and
  carries its counts; greys the switcher while mixed.
- [x] 22.6 Progress: remove the unreachable "open a course" fallback.
- [x] 22.7 Rewrite the Help paragraph that says Study and Play stay greyed out; add the
  radios to the Drill section and to `HELP_CONTROLS`.
- [x] 22.8 Correct SPEC section 10 and log the ruling in section 8.
- [x] 22.9 Tests for the resolution and fallbacks, the preference, and the help; mutation
  check the help test.
- [x] 22.10 Version 1.6.4.
- [x] 22.11 Prove it in the browser build from a cleared storage.

Acceptance: a course always selected, remembered and falling back safely; all four modes
enabled from the first click with the switcher showing; Drill's two radios remembered,
defaulting to mixed, narrowing when selected and greying the switcher when mixed; the
filter row gone with its counts in the labels; Progress's fallback gone; the Help document
true against the new behaviour and its two new controls held by a test proved to fail on
a rename; SPEC sections 8 and 10 corrected; version 1.6.4; 308 line ids unchanged; vitest
green and `tsc -b` clean.


Open items (phase 22):

1. **The cause was that nothing remembered a course, and everything else followed from
   it.** `courseId` started null on every launch, so Study and Play were greyed out, the
   switcher did not render, and Progress - which phase 21 had made follow the switcher -
   opened on a line telling him to open a course. The selected course is now read from
   `localStorage` and resolved against the courses actually visible, every render. It is
   derived rather than stored back into state, so there is no first paint where the
   resolution has not happened yet.
2. **The four ways a remembered id can be stale are one case, and each is tested.** A
   fresh install with nothing remembered, a course since hidden, a folder deleted, an id
   renamed: all fall back to the first visible course. The empty catalog is the fifth and
   returns undefined rather than throwing, which is the only case where the shell has
   nothing to show. **Driven live as well as tested**: hiding the Vienna and reloading fell
   back to the Caro-Kann and rewrote the stored id to `caro-kann-black`, so the memory
   heals itself.
3. **The heal waits for the folder scan, and that is not a detail.** In the installed app
   external courses arrive after the first render. Writing the fallback back before the
   scan finished would forget the trainee's own dropped-in course to fix a problem that
   was about to go away. `useRememberedCourse` takes `catalog.scanned` for exactly this.
4. **It is not in `progress.json` and that was a decision, not an oversight.** That file
   is versioned, exported and imported; a course id inside it would travel with an export
   to a machine that may not have the course. `localStorage` lives in the WebView2 profile
   under `Repertoire Trainer Data`, which survives an upgrade and goes on a ticked
   uninstall, which is the right life for a preference. Same reasoning as `theme.ts`, and
   the two now sit beside each other.
5. **One deviation from the chip, on the seam it invited us to name.** The chip proposed
   that the Drill preference live in a hook both the shell and Drill call. A hook called in
   two places is two pieces of `useState`, and pressing the radio in Drill would not grey
   the switcher in the shell until a reload. So `useDrillScope` is called ONCE, in the
   shell, and handed down as props, the same way the shell already hands the selected
   course to Progress. The module is still shared; what is not shared is the call.
6. **The filter row was replaced, not joined.** A row of one button per course beside the
   header's own dropdown was a second course selector, which is the confusion this phase
   exists to remove. Its counts moved onto the radio labels after a colon, so the screen
   still reads "Drill mixed: every course, 25 due" and "Drill selected: The Vienna Gambit,
   12 due" and nothing legible was lost.
7. **The help test learnt one rule to allow that, and only one.** A control may carry its
   detail after a colon, so "Drill mixed: every course, 25 due" is the control called
   Drill mixed. A colon and nothing else: appending anything to a name still fails, and
   "Start drilling now" is still not "Start drilling". The test also needed a SECOND course
   in its fixture, because one course has no dropdown and nothing to choose between.
8. **22.7 found four lies beyond the two the chip named, which is the point of reading the
   whole document.** The named two were Study and Play "stay greyed out until you open
   one" and Drill and Progress "do not" need a course. The other four: Courses described as
   "the front door, open one" when a course is already open; the Courses section saying
   nothing about a tile selecting a course or about what happens when the remembered one
   is gone; Drill saying a card names its course "because the queue mixes them", which
   stops being the reason under Drill selected; and the words list saying opening a course
   is what Study and Play work inside, which is now three screens and no opening.
   **The suite could not have caught any of them.** It holds the help to the controls it
   NAMES, not to claims about behaviour, which is the same gap gate 21 found in the Drill
   scheduling sentence.
9. **Seven mutations, six of them red, and the seventh is the more interesting result.**
   Renaming Drill mixed, Drill selected, What to drill or the Course label each turns the
   help test red naming the string that went missing. Ignoring the remembered id fails two
   selection tests. Letting Drill ignore the preference fails the narrowing test. The one
   that did NOT fail was re-adding `disabled={mode.view === 'study' && !course}`, and it
   did not fail because it cannot fire: a course is always resolved, so the old guard is
   now dead code wherever it is written. That is the phase working rather than the test
   being weak. The mutation that does fail is disabling Study outright.
10. **What was driven at 1280x900, from a cleared `localStorage`.** First click into
    Progress showed the rollup and the Caro-Kann's detail with no "open a course" line;
    first click into Study and into Play both opened, where both had been greyed; the
    switcher showed on every view including the catalog. With lines learnt in two courses
    the Drill screen read "Drill mixed: every course, 25 due" and "Drill selected: The
    Vienna Gambit, 12 due", the summary moved between 25 and 12 as the radio flipped, and
    the switcher greyed and ungreyed with it in both directions. A reload came back on the
    Vienna with Drill selected still chosen. A tile still opens Study and selects that
    course. The browser build's storage was cleared afterwards and checked back to no
    learnt lines, no hidden courses and no drill preference.
11. **One thing is proved in the browser and not in the suite**, and it is in the SPEC
    section 6 register with what would make it worth taking: the greyed switcher, because
    testing it needs the shell rendered on the Drill view and the view is internal state.
    Both things it depends on are in the suite.
12. **The Progress fallback line is gone rather than left.** It was the first thing Nick
    read when this phase started. The `chosen` test above it remains as a type guard for
    the empty catalog, which the guard above THAT already turns back, and the comment says
    that is all it is.
13. **No chess moved.** Nothing under `courses/` differs from the commit this phase started
    on, and the running app still counts 308 lines across six courses.

Gate 22 findings (2026-09-02):

14. **Driven from a cleared store, and every ruling holds.** With `localStorage` emptied
    and the page reloaded, all eight nav buttons were enabled, the switcher rendered on the
    catalog with the Caro-Kann in it, and the stored course had already healed to
    `caro-kann-black` - the first visible course, written back by `useRememberedCourse`.
    With two learnt lines seeded, one each in the Vienna and the Caro-Kann, the first click
    into Drill showed "What to drill", **Drill mixed: every course, 25 due** checked and
    **Drill selected: The Caro-Kann Defence, 13 due**, the summary at 25, and the switcher
    disabled with the title "Drill is mixing every course. Choose Drill selected to drill
    this one." Clicking the second radio narrowed the summary to 13, re-enabled the
    switcher and stored `selected`. After a reload Drill came back on `selected` with the
    switcher live, and Progress showed the rollup and the Caro-Kann's detail with no "open
    a course" line anywhere on the screen. The store was cleared afterwards and checked
    back to the theme key alone.
15. **The seam deviation in open item 5 is the right call.** `useDrillScope` called in two
    places would be two `useState`s, and the radio would not grey the switcher until a
    reload. Called once in the shell and handed down is the same shape the shell already
    uses for the selected course. The chip proposed the weaker design; the builder named
    it and did better.
16. **`resolveCourse` is derived every render against `catalog.courses`**, which
    `catalog-context.tsx` documents as the visible, loaded list, so a hidden course is not
    a candidate and the fall-back is the first thing a person can actually see. The
    write-back waits for `catalog.scanned`, which matters in the installed app and not in
    the browser, and the reasoning in `prefs.ts` says why.
17. **The help test was mutation-checked at the gate**: renaming `Drill selected` turns it
    red naming the string. And item 9's non-failing mutation is read correctly by the
    phase: re-adding the old `!course` guard cannot fire because a course is always
    resolved, so the guard is dead code rather than the test being blind.
18. **22.7's four extra lies were real and are fixed**, and the pattern from gate 21
    repeats: the help test holds names, not behaviour, so the whole document had to be read
    against the new behaviour by a person. It was.
19. **Verified for the gate from the repo:** 718 tests and `tsc -b` clean; oxlint reports
    the same six warnings that predate the phase; no em dashes; version 1.6.4 in all three
    files; **nothing under `courses/` or `docs/bundles/` differs** and 308 line ids before
    and after.
20. **Nick's own files were not listed and not reported.** The browser build's storage is
    the only store this gate touched.

- [x] **Review gate 22 passed** (2026-09-02)

## Phase 23 - a live evaluation bar, undo and redo, a game that survives leaving the screen, drilling early, and the wording that was still chess

Goal: the nine findings Nick brought back after a day on 1.6.4 (2026-09-03). Notes only
under `courses/`; no move changes.

Chipped as `chips/phase-23-play-and-polish.md`. Play gets a live evaluation bar left of
the board (reversing the v1 "no bar, it is a crutch" ruling), Undo and Redo, and a game
that keeps going when he looks at another screen, with the course switcher greyed while it
runs. Drill gets a one-off "Include cards that are not due yet" box; an early answer is an
ordinary FSRS review. Five notes said a capture went towards the centre when it went away
(seven Ruy nodes plus an intro, one Slav, one Vienna) and one Colle note put the bishop
somewhere it already was; a content test now enforces the direction claim. The frequency
badge comes off the Study move buttons and into a tooltip. "Due" and "New" become "ready"
and "not yet drilled" everywhere a person reads them. The course dropdown moves up 8px,
the window opens at 1200 by 980, and the version becomes 1.6.5.

- [x] 23.1 Live evaluation bar, one engine at the scan profile, fed into the report.
- [x] 23.2 Undo and Redo on `PlaySession`, held by the help test through a session fixture;
  the phase 21 report register item closed with the same fixture.
- [x] 23.3 The game lives in a provider; the switcher is greyed while a game is in progress.
- [x] 23.4 "Include cards that are not due yet" on Drill; due first, then soonest due.
- [x] 23.5 Five wrong notes fixed, bundles regenerated, and a direction test that fails
  before the fixes.
- [x] 23.6 Weight badge off the move buttons and into a title; Help sentence.
- [x] 23.7 "Ready" and "not yet drilled" throughout; next-card line on Progress; Help follows.
- [x] 23.8 Header gap balanced at 8px each side of the separator.
- [x] 23.9 Window 1200 by 980.
- [x] 23.10 Version 1.6.5.
- [x] 23.11 Proved in the browser build at 1200x980.


Open items (phase 23):

1. **The evaluation bar reverses a v1 ruling, and the three things that keep the original
   concern honest.** v1 said a live bar is a crutch. It was written before anybody had
   played a game in the app, and Nick's reason after a day of playing is the one that
   settles it: without a bar he could not tell a good game from a lucky one until the
   report. The bar carries **no number**, so it says which way the game is going and not
   by how much, and its accessible name is the report's own words. It is the engine at
   **full strength**, made at the scan's own profile: the opponent's search would have
   been a weakened engine's opinion at levels 4 to 8 and a glance at several candidates at
   1 to 3, which is a lie in the shape of an evaluation. And every value it shows is
   **handed to the scan**, so the report cannot disagree with the numbers that were on the
   screen. The profile is restored in a `finally`, because the engine is one worker with a
   promise queue and a search that threw would otherwise leave the opponent at level 8.
2. **Undo works in pairs, and the reason is not tidiness.** Taking back one ply leaves the
   opponent to move with nothing to make it move, so the game sits there. Undo goes back
   to the last position where the trainee was to move, which is one move when the game has
   just ended on their own. A Black course before the trainee has answered White's first
   move has nothing of theirs in it, and undo says so rather than emptying the board.
   Two things had to be put right rather than left: the outcome is cleared and worked out
   again after every undo and redo, or a game undone out of a checkmate stays finished
   while the board says otherwise; and each opponent move records whether it came from the
   book, so `bookReplies` goes back to what it was instead of being guessed at.
3. **The phase 21 register item is closed, by the fixture this phase needed anyway.** The
   help names Undo and Redo, the help test walks the START screen, so the in-game header
   became a component that takes a session. The same sitting exported `Report`, built a
   small `GameReport` fixture, and put The repertoire, Your moves and The final position
   under the same rule as every other control. Six names that were checked by reading
   `Play.tsx` are now checked by the suite.
4. **The book moved into the provider with the game, which was not in the chip.** It is
   derived from the launch options, and those reset when `Play` unmounts. A chapter game
   reviewed after a look at Study would have been reported against the whole course's
   book. Found by asking what else dies with the screen.
5. **A REAL BUG in this phase's own work, found by driving the browser and by nothing
   else.** The provider's value was memoised, and the counter that says the mutable
   session has changed is not a field of that value, so it was easy to leave out of the
   dependencies. Children of a provider are the same element from render to render, so
   React skips them unless the context value changes: **undo moved the game and the screen
   stayed a step behind**, brought up to date only when an evaluation happened to arrive.
   Every test passed. Adding the counter to the memo would have fixed the instance;
   removing the memo fixes the class, and costs one object per render of a provider that
   only renders when something has happened. In the SPEC section 6 register with what it
   cost.
6. **An early answer is an ordinary answer, and the numbers prove it.** No second recording
   path and no change to the FSRS parameters. Driven live: a card scheduled eight days out,
   answered on day zero, offered "Got it, back in 9 days" and "That was easy, back in 13
   days" - shorter than it would have been on the day, which is FSRS knowing how much time
   has passed. The box is not remembered, because one that stayed ticked would make ready
   mean nothing.
7. **The direction sweep found ten, not five.** Nick found one by eye. The rule found the
   other nine the same afternoon, in three courses: seven Ruy `dxc6`, one Slav `exf5`, one
   Vienna `dxc3`. The `ch4-bxc6` intro had the same error from the other side. One more was
   a rewording rather than a correction: an alternative's note said "recapture towards the
   centre with the a-pawn" while sitting under `cxb3`, and its own twin two hundred lines
   away already said "Take with the a-pawn". The rule reads the phrase as being about the
   move the note sits on, which is what makes it cheap, and that is now a house rule the
   content obeys rather than a weakness the rule tolerates.
8. **And one the chip did not name: the Colle's 5.b3 note.** It said the bishop was going
   to b2 "not to c1", where the bishop already stands. It means not left on c1 behind a c3
   pawn, which is the Colle-Koltanowski listed on that same node, and not out in front to
   f4, which is the London listed on the node before. Its ch1 twin was already right.
9. **The weight badge tested the wrong thing, so it never showed in a Black course.** It
   tested `node.colour === 'black'`, and the opponent plays White in a Black repertoire.
   The weight itself is the test now, which is the one the loader already enforces: it
   refuses a weight on the trainee's own move.
10. **Rewriting the words found four more stale sentences**, which is the same lesson as
    gates 21 and 22 with a fourth number on it. The Drill help said the labels carry "the
    number due", that a card is due, that Start drilling works through what is due, and
    that an early answer is scheduled from "the day it was due". The suite could not have
    caught any of them: it holds the help to the controls it NAMES.
11. **One word did not change, deliberately.** The Drill box still says "Include cards that
    are not due yet". "Ready" is the word for a COUNT of cards whose gap has run out, which
    is what the sweep was about; the box is about the schedule's own date. The words list
    now says how the two fit together, in the one place a reader meets both.
12. **What was driven at 1200x980, from a cleared `localStorage`.** The header gaps measure
    8px above the rule and 8px from the rule to the Course dropdown, where they were 8 and
    16. A White game showed the bar left of the board at 421px, board height, with White's
    share growing from the BOTTOM; a Caro-Kann game showed the same bar with White at the
    TOP, so the trainee's colour is at the bottom in both. Two moves, two undos back to the
    empty board, two redos back to exactly `1.d4 f5 2.Bf4 Nf6` with the bar at a different
    value from the start position, so it follows them from the map with no search. A trip
    to Study mid-game left the switcher greyed with "A game is in progress...", and the
    game was where it had been on return; reviewing it made the switcher live again. On
    Drill with everything answered: "Nothing is ready. The next card comes back in 8 days",
    then the box ticked reads "10 cards, 0 of them ready now" with Start drilling enabled.
    A Black reply on Study carries the frequency title and no badge. Progress reads "10
    cards, 0 ready to drill now, 0 not yet drilled" with the next-card line under it and
    Ready / Not yet drilled as columns. Storage was cleared afterwards and checked back to
    no learnt lines, no cards, no games and no hidden courses.
13. **No move changed.** Notes only under `courses/`, the bundles regenerated by the
    writer, and 308 line ids across 6 courses before and after.

Acceptance: as the chip's final paragraph.

Gate 23 findings (2026-09-03):

14. **Verified for the gate from the repo:** 758 tests and `tsc -b` clean; oxlint reports
    the same warnings as before plus the one the new provider suppresses for the same
    reason the other two do; no em dashes under `src/` or `courses/`; version 1.6.5 in all
    three files; the window 1200 by 980; **308 line ids before and after** with nothing
    gone and nothing added; the bundles regenerated and held by `bundle.test.ts`;
    `note-lines.mjs` reports 0 faults and `note-claims.mjs` the standing list.
15. **Both new tests were mutation-checked at the gate.** Putting "Take towards the centre"
    back on the Slav ...exf5 note turns the direction test red naming the line and the
    move (`exf5: e6 to f5`). Renaming the Undo button to "Take back" turns the help test
    red naming the control and the screen. Both files were restored from git afterwards.
16. **Driven in the Vite build at 1200x980.** The header measures 8px above the rule and 8px
    from the rule to the Course dropdown. A Caro-Kann game: the engine opened 1.e4, the bar
    sat left of the board at 421px against a 420px board with White's share at the TOP,
    labelled "Evaluation: level", and Undo and Redo were disabled with only the opponent's
    move played. After 1...c6 2.Nc3 Undo went back to `1.e4` on the board, the move list
    and the bar in one step, Redo put all three back, and the switcher was greyed on Study
    mid-game with "A game is in progress..." and the game was still at move 2 on return.
    Stop and review produced the three report headings and made the switcher live again.
    On Study the opponent's reply carried the frequency title and there was no badge.
17. **The builder's own bug (open item 5) was the right diagnosis and the right fix.** A
    memoised context value with the tick counter outside its dependencies is exactly the
    failure that a string-rendering suite cannot see, and rebuilding the value removes the
    class rather than the instance. It is in the register with what it cost.
18. **Two things beyond the chip were right to take:** the book moving into the provider
    with the game (a chapter game reviewed after a look at Study would have been judged
    against the whole course), and the weight badge's colour test, which had hidden the
    badge in every Black course since it was written. Neither needed a ruling.
19. **The direction rule found ten faults, not the five the chip counted**, and the eleventh
    change, the Vienna cxb3 rewording, is a sound reading: a note under one move that talks
    about another move is unreadable whether or not it is true.
20. **The chess content was not otherwise touched.** Notes only; no `san` moved; no engine
    run was needed and none was made.
21. **Nick's own files were not listed and not reported.** The browser build's storage held
    the one reviewed game from this gate and was cleared afterwards.

- [x] **Review gate 23 passed** (2026-09-03)

## Phase 24 - a game that names its own course, a longer game on request, lines played, and two gaps

Goal: Nick's five findings after installing 1.6.6 (2026-09-03). No chess content.

Chipped as `chips/phase-24-play-freedom.md`. The course switcher is never greyed for a
game: Nick overruled the phase 23 decision because he wants to study, drill and check
progress on other openings while a game is open. The game names its own course and
chapter above the board instead ("Opening: The London System"). A capped game offers
"Play 5 more moves" and "Play to the end". Each game records its moves, and Progress gains
a "Lines played" section counting the lines a game never left. The dropdown-to-heading
gap drops from 24px to 12px. Version 1.6.7.

- [x] 24.1 Switcher free during a game; the game names its course; no reset on a header
  change; Help and SPEC follow.
- [x] 24.2 `extend` on the session with tests; the two buttons on a game finished by cap.
- [x] 24.3 `sans` on each play record; line matching in stats with tests; "Lines played"
  on Progress.
- [x] 24.4 Dropdown-to-heading gap at 12px.
- [x] 24.5 Version 1.6.7.
- [x] 24.6 Proved in the browser build at 1200x980, in both themes.


Open items (phase 24):

1. **The phase 23 greyed switcher is reversed, and the reasoning that produced it was not
   the part that was wrong.** A game does belong to the course it was started in. What was
   wrong was answering that by freezing the header: Nick wants to study a line, drill a
   card or check progress on another opening while a game sits waiting, and a greyed
   selector he could barely see on the Play screen answered a question nobody had asked.
   The game says its own course above the board instead.
2. **The titles are CAPTURED when the game starts, not looked up.** The header can now name
   another course, so reading the catalog at render time would give a title that changes
   under the game. `StartOptions` carries `courseTitle` and `chapterTitle`, and the line
   reads "Opening: The London System" or "Opening: The London System, sparring against
   Classical setups".
3. **Two things had to come off with the greying.** The `key={course.id}` on `<Play>`, which
   would have remounted the screen and thrown away the launch options under a running game,
   and the effect that reset a game whose course no longer matched the header. Both existed
   only because the switcher used to be held still.
4. **The length cap became a field, which is the whole of `extend`.** It was read from the
   options on every `status` call, and a game that can be told to carry on needs it to be
   able to change. `extend` touches nothing else: a mated game has an `outcome`, `status`
   reads that first, and `finishedByCap` is false for it, so the buttons never appear and
   `extend` refuses. There is no limit on extending by five, which is what the chip asked
   for and what the test pins.
5. **After extending, the opponent may be the one to move.** A cap falls after both sides
   have completed the move number, so usually it is the trainee's turn; a game started from
   a Study position begins mid-pair. That is the case `start` already handles, handled the
   same way, including the evaluation for the bar.
6. **The line-matching rule is one test used three ways**, and the honest consequence is
   written into the screen. A game played a line when the two agree for the whole of the
   shorter one: played out, stopped inside, or diverged and did not count. A game that
   stopped where several lines still share the same moves counts for every one of them.
   **Driven live, that is not a small effect**: a three move Caro-Kann game stopping at
   1.e4 c6 2.d4 d5 3.Nc3 counted for ELEVEN lines, because eleven of them still share those
   moves. It is the ruling working exactly as written and the hint says so, but Nick has
   not seen the size of it. If he wants it narrower, the smallest change is to count only
   the deepest lines a game reached rather than every line it passed through.
7. **`sans` is optional and the progress version does not move.** Nothing old needs
   rewriting to be read: `readPlayGames` already passes unknown fields through, and a game
   without moves counts for nothing. The section says that outright rather than showing a
   trainee with a long history an empty table.
8. **The one thing the suite cannot reach is the WRITE of `sans`**, because it happens in
   `finish`, which needs a real engine and a driven provider. It is the same missing
   capability already in the SPEC section 6 register, so it is not a second entry. It was
   proved live instead: two reviewed games produced rows in Lines played.
9. **What was driven at 1200x980, in both themes, from a cleared store.** A London game
   started, then the dropdown moved to the Caro-Kann and Study, Drill and Progress all
   followed it while the game waited; back on Play the board still held the London game
   with "Opening: The London System" over it and the dropdown still said the Caro-Kann.
   Reviewing it judged it against the LONDON: "You left the repertoire on move 1 with a3.
   The line plays d4." New game then offered the Caro-Kann, "A game against Stockfish as
   Black". A To move 10 game at its cap showed both extend buttons; Play 5 more moves put
   the cap at 15 and the game back to playing; at 15 the buttons returned and Play to the
   end took the cap to null. The dropdown-to-heading gap measures 12px on the Courses
   screen and on Play, down from 24. **In the light theme** the vertical bar drew White's
   share light and at the top for a Black student, and the report's bar drew it light on
   the left, so the 1.6.6 colour fix holds where the phase 23 gate had not looked.
10. **One caveat on the drive.** Another session held port 5175, so this ran against that
    server. It serves this session's source - the 12px margin was live, and it only exists
    in this phase's commit - but `__APP_VERSION__` is substituted from the config loaded at
    server start, so the header read v1.6.5. The version was checked in `package.json`,
    `tauri.conf.json`, `Cargo.toml` and `Cargo.lock` directly instead.
11. **No chess content.** Nothing under `courses/` differs from the commit this phase
    started on.

Acceptance: as the chip's final paragraph.

Gate 24 findings (2026-09-03):

12. **Verified for the gate from the repo:** 783 tests and `tsc -b` clean; nothing under
    `courses/` or `docs/bundles/` differs; version 1.6.7 in all three files; no em dashes
    under `src/`. The help test was mutation-checked: renaming "Play 5 more moves" turns it
    red naming the control and the screen. `extend`, `finishedByCap` and `playedLine` each
    have tests, and `sans` is written once at review from `session.moves`.
13. **Open item 10 is explained.** The server holding port 5175 was the orchestrator's own
    gate 23 dev server, started before the version bump. It was restarted for this gate and
    the header read v1.6.7.
14. **Driven in the Vite build at 1200x980, in both themes.** The dropdown-to-heading gap
    measures 12px. A Caro-Kann game started with "Opening: The Caro-Kann Defence" in the
    header and the switcher live. The dropdown moved to the London and Study showed the
    London while the game held its one move; back on Play the board still held the
    Caro-Kann game, the header still said "Opening: The Caro-Kann Defence" and the dropdown
    still said the London. In the light theme the bar drew White's share as the light
    colour at the top for the Black student, against a dark ground.
15. **The extension buttons were not driven at the gate**: ten moves by pane drag is the
    slow, unreliable part of driving, and the builder's account gives the cap values it saw
    (15 after five more, null after play to the end) on top of the session tests that pin
    every branch. Taken on the tests plus that account.
16. **Open item 6 needs Nick.** A three-move game counting for eleven lines is the rule
    working as written, and the screen says so, but it is a number he has not seen. His
    call: leave it, or count only the deepest lines a game reached.
17. **Nick's own files were not listed and not reported.** The browser build's storage
    was cleared afterwards, with the remembered course put back.

- [x] **Review gate 24 passed** (2026-09-03)

## Phase 25 - replay a reviewed game, and copy it out as text

Goal: Nick reviewed a game on 1.6.7 (2026-09-03), doubted the verdict, and had no way to
look at the game again except a screenshot. No chess content.

Chipped as `chips/phase-25-replay.md`. Once a game is reviewed, the move list and the
report's slips become a viewer: click a move or a slip, or use the arrow keys, and the
board and the bar follow from the scan's own numbers. "Copy game" puts the game on the
clipboard as PGN with the report written in as comments, so a pasted game can be replayed
against the engine without a screenshot. Version 1.6.8; the bar-alignment fix already on
main rides in it.

- [x] 25.1 Replay by click and by arrow key, slips and deviation clickable, bar following.
- [x] 25.2 Copy game as PGN with the report as comments, parsing back through `parsePgn`.
- [x] 25.5 Keep playing from a reviewed game (addendum `chips/phase-25-addendum.md`):
  resume from the final position, extend if capped, one record per game.
- [x] 25.6 Play on from a recorded game, from the Progress screen, keeping the record's
  identity.
- [x] 25.3 Version 1.6.8.
- [x] 25.4 Proved in the browser build at 1200x980, in both themes.

Open items (phase 25):

1. **A replay ply numbers the POSITIONS, not the moves**, which is what makes a slip
   clickable. Ply n is the position after n moves, so the position BEFORE the move at
   index p is ply p and the one after it is p + 1. Clicking a slip goes to the before,
   because the question a mistake raises is what else was on offer, and that is only
   visible from where it was played.
2. **Replay is view state and lives in the screen.** The session's moves are the game and
   they do not move while somebody reads them. Which report the viewer belongs to is held
   beside the ply rather than watched by an effect: an effect would leave one render
   showing the old position against a new game.
3. **The arrow listener is added only while a report is showing.** Study puts the same
   handler on the window. They are never mounted together today, and the day they are is
   not the day to find out.
4. **The PGN writer moved from `bundle.ts` into `pgn.ts`, unchanged.** That module owns
   writing PGN and already held `escapeTag`; a game needs the same `Movetext` and tag
   helpers a course does. No behaviour changed and the bundle tests prove it.
5. **The round trip is what holds the PGN honest.** The app owns a reader, so the reader
   judges the writer rather than a string comparison nobody can check by eye. Seven tags,
   nothing invented: `Site` is the course, `Round` is the standard's "-", and the result
   is `*` for a game that was stopped, because guessing one from the evaluation would put
   a number's opinion where a fact belongs.
6. **`at` is the game's identity now, not only its date.** A game can be reviewed, carried
   on and reviewed again, so `recordGame` replaces the record with the same `at`. The
   existing history-cap test had recorded a hundred and ten games sharing one timestamp,
   which was never true of real games; each now carries its own.
7. **THE BROWSER FOUND A REAL BUG IN THIS PHASE'S OWN WORK, and it was the rule the phase
   exists to keep.** `recordGame` replaced by `at` correctly, but `finish` generated a
   FRESH `at` on every review instead of reusing the one it had kept, so the two records
   never collided and a game reviewed twice was counted twice. Every test passed, because
   the tests covered `recordGame` and the provider's `finish` needs a real engine. Driven
   end to end afterwards: review, Keep playing, review, Play on, review, and the history
   holds one game with the longest move count.
8. **Play on had to be told what to do about a game already on the screen.** It landed on
   the reviewed game rather than the start screen, because the Play screen shows the
   running game whenever there is one, which is the phase 24 rule working. It now clears
   a REVIEWED game, which is over, and waits with a title on a game still being played,
   which is not. Losing a live game to a click on another screen is the sort of thing
   nobody forgives.
9. **The clipboard needed a fallback, and finding that out is why it was driven.** The
   browser pane refuses `navigator.clipboard.writeText` to a page, which is exactly what
   an embedded browser does and what an older WebView2 may do. The modern API is still
   tried first and the old `execCommand` path is behind it. With a real click the button
   said Copied and the OS clipboard genuinely changed.
10. **What was driven at 1200x980, in both themes, from a cleared store.** Dark: a London
    game reviewed, the arrow keys stepping two moves back, a move clicked, the deviation
    sentence clicked to the position it was played from, and the bar changing with each
    (level at ply 1, slightly better later). Copy game said Copied on a real click and
    reported the refusal on a synthetic one. Keep playing put the report away and the
    board back at the final position rather than the replayed one. Light: a Caro-Kann game
    with a deliberate blunder, the slip sentence clicked to the position before Qxa2 with
    the bar reading "slightly better for white" rather than "winning", and both bars
    drawing White's share light and at the top for a Black student.
11. **One thing was proved by a test rather than in the pane.** The clipboard cannot be
    read back there, so the PGN text itself is held by the round trip through `parsePgn`
    rather than by pasting. A sample was generated and read to check the wording, which
    is how the run-together closing comment was caught.
12. **The caveat on the drive, again.** Another session held port 5175 and `--strictPort`
    blocked a second server, so this ran against that one. It serves this session's source
    (all four new help paragraphs were in the page) but `__APP_VERSION__` is substituted
    at server start, so the header read v1.6.7. The version was checked in the four files.
13. **No chess content.** Nothing under `courses/` differs from the commit this phase
    started on.


Acceptance: as the chip's final paragraph.

Gate 25 findings (2026-09-03):

14. **Verified for the gate from the repo:** 836 tests and `tsc -b` clean; nothing under
    `courses/` or `docs/bundles/` differs; version 1.6.8 in all three files; no em dashes
    under `src/`. The help test was mutation-checked: renaming Keep playing turns it red
    naming the control and the screen. The PGN writer has its own test file and the round
    trip through `parsePgn` is one of its twelve tests.
15. **The identity fix (open item 7) was read at source and then proved live.** `finish`
    reuses `recordedAt` when it has one, `start` sets it from a resumed request's `at`,
    and `recordGame` replaces by `at`. Driven in the Vite build at 1200x980 against a
    server restarted so the header read v1.6.8: a Caro-Kann game reviewed at two moves,
    Keep playing, reviewed again, Play on from Progress ("From your game of 3 September,
    move 2", Full game checked), two more plies, reviewed a third time. The stored history
    held ONE record throughout, with the same `at`, three moves and five plies at the end,
    and the Play on row moved from 2 to 3 moves.
16. **The rest of the drive.** After the review the left arrow moved the current move
    from d4 to c6 and the bar read "slightly better for white" for that position; Keep
    playing put the report away with the moves untouched and the status back to "Your
    move"; a real click on Copy game changed the OS clipboard, which the pane reported.
    The light theme was not re-driven at this gate: the builder drove it and no colour
    changed in this phase.
17. **Open item 12 is explained again**: the server on 5175 was the orchestrator's own,
    started before the version bump, and was restarted for this gate.
18. **The PGN helpers moving from `bundle.ts` to `pgn.ts` is the right home** and the
    bundle tests are unchanged, which is the proof that nothing moved but the text.
19. **Nick's own files were not listed and not reported.** The browser build's storage
    was cleared afterwards.

- [x] **Review gate 25 passed** (2026-09-03)

## Phase 26 - the Play screen laid out for playing, a hint, and the last millimetre of the bar

Goal: Nick's findings after installing 1.6.8 (2026-09-03). No chess content.

Chipped as `chips/phase-26-play-layout.md`. The bar still runs about a millimetre past
the board's last square on his display: measure the box against chessground's inner
board and, if the squares end short, use a board size that is whole device pixels per
square (416). Undo, Redo and New game leave the header for a row of real buttons under
the board, ordered New game, Undo, Redo, Hint. Hint draws the repertoire move with its
note while in book and the engine's move once out of it, and the report counts hints.
The move list becomes a narrow column at board height with a thin scrollbar. Version
1.6.9.

- [x] 26.1 Measure the bar against the inner board; 416 if the squares end short.
- [x] 26.2 New game, Undo, Redo as buttons in a row under the board.
- [x] 26.3 Hint: book move with note, else the engine's move; counted in the report and
  the PGN; `hints` on the record.
- [x] 26.4 Move list as a narrow column at board height, thin scrollbar, replay marker
  kept in view.
- [x] 26.5 Version 1.6.9.
- [x] 26.6 Proved in the browser build at 1200x980, in both themes, with the measurements.

Open items (phase 26):

1. **The bar's last millimetre was the box against the squares, measured rather than
   guessed.** In the pane at 1200x980, device pixel ratio 1.5, before: `.board` 420 by 420
   with its bottom at 595.2, `cg-board` 416 by 416 with its bottom at 591.2, squares of 52.
   Chessground floors each square to a whole CSS pixel, so 420 over eight gives 52 and the
   eight come to 416: the box was four pixels taller than the chess, and phase 25 had
   stretched the bar to the box. After the change to 416: board, inner board and bar all
   416, all ending on 591.2, **overshoot 0**. 416 is also whole device pixels per square at
   1.25, 1.5 and 2.0.
2. **The size is a named constant now.** Two boards agreeing by coincidence is how they
   stop agreeing, and the move list beside the board now needs the same number for its
   height.
3. **The controls moved because of what they are, not only where they were.** New game,
   Undo and Redo were text links in a top corner, which reads as navigation. They act on
   the game in front of you, so they are buttons under the board. Keep playing stayed in
   the header: it is what you press when the game is over, so it belongs beside the line
   that says so.
4. **Hint draws the line between teaching and guessing, and says which it is handing
   over.** In book it is the course's own move and note, green, the same answer Drill
   gives. Out of book it is a 500 ms search, blue, with the sentence naming the engine and
   the move number the repertoire ended at. Two colours because they are not the same kind
   of thing. Driven live: green d2-d4 with "The line plays 1.d4..." in book, blue b1-d2
   with "The engine suggests Nd2. No note: the repertoire ended at move 2." out of it.
5. **A hint is counted in four places and the count means one thing.** The session holds
   it, the report says "You used 2 hints.", the PGN says it before the first move where a
   comment about the game belongs, and the record keeps `hints` (optional, like `sans`).
   A game played with help is a different game, and anyone reading it later can tell.
6. **The move list is 167 pixels wide**, down from a full-width box above the report. The
   columns are sized to what actually goes in them, measured in the running app: "100." is
   29px and the longest ordinary move, "O-O-O" or "Nxd4+", is 49. A promotion with check
   is wider and will spill a few pixels into the gap, which is better than clipping a
   move. Board height, 416, from the same constant, with a thin scrollbar on both the
   Firefox and the WebKit properties because the installed app is WebView2.
7. **Two things the drive found that were not in the chip.** A hint survived into the
   report, so advice about move 12 sat over a report on move 19: it is cleared when the
   report is built. And the finished-game notice ran two sentences together, "You were
   checkmated Review it to see...", because the outcome carries no full stop of its own.
8. **The console errors during the drive were HMR artifacts, checked rather than assumed.**
   Editing `size={420}` to `size={BOARD_SIZE}` before adding the import left one reload
   throwing exactly that, and a partial remount threw the catalog one. A fresh tab on a
   clean load has no console output at all, which is what was verified before clearing up.
9. **The port hazard again.** The orchestrator's server holds 5175 and `--strictPort`
   blocks a second, so this drove against theirs. It serves this session's source, which
   every measurement above proves, but `__APP_VERSION__` is fixed at its start, so the
   header read v1.6.8 throughout. 1.6.9 was checked in the four files.
10. **No chess content.** Nothing under `courses/` differs from the commit this phase
    started on.


Acceptance: as the chip's final paragraph.

Gate 26 findings (2026-09-03):

- **Verified for the gate from the repo:** 852 tests and `tsc -b` clean; nothing under
  `courses/`; version 1.6.9 in all three files; no em dashes under `src/`. The help test
  was mutation-checked: renaming Hint turns it red naming the control and the screen.
  `askHint` goes through the engine queue, refuses while thinking or reviewed, and puts
  the playing profile back in a `finally`.
- **The measurement holds in a restarted server showing v1.6.9**, device pixel ratio 1.5:
  `.board`, `cg-board`, the bar and the move list all run from 175.2 to 591.2, 416 tall,
  overshoot zero. The list is 167px wide with `scrollbar-width: thin`. The button row
  under the board reads New game, Undo, Redo, Hint, as `<button>`s with no `.link` class,
  Undo and Redo disabled with only the opponent's move played.
- **Both hints driven.** In book: "The line plays 1...c6. The Caro-Kann..." with two
  arrow shapes on the board and `hints` 1 on the session. Out of book after 1...a6
  2.Ne2: "The engine suggests e6. No note: the repertoire ended at move 1." and `hints`
  2. The review cleared the hint panel, the report read "You used 2 hints.", and the
  stored record carried `hints: 2`.
- **The console errors the builder reported are HMR artifacts, confirmed.** The gate tab
  showed the same four provider errors after a reload, because the pane keeps a tab's
  console across navigations and the orchestrator's mutation edits had gone through HMR.
  A fresh tab on a clean load logs nothing but Vite's connect line and the React DevTools
  notice.
- **The light theme was not re-driven at this gate**; the builder drove it, and the two
  theme-sensitive pieces (the list's scrollbar, the button row) use existing tokens.
- **Nick's own files were not listed and not reported.** The browser build's storage was
  cleared afterwards.

- [x] **Review gate 26 passed** (2026-09-03)

Follow-ups after 1.6.9 (2026-09-03, orchestrator commits, shipped as 1.6.10): the button
row starts under the board's left edge rather than the bar's; the report lists slips in
move order, most recent first, instead of worst first; the move list shows twenty rows.

## Phase 27 - the replay you can see, the Study table in step, and how each game ended

Goal: Nick's six findings after installing 1.6.10 (2026-09-04). No chess content.

Chipped as `chips/phase-27-review-polish.md`. The replayed move gets a dull green mark;
the stepping arrows join the button row, right-justified to the board; the Study lines
table sets every row's moves in the active row's size and weight so the columns stay in
step; the dark-mode notes section is measured and its headings made to stand off the
body; each game records how it ended and Progress shows it in an Ended column, with a
Replay button beside Play on that lands on a live report. Version 1.6.11.

- [x] 27.1 Dull green mark on the current replay move, both themes.
- [x] 27.2 Stepping arrows on the button row, ending at the board's right edge.
- [x] 27.3 Study lines table: one size and weight for every row's moves.
- [x] 27.4 Notes section in dark mode: measure, then contrast or weight.
- [x] 27.5 `outcome` and `finalEval` on the record; Ended and Level columns, time on the
  date; the level on the in-game Opening line; Replay.
- [x] 27.6 Version 1.6.11.
- [x] 27.7 Proved in the browser build at 1200x980, in both themes, with the measurements.

Open items (phase 27):

1. **The replay mark needed a token, not a shade.** `--surface` is a shade of the ground,
   so the marked move disappeared into it. `--mark` is defined in both theme blocks,
   `#3a5b3f` on dark and `#c9e2cc` on light, and measured live as `rgb(58,91,63)` and
   `rgb(201,226,204)`.
2. **The button row spans the board exactly.** Measured: board left 68, right 484; row
   left 68, right 484; the arrows' right edge 484. The arrows are pushed there by `auto`,
   so the row needs no width of its own, and both they and the report are driven by one
   controls object rather than two copies of it.
3. **The Study table drifted because weight is width.** The active row's moves were 500
   and every other row's were 400, so a row becoming active widened its own moves and
   pushed them out of line with the rows above and below - which is exactly where a
   reader looks to find where two lines part company. Every row is now set the way the
   active row is: measured at **zero drift** across the first fourteen moves of two lines
   sharing a trunk, with row 0 active and row 1 not.
4. **The notes measurement contradicted the chip's first branch, and its prescription was
   still right.** The weights were NOT equal: body 400, headings 700. What was equal was
   the ordering being wrong - the body was in `--text`, the brightest colour there is, and
   the headings in `--text-soft`, which is dimmer. On a light ground that reads correctly
   anyway; on a dark one bright 400 gains apparent weight while dim 700 recedes and they
   meet in the middle. Colours swapped: body `--text-soft`, headings `--text` at 600.
   Measured after, in dark: body 400 rgb(200,204,210), headings 600 rgb(230,230,230).
5. **"Ended" never says a colour.** A game that ended says so in its own words; a stopped
   game is described by the position it stopped in, turned to the trainee's side. The same
   evaluation reads "clearly better for you" in a White course and a Black one, which is
   the whole point: the reader's colour changes with the course and a bare colour would be
   translated wrong half the time. The bands moved into `verdictBand` so `verdictInWords`
   and `verdictForYou` cannot drift apart.
6. **A REAL BUG, and it is the phase 25 rule breaking a second time by a different door.**
   Replay wrote a second record instead of replacing the first. Two causes, both fixed:
   the replay effect read the screen's launch state, which an effect declared above it
   sets in the same commit, so it saw `at: undefined` and minted a fresh identity; and
   `finish` closed over `recordedAt` as it stood when the callback was made, which for a
   caller that starts a game and reviews it in one go is BEFORE the start. The identity
   now lives in a ref read at the moment it is used, and the replay reads everything from
   the request. **Rule worth keeping: a callback that has to see state set by an earlier
   await in the same sequence must read it from a ref, not from its closure.**
7. **The suite could not have caught it, for the third phase running.** The tests hold
   `recordGame`, `replayRequest` and `endedText`, and all passed while the provider wrote
   two records. Everything the provider does with a real engine is outside the suite,
   which is the SPEC section 6 register entry, and it has now cost an identity bug twice.
8. **The level is named by one function.** The picker, the line over the board and the
   Progress column all say "4. Club", and three templates would have become three
   spellings.
9. **What was driven at 1200x980, in both themes, from a cleared store.** The mark on the
   current move in both themes; the row ending at the board's right edge; the Study table
   at zero drift with the moves readable on every row; the notes measured before and
   after; the Play on list showing "4 September, 09:12", "4. Club" and both an ending
   ("You were checkmated") and a stopped game ("Stopped, level"); Replay landing on the
   report with the arrows live and the history still holding one game.
10. **This drive ran on THIS session's own server.** Port 5175 was free, so the version
    constant is the real one and the header read v1.6.11 throughout. The server was
    restarted after the version bump for exactly that reason.
11. **Console errors were judged from a fresh tab**, per the hazard: the driving tab held
    HMR reload failures from the moments files were being edited, and a fresh tab visiting
    Play, Study and Progress had no console output at all.
12. **No chess content.** Nothing under `courses/` differs from the commit this phase
    started on.


Acceptance: as the chip's final paragraph.

Gate 27 findings (2026-09-04):

- **Verified for the gate from the repo:** 866 tests and `tsc -b` clean; nothing under
  `courses/`; version 1.6.11 in all three files; no em dashes under `src/`. The help test
  was mutation-checked: renaming Replay turns it red naming the control and the screen.
- **Driven against the builder's own server** (it held 5175 and serves the same tree),
  header v1.6.11, at 1200x980: the replayed move marked in rgb(58,91,63); the button row
  from 68 to 484 with the two arrows ending at 484, the board's right edge; the in-game
  line "Opening: The Caro-Kann Defence, against 4. Club"; the Play on table with Played
  "4 September, 09:19", Strength "4. Club" and Ended "Stopped, slightly better for the
  engine"; Replay landing on a live report with the arrows working.
- **Two follow-ups landed at the gate as the orchestrator's own commits.** The Play on
  table had seven columns in the 640px the other tables are held to and wrapped Ended to
  five lines; it now takes its own width (882px) with every cell on one line. And Replay
  broke its own rule: the re-scan wrote a fresh `finalEval` to the record (0.47 became
  0.39 with nothing played). The review now skips the record when the game was loaded
  from one and no move has been played on top of it. Driven after: Replay left 0.39 in
  place; Play on with one more move reviewed to the same record at three moves.
- **The identity bug returning through a second door (open item on `recordedAt`) is the
  third time a provider bug has passed the suite.** The register entry stands; a DOM
  test environment with a fake engine in the provider is the thing that would close it,
  and it is now worth a phase of its own rather than a line in one.
- **The Study table and the notes section were taken on the builder's measurements**
  (zero drift across fourteen moves; body 400 in `--text-soft`, headings 600 in `--text`
  in dark), not re-driven.
- **Nick's own files were not listed and not reported.** The browser build's storage was
  cleared afterwards.

- [x] **Review gate 27 passed** (2026-09-04)

## Phase 28 - how every game ended, including the ones played before we kept it

Goal: Nick's finding on 1.6.11 (2026-09-04) that mated games read "Stopped" and stopped
games carried no verdict. No chess content.

Chipped as `chips/phase-28-how-it-ended.md`. A record without an outcome has its ending
worked out from its moves; a record gains `length` so a capped game reads "Move limit";
Ended and Position become two columns; Replay may fill in a missing verdict and never
overwrite one; the greyed Play on and Replay buttons say whether a game is being played
or reviewed. Version 1.6.12.

- [x] 28.1 Ending derived from the moves; `length` on the record; Move limit.
- [ ] 28.2 Ended and Position columns; Replay fills in, never overwrites.
- [ ] 28.3 The greyed buttons say why; the report-showing case checked.
- [ ] 28.4 Version 1.6.12.
- [ ] 28.5 Proved in the browser build with seeded records.

Acceptance: as the chip's final paragraph.

- [ ] **Review gate 28**
