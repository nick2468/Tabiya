import { ContentStatus } from './ContentStatus'
import { PlayableBoard } from './PlayableBoard'

/**
 * The dev-only diagnostics view. It holds what phase 1 put on the front page:
 * the content status table, and a free board for trying positions out. Neither
 * belongs in the app the trainee uses, but both are worth keeping to hand while
 * the content and the board wrapper are still moving.
 */
export function Diagnostics() {
  return (
    <div className="diagnostics">
      <p className="hint">
        This view only exists in development builds. It is a workbench, not part of the
        course.
      </p>
      <ContentStatus />
      <section className="scratch">
        <h2>Scratch board</h2>
        <p className="hint">
          A free board with the rules enforced. Promotions become a queen without asking;
          a picker arrives with Play mode.
        </p>
        <PlayableBoard />
      </section>
    </div>
  )
}
