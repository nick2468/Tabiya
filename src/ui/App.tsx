import { useCallback, useState } from 'react'
import { Catalog } from './Catalog'
import { CatalogProvider, useCatalog } from './catalog-context'
import { Diagnostics } from './Diagnostics'
import { Drill } from './Drill'
import { Help } from './Help'
import { Play, type PlayRequest } from './Play'
import { PlayProvider } from './play-context'
import { StudyProvider } from './study-context'
import { Progress } from './Progress'
import { ProgressProvider, useProgress } from './progress-context'
import { Study } from './Study'
import {
  rememberCourse,
  resolveCourse,
  savedCourse,
  useDrillGap,
  useDrillScope,
  useRememberedCourse,
} from './prefs'
import { useTheme } from './theme'
import './app.css'

/**
 * The app shell.
 *
 * A COURSE IS ALWAYS SELECTED, which is the phase 22 ruling in SPEC.md
 * section 8. The shell holds the id, resolves it against the courses that are
 * actually there, and remembers it for next time. Nothing is disabled and
 * nothing waits: every mode works from the first click of a fresh install.
 *
 * That replaced a split where Study and Play were greyed out until a course
 * was chosen and Drill and Progress were not, on the v2 reasoning that those
 * two span courses. Phase 21 then made Progress follow the switcher, so
 * Progress wanted a course while still being classed as a screen that needed
 * none, and the first click into it said to open one. The ruling: block every
 * mode or allow all of them, and Nick chose allow all.
 *
 * Drill still spans courses by default, which is the part of the v2 ruling
 * that survives. The difference is that it is a remembered choice on the
 * screen rather than a rule, and while it is mixing everything the course
 * switcher is greyed out here, so the header cannot appear to name a course
 * the queue is ignoring.
 *
 * The play request is held here rather than in either view, because it is the
 * one thing Study and Play have to say to each other: "start a game from this
 * position".
 *
 * The game ITSELF is held higher still, in `PlayProvider`, so it survives a
 * look at another screen. It does not hold the header still while it runs:
 * phase 23 greyed the switcher during a game and Nick overruled that on
 * 2026-09-03, because studying or drilling another opening mid-game is a
 * normal thing to want. The game names its own course above the board instead.
 */
type View = 'courses' | 'study' | 'drill' | 'play' | 'progress' | 'help' | 'diagnostics'

const MODES: { view: View; label: string }[] = [
  { view: 'courses', label: 'Courses' },
  { view: 'study', label: 'Study' },
  { view: 'play', label: 'Play' },
  { view: 'drill', label: 'Drill' },
  { view: 'progress', label: 'Progress' },
]

/**
 * Help sits apart from the workflow modes, after a separator, and is never
 * disabled. It is not a step in the loop and it must be reachable from the
 * screen somebody is stuck on, including the one they see before any course is
 * open.
 */
const HELP_MODE: { view: View; label: string } = { view: 'help', label: 'Help' }

export function App() {
  return (
    <ProgressProvider>
      <CatalogProvider>
        <PlayProvider>
          <StudyProvider>
            <Shell />
          </StudyProvider>
        </PlayProvider>
      </CatalogProvider>
    </ProgressProvider>
  )
}

/**
 * The header, the nav and whichever view is showing.
 *
 * Exported for its test: `App` builds the two providers itself, and a test
 * that wants the app at a chosen state has to supply them. Nothing else uses
 * this directly.
 */
export function Shell() {
  const catalog = useCatalog()
  const { failure, restore, putBack } = useProgress()
  const [view, setView] = useState<View>('courses')
  const [courseId, setCourseId] = useState<string | null>(savedCourse)
  const [playRequest, setPlayRequest] = useState<PlayRequest | null>(null)
  const { theme, toggle } = useTheme()
  const { scope, setScope } = useDrillScope()
  const { gap, setGap } = useDrillGap()
  const showDiagnostics = import.meta.env.DEV

  // Derived every render rather than stored: a remembered id that no longer
  // names a visible course falls back to the first one, so a course that was
  // hidden or deleted between sessions never leaves the app with none.
  const course = resolveCourse(courseId, catalog.courses)
  useRememberedCourse(course?.id, catalog.scanned)

  const open = useCallback((id: string) => {
    setCourseId(id)
    rememberCourse(id)
    setPlayRequest(null)
    setView('study')
  }, [])

  // Switching course mid-session cannot carry a play request with it: the
  // position it names belongs to the course being left.
  const switchTo = useCallback((id: string) => {
    setCourseId(id)
    rememberCourse(id)
    setPlayRequest(null)
  }, [])

  // A request can bring its own course with it: Progress sends one to carry
  // on a game that was played in a course the header may not be naming.
  const playFrom = useCallback((request: PlayRequest) => {
    if (request.courseId) {
      setCourseId(request.courseId)
      rememberCourse(request.courseId)
    }
    setPlayRequest(request)
    setView('play')
  }, [])

  // With no courses installed at all there is nothing for Study or Play to
  // render, so the catalog and its drop-in note are the only useful screen.
  // With any course installed this never fires: one is always resolved.
  const showing: View = (view === 'study' || view === 'play') && !course ? 'courses' : view

  // Greyed on Drill while Drill is mixing every course, because the queue is
  // not following it, and for no other reason. A game used to grey it too;
  // that was overruled, and the game says its own course instead.
  //
  // It stays visible rather than disappearing: a header that changes shape
  // between screens is its own confusion.
  const switcherIdle = showing === 'drill' && scope === 'mixed'
  const switcherWhy = 'Drill is mixing every course. Choose Drill selected to drill this one.'

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>
            Tabiya <span className="app-version">v{__APP_VERSION__}</span>
          </h1>
          <p className="app-tagline">Learn your openings by understanding them.</p>
        </div>
        <nav className="app-nav" aria-label="Modes">
          {MODES.map((mode) => (
            <button
              key={mode.view}
              type="button"
              className={showing === mode.view ? 'nav-link current' : 'nav-link'}
              aria-current={showing === mode.view ? 'page' : undefined}
              onClick={() => setView(mode.view)}
            >
              {mode.label}
            </button>
          ))}
          <span className="nav-separator" aria-hidden="true" />
          <button
            type="button"
            className={showing === HELP_MODE.view ? 'nav-link current' : 'nav-link'}
            aria-current={showing === HELP_MODE.view ? 'page' : undefined}
            onClick={() => setView(HELP_MODE.view)}
          >
            {HELP_MODE.label}
          </button>
          {showDiagnostics ? (
            <button
              type="button"
              className={showing === 'diagnostics' ? 'nav-link current' : 'nav-link'}
              aria-current={showing === 'diagnostics' ? 'page' : undefined}
              onClick={() => setView('diagnostics')}
            >
              Diagnostics
            </button>
          ) : null}
          <button
            type="button"
            className="nav-link theme-toggle"
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
            aria-label={theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </nav>
      </header>

      {/* Always, once there is more than one course to choose between. The
          `course` test is for the empty catalog and nothing else: with any
          course installed, one is always resolved. */}
      {catalog.courses.length > 1 && course ? (
        <div className={switcherIdle ? 'course-switch idle' : 'course-switch'}>
          <label htmlFor="course-switch">Course</label>
          <select
            id="course-switch"
            value={course.id}
            disabled={switcherIdle}
            title={switcherIdle ? switcherWhy : undefined}
            onChange={(event) => switchTo(event.target.value)}
          >
            {catalog.courses.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {failure ? (
        <div className="notice bad read-failure">
          <p>{failure}</p>
          {restore ? (
            <button type="button" className="restore-copy" onClick={putBack}>
              Put the copy back
            </button>
          ) : null}
        </div>
      ) : null}

      <main>
        {showing === 'courses' ? <Catalog onOpen={open} /> : null}
        {showing === 'study' && course ? (
          <Study key={course.id} course={course} onPlayFrom={playFrom} />
        ) : null}
        {/* No `key` on the course. A game outlives a course change now, and
            remounting Play would throw away the launch options under a game
            that is still running. Play shows the running game whenever there
            is one; the start screen is what follows the header. */}
        {showing === 'play' && course ? (
          <Play
            course={course}
            request={playRequest}
            onRequestUsed={() => setPlayRequest(null)}
            onPlayFrom={playFrom}
          />
        ) : null}
        {showing === 'drill' ? (
          <Drill
            courseId={course?.id ?? null}
            scope={scope}
            onScope={setScope}
            gap={gap}
            onGap={setGap}
          />
        ) : null}
        {showing === 'progress' ? (
          <Progress courseId={course?.id ?? null} onPlayOn={playFrom} />
        ) : null}
        {showing === 'help' ? <Help /> : null}
        {showing === 'diagnostics' ? <Diagnostics /> : null}
      </main>
    </div>
  )
}
