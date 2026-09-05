import { useEffect, useMemo, useRef, useState } from 'react'
import { useProgress } from './progress-context'
import { useCatalog } from './catalog-context'
import { buildCardsAcross } from '../model/cards'
import {
  anyGameRecorded,
  chapterProgress,
  conceptAccuracy,
  courseTotals,
  linesPlayed,
  playStats,
} from '../model/stats'
import { dueCount, newCount } from '../model/queue'
import { levelName } from '../engine'
import { colourName, type LoadedCourse } from '../model/types'
import { PLAY_HISTORY, type PlayRecord, type ProgressState } from '../storage/progress'
import type { Card } from '../model/cards'
import { backupCopy, isDesktop, readBackup, saveBackup, type BackupCopy } from './backup'
import { profileFolders, type ProfileFolders } from './folders'
import { HelpPanel } from './Help'
import { nextCardLine } from './card-words'
import { usePlay } from './play-context'
import {
  archivedGames,
  endingOf,
  lineOf,
  playedOn,
  recentPlayable,
  replayRequest,
  requestFor,
  sparringAgainst,
} from './play-on'
import type { PlayRequest } from './Play'
import './progress.css'

/**
 * Progress: what has been done, and what is going badly. Plain numbers, no
 * badges, because the point is to help the trainee choose what to do next.
 *
 * A rollup across every course, then the detail for ONE of them. The split is
 * not presentation: weak areas especially must stay per course (SPEC.md
 * section 10), because two repertoires share the core concept tags and one
 * average over both would let a strong course hide a weak one behind a number
 * that describes neither.
 *
 * Which one is the course the header's Course dropdown names, which is the
 * phase 21 ruling in SPEC.md section 8. It used to render a block for every
 * course in catalog order, so the dropdown could say "The London System" while
 * the page led with the Caro-Kann and the London was six screens down. The
 * rollup still spans everything.
 *
 * Phase 21 left a line here saying to open a course, for the case where none
 * was chosen. Phase 22 made a course always selected, so that line became a
 * sentence nobody could ever read, and it is gone. The test on `chosen` below
 * is what remains: it is for the empty catalog, which the guard above already
 * turns back, and it is there so the types hold rather than to say anything.
 */
export function Progress({
  courseId,
  onPlayOn,
}: {
  courseId: string | null
  /** Starts a live game from a recorded one. */
  onPlayOn: (request: PlayRequest) => void
}) {
  const { state, note, exportJson, importJson } = useProgress()
  const { courses } = useCatalog()
  const chosen = courses.find((course) => course.id === courseId)

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

  const nextUp = rollup.due === 0 && rollup.cards > 0 ? nextCardLine(cards, state) : ''

  if (courses.length === 0) {
    return <p className="empty">No courses loaded. Check the diagnostics view.</p>
  }

  return (
    <div className="progress">
      <h2>Progress</h2>
      <p className="progress-lead">
        What you have learnt, what is ready, and which ideas are not sticking. Nothing here
        is a score. The numbers are here to tell you what to work on next.
      </p>

      {note ? <p className="notice">{note}</p> : null}
      <OldProfileNote />

      <p className="totals">
        <strong>{rollup.learnt}</strong> of {rollup.lines} lines learnt across{' '}
        {courses.length} {courses.length === 1 ? 'course' : 'courses'}.{' '}
        <strong>{rollup.cards}</strong> {rollup.cards === 1 ? 'card' : 'cards'},{' '}
        <strong>{rollup.due}</strong> ready to drill now, {rollup.fresh} not yet drilled.
      </p>
      {/* Zero ready is the state the old wording could not explain: it is
          what everything drilled looks like, and it looks the same as
          nothing learnt. Saying when the next one comes back tells the two
          apart without anyone having to work it out. */}
      {nextUp ? <p className="hint">{nextUp}</p> : null}

      {chosen ? (
        <CourseProgress key={chosen.id} course={chosen} cards={cards} state={state} />
      ) : null}

      <section>
        <h3>Games played</h3>
        {play.games === 0 ? (
          <p className="hint">No games yet. Play one and the numbers turn up here.</p>
        ) : (
          <>
            <p>
              <strong>{play.games}</strong> {play.games === 1 ? 'game' : 'games'}
              {play.otherSide > 0
                ? `, ${play.otherSide} of them playing the other side`
                : ''}
              . You left the repertoire first in <strong>{play.deviations}</strong>
              {play.otherSide > 0 ? ' of the rest' : ' of them'}
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

        <PlayOn onPlayOn={onPlayOn} />
      </section>

      {chosen ? <LinesPlayed course={chosen} state={state} /> : null}

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
        <strong>{totals.due}</strong> ready to drill now, {totals.fresh} not yet drilled.
      </p>

      <HelpPanel panel="progress-chapters">
        <h4>Chapters</h4>
      </HelpPanel>
      <table>
        <thead>
          <tr>
            <th>Chapter</th>
            <th className="num">Learnt</th>
            <th className="num">Ready</th>
            <th className="num">Not yet drilled</th>
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

      <HelpPanel panel="progress-concepts">
        <h4>Concepts</h4>
      </HelpPanel>
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
    </section>
  )
}

/**
 * Recent games that can be picked up where they were left, and the archive
 * they can be put away in.
 *
 * Nick stopped a game at move 20, upgraded the app, and the game was gone: it
 * was in his progress file and nothing could turn it back into a game. Every
 * review since version 1.6.7 keeps the moves, so these rows can.
 *
 * Every course, not just the one the dropdown names, because a game you want
 * back is a game you remember playing rather than one you go looking for by
 * course. Play on switches the header to the game's own course, the way
 * opening a course does.
 *
 * One game at a time still holds, so Play on has to make room for the game it
 * starts. A reviewed game is over and is cleared without ceremony; a game
 * still being played is not, and the button waits rather than throwing it
 * away behind the trainee's back.
 *
 * Phase 39 added Archive and Delete to each row, and the archive: a view of
 * this same section rather than a sixth mode, reached by the "N archived
 * games" line and left by "Back to your games". An archived game is out of
 * every list and count and stays in the file. Delete is the app's first
 * destructive control and takes two clicks, see `DeleteButton`.
 */
export function PlayOn({
  onPlayOn,
  initialView = 'games',
}: {
  onPlayOn: (request: PlayRequest) => void
  /** The help test renders the archive view directly; the screen never does. */
  initialView?: 'games' | 'archive'
}) {
  const { state, archivePlay, unarchivePlay, deletePlay } = useProgress()
  const { courses } = useCatalog()
  const game = usePlay()
  const [view, setView] = useState<'games' | 'archive'>(initialView)
  const rows = useMemo(() => recentPlayable(state.playGames), [state.playGames])
  const archived = useMemo(() => archivedGames(state.playGames), [state.playGames])
  const withCourse = (records: PlayRecord[]) =>
    records
      .map((record) => ({ record, course: courses.find((entry) => entry.id === record.courseId) }))
      .filter((row): row is { record: PlayRecord; course: LoadedCourse } => Boolean(row.course))
  const playable = withCourse(rows)
  const putAway = withCourse(archived)

  if (playable.length === 0 && putAway.length === 0 && view === 'games') return null

  // Why the buttons are dead, when they are. A game being played and a game
  // being scanned are both "in progress"; they are not the same wait, and a
  // title that said only one would be wrong half the time.
  const waiting = game.scanning
    ? 'The game is being reviewed; wait for the report.'
    : 'A game is being played. Finish or replace it on Play first.'
  // And the game on the Play screen itself, played or reviewed, cannot be
  // archived or deleted from here: the same rule Play on follows.
  const onPlay = (record: PlayRecord) => game.session !== null && game.recordedAt === record.at
  const onPlayTitle = 'Finish or replace this game on Play first.'

  const cells = (record: PlayRecord, course: LoadedCourse) => {
    const chapter = course.chapters.find((entry) => entry.id === record.chapterId)
    const ending = endingOf(record, course.colour)
    const line = lineOf(record, course)
    return (
      <>
        <td>{playedOn(record.at)}</td>
        <td>{course.title}</td>
        <td>{sparringAgainst(record, chapter?.title)}</td>
        <td className={line?.faint ? 'faint' : undefined}>{line?.text ?? ''}</td>
        <td>{levelName(record.level)}</td>
        <td className="num">{record.moves}</td>
        <td>{ending.ended}</td>
        <td>{ending.position}</td>
      </>
    )
  }
  const head = (
    <thead>
      <tr>
        <th>Played</th>
        <th>Course</th>
        <th>Sparring against</th>
        <th>Line</th>
        <th>Strength</th>
        <th className="num">Moves</th>
        <th>Ended</th>
        <th>Position</th>
        <th />
      </tr>
    </thead>
  )

  if (view === 'archive') {
    return (
      <>
        <h4>Archived games</h4>
        {putAway.length === 0 ? <p className="hint">Nothing is archived now.</p> : null}
        <div className="play-on-scroll">
        <table className="play-on-table" aria-label="Archived games">
          {head}
          <tbody>
            {putAway.map(({ record, course }) => (
              <tr key={record.at}>
                {cells(record, course)}
                <td className="row-actions">
                  <button
                    type="button"
                    disabled={onPlay(record)}
                    title={onPlay(record) ? onPlayTitle : undefined}
                    onClick={() => unarchivePlay(record.at)}
                  >
                    Unarchive
                  </button>
                  <DeleteButton
                    disabled={onPlay(record)}
                    title={onPlay(record) ? onPlayTitle : undefined}
                    onDelete={() => deletePlay(record.at)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <p className="hint">
          Games put away. They are out of every list and count on this screen and still
          in your progress file, where the {PLAY_HISTORY} most recent games are kept,
          archived or not. Unarchive brings a game back to the list above; Delete removes
          it for good, and asks twice.
        </p>
        <button type="button" onClick={() => setView('games')}>
          Back to your games
        </button>
      </>
    )
  }

  return (
    <>
      {playable.length > 0 ? (
        <>
          <h4>Play on</h4>
          <div className="play-on-scroll">
          <table className="play-on-table">
            {head}
            <tbody>
              {playable.map(({ record, course }) => (
                <tr key={record.at}>
                  {cells(record, course)}
                  <td className="row-actions">
                    <button
                      type="button"
                      disabled={game.inProgress}
                      title={game.inProgress ? waiting : undefined}
                      onClick={() => {
                        game.reset()
                        onPlayOn(requestFor(record, course))
                      }}
                    >
                      Play on
                    </button>
                    <button
                      type="button"
                      disabled={game.inProgress}
                      title={game.inProgress ? waiting : undefined}
                      onClick={() => {
                        game.reset()
                        onPlayOn(replayRequest(record, course))
                      }}
                    >
                      Replay
                    </button>
                    <button
                      type="button"
                      disabled={onPlay(record)}
                      title={onPlay(record) ? onPlayTitle : undefined}
                      onClick={() => archivePlay(record.at)}
                    >
                      Archive
                    </button>
                    <DeleteButton
                      disabled={onPlay(record)}
                      title={onPlay(record) ? onPlayTitle : undefined}
                      onDelete={() => deletePlay(record.at)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <p className="hint">
            Picks a game up where it stopped, in its own course and at the strength it was
            played at, with no length to stop it again. Replay puts the same game up with its
            report, to look through rather than carry on. Either way the game keeps its
            identity, so reviewing it again replaces it rather than counting it twice. Only
            games played since version 1.6.7 are here: earlier ones did not keep their moves.
            Ended is worked out from the moves when the game itself did not record it, so a
            game that finished in checkmate says so however old it is; a game from before
            1.6.12 that simply ran out of moves reads as stopped, because nothing kept the
            length it was given. Position is the verdict on the last position, blank where no
            evaluation was kept and beside a checkmate, which has said it already. A game you
            are still playing, or one being reviewed, has to finish first, because the app
            holds one game at a time. Archive puts a game away, out of every list and count
            here; Delete removes it for good, and asks twice.
          </p>
        </>
      ) : null}
      {putAway.length > 0 ? (
        <p>
          <button type="button" className="link" onClick={() => setView('archive')}>
            {putAway.length} archived {putAway.length === 1 ? 'game' : 'games'}
          </button>
        </p>
      ) : null}
    </>
  )
}

/** How long a Delete stays armed before it goes back to being a Delete. */
export const DELETE_WINDOW_MS = 5000

/**
 * Delete, in two clicks.
 *
 * The app has no dialogs, and this is its first destructive control, so the
 * confirmation is the button itself: the first click turns it into "Delete
 * for good?" for five seconds, a second click within that time deletes, and
 * anything else, the time passing or a click anywhere else on the page, puts
 * it back. The label changes between the clicks so that the second is a
 * choice and not a slip.
 */
export function DeleteButton({
  onDelete,
  disabled,
  title,
}: {
  onDelete: () => void
  disabled?: boolean
  title?: string
}) {
  const [armed, setArmed] = useState(false)
  const self = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), DELETE_WINDOW_MS)
    const elsewhere = (event: MouseEvent) => {
      if (self.current && event.target instanceof Node && self.current.contains(event.target)) return
      setArmed(false)
    }
    document.addEventListener('click', elsewhere)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', elsewhere)
    }
  }, [armed])

  return (
    <button
      ref={self}
      type="button"
      className={armed ? 'danger' : undefined}
      disabled={disabled}
      title={title}
      onClick={() => {
        if (armed) {
          setArmed(false)
          onDelete()
        } else {
          setArmed(true)
        }
      }}
    >
      {armed ? 'Delete for good?' : 'Delete'}
    </button>
  )
}

/**
 * Which lines the games of this course actually followed.
 *
 * A game counts for a line it never left and got far enough into to have
 * chosen it: past the ply where that line parts from every other line in the
 * course. A game that stopped in a trunk several lines share counts for none
 * of them. Nick ruled that on 2026-09-03 after a three move game was counted
 * for eleven lines, and the hint says the rule: a number nobody can explain is
 * worse than no number.
 *
 * Games recorded before version 1.6.7 never kept their moves, so a trainee
 * with a long history sees nothing here at first. That is said outright.
 */
function LinesPlayed({ course, state }: { course: LoadedCourse; state: ProgressState }) {
  const rows = useMemo(() => linesPlayed(course, state), [course, state])
  const recorded = useMemo(() => anyGameRecorded(course, state), [course, state])

  return (
    <section>
      <h3>Lines played</h3>
      {!recorded ? (
        <p className="hint">
          Counted from games played since version 1.6.7. Games before that did not keep
          their moves, so there is nothing to count yet.
        </p>
      ) : rows.length === 0 ? (
        <p className="hint">
          No game of this course has followed one of its lines yet.
        </p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Line</th>
                <th>Chapter</th>
                <th className="num">Games</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.chapterTitle}</td>
                  <td className="num">{row.games}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="hint">
            A game counts for a line once it has played past the point where that line
            parts from every other line in the course, whether it then played the line
            out or stopped along it. A game that stopped while several lines still shared
            the same moves counts for none of them. Counted over your last 100 games.
          </p>
        </>
      )}
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
