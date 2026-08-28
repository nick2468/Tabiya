# London Trainer - specification

v1.0, 2026-08-27. The authoritative build document. It supersedes BRIEF.md (kept for
history) and folds in the review of four external briefs in `chips/` (ChatGPT, Copilot,
Gemini, Grok) plus Nick's rulings, all dated 2026-08-27 in section 8. The build follows
PLAN.md; where the two disagree, SPEC.md wins.

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

One JSON file per chapter in `content/`. The normative schema lives in
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
`src/ui` (React), `content/` (chapter JSON). Vitest covers the pure modules; the UI is
verified by use.

Implementation guidance, not contract: strength scale 1-8 maps the top levels to
UCI_LimitStrength (UCI_Elo floors around 1320), and below that picks semi-randomly
among MultiPV candidates with capped movetime. Blunder scan at fixed effort; verdict
buckets roughly: under 0.4 pawns equal, to 1.0 slightly better, to 2.5 clearly better,
beyond winning. Calibrate by feel at review.

UI: dark theme default, light toggle. Australian English. Plain hyphens, never em
dashes, in every file including JSON prose.

## 6. Out of scope for v1, and the deferred register

Not in v1: other openings and the classical move order (the data model allows both),
a Black repertoire, online play, accounts or sync, mobile, video.

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
- **Classical move order content** (2.Nf3 first): schema-ready; author when wanted.

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
