# Chip: phase 43 - the courses agree with each other

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 3, 4 and 8, PLAN.md phase 42 (the London gaps), `docs/content-schema.md`,
`docs/engine-runs/accepted.md`, `src/content/content.test.ts` (the scoping tests and the
one-grade rule), `src/model/lines.ts`, `courses/london-white/ch3-kings-indian.json` and
`courses/kings-indian-black/ch5-without-c4-and-e4.json` before starting.

Nick, 2026-09-06: writing the King's Indian found three places where his own London course
and his own King's Indian course meet and do not agree. He ruled that the courses must be
consistent with each other. This phase fixes the three, and it adds the rule that finds
every other one, across every pair of courses that share a position. **Content plus one
test; version 1.10.1.**

## The rule

**Where a White course and a Black course reach the same position, each course's
repertoire move there must appear in the other course as a listed reply.** The Black
course's move must be one of the White course's weighted Black replies at that position,
and the White course's move must be one of the Black course's weighted White replies. A
course may list more replies than the other plays; it may not be silent about the move the
other course plays. Ten courses, and the pairs that share positions today are at least:
London and Colle against Slav and King's Indian; Alapin against Najdorf (its 2.c3 chapter)
and Scandinavian (none, unless a chapter reaches 1.e4 c5); Vienna and Ruy against nothing
(no Black course plays 1...e5). The script finds the pairs; do not assume the list.

## The work

- [ ] **43.1 The checker as a test, reporting every mismatch at once.** In
  `content.test.ts`, one test over every White course against every Black course: walk
  both trees to their shared positions (by `positionKey`), and for each shared position
  where one course has a repertoire move and the other lists replies, assert the move is
  among the replies. Report all mismatches in one failure with course, chapter, line and
  the missing move. Run it first and record what it finds in the open items before fixing
  anything: that list is the phase's scope.
- [ ] **43.2 The London's King's Indian chapter takes the King's Indian's answers.** The
  three found at phase 42, and any more the test lists between these two courses:
  - After the London's `10.Bh2` the King's Indian plays `10...Ne4`. Add it as a Black
    reply with a weight and a note, and extend the London with White's answer and a plan
    from the new leaf (the engine at 2500 ms chooses White's move; record the number).
    This lengthens a London line, which changes its id: say the old and new id in the
    commit. Nick's ruling covers it.
  - The engine prefers `10.Nxe5` (+0.52) to the London's `10.Bh2` (+0.27). **The London's
    move stays**: the floor rule (SPEC section 8) keeps a repertoire move that is not worse
    than about -0.3, and +0.27 is a good position; the King's Indian's answer to 10.Nxe5
    wins the pawn back, which is why the engine's number is not a free pawn. Record it in
    `accepted.md` with both numbers so no pass reports it again.
  - `8.c3` is a listed inaccuracy in the London with the note "Too modest". The King's
    Indian holds `...e5` back after 8.c3 because `8...e5 9.dxe5 dxe5 10.Nxe5` loses a pawn.
    Add that sentence to the London's 8.c3 note so a London player who sees it knows the
    one thing it does threaten. Grade unchanged.
- [ ] **43.3 Every other mismatch the test lists**, in either direction, fixed by adding
  the other course's move as a listed reply with a note and a weight (an opponent move),
  never by changing a repertoire move. Where the other course's move is genuinely a
  mistake against this course, list it with a note that says why and let the grade tell
  the truth; where it is a sound move this course never considered, extend this course
  with one answer, engine-checked, and record the new line id. If the list is longer than
  about twenty positions, stop after the London and Colle against the King's Indian and
  Slav, record the rest in the open items with counts, and say so: the orchestrator will
  chip the remainder.
- [ ] **43.4 The checkers on what changed**: `engine-ask.mjs` at 2500 ms on every new
  White or Black move added; `engine-mistakes.mjs` at 2500 ms over each course whose
  entries changed; `note-claims.mjs` and `note-lines.mjs` over each course touched. Outputs
  under `docs/engine-runs/phase-43/` with conditions. One engine, quiet machine.
- [ ] **43.5 Bundles regenerated** for every course touched.
- [ ] **43.6 SPEC**: section 3 gains the rule in one sentence; section 8 logs the ruling
  with the date and the reason (Nick: the courses must be consistent with each other).
- [ ] **43.7 Version 1.10.1** in the three files.
- [ ] **43.8 Suite green**, `tsc -b` clean, and the gate rebuilds the line ids of every
  course expecting only the additions and the changes the commits name.

## Hazards

- **Never change a repertoire move to make two courses agree.** Agreement is reached by
  listing the other course's move as a reply, or by extending a line; a repertoire move
  moves only when the engine at 2500 ms says it is unsound, and then it is a finding to
  record, not a consistency fix.
- **Every extended line changes an id**; say each one. A listed reply added to an
  opponent node changes none.
- **The one-grade rule and the direction and check-mark rules still bind** every note
  added.
- **Nick's progress file is live**; never report his data folders from your own `ls`.
- **No `tauri build` or `tauri dev`.** **Commit before you stop.**
- **`npx tsc -b`**, and say you ran it. `npx vitest run` after every change.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Agreement between two courses of the SAME colour (the London and the Colle both answer
1...d5 and are meant to differ). Any change to the app. A packaged build.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc or the code: stop that
item, record it, continue with the rest. If the mismatch list is large, follow 43.3's stop
rule rather than working through the night on content nobody has reviewed.

## Conventions and finish

Commit style follows the log. The test first, then the London against the King's Indian,
then the rest course pair by course pair, then the records, the bundles, the SPEC and the
version, each its own commit. Tick PLAN.md phase 43 boxes as you go. **The review gate box
belongs to the orchestrator: leave it.** The open items list the mismatches found, the ones
fixed with how, the ones deferred with counts, every engine number, and every line id that
changed.

Acceptance: a test that holds every White course and every Black course to agreeing at
their shared positions, green; the London's King's Indian chapter answering the King's
Indian's moves with the three phase 42 gaps closed; every other listed mismatch fixed or
deferred with a count; checkers run on what changed with conditions; bundles regenerated;
the rule in SPEC section 3 and the ruling in section 8; version 1.10.1; vitest green and
`tsc -b` clean; the tree committed and clean.
