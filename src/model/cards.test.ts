import { describe, expect, it } from 'vitest'
import { allCards, buildCards, buildCardsAcross, type CardSource } from './cards'
import { chapterLines } from './lines'
import { blackCourse, loadFixture as load } from '../test/fixtures'
import type { LoadedChapter } from './types'

/** Chapters as a slice of the course they belong to, which is what cards need. */
function source(chapters: LoadedChapter[], id = 'test-course'): CardSource {
  return { id, chapters }
}

/** 1.d4 d5 2.Bf4, two lines that share 3.e3 and split afterwards. */
const chapterOne = load({
  id: 'ch-one',
  title: 'One',
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
          mistakes: [{ san: 'Nf3', grade: 'playable', note: 'Also fine, usually the same thing.' }],
          children: [
            {
              san: 'e6',
              note: 'A Black reply in the fixture.',
              weight: 7,
              children: [
                { san: 'Nf3', note: 'Develop.', tags: ['development'], name: 'The Nf3 line', plan: 'Bd3 and castle.' },
              ],
            },
            {
              san: 'c5',
              note: 'A Black reply in the fixture.',
              weight: 5,
              children: [
                { san: 'c3', note: 'Hold d4.', tags: ['vs-c5'], name: 'The c3 line', plan: 'Nbd2 next.' },
              ],
            },
          ],
        },
      ],
    },
  ],
})

/** The same position through 1.d4 Nf6 2.Bf4 d5, so 3.e3 must dedupe across chapters. */
const chapterTwo = load({
  id: 'ch-two',
  title: 'Two',
  intro: 'Typical mistakes: none.',
  stem: ['d4', 'Nf6', 'Bf4'],
  tree: [
    {
      san: 'd5',
      note: 'A Black reply in the fixture.',
      weight: 7,
      children: [
        {
          san: 'e3',
          note: 'The same move by another route.',
          tags: ['bishop-placement'],
          mistakes: [{ san: 'Nc3', grade: 'inaccuracy', note: 'It blocks the c-pawn.' }],
          name: 'The Bf4 line',
          plan: 'Play Nf3, Bd3, c3 and castle.',
        },
      ],
    },
  ],
})

const lineIds = (chapter: LoadedChapter) => chapterLines(chapter).map((line) => line.id)

// Two courses that reach one position and answer it differently, further down.

describe('buildCards', () => {
  it('makes no cards until a line is learnt', () => {
    expect(buildCards(source([chapterOne]), []).cards).toEqual([])
  })

  it('makes one card per White move of a learnt line', () => {
    const [first] = lineIds(chapterOne)
    const { cards } = buildCards(source([chapterOne]), [first])
    expect(cards.map((card) => card.san)).toEqual(['e3', 'Nf3'])
  })

  it('asks the position before the move, with White to play', () => {
    const [first] = lineIds(chapterOne)
    const [card] = buildCards(source([chapterOne]), [first]).cards
    expect(card.fen.split(' ')[1]).toBe('w')
    expect(card.san).toBe('e3')
    expect(card.from).toBe('e2')
    expect(card.to).toBe('e3')
    expect(card.label).toBe('3.e3')
  })

  it('carries the note, the mistakes and the tags', () => {
    const [first] = lineIds(chapterOne)
    const [card] = buildCards(source([chapterOne]), [first]).cards
    expect(card.note).toBe('Complete the triangle.')
    expect(card.mistakes.map((mistake) => mistake.san)).toEqual(['Nf3'])
    expect(card.tags).toEqual(['development'])
  })

  it('carries the plan only when the move ends a line', () => {
    const [first] = lineIds(chapterOne)
    const cards = buildCards(source([chapterOne]), [first]).cards
    expect(cards.find((card) => card.san === 'e3')?.plan).toBeUndefined()
    expect(cards.find((card) => card.san === 'Nf3')?.plan).toBe('Bd3 and castle.')
  })

  it('makes one card for a move two learnt lines share', () => {
    const { cards } = buildCards(source([chapterOne]), lineIds(chapterOne))
    expect(cards.filter((card) => card.san === 'e3')).toHaveLength(1)
    expect(cards.map((card) => card.san).sort()).toEqual(['Nf3', 'c3', 'e3'])
  })

  it('records both lines on the shared card', () => {
    const { cards } = buildCards(source([chapterOne]), lineIds(chapterOne))
    const shared = cards.find((card) => card.san === 'e3')!
    expect(shared.lineIds).toHaveLength(2)
  })

  it('makes one card for a position two chapters reach by different move orders', () => {
    const learnt = [...lineIds(chapterOne), ...lineIds(chapterTwo)]
    const { cards } = buildCards(source([chapterOne, chapterTwo]), learnt)
    const e3 = cards.filter((card) => card.san === 'e3')
    expect(e3).toHaveLength(1)
    expect(e3[0].chapterIds).toEqual(['test-course/ch-one', 'test-course/ch-two'])
  })

  it('merges the tags and mistakes both chapters taught', () => {
    const learnt = [...lineIds(chapterOne), ...lineIds(chapterTwo)]
    const { cards } = buildCards(source([chapterOne, chapterTwo]), learnt)
    const shared = cards.find((card) => card.san === 'e3')!
    expect(shared.tags.sort()).toEqual(['bishop-placement', 'development'])
    expect(shared.mistakes.map((mistake) => mistake.san).sort()).toEqual(['Nc3', 'Nf3'])
  })

  it('takes a plan from the later chapter when the first had none', () => {
    const learnt = [...lineIds(chapterOne), ...lineIds(chapterTwo)]
    const { cards } = buildCards(source([chapterOne, chapterTwo]), learnt)
    expect(cards.find((card) => card.san === 'e3')?.plan).toBe('Play Nf3, Bd3, c3 and castle.')
  })

  it('reports a conflict when two chapters expect different moves in one position', () => {
    const disagreeing = load({
      id: 'ch-clash',
      title: 'Clash',
      intro: 'Typical mistakes: none.',
      stem: ['d4', 'Nf6', 'Bf4'],
      tree: [
        {
          san: 'd5',
          note: 'A Black reply in the fixture.',
          weight: 7,
          children: [{ san: 'Nf3', note: 'A different answer here.', name: 'The other answer', plan: 'e3 next.' }],
        },
      ],
    })
    const learnt = [...lineIds(chapterOne), ...lineIds(disagreeing)]
    const { cards, conflicts } = buildCards(source([chapterOne, disagreeing]), learnt)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({
      kept: 'e3',
      keptChapter: 'test-course/ch-one',
      other: 'Nf3',
    })
    // The first move in course order is the one that stays.
    expect(cards.filter((card) => card.key === conflicts[0].key)).toHaveLength(1)
  })
})

describe('allCards', () => {
  it('counts every card the course could produce', () => {
    const { cards } = allCards(source([chapterOne]))
    expect(cards.map((card) => card.san).sort()).toEqual(['Nf3', 'c3', 'e3'])
  })
})

/**
 * Two courses, one position. This is the case the course scoping exists for.
 *
 * A position taught by two repertoires is two cards, not one, and the
 * conflict check must not fire: the courses are not disagreeing, they are
 * teaching different openings that happen to meet.
 */
describe('cards across courses', () => {
  // Both courses reach the position after 1.d4 d5 2.Bf4 Nf6 and answer it
  // differently: one plays 3.e3, the other 3.Nf3.
  const shared = {
    id: 'ch-shared',
    title: 'Shared',
    intro: 'Typical mistakes: none.',
    stem: ['d4', 'd5', 'Bf4'],
    tree: [
      {
        san: 'Nf6',
        note: 'A reply in the fixture.',
        weight: 7,
        children: [
          {
            san: 'e3',
            note: 'This course completes the triangle.',
            tags: ['development'],
            name: 'The first route',
            plan: 'Nf3, Bd3, c3 and castle.',
          },
        ],
      },
    ],
  }
  const rival = {
    ...shared,
    tree: [
      {
        ...shared.tree[0],
        children: [
          {
            san: 'Nf3',
            note: 'This course develops the knight first.',
            tags: ['development'],
            name: 'The second route',
            plan: 'e3 next, and the same setup a move later.',
          },
        ],
      },
    ],
  }

  const first = source([load(shared)], 'course-one')
  const second = source([load(rival)], 'course-two')
  const learnt = [...lineIds(first.chapters[0]), ...lineIds(second.chapters[0])]

  it('gives one position in two courses two cards, and reports no conflict', () => {
    const { cards, conflicts } = buildCardsAcross([first, second], learnt)
    expect(conflicts).toEqual([])
    const asked = cards.filter((card) => card.fen.startsWith('rnbqkb1r'))
    expect(asked.map((card) => card.san).sort()).toEqual(['Nf3', 'e3'])
    expect(new Set(asked.map((card) => card.key)).size).toBe(2)
  })

  it('names the course on every card, so the queue can say where it came from', () => {
    const { cards } = buildCardsAcross([first, second], learnt)
    expect(new Set(cards.map((card) => card.courseId))).toEqual(
      new Set(['course-one', 'course-two']),
    )
    for (const card of cards) expect(card.key.startsWith(`${card.courseId}#`)).toBe(true)
  })

  it('keeps the position half of the key the same in both', () => {
    // The dedup within a course still works off the position, so the two keys
    // differ only by the course they carry.
    const { cards } = buildCardsAcross([first, second], learnt)
    const asked = cards.filter((card) => card.fen.startsWith('rnbqkb1r'))
    expect(asked[0].position).toBe(asked[1].position)
  })

  it('still catches a real conflict inside one course', () => {
    const both = source([load(shared), load(rival)], 'course-one')
    const { conflicts } = buildCards(both, [
      ...lineIds(both.chapters[0]),
      ...lineIds(both.chapters[1]),
    ])
    expect(conflicts).toHaveLength(1)
  })
})

describe('a Black course', () => {
  it('makes cards from the student\'s moves, which are Black\'s', () => {
    const course = blackCourse()
    const learnt = course.chapters.flatMap((chapter) => lineIds(chapter))
    const { cards, conflicts } = buildCards(course, learnt)
    expect(conflicts).toEqual([])
    // Every card asks a position with Black to move.
    for (const card of cards) expect(card.fen.split(' ')[1]).toBe('b')
    expect(cards.map((card) => card.san)).toContain('c6')
    expect(cards.find((card) => card.san === 'c6')?.label).toBe('1...c6')
  })
})
