import { describe, expect, it } from 'vitest'
import {
  countsAsCorrect,
  judge,
  ratingFor,
  sanForMove,
  verdictDetail,
  verdictHeadline,
} from './grade'
import type { Card } from './cards'

/** The position after 1.d4 d5 2.Bf4 Nf6, where the repertoire plays 3.e3. */
const card: Card = {
  key: 'rnbqkb1r/ppp1pppp/5n2/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -',
  fen: 'rnbqkb1r/ppp1pppp/5n2/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq - 2 3',
  san: 'e3',
  from: 'e2',
  to: 'e3',
  note: 'Complete the triangle, with the bishop safely outside it.',
  mistakes: [
    { san: 'Nf3', grade: 'playable', note: 'Also good and it usually transposes.' },
    { san: 'Nc3', grade: 'inaccuracy', note: 'It blocks the c-pawn.' },
    { san: 'Bxc7', grade: 'mistake', note: 'It drops the bishop to ...Qxc7.' },
  ],
  tags: ['development'],
  chapterIds: ['ch1'],
  lineIds: ['ch1:line'],
  label: '3.e3',
}

describe('judge', () => {
  it('knows the repertoire move', () => {
    expect(judge(card, 'e3')).toEqual({ kind: 'exact', san: 'e3' })
  })

  it("returns the author's own grade and reason for a listed try", () => {
    expect(judge(card, 'Nc3')).toEqual({
      kind: 'listed',
      san: 'Nc3',
      grade: 'inaccuracy',
      note: 'It blocks the c-pawn.',
    })
  })

  it('says only that an unlisted move is not the repertoire move', () => {
    expect(judge(card, 'h3')).toEqual({ kind: 'unlisted', san: 'h3' })
  })
})

describe('ratingFor', () => {
  it('gives the repertoire move a good', () => {
    expect(ratingFor(judge(card, 'e3'))).toBe('good')
  })

  it('gives a playable or inaccurate try a hard', () => {
    expect(ratingFor(judge(card, 'Nf3'))).toBe('hard')
    expect(ratingFor(judge(card, 'Nc3'))).toBe('hard')
  })

  it('gives a listed mistake an again', () => {
    expect(ratingFor(judge(card, 'Bxc7'))).toBe('again')
  })

  it('gives an unlisted move an again', () => {
    expect(ratingFor(judge(card, 'h3'))).toBe('again')
  })
})

describe('countsAsCorrect', () => {
  it('counts only the repertoire move', () => {
    expect(countsAsCorrect(judge(card, 'e3'))).toBe(true)
    expect(countsAsCorrect(judge(card, 'Nf3'))).toBe(false)
    expect(countsAsCorrect(judge(card, 'h3'))).toBe(false)
  })
})

describe('what the trainee is told', () => {
  it('names the grade the author gave', () => {
    expect(verdictHeadline(judge(card, 'e3'))).toBe('Correct')
    expect(verdictHeadline(judge(card, 'Nf3'))).toBe('Playable, but not the repertoire move')
    expect(verdictHeadline(judge(card, 'Nc3'))).toBe('An inaccuracy')
    expect(verdictHeadline(judge(card, 'Bxc7'))).toBe('A mistake')
    expect(verdictHeadline(judge(card, 'h3'))).toBe('Not the repertoire move')
  })

  it("explains a listed try in the author's words", () => {
    expect(verdictDetail(card, judge(card, 'Nc3'))).toBe('It blocks the c-pawn.')
  })

  it('does not pretend to judge a move nobody wrote about', () => {
    const detail = verdictDetail(card, judge(card, 'h3'))
    expect(detail).toContain('has nothing to say about h3')
    expect(detail).toContain('it may well be a good move')
    expect(detail).toContain('The line plays e3')
    // It must never call the move bad.
    expect(detail).not.toMatch(/mistake|wrong|bad|inaccura/i)
  })
})

describe('sanForMove', () => {
  it('turns a move made on the board into notation', () => {
    expect(sanForMove(card.fen, 'e2', 'e3')).toBe('e3')
    expect(sanForMove(card.fen, 'b1', 'c3')).toBe('Nc3')
  })

  it('returns nothing for a move that is not legal', () => {
    expect(sanForMove(card.fen, 'e2', 'e5')).toBeNull()
  })

  it('promotes to a queen, which is all this repertoire needs', () => {
    const promoting = '8/4P3/8/8/8/8/8/4K2k w - - 0 1'
    expect(sanForMove(promoting, 'e7', 'e8')).toBe('e8=Q')
  })
})
