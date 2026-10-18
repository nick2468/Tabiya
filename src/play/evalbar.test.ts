import { describe, expect, it } from 'vitest'
import type { Score } from '../engine'
import {
  evalBarLayout,
  evalShare,
  evalText,
  evaluationOf,
  numberPlacement,
  shownEvaluation,
  type Evaluation,
} from './evalbar'
import { positionKey } from '../model/position'
import type { Colour } from '../model/types'
import type { PlayedMove } from './report'

/**
 * The bar's arithmetic, which is the half of it that can be wrong quietly.
 *
 * A bar drawn upside down still looks like a bar, and a number with the wrong
 * sign still looks like a number. So the share, the orientation and the text
 * are pure functions and this is what holds them.
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

describe('the number on the bar', () => {
  const cp = (centipawns: number): Score => ({ kind: 'cp', centipawns })
  const mate = (moves: number): Score => ({ kind: 'mate', moves })

  // The same evaluation reached from either side to move: the engine's sign
  // flips with the side, and the printed text must not.
  const cases: { score: Score; side: Colour; text: string }[] = [
    { score: cp(40), side: 'white', text: '+0.4' },
    { score: cp(-40), side: 'black', text: '+0.4' },
    { score: cp(-120), side: 'white', text: '-1.2' },
    { score: cp(120), side: 'black', text: '-1.2' },
    { score: cp(3), side: 'white', text: '0.0' },
    { score: cp(-3), side: 'white', text: '0.0' },
    { score: cp(3), side: 'black', text: '0.0' },
    { score: mate(5), side: 'white', text: 'M5' },
    { score: mate(-5), side: 'black', text: 'M5' },
    { score: mate(5), side: 'black', text: '-M5' },
    { score: mate(-5), side: 'white', text: '-M5' },
  ]

  for (const { score, side, text } of cases) {
    const said = score.kind === 'cp' ? `cp ${score.centipawns}` : `mate ${score.moves}`
    it(`prints ${text} for ${said} with ${side} to move`, () => {
      expect(evalText(score, side)).toBe(text)
      expect(evaluationOf(score, side).text).toBe(text)
    })
  }

  it('never prints -0.0', () => {
    expect(evalText(cp(-3), 'white')).not.toBe('-0.0')
    expect(evalText(cp(4), 'black')).toBe('0.0')
  })

  it('gives a mate already delivered to the side not to move: M0 with its sign', () => {
    // Mate 0 means the side to move is mated, so the other side has the mate.
    expect(evalText(mate(0), 'black')).toBe('M0')
    expect(evalText(mate(0), 'white')).toBe('-M0')
  })

  it('draws the share to match each number', () => {
    expect(evalShare(evaluationOf(cp(40), 'white').pawns)).toBeGreaterThan(50)
    expect(evalShare(evaluationOf(cp(120), 'black').pawns)).toBeLessThan(50)
    expect(evalShare(evaluationOf(cp(3), 'white').pawns)).toBeCloseTo(50, 0)
    expect(evalShare(evaluationOf(mate(5), 'white').pawns)).toBeGreaterThan(99)
    expect(evalShare(evaluationOf(mate(5), 'black').pawns)).toBeLessThan(1)
  })
})

describe('what the bar shows while the engine thinks', () => {
  const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  const afterE4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'
  const moves: PlayedMove[] = [
    { ply: 0, san: 'e4', colour: 'white', fen: start, after: afterE4 },
  ]
  const entry = (pawns: number, text: string): Evaluation => ({ pawns, text })

  it('shows the position own evaluation when there is one', () => {
    const evaluations = new Map([[positionKey(afterE4), entry(0.4, '+0.4')]])
    expect(shownEvaluation(afterE4, moves, evaluations)).toEqual(entry(0.4, '+0.4'))
  })

  it('holds the last value while the new position has none', () => {
    const evaluations = new Map([[positionKey(start), entry(0.1, '+0.1')]])
    expect(shownEvaluation(afterE4, moves, evaluations)).toEqual(entry(0.1, '+0.1'))
  })

  it('shows nothing at all when nothing has been evaluated', () => {
    expect(shownEvaluation(afterE4, moves, new Map())).toBeUndefined()
  })
})

describe('where the number goes', () => {
  /**
   * Four cases, because two things decide it: which share is larger, and
   * which way up the bar is. The number belongs in the larger share, at the
   * end of the bar rather than at the join, so it is never printed across the
   * line between the two colours.
   */
  it('sits at the bottom for a White student who is ahead', () => {
    expect(numberPlacement(evalBarLayout(1, 'white'))).toEqual({ edge: 'bottom', onWhite: true })
  })

  it('sits at the top for a White student who is behind', () => {
    expect(numberPlacement(evalBarLayout(-1, 'white'))).toEqual({ edge: 'top', onWhite: false })
  })

  it('sits at the top for a Black student when White is ahead', () => {
    expect(numberPlacement(evalBarLayout(1, 'black'))).toEqual({ edge: 'top', onWhite: true })
  })

  it('sits at the bottom for a Black student who is ahead', () => {
    expect(numberPlacement(evalBarLayout(-1, 'black'))).toEqual({ edge: 'bottom', onWhite: false })
  })

  /** A level position is half White's, so the number goes on White's share. */
  it('counts an even position as part of the white share', () => {
    expect(numberPlacement(evalBarLayout(0, 'white'))).toEqual({ edge: 'bottom', onWhite: true })
  })
})
