import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { Shell } from './App'
import { Drill } from './Drill'
import { CatalogContext, type Catalog } from './catalog-context'
import { PlayProvider } from './play-context'
import { ProgressContext, type Progress as ProgressValue } from './progress-context'
import { resolveCourse, useDrillScope, type DrillScope } from './prefs'
import { bundledCourses } from '../content'
import { buildCardsAcross } from '../model/cards'
import { courseLineIds } from '../model/lines'
import { emptyProgress, type ProgressState } from '../storage/progress'
import type { CourseEntry, LoadedCourse } from '../model/types'

/**
 * A course is always selected, and Drill says what it is drilling.
 *
 * Both are phase 22 and both are about the first click. Nick launched 1.6.3,
 * clicked Progress and was told to open a course; clicked Drill and got a
 * London card with nothing saying where it came from. The fixes are a
 * remembered selection that falls back rather than failing, and a Drill
 * preference that is on the screen instead of implied.
 *
 * The falling back is the part worth testing hardest. A remembered id can be
 * stale four ways and all four have to land in the same place.
 */

const london = bundledCourses.find((entry) => entry.id === 'london-white')
const caro = bundledCourses.find((entry) => entry.id === 'caro-kann-black')
if (!london || !caro) throw new Error('the bundled set is missing a course this test needs')

/** A `localStorage` the test can set, because node has none. */
const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  },
})

beforeEach(() => store.clear())

function progressValue(state: ProgressState): ProgressValue {
  return {
    state,
    loaded: true,
    failure: null,
    note: null,
    restore: null,
    putBack: () => {},
    learnt: (lineId: string) => state.learntLines.includes(lineId),
    toggle: () => {},
    hidden: () => false,
    toggleHidden: () => {},
    answer: () => {},
    recordPlay: () => {},
    exportJson: async () => JSON.stringify(state),
    importJson: async () => {},
  }
}

const bundled = (loaded: LoadedCourse): CourseEntry => ({
  source: loaded.id,
  origin: 'bundled',
  course: loaded,
  errors: [],
})

/** A catalog holding whichever courses the case is about. */
function catalogOf(courses: LoadedCourse[]): Catalog {
  const entries = courses.map(bundled)
  return {
    entries,
    visible: entries,
    hidden: [],
    courses,
    chapters: courses.flatMap((course) => course.chapters),
    scanned: true,
    folder: null,
    find: (id: string) => courses.find((course) => course.id === id),
    rescan: async () => {},
  }
}

/**
 * The provider that holds a running game.
 *
 * Real rather than faked: it loads nothing and reads nothing, so it renders
 * to a string exactly as it does in the app, with no game and nothing in
 * progress. That is the state every screen below is being looked at in.
 */
function render(state: ProgressState, catalog: Catalog, view: ReactNode): string {
  return renderToStaticMarkup(
    createElement(
      ProgressContext,
      { value: progressValue(state) } as never,
      createElement(
        CatalogContext,
        { value: catalog } as never,
        createElement(PlayProvider, null, view),
      ),
    ),
  )
}

/** The option the Course dropdown is showing, from the rendered markup. */
function selectedOption(html: string): string | null {
  const found = html.match(/<option [^>]*selected[^>]*value="([^"]*)"/) ??
    html.match(/<option value="([^"]*)"[^>]*selected/)
  return found ? found[1] : null
}

describe('resolving which course is open', () => {
  it('takes the remembered one when it is there', () => {
    expect(resolveCourse(caro.id, [london, caro])?.id).toBe(caro.id)
  })

  it('falls back to the first when the remembered course has been hidden', () => {
    // Hiding takes a course out of the visible list, which is the list this
    // is given. There is nothing else to distinguish hidden from deleted.
    expect(resolveCourse(caro.id, [london])?.id).toBe(london.id)
  })

  it('falls back to the first when the remembered course is gone', () => {
    expect(resolveCourse('a-course-that-was-deleted', [london, caro])?.id).toBe(london.id)
  })

  it('falls back to the first on a fresh install, with nothing remembered', () => {
    expect(resolveCourse(null, [london, caro])?.id).toBe(london.id)
  })

  it('has nothing to give when no course loaded, and says so rather than throwing', () => {
    expect(resolveCourse(london.id, [])).toBeUndefined()
  })
})

describe('the shell on first click', () => {
  const catalog = catalogOf([london, caro])

  it('opens on the remembered course', () => {
    store.set('london-trainer.course', caro.id)
    expect(selectedOption(render(emptyProgress(), catalog, createElement(Shell)))).toBe(caro.id)
  })

  it('opens on the first course when nothing is remembered', () => {
    expect(selectedOption(render(emptyProgress(), catalog, createElement(Shell)))).toBe(
      london.id,
    )
  })

  it('opens on the first course when the remembered one is not there any more', () => {
    store.set('london-trainer.course', 'a-course-that-was-deleted')
    expect(selectedOption(render(emptyProgress(), catalog, createElement(Shell)))).toBe(
      london.id,
    )
  })

  it('disables no mode, so every one works from the first click', () => {
    const html = render(emptyProgress(), catalog, createElement(Shell))
    const modes = [...html.matchAll(/<button[^>]*class="nav-link[^"]*"[^>]*>/g)].map(
      (match) => match[0],
    )
    expect(modes.length).toBeGreaterThan(4)
    expect(modes.filter((button) => button.includes('disabled'))).toEqual([])
    expect(html).not.toContain('Open a course first')
  })

  it('shows the Course switcher with more than one course', () => {
    expect(render(emptyProgress(), catalog, createElement(Shell))).toContain(
      'id="course-switch"',
    )
  })
})

/** A probe, because a hook cannot be rendered on its own. */
function Scope() {
  const { scope } = useDrillScope()
  return createElement('i', null, scope)
}

describe('what Drill draws on', () => {
  const catalog = catalogOf([london, caro])

  const learntBoth: ProgressState = {
    ...emptyProgress(),
    learntLines: [[...courseLineIds(london)][0], [...courseLineIds(caro)][0]],
  }

  const across = buildCardsAcross([london, caro], learntBoth.learntLines).cards.length
  const onlyLondon = buildCardsAcross([london], learntBoth.learntLines).cards.length

  const drill = (scope: DrillScope) =>
    render(
      learntBoth,
      catalog,
      createElement(Drill, { courseId: london.id, scope, onScope: () => {} }),
    )

  it('starts mixed, which is the ruling', () => {
    expect(renderToStaticMarkup(createElement(Scope))).toBe('<i>mixed</i>')
  })

  it('stays mixed when what is stored means nothing', () => {
    store.set('london-trainer.drill', 'whatever')
    expect(renderToStaticMarkup(createElement(Scope))).toBe('<i>mixed</i>')
  })

  it('remembers being told to drill the selected course', () => {
    store.set('london-trainer.drill', 'selected')
    expect(renderToStaticMarkup(createElement(Scope))).toBe('<i>selected</i>')
  })

  it('counts every course when mixed', () => {
    // The two courses have to differ, or narrowing would prove nothing.
    expect(across).toBeGreaterThan(onlyLondon)
    expect(drill('mixed')).toContain(`${across} in your learnt lines`)
  })

  it('narrows to the course the header names when selected', () => {
    expect(drill('selected')).toContain(`${onlyLondon} in your learnt lines`)
  })
})
