import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'

// A dependency sanity check: chess.js is the rules engine for the whole app, so
// prove it is importable and behaves as the loader will assume.
describe('chess.js', () => {
  it('starts from the standard position', () => {
    const chess = new Chess()
    expect(chess.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  })

  it('accepts a legal SAN move and rejects an illegal one', () => {
    const chess = new Chess()
    expect(chess.move('d4').san).toBe('d4')
    expect(() => chess.move('d5')).not.toThrow()
    expect(() => chess.move('Bf4')).not.toThrow()
    expect(() => chess.move('Bf7')).toThrow()
  })
})
