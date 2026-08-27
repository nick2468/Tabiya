# London Trainer - initial brief (superseded)

Superseded 2026-08-27 by SPEC.md and PLAN.md, which fold in Nick's rulings and the
review of the four external briefs in chips/. Kept for history; do not build from
this. The v0.3 text follows unchanged.

## 1. What this is

A Windows desktop app that teaches one person (Nick) to play the London System as White
and to get good at it. The London System is a White setup after 1.d4: bishop to f4, pawns
on c3-d4-e3, and nearly the same piece placement against most Black replies. That makes it
ideal for a trainer app: the content is one repertoire tree, not an open-ended theory dump.

"Get good" means three abilities, and the app trains each one:

1. Know the moves. Recall the repertoire line against every common Black setup.
2. Know the plans. Understand the typical middlegame ideas, not just memorised moves.
3. Play it under pressure. Convert that knowledge in full games against an opponent.

## 2. The four modes

- **Study**: browse the repertoire tree chapter by chapter. Board, arrows, and a short
  prose note on every move: the idea, the plan, the common mistake. Guided walkthroughs.
- **Drill**: spaced repetition on lines already studied. Spaced repetition means reviewing
  each item at growing intervals, timed to just before you would forget it. The app shows a
  position, Nick plays the repertoire move on the board, the app grades and reschedules it.
- **Play**: full games as White against Stockfish (the strongest open-source engine) at an
  adjustable strength. While the game stays inside the repertoire, the app picks Black's
  moves from the repertoire tree itself, weighted by real-world frequency, so games steer
  into the structures being trained. The engine takes over once the game leaves the tree.
  After each game: a report showing where the game left the repertoire, what the book move
  was and why, plus a quick blunder scan.
- **Progress**: which lines are learnt, which are due for review, which keep failing.

## 3. Content scope (the chapters)

Club-level depth: main lines to about move 10-12, sidelines to move 6-8, and every line
ends with a "your plan from here" note. The repertoire uses the modern move order 1.d4 d5
2.Bf4 (and 1...Nf6 2.Bf4). Ruled 2026-08-27. The classical order (2.Nf3 first, then 3.Bf4)
is a likely later extension. So the tree format must allow a second White move at a node,
tagged by a named move-order variant, even though v1 ships only the modern lines.

0. **The system**: the pawn triangle, where every piece belongs, the h3 escape square,
   the standard attacking setup (Bd3, Ne5, f4), and when to break the routine.
1. **Classical Black**: ...d5 with ...e6, including ...Bd6 offering the bishop trade.
2. **The ...c5 and ...Qb6 lines**: the critical test. Black hits b2 early and White must
   know the answer cold. This chapter gets the most drill weight.
3. **King's Indian setups**: ...Nf6, ...g6 and ...d6 without ...d5.
4. **Grunfeld setups**: ...g6 together with ...d5.
5. **Harassment tries**: early ...Nh5 hunting the bishop, early ...Bf5, ...Ne4 lunges.
6. **Everything else**: the Dutch (...f5), ...b6 systems, odd first moves. One safe recipe each.
7. **Typical tactics and plans**: the Bxh7+ Greek gift sacrifice, Ne5 themes, the e5
   outpost, plus a short list of model games (Kamsky is the reference London player).

Content is data, not code: one JSON file per chapter in `content/`, holding a move tree
with prose per node and frequency weights for Black's replies (the weights also drive Play
mode's steering). Claude drafts the content; it is sound at club level, but the chapter 2
tactical lines get engine-checked during authoring, and Nick spot-checks against his own
sources. PGN import/export (PGN is the standard text format for chess games) comes later.

## 4. Settled technical decisions

| Decision | Choice | Why |
|---|---|---|
| Core stack | React + TypeScript + Vite, tests in vitest | Same stack as dc.web, so zero relearning. The chess ecosystem is JavaScript-first. |
| Windows wrapper | Tauri 2, added in the final phase | Ruled 2026-08-27. A small native .exe on WebView2 (the web view built into Windows 11), and progress moves from browser storage to AppData files. The app runs in the browser until that phase. |
| Board widget | chessground (the lichess.org board) | Best-in-class feel, built-in arrows and highlights, which Study mode needs. |
| Rules and moves | chess.js | Legal move generation, FEN and PGN handling, well-worn. FEN is a one-line text code for a position; positions key the drill cards. |
| Engine | Stockfish WASM in a web worker, talking UCI (the standard engine protocol) | No native binary needed until the Tauri wrap, and it is far stronger than any training opponent needs. |
| Drill scheduler | ts-fsrs | FSRS (Free Spaced Repetition Scheduler) is the modern algorithm, and ts-fsrs is a small MIT library. No reason to hand-roll SM-2. |
| Persistence | One JSON blob in localStorage, with a manual export button; move to app-data files when Tauri lands | Progress data is tiny. The export button protects it from day one. |

Licence note: chessground and Stockfish are GPL. Fine for a personal tool. If the app is
ever distributed, either it goes GPL too or those two components get swapped.

## 5. v1 scope and acceptance

v1 is done when:

1. Study: every chapter opens, and every line can be stepped through with arrows and notes.
2. Drill: studied lines generate cards; a daily due queue exists; grading reschedules;
   all of it survives an app restart.
3. Play: a full game against the engine at a chosen strength, with Black steered by the
   repertoire weights while in book. The post-game report names the first move that left
   the repertoire, shows the book move with its note, and flags blunders.
4. It runs as a windowed Windows app from a built .exe on a clean Windows 11 machine.
5. Tests are green for the pure logic: tree operations, card scheduling, deviation
   detection, and book steering, with the engine mocked.

Out of scope for v1: other openings and the classical move order (the data model must
allow both, but only the modern London ships), a Black repertoire, online play, accounts
or sync, importing
Nick's online games for deviation analysis (strong v2 candidate), deep engine analysis
boards, mobile.

## 6. Risks, named early

- **Engine steering** is the one novel design piece. The book-until-exit design above
  removes most of the risk; it needs tests, not research.
- **Weak levels**: Stockfish's rating limiter bottoms out around 1320. For weaker
  opponents the app must pick semi-randomly among the engine's top few candidate moves
  (MultiPV mode) instead. Known technique, small effort.
- **Content correctness** is the real quality bar. The mitigations in section 3 stand,
  and chapter content ships incrementally so errors surface while studying, not after.

## 7. Build phases

Each phase lands working and tested before the next starts.

1. **Scaffold**: repo init, Vite + React + TS + vitest, board on screen, chess.js wired,
   the move-tree data model with loader and tests. Chapters 0-2 drafted.
2. **Study mode** complete for the drafted chapters.
3. **Drill mode**: cards, queue, grading, persistence, export button.
4. **Play mode**: engine worker, strength levels, steering, post-game report. Remaining
   chapters drafted.
5. **Wrap and polish**: Tauri build and installer, progress storage moved to AppData
   files, Progress view, first full self-review.

## 8. Rulings

All ruled by Nick, 2026-08-27:

1. **Level and goal**: club improver, wanting a reliable lifetime White opening. The
   chapter depth in section 3 stands.
2. **Move order**: the modern 2.Bf4. The classical 2.Nf3-then-3.Bf4 order is a planned
   later extension. Section 3 carries the data-model consequence.
3. **Wrapper**: Tauri, after a chat comparison against Electron and browser-only.
   Consequences: a one-time Rust toolchain install lands in phase 5, and progress
   storage moves from browser storage to AppData files at the wrap.
