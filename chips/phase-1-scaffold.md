# Chip: phase 1 - scaffold, board, content model, chapters 0-2 (superseded)

**Superseded 2026-08-27 by SPEC.md + PLAN.md phase 1** - the schema grew tags, mistake
entries and shapes at spec time. Kept for history; do not execute this chip.

You are the builder for phase 1 of London Trainer. Work in `C:\Users\nick2\Code\London`,
directly on `main`. No worktree. This chip is self-contained; read `BRIEF.md` once for
orientation. Where this chip and BRIEF.md disagree, BRIEF.md wins - record the conflict
in your commit body and continue.

Tick the checkboxes in "Order of work" as you complete each step. Nick follows progress
from them while you run.

## Compressed context

London Trainer teaches Nick (a club improver) to play the London System as White. The
London System is a White setup after 1.d4: bishop to f4, pawns c3-d4-e3, nearly the same
placement against most Black replies. The app will have four modes: Study (guided
repertoire browsing), Drill (spaced repetition), Play (steered games against Stockfish),
Progress. It is a React + TypeScript + Vite app now and gets wrapped with Tauri in
phase 5. Phase 1 builds the foundation: project scaffold, a working board, the content
data model with a validating loader, and drafted content for chapters 0-2.

## Settled decisions binding this phase

- Stack: Vite + React + TypeScript, tests in vitest. Latest stable versions. Verify
  node is present (`node --version`) before scaffolding.
- Board: chessground, the lichess board widget. It is framework-agnostic, so write a
  thin React wrapper component. It needs its own CSS and piece-set assets imported from
  the package - budget that into the wrapper work. Fallback rule under Escalation.
- Rules: chess.js for legality, SAN parsing, and FEN. SAN is standard algebraic
  notation for a move (like Bf4). FEN is a one-line text code for a position.
- Content is data: one JSON file per chapter in `content/`. Schema below.
- Move order: modern (1.d4 d5 2.Bf4, and 1...Nf6 2.Bf4). The schema supports a future
  classical move order through the variant tag, but all v1 content uses only "modern".
- Not in this phase: Tauri, Rust, any engine, PGN, Study navigation UI, arrows, drills,
  persistence of user state, chapters 3-7.

## Content schema

Materialize this as `docs/content-schema.md` in your first model commit, then follow
that file. While drafting content you may refine details - record each change there
with one line of why.

Chapter file: `{ id, title, intro, stem, tree }`.

- `id`: string, like `ch2-c5-qb6`. `title`: display name. `intro`: markdown prose.
- `stem`: SAN array from the initial position to where the chapter starts, for example
  `["d4", "d5", "Bf4", "c5"]`.
- `tree`: array of nodes. Node: `{ san, note?, variant?, weight?, plan?, children? }`.
  Sibling nodes are the alternatives at that point.

Whose move a node is falls out of depth: ply = stem length + depth from tree root,
White when ply is even. Node rules, enforced by the validator:

1. Every `san` must be legal from its parent position (walk the tree with chess.js).
2. Every White node carries `note`: 1-3 plain sentences, the idea or the plan. Black
   nodes may carry one when the idea matters.
3. At any position, sibling White nodes must carry distinct `variant` tags. `variant`
   defaults to "modern", so in v1 that means at most one White move per position.
4. `weight` only on Black nodes: integer 1-10, your estimate of club-level frequency,
   default 1. These later drive Play mode's steering.
5. Every leaf node carries `plan`: 1-3 sentences on how White continues from there.

The loader computes the FEN for every node during the legality walk and exposes the
tree with FEN attached. Keep the loader pure TypeScript with no React in it - Drill and
Play modes will consume it later.

## Chapters to draft

Depth bar from the brief: main lines to about move 10-12, sidelines to move 6-8. Write
notes for a club improver: plans and ideas in plain English, not engine variations.

- `ch0` "The system". Concept-first: intro of 300-500 words covering the pawn triangle,
  where every piece belongs, the h3 escape square, the standard attacking setup (Bd3,
  Ne5, f4 ideas), and when to break the routine. Small tree: the ideal setup sequence
  against a generic ...d5/...e6 defence.
- `ch1` "Classical Black": ...d5 with ...e6 setups, including ...Bd6 offering the
  bishop trade.
- `ch2` "The ...c5 and ...Qb6 lines": the critical chapter. Cover the early ...Qb6 hit
  on b2 with one sound club-level answer, and the main ...c5 handling. This chapter
  gets an engine sanity pass in phase 4; today, legality validation only.

Decision rule for theory forks: where two repertoire choices are both sound, pick the
one needing less memorisation, and note the rejected one in a single sentence in the
relevant `note`. If a fork has real consequences you cannot judge, stop that line,
record it under "Open items" at the bottom of this file, and continue elsewhere.

## UI for this phase - minimal on purpose

One page: the board, playable with legality enforcement (illegal moves rejected), and a
content status panel listing each chapter with title, node count, deepest line in full
moves, and validation PASS or FAIL with the first error. No other navigation.

## Order of work

- [ ] 1. `git init` on branch main; .gitignore for node/Vite; first commit: BRIEF.md,
  chips/, docs/ as they stand.
- [ ] 2. Scaffold Vite + React + TS; wire vitest; commit.
- [ ] 3. chess.js plus the chessground wrapper; playable board; commit.
- [ ] 4. `docs/content-schema.md`, the types, the loader/validator, and its tests -
  including negative fixtures (illegal SAN, missing leaf plan, duplicate White siblings
  in the same variant, weight on a White node); commit.
- [ ] 5. Draft ch0, ch1, ch2; validator green on each; status panel; one commit per
  chapter.

## Acceptance

1. `npm run dev` from the repo root serves the page; the board is playable and rejects
   illegal moves.
2. The three chapter files pass validation. ch1 and ch2 main lines reach move 10-12,
   every leaf has a plan, every White move has a note, ch0's intro is 300-500 words.
3. vitest is green, including the negative validator tests.
4. The status panel shows all three chapters with PASS.
5. History: docs-first commit, then scaffold, board, model, and per-chapter commits,
   each with the trailer below.

## Conventions

- Plain hyphens only, never em dashes, in every file including JSON prose.
- Australian English in prose and UI copy.
- Commit messages: short imperative subject, body only when the change is not obvious.
  PowerShell 5.1 mangles some multi-line messages - write the message to a scratch file
  and use `git commit -F` when in doubt.
- End every commit message with the trailer naming the actual model, for example:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- Do not push; no remote exists. Stop the dev server before finishing.

## Escalation

- chessground: if the React wrapper fights you for more than about an hour or hits a
  blocking incompatibility, switch to react-chessboard (MIT licence), and record the
  swap with its why in BRIEF.md section 4.
- Anything needing a ruling from Nick: stop that thread, record it under "Open items"
  below, and continue with the rest.

## Open items

(none yet - the builder appends here)
