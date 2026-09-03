import type { PlayedMove } from './report'

/**
 * Walking a finished game, position by position.
 *
 * Nick reviewed a game, doubted the verdict, and had no way to look again: the
 * board holds the final position and the report names moves without showing
 * them. So a reviewed game becomes a viewer, and this is the arithmetic behind
 * it, kept out of the screen where a test can reach it.
 *
 * A REPLAY PLY is a count of moves played, from 0 to `moves.length`, so it
 * numbers the POSITIONS rather than the moves. Ply 0 is where the game
 * started; ply n is the position after the nth move. The useful consequence:
 * the position before the move at index p is replay ply p, and the position
 * after it is p + 1, which is what makes a slip or a deviation clickable.
 *
 * Nothing here writes. The session's moves are the game and they do not move
 * while somebody looks at them.
 */

/** The position after `ply` moves, or null when there is no game to walk. */
export function positionAtPly(moves: PlayedMove[], ply: number): string | null {
  if (moves.length === 0) return null
  const clamped = clampPly(moves, ply)
  return clamped === 0 ? moves[0].fen : moves[clamped - 1].after
}

/** The move that led to this position, for the board's last-move highlight. */
export function moveAtPly(moves: PlayedMove[], ply: number): PlayedMove | null {
  const clamped = clampPly(moves, ply)
  return clamped === 0 ? null : moves[clamped - 1]
}

/** Keeps a replay ply inside the game, so a key held down cannot walk off it. */
export function clampPly(moves: PlayedMove[], ply: number): number {
  return Math.max(0, Math.min(moves.length, Math.round(ply)))
}

/**
 * Where to put the board to SHOW a move being considered.
 *
 * The position before it, not after it: the report says a move was a mistake,
 * and the question that answers is what else was on offer, which is only
 * visible from the position the move was played in. The deviation reads the
 * same way, because it names a move the repertoire would have played instead.
 */
export function plyBeforeMove(movePly: number): number {
  return Math.max(0, movePly)
}

/** And the position the move led to, for anything that wants the result. */
export function plyAfterMove(movePly: number): number {
  return Math.max(0, movePly) + 1
}
