import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Board } from './Board'
import { BOARD_SIZE } from './board-size'
import { HelpAsk, HelpSaid } from './Help'
import { usePlay } from './play-context'
import { resolvePlayChapter, useCourseMoves, usePlayPrefs } from './prefs'
import {
  requestFromReplay,
  whyNotPlayable,
  type ReplayedGame,
} from './play-from-replay'
import { useProgress } from './progress-context'

import { strengthProfile, allProfiles, levelName } from '../engine'
import { squaresForSan } from '../model/grade'
import type { Shape } from '../model/types'
import { legalDests, sideToMove } from '../model/position'
import { colourName, type Colour, type LoadedCourse } from '../model/types'
import {
  GAME_LENGTHS,
  PlaySession,
  buildBook,
  clampPly,
  describeAlternatives,
  describeDeviation,
  describeSlip,
  evalBarLayout,
  evalShare,
  fullMove,
  gameToPgn,
  moveAtPly,
  numberPlacement,
  plyBeforeMove,
  positionAtPly,
  shownEvaluation,
  verdictInWords,
  type Evaluation,
  type GameLength,
  type GameReport,
  type CourseMoves,
  type Hint,
  type PlaySide,
  type PlayedMove,
} from '../play'
import './play.css'

/**
 * How many rows of the move list show before it scrolls. Twenty, which Nick
 * asked for on 1.6.9: two more than the board's height held. Each row is
 * 1.45em, the list's own line-height, so the height is counted in rows rather
 * than copied from the board.
 */
const MOVE_LIST_ROWS = 20

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
  /**
   * Set by Replay: start the game and review it without waiting to be asked,
   * so the trainee lands on the report rather than on the launch options.
   */
  reviewAtOnce?: boolean
  /**
   * Which side the recorded game was played on. A game played against the
   * course is resumed and replayed against the course; absent is the
   * course's own side, which is every game before phase 32.
   */
  side?: PlaySide
}

/**
 * The three ways to start, which say where the game begins and which lines
 * the engine draws on. Which SIDE the trainee is on is a separate choice that
 * goes with any of them: phase 32 made it a fourth radio here, which meant a
 * person could play against the course from move one and not from a Study
 * position they had just been looking at. Nick ruled it a checkbox.
 */
type Shape_ = 'any' | 'chapter' | 'here'

export function Play({
  course,
  request,
  onRequestUsed,
  onPlayFrom,
}: {
  course: LoadedCourse
  request: PlayRequest | null
  onRequestUsed: () => void
  /** Sends a new request out through the shell, the way Study does. */
  onPlayFrom?: (request: PlayRequest) => void
}) {
  const { state } = useProgress()
  const game = usePlay()
  const chapters = course.chapters
  // Every launch setting is remembered between sessions (Nick's ruling,
  // 2026-09-06), read once here and written as it is changed. Only "From a
  // Study position" is not: it names a position, and the position is gone by
  // the next run. The other-side box is remembered too, which reverses the
  // phase 33 ruling that made it a per-game choice.
  const prefs = usePlayPrefs(course.id)
  const [launch, setLaunchShape] = useState<Shape_>(request ? 'here' : prefs.launch)
  const chapter = resolvePlayChapter(prefs.chapterId, chapters)
  const chapterId = chapter?.id ?? ''
  const { courseMoves, setCourseMoves } = useCourseMoves()
  const { length, setLength, level, setLevel, otherSide: otherTicked, setOtherSide: setOtherTicked } = prefs

  // The remembered shape is one of the two that can be restored; picking the
  // third is a thing that happens to this game and not a preference.
  const setLaunch = useCallback(
    (next: Shape_) => {
      setLaunchShape(next)
      if (next !== 'here') prefs.setLaunch(next)
    },
    [prefs],
  )
  // "This chapter's line" is the one people misread here, so the launch
  // options carry the screen's only `?`.
  const [askLaunch, setAskLaunch] = useState(false)
  // Which position of a reviewed game is showing lives in the provider since
  // phase 36, beside the report it belongs to, so that it survives a trip to
  // another screen the way the game does. The phase 25 guard about WHICH
  // report the ply belongs to went with it: the provider clears the ply in the
  // same update that changes the report, so no render sees an old ply against
  // a new game.

  useEffect(() => {
    if (request) setLaunchShape('here')
  }, [request])

  // A request is used up the moment its game starts, and the "From" radio it
  // chose goes with it: the shape drops back to the remembered one, so the
  // options a New game arrives at are the trainee's own again.
  useEffect(() => {
    if (launch === 'here' && !request) setLaunchShape(prefs.launch)
  }, [launch, prefs.launch, request])

  // A resumed game arrives with its own strength and no cap. Both are set on
  // the screen rather than applied behind it, so the options say what is about
  // to happen and can still be changed.
  // SHOWN, not remembered. These two used to be written to storage, so a Play
  // on from a game recorded at level 7 replaced the strength the trainee had
  // chosen for every later game. Picking a game up is not choosing a setting.
  useEffect(() => {
    if (request?.level !== undefined) prefs.showLevel(request.level)
    if (request?.at !== undefined) prefs.showLength('full')
    // The arrival of a request is the only thing that may do this, and the
    // two setters are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request])

  // The chapter a resumed game was sparring against, when it names one, so
  // the opponent is steered the way it was steered the first time.
  const resumeChapter = launch === 'here' && request?.chapterOnly ? request.chapterId : null
  const targetChapter = launch === 'chapter' ? chapterId : resumeChapter
  // A request that carries a side is a recorded game being played on or
  // replayed, and the record's side wins: switching a course-side game to
  // the other side would be a different game. The box is shown ticked and
  // held for that case rather than hidden, so the screen says which side the
  // game is on.
  const sideFixed = launch === 'here' && request?.side === 'other'
  const otherSide = sideFixed || otherTicked

  const book = useMemo(() => {
    if (targetChapter) {
      const chapter = chapters.find((entry) => entry.id === targetChapter)
      return buildBook({ colour: course.colour, chapters: chapter ? [chapter] : [] })
    }
    return buildBook({ colour: course.colour, chapters })
  }, [chapters, course.colour, targetChapter])

  const startOptions = () => ({
    courseId: course.id,
    courseTitle: course.title,
    course,
    book,
    length,
    level,
    startMoves: launch === 'here' && request ? request.moves : [],
    chapterId: targetChapter ?? undefined,
    chapterTitle: targetChapter
      ? chapters.find((entry) => entry.id === targetChapter)?.title
      : undefined,
    at: launch === 'here' ? request?.at : undefined,
    ...(otherSide ? { side: 'other' as const, courseMoves } : {}),
  })

  const start = async () => {
    await game.start(startOptions())
    if (launch === 'here') onRequestUsed()
  }

  /**
   * What a replayed game is started with, read from the REQUEST and nothing
   * else.
   *
   * Not `startOptions`, and the difference cost a record. The launch options
   * on this screen are set by an effect when a request arrives, so during the
   * render that effect belongs to they still hold the previous values: a
   * replay reading them got `at: undefined`, minted a fresh identity, and
   * wrote a second record for a game it was only supposed to be reading.
   * Everything here comes from the request, which is right at the moment it
   * is read.
   *
   * Always uncapped: the game has already run past any length that applied.
   */
  const replayOptions = (from: PlayRequest) => {
    const chapter = from.chapterOnly
      ? chapters.find((entry) => entry.id === from.chapterId)
      : undefined
    return {
      courseId: course.id,
      courseTitle: course.title,
      course,
      book: buildBook({ colour: course.colour, chapters: chapter ? [chapter] : chapters }),
      length: 'full' as GameLength,
      level: from.level ?? level,
      startMoves: from.moves,
      chapterId: chapter?.id,
      chapterTitle: chapter?.title,
      at: from.at,
      // Reading, not playing: the engine must not add a reply to the record.
      holdOpponent: true,
      // A game played against the course is read against the course, so the
      // report says how far the book lasted rather than who left it.
      side: from.side,
    }
  }

  /**
   * Replay: start the recorded game and review it without being asked.
   *
   * The ref is what stops it firing twice. `start` and `finish` both change
   * provider state, so this effect reruns while it is still running, and a
   * second run would start a second game over the first. Keyed by the
   * record's identity, so a different game replays and the same one does not
   * replay again.
   */
  const replayFired = useRef<string | null>(null)
  useEffect(() => {
    const wanted = request?.reviewAtOnce ? request.at ?? 'once' : null
    if (!wanted || !request || replayFired.current === wanted) return
    replayFired.current = wanted
    void (async () => {
      await game.start(replayOptions(request))
      onRequestUsed()
      await game.finish()
    })()
    // Everything it needs is read from the request at the moment it runs, so
    // this fires on the arrival of one and on nothing else.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request])

  const { session, report, scanning, thinking, engineError, evaluations } = game

  // The game ends by itself on mate or the length cap.
  const finished = session?.isFinished() ?? false

  const moves = useMemo(() => session?.moves ?? [], [session])
  const atEnd = moves.length
  // A report nobody has walked yet shows its end, which is the final position.
  const ply = report !== null && game.replayPly !== null ? clampPly(moves, game.replayPly) : atEnd
  const setReplayPly = game.setReplayPly
  const step = useCallback(
    (to: number) => setReplayPly(clampPly(moves, to)),
    [moves, setReplayPly],
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
      courseTitle: game.courseTitle ?? 'Tabiya',
      studentColour: session.studentColour,
      level: game.level ?? 0,
      at: game.recordedAt ?? new Date().toISOString(),
      side: game.side,
    })
  }, [game.courseTitle, game.level, game.recordedAt, game.side, report, session])

  // Built once, so the arrows under the board and anything else that walks
  // the game are driven by the same object rather than two copies of it.
  const replayControls: ReplayControls = {
    ply,
    count: atEnd,
    onJump: (movePly: number) => step(plyBeforeMove(movePly)),
    onBack: () => step(ply - 1),
    onForward: () => step(ply + 1),
  }

  /**
   * The replayed game as the request builder wants it: what the PROVIDER
   * holds, not what this screen's launch options say. Same lesson as
   * `replayOptions` above. The course a game was played in may not be the one
   * the header is naming, because the header is free to move while a game is
   * up.
   */
  const replayedGame: ReplayedGame | null =
    report && game.courseId && game.recordedAt
      ? {
          moves,
          courseId: game.courseId,
          chapterId: game.chapterId ?? undefined,
          level: game.level ?? undefined,
          at: game.recordedAt,
        }
      : null

  const playFromWhy = replayedGame
    ? whyNotPlayable(replayedGame, ply, session?.studentColour ?? 'white')
    : null

  /**
   * A new game from the position being looked at.
   *
   * The request goes out first and the reviewed game is thrown away second.
   * The order is not arbitrary: the launch options only render when there is
   * no session, so the reset is what puts them on the screen, and the request
   * has to be waiting when they arrive.
   */
  const playFromHere = () => {
    if (!replayedGame || !onPlayFrom) return
    const built = requestFromReplay(replayedGame, ply)
    if (!built) return
    onPlayFrom(built)
    game.reset()
  }

  const replayed = report ? positionAtPly(moves, ply) : null
  const shown = replayed ?? session?.fen ?? ''
  // Standing on the position a slip was played from, the highlight is the
  // slip itself, the move about to be played, so that it and the engine's
  // arrow are on the board together. Anywhere else it is the move that led
  // here, as it always was.
  const slipHere = report?.slips.find((slip) => slip.ply === ply && slip.better)
  const highlight = report
    ? squaresOf(slipHere ? (moves[ply] ?? null) : moveAtPly(moves, ply))
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
            <select
              aria-label="Which chapter"
              value={chapterId}
              onChange={(event) => prefs.setChapterId(event.target.value)}
            >
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
          {/* The sides swapped, and it goes with whichever radio is chosen:
              the radios say where the game starts and which lines the engine
              draws on, and this says which side of them the trainee is on.
              The setting under it is only shown while the box is ticked. */}
          <label className="other-side-box">
            <input
              type="checkbox"
              checked={otherSide}
              disabled={sideFixed}
              title={
                sideFixed
                  ? 'This game was played on the other side, and it carries on there.'
                  : undefined
              }
              onChange={(event) => setOtherTicked(event.target.checked)}
            />
            Play the other side
          </label>
          <p className="hint">You play against the course. The engine plays its moves.</p>
          {otherSide ? <CourseMovesChoice value={courseMoves} onChange={setCourseMoves} /> : null}
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
          <select
            aria-label="How strong"
            value={level}
            onChange={(event) => setLevel(Number(event.target.value))}
          >
            {allProfiles().map((profile) => (
              <option key={profile.level} value={profile.level}>
                {levelName(profile.level)}
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
        opening={openingLine(game.courseTitle, game.chapterTitle, game.level, game.side)}
        opponentColour={session.engineColour}
        thinking={thinking}
        reviewed={report !== null}
      />

      <div className="play-body">
        {/* The board column: the bar and the board in one box, so the bar is
            stretched to the board's own height rather than given a height of
            its own, and the controls directly under them. */}
        <div className="play-column">
          <div className="play-board">
            <LiveEvalBar
              evaluation={shownEvaluation(shown, session.moves, evaluations)}
              studentColour={session.studentColour}
            />

            <Board
              fen={shown}
              orientation={session.studentColour}
              turnColor={sideToMove(shown)}
              movableColor={finished || thinking || report ? undefined : session.studentColour}
              dests={finished || thinking || report ? undefined : legalDests(session.fen)}
              lastMove={highlight}
              shapes={report ? preferredShapes(report, ply, shown) : hintShapes(game.hint, shown)}
              onMove={game.play}
              size={BOARD_SIZE}
            />
          </div>

          <PlayControls
            session={session}
            thinking={thinking}
            reviewed={report !== null}
            canHint={game.canHint}
            canResume={game.canResume}
            replay={report ? replayControls : null}
            playFromWhy={playFromWhy}
            onNew={game.reset}
            onResume={game.resume}
            onUndo={game.undo}
            onRedo={game.redo}
            onHint={game.askHint}
            onPlayFrom={playFromHere}
          />
        </div>

        <MoveList
          session={session}
          activePly={report ? ply : null}
          onSelect={step}
          rows={MOVE_LIST_ROWS}
        />

        <div className="play-side">
          {game.hint ? (
            <p className={`hint-said ${game.hint.source}`}>{game.hint.text}</p>
          ) : null}

          {report ? (
            <Report
              report={report}
              opponentColour={session.engineColour}
              pgn={pgn}
              replay={replayControls}
            />
          ) : (
            <PlayActions
              session={session}
              scanning={scanning}
              thinking={thinking}
              engineError={engineError}
              onExtend={game.extend}
              onFinish={game.finish}
              onDiscard={game.discard}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * What the game is, in one line: the course it was started in, the chapter it
 * is sparring against when it has one, and the strength it is being played at.
 *
 * It is here because the Course dropdown no longer waits for the game. A game
 * belongs to the course it was started in and is judged against that course's
 * repertoire, so with the header free to name another one, the game has to say
 * which it is. The titles come from the game itself, captured when it started.
 *
 * The level is here because the report and the Progress list both name it, and
 * the screen the game is actually played on should not be the one place that
 * does not.
 */
function openingLine(
  courseTitle: string | null,
  chapterTitle: string | null,
  level: number | null,
  side: PlaySide = 'course',
): string | null {
  if (!courseTitle) return null
  const parts = [`Opening: ${courseTitle}`]
  if (side === 'other') parts.push('playing the other side')
  if (chapterTitle) parts.push(`sparring against ${chapterTitle}`)
  if (level !== null) parts.push(`against ${levelName(level)}`)
  return parts.join(', ')
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
 * Keep playing is the only button left here. Phase 26 moved New game, Undo
 * and Redo under the board, where a hand already is: they are things you do to
 * the game while playing it, and they were text links in a corner. Keep
 * playing is not one of those - it is what you press when the game is over -
 * so it stays with the status that says the game is over.
 */
export function PlayHead({
  session,
  opening,
  opponentColour,
  thinking,
  reviewed,
}: {
  session: PlaySession
  opening: string | null
  opponentColour: Colour
  thinking: boolean
  reviewed: boolean
}) {
  const finished = session.isFinished()
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
    </header>
  )
}

/**
 * How the engine plays the course when it has the course's side.
 *
 * Its own component because it only appears once Play the other side is
 * chosen, and the help test renders screens to a string with no way to
 * choose anything: rendered on its own, both names are held to the screen
 * the same way the buttons under the board are.
 */
export function CourseMovesChoice({
  value,
  onChange,
}: {
  value: CourseMoves
  onChange: (next: CourseMoves) => void
}) {
  return (
    <fieldset className="other-side">
      <legend>How the course plays</legend>
      <label>
        <input type="radio" checked={value === 'always'} onChange={() => onChange('always')} />
        The course move every time
      </label>
      <p className="hint">The pure line, so you meet the opening as the course teaches it.</p>
      <label>
        <input
          type="radio"
          checked={value === 'sometimes'}
          onChange={() => onChange('sometimes')}
        />
        Sometimes a listed alternative
      </label>
      <p className="hint">
        Three times in four the course move; otherwise one of the tries the course grades at
        that position, so you meet the ways it goes slightly wrong.
      </p>
    </fieldset>
  )
}

/**
 * The row of buttons under the board.
 *
 * Under the board because that is where the hand is, and real buttons because
 * these do things to the game: New game throws it away, Undo and Redo move it,
 * Hint answers it. They were text links in the top corner, which read as
 * navigation rather than as controls.
 *
 * New game first, because it is the one you look for; then the two that move
 * the game; then the one that helps with the position in front of you.
 */
export function PlayControls({
  session,
  thinking,
  reviewed,
  canHint,
  canResume,
  replay,
  playFromWhy,
  onNew,
  onResume,
  onUndo,
  onRedo,
  onHint,
  onPlayFrom,
}: {
  session: PlaySession
  thinking: boolean
  reviewed: boolean
  canHint: boolean
  /** Whether this game can be carried on from where it stopped. */
  canResume: boolean
  /** The stepping arrows, once there is a reviewed game to walk. */
  replay: ReplayControls | null
  /**
   * Why Play from here is off at the position showing, or empty when it is
   * on. Null when there is no replay at all and the button does not belong.
   */
  playFromWhy: string | null
  onNew: () => void
  onResume: () => void
  onUndo: () => void
  onRedo: () => void
  onHint: () => void
  onPlayFrom: () => void
}) {
  const frozen = thinking || reviewed
  return (
    <>
      {/* Row one: the game itself, and it is the same four buttons whether a
          game is running or finished. */}
      <div className="play-controls">
        <button type="button" onClick={onNew}>
          New game
        </button>
        <button type="button" onClick={onUndo} disabled={frozen || !session.canUndo()}>
          Undo
        </button>
        <button type="button" onClick={onRedo} disabled={frozen || !session.canRedo()}>
          Redo
        </button>
        <button type="button" onClick={onHint} disabled={!canHint}>
          Hint
        </button>
      </div>

      {/* Row two: what a reviewed game offers, and it exists only while one is
          showing. Two rows rather than one because the board is 416px and one
          row of all of these does not fit under it.

          The two on the left are the pair people confuse, so they are side by
          side and each says in its tooltip what happens to the record. Keep
          playing was a text link in the header until 1.6.13; it does a thing
          to the game exactly as these do, and reading as navigation was the
          wrong shape for it. */}
      {replay ? (
        <div className="play-controls play-review-row">
          {canResume ? (
            <button
              type="button"
              onClick={onResume}
              title="Carry on this game from its final position. Reviewing again replaces this game's record."
            >
              Keep playing
            </button>
          ) : null}
          {playFromWhy !== null ? (
            <button
              type="button"
              onClick={onPlayFrom}
              disabled={playFromWhy !== ''}
              title={
                playFromWhy === ''
                  ? "Start a new game from the position on the board. This game's record is kept as it is."
                  : playFromWhy
              }
            >
              Play from here
            </button>
          ) : null}
          {/* `auto` on this group is what puts it at the board's right edge,
              so the row spans the board exactly. An arrow is not a name, so
              each carries a written one for a screen reader and for the
              tooltip, the same as Study's. */}
          <div className="play-steps">
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
        </div>
      ) : null}
    </>
  )
}

/**
 * The engine's preferred move as a blue arrow, while the replay is standing
 * on the position a slip was played from. The move that was played stays
 * highlighted as the last move, so both are on the board at once: what was
 * done and what the engine would have done. Blue is the engine hint's colour,
 * because it is the same kind of answer.
 */
export function preferredShapes(report: GameReport, ply: number, fen: string): Shape[] {
  const slip = report.slips.find((entry) => entry.ply === ply && entry.better)
  if (!slip?.better) return []
  const squares = squaresForSan(fen, slip.better)
  if (!squares) return []
  return [{ orig: squares.from, dest: squares.to, brush: 'blue' }]
}

/** The hint as an arrow: the repertoire's move in green, the engine's in blue. */
function hintShapes(hint: Hint | null, fen: string): Shape[] {
  if (!hint) return []
  const squares = squaresForSan(fen, hint.san)
  if (!squares) return []
  return [{ orig: squares.from, dest: squares.to, brush: hint.source === 'book' ? 'green' : 'blue' }]
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
  onDiscard,
}: {
  session: PlaySession
  scanning: { done: number; total: number } | null
  thinking: boolean
  engineError: string | null
  onExtend: (by: 5 | 'full') => void
  onFinish: () => void
  /** Phase 39: end the game with nothing kept. */
  onDiscard: () => void
}) {
  const finished = session.isFinished()
  const capped = session.finishedByCap()
  return (
    <div className="play-actions">
      {finished ? (
        <p className="notice">
          {session.outcome ? `${session.outcome}.` : 'The game has reached its length.'} Review
          it to see where you left the repertoire and what it cost.
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
      {/* Review, or throw the game away. Discard sits second because review
          is what a game is for; there is no confirmation, because an unsaved
          game is the smallest thing the app holds and New game already ends
          one the same way. Once a report exists this block is gone and Delete
          on Progress is the way out. */}
      <div className="play-extend">
        <button type="button" className="primary" onClick={onFinish} disabled={thinking}>
          {scanning
            ? `Scanning ${scanning.done} of ${scanning.total}...`
            : finished
              ? 'Review the game'
              : 'Stop and review'}
        </button>
        <button type="button" onClick={onDiscard} disabled={thinking}>
          Stop and discard
        </button>
      </div>
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
  rows,
}: {
  session: PlaySession
  activePly: number | null
  onSelect: (ply: number) => void
  /** How many rows show before it scrolls. */
  rows: number
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
        // The list is shorter than the game, so the move the board is standing
        // on has to be brought to where somebody can see it. `nearest` scrolls
        // only when it has to, which keeps the list still while stepping
        // through moves that are already on screen.
        ref={(node) => {
          if (node && here) node.scrollIntoView({ block: 'nearest' })
        }}
        onClick={() => onSelect(entry.ply + 1)}
      >
        {entry.san}
      </button>
    )
  }

  return (
    <ol
      className={activePly === null ? 'move-list' : 'move-list walkable'}
      style={{ height: `calc(${rows} * 1.45em)` }}
    >
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
  const against = report.deviation.kind === 'course-book-ended'
  const strayed = describeAlternatives(report.deviation)
  return (
    <div className="report">
      <h3>The report</h3>

      {/* No repertoire to be judged against on the other side, so the first
          part is about the course instead: how far its book lasted, and
          where the engine took one of the tries the course grades. */}
      <h4>{against ? 'The course' : 'The repertoire'}</h4>
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
      {strayed.length > 0 ? (
        <ul className="strayed">
          {report.deviation.alternatives?.map((played, index) => (
            <li key={played.ply}>
              <button type="button" className="jump" onClick={() => replay.onJump(played.ply)}>
                {strayed[index]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <h4>Your moves</h4>
      {report.hints ? (
        <p className="hint-count">
          You used {report.hints} {report.hints === 1 ? 'hint' : 'hints'}.
        </p>
      ) : null}
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
 * Puts text on the clipboard, by whichever of the two ways works.
 *
 * `navigator.clipboard` is the one to use and it is what both builds have.
 * It is also the one that can be refused: it needs a secure context and a
 * permission, and an embedded browser can say no to a page that a person
 * clicking a button in the real app would be allowed. So the old
 * `execCommand` path is kept behind it rather than the button simply failing
 * where the modern API is not permitted. It is deprecated and it is also the
 * thing that works, which is a fair trade for a fallback nobody sees.
 */
async function toClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    // Fall through and try the old way before giving up.
  }
  const box = document.createElement('textarea')
  box.value = text
  // Off the screen rather than hidden: a display:none textarea cannot be
  // selected, and selection is the whole mechanism here.
  box.style.position = 'fixed'
  box.style.left = '-9999px'
  document.body.appendChild(box)
  try {
    box.select()
    if (!document.execCommand('copy')) throw new Error('the browser refused to copy')
  } finally {
    box.remove()
  }
}

/**
 * The game on the clipboard, as PGN with the report written in.
 *
 * The point is that a game can leave this app as text: pasted into a chat, a
 * file, or another engine, and played through by whoever reads it. A
 * screenshot was the only way before, and nobody can replay a screenshot.
 *
 * A failure says so on the button rather than leaving one that looks as
 * though it worked.
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
      await toClipboard(text)
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
 * It carries the number, which is Nick's phase 46 ruling and reverses the
 * phase 23 one that it would not. Where the number goes is `numberPlacement`'s
 * answer rather than this component's, and the two classes below are all that
 * reaches the stylesheet, because a colour belongs in CSS and a piece colour
 * doubly so. The report's own bar still speaks in words: it is read once, with
 * the report, where a word is what the reader can act on.
 */
function LiveEvalBar({
  evaluation,
  studentColour,
}: {
  /** Undefined until the engine has looked at something. */
  evaluation: Evaluation | undefined
  studentColour: Colour
}) {
  const layout = evalBarLayout(evaluation?.pawns ?? 0, studentColour)
  const placement = numberPlacement(layout)
  return (
    <div
      className="live-eval"
      role="img"
      aria-label={
        evaluation === undefined
          ? 'Evaluation: the engine has not looked yet'
          : `Evaluation: ${evaluation.text}`
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
      {evaluation !== undefined ? (
        <span
          className={`live-eval-number at-${placement.edge} ${placement.onWhite ? 'on-white' : 'on-black'}`}
        >
          {evaluation.text}
        </span>
      ) : null}
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
