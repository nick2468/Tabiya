# Content schema

v2.4, 2026-08-29 (v1.0 written in phase 1 from SPEC.md section 4). SPEC.md rules
where the two disagree; section 10 governs the course model. Refinements land here
with one line of why in the change log at the bottom.

The repertoire is data, not code. One folder per course in `courses/`: a
`course.json` manifest and one JSON file per chapter. The loader and validator in
`src/model` read those files, walk every line with chess.js, and attach a FEN to each
node. Study, Drill and Play all consume the loaded result, so a content mistake is
caught once, at load, rather than three times over.

Two terms used throughout. **SAN** is standard algebraic notation for a single move,
like `Bf4`. **FEN** is the one-line text code for a whole position.

Two more, which every rule below is written in. The **student** is the side the course
teaches; the **opponent** is the other one. A course names the student's colour in its
manifest, so a Black course is the same schema read from the other side.

## Where a course lives

Two places, and the format is the same in both.

**Bundled**, in `courses/` in this repo. These ship inside the app, are held to the
quality bar by the test suite, and are the ones a build can be trusted to contain.

**Dropped in**, in a `courses` folder under the installed app's own AppData directory
(`%APPDATA%\com.nick.london-trainer\courses\<your-course>\`). The desktop app scans
it once at startup and merges what it finds into the catalog. Adding an opening to an
installed app is putting a folder there and restarting: no source change, no rebuild,
no installer. The browser build has no such folder and shows the bundled set alone.

Two rules keep a dropped-in folder from taking over something the trainee has been
drilling for months. A dropped-in course cannot claim a bundled course's id, and two
dropped-in folders cannot claim one id between them. In either case the second one
appears in the catalog saying what is wrong rather than replacing anything or
vanishing. The reason is the progress file: every card key and line id carries the
course id, so two courses sharing one id would share one drill schedule and each
would answer for the other.

A folder that will not load costs the trainee that folder and nothing else. Its
errors are listed on its own tile in the catalog.

## Course file

```json
{
  "id": "london-white",
  "title": "The London System",
  "colour": "white",
  "tagline": "One setup against almost everything, as White.",
  "formatVersion": 1,
  "chapters": ["ch0-the-system.json", "ch1-classical.json"],
  "tagExtensions": ["vs-c5", "vs-qb6"]
}
```

| Field | Type | Rule |
|---|---|---|
| `id` | string | Globally unique. Lower case letters, numbers and hyphens only: it prefixes chapter ids and card keys, so it cannot hold `/` or `#`. Progress keys hang off it, so it never changes once a course has shipped. |
| `title` | string | Display name, shown on the catalog tile. |
| `colour` | string | `white` or `black`: the colour the student plays. |
| `tagline` | string | One line for the catalog tile. |
| `formatVersion` | integer | The schema version the course is written to. A course written to a newer version than the app knows is refused outright, and nothing else about it is checked. |
| `chapters` | string[] | The chapter filenames, in course order. Every one must be in the folder, and every file in the folder must be listed. |
| `tagExtensions` | string[] | Optional. Concept tags this course adds to the shared core set. It may not redeclare a core tag. |

Unknown manifest fields are rejected, the same rule the chapter file follows.

### Ids

A chapter's authored `id` is unique within its course; the loader prefixes it with the
course id, and everything above the loader sees the prefixed form.

| Thing | Shape | Example |
|---|---|---|
| Chapter id | `<course>/<chapter>` | `london-white/ch2-c5-qb6` |
| Line id | `<course>/<chapter>:<san moves>` | `london-white/ch2-c5-qb6:d4 d5 Bf4 c5 e3` |
| Card key | `<course>#<position key>` | `london-white#rnbq... w KQkq -` |

The separators differ because a position key carries slashes and spaces of its own, so
a card key needs one a FEN cannot hold. All three are written into the progress file,
which is why they are a data format rather than an implementation detail. They are
built in `src/model/ids.ts` and the progress migration is written against exactly
those functions.

## Chapter file

```json
{
  "id": "ch2-c5-qb6",
  "title": "The ...c5 and ...Qb6 lines",
  "intro": "Markdown prose. Chapter 0 runs 300-500 words; the rest are shorter.",
  "defaultTags": ["vs-c5"],
  "stem": ["d4", "d5", "Bf4", "c5"],
  "tree": [ /* nodes */ ]
}
```

| Field | Type | Rule |
|---|---|---|
| `id` | string | Unique across chapters. Kebab case, chapter number first, like `ch2-c5-qb6`. |
| `title` | string | Display name. |
| `intro` | string | Markdown. Carries a "typical mistakes at this level" section (a `##` heading) for every chapter. |
| `defaultTags` | string[] | Optional. Concept tags applied to every student node in the chapter that does not set its own. |
| `stem` | string[] | SAN moves from the initial position to where the chapter starts. May be empty. |
| `tree` | Node[] | The alternatives available at the end of the stem. |

## Node

```json
{
  "san": "e3",
  "note": "Build the triangle. The bishop is outside the pawn chain already, which is the whole point of the London.",
  "variant": "modern",
  "weight": 7,
  "plan": "Castle short, then decide between Ne5 with f4, or c4 hitting the centre.",
  "tags": ["development"],
  "mistakes": [
    { "san": "Nf3", "grade": "playable", "note": "Fine, but it lets Black play ...Nh5 before e3 covers f4." }
  ],
  "shapes": [{ "orig": "c1", "dest": "f4", "brush": "green" }],
  "children": []
}
```

Sibling nodes are the alternatives at that point in the line.

### Whose move a node is

Ply parity, not a field: `ply = stem.length + depth`, where the tree roots sit at depth
0. A node is White's move when its ply is even, because White always moves first. This
is why `stem` must be exact.

Whether it is the STUDENT's move is that colour compared with the course's. In a Black
course the stem starts with the opponent's move, so the tree roots are the student's
and the parity is the other way round. Nothing in the schema changes; only which side
the rules below attach to.

### Field rules, all enforced by the validator

| Field | Type | Rule |
|---|---|---|
| `san` | string | Required. Must be legal from the parent position. |
| `note` | string | Required on every node: 1-3 plain sentences. The student's moves say the idea or the plan; the opponent's say what the move is doing. |
| `variant` | string | Student nodes only. Defaults to `modern`. Sibling student nodes must carry distinct variants, so there is at most one repertoire move per position. |
| `weight` | integer | Opponent nodes only. 1-10, the club-level frequency estimate, default 1. Drives Play steering. |
| `plan` | string | Required on every leaf: how the student continues from here. |
| `tags` | string[] | Student nodes only. Every tag from the vocabulary below. |
| `mistakes` | object[] | Student nodes only. Each entry `{ san, grade, note }`; `san` legal from this node's own parent position (the mistake is an alternative to this move, not a reply to it); `grade` one of `playable`, `inaccuracy`, `mistake`; `note` required, saying why. The validator checks the move; two scripts check the judgement, and neither is optional: `scripts/engine-mistakes.mjs` compares the grade with what the engine says the alternative costs, and `scripts/note-claims.mjs` plays out any material the note claims. |
| `shapes` | object[] | Optional board highlights for Study. Each `{ orig, dest?, brush }`; squares like `f4`; brush one of `green`, `red`, `blue`, `yellow`. |
| `children` | Node[] | Optional. Absent or empty means a leaf. |

Siblings must be distinct moves. The student's siblings are separated by `variant`, so
there is at most one repertoire move per position. The opponent's have no such field,
so two replies playing the same move are simply a duplicated branch and are rejected.

Unknown fields are rejected, so a typo like `notes` fails loudly instead of vanishing.

### Concept tag vocabulary

A shared core set, which describes chess rather than one opening, so it means the same
thing in every course and the Progress view can put two side by side:

`development`, `king-safety`, `bishop-placement`, `e4-break`, `c4-break`,
`kingside-attack`, `dark-squares`, `h-file`, `tactics`, `endgame`.

Each course adds its own in `tagExtensions`. The London declares `vs-c5`, `vs-qb6`,
`vs-kid`, `vs-gruenfeld`, `vs-bf5` and `vs-dutch`: they say nothing about a Caro-Kann
and would only clutter it. A course may use the core set plus its own extensions and
nothing else.

The Caro-Kann declares eight: `vs-advance`, `vs-exchange`, `vs-panov`, `vs-fantasy`
and `vs-two-knights` name the opponent's choice, in the same `vs-` shape the London
uses; `light-squares`, `c5-break` and `isolated-pawn` are chess concepts that happen
not to arise in a London. The last three could have gone in the core set and did not,
on the rule below: a concept earns a place in the core only when a second course
actually needs it, because a core tag every course must understand is a cost paid by
every course.

The Slav declares eight of its own: `vs-quiet`, `vs-exchange-slav`, `vs-catalan` and
`vs-london` name the opponent's choice; `light-squares`, `c5-break` and `e5-break` are
chess concepts; and `c-file` is the one an Exchange Slav is actually about. Three of
those names are already in the Caro-Kann's list, and sharing a name is the intended
behaviour rather than a clash: a course declares what it uses, and the Progress view
compares courses by exactly these strings, so `light-squares` should mean the same
thing in both. `vs-exchange-slav` is spelt out rather than reusing the Caro-Kann's
`vs-exchange` for the opposite reason: the two Exchange variations are different
positions with different plans, and pooling them would put unrelated numbers side by
side.

Extending the CORE set is allowed, with a line in the change log below saying why.

## What the loader produces

`loadChapter(raw)` returns either a `LoadedChapter` or a list of errors. A loaded node
carries everything the author wrote plus:

| Field | Meaning |
|---|---|
| `fen` | The position after this node's move. |
| `parentFen` | The position the move was played from. Drill cards use this: it is the position where the trainee must find `san`. |
| `from`, `to` | The squares the move ran between, so the board can draw the last-move arrow without replaying the move. |
| `key` | `parentFen` reduced to piece placement, side to move, castling rights and the en passant square. Half of a card's identity: the same position reached through two chapters of ONE course is one card, and the course id is the other half. |
| `ply` | `stem.length + depth`. |
| `colour` | `white` or `black`, from ply parity. |
| `isStudent` | True when the move is the student's, from the colour against the course's. Every rule above is written against this, not against `colour`. |
| `path` | SAN moves from the initial position to and including this node. Node identity inside a chapter. |
| `tags` | The author's tags, or the chapter's `defaultTags` when the author set none. |
| `isLeaf` | True when there are no children. |

`loadCourse(manifest, files)` does the same for a whole course, returning either a
`LoadedCourse` or every error in it.

Errors are collected, not thrown on the first one: a content pass should show every
problem at once. Each error names the course, the chapter, the path to the node, and
what is wrong. The one exception is the format version: a course from a newer version
is refused on its own, because this build cannot know what the fields it does not
recognise were meant to mean.

## Change log

- 2026-08-27: created from SPEC.md section 4.
- 2026-08-27: `key` uses the four-field FEN prefix. chess.js FENs carry halfmove and
  fullmove counters, which differ between two routes to the same position and would
  break card dedup.
- 2026-08-27: mistake entries are legal from the node's PARENT position. A mistake is
  a wrong choice instead of the repertoire move, so it shares the move's start point.
- 2026-08-27: nodes carry `from` and `to`. The loader already plays each move to
  check it, so recording the squares costs nothing and saves Study, Drill and Play
  from replaying a move just to draw an arrow.
- 2026-08-27: the one-White-move-per-position rule needs a second check. The validator
  only compares sibling nodes, so two chapters, or two branches of one chapter, could
  reach the same position by different move orders and expect different moves. Drill
  cards are keyed by position, so one of the two would silently never be asked. The
  card builder reports those as conflicts and the content suite fails on them.
- 2026-08-27: duplicate Black siblings rejected. The variant rule only ever covered
  White, so the same Black reply could be authored twice at one position. Chapter 7 had
  exactly that, which rendered two identical Study buttons and would have double-counted
  the move in Play's steering weights.
- 2026-08-27: unknown fields rejected. A silently ignored typo in authored content is
  the failure mode this schema exists to prevent.
- 2026-08-28: notes are required on Black moves too (Nick's ruling). Optional meant
  half the moves said nothing, which left the student guessing at what Black is doing.
- 2026-08-28: content moved to `courses/<course>/`, with a `course.json` manifest
  (SPEC.md section 10). A chapter file cannot say which colour it teaches or what
  order it comes in, and both matter as soon as there is more than one repertoire.
- 2026-08-28: the colour rules are written as student and opponent. Renaming them
  would have been cosmetic; what makes it real is that ply parity now decides the
  colour and the course decides the role, so a Black course whose stem starts with
  the opponent's move needs no special case anywhere.
- 2026-08-28: the tag vocabulary split into a shared core plus per-course extensions.
  Pooling every opening's tags would have made the core set meaningless and the
  cross-course Progress comparison a lie.
- 2026-08-28: chapter ids, line ids and card keys carry the course. Card keys are
  scoped because one position can mean two different things in two repertoires, and a
  single schedule for both would claim the trainee knows a move they have never been
  asked for. The separators (`/` and `#`) are fixed by `src/model/ids.ts` and the
  progress migration is written against it.
- 2026-08-28: a file in a course folder that the manifest does not list is an error.
  It is content nobody will ever see, and silence about it is how a chapter goes
  missing for a month. Non-JSON files are ignored rather than refused, so a dropped-in
  folder can carry a readme of its own.
- 2026-08-28: courses can also be dropped into a folder under AppData, and the
  "Where a course lives" section above says on what terms. The shadowing rules are
  not tidiness: a course id is written into every progress key hanging off it, so
  two courses sharing an id would share a drill schedule.
- 2026-08-29: a mistake entry now has three things checked rather than one. The
  validator has always checked that the alternative move is legal. Phase 9 added a
  pass over the GRADE, and phase 10 added one over the NOTE, after a sweep of the two
  older courses found nineteen grades the engine disagreed with and four notes naming
  a punishment that does not exist. The rule for an author is short: a grade is a
  claim about a number and a note is a claim about a board, and both get checked.
- 2026-08-29: a third course, and the first rule about sharing tag NAMES between
  courses. The Slav reuses `light-squares` and `c5-break` from the Caro-Kann because
  they mean the same thing, and spells out `vs-exchange-slav` rather than reusing
  `vs-exchange` because that one does not. The test is whether the Progress view
  putting the two courses' numbers side by side would say something true.
- 2026-08-29: the second course arrived and the vocabulary held. The Caro-Kann needed
  eight new tags and every one went into its own `tagExtensions`, so the core ten are
  still exactly the concepts both repertoires share. `light-squares` is the closest
  call: `dark-squares` is core and its twin is not, which looks lopsided until you
  notice that no London chapter is about light squares.
