import { chapterEntries } from '../content'
import { deepestFullMove, nodeCount, positionsWithMistakes } from '../model/loader'

/**
 * The phase 1 content status panel: one row per chapter file, with the numbers
 * that show whether the content is where it should be. Phase 2 moves this into
 * a dev-only diagnostics view once Study mode arrives.
 */
export function ContentStatus() {
  return (
    <section className="status">
      <h2>Content status</h2>
      <table>
        <thead>
          <tr>
            <th>Chapter</th>
            <th>Title</th>
            <th className="num">Nodes</th>
            <th className="num">Deepest</th>
            <th className="num">Mistakes</th>
            <th>Validation</th>
          </tr>
        </thead>
        <tbody>
          {chapterEntries.map((entry) => {
            const chapter = entry.chapter
            const first = entry.errors[0]
            return (
              <tr key={entry.source}>
                <td>{chapter?.id ?? entry.source}</td>
                <td>{chapter?.title ?? '-'}</td>
                <td className="num">{chapter ? nodeCount(chapter) : '-'}</td>
                <td className="num">{chapter ? `move ${deepestFullMove(chapter)}` : '-'}</td>
                <td className="num">{chapter ? positionsWithMistakes(chapter) : '-'}</td>
                <td className={chapter ? 'pass' : 'fail'}>
                  {chapter ? (
                    'PASS'
                  ) : (
                    <>
                      FAIL: {first?.message}
                      {first?.path ? <span className="status-path"> at {first.path}</span> : null}
                      {entry.errors.length > 1 ? (
                        <span className="status-path"> ({entry.errors.length} errors)</span>
                      ) : null}
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="status-note">
        Deepest is the last full move any line of the chapter reaches. Mistakes counts the
        positions carrying authored wrong tries.
      </p>
    </section>
  )
}
