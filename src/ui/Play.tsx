import { useEffect, useMemo, useState } from 'react'
import { Board } from './Board'
import { HelpAsk, HelpSaid } from './Help'
import { usePlay } from './play-context'
import { useProgress } from './progress-context'

import { strengthProfile, allProfiles } from '../engine'
import { squaresForSan } from '../model/grade'
import { legalDests } from '../model/position'
import { colourName, type Colour, type LoadedCourse } from '../model/types'
import {
  GAME_LENGTHS,
  PlaySession,
  buildBook,
  describeDeviation,
  describeSlip,
  evalBarLayout,
  evalShare,
  fullMove,
  shownEvaluation,
  verdictInWords,
  type GameLength,
  type GameReport,
} from '../play'
import './play.css'

/**
 * Play: a game against the engine, steered into the repertoire.
 *
 * A bar to the left of the board shows what the engine makes of the position
 * while the game is going. That reverses the v1 ruling, which called a live
 * bar a crutch; the reversal and its reason are logged in SPEC.md section 8.
 * Nick asked for it after a day of playing, and the v1 ruling was made before
 * anyone had played a game in the app at all.
 *
 * The number is the engine's, at full strength, whatever the game is being
 * played at: after every move the engine is set to the scan's own profile,
 * asked about the new position, and set back before the opponent thinks. It is
 * deliberately NOT read off the opponent's own search, which at levels 4 to 8
 * is a weakened engine's opinion and at levels 1 to 3 is a glance at several
 * candidates. That number would be a lie in the shape of an evaluation.
 *
 * Every evaluation is kept and handed to the scan at the end, so the report
 * judges the game by the exact numbers the trainee watched.
 *
 * The game itself is NOT here. It lives in `play-context.tsx`, above every
 * screen, because this component unmounts whenever the view changes and a
 * game that dies when you glance at Study is not a game. This file is the
 * screen: the options before a game, the board and the report during and
 * after one.
 */

/** A request to play from a position, sent over from Study. */
export interface PlayRequest {
  fen: string
  moves: string[]
  chapterId: string
  label: string
}

type Shape_ = 'any' | 'chapter' | 'here'

export function Play({
  course,
  request,
  onRequestUsed,
}: {
  course: LoadedCourse
  request: PlayRequest | null
  onRequestUsed: () => void
}) {
  const { state } = useProgress()
  const game = usePlay()
  const chapters = course.chapters
  const [launch, setLaunch] = useState<Shape_>(request ? 'here' : 'any')
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? '')
  const [length, setLength] = useState<GameLength>('move15')
  const [level, setLevel] = useState(4)
  // "This chapter's line" is the one people misread here, so the launch
  // options carry the screen's only `?`.
  const [askLaunch, setAskLaunch] = useState(false)

  useEffect(() => {
    if (request) setLaunch('here')
  }, [request])

  const book = useMemo(() => {
    if (launch === 'chapter') {
      const chapter = chapters.find((entry) => entry.id === chapterId)
      return buildBook({ colour: course.colour, chapters: chapter ? [chapter] : [] })
    }
    return buildBook({ colour: course.colour, chapters })
  }, [chapters, course.colour, launch, chapterId])

  const start = async () => {
    await game.start({
      courseId: course.id,
      courseTitle: course.title,
      book,
      length,
      level,
      startMoves: launch === 'here' && request ? request.moves : [],
      chapterId: launch === 'chapter' ? chapterId : undefined,
      chapterTitle:
        launch === 'chapter' ? chapters.find((entry) => entry.id === chapterId)?.title : undefined,
    })
    if (launch === 'here') onRequestUsed()
  }

  const { session, report, scanning, thinking, engineError, evaluations } = game
  const playBook = game.book ?? book

  // The game ends by itself on mate or the length cap.
  const finished = session?.isFinished() ?? false

  if (!session) {
    return (
      <div className="play">
        <h2>Play</h2>
        <p className="play-intro">
          A game against Stockfish as {colourName(course.colour)}, with your opponent
          steered into the lines you have studied. A bar beside the board shows what the
          engine makes of the position as you go, at full strength whatever you chose to
          play against, and the report afterwards is built from the same numbers.
        </p>

        <fieldset>
          {/* The button goes in the legend, beside the words it explains. The
              panel does not: a legend is read out again for every radio under
              it, and three sentences read six times is worse than no help. */}
          <legend>
            Who you are playing
            <HelpAsk panel="play-launch" open={askLaunch} onToggle={setAskLaunch} />
          </legend>
          <HelpSaid panel="play-launch" open={askLaunch} />
          <label>
            <input
              type="radio"
              checked={launch === 'any'}
              onChange={() => setLaunch('any')}
            />
            Any line
          </label>
          <label>
            <input
              type="radio"
              checked={launch === 'chapter'}
              onChange={() => setLaunch('chapter')}
            />
            This chapter's line
          </label>
          {launch === 'chapter' ? (
            <select value={chapterId} onChange={(event) => setChapterId(event.target.value)}>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.title}
                </option>
              ))}
            </select>
          ) : null}
          <label className={request ? '' : 'disabled'}>
            <input
              type="radio"
              disabled={!request}
              checked={launch === 'here'}
              onChange={() => setLaunch('here')}
            />
            {request ? `From ${request.label}` : 'From a Study position (start one from Study)'}
          </label>
        </fieldset>

        <fieldset>
          <legend>How long</legend>
          {GAME_LENGTHS.map((entry) => (
            <label key={entry.value}>
              <input
                type="radio"
                checked={length === entry.value}
                onChange={() => setLength(entry.value)}
              />
              {entry.label}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>How strong</legend>
          <select value={level} onChange={(event) => setLevel(Number(event.target.value))}>
            {allProfiles().map((profile) => (
              <option key={profile.level} value={profile.level}>
                {profile.level}. {profile.label}
              </option>
            ))}
          </select>
          <p className="hint">{strengthProfile(level).detail}</p>
          <p className="hint">
            The numbers on levels 4 and up are the engine's own scale, not an online
            rating.
          </p>
        </fieldset>

        {engineError ? <p className="notice bad">{engineError}</p> : null}
        <button type="button" className="primary" onClick={start} disabled={thinking}>
          {thinking ? 'Starting the engine...' : 'Start the game'}
        </button>
        {state.playGames.length > 0 ? (
          <p className="hint">
            {state.playGames.length} {state.playGames.length === 1 ? 'game' : 'games'} played
            so far. Progress has the numbers.
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="play">
      <PlayHead
        session={session}
        opening={openingLine(game.courseTitle, game.chapterTitle)}
        opponentColour={playBook.opponentColour}
        thinking={thinking}
        reviewed={report !== null}
        onUndo={game.undo}
        onRedo={game.redo}
        onNew={game.reset}
      />

      <div className="play-body">
        <LiveEvalBar
          pawns={shownEvaluation(session.fen, session.moves, evaluations)}
          studentColour={session.studentColour}
        />

        <Board
          fen={session.fen}
          orientation={session.studentColour}
          turnColor={session.sideToMove}
          movableColor={finished || thinking || report ? undefined : session.studentColour}
          dests={finished || thinking || report ? undefined : legalDests(session.fen)}
          lastMove={lastMoveSquares(session)}
          onMove={game.play}
          size={420}
        />

        <div className="play-side">
          <MoveList session={session} />

          {report ? (
            <Report report={report} opponentColour={playBook.opponentColour} />
          ) : (
            <PlayActions
              session={session}
              scanning={scanning}
              thinking={thinking}
              engineError={engineError}
              onExtend={game.extend}
              onFinish={game.finish}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * What the game is, in one line: the course it was started in, and the chapter
 * it is sparring against when it has one.
 *
 * It is here because the Course dropdown no longer waits for the game. A game
 * belongs to the course it was started in and is judged against that course's
 * repertoire, so with the header free to name another one, the game has to say
 * which it is. The titles come from the game itself, captured when it started.
 */
function openingLine(
  courseTitle: string | null,
  chapterTitle: string | null,
): string | null {
  if (!courseTitle) return null
  return chapterTitle
    ? `Opening: ${courseTitle}, sparring against ${chapterTitle}`
    : `Opening: ${courseTitle}`
}

/**
 * The header over a game in progress: what it is, where it is up to, and the
 * three things you can do to it.
 *
 * A component rather than markup inside the screen, because the help names
 * Undo and Redo and the help test walks the START screen. A control the test
 * cannot reach is a control the help can start lying about, so this takes a
 * session and the test builds one on the fake engine.
 *
 * Undo and Redo go dead while the engine is thinking and once the report
 * exists. A reviewed game is finished, and New game is the way on from it.
 */
export function PlayHead({
  session,
  opening,
  opponentColour,
  thinking,
  reviewed,
  onUndo,
  onRedo,
  onNew,
}: {
  session: PlaySession
  opening: string | null
  opponentColour: Colour
  thinking: boolean
  reviewed: boolean
  onUndo: () => void
  onRedo: () => void
  onNew: () => void
}) {
  const finished = session.isFinished()
  const frozen = thinking || reviewed
  return (
    <header className="play-head">
      <h2>Play</h2>
      {opening ? <p className="play-opening">{opening}</p> : null}
      <p className="play-status">
        {reviewed
          ? 'Game reviewed'
          : finished
            ? session.outcome ?? 'Game over'
            : thinking
              ? `${colourName(opponentColour)} is thinking...`
              : 'Your move'}
      </p>
      <div className="play-head-actions">
        <button
          type="button"
          className="link"
          onClick={onUndo}
          disabled={frozen || !session.canUndo()}
        >
          Undo
        </button>
        <button
          type="button"
          className="link"
          onClick={onRedo}
          disabled={frozen || !session.canRedo()}
        >
          Redo
        </button>
        <button type="button" className="link" onClick={onNew}>
          New game
        </button>
      </div>
    </header>
  )
}

/**
 * What you can do with a game that is not yet a report: review it, and, when
 * it stopped only because it ran out of length, carry it on.
 *
 * The two extend buttons appear only for a game finished BY THE CAP. A game
 * that ended in a checkmate has nowhere to carry on to, and offering the
 * button anyway would be a control that does nothing.
 *
 * A component rather than markup inside the screen, for the same reason the
 * header is one: the help names both buttons and the help test walks the
 * start screen, so it needs something it can render with a finished session.
 */
export function PlayActions({
  session,
  scanning,
  thinking,
  engineError,
  onExtend,
  onFinish,
}: {
  session: PlaySession
  scanning: { done: number; total: number } | null
  thinking: boolean
  engineError: string | null
  onExtend: (by: 5 | 'full') => void
  onFinish: () => void
}) {
  const finished = session.isFinished()
  const capped = session.finishedByCap()
  return (
    <div className="play-actions">
      {finished ? (
        <p className="notice">
          {session.outcome ?? 'The game has reached its length.'} Review it to see where
          you left the repertoire and what it cost.
        </p>
      ) : null}
      {capped ? (
        <div className="play-extend">
          <button type="button" onClick={() => onExtend(5)} disabled={thinking}>
            Play 5 more moves
          </button>
          <button type="button" onClick={() => onExtend('full')} disabled={thinking}>
            Play to the end
          </button>
        </div>
      ) : null}
      <button type="button" className="primary" onClick={onFinish} disabled={thinking}>
        {scanning
          ? `Scanning ${scanning.done} of ${scanning.total}...`
          : finished
            ? 'Review the game'
            : 'Stop and review'}
      </button>
      {engineError ? <p className="notice bad">{engineError}</p> : null}
    </div>
  )
}

function MoveList({ session }: { session: PlaySession }) {
  const pairs: { number: number; white?: string; black?: string }[] = []
  for (const move of session.moves) {
    const number = fullMove(move.ply)
    const held = pairs.find((pair) => pair.number === number)
    const target = held ?? { number }
    if (move.colour === 'white') target.white = move.san
    else target.black = move.san
    if (!held) pairs.push(target)
  }

  return (
    <ol className="move-list">
      {pairs.map((pair) => (
        <li key={pair.number}>
          <span className="move-number">{pair.number}.</span>
          <span>{pair.white ?? '...'}</span>
          <span>{pair.black ?? ''}</span>
        </li>
      ))}
    </ol>
  )
}

/**
 * The report, after the game.
 *
 * Exported for the help test, which holds its three headings the same way it
 * holds every other control the help names. That closes the phase 21 register
 * item: the report could not be reached from a test that renders to a string,
 * because it only exists once a game has been played and scanned.
 */
export function Report({
  report,
  opponentColour,
}: {
  report: GameReport
  opponentColour: Colour
}) {
  return (
    <div className="report">
      <h3>The report</h3>

      <h4>The repertoire</h4>
      <p>{describeDeviation(report.deviation, opponentColour)}</p>
      {report.deviation.kind === 'student-left-book' && report.deviation.note ? (
        <p className="book-note">
          <strong>{report.deviation.label}</strong> {report.deviation.note}
        </p>
      ) : null}

      <h4>Your moves</h4>
      {report.slips.length === 0 ? (
        <p>Nothing the engine calls an inaccuracy or worse. Well played.</p>
      ) : (
        <ul className="slips">
          {report.slips.map((slip) => (
            <li key={slip.ply} className={slip.tag}>
              {describeSlip(slip)}
            </li>
          ))}
        </ul>
      )}

      <h4>The final position</h4>
      <p>{report.verdict}</p>
      {report.finalEval !== undefined ? <EvalBar pawns={report.finalEval} /> : null}
      {report.outcome ? <p className="hint">{report.outcome}</p> : null}
    </div>
  )
}

/**
 * The bar beside the board, while the game is going.
 *
 * Vertical and board height, so it reads as the board's own margin rather
 * than as a widget. It follows the board's orientation: the trainee's colour
 * is at the bottom of it whichever colour they are playing, so a bar growing
 * towards them always means the same thing.
 *
 * No number on it, which is the part of the v1 ruling that survives. The
 * accessible name is the report's own words.
 */
function LiveEvalBar({
  pawns,
  studentColour,
}: {
  pawns: number | undefined
  studentColour: Colour
}) {
  const layout = evalBarLayout(pawns ?? 0, studentColour)
  return (
    <div
      className="live-eval"
      role="img"
      aria-label={
        pawns === undefined
          ? 'Evaluation: the engine has not looked yet'
          : `Evaluation: ${verdictInWords(pawns).toLowerCase()}`
      }
    >
      <div
        className="live-eval-white"
        style={{
          height: `${layout.whiteShare}%`,
          top: layout.whiteAtBottom ? 'auto' : 0,
          bottom: layout.whiteAtBottom ? 0 : 'auto',
        }}
      />
    </div>
  )
}

/** The report's own bar: the final position, horizontal, under the verdict. */
function EvalBar({ pawns }: { pawns: number }) {
  const share = evalShare(pawns)
  return (
    <div
      className="eval-bar"
      role="img"
      aria-label={`Evaluation: ${verdictInWords(pawns).toLowerCase()}`}
    >
      <div className="eval-white" style={{ width: `${share}%` }} />
    </div>
  )
}

function lastMoveSquares(session: PlaySession): [string, string] | undefined {
  const last = session.moves.at(-1)
  if (!last) return undefined
  const squares = squaresForSan(last.fen, last.san)
  return squares ? [squares.from, squares.to] : undefined
}
