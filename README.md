# Tabiya

A Windows desktop app for learning chess opening repertoires: read a line and why
each move is played, drill the moves back from memory on a schedule, then play the
opening against an engine that is steered into the lines you have studied.

A tabiya is the standard position an opening heads for, before play diverges. That
is what every chapter here teaches.

Built in Australia.

## Download

**[Download the latest installer](https://github.com/nick2468/Tabiya/releases/latest)**
for 64-bit Windows.

Windows will warn you that the publisher is unknown, because the installer is
not signed with a code signing certificate. That is what an unsigned installer
looks like whoever wrote it. If you would rather not take that on a stranger's
word, the source is all here and `npm run dev` runs the app in a browser
without installing anything.

## What is in it

Ten courses ship with the app, five as White and five as Black, in 71 chapters.

| As White | As Black |
|---|---|
| The London System | The Caro-Kann Defence |
| The Colle-Zukertort | The Slav Defence |
| The Ruy Lopez, Exchange Variation | The Sicilian Najdorf |
| The Vienna Gambit | The Scandinavian Defence |
| The Alapin Sicilian | The King's Indian Defence |

Every move carries a note saying why it is played, and every line ends with a plan
and a name. Beside the repertoire moves sit 2594 graded alternatives: the moves a
club player actually reaches for, each one marked playable, an inaccuracy or a
mistake, with a note saying what it costs.

You can also write your own course. Drop a folder of JSON into the app's course
directory and it appears beside the built-in ten. The format is in
[docs/content-schema.md](docs/content-schema.md) and there is a walkthrough in
[docs/authoring-a-course.md](docs/authoring-a-course.md).

## The four screens

**Study** walks a chapter one move at a time, with the note for each move and an
arrow on the board. It can step a line by itself at a speed you set.

**Drill** asks for the repertoire move from a position and schedules each card by
how well you knew it, using FSRS. The gap can be spent in minutes, hours or days,
so one line can be hammered in an afternoon without lying to the memory model.

**Play** is a game against Stockfish with the opponent biased into your lines. An
evaluation bar runs beside the board, and the report afterwards names every
inaccuracy and blunder, what it cost, and the move the engine preferred.

**Progress** keeps every game you have played, with a replay you can step through
and a button to pick any game up again from any position in it.

## How the content is checked

Chess prose written by a person or a model reads fine and is often wrong, so none
of it is trusted until a machine has been over it. Four checkers run against the
courses, each looking at a different kind of claim:

- `engine-pass.mjs` plays every repertoire move and measures what it costs.
- `engine-mistakes.mjs` checks every grade beside those moves against the engine.
- `note-claims.mjs` plays the material a note claims and counts it.
- `note-lines.mjs` plays every line any note names, which is how a note that
  recommends an illegal move gets caught.

Their output is kept under `docs/engine-runs/`, one directory per phase with the
machine conditions recorded, because a count remembered is a much weaker thing to
compare against than a list on disk. Rules that can be expressed as a test live in
`src/content/content.test.ts` and fail the build: check and mate markers that the
board does not give, a line that ends on the opponent's move, the same position
graded two ways, and two courses that disagree about a position they share.

## Running it

```bash
npm install
npm run dev
```

The dev server binds to port 5175. `npm test` runs the suite, `npx tsc -b`
typechecks, and `npx tauri build` produces the Windows installer under
`src-tauri/target/release/bundle/nsis/`.

## How it was built

`SPEC.md` is the contract and `PLAN.md` is the running record: every phase, what it
changed, and what the review of it found. `chips/` holds the brief each phase was
built from. Reading a phase's chip, then its plan section, then its review notes
shows the whole loop, including the parts that were wrong the first time.

## Licence

MIT. See [LICENSE](LICENSE). You may copy, change and use this, including in
something you sell. Keep the copyright notice in any copy you pass on. The course
content under `courses/` and the documents under `docs/` are covered by the same
licence.

**One thing to know before you redistribute a build.** The app plays against
[Stockfish](https://stockfishchess.org/), which is licensed GPL-3.0. Stockfish is
not in this repository: `scripts/copy-engine.mjs` copies it out of `node_modules`
at build time, and `public/engine/` is gitignored. So the source here is MIT and
nothing more. A built installer, though, has Stockfish inside it, and distributing
that combined binary puts GPL-3.0 obligations on it. If you ship a build rather
than the source, read the GPL terms first.
