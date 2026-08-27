import { useState } from 'react'
import { Diagnostics } from './Diagnostics'
import { ProgressProvider } from './progress-context'
import { Study } from './Study'
import './app.css'

/**
 * The app shell. Study is the only mode built so far; Drill, Play and Progress
 * arrive in phases 3 and 4, and get their tabs then. Diagnostics is the phase 1
 * workbench, kept out of shipped builds.
 */
type View = 'study' | 'diagnostics'

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
            <button
              type="button"
              className={view === 'study' ? 'nav-link current' : 'nav-link'}
              aria-current={view === 'study' ? 'page' : undefined}
              onClick={() => setView('study')}
            >
              Study
            </button>
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
        <main>{view === 'study' ? <Study /> : <Diagnostics />}</main>
      </div>
    </ProgressProvider>
  )
}
