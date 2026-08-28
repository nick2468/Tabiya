/**
 * Ask Stockfish about one position, given the moves that reach it.
 *
 * The companion to engine-pass.mjs: the pass says which authored move cost
 * something, and this says what the engine would have played instead. Scores
 * are printed from WHITE's point of view, so a positive number favours White
 * whichever side is to move.
 *
 * Usage: node scripts/engine-ask.mjs "e4 c6 d4 d5 e5 Bf5" [movetime-ms] [lines]
 */
import { createRequire } from 'node:module'
import { Chess } from 'chess.js'

const require = createRequire(import.meta.url)
const initEngine = require('stockfish')

const line = (process.argv[2] ?? '').trim().split(/\s+/).filter(Boolean)
const MOVETIME = Number(process.argv[3] ?? 1500)
const LINES = Number(process.argv[4] ?? 3)

const board = new Chess()
for (const san of line) board.move(san)
const fen = board.fen()

const engine = await initEngine('lite-single')
let onLine = () => {}
engine.listener = (text) => onLine(text)
const send = (command) => engine.sendCommand(command)
const until = (predicate) =>
  new Promise((resolve) => {
    onLine = (text) => {
      const done = predicate(text)
      if (done) {
        onLine = () => {}
        resolve(done)
      }
    }
  })

send('uci')
await until((text) => text.startsWith('uciok'))
send(`setoption name MultiPV value ${LINES}`)
send('isready')
await until((text) => text.startsWith('readyok'))
send(`position fen ${fen}`)

const best = new Map()
send(`go movetime ${MOVETIME}`)
await until((text) => {
  const match = /multipv (\d+) score (cp|mate) (-?\d+).* pv ((?:[a-h][1-8][a-h][1-8][qrbn]?\s*)+)/.exec(text)
  if (match) best.set(match[1], match)
  return text.startsWith('bestmove')
})

console.log(`${board.turn() === 'w' ? 'White' : 'Black'} to move after: ${line.join(' ')}`)
for (const key of [...best.keys()].sort()) {
  const [, , kind, raw, pv] = best.get(key)
  const cp = kind === 'mate' ? (Number(raw) > 0 ? 100 : -100) : Number(raw) / 100
  const white = board.turn() === 'b' ? -cp : cp
  // Turn the engine's coordinate moves back into notation a reader can follow.
  const replay = new Chess(fen)
  const sans = []
  for (const uci of pv.trim().split(/\s+/).slice(0, 6)) {
    const move = replay.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    if (!move) break
    sans.push(move.san)
  }
  console.log(`  ${white >= 0 ? '+' : ''}${white.toFixed(2)}  ${sans.join(' ')}`)
}
process.exit(0)
