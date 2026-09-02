import { describe, expect, it } from 'vitest'
import { evalBarLayout, evalShare, shownEvaluation } from './evalbar'
import { positionKey } from '../model/position'
import type { PlayedMove } from './report'

/**
 * The bar's arithmetic, which is the half of it that can be wrong quietly.
 *
 * A bar drawn upside down still looks like a bar. So the share and the
 * orientation are a pure function and this is what holds them.
 */

describe('the evaluation bar', () => {
  it('is level at level', () => {
    expect(evalShare(0)).toBe(50)
  })

  it('gives White more of it when White is better, and never all of it', () => {
    expect(evalShare(1)).toBeGreaterThan(50)
    expect(evalShare(3)).toBeGreaterThan(evalShare(1))
    expect(evalShare(100)).toBeLessThanOrEqual(100)
    expect(evalShare(-100)).toBeGreaterThanOrEqual(0)
  })

  it('is symmetrical, so a pawn up reads the same either way round', () => {
    expect(evalShare(1) + evalShare(-1)).toBeCloseTo(100)
  })

  it('puts White at the bottom for a White student and at the top for a Black one', () => {
    expect(evalBarLayout(0, 'white').whiteAtBottom).toBe(true)
    expect(evalBarLayout(0, 'black').whiteAtBottom).toBe(false)
    // The share itself does not flip: it is White's share either way, and the
    // end it is drawn from is what carries the trainee's point of view.
    expect(evalBarLayout(1, 'black').whiteShare).toBe(evalBarLayout(1, 'white').whiteShare)
  })
})

describe('what the bar shows while the engine thinks', () => {
  const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  const afterE4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
  const moves: PlayedMove[] = [
    { ply: 0, san: 'e4', colour: 'white', fen: start, after: afterE4 },
  ]

  it('shows the position own evaluation when there is one', () => {
    const evaluations = new Map([[positionKey(afterE4), 0.4]])
    expect(shownEvaluation(afterE4, moves, evaluations)).toBe(0.4)
  })

  it('holds the last value while the new position has none', () => {
    const evaluations = new Map([[positionKey(start), 0.1]])
    expect(shownEvaluation(afterE4, moves, evaluations)).toBe(0.1)
  })

  it('shows nothing at all when nothing has been evaluated', () => {
    expect(shownEvaluation(afterE4, moves, new Map())).toBeUndefined()
  })
})
