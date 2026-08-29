# Course bundles - concept

v1.0, 2026-08-30. How a course becomes a single file that anyone can write, share
and import without reinstalling the app. Nick asked for the mechanism, a bundle to
try it on, an export so bundles can be shared, and documentation an enthusiast can
follow. He ruled the three open decisions the same day. SPEC.md section 11 is
normative; this records the reasoning and the options not taken.

## 1. What already exists, which is more than it looks

Phase 7 built external course loading. The desktop app scans
`%APPDATA%\com.nick.london-trainer\courses\` at startup, merges what it finds into
the catalog, refuses to let an added course shadow a built-in one, and gives a
broken folder its own tile listing what is wrong with it. Gate 7 proved it end to
end with a cloned London, and the catalog tells the trainee where to put a folder.

So adding a course without reinstalling already works. What is missing is that a
course is a **folder of files** rather than one artefact, there is no way to get one
out of the app, and no non-technical person could write one.

## 2. The problem that nearly killed the idea

The authored format is JSON, and it is brutal to write by hand. One move sits inside
a chain of `children` arrays thirty spaces deep. Nick's objection was exactly right:
the audience is chess players, not programmers, and a format only a programmer can
produce means bundles come from Claude sessions forever, which is where things
already stand.

His instinct was a compiler from something easier. That is the right shape. The
question was what the easier thing should be, and the answer turns out not to be a
new format at all.

## 3. The answer: chess players already have an authoring format

**PGN**, and more precisely the chess software that writes it. A repertoire is a
tree of moves with comments and alternatives, which is exactly what PGN with
variations expresses, and what every chess GUI on earth can export.

Compare. Today:

```json
{
  "san": "Bg4",
  "note": "Out it comes, before ...e6 has to be played.",
  "tags": ["bishop-placement", "light-squares"],
  "mistakes": [
    { "san": "e6", "grade": "playable", "note": "Solid, but it locks in the bishop." },
    { "san": "Bf5", "grade": "mistake", "note": "7.Bxf5 simply wins the bishop." }
  ]
}
```

As PGN:

```
6... Bg4 {Out it comes, before ...e6 has to be played. [%tags bishop-placement light-squares]}
     (6... e6!? {Solid, but it locks in the bishop.})
     (6... Bf5? {7.Bxf5 simply wins the bishop.})
```

**And the point is that nobody types either one.** In a Lichess study the author
plays 6...Bg4 on a board, types the comment in a box, right-clicks the alternative
and marks it `?`, then exports. The glyphs, the parentheses and the braces are what
the tool writes. The app-specific part is three optional tokens, and a course
without a single one of them still loads.

Two pieces of luck make the fit better than it had to be. A Lichess study exports as
one PGN with **each chapter as a separate game**, which is exactly a course with
chapters. And Lichess already writes board arrows as `[%cal Gc1f4]`, which is the
`shapes` field the Study view uses for highlights, in a format we did not have to
invent.

## 4. The decisions

### D1. What a bundle is (ruled: a PGN file)

- **(a) One JSON file.** No parser to write, no ambiguity, and the app stays
  smaller. Rejected because it accepts that authoring is a technical job.
- **(b) PGN in, JSON out.** Easy authoring, and what gets shared is pre-validated.
  Rejected because the recipient cannot open the file in a chess program or edit it,
  which loses most of the community argument.
- **(c) A ZIP of the folder.** Conventional, but adds a compression dependency to an
  offline app for no gain over (d).
- **(d) A PGN file.** Ruled. One file per course, chapters as games. Authored in
  tools people already have, readable by them afterwards, and round-trippable
  because Export writes the same shape.

**The cost, verified rather than assumed: we write our own PGN parser.** chess.js
has `loadPgn`, and it silently discards variations - tested at design time, a
sideline vanished with no error and no warning. A repertoire's whole tree would
disappear quietly. That is the one piece of real engineering in this feature.

### D2. Importing over a course you already have (ruled: ask, showing what survives)

Progress hangs off the course id, and a line id carries its own moves, so replacing
a course can orphan learnt lines - the hazard phase 10 was built around. Options
were to refuse, to replace silently, or to ask.

Ruled: **before writing anything, load the incoming course and count how many of the
trainee's learnt lines still resolve against it, then say so** - "replacing this
keeps 7 of your 9 learnt lines" - and let them confirm or cancel. It uses the exact
check gate 10 relied on, and turns an invisible data risk into a plain sentence.

### D3. The bundle to prove it (ruled: the Ruy Lopez, Exchange Variation)

4.Bxc6 dxc6. The lowest-theory serious Ruy: a clear structural plan around the
healthy pawn majority, and it sidesteps the enormous Closed main lines. Realistic to
author to the same bar as the other three courses, and a genuine club weapon rather
than a toy. The Closed with d3 and the full classical Ruy were the alternatives, and
the full Ruy is several phases of content rather than one.

## 5. Settled without a question

- **Untrusted prose is already safe, with one gap.** Course notes render through
  `react-markdown` with no raw-HTML plugin, so a bundle cannot inject HTML or
  script, and the loader rejects unknown fields and validates every move. The gap is
  that markdown **links** still render, and a link in a Tauri window navigates the
  app itself. Course prose will render links as plain text: an opening note has no
  need of a hyperlink, and an app that opens arbitrary URLs out of a shared file is
  a phishing vector.
- **Imported courses are validated strictly but not held to the numeric quality
  bar.** Legality, structure, schema and the shadowing rules all apply. The bar in
  `content.test.ts` - ten mistake entries a chapter, depth to move ten, a
  typical-mistakes section - applies to courses shipped in this repo, and it already
  works that way because that suite reads the bundled set only. Holding a stranger's
  bundle to it would mean nothing could ever be imported.
- **Import compiles into the folder shape phase 7 already loads.** Nothing in the
  catalog, the merge rules or the shadowing checks changes. Export goes the other
  way from a loaded course, so it works for built-in courses too: the London can be
  exported and edited in a chess GUI like any other.
- **The first bundle still needs one app update**, because the importer is app code.
  After that, courses need no reinstall - which is the whole point.

## 6. What a bundle looks like

Course identity in PGN headers, repeated on every game so a single extracted chapter
still knows what it belongs to. Chapter order is game order. The chapter intro is
the comment before the first move. Notes are comments; `[%tags]`, `[%weight]` and
`[%plan]` are optional tokens inside them; grades are the standard glyphs `!?`
playable, `?!` inaccuracy, `?` mistake.

```
[CourseId "ruy-exchange"]
[CourseTitle "The Ruy Lopez, Exchange Variation"]
[StudentColour "white"]
[ChapterId "ch1-main-line"]
[ChapterTitle "The main line: 5.O-O"]

{The Exchange Ruy trades the bishop for the knight straight away...}

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. O-O {[%tags development]} ...
```

## 7. Rough shape of the build

Two phases, gated as before. First the mechanism: the PGN parser with variations,
the compiler both ways, Import and Export in the app with the re-import check, the
link change, and the author documentation. Then the Ruy Lopez, authored to the
quality bar, exported as the reference bundle, and proved by a round trip - import
of the export must reproduce the course exactly, which is the test that keeps the
parser and the writer honest at the same time.
