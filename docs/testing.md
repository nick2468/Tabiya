# How this app is tested

Three bars, one command. `npx vitest run` runs everything.

## The two kinds of test

**String tests** (`src/**/*.test.ts`) run in node. They call a function, or render a
component to a string with `renderToStaticMarkup`, and read the result. They are the
bulk of the suite and they are fast because they are cheap: no browser, no layout, no
effects.

That last one is the limit. Rendering to a string mounts nothing, so no `useEffect`
ever runs. A component that loads something on mount is always caught in its empty
starting state, and anything reached by clicking is not reached at all.

**DOM tests** (`src/**/*.dom.test.tsx`) run in jsdom, a JavaScript implementation of a
browser's document. They render the real app with
[testing-library](https://testing-library.com), click its buttons with `user-event`, and
read the screen and the stored progress afterwards. Effects run. State changes. A test
can start a game, play a move, press Undo and look.

The two are separate vitest **projects**, declared in `vite.config.ts`. That is what
lets the node tests stay in node: a single config with a jsdom environment would make
every pure test pay for a document it never touches.

## Why the DOM kind exists

It was built at phase 29, after the same class of bug shipped three times.

The provider that runs a game holds a mutable session object, an engine, and the
identity of the record on disk. Every part of it that could be a pure function is one,
and each of those is covered. What was never covered is the provider itself, because
reaching it needs a DOM and an engine, and the suite had neither. So:

- **Phase 23.** The provider's value was memoised and the session's change counter was
  not in the dependencies. React skips a provider's children unless the value changes,
  so Undo moved the game and left the screen showing the position before it.
- **Phase 25.** `finish` minted a fresh timestamp on every review, and the timestamp is
  what says two reviews are one game. A game reviewed twice appeared twice on Progress.
- **Phase 27.** Replay both minted an identity and wrote its scan back, so reading a
  game left a second record and drifted its recorded ending.

Every one of those passed the whole suite and was found by a person pressing a button.
Each now has a test that goes red when the bug is put back, which is the only evidence
worth having that a regression test regresses.

## What is faked, and why

**The engine.** `PlayProvider` takes an optional `createEngine`, defaulting to the real
Stockfish one. Tests pass `fakeEngine` from `src/test/fake-engine.ts`, which plays the
first legal move and returns a fixed evaluation. A real engine in the suite would mean a
worker per test and a bar that depends on a WASM build being present.
`play-game.dom.test.tsx` puts a recording stub on `globalThis.Worker` and asserts nothing
was ever constructed, so this cannot rot quietly.

**The board.** Chessground measures its host with a `ResizeObserver`, and jsdom has no
layout and no such global, so mounting the real board throws. `src/test/board-stub.tsx`
stands in: it renders the fen, the last move, and one button per legal move, and calls
the real `onMove` seam. `rig.dom.test.tsx` pins the throw that makes the stub necessary,
so if a later chessground or jsdom removes the need, that test goes red and asks.

Nothing else is faked. The providers, the store, the report and the screens are the code
that ships.

## The rules this suite keeps

- **No snapshots.** A snapshot records what the code did, not what it should do, and it
  is updated by pressing a key.
- **No fake timers.** Waiting is done with `vi.waitFor`, on the thing being waited for.
- **No worker, ever**, per the guard above.
- **Under ten seconds.** The whole suite, both projects. It was 898 tests in 8.3 seconds
  at phase 29. A bar nobody waits for is a bar nobody runs.
- **A regression test is shown red first.** Write it against the commit before the fix,
  or put the bug back and watch it fail. A test that has never failed proves nothing.

## Writing one

`src/test/dom.tsx` has the helpers: `renderApp` puts the real providers around the shell
with the fake engine, `seedHistory` writes a progress file before the app starts,
`storedGames` reads it back, and `goTo`, `movesOnScreen`, `board`, `playOnRow` and
`buttonIn` do the reading a test would otherwise repeat.

Two things to know. Mock the board at the top of every DOM test file
(`vi.mock('./Board', async () => await import('../test/board-stub'))`), and remember that
the app opens on the first course in the list, which is a Black repertoire: a test that
wants to play `d4` selects the London first.

## The content checkers

Separate from the suite, and run by hand rather than on every change, because the two
engine ones take an hour. Four scripts in `scripts/` read the courses and check them:
`engine-pass.mjs` judges the moves the courses teach, `engine-mistakes.mjs` judges the
grades beside them, `note-claims.mjs` checks material claims in the prose, and
`note-lines.mjs` plays the lines the prose names. `docs/engine-runs/` holds what each
pass found, and `accepted.md` there lists the findings that will be reported every time
and are correct as they stand.

Three of `note-lines.mjs`'s rules need no engine, so those do not wait to be run by hand:
`src/content/content.test.ts` applies them to every course on every `vitest run`. A note
naming a move the board refuses, a sequence numbered against a different position, and a
check or mate mark the board does not give all fail the suite.
