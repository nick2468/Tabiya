import { describe, expect, it } from 'vitest'
import { allCards, buildCards } from './cards'
import { chapterLines } from './lines'
import { loadChapter } from './loader'
import type { LoadedChapter } from './types'

function load(raw: unknown): LoadedChapter {
  const result = loadChapter(raw)
  if (!result.ok) throw new Error(`fixture failed: ${result.errors[0]?.message}`)
  return result.chapter
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
              weight: 7,
              children: [
                { san: 'Nf3', note: 'Develop.', tags: ['development'], plan: 'Bd3 and castle.' },
              ],
            },
            {
              san: 'c5',
              weight: 5,
              children: [
                { san: 'c3', note: 'Hold d4.', tags: ['vs-c5'], plan: 'Nbd2 next.' },
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
      weight: 7,
      children: [
        {
          san: 'e3',
          note: 'The same move by another route.',
          tags: ['bishop-placement'],
          mistakes: [{ san: 'Nc3', grade: 'inaccuracy', note: 'It blocks the c-pawn.' }],
          plan: 'Play Nf3, Bd3, c3 and castle.',
        },
      ],
    },
  ],
})

const lineIds = (chapter: LoadedChapter) => chapterLines(chapter).map((line) => line.id)

describe('buildCards', () => {
  it('makes no cards until a line is learnt', () => {
    expect(buildCards([chapterOne], []).cards).toEqual([])
  })

  it('makes one card per White move of a learnt line', () => {
    const [first] = lineIds(chapterOne)
    const { cards } = buildCards([chapterOne], [first])
    expect(cards.map((card) => card.san)).toEqual(['e3', 'Nf3'])
  })

  it('asks the position before the move, with White to play', () => {
    const [first] = lineIds(chapterOne)
    const [card] = buildCards([chapterOne], [first]).cards
    expect(card.fen.split(' ')[1]).toBe('w')
    expect(card.san).toBe('e3')
    expect(card.from).toBe('e2')
    expect(card.to).toBe('e3')
    expect(card.label).toBe('3.e3')
  })

  it('carries the note, the mistakes and the tags', () => {
    const [first] = lineIds(chapterOne)
    const [card] = buildCards([chapterOne], [first]).cards
    expect(card.note).toBe('Complete the triangle.')
    expect(card.mistakes.map((mistake) => mistake.san)).toEqual(['Nf3'])
    expect(card.tags).toEqual(['development'])
  })

  it('carries the plan only when the move ends a line', () => {
    const [first] = lineIds(chapterOne)
    const cards = buildCards([chapterOne], [first]).cards
    expect(cards.find((card) => card.san === 'e3')?.plan).toBeUndefined()
    expect(cards.find((card) => card.san === 'Nf3')?.plan).toBe('Bd3 and castle.')
  })

  it('makes one card for a move two learnt lines share', () => {
    const { cards } = buildCards([chapterOne], lineIds(chapterOne))
    expect(cards.filter((card) => card.san === 'e3')).toHaveLength(1)
    expect(cards.map((card) => card.san).sort()).toEqual(['Nf3', 'c3', 'e3'])
  })

  it('records both lines on the shared card', () => {
    const { cards } = buildCards([chapterOne], lineIds(chapterOne))
    const shared = cards.find((card) => card.san === 'e3')!
    expect(shared.lineIds).toHaveLength(2)
  })

  it('makes one card for a position two chapters reach by different move orders', () => {
    const learnt = [...lineIds(chapterOne), ...lineIds(chapterTwo)]
    const { cards } = buildCards([chapterOne, chapterTwo], learnt)
    const e3 = cards.filter((card) => card.san === 'e3')
    expect(e3).toHaveLength(1)
    expect(e3[0].chapterIds).toEqual(['ch-one', 'ch-two'])
  })

  it('merges the tags and mistakes both chapters taught', () => {
    const learnt = [...lineIds(chapterOne), ...lineIds(chapterTwo)]
    const { cards } = buildCards([chapterOne, chapterTwo], learnt)
    const shared = cards.find((card) => card.san === 'e3')!
    expect(shared.tags.sort()).toEqual(['bishop-placement', 'development'])
    expect(shared.mistakes.map((mistake) => mistake.san).sort()).toEqual(['Nc3', 'Nf3'])
  })

  it('takes a plan from the later chapter when the first had none', () => {
    const learnt = [...lineIds(chapterOne), ...lineIds(chapterTwo)]
    const { cards } = buildCards([chapterOne, chapterTwo], learnt)
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
          weight: 7,
          children: [{ san: 'Nf3', note: 'A different answer here.', plan: 'e3 next.' }],
        },
      ],
    })
    const learnt = [...lineIds(chapterOne), ...lineIds(disagreeing)]
    const { cards, conflicts } = buildCards([chapterOne, disagreeing], learnt)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({ kept: 'e3', keptChapter: 'ch-one', other: 'Nf3' })
    // The first move in course order is the one that stays.
    expect(cards.filter((card) => card.key === conflicts[0].key)).toHaveLength(1)
  })
})

describe('allCards', () => {
  it('counts every card the course could produce', () => {
    const { cards } = allCards([chapterOne])
    expect(cards.map((card) => card.san).sort()).toEqual(['Nf3', 'c3', 'e3'])
  })
})
