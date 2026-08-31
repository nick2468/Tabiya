import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HiddenCourses, TileActions } from './Catalog'
import { CatalogProvider } from './catalog-context'
import { ProgressProvider } from './progress-context'
import { loadedCourses, splitByHidden } from '../model/course'
import { buildCardsAcross } from '../model/cards'
import { allLines } from '../model/lines'
import { dueQueue } from '../model/queue'
import { emptyProgress, type LoadedProgress, type ProgressState } from '../storage/progress'
import { bundledCourses, bundledEntries } from '../content'
import type { CourseEntry } from '../model/types'

/**
 * Hiding a course.
 *
 * The promise hiding makes is that it takes nothing, so the tests are about
 * what a hidden course stops doing - leaving the catalog, the switcher and the
 * drill queue - and about everything the trainee did still being there when it
 * comes back. That last part is the whole difference between hiding and
 * deleting, and it is why hiding works on a course that ships with the app,
 * which cannot be deleted at all.
 *
 * `splitByHidden` is the one place the filtering happens and the catalog reads
 * its `courses` out of the visible half, so testing it here is testing what the
 * switcher, Drill and Progress all see.
 */
const london = bundledCourses.find((entry) => entry.id === 'london-white')
const colle = bundledCourses.find((entry) => entry.id === 'colle-zukertort')
if (!london || !colle) throw new Error('the bundled set is not what these tests expect')

/** Two learnt lines in the London and one in the Colle. */
const learntLines = [
  ...allLines(london.chapters).slice(0, 2),
  ...allLines(colle.chapters).slice(0, 1),
].map((line) => line.id)

const state: ProgressState = { ...emptyProgress(), learntLines }

/** What the app sees with these course ids hidden, the way every screen sees it. */
function seen(hiddenIds: string[]) {
  const split = splitByHidden(bundledEntries, hiddenIds)
  const courses = loadedCourses(split.visible)
  const cards = buildCardsAcross(courses, state.learntLines).cards
  return {
    visible: courses.map((course) => course.id),
    hidden: split.hidden.map((entry) => entry.course?.id),
    everyCourse: split.visible.length + split.hidden.length,
    cards: cards.length,
    due: dueQueue(cards, state).length,
  }
}

describe('what the app sees once a course is hidden', () => {
  it('shows every course when nothing is hidden', () => {
    const now = seen([])

    expect(now.visible).toContain('london-white')
    expect(now.visible).toContain('colle-zukertort')
    expect(now.hidden).toEqual([])
  })

  it('takes it out of the visible list, which is the switcher and Progress too', () => {
    const now = seen(['colle-zukertort'])

    expect(now.visible).not.toContain('colle-zukertort')
    expect(now.visible).toContain('london-white')
    expect(now.hidden).toEqual(['colle-zukertort'])
  })

  it('still knows about it, so an import cannot shadow a hidden bundled id', () => {
    expect(seen(['colle-zukertort']).everyCourse).toBe(seen([]).everyCourse)
  })

  it('drops its cards from the drill queue, and unhiding brings them back', () => {
    const all = seen([])
    const without = seen(['colle-zukertort'])

    expect(without.cards).toBeLessThan(all.cards)
    expect(without.due).toBeLessThan(all.due)
    // Unhiding is the same list without the id, which is what the button does.
    expect(seen([]).cards).toBe(all.cards)
    expect(seen([]).due).toBe(all.due)
  })

  it('leaves the learnt lines exactly where they were', () => {
    // Nothing prunes them: the hidden course's line id is still in the file,
    // which is what makes unhiding give back a drill schedule rather than a
    // fresh one.
    expect(state.learntLines.filter((id) => id.startsWith('colle-zukertort/'))).toHaveLength(1)
    expect(seen(['colle-zukertort']).cards).toBeGreaterThan(0)
  })

  it('hides every course without breaking, leaving an empty catalog', () => {
    const now = seen(bundledCourses.map((course) => course.id))

    expect(now.visible).toEqual([])
    expect(now.cards).toBe(0)
    expect(now.due).toBe(0)
  })

  it('cannot hide a folder that would not load, which has no id to hide', () => {
    const broken: CourseEntry = {
      source: 'a-broken-folder',
      origin: 'external',
      course: null,
      errors: [{ course: 'a-broken-folder', chapter: 'course.json', path: '', message: 'no' }],
    }

    const split = splitByHidden([...bundledEntries, broken], ['a-broken-folder'])

    expect(split.hidden).toEqual([])
    expect(split.visible).toContain(broken)
  })
})

/* --------------------------------------------------------------- on screen */

/** A store that hands back a fixed state, so nothing touches a real file. */
function store(saved: ProgressState) {
  return {
    load: async (): Promise<LoadedProgress> => ({ state: saved }),
    save: async () => {},
    exportJson: async () => JSON.stringify(saved),
    importJson: async () => saved,
  }
}

/** Renders `children` under both providers. */
function under(children: ReactNode) {
  // The props are cast because `children` is passed the ordinary way, as the
  // third argument, which the provider types do not describe.
  return renderToStaticMarkup(
    createElement(
      ProgressProvider,
      { store: store(state) } as never,
      createElement(CatalogProvider, {} as never, children),
    ),
  )
}

describe('the Hide action on a tile', () => {
  function tile(origin: CourseEntry['origin']) {
    const entry: CourseEntry = { source: london!.id, origin, course: london!, errors: [] }
    return under(createElement(TileActions, { entry, course: london! }))
  }

  it('is offered on a course that ships with the app, which cannot be deleted', () => {
    const html = tile('bundled')

    expect(html).toContain('tile-hide')
    expect(html).toContain('>Hide</button>')
    expect(html).not.toContain('tile-delete')
  })

  it('is offered on a course the trainee added, beside the delete', () => {
    const html = tile('external')

    expect(html).toContain('tile-hide')
    expect(html).toContain('tile-delete')
  })

  it('asks nothing first, because hiding takes nothing', () => {
    expect(tile('bundled')).not.toContain('tile-confirm')
  })
})

describe('the way back from hiding', () => {
  const entry: CourseEntry = {
    source: 'colle-zukertort',
    origin: 'bundled',
    course: colle,
    errors: [],
  }

  function reveal(hidden: CourseEntry[]) {
    return under(createElement(HiddenCourses, { hidden }))
  }

  it('says nothing at all when nothing is hidden', () => {
    expect(reveal([])).toBe('')
  })

  it('counts what is hidden', () => {
    expect(reveal([entry])).toContain('1 hidden')
  })

  it('keeps the list out of the way until it is asked for', () => {
    const html = reveal([entry])

    expect(html).not.toContain('Unhide')
    expect(html).toContain('aria-expanded="false"')
  })
})
