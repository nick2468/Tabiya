import { Chess } from 'chess.js'
import type { Rating } from '../scheduler'
import type { Card } from './cards'
import type { MistakeGrade } from './types'

/**
 * Grading a drill answer, and the one rule the app must not break: never claim
 * to know more than the content does.
 *
 * Three outcomes. The repertoire move is right. A move the author listed as a
 * common wrong try gets the author's own grade and the author's reason. Any
 * other move gets "that is not the repertoire move" and nothing else, because
 * nobody has judged it. A move the app has not been told about might be
 * excellent, and saying otherwise would be a lie the trainee could not check.
 */

export type Verdict =
  | { kind: 'exact'; san: string }
  | { kind: 'listed'; san: string; grade: MistakeGrade; note: string }
  | { kind: 'unlisted'; san: string }

/** Judges a move played against a card. `san` must be legal in the position. */
export function judge(card: Card, san: string): Verdict {
  if (san === card.san) return { kind: 'exact', san }
  const listed = card.mistakes.find((mistake) => mistake.san === san)
  if (listed) return { kind: 'listed', san, grade: listed.grade, note: listed.note }
  return { kind: 'unlisted', san }
}

/**
 * The FSRS rating an answer earns.
 *
 * Only the repertoire move is Good. A listed try that is merely playable or
 * inaccurate is Hard, because the trainee is close but did not recall the line.
 * A listed mistake, and anything unlisted, is Again: in both cases the line was
 * not recalled, and an unlisted move means the app cannot say it was.
 */
export function ratingFor(verdict: Verdict): Rating {
  switch (verdict.kind) {
    case 'exact':
      return 'good'
    case 'listed':
      return verdict.grade === 'mistake' ? 'again' : 'hard'
    case 'unlisted':
      return 'again'
  }
}

/**
 * Whether the answer counts towards a concept's accuracy.
 *
 * Only the repertoire move counts. The point of the per-tag figures is to find
 * what has not been learnt yet, and a playable alternative, however sound, is
 * still a line that was not recalled.
 */
export function countsAsCorrect(verdict: Verdict): boolean {
  return verdict.kind === 'exact'
}

/** The headline shown with the feedback. */
export function verdictHeadline(verdict: Verdict): string {
  switch (verdict.kind) {
    case 'exact':
      return 'Correct'
    case 'listed':
      return {
        playable: 'Playable, but not the repertoire move',
        inaccuracy: 'An inaccuracy',
        mistake: 'A mistake',
      }[verdict.grade]
    case 'unlisted':
      return 'Not the repertoire move'
  }
}

/**
 * What to say under the headline.
 *
 * For an unlisted move the wording is careful on purpose: the app says what it
 * knows, which is the move it expected, and does not judge what was played.
 */
export function verdictDetail(card: Card, verdict: Verdict): string {
  switch (verdict.kind) {
    case 'exact':
      return card.note ?? ''
    case 'listed':
      return verdict.note
    case 'unlisted':
      return `The app has nothing to say about ${verdict.san}: it may well be a good move, but it is not in the repertoire and has not been judged. The line plays ${card.san}.`
  }
}

/** The squares a SAN move runs between, or null when it is not legal here. */
export function squaresForSan(fen: string, san: string): { from: string; to: string } | null {
  const chess = new Chess(fen)
  try {
    const move = chess.move(san)
    return { from: move.from, to: move.to }
  } catch {
    return null
  }
}

/**
 * Turns a move made on the board into SAN, or null when it is not legal.
 * Promotions become a queen, which is all this repertoire ever needs.
 */
export function sanForMove(fen: string, from: string, to: string, promotion = 'q'): string | null {
  const chess = new Chess(fen)
  try {
    return chess.move({ from, to, promotion }).san
  } catch {
    return null
  }
}
