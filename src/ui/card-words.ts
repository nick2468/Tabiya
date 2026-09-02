import { describeInterval } from '../scheduler'
import type { Card } from '../model/cards'
import type { ProgressState } from '../storage/progress'

/**
 * How card counts are worded, in one place.
 *
 * One name for one thing. "Due" and "New" were the words in the code and they
 * leaked onto the screen, where Nick read "0 due now, 0 never answered" and
 * could not tell what either meant. They were zero because he had drilled
 * everything, which is the one state those words did not explain. So a card
 * whose gap has run out is READY, everywhere a person reads it, which is the
 * word the Drill screen already used; a card from a ticked line that has
 * never come up is NOT YET DRILLED. The internal names are unchanged.
 */

/**
 * When the next card comes back, or an empty string when none is scheduled.
 *
 * Both Drill and Progress say this, because both are places where a trainee
 * finds nothing ready and needs to know that is the schedule working rather
 * than the app being empty.
 */
export function nextCardLine(cards: Card[], state: ProgressState): string {
  const upcoming = cards
    .map((card) => state.cards[card.key])
    .filter((schedule) => Boolean(schedule))
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())[0]
  return upcoming ? `The next card comes back ${describeInterval(upcoming)}.` : ''
}
