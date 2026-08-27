import { useMemo, useRef, useState } from 'react'
import { useProgress } from './progress-context'
import { chapters } from '../content'
import { buildCards } from '../model/cards'
import { chapterProgress, conceptAccuracy, courseTotals } from '../model/stats'
import './progress.css'

/**
 * Progress: what has been done, and what is going badly. Plain numbers, no
 * badges, because the point is to help the trainee choose what to do next.
 */
export function Progress() {
  const { state, exportJson, importJson } = useProgress()

  const cards = useMemo(() => buildCards(chapters, state.learntLines).cards, [state.learntLines])
  const rows = useMemo(() => chapterProgress(chapters, state), [state])
  const concepts = useMemo(() => conceptAccuracy(cards, state), [cards, state])
  const totals = useMemo(() => courseTotals(chapters, cards, state), [cards, state])

  return (
    <div className="progress">
      <h2>Progress</h2>

      <p className="totals">
        <strong>{totals.learntLines}</strong> of {totals.totalLines} lines learnt.{' '}
        <strong>{totals.cards}</strong> {totals.cards === 1 ? 'card' : 'cards'},{' '}
        <strong>{totals.due}</strong> due now, {totals.fresh} never answered.
      </p>

      <section>
        <h3>Chapters</h3>
        <table>
          <thead>
            <tr>
              <th>Chapter</th>
              <th className="num">Learnt</th>
              <th className="num">Due</th>
              <th className="num">New</th>
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
      </section>

      <section>
        <h3>Concepts</h3>
        {concepts.length === 0 ? (
          <p className="hint">Nothing yet. Learn a line and drill it.</p>
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
        <p className="hint">
          Accuracy is the share of your last twenty answers on that concept that were the
          repertoire move. A playable alternative still counts as not recalled.
        </p>
      </section>

      <BackupSection exportJson={exportJson} importJson={importJson} />
    </div>
  )
}

/**
 * Export and import. This is the backup story, and in phase 5 it is also the
 * way progress moves from the browser into the wrapped Windows app.
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
    const text = await exportJson()
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'london-trainer-progress.json'
    link.click()
    URL.revokeObjectURL(url)
    setMessage({ kind: 'ok', text: 'Progress saved to your downloads folder.' })
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
      <div className="backup-actions">
        <button type="button" onClick={download}>
          Export progress
        </button>
        <button type="button" onClick={() => fileInput.current?.click()}>
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

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
