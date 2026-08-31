/**
 * Reading move sequences out of authored prose.
 *
 * Two checkers need this and neither should own it. `note-claims.mjs` plays
 * the FIRST sequence a note names to test a material claim; `note-lines.mjs`
 * plays EVERY sequence to test that the board allows it at all. The parsing
 * problem is the same one and it has one hard trap in it: a bare square in
 * prose ("the e4 break", "the knight on d5") is indistinguishable from a pawn
 * move. So a run starts at the first NUMBERED move and ends where the prose
 * resumes - moves joined by nothing but spaces and move numbers are one
 * sequence, and any other word between two moves closes it.
 *
 * This module knows nothing about chess. It reads text.
 */

/**
 * One move in the shape this content writes them. Castling first, so O-O-O is
 * not read as O-O with a tail.
 */
export const SAN = String.raw`(?:O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|[a-h]x[a-h][1-8]|[a-h][1-8])(?:=[QRBN])?[+#]?`

const TOKEN = new RegExp(String.raw`(\d+)?\s*(\.{1,3})?\s*(${SAN})`, 'g')

/**
 * Every move-looking token in a note, numbered or not.
 *
 * The dots carry the side, which is the whole reason they are kept: `7.` is
 * White's seventh move and `7...` is Black's. A number with no dots is read
 * as White, which is how the notation is written when it is written at all.
 */
export function tokensIn(note) {
  TOKEN.lastIndex = 0
  const found = []
  let match
  while ((match = TOKEN.exec(note)) !== null) {
    found.push({
      number: match[1] ? Number(match[1]) : null,
      side: match[2] ? (match[2].length > 1 ? 'b' : 'w') : null,
      san: match[3],
      start: match.index,
      end: TOKEN.lastIndex,
    })
  }
  return found
}

/**
 * True when nothing but spaces, dots and move numbers separates two tokens.
 *
 * A line break ends a run even though it is whitespace. A chapter intro is
 * markdown, and a heading that ends on a move sits directly above a paragraph
 * that opens on one: "## The trick to know after 4.e3" then "5.cxd5 cxd5
 * 6.Qb3 hits b7" is two lines from two positions, not a six-ply sequence.
 */
function joined(note, before, after) {
  return /^[ 	.\d]*$/.test(note.slice(before.end, after.start))
}

/**
 * Every run of moves the note names, each starting at a numbered move.
 *
 * A note often names more than one: "5...h6 6.Bxd8 costs Black the queen. The
 * objection is positional. 5.Bg3 keeps the bishop on the diagonal" is two
 * lines from two different positions, and a checker that reads only the first
 * never looks at the second.
 */
export function runsIn(note) {
  const found = tokensIn(note)
  const runs = []
  let i = 0
  while (i < found.length) {
    if (found[i].number === null) {
      i += 1
      continue
    }
    const run = [found[i]]
    let j = i + 1
    while (j < found.length && joined(note, found[j - 1], found[j])) {
      run.push(found[j])
      j += 1
    }
    runs.push(run)
    i = j
  }
  return runs
}

/**
 * The first run only, in the shape `note-claims.mjs` has always used: the SAN
 * strings and the move number the run opens on.
 */
export function sequenceIn(note) {
  const [run] = runsIn(note)
  if (!run) return { moves: [], number: null }
  return { moves: run.map((token) => token.san), number: run[0].number }
}

/**
 * The clause a span of text sits in.
 *
 * Clause ends are commas, semicolons, colons and full stops - but a full stop
 * inside "7.Nf3" or "7...Bh7" is a move number, not a sentence, so a dot
 * preceded by a digit or another dot is not a boundary.
 */
export function clauseAround(note, start, end) {
  const delimiter = /(?<![0-9.])\.(?!\.)|[,;:]/g
  let from = 0
  let to = note.length
  let match
  while ((match = delimiter.exec(note)) !== null) {
    if (match.index < start) from = match.index + match[0].length
    else if (match.index >= end) {
      to = match.index
      break
    }
  }
  return note.slice(from, to)
}

const DENIAL = /\b(?:not|never|cannot|can(?:no|')t|no)\b[^,;:]*\b(?:legal|possible|playable|available|allowed)\b/i
const FLAT = /\b(?:illegal|impossible)\b/i

/**
 * True when the prose is saying this move CANNOT be played.
 *
 * A note is allowed to name an illegal move on purpose: "the rook on h8
 * defends h2 down the file that ...hxg6 opened, so 11.Kxh2 is not even
 * legal" is correct, and a checker that reports it is agreeing with it. The
 * test is deliberately narrow - the denial has to be about legality and it
 * has to be in the same clause as the move - because widening it would
 * silence real faults, and this rule is one a build depends on.
 */
export function deniedAt(note, token) {
  const clause = clauseAround(note, token.start, token.end)
  return DENIAL.test(clause) || FLAT.test(clause)
}
