import { positionKey } from '../model/position'
import type { PlayedMove } from './report'
import type { Colour } from '../model/types'

/**
 * How the evaluation bar is drawn, as arithmetic rather than as markup.
 *
 * Two decisions and both are easy to get backwards, which is why they are
 * here where a test can reach them without a DOM.
 *
 * The share is squashed with tanh rather than scaled, because the difference
 * between level and a pawn up matters and the difference between five pawns
 * and six does not. It is the same squash the report's bar has always used.
 *
 * The orientation is the one people get wrong. The bar follows the BOARD, so
 * the trainee's own colour is at the bottom of it wherever they sit: "more of
 * my colour" then reads as "good for me" without anyone having to think. In a
 * Black course that means White's share grows downwards from the top.
 *
 * No number appears on the bar. SPEC.md section 2 still says verdicts go in
 * words, and the bar's accessible name is `verdictInWords`.
 */

export interface EvalBarLayout {
  /** White's share of the bar, 0 to 100. */
  whiteShare: number
  /** True when White's share is drawn up from the bottom. */
  whiteAtBottom: boolean
}

/** White's share of a bar, from an evaluation in pawns from White's side. */
export function evalShare(pawns: number): number {
  return 50 + 50 * Math.tanh(pawns / 3)
}

/** The bar, given the evaluation and which colour the trainee is playing. */
export function evalBarLayout(pawns: number, studentColour: Colour): EvalBarLayout {
  return { whiteShare: evalShare(pawns), whiteAtBottom: studentColour === 'white' }
}

/**
 * The evaluation to show for a position, which may not be its own.
 *
 * The bar holds its last value while the engine thinks rather than emptying
 * or animating: a bar that blanks itself twice a move is harder to read than
 * one that is a moment behind, and the status line already says who is
 * thinking. So this walks back through the game to the most recent position
 * that has been evaluated, and returns nothing only when none has.
 */
export function shownEvaluation(
  fen: string,
  moves: PlayedMove[],
  evaluations: Map<string, number>,
): number | undefined {
  const found = evaluations.get(positionKey(fen))
  if (found !== undefined) return found
  for (let index = moves.length - 1; index >= 0; index -= 1) {
    const earlier = evaluations.get(positionKey(moves[index].fen))
    if (earlier !== undefined) return earlier
  }
  return undefined
}
