import { describe, expect, it } from 'vitest'
import { ANY_LINE, chapterProgress, conceptAccuracy, courseTotals, playStats } from './stats'
import { buildCards } from './cards'
import { chapterLines } from './lines'
import { loadFixture as load, manifest } from '../test/fixtures'
import { loadCourse } from './course'
import type { LoadedCourse } from './types'
import { newSchedule, review } from '../scheduler'
import { emptyProgress, recordAnswer, toggleLearnt } from '../storage/progress'

const NOW = new Date('2026-08-27T09:00:00.000Z')

const raw = {
  id: 'ch-test',
  title: 'Test chapter',
  intro: 'Typical mistakes: rushing.',
  stem: ['d4', 'd5', 'Bf4'],
  tree: [
    {
      san: 'Nf6',
      note: 'A Black reply in the fixture.',
      weight: 8,
      children: [
        {
          san: 'e3',
          note: 'Complete the triangle.',
          tags: ['development'],
          children: [
            {
              san: 'e6',
              note: 'A Black reply in the fixture.',
              weight: 7,
              children: [{ san: 'Nf3', note: 'Develop.', tags: ['development'], plan: 'Castle.' }],
            },
            {
              san: 'c5',
              note: 'A Black reply in the fixture.',
              weight: 5,
              children: [{ san: 'c3', note: 'Hold d4.', tags: ['vs-c5'], plan: 'Nbd2 next.' }],
            },
          ],
        },
      ],
    },
  ],
}

const chapter = load(raw)

const lines = chapterLines(chapter)

/** The fixture chapter as the whole course it belongs to. */
const course: LoadedCourse = (() => {
  const result = loadCourse(manifest({ chapters: ['one.json'] }), { 'one.json': raw })
  if (!result.ok) throw new Error(`fixture course failed: ${result.errors[0]?.message}`)
  return result.course
})()

const COURSE = course.id

describe('chapterProgress', () => {
  it('counts nothing learnt to start with', () => {
    const [row] = chapterProgress(course, emptyProgress(), NOW)
    expect(row).toMatchObject({
      id: `${COURSE}/ch-test`,
      title: 'Test chapter',
      learnt: 0,
      lines: 2,
      due: 0,
    })
  })

  it('counts the lines ticked and the cards they make', () => {
    const state = toggleLearnt(emptyProgress(), lines[0].id)
    const [row] = chapterProgress(course, state, NOW)
    expect(row.learnt).toBe(1)
    expect(row.lines).toBe(2)
    // 3.e3 and 4.Nf3, both never answered, so both due and both fresh.
    expect(row.due).toBe(2)
    expect(row.fresh).toBe(2)
  })

  it('stops counting a card as due once it has been answered', () => {
    let state = toggleLearnt(emptyProgress(), lines[0].id)
    const { cards } = buildCards(course, [lines[0].id])
    for (const card of cards) {
      state = recordAnswer(
        state,
        card.courseId,
        card.key,
        card.tags,
        true,
        review(newSchedule(NOW), 'easy', NOW),
      )
    }
    const [row] = chapterProgress(course, state, NOW)
    expect(row.due).toBe(0)
    expect(row.fresh).toBe(0)
  })
})

describe('conceptAccuracy', () => {
  it('counts how many learnt cards carry each concept', () => {
    const { cards } = buildCards(course, [lines[0].id, lines[1].id])
    const rows = conceptAccuracy(course, cards, emptyProgress())
    const development = rows.find((row) => row.tag === 'development')
    expect(development).toMatchObject({ cards: 2, accuracy: null, answers: 0 })
  })

  it('puts the worst concept first and the undrilled ones last', () => {
    const { cards } = buildCards(course, [lines[0].id, lines[1].id])
    let state = emptyProgress()
    for (const correct of [true, true, true, true]) {
      state = recordAnswer(state, COURSE, 'x', ['development'], correct, newSchedule(NOW))
    }
    for (const correct of [false, false, true, false]) {
      state = recordAnswer(state, COURSE, 'y', ['vs-c5'], correct, newSchedule(NOW))
    }
    const rows = conceptAccuracy(course, cards, state)
    expect(rows.map((row) => row.tag)).toEqual(['vs-c5', 'development'])
    expect(rows[0].accuracy).toBe(0.25)
    expect(rows[1].accuracy).toBe(1)
  })

  it('keeps a concept with history even when no learnt card carries it now', () => {
    let state = emptyProgress()
    state = recordAnswer(state, COURSE, 'x', ['h-file'], false, newSchedule(NOW))
    const rows = conceptAccuracy(course, [], state)
    expect(rows.map((row) => row.tag)).toEqual(['h-file'])
    expect(rows[0].cards).toBe(0)
  })
})

describe('courseTotals', () => {
  it('adds up the whole course', () => {
    const state = toggleLearnt(emptyProgress(), lines[0].id)
    const { cards } = buildCards(course, state.learntLines)
    expect(courseTotals(course, cards, state, NOW)).toEqual({
      learntLines: 1,
      totalLines: 2,
      cards: 2,
      due: 2,
      fresh: 2,
    })
  })
})

describe('the labels shown to both colours', () => {
  // Phase 8 found this in the live app: the Play launcher and the play stats
  // both said "defence", which is only true when the student is White. In a
  // Black course the opponent is the side choosing an opening.
  it('names an untargeted game without naming a colour or a defence', () => {
    expect(ANY_LINE.toLowerCase()).not.toContain('defence')
    expect(ANY_LINE.toLowerCase()).not.toContain('white')
    expect(ANY_LINE.toLowerCase()).not.toContain('black')
  })

  it('uses that label for games that were not aimed at a chapter', () => {
    const state = {
      ...emptyProgress(),
      playGames: [{ courseId: 'c', deviated: false, moves: 12, level: 4 }],
    }
    expect(playStats([], state).byChapter.map((row) => row.title)).toContain(ANY_LINE)
  })
})
