import { describe, expect, it } from 'vitest'
import { cardWeakness, dueCount, dueQueue, newCount } from './queue'
import { newSchedule, review } from '../scheduler'
import { emptyProgress, recordAnswer, type ProgressState } from '../storage/progress'
import { cardKey } from './ids'
import type { Card } from './cards'

/** The course the fixture cards belong to. */
const COURSE = 'test-course'

const NOW = new Date('2026-08-27T09:00:00.000Z')
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000)

function card(position: string, tags: string[] = []): Card {
  return {
    key: cardKey(COURSE, position),
    courseId: COURSE,
    position,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    san: 'd4',
    from: 'd2',
    to: 'd4',
    mistakes: [],
    tags,
    chapterIds: [`${COURSE}/ch1`],
    lineIds: [`${COURSE}/ch1:line`],
    label: '1.d4',
  }
}

/** Marks a card answered, so it has a schedule and is no longer new. */
function answered(
  state: ProgressState,
  position: string,
  when: Date,
  rating: 'good' | 'easy' = 'good',
) {
  return recordAnswer(
    state,
    COURSE,
    cardKey(COURSE, position),
    [],
    true,
    review(newSchedule(when), rating, when),
  )
}

describe('dueQueue', () => {
  it('offers every card when nothing has been answered', () => {
    const cards = [card('a'), card('b')]
    expect(dueQueue(cards, emptyProgress(), { now: NOW }).map((c) => c.position)).toEqual(['a', 'b'])
  })

  it('leaves out a card that is not due yet', () => {
    const state = answered(emptyProgress(), 'a', NOW, 'easy')
    const queue = dueQueue([card('a'), card('b')], state, { now: NOW })
    expect(queue.map((c) => c.position)).toEqual(['b'])
  })

  it('brings the card back once it falls due', () => {
    const state = answered(emptyProgress(), 'a', NOW, 'easy')
    expect(dueQueue([card('a')], state, { now: days(365) })).toHaveLength(1)
  })

  it('puts reviews before new cards', () => {
    // 'b' was answered and has come due again; 'a' and 'c' have never been seen.
    const state = answered(emptyProgress(), 'b', NOW)
    const queue = dueQueue([card('a'), card('b'), card('c')], state, { now: days(30) })
    expect(queue[0].position).toBe('b')
  })

  it('puts the most overdue review first', () => {
    let state = answered(emptyProgress(), 'a', NOW, 'easy')
    state = answered(state, 'b', NOW, 'good')
    const queue = dueQueue([card('a'), card('b')], state, { now: days(400) })
    // 'b' was scheduled to come back sooner, so it has been waiting longer.
    expect(queue.map((c) => c.position)).toEqual(['b', 'a'])
  })

  it('keeps course order among new cards', () => {
    const cards = [card('first'), card('second'), card('third')]
    expect(dueQueue(cards, emptyProgress(), { now: NOW }).map((c) => c.position)).toEqual([
      'first',
      'second',
      'third',
    ])
  })
})

describe('cardWeakness', () => {
  it('is nothing at all until a concept has been drilled', () => {
    expect(cardWeakness(emptyProgress(), card('a', ['development']))).toBeNull()
  })

  it('judges a card by its weakest concept', () => {
    let state = emptyProgress()
    // development is going well, vs-qb6 badly.
    for (const correct of [true, true, true, true]) {
      state = recordAnswer(state, COURSE, 'x', ['development'], correct, newSchedule(NOW))
    }
    for (const correct of [false, false, true, false]) {
      state = recordAnswer(state, COURSE, 'y', ['vs-qb6'], correct, newSchedule(NOW))
    }
    expect(cardWeakness(state, card('a', ['development']))).toBe(1)
    expect(cardWeakness(state, card('b', ['development', 'vs-qb6']))).toBe(0.25)
  })
})

describe('the weak-areas filter', () => {
  /** development perfect, vs-qb6 poor, h-file middling, endgame never drilled. */
  function practised(): ProgressState {
    let state = emptyProgress()
    for (const correct of [true, true, true, true]) {
      state = recordAnswer(state, COURSE, 'x', ['development'], correct, newSchedule(NOW))
    }
    for (const correct of [false, false, false, true]) {
      state = recordAnswer(state, COURSE, 'y', ['vs-qb6'], correct, newSchedule(NOW))
    }
    for (const correct of [true, false, true, true]) {
      state = recordAnswer(state, COURSE, 'z', ['h-file'], correct, newSchedule(NOW))
    }
    return state
  }

  it('prefers the concepts going worst', () => {
    const state = practised()
    const cards = [card('strong', ['development']), card('weak', ['vs-qb6']), card('middling', ['h-file'])]
    const queue = dueQueue(cards, state, { now: NOW, weakAreasFirst: true })
    expect(queue.map((c) => c.position)).toEqual(['weak', 'middling', 'strong'])
  })

  it('leaves the order alone when the filter is off', () => {
    const state = practised()
    const cards = [card('strong', ['development']), card('weak', ['vs-qb6'])]
    const queue = dueQueue(cards, state, { now: NOW })
    expect(queue.map((c) => c.position)).toEqual(['strong', 'weak'])
  })

  it('does not send an undrilled concept to the front', () => {
    // 'fresh' has a concept with no history. That is not evidence of weakness,
    // so it must not outrank a concept measured and going badly.
    const state = practised()
    const cards = [card('fresh', ['endgame']), card('weak', ['vs-qb6'])]
    const queue = dueQueue(cards, state, { now: NOW, weakAreasFirst: true })
    expect(queue.map((c) => c.position)).toEqual(['weak', 'fresh'])
  })

  it('picks a card up when its concept slips, without the card itself changing', () => {
    let state = emptyProgress()
    for (const correct of [true, true, true, true]) {
      state = recordAnswer(state, COURSE, 'other', ['development'], correct, newSchedule(NOW))
      state = recordAnswer(state, COURSE, 'other', ['vs-c5'], correct, newSchedule(NOW))
    }
    const cards = [card('a', ['development']), card('b', ['vs-c5'])]
    expect(dueQueue(cards, state, { now: NOW, weakAreasFirst: true }).map((c) => c.position)).toEqual([
      'a',
      'b',
    ])
    // Now vs-c5 goes badly somewhere else in the course.
    for (const correct of [false, false, false, false]) {
      state = recordAnswer(state, COURSE, 'elsewhere', ['vs-c5'], correct, newSchedule(NOW))
    }
    expect(dueQueue(cards, state, { now: NOW, weakAreasFirst: true }).map((c) => c.position)).toEqual([
      'b',
      'a',
    ])
  })
})

describe('counting', () => {
  it('counts what is due and what is new', () => {
    const state = answered(emptyProgress(), 'a', NOW, 'easy')
    const cards = [card('a'), card('b'), card('c')]
    expect(dueCount(cards, state, NOW)).toBe(2)
    expect(newCount(cards, state)).toBe(2)
    expect(dueCount(cards, state, days(365))).toBe(3)
  })
})
