# Content schema

v1.0, 2026-08-27, written in phase 1 from SPEC.md section 4. SPEC.md rules where the
two disagree. Refinements land here with one line of why in the change log at the
bottom.

The repertoire is data, not code. One JSON file per chapter in `content/`. The loader
and validator in `src/model` read those files, walk every line with chess.js, and
attach a FEN to each node. Study, Drill and Play all consume the loaded result, so a
content mistake is caught once, at load, rather than three times over.

Two terms used throughout. **SAN** is standard algebraic notation for a single move,
like `Bf4`. **FEN** is the one-line text code for a whole position.

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
| `defaultTags` | string[] | Optional. Concept tags applied to every White node in the chapter that does not set its own. |
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
0. A node is White's move when its ply is even. This is why `stem` must be exact.

### Field rules, all enforced by the validator

| Field | Type | Rule |
|---|---|---|
| `san` | string | Required. Must be legal from the parent position. |
| `note` | string | Required on White nodes: 1-3 plain sentences saying the idea or the plan. Optional on Black nodes, for when the idea matters. |
| `variant` | string | White nodes only. Defaults to `modern`. Sibling White nodes must carry distinct variants, so v1 has at most one White move per position. |
| `weight` | integer | Black nodes only. 1-10, the club-level frequency estimate, default 1. Drives Play steering. |
| `plan` | string | Required on every leaf: how White continues from here. |
| `tags` | string[] | White nodes only. Every tag from the vocabulary below. |
| `mistakes` | object[] | White nodes only. Each entry `{ san, grade, note }`; `san` legal from this node's own parent position (the mistake is an alternative to this move, not a reply to it); `grade` one of `playable`, `inaccuracy`, `mistake`; `note` required, saying why. |
| `shapes` | object[] | Optional board highlights for Study. Each `{ orig, dest?, brush }`; squares like `f4`; brush one of `green`, `red`, `blue`, `yellow`. |
| `children` | Node[] | Optional. Absent or empty means a leaf. |

Unknown fields are rejected, so a typo like `notes` fails loudly instead of vanishing.

### Concept tag vocabulary

The seed set from SPEC.md section 4:

`development`, `king-safety`, `bishop-placement`, `e4-break`, `c4-break`,
`kingside-attack`, `dark-squares`, `h-file`, `vs-c5`, `vs-qb6`, `vs-kid`,
`vs-gruenfeld`, `vs-bf5`, `vs-dutch`, `tactics`, `endgame`.

Extending it is allowed, with a line in the change log below saying why.

## What the loader produces

`loadChapter(raw)` returns either a `LoadedChapter` or a list of errors. A loaded node
carries everything the author wrote plus:

| Field | Meaning |
|---|---|
| `fen` | The position after this node's move. |
| `parentFen` | The position the move was played from. Drill cards use this: it is the position where the trainee must find `san`. |
| `from`, `to` | The squares the move ran between, so the board can draw the last-move arrow without replaying the move. |
| `key` | `parentFen` reduced to piece placement, side to move, castling rights and the en passant square. Card identity, so the same position reached through two chapters is one card. |
| `ply` | `stem.length + depth`. |
| `colour` | `white` or `black`, from ply parity. |
| `path` | SAN moves from the initial position to and including this node. Node identity inside a chapter. |
| `tags` | The author's tags, or the chapter's `defaultTags` when the author set none. |
| `isLeaf` | True when there are no children. |

Errors are collected, not thrown on the first one: a content pass should show every
problem at once. Each error names the chapter, the path to the node, and what is wrong.

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
- 2026-08-27: unknown fields rejected. A silently ignored typo in authored content is
  the failure mode this schema exists to prevent.
