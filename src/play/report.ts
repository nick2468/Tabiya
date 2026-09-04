import { MATE_PAWNS } from '../engine/uci'
import { positionKey } from '../model/position'
import { colourName, type Colour, type MistakeGrade } from '../model/types'
import type { Book } from './book'

/**
 * The post-game report, and the rules it follows.
 *
 * Two promises from SPEC.md section 2 are kept here. Verdicts are given in
 * words, never as a bare number, because a club player reading "+0.73" learns
 * nothing they can use. And the report is honest about who left the book first:
 * once the opponent plays something the repertoire never mentioned, the
 * trainee's moves are not deviations from anything, and the report says so.
 *
 * Everything is written from the STUDENT's side, which the book carries. That
 * matters most for the evaluations: they arrive in pawns from White's point of
 * view, so in a Black course a move that costs the trainee something makes the
 * number go up, not down.
 */

export interface PlayedMove {
  /** Half-move number from the start of the game, 0 for White's first. */
  ply: number
  san: string
  colour: Colour
  /** The position the move was played from. */
  fen: string
  /** The position after it. */
  after: string
  /**
   * True when an opponent move came out of the repertoire rather than the
   * engine. Recorded so undo can put the book count back honestly rather than
   * guessing that whatever it removed was a book move.
   */
  fromBook?: boolean
  /**
   * Set on a move the engine played FOR the course, when it took a listed
   * alternative rather than the repertoire move: the grade the course gives
   * that alternative. The other-side report lists these, so the trainee can
   * see where the game left the pure line.
   */
  alternative?: MistakeGrade
}

/** What the engine thought of a position, in pawns from White's point of view. */
export type Evaluations = Map<string, number>

export type DeviationKind =
  | 'student-left-book'
  | 'opponent-left-book-first'
  | 'stayed-in-book'

export interface Deviation {
  kind: DeviationKind
  /** The ply where the book ran out, when it did. */
  ply?: number
  /** What was actually played there. */
  played?: string
  /** What the repertoire plays, when the trainee is the one who left. */
  bookMove?: string
  /** The note on the book move. */
  note?: string
  /** How the book move reads in a sentence: "7.c3". */
  label?: string
}

export type MoveTag = 'blunder' | 'mistake' | 'inaccuracy'

export interface MoveReview {
  ply: number
  san: string
  /** Pawns from White's point of view before the move. */
  before: number
  /** And after it. */
  after: number
  /** How much the STUDENT's position got worse. Negative means it improved. */
  loss: number
  tag: MoveTag
}

export interface GameReport {
  deviation: Deviation
  /** The trainee's slips, most recent first. */
  slips: MoveReview[]
  /** The verdict on the final position, in words. */
  verdict: string
  /** The final evaluation in pawns from White's point of view, when known. */
  finalEval?: number
  /** How the game ended, when it ended by itself. */
  outcome?: string
  /** How many hints were used, when any were. */
  hints?: number
}

/**
 * Finds where the game left the repertoire.
 *
 * Walking in order matters. If the opponent steps outside the book first,
 * everything after that is a normal game of chess rather than a repertoire
 * question, and the trainee cannot be marked down for a move the book never had
 * an opinion on.
 */
export function findDeviation(moves: PlayedMove[], book: Book): Deviation {
  for (const move of moves) {
    const key = positionKey(move.fen)
    if (move.colour === book.studentColour) {
      const expected = book.student.get(key)
      if (!expected) {
        return { kind: 'opponent-left-book-first', ply: move.ply, played: move.san }
      }
      if (expected.san !== move.san) {
        return {
          kind: 'student-left-book',
          ply: move.ply,
          played: move.san,
          bookMove: expected.san,
          note: expected.note,
          label: expected.label,
        }
      }
    } else {
      const replies = book.opponent.get(key) ?? []
      if (!replies.some((reply) => reply.san === move.san)) {
        return { kind: 'opponent-left-book-first', ply: move.ply, played: move.san }
      }
    }
  }
  return { kind: 'stayed-in-book' }
}

/** The full move number a ply belongs to: plies 0 and 1 are both move 1. */
export function fullMove(ply: number): number {
  return Math.floor(ply / 2) + 1
}

/**
 * The deviation as a sentence, ready to show.
 *
 * @param opponentColour so the sentence names the side the engine played
 */
export function describeDeviation(deviation: Deviation, opponentColour: Colour): string {
  switch (deviation.kind) {
    case 'stayed-in-book':
      return 'You stayed in the repertoire for the whole game.'
    case 'student-left-book':
      return `You left the repertoire on move ${fullMove(deviation.ply ?? 0)} with ${deviation.played}. The line plays ${deviation.bookMove}.`
    case 'opponent-left-book-first':
      return `${colourName(opponentColour)} left the repertoire on move ${fullMove(deviation.ply ?? 0)} with ${deviation.played}. From there it was just chess, so nothing after it counts as a deviation.`
  }
}

/**
 * How much a move cost the trainee, in pawns.
 *
 * The evaluations are from White's point of view, so the subtraction is turned
 * round for a Black course. A positive loss always means the trainee's position
 * got worse.
 */
export const SLIP_THRESHOLDS: { tag: MoveTag; loss: number }[] = [
  { tag: 'blunder', loss: 2 },
  { tag: 'mistake', loss: 1 },
  { tag: 'inaccuracy', loss: 0.5 },
]

function tagFor(loss: number): MoveTag | null {
  for (const level of SLIP_THRESHOLDS) {
    if (loss >= level.loss) return level.tag
  }
  return null
}

/**
 * Scans the trainee's moves for the ones that threw something away.
 *
 * Only the trainee's moves are scanned: this is a report on their play, not a
 * commentary on the engine's. A move is only judged when both positions around
 * it were evaluated, so a partial scan reports less rather than guessing.
 */
export function scanForSlips(
  moves: PlayedMove[],
  evaluations: Evaluations,
  studentColour: Colour = 'white',
): MoveReview[] {
  const slips: MoveReview[] = []
  for (const move of moves) {
    if (move.colour !== studentColour) continue
    const before = evaluations.get(positionKey(move.fen))
    const after = evaluations.get(positionKey(move.after))
    if (before === undefined || after === undefined) continue
    const loss = studentColour === 'white' ? before - after : after - before
    const tag = tagFor(loss)
    if (tag) slips.push({ ply: move.ply, san: move.san, before, after, loss, tag })
  }
  // Most recent first, not worst first: Nick reads the report against the
  // game he has just played, and the end of it is what he remembers.
  return slips.sort((a, b) => b.ply - a.ply)
}

/**
 * The verdict on a position, in words.
 *
 * The bands come from SPEC.md section 5: under 0.4 of a pawn is equal, up to 1
 * is slightly better, up to 2.5 is clearly better, and beyond that is winning.
 */
export function verdictInWords(pawns: number): string {
  const { band, ahead } = verdictBand(pawns)
  const side = ahead ? 'White' : 'Black'
  switch (band) {
    case 'mate':
      return `${side} has a forced mate`
    case 'level':
      return 'Level'
    case 'slight':
      return `Slightly better for ${side}`
    case 'clear':
      return `Clearly better for ${side}`
    case 'winning':
      return `Winning for ${side}`
  }
}

/** How big an advantage is, and whose. The bands are SPEC.md section 5's. */
export function verdictBand(pawns: number): {
  band: 'mate' | 'level' | 'slight' | 'clear' | 'winning'
  /** True when the number favours White. Meaningless when the band is level. */
  ahead: boolean
} {
  const size = Math.abs(pawns)
  const ahead = pawns > 0
  if (size >= MATE_PAWNS) return { band: 'mate', ahead }
  if (size < 0.4) return { band: 'level', ahead }
  if (size < 1) return { band: 'slight', ahead }
  if (size < 2.5) return { band: 'clear', ahead }
  return { band: 'winning', ahead }
}

/**
 * The same verdict said to the trainee: "clearly better for you".
 *
 * Never a bare colour. The trainee is White in one course and Black in the
 * next, so "clearly better for black" is a sentence they have to translate
 * before they can read it, and half the time they will translate it wrong.
 * Lower case, because it is written into a sentence rather than starting one.
 */
export function verdictForYou(pawns: number, studentColour: Colour): string {
  const mine = studentColour === 'white' ? pawns : -pawns
  const { band, ahead } = verdictBand(mine)
  const who = ahead ? 'you' : 'the engine'
  switch (band) {
    case 'mate':
      return `${who} ${ahead ? 'have' : 'has'} a forced mate`
    case 'level':
      return 'level'
    case 'slight':
      return `slightly better for ${who}`
    case 'clear':
      return `clearly better for ${who}`
    case 'winning':
      return `winning for ${who}`
  }
}

/**
 * A slip as a sentence.
 *
 * When both sides of the move fall in the same band, saying it turned one
 * verdict into the same verdict reads as nonsense, however true it is. A
 * position can get worse without changing what it is called, so say that
 * instead.
 */
export function describeSlip(slip: MoveReview): string {
  const name = { blunder: 'A blunder', mistake: 'A mistake', inaccuracy: 'An inaccuracy' }[slip.tag]
  const before = verdictInWords(slip.before).toLowerCase()
  const after = verdictInWords(slip.after).toLowerCase()
  const where = `${name} on move ${fullMove(slip.ply)}: ${slip.san}`
  return before === after
    ? `${where} gave up more ground in a position already ${before}.`
    : `${where} turned "${before}" into "${after}".`
}

/** Puts the whole report together. */
export function buildReport(
  moves: PlayedMove[],
  book: Book,
  evaluations: Evaluations,
  outcome?: string,
  hints = 0,
): GameReport {
  const last = moves.at(-1)
  const finalEval = last ? evaluations.get(positionKey(last.after)) : undefined
  return {
    deviation: findDeviation(moves, book),
    slips: scanForSlips(moves, evaluations, book.studentColour),
    verdict: finalEval === undefined ? 'Not scanned' : verdictInWords(finalEval),
    finalEval,
    outcome,
    // Left off entirely when there were none, so a clean game carries no
    // mention of hints anywhere: not in the report, not in the PGN.
    ...(hints > 0 ? { hints } : {}),
  }
}
