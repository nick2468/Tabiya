import { Chess } from 'chess.js'
import { endingFromMoves, isCheckmateOutcome, lengthCap, verdictForYou } from '../play'
import type { PlayRequest } from './Play'
import type { PlayRecord } from '../storage/progress'
import type { Colour, LoadedCourse } from '../model/types'

/**
 * Getting back into a game that was recorded and left.
 *
 * Nick stopped a London game at move 20 on 1.6.7, not trusting the bar, and
 * then upgraded. Keep playing only reaches a game the app is still holding;
 * this reaches one written down. Every review since 1.6.7 keeps the moves, so
 * the game is there, and nothing could turn it back into a game to play.
 *
 * A resumed game is the SAME game: it carries the record's `at`, so reviewing
 * it again replaces that record rather than adding a second one under the
 * phase 25 rule.
 */

/** How many recorded games are worth offering. Ten is a screenful. */
export const PLAY_ON_LIMIT = 10

/**
 * The games that can be played on, newest first.
 *
 * Only records that kept their moves: a game from before 1.6.7 has nothing to
 * replay and listing it would be a button that cannot work.
 *
 * Sorted by `at` rather than reversed. The history is written oldest first, so
 * reversing it was the same thing until a record could be REPLACED: a replaced
 * record goes to the end of the list, so a Replay that filled a verdict into a
 * game from last week put last week at the top. The date is what the column
 * says, so the date is what it sorts by.
 */
export function recentPlayable(games: PlayRecord[], limit = PLAY_ON_LIMIT): PlayRecord[] {
  return games
    .filter((game) => game.sans && game.sans.length > 0)
    .slice()
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit)
}

/**
 * When a game was played, for a row a person reads: "3 September, 14:32".
 *
 * The time as well as the date, because two games on one day are otherwise
 * told apart only by their move counts. Both in the machine's own locale.
 */
export function playedOn(at: string): string {
  const when = new Date(at)
  if (Number.isNaN(when.getTime())) return 'an unknown date'
  const day = when.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
  const time = when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return `${day}, ${time}`
}

/** What the Play screen calls a resumed game on its launch radio. */
export function resumeLabel(record: PlayRecord): string {
  return `your game of ${playedOn(record.at)}, move ${record.moves}`
}

/**
 * Whether a recorded game can be put back on a board.
 *
 * The moves of a real game are legal chess whatever the course does next, so
 * this only fails on a record that has been damaged. It is still checked
 * before a game is started, because the alternative is the constructor
 * throwing halfway through a replay and a screen with an engine message on it.
 */
export function canReplayMoves(sans: string[]): boolean {
  if (sans.length === 0) return false
  const chess = new Chess()
  for (const san of sans) {
    try {
      chess.move(san)
    } catch {
      return false
    }
  }
  return true
}

/** How a game finished, and how it stood, which are two different facts. */
export interface GameEnding {
  /** The ending: the session's own sentence, or "Move limit", or "Stopped". */
  ended: string
  /** The verdict on the final position, or empty when none can be shown. */
  position: string
}

/**
 * How a recorded game ended.
 *
 * The record says so if it was reviewed on 1.6.11 or later. If it was not, the
 * MOVES say so, and every record since 1.6.7 has them: Nick's games ending in
 * checkmate read as merely stopped because nobody had asked the moves.
 *
 * Failing both, the length says whether it ran out or was stopped by hand, and
 * failing that the honest answer is "Stopped". The count has to MATCH the cap,
 * not merely reach it: a game carried on past its limit by Play on did not
 * stop at the limit.
 */
export function endedText(record: PlayRecord, studentColour: Colour): string {
  const ending = record.outcome ?? endingFromMoves(record.sans ?? [], studentColour)
  if (ending) return ending
  const cap = record.length ? lengthCap(record.length) : null
  return cap !== null && record.moves === cap ? 'Move limit' : 'Stopped'
}

/**
 * How the position stood at the end, capitalised for a column of its own.
 *
 * Empty when there is no evaluation, which is every game reviewed before
 * 1.6.11, and empty for a game that ended in mate: the ending has said it, and
 * a number beside a checkmate is noise. A draw keeps its number, because
 * "Drawn by repetition" and "Winning for you" together say something worth
 * knowing about how the draw was reached.
 */
export function positionText(record: PlayRecord, studentColour: Colour): string {
  if (record.finalEval === undefined) return ''
  const ending = record.outcome ?? endingFromMoves(record.sans ?? [], studentColour)
  if (isCheckmateOutcome(ending)) return ''
  const said = verdictForYou(record.finalEval, studentColour)
  return said.charAt(0).toUpperCase() + said.slice(1)
}

/** Both, for a row that shows them side by side. */
export function endingOf(record: PlayRecord, studentColour: Colour): GameEnding {
  return {
    ended: endedText(record, studentColour),
    position: positionText(record, studentColour),
  }
}

/**
 * The request that starts a game from the end of a record.
 *
 * No cap: the game has already run past any length that would have applied,
 * and a cap it has already passed would finish it the moment it started. The
 * chapter comes across when the record names one, so the opponent is steered
 * the way it was steered the first time.
 */
export function requestFor(record: PlayRecord, course: LoadedCourse): PlayRequest {
  const sans = record.sans ?? []
  const chess = new Chess()
  for (const san of sans) chess.move(san)
  return {
    fen: chess.fen(),
    moves: sans,
    chapterId: record.chapterId ?? '',
    chapterOnly: Boolean(record.chapterId),
    label: resumeLabel(record),
    courseId: course.id,
    level: record.level,
    at: record.at,
  }
}

/**
 * The same request, but for reading rather than playing: the game is loaded
 * and reviewed at once, so the trainee lands on the report with the viewer
 * live. It keeps the record's identity, so the review that follows replaces
 * the record rather than adding a game.
 */
export function replayRequest(record: PlayRecord, course: LoadedCourse): PlayRequest {
  return { ...requestFor(record, course), reviewAtOnce: true }
}
