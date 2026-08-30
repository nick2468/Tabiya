# Writing a course

A course in Repertoire Trainer is one file. You write it in a chess program you
already know, export it, and open it in the app. There is no programming in this,
and nothing in this page needs anything except a chess board and words.

A course file is a **PGN**: the same format every chess program uses to save
games. Yours will have one game per chapter, with your notes in comments and your
sidelines as variations. If you have ever made a Lichess study, you have already
written most of one.

## What you are making

The app teaches a repertoire the way you would teach it to somebody sitting next
to you. So a course is:

- **Chapters**, one per idea or per opponent try. Each chapter is a game in the file.
- **Lines**, which are the moves you want to play, with a note on every move
  saying why.
- **Alternatives**: the moves people actually play instead, marked as a mistake,
  an inaccuracy or a playable second choice, each with a note saying what is
  wrong with it.

That is all. Everything below is how to say those three things in a PGN.

## The quickest way: a Lichess study

1. Make a **study**. Give it one **chapter per chapter of your course**, in the
   order you want a trainee to meet them.
2. Play in your moves. Right-click on a move to add a comment: that comment is
   the note the app shows.
3. For an alternative, play the wrong move on the board to make a **variation**,
   comment it, and mark it with a **?** for a mistake, **?!** for an inaccuracy
   or **!?** for a playable second choice. In Lichess that is the glyph menu on
   the right-click of the move.
4. Write your chapter introduction as a comment **before the first move**.
5. Export the study as PGN. In Lichess: the study menu, then "Export study as
   PGN". You get one file with all your chapters in it.
6. Add the header lines below to the top of each game, in a text editor.
7. In the app, open **Your courses** and click **Add a course from a file**.

Any other chess program works the same way, as long as it can save variations
and comments. What the app needs is a PGN with variations in it.

## The header lines

Every game in the file needs these, and the course ones have to be the same in
every game. That repetition is on purpose: if somebody pulls one chapter out of
your file and sends it on, it still knows what course it belongs to.

```
[CourseId "my-french-black"]
[CourseTitle "The French Defence"]
[StudentColour "black"]
[Tagline "A solid answer to 1.e4, as Black."]
[FormatVersion "1"]
[ChapterId "ch1-advance"]
[ChapterTitle "The Advance: 3.e5"]
```

- **CourseId** is the name the app files your course under. Lower case letters,
  numbers and hyphens. **Choose it once and never change it**: the app remembers
  which lines you have learnt against this id, and changing it loses them.
- **StudentColour** is `white` or `black`: the side the course teaches.
- **ChapterId** is the same kind of name, unique within your course. Numbering
  them, like `ch0-ideas`, `ch1-advance`, keeps them readable in that order.

There is one optional header. If most moves in a chapter carry the same concept
tag, put it in `[DefaultTags "development"]` and leave it off the individual
moves.

## The notes

A comment after a move is that move's note. Write it the way you would say it:

```
1. e4 e6 {The French. Black asks White to commit the centre before deciding
where the pieces go.} 2. d4 d5 {The point. The pawn on e6 supports it.}
```

The comment before the first move is the **chapter introduction**. Yours can be
several paragraphs, and you can use `##` before a line to make it a heading.

Write in plain text. **A note cannot contain a curly brace**, `{` or `}`, because
that is what starts and ends a comment: the app will refuse the file and tell you
which note it was, rather than quietly cutting it short. Links are shown as
ordinary text rather than as links.

## Marking the moves people actually play

This is the part that makes the app useful, and it is one keystroke per move. Put
the wrong move in as a variation and mark it:

```
3. Nc3 {The main line.} (3. Nd2? {It blocks the bishop on c1 and gives up
the pin on b4 for nothing.}) (3. e5!? {The Advance, and a real opening. It is
a different course from this one.})
```

- **?** a mistake
- **?!** an inaccuracy
- **!?** playable, just not what this course plays

A marked alternative is a single move with a note, and nothing after it. If you
want to show the refutation, write it in the note: "4.Qh5+ wins the pawn back".
The app has nowhere to store a whole line behind a wrong move, and it will tell
you so rather than silently dropping the moves.

A variation with **no** mark is different: that is a second real line, and the
app will teach it as one.

## The three optional tokens

Inside a comment you can add these. They are optional. A course made of nothing
but moves and notes works.

```
{Out before ...e6 shuts it in. [%tags bishop-placement development]}
{White's main try at club level. [%weight 7]}
{Castle, then break with ...c5 when the pieces are ready. [%plan Play ...Rc8 and ...c5.]}
```

- **`[%tags ...]`** the concepts this move is about, separated by spaces. They
  feed the "weak areas" figures in Progress. The shared ones are
  `development`, `king-safety`, `bishop-placement`, `e4-break`, `c4-break`,
  `kingside-attack`, `dark-squares`, `h-file`, `tactics` and `endgame`; if you
  want your own, list them in `[TagExtensions "vs-advance light-squares"]` in
  the header.
- **`[%weight 1]` to `[%weight 10]`** how often a club opponent plays this move.
  It goes on the **opponent's** moves and decides what the engine picks in Play.
- **`[%plan ...]`** goes on the **last move of a line**, and says what to do from
  there. The app shows it when the trainee reaches the end.

If you drew arrows or circles in your study, they come across too: Lichess writes
them as `[%cal Gc1f4]` and `[%csl Gd4]` and the app understands both.

## What the app checks, and what it refuses

Everything is checked before anything is installed, and if the file is refused
**nothing at all is written**. You get a list of what is wrong, with the chapter
and the moves that lead to it.

The app checks that:

- every move is legal in the position it is played in, including the marked
  alternatives;
- every move has a note, and every line ends with a plan;
- every tag is one of the shared ones or one you declared;
- two chapters do not expect different moves in the same position, which would
  make one of them impossible to drill;
- the course details match in every game;
- your course id is not one that ships with the app. Two courses sharing an id
  would share one drill schedule, so the app refuses rather than merging them.

Your course is **not** held to the numeric standards the built-in courses are
held to. There is no minimum number of chapters, no required depth and no
required number of marked alternatives. Those are a house rule for what ships
with the app, not a rule about what a repertoire is.

## Replacing a course you have already installed

Import the new file the same way. Before anything is written, the app works out
how many of your learnt lines still exist in the new version and tells you:
"Replacing it keeps 7 of your 9 learnt lines." Then you choose. If you cancel,
nothing is written at all.

Lines are remembered by their moves, so a line you edited is a new line to the
app, and the old one is forgotten. Adding chapters and adding notes costs you
nothing; changing the moves of a line you have already learnt costs you that
line.

## Sending it to somebody

The file is the whole course. Send it however you send a file. To get one back
out of the app, open **Your courses** and click **Export as a file** on any
course, including the ones that ship with it.

**A bundle is data, and it cannot run anything.** There is no code in it, the
app renders no HTML from it, and links in notes are shown as plain text. That
said, treat a course file the way you would treat any other file somebody sends
you: it can still be wrong, or rude, or simply not very good chess. The app
checks that a course is well formed. It cannot check that it is right.

## A worked example

The Ruy Lopez Exchange was written this way, in a text editor, before it was a
course. Its file is `docs/bundles/ruy-lopez-exchange.pgn`. Open it beside this
section: everything below is quoted from it, and the whole course is seven
games in that one file.

**The headers.** The first six repeat on every game and must agree. The last
three describe the chapter.

```
[CourseId "ruy-lopez-exchange"]
[CourseTitle "The Ruy Lopez, Exchange Variation"]
[StudentColour "white"]
[Tagline "One structure to understand, as White against 1...e5."]
[FormatVersion "1"]
[TagExtensions "majority doubled-pawns bishop-pair d4-break vs-f6 vs-bg4 vs-berlin light-squares"]
[ChapterId "ch2-bg4"]
[ChapterTitle "5...Bg4, pinning the knight"]
[DefaultTags "vs-bg4"]
```

**The intro** is the comment before the first move. It carries the chapter's
prose, in Markdown, and it has to end with a `## Typical mistakes at this
level` section.

**The moves.** Chapter 2 starts like this:

```
1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. O-O Bg4
{The pin. Black develops and asks a question at the same time. [%weight 6]} 6. h3
{Ask it back. The bishop has to say whether it means the sacrifice, the trade or a retreat. [%tags light-squares]}
( 6. d3!? {Solid, and it leaves the pin in place for as long as Black wants it.} )
( 6. Re1!? {Playable and slow. The rook on e1 does nothing while Black's pawn sits on e5.} )
```

Three things are worth naming in those five lines.

1. The first ten moves carry no comment, so they are the chapter's stem: the
   run you are expected to already know. The stem ends at `Bg4`, because that
   move has a note.
2. `[%weight 6]` sits on a Black move, because Black is the opponent here. It
   says how often a club player meets it. `[%tags ...]` sits on White moves,
   because White is the student.
3. The two lines in brackets are graded alternatives to `6. h3`. Both are
   marked `!?`, so the app calls them playable and says why when you pick one.
   Neither has a move after it, which is the rule for every graded move.

**A mistake, marked and explained.** From chapter 5:

```
( 5. Nxe5?!
{The bishop on c5 covers d4, so the queen comes with tempo: 5...Qd4 hits the
knight and f2, and after 6.Nd3 Qxe4+ Black has the pawn back with the better
game.} )
```

The refutation is prose inside the note. It cannot be moves on the board,
because a graded move ends its line.

**A plan on a leaf.** Every line that stops has to say what to do next:

```
5. Nxe5
{A clean pawn: the bishop on c5 does not defend it, and with the d-pawn at home
there is no ...Qd4. [%tags tactics] [%plan Play d4 with tempo on the bishop,
then Nc3 and castle. A pawn up with the better structure.]}
```

**What it cost.** The course took one sitting to write and the app found six
errors in it, all of them mine: two moves that were illegal on the board, a
castling move Black could not make with the queen still on d8, and three
chapters that were short of the ten marked mistakes the bar asks for. Each one
came back naming the chapter and the move. That is the loop this format is
for.

## If something goes wrong

The app tells you which chapter and which moves. The most common ones:

- **"a comment that is never closed"**: a `{` with no `}` after it, usually a
  brace typed inside a note.
- **"the graded alternative is followed by more moves"**: put the refutation in
  the note instead.
- **"is not legal in this position"**: a move that does not fit the board,
  usually from an edit that moved a line.
- **"needs a [ChapterId] header tag"**: a game in the file has no chapter name.

Fix the file and import it again. Nothing was written the first time.
