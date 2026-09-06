import { describe, expect, it } from 'vitest'
import { describeInterval, isDue, isNew, msUntilDue, newSchedule, review } from './index'

const NOW = new Date('2026-08-27T09:00:00.000Z')
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000)

describe('newSchedule', () => {
  it('makes a card that is due at once', () => {
    const schedule = newSchedule(NOW)
    expect(isNew(schedule)).toBe(true)
    expect(isDue(schedule, NOW)).toBe(true)
    expect(schedule.reps).toBe(0)
    expect(schedule.lapses).toBe(0)
  })

  it('survives a trip through JSON, which is how it is stored', () => {
    const schedule = newSchedule(NOW)
    const restored = JSON.parse(JSON.stringify(schedule))
    expect(restored).toEqual(schedule)
    // And it can still be reviewed after the round trip.
    expect(() => review(restored, 'good', NOW)).not.toThrow()
  })
})

describe('isDue', () => {
  it('treats a card that has never been seen as due', () => {
    expect(isDue(undefined, NOW)).toBe(true)
  })

  it('is false before the due date and true after it', () => {
    const answered = review(newSchedule(NOW), 'easy', NOW)
    expect(isDue(answered, NOW)).toBe(false)
    expect(isDue(answered, days(365))).toBe(true)
  })
})

describe('review', () => {
  it('counts the answer', () => {
    const once = review(newSchedule(NOW), 'good', NOW)
    expect(once.reps).toBe(1)
    expect(once.last_review).toBe(NOW.toISOString())
  })

  it('pushes a good answer further out than a hard one', () => {
    const start = review(newSchedule(NOW), 'good', NOW)
    const later = days(3)
    const good = review(start, 'good', later)
    const hard = review(start, 'hard', later)
    expect(msUntilDue(good, later)).toBeGreaterThan(msUntilDue(hard, later))
  })

  it('pushes an easy answer furthest of all', () => {
    const start = review(newSchedule(NOW), 'good', NOW)
    const later = days(3)
    const easy = review(start, 'easy', later)
    const good = review(start, 'good', later)
    expect(msUntilDue(easy, later)).toBeGreaterThan(msUntilDue(good, later))
  })

  it('brings a card straight back after again, and records the lapse', () => {
    // Get the card into review state first, so a failure counts as a lapse.
    let schedule = review(newSchedule(NOW), 'easy', NOW)
    schedule = review(schedule, 'good', days(10))
    const failed = review(schedule, 'again', days(20))
    expect(failed.lapses).toBeGreaterThan(schedule.lapses)
    expect(msUntilDue(failed, days(20))).toBeLessThan(86_400_000)
  })

  it('gets slower to come back the more often it is answered well', () => {
    let schedule = review(newSchedule(NOW), 'good', NOW)
    let previous = 0
    for (let day = 1; day <= 5; day++) {
      const at = days(day * 20)
      schedule = review(schedule, 'good', at)
      const gap = msUntilDue(schedule, at)
      expect(gap).toBeGreaterThan(previous)
      previous = gap
    }
  })
})

describe('describeInterval', () => {
  it('speaks in plain words', () => {
    const at = NOW
    expect(describeInterval({ ...newSchedule(at), due: at.toISOString() }, at)).toBe('again now')
    expect(describeInterval({ ...newSchedule(at), due: days(1).toISOString() }, at)).toBe('in 1 day')
    expect(describeInterval({ ...newSchedule(at), due: days(4).toISOString() }, at)).toBe('in 4 days')
    expect(describeInterval({ ...newSchedule(at), due: days(90).toISOString() }, at)).toBe(
      'in 3 months',
    )
  })

  it('uses minutes and hours for the short intervals a new card gets', () => {
    const in10Minutes = new Date(NOW.getTime() + 10 * 60_000)
    expect(describeInterval({ ...newSchedule(NOW), due: in10Minutes.toISOString() }, NOW)).toBe(
      'in 10 minutes',
    )
    const in5Hours = new Date(NOW.getTime() + 5 * 3_600_000)
    expect(describeInterval({ ...newSchedule(NOW), due: in5Hours.toISOString() }, NOW)).toBe(
      'in 5 hours',
    )
  })
})

describe('the gap unit', () => {
  /**
   * A card FSRS has taken past its learning steps, so its gap is a real number
   * of days rather than a ten-minute step. Built by answering it rather than
   * by hand: a schedule invented here would drift from the one FSRS makes.
   */
  function reviewing(): { schedule: ReturnType<typeof newSchedule>; at: Date } {
    let schedule = newSchedule(NOW)
    let at = NOW
    for (let i = 0; i < 4; i += 1) {
      schedule = review(schedule, 'good', at)
      at = new Date(schedule.due)
    }
    return { schedule, at }
  }

  it('spends the same gap in minutes, hours or days', () => {
    const { schedule, at } = reviewing()
    const inDays = review(schedule, 'good', at, 'days')
    const inHours = review(schedule, 'good', at, 'hours')
    const inMinutes = review(schedule, 'good', at, 'minutes')

    const gap = (next: typeof inDays) => msUntilDue(next, at)
    expect(gap(inDays)).toBeGreaterThan(86_400_000)
    expect(gap(inHours)).toBeCloseTo(gap(inDays) / 24, -2)
    expect(gap(inMinutes)).toBeCloseTo(gap(inDays) / 1440, -2)
  })

  it('leaves everything FSRS worked out exactly as it was', () => {
    const { schedule, at } = reviewing()
    const inDays = review(schedule, 'good', at, 'days')
    for (const unit of ['hours', 'minutes'] as const) {
      const next = review(schedule, 'good', at, unit)
      expect({ ...next, due: inDays.due }).toEqual(inDays)
    }
  })

  it('never puts a card back sooner than a minute', () => {
    // A new card's first gap is a learning step of minutes. In the minutes
    // unit that would land inside the same second without the floor.
    const next = review(newSchedule(NOW), 'again', NOW, 'minutes')
    expect(msUntilDue(next, NOW)).toBe(60_000)
  })

  it('defaults to days, which is what every caller before phase 44 meant', () => {
    const { schedule, at } = reviewing()
    expect(review(schedule, 'good', at)).toEqual(review(schedule, 'good', at, 'days'))
  })
})
