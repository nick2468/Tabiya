import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Shell } from './App'
import { Play, PlayHead } from './Play'
import { Progress } from './Progress'
import { Study } from './Study'
import { CatalogContext, type Catalog } from './catalog-context'
import { PlayContext, type PlayGame } from './play-context'
import { ProgressContext, type Progress as ProgressValue } from './progress-context'
import { bundledCourses } from '../content'
import { PlaySession, buildBook } from '../play'
import { strengthProfile } from '../engine'
import { emptyProgress, type ProgressState } from '../storage/progress'
import type { CourseEntry, LoadedCourse } from '../model/types'

/**
 * A game keeps going while you look at another screen.
 *
 * It used to die: the game lived in `Play`'s own state, and `Play` unmounts
 * the moment the view changes, which also stopped the engine worker. Nick lost
 * a game to a glance at Study on his first afternoon with 1.6.4.
 *
 * The fix is that the game lives above the screen, in `PlayContext`, and that
 * is what these check. A test that renders to a string cannot click the nav,
 * so it does the next honest thing: it hands the screen a game through the
 * context and asserts the screen shows it. If the game went back into `Play`'s
 * own state, `Play` would render its start screen here and these would fail.
 *
 * Phase 24 took the other half off. The game used to hold the course switcher
 * still while it ran; Nick overruled that, so the header is free to name
 * another course and the game says its own above the board. The tests below
 * are the pair: the switcher is never greyed for a game, and the game is shown
 * under a header naming somebody else.
 */

const course = bundledCourses.find((entry) => entry.id === 'london-white')
const other = bundledCourses.find((entry) => entry.id === 'caro-kann-black')
if (!course || !other) throw new Error('the bundled set is missing a course this test needs')

function progressValue(state: ProgressState): ProgressValue {
  return {
    state,
    loaded: true,
    failure: null,
    note: null,
    restore: null,
    putBack: () => {},
    learnt: () => false,
    toggle: () => {},
    hidden: () => false,
    toggleHidden: () => {},
    answer: () => {},
    recordPlay: () => {},
    exportJson: async () => JSON.stringify(state),
    importJson: async () => {},
  }
}

const bundled = (loaded: LoadedCourse): CourseEntry => ({
  source: loaded.id,
  origin: 'bundled',
  course: loaded,
  errors: [],
})

const entries = [bundled(course), bundled(other)]
const catalog: Catalog = {
  entries,
  visible: entries,
  hidden: [],
  courses: [course, other],
  chapters: [...course.chapters, ...other.chapters],
  scanned: true,
  folder: null,
  find: (id: string) => [course, other].find((each) => each.id === id),
  rescan: async () => {},
}

const book = buildBook({ colour: course.colour, chapters: course.chapters })

/** A game that has had one move played in it, so there is something to lose. */
function playedGame(): PlaySession {
  const session = new PlaySession({
    book,
    engine: {
      start: async () => {},
      setStrength: async () => {},
      newGame: async () => {},
      search: async () => ({ bestMove: null, candidates: [] }),
      stop: () => {},
    },
    profile: strengthProfile(4),
    length: 'move15',
  })
  session.playStudent('d4')
  return session
}

/** A PlayGame with whatever the case is about, and nothing happening. */
function game(over: Partial<PlayGame> = {}): PlayGame {
  return {
    session: null,
    book: null,
    courseId: null,
    courseTitle: null,
    chapterTitle: null,
    level: null,
    recordedAt: null,
    hint: null,
    canHint: false,
    askHint: async () => {},
    canResume: false,
    resume: () => {},
    report: null,
    scanning: null,
    evaluations: new Map(),
    thinking: false,
    engineError: null,
    inProgress: false,
    start: async () => {},
    play: async () => {},
    undo: () => {},
    redo: () => {},
    extend: async () => {},
    finish: async () => {},
    reset: () => {},
    ...over,
  }
}

/** One recorded game that kept its moves, so Play on has something to offer. */
const withRecord: ProgressState = {
  ...emptyProgress(),
  playGames: [
    {
      courseId: course.id,
      deviated: false,
      moves: 3,
      level: 4,
      at: '2026-09-03T09:00:00.000Z',
      sans: ['d4', 'd5', 'Bf4'],
    },
  ],
}

function inApp(value: PlayGame, view: ReactNode, state: ProgressState = emptyProgress()): string {
  return renderToStaticMarkup(
    createElement(
      ProgressContext,
      { value: progressValue(state) } as never,
      createElement(
        CatalogContext,
        { value: catalog } as never,
        createElement(PlayContext, { value } as never, view),
      ),
    ),
  )
}

const running = game({
  session: playedGame(),
  book,
  courseId: course.id,
  courseTitle: course.title,
  inProgress: true,
})

const playScreen = createElement(Play, { course, request: null, onRequestUsed: () => {} })

/** A report with nothing in it, for the cases that only need one to exist. */
const reportOf = () => ({ deviation: { kind: 'stayed-in-book' as const }, slips: [], verdict: 'Level' })

describe('a game that outlives the screen', () => {
  it('is shown by Play because Play does not own it', () => {
    const html = inApp(running, playScreen)
    expect(html).toContain('New game')
    expect(html).toContain('Undo')
    // The start screen would be showing if the game had gone.
    expect(html).not.toContain('Start the game')
  })

  it('is still there after a look at another screen and back', () => {
    // Leaving unmounts Play and mounts Study; coming back mounts a new Play.
    // Nothing about the game is in either of them, so it survives both.
    const away = inApp(running, createElement(Study, { course, onPlayFrom: () => {} }))
    expect(away).not.toContain('Start the game')
    expect(inApp(running, playScreen)).toContain('New game')
  })

  it('is not shown when there is no game, which is the start screen', () => {
    expect(inApp(game(), playScreen)).toContain('Start the game')
  })
})

describe('the course switcher while a game runs', () => {
  const shell = createElement(Shell)

  it('is not greyed, because a game no longer holds the header still', () => {
    const html = inApp(running, shell)
    expect(html).not.toMatch(/<select[^>]*id="course-switch"[^>]*disabled/)
    expect(html).not.toContain('A game is in progress.')
  })

  it('is not greyed once the game has been reviewed either', () => {
    const reviewed = game({
      session: playedGame(),
      book,
      courseId: course.id,
      courseTitle: course.title,
      report: { deviation: { kind: 'stayed-in-book' }, slips: [], verdict: 'Level' },
      inProgress: false,
    })
    expect(inApp(reviewed, shell)).not.toMatch(/<select[^>]*id="course-switch"[^>]*disabled/)
  })

  it('is live when there is no game at all', () => {
    expect(inApp(game(), shell)).not.toMatch(/<select[^>]*id="course-switch"[^>]*disabled/)
  })
})

/**
 * Keep playing, and the one question it asks: is there anything to play?
 *
 * A game that stopped has a position to carry on from. A game that ended in a
 * checkmate or a draw does not, and a button that cannot do anything is worse
 * than no button.
 */
describe('carrying a reviewed game on', () => {
  const head = (over: { reviewed: boolean; canResume: boolean }) =>
    renderToStaticMarkup(
      createElement(PlayHead, {
        session: playedGame(),
        opening: 'Opening: The London System',
        opponentColour: 'black' as const,
        thinking: false,
        onResume: () => {},
        ...over,
      }),
    )

  it('offers Keep playing on a reviewed game that merely stopped', () => {
    expect(head({ reviewed: true, canResume: true })).toContain('Keep playing')
  })

  it('offers nothing of the sort while the game is still going', () => {
    expect(head({ reviewed: false, canResume: false })).not.toContain('Keep playing')
  })

  it('offers nothing on a game that ended, because there is nothing to play', () => {
    expect(head({ reviewed: true, canResume: false })).not.toContain('Keep playing')
  })

  it('is offered by the provider only for a reviewed game with no outcome', () => {
    // The screen asks the provider rather than working it out, so this is the
    // rule itself: a report, a session, and a game that did not end by itself.
    const stopped = game({ session: playedGame(), report: reportOf(), inProgress: false })
    expect(inApp({ ...stopped, canResume: true }, playScreen)).toContain('Keep playing')

    const mated = playedGame()
    mated.outcome = 'You were checkmated'
    expect(
      inApp({ ...game({ session: mated, report: reportOf() }), canResume: false }, playScreen),
    ).not.toContain('Keep playing')
  })
})

/**
 * One game at a time, which Play on has to respect.
 *
 * It clears a reviewed game to make room, and that is fine: a reviewed game is
 * over. A game still being played is not over, and losing one to a click on
 * another screen is the sort of thing nobody forgives.
 */
describe('playing on from a recorded game', () => {
  const progressScreen = createElement(Progress, {
    courseId: course.id,
    onPlayOn: () => {},
  })

  it('offers the recorded game when nothing is being played', () => {
    const html = inApp(game(), progressScreen, withRecord)
    expect(html).toContain('Play on')
    expect(html).not.toMatch(/<button[^>]*disabled[^>]*>\s*Play on/)
  })

  it('waits while a game is in progress rather than throwing it away', () => {
    const html = inApp(
      game({ session: playedGame(), courseId: course.id, inProgress: true }),
      progressScreen,
      withRecord,
    )
    expect(html).toMatch(/<button[^>]*disabled/)
    expect(html).toContain('A game is being played.')
  })

  /**
   * A game being played and a game being scanned are both "in progress", and
   * they are not the same wait. Nick saw the buttons dead and could not tell
   * which he was waiting for.
   */
  it('says it is a review it is waiting for, when it is', () => {
    const html = inApp(
      game({
        session: playedGame(),
        courseId: course.id,
        inProgress: true,
        scanning: { done: 3, total: 9 },
      }),
      progressScreen,
      withRecord,
    )
    expect(html).toContain('The game is being reviewed')
    expect(html).not.toContain('A game is being played.')
  })

  it('offers it again once that game has been reviewed, because it is over', () => {
    const html = inApp(
      game({ session: playedGame(), courseId: course.id, report: reportOf(), inProgress: false }),
      progressScreen,
      withRecord,
    )
    expect(html).not.toMatch(/<button[^>]*disabled[^>]*>\s*Play on/)
  })
})

describe('a game that names its own course', () => {
  it('says which course it is, above the board', () => {
    expect(inApp(running, playScreen)).toContain('Opening: The London System')
  })

  it('names the chapter too when the game is sparring against one', () => {
    const chapter = course.chapters[1]
    const targeted = game({
      session: playedGame(),
      book,
      courseId: course.id,
      courseTitle: course.title,
      chapterTitle: chapter.title,
      inProgress: true,
    })
    expect(inApp(targeted, playScreen)).toContain(
      `Opening: ${course.title}, sparring against ${chapter.title}`,
    )
  })

  it('is still shown when the header has moved on to another course', () => {
    // The screen is handed the OTHER course, the way the shell hands it
    // whatever the dropdown says, and the London game is still the one on
    // the board. It has to be: it is judged against the London.
    const html = inApp(
      running,
      createElement(Play, { course: other, request: null, onRequestUsed: () => {} }),
    )
    expect(html).toContain('Opening: The London System')
    expect(html).not.toContain('Start the game')
  })

  it('says nothing at all when there is no game', () => {
    expect(inApp(game(), playScreen)).not.toContain('Opening:')
  })
})
