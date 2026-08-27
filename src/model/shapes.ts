import type { LoadedNode, Shape } from './types'

/**
 * What the board draws on top of a position.
 *
 * Two sources: an arrow for the move just played, so the eye lands in the right
 * place without hunting, and whatever the author drew on this node.
 */

/** The brush used for the move just played. */
export const LAST_MOVE_BRUSH = 'blue'

/**
 * The shapes for a node, last-move arrow first.
 *
 * When the author already drew an arrow along the move just played, that one
 * arrow is drawn once, in the author's colour: two arrows on the same squares
 * only look like a rendering fault.
 */
export function nodeShapes(node: LoadedNode | undefined): Shape[] {
  if (!node) return []
  const authored = node.shapes ?? []
  const repeated = authored.find((shape) => shape.orig === node.from && shape.dest === node.to)
  const lastMove: Shape = repeated ?? {
    orig: node.from,
    dest: node.to,
    brush: LAST_MOVE_BRUSH,
  }
  return [lastMove, ...authored.filter((shape) => shape !== repeated)]
}
