import { useCallback, useState } from 'react'
import { Catalog } from './Catalog'
import { CatalogProvider, useCatalog } from './catalog-context'
import { Diagnostics } from './Diagnostics'
import { Drill } from './Drill'
import { Play, type PlayRequest } from './Play'
import { Progress } from './Progress'
import { ProgressProvider, useProgress } from './progress-context'
import { Study } from './Study'
import { useTheme } from './theme'
import './app.css'

/**
 * The app shell.
 *
 * Two kinds of view sit side by side here. Study and Play happen INSIDE a
 * course, so they need one chosen; Drill and Progress span every course, so
 * they do not. That split is the ruling in SPEC.md section 10 and it is the
 * only reason the shell holds a selected course at all.
 *
 * The play request is held here rather than in either view, because it is the
 * one thing Study and Play have to say to each other: "start a game from this
 * position".
 */
type View = 'courses' | 'study' | 'drill' | 'play' | 'progress' | 'diagnostics'

/** Views that need a course chosen first. */
const IN_COURSE: View[] = ['study', 'play']

const MODES: { view: View; label: string }[] = [
  { view: 'courses', label: 'Courses' },
  { view: 'study', label: 'Study' },
  { view: 'play', label: 'Play' },
  { view: 'drill', label: 'Drill' },
  { view: 'progress', label: 'Progress' },
]

export function App() {
  return (
    <ProgressProvider>
      <CatalogProvider>
        <Shell />
      </CatalogProvider>
    </ProgressProvider>
  )
}

function Shell() {
  const catalog = useCatalog()
  const { failure, restore, putBack } = useProgress()
  const [view, setView] = useState<View>('courses')
  const [courseId, setCourseId] = useState<string | null>(null)
  const [playRequest, setPlayRequest] = useState<PlayRequest | null>(null)
  const { theme, toggle } = useTheme()
  const showDiagnostics = import.meta.env.DEV

  const course = courseId ? catalog.find(courseId) : undefined

  const open = useCallback((id: string) => {
    setCourseId(id)
    setPlayRequest(null)
    setView('study')
  }, [])

  // Switching course mid-session cannot carry a play request with it: the
  // position it names belongs to the course being left.
  const switchTo = useCallback((id: string) => {
    setCourseId(id)
    setPlayRequest(null)
  }, [])

  const playFrom = useCallback((request: PlayRequest) => {
    setPlayRequest(request)
    setView('play')
  }, [])

  // A view that needs a course, with none chosen, is the catalog.
  const showing: View = IN_COURSE.includes(view) && !course ? 'courses' : view

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Repertoire Trainer</h1>
          <p className="app-tagline">Learn your openings by understanding them.</p>
        </div>
        <nav className="app-nav" aria-label="Modes">
          {MODES.map((mode) => (
            <button
              key={mode.view}
              type="button"
              className={showing === mode.view ? 'nav-link current' : 'nav-link'}
              aria-current={showing === mode.view ? 'page' : undefined}
              disabled={IN_COURSE.includes(mode.view) && !course}
              title={
                IN_COURSE.includes(mode.view) && !course
                  ? 'Open a course first'
                  : undefined
              }
              onClick={() => setView(mode.view)}
            >
              {mode.label}
            </button>
          ))}
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

      {course && catalog.courses.length > 1 ? (
        <div className="course-switch">
          <label htmlFor="course-switch">Course</label>
          <select
            id="course-switch"
            value={course.id}
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
        {showing === 'play' && course ? (
          <Play
            key={course.id}
            course={course}
            request={playRequest}
            onRequestUsed={() => setPlayRequest(null)}
          />
        ) : null}
        {showing === 'drill' ? <Drill /> : null}
        {showing === 'progress' ? <Progress /> : null}
        {showing === 'diagnostics' ? <Diagnostics /> : null}
      </main>
    </div>
  )
}
