import { findDeviation, fullMove, type PlayedMove } from './report'
import type { Book, BookMove, BookReply } from './book'

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
 * What to say when the trainee is playing AGAINST the course.
 *
 * There is no authored answer for this side. What the book does carry is the
 * weight the course gave each reply, which is the author's estimate of how
 * often club players choose it, and that is the honest hint: not what is
 * best, but what the trainee is most likely to meet across a board. Drawn in
 * the engine's colour, because it is not the course's move and the arrow
 * should not claim it is.
 *
 * Ties keep chapter order, which is the order the book lists them.
 */
export function clubHint(replies: BookReply[], fen: string): Hint | null {
  if (replies.length === 0) return null
  const most = replies.reduce((held, reply) => (reply.weight > held.weight ? reply : held))
  return {
    san: most.san,
    source: 'engine',
    text: `Club players most often play ${labelAt(fen, most.san)} here.`,
  }
}

/**
 * The engine's move on the other side, once the book has no reply to offer.
 * Said in the trainee's terms: the course has nothing here, so there is no
 * club habit to report.
 */
export function clubEngineHint(san: string): Hint {
  return {
    san,
    source: 'engine',
    text: `The engine suggests ${san}. The course has nothing here, so there is no usual reply to report.`,
  }
}

/** "6.Bg5" or "6...e5": how a move from this position reads in a sentence. */
function labelAt(fen: string, san: string): string {
  const [, turn, , , , number] = fen.split(' ')
  return turn === 'b' ? `${number}...${san}` : `${number}.${san}`
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
