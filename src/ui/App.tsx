import { PlayableBoard } from './PlayableBoard'
import './app.css'

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>London Trainer</h1>
        <p className="app-tagline">Learn the London System by understanding it.</p>
      </header>
      <main>
        <PlayableBoard />
      </main>
    </div>
  )
}
