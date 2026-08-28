# Multi-opening trainer - concept

v1.0, 2026-08-28. The thinking behind extending London Trainer into a general
opening trainer: what a "course" is, how new openings drop in as content files, and
the decisions that shaped the spec. All six decisions were ruled by Nick in the
Q and A session of 2026-08-28 (every recommendation stood, with the Caro-Kann as
the second course). SPEC.md section 10 is now normative; this document records the
reasoning and the options not taken.

## 1. The goal

One app, many openings, both colours. Adding an opening means adding content files to
a prepared structure, not changing source code. The London course keeps working, and
Nick's existing progress survives.

## 2. What the audit found

The foundation is closer to this than it looks. The word London appears nowhere in
the algorithms: it is the app title, two storage key names, and comments. The
scheduler, card builder, book, play session, report, storage and all 236 tests are
opening-agnostic already.

The real baked-in assumption is that the student plays White. It lives in about
eight files: the schema keys fields by colour (variant, tags and mistakes on White
moves, frequency weights on Black moves), card generation keeps White-to-move
positions, the book holds a White map and a Black map, the session has playWhite and
playBlack, the report scans White's moves, and the boards pin orientation and
movable colour to White.

## 3. The shape: courses

A **course** is one repertoire for one colour: "The London System" as White, or "The
Caro-Kann" as Black. A course is a folder:

```
courses/
  london-white/
    course.json        the manifest
    ch0-the-system.json
    ch1-classical.json
    ...
  caro-kann-black/
    course.json
    ...
```

The **manifest** (`course.json`) carries what the chapter files cannot: the course
id (globally unique, because progress keys hang off it), title, student colour, a
one-line tagline, the chapter files in course order, a format version, and any
concept tags the course adds beyond the shared core set.

The **chapter files do not change format**. They are already pure SAN trees; whose
move a node is falls out of ply parity, and the student's colour comes from the
manifest. The schema's colour rules generalise from White/Black to
student/opponent: notes stay required on every move, variant / tags / mistakes sit
on student moves, frequency weights sit on opponent moves. A Black course is just a
course whose stems start with the opponent's move.

## 4. What generalising costs, by piece

- **Loader**: takes the student colour as a parameter; rules become student-relative.
  Chapter ids and line ids gain the course id as a prefix.
- **Cards**: identity becomes course id plus position. Today two chapters wanting
  different moves in one position is a content fault, which is right inside one
  repertoire and wrong across two: the London plays 2.Bf4 where a Queen's Gambit
  course plays 2.c4 from the same position. Dedup and the conflict rule stay
  within a course. The same early position taught by two courses becomes two cards,
  which is accepted: the position means something different in each repertoire.
- **Book and session**: student map and opponent map; playStudent and playOpponent.
  In a Black course the engine moves first, which the session must start with.
- **Report**: scans the student's moves. Verdicts keep the objective colour wording
  ("clearly better for Black" reads correctly whichever side the student is).
- **Boards**: orientation and movable colour follow the course.
- **Progress**: version 4. Line ids, card keys and play records gain course ids; the
  migration assigns everything existing to the London course, so nothing is lost.
- **Engine, scheduler, storage machinery, Tauri wrap**: untouched.

## 5. Decisions to make

### D1. How courses reach the app

The chapters are compiled into the bundle today, so "drop in a file" is not yet
true: content changes need a rebuild.

- **(a) Bundled only.** Courses live in the repo; adding one means a rebuild and
  reinstall. Simplest, everything stays behind the test suite, but "drop in" never
  becomes true and every new course is an installer cycle.
- **(b) External only.** The app reads a courses folder under AppData at startup,
  seeded with the built-ins on first run. True drop-in, one loading path, but the
  browser dev build cannot read folders, and seeding plus updating seeded copies is
  its own machinery.
- **(c) Hybrid.** Built-in courses stay bundled and suite-guarded; the desktop app
  also scans a courses folder and merges external courses in, validated at load
  with errors shown rather than crashing. Drop-in becomes true without giving up
  the suite, and the dev build simply sees the bundled set.

**Recommend (c).** The dev-browser limitation makes some bundled path necessary
anyway, and courses authored in this repo keep the full quality bar (suite plus
engine pass) before being handed over as files.

### D2. The drill queue across courses

- **(a) One queue.** Due cards from every course interleave, worst-first rules
  unchanged; each card already names its source and the weak-area filter still
  works. One daily habit, whatever is due.
- **(b) Per course.** Pick a course, drill it. Cleaner mental model, but two
  courses means two habits and due cards quietly age in whichever queue is not
  today's.

**Recommend (a)**, with a per-course filter for deliberate practice. Spaced
repetition works best when "what is due" is one honest number.

### D3. Navigation

- **(a) Catalog home.** A courses screen is the front door: one tile per course
  with colour, progress and due counts, plus overall numbers. Entering a course
  gives the current Study / Play experience scoped to it; Drill and Progress live
  at the top level because they span courses. A header switcher jumps between
  courses without returning home.
- **(b) Switcher only.** Keep the current four-tab shell; add a course dropdown in
  the header that re-scopes every tab. Least change, but the app never shows the
  collection as a whole, and Drill-across-courses sits oddly under a course
  switcher.

**Recommend (a).** It matches how the app is used: study and play inside one
course, drill and review across all of them.

### D4. The app's name

London Trainer stops describing the app. The Tauri identifier
(`com.nick.london-trainer`) can stay as it is - it is invisible, and keeping it
means the installed app updates in place and progress stays where it is, no
migration at all. Only the display name, window title and installer name change.
Candidates: Repertoire Trainer, Opening Trainer, or keep London Trainer until a
second course actually exists.

**Recommend Repertoire Trainer**, identifier unchanged.

### D5. Weak-area statistics across courses

Concept accuracy could pool across courses (one "development" number) or stay per
course. **Recommend per course**: how well London development lines are recalled
says nothing about Caro-Kann ones, and pooling would let a strong course hide a
weak one. Progress shows the rollup; the filter works per course.

### D6. The second course

Not structural, but it sets the content plan. The Caro-Kann and the Slav are the
closest relatives to the London in spirit (same triangle mirrored, same
bishop-outside-the-chain rule); a Black course also forces the colour
generalisation to be real rather than theoretical. Any choice works.

## 6. Settled by existing rules (no question needed)

- **Tag vocabulary**: a shared core (development, king-safety, tactics, endgame,
  h-file, the break tags) plus per-course extensions declared in the manifest,
  validator-checked as now. The vs-something tags were always London-specific.
- **Quality bar**: unchanged, per course. Every move noted, plans on leaves,
  mistake minimums, and the engine pass before a course ships - the standing rule
  that chess prose is unverified until Stockfish has been over it.
- **Variants**: stay per course (the classical London move order remains this
  mechanism, inside the London course).
- **Runtime validation**: external courses that fail validation appear in the
  catalog with their errors listed, and load nothing else - the same
  collect-every-error discipline the loader has had since phase 1.
- **Versioning**: the manifest carries a format version, refused if newer than the
  app knows, same rule as progress files.

## 7. Rough shape of the build

Three phases, gated as before. First the model: manifests, course-scoped loading,
student-colour generalisation, cards and progress v4 with migration, suite moved to
per-course. Then the shell: catalog, switcher, cross-course Drill and Progress,
rename, external folder scanning with its capability grant. Then the second course:
content, engine pass, and the first real proof that a course drops in without a
source change. Nick's London progress must survive every step.
