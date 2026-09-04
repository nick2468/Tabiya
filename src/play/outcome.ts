import { Chess } from 'chess.js'
import type { Colour } from '../model/types'

/**
 * How a game of chess ended, in the app's own words.
 *
 * One wording, in one place. The session says this at the moment a game ends,
 * and Progress has to say the same thing about a game recorded before the
 * ending was kept: two copies of these five sentences would be two vocabularies
 * the day one of them was reworded.
 *
 * The trainee's colour is what turns a checkmate into news: the same position
 * is a win in one course and a loss in another, and neither reading is about
 * White or Black as far as the person looking at it is concerned.
 */
export function outcomeOf(chess: Chess, studentColour: Colour): string | undefined {
  if (chess.isCheckmate()) {
    // The side to move is the one that got mated.
    const mated: Colour = chess.turn() === 'w' ? 'white' : 'black'
    return mated === studentColour ? 'You were checkmated' : 'You won by checkmate'
  }
  if (chess.isStalemate()) return 'Drawn by stalemate'
  if (chess.isInsufficientMaterial()) return 'Drawn: neither side has enough to mate'
  if (chess.isThreefoldRepetition()) return 'Drawn by repetition'
  if (chess.isDraw()) return 'Drawn by the fifty move rule'
  return undefined
}

/**
 * The same question asked of a recorded game, from its moves.
 *
 * A record only carries its ending if it was reviewed on 1.6.11 or later, and
 * Nick has games older than that which ended in checkmate and read as merely
 * stopped. The moves were always kept, and the moves know: replaying them says
 * what the position was when the game ran out.
 *
 * Returns nothing for a game that was stopped mid-play, which is the honest
 * answer, and nothing for a move list that will not replay, which is a damaged
 * record rather than a drawn game.
 */
export function endingFromMoves(sans: string[], studentColour: Colour): string | undefined {
  if (sans.length === 0) return undefined
  const chess = new Chess()
  for (const san of sans) {
    try {
      chess.move(san)
    } catch {
      return undefined
    }
  }
  return outcomeOf(chess, studentColour)
}

/** True when a game ended in a mate rather than a draw or nothing at all. */
export function isCheckmateOutcome(outcome: string | undefined): boolean {
  return outcome === 'You were checkmated' || outcome === 'You won by checkmate'
}
