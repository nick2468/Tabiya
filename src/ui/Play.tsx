import { useCallback, useEffect, useMemo, useState } from 'react'
import { Board } from './Board'
import { HelpAsk, HelpSaid } from './Help'
import { usePlay } from './play-context'
import { useProgress } from './progress-context'

import { strengthProfile, allProfiles } from '../engine'
import { squaresForSan } from '../model/grade'
import { legalDests, sideToMove } from '../model/position'
import { colourName, type Colour, type LoadedCourse } from '../model/types'
import {
  GAME_LENGTHS,
  PlaySession,
  buildBook,
  clampPly,
  describeDeviation,
  describeSlip,
  evalBarLayout,
  evalShare,
  fullMove,
  gameToPgn,
  moveAtPly,
  plyBeforeMove,
  positionAtPly,
  shownEvaluation,
  verdictInWords,
  type GameLength,
  type GameReport,
  type PlayedMove,
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
 *
 * Once the report exists the screen becomes a VIEWER. Which position is being
 * looked at is held here and nowhere else: it is a way of looking at the game,
 * not part of it, and the session's moves must not move while somebody reads
 * them. Every position of a reviewed game is already in the evaluation map,
 * because the scan filled it, so the bar follows a replay without asking the
 * engine anything.
 */

/**
 * A request to play from a position.
 *
 * Study sends one from a position on its board. Progress sends one to carry on
 * a recorded game, and that kind brings more with it: the course to switch to,
 * the strength it was played at, its own identity, and the fact that it must
 * not be capped, because it has already run past any cap that would apply.
 */
export interface PlayRequest {
  fen: string
  moves: string[]
  chapterId: string
  label: string
  /** Set by a resumed game: keep the book inside the chapter it names. */
  chapterOnly?: boolean
  /** The course to open, when the request is not for the one showing. */
  courseId?: string
  /** The strength a resumed game was played at. */
  level?: number
  /** A resumed game keeps the record's identity, so one game stays one game. */
  at?: string
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
  // Which position of a reviewed game is showing, as a count of moves played,
  // and WHICH report it belongs to. Holding the report alongside is what puts
  // the viewer back at the end when a new one arrives: an effect watching the
  // report would leave one render showing the old ply against the new game.
  const [replay, setReplay] = useState<{ of: GameReport | null; ply: number }>({
    of: null,
    ply: 0,
  })

  useEffect(() => {
    if (request) setLaunch('here')
  }, [request])

  // A resumed game arrives with its own strength and no cap. Both are set on
  // the screen rather than applied behind it, so the options say what is about
  // to happen and can still be changed.
  useEffect(() => {
    if (request?.level !== undefined) setLevel(request.level)
    if (request?.at !== undefined) setLength('full')
  }, [request])

  // The chapter a resumed game was sparring against, when it names one, so
  // the opponent is steered the way it was steered the first time.
  const resumeChapter = launch === 'here' && request?.chapterOnly ? request.chapterId : null
  const targetChapter = launch === 'chapter' ? chapterId : resumeChapter

  const book = useMemo(() => {
    if (targetChapter) {
      const chapter = chapters.find((entry) => entry.id === targetChapter)
      return buildBook({ colour: course.colour, chapters: chapter ? [chapter] : [] })
    }
    return buildBook({ colour: course.colour, chapters })
  }, [chapters, course.colour, targetChapter])

  const start = async () => {
    await game.start({
      courseId: course.id,
      courseTitle: course.title,
      book,
      length,
      level,
      startMoves: launch === 'here' && request ? request.moves : [],
      chapterId: targetChapter ?? undefined,
      chapterTitle: targetChapter
        ? chapters.find((entry) => entry.id === targetChapter)?.title
        : undefined,
      at: launch === 'here' ? request?.at : undefined,
    })
    if (launch === 'here') onRequestUsed()
  }

  const { session, report, scanning, thinking, engineError, evaluations } = game
  const playBook = game.book ?? book

  // The game ends by itself on mate or the length cap.
  const finished = session?.isFinished() ?? false

  const moves = useMemo(() => session?.moves ?? [], [session])
  const atEnd = moves.length
  // A report nobody has walked yet shows its end, which is the final position.
  const ply = replay.of === report && report !== null ? replay.ply : atEnd
  const step = useCallback(
    (to: number) => setReplay({ of: report, ply: clampPly(moves, to) }),
    [moves, report],
  )

  // The arrows only listen while a report is showing. Study puts the same
  // handler on the window, and two screens fighting over one key is the sort
  // of thing that works until the day both are mounted.
  useEffect(() => {
    if (!report) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === 'ArrowLeft') step(ply - 1)
      else if (event.key === 'ArrowRight') step(ply + 1)
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ply, report, step])

  // What the board is actually showing. During a game it is the game; during a
  // review it is wherever the reader has walked to, which is the same position
  // whenever they have not walked anywhere.
  // The game as text, built once per report rather than per keystroke.
  const pgn = useMemo(() => {
    if (!report || !session) return ''
    return gameToPgn({
      moves: session.moves,
      report,
      courseTitle: game.courseTitle ?? 'Repertoire Trainer',
      studentColour: session.studentColour,
      level: game.level ?? 0,
      at: game.recordedAt ?? new Date().toISOString(),
    })
  }, [game.courseTitle, game.level, game.recordedAt, report, session])

  const replayed = report ? positionAtPly(moves, ply) : null
  const shown = replayed ?? session?.fen ?? ''
  const highlight = report
    ? squaresOf(moveAtPly(moves, ply))
    : squaresOf(session?.moves.at(-1) ?? null)

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
        canResume={game.canResume}
        onUndo={game.undo}
        onRedo={game.redo}
        onResume={game.resume}
        onNew={game.reset}
      />

      <div className="play-body">
        {/* One box for the bar and the board, so the bar is stretched to the
            board's own height rather than given a height of its own. Nick saw
            it a few pixels long at the bottom, which reads as a touch better
            for Black than the number is. */}
        <div className="play-board">
          <LiveEvalBar
            pawns={shownEvaluation(shown, session.moves, evaluations)}
            studentColour={session.studentColour}
          />

          <Board
            fen={shown}
            orientation={session.studentColour}
            turnColor={sideToMove(shown)}
            movableColor={finished || thinking || report ? undefined : session.studentColour}
            dests={finished || thinking || report ? undefined : legalDests(session.fen)}
            lastMove={highlight}
            onMove={game.play}
            size={420}
          />
        </div>

        <div className="play-side">
          <MoveList session={session} activePly={report ? ply : null} onSelect={step} />

          {report ? (
            <Report
              report={report}
              opponentColour={playBook.opponentColour}
              pgn={pgn}
              replay={{
                ply,
                count: atEnd,
                onJump: (movePly: number) => step(plyBeforeMove(movePly)),
                onBack: () => step(ply - 1),
                onForward: () => step(ply + 1),
              }}
            />
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
 * exists. Keep playing is what brings them back: a reviewed game that merely
 * stopped can be carried on, and one that ended in a checkmate or a draw
 * cannot, so the button is not there to be pressed.
 */
export function PlayHead({
  session,
  opening,
  opponentColour,
  thinking,
  reviewed,
  canResume,
  onUndo,
  onRedo,
  onResume,
  onNew,
}: {
  session: PlaySession
  opening: string | null
  opponentColour: Colour
  thinking: boolean
  reviewed: boolean
  canResume: boolean
  onUndo: () => void
  onRedo: () => void
  onResume: () => void
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
        {canResume ? (
          <button type="button" className="link" onClick={onResume}>
            Keep playing
          </button>
        ) : null}
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

/**
 * The moves of the game, and once it has been reviewed, a way into them.
 *
 * `activePly` is null during a game: the list is a record then, and a move
 * that jumped the board mid-game would be a control that undoes without
 * saying so. After the review every move is a button, and the one the board
 * is standing on is marked.
 */
function MoveList({
  session,
  activePly,
  onSelect,
}: {
  session: PlaySession
  activePly: number | null
  onSelect: (ply: number) => void
}) {
  const pairs: {
    number: number
    white?: { san: string; ply: number }
    black?: { san: string; ply: number }
  }[] = []
  for (const move of session.moves) {
    const number = fullMove(move.ply)
    const held = pairs.find((pair) => pair.number === number)
    const target = held ?? { number }
    const entry = { san: move.san, ply: move.ply }
    if (move.colour === 'white') target.white = entry
    else target.black = entry
    if (!held) pairs.push(target)
  }

  // The position after a move is that move's ply plus one, which is what the
  // list is pointing at: click a move and see what it did.
  const cell = (entry: { san: string; ply: number } | undefined, blank: string) => {
    if (!entry) return <span>{blank}</span>
    if (activePly === null) return <span>{entry.san}</span>
    const here = activePly === entry.ply + 1
    return (
      <button
        type="button"
        className={here ? 'move-step here' : 'move-step'}
        aria-current={here ? 'true' : undefined}
        onClick={() => onSelect(entry.ply + 1)}
      >
        {entry.san}
      </button>
    )
  }

  return (
    <ol className={activePly === null ? 'move-list' : 'move-list walkable'}>
      {pairs.map((pair) => (
        <li key={pair.number}>
          <span className="move-number">{pair.number}.</span>
          {cell(pair.white, '...')}
          {cell(pair.black, '')}
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
export interface ReplayControls {
  /** Which position is showing, as a count of moves played. */
  ply: number
  /** How many moves the game has, which is the last position. */
  count: number
  /** Put the board where this move was played FROM. */
  onJump: (movePly: number) => void
  onBack: () => void
  onForward: () => void
}

export function Report({
  report,
  opponentColour,
  pgn,
  replay,
}: {
  report: GameReport
  opponentColour: Colour
  /** The whole game as text, for the copy button. */
  pgn: string
  replay: ReplayControls
}) {
  const deviationPly = report.deviation.ply
  return (
    <div className="report">
      <header className="report-head">
        <h3>The report</h3>
        {/* An arrow is not a name, so each one carries a written one for a
            screen reader and for the tooltip, the same as Study's. */}
        <div className="report-steps">
          <button
            type="button"
            className="step-arrow"
            onClick={replay.onBack}
            disabled={replay.ply === 0}
            aria-label="Back one move"
            title="Back one move"
          >
            &#8592;
          </button>
          <button
            type="button"
            className="step-arrow"
            onClick={replay.onForward}
            disabled={replay.ply >= replay.count}
            aria-label="Forward one move"
            title="Forward one move"
          >
            &#8594;
          </button>
        </div>
      </header>

      <h4>The repertoire</h4>
      {deviationPly === undefined ? (
        <p>{describeDeviation(report.deviation, opponentColour)}</p>
      ) : (
        <p>
          <button
            type="button"
            className="jump"
            onClick={() => replay.onJump(deviationPly)}
          >
            {describeDeviation(report.deviation, opponentColour)}
          </button>
        </p>
      )}
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
              <button type="button" className="jump" onClick={() => replay.onJump(slip.ply)}>
                {describeSlip(slip)}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h4>The final position</h4>
      <p>{report.verdict}</p>
      {report.finalEval !== undefined ? <EvalBar pawns={report.finalEval} /> : null}
      {report.outcome ? <p className="hint">{report.outcome}</p> : null}

      <CopyGame text={pgn} />
    </div>
  )
}

/**
 * The game on the clipboard, as PGN with the report written in.
 *
 * The point is that a game can leave this app as text: pasted into a chat, a
 * file, or another engine, and played through by whoever reads it. A
 * screenshot was the only way before, and nobody can replay a screenshot.
 *
 * The same `navigator.clipboard` in both builds. The installed app is WebView2
 * and has it, which is why there is no Tauri plugin here; a failure says so
 * rather than leaving a button that looks as though it worked.
 */
function CopyGame({ text }: { text: string }) {
  const [said, setSaid] = useState<string | null>(null)

  useEffect(() => {
    if (said === null) return
    const timer = setTimeout(() => setSaid(null), 2500)
    return () => clearTimeout(timer)
  }, [said])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setSaid('Copied')
    } catch (error) {
      setSaid(`That could not be copied: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="copy-game">
      <button type="button" onClick={() => void copy()}>
        Copy game
      </button>
      {said ? <span className="hint">{said}</span> : null}
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

/** The two squares of a move, for the board's highlight. */
function squaresOf(move: PlayedMove | null): [string, string] | undefined {
  if (!move) return undefined
  const squares = squaresForSan(move.fen, move.san)
  return squares ? [squares.from, squares.to] : undefined
}
