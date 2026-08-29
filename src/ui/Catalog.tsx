import { useMemo, useState } from 'react'
import { useCatalog } from './catalog-context'
import { useProgress } from './progress-context'
import { ImportCourse } from './ImportCourse'
import { saveBundle } from './bundles'
import { courseToPgn } from '../model/bundle'
import { buildCardsAcross } from '../model/cards'
import { courseTotals } from '../model/stats'
import { dueCount } from '../model/queue'
import { colourName, type CourseEntry, type LoadedCourse } from '../model/types'
import './catalog.css'

/**
 * The front door: one tile per course.
 *
 * Study and Play happen inside a course, so this is where a course gets
 * chosen. Drill and Progress do not appear here because they span courses -
 * the drill queue is one queue over everything learnt, which is the ruling.
 *
 * A course that would not load gets a tile too, saying what is wrong with it.
 * A folder someone dropped in should never simply fail to appear.
 */
export function Catalog({ onOpen }: { onOpen: (courseId: string) => void }) {
  const { entries, courses, scanned, folder } = useCatalog()
  const { state } = useProgress()

  const cards = useMemo(
    () => buildCardsAcross(courses, state.learntLines).cards,
    [courses, state.learntLines],
  )
  const totals = useMemo(
    () =>
      courses.map((course) => ({ course, totals: courseTotals(course, cards, state) })),
    [cards, courses, state],
  )
  const overall = useMemo(
    () => ({
      learnt: totals.reduce((sum, row) => sum + row.totals.learntLines, 0),
      lines: totals.reduce((sum, row) => sum + row.totals.totalLines, 0),
      due: dueCount(cards, state),
      cards: cards.length,
    }),
    [cards, state, totals],
  )

  return (
    <div className="catalog">
      <header className="catalog-head">
        <h2>Your courses</h2>
        <p className="catalog-totals">
          <strong>{overall.learnt}</strong> of {overall.lines} lines learnt across{' '}
          {courses.length} {courses.length === 1 ? 'course' : 'courses'}.{' '}
          <strong>{overall.due}</strong> of {overall.cards}{' '}
          {overall.cards === 1 ? 'card' : 'cards'} due now.
        </p>
      </header>

      <ul className="course-tiles">
        {entries.map((entry) =>
          entry.course ? (
            <CourseTile
              key={entry.course.id}
              entry={entry}
              course={entry.course}
              learnt={totals.find((row) => row.course.id === entry.course?.id)?.totals}
              onOpen={onOpen}
            />
          ) : (
            <BrokenTile key={entry.source} entry={entry} />
          ),
        )}
      </ul>

      <DropInNote folder={folder} scanned={scanned} />
      <ImportCourse />
    </div>
  )
}

function CourseTile({
  entry,
  course,
  learnt,
  onOpen,
}: {
  entry: CourseEntry
  course: LoadedCourse
  learnt?: { learntLines: number; totalLines: number; due: number; cards: number }
  onOpen: (courseId: string) => void
}) {
  return (
    <li className="course-tile">
      <button type="button" className="tile-open" onClick={() => onOpen(course.id)}>
        <span className={`tile-colour ${course.colour}`}>
          {colourName(course.colour)}
        </span>
        <span className="tile-title">{course.title}</span>
        <span className="tile-tagline">{course.tagline}</span>
        <span className="tile-numbers">
          <span>
            <strong>{learnt?.learntLines ?? 0}</strong> of {learnt?.totalLines ?? 0} lines
            learnt
          </span>
          <span>
            <strong>{learnt?.due ?? 0}</strong> due now
          </span>
        </span>
        {entry.origin === 'external' ? (
          <span className="tile-origin" title="Dropped into your courses folder">
            Added by you
          </span>
        ) : null}
      </button>
      <ExportCourse course={course} />
    </li>
  )
}

/**
 * Writing a course out as a bundle.
 *
 * Any course, including the ones that ship with the app: exporting the London
 * and opening it in a chess GUI is a fair thing for a trainee to want, and it
 * is also how somebody starts a course of their own without facing an empty
 * file.
 */
function ExportCourse({ course }: { course: LoadedCourse }) {
  const [said, setSaid] = useState<string | null>(null)

  const run = async () => {
    setSaid(null)
    const written = courseToPgn(course)
    if (!written.ok) {
      setSaid(`This course cannot be written out: ${written.errors[0].message}`)
      return
    }
    try {
      const where = await saveBundle(course.id, written.text)
      if (where) setSaid(`Written to ${where}.`)
    } catch (error) {
      setSaid(`Nothing was written: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="tile-actions">
      <button type="button" className="tile-export" onClick={() => void run()}>
        Export as a file
      </button>
      {said ? <p className="tile-said">{said}</p> : null}
    </div>
  )
}

/** A course folder that would not load, with everything wrong with it. */
function BrokenTile({ entry }: { entry: CourseEntry }) {
  return (
    <li className="course-tile broken">
      <h3>{entry.source}</h3>
      <p className="tile-tagline">
        This course did not load, so none of it is available. Nothing else was affected.
      </p>
      <ul className="tile-errors">
        {entry.errors.slice(0, 8).map((error, index) => (
          <li key={index}>
            <span className="quiet">{error.chapter}</span> {error.message}
            {error.path ? <span className="quiet"> at {error.path}</span> : null}
          </li>
        ))}
      </ul>
      {entry.errors.length > 8 ? (
        <p className="hint">{entry.errors.length - 8} more problems not listed.</p>
      ) : null}
    </li>
  )
}

/** Where to put a course folder, on the desktop where there is one. */
function DropInNote({ folder, scanned }: { folder: string | null; scanned: boolean }) {
  if (!scanned) return <p className="hint">Looking for courses you have added...</p>
  if (!folder) {
    return (
      <p className="hint">
        This is the browser build, which shows the courses that ship with the app. The
        installed app also reads courses you drop into a folder of your own.
      </p>
    )
  }
  return (
    <p className="hint">
      To add a course, put its folder in <code>{folder}</code> and restart the app. It
      needs a <code>course.json</code> and its chapter files. A course you add cannot
      replace one that ships with the app.
    </p>
  )
}
