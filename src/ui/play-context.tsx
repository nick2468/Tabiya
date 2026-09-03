import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useProgress } from './progress-context'
import { StockfishEngine, strengthProfile, whitePovPawns, type Engine } from '../engine'
import { sanForMove } from '../model/grade'
import { positionKey } from '../model/position'
import {
  PlaySession,
  buildReport,
  fullMove,
  scanGame,
  type Book,
  type GameLength,
  type GameReport,
} from '../play'

/**
 * The running game, held above the screen that shows it.
 *
 * It used to live in `Play`'s own state, and `Play` unmounts the moment the
 * view changes. So looking at Study for one move threw the game away, stopped
 * the engine worker in the unmount effect, and left nothing to come back to.
 * Nick found that on the first afternoon. A game is not part of a screen; it
 * is a thing the app is doing.
 *
 * One game at a time, and it belongs to the course it was started in - which
 * is now something the game SAYS rather than something the header enforces.
 * Phase 23 greyed the course switcher while a game ran. Nick overruled that on
 * 2026-09-03: he wants to study, drill and check progress on another opening
 * while a game is open, and a greyed selector he could barely see answered a
 * question nobody had asked. So the game carries its own course and chapter
 * TITLES, captured when it starts, and writes them above the board. Reading
 * them off the catalog would not do: the header can now name another course,
 * and a title read late is a title that can change under the game.
 *
 * The engine worker now lives as long as the game does. It is stopped by New
 * game and by this provider going away, and by nothing else.
 */

/** What a game needs to know about itself, fixed when it starts. */
export interface StartOptions {
  courseId: string
  book: Book
  length: GameLength
  level: number
  startMoves: string[]
  /** The chapter a "this chapter's line" game is sparring against. */
  chapterId?: string
  /** The course's title, captured now, because the header can change later. */
  courseTitle: string
  /** And the chapter's, for a game sparring against one. */
  chapterTitle?: string
}

export interface PlayGame {
  session: PlaySession | null
  /** The book the running game was started with, not the screen's current one. */
  book: Book | null
  /** The course the running game belongs to. */
  courseId: string | null
  /** What that course is called, as the catalog prints it. */
  courseTitle: string | null
  /** And the chapter, for a game sparring against one. */
  chapterTitle: string | null
  report: GameReport | null
  scanning: { done: number; total: number } | null
  evaluations: Map<string, number>
  thinking: boolean
  engineError: string | null
  /** A game exists and has not been reviewed. A reviewed game is over. */
  inProgress: boolean
  start: (options: StartOptions) => Promise<void>
  play: (from: string, to: string) => Promise<void>
  undo: () => void
  redo: () => void
  extend: (by: 5 | 'full') => Promise<void>
  finish: () => Promise<void>
  reset: () => void
}

/**
 * Exported so a test can hand a screen a game without playing one.
 *
 * The same reasoning as the other two contexts: the lint rule below wants a
 * context in its own file for fast refresh, and the cost of obeying it is a
 * module whose only job is to break a cycle.
 */
// eslint-disable-next-line react/only-export-components
export const PlayContext = createContext<PlayGame | null>(null)

/** How long the blunder scan thinks about each position. */
const SCAN_MOVETIME = 150

/**
 * The one profile every evaluation is made at, the live bar's and the scan's.
 * Full strength, one line, a fixed 150 ms. Two numbers can only be compared
 * when they were made the same way.
 */
function analysisProfile() {
  return { ...strengthProfile(8), multiPv: 1, movetime: SCAN_MOVETIME }
}

function usePlayValue(): PlayGame {
  const { recordPlay } = useProgress()

  const [session, setSession] = useState<PlaySession | null>(null)
  // What the game was started with. In state as well as in a ref, because the
  // screen renders from it and a ref read during render would not update.
  const [setup, setSetup] = useState<StartOptions | null>(null)
  // The session is a mutable object, so playing, undoing and redoing change
  // nothing React can see. Bumping this counter is what says something has
  // happened. The value below is rebuilt on every render, so that is all it
  // takes; see the note there for why it is not memoised.
  const [, setTick] = useState(0)
  const [thinking, setThinking] = useState(false)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [report, setReport] = useState<GameReport | null>(null)
  const [scanning, setScanning] = useState<{ done: number; total: number } | null>(null)
  const [evaluations, setEvaluations] = useState<Map<string, number>>(() => new Map())

  const engineRef = useRef<Engine | null>(null)
  const sessionRef = useRef<PlaySession | null>(null)
  const setupRef = useRef<StartOptions | null>(null)
  const evaluationsRef = useRef<Map<string, number>>(new Map())

  // The worker goes when the app goes, and not before. Leaving the Play
  // screen used to stop it, which is what threw the game away.
  useEffect(() => {
    return () => {
      engineRef.current?.stop()
      engineRef.current = null
    }
  }, [])

  const refresh = useCallback(() => setTick((count) => count + 1), [])

  const engine = useCallback(async (): Promise<Engine> => {
    if (!engineRef.current) engineRef.current = new StockfishEngine()
    await engineRef.current.start()
    return engineRef.current
  }, [])

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
  const evaluate = useCallback(async (running: Engine, fen: string, playing: number) => {
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
  }, [])

  const start = useCallback(
    async (options: StartOptions) => {
      setEngineError(null)
      setReport(null)
      setThinking(true)
      evaluationsRef.current = new Map()
      setEvaluations(new Map())
      try {
        const profile = strengthProfile(options.level)
        const running = await engine()
        await running.newGame()
        await running.setStrength(profile)
        const fresh = new PlaySession({
          book: options.book,
          engine: running,
          profile,
          length: options.length,
          startMoves: options.startMoves,
        })
        setupRef.current = options
        setSetup(options)
        sessionRef.current = fresh
        setSession(fresh)
        // Dev-only handle on the running game, so a browser check can read the
        // state the session actually holds rather than guess from the screen.
        if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__game = fresh
        // The engine may be the one to move first: a "play from here" position
        // stopped on the opponent's turn, or a Black course, where it opens.
        if (!fresh.studentToMove && !fresh.isFinished()) {
          await fresh.playOpponent()
        }
        refresh()
        await evaluate(running, fresh.fen, options.level)
        refresh()
      } catch (error) {
        setEngineError(asMessage(error))
      } finally {
        setThinking(false)
      }
    },
    [engine, evaluate, refresh],
  )

  const play = useCallback(
    async (from: string, to: string) => {
      const running = sessionRef.current
      const setup = setupRef.current
      if (!running || !setup || thinking || running.isFinished()) return
      const san = sanForMove(running.fen, from, to)
      if (!san || !running.playStudent(san)) return
      refresh()
      setThinking(true)
      try {
        // The bar is brought up to date before the opponent is asked to move,
        // so it answers the move that was just played rather than the reply.
        const live = engineRef.current
        if (live) await evaluate(live, running.fen, setup.level)
        refresh()
        if (running.isFinished()) return
        await running.playOpponent()
        refresh()
        if (live) await evaluate(live, running.fen, setup.level)
        refresh()
      } catch (error) {
        setEngineError(asMessage(error))
      } finally {
        setThinking(false)
      }
    },
    [evaluate, refresh, thinking],
  )

  /**
   * Undo and redo. Neither one asks the engine anything: every position they
   * land on has already been evaluated, so the bar follows them for free.
   */
  const undo = useCallback(() => {
    const running = sessionRef.current
    if (!running || thinking || report) return
    if (running.undo()) refresh()
  }, [refresh, report, thinking])

  const redo = useCallback(() => {
    const running = sessionRef.current
    if (!running || thinking || report) return
    if (running.redo()) refresh()
  }, [refresh, report, thinking])

  /**
   * Carries a game on past its length, and lets the opponent move if it is
   * their turn.
   *
   * It usually is. A cap is reached after both sides have completed the move
   * number, so the trainee is to move; but a game started from a Study
   * position begins mid-move-pair, so the opponent can be the one waiting.
   * That is the same case `start` handles, for the same reason.
   */
  const extend = useCallback(
    async (by: 5 | 'full') => {
      const running = sessionRef.current
      const setup = setupRef.current
      if (!running || !setup || thinking || report) return
      if (!running.extend(by)) return
      refresh()
      setThinking(true)
      try {
        const live = engineRef.current
        if (!running.studentToMove && !running.isFinished()) {
          await running.playOpponent()
          refresh()
          if (live) await evaluate(live, running.fen, setup.level)
          refresh()
        }
      } catch (error) {
        setEngineError(asMessage(error))
      } finally {
        setThinking(false)
      }
    },
    [evaluate, refresh, report, thinking],
  )

  const finish = useCallback(async () => {
    const running = sessionRef.current
    const setup = setupRef.current
    if (!running || !setup) return
    setThinking(true)
    setScanning({ done: 0, total: 0 })
    try {
      const runningEngine = await engine()
      await runningEngine.setStrength(analysisProfile())
      // What the bar already worked out is handed over rather than searched
      // again: the scan is shorter, and the report cannot disagree with the
      // numbers that were on the screen during the game.
      const scanned = await scanGame(
        running.moves,
        runningEngine,
        SCAN_MOVETIME,
        (done, total) => setScanning({ done, total }),
        evaluationsRef.current,
      )
      evaluationsRef.current = scanned
      setEvaluations(scanned)
      const outcome = running.outcome ?? `Stopped after move ${fullMove(running.moves.length - 1)}`
      const built = buildReport(running.moves, setup.book, scanned, outcome)
      setReport(built)
      recordPlay({
        courseId: setup.courseId,
        chapterId: setup.chapterId,
        deviated: built.deviation.kind === 'student-left-book',
        deviationMove:
          built.deviation.kind === 'student-left-book'
            ? fullMove(built.deviation.ply ?? 0)
            : undefined,
        moves: fullMove(Math.max(0, running.moves.length - 1)),
        // The game record, written once, here. `session.moves` holds every SAN
        // including any replayed by the constructor, so a game started from a
        // Study position is still matched from the chapter root.
        sans: running.moves.map((move) => move.san),
        level: setup.level,
        at: new Date().toISOString(),
      })
    } catch (error) {
      setEngineError(asMessage(error))
    } finally {
      setScanning(null)
      setThinking(false)
    }
  }, [engine, recordPlay])

  const reset = useCallback(() => {
    sessionRef.current = null
    setupRef.current = null
    setSetup(null)
    setSession(null)
    setReport(null)
    setScanning(null)
    setEngineError(null)
    evaluationsRef.current = new Map()
    setEvaluations(new Map())
    engineRef.current?.stop()
    engineRef.current = null
  }, [])

  // A fresh object every render, deliberately, with no useMemo around it.
  //
  // The children of a provider are the same element from one render to the
  // next, so React skips them unless the context VALUE changes. Memoising
  // this made that value survive a render, and a memo has to list everything
  // that can change: the counter above is not a field of the value, so it was
  // easy to leave out, and leaving it out meant undo moved the game and not
  // the screen. It was caught by playing a game, not by anything else.
  //
  // Rebuilding it instead is one object per render of a provider that only
  // renders when something has actually happened, and the whole failure mode
  // goes with the memo.
  return {
    session,
    book: setup?.book ?? null,
    courseId: setup?.courseId ?? null,
    courseTitle: setup?.courseTitle ?? null,
    chapterTitle: setup?.chapterTitle ?? null,
    report,
    scanning,
    evaluations,
    thinking,
    engineError,
    inProgress: session !== null && report === null,
    start,
    play,
    undo,
    redo,
    extend,
    finish,
    reset,
  }
}

export function PlayProvider({ children }: { children: React.ReactNode }) {
  const value = usePlayValue()
  return <PlayContext value={value}>{children}</PlayContext>
}

export function usePlay(): PlayGame {
  const value = useContext(PlayContext)
  if (!value) throw new Error('usePlay needs a PlayProvider above it')
  return value
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
