# Chip: phase 29 - a test rig that can play a game

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md section 6 (the register), PLAN.md phases 22 to 28, `vite.config.ts`,
`src/ui/play-context.tsx`, `App.tsx`, `Play.tsx`, `Progress.tsx`, `src/play/play.test.ts`
(the fake engine), `src/ui/help.test.ts` and `selection.test.ts` before starting.

Three phases running, a bug in the game provider passed every test and was found only by
playing in the browser: phase 25's fresh `at` on every review, phase 27's identity
breaking a second way, and phase 27's replay rewriting the record. Every one lived in
`play-context.tsx`, which the suite cannot reach because it needs a DOM and an engine.
Nick ruled on 2026-09-04 to spend a phase on the rig. **No chess content, no user-visible
change, no version bump, no build.**

## The work

### 29.1 A DOM environment for the tests that need one

- [ ] **Add `jsdom`, `@testing-library/react` and `@testing-library/user-event` as dev
  dependencies**, pinned to exact versions in `package.json`, and record in the commit
  which versions and why those. Keep every existing test as it is: they render to a
  string and are fast; that is the right shape for what they check. New DOM tests are
  `src/**/*.dom.test.tsx`, and `vite.config.ts` gives ONLY that glob the jsdom
  environment (`environmentMatchGlobs`, or a second project in the vitest config; say
  which and why). `npx vitest run` runs both kinds in one go and stays under ten seconds.
- [ ] **The engine is injected into the provider, not constructed inside it.**
  `play-context.tsx` does `new StockfishEngine()` at one place; `PlayProvider` takes an
  optional `createEngine` prop that defaults to that, and the tests pass the fake engine
  `play.test.ts` already has, moved to `src/test/fake-engine.ts` so both can import it.
  This is not a test-only prop in the sense the phase 22 register rejected: the session
  already takes its engine injected for exactly this reason, and the provider is the
  one place that had not been given the same seam.

### 29.2 The three bugs, as tests that would have caught them

Each of these renders `App` (or `Shell` under real providers with the fake engine),
drives it through the DOM the way a person does, and asserts on what a person would
see and on the stored history. Write each one FIRST against the commit before its fix
(`git stash` the fix, or check the failing behaviour by temporarily reintroducing it),
show it red, then green on main. Say in the commit which behaviour it pins.

- [ ] **Undo moves the screen.** Start a game, play a move, wait for the reply, press
  Undo: the move list shows one move and the board's last-move highlight is gone. Phase
  23's memoised provider value would fail this.
- [ ] **One game, one record.** Start, play, Stop and review, Keep playing, play,
  review again: the history holds one record with the longer count and one `at`. Then
  Play on from Progress, play, review: still one. Phase 25's fresh `at` and phase 27's
  stale closure would both fail this.
- [ ] **A replay changes nothing.** Review a game, note the record, Replay it from
  Progress, wait for the report: the record is identical. Phase 27's re-scan write
  would fail this.

### 29.3 The register items this rig was recorded against

- [ ] **The greyed course switcher on Drill mixed** (phase 22): click Drill with the
  mixed radio chosen and assert the switcher is disabled with its title; click Drill
  selected and assert it is live. Remove the entry from SPEC section 6 and say it was
  closed at phase 29.
- [ ] **A view change is not driven by any test** (phase 23): start a game, click Study,
  click Play, assert the move list still holds the game. Close that entry the same way.
- [ ] **The Progress screen with a real record** (phase 25's Play on test needed a state
  with one such record): render Progress with a seeded history and click Play on; assert
  the Play screen's "From your game" radio is checked. Note it in the register entry's
  closure; it has no entry of its own.
- [ ] Read the rest of section 6 and close anything else the rig now covers, naming it.

### 29.4 What the rig must not become

- [ ] **No snapshot tests.** A snapshot is a test that fails when anything changes and
  passes when nothing does, which is the opposite of what the last three phases needed.
  Every assertion names the thing a person would notice.
- [ ] **No test waits on real time.** The fake engine answers at once; `user-event`
  drives clicks; `findBy` queries wait for React, not for a timer. If a test needs
  `setTimeout`, say why in a comment or do not write it.
- [ ] **The string-render tests stay as they are.** Do not migrate them. They are the
  fast bar and the DOM tests are the slow one, and both are worth having.

### 29.5 Record it

- [ ] **`README` or `docs/testing.md`** (create the latter if there is no natural home): one
  page saying what the two kinds of test are, how to write a DOM test, where the fake
  engine lives, and the three rules in 29.4. Link it from the SPEC's architecture
  section in one line.
- [ ] **SPEC section 8**: log the ruling with the date and the three bugs that led to it.

## Hazards

- **The provider's value is deliberately NOT memoised** (`play-context.tsx`). If a DOM
  test makes you want to memoise it, that is the phase 23 bug asking to come back.
- **`localStorage` in jsdom is real and shared across tests in one file**; clear it in
  `beforeEach` or the identity tests will see each other's records.
- **Chessground in jsdom.** `Board.tsx` mounts chessground, which measures its host. In
  jsdom every rect is zero; it must not throw, and if it does, stub the board at the
  component boundary for DOM tests (a `Board` that renders the FEN as text is enough for
  every assertion above) and say so. Do not drive moves through chessground drag in
  tests; call the provider's `play` through the UI seam that exists (`onMove`) or expose
  a test-only move input on the stub board.
- **The Stockfish worker must never start in a test.** The injected fake is the guard;
  assert in one test that `Worker` was never constructed.
- **Nick's progress file is live** at `%APPDATA%\Repertoire Trainer\progress.json`, and a
  session's view of the filesystem OUTSIDE this repo can be a stale overlay. **Never
  report his data folders from your own `ls`.** This phase does not touch the file.
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change, and say
  what the whole suite now takes.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first. `package-lock.json`
  changes with the new dependencies and is staged with `package.json`.

## Out of scope

Browser-driven end-to-end tests (Playwright and the like). Testing the real Stockfish
worker. Any user-visible change. A version bump. A build.

## Conventions and finish

Commit style follows the log. Tick PLAN.md phase 29 boxes as you go. **The review gate
box belongs to the orchestrator: leave it.**

Acceptance: jsdom tests run beside the string tests under one `npx vitest run`, under
ten seconds; the engine injected into the provider with the fake shared from
`src/test/`; the three regression tests each shown red against the bug and green on
main; the phase 22 and 23 register entries closed by real tests; no snapshots, no timers,
no worker; a testing page linked from the SPEC; the ruling logged; `tsc -b` clean.
