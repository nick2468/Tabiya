import { isDue, isNew } from '../scheduler'
import { scheduleFor, tagAccuracy, type ProgressState } from '../storage/progress'
import type { Card } from './cards'

/**
 * The order cards come up in a drill session.
 *
 * Two decisions live here. Reviews come before new material, because a review
 * that falls due and is buried under thirty fresh cards is a review that gets
 * forgotten. And the weak-area filter puts the concepts going worst at the
 * front, which is the whole point of tagging the content.
 *
 * One queue across every course, which is Nick's ruling (SPEC.md section 10):
 * due is due, whichever repertoire it belongs to. Nothing here needs to know
 * how many courses there are - the cards arrive already scoped.
 */

export interface QueueOptions {
  /** Put the concepts with the lowest recent accuracy first. */
  weakAreasFirst?: boolean
  now?: Date
}

/**
 * How badly a card's concepts are going, from 0 (worst) to 1 (perfect), or null
 * when none of its concepts has been drilled yet.
 *
 * A card is judged by its weakest concept: if a position is tagged both
 * `development` and `vs-qb6`, and ...Qb6 lines are going badly, that card is
 * worth asking whatever the other figure says.
 *
 * The accuracy read is the card's OWN course. The queue spans courses, so a
 * shared tag like `development` means one thing in the London and another in a
 * Black repertoire, and reading the wrong one would reorder the queue by a
 * number about somebody else's moves.
 */
export function cardWeakness(state: ProgressState, card: Card): number | null {
  const measured = card.tags
    .map((tag) => tagAccuracy(state, card.courseId, tag))
    .filter((accuracy): accuracy is number => accuracy !== null)
  if (measured.length === 0) return null
  return Math.min(...measured)
}

/** The cards ready to be asked now, in the order to ask them. */
export function dueQueue(
  cards: Card[],
  state: ProgressState,
  options: QueueOptions = {},
): Card[] {
  const now = options.now ?? new Date()
  const due = cards.filter((card) => isDue(scheduleFor(state, card.key), now))
  return sortQueue(due, state, options)
}

/** Every card, due or not, in the order a session would ask them. */
export function sortQueue(cards: Card[], state: ProgressState, options: QueueOptions = {}): Card[] {
  const order = new Map(cards.map((card, index) => [card.key, index]))

  return [...cards].sort((a, b) => {
    if (options.weakAreasFirst) {
      // An undrilled concept is not a weak one, so cards with nothing measured
      // sit behind the measured ones rather than jumping the queue.
      const weakA = cardWeakness(state, a) ?? Number.POSITIVE_INFINITY
      const weakB = cardWeakness(state, b) ?? Number.POSITIVE_INFINITY
      if (weakA !== weakB) return weakA - weakB
    }

    const scheduleA = scheduleFor(state, a.key)
    const scheduleB = scheduleFor(state, b.key)
    const newA = isNew(scheduleA)
    const newB = isNew(scheduleB)
    // Reviews first, so a due card is never buried under fresh material.
    if (newA !== newB) return newA ? 1 : -1
    if (!newA && !newB && scheduleA && scheduleB) {
      const gap = new Date(scheduleA.due).getTime() - new Date(scheduleB.due).getTime()
      if (gap !== 0) return gap
    }
    // Otherwise keep course order, which walks the chapters as they are taught.
    return (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0)
  })
}

/** How many cards are due right now. */
export function dueCount(cards: Card[], state: ProgressState, now: Date = new Date()): number {
  return cards.filter((card) => isDue(scheduleFor(state, card.key), now)).length
}

/** How many of the cards have never been answered. */
export function newCount(cards: Card[], state: ProgressState): number {
  return cards.filter((card) => isNew(scheduleFor(state, card.key))).length
}
