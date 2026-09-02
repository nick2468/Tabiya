import { useMemo, useState } from 'react'
import { useCatalog } from './catalog-context'
import { useProgress } from './progress-context'
import { ImportCourse } from './ImportCourse'
import { removeCourse, saveBundle } from './bundles'
import { courseToPgn } from '../model/bundle'
import { buildCardsAcross } from '../model/cards'
import { courseTotals } from '../model/stats'
import { survivingLines } from '../model/lines'
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
 *
 * A course the trainee has HIDDEN is the one exception, and it is their own
 * choice rather than a failure. The hidden ones sit behind a quiet control at
 * the bottom, so the catalog can be got down to the repertoire being worked on
 * without anything being lost. A hidden course is left out of every count in
 * the app, here and on Progress alike.
 *
 * There are no rollup numbers on this screen. Phase 21 took them off: they are
 * the first thing somebody opening the app for the first time reads, and they
 * are written in vocabulary the app has not taught yet. Progress carries the
 * same rollup.
 */
export function Catalog({ onOpen }: { onOpen: (courseId: string) => void }) {
  const { visible, hidden, courses, scanned, folder } = useCatalog()
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

  return (
    <div className="catalog">
      <header className="catalog-head">
        <h2>Your courses</h2>
        {/* This said "1 of 308 lines learnt across 6 courses. 9 of 10 cards due
            now", which is a sentence for somebody who already knows what a line
            and a card are. The first screen of the app is not where that
            reader is. The same rollup is on Progress, which is where it
            belongs, so nothing is lost by saying what to do here instead. */}
        <p className="catalog-lead">Select a course to study</p>
      </header>

      <ul className="course-tiles">
        {visible.map((entry) =>
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

      <HiddenCourses hidden={hidden} />
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
      <TileActions entry={entry} course={course} />
    </li>
  )
}

/**
 * The row under a tile: write the course out, and remove one the trainee added.
 *
 * Both live in the actions row rather than in the tile corner, because the tile
 * itself is a button and a button cannot contain another one.
 *
 * Exporting works for any course, including the ones that ship with the app:
 * exporting the London and opening it in a chess GUI is a fair thing for a
 * trainee to want, and it is also how somebody starts a course of their own
 * without facing an empty file.
 *
 * Deleting appears only on a course the trainee added. A bundled course is
 * compiled into the app and would be back at the next start, so offering to
 * delete one would be a lie. And deleting takes the files and nothing else:
 * learnt lines and drill schedules are keyed by course id and nothing prunes
 * them, so importing the course again brings all of it back. The confirm says
 * so, because it is the difference between a small decision and a frightening
 * one.
 *
 * Hiding is on every course, bundled or added, because it is the answer for
 * the one that cannot be deleted. It needs no confirm: it takes nothing, it
 * says what it does on the button, and the way back is a control at the bottom
 * of the same screen.
 *
 * Exported for its test.
 */
export function TileActions({
  entry,
  course,
}: {
  entry: CourseEntry
  course: LoadedCourse
}) {
  const { rescan } = useCatalog()
  const { state, toggleHidden } = useProgress()
  const [said, setSaid] = useState<string | null>(null)
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)

  const learnt = survivingLines(course, state.learntLines).total

  const write = async () => {
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
      setSaid(`Nothing was written: ${asText(error)}`)
    }
  }

  const remove = async () => {
    setBusy(true)
    setSaid(null)
    try {
      await removeCourse(course.id)
      // Read the folder again rather than asking for a restart. The tile goes
      // with the folder, which is the whole of what the trainee expects.
      await rescan()
    } catch (error) {
      setSaid(`${course.title} was not removed: ${asText(error)}`)
      setAsking(false)
      setBusy(false)
    }
  }

  return (
    <div className="tile-actions">
      <div className="tile-buttons">
        <button type="button" className="tile-export" onClick={() => void write()}>
          Export as a file
        </button>
        <button
          type="button"
          className="tile-hide"
          title="Take it off this screen. Nothing is lost."
          onClick={() => toggleHidden(course.id)}
        >
          Hide
        </button>
        {entry.origin === 'external' ? (
          <button
            type="button"
            className="tile-delete"
            title="Delete"
            aria-label={`Delete ${course.title}`}
            onClick={() => setAsking(true)}
          >
            &#10005;
          </button>
        ) : null}
      </div>

      {asking ? (
        <DeleteConfirm
          course={course}
          learnt={learnt}
          busy={busy}
          onExport={() => void write()}
          onDelete={() => void remove()}
          onCancel={() => setAsking(false)}
        />
      ) : null}

      {said ? <p className="tile-said">{said}</p> : null}
    </div>
  )
}

/**
 * The confirm before a course is removed.
 *
 * It says what is actually lost, which is nothing much. Learnt lines, card
 * schedules and concept history are keyed by course id and nothing prunes
 * them, so the count here is a count of what STAYS. Exporting first is a
 * button rather than a ticked box: it is a convenience, and defaulting it to
 * yes would put a file dialog in front of the common case.
 *
 * Exported for its test: this wording is a promise the app has to keep.
 */
export function DeleteConfirm({
  course,
  learnt,
  busy,
  onExport,
  onDelete,
  onCancel,
}: {
  course: LoadedCourse
  learnt: number
  busy: boolean
  onExport: () => void
  onDelete: () => void
  onCancel: () => void
}) {
  return (
    <div className="tile-confirm">
      <h4>Delete {course.title}?</h4>
      <p>
        The course files are removed.{' '}
        {learnt === 0 ? (
          <>You have not marked any lines of it learnt, so there is nothing else to lose.</>
        ) : (
          <>
            Your <strong>{learnt}</strong> learnt {learnt === 1 ? 'line' : 'lines'} and their
            drill schedule stay saved, and come back if you import it again.
          </>
        )}
      </p>
      <div className="tile-buttons">
        <button type="button" onClick={onExport} disabled={busy}>
          Export it first
        </button>
        <button type="button" onClick={onDelete} disabled={busy}>
          Delete
        </button>
        <button type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/**
 * The courses put out of the way, behind one quiet line.
 *
 * It says nothing at all when nothing is hidden, which is the normal case. The
 * point of hiding is a shorter catalog, so the way back has to be small enough
 * not to undo that.
 *
 * Exported for its test: this wording is a promise, the same way the delete
 * confirm's is.
 */
export function HiddenCourses({ hidden }: { hidden: CourseEntry[] }) {
  const { toggleHidden } = useProgress()
  const [showing, setShowing] = useState(false)

  if (hidden.length === 0) return null

  return (
    <div className="hidden-courses">
      <button
        type="button"
        className="hidden-toggle"
        aria-expanded={showing}
        onClick={() => setShowing(!showing)}
      >
        {hidden.length} hidden
      </button>
      {showing ? (
        <>
          <p className="hint">
            A hidden course keeps everything. Its learnt lines and drill schedule are
            exactly where they were, and unhiding brings its cards back to the queue.
          </p>
          <ul className="hidden-list">
            {hidden.map((entry) =>
              entry.course ? (
                <li key={entry.course.id}>
                  <span className={`tile-colour ${entry.course.colour}`}>
                    {colourName(entry.course.colour)}
                  </span>
                  <span className="hidden-title">{entry.course.title}</span>
                  <button
                    type="button"
                    className="tile-hide"
                    onClick={() => toggleHidden(entry.course!.id)}
                  >
                    Unhide
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        </>
      ) : null}
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
      To add a course, put its folder in <code>{folder}</code> and restart the app; a
      course added from a file below turns up straight away. It needs a{' '}
      <code>course.json</code> and its chapter files. A course you add cannot replace
      one that ships with the app.
    </p>
  )
}

function asText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
