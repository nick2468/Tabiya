# Chip: phase 31 - the Sicilian Najdorf, a seventh course

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 3, 4, 8 (the "engine is a floor" and "straddle" rulings), 10 and
11, PLAN.md phases 18 to 20, `docs/content-schema.md`, `docs/authoring-a-course.md`,
`docs/engine-runs/accepted.md`, and the Caro-Kann course folder (`courses/caro-kann-black/`)
as the model of a Black course, before starting.

This is a content phase with one small code tail: a seventh course means a version bump,
and a test already holds the version files together. Nick commissioned it on 2026-09-04.

## The rulings, settled before any drafting

- **The Sicilian Najdorf**: 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6. Nick's
  third Black course and his second answer to 1.e4. The Caro-Kann is his solid answer;
  the Najdorf is the counterpunching one, and the course says so once, in ch0, the way
  the Vienna's ch0 contrasts the Ruy Exchange: same first move from White, opposite
  question from Black. Do not oversell it: it is the most theoretical opening in the app
  and the course's whole job is to make it playable at club level with a small number of
  ideas.
- **The course id is `najdorf-black`, and it is permanent.** It is written into every
  line id and card key in the trainee's progress file. The two Black courses already
  carry the `-black` suffix (`caro-kann-black`, `slav-black`). Title: "The Sicilian
  Najdorf". Colour black.
- **Move order policy: 2...d6 always.** Black plays 1...c5 and 2...d6 against every
  White second move that allows it, so the anti-Sicilians in ch5 are met with the pawn
  already on d6 and one recipe each, never a second repertoire.
- **The theory fork rule (SPEC section 3) governs every choice below**: where two Black
  replies are both sound, take the one needing less memorisation and note the rejected
  one in one sentence. The Poisoned Pawn (6.Bg5 e6 7.f4 Qb6) is OUT for that reason and
  ch1 says so in one sentence. Nothing here is a memorisation contest.
- **Seven chapters**, the shape the other six use:
  0. **The defence and its idea** (concept chapter, intro 300-500 words). Why ...a6
     (b5 for the pawn, b5 denied to White's pieces, ...b5 to come); the ...e5 versus
     ...e6 question and how the course answers it against each White setup; the d5 hole
     and why Black lives with it; the queenside pawn storm ...b5-b4 against Nc3; piece
     homes (Be7, Be6 or Bb7, Nbd7, Qc7, O-O, rooks to c8 and e8). The contrast with the
     Caro-Kann.
  1. **The main line: 6.Bg5.** 6...e6 7.f4 Be7 8.Qf3 Qc7 9.O-O-O Nbd7 and the classical
     complex, with 8.Qf3 h6 rejected in a sentence and the Poisoned Pawn rejected in a
     sentence. Also 7.f4 Nbd7 is NOT a second repertoire: one answer. This chapter has to
     be known cold and carries the highest drill weight.
  2. **The English Attack: 6.Be3 and 6.f3.** 6...e5 7.Nb3 Be6 8.f3 Be7 9.Qd2 O-O
     10.O-O-O Nbd7 and the ...b5, ...a5 plans; 7.Nf3 Be7 as the other branch. 6...Ng4 is
     rejected in a sentence.
  3. **The classical and quiet tries: 6.Be2, 6.f4, 6.g3.** 6.Be2 e5 7.Nb3 Be7 8.O-O O-O
     9.Be3 Be6; 6.f4 e5 7.Nf3 Nbd7 (or 6...Qc7, the builder chooses with the engine and
     says why); 6.g3 e5 7.Nde2 Be7. Depth to about move 10-12 on the main branch of each,
     6-8 on the rest.
  4. **The bishop on c4 and the h3 tries: 6.Bc4, 6.h3, 6.a4, 6.Rg1 and friends.**
     6.Bc4 e6 7.Bb3 b5 8.O-O Be7 (Fischer-Sozin); 6.h3 e5 7.Nde2 and a quiet answer
     (...Be6 or ...h5, the builder chooses with the engine, says why, and prefers the one
     with fewer forced moves); 6.a4 e5 7.Nf3 Be7; the rest one recipe each.
  5. **Everything else: the anti-Sicilians.** With 2...d6 in hand: 2.Nc3 (the Closed
     Sicilian, 2...d6 3.g3 Nc6 / 3.f4 Nf6 with one plan each), 2.c3 (the Alapin, 2...Nf6
     3.e5 Nd5 or 2...d6, the builder chooses one and says why), 3.Bb5+ (the Moscow,
     3...Nd7 or 3...Bd7, one choice), 2.d4 cxd4 3.c3 (the Smith-Morra, DECLINED with
     3...Nf6 4.e5 Nd5 per the fork rule), 2.f4 (the Grand Prix, 2...d6), 3.c3, 3.Bc4,
     3.d4 cxd4 4.Qxd4 (4...Nc6 5.Bb5 Bd7), 2.b3, 2.Nc3 followed by an early Bc4. One safe
     recipe each; most come back to a position the trainee already knows, and the chapter
     says which.
  6. **Typical tactics and plans** - the exercises. The ...d5 break, ...b5-b4 against
     Nc3, the exchange sacrifice ...Rxc3, the Nd5 and Nf5 sacrifices White aims at Black
     and how to see them coming, Bxe6 and Bxb5 sacs, the ...Nxe4 trick after Bg5, and
     the ...e5 versus ...e6 decision in a position where it matters. Tree nodes are
     exercise positions where the expected move is the thematic blow, and in this course
     several of them are DEFENSIVE: the right answer to a sacrifice.

## The work

- [ ] **31.1** is done: the variation, the id, the move order and the chapters are ruled
  or given a decision rule above.
- [ ] **31.2 Draft the seven chapters** to the SPEC.md section 3 bar, student BLACK:
  a note of 1-3 plain sentences on every move (the idea for Black's moves, what White is
  doing for White's), a plan AND A NAME on every leaf (names unique per chapter, under
  40 characters, named by what makes the line different from its siblings), the
  typical-mistakes section in each intro, authored mistake entries on at least ten
  positions in each of ch1-ch6 and on ch0's core decisions, weights on WHITE's replies
  (a Black course: the weights sit on the opponent's moves, and the loader refuses them
  on the trainee's), tags from the core set plus whatever `tagExtensions` declares.
  The course lives in `courses/najdorf-black/` as a folder of JSON like the other six;
  `src/content/index.ts` globs `courses/*/course.json`, so the folder IS the
  registration. Stems: a Black course's chapter stems begin with White's moves, so ch1
  to ch4 share the six-move stem and differ at White's sixth; ch5's trees branch at
  White's second or third move.
- [ ] **31.3 Every claim a note makes is checked by the rules the suite already has**:
  no move marked check or mate unless it is; no "towards the centre" on a capture that
  goes away from it; no line named in prose that the board refuses (the HARD categories
  of `note-lines.mjs` fail the build). Run `npx vitest run` after every chapter, not at
  the end, so a failing note is found while the chapter is open.
- [ ] **31.4 All FOUR checkers, after the LAST content edit, and the outputs saved
  under `docs/engine-runs/phase-31/`**:
  - `node scripts/engine-pass.mjs courses/najdorf-black 500` twice, then every finding
    re-checked with `engine-ask.mjs` at 2500 ms before anything changes.
  - `node scripts/engine-mistakes.mjs courses/najdorf-black 2500` ONCE at verdict
    strength (phase 19's ruling: 500 ms grades are samplers, 2500 ms is the arbiter, and
    a new course gets the arbiter before it ships).
  - `node scripts/note-claims.mjs courses/najdorf-black`, and the by-hand read of the
    entries a capture answers if it reads nothing.
  - `node scripts/note-lines.mjs courses/najdorf-black`, zero HARD findings, and the soft
    ones read by a person.
  **Movetime is wall clock.** Nick has other Claude sessions building during the day.
  Never run two engine checks at once, never run one beside a `tauri build` or a test
  run, and if another heavy process is running when the 2500 ms passes are due, STOP and
  say "ready for the verdict-strength passes" rather than run them noisy. The orchestrator
  will run or schedule them in a quiet window; the gate does not pass without them.
  **The Najdorf will fight the checkers** the way the Vienna did, from the other side:
  Black concedes space and the d5 square on purpose, and several main lines measure
  +0.3 to +0.6 for White at 2500 ms because that is what the Najdorf IS. The rule from
  phase 18, mirrored: a flagged BLACK repertoire move is KEPT if at 2500 ms the position
  after it is no worse than about +0.5 for White AND it is the move the theory plays;
  record the number. A move that costs more than that against the engine's own choice at
  2500 ms is a real fault: fix the line. Never soften a ruled line to make a checker go
  green; if a ruled line is unsound, fix the line and record the finding.
- [ ] **31.5 The course's block in `src/content/content.test.ts`.** The Caro-Kann's block
  is the model for a Black course, including the line-name assertions. Add one claim that
  is really about THIS course: that every repertoire chapter from ch1 to ch4 has Black's
  pawn on a6 by move 5, say, and that no chapter's Black moves ever include ...Qb6 on
  move 7 after 6.Bg5 e6 7.f4 (the Poisoned Pawn stays out). Pick things the course would
  fail if somebody quietly turned it into a different Sicilian.
- [ ] **31.6 Extend the course-scoping test.** The Caro-Kann and the Najdorf are both
  Black courses whose trees start from the initial position: they AGREE that White plays
  1.e4 and DISAGREE on Black's reply (1...c6 against 1...c5). Add that instance beside
  the White ones, and verify the shared and disagreeing sets are non-empty rather than
  assuming.
- [ ] **31.7 Export the bundle**: `node scripts/export-bundles.mjs` writes
  `docs/bundles/najdorf-black.pgn`; `bundle.test.ts` globs the folder, so confirm the
  round trip picked it up rather than assuming.
- [ ] **31.8 The count of courses is written in prose in a few places.** SPEC section 6
  says "Six courses, two colours, four of them White" and section 8 counts six in three
  more places; grep `six courses` and `6 courses` across SPEC.md, `help-text.ts` and
  `docs/` and correct every one that describes the present rather than a past event.
- [ ] **31.9 The version becomes 1.7.0.** Nick's rule: the second digit is the number of
  built-in courses, and this makes seven. `package.json`, `src-tauri/tauri.conf.json`,
  `src-tauri/Cargo.toml`; `src/version.test.ts` holds them together.
- [ ] **31.10 Prove it in the browser build**: the course appears in the catalog with its
  tagline, Study opens ch0 with its intro, the lines table names every line, Drill takes
  a learnt line, Play starts a game as Black with the engine opening 1.e4 and the book
  steering it, and the Progress rollup counts seven courses. Clear the browser build's
  storage afterwards. The packaged build is the orchestrator's step.

## Hazards

- **Nick's progress file is live** at `%APPDATA%\Repertoire Trainer\progress.json`, and a
  session's view of the filesystem OUTSIDE this repo can be a stale overlay. **Never
  report his data folders from your own `ls`.** This phase does not touch the file, and
  a new course folder changes no existing line id: the gate rebuilds the 308 ids of the
  other six and expects every one unchanged.
- **Do not touch the other six courses' content.** It is settled and swept.
- **A Black course flips every "you" and every direction.** The report, the hints and
  the Ended column already speak from the trainee's side; the NOTES must too. "Take
  towards the centre" is checked by the suite, "White" and "Black" in a note are not:
  read every note as Black before you commit it.
- **`tauri build` is the orchestrator's step here**; do not run it. **Do not run `tauri
  dev`.** If another server holds 5175, drive against it and say so.
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every chapter.
- **No em dashes anywhere**, including JSON notes, PGN prose and line names. Australian
  English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

The Poisoned Pawn, the Scheveningen move orders, the Dragon, and any second repertoire
against a White try. Any change to the other six courses. Any change to the app beyond
the version bump and the prose counts. Any change to the checkers. A packaged build.

A valid follow-up in a file you already have open: do it now, as its own commit. One
needing a ruling: the SPEC section 6 register.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc or the code: stop that
item, record it in the open items, continue with the rest. If the engine says a ruled
line is unsound at 2500 ms, fix the line and record the finding; never change a ruling
silently. If the machine is busy when the verdict-strength passes are due, stop and say
so rather than run them noisy.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the model you actually are. Land the content chapter by chapter or in two or three
commits, then the tests, the bundle, the prose counts and the version bump as separate
commits. Tick PLAN.md phase 31 boxes as you go. **The review gate box belongs to the
orchestrator: leave it.** The open items list every engine finding kept and why, every
fork taken with its one-sentence reason, and whether the 2500 ms passes ran clean or
wait for a quiet window.

Acceptance: the course meets the section 3 bar with names on every leaf and weights on
White's replies only; all four checkers run and recorded with the 2500 ms mistakes pass
and the 2500 ms re-checks; Black's concessions measured rather than asserted; it
round-trips through `docs/bundles/najdorf-black.pgn`; the scoping test covers the
Caro-Kann against the Najdorf; the prose counts say seven; the version reads 1.7.0 in all
three files; the other six courses untouched with their 308 line ids intact; vitest
green and `tsc -b` clean.
