import { describe, expect, it } from 'vitest'
import { parsePgn } from './pgn'

/**
 * The parser has one job the rest of the model depends on: keep the tree.
 * chess.js drops variations silently, which is why this exists, so the tests
 * that matter most are the ones about branches surviving.
 */

describe('parsePgn', () => {
  it('reads header tags and the comment before the first move', () => {
    const { games, errors } = parsePgn(
      '[CourseId "demo"]\n[ChapterTitle "First"]\n\n{The intro.}\n\n1. e4 e5 *\n',
    )
    expect(errors).toEqual([])
    expect(games).toHaveLength(1)
    expect(games[0].tags).toEqual({ CourseId: 'demo', ChapterTitle: 'First' })
    expect(games[0].intro).toBe('The intro.')
    expect(games[0].moves.map((move) => move.san)).toEqual(['e4', 'e5'])
  })

  it('keeps a variation as an alternative to the move it follows', () => {
    const { games, errors } = parsePgn('1. e4 e5 (1... c5 {The Sicilian.}) 2. Nf3 *')
    expect(errors).toEqual([])
    const [first, second, third] = games[0].moves
    expect(first.san).toBe('e4')
    expect(second.san).toBe('e5')
    expect(third.san).toBe('Nf3')
    expect(second.variations).toHaveLength(1)
    expect(second.variations[0][0].san).toBe('c5')
    expect(second.variations[0][0].comment).toBe('The Sicilian.')
  })

  it('keeps a variation inside a variation', () => {
    const { games, errors } = parsePgn('1. d4 d5 (1... Nf6 2. c4 (2. Bf4 {A London.}) 2... g6) *')
    expect(errors).toEqual([])
    const black = games[0].moves[1]
    const sideline = black.variations[0]
    expect(sideline.map((move) => move.san)).toEqual(['Nf6', 'c4', 'g6'])
    expect(sideline[1].variations[0][0].san).toBe('Bf4')
    expect(sideline[1].variations[0][0].comment).toBe('A London.')
  })

  it('reads a glyph written against the move and one written apart from it', () => {
    const { games } = parsePgn('1. e4 e5 (1... f6? {Bad.}) (1... d5 !? {Sharp.}) *')
    const variations = games[0].moves[1].variations
    expect(variations[0][0]).toMatchObject({ san: 'f6', glyph: '?' })
    expect(variations[1][0]).toMatchObject({ san: 'd5', glyph: '!?' })
  })

  it('translates the NAG numbers a chess GUI writes into the glyphs a person writes', () => {
    const { games } = parsePgn('1. e4 e5 (1... f6 $2) (1... Nc6 $6) (1... d5 $5) *')
    const glyphs = games[0].moves[1].variations.map((line) => line[0].glyph)
    expect(glyphs).toEqual(['?', '?!', '!?'])
  })

  it('keeps a comment verbatim, including the tokens inside it', () => {
    const { games } = parsePgn('1. d4 {Out first. [%tags development] [%weight 7]} *')
    expect(games[0].moves[0].comment).toBe('Out first. [%tags development] [%weight 7]')
  })

  it('keeps the newlines in a comment, because a chapter intro has paragraphs', () => {
    const { games } = parsePgn('{Lead.\n\n## A heading\n\nBody.}\n\n1. e4 *')
    expect(games[0].intro).toBe('Lead.\n\n## A heading\n\nBody.')
  })

  it('reads several games as several chapters, in file order', () => {
    const { games, errors } = parsePgn(
      '[ChapterId "one"]\n\n1. e4 *\n\n[ChapterId "two"]\n\n1. d4 *\n',
    )
    expect(errors).toEqual([])
    expect(games.map((game) => game.tags.ChapterId)).toEqual(['one', 'two'])
  })

  it('accepts castling written with zeros, which some tools produce', () => {
    const { games } = parsePgn('1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. 0-0 0-0 *')
    expect(games[0].moves.map((move) => move.san)).toContain('O-O')
  })

  describe('what it refuses rather than half-reading', () => {
    it('names an unterminated comment', () => {
      const { errors } = parsePgn('1. e4 {never closed')
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('never closed')
    })

    it('names a brace inside prose, which would end the comment early', () => {
      const { errors } = parsePgn('1. e4 {a note with a { in it}')
      expect(errors.some((error) => error.message.includes('cannot contain'))).toBe(true)
    })

    it('names a closing brace with nothing open', () => {
      const { errors } = parsePgn('1. e4 } 2. d4')
      expect(errors.some((error) => error.message.includes('no comment open'))).toBe(true)
    })

    it('names a variation that is never closed', () => {
      const { errors } = parsePgn('1. e4 e5 (1... c5 2. Nf3')
      expect(errors.some((error) => error.message.includes('never closed with )'))).toBe(true)
    })

    it('names a stray closing bracket', () => {
      const { errors } = parsePgn('1. e4 ) e5')
      expect(errors.some((error) => error.message.includes('stray'))).toBe(true)
    })

    it('names an empty variation', () => {
      const { errors } = parsePgn('1. e4 e5 () 2. Nf3')
      expect(errors.some((error) => error.message.includes('empty variation'))).toBe(true)
    })

    it('names a header tag that is not in the right form', () => {
      const { errors } = parsePgn('[CourseId demo]\n\n1. e4 *')
      expect(errors.some((error) => error.message.includes('[Name "value"]'))).toBe(true)
    })

    it('names a repeated header tag rather than quietly taking the last', () => {
      const { errors } = parsePgn('[ChapterId "a"]\n[ChapterId "b"]\n\n1. e4 *')
      expect(errors.some((error) => error.message.includes('appears twice'))).toBe(true)
    })

    it('names junk it cannot read, once, rather than once per character', () => {
      const { errors } = parsePgn('1. e4 lorem e5')
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('lorem')
    })

    it('reports the line a fault is on', () => {
      const { errors } = parsePgn('[ChapterId "a"]\n\n1. e4\n2. d4 }\n')
      expect(errors[0].line).toBe(4)
    })
  })

  it('unescapes a quote inside a header tag value', () => {
    const { games } = parsePgn('[CourseTitle "The \\"real\\" London"]\n\n1. d4 *')
    expect(games[0].tags.CourseTitle).toBe('The "real" London')
  })

  it('reads a file of nothing but moves and comments, which is a valid course', () => {
    const { games, errors } = parsePgn('1. d4 {Out.} d5 {Back.} 2. Bf4 {The system.}')
    expect(errors).toEqual([])
    expect(games[0].moves).toHaveLength(3)
  })
})
