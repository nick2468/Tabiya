import { describe, expect, it } from 'vitest'
import { bundledCourses as courses, bundledEntries as courseEntries, contentErrors } from './index'
import { splitIntro } from '../model/intro'
import { deepestFullMove, positionsWithMistakes, walkNodes } from '../model/loader'
import { allCards } from '../model/cards'
import { colourName, type LoadedChapter, type LoadedCourse } from '../model/types'

/**
 * The gate on the authored content. Every rule here comes from SPEC.md
 * section 3, so a chapter that drifts below the quality bar fails the suite
 * rather than quietly shipping.
 *
 * The bar runs per course and is written relative to the STUDENT's colour, so
 * a Black course is held to the same standard without a line of it being
 * special-cased. What stays course-specific is the chapter list itself: the
 * London's eight chapters are checked below by name, and a second course
 * brings its own block.
 */

const words = (text: string) => text.trim().split(/\s+/).length

function chapterOf(course: LoadedCourse, prefix: string): LoadedChapter {
  const found = course.chapters.find((chapter) => chapter.fileId.startsWith(prefix))
  if (!found) throw new Error(`no chapter starting with ${prefix} in ${course.id}`)
  return found
}

function courseById(id: string): LoadedCourse {
  const found = courses.find((course) => course.id === id)
  if (!found) throw new Error(`no course ${id}`)
  return found
}

describe('the bundled courses', () => {
  it('has every course loading with no errors', () => {
    expect(contentErrors).toEqual([])
    expect(courseEntries.length).toBeGreaterThan(0)
  })

  it('gives every course a unique id', () => {
    const ids = courses.map((course) => course.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// The quality bar, applied to whatever is bundled. Adding a course adds a run
// of these without touching the file.
describe.each(courses.map((course) => [course.id, course] as const))(
  'the %s course',
  (_id, course) => {
    const student = colourName(course.colour)

    it('gives every chapter a unique id', () => {
      const ids = course.chapters.map((chapter) => chapter.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('gives every chapter intro a typical-mistakes section', () => {
      for (const chapter of course.chapters) {
        expect(chapter.intro.toLowerCase(), chapter.id).toContain('typical mistakes')
      }
    })

    it('gives every intro a lead paragraph and sections, which the Study layout splits', () => {
      for (const chapter of course.chapters) {
        const parts = splitIntro(chapter.intro)
        expect(parts.lead.length, chapter.id).toBeGreaterThan(0)
        expect(parts.lead, chapter.id).not.toContain('#')
        expect(parts.rest.toLowerCase(), chapter.id).toContain('typical mistakes')
      }
    })

    it('never has two chapters expecting different moves in one position', () => {
      // Drill cards are keyed by position, so a disagreement inside a course
      // would mean one of the two chapters is silently never asked.
      expect(allCards(course).conflicts).toEqual([])
    })

    it('uses plain hyphens, never em dashes, in authored prose', () => {
      for (const chapter of course.chapters) {
        const prose = [
          chapter.intro,
          chapter.title,
          ...walkNodes(chapter).flatMap((node) => [
            node.note ?? '',
            node.plan ?? '',
            ...(node.mistakes ?? []).map((mistake) => mistake.note),
          ]),
        ].join(' ')
        expect(prose, chapter.id).not.toMatch(/[\u2013\u2014]/)
      }
    })

    it('keeps its tags inside the core set plus its own extensions', () => {
      for (const chapter of course.chapters) {
        for (const node of walkNodes(chapter)) {
          for (const tag of node.tags) expect(course.tags, chapter.id).toContain(tag)
        }
      }
    })

    it(`notes every move and plans from every leaf, with ${student} as the student`, () => {
      for (const chapter of course.chapters) {
        for (const node of walkNodes(chapter)) {
          expect(node.note, `${chapter.id} ${node.path.join(' ')}`).toBeTruthy()
          if (node.isLeaf) expect(node.plan, `${chapter.id} ${node.path.join(' ')}`).toBeTruthy()
          // Authored judgement sits on the student's moves; frequency sits on
          // the opponent's. The loader enforces it, and this says why.
          if (!node.isStudent) expect(node.mistakes, chapter.id).toBeUndefined()
        }
      }
    })
  },
)

describe('the London course', () => {
  const london = courseById('london-white')

  it('is a White course of eight chapters', () => {
    expect(london.colour).toBe('white')
    expect(london.opponentColour).toBe('black')
    expect(london.chapters.length).toBe(8)
  })

  it('keeps every v1 White move in the modern move order', () => {
    for (const chapter of london.chapters) {
      for (const node of walkNodes(chapter)) {
        if (node.isStudent) expect(node.variant ?? 'modern', chapter.id).toBe('modern')
      }
    }
  })

  describe('chapter 0, the system', () => {
    it('has an intro of 300 to 500 words', () => {
      const intro = chapterOf(london, 'ch0').intro
      expect(words(intro)).toBeGreaterThanOrEqual(300)
      expect(words(intro)).toBeLessThanOrEqual(500)
    })

    it('carries mistake entries on its core setup decisions', () => {
      expect(positionsWithMistakes(chapterOf(london, 'ch0'))).toBeGreaterThanOrEqual(4)
    })
  })

  describe('the repertoire chapters', () => {
    // Chapter 0 is the concept chapter and is measured separately above.
    for (const id of ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6']) {
      it(`${id} runs its deepest line to move 10 or beyond`, () => {
        expect(deepestFullMove(chapterOf(london, id))).toBeGreaterThanOrEqual(10)
      })

      it(`${id} carries mistake entries on at least ten positions`, () => {
        expect(positionsWithMistakes(chapterOf(london, id))).toBeGreaterThanOrEqual(10)
      })

      it(`${id} weights every Black reply by club frequency`, () => {
        for (const node of walkNodes(chapterOf(london, id))) {
          if (!node.isStudent) {
            expect(node.weight ?? 1, node.path.join(' ')).toBeGreaterThanOrEqual(1)
            expect(node.weight ?? 1, node.path.join(' ')).toBeLessThanOrEqual(10)
          }
        }
      })

      it(`${id} tags every White move with at least one concept`, () => {
        for (const node of walkNodes(chapterOf(london, id))) {
          if (node.isStudent) expect(node.tags.length, node.path.join(' ')).toBeGreaterThan(0)
        }
      })
    }
  })

  describe('chapter 7, the exercises', () => {
    it('ends every exercise on a White move worth drilling', () => {
      const chapter = chapterOf(london, 'ch7')
      for (const line of walkNodes(chapter).filter((node) => node.isLeaf)) {
        expect(line.isStudent, line.path.join(' ')).toBe(true)
      }
    })

    it('carries at least four exercises', () => {
      const leaves = walkNodes(chapterOf(london, 'ch7')).filter((node) => node.isLeaf)
      expect(leaves.length).toBeGreaterThanOrEqual(4)
    })

    it('runs each exercise deep enough to be a real position', () => {
      expect(deepestFullMove(chapterOf(london, 'ch7'))).toBeGreaterThanOrEqual(10)
    })
  })
})

describe('the Caro-Kann course', () => {
  const caro = courseById('caro-kann-black')

  it('is a Black course of seven chapters', () => {
    expect(caro.colour).toBe('black')
    expect(caro.opponentColour).toBe('white')
    expect(caro.chapters.length).toBe(7)
  })

  it('declares the tags it uses beyond the core set', () => {
    // The London's vs-something tags say nothing about a Caro-Kann, so the
    // two courses share the core ten and nothing else.
    expect(caro.tags).toContain('vs-advance')
    expect(caro.tags).not.toContain('vs-c5')
  })

  describe('chapter 0, the defence', () => {
    it('has an intro of 300 to 500 words', () => {
      const intro = chapterOf(caro, 'ch0').intro
      expect(words(intro)).toBeGreaterThanOrEqual(300)
      expect(words(intro)).toBeLessThanOrEqual(500)
    })

    it('carries mistake entries on its core setup decisions', () => {
      expect(positionsWithMistakes(chapterOf(caro, 'ch0'))).toBeGreaterThanOrEqual(4)
    })
  })

  describe('the repertoire chapters', () => {
    // Chapter 0 is the concept tour and chapter 6 is the exercises; both are
    // measured separately.
    for (const id of ['ch1', 'ch2', 'ch3', 'ch4', 'ch5']) {
      it(`${id} runs its deepest line to move 10 or beyond`, () => {
        expect(deepestFullMove(chapterOf(caro, id))).toBeGreaterThanOrEqual(10)
      })

      it(`${id} carries mistake entries on at least ten positions`, () => {
        expect(positionsWithMistakes(chapterOf(caro, id))).toBeGreaterThanOrEqual(10)
      })

      it(`${id} weights every White reply by club frequency`, () => {
        for (const node of walkNodes(chapterOf(caro, id))) {
          if (!node.isStudent) {
            expect(node.weight ?? 1, node.path.join(' ')).toBeGreaterThanOrEqual(1)
            expect(node.weight ?? 1, node.path.join(' ')).toBeLessThanOrEqual(10)
          }
        }
      })

      it(`${id} tags every Black move with at least one concept`, () => {
        for (const node of walkNodes(chapterOf(caro, id))) {
          if (node.isStudent) expect(node.tags.length, node.path.join(' ')).toBeGreaterThan(0)
        }
      })
    }
  })

  describe('chapter 6, the exercises', () => {
    it('ends every exercise on a Black move worth drilling', () => {
      const chapter = chapterOf(caro, 'ch6')
      for (const line of walkNodes(chapter).filter((node) => node.isLeaf)) {
        expect(line.isStudent, line.path.join(' ')).toBe(true)
      }
    })

    it('carries at least four exercises', () => {
      const leaves = walkNodes(chapterOf(caro, 'ch6')).filter((node) => node.isLeaf)
      expect(leaves.length).toBeGreaterThanOrEqual(4)
    })

    it('runs each exercise deep enough to be a real position', () => {
      expect(deepestFullMove(chapterOf(caro, 'ch6'))).toBeGreaterThanOrEqual(10)
    })
  })
})
describe('the Slav course', () => {
  const slav = courseById('slav-black')

  it('is a Black course of seven chapters', () => {
    expect(slav.colour).toBe('black')
    expect(slav.opponentColour).toBe('white')
    expect(slav.chapters.length).toBe(7)
  })

  it('declares the tags it uses beyond the core set', () => {
    // Sharing a name with another course is deliberate: light-squares and
    // c5-break mean the same thing in the Caro-Kann, and the Progress view
    // compares courses by exactly these strings. What a course may not do is
    // use a tag it has not declared.
    expect(slav.tags).toContain('vs-london')
    expect(slav.tags).toContain('light-squares')
    expect(slav.tags).not.toContain('vs-advance')
  })

  describe('chapter 0, the defence', () => {
    it('has an intro of 300 to 500 words', () => {
      const intro = chapterOf(slav, 'ch0').intro
      expect(words(intro)).toBeGreaterThanOrEqual(300)
      expect(words(intro)).toBeLessThanOrEqual(500)
    })

    it('carries mistake entries on its core setup decisions', () => {
      expect(positionsWithMistakes(chapterOf(slav, 'ch0'))).toBeGreaterThanOrEqual(4)
    })
  })

  describe('the repertoire chapters', () => {
    // Chapter 0 is the concept tour and chapter 6 is the exercises; both are
    // measured separately.
    for (const id of ['ch1', 'ch2', 'ch3', 'ch4', 'ch5']) {
      it(`${id} runs its deepest line to move 10 or beyond`, () => {
        expect(deepestFullMove(chapterOf(slav, id))).toBeGreaterThanOrEqual(10)
      })

      it(`${id} carries mistake entries on at least ten positions`, () => {
        expect(positionsWithMistakes(chapterOf(slav, id))).toBeGreaterThanOrEqual(10)
      })

      it(`${id} weights every White reply by club frequency`, () => {
        for (const node of walkNodes(chapterOf(slav, id))) {
          if (!node.isStudent) {
            expect(node.weight ?? 1, node.path.join(' ')).toBeGreaterThanOrEqual(1)
            expect(node.weight ?? 1, node.path.join(' ')).toBeLessThanOrEqual(10)
          }
        }
      })

      it(`${id} tags every Black move with at least one concept`, () => {
        for (const node of walkNodes(chapterOf(slav, id))) {
          if (node.isStudent) expect(node.tags.length, node.path.join(' ')).toBeGreaterThan(0)
        }
      })
    }
  })

  describe('chapter 6, the exercises', () => {
    it('ends every exercise on a Black move worth drilling', () => {
      const chapter = chapterOf(slav, 'ch6')
      for (const line of walkNodes(chapter).filter((node) => node.isLeaf)) {
        expect(line.isStudent, line.path.join(' ')).toBe(true)
      }
    })

    it('carries at least four exercises', () => {
      const leaves = walkNodes(chapterOf(slav, 'ch6')).filter((node) => node.isLeaf)
      expect(leaves.length).toBeGreaterThanOrEqual(4)
    })

    it('runs each exercise deep enough to be a real position', () => {
      expect(deepestFullMove(chapterOf(slav, 'ch6'))).toBeGreaterThanOrEqual(10)
    })
  })
})

describe('the courses together', () => {
  // Course scoping makes this structural rather than lucky: a card key is the
  // course id and the position. The acceptance asks for it proved anyway,
  // because the whole progress file hangs off these keys and a collision
  // would mean one course answering for another's schedule.
  it('shares no card key between any two bundled courses', () => {
    const owner = new Map<string, string>()
    for (const course of courses) {
      for (const card of allCards(course).cards) {
        const first = owner.get(card.key)
        expect(first, `${card.key} is in both ${first} and ${course.id}`).toBeUndefined()
        owner.set(card.key, course.id)
      }
    }
    expect(owner.size).toBeGreaterThan(0)
  })

  it('reaches the same positions across colours and still cannot collide', () => {
    // Worth stating plainly, because it is easy to read the test above as
    // proof that course scoping is load bearing. It is not, yet. A card
    // records whose turn it is, and every card in a course is the student's
    // turn, so a White course and a Black course cannot share one whatever
    // they teach. The Slav is the sharpest case there is: its chapter 5 is
    // the London seen from the other side, and the two courses walk through
    // a dozen of the same positions. Scoping earns its place against a
    // second course of the same colour, which does not exist yet.
    for (const course of courses) {
      const turn = course.colour === 'white' ? 'w' : 'b'
      for (const card of allCards(course).cards) {
        expect(card.position.split(' ')[1], `${course.id} ${card.position}`).toBe(turn)
      }
    }
  })
})
