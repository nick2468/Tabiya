/**
 * The engine pass: Stockfish over every student move in a course.
 *
 * The standing rule (PLAN.md, phases 4 and 5) is that authored chess prose is
 * unverified until the engine has been over it. Human review missed real
 * tactics three times in v1, including a reviewer's own claim, so this runs
 * before a course is called done.
 *
 * Method. Collect every position where the student is to move, together with
 * the repertoire move. Evaluate the position itself and the position after the
 * move, both at a fixed movetime. The difference is what the move cost.
 *
 * Signs. UCI reports `score cp` from the point of view of the side to move, so
 * every score here is flipped into White's point of view first. A Black move
 * that gives something away therefore makes the number go UP.
 *
 * Blind spot, recorded at phase 5 and still true: this checks the student's
 * moves only. It says nothing about whether the opponent replies are the ones
 * a club player would actually choose, or whether the weights are sensible.
 *
 * Usage: node scripts/engine-pass.mjs <course-folder> [movetime-ms]
 */
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Chess } from 'chess.js'

const require = createRequire(import.meta.url)
const initEngine = require('stockfish')

const folder = process.argv[2] ?? 'courses/caro-kann-black'
const MOVETIME = Number(process.argv[3] ?? 500)
/** Report anything that costs this much or more, in pawns. */
const THRESHOLD = 0.5

const manifest = JSON.parse(readFileSync(join(folder, 'course.json'), 'utf8'))
const student = manifest.colour === 'white' ? 'w' : 'b'

/** Every student-to-move position in the course, deduplicated by position. */
const moves = new Map()

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
      const key = `${fen}|${node.san}`
      if (!moves.has(key)) {
        moves.set(key, { before: fen, after: board.fen(), san: node.san, path: here, chapter: chapter.id })
      }
    }
    for (const child of node.children ?? []) walk(child, board.fen(), here, depth + 1)
  }
  for (const node of chapter.tree) walk(node, base.fen(), chapter.stem, 0)
}

const positions = new Set()
for (const move of moves.values()) {
  positions.add(move.before)
  positions.add(move.after)
}

console.log(
  `${moves.size} student moves across ${manifest.chapters.length} chapters, ` +
    `${positions.size} positions to evaluate at ${MOVETIME} ms each.`,
)

const engine = await initEngine('lite-single')

let onLine = () => {}
engine.listener = (line) => onLine(line)

function send(command) {
  engine.sendCommand(command)
}

function until(predicate) {
  return new Promise((resolve) => {
    onLine = (line) => {
      const done = predicate(line)
      if (done !== undefined && done !== false) {
        onLine = () => {}
        resolve(done)
      }
    }
  })
}

send('uci')
await until((line) => line.startsWith('uciok'))
send('setoption name Threads value 1')
send('isready')
await until((line) => line.startsWith('readyok'))

/** Evaluation in pawns from White's point of view. */
async function evaluate(fen) {
  send(`position fen ${fen}`)
  let score = null
  send(`go movetime ${MOVETIME}`)
  await until((line) => {
    const match = /score (cp|mate) (-?\d+)/.exec(line)
    if (match) {
      const raw = Number(match[2])
      // A mate score is clamped so that one forced mate does not swamp every
      // number in the report; the sign is what matters.
      score = match[1] === 'mate' ? (raw > 0 ? 100 : -100) : raw / 100
    }
    return line.startsWith('bestmove') ? true : false
  })
  if (score === null) return null
  // UCI scores are from the side to move; flip Black's into White's view.
  return fen.split(' ')[1] === 'b' ? -score : score
}

const evals = new Map()
let done = 0
for (const fen of positions) {
  evals.set(fen, await evaluate(fen))
  done += 1
  if (done % 25 === 0) console.error(`  ...${done}/${positions.size}`)
}

const findings = []
for (const move of moves.values()) {
  const before = evals.get(move.before)
  const after = evals.get(move.after)
  if (before === null || after === null) continue
  // White's point of view, so a Black move that gives something away raises it.
  const loss = student === 'b' ? after - before : before - after
  if (loss >= THRESHOLD) findings.push({ ...move, before, after, loss })
}

findings.sort((a, b) => b.loss - a.loss)
console.log(`\n${findings.length} moves cost ${THRESHOLD} of a pawn or more:\n`)
for (const finding of findings) {
  console.log(
    `${finding.loss.toFixed(2)}  ${finding.chapter}  ${finding.path.join(' ')}\n` +
      `      before ${finding.before.toFixed(2)}  after ${finding.after.toFixed(2)}`,
  )
}
process.exit(0)
