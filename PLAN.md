# Tabiya - build plan

v2.0, 2026-08-28 (v1 phases 1-5 shipped 2026-08-27). Governed by SPEC.md; where they
disagree, SPEC.md wins. One builder session executes one phase, working in
`C:\Users\nick2\Code\Tabiya` on `main`, no worktree. Read SPEC.md in full - section 10
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
- [x] 28.2 Ended and Position columns; Replay fills in, never overwrites.
- [x] 28.3 The greyed buttons say why; the report-showing case checked.
- [x] 28.4 Version 1.6.12.
- [x] 28.5 Proved in the browser build with seeded records.

Open items (phase 28):

1. **The moves were always there; nobody had asked them.** A record has carried its `sans`
   since 1.6.7 and its `outcome` only since 1.6.11, so Nick's checkmates read as
   "Stopped". Replaying the moves answers it. The five sentences moved into
   `src/play/outcome.ts` and the session says them from there, because two copies would
   become two vocabularies the day one was reworded.
2. **"Move limit" needs the length, and the length is new.** Nothing else tells a game
   that ran out of moves from one stopped by hand. The count has to MATCH the cap, not
   merely reach it: a game carried on past its limit by Play on did not stop at the limit,
   and a record at 14 moves with a `move10` length reads "Stopped".
3. **Position is blank where nothing honest fits.** No evaluation kept, or the game ended
   in mate and the ending has said it. A DRAW keeps its number, which is a small decision
   worth its reason: "Drawn by repetition" and "Winning for you" together say how the draw
   was reached, and neither says it alone.
4. **Replay may fill in, never overwrite, and merges rather than writes.** A record from
   before 1.6.11 has no verdict and this scan is its only chance at one, so the phase 27
   "a replay is reading" rule gains one exception, guarded on BOTH fields being absent.
   It merges onto the record: the moves, hints and level the game itself recorded survive
   a replay that did not play it. The provider reads the history through a ref, for the
   same reason the identity is read through one - a callback in an async sequence must not
   trust its closure.
5. **The greyed buttons were not a bug, and I looked.** Reproduced the sequence the chip
   named: during a Replay's scan they are disabled and now say "The game is being
   reviewed; wait for the report."; the moment the report shows they are live again, with
   no title. What Nick saw was the scan, and it now says so.
6. **A REAL BUG found while driving, unrelated to what the phase was asked for.** The Play
   on list reversed the history, which was newest-first only while records were appended.
   Phase 25 let a record be replaced, and a replacement goes to the END, so the first
   Replay that filled a verdict into a game from 2 September put it above 4 September on
   screen. It sorts by `at` now. Its own commit, because it predates this phase. The
   existing tests used `at` values that were not dates and only passed because the code
   reversed.
7. **What was driven at 1200x980 on this session's own server, v1.6.12 in the header.**
   Four seeded records shaped like Nick's. A mate with no `outcome` reads "You won by
   checkmate" with Position blank. A stopped game with no `finalEval` reads "Stopped" with
   Position blank. The same twenty-ply game reads "Stopped" without a length and "Move
   limit" with one, Position "Level". Replaying the two without evaluations filled them in
   ("Level", then "Winning for you") and left the other rows and every other field
   untouched, with four records before and four after.
8. **Console judged from a fresh tab**, per the hazard: no output at all across Play,
   Study, Progress and Help on a clean load.
9. **No chess content.** Nothing under `courses/` differs from the commit this phase
   started on.


Acceptance: as the chip's final paragraph.

Gate 28 findings (2026-09-04):

- **Verified for the gate from the repo:** 881 tests and `tsc -b` clean; nothing under
  `courses/`; version 1.6.12 in all three files; no em dashes under `src/`. The five
  outcome sentences live once in `src/play/outcome.ts`; the fill-in merges onto the held
  record through a ref and refuses when either field is already there; the list sorts
  by `at`.
- **Driven with four seeded records** shaped like Nick's, against the builder's server
  showing v1.6.12: a mated record with no outcome read "You were checkmated"; a stopped
  one "Stopped" with Position blank; twenty plies with no length "Stopped"; the same with
  `move10` "Move limit" and Position blank until replayed; newest first by date.
- **One bug found by the drive and fixed at the gate as the orchestrator's commit.**
  Replaying the record stopped after 2...d5 came back with five plies: the game was
  loaded with the opponent to move and `start` let it move before the review. The
  replay options now hold the opponent. Re-driven: four plies, two moves, verdict 0.49
  filled in, every other record untouched.
- **The greyed buttons** were not caught mid-scan (the scan of six positions is under a
  second) and were live with the report showing; the builder's reproduction of the
  scanning title stands.
- **Both of the builder's decision rules stand**: Move limit only when the count equals
  the cap, and a draw keeps its Position.
- **The ordering bug it found beside the phase is the right generalisation**: a list that
  reverses an append-ordered store breaks the moment the store can replace.
- **Nick's own files were not listed and not reported.** The browser build's storage was
  cleared afterwards.

- [x] **Review gate 28 passed** (2026-09-04)

## Phase 29 - a test rig that can play a game

Goal: three phases running, a game-provider bug passed every test and was found only by
playing. Nick ruled on 2026-09-04 to spend a phase on the rig. No user-visible change,
no version bump, no build.

Chipped as `chips/phase-29-test-rig.md`. jsdom for `*.dom.test.tsx` beside the existing
string-render tests; the engine injected into `PlayProvider` with the fake shared from
`src/test/`; the three bugs (phase 23's memo, phase 25 and 27's identity, phase 27's
replay write) each pinned by a DOM test shown red against the bug; the phase 22 and 23
register entries closed by real tests; a testing page linked from the SPEC.

- [x] 29.1 jsdom environment for `*.dom.test.tsx`; engine injected into the provider.
- [x] 29.2 Three regression tests, each shown red against its bug.
- [x] 29.3 Register entries closed: the greyed switcher, the view change, Progress with a
  record.
- [x] 29.4 No snapshots, no timers, no worker.
- [x] 29.5 `docs/testing.md` linked from the SPEC; the ruling logged in section 8.

Acceptance: as the chip's final paragraph.

What landed: 898 tests in 8.3 seconds, both projects under one `npx vitest run` (the
ten-second rule set here was raised to twenty at phase 33). Four
regression tests rather than three - the fourth is the replay that added a reply to a
game stopped mid-move, fixed on main between phases, and deleting `holdOpponent` names
the extra move in the failure. The phase 27 identity bug took a file of its own, because
its stale closure only bites when a start and a review run back to back with no render
between them, which is Replay and nothing else. Two register entries are closed on the
terms they set: the greyed switcher and the view change. No version bump, no build.

Gate 29 findings (2026-09-04):

- **Verified for the gate from the repo:** 898 tests across both projects in 9.1 seconds
  under one `npx vitest run`; `tsc -b` clean; nothing under `courses/`, `docs/bundles/` or
  `src-tauri/`; version unchanged at 1.6.12 as ruled. The four dev dependencies are pinned
  exact. `PlayProvider` takes `createEngine` with the real engine as its default; the
  worker guard is a test that installs a throwing `Worker` and asserts it was never
  constructed; no snapshot, fake timer or `setTimeout` in any DOM test.
- **Two of the four regression tests were mutation-checked by hand at the gate.** Turning
  `holdOpponent` off makes "does not add a reply to a game that was stopped mid-move" red.
  Minting a fresh `at` on every review makes both identity tests red ("replaces the record
  when a game is carried on and reviewed again" and "keeps one record through a Play on
  from Progress"). Both files restored from git afterwards. The other two mutations are
  taken on the builder's account, which names the failing tests for each.
- **The register entries for the greyed switcher and the view change are closed** in SPEC
  section 6 on the terms they set, and the builder's correction stands: Study has a board
  of its own, so the view-change test reads the move list and the chapter heading rather
  than the absence of a board.
- **`docs/testing.md` is linked from the SPEC's architecture section**, which no longer
  says the UI is verified by use, and the ruling is logged in section 8.
- **The board is stubbed at the component boundary in DOM tests** because chessground
  needs `ResizeObserver`, and the rig has a test that pins that throw so the stub is
  retired loudly when jsdom grows one.
- **No build**: nothing a person can see changed.

- [x] **Review gate 29 passed** (2026-09-04)

## Phase 30 - play from here, out of a replay

Goal: Nick, replaying a game on 1.6.12 (2026-09-04), was told move 35 missed a forced
mate and wants to start a new game from that position to find it. No chess content.

Chipped as `chips/phase-30-play-from-replay.md`. A "Play from here" button on the button
row during a replay, enabled on the trainee's positions only; it sends the same request
Study sends, with the game's own course, chapter and level, no identity, so the first
review mints a new record and the old one is untouched. Proved by a DOM test shown red
before the feature. Version 1.6.13.

- [x] 30.1 Play from here on the row; a new game from the replayed position.
- [x] 30.2 DOM test red first; string test for the request builder; help mutation check.
- [x] 30.3 Help and SPEC.
- [x] 30.6 A second row under the board for the review controls: Keep playing and Play
  from here left, arrows right; titles on both saying how they differ.
- [x] 30.4 Version 1.6.13.
- [x] 30.5 Proved in the browser build.

Acceptance: as the chip's final paragraph.

What landed, and one correction to the chip. The chip expected the report to stay on
screen behind the start options while a Study-style request waits; it does not, and it
cannot, because the launch options only render when there is no session at all. So Play
from here sends the request and then throws the reviewed game away, exactly as New game
does, and the trainee sees the options with "From your game of 4 September, after move 1"
already chosen. The record was written at the review, so nothing is lost by it.

Measured live at 1200x980: the board is 416px from x=68, row one spans 68 to 484 with its
last button ending at 374, row two spans the same 68 to 484 with the arrows ending exactly
at the board's right edge. Neither row wraps, both are 37px tall.

Driven end to end: 1.d4 f5 2.Bf4 Nf6 reviewed, stepped back to after 1...f5, Play from
here, Start, Hint (green arrow c1-f4, "The line plays 2.Bf4. The same first move as ever.
The bishop is outside the pawn chain before anything else happens."), 2.Nf3 instead,
reviewed. Two records with different identities, the first still d4 f5 Bf4 Nf6 with no
hints and no deviation, the second d4 f5 Nf3 Nf6 with one hint and a deviation at move 2.
Storage cleared afterwards and a fresh tab shows no console errors.

Gate 30 findings (2026-09-04):

- **Verified for the gate from the repo:** 913 tests in about ten seconds under one run;
  `tsc -b` clean; nothing under `courses/`; version 1.6.13 in all three files; no em
  dashes under `src/`. The request built from a replay carries the game's course, level,
  chapter and moves and no `at`, no `reviewAtOnce`, no `holdOpponent`.
- **The DOM test was mutation-checked at the gate**: giving the new game the old identity
  (`at: game.at` in `requestFromReplay`) turns "starts a new game and leaves the replayed
  one alone" red. Restored from git.
- **Driven against the builder's restarted server, header v1.6.13, at 1200x980.** A
  Caro-Kann game reviewed at two moves; two steps back; row one read New game, Undo, Redo,
  Hint and row two Keep playing, Play from here and the two arrows, both rows from 68 to
  484, both 37px, both buttons carrying their titles. Play from here opened the start
  screen with the "From your game" radio checked; Start, one move, review: two records with
  different `at`, the first byte for byte as before.
- **One fault fixed at the gate as the orchestrator's commit.** The label read "after move
  0" for the position after 1.e4, because a full move count at ply 1 is zero. It now names
  the move: "after 1.e4", "after 1...c6", "from the start". Tests follow.
- **The builder's design correction stands**: the launch options only render with no
  session, so Play from here replaces the reviewed game as New game does; the record was
  written at the review and nothing is lost.
- **Nick's own files were not listed and not reported.** The browser build's storage was
  cleared afterwards.

- [x] **Review gate 30 passed** (2026-09-04)

## Phase 31 - the Sicilian Najdorf, a seventh course

Goal: Nick commissioned the Najdorf on 2026-09-04, his third Black course and his
counterpunching answer to 1.e4 beside the Caro-Kann.

Chipped as `chips/phase-31-najdorf.md`. Id `najdorf-black`, permanent. Move order 2...d6
always; the Poisoned Pawn out by the fork rule. Seven chapters: the idea; 6.Bg5 with
6...e6 7.f4 Be7; the English Attack with 6...e5; 6.Be2, 6.f4 and 6.g3; 6.Bc4, 6.h3 and
friends; the anti-Sicilians one recipe each; tactics and plans with defensive exercises.
All four checkers, the mistakes pass at 2500 ms, engine work never beside another heavy
process. Version 1.7.0.

- [x] 31.1 Rulings and decision rules (done in the chip).
- [x] 31.2 Seven chapters to the section 3 bar, student Black.
- [x] 31.3 Suite green after every chapter.
- [x] 31.4 Four checkers, outputs under `docs/engine-runs/phase-31/`, 2500 ms passes in a
  quiet window.
- [x] 31.5 The course's test block with two course-specific claims.
- [x] 31.6 Scoping test: Caro-Kann against Najdorf.
- [x] 31.7 Bundle exported and round-tripped.
- [x] 31.8 Prose counts say seven.
- [x] 31.9 Version 1.7.0.
- [x] 31.10 Proved in the browser build.

Acceptance: as the chip's final paragraph.

**Open items, every one of them a decision with its number.**

*The forks taken, one sentence each.* Against 6.f4 the course plays the e-pawn two
squares rather than 6...Qc7, because it is the same rule as the rest of the chapter and
one rule is easier to hold than two. Against 6.h3 e5 7.Nde2 it plays the bishop to e6
rather than 7...h5, because it needs nothing calculated. Against the Alapin it plays the
knight to f6 rather than the pawn to d6, which is the only place the move-order policy
bends, and the chapter says so. The Smith-Morra is declined, the Poisoned Pawn is out,
and 8...h6 9.Bh4 g5 is out, all three under the theory fork rule.

*What the engine changed.* Two 500 ms passes disagreed with each other, six findings
against eight, and the union went to the 2500 ms arbiter. Four were real faults: the
Grand Prix line walked past a free pawn on e4 and now takes it (-1.13 against -0.12); a
knight to d7 at +1.55 became the queenside pawn at +0.28; a queenside pawn at +0.95
became the h-pawn at +0.34, which is the one place in the course Black meets a wing
attack on the wing; and a break at +0.63 became the e-pawn at +0.02. Exercise 5 was
reframed: trading on d5 is sound at -0.30 and 12...Nxe4 is -1.27, so the exercise now
asks for the tactic and the lesson is to look before playing the prepared move. A
confirming 500 ms pass reports nothing.

*What the engine did not change, with its number.* In the 6.Rg1 line, recapturing with
the bishop measures +0.22 against +0.13 for the queen. Inside the half-pawn band, the
move the structure wants, kept.

*The grades.* The 2500 ms mistakes pass disagreed with 26 of 250 entries and was right
about all of them. Three were not inaccuracies at all: after 11.Bh6 in the
Fischer-Sozin, 11...Nxe4, 11...b4 and 11...Bb7 lose by force to 12.Bxg7, because Kxg7
steps onto the file White's queen is on. One of those three had been graded playable.
The course's own move there is +0.29, so the line is sound and the alternatives are not.
Recorded in `docs/engine-runs/accepted.md`: a mate score is outside every band because
the schema has no grade above mistake, so those three report for ever. A confirming pass
took 26 down to 4, and the fourth was a band-edge straddle at 0.98 against a playable
ceiling of 0.9 which the first pass had measured under the line; inaccuracy holds both
measurements and needs no third run.

*The verdict-strength passes ran, and here is the window.* Sixteen logical processors,
CPU load 18 to 34 per cent, no build, no test run and no second engine process at any
point. Both mistakes passes and every engine-ask ran one at a time.

*Two claims the course makes that the engine prices low.* The e-pawn going two squares
against 6.Bc4, which chapter 4 is built around calling an exception, costs 0.45 rather
than the mistake it was graded. It is an inaccuracy now and the note says the number is
small and the trouble lasts the game, which is the honest version of a positional claim.

*Proved in the browser build at 1200x980, driven against another session's dev server on
5175 because that port was held.* Seven tiles with the Najdorf's tagline; Study opens
chapter 0 with its intro and names both its lines, chapter 1 names all five; ticking one
line learnt gives Drill ten cards and the session runs with the board Black's way up;
Play starts a game as Black, the engine opens 1.e4, and the book steers it into 2.f4 d6
3.Nf3, which is chapter 5's own Grand Prix line; Progress reads "1 of 344 lines learnt
across 7 courses", and 344 is the other six courses' 308 plus this one's 36, so no
existing line id moved. Storage cleared afterwards and a reloaded page shows no console
errors. **The version banner read 1.6.13 throughout**, because that server was started
before the bump and the version is baked in at start; the three version files read 1.7.0
and `src/version.test.ts` holds them together.

Gate 31 findings (2026-09-04):

- **Verified for the gate from the repo:** 956 tests and `tsc -b` clean; version 1.7.0 in
  all three files; nothing under the other six course folders differs; **308 line ids
  before, 344 after, none gone, 36 added**, all under `najdorf-black`; no em dashes under
  `src/` or `courses/`; the bundle `docs/bundles/najdorf-black.pgn` present and held by
  the round-trip test.
- **The engine records are complete and their conditions are written at the top of each
  file**: two 500 ms passes, every finding re-checked at 2500 ms, a confirming pass after
  the fixes reporting nothing, the mistakes pass at 2500 ms with its confirming run, and
  both prose checkers at zero. The three forced-mate alternatives at 11...Ne8 in ch4 are
  in `docs/engine-runs/accepted.md` with the reason they will report for ever.
- **Three ruled lines spot-checked by the orchestrator at 2500 ms**: the 6.Bg5 main line
  after 9...Nbd7 is +0.39 (inside the band and the theory move), the English Attack after
  10...Nbd7 is +0.50 (at the band's edge, the theory move, kept), and the Grand Prix fix
  4...Nxe4 stands at -1.23 for Black.
- **Driven in the Vite build restarted to v1.7.0 at 1200x980**: seven tiles in two rows
  of four and three; the Najdorf tile with its tagline and "0 of 36 lines learnt"; Study
  opens ch0 with the seven chapter titles and two named lines; Play as Black starts with
  the engine's 1.e4 out of the book.
- **Content counts by the orchestrator**: intros 374 to 493 words; every node noted and
  every leaf named; mistake entries 23, 41, 35, 36, 42 and 73 in ch0 to ch5. **ch6 has
  none**, where the section 3 bar asks for ten. The precedent is uneven (the Vienna's ch6
  has 13, the Colle's 6, the Caro-Kann's 1), so this is a follow-up rather than a block:
  sent to the builder as 31.11, to land with a 2500 ms mistakes pass over ch6 before the
  next build.
- **Nick's own files were not listed and not reported.** The browser build's storage was
  cleared afterwards.

- [x] 31.11 Follow-up: ten or more authored mistake entries in ch6, graded at 2500 ms.
- [x] 31.12 Follow-up: one grade per position per course, as a content test, and the six
  conflicts it finds settled at 2500 ms (three in the Najdorf, two in the Colle, one in
  the Ruy). Found at the 31.11 check: the ch6 copy of the regraded O-O still read
  inaccuracy.

  Done. The rule is in `content.test.ts`, per course, reporting every clash at once, and
  it was red on all three affected courses before the fixes: eight rows over six
  positions, because two of the Najdorf's appear in three chapters each.

  **The lesson is about 31.11, not about the six.** That commit copied chapter 6's
  alternatives keyed by position and claimed the key is what stops the copies drifting.
  It is not. The key made them right at the moment of copying; nothing held them together
  afterwards, and an hour later the arbiter moved a grade in chapter 4, I moved the
  chapter 4 copy, and chapter 6 kept the old grade with a note calling a losing move
  "safe and normal". A copy needs a test, not a good key. The engine pass cannot stand in
  for one either: it reported one copy of each conflicting pair and not the other, which
  is exactly how fixing what it reports leaves the second copy behind.

  Each of the six asked once at 2500 ms, one engine at a time, on a quiet machine. Two
  grades were overturned by the number rather than by taste: the Najdorf's e5 against
  6.Bg5 costs 0.46 and a mistake starts at 0.7, so both copies come down to inaccuracy;
  the Colle's c3 costs nothing at all, +0.13 against a best of +0.13, and its inaccuracy
  grade turned out to be a curriculum reason wearing a chess one. The Ruy's e5 costs over
  two and a half pawns and its exercises copy was simply wrong. Chapter 1 of the Najdorf
  also had an intro sentence saying the e-pawn push loses the pawn on d6; it does not, it
  concedes d5, and that is corrected.

  Landed as two commits, older courses first, so each is green on checkout. Version stays
  1.7.1.

  Done, and 37 positions rather than ten. Chapter 6 runs lines that chapters 1 to 5
  already carry, so 35 of those positions already had authored alternatives that had
  survived two verdict-strength passes; they were copied **by position** rather than
  retyped, which is what stops the two copies drifting. The two positions chapter 6
  reaches that no other chapter does are the answers to exercises 5 and 6, and those were
  written fresh.

  The 2500 ms pass over the whole course, 364 positions, on a quiet machine with the
  1.7.0 build already finished, reports five. Three are the accepted forced-mate entries.
  **Two are new and both are straddles rather than overshoots**, which is the gate 20
  distinction: the rook to c4 in chapter 3 and castling early in chapter 4 measured under
  the 1.80 inaccuracy ceiling on the first two passes and 1.82 and 1.81 on this one. Under
  that ruling a straddle goes quiet rather than into `accepted.md`, and the phase 19
  precedent is to take the stricter grade on what the line does. Both are `mistake` now,
  which covers every measurement taken of either, so neither will report again.

  One of the two had a note worse than its grade, and that is the reason worth recording.
  Castling early in the Fischer-Sozin was described as "safe and normal". It is neither:
  it is the move that puts the king in front of White's queen and bishop, and the position
  three moves later in the same chapter is the one where that attack is a forced mate. The
  note says so now.

  Version 1.7.1, because the 1.7.0 build read chapter 6 while this edit was in progress.

- [x] **Review gate 31 passed** (2026-09-04), with 31.11 open as a follow-up.

Follow-up gate (2026-09-04, orchestrator): 31.11 and 31.12 verified on a clean tree at
1.7.1: 963 tests, 344 line ids unchanged, zero grade conflicts across the catalog by the
FEN-plus-SAN script, and the new one-grade rule mutation-checked by flipping a chapter 6
copy (red, naming the position). Two grades were overturned by the number in the
direction of leniency (the Najdorf e5 against 6.Bg5 at 0.46, the Colle c3 at 0.00) and
the rest confirmed. The 1.7.1 installer was built from this commit with a clean tree.

## Phase 32 - play the other side

Goal: Nick, 2026-09-05, wants to play against the opening he has learnt, with the engine
playing the course. No chess content.

Chipped as `chips/phase-32-other-side.md`. A fourth launch shape, "Play the other side":
the trainee takes the opponent's colour and the engine plays the repertoire move while
the game is in the course, every time by default or sometimes a listed alternative under
a remembered setting. The report's repertoire part becomes "The course"; Hint shows the
reply club players make most often; records carry the side, are counted apart on Progress
and excluded from Lines played. Version 1.7.2.

- [x] 32.1 The book carries each position's listed alternatives.
- [x] 32.2 The session plays either side, with tests for both settings.
- [x] 32.3 The other-side report and PGN.
- [x] 32.4 The start screen: the fourth radio and the remembered setting.
- [x] 32.5 Hint from the book's weights.
- [x] 32.6 Progress: counted apart, excluded from Lines played, Play on resumes the side.
- [x] 32.7 DOM tests red first; help test mutation-checked.
- [x] 32.8 Help and SPEC.
- [x] 32.9 Version 1.7.2.
- [x] 32.10 Proved in the browser build.

Acceptance: as the chip's final paragraph.

**Open items, for the gate.**

*One tension in the chip, settled by the builder.* The ruling says Play the other side
combines with the existing launch shapes, and 32.4 asks for a fourth radio, which cannot
combine with the radios beside it. The radio is what is built, and under it a dropdown
of which lines the course plays, Any line first, which delivers the any-line and
this-chapter combinations. From-a-position on the other side arrives through Play on of
a game that was itself played on the other side, which the ruling names. **Study's Play
from here stays on the trainee's own side**, because the From radio and the other-side
radio are two choices in one group. If Nick wants to play against the course from a
Study position, that is a ruling about the control's shape, not a line of code.

*The DOM tests were shown red the phase 29 way, after the fact.* The screen was built
before the tests were written, so red was shown by checking out the tree from before the
screen commit, running the five, and restoring: all five fail on "Play the other side"
not existing, all five pass on main. The help test was mutation-checked on each of the
three new names in turn.

*The suite is at the edge of its budget.* 997 tests in 9.4 to 9.7 seconds on repeat,
against the phase 29 rule of ten. The five new DOM tests cost about three seconds of
test time between them, at the going rate of one full app render each. One more DOM
file of this size crosses the line, and the next builder should know. **Raised to twenty
at phase 33**, with the reason the rule exists written beside the number.

*Driven at 1200x980 on this session's own server, banner 1.7.2.* The Najdorf on the
other side: the trainee to move first as White, 1.e4 answered by the course's 1...c5,
Hint saying "Club players most often play 2.Nf3 here" with the blue arrow, 2.Nf3 answered
by 2...d6, and the report leading with The course and "The course played its book to the
end." The record carried side other, no deviation and one hint; Progress read "1 game, 1
of them playing the other side", the Play on row said "other side", and Lines played
listed nothing, which is the exclusion. The London on the other side: the engine opened
1.d4 and the board was Black's way up. The setting flipped to Sometimes a listed
alternative and held across a reload. Storage cleared, no console errors.

Gate 32 findings (2026-09-05):

- **Verified for the gate from the repo:** 998 tests in under ten seconds and `tsc -b`
  clean; version 1.7.2 in all three files; nothing under `courses/`; 344 line ids
  unchanged; the tree clean at the start of the gate.
- **Two mutations checked by hand.** Making the trainee colour always the course's turns
  three of the five other-side DOM tests red. Removing the side filter from Lines played
  turns "leaves out a game played against the course, however far it ran" red. Both
  restored from git.
- **Driven against a fresh server at v1.7.2, 1200x980.** The Najdorf on the other side: the
  fourth radio with its two-setting fieldset under it, the default "The course move every
  time" checked; the trainee to move first as White with the board White's way up; 1.e4
  answered by the course's 1...c5 and 2.Nf3 by 2...d6; Hint "Club players most often play
  2.Nf3 here"; the report leading with The course; the record carrying `side: 'other'`
  and one hint; Progress reading "1 game, 1 of them playing the other side", the Play on
  row saying "other side", and Lines played empty.
- **One bug found by the drive and fixed at the gate as the orchestrator's commit.** The
  Position column read "Slightly better for the engine" for a game the trainee played as
  White at +0.45: `endedText` and `positionText` took the trainee's colour from the
  course. A derived checkmate would have been attributed to the wrong side the same way.
  `traineeColour` turns the record's side into the colour actually held, with a test both
  ways, and the row now reads "Slightly better for you".
- **The builder's design call stands**: the fourth radio cannot combine with the From
  radio in the same group, so the other side is chosen with a dropdown of the course's
  lines under it, and Study's Play from here stays on the trainee's own side. If Nick wants
  to face the course from a Study position, that is a ruling about the control's shape.
- **The suite is at its budget**: 997 to 998 tests in 8.7 to 9.7 seconds against the phase
  29 rule of ten. The next DOM file of any size crosses it, and the next chip should say
  whether the rule bends or the tests get cheaper. **It bent: twenty seconds at phase 33.**
- **Nick's own files were not listed and not reported.** The browser build's storage was
  cleared afterwards.

- [x] **Review gate 32 passed** (2026-09-05)

## Phase 33 - the other side from any start, and a suite budget that fits the app

Goal: Nick, 2026-09-05, wants to play the other side from a Study position too, and has
relaxed the ten-second suite rule. No chess content. Done before phase 34.

Chipped as `chips/phase-33-other-side-anywhere.md`. "Play the other side" becomes a
checkbox that goes with every launch shape, the lines dropdown goes, the engine-first
start from a position is tested, Play on and Replay keep a record's side with the box
ticked and disabled, and the suite rule becomes twenty seconds with its reason written
down. Version 1.7.3.

- [x] 33.1 The checkbox replaces the radio and its dropdown.
- [x] 33.2 The side goes on every launch shape; a record's side wins.
- [x] 33.3 The engine-first start from a position, tested.
- [x] 33.4 DOM tests red first; help test mutation-checked.
- [x] 33.5 The suite rule at twenty seconds, in the testing page and the SPEC.
- [x] 33.6 Help and SPEC.
- [x] 33.7 Version 1.7.3.
- [x] 33.8 Proved in the browser build.

Acceptance: as the chip's final paragraph.

**For the gate.** The four DOM tests were written first this time and shown red on the
phase 32 radio, all four failing on there being no checkbox by that name, and green after
the control changed. The engine-first start from a position needed no provider change:
`start` already lets the engine move first when the position has it to move, out of the
book when the book has the position. It is pinned on the session with the fake engine (a
Caro-Kann position after 1.e4: the trainee is White, the engine answers 1...c6 at once,
the trainee is then to move) and driven on the screen. The help test was mutation-checked
on the box's name. 1003 tests in 9.0 to 9.5 seconds against the new rule of twenty.

Driven at 1200x980 against another session's server on 5175, banner 1.7.2 (the version
is baked at that server's start; the source is served from disk and the three version
files read 1.7.3). Study in the Caro-Kann, one step to 1.e4, Play from here: the From
radio read "From 1.e4" and the box sat beside it, ticked without unticking the radio.
Start: the engine answered 1...c6 at once, the board was White's way up, "Your move", and
the header read "playing the other side". Reviewed, then Progress: the Play on row said
"other side", and Play on landed with the box ticked and disabled and its title saying the
game carries on there. One note from the drive: a click on Study before the screen had
rendered sent a request with no moves, which was the drive's haste and not a fault; the
second attempt with a pause between the steps was right. Storage cleared, no console
errors.

Gate 33 findings (2026-09-05):

- **Verified for the gate from the repo:** 1003 tests in 9.5 seconds and `tsc -b` clean;
  version 1.7.3 in all three files; nothing under `courses/`; the tree clean at the start.
  The rule reads twenty seconds in `docs/testing.md` and SPEC section 8 with its reason.
- **One mutation checked by hand.** Making the box count for every launch shape except
  "From a Study position" turns "starts at the position with the trainee as White, and the
  course has already answered" red. Restored from git.
- **Driven against a fresh server at v1.7.3, 1200x980.** Study in the Caro-Kann, one step to
  1.e4, Play from here: the From radio read "From 1.e4" with the box unticked beside it.
  Ticking the box showed the two-setting fieldset with "The course move every time"
  checked. Start: the engine answered 1...c6 at once, the trainee was White to move with
  the board White's way up, and the header read "playing the other side".
- **The builder's note about a request with no moves is not a fault**: Play from here at
  the chapter's start sends an empty move list, which is the start position.
- **Nick's own files were not listed and not reported.** The browser build's storage was
  cleared afterwards.

- [x] **Review gate 33 passed** (2026-09-05)

## Phase 34 - the Scandinavian Defence, an eighth course

Goal: Nick commissioned the Scandinavian on 2026-09-05 as his fourth Black course and his
third answer to 1.e4: the simple one beside the solid Caro-Kann and the counterpunching
Najdorf.

Chipped as `chips/phase-34-scandinavian.md`. Id `scandinavian-black`, permanent. 2...Qxd5
with 2...Nf6 out by the fork rule; the queen's square after 3.Nc3 is a decision rule
pointing at 3...Qd6. Seven chapters in the house shape with at least ten mistake entries in
every chapter from ch1 to ch6. All four checkers with the mistakes pass at 2500 ms and the
run conditions recorded. Version 1.8.0.

- [x] 34.1 Rulings and decision rules (done in the chip).
- [x] 34.2 Seven chapters to the section 3 bar, student Black.
- [x] 34.3 Suite green after every chapter.
- [x] 34.4 Four checkers, outputs under `docs/engine-runs/phase-34/`.
- [x] 34.5 The course's test block with two course-specific claims.
- [x] 34.6 Scoping test: three Black answers to 1.e4.
- [x] 34.7 Bundle exported and round-tripped.
- [x] 34.8 Prose counts say eight.
- [x] 34.9 Version 1.8.0.
- [x] 34.10 Proved in the browser build.

Acceptance: as the chip's final paragraph.

**For the gate.** Seven chapters, 155 student moves, 234 mistake entries on 144 positions
(ch0 8, ch1 27, ch2 21, ch3 20, ch4 28, ch5 28, ch6 12), deepest lines at move 12 in ch1 and
14 in ch6, every other chapter at 10. The suite is at 1047 tests with the course's own block
and the three-way scoping test; `tsc -b` clean. The one-grade rule held throughout, which
is why ch2, ch3 and ch6 carry no mistake entries on the positions they share with ch0 and
ch1.

**The queen square is 3...Qd6**, by the decision rule: less to memorise than a5, whose two
tricks (Bd2 unmasking the knight, Nd5 hitting the queen) are the whole reason to prefer the
square with none. Qa5 is rejected in one sentence in ch0 and nowhere else.

**The forks, one sentence each where they arise.** 2...Nf6 out: the Portuguese and
Icelandic gambits are sound and have a theory of their own (ch0, and a playable entry with
the fork rule beside it). 5...c6 over 5...a6 and 5...Bg4 in the main line: c6 gives the
queen c7 and is the shape every chapter shares (ch1). 3...Nf6 over 3...Bg4 against 3.Nf3:
the pin invites a theory Black does not need (ch3). Against the Blackmar-Diemer, decline
with 4...Bf5 rather than take on f3: the pawn is not worth the attack it buys (ch4). The
chip's "...Nb4 jump against Bd3" theme has no sound instance in this repertoire, because
the queen's knight goes to d7 and not c6, so exercise 3 is the queens-off jump from the
2.d3 line instead.

**The engine passes ran, and they ran clean at 2500 ms.** Load was 17-46% on 16 cores
throughout, with one java process from another project of Nick's holding about one core;
no build, no test run, one engine at a time. The first 500 ms pass found eight things, and
the three big ones were White moves I had authored that hung a piece: 13.Bf4?? in exercise
5 and 10.Bf4?? in the 6.h3 line both put a bishop on the queen's diagonal with nothing
behind it, and 5.Ne2?? in the 2.Bd3 line let ...e4 trap the bishop on f3. The "before"
numbers of -3.4 to -4.1 were the engine seeing the free piece. Five Black moves failed the
+0.4 bar at 2500 ms and were rewritten: 10...e6 in the 6.Ne5 line (+1.16; the line now
ends 10.Nxb6 Qxb6 at +0.19), the ...c5 break in exercise 4 (+0.74, a move early; the
exercise is now the knight to d5 at +0.13), the ...e5 break in exercise 5 (+1.3 whatever
White played; the exercise is now the ...c5 break a line later, at +0.22 with the best
move at +0.22), 6.Bc4 Bf5 (+0.73; now 6...Bg4 at +0.36, the same pin as against 6.Bd3, and
the old note's claim that the pin fails to Bxf7+ tricks was false), and 3.Be2 Nf6 (+0.45
with 3...Qxg2 at -1.15: the course was declining a free pawn, and now takes it, 4.Bf3
Qg6). Two 500 ms passes after the last content edit found seven and two moves over 0.5,
every one re-checked at 2500 ms and kept: Tennison 3...Nf6 -0.29 and 8...b6 +0.22, 2.Nc3
dxe4 +0.15, 4.g3 Nf6 +0.25, 2.e5 ... 6...Nge7 +0.30 (6...Bg4 -0.07 is the engine's choice;
the knight to g6 is the plan taught), 2.f3 dxe4 -0.34, and 2.c4 d4 3.d3 c5 -0.35 (3...e5
-0.91 is the engine's choice; c5 holds d4 and is the theory move). Every number is in
`docs/engine-runs/phase-34/engine-ask-2500.txt` with the verdicts at the end.

**The mistakes pass at 2500 ms moved 28 grades.** Eleven became mistakes, and eight of
those were real errors of mine rather than band drift: entries graded inaccuracy or
playable whose own note described losing the queen or a piece (Qd5 onto the knight, Nxc4
with the queen still on c7, Bg4 with nothing on f3 to pin so Qxg4 takes it, twice, Bf5
into a bishop on d3, Nd4 into Nxd4, ...Nc6 into Bxf7+ and Ne6 forking the queen, ...Be7
losing the bishop on g6 to h5 because its own pawn on h7 took the retreat). Thirteen
playable entries between 0.94 and 1.6 became inaccuracies with their "fine" and "sound"
reworded. Four were too harsh, and one of those was a false note: 6...Nxc3 in the
Blackmar-Diemer is sound, because the knight takes a knight before the bishop goes and
gets away a pawn up; the note said the opposite and is rewritten. The confirming run,
`engine-mistakes-2500-run2.txt`, reports three straddles at the -0.4 floor (too harsh by
0.04 to 0.07, none seen by the first run), kept under the gate 20 straddle ruling.

**note-lines and note-claims at zero** after every edit. The only human line is the
standing ch2 "tempo given back for nothing", which claims no material.

**Prose counts.** SPEC section 3's "Seven courses" was the one present-tense count; it is
eight, with the Scandinavian added to the list sentence. help-text.ts and docs/ had none.
SPEC section 8 carries the phase 34 ruling: the pairing of three Black answers, the queen
square, the forks, and the shared-position rule the course was the first to be written
under.

**Driven at 1200x980 against another session's server on 5175**, banner 1.7.3 (baked at
that server's start; the source is served from disk and the four version files read
1.8.0). Eight tiles in two rows of four, the Scandinavian's reading "The simple answer to
1.e4, as Black." with 34 lines. Study opened ch0 with its one line named, and ch1 named
all five. The main line marked learnt gave Drill seven cards and a Black-to-move
main-line position. Play as Black: the board Black's way up, the engine's 1.e4 played at
once from the book, "Your move". Play the other side: White to move, and after 1.e4 the
engine answered 1...d5 at once. No console errors; storage cleared afterwards. Nick's own
files were not listed and not reported.

Gate 34 findings (2026-09-05):

- **Verified for the gate from the repo:** 1047 tests in 9.2 seconds and `tsc -b` clean;
  version 1.8.0 in all three files; nothing under the other seven course folders; **344
  line ids before, 378 after, none gone, 34 added**, all under `scandinavian-black`; no em
  dashes; the bundle present and held by the round-trip test; the tree clean at the start.
- **Content counts by the orchestrator**: intros 294 to 500 words; every node noted and
  every leaf named; mistake entries 16, 50, 29, 32, 45, 39 and 23 across ch0 to ch6, so the
  tactics chapter meets the bar this time; zero grade conflicts under the one-grade rule.
- **The engine records are complete with their conditions**: five 500 ms passes across
  the drafting, every finding re-checked at 2500 ms, the mistakes pass at 2500 ms with a
  confirming run after 28 regrades, and both prose checkers at zero. Load was 17 to 46
  percent with one java process from another project holding a core, one engine at a time,
  no build and no test run, which is within the standard phase 31 set.
- **Three ruled lines spot-checked by the orchestrator at 2500 ms.** The main line after
  5...c6 stands at +0.62, which is above the chip's +0.4 bar in absolute terms but is the
  opening itself: at that position the engine's own first choice is +0.57 and 5...c6 is its
  second at +0.65, eight hundredths behind, so the move costs nothing against the best. The
  6.Ne5 tail ends at +0.27 as the builder recorded. 3.Be2 Qxg2 4.Bf3 Qg6 is 1.05 in Black's
  favour: the course was right to take the pawn.
- **Driven in the Vite build restarted to v1.8.0 at 1200x980**: eight tiles in two rows of
  four; the Scandinavian's tile with its tagline and 34 lines; Study with the seven chapter
  titles and ch0's named line; Play the other side with the engine answering 1.e4 with
  1...d5 and 2.exd5 with 2...Qxd5.
- **The queen square is 3...Qd6** by the decision rule, and the forks are each recorded
  with a sentence. The chip's "...Nb4 against Bd3" exercise theme had no sound instance in
  this repertoire and was replaced, which is the right reading of an exercise list.
- **Nick's own files were not listed and not reported.** The browser build's storage was
  cleared afterwards.

- [x] **Review gate 34 passed** (2026-09-05)

## Phase 35 - what the second pass found

Goal: land the four things the verdict-strength second pass of 2026-09-05 left open. Nick
ruled "fix it" on the one that changes a line id. Content only, version 1.8.1.

Chipped as `chips/phase-35-second-pass-fixes.md`. The Scandinavian's Nge2 line takes the
hanging pawn (one line id changes, accepted); the Caro-Kann lists 5...Qxd4 as a playable
alternative; two notes in the Najdorf and the Slav; the seventeen floor findings go into
`accepted.md`; the register entry for the second pass is closed.

- [x] 35.1 The Scandinavian's Nge2 line takes the pawn; the old move graded a mistake.
- [x] 35.2 The Caro-Kann lists the pawn grab as playable.
- [x] 35.3 Two notes, Najdorf and Slav.
- [x] 35.4 Seventeen floor findings into `accepted.md`.
- [x] 35.5 Checkers on what changed, outputs under `docs/engine-runs/phase-35/`.
- [x] 35.6 Four bundles regenerated.
- [x] 35.7 Register entry closed; ruling logged.
- [x] 35.8 Version 1.8.1.
- [x] 35.9 Suite green; exactly one line id changed.

Acceptance: as the chip's final paragraph.

Gate 35 findings (2026-09-05, orchestrator):

- The builder landed the four content changes, the accepted entries, the register closure
  and the ruling (commits a4b035a to 3273f83) but did not tick the boxes; ticked here after
  verification. Exactly one line id changed, the Scandinavian's Nge2 line, as ruled. Four
  bundles regenerated. The version bump to 1.8.1 was superseded by 36 and 37.
- **The mistakes pass the record promised was missing** and was run at the gate over the
  two courses whose entries changed (`docs/engine-runs/phase-35/engine-mistakes-2500-*.txt`).
  It disputed four grades; each was re-asked alone on a quiet machine
  (`gate-recheck-2500.md`). Two came down to inaccuracy on unanimous numbers (the new
  Scandinavian "castle instead of taking" entry, and the Panov's 4...dxc4); two stay
  mistakes under the straddle ruling (the Exchange's 3...Qxd5, the Panov's 10...b6).
- Nick found a wrong note by reading ch0 ("White pins the knight" with the queen on d6);
  fixed by the builder in the same phase.

- [x] **Review gate 35 passed** (2026-09-05)

## Phase 36 - the replay position survives leaving the screen

Goal: Nick, 2026-09-05, stepped a replay back to a reported inaccuracy, went to Study, and
came back to the final move. The replay ply lives in the screen, which unmounts; the game
lives in the provider, which does not. No chess content. After phase 35.

Chipped as `chips/phase-36-replay-survives.md`. The replay ply moves into `PlayProvider`,
cleared with the report; a DOM test shown red first; one Help clause. Version 1.8.2.

- [x] 36.1 The replay ply in the provider, cleared with the report.
- [x] 36.2 Arrows, clickable moves and slips, Play from here read it from there.
- [x] 36.3 DOM test red first.
- [x] 36.4 Help.
- [x] 36.5 Version 1.8.2.
- [x] 36.6 Proved in the browser build.

Acceptance: as the chip's final paragraph.

**For the gate.** `PlayGame` gains `replayPly: number | null` and `setReplayPly`, cleared
beside the report in all four places the report is set or cleared (`start`, `resume`,
`finish`, `reset`), which is every launch shape, Keep playing and New game. `Play.tsx`
reads and writes it through `usePlay()`; the phase 25 "which report" guard is now the
provider clearing the ply in the same update that changes the report, and the screen clamps
the ply to the moves it has. The arrows, the move list, the slips and Play from here all go
through the one `step` as before. The DOM test was written first and shown red on the old
code with exactly Nick's symptom (the list marked Nf6 where d5 was expected after a trip to
Study); green after, with a second case that a new review starts at the end. 1049 tests in
9.9 seconds, `tsc -b` clean.

Driven at 1200x980 against a fresh server at 1.8.2: a Caro-Kann game to 3.exd5, Stop and
review, back two plies to 2.d4, Study, Play: the list still marked 2.d4 and the board
showed the position before ...d5. New game cleared it. No console errors; storage cleared
afterwards. Nick's own files were not listed and not reported.

Gate 36 findings (2026-09-05, orchestrator):

- 1061 tests and `tsc -b` clean at the time of the gate. Driven: a reviewed game stepped
  back one move, Study, Play, and the board, the marked move and the slip's arrow were where
  they had been left.

- [x] **Review gate 36 passed** (2026-09-05)

## Phase 37 - the report says what was better

Goal: Nick, 2026-09-05, was told 4.Nf3 was an inaccuracy and nothing said what was better.
The scan already has the engine's best move for every position and throws it away. No
chess content. After phases 35 and 36.

Chipped as `chips/phase-37-better-move.md`. The scan keeps the best move; every slip
sentence ends "The engine preferred 4.Nc3."; clicking the slip draws that move as a blue
arrow beside the move played; the PGN comment says it too. Version 1.8.3.

- [x] 37.1 The scan and the live evaluation keep the best move per position.
- [x] 37.2 A slip carries its better move.
- [x] 37.3 The sentence, in move-list notation.
- [x] 37.4 The blue arrow on the clicked slip.
- [x] 37.5 The PGN comment.
- [x] 37.6 Tests.
- [x] 37.7 Help.
- [x] 37.8 Version 1.8.3.
- [x] 37.9 Proved in the browser build.

Acceptance: as the chip's final paragraph.

**For the gate.** `scanGame` now returns `{ evaluations, bestMoves }` from the one search
it already makes per position, taking `result.bestMove` and falling back to the first
candidate; the provider's live `evaluate` stores the same in a `bestMovesRef` beside the
evaluations, cleared where they are cleared, so a reviewed game and a replayed one carry
the same facts. `Evaluations` is untouched; `BestMoves` sits beside it. `MoveReview.better`
is the SAN converted with chess.js on the position the slip was played FROM, left out when
the engine's move is the move played or when nothing was kept, and `buildReport` takes the
map as a trailing optional argument. `describeSlip` appends "The engine preferred 4.Nc3."
in move-list notation (`numberedMove`, exported: "4.Nc3" for White, "4...Nc3" for Black);
the PGN comment appends "; the engine preferred 3.e3" in the same words. On the board,
`preferredShapes` draws the move as a blue arrow while the replay stands on the slip's
position, and on that position the last-move highlight is the slip itself rather than the
move that led there, so both are visible at once; the hint's own shapes are unchanged
outside a review. Tests: `scanForSlips` with a best-move map in both directions, absent
when unknown or when the engine agrees, the sentence in both colours, `buildReport` passing
it through, `scanGame` returning the fake engine's move, the PGN comment, and a string test
on the arrow shapes. 1059 tests in 10 seconds, `tsc -b` clean.

Driven at 1200x980 against a fresh server at 1.8.3: a London game with a deliberate 2.Kd2,
Stop and review, and Your moves read "A blunder on move 2: Kd2 turned "slightly better for
white" into "clearly better for black". The engine preferred 2.d5." Clicking it put the
position after 1...c5 on the board with the blue arrow d4 to d5 and e1-d2 highlighted.
Copy game said Copied and the text carried "the engine preferred 2.d5" in the comment on
2.Kd2 (read through a hook on the clipboard write, since the pane refuses clipboard
reads). No console errors; storage cleared afterwards. Nick's own files were not listed
and not reported.

Gate 37 findings (2026-09-05, orchestrator):

- Driven: 1...f6 in a Caro-Kann game reviewed as "An inaccuracy on move 1: f6 turned
  \"level\" into \"clearly better for white\". The engine preferred 1...e5." Clicking it put
  the position before the move on the board with the preferred move as a blue arrow beside
  the move played.
- Nick's own PGN at this gate exposed a bug outside the phase: a replayed checkmate reported
  "Stopped" and "Not scanned". Fixed at the gate as the orchestrator's commit (8507c8b):
  the session works its outcome out after replaying a record's moves, and a mated final
  position takes the outcome as its verdict. Two tests.

- [x] **Review gate 37 passed** (2026-09-05)

## Phase 38 - the report and the game list name the line

Goal: Nick, 2026-09-05, reading his own PGN: the report says where a game left the course
but never which line it was in. No chess content.

Chipped as `chips/phase-38-name-the-line.md`. One function decides the line a game
followed, built on the Lines played rule; the report's repertoire paragraph, a new Line
column on the Play on list and the PGN comment all say it, or name the chapter when the
game never reached a line. Version 1.8.4.

- [x] 38.1 `lineFollowed`, with tests, agreeing with Lines played.
- [x] 38.2 The report sentences, both colours and the other side.
- [x] 38.3 The Line column on the Play on list.
- [x] 38.4 The PGN comment.
- [x] 38.5 Help.
- [x] 38.6 Version 1.8.4.
- [x] 38.7 Proved in the browser build.

Acceptance: as the chip's final paragraph.

**For the gate.** `lineFollowed(course, sans)` in `stats.ts`: the named line is the one the
game agreed with for longest, counted from the first move, provided it agreed past that
line's `forkDepth`; ties go to course order. With no line, the chapter is the one whose
LINES the game agreed with for longest (not its stem alone: the London's Classical and
...c5 chapters share a stem, and the drive caught the report naming Classical for a game
that had played 2...c5), first in course order on a tie; a first move in no chapter gives
nothing. **One reading of the hazard to know about.** "Agrees with Lines played" holds as
the same rule: every line the table counts a game for is a candidate here, and a game the
table counts for nothing because it stopped in the trunk is named no line. But the table
counts only games that never contradicted a line, and this names a line a game left after
choosing it, because that is the sentence Nick was missing ("You were in X and left it on
move 3"). A test pins both halves. The report passes the whole game, so the Play on list,
which has only a record's moves, gets the same answer from the same call. `Deviation` gains
`lineName?` and `chapterTitle?`; `buildReport` takes `{ course, chapterTitle }` as a
trailing context, with the chosen chapter winning over the one the moves point at;
`StartOptions` carries the course. The sentences: "You were in X and left it on move 3 with
Nd5. The line plays Nc3.", "You were in the Y chapter and left it...", "The engine left X on
move N with ...", "You stayed in X for the whole game.", and on the other side "The course
played X to the end." and "The course's book ran out at move 4, in X."; a title that brings
its own article reads "in The ...c5 and ...Qb6 lines chapter" (the drive caught "the The").
The Play on list's Line column sits between Sparring against and Strength, the chapter in
`--text-faint`; a record without moves is not listed at all (`recentPlayable`), so the
blank case is the pure function's null. The PGN comment goes through `describeDeviation`
and so carries the line. Help: the Play repertoire sentence, the Progress Line column, and
Chapter and Line in Words we use tightened to say how a game is "in" a line. 1083 tests in
11 seconds, `tsc -b` clean.

Driven at 1200x980 against another session's server on 5175 (its watcher had missed the
edits and served stale modules until the files were touched; noted for the hazard list).
A London game sparring against King's Indian setups, 1.d4 Nf6 2.Bf4 g6 3.e3 d6 4.Nf3 Bg7
5.Be2 O-O 6.a4, reviewed: "You were in ...d6 before the bishop and left it on move 6 with
a4. The line plays h3." A game from the Study position 1.d4 d5 2.Bf4, 2...c5 3.Nc3: "You
were in The ...c5 and ...Qb6 lines chapter and left it on move 3 with Nc3. The line plays
e3.", and the same sentence in the copied PGN. Progress showed the Line column with "...d6
before the bishop" and the ...c5 chapter faint side by side. Two "Any line" games got
1...f5 and 1...c5 as replies, each a one-line chapter in the London, so both were named a
line at move 2 correctly rather than a chapter; the Study start was the way to the trunk.
No console errors in a fresh tab; storage cleared. Nick's own files were not listed and not
reported.

Gate 38 findings (2026-09-05, orchestrator):

- 1083 tests in about eleven seconds under the twenty-second rule; `tsc -b` clean; version
  1.8.4; nothing under `courses/` from this phase and 378 line ids unchanged.
- **Mutation checked**: removing the fork check from `lineFollowed` turns five tests red,
  including "agrees with Lines played about which line a game counts for".
- Driven against a server on the phase's source: a London game 1.d4 e6 2.e4 reviewed as
  "You were in The ...e6 move order and left it on move 2 with e4. The line plays Bf4.",
  and the Play on list's new Line column showing the same name.
- The builder's decision to name the chapter by the lines a game agreed with rather than
  by stem alone is right; the drive that caught "Classical" for a 2...c5 game is the reason.
- Nick's own files were not listed and not reported. The browser build's storage was
  cleared afterwards.

- [x] **Review gate 38 passed** (2026-09-05)

## Phase 39 - managing the games you have played

Goal: Nick, 2026-09-05: stop a game without a record, archive or delete saved games from
Progress, and an archive view to bring them back. No chess content.

Chipped as `chips/phase-39-game-history.md`. Stop and discard beside Stop and review; an
`archived` flag on the record with archive, unarchive and delete as pure functions; every
list and count respects the flag; Archive and a two-step Delete on each Play on row; an
archive view inside Progress with Unarchive and Delete; the game on Play protected. Version
1.8.5.

- [x] 39.1 Stop and discard.
- [x] 39.2 The flag and the three operations, with tests.
- [x] 39.3 Lists and counts respect the flag.
- [x] 39.4 Archive and two-step Delete on each row.
- [x] 39.5 The archive view.
- [x] 39.6 DOM tests red first; help test mutation-checked.
- [x] 39.7 Help and SPEC.
- [x] 39.8 Version 1.8.5.
- [x] 39.9 Proved in the browser build.

Acceptance: as the chip's final paragraph.

**For the gate.** Six DOM tests in `game-history.dom.test.tsx`, four written first and
shown red on 1.8.4 (Stop and discard, the archive round trip, the two-click delete, the
timeout), two added with the code (the disabled controls on the game on Play, and a click
elsewhere disarming Delete). `discard` on the provider is `reset` under a name that says
what the screen means, because New game already did exactly this to a running game; the
button sits second beside Stop and review in `PlayActions`, secondary style, no
confirmation. `archived?: boolean` on the record; `archiveGame`, `unarchiveGame` (drops
the flag rather than writing false) and `deleteGame` in `progress.ts` with tests including
the flag read back from a file and an archived game counting against the cap; exposed as
`archivePlay`/`unarchivePlay`/`deletePlay` through the same `setState` path as
`recordPlay`, so the same save. `recentPlayable`, `playStats`, `linesPlayed` and
`anyGameRecorded` all skip archived records, each with a test; `archivedGames` lists them
newest first, moves or no moves. `DeleteButton` is a small component used in both tables:
armed for `DELETE_WINDOW_MS` (5000), disarmed by the timer or a document click outside
itself, the armed label "Delete for good?" in the bad-verdict colour. The archive view is
the same table with Unarchive and Delete and no Play on or Replay, "Nothing is archived
now." when it empties under the reader, Back to your games below; the "N archived games"
line is a link-styled button shown only when there is something to show. The game on
Play (`game.session` and `game.recordedAt === record.at`) has Archive and Delete disabled
with "Finish or replace this game on Play first." The help test renders `PlayOn` with
`initialView: 'archive'` beside Progress, on a seeded archived record, and was
mutation-checked on Stop and discard, Unarchive and Back to your games, each red. One
thing the drive found: with the Line column and four buttons the games table is 1286 px
wide at 1200, so both tables now scroll inside their own box rather than the page. 1102
tests in 10.5 seconds, `tsc -b` clean.

Driven at 1200x980 against another session's server on 5175 (files touched so its watcher
saw them; HMR of the context modules then logged provider errors that a full reload
cleared, none on the new code). A London game, 1.d4, Stop and discard: the start screen,
zero games in the store. Two games reviewed; on Progress the game still on Play had
Archive and Delete disabled with the title and the other row was free. Archive: the count
fell to 1, one row, "1 archived game"; the archive view showed the row with Unarchive and
Delete and Back to your games; Unarchive and Back: 2 games, 2 rows, no line. Delete: the
first click read "Delete for good?" in red, the second removed the row and the record
(one earlier attempt was disarmed because the pane clicked a stale coordinate beside the
widened button, which is the "anything else puts it back" rule doing its job). Storage
cleared afterwards. Nick's own files were not listed and not reported.

Gate 39 findings (2026-09-05):

- **Verified for the gate from the repo:** 1102 tests in under eleven seconds and `tsc -b`
  clean; version 1.8.5; nothing under `courses/`; the tree clean at the start.
- **Two mutations checked by hand.** Making Delete act on its first click turns three of the
  six history tests red (the two-click, the timeout and the click-elsewhere). Counting
  archived games in the Games played stats turns the archive round-trip test red.
- **Driven against a server on the phase's source at 1200x980.** Stop and discard on a game
  at move 2: the start screen returned and the store held no game. A reviewed game on
  Progress: Archive took it out of the list and the count ("No games yet"), the "1 archived
  game" line appeared and opened the archive view with Unarchive and Delete; the record
  carried `archived: true`. Delete pressed twice within the window removed a seeded record
  and its row. One earlier Delete attempt disarmed itself because the two clicks were more
  than five seconds apart across tool calls, which is the timeout doing its job.
- **The builder's addition stands**: with the Line column and four buttons the games table
  is wider than the panel, so both tables scroll inside their own box rather than the page.
- **Nick's own files were not listed and not reported.** The browser build's storage was
  cleared afterwards.

- [x] **Review gate 39 passed** (2026-09-05)

## Phase 40 - a wider window, a lighter games table, and a Study board that stays put

Goal: Nick's six findings after installing 1.8.5 (2026-09-05). No chess content.

Chipped as `chips/phase-40-wider-and-lighter.md`. A reviewed game's Archive and Delete
are live on Progress (only a game still being played is guarded); the window opens at
1400 by 980 with five tiles to a row; the games tables use the width, in the Progress
lead's muted voice with thin buttons; Study's place is kept per course in a small
provider across screen changes. Version 1.8.6.

- [x] 40.1 Archive and Delete live after a review; Play resets when its record goes.
- [x] 40.2 Window 1400 by 980; five tiles; the games table given room.
- [x] 40.3 The games table lighter and tighter, measured, both themes.
- [x] 40.4 Study's place kept per course; DOM test red first.
- [x] 40.5 Version 1.8.6.
- [x] 40.6 Proved at 1400x980 in both themes.

Acceptance: as the chip's final paragraph.

**For the gate.** 40.1: the guard is `game.inProgress && game.recordedAt === record.at`
(a session with no report), so a reviewed game's row is free; Archive and Delete on the
record whose game is on the Play screen call `game.reset()` first. The DOM test was
written first and red on 1.8.5 (Archive disabled after a Replay); phase 39's test that
had pinned the wider rule now pins the narrower one on a Play on game, started. The
disabled styling is unchanged: it is the app-wide `button:disabled` at opacity 0.5, which
read clearly enough in dark mode on the drive. 40.2: the window opens at 1400 by 980, min
size unchanged; `.catalog` capped at 1360 with the same 250 px tiles, measured at 1400 as
five and three with tiles 261 px wide in a 1352 px catalog. `.play-on-scroll` is
`width: 100%`; at 1400 the games table is 1162 px in a 1337 px box, so all nine columns
fit without the sideways scroll. 40.3: cells in `--text-dim` at 0.9 rem with 3 px vertical
padding, the row buttons at `2px 8px` and 0.85 rem; the row was 50 px and is 32 px,
measured by swapping the old rules back in over the live table. 40.4: `StudyProvider`
(`study-context.tsx`) holds `{ chapterId, chain, chosen }` per course id, in memory, with
`place` and `update`; `Study` reads the chapter from it and `ChapterStudy` reads the chain
and the chosen row, with `setChain`/`setChosen` shaped like the state setters they
replaced (and now in the callbacks' dependency lists, which the second click of the test
caught). The auto-step flag stays on the screen on purpose: its timer must not run unseen,
so it stops when the screen unmounts and does not restart on return, which meets the
chip's rule without lifting it. The DOM test was written first and red on 1.8.5 (an empty
trail after a trip to Play); a second pins the chapter. Help has the clause. 1106 tests
in 10.7 seconds, `tsc -b` clean, nothing under `courses/`.

Driven at 1400x980 against another session's server on 5175 (files touched for its
watcher). Courses: five and three. Two London games reviewed; on Progress both rows had
Archive and Delete live, including the game still showing its report on Play; the rows
in the muted voice with thin buttons in dark and in light (photographed both); Archive on
that game took the row out and Play showed its start options. Study, Classical Black, two
arrow steps to 2...e6 3.e3, Play, Study: the same chapter, trail and position. No console
errors; storage cleared afterwards. Nick's own files were not listed and not reported.

Gate 40 findings (2026-09-06, orchestrator, unattended run):

- 1195 tests in twelve seconds under the twenty-second rule and `tsc -b` clean at the end of
  the three phases. Two mutations checked: locking a reviewed game's row again turns "can be
  archived from Progress, and Play goes back to its options" red; making the Study provider
  forget its place turns both Study-place tests red.
- Driven against a server on the phases' source: Study stepped to 1.e4 c5 in the Alapin,
  Play, back to Study, the trail unchanged. A reviewed game's row on Progress had Play on,
  Replay, Archive and Delete all live. The games cells measured `--text-dim` at 14.4px, the
  rows 32px tall with 26px buttons.
- The pane caps its viewport at 1280 wide, so five tiles were not seen here: at 1280 the
  grid gave four. The arithmetic holds for the window Nick opens (1400 less the shell's 48
  is 1352, and five 250px tiles with four 12px gaps need 1298), and the builder measured it
  at 1400. Nick sees it on install.

- [x] **Review gate 40 passed** (2026-09-06)

## Phase 41 - the Alapin Sicilian, a ninth course

Goal: Nick commissioned the Alapin on 2026-09-05: the structural answer to 1...c5, which
his White repertoire had nothing against. After phase 40.

Chipped as `chips/phase-41-alapin.md`. Id `alapin-sicilian`, permanent; 2.c3 over the
Grand Prix by temperament; two main-line chapters (the e5 wedge, the isolated pawn), the
other second moves, the closed centre, everything else, tactics with ten mistake entries.
The checkers include a 2500 ms engine-pass over the whole course. Version 1.9.0.

- [x] 41.1 Rulings and decision rules (done in the chip).
- [x] 41.2 Seven chapters to the section 3 bar, student White.
- [x] 41.3 Suite green after every chapter.
- [x] 41.4 Checkers with conditions, including the 2500 ms pass over the course.
- [x] 41.5 The course's test block with two course-specific claims.
- [x] 41.6 Scoping test: the three 1.e4 courses.
- [x] 41.7 Bundle exported and round-tripped.
- [x] 41.8 Prose counts say nine.
- [x] 41.9 Version 1.9.0.
- [x] 41.10 Proved in the browser build at 1400x980.

Acceptance: as the chip's final paragraph.

**For the gate.** 41.1 and 41.2: the course is `courses/alapin-sicilian/`, id
`alapin-sicilian`, permanent, seven chapters and 43 lines, student White, with 2.c3
chosen over the Grand Prix in ch0's second paragraph and the alternative named once.
Every fork, with its sentence in the note where it arises: the knight to f3 before the
pawn takes back on d4, so the pawn lands defended (ch1's intro, on 5.Nf3); the pawn recapture
on d4 wherever the pawn can make it, because the knight recapture is the open Sicilian the
course exists to avoid (ch1 6.cxd4, ch2 7.cxd4, ch3 and ch5 throughout); 6.Be3 before Bd3
in the isolated-pawn line, so that ...cxd4 and ...Nc6 never hit an unheld pawn (ch2 root);
Nxd7 rather than Bxc6 where both take, keeping the bishop pair (ch0 and ch4's 4...d6
line); and against 2...e6 the trade on d5 rather than the
French Advance, which is a different course (ch3). Mistake positions: ch0 11, ch1 28,
ch2 33, ch3 43, ch4 22, ch5 32, ch6 11; deepest White move 15 in ch1 and ch6, 12 in ch2,
11 in ch4, 10 in ch3 and ch5 (the chip's 6-8 for sidelines, 10-12 for mains, met). The
shared-position rule bit once: ch4's queen-on-d5 line reached ch2's 5...e6 6.Bd3 position
with a different move, and was reordered to 5...Nc6 6.Bd3 Nf6 so the two chapters agree.

41.4, the checkers, all under `docs/engine-runs/phase-41/`. Conditions for every 2500 ms
run: CPU load sampled at 2 to 27 per cent before the run, no build, no test run beside it,
one engine process, every run in the phase sequential. One three-second content-suite run
overlapped the FIRST 500 ms sampler pass only, which later passes superseded. Engine-pass
at 500 ms ran six times in all: two before any engine-led fix (12 findings, 10 rewritten,
2 kept), two after (one more, 8...Bd7 9.Bxc6 at -0.27, rewritten to 9.exd6), and the two
the chip asks for after the last content edit, which report only the kept moves. The
2500 ms engine-pass over the whole course, once, reports three, all KEPT: 6.O-O against
2...e5 at +0.19 of 6.Ng5's +1.64, under the fork rule because Ng5 d5 is a forcing line,
with Ng5 named playable beside it; 6.cxd4 against 2...f5 at +1.19 of 6.Nf3's +1.83, the
course's own recapture rule with White clearly better, Nf3 named playable; and 8.Be3 in
ch4's queen-on-d5 line at -0.16 of +0.41, inside the -0.3 bar and the chapter's rule of
holding d4 before ...cxd4, recorded for the next pass. Two of the ten rewrites were real
White blunders the sampler caught: 8.O-O with a bishop on g4 taking the queen (ch3, 2...d6)
and 5.O-O hanging e4 (ch5, 2...Qa5). The mistakes pass at 2500 ms found 23, every one
acted on: eight to mistake with the punishment asked at 2500 ms and written into the note
(engine-ask-2500.txt, section 3), fourteen playable entries between 0.92 and 1.44 to
inaccuracy with their notes saying the cost, one too harsh (6.Nf3 against 2...f5 is the
engine's choice, playable now). The confirming run found two more in the ...Qb6 hunt just
over an edge (Qd2 0.99, Nd2 2.06), regraded by the number; grades only, so no third run.
Note-lines: zero findings. Note-claims: zero unsupported. `accepted.md` is untouched:
the three kept moves are recorded in the phase folder for the next pass to compare.

41.5 to 41.9: the course block in `content.test.ts` holds c3 by move two on every line's
`path[2]` and no White Nc3 before cxd4; the scoping test holds the Ruy, the Vienna and
the Alapin to 1.e4 and only the Alapin to 1...c5. The bundle round-trips byte for byte,
the other eight bundles are byte-identical to their committed files, and the other eight
courses' 378 line ids are intact (421 now, none gone). SPEC section 3 and section 8 say
nine and carry the phase 41 ruling paragraph. Version 1.9.0 in the four files. 1150
tests, `tsc -b` clean.

41.10, driven at 1400x980 against another session's server on 5175 (files touched for its
watcher): nine tiles as five and four, the Alapin's reading "The pawn centre against the
Sicilian, as White." with 43 lines; Study opened ch0 naming "The shape: the wedge, the
pin and d4" and ch1 naming all eight; the main line marked learnt; Drill gave "10 to go",
White to move, "2...Nf6: the e5 wedge"; Play as White answered 1.e4 with 1...c5 from the
book; Play the other side had the engine open 1.e4 and answer 1...c5 with 2.c3. No
console errors on a fresh load (the provider errors in the log were the touched context
module's HMR invalidations, gone on reload); storage cleared afterwards; viewport reset.
Nick's own files were not listed and not reported.

Gate 41 findings (2026-09-06, orchestrator, unattended run):

- The Alapin: 43 lines, intros 265 to 497 words, every node noted and every leaf named,
  mistake entries 21, 53, 57, 70, 45, 54 and 31 across ch0 to ch6. The other eight courses
  untouched, 378 line ids intact. Bundle present.
- Engine records complete with conditions (load 2 to 27 per cent, one engine): six 500 ms
  passes across the drafting, a 2500 ms pass over the whole course reporting three kept
  numbers, the mistakes pass at 2500 ms with 23 regrades and a confirming run that found
  two band-edge straddles, both regraded stricter. Spot-checked by the orchestrator: the
  2...Nf6 main line after 5...Nc6 is +0.12 either way at 2500 ms.
- Driven: from the other side the engine answered 1.e4 c5 with 2.c3.

- [x] **Review gate 41 passed** (2026-09-06)

## Phase 42 - the King's Indian Defence, a tenth course

Goal: Nick commissioned the King's Indian on 2026-09-05: the counterpunching partner to the
Slav against 1.d4, and the one setup that also answers 1.c4 and 1.Nf3. After phase 41.

Chipped as `chips/phase-42-kings-indian.md`. Id `kings-indian-black`, permanent; the
Classical's seventh move by the fork rule pointing at 7...Na6; the Sämisch, the Fianchetto
with the flank move orders, the Four Pawns and Averbakh, White without c4 and e4 read
against the London's own chapter, tactics with ten mistake entries. Version 1.10.0.

- [x] 42.1 Rulings and decision rules (done in the chip).
- [x] 42.2 Seven chapters to the section 3 bar, student Black.
- [x] 42.3 Suite green after every chapter.
- [x] 42.4 Checkers with conditions, including the 2500 ms pass over the course.
- [x] 42.5 The course's test block with two course-specific claims.
- [x] 42.6 Scoping test: the two 1.d4 Black courses and the flank openings.
- [x] 42.7 Bundle exported and round-tripped.
- [x] 42.8 Prose counts say ten.
- [x] 42.9 Version 1.10.0.
- [x] 42.10 Proved in the browser build at 1400x980.

Acceptance: as the chip's final paragraph.

**For the gate.** 42.1 and 42.2: the course is `courses/kings-indian-black/`, id
`kings-indian-black`, permanent, seven chapters and 102 lines, student Black. **The
seventh move in the Classical is 7...Na6.** The decision rule was to take it unless the
engine at 2500 ms and the chapter both came out better for 7...Nbd7 or 7...exd4: the
engine at 2500 ms gave 7...exd4 +0.52, 7...Na6 +0.61 and neither 7...Nc6 nor 7...Nbd7 in
its top five (below +0.66), and the chapter is built on the knight reaching c5 without
blocking the bishop on c8 or the c-pawn, so the knight goes to a6; 7...Nc6 is rejected in
one sentence in ch1's intro and named playable where it arises, which the suite holds.
**Every other fork, each in a sentence where it arises:** 6...c5 against the Saemisch
rather than 6...e5 (ch2 root, because the closed centre is what the pawn storm wants);
...exd4 against the Fianchetto rather than 8...c6 (ch3, because the open centre asks
less); 6...Na6 against the Averbakh rather than 6...c5 (ch4, keeping the lever); ...Nh5
and ...Nf4 in the h3 lines only where the knight on f3 blocks the bishop (ch4, said in
the intro and in the entries); 2...g6 against the Trompowsky rather than 2...Ne4 (ch5,
keeping the four moves); and against the London's c3 the lever waits for ...b6 and ...Bb7
(ch5, because the trade on e5 and a knight there is a pawn). Mistake positions: ch0 12,
ch1 68, ch2 35, ch3 94, ch4 85, ch5 87, ch6 28; deepest Black move 13 in ch1, ch3 and ch5,
12 in ch2 and ch4, 17 in ch6. Chapter 3 starts from the initial position on
purpose, so that 1.d4, 1.c4 and 1.Nf3 are three roots of one tree and the flank move
orders reach the main house by transposition; the shared-position rule was checked
across the whole course by a scratch checker before every suite run, and it bit twice
(ch4's two h3 orders reaching one position with different knight moves, ch5's 2.Nf3 3.c4
order reaching ch3's position with ...d6 where ch3 castles), both fixed by making the
moves agree.

**The London gaps.** Chapter 5's London lines were written against
`courses/london-white/ch3-kings-indian.json` and every Black move they play in a
position that course reaches is a move that course lists, with one exception, found by
a scratch script that walks both trees: after the London's 10.Bh2, its leaf, this course
plays 10...Ne4 (the engine's first choice at 2500 ms, -0.06), and the London's plan for
that leaf ("Nc3, Qc2 and the rooks to d1 and e1... a slow squeeze") does not expect it.
Two more things the London may want to know, recorded and not fixed: the engine at 2500
ms prefers 10.Nxe5 (+0.52) to the London's 10.Bh2 (+0.27) in that position, and this
course answers it with 10...Nh5 and a knight to d3 that wins the pawn back; and after
8.c3 instead of the London's 8.c4, 8...e5 loses a pawn to 9.dxe5 dxe5 10.Nxe5, which is
why this course holds the lever back there.

42.4, the checkers, all under `docs/engine-runs/phase-42/`. Conditions for every 2500 ms
run: CPU load sampled at 18 to 21 per cent before it, no build, no test run beside it,
one engine process, every run sequential; four hung python shells from this session's
own scratch work were found spinning at 40 per cent before the first pass and were ended
before it began. Engine-pass at 500 ms twice: the first found six (one real blunder,
13...Qxd3?? into 14.Qxd3 in the London's 10.Nxe5 line, and five moves the engine put half
a pawn or more behind), all six rewritten after re-checks at 2500 ms, and the seventh
exercise moved to the Petrosian because its line stood on a move nine tenths behind; the
second found one, 11...f4 in the ...f5 storm at +0.36, re-checked at 2500 ms as +0.05
against 11...Nac5 at -0.06, a cost of eleven hundredths on the theory move: KEPT, the only
engine finding kept in the phase. The 2500 ms engine-pass over the whole course, once,
reported nothing: no Black move costs half a pawn. The mistakes pass at 2500 ms found 61,
every one acted on: 29 up to mistake with the punishment asked at 2500 ms and written
into the note (the recurring pattern is the bishop on g5 looking at d8 through the square
a knight has just left, and a knight on d5 reaching c7 before it was taken), 17 playable
entries between 0.92 and 1.74 to inaccuracy, and 15 mistakes down, nine of them the knight
to h5 in the Bd3 lines where the note had claimed Nxe5 and Qxh5 won a knight and the
bishop on g7 in fact takes back on e5. The confirming run found four at band edges, two
of them straddlers of the 1.8 ceiling in exercise 2, all regraded by the number; grades
only, so no third run. Note-lines: zero faults, four soft
back-references for a human, all naming an earlier move order on purpose. Note-claims:
zero unsupported. `accepted.md` is untouched: every kept number is in the phase folder
for the next pass to compare.

42.5 to 42.9: the course block holds the bishop on g7 among Black's first four moves in
every repertoire line and Na6 at the Classical position wherever it is reached, with
7...Nc6 never played; the scoping tests hold the Slav and the King's Indian to 1.d4 with
different replies and the King's Indian to be the only course with a card after 1.c4 or
1.Nf3. The bundle round-trips byte for byte, the other nine bundles are byte-identical to
their committed files, and the other nine courses' 421 line ids are intact (523 now, none
gone). SPEC section 3 says ten and section 8 carries the phase 42 rulings. Version
1.10.0 in the four files; `version.test.ts` accepts a two-digit minor as it stands. 1195
tests in 11.5 seconds, `tsc -b` clean.

42.10, driven at 1400x980 against another session's server on 5175 (files touched for its
watcher): ten tiles as two rows of five, measured by the tiles' tops, the King's Indian's
reading "Concede the centre, then hit it: one setup against 1.d4, 1.c4 and 1.Nf3, as
Black." with 102 lines; Study opened ch0 naming "The shape: the Classical to move 12"
and ch1 naming all 22 lines; the main line marked learnt; Drill gave six cards, Black to
move, "The King's Indian Defence: The Classical"; Play as Black had the engine open 1.d4
out of the book; Play the other side had the engine answer 1.d4 with 1...Nf6 and 2.c4 with
2...g6. No console errors on a fresh load; storage cleared afterwards; viewport reset.
Screenshots timed out whenever an engine pass was running in the background, so the
catalog was measured through the DOM and photographed after the passes. Nick's own files
were not listed and not reported.

Gate 42 findings (2026-09-06, orchestrator, unattended run):

- The King's Indian: 102 lines, intros 433 to 489 words, every node noted and every leaf
  named, mistake entries 31, 138, 85, 161, 178, 177 and 70 across ch0 to ch6. The largest
  course in the app. 7...Na6 in the Classical by the decision rule, with the engine's
  numbers recorded (7...exd4 +0.52, 7...Na6 +0.61, 7...Nc6 below the top five).
- Engine records complete with conditions (load 18 to 21 per cent, one engine, four hung
  shells ended before the first pass): the 2500 ms pass over the whole course reported
  nothing; the mistakes pass moved 61 grades, the confirming run four band-edge straddles.
  Spot-checked by the orchestrator: the Classical after 7...Na6 is +0.61 at 2500 ms, the
  opening's own number.
- **The London gaps the chip asked for are recorded, not fixed**: after the London's 10.Bh2
  this course plays 10...Ne4, which the London's plan does not expect; the engine prefers
  10.Nxe5 to 10.Bh2 there; and 8...e5 after 8.c3 loses a pawn. Worth a London follow-up
  when Nick wants one.
- Version 1.10.0 in all three files and the version test accepts the two-digit minor.
- Nick's own files were not listed and not reported. The browser build's storage was
  cleared afterwards.

- [x] **Review gate 42 passed** (2026-09-06)

## Phase 43 - the courses agree with each other

Goal: Nick, 2026-09-06: the King's Indian found three places where his London and his King's
Indian meet and disagree, and he ruled that the courses must be consistent. Content plus one
test.

Chipped as `chips/phase-43-courses-agree.md`. A test holds every White course against every
Black course at their shared positions: each course's repertoire move must be a listed reply
in the other. The London's King's Indian chapter takes the King's Indian's answers (10...Ne4
added and answered; 10.Bh2 kept under the floor rule and recorded; the 8.c3 note says what it
threatens); every other mismatch fixed by listing or extending, never by moving a repertoire
move, with a stop rule at about twenty. Version 1.10.1.

- [x] 43.1 The cross-course test, run first, mismatches recorded.
- [x] 43.2 The London's ch3 against the King's Indian.
- [x] 43.3 Every other mismatch, or deferred with counts.
- [x] 43.4 Checkers on what changed, with conditions.
- [x] 43.5 Bundles regenerated.
- [x] 43.6 SPEC sections 3 and 8.
- [x] 43.7 Version 1.10.1.
- [x] 43.8 Suite green; line ids as the commits name.

Acceptance: as the chip's final paragraph.

**For the gate.** 43.1: the test is `has every White course and every Black course
agreeing at their shared positions` in `content.test.ts`, one `it` over every White
course against every Black course, walking stems and trees by position key and reporting
every mismatch in one failure with course, chapter, line and the listed replies. Three
scopings, each argued in the test's comment and in SPEC section 8: a stem counts; a
position counts only once both courses have made a move of their own on the way to it
(the first draft, without this, listed 29 mismatches, 22 of them courses "disagreeing"
about which opening to play, which no course can list without becoming another course);
and a leaf is not silence, because a rule that read the deeper course's next move as a
fault could never be satisfied. **Run first, the test listed seven**, and that list was
the phase's scope: the Colle's `Be2` against the King's Indian's fianchetto line (which
assumed Bd3); the Colle's `b3` and the London's `Bf4` in the Caro-Kann Exchange
structure, which both system courses reach by 1.d4 c5 2.e3 cxd4 3.exd4 d5; and four in
the Slav's chapter 5, its `...c5` after 2.Bf4 Nf6 3.e3, its `...Nc6` after 4.Nf3 in the
...Nf6 first order and its `...c4` after 6.Qb3 against the London, and its `...c5` after
2.Nf3 Nf6 3.e3 against the Colle. The three phase 42 gaps at the London's 10.Bh2 leaf are
not in the test's list, by the leaf scoping, and were closed by ruling under 43.2.

43.2: the London's ch3 lists `10...Ne4` (weight 6) and answers `11.Qc2` (+0.21 at 2500 ms,
against -0.13 for Nfd2 and -0.23 for Nbd2), with the leaf's plan and name moved to it. The
line id changed from `london-white/ch3-kings-indian:d4 Nf6 Bf4 g6 e3 Bg7 Nf3 O-O Be2 d6
h3 Nbd7 O-O Re8 c4 e5 dxe5 dxe5 Bh2` to the same with ` Ne4 Qc2` appended. `10.Bh2` stays
under the floor rule and is in `accepted.md` with both numbers (+0.27 kept of +0.52) and the
reason the engine's Nxe5 is not a free pawn. The `8.c3` entry keeps its grade and says the
one thing c3 threatens.

43.3, all seven fixed, none deferred, every one by listing the other course's move with
an engine-checked answer and never by moving a repertoire move. **The Colle and the King's
Indian**: the King's Indian lists `4.Be2` and follows the Colle's own line to 8.c4, then
`8...Qe7` (+0.20, the engine's first). **The two systems and the Caro-Kann**: the Caro-Kann
lists `4.Bf4` and answers `4...Nf6` (+0.30, the move the London lists; the engine's ...Nc6
is +0.23) with `5.Nf3 Nc6` (+0.32); it lists `7.b3` and answers `7...Bd6` (+0.14, the
chapter's square; the engine's ...b6 is +0.09); the Colle lists `7...Bd6` in turn and
answers `8.Bb2` (-0.17 against -0.05 for Nc3, the system's move). **The systems and the
Slav**: the London lists `3...c5` after 2...Nf6 3.e3 and answers `4.Nf3` into its chapter
2 position; lists `4...Nc6` in the ...Nf6 first order and answers `5.c3`, the same
position as its ...Nc6 first line; lists `6...c4` and answers `7.Qxb6` (-0.32, the
engine's first; Qd1 and Bxc4 both about -2.5). The Colle lists `3...c5` and answers
`4.Bd3` (-0.29 against the engine's 4.c4 +0.18: kept as the system's move at the edge of
the floor, recorded here for the next pass) with `4...Nc6 5.O-O` (-0.24, the engine's
first; b3 at once is -0.46 to ...cxd4). The Slav lists `4.Bd3` and answers `4...Nc6`
(-0.29, its first). Nine new line ids, each named in its commit; 532 line ids now, one
changed and nine added, none gone. Every note added obeys the direction and check-mark
rules, and the suite's one-grade rule held throughout.

43.4, under `docs/engine-runs/phase-43/` with conditions (load 18 to 21 per cent, no
build, one engine, sequential): `engine-ask-2500.txt` with every number above;
`engine-mistakes-2500-<course>.txt` for the five courses touched, nothing on any entry the phase added, and four of the King's Indian's own
entries at band edges regraded by the number (their commit says which); `note-lines`
and `note-claims` for each, zero faults and zero unsupported claims. 43.5: five bundles
regenerated; the other five are byte-identical. 43.6 and 43.7 as their commits say.
43.8: 1196 tests in 12.5 seconds, `tsc -b` clean.

Deferred, deliberately: nothing from the list. Two things noticed and left, for the
orchestrator: the Slav's chapter 5 has ten lines ending on a White move, which the
loader allows for the older courses and which the newer courses' rule (a leaf on the
student's move) would refuse; and the Najdorf's anti-Sicilian line ends at 9...Bd7 where
the Alapin plays on with 10.Nxd7, which the leaf scoping keeps out of the test on purpose
and which a reader of both courses will still notice. Nick's own files were not listed
and not reported.

Gate 43 findings (2026-09-06, orchestrator):

- 1196 tests in twelve seconds and `tsc -b` clean; version 1.10.1; the tree clean at the
  start. Line ids: 523 before, 532 after, one gone and ten added, the one gone being the
  London's 10.Bh2 leaf now extended with `Ne4 Qc2`, exactly as the commit names.
- **The new rule was shown red by the orchestrator** against the pre-fix content: with the
  courses checked out from the commit that added the test, "has every White course and
  every Black course agreeing at their shared positions" fails; on main it passes.
- **The three scopings the builder chose are right**: a stem counts; a position counts only
  once both courses have made a move of their own to reach it, or the rule would demand
  that courses agree about which opening to play; and a leaf is not silence. The first
  draft without them listed 29, of which 22 were courses "disagreeing" about the opening.
- Seven mismatches found, seven fixed, none deferred, every one by listing the other
  course's move with an engine-checked answer. Spot-checked by the orchestrator at 2500 ms:
  the London's new 11.Qc2 after 10...Ne4 is the engine's first choice (-0.01 against -0.25
  and -0.31 for the knight retreats).
- Engine records complete with conditions for the five courses touched; `accepted.md`
  gains the London's 10.Bh2 with both numbers; SPEC section 3 has the rule and section 8
  the ruling.
- **Two things the builder noticed and left, recorded here for a later phase**: the Slav's
  chapter 5 has ten lines ending on a White move, which the loader still allows for older
  courses; and the Najdorf's anti-Sicilian line stops at 9...Bd7 where the Alapin plays on
  with 10.Nxd7, which the leaf scoping keeps out of the test on purpose.
- Nick's own files were not listed and not reported.

- [x] **Review gate 43 passed** (2026-09-06)

## Phase 44 - the drill board shows the answer, and the gap has a unit

Goal: Nick, 2026-09-06, three things about Drill: a right answer leaves the piece where it
went; a wrong answer shows the correct piece moved as well as the red arrow; the gap after a
right answer has a remembered unit, minutes, hours or days, hours the default. A fourth,
ruled the same day: every Play and Drill setting is remembered between sessions, which
reverses the one-sitting rulings of phases 23 and 33. No chess content.

Chipped as `chips/phase-44-drill-feel.md`. The board shows the position after the repertoire
move once a verdict exists; a "Come back in" unit scales the due date FSRS computes and
nothing else, with the practice caveat in the Help. Version 1.10.2.

- [x] 44.1 The board after an answer shows the repertoire move played.
- [x] 44.2 The unit in the scheduler, the clock only.
- [x] 44.3 The "Come back in" control, remembered.
- [x] 44.4 DOM tests red first; help test mutation-checked.
- [x] 44.5 Help and SPEC.
- [x] 44.6 Every Play and Drill setting remembered between sessions (chapter per course).
- [x] 44.7 Version 1.10.2.
- [x] 44.8 Proved in the browser build.

Acceptance: as the chip's final paragraph.

**For the gate.** 44.1: `shownAfter(card)` in `grade.ts` plays the card's own move and
returns the position; the board takes it whenever a verdict exists, right or wrong, with
`lastMove` the repertoire move and `answerShapes` unchanged in what it draws. A card whose
move the board would refuse cannot exist, because the loader plays every move in every
course, so the fallback is the card's own position rather than an error nobody could act
on. 44.2: `review(schedule, rating, now, gap)` computes exactly as before and then, for
minutes and hours, rewrites the due date alone: FSRS's own gap read as days and spent in
the chosen unit, so three days becomes three hours or three minutes. Every other field is
byte for byte what FSRS returned, which one of the scheduler tests asserts by comparing
whole schedules with only the due date swapped. The gap is taken from the due date rather
than from `scheduled_days`, so a learning step of ten minutes scales like everything else
instead of collapsing; a floor of one minute stops any gap reaching zero. `scheduled_days`
keeps FSRS's number, so a card answered again an hour later looks early to FSRS, which is
what it is, and that caveat is in the Help and in the module's docblock.

44.3 and 44.5: the "Come back in" fieldset sits under the two Drill boxes with Minutes,
Hours and Days, hours by default, and one sentence saying which is which. `HELP_CONTROLS`
gained the four names, the Drill help gained the two board behaviours and the unit with its
caveat, SPEC section 2 gained the unit and the board, and section 8 carries the three
rulings with the date and Nick's reasons.

44.4: four DOM tests in `drill-feel.dom.test.tsx` and four in `remembered-settings.dom.test.tsx`,
all written and watched fail first. The board stub grew a `data-shapes` attribute so a test
can read the arrows, which is the third thing a person looks at on that screen. The help
test was mutation-checked by renaming the legend and one radio: it went red on both.

44.6: every Play setting is remembered under `london-trainer.play.*` and the two Drill boxes
under `london-trainer.drill.*`, joining the scope and the gap. The chapter is kept PER
COURSE, and a remembered chapter the course no longer has falls back to its first through
`resolvePlayChapter`, which is `resolveCourse` in the same shape; a test seeds a chapter id
that does not exist and starts a game on it. Two things are still not kept, and neither is
a setting: a play request names a position, and a recorded game's side comes from the
record. **Two earlier tests turned over**, each with the reason in its own comment: the
phase 33 test that pinned the other-side box forgotten across a reload, and the phase 23
reasoning about the not-due box, which the SPEC now records as reversed.

44.7: version 1.10.2 in the four files. 44.8, driven at 1400x980 on the dev server: a right
answer left the pawn on e4 under the green arrow with the buttons offering "back in 1
minute" and "back in 8 minutes" under the minutes unit; a wrong answer put the red arrow on
the move played and showed the repertoire move made on the board under the green one; the
card came back into the ready queue when its one-minute gap ran out, from 10 ready to 11,
with "Include cards that are not due yet" unticked; and a chapter, a length, a strength,
the other-side box and both Drill boxes all held across a reload. **The pane's pointer
mapping was wrong on this machine** (a hover at the board's own coordinates landed on the
page behind it), so the two moves were played through the board's own `movable.events.after`
seam, which is the callback chessground itself calls and the same seam the DOM tests drive;
everything above it is the shipped path. No console errors; storage cleared afterwards;
viewport reset. Nick's own files were not listed and not reported.

**One fix beside the phase**, from Nick during the drive and landed as its own commit: on
the Courses page in the light theme the WHITE badge was black and the BLACK badge white.
They were painted with `--bar` over `--ground`, and those two swap with the theme. They use
the piece colours now, which are deliberately the same in both themes, and the badges were
photographed correct in the light theme.

1212 tests in 12.8 seconds, `tsc -b` clean, nothing under `courses/`.

**Gate 44 passed, 2026-09-06.** `tsc -b` clean, 1214 tests in 13.8 seconds, 532 line ids
unchanged and nothing under `courses/`. The scheduler claim was checked at source: the
whole-schedule comparison test is real, `review` scales the due date from the DUE DATE
rather than `scheduled_days` so a learning step scales instead of collapsing, and the one
minute floor holds. The badge fix was checked the same way: `--piece-white` and
`--piece-black` are defined in the bare `:root` above both theme blocks and redefined in
neither, so they really are the same in both themes, and the light theme was photographed
with a light WHITE badge and a dark BLACK one.

**Driven in the browser at 1400x980, through real pointer input**, which is the part the
builder could not do: the pane's pointer mapping worked here, so both moves went in as
drags on the board. A right answer left the pawn on e4 with the green arrow behind it and
offered "back in 1 minute" and "back in 8 hours" under the default unit. A wrong answer
put the knight back on g1 under a red arrow and played c3 on the board under the green
one, confirmed from the piece transforms rather than from a screenshot caught
mid-animation. Hours was the default on a cleared profile. Every Play setting held across
a real reload. No console errors in a fresh tab.

**One fault found and fixed, [07452ef].** Phase 44 made How strong and How long
remembered, and the effect that shows a resumed game its own strength and no cap was left
pointing at the new writing setters. So a Play on from a game recorded at level 7
replaced the strength and the length the trainee had chosen, for that game and for every
game after it. Proved in jsdom before the fix (set level 2 and To move 15, Play on from a
level 7 full game, storage came back 7 and full), fixed by giving `useRemembered` a setter
that shows a value without writing it, mutation-checked by reverting the fix, and then
driven in the browser: the screen shows 7 and Full while storage holds 2 and move15, and
leaving Play and coming back restores the trainee's own settings. The builder had got the
same case right for the other-side box, where `sideFixed` is derived and never written,
which is what marks this as an oversight rather than a decision. SPEC section 8 now names
all three things that are shown but not kept.

**Two smaller gate items in the same commit.** A test that pins hours as the default gap
unit, which was Nick's own re-ruling and which nothing held, mutation-checked by putting
days back. And two comments that had stopped describing their code: the one on the
launch-shape effect described a course change and a chapter fallback when the effect
drops the shape back after a request is used up, and `useCourseMoves` still said the side
box is not remembered, which is the ruling phase 44 reversed.

- [x] **Review gate 44**

## Phase 45 - every line ends on your own move, and auto step has a speed

Goal: Nick, 2026-09-06, on 1.10.2. Fix the two courses gate 43 recorded and left: the
Slav has ten leaves ending on a WHITE move, which leaves the student in a position they
must answer with nothing prepared, and the Najdorf's Alapin line stops at 9...Bd7 where
Nick's own Alapin course plays 10.Nxd7 and goes ten plies further. Then give auto step a
speed: the default gap becomes 2000 ms, with Slower and Faster buttons in 500 ms steps.

Chipped as `chips/phase-45-lines-finish-and-step-speed.md`. The ten Slav moves are the
ones each leaf's own plan already names, so the content change is mechanical rather than
a fresh authoring job. A new test holds the rule for every course. Version 1.10.3.

- [x] 45.1 The Slav's ten lines get their last move.
- [x] 45.2 The leaf-colour rule as a test, plus the schema doc and SPEC.
- [x] 45.3 The Najdorf reaches at least move 11, with the Alapin's own White moves.
- [x] 45.4 Any cross-course mismatch the change created, closed by listing a reply.
- [x] 45.5 The checkers at 2500 ms, recorded with conditions; bundles regenerated.
- [x] 45.6 Auto step at 2000 ms with Slower and Faster, the gap shown and remembered.
- [x] 45.7 Version 1.10.3.
- [x] 45.8 Proved in the browser build.

Acceptance: as the chip's final paragraph.

**For the gate.** 45.2 first, which set the scope: the leaf-colour test in `content.test.ts`
was written and run before any content moved, and it listed exactly the ten the phase 43
gate notes had recorded, all in the Slav, and nothing else. The rule is in the schema doc's
"What a leaf carries" and in SPEC section 3, both with the reason: a leaf is where the
student is left standing, so it has to be their own move that put them there.

45.1: each of the ten got the move its own plan already named, which made this a mechanical
fix rather than fresh authoring, and each plan was rewritten from one move later so it is no
longer telling the trainee to play the move now on the board. No name changed; none of the
ten named the White move that used to end the line. **All ten checked at 2500 ms and all ten
kept.** Six are the engine's own first choice: ...Nd5 -0.29, ...dxc4 +0.35, ...e6 +0.27,
...Bf5 +0.31, ...Bf5 +0.28 and ...Bg4 -0.37. The other four cost at most seven hundredths
against its best: ...Bf5 +0.39 of +0.33, ...Nc6 +0.08 (first choice), ...Nc6 -0.04 of -0.11,
...c5 +0.21 of +0.16. Nothing came near the 0.3 bar, so no line and no plan's prose had to
change and there was no finding to record.

45.3: the Najdorf's Alapin line reaches 11...e6, which is depth 11 and inside the house bar,
and it stops there because the position is a clear one: the plan names what the Alapin does
next (12.O-O Be7 13.Qg4 O-O 14.Bxc6 bxc6) rather than the line running on. White's two moves
are the Alapin's own, taken from that course, and the engine agrees with both: 10.Nxd7 +0.18
and 11.Nc3 +0.17 are its first choices, as are Black's 10...Qxd7 +0.19 and 11...e6 +0.13.
Four mistake entries beside them, every one measured: 10...Nxd7 +1.19 and 10...Kxd7 +3.20 are
mistakes, 11...Rd8 +0.15 and 11...Nd5 +0.35 are playable. Nowhere do the two courses say
different things about the same move, so nothing had to be recorded as a disagreement.

45.4: **no cross-course mismatch appeared.** The phase 43 test stayed green through both
content commits, which is the thing the chip asked to be confirmed rather than assumed: none
of the ten new Black moves lands in a position a White course reaches and answers differently,
and the Najdorf extension walks toward what the Alapin already plays, so agreement improved.
Nothing in `london-white` or `colle-zukertort` had to be touched.

45.5, under `docs/engine-runs/phase-45/` with the conditions at the top of each file (load 17
to 27 per cent, no build, no test run beside a run, one engine, sequential): the asks above,
`engine-mistakes` at 2500 ms over both courses, and the two prose checkers over each. The
Slav's mistakes pass reports nothing at all. The Najdorf's reports three, and all three are
the standing `11...Ne8` trio `accepted.md` settled at phase 31, where a forced mate scores
99.83 and no band can hold it; nothing on the four entries this phase added. Note-lines and
note-claims are at zero faults and zero unsupported claims for both. Both bundles regenerated;
the other eight are byte-identical.

**Eleven line ids changed, and each loses its learnt tick and its drill cards**, which is the
price Nick ruled for. The ten Slav lines are the ten in the leaf list, each with one move
appended: ch2-quiet's `...a4` gains `Nd5`; ch4-sidelines' `...Nc3 Nf6 Nf3` gains `dxc4`,
`...e3 Bf5 Nf3` gains `e6`, `...cxd5 cxd5 Bf4 Nc6 e3` gains `Bf5`, and both `3.e3` orders
gain `Bf5`; ch5-no-c4's `...Bf4 Nf6 Nf3 c5 e3` and `...Bg5 Ne4 Bh4 c5 e3` gain `Nc6`,
`...Nf3 Nf6 Bf4` gains `c5`, and `...Bd3 c5 c3 Nc6 Nf3` gains `Bg4`. The eleventh is the
Najdorf's `...Nxe5 Bd7`, which gains `Nxd7 Qxd7 Nc3 e6`. Those are the lines to tick again.

45.6: the gap was 850 ms, not the 1000 it was read as, and it is 2000 now. Slower and Faster
sit beside the stepping button with the gap between them as "2.0s", each disabled at its end
of the 500 to 5000 range. The speed is remembered under `london-trainer.study.step-ms`, read
once and written on change like the phase 44 settings, with anything that is not a half second
inside the range falling back to two; Study's PLACE is untouched and stays in memory only,
which is phase 40's ruling and a different thing. Changing the speed mid-line restarts the
pending wait rather than serving out the old gap, which the timer effect's dependency buys and
a comment says is deliberate. Five DOM tests written red first, the stepping one on fake
timers; the help test was mutation-checked on both new names and went red on both.

45.8, driven at 1400x980 on the dev server: the Slav's `3.Nc3 into the main line` now reads
`3.Nc3 Nf6 4.Nf3 dxc4` in the table and ends on Black's move on the board, with its plan
reading "Chapter 1 from here" rather than telling the trainee to take on c4; the Najdorf's
Alapin line reads to `11.Nc3 e6`; auto step showed 2.0s, two presses of Slower made it 3.0s,
and the board's first move then came 3.07 seconds after the button rather than 0.85; a reload
brought 3.0s back. No console errors; storage cleared afterwards; viewport reset. Nick's own
files were not listed and not reported.

1231 tests, `tsc -b` clean.

**Gate 45 passed, 2026-09-06.** `tsc -b` clean, 1231 tests in 14.2 seconds. The line
identity rebuild says exactly what it should: 532 lines before and after, eleven ids gone
and eleven added, every new id its old id plus precisely the move the chip's table named
and nothing else. An independent sweep, written before the builder ran, now finds ZERO
leaves ending on the opponent's move across all ten courses.

**The new rule was mutation-checked** by putting the old courses back with
`git checkout 0863299 -- courses/`: the test goes red and names all ten at once with
course, chapter and line. It sits inside the per-course `describe.each`, so it runs for
every course rather than the Slav alone, and it reads `node.isStudent` from the loader's
own walk rather than working out parity for itself.

**The engine numbers were spot-checked at 2500 ms on a quiet machine (16 per cent).** All
ten decisions hold, but the record's "of X for MOVE" attributions are not reliable to the
hundredth. Of the three that were recorded as costing something: `...Bf5` after 4.Nc3 came
back as the engine's own first choice at +0.36 rather than a 6 hundredth concession to
...e6, `...c5` after 3.Bf4 came back first choice at +0.08 rather than a 5 hundredth
concession to ...g6, and `...Nc6` in the Torre confirmed its 7 hundredth cost exactly
though against ...cxd4 rather than the ...Qb6 recorded. Ordinary multipv variance in quiet
positions at this movetime, and no decision turns on it, but the alternatives named in
that file should not be quoted as settled.

**Two real content faults found, both fixed, and both from the same process failure.** The
phase reported the prose checkers clean because they printed "0 faults"; each also printed
"for a human to read" and nobody read those. There were eight across the two courses. Six
are benign and are now listed with the reason in the records. Two were wrong:

- The Najdorf's note on 10.Nxd7 said "10.Bxc6 bxc6 11.Nxc6 Qd7 is the other way and gives
  Black the bishop pair", and it was wrong three times over. `Qd7` is illegal, because
  Black has had a bishop on d7 since move 9. `11.Nxc6` loses a piece to 11...Bxc6, which
  measures -3.79. And the recapture it recommended is the wrong one: after 10.Bxc6 the
  bishop takes back for +0.06 and equality, while 10...bxc6 is +0.75 because 11.Qf3 comes
  and the pawn on c6 cannot be held. Fixed in [019ec26]. The repertoire move needed no
  change: 10.Nxd7 at +0.21 is the engine's first choice, against 10.Bxc6 +0.03, 10.Nc3
  +0.00 and 10.a4 -0.02.
- The Slav's note on 8...Bd7 in ch3-exchange said "9.Qxa5 now loses the queen to
  9...Bxa4". After 9.Qxa5 the a4 square is empty, because the queen has just left it, so
  Bxa4 is not a legal move. The conclusion was right and the move was wrong: it is
  9...Qxa5. Fixed in [28a5121], which also names c2 as where the queen goes instead.

Both bundles regenerated; the other eight are byte-identical. note-lines over the Najdorf
is now 0 findings and 0 for a human; over the Slav it is 6, all six in the benign list.

**Driven in the browser at 1400x980.** Auto step showed 2.0s on a cleared profile. Slower
twice and Faster once left it at 2.5s with 2500 in storage, so the arithmetic is right in
both directions. Six more presses of Slower reached 5.0s with the button disabled at the
end of its range. At 3.0s the measured gaps between moves were 3018 ms and 3017 ms, so the
timer honours the setting. A reload brought 3.0s back, and a hand-written value of 17 in
storage fell back to 2.0s. The Slav's chapter 4 lines table shows all five changed lines
ending on Black's move. No console errors; storage cleared; viewport reset.

**Eleven learnt ticks are gone**, which is the price Nick ruled for. The ten Slav lines and
the Najdorf's Alapin line are listed with their old and new ids in the two content commits
above.

- [x] **Review gate 45**

## Phase 46 - the number on the live evaluation bar

Goal: Nick, 2026-09-13, after building Simply Chess (`C:\Users\nick2\Code\SimpleChess`),
whose bar carries the engine's number: the trainer's bar gets the same number. The report
keeps its words. This reverses half of the phase 23 ruling, which said the live bar carries
no number; the other half, that verdicts are words and never bare numbers, still stands and
the report is untouched.

Chipped by Nick as `chips/phase-46-bar-number.md`, committed 2026-10-18 so it lives in the
repository rather than only on his disk. Simply Chess is this app's code copied the other
way, so the chip reads those files as the origin and copies the number back. Version 1.10.4.

The chip also carries three faults that copying the code to the other app exposed here: a
PGN closing comment that says a checkmate twice, two test files that only type-check because
a third one pulls node types into the whole program, and a mate-score sign that reads
`mate 0` as a win for the side that has just been mated. The last is harmless today and
stops being harmless the moment a number appears on the bar.

- [x] 46.1 The evaluation carries its text beside its number.
- [x] 46.2 The live bar renders the number; the accessible name carries it.
- [x] 46.3 The bar at 24 px, the gap at 20, the number's colours from the piece colours.
- [x] 46.4 Tests for the number and its placement, and the bar read after a move.
- [x] 46.5 SPEC section 2 and the section 8 reversal; this plan; version 1.10.4.
- [x] 46.6 Proved in the browser build, both themes, a White game and a Black game.
- [x] 46.7 `gameToPgn` says a checkmate once.
- [x] 46.8 The two test files that compiled by accident declare their node types.
- [x] 46.9 `whitePovPawns` reads `mate 0` as a loss for the side to move.

Acceptance: as the chip's own section.

**For the gate.** 46.1: an evaluation is `{ pawns, text }`, made by `evaluationOf` at the
two places a score is read with its side to move still in hand, which are the provider's
`evaluate` and `scanGame`. That is the whole reason the text is carried rather than
derived: the engine reports from the side to move, a mate above all, and a sign worked out
later from a number that has forgotten its side is a sign that will one day be wrong.
Everything else reads `.pawns`: `scanForSlips`, `buildReport`, the report's `finalEval`
and the record's. **The stored record is unchanged**, because `PlayRecord.finalEval` was
always a number and still is, so nothing on disk moved and there is no migration.

46.2 and 46.3: `LiveEvalBar` draws the number where `numberPlacement` says, which is the
larger share at that share's outer end, so the digits are never printed across the join.
The accessible name is `Evaluation: +0.4` rather than the report's words. The bar is 24 px
rather than 16 and `.play-board`'s gap is 20 rather than 28, which keeps the 44 px the
button rows start at: measured live at 1400x980, bar left 24 and width 24, gap 20, board
left 68, `.play-controls` left 68, so the inset from the bar's own left edge is exactly 44.
The bar, `.board` and `cg-board` all have height 416 and all end on 593.19, to the
hundredth of a pixel.

46.4: eleven score-and-side pairs through `evalText`, each asserted on `evaluationOf` too;
`-0.0` never printed; `M0` with its sign both ways; the four placement cases plus the level
one; and two DOM tests that read the number off the screen through the real provider, one
as White (`+0.4` with the fake engine at `cp: 40`) and one as Black (`-0.3` at `cp: 30`,
`at-bottom`). Both go red when the sign in `evalText` is flipped, which is how they were
checked. The suite is 1255 tests in 12.9 seconds and `tsc -b` is clean.

46.6, driven at 1400x980 against the dev server with a real Stockfish: a London game dark
showed `+0.4` `at-bottom on-white` with the accessible name `Evaluation: +0.4`; the same
game in light showed the same number in the same colour, because both are piece colours
and neither moves between themes (`rgb(42, 44, 48)` on `#ece9e2`, measured in both). A Slav
game, where the trainee is Black and the engine opens, showed `+0.2` `at-top on-white` with
White's share drawn from the top, which is the other orientation and the other end of the
bar. No console errors; storage cleared afterwards. The two legible screenshots in the
notes were taken at 800 wide, because the pane scales a 1400-wide page down and a 10 px
number does not survive it; every measurement above was taken at 1400x980.

46.7, 46.8 and 46.9 are the three faults copying this code into Simply Chess exposed, each
its own commit. The PGN writer said a checkmate twice because `buildReport` takes the
outcome as the verdict when there is no evaluation to put in words; the fix pushes the
outcome only when it differs, and the new test goes red on the old line. The two test
files that read `node:fs` now declare their own node types: deleting the one
`/// <reference>` in `blank-start-real.test.ts` put TS2591 on all three, which is how the
hidden dependency was measured. And `whitePovPawns` read `mate 0` as a win for the side to
move, when it means that side is mated already; harmless today because no candidate ever
carries it, and no longer harmless once the sign is a number on the screen.

Reuse review: the find the chip predicted was there. `scanGame` and the provider's
`evaluate` each split a FEN by hand to get the side to move, beside `sideToMove` in
`position.ts` that does exactly that; both now call it.

**Gate 46 passed, 2026-10-18.** `tsc -b` clean, 1255 tests in 13.4 seconds. Nothing under
`courses/`, and no file under `src/model/` or `src/content/` either, so no line id can have
moved and none was rebuilt.

**Everything the builder measured, the gate measured again and independently.** A White
course with White ahead put the number `at-bottom on-white`; a Black course at the same
`+0.4` put it `at-top on-white`, which is the orientation flip and the one piece of this
easy to get backwards. The bar is 24 px wide, `.play-board`'s gap is 20, and the bar,
`.board` and `cg-board` all have height 416 and end on the same pixel. The accessible name
is `Evaluation: +0.4`. The number is `rgb(42, 44, 48)` in BOTH themes, which is the piece
colour and is theme-independent by design, verified at gate 44. No console errors; storage
cleared; viewport reset.

**The arithmetic was read rather than taken on trust.** `evalText` handles all four mate
cases correctly, including the one the phase exists to fix: White to move with `mate 0`
gives `-M0`, because that side is mated already and the mate is the other side's. The
`-0.0` guard works by taking the absolute value before the sign. `numberPlacement` puts the
number on the larger share at that share's OUTER end, so the digits never cross the join.

**46.9 was mutation-checked**: putting `moves >= 0` back turns the new engine test red, and
it was restored. 46.8's claim stands at source: `tsconfig.app.json` lists `vite/client`
alone, so a file reading `node:fs` has no node types of its own and only compiled because
another test file declared them for the whole program. 46.7 carries a negative test too,
holding that an outcome which is NOT the verdict is still said, which is the half a
one-sided fix would have broken.

**One anomaly, chased down and benign.** The first suite run after Nick renamed the folder
reported 16 failures across 11 files. Every run since has been green: four of them, one
with `node_modules/.vite` deleted first to test a stale cache keyed on the old path, which
did not reproduce it. The first run's timings were about three times normal across every
phase (transform 28s against 8s, import 187s against 63s), so it was machine load during
the rename rather than anything in the code, and the failures will have been timeouts in
the timing-sensitive DOM tests. Recorded so the next person to see it does not go looking
for a fault that is not there.

- [x] **Review gate 46**

## Phase 47 - the app is called Tabiya

Goal: Nick, 2026-10-17, preparing to make the GitHub repository public. The app is renamed
**Tabiya**, the standard position an opening heads for before play diverges, which is what
every chapter in every course teaches. The old name sat in a field of near-identical
descriptive titles, which is what it was changed to get out of.

Chipped as `chips/phase-47-tabiya.md`. The data folders move, so this is a migration phase
and the phase 15 rules bind in full: a verified COPY, nothing deleted, the old folder left
for Nick. Three identities and only two of them move. The product name and the data folders
change; the Tauri identifier and the `london-trainer.*` localStorage keys do not, both
because they are invisible and changing them would cost something for nothing.

Version 1.10.5. Phase 46 landed as 1.10.4 on 2026-10-18 and passed its gate, so this is
the next patch: a rename and a folder migration, with no new course and no new mode.

- [x] 47.1 The identifier stays, and the false claim about why is corrected.
- [x] 47.2 The localStorage keys stay, with a comment saying why.
- [x] 47.3 The data folders move, the migration chain carries the trainee across.
- [x] 47.4 The capability scopes follow, with both old generations readable.
- [x] 47.5 The installer hook names the new folders; a second app appears, as expected.
- [x] 47.6 Every place a person reads the name.
- [x] 47.7 What must NOT be renamed: chips, BRIEF, the historical plan and spec entries.
- [x] 47.8 SPEC and PLAN.
- [x] 47.9 Proved in the browser AND in a packaged build against copied folders.

Acceptance: as the chip's final paragraph.

**For the gate.** 47.1: the false claim was in THREE live places, not the two the chip
names. `paths.ts` and SPEC.md section 10 are the two it names; `src-tauri/src/lib.rs`
carried the same sentence and is live source, so it was corrected too. The chip says the
claim contradicts section 8; it does not appear there at all, and section 8 had no mention
of either name before this phase. 47.2: fourteen keys confirmed at source, twelve in
`prefs.ts`, one in `theme.ts`, one in `progress.ts`, each block now carrying a comment.

47.3: `migrate.ts` did NOT need reshaping, which is what the chip's escalation rule asked
to be checked. It takes one source and one destination, and all that changed is which
source it is handed. The chooser is a new `pickOldRoot` in `paths.ts`, beside
`oldDataRoots`, which is where "where has the data lived" is already answered. An `exists`
that THROWS counts as a no, because that is what a missing grant looks like. Five tests
drive the real pair on the fake filesystem, including a throw on the newer generation and
a fresh install where no folder at all is created.

47.4: fifty-two paths, up from thirty-one, because three generations are visible at once
and only one is writable. The middle generation gets the same nine grants the identifier
folder has had working since phase 15, rather than a tighter set derived from the call
sites: a missing grant does not fail a build, it blocks the app on the trainee's machine.
A new `capabilities.test.ts` holds every path to one of the four folder constants and
every write, mkdir and remove inside the folder the app owns. Both guards were
mutation-checked.

47.5: **the installer is `Tabiya_1.10.5_x64-setup.exe` and the executable inside it is
`tabiya.exe`**, confirmed from the build output rather than assumed, and they come from
two different sources: `productName` and the Cargo package. The install folder is
`%LOCALAPPDATA%\Tabiya`, which is exactly the collision `LOCAL_FOLDER` is `Tabiya Data` to avoid.
**The second application is a Start menu entry, not an Apps and Features entry**, which is
not what the chip predicted: this machine has `Repertoire Trainer.lnk` and `Tabiya.lnk`
side by side, and the old install at `%LOCALAPPDATA%\Repertoire Trainer` still has its
exe and its own `uninstall.exe`, but no uninstall registration. So Nick cannot remove it
from Apps and Features; he runs that `uninstall.exe` by hand. **Neither uninstaller can
touch the other's folders**, confirmed two ways: the hook names literals rather than
`${PRODUCTNAME}`, and the old uninstaller binary contains no "Tabiya" string at all while
the new one contains no "Repertoire Trainer" string.

47.9: the browser at 1400x980 shows `Tabiya v1.10.5` in the header, `Tabiya` in the tab
title, and "Tabiya teaches you chess opening repertoires" as the Help's first line, with
no occurrence of the old name anywhere in the rendered page. **The packaged build was
installed and driven for real.** Nick's answer to the copy question was "nothing needs to
be preserved", so the migration ran against the live folders with a full copy of all three
old folders taken into the session scratchpad first, verified at 380 files. The result:
both new folders created; `progress.json`, `progress.marker.json`, the second copy and the
WebView2 profile all written; **the file that came across hashes to the PHASE 15 folder,
not the identifier folder**, which is the chain picking newest first, proved live by the
two sources having the same two learnt lines but different hashes; two learnt lines either
side; and all three old folders byte-identical to the copy afterwards. Ticking a line in
Study wrote 3 learnt lines to the new `progress.json`, the second copy and the marker
while the old folder stayed at 2, which is the save landing in the new location and
nowhere else. Every capability grant was probed through the real scope layer and permitted,
with an ungranted path refused as the negative control. No failure banner, no alerts.
Browser storage cleared, viewport reset.

**One thing the chip asked for that cannot be done.** It says to drive the packaged build
against a COPY of the folders. Tauri resolves the roaming folder with
`SHGetKnownFolderPath(FOLDERID_RoamingAppData)`, verified in `dirs-sys` 0.5.0 at source,
so an installed build always reads the real `%APPDATA%` and no copy can stand in for it.
Nick was asked and chose the live run.

**Gate 47 passed, 2026-10-19.** `tsc -b` clean, 1269 tests in 13.2 seconds, tree clean,
nothing pushed by the builder. No file under `courses/`, `src/model/` or `src/content/`, so
no line id can have moved. The two frozen identities held: the identifier is still
`com.nick.london-trainer` and all fourteen `london-trainer.*` keys are still there across
the three files that declare them. 1.10.5 in all three manifests.

**The builder corrected this chip three times and was right every time.** Each was checked
at source rather than taken on its word.

- The false identifier claim sat in THREE live places, not the two the chip named:
  `paths.ts`, SPEC, and `src-tauri/src/lib.rs`, which the chip missed. And the chip said it
  contradicted section 8; it was in section **10** (line 1154 before the phase). My error
  on both counts.
- The duplicate install is a START MENU entry, not an Apps and Features one. Verified now:
  the registry holds exactly one entry, `Tabiya 1.10.5` at `%LOCALAPPDATA%\Tabiya`, and
  nothing for the old name under any display name, install path or the identifier. So the
  instruction the chip wrote for Nick named a list the old install was never on. The
  post-gate finding corroborates it: the orphaned executable was dated 2026-08-31 beside an
  uninstaller dated 2026-09-06, which fits an install that went half way and would explain
  a missing registration as well.
- "Drive it against a COPY of Nick's folders" was impossible as written. `dirs-sys` 0.5.0
  resolves the roaming folder with `SHGetKnownFolderPath(FOLDERID_RoamingAppData)`, read at
  source in `known_folder_roaming_app_data`, so it is a Win32 call and no `%APPDATA%`
  override can redirect it. The builder put the options to Nick, he ruled nothing needed
  preserving, and it copied all three old folders to the scratchpad first regardless.

**Nick's data is safe by construction, not just by report.** `migrate.ts` has exactly one
`remove`, and it targets `to.progress`, the copy in the NEW folder, and only when
verification failed. The source is never touched by any path through that module. The
capability grants for both older generations are read, exists and read-dir only: no write,
no mkdir, no remove, so the app has no way to alter what it migrates from. The three
folder literals agree across `paths.ts`, `lib.rs` and the NSIS hook, which is the thing
phase 16 once shipped disagreeing.

**Three things the chip did not ask for, all three right to have done.**

- **The WebView2 profile moves with `LOCAL_FOLDER`**, so the desktop's localStorage resets
  and 47.2's careful preservation of the keys buys nothing there. Confirmed at
  `paths.ts:250`. This is the finding of the phase: the chip froze the keys to protect
  settings and the folder move resets them anyway. It costs twelve clicks and no progress,
  because desktop progress is a file. The Progress notice now names both abandoned profile
  folders, says the theme and the remembered Play and Drill settings are what goes, and
  says progress is not in there.
- **`capabilities.test.ts`**, eight tests holding all 52 paths to the four folder constants
  and every write inside the folder the app owns, both guards mutation-checked. The
  capability file was the one change that could only fail in a packaged build; now it
  cannot fail silently either.
- **The titles of SPEC.md and PLAN.md** still said "London Trainer", a name the app lost at
  phase 5, on the two documents a public repository's reader opens first. A document title
  is live text, not a dated entry, so 47.7's history rule does not protect it.

**Driven in the browser at 1400x980.** Tab title Tabiya, header Tabiya v1.10.5, the Help
opening "Tabiya teaches you chess opening repertoires", and ZERO occurrences of the old
name anywhere in the rendered page. The only "London" left is The London System, which is
a course. No console errors; storage cleared; viewport reset. Every remaining mention of
the old name in the tree was checked and every one is deliberate: the `FORMER_*` constants
the migration needs, the capability grants it reads through, the NSIS comments about what
is left alone, the migration tests, and the `vite.config.ts` comment narrating an incident
that happened to an app with that name.

**Open, and Nick's to close.** His four old folders are deliberately still on disk so the
migration chain can be re-driven; once they go it cannot be exercised live again without
fixtures. Two register entries stand in SPEC section 6: the NSIS predecessor hook, still
not taken at its second rename, and a new one, that a blank start does not look for the
marker or the second copy in a folder the app has walked away from, which is open for one
start after a rename and needs his ruling on the wording.

- [x] **Review gate 47**

## Phase 48 - an About screen, and the notices an open-source release owes

Goal: Nick, 2026-10-24, releasing Tabiya as open source. The app gets an About that names
him, links to the GitHub repository, and says what the word tabiya means in chess.

Chipped as `chips/phase-48-about.md`. It carries more than a name because the installer
contains two GPL libraries, Stockfish and chessground, so the program as a whole goes out
under GPL-3.0, and a GPL program with a user interface owes its users the licence notices
and a copy of the licence text. The About is where the app pays that. The link needs a new
desktop permission, scoped to the one repository address and held by the capability test.
Version 1.10.6.

- [x] 48.1 The About screen, beside Help, with the drafted wording.
- [x] 48.2 The link, with the opener permission scoped to the repository address alone.
- [x] 48.3 The licence texts shipped and viewable offline, read from their files at build time.
- [x] 48.4 Help and SPEC.
- [x] 48.5 Version 1.10.6.
- [x] 48.6 Proved in the browser and in an installed build, including a refused address.

Acceptance: as the chip's final paragraph.

**For the gate.** Five things this build did that the chip did not say, each worth a look.

**1. The grant is narrower than the chip drew it.** The chip asked for the repository's
address "and paths under it". `tauri-plugin-opener` 2.5.5 matches the RAW url string
against a `glob::Pattern`, glob 0.3.4's defaults let `*` cross a slash, and `open_url`
passes the string on unparsed, so `Tabiya/*` would also admit `Tabiya/../../anything`,
which a browser resolves to `https://github.com/anything`. Paths under it means every page
on github.com. The chip's harder rule is "nothing wider" and the app opens one address, so
the scope is that literal and nothing else. Recorded in SPEC section 8.

**2. The plugin's link interceptor is off.** Its default build injects a click listener
that sends every `target="_blank"` anchor in the window to the opener. `lib.rs` builds it
with `open_js_links_on_click(false)`, so `src/ui/repository.ts` is the only call that
opens anything.

**3. Adding the plugin broke the packaged build, and it was mine.** `npm install
@tauri-apps/plugin-opener@^2` took 2.7.2, which needs `@tauri-apps/api ^2.12`, and so
lifted the API from 2.11.1 to 2.12.4 past the 2.11 tauri crate; the Tauri CLI refused to
build. The JavaScript side now matches the crates (opener `~2.5.5`, API back at 2.11.1)
rather than this phase upgrading the app's whole Tauri runtime. The suite and `tsc`
could not see it; only the CLI compares the two sides.

**4. A gap the chip's list does not close, now in SPEC section 6.** The production bundle
has no `@license` comment in it at all, so React's own "Copyright (c) Meta Platforms"
header, every transitive package's and every Rust crate's are not in the shipped program.
That has been true of every installer this app has shipped. How complete the notices
should be is Nick's call.

**5. Two corrections in passing.** Help said "Help is the last thing in that row", false
once About followed it, so it changed with the new sentence. And the licence texts
wrapped every line twice inside Help's 62ch width; their boxes are now as wide as the
text and scroll inside themselves on a narrow window.

**The copyright notice, for the reviewer's judgement.** GPL-3.0's "Appropriate Legal
Notices" include a copyright notice. The screen's own text says "Made by Nick Walker", as
drafted; the formal line, "Copyright (c) 2026 Nick Walker", is the first line of the MIT
text inside View the licences. The chip said to add no claim the draft does not make, so
nothing was added to the face of the screen.

**48.6, the browser**, at 1400x980, both themes: About straight after Help, before
Diagnostics; its version `Tabiya v1.10.6`, identical to the header; every paragraph as
drafted, read back from the page; the link an anchor to the repository with `target`
`_blank` and `rel` `noopener noreferrer`. Clicking it made the page ask for a new tab on
github.com and left the app's own tab where it was; the browser pane blocks new tabs from
an agent's click by its own rule, so the desktop is where the link is proved. View the
licences: `aria-expanded` false then true, the MIT text from "MIT License" through Nick's
copyright line, the GPL from its header to "END OF TERMS AND CONDITIONS", 35,821
characters, and nine other dependencies each with version and licence. Storage cleared,
viewport reset.

**48.6, the packaged build**, `Tabiya_1.10.6_x64-setup.exe`, installed over 1.10.5 and
driven over DevTools. In the production build the nav has no Diagnostics, and the About
screen has no anchor at all: the link is a button titled "Opens in your web browser".
**Clicking it opened the repository in the system browser**, which Windows handed to
Chrome, and the app showed no refusal.

**How the negative was tested.** Each address was handed straight to the opener's own
command, `plugin:opener|open_url`, through `window.__TAURI_INTERNALS__.invoke`, so no code
of the app's stood between the request and the permission check. All nine were refused:
another site, `https://github.com/` itself, a path under the repository, the dot-dot
escape, the lookalike `TabiyaX`, plain http, the exact address with a named program
(`with: notepad`), and two commands the window holds no grant for at all, `open_path` and
`reveal_item_in_dir`. The first seven were refused by the plugin's scope ("Not allowed to
open url ..."), the last two by Tauri's own capability layer ("not allowed by ACL"). A
refusal is proof enough that nothing opened, because `open_url` returns the error INSTEAD
of opening; checking browser window titles afterwards turned out to be unreliable, since a
browser process reports only one window's title.

**The interceptor being off was tested with a mutation-checked detector.** If it were on,
a click on a `target="_blank"` anchor to a refused address would be sent to the opener
and come back as an unhandled rejection naming that address. Clicking one left no
rejection, against a positive control that the listener did see. Then the plugin's own
`init-iife.js`, verbatim from the crate, was run in the same window and the click
repeated: "Not allowed to open url https://example.com/". So the detector catches an
interceptor when there is one, and there is none. A first attempt that wrapped `invoke`
in a spy proved nothing, and its own control showed it: Tauri makes that function
non-writable. Its control call went to the real opener, so it will have opened the
repository in the browser once more.

**Gate 48 passed, 2026-10-24.** `tsc -b` clean, 1292 tests in 12.8 seconds, tree clean,
nothing pushed by the builder. No content touched. 1.10.6 in all three manifests.

**The builder overrode this chip once, and was right.** The chip asked for the opener
permission to cover the repository "and paths under it". Checked at source:
tauri-plugin-opener 2.5.5 matches the raw URL with `glob::Pattern` (`scope.rs`), and glob
0.3.4 defaults to `require_literal_separator: false`, so `*` crosses slashes. A scope of
`Tabiya/*` therefore admits `Tabiya/../../anything`, which a browser resolves to
`https://github.com/anything` (node's URL parser agrees). "Paths under it" would have meant
every page on GitHub. The grant is the one literal address, with no glob, and is the only
opener permission. The plugin's own link interceptor is off (`open_js_links_on_click(false)`),
so one function in the app opens anything at all.

**The rest held at source.** The origin of the word names no root and a test fails on the
three disputed glosses. Both licence texts are read from their files; the GPL is shipped once
and a test fails the day chessground's copy diverges from Stockfish's. The dependency list is
generated from each package's own `package.json`. The version fix (opener ~2.5.5, API back at
2.11.1) is what is installed. The refusal testing went straight to the opener's own IPC
command, so no app code stood between the request and the permission check, and nine
addresses were refused, including the dot-dot escape and a lookalike.

**Two fixes at the gate, each its own commit.**

- **The copyright notice is on the face of the screen** ([0a35618]). GPL-3.0's Appropriate
  Legal Notices include "an appropriate copyright notice". The draft in this chip said "Made
  by Nick Walker", which is not one, and told the builder to add nothing, so it flagged it
  instead. The licence paragraph now reads "copyright (c) 2026 Nick Walker, and are free
  software under the MIT licence", held by a test that was mutation-checked.
- **The Tauri API is pinned to its minor version** ([ad33098]), as the opener already was. The
  build broke today because a new package lifted the API from 2.11 to 2.12 past the crate;
  the API's own caret range would let any `npm update` do the same. Lockfile changed by that
  one string; installed version unchanged.

**Open, and Nick's: the third-party notices are incomplete, and always have been.** Confirmed
in the built bundle: the only copyright lines in it are Nick's and the GPL text's own. React's
notice, and those of every other bundled package and of the Rust crates in `tabiya.exe`, are
absent, which MIT asks to be kept "in all copies or substantial portions". True of every
installer this app has shipped. Registered in SPEC section 6 by the builder; how complete the
notices should be is his call.

- [x] **Review gate 48**

## Phase 49 - the installer is signed in Nick's name

Goal: Nick, 2026-10-24, after seeing his PdfCraft installers signed: Tabiya's Windows
installer is code-signed with Certum's "Open Source Code Signing in the Cloud" certificate,
from EUR 49 a year, so Windows names him as the publisher instead of "Unknown publisher".
Researched in the PdfCraft session and handed over the same day; re-checked at source here.

Chipped as `chips/phase-49-signed-installer.md`, to run after phase 48. **Part A is
buildable now** with a throwaway certificate: a separate signing configuration so the
ordinary build stays unsigned, a preflight, a signature check, one `build:signed` command
and a written release procedure. **Part B is blocked on Nick's certificate and needs him
present**, because signing means logging in to SimplySign with a token from his phone.
**Nick bought the certificate on 2026-10-24 and is waiting for Certum to activate it.**
Certum's own page confirms it is issued to an individual, with the subject "natural person
data prefixed with 'Open Source Developer' phrase", so Windows will show that phrase with his
name; the exact field and punctuation are recorded when it is issued. No Australian
certificate authority exists to buy from instead, and the same-shape alternatives cost four
to six times as much. Signing names the publisher; it does not make the SmartScreen warning
vanish on day one.

Part A:

- [x] 49.1 Signing configuration in its own file, merged only for a release.
- [x] 49.2 A preflight that refuses plainly when the certificate is not available.
- [x] 49.3 A check of signer, timestamp and digest. Built by the orchestrator on 2026-10-28,
  not the builder, because the certificate had arrived and Nick was present.
- [x] 49.4 `npm run build:signed`.
- [x] 49.5 **Replaced by the real certificate.** The throwaway certificate existed to prove the
  wiring before money was spent on a real one; by the time this was built the real one had been
  issued, so the wiring was proved with it, and no test certificate was ever made.
- [x] 49.6 `docs/releasing.md`, and one line in the README's "Running it".
- [x] 49.7 SPEC section 8 ruling.

Part B:

- [x] 49.8 Nick bought it (2026-10-24), passed Certum's identity check (an Ergon electricity bill
  and his full name on the GitHub page, phase 52), installed SimplySign Desktop and connected.
- [x] 49.9 The certificate as issued, committed as `src-tauri/signing/code-signing.cer` (public
  half only): subject `C=AU, ST=Queensland, L=Mackay, O=Open Source Developer, CN=Open Source
  Developer Nicholas Walker`, issuer `Certum Code Signing 2021 CA`, SHA-1 thumbprint
  `4C83A6CA031C3CE9CFCA8C853780CF679F887CE8`, valid 28 October 2026 to 28 October 2027.
  The script reads all of this from the file rather than holding a copy.
- [x] 49.10 The first signed build (1.10.10), installed and checked: installer, installed
  `tabiya.exe` and `uninstall.exe` all Valid, signed by that thumbprint, sha256, timestamped by
  "Certum Timestamp 2026"; the program started and closed normally.
- [x] 49.11 The README's Download paragraph changed in the release commit that ships it.
- [x] 49.12 Released as 1.10.10.

**Found on the way.** Tauri 2.11.4 signs a copy of `tabiya.exe`, the uninstaller and every
NSIS plugin DLLs, `nsis_tauri_utils.dll` among them, but in staging and temporary folders: the
only signed file the build leaves is the installer, and `target/release/tabiya.exe` stays
unsigned. The first check looked at that file and failed; it now checks the installer, and the
program and uninstaller are checked once installed. Also, the step-speed bounds test's 32
user-event clicks ran past the five-second limit on a busy machine and failed every full run;
it now clicks plainly (its own commit). The full suite took 21 seconds with other sessions
running, just over the twenty-second rule.

Apps and Features names the publisher "Nicholas Walker" (`bundle.publisher`, phase 52) while the
signature says "Open Source Developer Nicholas Walker", as Certum issues it. Both are right;
they come from different places.

- [ ] **Review gate 49**

## Phase 50 - every library the app ships, credited inside it

Goal: Nick, 2026-10-24: the app credits every third-party library it ships. MIT, BSD,
Apache-2.0 and Unicode-3.0 ask for their notices to travel with every copy, and gate 48
confirmed the built program carries none but Nick's and the GPL text's. True of every
installer so far; fixed now that the repository is public with a download link.

Chipped as `chips/phase-50-third-party-notices.md`. **Runs before phase 49**, whose second
half waits on Nick's certificate. Measured first: 95 non-dev JavaScript packages at most, and
247 Rust crates compiled into the Windows program, of which 11 ship no licence file and 5 are
MPL-2.0, whose licence asks the distributor to say where their source is. The notices are
generated from the build itself, loaded on demand in the About, and kept out of the main
bundle. Version 1.10.7.

- [x] 50.1 A generator, built from what actually ships, in two sections.
- [x] 50.2 The Rust crates in the binary, procedural macros left out with the reason.
- [x] 50.3 Each licence resolved: OR choices, own files, vendored fallbacks, NOTICEs, failures.
- [x] 50.4 The MPL crates' source locations stated.
- [x] 50.5 Readable inside the app, loaded on demand.
- [x] 50.6 README, SPEC and Help.
- [x] 50.7 Tests, mutation-checked.
- [x] 50.8 Version 1.10.7.
- [x] 50.9 Proved in a production build and an installed build, with sizes measured.

Acceptance: as the chip's final paragraph.

**For the gate.** Every production build writes `third-party-notices.txt`: **61 JavaScript
packages and 211 Rust crates**, 328,653 bytes, 60 KB gzipped, the 272 packages sharing 133
texts. The JavaScript list is read from the bundle itself, so no lockfile fallback was
needed; Rolldown gives every chunk its modules with the length each contributed.

**The crate counts reconcile with the chip's 247.** Walking normal dependencies from the
root and stopping at proc-macros reaches 228: 17 proc-macros and 211 shipped. Walking
through the macros as well reaches 247, the extra 19 being compile-time only. The file
names the 17 and counts the 19. Ten shipped crates have no licence file, not eleven: the
eleventh, webview2-com-macros, is a proc-macro.

**Four places this build departed from or added to the chip, each worth a look.**

**1. The choice rule is refined.** The chip says MIT whenever offered, otherwise the first.
The generator takes MIT when the package ships its text, otherwise the first choice the
package ships a text for, and only then falls back to a canonical text, because a
package's own file carries its real copyright line. It changes one package:
brotli-decompressor, `BSD-3-Clause/MIT`, which ships only its BSD text with Dropbox's
copyright. Without the refinement it would have been credited with a template MIT text
and a copyright line made up from metadata. Recorded beside it in the file.

**2. The MPL-2.0 text appears twice, not once.** cssparser's copy says `http://mozilla.org`
in Exhibit A where SPDX's says `https://`, so the dedup rule keeps them apart. I would
rather print each package's text exactly than merge two that differ.

**3. The canonical texts are SPDX's plain-text copies**, from the `license-list-data`
repository behind spdx.org, not spdx.org's own `.txt` files, which carry SPDX template
markup in places (`<<var;name=copyright;...>>` in BSD-3-Clause). The words are the same;
both addresses are recorded in `scripts/licence-texts/README.md`.

**4. Three things beyond the chip's list, found by the data.** siphasher's `COPYING`
states its copyright and points at a `LICENSE-MIT` the published crate does not include,
so it gets the canonical MIT text and its `COPYING` verbatim. crossbeam-channel's
`LICENSE-THIRD-PARTY` holds notices for code it bundles, and is carried. tslib, vendored
inside `@tauri-apps/api`, has its Microsoft notice in a comment the bundler strips, so it
is lifted from the source file. And Stockfish is credited explicitly, because
`copy-engine.mjs` copies it into the app without it ever being a module.

**Two faults found by building rather than by testing.** The first build stopped on
`@ungap/structured-clone`'s ISC text: my licence signatures assumed single spaces, and
that file breaks a phrase over a line. All of them now match across line breaks. And the
first PACKAGED build stopped on `cargo metadata --locked`: a version bump makes
`Cargo.lock`'s own entry stale, and Tauri runs the Vite build before cargo, so every
release build after a bump would have failed. `--locked` is gone; `cargo build` updates
the same line a moment later anyway.

**The installer is a register entry, as the chip's out-of-scope list asked.** NSIS's own
`COPYING` puts its LZMA module under CPL-1.0, which asks a distributor of object code to
say where the source is, and Tauri builds with LZMA by default. Two ways to close it are in
SPEC section 6 for Nick to choose between.

**The proof.** In a production build served by vite preview at 1400x980: nothing fetched
before Third-party notices is pressed, then one request; the file shows with its title,
both sections, both counts and React's notice; and it wraps, after the first look found an
unwrapped line 5,337 px wide in a 970 px box. In the installed `Tabiya_1.10.7_x64-setup.exe`,
driven over DevTools: nothing fetched on opening About or View the licences, then one
request for `http://tauri.localhost/third-party-notices.txt`; both sections, 61 and 211;
React's notice; webview2-com with the canonical MIT text and "Copyright (c) The
webview2-com authors (https://github.com/wravery/webview2-rs)", since its metadata names
no authors; and the four MPL crates, cssparser 0.36.0, dtoa-short 0.3.5, option-ext 0.2.0
and selectors 0.36.1, each with its crates.io page and repository.

**Sizes.** Main bundle 1,768,831 bytes before the phase, 1,770,487 after: 1,656 bytes for
the section, its loader and the version string. The notices are their own 328,653-byte
file, and "Copyright (c) Meta Platforms", "WHERE TO GET THE SOURCE" and "IN THE WINDOWS
PROGRAM ONLY" occur 0 times in the main bundle.

**Tests.** 35 against the generator's pure core, mutation-checked ten ways, every one red
then restored; 7 for the on-demand loading, mutation-checked two ways; the help test on
the new name. One mutation found a gap first: my Unicode fixture could not catch the guard
I thought it covered, because without that guard the Unicode licence reads as MIT-0, not
MIT.

**One observation, not a finding.** chessground's piece set is Colin M.L. Burnett's, and
the chessground package carries no separate notice for it, only its own GPL-3.0-or-later
LICENSE, which the file credits. I have not guessed at a notice the package does not ship.

**Gate 50 passed, 2026-10-24.** `tsc -b` clean, 1335 tests in 13.1 seconds, tree clean,
nothing pushed by the builder, no content touched. 1.10.7 in all three manifests.

**The gate built the production bundle itself and read the file.** `dist/third-party-notices.txt`
is 328,653 bytes: 61 JavaScript packages and 211 Rust crates, exactly as reported. React's
"Copyright (c) Meta Platforms, Inc. and affiliates." is in it once; webview2-com, which ships
no licence file, carries the canonical MIT with a copyright line built from its repository;
the source section lists all four MPL-2.0 crates in the binary (cssparser 0.36.0, dtoa-short
0.3.5, option-ext 0.2.0, selectors 0.36.1), each with its crates.io and repository address.
None of the file's marker phrases occurs in any main-bundle file, so the notices really are
fetched on demand and not shipped up front.

**The builder's numbers reconcile with the chip's, and correct it.** The chip counted 247
crates by walking normal dependencies straight through procedural macros. Stopping at the
macros reaches 228: 17 macros, whose code runs at compile time, plus 211 shipped. The other
19 of the 247 are needed only by those macros. And ten shipped crates lack a licence file,
not eleven: `webview2-com-macros` is itself a macro.

**One departure from the chip, and it is right.** The chip said to choose MIT whenever an OR
expression offers it. The builder takes a text the package actually ships before a canonical
one, because the package's own file carries its real copyright line. That changes one
package: brotli-decompressor, "BSD-3-Clause/MIT", ships only its BSD text, with "Copyright
(c) 2016 Dropbox, Inc." The chip's literal rule would have printed a template MIT with an
invented holder in place of Dropbox's real notice. Confirmed in the generated file.

**One gate correction, its own commit** ([84ae3e5]). The register entry the builder wrote
for the installer is right that NSIS's LZMA module, which Tauri's schema labels "(default)"
and which `tauri.conf.json` does not override, is under the Common Public License 1.0. It
left out the special exception further down NSIS's own `COPYING`, in which the module's
authors permit linking your code to it without subjecting that code to the CPL. So the CPL
cannot reach Tabiya's code; only the module's own object-code conditions remain.

**Open, and Nick's.** That installer decision: `bundle.windows.nsis.compression` set to
`zlib` removes the LZMA module at the cost of a larger download, or an installer licence
page carries NSIS's terms, the LZMA source address and the plugin's notice. The notices in
this phase cover what is installed, not the program that installs it.

- [x] **Review gate 50**

## Phase 51 - the installer compresses with zlib

Goal: Nick, 2026-10-24: close the gap gate 50 found in the installer. NSIS's LZMA module, the
default Tauri uses, is under the Common Public License 1.0, whose conditions on its object
code no Tabiya installer had met. Switching to zlib removes the module and the obligation.

Done directly by the orchestrator rather than chipped, because it is one line of
configuration: `bundle.windows.nsis.compression` set to `zlib` in `tauri.conf.json`.
Version 1.10.8.

- [x] 51.1 The compression set to zlib; the generated script reads `SetCompressor /SOLID "zlib"`.
- [x] 51.2 Version 1.10.8, and the lockfile's version brought into line with it.
- [x] 51.3 The version test holds the lockfile too.
- [x] 51.4 SPEC: the register entry's LZMA half closed, the smaller remainder kept open, and the ruling.
- [x] 51.5 Proved by installing it and starting the installed program.

**Record, 2026-10-24.** The 1.10.7 installer's generated script read `SetCompressor /SOLID
"lzma"`; the 1.10.8 one reads `SetCompressor /SOLID "zlib"`. The installer grew from
7,227,714 to 7,561,065 bytes, 333,351 bytes or under 5 per cent. A search of both installers
for the string "LZMA" found none in either, so it proves nothing and is not counted. Proved by
installing the new installer silently over 1.10.7 with Tabiya closed (exit code 0, the
installed program and the Apps and Features entry both reading 1.10.8), then starting the
installed program, which opened its Tabiya window and closed normally when asked.

**Found on the way.** The lockfile's version said 1.10.6: phase 50's bump to 1.10.7 had
changed `package.json` and left `package-lock.json` behind, and the version test did not look
at it. It now does, at both places npm writes the version, and was mutation-checked by putting
the lockfile back to 1.10.6. **Still open, smaller:** `nsis_tauri_utils.dll`, Tauri's own
plugin inside the installer, MIT or Apache-2.0, is credited nowhere; recorded in SPEC section 6.

`tsc -b` clean, 1336 tests green.

## Phase 52 - the full name where Certum can see it

Goal: Nick, 2026-10-27: Certum, verifying the code signing order, asked to see his full name
as stated on the order, Nicholas Walker, on the project's GitHub page. The LICENSE, the About
screen and `Cargo.toml` already said Nicholas Walker (commit 1f84b3f), but nothing on the
repository's front page did, and no release carried the About change.

Done directly by the orchestrator. Version 1.10.9.

- [x] 52.1 README: "Made by Nicholas Walker, in Australia." near the top, and the Licence
  section names the copyright holder.
- [x] 52.2 Version 1.10.9 in all four files and both places in the lockfile.
- [x] 52.3 Released as 1.10.9, so the installed About screen says Nicholas Walker. Proved by
  installing the clean-tree build silently over the first 1.10.9 (exit code 0; the program's
  properties and Apps and Features both naming Nicholas Walker), starting it and closing it; the
  released asset's SHA-256 matches the tested file. `tsc -b` clean, 1337 tests green.
- [x] 52.4 The installer's publisher and copyright set to Nicholas Walker. Found by installing
  the first 1.10.9 build: with no publisher set, Tauri took the second part of the identifier
  `com.nick.london-trainer`, so Apps and Features listed the publisher as "nick". A test in
  `src/ui/licences.test.ts` holds both to the LICENSE's holder; mutation-checked by putting the
  publisher back to "nick".
