import { describe, expect, it } from 'vitest'
import { chapterLines, fullMoveNumber, lineId, moveList, nodesForPath } from './lines'
import { loadChapter } from './loader'
import type { LoadedChapter } from './types'

/** 1.d4 d5 2.Bf4, then two lines that split at Black's second move. */
function fixture(): LoadedChapter {
  const result = loadChapter({
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
            children: [
              {
                san: 'e6',
                note: 'A Black reply in the fixture.',
                weight: 7,
                children: [{ san: 'Nf3', note: 'Develop.', plan: 'Bd3, c3, castle.' }],
              },
              {
                san: 'c5',
                note: 'A Black reply in the fixture.',
                weight: 5,
                children: [{ san: 'c3', note: 'Hold d4.', plan: 'Nbd2 and Bd3 next.' }],
              },
            ],
          },
        ],
      },
      {
        san: 'c5',
        note: 'A Black reply in the fixture.',
        weight: 6,
        children: [{ san: 'e3', note: 'Hold the centre.', plan: 'Meet ...Qb6 with Nc3.' }],
      },
    ],
  })
  if (!result.ok) throw new Error(`fixture failed to load: ${result.errors[0]?.message}`)
  return result.chapter
}

describe('chapterLines', () => {
  it('finds one line per leaf, in authored order', () => {
    const lines = chapterLines(fixture())
    expect(lines.map((line) => line.path.join(' '))).toEqual([
      'd4 d5 Bf4 Nf6 e3 e6 Nf3',
      'd4 d5 Bf4 Nf6 e3 c5 c3',
      'd4 d5 Bf4 c5 e3',
    ])
  })

  it('carries the whole chain of nodes and the leaf', () => {
    const [first] = chapterLines(fixture())
    expect(first.nodes.map((node) => node.san)).toEqual(['Nf6', 'e3', 'e6', 'Nf3'])
    expect(first.leaf.san).toBe('Nf3')
    expect(first.leaf.plan).toBe('Bd3, c3, castle.')
  })

  it('builds an id from the chapter and the moves', () => {
    const [first] = chapterLines(fixture())
    expect(first.id).toBe(lineId('ch-test', ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3']))
    expect(first.id).toBe('ch-test:d4 d5 Bf4 Nf6 e3 e6 Nf3')
  })

  it('gives every line a distinct id', () => {
    const ids = chapterLines(fixture()).map((line) => line.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('moveList', () => {
  it('numbers the moves and marks a Black move opening the line', () => {
    const lines = chapterLines(fixture())
    // The stem ends after 2.Bf4, so the first tree node is Black's second move.
    expect(lines[0].label).toBe('2...Nf6 3.e3 e6 4.Nf3')
    expect(lines[2].label).toBe('2...c5 3.e3')
  })

  it('starts with a numbered White move when the line opens with one', () => {
    const chapter = fixture()
    const chain = nodesForPath(chapter, ['d4', 'd5', 'Bf4', 'Nf6', 'e3'])!
    expect(moveList(chain.slice(1))).toBe('3.e3')
  })
})

describe('fullMoveNumber', () => {
  it('counts a White move and the Black reply as the same move', () => {
    const chapter = fixture()
    const chain = nodesForPath(chapter, ['d4', 'd5', 'Bf4', 'Nf6', 'e3'])!
    expect(fullMoveNumber(chain[0])).toBe(2)
    expect(fullMoveNumber(chain[1])).toBe(3)
  })
})

describe('nodesForPath', () => {
  it('walks down to the node the path names', () => {
    const chapter = fixture()
    const chain = nodesForPath(chapter, ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'c5'])
    expect(chain?.map((node) => node.san)).toEqual(['Nf6', 'e3', 'c5'])
  })

  it('returns an empty chain for the start of the chapter', () => {
    expect(nodesForPath(fixture(), ['d4', 'd5', 'Bf4'])).toEqual([])
  })

  it('returns null when the path leaves the tree', () => {
    expect(nodesForPath(fixture(), ['d4', 'd5', 'Bf4', 'Nh6'])).toBeNull()
  })
})

describe('the loaded node squares', () => {
  it('records where each move started and ended, for the board arrow', () => {
    const chain = nodesForPath(fixture(), ['d4', 'd5', 'Bf4', 'Nf6', 'e3'])!
    expect(chain[0].from).toBe('g8')
    expect(chain[0].to).toBe('f6')
    expect(chain[1].from).toBe('e2')
    expect(chain[1].to).toBe('e3')
  })
})
