import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DeleteConfirm, TileActions } from './Catalog'
import { CatalogProvider } from './catalog-context'
import { ProgressProvider } from './progress-context'
import { emptyProgress, type LoadedProgress, type ProgressState } from '../storage/progress'
import { bundledCourses } from '../content'
import type { CourseEntry, LoadedCourse } from '../model/types'

/**
 * The row under a course tile, rendered to a string.
 *
 * One thing here is a rule rather than a detail: a course that ships with the
 * app cannot be deleted. It is compiled into the binary and would be back at
 * the next start, so a delete button on it would be a lie. The count in the
 * confirm is the other: it says what actually survives, which is everything.
 */
const course = bundledCourses.find((entry) => entry.id === 'london-white')
if (!course) throw new Error('the London is not in the bundled set')

const learntTwo: ProgressState = {
  ...emptyProgress(),
  learntLines: [
    'london-white/ch1-classical:d4 d5 Bf4',
    'london-white/ch3-kings-indian:d4 Nf6 Bf4',
    'colle-zukertort/ch1-classical:d4 d5 Nf3',
  ],
}

/** A store that hands back a fixed state, so nothing touches a real file. */
function store(state: ProgressState) {
  return {
    load: async (): Promise<LoadedProgress> => ({ state }),
    save: async () => {},
    exportJson: async () => JSON.stringify(state),
    importJson: async () => state,
  }
}

function render(origin: CourseEntry['origin'], loaded: LoadedCourse = course!) {
  const entry: CourseEntry = { source: loaded.id, origin, course: loaded, errors: [] }
  // The props are cast because `children` is passed the ordinary way, as the
  // third argument, which the provider types do not describe.
  return renderToStaticMarkup(
    createElement(
      ProgressProvider,
      { store: store(learntTwo) } as never,
      createElement(
        CatalogProvider,
        {} as never,
        createElement(TileActions, { entry, course: loaded }),
      ),
    ),
  )
}

function confirm(learnt: number) {
  return renderToStaticMarkup(
    createElement(DeleteConfirm, {
      course: course!,
      learnt,
      busy: false,
      onExport: () => {},
      onDelete: () => {},
      onCancel: () => {},
    }),
  )
}

describe('the actions under a course tile', () => {
  it('offers no delete on a course that ships with the app', () => {
    const html = render('bundled')

    expect(html).toContain('Export as a file')
    expect(html).not.toContain('tile-delete')
  })

  it('offers delete on a course the trainee added', () => {
    const html = render('external')

    expect(html).toContain('tile-delete')
    expect(html).toContain('Delete The London System')
  })
})

describe('the confirm before a course is deleted', () => {
  it('says the files go and the progress stays, and counts it', () => {
    const html = confirm(6)

    expect(html).toContain('Delete The London System?')
    expect(html).toContain('The course files are removed.')
    expect(html).toContain('<strong>6</strong> learnt lines')
    expect(html).toContain('come back if you import it again')
  })

  it('does not count what is not there', () => {
    const html = confirm(0)

    expect(html).toContain('not marked any lines of it learnt')
    expect(html).not.toContain('come back if you import it again')
  })

  it('offers the export as a button rather than as a ticked box', () => {
    const html = confirm(1)

    expect(html).toContain('Export it first')
    expect(html).toContain('learnt line and their')
    expect(html).not.toContain('checkbox')
  })
})
