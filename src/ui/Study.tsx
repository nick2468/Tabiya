import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Prose } from './Prose'
import { Board } from './Board'
import { useProgress } from './progress-context'
import { activeLineIndex, nextOnLine, walkedOn } from './study-lines'
import { splitIntro } from '../model/intro'
import { chapterLines, fullMoveNumber, moveList, moveTexts } from '../model/lines'
import { nodeShapes } from '../model/shapes'
import type { Line } from '../model/lines'
import type { LoadedChapter, LoadedCourse, LoadedNode } from '../model/types'
import type { PlayRequest } from './Play'
import './study.css'

/**
 * Study mode: walk a chapter line by line, with the note for every move.
 *
 * Study happens inside one course, which the shell chose. The chapter list is
 * that course's, in course order.
 *
 * The current position is a chain of nodes from the tree root down. An empty
 * chain is the start of the chapter, at the end of its stem. The board, the
 * note and the branch choices are all derived from that chain.
 *
 * The one other piece of state is which line the trainee CHOSE in the table
 * below. The highlighted line is derived from the two together, in
 * `study-lines.ts`. Rebuilt at phase 13, after Nick opened the London for the
 * first time and could not tell what the screen wanted him to do.
 */
export function Study({
  course,
  onPlayFrom,
}: {
  course: LoadedCourse
  onPlayFrom: (request: PlayRequest) => void
}) {
  const chapters = course.chapters
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? '')
  const chapter = chapters.find((entry) => entry.id === chapterId) ?? chapters[0]

  if (!chapter) {
    return <p className="empty">This course has no chapters. Check the diagnostics view.</p>
  }

  return (
    <div className="study">
      {/* The word "Chapters" was here as an aria-label, so a screen reader was
          told what this list is and a sighted reader was not. Play and
          Progress both use the word, which made it vocabulary the app used
          twice and showed nowhere. One visible label is worth a paragraph of
          help. */}
      <nav className="chapter-list" aria-labelledby="chapter-list-label">
        <h2>{course.title}</h2>
        <h3 id="chapter-list-label" className="chapter-list-label">
          Chapters
        </h3>
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
      <ChapterStudy
        key={chapter.id}
        course={course}
        chapter={chapter}
        onPlayFrom={onPlayFrom}
      />
    </div>
  )
}

/** One move every 850 ms: slow enough to read the note, fast enough to watch. */
const STEP_MS = 850

/**
 * The board's edge in CSS pixels.
 *
 * The chapter publishes it as a custom property because two things outside the
 * board are measured from it: the column beside the board starts one gap to its
 * right, and the lines header lines its button up with that column. One number,
 * read by the board and by the stylesheet, so they cannot drift apart.
 */
const BOARD_SIZE = 384

function ChapterStudy({
  course,
  chapter,
  onPlayFrom,
}: {
  course: LoadedCourse
  chapter: LoadedChapter
  onPlayFrom: (request: PlayRequest) => void
}) {
  const [chain, setChain] = useState<LoadedNode[]>([])
  const [chosen, setChosen] = useState(0)
  const [stepping, setStepping] = useState(false)
  const { learnt, toggle } = useProgress()

  const current = chain.at(-1)
  const choices = current ? current.children : chapter.tree
  const lines = useMemo(() => chapterLines(chapter), [chapter])
  const intro = useMemo(() => splitIntro(chapter.intro), [chapter])

  const active = activeLineIndex(lines, chain, chosen)
  const next = nextOnLine(lines, chain, chosen)

  // Every manual step stops the automatic one. Nothing is more confusing than
  // a board that keeps moving after you have taken hold of it.
  const stop = useCallback(() => setStepping(false), [])
  const goBack = useCallback(() => {
    stop()
    setChain((previous) => previous.slice(0, -1))
  }, [stop])
  // Forward follows the CHOSEN line, not the first child. The two used to
  // disagree, so pressing Forward after picking a row walked off into a
  // different line without saying so.
  const goForward = useCallback(() => {
    stop()
    setChain((previous) => {
      const step = nextOnLine(lines, previous, chosen)
      return step ? [...previous, step] : previous
    })
  }, [stop, lines, chosen])

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

  // Auto step, one timer per move rather than one interval: the effect reruns
  // after each step, so it always reads the line the board is actually on, and
  // it turns itself off as the last move lands rather than a beat later.
  useEffect(() => {
    if (!stepping || !next) return
    const last = chain.length + 1 === lines[active]?.nodes.length
    const timer = setTimeout(() => {
      setChain((previous) => [...previous, next])
      if (last) setStepping(false)
    }, STEP_MS)
    return () => clearTimeout(timer)
  }, [stepping, next, chain, lines, active])

  const jump = useCallback(
    (to: LoadedNode[]) => {
      stop()
      setChain(to)
    },
    [stop],
  )

  /**
   * Clicking a row is a restart on that line: the board goes back to the top of
   * the chapter and that row becomes the chosen one, wherever you were. Nick
   * ruled this against a version that kept whatever the two lines shared, which
   * saved a few clicks and cost a rule nobody could predict from the screen.
   */
  const pickLine = useCallback(
    (index: number) => {
      stop()
      setChain([])
      setChosen(index)
    },
    [stop],
  )

  const fen = current?.fen ?? chapter.stemFen
  const shapes = useMemo(() => nodeShapes(current), [current])
  const learntCount = lines.filter((line) => learnt(line.id)).length

  return (
    <section className="chapter" style={{ '--board-size': `${BOARD_SIZE}px` } as CSSProperties}>
      <header className="chapter-head">
        <h2>{chapter.title}</h2>
      </header>

      <div className="intro-lead">
        <Prose>{intro.lead}</Prose>
      </div>

      <div className="study-body">
        <div className="study-board">
          {/* The board faces the side the course teaches. */}
          <Board
            fen={fen}
            orientation={course.colour}
            shapes={shapes}
            lastMove={lastMove(current)}
            size={BOARD_SIZE}
          />
          <div className="study-controls">
            <button type="button" onClick={() => jump([])} disabled={chain.length === 0}>
              Reset
            </button>
            {/* An arrow is not a name, so each one carries a written one for a
                screen reader and for the tooltip. */}
            <button
              type="button"
              className="step-arrow"
              onClick={goBack}
              disabled={chain.length === 0}
              aria-label="Back one move"
              title="Back one move"
            >
              &#8592;
            </button>
            <button
              type="button"
              className="step-arrow"
              onClick={goForward}
              disabled={!next}
              aria-label="Forward one move"
              title="Forward one move"
            >
              &#8594;
            </button>
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
          <p className="hint">The left and right arrow keys step through the line.</p>
        </div>

        <div className="study-side">
          <MoveTrail chapter={chapter} chain={chain} onJump={jump} />

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
                    onClick={() => jump([...chain, node])}
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
        </div>
      </div>

      <LinesTable
        lines={lines}
        chain={chain}
        active={active}
        learntCount={learntCount}
        stepping={stepping}
        canStep={next !== undefined}
        isLearnt={learnt}
        onToggle={toggle}
        onPick={pickLine}
        onStep={() => setStepping((running) => !running)}
      />

      <hr className="study-separator" />

      <div className="chapter-detail">
        {intro.rest ? (
          <div className="intro-detail">
            <Prose>{intro.rest}</Prose>
          </div>
        ) : null}
      </div>
    </section>
  )
}

/**
 * The chapter's lines, by name.
 *
 * This table is the only thing on the screen that creates a drill card, so it
 * sits above the chapter prose rather than under it, and it says what it is
 * doing: the name column tells the lines apart, the moves column doubles as a
 * progress bar for the highlighted one, and the tick is what feeds Drill.
 *
 * Exported because it is the whole of what phase 13 changed and it takes every
 * input as a prop, so a test can render it without a store behind it.
 */
export function LinesTable({
  lines,
  chain,
  active,
  learntCount,
  stepping,
  canStep,
  isLearnt,
  onToggle,
  onPick,
  onStep,
}: {
  lines: Line[]
  chain: LoadedNode[]
  active: number
  learntCount: number
  stepping: boolean
  canStep: boolean
  isLearnt: (id: string) => boolean
  onToggle: (id: string) => void
  onPick: (index: number) => void
  onStep: () => void
}) {
  return (
    <section className="lines">
      <div className="lines-head">
        <h3>
          Lines in this chapter{' '}
          <span className="count">
            {learntCount} of {lines.length} learnt
          </span>
        </h3>
        <button type="button" className="auto-step" onClick={onStep} disabled={!canStep}>
          {stepping ? 'Stop stepping' : 'Auto step this line'}
        </button>
      </div>
      <div className="lines-table">
        <table>
          <thead>
            <tr>
              <th scope="col">Line</th>
              <th scope="col">Moves</th>
              <th scope="col" className="tick-head">
                Learnt
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const walked = index === active ? walkedOn(line, chain) : 0
              return (
                <tr
                  key={line.id}
                  className={index === active ? 'active' : undefined}
                  onClick={() => onPick(index)}
                >
                  <td className="line-name">
                    {/* The whole row is the target, and the button is how a
                        keyboard reaches it. */}
                    <button type="button" className="line-link" onClick={() => onPick(index)}>
                      {line.name}
                    </button>
                  </td>
                  <td className="line-moves">
                    {moveTexts(line.nodes).map((text, at) => (
                      <span key={text + at} className={at < walked ? 'walked' : undefined}>
                        {text}{' '}
                      </span>
                    ))}
                  </td>
                  {/* Ticking a line must not also restart the board on it. */}
                  <td className="tick-cell" onClick={(event) => event.stopPropagation()}>
                    <label className="learnt-toggle">
                      <input
                        type="checkbox"
                        checked={isLearnt(line.id)}
                        onChange={() => onToggle(line.id)}
                        aria-label={`I have learnt ${line.name}`}
                      />
                    </label>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
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
            ? `This chapter starts after ${stemLabel(chapter)}. Pick a reply above, or auto step a line from the table below.`
            : 'Pick a move above, or auto step a line from the table below.'}
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
