import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { isPromotion, legalDests, positionKey, sideToMove } from './position'

const START = new Chess().fen()

describe('legalDests', () => {
  it('offers twenty moves from the starting position', () => {
    const dests = legalDests(START)
    const total = [...dests.values()].reduce((n, list) => n + list.length, 0)
    expect(total).toBe(20)
    expect(dests.get('d2')).toEqual(['d3', 'd4'])
  })

  it('omits moves that leave the king in check', () => {
    // Black king on e8 pinned along the e-file by a white rook on e1.
    const dests = legalDests('4k3/4b3/8/8/8/8/8/4R2K b - - 0 1')
    expect(dests.get('e7')).toBeUndefined()
  })
})

describe('positionKey', () => {
  it('ignores the halfmove and fullmove counters', () => {
    const viaOne = 'rnbqkbnr/pp2pppp/8/2pp4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq - 0 3'
    const viaAnother = 'rnbqkbnr/pp2pppp/8/2pp4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq - 4 9'
    expect(positionKey(viaOne)).toBe(positionKey(viaAnother))
  })

  it('keeps side to move, castling rights and the en passant square', () => {
    expect(positionKey(START)).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -')
  })
})

describe('isPromotion', () => {
  it('spots a pawn reaching the last rank', () => {
    const fen = '8/4P3/8/8/8/8/4p3/4K2k w - - 0 1'
    expect(isPromotion(fen, 'e7', 'e8')).toBe(true)
  })

  it('is false for an ordinary pawn move and for a piece', () => {
    expect(isPromotion(START, 'd2', 'd4')).toBe(false)
    expect(isPromotion('4R3/8/8/8/8/8/8/4K2k w - - 0 1', 'e8', 'e7')).toBe(false)
  })
})

describe('sideToMove', () => {
  it('reads the side to move', () => {
    expect(sideToMove(START)).toBe('white')
    const chess = new Chess()
    chess.move('d4')
    expect(sideToMove(chess.fen())).toBe('black')
  })
})
