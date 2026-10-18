import { whitePovPawns, type Score } from '../engine'
import { positionKey } from '../model/position'
import type { Colour } from '../model/types'

/**
 * How the evaluation bar is drawn, as arithmetic rather than as markup.
 *
 * Three decisions, all easy to get backwards, which is why they are here where
 * a test can reach them without a DOM.
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
 * The number is the third, and it arrived at phase 46, reversing the phase 23
 * ruling that the bar carries none. It is always from White's point of view,
 * like every other number in the app, but the engine reports a score, a mate
 * above all, from the SIDE TO MOVE. So the text is made once, where the side
 * to move is known, and kept beside the pawns rather than worked out again
 * later from a number that has forgotten which side it came from.
 */

/** What the bar shows for one position. */
export interface Evaluation {
  /** Pawns from White's point of view; a mate is plus or minus MATE_PAWNS. */
  pawns: number
  /** The string the bar prints: "+0.4", "-1.2", "0.0", "M5", "-M5". */
  text: string
}

export interface EvalBarLayout {
  /** White's share of the bar, 0 to 100. */
  whiteShare: number
  /** True when White's share is drawn up from the bottom. */
  whiteAtBottom: boolean
}

/** One evaluation, from the engine's score and the side it was to move. */
export function evaluationOf(score: Score, sideToMove: Colour): Evaluation {
  return { pawns: whitePovPawns(score, sideToMove), text: evalText(score, sideToMove) }
}

/**
 * What the bar prints for a score: pawns from White's side with one decimal
 * and a sign, or a mate count, signed minus when Black mates.
 *
 * A mate's `moves` is from the side to move: positive when it mates, negative
 * when it is mated, and 0 when it is mated already. Nothing rounds to "-0.0":
 * a level position has no sign.
 */
export function evalText(score: Score, sideToMove: Colour): string {
  if (score.kind === 'cp') {
    const pawns = whitePovPawns(score, sideToMove)
    const text = Math.abs(pawns).toFixed(1)
    if (text === '0.0') return text
    return pawns > 0 ? `+${text}` : `-${text}`
  }
  const moverMates = score.moves > 0
  const whiteMates = moverMates === (sideToMove === 'white')
  return `${whiteMates ? '' : '-'}M${Math.abs(score.moves)}`
}

/** White's share of a bar, from an evaluation in pawns from White's side. */
export function evalShare(pawns: number): number {
  return 50 + 50 * Math.tanh(pawns / 3)
}

/** The bar, given the evaluation and which colour the trainee is playing. */
export function evalBarLayout(pawns: number, studentColour: Colour): EvalBarLayout {
  return { whiteShare: evalShare(pawns), whiteAtBottom: studentColour === 'white' }
}

/** Where the number goes on the bar, and which share it lands on. */
export interface NumberPlacement {
  /** The end of the bar it sits at. */
  edge: 'top' | 'bottom'
  /** True when it is drawn on White's share, and so in Black's colour. */
  onWhite: boolean
}

/**
 * Where to print the number: inside the larger share, at that share's outer
 * end.
 *
 * The larger share is the one with room for it, and its outer end is the end
 * of the bar rather than the line between the two colours, so the digits are
 * never printed across the join. Which end that is depends on the orientation
 * as well as the score, because the trainee's colour is at the bottom whichever
 * colour they play: White ahead reads at the bottom in a White course and at
 * the top in a Black one.
 *
 * Here rather than in the component, because it is four cases and every one of
 * them is easy to get backwards.
 */
export function numberPlacement(layout: EvalBarLayout): NumberPlacement {
  const onWhite = layout.whiteShare >= 50
  const whiteEnd = layout.whiteAtBottom ? 'bottom' : 'top'
  const blackEnd = layout.whiteAtBottom ? 'top' : 'bottom'
  return { edge: onWhite ? whiteEnd : blackEnd, onWhite }
}

/**
 * The evaluation to show for a position, which may not be its own.
 *
 * The bar holds its last value while the engine thinks rather than emptying
 * or animating: a bar that blanks itself twice a move is harder to read than
 * one that is a moment behind, and the status line already says who is
 * thinking. So this walks back through the game to the most recent position
 * that has been evaluated, and returns nothing only when none has.
 *
 * `moves` asks only for each move's starting position, which is all this
 * reads, so the session's played moves can be passed as they are.
 */
export function shownEvaluation(
  fen: string,
  moves: { fen: string }[],
  evaluations: Map<string, Evaluation>,
): Evaluation | undefined {
  const found = evaluations.get(positionKey(fen))
  if (found !== undefined) return found
  for (let index = moves.length - 1; index >= 0; index -= 1) {
    const earlier = evaluations.get(positionKey(moves[index].fen))
    if (earlier !== undefined) return earlier
  }
  return undefined
}
