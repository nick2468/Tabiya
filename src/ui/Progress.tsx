import { useEffect, useMemo, useRef, useState } from 'react'
import { useProgress } from './progress-context'
import { useCatalog } from './catalog-context'
import { buildCardsAcross } from '../model/cards'
import { chapterProgress, conceptAccuracy, courseTotals, playStats } from '../model/stats'
import { dueCount, newCount } from '../model/queue'
import { colourName, type LoadedCourse } from '../model/types'
import type { ProgressState } from '../storage/progress'
import type { Card } from '../model/cards'
import { backupCopy, isDesktop, readBackup, saveBackup, type BackupCopy } from './backup'
import { profileFolders, type ProfileFolders } from './folders'
import './progress.css'

/**
 * Progress: what has been done, and what is going badly. Plain numbers, no
 * badges, because the point is to help the trainee choose what to do next.
 *
 * A rollup across every course, then one block per course. The split is not
 * presentation: weak areas especially must stay per course (SPEC.md section
 * 10), because two repertoires share the core concept tags and one average
 * over both would let a strong course hide a weak one behind a number that
 * describes neither.
 */
export function Progress() {
  const { state, note, exportJson, importJson } = useProgress()
  const { courses } = useCatalog()

  const cards = useMemo(
    () => buildCardsAcross(courses, state.learntLines).cards,
    [courses, state.learntLines],
  )
  const play = useMemo(() => playStats(courses, state), [courses, state])
  const rollup = useMemo(
    () => ({
      learnt: courses.reduce(
        (sum, course) => sum + courseTotals(course, cards, state).learntLines,
        0,
      ),
      lines: courses.reduce(
        (sum, course) => sum + courseTotals(course, cards, state).totalLines,
        0,
      ),
      cards: cards.length,
      due: dueCount(cards, state),
      fresh: newCount(cards, state),
    }),
    [cards, courses, state],
  )

  if (courses.length === 0) {
    return <p className="empty">No courses loaded. Check the diagnostics view.</p>
  }

  return (
    <div className="progress">
      <h2>Progress</h2>

      {note ? <p className="notice">{note}</p> : null}
      <OldProfileNote />

      <p className="totals">
        <strong>{rollup.learnt}</strong> of {rollup.lines} lines learnt across{' '}
        {courses.length} {courses.length === 1 ? 'course' : 'courses'}.{' '}
        <strong>{rollup.cards}</strong> {rollup.cards === 1 ? 'card' : 'cards'},{' '}
        <strong>{rollup.due}</strong> due now, {rollup.fresh} never answered.
      </p>

      {courses.map((course) => (
        <CourseProgress key={course.id} course={course} cards={cards} state={state} />
      ))}

      <section>
        <h3>Games played</h3>
        {play.games === 0 ? (
          <p className="hint">No games yet. Play one and the numbers turn up here.</p>
        ) : (
          <>
            <p>
              <strong>{play.games}</strong> {play.games === 1 ? 'game' : 'games'}. You left the
              repertoire first in <strong>{play.deviations}</strong> of them
              {play.deviationRate === null
                ? ''
                : `, which is ${Math.round(play.deviationRate * 100)}%`}
              {play.averageDeviationMove === null
                ? '.'
                : `, on average around move ${Math.round(play.averageDeviationMove)}.`}
            </p>
            <table>
              <thead>
                <tr>
                  <th>Sparring against</th>
                  <th className="num">Games</th>
                  <th className="num">You left book</th>
                </tr>
              </thead>
              <tbody>
                {play.byChapter
                  .filter((row) => row.games > 0)
                  .map((row) => (
                    <tr key={row.id}>
                      <td>{row.title}</td>
                      <td className="num">{row.games}</td>
                      <td className="num">{row.deviations}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </>
        )}
        <p className="hint">
          Leaving the repertoire is not the same as playing badly. The report after each
          game says which one it was.
        </p>
      </section>

      <BackupSection exportJson={exportJson} importJson={importJson} />
    </div>
  )
}

/** One course: its chapters and its own concept accuracy. */
function CourseProgress({
  course,
  cards,
  state,
}: {
  course: LoadedCourse
  cards: Card[]
  state: ProgressState
}) {
  const rows = useMemo(() => chapterProgress(course, state), [course, state])
  const concepts = useMemo(() => conceptAccuracy(course, cards, state), [cards, course, state])
  const totals = useMemo(() => courseTotals(course, cards, state), [cards, course, state])

  return (
    <section className="course-block">
      <h3>
        {course.title} <span className="course-colour">as {colourName(course.colour)}</span>
      </h3>
      <p className="course-totals">
        <strong>{totals.learntLines}</strong> of {totals.totalLines} lines learnt.{' '}
        <strong>{totals.cards}</strong> {totals.cards === 1 ? 'card' : 'cards'},{' '}
        <strong>{totals.due}</strong> due now, {totals.fresh} never answered.
      </p>

      <h4>Chapters</h4>
      <table>
        <thead>
          <tr>
            <th>Chapter</th>
            <th className="num">Learnt</th>
            <th className="num">Due</th>
            <th className="num">New</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.title}</td>
              <td className="num">
                {row.learnt} of {row.lines}
              </td>
              <td className="num">{row.due}</td>
              <td className="num">{row.fresh}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Concepts</h4>
      {concepts.length === 0 ? (
        <p className="hint">Nothing yet. Learn a line in this course and drill it.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Concept</th>
              <th className="num">Accuracy</th>
              <th className="num">Answers</th>
              <th className="num">Cards</th>
            </tr>
          </thead>
          <tbody>
            {concepts.map((row) => (
              <tr key={row.tag}>
                <td>{row.tag}</td>
                <td className="num">
                  {row.accuracy === null ? (
                    <span className="quiet">not drilled yet</span>
                  ) : (
                    `${Math.round(row.accuracy * 100)}%`
                  )}
                </td>
                <td className="num">{row.answers}</td>
                <td className="num">{row.cards}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="hint">
        Accuracy is the share of your last twenty answers on that concept that were the
        repertoire move, counted in this course alone. A playable alternative still counts
        as not recalled.
      </p>
    </section>
  )
}

/**
 * Export and import. This is the backup story, and in phase 5 it is also the
 * way progress moves from the browser into the wrapped Windows app.
 *
 * Phase 16 added the app's own second copy underneath it. That copy is written
 * after every save and read back only when the main file has gone, so a trainee
 * would otherwise have no way of knowing it is there. Saying where it is and
 * what it holds turns a promise into something they can check.
 */
function BackupSection({
  exportJson,
  importJson,
}: {
  exportJson: () => Promise<string>
  importJson: (text: string) => Promise<void>
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const download = async () => {
    try {
      const { message } = await saveBackup(await exportJson())
      if (message) setMessage({ kind: 'ok', text: message })
    } catch (error) {
      setMessage({ kind: 'error', text: `That could not be saved: ${asMessage(error)}` })
    }
  }

  /** The desktop opens its own file dialog; the browser uses the input below. */
  const pick = async () => {
    if (!isDesktop()) {
      fileInput.current?.click()
      return
    }
    try {
      const text = await readBackup()
      if (text === null) return
      await importJson(text)
      setMessage({ kind: 'ok', text: 'Progress replaced from the file.' })
    } catch (error) {
      setMessage({ kind: 'error', text: `That file could not be read: ${asMessage(error)}` })
    }
  }

  const upload = async (file: File) => {
    try {
      await importJson(await file.text())
      setMessage({ kind: 'ok', text: 'Progress replaced from the file.' })
    } catch (error) {
      setMessage({ kind: 'error', text: `That file could not be read: ${asMessage(error)}` })
    }
  }

  return (
    <section>
      <h3>Backup</h3>
      <p className="hint">
        Export writes everything - learnt lines, card schedules and concept history - to
        one file. Import replaces all of it, so keep an export before you try one.
      </p>
      <SecondCopy />
      <div className="backup-actions">
        <button type="button" onClick={download}>
          Export progress
        </button>
        <button type="button" onClick={pick}>
          Import progress
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden-input"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
            event.target.value = ''
          }}
        />
      </div>
      {message ? <p className={message.kind === 'ok' ? 'notice' : 'notice bad'}>{message.text}</p> : null}
    </section>
  )
}

/**
 * The folder the window's browser profile left behind when it was renamed.
 *
 * It sits beside the migration note above, which is where phase 15 says the
 * same thing about the data folder. Both moves leave the old folder alone: a
 * move that deletes has one chance to be right, and neither of these is worth
 * that risk for a folder name. This says nothing once the old folder has gone.
 */
function OldProfileNote() {
  const [folders, setFolders] = useState<ProfileFolders | null>(null)

  useEffect(() => {
    let cancelled = false
    void profileFolders().then((found) => {
      if (!cancelled) setFolders(found)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!folders || !folders.before) return null

  return (
    <p className="notice">
      The window keeps its browser profile in <code>{folders.now}</code> now, named
      after the app rather than after an internal id.{' '}
      {folders.moved ? '' : 'That folder appears the next time the app starts. '}
      The old one is still at <code>{folders.before}</code> and nothing uses it. It is
      about 32 MB. Delete it yourself once you are happy, the same as the old data
      folder. The one thing it held that the app cannot carry across is your light or
      dark choice, so set that again from the header.
    </p>
  )
}

/**
 * The copy the app keeps for itself, in a second folder.
 *
 * It is read here and nowhere else on this screen, because the point is to
 * show that the safety net exists rather than to do anything with it. The
 * folder is deliberately not the data folder: deleting the data folder is what
 * cost Nick his learnt lines, and a copy inside it would have gone too.
 */
function SecondCopy() {
  const [copy, setCopy] = useState<BackupCopy | null>(null)

  useEffect(() => {
    let cancelled = false
    void backupCopy().then((found) => {
      if (!cancelled) setCopy(found)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!copy) return null

  return (
    <p className="hint second-copy">
      The app also keeps its own copy at <code>{copy.path}</code>, rewritten every time
      it saves and read back only if your main progress file goes missing.{' '}
      {copy.trouble !== null ? (
        <>It is there but could not be read: {copy.trouble}</>
      ) : !copy.there ? (
        <>It is not there yet. It appears the first time the app saves.</>
      ) : (
        <>
          It currently holds <strong>{copy.learntLines}</strong> learnt{' '}
          {copy.learntLines === 1 ? 'line' : 'lines'}, and it is an ordinary progress
          file, so Import above will read it.
        </>
      )}
    </p>
  )
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
