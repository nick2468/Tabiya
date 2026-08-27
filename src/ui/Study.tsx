import { useCallback, useEffect, useMemo, useState } from 'react'
import Markdown from 'react-markdown'
import { Board } from './Board'
import { useProgress } from './progress-context'
import { chapters } from '../content'
import { chapterLines, fullMoveNumber, lineId, moveList } from '../model/lines'
import { nodeShapes } from '../model/shapes'
import type { LoadedChapter, LoadedNode } from '../model/types'
import type { PlayRequest } from './Play'
import './study.css'

/**
 * Study mode: walk a chapter line by line, with the note for every move.
 *
 * The current position is a chain of nodes from the tree root down. An empty
 * chain is the start of the chapter, at the end of its stem. Everything else -
 * the board, the note, the branch choices, the learnt toggle - is derived from
 * that chain, so there is only one piece of state to get right.
 */
export function Study({ onPlayFrom }: { onPlayFrom: (request: PlayRequest) => void }) {
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? '')
  const chapter = chapters.find((entry) => entry.id === chapterId) ?? chapters[0]

  if (!chapter) {
    return <p className="empty">No chapters loaded. Check the diagnostics view.</p>
  }

  return (
    <div className="study">
      <nav className="chapter-list" aria-label="Chapters">
        <h2>Chapters</h2>
        <ol>
          {chapters.map((entry, index) => (
            <li key={entry.id}>
              <button
                type="button"
                className={entry.id === chapter.id ? 'chapter-link current' : 'chapter-link'}
                aria-current={entry.id === chapter.id ? 'true' : undefined}
                onClick={() => setChapterId(entry.id)}
              >
                <span className="chapter-number">{index}</span>
                {entry.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <ChapterStudy key={chapter.id} chapter={chapter} onPlayFrom={onPlayFrom} />
    </div>
  )
}

function ChapterStudy({
  chapter,
  onPlayFrom,
}: {
  chapter: LoadedChapter
  onPlayFrom: (request: PlayRequest) => void
}) {
  const [chain, setChain] = useState<LoadedNode[]>([])
  const [introOpen, setIntroOpen] = useState(true)
  const { learnt, toggle } = useProgress()

  const current = chain.at(-1)
  const choices = current ? current.children : chapter.tree
  const lines = useMemo(() => chapterLines(chapter), [chapter])

  const goBack = useCallback(() => setChain((previous) => previous.slice(0, -1)), [])
  const goForward = useCallback(() => {
    setChain((previous) => {
      const next = (previous.at(-1)?.children ?? chapter.tree)[0]
      return next ? [...previous, next] : previous
    })
  }, [chapter])

  // Left and right arrows step through the line, the way a board viewer should.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === 'ArrowLeft') goBack()
      else if (event.key === 'ArrowRight') goForward()
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goBack, goForward])

  const fen = current?.fen ?? chapter.stemFen
  const shapes = useMemo(() => nodeShapes(current), [current])

  const atLine = current?.isLeaf ? lineId(chapter.id, current.path) : null
  const learntCount = lines.filter((line) => learnt(line.id)).length

  return (
    <section className="chapter">
      <header className="chapter-head">
        <h2>{chapter.title}</h2>
        <button type="button" className="link" onClick={() => setIntroOpen((open) => !open)}>
          {introOpen ? 'Hide the introduction' : 'Show the introduction'}
        </button>
      </header>

      {introOpen ? (
        <div className="intro">
          <Markdown>{chapter.intro}</Markdown>
        </div>
      ) : null}

      <div className="study-body">
        <div className="study-board">
          <Board fen={fen} shapes={shapes} lastMove={lastMove(current)} size={420} />
          <div className="study-controls">
            <button type="button" onClick={() => setChain([])} disabled={chain.length === 0}>
              Start
            </button>
            <button type="button" onClick={goBack} disabled={chain.length === 0}>
              Back
            </button>
            <button type="button" onClick={goForward} disabled={choices.length === 0}>
              Forward
            </button>
          </div>
          <p className="hint">The left and right arrow keys step through the line.</p>
        </div>

        <div className="study-side">
          <MoveTrail chapter={chapter} chain={chain} onJump={setChain} />

          {choices.length > 0 ? (
            <div className="choices">
              <h3>
                {current
                  ? 'Continue with'
                  : choices[0]?.colour === 'white'
                    ? 'White plays'
                    : 'Black plays'}
              </h3>
              <div className="choice-row">
                {choices.map((node) => (
                  <button
                    key={node.san}
                    type="button"
                    className="choice"
                    onClick={() => setChain((previous) => [...previous, node])}
                  >
                    {node.san}
                    {node.colour === 'black' && node.weight ? (
                      <span className="weight" title="How often this comes up at club level">
                        {node.weight}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <NotePanel chapter={chapter} node={current} />

          <div className="line-actions">
            <label className={atLine ? 'learnt-toggle' : 'learnt-toggle disabled'}>
              <input
                type="checkbox"
                disabled={!atLine}
                checked={atLine ? learnt(atLine) : false}
                onChange={() => atLine && toggle(atLine)}
              />
              I have learnt this line
            </label>
            {!atLine ? (
              <p className="hint">Play the line to its end to mark it learnt.</p>
            ) : null}
            <button
              type="button"
              className="play-from-here"
              onClick={() =>
                onPlayFrom({
                  fen,
                  moves: current ? current.path : chapter.stem,
                  chapterId: chapter.id,
                  label: current ? moveList(chain) : stemLabel(chapter),
                })
              }
            >
              Play from here
            </button>
          </div>
        </div>
      </div>

      <section className="lines">
        <h3>
          Lines in this chapter <span className="count">{learntCount} of {lines.length} learnt</span>
        </h3>
        <ul>
          {lines.map((line) => (
            <li key={line.id}>
              <label className="learnt-toggle">
                <input
                  type="checkbox"
                  checked={learnt(line.id)}
                  onChange={() => toggle(line.id)}
                />
              </label>
              <button type="button" className="line-link" onClick={() => setChain(line.nodes)}>
                {line.label}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}

/** The moves played so far, each one clickable to jump back to it. */
function MoveTrail({
  chapter,
  chain,
  onJump,
}: {
  chapter: LoadedChapter
  chain: LoadedNode[]
  onJump: (chain: LoadedNode[]) => void
}) {
  return (
    <div className="trail">
      <button
        type="button"
        className={chain.length === 0 ? 'trail-move current' : 'trail-move'}
        onClick={() => onJump([])}
      >
        {chapter.stem.length > 0 ? stemLabel(chapter) : 'Start'}
      </button>
      {chain.map((node, index) => (
        <button
          key={node.path.join(' ')}
          type="button"
          className={index === chain.length - 1 ? 'trail-move current' : 'trail-move'}
          onClick={() => onJump(chain.slice(0, index + 1))}
        >
          {node.colour === 'white'
            ? `${fullMoveNumber(node)}.${node.san}`
            : index === 0
              ? `${fullMoveNumber(node)}...${node.san}`
              : node.san}
        </button>
      ))}
    </div>
  )
}

/** The note for the current move, plus the plan when the line ends here. */
function NotePanel({ chapter, node }: { chapter: LoadedChapter; node: LoadedNode | undefined }) {
  if (!node) {
    return (
      <div className="note">
        <h3>The starting position</h3>
        <p>
          {chapter.stem.length > 0
            ? `This chapter starts after ${stemLabel(chapter)}. Pick a reply below to begin.`
            : 'Pick a move below to begin.'}
        </p>
      </div>
    )
  }

  return (
    <div className="note">
      <h3>
        {node.colour === 'white' ? 'White plays ' : 'Black plays '}
        {node.san}
      </h3>
      {node.note ? <p>{node.note}</p> : <p className="quiet">No note on this move.</p>}
      {node.isLeaf && node.plan ? (
        <>
          <h4>Your plan from here</h4>
          <p>{node.plan}</p>
        </>
      ) : null}
      {node.tags.length > 0 ? (
        <p className="tags">
          {node.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  )
}

/** "1.d4 d5 2.Bf4", the moves that lead into the chapter. */
function stemLabel(chapter: LoadedChapter): string {
  return chapter.stem
    .map((san, index) => (index % 2 === 0 ? `${index / 2 + 1}.${san}` : san))
    .join(' ')
}

/** The last move as a pair of squares, for the board's own highlight. */
function lastMove(node: LoadedNode | undefined): [string, string] | undefined {
  return node ? [node.from, node.to] : undefined
}
