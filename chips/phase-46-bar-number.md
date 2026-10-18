# Chip: phase 46 - the number on the live evaluation bar

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md section 2 (Play), section 5 (the verdict bands), section 8 (the rulings
log), `src/play/evalbar.ts` and its test, `src/ui/Play.tsx` (`LiveEvalBar`),
`src/ui/play.css` (`.live-eval`, `.live-eval-white`, `.play-board`, `.play-controls`),
`src/engine/uci.ts` (`Score`, `whitePovPawns`) and `src/ui/play-context.tsx`
(`evaluate`) before starting.

Nick, 2026-09-13, after building Simply Chess (`C:\Users\nick2\Code\SimpleChess`),
whose bar carries the engine's number: **the trainer's bar gets the same number.** The
report keeps its words. One small screen change; version 1.10.4.

## The ruling, and what it reverses

SPEC.md section 2 says the live bar "carries no number" and that verdicts are words,
never bare numbers, and the phase 23 notes say the bar is "a shape, with the same words
as its accessible name". Nick reverses the first half: the bar shows the evaluation as
a number. The report is untouched and still speaks in words. Record the reversal in
SPEC section 8 with the date and the reason (he used the sibling app's bar and wants
the same here), and amend section 2's sentence.

## What Simply Chess built, which this copies back

Simply Chess is the trainer's code copied the other way; these files are the origin
for this chip, and they are the trainer's own shape with the number added. Read them
in `C:\Users\nick2\Code\SimpleChess`:

- `src/play/evalbar.ts`: `Evaluation { pawns, text }`, `evaluationOf(score,
  sideToMove)`, `evalText(score, sideToMove)`, `numberPlacement(layout)`, and the
  trainer's own `evalShare`, `evalBarLayout`, `shownEvaluation` returning the entry.
- `src/play/evalbar.test.ts`: the number's tests (`+0.4`, `-1.2`, `0.0`, never
  `-0.0`, `M5`, `-M5`, `M0` with its sign, the four placement cases).
- `src/ui/EvalBar.tsx`: `LiveEvalBar` with the `span.live-eval-number` in the larger
  share at that share's outer end, coloured in the other piece colour.
- `src/ui/play.css`: `.live-eval` at 24 px (the trainer's is 16), `.live-eval-number`,
  `.at-top`, `.at-bottom`, `.on-white`, `.on-black`, and `.play-board`'s gap at 20 (the
  trainer's is 28) so the button row's 44 px inset is unchanged.

## The work

- [ ] 46.1 `src/play/evalbar.ts`: the evaluation map's value becomes `{ pawns, text }`,
  built by `evaluationOf(score, sideToMove)` where the provider's `evaluate` and
  `scanGame` make entries; `evalText` and `numberPlacement` as in Simply Chess, text
  identical. Everything that reads a number from the map (`shownEvaluation`'s
  callers, `scanForSlips`, `buildReport`, the report's `finalEval`, the record's
  `finalEval`) reads `.pawns`. The `Evaluations` type in `report.ts` changes with it.
  **The stored record keeps a number** (`PlayRecord.finalEval`), so nothing on disk
  changes and no migration is needed; say so in the notes.
- [ ] 46.2 `LiveEvalBar` in `Play.tsx` renders the number as Simply Chess's does. The
  accessible name becomes `Evaluation: +0.4`; the words stay on the report's bar and
  everywhere else.
- [ ] 46.3 `play.css`: the bar 24 px wide, the gap 20 px, the number's rules, the
  colours through `--piece-white` and `--piece-black` only.
- [ ] 46.4 Tests: Simply Chess's number and placement tests copied into
  `evalbar.test.ts`; `play-game.dom.test.tsx` reads the bar's text after a move with
  a fake engine at `cp: 40` (`-0.4` with Black to move, `+0.4` after the reply); the
  help test's wording for the bar, if it names it, updated.
- [ ] 46.5 SPEC.md: section 2's sentence, section 8's ruling with the reason, and the
  phase 23 note left as history. PLAN.md: this phase. Version 1.10.4 in the three
  files.
- [ ] 46.6 Proved in the browser build at 1400 by 980, both themes, a White game and
  a Black game (the number's end and colour follow the orientation), the bar,
  `.board` and `cg-board` still ending on the same pixel.

## Decision rules

- **A number that would be printed across the join** between the two colours: the
  placement rule puts it at the larger share's outer end, so it cannot. If it does,
  the share is being read from the wrong end; fix `numberPlacement`'s caller.
- **`M0`**: Stockfish sends `mate 0` only for a finished position without a `pv`, so
  it never reaches the bar; the text rule handles it anyway, as Simply Chess's does.
- **The report's own bar** (`EvalBar`, horizontal) stays as it is: words above it,
  no number. That is not this chip's to change.

## Three small faults found by copying this code, to fix in the same phase

Simply Chess is this app's code copied the other way, and copying it found three
things wrong here. Each is a few lines. Take them with 46.1 to 46.6, each as its own
commit so a bisect can tell them apart.

- [ ] 46.7 **`gameToPgn` says a checkmate twice.** Its closing comment is
  `[report.verdict]` and then `report.outcome`. For a mated game those are the same
  string, because a mated position has no evaluation and `buildReport` takes the
  outcome as the verdict, so the file reads "You won by checkmate. You won by
  checkmate. White was played by you at level 4." Push the outcome only when it is not
  already the verdict, and add a test that a mated game's closing comment says it
  once. Found 2026-09-13 in Simply Chess phase 10, which fixed its own copy.
- [ ] 46.8 **`src/version.test.ts` compiles by accident.** It imports `node:fs`, but
  `tsconfig.app.json` loads only `vite/client` types; it type-checks only because
  `src/storage/blank-start-real.test.ts` carries a `/// <reference types="node" />`
  that pulls node types into the whole program. Copied on its own it fails with
  TS2591. Put the same triple-slash line at the top of `version.test.ts` and of
  `installer-hook.test.ts`, which has the same hidden dependency. Found 2026-09-11 in
  Simply Chess phase 0.
- [ ] 46.9 **`whitePovPawns` reads `mate 0` as a win for the side to move.** It tests
  `score.moves >= 0`, and `mate 0` means the side to move is ALREADY mated, so the
  mate belongs to the other side. It should be `moves > 0`. Harmless today, because
  Stockfish sends `mate 0` only for a finished position with no `pv` and
  `StockfishEngine.search` keeps only lines that have one, so no candidate ever
  carries it; fix it anyway, because 46.1 puts a number on the bar and the sign is now
  something a person reads. Found 2026-09-12 in Simply Chess phase 1.

## Out of scope

Anything else on the Play screen; the report; the record; Simply Chess itself.

## Acceptance

The bar shows the number at the right end in the right colour for both orientations;
`evalbar.test.ts` holds the number's cases; the suite green under twenty seconds and
`tsc -b` clean; SPEC and PLAN say what changed and why; 1.10.4 in the three files;
proved at 1400 by 980 in both themes.

## Conventions

The trainer's: tick the plan as you go, the phase notes with measurements, the reuse
review before the commit (the likely find: a second FEN side split; `sideToMove` in
`position.ts` is the home), one commit at least on `main`, `Co-Authored-By` naming the
model you are, no em dashes under `src/`, Nick's own files not listed or reported.
