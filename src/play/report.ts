import { MATE_PAWNS } from '../engine/uci'
import { positionKey } from '../model/position'
import type { Book } from './book'

/**
 * The post-game report, and the rules it follows.
 *
 * Two promises from SPEC.md section 2 are kept here. Verdicts are given in
 * words, never as a bare number, because a club player reading "+0.73" learns
 * nothing they can use. And the report is honest about who left the book first:
 * once Black plays something the repertoire never mentioned, White's moves are
 * not deviations from anything, and the report says so.
 */

export interface PlayedMove {
  /** Half-move number from the start of the game, 0 for White's first. */
  ply: number
  san: string
  colour: 'white' | 'black'
  /** The position the move was played from. */
  fen: string
  /** The position after it. */
  after: string
}

/** What the engine thought of a position, in pawns from White's point of view. */
export type Evaluations = Map<string, number>

export type DeviationKind = 'white-left-book' | 'black-left-book-first' | 'stayed-in-book'

export interface Deviation {
  kind: DeviationKind
  /** The ply where the book ran out, when it did. */
  ply?: number
  /** What was actually played there. */
  played?: string
  /** What the repertoire plays, when White is the one who left. */
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
  /** How much White's position got worse. Negative means it improved. */
  loss: number
  tag: MoveTag
}

export interface GameReport {
  deviation: Deviation
  /** White's worst moves, worst first. */
  slips: MoveReview[]
  /** The verdict on the final position, in words. */
  verdict: string
  /** The final evaluation in pawns from White's point of view, when known. */
  finalEval?: number
  /** How the game ended, when it ended by itself. */
  outcome?: string
}

/**
 * Finds where the game left the repertoire.
 *
 * Walking in order matters. If Black steps outside the book first, everything
 * after that is a normal game of chess rather than a repertoire question, and
 * White cannot be marked down for a move the book never had an opinion on.
 */
export function findDeviation(moves: PlayedMove[], book: Book): Deviation {
  for (const move of moves) {
    const key = positionKey(move.fen)
    if (move.colour === 'white') {
      const expected = book.white.get(key)
      if (!expected) {
        return { kind: 'black-left-book-first', ply: move.ply, played: move.san }
      }
      if (expected.san !== move.san) {
        return {
          kind: 'white-left-book',
          ply: move.ply,
          played: move.san,
          bookMove: expected.san,
          note: expected.note,
          label: expected.label,
        }
      }
    } else {
      const replies = book.black.get(key) ?? []
      if (!replies.some((reply) => reply.san === move.san)) {
        return { kind: 'black-left-book-first', ply: move.ply, played: move.san }
      }
    }
  }
  return { kind: 'stayed-in-book' }
}

/** The full move number a ply belongs to: plies 0 and 1 are both move 1. */
export function fullMove(ply: number): number {
  return Math.floor(ply / 2) + 1
}

/** The deviation as a sentence, ready to show. */
export function describeDeviation(deviation: Deviation): string {
  switch (deviation.kind) {
    case 'stayed-in-book':
      return 'You stayed in the repertoire for the whole game.'
    case 'white-left-book':
      return `You left the repertoire on move ${fullMove(deviation.ply ?? 0)} with ${deviation.played}. The line plays ${deviation.bookMove}.`
    case 'black-left-book-first':
      return `Black left the repertoire on move ${fullMove(deviation.ply ?? 0)} with ${deviation.played}. From there it was just chess, so nothing after it counts as a deviation.`
  }
}

/**
 * How much a move cost White, in pawns.
 *
 * Both numbers are from White's point of view, so a positive loss always means
 * White's position got worse, whoever was moving.
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
 * Scans White's moves for the ones that threw something away.
 *
 * Only White's moves are scanned: this is a report on the trainee's play, not a
 * commentary on the engine's. A move is only judged when both positions around
 * it were evaluated, so a partial scan reports less rather than guessing.
 */
export function scanForSlips(moves: PlayedMove[], evaluations: Evaluations): MoveReview[] {
  const slips: MoveReview[] = []
  for (const move of moves) {
    if (move.colour !== 'white') continue
    const before = evaluations.get(positionKey(move.fen))
    const after = evaluations.get(positionKey(move.after))
    if (before === undefined || after === undefined) continue
    const loss = before - after
    const tag = tagFor(loss)
    if (tag) slips.push({ ply: move.ply, san: move.san, before, after, loss, tag })
  }
  return slips.sort((a, b) => b.loss - a.loss)
}

/**
 * The verdict on a position, in words.
 *
 * The bands come from SPEC.md section 5: under 0.4 of a pawn is equal, up to 1
 * is slightly better, up to 2.5 is clearly better, and beyond that is winning.
 */
export function verdictInWords(pawns: number): string {
  const size = Math.abs(pawns)
  if (size >= MATE_PAWNS) return pawns > 0 ? 'White has a forced mate' : 'Black has a forced mate'
  const side = pawns > 0 ? 'White' : 'Black'
  if (size < 0.4) return 'Level'
  if (size < 1) return `Slightly better for ${side}`
  if (size < 2.5) return `Clearly better for ${side}`
  return `Winning for ${side}`
}

/** A slip as a sentence. */
export function describeSlip(slip: MoveReview): string {
  const name = { blunder: 'A blunder', mistake: 'A mistake', inaccuracy: 'An inaccuracy' }[slip.tag]
  return `${name} on move ${fullMove(slip.ply)}: ${slip.san} turned "${verdictInWords(slip.before).toLowerCase()}" into "${verdictInWords(slip.after).toLowerCase()}".`
}

/** Puts the whole report together. */
export function buildReport(
  moves: PlayedMove[],
  book: Book,
  evaluations: Evaluations,
  outcome?: string,
): GameReport {
  const last = moves.at(-1)
  const finalEval = last ? evaluations.get(positionKey(last.after)) : undefined
  return {
    deviation: findDeviation(moves, book),
    slips: scanForSlips(moves, evaluations),
    verdict: finalEval === undefined ? 'Not scanned' : verdictInWords(finalEval),
    finalEval,
    outcome,
  }
}
