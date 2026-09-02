import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Board } from './Board'
import { HelpAsk, HelpSaid } from './Help'
import { useProgress } from './progress-context'

import {
  StockfishEngine,
  strengthProfile,
  allProfiles,
  whitePovPawns,
  type Engine,
} from '../engine'
import { sanForMove, squaresForSan } from '../model/grade'
import { legalDests, positionKey } from '../model/position'
import { colourName, type Colour, type LoadedCourse } from '../model/types'
import {
  GAME_LENGTHS,
  PlaySession,
  buildBook,
  buildReport,
  describeDeviation,
  describeSlip,
  evalBarLayout,
  evalShare,
  fullMove,
  scanGame,
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
 */

/** A request to play from a position, sent over from Study. */
export interface PlayRequest {
  fen: string
  moves: string[]
  chapterId: string
  label: string
}

type Shape_ = 'any' | 'chapter' | 'here'

/** How long the blunder scan thinks about each position. */
const SCAN_MOVETIME = 150

/**
 * The one profile every evaluation on this screen is made at: the live bar's
 * and the scan's. Full strength, one line, a fixed 150 ms. Two numbers can
 * only be compared when they were made the same way.
 */
function analysisProfile() {
  return { ...strengthProfile(8), multiPv: 1, movetime: SCAN_MOVETIME }
}

export function Play({
  course,
  request,
  onRequestUsed,
}: {
  course: LoadedCourse
  request: PlayRequest | null
  onRequestUsed: () => void
}) {
  const { state, recordPlay } = useProgress()
  const chapters = course.chapters
  const [launch, setLaunch] = useState<Shape_>(request ? 'here' : 'any')
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? '')
  const [length, setLength] = useState<GameLength>('move15')
  const [level, setLevel] = useState(4)
  // "This chapter's line" is the one people misread here, so the launch
  // options carry the screen's only `?`.
  const [askLaunch, setAskLaunch] = useState(false)

  const [session, setSession] = useState<PlaySession | null>(null)
  const [, setTick] = useState(0)
  const [thinking, setThinking] = useState(false)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [report, setReport] = useState<GameReport | null>(null)
  const [scanning, setScanning] = useState<{ done: number; total: number } | null>(null)
  const [evaluations, setEvaluations] = useState<Map<string, number>>(() => new Map())

  const engineRef = useRef<Engine | null>(null)
  const sessionRef = useRef<PlaySession | null>(null)
  const evaluationsRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (request) setLaunch('here')
  }, [request])

  // The worker is expensive to start, so it is kept for the whole visit and
  // stopped when the view goes away.
  useEffect(() => {
    return () => {
      engineRef.current?.stop()
      engineRef.current = null
    }
  }, [])

  const book = useMemo(() => {
    if (launch === 'chapter') {
      const chapter = chapters.find((entry) => entry.id === chapterId)
      return buildBook({ colour: course.colour, chapters: chapter ? [chapter] : [] })
    }
    return buildBook({ colour: course.colour, chapters })
  }, [chapters, course.colour, launch, chapterId])

  const refresh = useCallback(() => setTick((count) => count + 1), [])

  /**
   * Evaluates a position for the bar, at the analysis profile, and puts the
   * playing profile back.
   *
   * The restore is in a `finally` for a reason worth keeping: the engine is
   * one worker with a promise queue, so a search that threw and skipped the
   * restore would leave the opponent playing the rest of the game at level 8
   * with one candidate. A position already known is not searched again, which
   * is what makes undo and redo free.
   */
  const evaluate = useCallback(
    async (running: Engine, fen: string, playing: number) => {
      const key = positionKey(fen)
      if (evaluationsRef.current.has(key)) return
      try {
        await running.setStrength(analysisProfile())
        const result = await running.search(fen, SCAN_MOVETIME)
        const best = result.candidates[0]
        if (!best) return
        const side = fen.split(' ')[1] === 'b' ? 'black' : 'white'
        const next = new Map(evaluationsRef.current)
        next.set(key, whitePovPawns(best.score, side))
        evaluationsRef.current = next
        setEvaluations(next)
      } finally {
        await running.setStrength(strengthProfile(playing))
      }
    },
    [],
  )

  const engine = useCallback(async (): Promise<Engine> => {
    if (!engineRef.current) engineRef.current = new StockfishEngine()
    await engineRef.current.start()
    return engineRef.current
  }, [])

  const start = useCallback(async () => {
    setEngineError(null)
    setReport(null)
    setThinking(true)
    try {
      const profile = strengthProfile(level)
      const running = await engine()
      await running.newGame()
      await running.setStrength(profile)
      const fresh = new PlaySession({
        book,
        engine: running,
        profile,
        length,
        startMoves: launch === 'here' && request ? request.moves : [],
      })
      sessionRef.current = fresh
      setSession(fresh)
      // Dev-only handle on the running game, so a browser check can read the
      // state the session actually holds rather than guess from the screen.
      if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__game = fresh
      if (launch === 'here') onRequestUsed()
      // The engine may be the one to move first: a "play from here" position
      // stopped on the opponent's turn, or a Black course, where it opens.
      if (!fresh.studentToMove && !fresh.isFinished()) {
        await fresh.playOpponent()
      }
      refresh()
      await evaluate(running, fresh.fen, level)
      refresh()
    } catch (error) {
      setEngineError(asMessage(error))
    } finally {
      setThinking(false)
    }
  }, [book, engine, evaluate, launch, length, level, onRequestUsed, refresh, request])

  const onMove = useCallback(
    async (from: string, to: string) => {
      const running = sessionRef.current
      if (!running || thinking || running.isFinished()) return
      const san = sanForMove(running.fen, from, to)
      if (!san || !running.playStudent(san)) return
      refresh()
      setThinking(true)
      try {
        // The bar is brought up to date before the opponent is asked to move,
        // so it answers the move that was just played rather than the reply.
        const live = engineRef.current
        if (live) await evaluate(live, running.fen, level)
        refresh()
        if (running.isFinished()) return
        await running.playOpponent()
        refresh()
        if (live) await evaluate(live, running.fen, level)
        refresh()
      } catch (error) {
        setEngineError(asMessage(error))
      } finally {
        setThinking(false)
      }
    },
    [evaluate, level, refresh, thinking],
  )

  const finish = useCallback(async () => {
    const running = sessionRef.current
    if (!running) return
    setThinking(true)
    setScanning({ done: 0, total: 0 })
    try {
      const running_engine = await engine()
      await running_engine.setStrength(analysisProfile())
      // What the bar already worked out is handed over rather than searched
      // again: the scan is shorter, and the report cannot disagree with the
      // numbers that were on the screen during the game.
      const scanned = await scanGame(
        running.moves,
        running_engine,
        SCAN_MOVETIME,
        (done, total) => setScanning({ done, total }),
        evaluationsRef.current,
      )
      evaluationsRef.current = scanned
      setEvaluations(scanned)
      const outcome = running.outcome ?? `Stopped after move ${fullMove(running.moves.length - 1)}`
      const built = buildReport(running.moves, book, scanned, outcome)
      setReport(built)
      recordPlay({
        courseId: course.id,
        chapterId: launch === 'chapter' ? chapterId : undefined,
        deviated: built.deviation.kind === 'student-left-book',
        deviationMove:
          built.deviation.kind === 'student-left-book'
            ? fullMove(built.deviation.ply ?? 0)
            : undefined,
        moves: fullMove(Math.max(0, running.moves.length - 1)),
        level,
        at: new Date().toISOString(),
      })
    } catch (error) {
      setEngineError(asMessage(error))
    } finally {
      setScanning(null)
      setThinking(false)
    }
  }, [book, chapterId, course.id, engine, launch, level, recordPlay])

  const reset = useCallback(() => {
    sessionRef.current = null
    setSession(null)
    setReport(null)
    setScanning(null)
    evaluationsRef.current = new Map()
    setEvaluations(new Map())
  }, [])

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
      <header className="play-head">
        <h2>Play</h2>
        <p className="play-status">
          {report
            ? 'Game reviewed'
            : finished
              ? session.outcome ?? 'Game over'
              : thinking
                ? `${colourName(book.opponentColour)} is thinking...`
                : 'Your move'}
        </p>
        <button type="button" className="link" onClick={reset}>
          New game
        </button>
      </header>

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
          onMove={onMove}
          size={420}
        />

        <div className="play-side">
          <MoveList session={session} />

          {report ? (
            <Report report={report} opponentColour={book.opponentColour} />
          ) : (
            <div className="play-actions">
              {finished ? (
                <p className="notice">
                  {session.outcome ?? 'The game has reached its length.'} Review it to see
                  where you left the repertoire and what it cost.
                </p>
              ) : null}
              <button type="button" className="primary" onClick={finish} disabled={thinking}>
                {scanning
                  ? `Scanning ${scanning.done} of ${scanning.total}...`
                  : finished
                    ? 'Review the game'
                    : 'Stop and review'}
              </button>
              {engineError ? <p className="notice bad">{engineError}</p> : null}
            </div>
          )}
        </div>
      </div>
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

function Report({
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

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
