import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Shell } from './App'
import { Drill, Feedback } from './Drill'
import { Play, PlayHead, Report } from './Play'
import { Progress } from './Progress'
import { Study } from './Study'
import { CatalogContext, type Catalog } from './catalog-context'
import { ProgressContext, type Progress as ProgressValue } from './progress-context'
import { HELP_CONTROLS, HELP_DOCUMENT, HELP_SECTIONS, PANELS, type Screen } from './help-text'
import { bundledCourses } from '../content'
import { PlaySession, buildBook, type GameReport } from '../play'
import type { Engine, SearchResult } from '../engine'
import { strengthProfile } from '../engine'
import { buildCardsAcross } from '../model/cards'
import { judge } from '../model/grade'
import { courseLineIds } from '../model/lines'
import { emptyProgress, type ProgressState } from '../storage/progress'
import type { CourseEntry, LoadedCourse } from '../model/types'

/**
 * The help has to stay true, and the way it goes false is quiet.
 *
 * Phase 17 renamed "Start" to "Reset" and "Play a game from here" to "Play
 * from here". Help written the week before would have named two controls that
 * no longer existed, and nothing would have failed. So `help-text.ts` lists
 * every control its prose names by name, and this walks the screens looking
 * for each one. A rename that misses the help turns the suite red instead of
 * turning the help into a lie.
 *
 * The second half is drift between the Help document and the `?` panels. A
 * panel is a paragraph of its section rather than a copy of it, and that is
 * checked here rather than trusted.
 */

const course = bundledCourses.find((entry) => entry.id === 'london-white')
if (!course) throw new Error('the London is not in the bundled set')

// A second course, because two is what makes the Course dropdown and Drill's
// two options exist at all. One course has nothing to choose between.
const other = bundledCourses.find((entry) => entry.id === 'caro-kann-black')
if (!other) throw new Error('the Caro-Kann is not in the bundled set')

/**
 * The app at a chosen state, through the context rather than the provider.
 *
 * The provider reads its store in an effect and rendering to a string runs no
 * effects, so the provider always renders the empty state. Drill's start
 * screen only exists once something has been learnt, so it can only be reached
 * this way.
 */
function progressValue(state: ProgressState): ProgressValue {
  return {
    state,
    loaded: true,
    failure: null,
    note: null,
    restore: null,
    putBack: () => {},
    learnt: (lineId: string) => state.learntLines.includes(lineId),
    toggle: () => {},
    hidden: () => false,
    toggleHidden: () => {},
    answer: () => {},
    recordPlay: () => {},
    exportJson: async () => JSON.stringify(state),
    importJson: async () => {},
  }
}

const learntOne: ProgressState = {
  ...emptyProgress(),
  learntLines: [[...courseLineIds(course)][0]],
}

/**
 * A catalog with the folder scan already finished.
 *
 * Through the provider the scan never runs, so `folder` stays null and the
 * controls that only exist in the installed app do not render. This is the
 * installed app's catalog: two bundled courses, and a folder to drop more
 * into.
 */
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
  folder: 'C:/Users/example/Repertoire Trainer/courses',
  find: (id: string) => [course, other].find((each) => each.id === id),
  rescan: async () => {},
}

/** A screen, inside the two contexts every screen expects above it. */
function inApp(state: ProgressState, view: ReactNode): string {
  return renderToStaticMarkup(
    createElement(
      ProgressContext,
      { value: progressValue(state) } as never,
      createElement(CatalogContext, { value: catalog } as never, view),
    ),
  )
}

const firstCard = buildCardsAcross([course], learntOne.learntLines).cards[0]
if (!firstCard) throw new Error('a learnt line built no cards')

/**
 * A game in progress, and a report on one.
 *
 * Both only exist on the Play screen AFTER something has happened, and the
 * help names controls in both. Rendering the start screen alone would leave
 * Undo, Redo and the report's three headings unheld, which is exactly the kind
 * of gap this file exists to close. The engine is a stub because nothing here
 * asks it anything: the session is built and looked at, never played.
 */
const stubEngine: Engine = {
  start: async () => {},
  setStrength: async () => {},
  newGame: async () => {},
  search: async (): Promise<SearchResult> => ({ bestMove: null, candidates: [] }),
  stop: () => {},
}

const gameInProgress = new PlaySession({
  book: buildBook({ colour: course.colour, chapters: course.chapters }),
  engine: stubEngine,
  profile: strengthProfile(4),
  length: 'move15',
})

const reportFixture: GameReport = {
  deviation: { kind: 'stayed-in-book' },
  slips: [],
  verdict: 'Level',
  finalEval: 0,
  outcome: 'Stopped after move 5',
}

const screens: Record<Screen, string> = {
  // The shell opens on the catalog, so one render covers the nav and the
  // front door.
  nav: inApp(learntOne, createElement(Shell)),
  catalog: inApp(learntOne, createElement(Shell)),
  study: inApp(learntOne, createElement(Study, { course, onPlayFrom: () => {} })),
  play:
    inApp(learntOne, createElement(Play, { course, request: null, onRequestUsed: () => {} })) +
    renderToStaticMarkup(
      createElement(PlayHead, {
        session: gameInProgress,
        opponentColour: 'black' as const,
        thinking: false,
        reviewed: false,
        onUndo: () => {},
        onRedo: () => {},
        onNew: () => {},
      }),
    ) +
    renderToStaticMarkup(
      createElement(Report, { report: reportFixture, opponentColour: 'black' as const }),
    ),
  drill:
    inApp(
      learntOne,
      createElement(Drill, { courseId: course.id, scope: 'mixed', onScope: () => {} }),
    ) +
    renderToStaticMarkup(
      createElement(Feedback, {
        card: firstCard,
        verdict: judge(firstCard, firstCard.san),
        state: learntOne,
        onNext: () => {},
      }),
    ),
  progress: inApp(learntOne, createElement(Progress, { courseId: course.id })),
}

/**
 * Every name a control on the screen answers to.
 *
 * Rendered markup rather than a DOM, so the accessible name is worked out the
 * blunt way: the text of the elements that carry one, plus every aria-label. A
 * caption with a nested control in it is read both with and without that
 * control's own text, which is how "Who you are playing" is found inside a
 * legend that also holds the `?` button.
 */
function controlNames(html: string): Set<string> {
  const found = new Set<string>()
  const add = (raw: string) => {
    const text = raw
      .replace(/<[^>]*>/g, ' ')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()
    if (text) found.add(text)
  }
  const carriers = /<(button|legend|label|th|h2|h3|h4)\b[^>]*>([\s\S]*?)<\/\1>/g
  for (const match of html.matchAll(carriers)) {
    add(match[2])
    add(match[2].replace(/<button[\s\S]*?<\/button>/g, ' '))
  }
  for (const match of html.matchAll(/aria-label="([^"]*)"/g)) add(match[1])
  return found
}

/**
 * Whether a screen has a control by this name.
 *
 * Exact, or the name followed by a colon. A control is allowed to carry its
 * detail after one: "Drill mixed: every course, 12 due" is the control called
 * Drill mixed, and the count beside it is what makes the choice readable
 * before it is made. The colon is the only separator accepted, so appending
 * anything else to a name still fails - "Start drilling now" is not "Start
 * drilling".
 */
function hasControl(names: Set<string>, name: string): boolean {
  for (const found of names) {
    if (found === name || found.startsWith(`${name}:`)) return true
  }
  return false
}

const named: Record<Screen, Set<string>> = {
  nav: controlNames(screens.nav),
  catalog: controlNames(screens.catalog),
  study: controlNames(screens.study),
  play: controlNames(screens.play),
  drill: controlNames(screens.drill),
  progress: controlNames(screens.progress),
}

describe('the help document', () => {
  it('carries the eight sections, in reading order', () => {
    expect(HELP_SECTIONS.map((section) => section.id)).toEqual([
      'what',
      'loop',
      'courses',
      'study',
      'drill',
      'play',
      'progress',
      'words',
    ])
  })

  it('explains every word the words list promises', () => {
    const words = HELP_SECTIONS.find((section) => section.id === 'words')
    for (const word of [
      'Course',
      'Chapter',
      'Line',
      'Card',
      'Learnt',
      'Due',
      'Never answered',
      'Concept',
    ]) {
      expect(words?.body, word).toContain(`**${word}.**`)
    }
  })

  it('has no em dash in it, and no smart quote', () => {
    // Built from code points rather than written out: the house rule is that
    // none of these appear anywhere under src, and a test is not an exception.
    // Em dash, en dash, and the four smart quotes.
    const forbidden = [0x2014, 0x2013, 0x2018, 0x2019, 0x201c, 0x201d]
    for (const code of forbidden) {
      expect(HELP_DOCUMENT, `U+${code.toString(16)}`).not.toContain(String.fromCharCode(code))
    }
  })
})

describe('the ? panels', () => {
  it('say what the Help document says, word for word', () => {
    for (const [id, panel] of Object.entries(PANELS)) {
      expect(HELP_DOCUMENT, id).toContain(panel.text)
    }
  })

  it('are short enough to read in place', () => {
    for (const [id, panel] of Object.entries(PANELS)) {
      const sentences = panel.text.split('. ').length
      expect(sentences, id).toBeLessThanOrEqual(4)
      expect(panel.text.length, id).toBeLessThanOrEqual(420)
    }
  })
})

describe('the help against the app', () => {
  it.each(HELP_CONTROLS)('names $name, which is on the $screen screen', ({ name, screen }) => {
    expect(hasControl(named[screen], name), [...named[screen]].join(' | ')).toBe(true)
  })

  it('names nothing the prose does not actually use', () => {
    const prose = [HELP_DOCUMENT, ...Object.values(PANELS).map((panel) => panel.text)].join('\n')
    for (const control of HELP_CONTROLS) {
      expect(prose, control.name).toContain(control.name)
    }
  })
})
