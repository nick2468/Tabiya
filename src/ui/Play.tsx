import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Board } from './Board'
import { useProgress } from './progress-context'
import { chapters } from '../content'
import { StockfishEngine, strengthProfile, allProfiles, type Engine } from '../engine'
import { sanForMove, squaresForSan } from '../model/grade'
import { legalDests } from '../model/position'
import {
  GAME_LENGTHS,
  PlaySession,
  buildBook,
  buildReport,
  describeDeviation,
  describeSlip,
  fullMove,
  scanGame,
  verdictInWords,
  type GameLength,
  type GameReport,
} from '../play'
import './play.css'

/**
 * Play: a game against the engine, steered into the repertoire.
 *
 * There is no evaluation on screen while the game is going. That is deliberate
 * and it is in the spec: a bar telling you how you are doing replaces the
 * thinking the game is meant to train. Everything the engine knows comes out
 * afterwards, in the report.
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

export function Play({
  request,
  onRequestUsed,
}: {
  request: PlayRequest | null
  onRequestUsed: () => void
}) {
  const { state, recordPlay } = useProgress()
  const [launch, setLaunch] = useState<Shape_>(request ? 'here' : 'any')
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? '')
  const [length, setLength] = useState<GameLength>('move15')
  const [level, setLevel] = useState(4)

  const [session, setSession] = useState<PlaySession | null>(null)
  const [, setTick] = useState(0)
  const [thinking, setThinking] = useState(false)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [report, setReport] = useState<GameReport | null>(null)
  const [scanning, setScanning] = useState<{ done: number; total: number } | null>(null)

  const engineRef = useRef<Engine | null>(null)
  const sessionRef = useRef<PlaySession | null>(null)

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
      return buildBook(chapter ? [chapter] : [])
    }
    return buildBook(chapters)
  }, [launch, chapterId])

  const refresh = useCallback(() => setTick((count) => count + 1), [])

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
      if (launch === 'here') onRequestUsed()
      // A "play from here" position may have Black to move.
      if (fresh.sideToMove === 'black' && !fresh.isFinished()) {
        await fresh.playBlack()
      }
      refresh()
    } catch (error) {
      setEngineError(asMessage(error))
    } finally {
      setThinking(false)
    }
  }, [book, engine, launch, length, level, onRequestUsed, refresh, request])

  const onMove = useCallback(
    async (from: string, to: string) => {
      const running = sessionRef.current
      if (!running || thinking || running.isFinished()) return
      const san = sanForMove(running.fen, from, to)
      if (!san || !running.playWhite(san)) return
      refresh()
      if (running.isFinished()) return
      setThinking(true)
      try {
        await running.playBlack()
        refresh()
      } catch (error) {
        setEngineError(asMessage(error))
      } finally {
        setThinking(false)
      }
    },
    [refresh, thinking],
  )

  const finish = useCallback(async () => {
    const running = sessionRef.current
    if (!running) return
    setThinking(true)
    setScanning({ done: 0, total: 0 })
    try {
      const running_engine = await engine()
      // The scan runs at one fixed effort so every position is judged by the
      // same standard, and at full strength whatever the game was played at.
      await running_engine.setStrength({ ...strengthProfile(8), multiPv: 1, movetime: SCAN_MOVETIME })
      const evaluations = await scanGame(running.moves, running_engine, SCAN_MOVETIME, (done, total) =>
        setScanning({ done, total }),
      )
      const outcome = running.outcome ?? `Stopped after move ${fullMove(running.moves.length - 1)}`
      const built = buildReport(running.moves, book, evaluations, outcome)
      setReport(built)
      recordPlay({
        chapterId: launch === 'chapter' ? chapterId : undefined,
        deviated: built.deviation.kind === 'white-left-book',
        deviationMove:
          built.deviation.kind === 'white-left-book' ? fullMove(built.deviation.ply ?? 0) : undefined,
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
  }, [book, chapterId, engine, launch, level, recordPlay])

  const reset = useCallback(() => {
    sessionRef.current = null
    setSession(null)
    setReport(null)
    setScanning(null)
  }, [])

  // The game ends by itself on mate or the length cap.
  const finished = session?.isFinished() ?? false

  if (!session) {
    return (
      <div className="play">
        <h2>Play</h2>
        <p className="play-intro">
          A game against Stockfish, with Black steered into the lines you have studied.
          No evaluation while you play: everything the engine thinks comes out in the
          report afterwards.
        </p>

        <fieldset>
          <legend>Who you are playing</legend>
          <label>
            <input
              type="radio"
              checked={launch === 'any'}
              onChange={() => setLaunch('any')}
            />
            Any defence
          </label>
          <label>
            <input
              type="radio"
              checked={launch === 'chapter'}
              onChange={() => setLaunch('chapter')}
            />
            This chapter's defence
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
                ? 'Black is thinking...'
                : 'Your move'}
        </p>
        <button type="button" className="link" onClick={reset}>
          New game
        </button>
      </header>

      <div className="play-body">
        <Board
          fen={session.fen}
          turnColor={session.sideToMove}
          movableColor={finished || thinking || report ? undefined : 'white'}
          dests={finished || thinking || report ? undefined : legalDests(session.fen)}
          lastMove={lastMoveSquares(session)}
          onMove={onMove}
          size={420}
        />

        <div className="play-side">
          <MoveList session={session} />

          {report ? (
            <Report report={report} />
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

function Report({ report }: { report: GameReport }) {
  return (
    <div className="report">
      <h3>The report</h3>

      <h4>The repertoire</h4>
      <p>{describeDeviation(report.deviation)}</p>
      {report.deviation.kind === 'white-left-book' && report.deviation.note ? (
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
 * The one place an evaluation bar is allowed: the report, after the game. It
 * never appears while a game is going.
 */
function EvalBar({ pawns }: { pawns: number }) {
  // Squash the number into a bar without pretending the scale is linear.
  const share = 50 + 50 * Math.tanh(pawns / 3)
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
