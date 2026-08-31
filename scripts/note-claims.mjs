/**
 * The third pass: the material claims the NOTES make, played out on a board.
 *
 * The two engine passes judge moves. Neither reads a word of the prose, and a
 * note can name a punishment that does not exist while the grade beside it is
 * perfectly fair. Review gate 9 found one of those in the Caro-Kann: "6.Nxe4
 * wins the bishop" in a position where 6...dxe4 takes back. The grade was
 * right, so no engine pass could ever have seen it.
 *
 * What this checks. For a mistake entry the wrong move is authored, so the
 * position is known. Parse the move sequence the note names, play it from
 * there, resolve any captures still hanging on the last square, and compare
 * the material that actually changed hands with the material the note claims.
 *
 * Two traps this is designed around, both of which produce false positives in
 * the naive version, and both of which gate 9 hit:
 *
 * 1. A note usually names a SEQUENCE, not a capture: "9.Nxd5 Nxd5 10.Qxd5 wins
 *    a pawn". Playing only the first move reports a lost knight that the next
 *    move takes back. So the whole run of moves is parsed and played, and the
 *    run ends where the prose resumes: moves separated by nothing but spaces
 *    and move numbers belong to the sequence, and anything else ends it. That
 *    parsing now lives in `lib/note-parse.mjs`, shared with `note-lines.mjs`.
 * 2. The alternative move is often ITSELF a capture, like ...Bxc3 answered by
 *    bxc3. Material is therefore measured from the position BEFORE the
 *    alternative, so an even trade nets zero instead of reading as a blunder.
 *
 * And one thing the naive version gets backwards: a note that stops after one
 * capture is making a claim about what happens next, so a static exchange
 * evaluation runs on the last captured square. That is what separates "7.Bxf5
 * wins the bishop", where nothing recaptures, from "6.Nxe4 wins the bishop",
 * where a pawn does.
 *
 * The baseline is the REPERTOIRE line, not the position before the choice. A
 * note says what the alternative costs against the move the course plays, and
 * those differ whenever the repertoire move is a recapture: after 3.cxd5 Black
 * is a pawn down until ...cxd5 takes it back, so "4.dxc6 Nxc6 leaves Black a
 * pawn down" is true against ...cxd5 and reads as nothing against the position
 * before it.
 *
 * What it does NOT check: notes that make a claim without naming a move
 * ("it drops a piece"), which it lists separately for a human, and every note
 * that is a positional judgement rather than a material one. Those stay a
 * reading job.
 *
 * Usage: node scripts/note-claims.mjs <course-folder>
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Chess } from 'chess.js'
import { sequenceIn } from './lib/note-parse.mjs'

const folder = process.argv[2] ?? 'courses/london-white'

const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

/** What a phrase in a note claims the move costs, in pawns. */
const CLAIMS = [
  { re: /\b(?:wins?|win)\s+(?:back\s+)?(?:a|the)\s+queen\b/i, cost: 9 },
  { re: /\b(?:wins?|win)\s+(?:a|the)\s+rook\b/i, cost: 5 },
  { re: /\b(?:wins?|win)\s+(?:a|the)\s+exchange\b/i, cost: 2 },
  { re: /\b(?:wins?|win)\s+(?:a|the)\s+(?:piece|bishop|knight)\b/i, cost: 3 },
  { re: /\b(?:wins?|win)\s+(?:a|the)\s+pawn\b/i, cost: 1 },
  { re: /\b(?:the\s+)?queen\s+(?:is\s+gone|goes|falls|drops)\b/i, cost: 9 },
  { re: /\bloses?\s+(?:a|the|his|her|its)\s+queen\b/i, cost: 9 },
  { re: /\bloses?\s+(?:a|the)\s+(?:piece|bishop|knight)\b/i, cost: 3 },
  { re: /\bloses?\s+(?:a|the)\s+rook\b/i, cost: 5 },
  { re: /\bloses?\s+(?:a|the)\s+exchange\b/i, cost: 2 },
  { re: /\bloses?\s+(?:a|the)\s+pawn\b/i, cost: 1 },
  { re: /\ba\s+piece\s+down\b/i, cost: 3 },
  { re: /\ba\s+pawn\s+down\b/i, cost: 1 },
  { re: /\b(?:drops|hangs)\s+(?:a|the)\s+(?:piece|bishop|knight)\b/i, cost: 3 },
  { re: /\b(?:drops|hangs)\s+(?:a|the)\s+pawn\b/i, cost: 1 },
  { re: /\b(?:drops|hangs)\s+(?:a|the)\s+rook\b/i, cost: 5 },
  { re: /\b(?:drops|hangs)\s+(?:a|the)\s+queen\b/i, cost: 9 },
]

/**
 * The claim a note makes, or null when it makes none this can check.
 *
 * A negated claim is not a claim: "it does not lose a pawn, because 7.Qxd5
 * would run into 7...Qxc1+" is a note about why the move is SAFE, and reading
 * it as a promise of material is how a checker earns its distrust.
 */
function claimOf(note) {
  for (const claim of CLAIMS) {
    const match = claim.re.exec(note)
    if (!match) continue
    // Only the clause the claim sits in can negate it. "It is not a trade:
    // 7.Bxf5 simply wins the bishop" is a claim; "it does not lose a pawn"
    // is not, and a negation two clauses away is neither.
    const clause = note.slice(0, match.index).split(/[,;:.]/).pop()
    if (/\b(?:not|never|cannot|hardly|without)\b/i.test(clause)) continue
    return claim
  }
  return null
}

/** Material from the student's point of view, in pawns. */
function material(board, student) {
  let total = 0
  for (const row of board.board()) {
    for (const square of row) {
      if (!square) continue
      total += (square.color === student ? 1 : -1) * VALUE[square.type]
    }
  }
  return total
}

/**
 * Static exchange evaluation on one square: what the side to move gains by
 * carrying the captures there through to the end, or nothing if it declines.
 */
function see(board, square) {
  const captures = board
    .moves({ verbose: true })
    .filter((move) => move.to === square && move.captured)
  if (!captures.length) return 0
  captures.sort((a, b) => VALUE[a.piece] - VALUE[b.piece])
  const best = captures[0]
  const won = VALUE[best.captured]
  board.move(best)
  const gain = Math.max(0, won - see(board, square))
  board.undo()
  return gain
}

const manifest = JSON.parse(readFileSync(join(folder, 'course.json'), 'utf8'))
const student = manifest.colour === 'white' ? 'w' : 'b'

const checked = []
const unsequenced = []
let entries = 0

for (const file of manifest.chapters) {
  const chapter = JSON.parse(readFileSync(join(folder, file), 'utf8'))
  const base = new Chess()
  for (const san of chapter.stem) base.move(san)

  const walk = (node, fen, path, depth) => {
    const ply = chapter.stem.length + depth
    const colour = ply % 2 === 0 ? 'w' : 'b'
    const board = new Chess(fen)
    board.move(node.san)
    const here = [...path, node.san]
    if (colour === student) {
      for (const mistake of node.mistakes ?? []) {
        entries += 1
        const claim = claimOf(mistake.note)
        if (!claim) continue
        const { moves, number } = sequenceIn(mistake.note)
        const context = {
          chapter: chapter.id,
          path,
          san: node.san,
          alt: mistake.san,
          grade: mistake.grade,
          note: mistake.note,
          claim: claim.cost,
        }
        if (!moves.length) {
          unsequenced.push(context)
          continue
        }
        // The baseline is the position after the move the course actually
        // plays, resolved the same way, so a repertoire recapture counts.
        const main = new Chess(fen)
        const played_main = main.move(node.san)
        let before = material(main, student)
        if (played_main.captured) {
          const swing = see(main, played_main.to)
          before += main.turn() === student ? swing : -swing
        }
        const probe = new Chess(fen)
        probe.move(mistake.san)
        // The note's move number has to match the position, or the sequence
        // it names starts somewhere this check cannot see.
        const aligned = number === null || number === probe.moveNumber()
        let played = 0
        let last = null
        for (const san of moves) {
          try {
            const move = probe.move(san)
            last = move.captured ? move.to : null
            played += 1
          } catch {
            break
          }
        }
        let after = material(probe, student)
        if (last) {
          const swing = see(probe, last)
          after += probe.turn() === student ? swing : -swing
        }
        checked.push({ ...context, aligned, played, moves, cost: before - after })
      }
    }
    for (const child of node.children ?? []) walk(child, board.fen(), here, depth + 1)
  }
  for (const node of chapter.tree) walk(node, base.fen(), chapter.stem, 0)
}

/** A claim fails when the board gives up much less than the note promises. */
const failures = checked.filter((row) => row.played === 0 || row.cost < row.claim * 0.6)

console.log(
  `${entries} mistake entries, ${checked.length} with a material claim and a move ` +
    `sequence to check it, ${unsequenced.length} claiming material without naming a move.`,
)

console.log(`\n${failures.length} claims the board does not support:\n`)
for (const row of failures) {
  const reason =
    row.played === 0
      ? 'the sequence does not play from this position'
      : `claims ${row.claim}, the board gives ${row.cost.toFixed(1)}`
  console.log(
    `  ${row.chapter}  ${row.path.join(' ')} : ${row.san} not ${row.alt}  [${row.grade}]\n` +
      `      ${reason}${row.aligned ? '' : ' (and the move number does not match the position)'}\n` +
      `      "${row.note}"`,
  )
}

if (unsequenced.length) {
  console.log(`\n${unsequenced.length} claiming material with no sequence to check, for a human:\n`)
  for (const row of unsequenced) {
    console.log(`  ${row.chapter}  ${row.san} not ${row.alt}: "${row.note}"`)
  }
}
