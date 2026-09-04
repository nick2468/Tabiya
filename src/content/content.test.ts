import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { bundledCourses as courses, bundledEntries as courseEntries, contentErrors } from './index'
import { splitIntro } from '../model/intro'
import { deepestFullMove, positionsWithMistakes, walkNodes } from '../model/loader'
import { allCards } from '../model/cards'
import { chapterLines } from '../model/lines'
import { colourName, type LoadedChapter, type LoadedCourse } from '../model/types'
import { HARD, checkChapter } from '../../scripts/lib/note-lines.mjs'

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

    /**
     * A `+` or a `#` on a move is a claim about the board, and a false one is
     * the kind of small lie that costs a reader trust in everything else on
     * the screen.
     *
     * Nothing caught these before, because chess.js accepts a spurious marker
     * and quietly normalises it away rather than refusing the move. Review
     * gate 18 found three by comparing the two: two `Bc4+` in the Vienna and
     * one `Qa5+` in the Slav, every one of them a diagonal that was already
     * blocked, and two of the three carried a note built on the check as
     * well. So the comparison has to be written down.
     *
     * Both directions, because a real check written without its marker is the
     * same fault seen from the other side.
     */
    it('never marks a move as check or mate unless it is', () => {
      const marked = (san: string) => /[+#]$/.test(san)
      for (const chapter of course.chapters) {
        for (const node of walkNodes(chapter)) {
          const where = `${chapter.id} ${node.path.join(' ')}`
          const board = new Chess(node.parentFen)
          expect(marked(node.san), where).toBe(marked(board.move(node.san).san))
          for (const alternative of node.mistakes ?? []) {
            const aside = new Chess(node.parentFen)
            const canonical = aside.move(alternative.san).san
            expect(marked(alternative.san), `${where} / ${alternative.san}`).toBe(marked(canonical))
          }
        }
      }
    })

    /**
     * "Take towards the centre", checked against which way the pawn went.
     *
     * The same shape as the check-and-mate rule above: a note makes a claim
     * about the board, and the board can answer it. Nick found one by eye in
     * the Ruy Lopez Exchange, where 4...dxc6 was called a recapture towards
     * the centre in seven places; d7 to c6 is a step away from it. Sweeping
     * for the phrase found three more the same afternoon, in the Slav and the
     * Vienna. The reasons those notes gave were right; only the direction was
     * wrong, which is exactly the kind of fault that survives a careful read.
     *
     * A capture between the d and e files passes. `exd4` moves from one
     * central file to the other, so it goes neither way, and calling it
     * towards the centre is loose rather than false.
     *
     * Captures only. A note beside a quiet move may be talking about a plan
     * two moves off, and this rule has no business guessing.
     *
     * The rule reads the phrase as being about the move the note is ON. That
     * is what makes it cheap, and it is also a house rule it imposes: a note
     * that recommends a DIFFERENT move must not use the phrase. One Vienna
     * alternative did, saying "recapture towards the centre with the a-pawn"
     * under cxb3, and it was reworded to match its own twin rather than the
     * rule being weakened to allow it.
     */
    it('never says a capture goes towards the centre when it goes away from it', () => {
      // Distance from the d and e files, which are the centre. Both are 0.
      const fromCentre = (square: string) =>
        Math.min(Math.abs(square.charCodeAt(0) - 100), Math.abs(square.charCodeAt(0) - 101))
      const claimsCentre = (text: string | undefined) =>
        /towards? the (centre|middle)/i.test(text ?? '')

      // Every one at once rather than the first: a sweep that stops at the
      // first fault hides how many there are, and there were five.
      const wrong: string[] = []
      for (const chapter of course.chapters) {
        for (const node of walkNodes(chapter)) {
          const said: [string, string | undefined][] = [
            [node.san, [node.note, node.plan].filter(Boolean).join(' ')],
            ...(node.mistakes ?? []).map(
              (alternative) => [alternative.san, alternative.note] as [string, string | undefined],
            ),
          ]
          for (const [san, text] of said) {
            if (!claimsCentre(text)) continue
            const board = new Chess(node.parentFen)
            const move = board.move(san)
            if (!move.captured) continue
            if (fromCentre(move.to) <= fromCentre(move.from)) continue
            wrong.push(
              `${chapter.id} ${node.path.join(' ')} / ${san}: ${move.from} to ${move.to}`,
            )
          }
        }
      }
      expect(wrong).toEqual([])
    })

    /**
     * The lines the prose names, played on a board.
     *
     * A note can describe a real idea and name a line that cannot be played,
     * usually because the line was copied from a position that was nearly the
     * same. Nothing here reads it: the engine passes never see a word, and
     * `note-claims.mjs` plays a note's moves only when the note also promises
     * material in its own vocabulary, which is one entry in twenty.
     *
     * Only the three categories that reach zero across every course are held
     * here. The rest - a note pointing at another chapter, a note naming an
     * illegal move in order to say it is illegal, a note leaving out an
     * obvious recapture - stay in `scripts/note-lines.mjs`, where a person
     * reads them, because a test that fails on good prose is worse than no
     * test at all.
     */
    it('never names a line in prose that the board refuses', () => {
      for (const chapter of course.chapters) {
        const faults = checkChapter(chapter).filter((finding) => HARD.includes(finding.category))
        const report = faults.map((finding) => `${finding.where}: "${finding.moves}" ${finding.detail}`)
        expect(report, chapter.id).toEqual([])
      }
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
            node.name ?? '',
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

    it('names every line, uniquely within its chapter and short enough to read', () => {
      // The loader enforces all three. This says them again over the shipped
      // content, because the names are the whole of the Study lines table: a
      // missing one leaves a blank row and a duplicated one leaves two rows
      // nobody can tell apart, which is the fault phase 13 exists to fix.
      for (const chapter of course.chapters) {
        const lines = chapterLines(chapter)
        expect(lines.length, chapter.id).toBeGreaterThan(0)
        for (const line of lines) {
          expect(line.leaf.name, `${chapter.id} ${line.path.join(' ')}`).toBeTruthy()
          expect(line.name.length, `${chapter.id} ${line.name}`).toBeLessThanOrEqual(40)
        }
        const names = lines.map((line) => line.name)
        expect(new Set(names).size, chapter.id).toBe(names.length)
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

describe('the Ruy Lopez Exchange course', () => {
  const ruy = courseById('ruy-lopez-exchange')

  it('is a White course of seven chapters', () => {
    expect(ruy.colour).toBe('white')
    expect(ruy.opponentColour).toBe('black')
    expect(ruy.chapters.length).toBe(7)
  })

  it('declares the tags it uses beyond the core set', () => {
    expect(ruy.tags).toContain('majority')
    expect(ruy.tags).toContain('doubled-pawns')
    expect(ruy.tags).toContain('vs-berlin')
    expect(ruy.tags).not.toContain('vs-london')
  })

  it('takes on c6 in every chapter, which is the whole course', () => {
    // The one claim that is really about this course rather than the format.
    // The Exchange is a structural choice, and a chapter that reached the
    // structure some other way would be teaching a different opening.
    for (const chapter of ruy.chapters) {
      // The capture is usually in the stem, which walkNodes does not visit,
      // so both halves of the chapter have to be looked at.
      const moves = [...chapter.stem, ...walkNodes(chapter).map((node) => node.san)]
      expect(moves.some((san) => san.startsWith('Bxc6')), chapter.id).toBe(true)
    }
  })

  describe('chapter 0, the exchange', () => {
    it('has an intro of 300 to 500 words', () => {
      const intro = chapterOf(ruy, 'ch0').intro
      expect(words(intro)).toBeGreaterThanOrEqual(300)
      expect(words(intro)).toBeLessThanOrEqual(500)
    })

    it('carries mistake entries on its core setup decisions', () => {
      expect(positionsWithMistakes(chapterOf(ruy, 'ch0'))).toBeGreaterThanOrEqual(4)
    })
  })

  describe('the repertoire chapters', () => {
    for (const id of ['ch1', 'ch2', 'ch3', 'ch4', 'ch5']) {
      it(`${id} runs its deepest line to move 10 or beyond`, () => {
        expect(deepestFullMove(chapterOf(ruy, id))).toBeGreaterThanOrEqual(10)
      })

      it(`${id} carries mistake entries on at least ten positions`, () => {
        expect(positionsWithMistakes(chapterOf(ruy, id))).toBeGreaterThanOrEqual(10)
      })

      it(`${id} weights every Black reply by club frequency`, () => {
        for (const node of walkNodes(chapterOf(ruy, id))) {
          if (!node.isStudent) {
            expect(node.weight ?? 1, node.path.join(' ')).toBeGreaterThanOrEqual(1)
            expect(node.weight ?? 1, node.path.join(' ')).toBeLessThanOrEqual(10)
          }
        }
      })

      it(`${id} tags every White move with at least one concept`, () => {
        for (const node of walkNodes(chapterOf(ruy, id))) {
          if (node.isStudent) expect(node.tags.length, node.path.join(' ')).toBeGreaterThan(0)
        }
      })
    }
  })

  describe('chapter 6, the exercises', () => {
    it('ends every exercise on a White move worth drilling', () => {
      for (const line of walkNodes(chapterOf(ruy, 'ch6')).filter((node) => node.isLeaf)) {
        expect(line.isStudent, line.path.join(' ')).toBe(true)
      }
    })

    it('carries at least four exercises', () => {
      const leaves = walkNodes(chapterOf(ruy, 'ch6')).filter((node) => node.isLeaf)
      expect(leaves.length).toBeGreaterThanOrEqual(4)
    })

    it('runs each exercise deep enough to be a real position', () => {
      expect(deepestFullMove(chapterOf(ruy, 'ch6'))).toBeGreaterThanOrEqual(10)
    })
  })
})

describe('the Colle-Zukertort course', () => {
  const colle = courseById('colle-zukertort')

  it('is a White course of seven chapters', () => {
    expect(colle.colour).toBe('white')
    expect(colle.opponentColour).toBe('black')
    expect(colle.chapters.length).toBe(7)
  })

  it('declares the tags it uses beyond the core set', () => {
    expect(colle.tags).toContain('long-diagonal')
    expect(colle.tags).toContain('e5-outpost')
    expect(colle.tags).toContain('rook-lift')
    expect(colle.tags).not.toContain('vs-c5')
  })

  it('puts the bishop on b2 in every chapter and never builds the c3 triangle', () => {
    // The one claim that is really about this course rather than the format.
    // b3 and Bb2 instead of c3 is the whole reason it exists beside the
    // London: a course that reached for c3 would be teaching the structure
    // Nick already knows.
    for (const chapter of colle.chapters) {
      const white = walkNodes(chapter).filter((node) => node.isStudent)
      expect(white.map((node) => node.san), chapter.id).toContain('b3')
      expect(white.map((node) => node.san), chapter.id).not.toContain('c3')
    }
  })

  it('never puts the knight on e5 before the bishop reaches b2', () => {
    // The chapter 1 rule, stated as an invariant: the bishop on b2 is what
    // holds the outpost, so a knight that arrives first is a knight Black
    // trades off.
    for (const chapter of colle.chapters) {
      for (const node of walkNodes(chapter)) {
        if (!node.isStudent || node.san !== 'Ne5') continue
        expect(node.path.slice(0, -1), `${chapter.id} ${node.path.join(' ')}`).toContain('Bb2')
      }
    }
  })

  describe('chapter 0, the system', () => {
    it('has an intro of 300 to 500 words', () => {
      const intro = chapterOf(colle, 'ch0').intro
      expect(words(intro)).toBeGreaterThanOrEqual(300)
      expect(words(intro)).toBeLessThanOrEqual(500)
    })

    it('carries mistake entries on its core setup decisions', () => {
      expect(positionsWithMistakes(chapterOf(colle, 'ch0'))).toBeGreaterThanOrEqual(4)
    })
  })

  describe('the repertoire chapters', () => {
    for (const id of ['ch1', 'ch2', 'ch3', 'ch4', 'ch5']) {
      it(`${id} runs its deepest line to move 10 or beyond`, () => {
        expect(deepestFullMove(chapterOf(colle, id))).toBeGreaterThanOrEqual(10)
      })

      it(`${id} carries mistake entries on at least ten positions`, () => {
        expect(positionsWithMistakes(chapterOf(colle, id))).toBeGreaterThanOrEqual(10)
      })

      it(`${id} weights every Black reply by club frequency`, () => {
        for (const node of walkNodes(chapterOf(colle, id))) {
          if (!node.isStudent) {
            expect(node.weight ?? 1, node.path.join(' ')).toBeGreaterThanOrEqual(1)
            expect(node.weight ?? 1, node.path.join(' ')).toBeLessThanOrEqual(10)
          }
        }
      })

      it(`${id} tags every White move with at least one concept`, () => {
        for (const node of walkNodes(chapterOf(colle, id))) {
          if (node.isStudent) expect(node.tags.length, node.path.join(' ')).toBeGreaterThan(0)
        }
      })
    }
  })

  describe('chapter 6, the exercises', () => {
    it('ends every exercise on a White move worth drilling', () => {
      for (const line of walkNodes(chapterOf(colle, 'ch6')).filter((node) => node.isLeaf)) {
        expect(line.isStudent, line.path.join(' ')).toBe(true)
      }
    })

    it('carries at least four exercises', () => {
      const leaves = walkNodes(chapterOf(colle, 'ch6')).filter((node) => node.isLeaf)
      expect(leaves.length).toBeGreaterThanOrEqual(4)
    })

    it('runs each exercise deep enough to be a real position', () => {
      expect(deepestFullMove(chapterOf(colle, 'ch6'))).toBeGreaterThanOrEqual(10)
    })
  })
})

describe('the Vienna Gambit course', () => {
  const vienna = courseById('vienna-gambit')

  it('is a White course of seven chapters', () => {
    expect(vienna.colour).toBe('white')
    expect(vienna.opponentColour).toBe('black')
    expect(vienna.chapters.length).toBe(7)
  })

  it('declares the tags it uses beyond the core set', () => {
    expect(vienna.tags).toContain('f-file')
    expect(vienna.tags).toContain('e5-wedge')
    expect(vienna.tags).toContain('gambit-pawn')
    expect(vienna.tags).not.toContain('vs-c5')
  })

  it('moves the f-pawn off f2 in every chapter', () => {
    // The claim that is really about this course. A Vienna where White never
    // plays f4 is one of the two QUIET Viennas, which Nick ruled out on the
    // grounds that he already owns a quiet answer to 1...e5 in the Ruy Lopez
    // Exchange. If somebody softened this course into that one, this fails.
    for (const chapter of vienna.chapters) {
      const paths = walkNodes(chapter).map((node) => node.path)
      const pushed = paths.some((path) => path.filter((_, ply) => ply % 2 === 0).includes('f4'))
      expect(pushed, `${chapter.id} never plays f4`).toBe(true)
    }
  })

  it('never plays f4 before the knight reaches c3', () => {
    // The move order is the gambit. The knight on c3 is what guards e4 once
    // the f-pawn stops doing it, so f4 first is a King's Gambit with a hole
    // in the centre, and 2.f4 d5 is the refutation.
    for (const chapter of vienna.chapters) {
      for (const node of walkNodes(chapter)) {
        if (!node.isStudent || node.san !== 'f4') continue
        const before = node.path.slice(0, -1)
        expect(before, `${chapter.id} ${node.path.join(' ')}`).toContain('Nc3')
      }
    }
  })

  describe('chapter 0, the gambit', () => {
    it('has an intro of 300 to 500 words', () => {
      const intro = chapterOf(vienna, 'ch0').intro
      expect(words(intro)).toBeGreaterThanOrEqual(300)
      expect(words(intro)).toBeLessThanOrEqual(500)
    })

    it('carries mistake entries on its core setup decisions', () => {
      expect(positionsWithMistakes(chapterOf(vienna, 'ch0'))).toBeGreaterThanOrEqual(4)
    })
  })

  describe('the repertoire chapters', () => {
    for (const id of ['ch1', 'ch2', 'ch3', 'ch4', 'ch5']) {
      it(`${id} runs its deepest line to move 10 or beyond`, () => {
        expect(deepestFullMove(chapterOf(vienna, id))).toBeGreaterThanOrEqual(10)
      })

      it(`${id} carries mistake entries on at least ten positions`, () => {
        expect(positionsWithMistakes(chapterOf(vienna, id))).toBeGreaterThanOrEqual(10)
      })

      it(`${id} weights every Black reply by club frequency`, () => {
        for (const node of walkNodes(chapterOf(vienna, id))) {
          if (!node.isStudent) {
            expect(node.weight ?? 1, node.path.join(' ')).toBeGreaterThanOrEqual(1)
            expect(node.weight ?? 1, node.path.join(' ')).toBeLessThanOrEqual(10)
          }
        }
      })

      it(`${id} tags every White move with at least one concept`, () => {
        for (const node of walkNodes(chapterOf(vienna, id))) {
          if (node.isStudent) expect(node.tags.length, node.path.join(' ')).toBeGreaterThan(0)
        }
      })
    }
  })

  describe('chapter 6, the exercises', () => {
    it('ends every exercise on a White move worth drilling', () => {
      for (const line of walkNodes(chapterOf(vienna, 'ch6')).filter((node) => node.isLeaf)) {
        expect(line.isStudent, line.path.join(' ')).toBe(true)
      }
    })

    it('carries at least four exercises', () => {
      const leaves = walkNodes(chapterOf(vienna, 'ch6')).filter((node) => node.isLeaf)
      expect(leaves.length).toBeGreaterThanOrEqual(4)
    })

    it('runs each exercise deep enough to be a real position', () => {
      expect(deepestFullMove(chapterOf(vienna, 'ch6'))).toBeGreaterThanOrEqual(10)
    })
  })
})

describe('the Najdorf course', () => {
  const najdorf = courseById('najdorf-black')

  it('is a Black course of seven chapters', () => {
    expect(najdorf.colour).toBe('black')
    expect(najdorf.opponentColour).toBe('white')
    expect(najdorf.chapters.length).toBe(7)
  })

  it('declares the tags it uses beyond the core set', () => {
    // light-squares is shared with the Caro-Kann and the Slav on purpose: it
    // means the same thing in all three and Progress compares by the string.
    expect(najdorf.tags).toContain('vs-bg5')
    expect(najdorf.tags).toContain('light-squares')
    expect(najdorf.tags).not.toContain('vs-advance')
  })

  it('plays the pawn to a6 by move five in every repertoire chapter', () => {
    // The claim that makes this course the Najdorf rather than some other
    // Sicilian. Chapters 1 to 4 all hang off the same six-move stem and differ
    // at White's sixth, so if that stem ever stopped containing the move the
    // opening is named after, four chapters would quietly be teaching
    // something else.
    for (const id of ['ch1', 'ch2', 'ch3', 'ch4']) {
      const stem = chapterOf(najdorf, id).stem
      expect(stem.indexOf('a6'), `${id} stem`).toBe(9)
      expect(stem.length, `${id} stem`).toBe(10)
    }
  })

  it('leaves the Poisoned Pawn out of the repertoire', () => {
    // Ruled at phase 31 under the theory fork rule: 7...Qb6 is sound and it is
    // a forcing line twenty moves deep where one wrong move loses. The
    // classical setup reaches a game with a plan instead.
    //
    // Two halves, and the second is the one that matters. Black never plays the
    // queen to b6 anywhere in this course, which is what leaving the line out
    // means in practice. And the move IS named where a trainee would reach for
    // it, as a graded alternative with the reason beside it, because a
    // repertoire that silently omits a famous line teaches nothing about why.
    for (const chapter of najdorf.chapters) {
      for (const node of walkNodes(chapter)) {
        if (node.isStudent) expect(node.san, `${chapter.id} ${node.path.join(' ')}`).not.toBe('Qb6')
      }
    }

    const refusals = najdorf.chapters
      .flatMap((chapter) => walkNodes(chapter))
      .flatMap((node) => node.mistakes ?? [])
      .filter((entry) => entry.san === 'Qb6')
    expect(refusals.length, 'the line is refused where it arises').toBeGreaterThan(0)
    for (const entry of refusals) {
      // Sound, so it cannot be graded as an error; and the note has to give
      // the reason rather than just declining it.
      expect(entry.grade).toBe('playable')
      expect(entry.note).toMatch(/fork rule/)
    }
  })

  describe('chapter 0, the defence', () => {
    it('has an intro of 300 to 500 words', () => {
      const intro = chapterOf(najdorf, 'ch0').intro
      expect(words(intro)).toBeGreaterThanOrEqual(300)
      expect(words(intro)).toBeLessThanOrEqual(500)
    })

    it('carries mistake entries on its core setup decisions', () => {
      expect(positionsWithMistakes(chapterOf(najdorf, 'ch0'))).toBeGreaterThanOrEqual(4)
    })
  })

  describe('the repertoire chapters', () => {
    for (const id of ['ch1', 'ch2', 'ch3', 'ch4', 'ch5']) {
      it(`${id} runs its deepest line to move 10 or beyond`, () => {
        expect(deepestFullMove(chapterOf(najdorf, id))).toBeGreaterThanOrEqual(10)
      })

      it(`${id} carries mistake entries on at least ten positions`, () => {
        expect(positionsWithMistakes(chapterOf(najdorf, id))).toBeGreaterThanOrEqual(10)
      })

      it(`${id} weights every White reply by club frequency`, () => {
        for (const node of walkNodes(chapterOf(najdorf, id))) {
          if (!node.isStudent) {
            expect(node.weight ?? 1, node.path.join(' ')).toBeGreaterThanOrEqual(1)
            expect(node.weight ?? 1, node.path.join(' ')).toBeLessThanOrEqual(10)
          }
        }
      })

      it(`${id} tags every Black move with at least one concept`, () => {
        for (const node of walkNodes(chapterOf(najdorf, id))) {
          if (node.isStudent) expect(node.tags.length, node.path.join(' ')).toBeGreaterThan(0)
        }
      })
    }
  })

  describe('chapter 6, the exercises', () => {
    it('ends every exercise on a Black move worth drilling', () => {
      const chapter = chapterOf(najdorf, 'ch6')
      for (const line of walkNodes(chapter).filter((node) => node.isLeaf)) {
        expect(line.isStudent, line.path.join(' ')).toBe(true)
      }
    })

    it('carries at least four exercises', () => {
      const leaves = walkNodes(chapterOf(najdorf, 'ch6')).filter((node) => node.isLeaf)
      expect(leaves.length).toBeGreaterThanOrEqual(4)
    })

    it('runs each exercise deep enough to be a real position', () => {
      expect(deepestFullMove(chapterOf(najdorf, 'ch6'))).toBeGreaterThanOrEqual(10)
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
    // proof that course scoping is load bearing. Across COLOURS it is not. A
    // card records whose turn it is, and every card in a course is the
    // student's turn, so a White course and a Black course cannot share one
    // whatever they teach. The Slav is the sharpest case there is: its
    // chapter 5 is the London seen from the other side, and the two courses
    // walk through a dozen of the same positions.
    for (const course of courses) {
      const turn = course.colour === 'white' ? 'w' : 'b'
      for (const card of allCards(course).cards) {
        expect(card.position.split(' ')[1], `${course.id} ${card.position}`).toBe(turn)
      }
    }
  })

  it('has two White courses that answer the same position differently', () => {
    // Scoping became load bearing IN PRACTICE at phase 14. The Ruy Lopez was
    // the second White course and it opens 1.e4, so it never met the London.
    // The Colle-Zukertort is the third and it opens 1.d4, so it does: both
    // meet an early ...c5 with 2.e3 and both reach the same positions after
    // it, and there the London plays Bf4 while the Zukertort plays Nf3.
    // Without the course id in the key, one course would answer for the
    // other's schedule and Nick would be marked as knowing a move he has
    // never been asked for.
    const answers = (id: string) =>
      new Map(allCards(courseById(id)).cards.map((card) => [card.position, card.san]))
    const london = answers('london-white')
    const colle = answers('colle-zukertort')

    const shared = [...colle.keys()].filter((position) => london.has(position))
    const disagree = shared.filter((position) => london.get(position) !== colle.get(position))
    expect(shared.length).toBeGreaterThan(0)
    expect(disagree.length).toBeGreaterThan(0)
  })

  it('has the Ruy and the Vienna agreeing on 1.e4 and parting after 1...e5', () => {
    // The cleaner instance of the same point, added at phase 18. Both courses
    // start their concept chapter from the initial position, so they share the
    // very first card and answer it the same way, and then hand the same
    // position after 1...e5 two different moves: 2.Nf3 for the Ruy, 2.Nc3 for
    // the Vienna. One repertoire's schedule must not answer for the other's.
    const answers = (id: string) =>
      new Map(allCards(courseById(id)).cards.map((card) => [card.position, card.san]))
    const ruy = answers('ruy-lopez-exchange')
    const vienna = answers('vienna-gambit')

    const shared = [...vienna.keys()].filter((position) => ruy.has(position))
    const agree = shared.filter((position) => ruy.get(position) === vienna.get(position))
    const disagree = shared.filter((position) => ruy.get(position) !== vienna.get(position))
    expect(shared.length).toBeGreaterThan(0)
    expect(agree.length, 'both courses open 1.e4').toBeGreaterThan(0)
    expect(disagree.length).toBeGreaterThan(0)

    const afterE5 = shared.find(
      (position) => ruy.get(position) === 'Nf3' && vienna.get(position) === 'Nc3',
    )
    expect(afterE5, 'the two courses answer 1...e5 differently').toBeTruthy()
  })

  it('has the Caro-Kann and the Najdorf disagreeing about 1.e4', () => {
    // The Black-side instance of the same point, added at phase 31. Both are
    // Black courses whose concept chapter starts from the initial position, so
    // both hold a card for the position after 1.e4, and there the Caro-Kann
    // plays the pawn to c6 and the Najdorf plays it to c5.
    //
    // This is the case the two tests above cannot make between them. Those are
    // White courses, and the colour test says a White card and a Black card can
    // never collide whatever they teach. Two Black courses can, and these two
    // do, on the very first card each of them owns.
    //
    // Written the way it is because the obvious extra assertion is false. The
    // Ruy and the Vienna share a position they ANSWER ALIKE, because both open
    // 1.e4 and that card is White's. Two Black courses have no such card: every
    // card they hold is a Black move, and a shared Black-to-move position is by
    // definition one where the two repertoires have already diverged or have
    // met by transposition. Here every shared position disagrees.
    const answers = (id: string) =>
      new Map(allCards(courseById(id)).cards.map((card) => [card.position, card.san]))
    const caro = answers('caro-kann-black')
    const najdorf = answers('najdorf-black')

    const shared = [...najdorf.keys()].filter((position) => caro.has(position))
    const disagree = shared.filter((position) => caro.get(position) !== najdorf.get(position))
    expect(shared.length, 'the two courses reach positions in common').toBeGreaterThan(0)
    expect(disagree.length, 'and answer them differently').toBeGreaterThan(0)

    const afterE4 = shared.find(
      (position) => caro.get(position) === 'c6' && najdorf.get(position) === 'c5',
    )
    expect(afterE4, 'the two courses answer 1.e4 differently').toBeTruthy()
  })
})
