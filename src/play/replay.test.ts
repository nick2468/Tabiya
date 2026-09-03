import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { clampPly, moveAtPly, plyAfterMove, plyBeforeMove, positionAtPly } from './replay'
import type { PlayedMove } from './report'

/**
 * The arithmetic behind walking a finished game.
 *
 * The one that is easy to get wrong by one is which position a slip points at:
 * the report calls a move a mistake, and the position worth looking at is the
 * one it was played FROM.
 */

function playedMoves(sans: string[]): PlayedMove[] {
  const chess = new Chess()
  return sans.map((san, index) => {
    const fen = chess.fen()
    const move = chess.move(san)
    return {
      ply: index,
      san: move.san,
      colour: move.color === 'w' ? ('white' as const) : ('black' as const),
      fen,
      after: chess.fen(),
    }
  })
}

const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6'])

describe('positionAtPly', () => {
  it('is where the game started at ply 0', () => {
    expect(positionAtPly(moves, 0)).toBe(moves[0].fen)
  })

  it('is the position after each move', () => {
    expect(positionAtPly(moves, 1)).toBe(moves[0].after)
    expect(positionAtPly(moves, 4)).toBe(moves[3].after)
  })

  it('stops at both ends rather than walking off the game', () => {
    expect(positionAtPly(moves, -3)).toBe(moves[0].fen)
    expect(positionAtPly(moves, 99)).toBe(moves[3].after)
  })

  it('has nothing to show for a game with no moves', () => {
    expect(positionAtPly([], 0)).toBeNull()
    expect(moveAtPly([], 2)).toBeNull()
  })
})

describe('moveAtPly', () => {
  it('is the move that led to the position, for the highlight', () => {
    expect(moveAtPly(moves, 0)).toBeNull()
    expect(moveAtPly(moves, 1)?.san).toBe('d4')
    expect(moveAtPly(moves, 4)?.san).toBe('Nf6')
  })
})

describe('clampPly', () => {
  it('keeps a held-down arrow key inside the game', () => {
    expect(clampPly(moves, -1)).toBe(0)
    expect(clampPly(moves, 4)).toBe(4)
    expect(clampPly(moves, 5)).toBe(4)
  })
})

describe('which position a slip points at', () => {
  it('is the one the move was played FROM, not the one it led to', () => {
    // The report's slip carries the move's own ply index. Bf4 is index 2, so
    // the board goes to the position after two moves, with Bf4 still to play.
    expect(plyBeforeMove(2)).toBe(2)
    expect(positionAtPly(moves, plyBeforeMove(2))).toBe(moves[2].fen)
    expect(moveAtPly(moves, plyBeforeMove(2))?.san).toBe('d5')
  })

  it('has an after as well, for anything that wants the result', () => {
    expect(plyAfterMove(2)).toBe(3)
    expect(positionAtPly(moves, plyAfterMove(2))).toBe(moves[2].after)
  })

  it('does not go behind the start of the game for the first move', () => {
    expect(plyBeforeMove(0)).toBe(0)
    expect(positionAtPly(moves, plyBeforeMove(0))).toBe(moves[0].fen)
  })
})
