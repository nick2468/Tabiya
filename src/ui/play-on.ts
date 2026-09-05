import { Chess } from 'chess.js'
import { endingFromMoves, isCheckmateOutcome, lengthCap, verdictForYou } from '../play'
import { lineFollowed } from '../model/stats'
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
    .filter((game) => game.sans && game.sans.length > 0 && !game.archived)
    .slice()
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit)
}

/**
 * The archived games, newest first, for the archive view. Every one of them,
 * moves or no moves: a game put away is a game the trainee chose to keep out
 * of sight, and the view is where it can be brought back or removed.
 */
export function archivedGames(games: PlayRecord[]): PlayRecord[] {
  return games
    .filter((game) => game.archived)
    .slice()
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
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
  const time = when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return `${playedDay(at)}, ${time}`
}

/**
 * Just the day: "3 September".
 *
 * The Play on list needs the time to tell two games on one day apart. A label
 * for the game already on the screen has nothing to tell it apart from, and
 * the time there is noise in a sentence a person reads.
 */
export function playedDay(at: string): string {
  const when = new Date(at)
  if (Number.isNaN(when.getTime())) return 'an unknown date'
  return when.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })
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
/**
 * The colour the trainee actually held in a recorded game.
 *
 * The course's colour is the trainee's in every game but one kind: a game
 * played on the other side (phase 32) has the trainee on the opposite colour,
 * and a verdict or a checkmate read against the course's colour there says the
 * opposite of the truth. Driven at gate 32: a game the trainee played as White
 * at +0.45 read "Slightly better for the engine".
 */
export function traineeColour(record: PlayRecord, courseColour: Colour): Colour {
  if (record.side !== 'other') return courseColour
  return courseColour === 'white' ? 'black' : 'white'
}

export function endedText(record: PlayRecord, courseColour: Colour): string {
  const you = traineeColour(record, courseColour)
  const ending = record.outcome ?? endingFromMoves(record.sans ?? [], you)
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
export function positionText(record: PlayRecord, courseColour: Colour): string {
  if (record.finalEval === undefined) return ''
  const you = traineeColour(record, courseColour)
  const ending = record.outcome ?? endingFromMoves(record.sans ?? [], you)
  if (isCheckmateOutcome(ending)) return ''
  const said = verdictForYou(record.finalEval, you)
  return said.charAt(0).toUpperCase() + said.slice(1)
}

/**
 * What the Sparring against column says. A game on the other side was not
 * sparring against a chapter; it was playing against the course, and the
 * column says so in the words the launch option uses. The chapter still
 * follows when the game was against one chapter of it.
 */
export function sparringAgainst(record: PlayRecord, chapterTitle: string | undefined): string {
  if (record.side === 'other') return chapterTitle ? `other side, ${chapterTitle}` : 'other side'
  return chapterTitle ?? 'Any line'
}

/**
 * What the Line column says: the line the game followed by name, the chapter
 * it was in when it never reached one (marked faint, because it is the
 * weaker answer), or nothing for a record that kept no moves. The same rule
 * as the report's sentence, so the two never disagree about a game.
 */
export function lineOf(
  record: PlayRecord,
  course: LoadedCourse,
): { text: string; faint: boolean } | null {
  if (!record.sans || record.sans.length === 0) return null
  const followed = lineFollowed(course, record.sans)
  if (followed.line) return { text: followed.line.name, faint: false }
  if (followed.chapter) return { text: followed.chapter.title, faint: true }
  return null
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
    ...(record.side === 'other' ? { side: 'other' as const } : {}),
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
