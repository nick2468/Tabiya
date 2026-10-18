# Tabiya - specification

v2.0, 2026-08-28 (v1.0 shipped 2026-08-27). The authoritative build document. It
supersedes BRIEF.md (kept for history) and folds in the review of four external briefs
in `chips/` plus Nick's rulings (section 8). The build follows PLAN.md; where the two
disagree, SPEC.md wins. Sections 1-9 specify v1 and stay true within a single course;
section 10 specifies the v2 course catalog and wins where they differ.

## 1. Purpose and teaching principle

A Windows desktop app that teaches one person (Nick, a club improver, roughly 800-1600
online rapid) to play the London System as White and to get good at it. The London
System is a White setup after 1.d4: bishop to f4, pawns on c3-d4-e3, and nearly the
same piece placement against most Black replies.

The guiding principle: **understand, don't memorise**. Every note in the content answers
"why", not just "what". Feedback grades a wrong move as playable, inaccuracy, or
mistake, each with the reason, rather than a bare "incorrect". The app trains three
abilities:

1. Know the moves: recall the repertoire against every common Black setup.
2. Know the plans: recognise structures and choose the right idea in them.
3. Play it under pressure: convert both in real games against an opponent.

## 2. The four modes

### Study

Browse the repertoire chapter by chapter, in course order. Board with arrows (the last
move auto-drawn, plus authored highlights where a note needs them), prose note per move,
variation navigation, and chapter intros that include a "typical mistakes at this level"
section. Each line has a "learnt" toggle. Learnt lines feed Drill. From any position, a
"play from here" button starts an engine game (see Play).

### Drill

Spaced repetition over learnt lines, scheduled by FSRS (Free Spaced Repetition
Scheduler) via the ts-fsrs library. A card is a position where White is to move: the
board appears, Nick plays a move, the app grades it.

- The exact repertoire move: correct (FSRS Good; an Easy button is available).
- A listed common wrong move: the authored grade (playable or inaccuracy maps to FSRS
  Hard, mistake to Again) with its authored note explaining why.
- Any other move: FSRS Again, with the honest framing "not the repertoire move" plus
  the expected move and its note. The app does not pretend to know the unlisted move
  is bad.

Cards are keyed by position (FEN) and deduplicated across chapters, so a shared setup
move is only ever one card. A "drill my weak areas" filter prefers cards whose concept
tags have the lowest rolling accuracy. A second option, "Include cards that are not due
yet", offers everything due first and then the cards nearest coming back; an early
answer goes through the ordinary review path. Both are remembered between sessions, as
every Play and Drill setting is.

Once an answer is in, the board shows the position AFTER the repertoire move, right or
wrong, with the green arrow saying where the piece went and a red one saying where a
wrong move went instead.

"Come back in" chooses the unit the scheduled gap is spent in: minutes, hours or days,
hours by default. FSRS works the gap out in days as it always has and every parameter it
computes is kept untouched; the unit is applied to the clock alone, so "back in 3 days"
becomes "back in 3 hours" or "back in 3 minutes" and switching back to days costs
nothing. Minutes and hours are for practice, not for remembering.

### Play

Full or partial games as White against Stockfish, in three launch shapes:

- **Any defence**: while the game is inside the repertoire tree, Black's moves come
  from the tree's frequency weights, so games land in trained structures with realistic
  variety. The engine takes over on book exit.
- **This chapter's defence**: the same, restricted to one chapter's branches. Sparring
  against a specific setup, for example the King's Indian.
- **From here**: launched from any Study position; the engine plays Black immediately.
  Since phase 30 it is also launched from a REPLAY, at whichever position of a reviewed
  game the trainee has stepped back to, which is how a move the report called a mistake
  gets played again. That kind carries the recorded game's own course, chapter and
  strength, and deliberately carries no identity: it is a new game, so the game being
  read is left recorded exactly as it is.
- **Play the other side** (phase 32): the trainee takes the opponent's colour and the
  engine plays the course. Since phase 33 it is a box that goes with any of the three
  shapes above, so it starts from move one, against one chapter, from a Study position or
  from a replay; from a position where the course is to move, the engine answers before
  the trainee does. While the game
  is inside the course the engine plays the repertoire move every time, or under a
  remembered setting a listed alternative one time in four; once the course has nothing
  to say it plays at the chosen strength. The report's first part becomes The course,
  saying how far its book lasted and which alternatives the engine took, because there is
  no repertoire for the trainee's side to be judged against. Hint on this side says what
  club players most often play, from the course's own weights. Such games are recorded
  with their side, counted apart on Progress, resumed and replayed against the course,
  and left out of Lines played.

Options: game length (to move 10, to move 15, or full game) and strength (a 1-8 scale;
implementation in section 5). A live evaluation bar sits to the left of the board while
the game is going, in the board's own orientation, and it carries the evaluation as a
number, always from White's point of view (phase 46, reversing phase 23). The game
names the course it belongs to above the board, and the chapter when it is sparring
against one. A reviewed game can be walked through move by move, copied out as PGN, and
resumed from where it stopped. A game in progress can also be stopped and discarded, with
no report and no record (phase 39). After the game or segment, a report:

- The first White move that left the repertoire, with the book move and its note. If
  Black left book first, the report says from which move it was "just chess".
- A blunder scan of White's moves at fixed engine effort.
- Verdicts in words ("clearly better for White"), never bare numbers. That binds the
  REPORT, which is read once at the end. The live bar is read out of the corner of an
  eye a hundred times a game, and since phase 46 it carries the number instead.

### Progress

Per-chapter completion (lines learnt / lines total), due-card counts, per-concept
accuracy (by tag, rolling window), and play stats (games per chapter, deviation rate).
Plain numbers, no badges. Export and import buttons for the whole progress state (also
the migration path when the Tauri wrap changes where state lives). Every saved game can
be archived, which takes it out of every list and count and into an archive view inside
this screen where it can be brought back, or deleted for good with a two-click control
(phase 39).

## 3. Content

Eight chapters, drafted by Claude in-session (ruled 2026-08-27: no external PGN
import; Nick spot-checks). Depth: main lines to about move 10-12, sidelines 6-8. Modern
move order only (1.d4 d5 2.Bf4, and 1...Nf6 2.Bf4); the classical 2.Nf3 order is a
future variant the schema already allows.

0. **The system**: the pawn triangle, piece homes, the h3 escape square, the standard
   attacking setup, bishop adaptation (Bd3 against ...d5 setups, Be2 against ...g6
   fianchettos), and when to break the routine. Concept-first: intro 300-500 words.
1. **Classical Black**: ...d5 with ...e6, including ...Bd6 offering the bishop trade.
2. **The ...c5 and ...Qb6 lines**: the critical test; Black hits b2 early and White
   must know the answer cold. Highest drill weight. Gets an engine sanity pass in
   phase 4.
3. **King's Indian setups**: ...Nf6, ...g6, ...d6 without ...d5.
4. **Grunfeld setups**: ...g6 together with ...d5.
5. **Harassment tries**: early ...Nh5, early ...Bf5, ...Ne4 lunges.
6. **Everything else**: the Dutch (...f5), ...b6 systems, early ...c6 systems, odd
   first moves. One safe recipe each.
7. **Typical tactics and plans**: the Bxh7+ Greek gift, Ne5 themes, e4 and c4 break
   timing, the e5 outpost, h-file attacks, plus the model patterns with Kamsky named
   as the reference player. Specific game citations wait until the app has a game
   source to check them against (ruled at review gate 3; see the register in
   section 6). Its tree nodes are exercise positions where the expected move is the
   thematic blow.

Quality bar for every chapter: every move carries a note of 1-3 plain sentences (the
idea or plan for White's moves, what Black is doing for Black's; club-improver reader,
no engine variations); every leaf carries a
"your plan from here" note; chapter intros carry the typical-mistakes section; each of
ch1-ch6 carries authored mistake entries (section 4) on at least 10 positions, ch0 on
its core setup decisions. Black reply weights are Claude's estimate of club-level
frequency, tuned later by feel.

Theory forks: where two repertoire choices are both sound, pick the one needing less
memorisation and note the rejected one in a single sentence. A fork with real
consequences the builder cannot judge is recorded as an open item and the simpler
branch is taken.

The courses agree with each other (ruled 2026-09-06, phase 43): where a White course and
a Black course reach the same position, the repertoire move one of them plays there is a
reply the other lists, and the suite holds it.

Every line ends on a move of the student's own colour (ruled 2026-09-06, phase 45): a
leaf is where the student is left standing, and a line that stopped on the opponent's
move would leave them a position to answer with nothing prepared.

## 4. Content schema

One JSON file per chapter, in the course folder (section 10 moved these from
`content/` to `courses/london-white/`). The normative schema lives in
`docs/content-schema.md`, created in phase 1 from this section; the builder may refine
details there with one recorded line of why per change.

Chapter file: `{ id, title, intro, stem, tree }`.

- `stem`: SAN array from the initial position to where the chapter starts.
- `tree`: array of nodes; siblings are the alternatives at that point. Whose move a
  node is falls out of ply parity (stem length + depth; White when even).

Node: `{ san, note?, variant?, weight?, plan?, tags?, mistakes?, shapes?, children? }`.

- `note`: required on every node. White's moves say the idea; Black's say what the
  move is doing (ruled 2026-08-28; Black notes were optional in v1).
- `variant`: White nodes only; defaults to "modern". Sibling White nodes must carry
  distinct variants, so v1 has at most one White move per position.
- `weight`: Black nodes only; integer 1-10, club-level frequency estimate, default 1.
  Drives Play steering.
- `plan`: required on every leaf.
- `tags`: White nodes; concept tags from the controlled vocabulary in the schema doc
  (seed set: development, king-safety, bishop-placement, e4-break, c4-break,
  kingside-attack, dark-squares, h-file, vs-c5, vs-qb6, vs-kid, vs-gruenfeld, vs-bf5,
  vs-dutch, tactics, endgame). Extending the vocabulary is allowed with a recorded why.
  Chapters may declare default tags applied to all their cards.
- `mistakes`: White nodes; the common wrong tries at that position:
  `[{ san, grade, note }]` with grade one of playable / inaccuracy / mistake. Each
  `san` must itself be legal at that position.
- `shapes`: optional authored board highlights `[{ orig, dest?, brush }]` for Study.

The loader walks each tree with chess.js, computes the FEN for every node, and
validates: every `san` (including mistake entries) legal from its parent position;
note/plan/variant/weight/tag rules above; tags within the vocabulary. The loader and
validator are pure TypeScript with no React in them - Drill and Play consume them too.

## 5. Architecture

| Decision | Choice | Why |
|---|---|---|
| Core stack | React + TypeScript + Vite, tests in vitest | Nick's dc.web stack; the chess ecosystem is JavaScript-first. Ruled 2026-08-27. |
| Windows wrapper | Tauri 2, added in phase 5 only | Small native .exe on WebView2 (the web view built into Windows 11). The app runs in the browser until then; no Rust toolchain before phase 5. Ruled 2026-08-27. |
| Board | chessground (the lichess board widget) via a thin React wrapper | Best feel; built-in arrows and highlights that Study needs. Needs its CSS and piece assets imported. Fallback: react-chessboard (MIT), only on a recorded escalation. |
| Rules | chess.js | Legality, SAN, FEN, PGN groundwork. |
| Engine | Stockfish WASM in a web worker, UCI protocol | Strong beyond any training need; no native binary before the wrap. The single-threaded lite build is the one shipped: no SharedArrayBuffer, so no cross-origin isolation headers, and 7 MB rather than 113. It is GPL-3, which binds anything distributed. |
| Scheduler | ts-fsrs | Modern algorithm, small MIT library, no hand-rolled SM-2. |
| Persistence | `ProgressStore` interface: load/save/export/import of one versioned JSON state | localStorage in a browser, a file under AppData in the wrapped app, chosen at runtime. Export/import doubles as the migration path and the backup story. Built as specified. |

Module boundaries, kept clean so the Tauri wrap touches only storage and build config:
`src/model` (types, loader, validator - pure), `src/scheduler` (FSRS wrap - pure),
`src/engine` (worker adapter, strength logic), `src/play` (steering, deviation and
blunder reports - pure logic, engine mocked in tests), `src/storage` (ProgressStore),
`src/ui` (React), `courses/` (course manifests and chapter JSON). Vitest covers the
pure modules. The UI was verified by use until phase 29, which added a second kind of
test: `src/**/*.dom.test.tsx` runs the real app in jsdom and drives it by clicking.
`docs/testing.md` says what each kind is for, what is faked and why, and the rules the
suite keeps.

Implementation guidance, not contract: strength scale 1-8 maps the top levels to
UCI_LimitStrength (UCI_Elo floors around 1320), and below that picks semi-randomly
among MultiPV candidates with capped movetime. Blunder scan at fixed effort; verdict
buckets roughly: under 0.4 pawns equal, to 1.0 slightly better, to 2.5 clearly better,
beyond winning. Calibrate by feel at review.

UI: dark theme default, light toggle. Australian English. Plain hyphens, never em
dashes, in every file including JSON prose.

## 6. Out of scope for v1, and the deferred register

Not in v1: other openings and the classical move order (the data model allows both),
a Black repertoire, online play, accounts or sync, mobile, video. The first two of
those arrived in v2: the Caro-Kann shipped at phase 8 and is a Black repertoire, the
Slav followed at phase 9, and the Ruy Lopez Exchange at phase 12 as the first course
delivered as a bundle, the Colle-Zukertort at phase 14 as Nick's second White
system against 1...d5, chosen so that the two structures teach each other, and the
Vienna Gambit at phase 18 as his second White answer to 1...e5, chosen so that the
two ask opposite questions about the same first move, and the Sicilian Najdorf at phase
31 as his second Black answer to 1.e4, chosen for the same reason from the other side:
the Caro-Kann is the solid one and the Najdorf is the counterpunching one, and the
Scandinavian at phase 34 as his third Black answer to 1.e4, the simple one: it trades
the centre away on move one and builds a Caro-Kann structure without the Caro-Kann's
tension, and the Alapin Sicilian at phase 41 as his first answer to 1...c5, the
structural one: c3 and d4 for a pawn centre, the London player's chess reached by 1.e4,
and the King's Indian Defence at phase 42 as his second Black answer to 1.d4, the
counterpunching partner to the solid Slav, and the one setup that also answers 1.c4
and 1.Nf3, which no course had covered. Ten courses, two colours, five of them White.

Deferred with reasons (the register; a later phase working nearby may take one along):

- **Plan quizzes** (multiple-choice "find the plan"): ruled 2026-08-27 to keep v1 to
  graded drills + weak areas. Natural v2 on top of the tags machinery.
- **PGN import/export**: ruled 2026-08-27, and **delivered at phase 11**. A course is
  one PGN file, section 11 has the format, and the Catalog imports and exports one.
  What is still deferred is the *own-game* half below: reading your own played games
  to find where you left the repertoire.
- **Own online-game import** (find your real London deviations): high value, needs PGN
  import first. Strong v2 candidate.
- **Lichess opening-explorer overlay** (real-world popularity and results per move):
  nice check on the weights; needs their API online; the app is offline-first.
- **Engine grading of unlisted drill moves**: v1 stays honest with "not the repertoire
  move"; live engine judgement in Drill is a v2 refinement.
- **A content-security policy for the wrapped window**: csp sits at Tauri's null
  default. The window loads only bundled local assets, so there is nothing for a
  policy to fence off yet; tighten it if anything remote is ever loaded. Recorded
  at gate 5.
- **A promotion picker in Play**: promotions auto-queen (phase 1 open item 3). An
  underpromotion never decides a club game out of this repertoire's positions, so
  the picker waits until something actually needs it. Ruled at review gate 4.
- **Model-game citations**: ch7 describes the Kamsky-style patterns without citing
  specific games, because a citation nobody can verify is worse than none. Real
  cited games arrive with PGN import or a game database. Ruled 2026-08-27.
- **In-app content editor**: the content editor for this app is a Claude session;
  likely a permanent defer.
- **Code splitting the bundle**: one chunk crosses Vite's 500 kB warning line. It is
  a local file load in a desktop window, so it costs nothing a trainee would notice.
  Worth doing if the app ever loads over a network. Recorded at gate 3, ruled at
  phase 5.
- **Auto-update and code signing**: the installer is unsigned and the app never
  phones home. Windows SmartScreen will warn on first run, which is what an unsigned
  installer looks like. Signing needs a certificate and a decision about updates that
  a single-user app does not need yet.
- **An NSIS hook that removes a previous install under a different product name**:
  Tauri supports `installerHooks`, so the rename could uninstall "London Trainer"
  on the way in. Left undone deliberately at phase 7: it is a one-off saving of one
  manual uninstall, it cannot be tested from a headless session, and an installer
  hook that deletes the wrong folder is a worse outcome than an extra entry in Apps
  and Features. **Still not taken at phase 47**, which is the second rename and so
  the second manual uninstall: "Repertoire Trainer" is now the entry left behind. The
  reasoning has not changed and the second instance does not change it, because the
  cost is still one uninstall a person does once while the risk is still installer
  code deleting a folder nobody checked.
- **Classical move order content** (2.Nf3 first): schema-ready; author when wanted.
- **A real exercise set, built as puzzles rather than as deep repertoire lines**: both
  courses' exercise chapters end long authored lines on the move that carries the
  plan, and only some of those moves are tactics. That is honest and it is not what
  the chapter titles promise. A proper set means positions built for the purpose, each
  one engine-verified, which is a chapter's work per course rather than a section's.
  Recorded at phase 8.
- **Engine-checking the opponent's moves and the frequency weights**: the standing
  engine pass judges the student's moves only, so a line where the repertoire is sound
  but the opponent's move is one no club player would choose passes unnoticed. Phase 8
  found several of those by hand. Checking weights properly needs real-game frequency
  data, which is the Lichess explorer item above. Recorded at phase 8.
- **The mistake-entry sweep of the London and the Caro-Kann**: `scripts/engine-mistakes.mjs`
  was built in phase 9 and run only on the Slav, because the chip scoped the other two
  courses out. Gate 9 ran it on both and it disagrees with 27 of the London's 190
  entries and 12 of the Caro-Kann's 107, against 0 for the Slav. Three Caro-Kann faults
  were verified and fixed at the gate: two moves graded `playable` that hang a bishop
  outright, and one note naming a punishment that does not exist. **The rest have not
  been read**, and they need the same treatment: run both passes, re-check each finding
  at 2500 ms, and sweep the prose for material claims by hand, which is what phase 9
  did for the Slav. **Taken up as PLAN.md phase 10**, chipped 2026-08-29. Two
  calibration notes for whoever runs it. The "graded too kindly" direction is where the
  real faults sit, and 13 of the London's and 10 of the Caro-Kann's fall that way. The "graded too harshly" direction is mostly noise on the
  London specifically, because a system opening's mistake entries are positional
  judgements the engine scores at nothing: "1.d4 d5 2.e3" is graded a mistake and
  costs 0.06, and that grade is right for a course whose whole subject is getting the
  bishop out first. Deferred at gate 9 only because it is a phase of work rather than a
  review touch. Recorded 2026-08-29. Phase 9 took
  half of it: `scripts/engine-mistakes.mjs` now checks the graded alternatives beside
  each repertoire move, which found eight faults the first pass could not see. Phase
  10 ran it over the two older courses and added `scripts/note-claims.mjs` for the
  prose. The opponent's own moves and the weights are still unchecked, and that is
  now the whole of what is left in this item.
- **Line names in Drill and Progress**: phase 13 named every line, and the name is
  now the readable way to say which line a card came from or which one a weak-area
  figure is about. Both screens still say it in moves. Not taken at phase 13 because
  the chip scoped that phase to the schema, the format and the Study screen, and
  because Drill deliberately does not tell the trainee which line they are in before
  they answer: showing the name is a design question about how much to give away,
  not a rendering change. Recorded 2026-08-30.
- **Renaming the binary** (`london-trainer.exe`, named in `src-tauri/Cargo.toml`): the
  same wart as the data folder, which phase 15 fixed by moving the folder. The exe name
  was left alone deliberately. It is what the installer writes and what the uninstaller
  knows to remove, so changing it in an upgrade over an existing install risks leaving
  the old `london-trainer.exe` orphaned in the install folder, taking up space and
  running nothing. That is a worse outcome than a filename nobody reads, and unlike the
  data folder it is not a name Nick sees. Worth doing on a clean uninstall and
  reinstall, checked in the install folder afterwards. Recorded at phase 15.
  **Done at phase 16**, on exactly that route: the executable is `repertoire-trainer.exe`
  and Nick confirmed on his own machine that a clean uninstall and reinstall leaves no
  orphan behind.
- **The uninstaller no longer removes the app's data, because the data moved and the
  identifier did not.** The generated `installer.nsi` removes `$APPDATA\${BUNDLEID}` and
  `$LOCALAPPDATA\${BUNDLEID}`, which are the folders named after the Tauri identifier.
  Phases 15 and 16 moved everything a person reads to `Repertoire Trainer` and
  `Repertoire Trainer Data` while deliberately keeping the identifier, so an uninstall
  that offers to remove application data now removes two abandoned folders and leaves
  the real progress file, its marker and its backup copy behind for ever. On 2026-08-31
  that saved Nick's progress across two accidental uninstalls, which is the only reason
  it is not urgent. The fix is an NSIS hook naming the real folders. It is installer
  code whose whole job is deleting things, and a wrong path there deletes the wrong
  folder, so it needs a ruling and a careful test rather than a quiet edit. Found at
  review gate 16.
  **Done at phase 17.** Nick ruled that an uninstall which offers to remove
  application data must actually remove it, and `src-tauri/installer-hooks.nsh` now
  names the two real folders. It carries the stock block's own guard, so it fires only
  when the trainee ticked the box and only when the uninstall is not the one an upgrade
  runs on its way past. See the paragraph in section 10 for what was and was not proved.
  **Renamed at phase 47** to `$APPDATA\Tabiya` and `$LOCALAPPDATA\Tabiya Data`, which is
  the case this entry was written about, arriving a second time. The right way round
  held without any extra work: the hook always names the folders its own install writes
  to, so the "Repertoire Trainer" uninstaller left registered beside Tabiya names the
  OLD folders and cannot reach the new ones. `installer-hook.test.ts` holds the hook's
  two literals, `DATA_FOLDER`, `LOCAL_FOLDER` and `lib.rs`'s own copy to the same
  strings, and a new `capabilities.test.ts` does the same job for the window's grants.
- **A blank start does not look for the marker or the second copy in a folder the app
  has walked away from.** `checkBlankStart` is handed one data folder and one backup
  folder, the current pair, so the evidence it weighs is the evidence THIS generation
  wrote. That is right for every start but one: a trainee whose progress file was
  already missing when they upgraded. Before phase 47 that trainee was blocked and
  offered the second copy; after it the new folders are empty, nothing says the app has
  saved here before, and the app starts blank. Nothing is destroyed, because the file it
  would have recovered is not in the new folder either, but the net that exists for
  exactly that case does not catch them. It is open for one start: the first save in the
  new folders puts it back. Not taken at phase 47 for two reasons. It reshapes
  `safety.ts`, which is the module the phase 15 and 16 rules exist to protect, and what
  the banner should say about a folder the app has now abandoned twice is Nick's call
  rather than a builder's. The grant it would need is deliberately absent too: nothing
  may read `$LOCALDATA/Repertoire Trainer Data/progress.backup.json`. Found at phase 47.
- **A gap in the London course, found from the other side**: the Slav's chapter 5
  answers 5.c3 Qb6 6.Qb3 with 6...c4, and the London course's chapter 2 covers only
  6...Qxb3. That is a hole in White's preparation rather than an error in it, and the
  phase 9 chip put both other courses out of scope, so it was not touched. Whoever
  works on the London next should add the branch: a trainee who plays both sides of
  this repertoire will meet it. Recorded at phase 9.
- **Re-run `engine-mistakes.mjs` over the five courses that shipped before the Vienna.**
  Every record in this project treats a short engine run as capable of INVENTING a
  finding, and every course was signed off partly on runs of that kind. Review gate 18
  found the other half of the same effect: the Vienna's last two runs reported no
  disagreements, and a run at the gate found two real ones, both alternatives graded
  playable that cost about a pawn and one of them 1.35. A grade that flatters a bad move
  teaches the wrong lesson as effectively as a wrong repertoire move does, which is the
  reason that checker exists. So the five older courses are owed one careful pass each,
  with every finding re-checked at 2500 ms before anything changes.
  **One pass each was run at the gate after all**, and the result is better than feared.
  The "graded too kindly" side, which is where the real faults sit, came back with
  exactly ONE entry across all five: the London's `3.e4` against a King's Indian setup,
  graded playable and called "a real try", where 3...Nxe4 simply takes the pawn. Measured
  at 2500 ms it costs 0.93 against a 0.9 ceiling, and it is an inaccuracy now with a note
  that says the pawn hangs. The Slav and the Colle reported nothing at all; the London's
  other 14, the Caro-Kann's 3 and the Ruy's 1 are all on the "graded too harshly" side,
  which is the known noise class on system openings whose mistake entries are positional
  judgements the engine scores at nothing.
  **What is still open is the second pass, not the first.** Gate 18's own lesson is that
  a single run can miss a real finding, so one clean-ish sweep is not proof these five
  are clean. Whoever runs it again should compare against this record rather than start
  fresh. Recorded and half-taken at review gate 18.
  **Done at phase 19, and the second pass earned its hour.** It was run once at 2500 ms,
  the movetime every gate treats as the arbiter, over all six courses including the
  Vienna: 1210 positions, 22 findings, three of them on the "graded too kindly" side
  where the real faults sit. Two of the three were invisible to the 900 ms pass, and one
  of those is a move that costs most of two pawns while its entry called it an
  inaccuracy. All three are fixed, in grade and in note. Every course has now had two
  passes: the Colle, the Ruy, the London and the Vienna came back with nothing new, and
  the Caro-Kann and the Slav were the two the first pass had called clean. This entry is
  closed on that evidence, and the evidence does not say the courses are clean. It says
  each has had two passes and the second one still found things.
  **Phase 20 ran a third pass over four of them and the closure needs qualifying.** Four
  courses, same script, same 2500 ms, prose-only changes in between, so the fields this
  pass reads were byte-identical. The Slav and the Vienna reported nothing, the Caro-Kann
  reported three and all three were the known harmless direction - and the Ruy reported a
  **new "graded too kindly" entry at 1.90**, `9.Qxd8+` in chapter 1, which phase 19's own
  2500 ms run over that unchanged course had not reported. Re-measured single-line at the
  same movetime it costs 1.88, so it is a band-edge call and the grade stands; the note
  beside it was wrong and is fixed. The point is not the entry. It is that "verdict
  strength" is still a sample, and the honest reading of this item is that a course has
  had N passes, never that it is clean.
- **Give `engine-pass.mjs` the same second pass, at 2500 ms.** It judges the moves the
  course tells the trainee to play, which matters more than a grade does, and it has the
  identical sampler problem: phase 19 proved a short run can miss a real finding and not
  merely invent one. It is roughly three times the positions of the mistakes pass, so it
  is a phase of work rather than a review touch, which is the only reason phase 19's chip
  put it out of scope. Whoever takes it should save the raw output beside the plan; phase
  19 could only compare against recorded counts, because the previous run's output was
  gone. Recorded at phase 19.
  **Phase 20 ran it at 500 ms over the four courses it touched, which is 1465 positions
  and not the second pass.** Eight moves cost half a pawn or more and none of them looks
  structural: three are the Ruy's own `Bxc6`, which is the variation the course is named
  after, and the largest, the Vienna's 1.36, is inside a sacrificial line the engine still
  scores at plus one and a quarter for White. Raw output is in the phase 20 record. At
  500 ms that is a sampler and settles nothing either way, which is exactly what this
  entry is for. Recorded at phase 20.
  **CLOSED at phase 35.** The orchestrator ran it on 2026-09-05 in an idle window: all
  eight courses at 2500 ms, about 2,600 positions in 1 hour 48 minutes, raw output per
  course under `docs/engine-runs/second-pass/` with the triage in its README. Twenty-five
  reports: four already accepted, seventeen where the floor holds (now listed in
  `accepted.md`), three worth a note or a listed alternative, and one real fault, the
  Scandinavian's Nge2 line castling past a free pawn. The four were landed by
  `chips/phase-35-second-pass-fixes.md`.
- **A note can name a line that cannot be played, and nothing in the repo checks it.**
  `note-claims.mjs` plays a note's moves only when the note also makes a material claim
  its vocabulary recognises, which is one mistake entry in twenty. A note that names a
  line and ends "and Black is better" is never played at all. Phase 19 found four entries
  carrying an illegal line that way, in two courses, plus one numbered a move late and
  one writing a check where the board says mate. A scratch tool that plays every sequence
  in every note found all six in seconds and needs no engine. It was not added to the
  repo because phase 19's chip put the checkers out of scope; it belongs in `scripts/`
  with the other three, and it needs a decision about how much prose it should read
  (mistake notes only, or node notes and chapter intros too, which is where one of the
  same faults also turned out to be). Recorded at phase 19.
  **Gate 19 probed it and it is a design problem, not an afternoon.** The naive version -
  reuse `note-claims.mjs`'s `sequenceIn` parser, play the sequence from the position the
  entry sits at - reports **36 lines across 3269 notes and every one is a false
  positive.** Placing the sequence by its own move NUMBER and side instead, against the
  stations of the line it hangs off, cuts that to 12, and **two of the twelve were real**:
  the Caro-Kann answered 6...e6 with "7.h5 Bh7" in two chapters, where h7 is Black's own
  pawn. Those are fixed. The three false-positive classes left are what the phase has to
  solve, and each is a different problem: a note that BACK-REFERENCES a move already
  played ("the same thing as 3.Nc3"); a note that names an illegal move deliberately, to
  say it is illegal (the Slav's "11.Kxh2 is not even legal", which negation detection
  handles the way `claimOf` already does for material claims); and a sequence that omits
  an obvious recapture (the Ruy's "10.Ne1 Qh4", which assumes 10...hxg4 first). The same
  parse gives two more checks nearly free, and each has already caught a real fault: the
  first move's number against the board, which is the Vienna renumbering phase 19 fixed,
  and check and mate markers in prose, which is the `Qxc1+` that was mate. The probe is
  in a session scratchpad and dies with it; the parser to reuse is
  `scripts/note-claims.mjs:97-124`.
  **Built at phase 20 as `scripts/note-lines.mjs`, and three of its rules are now in the
  suite.** It reads 3577 node notes, plans and mistake notes across the six courses and
  reports 8 faults and 16 lines for a human. All eight faults were real and are fixed:
  seven notes that describe a real line correctly and count it wrongly, five of them off
  by one, and one check written without its mark. **What fails a build** is a move the
  board refuses, a sequence numbered against a different position, and a check or mate
  mark the board does not give - each at zero across all six courses, and each
  mutation-checked by restoring the fault it was written for. **What only reports** is a
  note pointing at a move already played, a note naming an illegal move in order to say
  it is illegal, and a note leaving out one obvious reply. Those three are good prose and
  a test that fails on good prose gets switched off.
  **What it cannot see**, so a future pass knows where to look. A line that is legal in
  the position the note places it and wrong for the position the note MEANS: legality is
  the test, not sense. Anything a note asserts without naming a move, which was already
  `note-claims.mjs`'s gap and is still open. And a sequence more than one reply short of
  what the board needs, because exactly one inserted move is allowed.
  **What a course author has to keep true** is in `docs/content-schema.md` beside the
  `note` field rule: number the first move of a sequence and keep the dots, because `7.`
  and `7...` are what place it against a board, and count from the position the note is
  written from.
- **Chapter intros are checked in a reporting mode only, and it should not be promoted as
  it stands.** An intro has no one position to be written from, so every sequence is tried
  against every position the chapter reaches. With hundreds of candidates instead of two,
  a sequence nearly always finds some route that plays, and the three lines it does report
  are all benign - two naming a move from a line the chapter does not carry, and one
  correct line the checker reaches by a coincidental route. It stays because phase 19
  found a real intro fault by hand and because a reporting mode costs nothing. What would
  make it worth promoting is an anchor: an intro that declared which line each sequence
  hangs off would be checkable exactly like a node note, which is a content-format
  decision and Nick's to take. Recorded at phase 20.
- **CLOSED at phase 23: the help test could not reach the Play report.** It was recorded
  at phase 21, when the report's three headings (The repertoire, Your moves, The final
  position) were named by the help and checked only by reading `Play.tsx`. Phase 23 needed
  a session fixture anyway, to hold Undo and Redo in the in-game header, and the same
  sitting built a `GameReport` fixture and exported `Report` to take it. Both were the
  small honest work the entry said would settle it. All six names are now held by the
  suite.
- **Two React contexts are exported from their provider files so tests can supply a
  value.** Rendering to a string runs no effects, so the providers always render their
  empty starting state and screens that only exist after something is loaded cannot be
  reached. The lint rule that wants a context in its own file is suppressed at those two
  lines with the reason written beside it. Moving both contexts into their own module is
  the answer the rule asks for, and it is a file whose only job is to break a cycle, so
  it was not taken. What would make it worth taking is a third file needing the same
  thing. Recorded at phase 21.
- **The greyed course switcher is proved in the browser and not in the suite.** The rule
  is one derived boolean in the shell: the switcher is idle on the Drill view while Drill
  is mixing every course. Testing it needs the shell rendered ON the Drill view, and the
  view is internal state with no way in from a test that renders to a string. It was
  driven live at phase 22 in both directions, and the two things it depends on - the
  remembered preference and Drill narrowing to the selected course - are each covered by
  the suite. What would make it worth taking is a DOM test environment, which would let a
  test click the nav and would pay for several other checks this suite cannot make; a
  test-only prop for the initial view would not, because it is production API that exists
  for a test. Recorded at phase 22.
  **CLOSED at phase 29**, on exactly the terms it named: the DOM environment was built and
  the test clicks the nav. `shell.dom.test.tsx` learns a line through the Study table, goes
  to Drill, and reads the dropdown - idle with its reason in the title on Drill mixed, live
  again the moment Drill selected is chosen, and live on a running game, which is the half
  of the phase 22 ruling that says a game names its own course. Neutering the rule to
  `false` turns two of them red.
- **A view change itself is not driven by any test, which is the second thing a DOM test
  environment would pay for.** Phase 23 moved the running game above the screen so that
  looking at Study mid-game no longer throws it away. What the suite holds is the half
  that carries the weight: the game is in a context, `Play` renders whatever the context
  holds and owns none of it, and the switcher greys and ungreys off `inProgress`. Put the
  game back into `Play`'s own state and three of those tests turn red. What it cannot do
  is click Study and click back, because the view is internal state in the shell. That
  was driven live at phase 23 instead. Recorded at phase 23, and it is the same missing
  capability as the entry above rather than a second one: one DOM environment would
  settle both.

  **What that gap cost, once, in the same phase.** The provider's value was memoised, and
  the counter that says the mutable session has changed was not in the memo's
  dependencies. Children of a provider are the same element from render to render, so
  React skips them unless the context value changes: undo moved the game and left the
  screen showing the position before it. Every test passed. It was found by playing a
  game in the browser and pressing Undo, and it is why the value is no longer memoised at
  all. Written down because the next person to reach for a `useMemo` there should know
  what it costs.

  **Both halves CLOSED at phase 29.** The view change is driven: a test starts a game,
  plays a move, clicks Study, clicks back, and finds the same moves. And the memo is
  pinned rather than merely written down - `play-game.dom.test.tsx` presses Undo and Redo
  through the buttons, and putting the memo back turns both red. That is the bug this
  entry was written about, held by a test at last.

## 7. Risks

- **Engine steering** is the one novel design piece; the book-until-exit design needs
  tests, not research.
- **Content correctness is the real quality bar.** Mitigations: machine-checked
  legality on every drafted move, the phase 4 engine sanity pass on ch2 plus spot
  checks, incremental shipping so errors surface while studying, and Nick's spot
  checks.
- **Authoring volume** grew with mistake entries and tags. Bounded by the per-chapter
  minimums in section 3; do not gold-plate beyond them in v1.
- **chessground/React integration** is wrapped, not rewritten; the escalation fallback
  is pre-approved and recorded if used.

## 8. Rulings log

All by Nick. 2026-08-27: club improver level and lifetime-opening goal; modern 2.Bf4
move order with classical as a future variant; Tauri wrapper after a stack comparison;
graded feedback + concept tags + weak-area drilling in v1 (plan quizzes deferred);
content Claude-drafted (PGN import deferred). Stack ruling retained after reviewing
the four external briefs: three proposed .NET native UI, rejected because the
ready-made chess components are JavaScript; Gemini's brief independently matched the
chosen stack.

2026-08-31, phase 17: **version numbering.** The first digit is 1, the second is the
number of built-in courses, the third is the patch number. So the five-course build is
1.5.0. The number is shown after the name in the app header, read from `package.json` at
build time, and a test holds `package.json`, `src-tauri/tauri.conf.json` and
`src-tauri/Cargo.toml` to the same string - they said 0.0.0, 1.1.0 and 1.1.0 when the
phase started, which did not matter while nothing displayed it and matters now.

2026-08-31, phase 18: **the Vienna Gambit**, 1.e4 e5 2.Nc3 Nf6 3.f4, over the two quiet
Viennas (3.g3 and 3.Bc4). Same reasoning that picked the Zukertort over the Koltanowski:
the Ruy Lopez Exchange already teaches the quiet, structural answer to 1...e5, so a
second one would teach a shape Nick has, and a gambit teaches a different kind of chess.
Course id `vienna-gambit`, permanent, because it is written into every line id and card
key in the progress file.

2026-08-31, review gate 18: **the engine is a floor, not a chooser.** Phase 18's chip
said any student move still costing half a pawn at two and a half seconds is a fault to
fix. Its builder found a move that is both that and a legitimate repertoire choice, and
recorded the conflict rather than resolving it. The ruling: the fork rule in section 3
governs, and the threshold does not overrule it. Where two moves both leave the student
clearly better, take the one needing less memorisation, author the other as a graded
alternative naming both numbers, and say in the note why the harder one was passed over.
Where only one move keeps the position, the threshold binds and the line is fixed.

The case that settled it is the Vienna's ch2: after 1.e4 e5 2.Nc3 Nf6 3.f4 exf4 4.e5 Nd5
5.Nxd5 Qh4+ 6.Ke2 f3+, the course plays 7.Nxf3 at about +1.3 where 7.Ke3 is about +2.4.
Both are winning. 7.Nxf3 puts the king on f2 next move; 7.Ke3 walks it into the middle of
the board in the sharpest position in the repertoire, and a course that teaches the
engine's move there is teaching a line its reader will get wrong under pressure. The
threshold exists to catch a move that is simply worse, not to make the engine the author.

2026-09-01, phase 19: **2500 ms settles how big a cost is, not which side of a band edge
it falls on.** Every gate so far has treated a number from a 2500 ms search as final. The
second mistakes pass showed the limit of that: two of its three findings re-measured at
0.79 and 0.80 against the checker's 0.91 and 0.94, straddling the 0.90 ceiling between
playable and inaccuracy, and the largest re-measured at 1.37 against 1.88 across the 1.8
ceiling. Same movetime, same engine, single PV both times. So a finding at 2500 ms is
still worth acting on, and where it lands within about a tenth of a band edge the grade
is a teaching judgement to be argued in the note, not a number to be read off. Phase 19
took the stricter grade in all three, on what the lines do rather than on the measurement.

2026-09-01, review gate 20: **a straddle and an overshoot are not the same thing, and the
difference decides who has to record it.** The ruling above was written from three
findings whose repeated measurements disagreed about which side of a band edge they fell.
Phase 20 applied it to one where they agree: the Ruy's `9.Qxd8+` measures 1.90, 1.88 and
1.91 against an inaccuracy ceiling of 1.80, so every reading puts it over. The teaching
call still stands and the grade stays - the move trades into an ending White is much
better in rather than throwing one away - but the consequence is different. A straddle
goes quiet on the next run. An overshoot is reported for ever, and a checker that always
complains is a checker people stop reading. **So when repeated measurements agree on the
side and the grade stays anyway, the entry goes in `docs/engine-runs/accepted.md`** with
its number and the decision, and the next pass compares against that file before spending
an hour on it. Adding to that file is a decision to be argued, never a way to quieten a
checker.

2026-09-02, phase 21: **Progress shows the detail for the course the switcher names,
not for every course.** The v2 ruling in section 10 put Drill and Progress at the top
level because they span courses, and Progress took that to mean it should render a block
per course in catalog order. With six courses that is six screens, and the header
switcher could name the last of them. The rollup is the part that has to span everything
and it still does. The detail follows the switcher, and with no course open Progress says
to open one rather than choosing one silently, which is the same idiom the nav already
uses on Study and Play. Section 10 is corrected rather than left disagreeing.

The same sitting removed the rollup from the landing page. It read "1 of 308 lines learnt
across 6 courses. 9 of 10 cards due now", which is written in vocabulary the app has not
taught by the time somebody reads it. The front door now says what to do; the numbers are
on Progress, which is the screen for numbers.

2026-09-02, phase 21: **help is about the application, and the label comes first.** Every
word of prose in the app was chess. Nothing said what the app is for, what a screen wants,
or in what order to do things. The answer is one Help document, reached from the nav after
a separator and never disabled, plus three `?` panels whose text is a paragraph of the
matching document section rather than a second copy of it. Where a word on screen can be
made clear, it is made clear instead: the Study chapter list carried "Chapters" as an
aria-label, so a screen reader was told what it is and a sighted reader was not. Help
that exists to explain a confusing label is a wound dressing. The wording is "Help on
this screen", never "New here?", because the reader is not a beginner at chess and should
not be addressed as one.

2026-09-02, phase 22: **a course is always selected, and every mode works from the first
click.** Nick installed 1.6.3, clicked Progress first and was told to open a course;
clicked Drill first and got a London card with nothing on screen saying where it came
from; and found Study and Play greyed out. He named the inconsistency himself: block
every mode until a course is chosen, or allow all of them. **Allow all.** The cause was
that nothing remembered a course, so the shell started with none on every launch, and
phase 21 had made Progress follow the switcher while it was still classed as a screen
that needed no course. The selected course is now remembered in `localStorage`, the way
the theme is, and resolved at startup against the courses actually visible: a fresh
install, a course since hidden, a deleted folder and a renamed id are one case, and all
four fall back to the first visible course. It is deliberately NOT in `progress.json`,
which is versioned and exported, because a course id in an export would travel to a
machine that may not have that course.

The same ruling gave Drill a remembered **Drill mixed** or **Drill selected**, default
mixed. Mixed is the v2 one-queue ruling unchanged; what was wrong was that it happened
silently. While mixed is chosen the header switcher is greyed out on the Drill screen,
because a header naming a course the queue is ignoring is the same lie in the other
direction. This replaced the per-course filter row rather than joining it: two course
selectors on one screen would be worse than the inconsistency being fixed, and the counts
the row carried moved onto the radio labels.

2026-09-03, phase 23: **there is an evaluation bar during play, and it reverses a v1
ruling.** v1 said a bar while you play is a crutch that does the thinking the game is
meant to train. Nick asked for one after a day of playing 1.6.4, and the v1 ruling was
made before anybody had played a game in the app at all. His reason is the one that
settles it: without a bar he cannot tell a good game from a lucky one until the report,
so a game he was losing from move six feels the same as a game he was winning. Three
things keep the original concern honest. The bar carries **no number**, so it says which
way the game is going and not by how much. It is the engine's own view at **full
strength**, made at the scan's profile, never read off a weakened opponent's search,
because a bar that lies is worse than no bar. And every value it shows is **handed to the
scan**, so the report is built from the numbers that were on the screen and cannot
contradict them afterwards.

2026-09-03, phase 23: **a card can be drilled before it is due, and an early answer is
an ordinary answer.** After one full session Nick could not drill a course again for a
week, and the app gave him no way to say he wanted to anyway. The schedule was right and
the missing thing was an override. So a checkbox, not remembered between sessions: it is
a decision for one sitting, and a box that stayed ticked would make "due" mean nothing
from then on. There is no second recording path. FSRS already knows how much time has
passed, so an early Good grows the gap less than a Good on the day and an early wrong
answer shortens it as usual, and the buttons already say what each answer is worth.
**The FSRS parameters are not touched**, which is the standing ruling in
`scheduler/index.ts`: tuning them is a later question and a wrong answer there is worse
than the default.

2026-09-03, phase 24: **a game never holds the course switcher still, and names its own
course instead.** This reverses the phase 23 decision, which was the orchestrator's rather
than Nick's: the switcher was greyed on every screen while a game was open, on the
reasoning that a game belongs to the course it was started in. It does, and that is still
true. What was wrong was the answer. Nick wants to study a line, drill a card or check
progress on another opening while a game sits waiting, which is a normal thing to want,
and the greyed selector he could barely see on the Play screen answered a question nobody
had asked. So the game carries its own course and chapter TITLES, captured when it starts,
and writes them above the board: "Opening: The London System", or "Opening: The London
System, sparring against Classical setups". Captured rather than looked up, because the
header can now name another course and a title read late is a title that can change under
the game. The Play screen shows the running game whenever there is one, whatever the
header says; the start screen is what follows the header, so New game starts on the course
the dropdown names. Still one game at a time, and still judged against the course it was
started in.

2026-09-03, gate 24: **"Lines played" counts only the lines a game reached.** The
phase 24 chip's rule counted a game for every line it never left, and the builder
measured what that meant: a three move Caro-Kann game counted for eleven lines, because
eleven of them still share those moves. Nick ruled the narrower reading: a game counts for
a line once it has played past the ply where that line parts from every other line in the
course, and a game that stops while several lines still share the same moves counts for
none of them. `forkDepth` in `stats.ts` is that ply.

2026-09-03, phase 25: **a reviewed game is not finished with.** Nick reviewed a London
game, thought the report had the wrong side winning, and had no way to look again: the
board holds the final position, the report names moves without showing them, and a
screenshot was the only way to show anyone else. The report was right and both gaps were
real. Three answers, and they are one feature seen from three sides. The move list and
the report's sentences become a viewer, so a slip can be clicked to see the position it
was played FROM, which is where the alternative was. **Copy game** puts the whole game on
the clipboard as PGN with the report written in as comments, because a game is text and
nobody can replay a screenshot. And **Keep playing** hands the board back from the
position the game stopped in, for a game that stopped rather than ended; a capped game
becomes an ordinary capped game again and the existing extend buttons take it from there.

The consequence worth writing down: a game can now be reviewed more than once, so
**`at` is the game's identity and not only its date**. `recordGame` replaces a record with
the same `at` rather than appending, or one game counted twice in Games played and in
Lines played, once short and once long.

2026-09-04, phase 29: **a suite that cannot drive the app is not finished.** Three bugs
shipped through a green bar and every one was found by Nick or a session pressing a
button in a browser. The memoised provider value at phase 23, where Undo moved the game
and left the screen behind. The fresh timestamp at phase 25, where a game reviewed twice
was counted twice. The replay write at phase 27, where reading a game left a second
record. They are one bug three times: the provider that runs a game needs a DOM and an
engine to reach, the suite had neither, and so the one module holding the app's mutable
state was the one module nothing drove.

The ruling is that the suite gets a DOM. `src/**/*.dom.test.tsx` runs the real app in
jsdom as a second vitest project and clicks its buttons; the engine arrives through an
optional `createEngine` on `PlayProvider` so a test can hand over a fake without the
provider knowing; the board is stubbed because chessground needs a `ResizeObserver` jsdom
does not have, and the throw that forces that is itself pinned by a test.

Three conditions, and they are the ruling as much as the rig is. **A regression test is
shown red against its own bug first**, by writing it against the commit before the fix or
by putting the bug back: a test that has never failed proves nothing. **The whole suite
stays under ten seconds**, both projects, because a bar nobody waits for is a bar nobody
runs (raised to twenty at phase 33; see below). And **no snapshots, no fake timers, no
worker** - the first records what the code
did rather than what it should do, the second tests the clock, and the third is what the
fake engine exists to prevent. `docs/testing.md` holds the detail.

2026-09-04, phase 30: **a report should let you try the move.** Nick replayed a London
game on 1.6.12 and was told move 35 had missed a forced mate. The report named it and the
viewer showed the position, and neither let him play it, so the one thing he actually
wanted to do with the finding was the one thing the screen would not do. Study has offered
Play from here since v1 and the ruling is that a replay offers the same button.

What it starts is a NEW game, and that is the ruling rather than a detail. `at` is a
record's identity under the phase 25 rule, so a request keeping the old one would make the
first review of the new attempt REPLACE the game he was reading. The game he is learning
from has to survive being learnt from. It is enabled only where it can work, which is a
position where it is the trainee's move and the game is not over.

The same sitting moved **Keep playing** out of the header and into the button row beside
it. It was a text link, which reads as navigation, and it does a thing to the game exactly
as the other buttons do. The two are the pair a person confuses, so they sit together and
each says in its tooltip what happens to the record: Keep playing carries this game on and
a second review replaces its record, Play from here leaves it as it is and adds a game.
The row became two rows to fit them: the board is 416px and one row of all of them does
not.

2026-09-04, phase 31: **the Sicilian Najdorf**, 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6
5.Nc3 a6, as Nick's second answer to 1.e4 and the seventh course. The pairing is the
reason: the Caro-Kann builds a wall and asks White to find a way through it, the Najdorf
hands White the centre and asks whether White can use it before the queenside arrives.
Same first move, opposite question, which is the same shape as the Ruy and the Vienna
from the White side. The course id is `najdorf-black` and it is permanent, because it is
written into every line id and card key in the trainee's progress file.

Three rulings inside it, and all three are the theory fork rule doing its job. **The move
order is 1...c5 and 2...d6 against every White second move that allows it**, so the
anti-Sicilians are met with one recipe each rather than a second repertoire. It bends
exactly once, against the Alapin, where the pawn on d6 does nothing about a centre built
behind c3 and the knight goes to f6 instead; the chapter says so rather than leaving the
rule quietly broken. **The Poisoned Pawn is out**, and so is 8...h6 9.Bh4 g5: both are
sound and both are a forcing line where one wrong move loses, which is what the fork rule
declines. **The Smith-Morra is declined**, because taking the pawn is a memorisation
contest against an opponent who has played it fifty times.

The one that is not a fork is the e-pawn. Black plays it two squares against every quiet
White sixth move and one square against 6.Bg5 and 6.Bc4, and the course teaches that as a
rule with two named exceptions rather than as a judgement, because a rule with exceptions
is what a club player can actually hold.

2026-09-05, phase 32: **play the other side.** Nick wants to play AGAINST the opening he
has learnt, with the engine playing the course, so he gets experience on the other side
of his own lines. A fourth way to start a game, beside any line, this chapter's line and
from a position: the trainee takes the opponent's colour and the engine plays the course.
Ruled the same day: a before-play choice of whether the engine plays the course move every
time or sometimes a listed alternative, defaulting to every time. Under the second setting
the engine plays the course move three times in four and otherwise one of the alternatives
the course lists and grades at that position, chosen equally among them; where a position
lists none, the course move. The setting is remembered; the side is a launch choice like
the others and is not.

Two consequences worth writing down. The report has no repertoire to judge the trainee
against on this side, so its first part is about the course instead, and no sentence
about leaving the repertoire exists there. And a game on the other side is the engine
playing the line, so it is recorded with its side, counted apart in Games played, and left
out of Lines played, because crediting the trainee with a line the engine played would
make that table say the opposite of what it is for.

2026-09-05, phase 33: **the other side from any start, and a suite budget that fits the
app.** Nick played 1.7.2 and wanted to play against the course from a Study position.
Phase 32 had built Play the other side as a fourth launch radio, which made it exclusive
with From a Study position, and hung a dropdown of lines under it that repeated the
choice the first two radios already make. The fault was the shape of the control, and
the ruling is that **it is a checkbox that goes with whichever launch shape is chosen**:
the radios say where the game starts and which lines the engine draws on, the box says
which side of them the trainee is on. The box is a launch choice and is not remembered;
the setting under it is. A recorded game keeps its side, so Play on and Replay of an
other-side game show the box ticked and held, and a course-side game played on cannot
be switched: that would be a different game.

The same day, **the ten-second suite rule is raised to twenty.** The suite was at 9.5
seconds and the next DOM file would have crossed the line, and a rule that blocks a
better app is the wrong rule. The purpose stays and is written beside the number in
`docs/testing.md`: a bar nobody waits for is a bar nobody runs, so the suite must stay
fast enough that a builder runs it after every change, and twenty seconds on this
machine is that. The number is a ceiling, not a target.

2026-09-05, phase 34: **the Scandinavian Defence**, 1.e4 d5 2.exd5 Qxd5 3.Nc3 Qd6, as
Nick's third answer to 1.e4 and the eighth course. The reason is the one the three Black
courses make together: the Caro-Kann is the solid answer, the Najdorf is the
counterpunching one, and the Scandinavian is the simple one. It trades the centre away on
move one and builds the Caro-Kann's structure, pawns on c6 and e6 and the bishop outside
them, without the Caro-Kann's tension to manage. The course id is `scandinavian-black`
and it is permanent, for the same reason the Najdorf's is.

**The queen goes to d6**, by the decision rule: it is a modern square with less to
memorise than a5, which is a fine square with two tricks to know against it, Bd2
unmasking the knight and Nd5 hitting the queen. The rejection takes one sentence in
chapter 0 and no more. **2...Nf6 is out** under the theory fork rule, in one sentence
for the same reason: the Portuguese and Icelandic gambits are sound and have a theory
of their own. Three more forks, each in a sentence where it arises: 5...c6 over 5...a6
and 5...Bg4 in the main line, because c6 gives the queen its retreat square and is the
shape every chapter shares; 3...Nf6 over 3...Bg4 against 3.Nf3, because the pin invites
a theory Black does not need; and against the Blackmar-Diemer, decline with 4...Bf5
rather than take on f3, because the pawn is not worth the attack it buys.

The rule the Scandinavian adds to the checkers is a rule about **chapters sharing a
position**. Chapters 2, 3 and 6 pass through positions that chapters 0 and 1 already
grade, and under the one-grade rule from phase 31 those positions carry mistake entries
in one chapter only. The suite already says so; the course is the first written knowing
it.

2026-09-05, phase 35: **the second pass ran, and a line id changed for it.** The
verdict-strength pass of `engine-pass.mjs`, 2500 ms over every course, had been open in
the section 6 register since phase 19. It ran in an idle window and reported twenty-five
moves. Twenty-one were settled by the floor ruling or were already accepted, and all of
those are in `accepted.md` now so that the next pass reports nothing new on them. Three
earned a note or a listed alternative without a move changing: the Caro-Kann names
5...Qxd4 as playable beside its recapture, the Najdorf's 8...Qc7 note names 8...b5 as the
livelier try, and the Slav's 4...Nc6 note says the engine prefers 4...e6 by a little.
One was a fault: the Scandinavian's 4.Nge2 line castled on move nine where a pawn was
free on d4, +0.83 against +0.33. **Nick ruled "fix it"**, accepting that the line's id,
which is its moves, changes: one learnt line at most, on a course a day old. The line
takes the pawn, and the old castling move is a mistake entry saying why.

2026-09-05, phase 39: **the games the app keeps can be managed.** Three things Nick asked
for in one sitting. A game in progress is stoppable without a review and without a
record: **Stop and discard** beside Stop and review, no confirmation, because the app has
no dialogs and an unsaved game is the smallest thing it holds; it does exactly what New
game does to a running game. Every saved game has **Archive** and **Delete** beside it on
Progress. Archive is a flag on the record, absent meaning not archived, so no file needs
rewriting; an archived game leaves the Play on list, the Games played numbers and Lines
played, stays in the file, and still counts against the history cap of 100. The archive is
a view inside Progress rather than a sixth mode, reached by the "N archived games" line
and left by Back to your games, with Unarchive and Delete on each row and neither Play on
nor Replay. **Delete is the app's first destructive control**, and the ruling is that it
is a two-step button: the first click turns it into "Delete for good?" for five seconds,
a second click within that time deletes, and anything else, the time passing or a click
elsewhere, puts it back. The game on the Play screen cannot be archived or deleted from
Progress until it has finished there, the rule Play on already followed.

2026-09-05, phase 41: **the Alapin Sicilian**, 1.e4 c5 2.c3, as Nick's first answer to
1...c5 and the ninth course. His White repertoire answered 1...d5 twice and 1...e5 twice
and had nothing against the most common reply to 1.e4 at club level. The Alapin was
chosen over the Grand Prix Attack because the White courses are structural and this one
is too: c3 and d4 for a pawn centre, the London player's chess reached by 1.e4. Chapter 0
names the rejected alternative once. The course id is `alapin-sicilian` and it is
permanent, for the reason the Najdorf's and the Scandinavian's are.

**Two main lines, one chapter each**: 2...Nf6 3.e5 Nd5 4.d4 cxd4 5.Nf3 with the e5 wedge,
and 2...d5 3.exd5 Qxd5 4.d4 Nf6 5.Nf3 with the isolated queen's pawn. The forks, each in
a sentence where it arises: the knight to f3 before the pawn takes back on d4, so that the
pawn lands defended; the pawn recapture on d4 every time the pawn can do it, because the
knight recapture is the open Sicilian the course exists to avoid; 6.Be3 before Bd3 in
the isolated-pawn line, so that ...cxd4 and ...Nc6 never hit an unheld pawn; Bxc6 declined
where Nxd7 takes instead, keeping the bishop pair; and against 2...e6 the trade on d5
rather than the French Advance, which is a different course. **The one line the engine
rewrote before it shipped**: the answer to ...Qb6 hitting b2 with the queen's knight at
home was going to be Nc3 and Nb5, and the engine showed ...Qxb2 and ...Qxa1 taking a rook;
it is d5 now, hitting the knight, with Bd4 and a check that ends on c3 behind it.

2026-09-06, phase 42: **the King's Indian Defence**, 1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6, as
Nick's second Black answer to 1.d4 and the tenth course: the counterpunching partner to
the solid Slav, the pairing the Najdorf makes with the Caro-Kann. It also fills a gap no
course had covered, because the same four Black moves answer 1.c4 and 1.Nf3, and chapter
3 is where those move orders are shown arriving at the same house. The course id is
`kings-indian-black` and it is permanent.

**The seventh move in the Classical is 7...Na6**, under the theory fork rule: after 5.Nf3
O-O 6.Be2 e5 7.O-O the heaviest theory is 7...Nc6 8.d5 Ne7, the Mar del Plata race, and
the decision rule was to take the Glek line unless the engine at 2500 ms and the chapter
both came out better for 7...Nbd7 or 7...exd4. The engine put 7...exd4 nine hundredths
ahead of 7...Na6 and 7...Nc6 outside its top five, and the chapter is built on the knight
reaching c5 without blocking anything, so the knight goes to a6. 7...Nc6 is rejected in
one sentence where it arises. **The other forks, each in a sentence**: 6...c5 against the
Saemisch rather than 6...e5, because the closed centre is what White's pawn storm wants;
...exd4 against the Fianchetto rather than 8...c6, because the open centre asks less and
the plan is pieces; 6...Na6 against the Averbakh rather than 6...c5, keeping the lever;
and 2...g6 against the Trompowsky rather than 2...Ne4, keeping the four moves. **Against
the London**, the course answers the London course's own line move for move as far as
that course goes, and stops one move later: the engine's 10.Nxe5 is met by 10...Nh5, and
the London's 10.Bh2 by 10...Ne4, which the London's leaf does not list and which its plan
should expect.

2026-09-06, phase 43: **the courses must be consistent with each other.** Nick's ruling,
after writing the King's Indian found three places where his own London course and his
own King's Indian course meet and do not agree. The rule, now in section 3 and held by a
test: where a White course and a Black course reach the same position, the repertoire
move one of them plays there must be a reply the other lists. A course may list more
replies than the other plays; it may not be silent about the move the other plays. Three
scopings, each from what a course is. A stem counts as moves and replies. A position
counts only once both courses have made a move of their own on the way to it, because
before that the two are choosing an opening rather than disagreeing about one, and a
1.d4 defence that listed 1.e4 would be another course. And a leaf is not silence: where a
line ends the course has said what it means to say, and a rule that read the deeper
course's next move as a fault could never be satisfied, because the shallower course's
answer would then be one move deeper still. **Agreement is reached by listing, never by
moving a repertoire move**: a repertoire move moves only when the engine at 2500 ms says
it is unsound, and that is a finding, not a consistency fix. Same-colour pairs are out on
purpose; the London and the Colle both answer 1...d5 and are meant to differ. The first run
found seven beyond the three phase 42 had named, all closed at phase 43 by listing the
other course's move with an engine-checked answer.

2026-09-06, phase 44: **three rulings about Drill and one about settings.** Nick's, all
of them, after a day on 1.10.1.

**The board shows the answer.** A right answer leaves the piece on the square he moved it
to, and a wrong one puts his move back under the red arrow AND plays the repertoire move
on the board under the green one. The board used to redraw the card's own position after
any answer, so the piece jumped home and an arrow pointed after it. His reason: the
visual memory of the right position will serve him better than an arrow alone.

**The gap has a unit.** Minutes, hours or days, remembered, hours by default. FSRS works
its gap out in days as it always has and every field it computes is written down
untouched, `scheduled_days` included; the app applies that number in the chosen unit when
it writes the due date and nowhere else. Switching the unit back to days therefore costs
nothing, because the memory model was never told. The caveat, which the Help states: a
card answered again an hour later looks early to FSRS, which is exactly what it is, so
minutes and hours are for hammering a line today rather than for remembering it.

**Every Play and Drill setting is remembered between sessions**, which reverses two
earlier rulings recorded above. Phase 23 made "Include cards that are not due yet" a
one-sitting choice, on the reasoning that a box left ticked would make "due" mean
nothing; phase 33 made "Play the other side" a launch choice. Both are settings like any
other now, because a setting the app forgets is one Nick re-makes every day and he uses
the app every day. Play remembers its launch shape, the chapter it spars against PER
COURSE (a chapter id from another course means nothing), how long, how strong and the
other-side box; Drill remembers both boxes beside the scope and the gap unit. A remembered
chapter the course no longer has falls back to its first chapter, the way a remembered
course falls back to the first course. Three things are still not kept and none of them
is a setting: a play request, which belongs to a position; the side a recorded game was
played on, which belongs to the record; and the strength and length a RESUMED game
arrives with, which are shown on the launch options so the screen says what is about to
happen but are never written down. Gate 44 found that last one being remembered, so a
Play on from an old strong game replaced the strength every later game started from.
Picking a game up is not choosing a setting.

2026-09-06, phase 45: **two content rulings and one about the screen.** Nick's, after
the phase 43 gate notes recorded two things and left them.

**A line ends on the student's own move.** The Slav had ten leaves ending on White's,
because it predates the rule the newer courses were written to and nothing had ever said
the rule out loud. Fixed by adding the move each leaf's own plan already named, which the
engine agreed with in every case, and now held by a test.

**A course does not stop one move before another course's point.** The Najdorf's Alapin
line ended at 9...Bd7 where Nick's own Alapin course plays 10.Nxd7 and carries on. The
cross-course test of phase 43 excludes leaves on purpose, so nothing would ever have
caught it. The Najdorf reaches 11...e6 now, with White's moves taken from the Alapin
rather than invented.

**Auto step has a speed and it is the trainee's.** The gap was a fixed 850 ms; it is 2000
by default now, moved by Slower and Faster in half seconds between 500 and 5000, with the
gap on the screen beside them. The speed is remembered, which follows the phase 44 ruling
about settings; Study's PLACE stays in memory only, which is phase 40's, and the two are
different things.

2026-09-13, phase 46: **the live bar carries the number, which reverses half of the
phase 23 ruling.** That ruling let the bar in on condition it stayed a shape: "no
number, so it says which way the game is going and not by how much". Nick built Simply
Chess out of this app's code, gave its bar the number, played with it, and wants the same
here. His reason is the one that settles it: the live bar is read out of the corner of an
eye a hundred times a game, where a number is quicker than a phrase, and "clearly better"
covers a range he can see the inside of. **The report is untouched** and still speaks in
words, because it is read once, at the end, where a word is what the reader can act on.

The rest of phase 23 stands and is what keeps the original concern honest: the bar is the
engine's own view at full strength, and every value it shows is handed to the scan, so the
report cannot contradict the screen afterwards. The number is from White's point of view
like every other number in the app, which means it is made where the score is read and the
side to move is still known: a mate is reported from the side to move, and a sign worked
out later from a number that has forgotten its side is a sign that will one day be wrong.

2026-10-17, phase 47: **the app is called Tabiya.** Nick's, preparing to make the GitHub
repository public. A tabiya is the standard position an opening heads for, before play
diverges, which is what every chapter in every course teaches. The old name sat in a field
of near-identical descriptive titles, Chess Opening Trainer and Chess Opener and Chess
Prep Pro and ChessAtlas, and getting out of that field is the whole reason for the change.
The tagline is untouched: "Learn your openings by understanding them." still fits.

**Three identities, and only two of them move.** The app has three names, they are not
interchangeable, and that is the part worth writing down.

**The PRODUCT NAME changes.** It is the window title, the header, the Start menu entry,
the install folder and the installer's own filename, which Tauri's NSIS builds as
`<productName>_<version>_<arch>-setup.exe`. The executable inside the installer is named
by the Cargo package instead, so `tabiya.exe` comes from a second place and both have to
land.

**The DATA FOLDERS change, with a migration.** `<roaming>/Tabiya` and
`<local>/Tabiya Data`. This is where the trainee's progress lives, so the phase 15 rules
bind in full: a COPY, verified by reading it back and counting the learnt lines before the
new folder counts as live, the old folder left exactly as it was, and any failure blocking
saves rather than starting blank. `oldDataRoots()` is a chain now, newest first, and the
caller takes the newest generation that holds a progress file, so a trainee arriving from
either older folder is carried across and `migrate.ts` itself is unchanged.

**The TAURI IDENTIFIER does not change**, for the reason the correction in section 10
gives: nothing but `appDataDir()` reads it, nobody sees it, and changing it would add a
third generation of folder to migrate out of for no gain at all.

**The FOURTEEN `london-trainer.*` localStorage KEYS do not change either**, for the same
reason, and a comment at each of the three places they are declared now says so. Renaming
a key abandons its value rather than moving it, so a rename would reset every remembered
setting and, in a browser build, every learnt line.

**A second installed application appears, and it is expected.** NSIS keys its uninstall
entry on the product name, so installing Tabiya leaves "Repertoire Trainer" registered
beside it, exactly as "London Trainer" was left at phase 15. Nick uninstalls the old one
by hand, once. The installer hook that would do it for him is still in section 6's
register, with the reason it is still not taken.

**The window's profile moves with the local folder, and that costs the settings once.**
`localStorage` lives inside the WebView2 profile folder, and that folder is built from
`LOCAL_FOLDER`, so the theme and all twelve remembered Play and Drill settings start again
on the first run after the upgrade, however carefully their keys were left alone. Progress
does not: on the desktop it is a file in the roaming data folder and the migration carries
it. The Progress screen says both halves of that, and names both abandoned profile
folders so they can be deleted.

## 9. v1 acceptance

1. Study: all eight chapters open; every line steps through with notes, arrows and
   authored shapes; learnt toggles persist.
2. Drill: learnt lines generate deduplicated cards; a due queue exists; grading follows
   section 2 including authored mistake feedback; weak-area filter works; everything
   survives restart; export and import round-trip.
3. Play: all three launch shapes work at all lengths and strengths 1-8; the post-game
   report names the first deviation with the book note, handles the Black-left-book
   case, flags blunders, and speaks in words.
4. Progress: chapter completion, per-concept accuracy, and play stats render from real
   state.
5. Content: eight chapters at the section 3 quality bar, validator green.
6. Tests: vitest green over model, scheduler, play logic (engine mocked), and storage.
7. Ships: a Tauri-built installer produces a working windowed app on a clean Windows 11
   machine, with progress stored in AppData and importable from a browser-phase export.

## 10. v2: the course catalog

Ruled by Nick 2026-08-28 after docs/multi-opening-concept.md and a Q and A session
(every recommendation stood). This section governs the v2 work and wins over
sections 1-9 where they differ; those sections stay true within a single course.

### What a course is

One repertoire for one colour, as a folder of content files: a `course.json`
manifest plus chapter files in the existing format, which does not change. The
manifest carries the course id (globally unique - progress keys hang off it),
title, student colour, a one-line tagline, the chapter files in course order, a
format version (refused if newer than the app knows, the progress-file rule), and
any concept tags the course adds beyond the shared core set. The repo's content
moves to `courses/london-white/`.

The schema's colour rules generalise from White/Black to student/opponent, with
the student's colour read from the manifest: notes stay required on every move;
variant, tags and mistake entries sit on student moves; frequency weights sit on
opponent moves. Chapter and line ids gain the course id as a prefix. In a Black
course the opponent moves first, stems included, and Play mode's engine opens the
game.

### Course-scoped rules

- **Cards** are identified by course id plus position. Dedup and the
  different-moves-in-one-position conflict rule apply within a course; the same
  position taught by two courses is two cards, accepted because it means something
  different in each repertoire.
- **Weak-area statistics are per course.** Recall of one course's lines says
  nothing about another's, and pooling would let a strong course hide a weak one.
  Progress shows the rollup and the per-course figures.
- **Tag vocabulary**: a shared core (development, king-safety, bishop-placement,
  e4-break, c4-break, kingside-attack, dark-squares, h-file, tactics, endgame)
  plus per-course extensions declared in the manifest; the London's vs-something
  tags become its extensions. Validator-checked as now.
- **Progress** goes to version 4: line ids, card keys and play records carry
  course ids. The migration assigns everything existing to `london-white`, so
  nothing Nick has done is lost.

### Delivery: hybrid (ruled)

Built-in courses stay bundled and behind the test suite. The desktop app also
scans a `courses` folder under AppData at startup and merges external courses in,
validated at load by the same collect-every-error discipline: a failing course
appears in the catalog with its errors listed and loads nothing else, and an
external course cannot shadow a bundled course id. The browser dev build sees the
bundled set only. Adding an opening to the installed app means dropping a course
folder in and restarting - no source change, no rebuild. A course the app installs
itself, through the file picker of section 11, appears without one: the app knows it
wrote the folder, so it reads it again (phase 15). Courses authored in this
repo still pass the full quality bar (suite plus engine pass) before being handed
over as files.

### Navigation: catalog home (ruled)

A courses screen is the front door: one tile per course with colour, title,
progress and due counts. Opening a tile selects that course and goes to Study; a
header switcher jumps between courses and shows on every view.

**A course is always selected, and every mode works from the first click.**
Corrected at phase 22, the ruling dated 2026-09-02 in section 8. This section
used to say Study and Play open inside the selected course while Drill and
Progress sit at the top level because they span courses, and the app disabled
Study and Play until a course was chosen. The selected course is now resolved at
startup from what was remembered, falling back to the first visible course, so
there is never a moment with none; nothing is disabled and nothing has a tooltip
telling the trainee to open a course first.

**The drill queue is still one queue across all courses (ruled)**, due cards
interleaved under the existing ordering rules, each card naming its course. What
changed at phase 22 is that it is a remembered CHOICE rather than a rule: Drill
mixed is the default and is this ruling, Drill selected narrows to the course the
switcher names, and while mixed is chosen the switcher is greyed out on the Drill
screen so it cannot appear to name a course the queue is ignoring. That replaced
the per-course filter row, which was a second course selector beside the header's.

Progress shows the rollup across every course, and under it the detail for the ONE
course the header switcher names. **Corrected at phase 21**, the ruling dated
2026-09-02 in section 8: this said "the rollup and each course", and rendering
every course meant the switcher could say "The London System" while the page led
with the Caro-Kann. The rollup still spans every course; only what follows the
switcher changed.

### Name: Repertoire Trainer (ruled)

Display name, window title and installer name change; the Tauri identifier stays
`com.nick.london-trainer`, so progress stays exactly where it is. The identifier
is invisible and not worth a migration.

**Corrected at phase 7, against the machine.** The rest of that ruling assumed
the identifier also makes the installer update in place. It does not. Tauri's
NSIS installer keys its uninstall entry and its install folder on the PRODUCT
name, verified in the registry: the v1 install sits under
`HKCU\...\Uninstall\London Trainer` at `C:\Apps\London Trainer`, and there is
no key anywhere under the identifier. So the renamed installer registers a
second, separate application. Nothing is lost - progress lives in the
identifier's AppData folder and neither installer touches it - but Nick
uninstalls "London Trainer" once, by hand, or keeps two entries in Apps and
Features. The ruling stands; only the reasoning behind one clause was wrong.

**The folder moved at phase 15, and the identifier still did not.** "Progress stays
exactly where it is" held for three phases and then stopped being worth it: Nick opened
his data folder and found it called `com.nick.london-trainer` for an app called
Repertoire Trainer. So the app now builds its data folder from the user's roaming data
folder plus the literal name `Repertoire Trainer`, instead of calling `appDataDir()`,
which is Tauri's identifier folder. The identifier itself is unchanged, for the reason
the correction above found: NSIS keys the install on the product name and the identifier
is invisible, so changing it buys nothing. **Corrected at phase 47:** this sentence used
to end "and changing it once has already installed a second application beside the
first", which is wrong. The identifier has held one value since the Tauri commit and has
never changed. The second application came from the PRODUCT NAME change, as the phase 7
correction above says in the registry's own words. What changing the identifier would
actually cost is one more generation of folder for the migration to carry a trainee out
of. The move is a COPY, verified by reading it back
and counting the learnt lines before the new folder counts as live, and the old folder
is left exactly as it was for Nick to delete himself. A migration that deletes has one
chance to be right.

**Phase 17 finished what that move started.** Moving the folders left the uninstaller
offering to remove application data and then removing two abandoned folders, because
NSIS names them after the identifier and the identifier deliberately did not move. The
bundle now points at `src-tauri/installer-hooks.nsh`, which removes
`$APPDATA\Repertoire Trainer` and `$LOCALAPPDATA\Repertoire Trainer Data` under the
same guard the stock block uses: the box was ticked, AND this is not the uninstall an
upgrade runs on its way past. Without that second half a routine version bump would
delete the progress file, its marker and its backup copy at once. The folder names are
literals matching `DATA_FOLDER` in `src/storage/paths.ts` and `LOCAL_FOLDER` in
`src-tauri/src/lib.rs`, not `${PRODUCTNAME}`: the two strings are equal today by choice
rather than by construction, and a deletion that followed a renamed product would be a
deletion of the wrong folder.

**Phase 47 renamed those folders too**, to `$APPDATA\Tabiya` and
`$LOCALAPPDATA\Tabiya Data`, and the choice above is what made that safe. Each
uninstaller names the folders its own install wrote, so the "Repertoire Trainer" entry
left registered beside Tabiya removes the OLD folders, which are the copies the
migration left behind and are Nick's to delete anyway, and can reach nothing of
Tabiya's.

The macro is proved four ways by `scripts/check-uninstall-hook.mjs`, which compiles the
same macro text against scratch folders and runs each combination of the two variables.
A real install, uninstall and reinstall on Nick's own machine is NOT proved, and cannot
honestly be: the shipped hook names his live folders and no fixture can stand in for
them at those paths.

### The second course: the Caro-Kann (ruled)

Black against 1.e4, the London's closest relative in spirit and the proof that the
colour generalisation is real. Full section 3 quality bar, engine pass included,
authored to the same club depth with weights giving White's club-level choices.

### v2 acceptance

1. The London course behaves exactly as v1 did, and Nick's real progress file
   migrates in place with nothing lost.
2. The catalog shows every course with progress and due counts; Study and Play
   scope to a course; Drill is one cross-course queue with a per-course filter;
   Progress shows rollup and per-course figures. **This is what v2 was accepted
   against and it is left as it was.** Three of its clauses have since been
   superseded: the per-course filter row became the Drill mixed and Drill
   selected radios at phase 22, Progress shows the rollup plus ONE course since
   phase 21, and Study and Play no longer wait for a course to be chosen. The
   rulings are in section 8 under their dates.
3. A course folder dropped into the AppData courses folder appears in the catalog
   after a restart with no source change; an invalid one lists its errors and
   loads nothing else; a bundled id cannot be shadowed.
4. The Caro-Kann course meets the quality bar, engine pass included, and plays end
   to end with the engine opening the game.
5. Tests green throughout; the installer ships as Repertoire Trainer, and
   progress survives the change of name. The old "London Trainer" entry is
   uninstalled once by hand: see the correction above.

**All five accepted, 2026-08-29.** Items 1 to 4 were verified at review gates 6, 7
and 8. Item 5 closed the same day: Nick ran the Repertoire Trainer installer, clicked
through it, opened the app, and uninstalled the old "London Trainer" entry. That was
the last thing v2 owed a human, and it had been outstanding since phase 5 - three
phases of "nobody has clicked through the installer" are now answered.

**The third course tested the claim this section makes.** The Slav arrived at phase 9,
after v2 closed, and adding it took a course folder and a block of numbers in the
content suite. Not one line of source registers a course, because `src/content/index.ts`
picks up `courses/*/course.json` through Vite's glob, so the catalog, Study, Play, Drill
and Progress all found it without being told. That is the strongest evidence available
that the course model is data rather than code, short of Nick dropping a folder into
AppData himself, which phase 7 proved separately.

## 11. Course bundles: one file, written by chess players

Ruled 2026-08-30 after a Q and A. `docs/course-bundles-concept.md` records the
reasoning and the options not taken; this section is normative. Sections 1-10 stay
true. Phase 7 already loads courses from a folder under AppData: this section makes a
course **one shareable file that a chess player can author, and adds a way to get one
out of the app.**

### The bundle is a PGN file (ruled)

One `.pgn` per course, chapters as separate games in it, in course order. PGN with
variations is what every chess GUI writes, so the authoring tool is one the audience
already owns: build the repertoire in a Lichess study or any chess program, export,
import. There is no bespoke syntax for moves, tree structure or prose.

**A PGN parser is ours to write.** chess.js's `loadPgn` silently discards variations,
verified at design time - a sideline vanished with no error. A repertoire is a tree,
so its parser must keep variations, comments and glyphs. It is pure and testable, and
it is the only real engineering in this section.

Mapping, in both directions:

| Course concept | PGN |
|---|---|
| Course id, title, student colour, tagline, format version, tag extensions | Header tags `[CourseId]`, `[CourseTitle]`, `[StudentColour]`, `[Tagline]`, `[FormatVersion]`, `[TagExtensions]`, repeated on every game so an extracted chapter still identifies its course; they must agree, and disagreement is an error |
| Chapter id, title | `[ChapterId]`, `[ChapterTitle]` per game. The id becomes a filename when a bundle is installed, so it is held to the same shape as a course id |
| Chapter order | Game order in the file |
| Chapter intro | The comment before the first move |
| Chapter `defaultTags` | `[DefaultTags "development"]` (added at gate 11: all three courses use the field, and without it no course survives its own format) |
| Node `variant` | `[%variant classical]` (added at gate 11: no course uses it yet, but the schema holds it, so the format carries it) |
| Stem | The moves before the tree branches |
| Note | A `{comment}` after the move |
| Concept tags | `[%tags development king-safety]` inside a comment |
| Opponent frequency weight | `[%weight 7]` |
| Leaf plan | `[%plan ...]` |
| Line name (on the leaf) | `[%line The Nh5 trade]` |
| Study highlights (`shapes`) | `[%cal Gc1f4]` and `[%csl Gd4]`, the format Lichess already writes |
| Mistake entry and its grade | A variation whose move carries a glyph: `!?` playable, `?!` inaccuracy, `?` mistake |
| A genuine alternative line | A variation with no glyph |

A glyphed variation is a mistake entry and carries no continuation, because the
schema has nowhere to put one. A continuation after a glyphed move is an error naming
the fix: put the refutation in the comment. Every token is optional; a PGN with
nothing but moves and comments is a valid course.

Prose lives in PGN comments, so a `{` or `}` in a note is an error with a clear
message rather than a silent truncation.

### Import and export

**Import** takes a `.pgn`, parses it, validates it through the existing course loader,
and compiles it into the folder shape under AppData that phase 7 already loads. The
catalog, the merge rules and the shadowing checks are untouched. A file that fails
validation is refused with every error listed, and nothing is written.

**Export** goes the other way from any loaded course, built-in or added, so the London
can be exported and edited in a chess GUI like anything else. Import of an export must
reproduce the course exactly: that round trip is the test keeping parser and writer
honest at once.

### Importing over a course already installed (ruled)

Progress hangs off the course id and a line id carries its own moves, so replacing a
course can orphan learnt lines. Before writing anything, the app loads the incoming
course, counts how many of the trainee's learnt lines still resolve against it, and
says so - "replacing this keeps 7 of your 9 learnt lines" - then asks. Cancel writes
nothing. This is the check gate 10 relied on, put in front of the trainee.

### Community content

Bundles are files. There is no registry, no signing and no ratings: those are a
distribution product, and this is an offline single-user app.

- **Imported courses are validated strictly, and are not held to the numeric quality
  bar.** Legality, schema, the tag vocabulary and the shadowing rules all apply. The
  section 3 bar - ten mistake entries a chapter, depth to move ten, the
  typical-mistakes section - governs courses shipped in this repo, and already does,
  because `content.test.ts` reads the bundled set only.
- **Course prose renders links as plain text.** `react-markdown` already blocks raw
  HTML, so a bundle cannot inject script, but a markdown link would navigate the Tauri
  window itself. An opening note has no need of a hyperlink.
- The author documentation states plainly that a bundle is code-free data, what the
  app checks, and that a bundle should be treated like any other downloaded file.

### Documentation

`docs/authoring-a-course.md`, written for a chess player and not a programmer: build
it in a study, one chapter per study chapter, how to mark an alternative with a glyph,
the comment tokens, what the app checks and what it refuses, and how to send it
to somebody. The Ruy Lopez bundle is its worked example.

### The bundle that proves it: the Ruy Lopez, Exchange Variation (ruled)

4.Bxc6 dxc6, as White against 1...e5. The lowest-theory serious Ruy, with a clear
structural plan around the healthy pawn majority, chosen over the Closed with d3 and
the full classical Ruy, which is several phases of content. Authored in this repo to
the full section 3 bar with both engine passes and the note checker, then exported as
`docs/bundles/ruy-lopez-exchange.pgn` as the reference bundle and the documentation's
worked example.

### Section 11 acceptance

1. A PGN with variations, comments and glyphs parses into a course, and a course
   exports to a PGN that parses back into an identical course.
2. Import from the app installs a course that appears in the catalog straight away,
   with no reinstall and no source change. It asked for a restart until phase 15,
   which found the restart was never needed: a course that has just arrived has no
   learnt lines, so it cannot change a running drill queue.
3. Importing over an installed course reports how many learnt lines survive and does
   nothing at all if cancelled.
4. A malformed or invalid bundle is refused with its errors listed and writes nothing.
5. `docs/authoring-a-course.md` takes a chess player from a study to an installed
   course, with the Ruy Lopez bundle as its worked example.
6. The Ruy Lopez meets the section 3 bar, and the reference bundle round-trips.
