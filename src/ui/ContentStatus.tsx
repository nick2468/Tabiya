import { useCatalog } from './catalog-context'
import { deepestFullMove, nodeCount, positionsWithMistakes } from '../model/loader'
import type { ContentError } from '../model/types'

/**
 * The dev-only content status panel: one section per course, one row per
 * chapter, with the numbers that show whether the content is where it should
 * be.
 *
 * A course that failed to load has no chapters to list, so its errors are
 * listed instead. That is the shape phase 7's catalog needs too: a course that
 * will not load appears, saying why, rather than disappearing.
 */
export function ContentStatus() {
  const { entries } = useCatalog()

  return (
    <section className="status">
      <h2>Content status</h2>
      {entries.map((entry) => (
        <div key={entry.source} className="status-course">
          <h3>
            {entry.course ? `${entry.course.title} (${entry.course.id})` : entry.source}
            <span className="quiet">
              {entry.course ? ` - ${entry.course.colour}` : ''} - {entry.origin}
            </span>
          </h3>
          {entry.course ? (
            <table>
              <thead>
                <tr>
                  <th>Chapter</th>
                  <th>Title</th>
                  <th className="num">Nodes</th>
                  <th className="num">Deepest</th>
                  <th className="num">Mistakes</th>
                </tr>
              </thead>
              <tbody>
                {entry.course.chapters.map((chapter) => (
                  <tr key={chapter.id}>
                    <td>{chapter.fileId}</td>
                    <td>{chapter.title}</td>
                    <td className="num">{nodeCount(chapter)}</td>
                    <td className="num">move {deepestFullMove(chapter)}</td>
                    <td className="num">{positionsWithMistakes(chapter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <ErrorList errors={entry.errors} />
          )}
        </div>
      ))}
      <p className="status-note">
        Deepest is the last full move any line of the chapter reaches. Mistakes counts the
        positions carrying authored wrong tries.
      </p>
    </section>
  )
}

function ErrorList({ errors }: { errors: ContentError[] }) {
  return (
    <ul className="status-errors">
      {errors.map((error, index) => (
        <li key={index} className="fail">
          <strong>{error.chapter}</strong> {error.message}
          {error.path ? <span className="status-path"> at {error.path}</span> : null}
        </li>
      ))}
    </ul>
  )
}
