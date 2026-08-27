import { Rating as FsrsRating, State, createEmptyCard, fsrs, type Card, type CardInput } from 'ts-fsrs'

/**
 * Spaced repetition, wrapped thinly around ts-fsrs.
 *
 * FSRS is the Free Spaced Repetition Scheduler: it decides when a card should
 * come back, from how well it was answered and how it has gone before. The
 * library owns that maths. This module owns two things it should not: the four
 * ratings in the app's own words, and a schedule shape that survives a trip
 * through JSON and back.
 *
 * Dates cross the boundary as ISO strings, because that is what a progress file
 * holds. ts-fsrs accepts them on the way in, so nothing has to be rebuilt by
 * hand.
 */

/** What an answer was worth, in the app's words rather than the library's. */
export type Rating = 'again' | 'hard' | 'good' | 'easy'

/** One card's schedule, in a shape that survives JSON. */
export interface Schedule {
  /** When the card is next due, as an ISO timestamp. */
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  learning_steps: number
  reps: number
  lapses: number
  /** ts-fsrs State: 0 new, 1 learning, 2 review, 3 relearning. */
  state: number
  last_review?: string
}

const RATINGS: Record<Rating, FsrsRating.Again | FsrsRating.Hard | FsrsRating.Good | FsrsRating.Easy> = {
  again: FsrsRating.Again,
  hard: FsrsRating.Hard,
  good: FsrsRating.Good,
  easy: FsrsRating.Easy,
}

// One instance with the library's defaults. Tuning parameters is a later
// question, and a wrong answer to it is much worse than the default.
const scheduler = fsrs()

/** A card that has never been answered. It is due immediately. */
export function newSchedule(now: Date = new Date()): Schedule {
  return toSchedule(createEmptyCard(now))
}

/** Applies an answer and returns when the card should come back. */
export function review(schedule: Schedule, rating: Rating, now: Date = new Date()): Schedule {
  const result = scheduler.next(toCardInput(schedule), now, RATINGS[rating])
  return toSchedule(result.card)
}

/** True when the card is ready to be asked again. An unseen card always is. */
export function isDue(schedule: Schedule | undefined, now: Date = new Date()): boolean {
  if (!schedule) return true
  return new Date(schedule.due).getTime() <= now.getTime()
}

/** How long until the card is due, in milliseconds. Negative when overdue. */
export function msUntilDue(schedule: Schedule, now: Date = new Date()): number {
  return new Date(schedule.due).getTime() - now.getTime()
}

/** "in 3 days", "in 10 minutes", for telling the trainee when it will return. */
export function describeInterval(schedule: Schedule, now: Date = new Date()): string {
  const ms = msUntilDue(schedule, now)
  if (ms <= 0) return 'again now'
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `in ${minutes} ${plural(minutes, 'minute')}`
  const hours = Math.round(ms / 3_600_000)
  if (hours < 24) return `in ${hours} ${plural(hours, 'hour')}`
  const days = Math.round(ms / 86_400_000)
  if (days < 30) return `in ${days} ${plural(days, 'day')}`
  const months = Math.round(days / 30)
  return `in ${months} ${plural(months, 'month')}`
}

function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`
}

/** True when the card has never been answered. */
export function isNew(schedule: Schedule | undefined): boolean {
  return !schedule || schedule.state === State.New
}

function toSchedule(card: Card): Schedule {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review?.toISOString(),
  }
}

function toCardInput(schedule: Schedule): CardInput {
  return {
    due: schedule.due,
    stability: schedule.stability,
    difficulty: schedule.difficulty,
    elapsed_days: schedule.elapsed_days,
    scheduled_days: schedule.scheduled_days,
    learning_steps: schedule.learning_steps,
    reps: schedule.reps,
    lapses: schedule.lapses,
    state: schedule.state as State,
    last_review: schedule.last_review ?? null,
  }
}
