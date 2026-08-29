# London Trainer - specification

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
tags have the lowest rolling accuracy.

### Play

Full or partial games as White against Stockfish, in three launch shapes:

- **Any defence**: while the game is inside the repertoire tree, Black's moves come
  from the tree's frequency weights, so games land in trained structures with realistic
  variety. The engine takes over on book exit.
- **This chapter's defence**: the same, restricted to one chapter's branches. Sparring
  against a specific setup, for example the King's Indian.
- **From here**: launched from any Study position; the engine plays Black immediately.

Options: game length (to move 10, to move 15, or full game) and strength (a 1-8 scale;
implementation in section 5). No evaluation bar during play - it is a crutch. After the
game or segment, a report:

- The first White move that left the repertoire, with the book move and its note. If
  Black left book first, the report says from which move it was "just chess".
- A blunder scan of White's moves at fixed engine effort.
- Verdicts in words ("clearly better for White"), never bare numbers. The eval bar is
  allowed here, in review, only.

### Progress

Per-chapter completion (lines learnt / lines total), due-card counts, per-concept
accuracy (by tag, rolling window), and play stats (games per chapter, deviation rate).
Plain numbers, no badges. Export and import buttons for the whole progress state (also
the migration path when the Tauri wrap changes where state lives).

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
pure modules; the UI is verified by use.

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
those arrived in v2: the Caro-Kann shipped at phase 8 and is a Black repertoire.

Deferred with reasons (the register; a later phase working nearby may take one along):

- **Plan quizzes** (multiple-choice "find the plan"): ruled 2026-08-27 to keep v1 to
  graded drills + weak areas. Natural v2 on top of the tags machinery.
- **PGN import/export**: ruled 2026-08-27; content is Claude-drafted, so the importer
  earns nothing yet. Export becomes interesting for sharing; import for own-game
  analysis below.
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
  and Features.
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
- **A gap in the London course, found from the other side**: the Slav's chapter 5
  answers 5.c3 Qb6 6.Qb3 with 6...c4, and the London course's chapter 2 covers only
  6...Qxb3. That is a hole in White's preparation rather than an error in it, and the
  phase 9 chip put both other courses out of scope, so it was not touched. Whoever
  works on the London next should add the branch: a trainee who plays both sides of
  this repertoire will meet it. Recorded at phase 9.

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
folder in and restarting - no source change, no rebuild. Courses authored in this
repo still pass the full quality bar (suite plus engine pass) before being handed
over as files.

### Navigation: catalog home (ruled)

A courses screen is the front door: one tile per course with colour, title,
progress and due counts, plus overall numbers. Study and Play open inside the
selected course; a header switcher jumps between courses. Drill and Progress sit
at the top level because they span courses: **the drill queue is one queue across
all courses (ruled)**, due cards interleaved under the existing ordering rules,
each card naming its course, with a per-course filter for deliberate practice.
Progress shows the rollup and each course.

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

### The second course: the Caro-Kann (ruled)

Black against 1.e4, the London's closest relative in spirit and the proof that the
colour generalisation is real. Full section 3 quality bar, engine pass included,
authored to the same club depth with weights giving White's club-level choices.

### v2 acceptance

1. The London course behaves exactly as v1 did, and Nick's real progress file
   migrates in place with nothing lost.
2. The catalog shows every course with progress and due counts; Study and Play
   scope to a course; Drill is one cross-course queue with a per-course filter;
   Progress shows rollup and per-course figures.
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
