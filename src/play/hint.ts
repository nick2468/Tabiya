import { findDeviation, fullMove, type PlayedMove } from './report'
import type { Book, BookMove } from './book'

/**
 * What to say when the trainee asks what to play.
 *
 * Two different things, and the difference is the point. While the position is
 * still in the repertoire there is an authored answer with a reason, and that
 * reason is the whole value of the course. Once the book has run out there is
 * no authored answer, only the engine's opinion, and the hint says so rather
 * than dressing a search result up as teaching.
 *
 * A hint is not free: the session counts them and the report says how many
 * were used, because a game played with the answers on is a different game
 * from one played without them.
 */

export interface Hint {
  san: string
  /** The sentence shown beside the board. */
  text: string
  /** Which kind it is, so the arrow can be drawn in the right colour. */
  source: 'book' | 'engine'
}

/** The repertoire's own move, with its note. */
export function bookHint(move: BookMove): Hint {
  const opening = `The line plays ${move.label}.`
  return {
    san: move.san,
    source: 'book',
    text: move.note ? `${opening} ${move.note}` : opening,
  }
}

/**
 * The engine's move, and an honest statement that nobody wrote a note for it.
 *
 * Saying where the repertoire ended matters more than it looks: a trainee who
 * has been getting notes and suddenly gets none should know the course did not
 * fail them, they simply left it.
 */
export function engineHint(san: string, endedAtMove: number | null): Hint {
  const why =
    endedAtMove === null
      ? 'No note: this position is not in the repertoire.'
      : `No note: the repertoire ended at move ${endedAtMove}.`
  return { san, source: 'engine', text: `The engine suggests ${san}. ${why}` }
}

/**
 * The full move number the repertoire stopped having an opinion at.
 *
 * Two ways it stops. Somebody played something the book does not list, which
 * is what `findDeviation` finds; or every move matched and the line simply
 * ended, in which case the last move played is the last one the book knew.
 */
export function bookEndedAt(moves: PlayedMove[], book: Book): number | null {
  const deviation = findDeviation(moves, book)
  if (deviation.kind !== 'stayed-in-book') return fullMove(deviation.ply ?? 0)
  const last = moves.at(-1)
  return last ? fullMove(last.ply) : null
}
