/**
 * The second engine pass: Stockfish over the authored MISTAKE entries.
 *
 * engine-pass.mjs checks the moves the course tells the trainee to play. It
 * never looks at the graded alternatives beside them, and phase 9 found three
 * mistake entries whose stated punishment was not merely wrong but lost
 * material for the side supposedly doing the punishing. A wrong grade teaches
 * a wrong lesson just as effectively as a wrong repertoire move.
 *
 * Method. For every mistake entry, evaluate the position after the repertoire
 * move and the position after the mistake, both from the same parent. The
 * difference is what the alternative costs. Then compare that with the grade
 * the author gave it and report the pairs that disagree.
 *
 * Bands, in pawns lost against the repertoire move:
 *   playable     under 0.90
 *   inaccuracy   -0.40 to 1.80
 *   mistake      over 0.70
 * The bands are wide and they overlap, because a grade is a teaching
 * judgement and not a number. An inaccuracy is often a positional error the
 * engine scores at zero, and saying so is the point of the entry. What the
 * bands catch is the disagreement that cannot be a judgement call: an
 * alternative called playable that drops a pawn, one called a mistake that
 * costs nothing, and any alternative the engine actually prefers to the
 * repertoire move.
 *
 * What this still does not check: the prose. A note can name a punishment that
 * does not exist while the grade is perfectly fair, so read the note of every
 * entry this flags, and of every entry whose note names a concrete capture.
 *
 * Usage: node scripts/engine-mistakes.mjs <course-folder> [movetime-ms]
 */
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Chess } from 'chess.js'

const require = createRequire(import.meta.url)
const initEngine = require('stockfish')

const folder = process.argv[2] ?? 'courses/slav-black'
const MOVETIME = Number(process.argv[3] ?? 500)

const BANDS = {
  playable: { min: -99, max: 0.9 },
  inaccuracy: { min: -0.4, max: 1.8 },
  mistake: { min: 0.7, max: 99 },
}

const manifest = JSON.parse(readFileSync(join(folder, 'course.json'), 'utf8'))
const student = manifest.colour === 'white' ? 'w' : 'b'

/** Every authored mistake entry, deduplicated by position and move. */
const entries = new Map()

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
        const key = `${fen}|${mistake.san}`
        if (entries.has(key)) continue
        const probe = new Chess(fen)
        probe.move(mistake.san)
        entries.set(key, {
          played: board.fen(),
          wrong: probe.fen(),
          san: node.san,
          alt: mistake.san,
          grade: mistake.grade,
          note: mistake.note,
          path,
          chapter: chapter.id,
        })
      }
    }
    for (const child of node.children ?? []) walk(child, board.fen(), here, depth + 1)
  }
  for (const node of chapter.tree) walk(node, base.fen(), chapter.stem, 0)
}

const positions = new Set()
for (const entry of entries.values()) {
  positions.add(entry.played)
  positions.add(entry.wrong)
}

console.log(
  `${entries.size} mistake entries across ${manifest.chapters.length} chapters, ` +
    `${positions.size} positions to evaluate at ${MOVETIME} ms each.`,
)

const engine = await initEngine('lite-single')
let onLine = () => {}
engine.listener = (line) => onLine(line)
const send = (command) => engine.sendCommand(command)

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
      score = match[1] === 'mate' ? (raw > 0 ? 100 : -100) : raw / 100
    }
    return line.startsWith('bestmove') ? true : false
  })
  if (score === null) return null
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
for (const entry of entries.values()) {
  const played = evals.get(entry.played)
  const wrong = evals.get(entry.wrong)
  if (played === null || wrong === null) continue
  const cost = student === 'b' ? wrong - played : played - wrong
  const band = BANDS[entry.grade]
  if (!band) continue
  if (cost < band.min) findings.push({ ...entry, cost, verdict: 'graded too harshly' })
  else if (cost > band.max) findings.push({ ...entry, cost, verdict: 'graded too kindly' })
}

findings.sort((a, b) => Math.abs(b.cost) - Math.abs(a.cost))
console.log(`\n${findings.length} entries where the grade and the engine disagree:\n`)
for (const finding of findings) {
  console.log(
    `${finding.cost >= 0 ? ' ' : ''}${finding.cost.toFixed(2)}  ${finding.grade.padEnd(10)} ` +
      `${finding.verdict}  ${finding.chapter}\n` +
      `      ${finding.path.join(' ')} : ${finding.san} not ${finding.alt}\n` +
      `      "${finding.note}"`,
  )
}
process.exit(0)
