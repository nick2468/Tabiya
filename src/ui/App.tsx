import { useState } from 'react'
import { Diagnostics } from './Diagnostics'
import { Drill } from './Drill'
import { Play, type PlayRequest } from './Play'
import { Progress } from './Progress'
import { ProgressProvider } from './progress-context'
import { Study } from './Study'
import { useTheme } from './theme'
import './app.css'

/**
 * The app shell. All four modes are built. Diagnostics is the phase 1
 * workbench, kept out of shipped builds.
 *
 * The play request is held here rather than in either view, because it is the
 * one thing Study and Play have to say to each other: "start a game from this
 * position".
 */
type View = 'study' | 'drill' | 'play' | 'progress' | 'diagnostics'

const MODES: { view: View; label: string }[] = [
  { view: 'study', label: 'Study' },
  { view: 'drill', label: 'Drill' },
  { view: 'play', label: 'Play' },
  { view: 'progress', label: 'Progress' },
]

export function App() {
  const [view, setView] = useState<View>('study')
  const [playRequest, setPlayRequest] = useState<PlayRequest | null>(null)
  const { theme, toggle } = useTheme()
  const showDiagnostics = import.meta.env.DEV

  const playFrom = (request: PlayRequest) => {
    setPlayRequest(request)
    setView('play')
  }

  return (
    <ProgressProvider>
      <div className="app">
        <header className="app-header">
          <div>
            <h1>London Trainer</h1>
            <p className="app-tagline">Learn the London System by understanding it.</p>
          </div>
          <nav className="app-nav" aria-label="Modes">
            {MODES.map((mode) => (
              <button
                key={mode.view}
                type="button"
                className={view === mode.view ? 'nav-link current' : 'nav-link'}
                aria-current={view === mode.view ? 'page' : undefined}
                onClick={() => setView(mode.view)}
              >
                {mode.label}
              </button>
            ))}
            {showDiagnostics ? (
              <button
                type="button"
                className={view === 'diagnostics' ? 'nav-link current' : 'nav-link'}
                aria-current={view === 'diagnostics' ? 'page' : undefined}
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
        <main>
          {view === 'study' ? <Study onPlayFrom={playFrom} /> : null}
          {view === 'drill' ? <Drill /> : null}
          {view === 'play' ? (
            <Play request={playRequest} onRequestUsed={() => setPlayRequest(null)} />
          ) : null}
          {view === 'progress' ? <Progress /> : null}
          {view === 'diagnostics' ? <Diagnostics /> : null}
        </main>
      </div>
    </ProgressProvider>
  )
}
