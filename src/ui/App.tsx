import { useState } from 'react'
import { Diagnostics } from './Diagnostics'
import { Drill } from './Drill'
import { Progress } from './Progress'
import { ProgressProvider } from './progress-context'
import { Study } from './Study'
import './app.css'

/**
 * The app shell. Study, Drill and Progress are built; Play arrives in phase 4
 * and gets its tab then. Diagnostics is the phase 1 workbench, kept out of
 * shipped builds.
 */
type View = 'study' | 'drill' | 'progress' | 'diagnostics'

const MODES: { view: View; label: string }[] = [
  { view: 'study', label: 'Study' },
  { view: 'drill', label: 'Drill' },
  { view: 'progress', label: 'Progress' },
]

export function App() {
  const [view, setView] = useState<View>('study')
  const showDiagnostics = import.meta.env.DEV

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
          </nav>
        </header>
        <main>
          {view === 'study' ? <Study /> : null}
          {view === 'drill' ? <Drill /> : null}
          {view === 'progress' ? <Progress /> : null}
          {view === 'diagnostics' ? <Diagnostics /> : null}
        </main>
      </div>
    </ProgressProvider>
  )
}
