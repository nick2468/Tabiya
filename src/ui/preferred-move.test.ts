import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { preferredShapes } from './Play'
import type { GameReport, PlayedMove } from '../play/report'

/**
 * The engine's preferred move as an arrow, phase 37.
 *
 * The arrow is UI over a pure value: which slip the replay is standing on,
 * and the SAN the report carries for it. This pins the arithmetic; the
 * screen only draws what it is given.
 */

function playedMoves(sans: string[]): PlayedMove[] {
  const chess = new Chess()
  return sans.map((san, ply) => {
    const fen = chess.fen()
    const move = chess.move(san)
    return { ply, san: move.san, colour: ply % 2 === 0 ? 'white' : 'black', fen, after: chess.fen() }
  })
}

const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3'])

const report: GameReport = {
  deviation: { kind: 'stayed-in-book' },
  slips: [
    { ply: 6, san: 'Nf3', before: 0.5, after: 0.1, loss: 0.4, tag: 'inaccuracy', better: 'Nc3' },
    { ply: 2, san: 'Bf4', before: 0.3, after: -0.3, loss: 0.6, tag: 'inaccuracy' },
  ],
  verdict: 'Level',
  finalEval: 0.1,
}

describe('preferredShapes', () => {
  it('draws the preferred move in blue on the position the slip was played from', () => {
    // Replay ply 6 is the position before the seventh move, 4.Nf3.
    expect(preferredShapes(report, 6, moves[6].fen)).toEqual([
      { orig: 'b1', dest: 'c3', brush: 'blue' },
    ])
  })

  it('draws nothing anywhere else', () => {
    expect(preferredShapes(report, 7, moves[6].after)).toEqual([])
    expect(preferredShapes(report, 5, moves[5].fen)).toEqual([])
  })

  it('draws nothing for a slip that carries no preferred move', () => {
    expect(preferredShapes(report, 2, moves[2].fen)).toEqual([])
  })
})
