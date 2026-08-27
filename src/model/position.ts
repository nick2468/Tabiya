import { Chess, type Square } from 'chess.js'

/**
 * Pure position helpers shared by the board, Drill and Play. No React here.
 *
 * Terms used throughout: SAN is standard algebraic notation for one move, like
 * Bf4. FEN is the one-line text code for a whole position.
 */

/** Legal destinations per origin square, the shape chessground wants. */
export type Dests = Map<string, string[]>

/** Every legal move from `fen`, grouped by origin square. */
export function legalDests(fen: string): Dests {
  const chess = new Chess(fen)
  const dests: Dests = new Map()
  for (const move of chess.moves({ verbose: true })) {
    const to = dests.get(move.from)
    if (to) to.push(move.to)
    else dests.set(move.from, [move.to])
  }
  return dests
}

/**
 * The identity of a position for card dedup: piece placement, side to move,
 * castling rights and the en passant square. The halfmove and fullmove counters
 * are dropped, so the same setup reached through two chapters is one card.
 */
export function positionKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ')
}

/** True when moving orig-dest would land a pawn on its promotion rank. */
export function isPromotion(fen: string, orig: string, dest: string): boolean {
  const chess = new Chess(fen)
  const piece = chess.get(orig as Square)
  if (!piece || piece.type !== 'p') return false
  const rank = dest[1]
  return (piece.color === 'w' && rank === '8') || (piece.color === 'b' && rank === '1')
}

/** 'white' or 'black' from a FEN, in the wording chessground uses. */
export function sideToMove(fen: string): 'white' | 'black' {
  return fen.split(' ')[1] === 'b' ? 'black' : 'white'
}
