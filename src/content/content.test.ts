import { describe, expect, it } from 'vitest'
import { chapterEntries, chapters, contentErrors } from './index'
import { deepestFullMove, positionsWithMistakes, walkNodes } from '../model/loader'
import { allCards } from '../model/cards'
import type { LoadedChapter } from '../model/types'

/**
 * The gate on the authored repertoire. Every rule here comes from SPEC.md
 * section 3, so a chapter that drifts below the quality bar fails the suite
 * rather than quietly shipping.
 */

const words = (text: string) => text.trim().split(/\s+/).length

function byId(id: string): LoadedChapter {
  const found = chapters.find((chapter) => chapter.id.startsWith(id))
  if (!found) throw new Error(`no chapter starting with ${id}`)
  return found
}

describe('the authored repertoire', () => {
  it('has every chapter file loading with no errors', () => {
    expect(contentErrors).toEqual([])
    expect(chapterEntries.length).toBeGreaterThan(0)
  })

  it('gives every chapter a unique id', () => {
    const ids = chapters.map((chapter) => chapter.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every chapter intro a typical-mistakes section', () => {
    for (const chapter of chapters) {
      expect(chapter.intro.toLowerCase(), chapter.id).toContain('typical mistakes')
    }
  })

  it('never has two chapters expecting different moves in one position', () => {
    // Drill cards are keyed by position, so a disagreement between chapters
    // would mean one of them silently never gets asked.
    expect(allCards(chapters).conflicts).toEqual([])
  })

  it('uses plain hyphens, never em dashes, in authored prose', () => {
    for (const chapter of chapters) {
      const prose = [
        chapter.intro,
        ...walkNodes(chapter).flatMap((node) => [
          node.note ?? '',
          node.plan ?? '',
          ...(node.mistakes ?? []).map((mistake) => mistake.note),
        ]),
      ].join(' ')
      expect(prose, chapter.id).not.toMatch(/[\u2013\u2014]/)
    }
  })

  it('keeps every v1 White move in the modern move order', () => {
    for (const chapter of chapters) {
      for (const node of walkNodes(chapter)) {
        if (node.colour === 'white') expect(node.variant ?? 'modern', chapter.id).toBe('modern')
      }
    }
  })
})

describe('chapter 0, the system', () => {
  it('has an intro of 300 to 500 words', () => {
    const intro = byId('ch0').intro
    expect(words(intro)).toBeGreaterThanOrEqual(300)
    expect(words(intro)).toBeLessThanOrEqual(500)
  })

  it('carries mistake entries on its core setup decisions', () => {
    expect(positionsWithMistakes(byId('ch0'))).toBeGreaterThanOrEqual(4)
  })
})

describe('the repertoire chapters', () => {
  // Chapter 0 is the concept chapter and is measured separately above.
  for (const id of ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6']) {
    it(`${id} runs its deepest line to move 10 or beyond`, () => {
      expect(deepestFullMove(byId(id))).toBeGreaterThanOrEqual(10)
    })

    it(`${id} carries mistake entries on at least ten positions`, () => {
      expect(positionsWithMistakes(byId(id))).toBeGreaterThanOrEqual(10)
    })

    it(`${id} weights every Black reply by club frequency`, () => {
      for (const node of walkNodes(byId(id))) {
        if (node.colour === 'black') {
          expect(node.weight ?? 1, node.path.join(' ')).toBeGreaterThanOrEqual(1)
          expect(node.weight ?? 1, node.path.join(' ')).toBeLessThanOrEqual(10)
        }
      }
    })

    it(`${id} tags every White move with at least one concept`, () => {
      for (const node of walkNodes(byId(id))) {
        if (node.colour === 'white') expect(node.tags.length, node.path.join(' ')).toBeGreaterThan(0)
      }
    })
  }
})
