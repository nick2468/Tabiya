import { cardKey } from '../model/ids'
import type { Schedule } from '../scheduler'
import type { GameLength } from '../play/session'
import type { BackupOffer } from './safety'

/**
 * Progress: everything the trainee has done, in one versioned JSON object.
 *
 * The store is an interface on purpose. Until phase 5 the app runs in a browser
 * and progress lives in localStorage; the Tauri wrap then swaps in a file in
 * AppData without touching a single call site. Every method is async for the
 * same reason: file writes are, localStorage is not, and the async shape is the
 * one that survives the swap.
 *
 * Export and import are part of the interface, not an extra. They are the
 * backup story and the migration path from the browser phase to the wrapped
 * app.
 */

/** The current shape. Bump it and add a migration when the shape changes. */
export const PROGRESS_VERSION = 4

/**
 * The course everything in a version 3 file belongs to.
 *
 * Version 3 predates courses, so it had no way of saying which repertoire its
 * line ids, card keys and games were about. There was only one, and this is its
 * id. The migration stamps it on everything, which is why the id can never
 * change: it is written into the format.
 */
export const LEGACY_COURSE_ID = 'london-white'

/**
 * How many finished games the progress file remembers.
 *
 * Enough to give a deviation rate that means something, and few enough that
 * the file stays small. The counts shown are over this window, not all time.
 */
export const PLAY_HISTORY = 100

/**
 * How many recent answers each concept tag remembers.
 *
 * The weak-area filter wants to know how the trainee is going NOW, not a
 * lifetime average that a bad first week can weigh down for months. Twenty is
 * enough to be steady and short enough to move when the trainee improves.
 */
export const TAG_WINDOW = 20

export interface ProgressState {
  version: number
  /** Line ids the trainee has marked as learnt. See src/model/lines.ts. */
  learntLines: string[]
  /** One FSRS schedule per drill card, keyed by the card's position key. */
  cards: Record<string, Schedule>
  /**
   * The last few answers for each concept tag, newest last: 1 for the
   * repertoire move, 0 for anything else. Capped at TAG_WINDOW.
   *
   * Kept per course, and pooling them would be wrong rather than merely
   * untidy (SPEC.md section 10). Two courses share the core tags, so a strong
   * repertoire would hide a weak one behind an average that describes neither.
   */
  tagHistory: Record<string, Record<string, number[]>>
  /** Finished games, newest last, capped at PLAY_HISTORY. */
  playGames: PlayRecord[]
  /**
   * Course ids the trainee has put out of the way.
   *
   * Hiding is not deleting. A hidden course keeps every learnt line, card
   * schedule and concept answer, because all of those are keyed by course id
   * and nothing here prunes them. It leaves the catalog, the course switcher
   * and the drill queue, and unhiding brings it and its cards back exactly as
   * they were. That is why hiding works on a bundled course, which cannot be
   * deleted at all: a bundled course is compiled into the app and would be
   * back at the next start.
   *
   * This field does NOT bump the version, deliberately (ruled 2026-08-31).
   * `parseProgress` refuses any file from a newer build outright, so bumping
   * would turn a cosmetic flag into a wall between this build and the last
   * one. An older build drops the field it does not know and shows every
   * course, which is the right way for this to fail.
   */
  hiddenCourses: string[]
}

/** What one finished game is worth remembering. */
export interface PlayRecord {
  /** The course the game was played out of. */
  courseId: string
  /** The chapter a targeted game sparred against, when there was one. */
  chapterId?: string
  /** True when the student was the first to leave the repertoire. */
  deviated: boolean
  /** The full move number where that happened. */
  deviationMove?: number
  /** How many moves the game ran to. */
  moves: number
  /** The strength level played against. */
  level: number
  /** When it finished, as an ISO timestamp. */
  at: string
  /**
   * Every move of the game, in order, so Progress can say which lines were
   * played. Optional, and it stays optional: games recorded before phase 24
   * never kept their moves and there is nothing to reconstruct them from.
   * `PROGRESS_VERSION` does not move for it, because no old file needs
   * rewriting to be read - a missing list simply counts for nothing.
   */
  sans?: string[]
  /**
   * How many hints were used. Optional like `sans`, and for the same reason:
   * games recorded before phase 26 have none and there is nothing to
   * reconstruct. Nothing counts games by it; the report and the PGN say it.
   */
  hints?: number
  /**
   * How the game ended, when it ended by itself: the session's own sentence,
   * "You won by checkmate" or "Drawn by stalemate". A game that was stopped
   * has none, and the screen says "Stopped" plus the verdict instead.
   */
  outcome?: string
  /**
   * The final evaluation in pawns from White's point of view, from the report.
   * Kept from White's side, the way every evaluation in this app is, and
   * turned to the trainee's side where it is read.
   */
  finalEval?: number
  /**
   * The length the game was set to play. It is what tells a game that ran out
   * of moves from one that was stopped by hand: without it the two look
   * identical afterwards. Records from before phase 28 have none.
   */
  length?: GameLength
}

export function emptyProgress(): ProgressState {
  return {
    version: PROGRESS_VERSION,
    learntLines: [],
    cards: {},
    tagHistory: {},
    playGames: [],
    hiddenCourses: [],
  }
}

/**
 * What a read produced.
 *
 * The `failure` is the important half. A store that cannot read its own file
 * used to hand back a blank state, and the app would then save that blank
 * state straight over the file it had failed to read - so one bad read cost
 * the trainee everything. Now a failed read says so, and the caller must not
 * write until it is resolved.
 *
 * A file that does not exist yet is only a new trainee when nothing says
 * otherwise. Phase 16 made the app look for evidence of an earlier save before
 * it believes that, because Nick deleted his data folder and the app wrote a
 * blank file over the gap. See `safety.ts`.
 */
export interface LoadedProgress {
  state: ProgressState
  /**
   * Why nothing may be saved, as a whole message ready to show. The store
   * writes the whole thing rather than a fragment, because the reasons differ
   * too much for one wrapper sentence to fit them all.
   */
  failure?: string
  /**
   * A second copy of the progress file, found because the main one had gone.
   * Offered, never applied: the trainee chooses whether to put it back.
   */
  restore?: BackupOffer
  /**
   * Something that happened on the way to reading it that the trainee should
   * be told about once, such as the data folder moving. Not a problem: a
   * problem is a failure.
   */
  note?: string
}

export interface ProgressStore {
  /** Reads the saved state, or a fresh one when nothing is saved yet. */
  load(): Promise<LoadedProgress>
  save(state: ProgressState): Promise<void>
  /** The whole state as JSON text, for the trainee to keep somewhere safe. */
  exportJson(): Promise<string>
  /** Replaces the saved state from exported text. Throws when the text is bad. */
  importJson(text: string): Promise<ProgressState>
}

/**
 * Reads whatever was stored and returns something usable.
 *
 * Progress is precious and cheap to be careful with, so a state that is partly
 * wrong loses only the parts that are wrong. A file that is not JSON at all,
 * or carries a version this build does not know, is a different matter: the
 * caller is told rather than quietly handed an empty slate.
 */
export function parseProgress(raw: unknown): ProgressState {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('progress must be a JSON object')
  }
  const record = raw as Record<string, unknown>
  const version = typeof record.version === 'number' ? record.version : 0
  if (version > PROGRESS_VERSION) {
    throw new Error(
      `this progress file was written by a newer version of the app (version ${version})`,
    )
  }
  // Everything before version 4 predates courses. Reading it and stamping the
  // London on it IS the migration: nothing the trainee did is lost, and a file
  // written by v1 of the app still opens.
  const preCourses = version < 4
  const learntLines = Array.isArray(record.learntLines)
    ? record.learntLines.filter((id): id is string => typeof id === 'string')
    : []
  // A version 1 file has no cards and no history either. Reading those as an
  // empty pair is the rest of the same migration: the drill schedule simply
  // starts again from the learnt lines.
  return {
    version: PROGRESS_VERSION,
    learntLines: [...new Set(preCourses ? learntLines.map(scopeLineId) : learntLines)],
    cards: readCards(record.cards, preCourses),
    tagHistory: readTagHistory(record.tagHistory, preCourses),
    playGames: readPlayGames(record.playGames, preCourses),
    hiddenCourses: readIds(record.hiddenCourses),
  }
}

/**
 * A list of ids, read with the same care as the learnt lines: anything that is
 * not a string goes, and a missing list is an empty one. A file written before
 * phase 16 simply has no hidden courses, which is the right answer for it.
 */
function readIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.filter((id): id is string => typeof id === 'string'))]
}

/** A pre-course line id, moved into the course it always belonged to. */
function scopeLineId(id: string): string {
  return `${LEGACY_COURSE_ID}/${id}`
}

/** Keeps the game records that look like records and drops the rest. */
function readPlayGames(raw: unknown, preCourses: boolean): PlayRecord[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((entry): entry is Record<string, unknown> => {
      if (typeof entry !== 'object' || entry === null) return false
      const record = entry as Record<string, unknown>
      return typeof record.deviated === 'boolean' && typeof record.at === 'string'
    })
    .map((entry) => {
      if (!preCourses) return entry as unknown as PlayRecord
      const chapterId = typeof entry.chapterId === 'string' ? entry.chapterId : undefined
      return {
        ...entry,
        courseId: LEGACY_COURSE_ID,
        chapterId: chapterId === undefined ? undefined : `${LEGACY_COURSE_ID}/${chapterId}`,
      } as unknown as PlayRecord
    })
    .slice(-PLAY_HISTORY)
}

/** Keeps the schedules that look like schedules and drops the rest. */
function readCards(raw: unknown, preCourses: boolean): Record<string, Schedule> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const cards: Record<string, Schedule> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue
    const schedule = value as Record<string, unknown>
    if (typeof schedule.due !== 'string') continue
    if (typeof schedule.state !== 'number') continue
    // A pre-course key is a bare position. The card it schedules is the same
    // card; only its name has grown a course.
    cards[preCourses ? cardKey(LEGACY_COURSE_ID, key) : key] = schedule as unknown as Schedule
  }
  return cards
}

/**
 * The per-course tag history. A pre-course file has one flat map, which is the
 * London's, so it is read into that one course.
 */
function readTagHistory(
  raw: unknown,
  preCourses: boolean,
): Record<string, Record<string, number[]>> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  if (preCourses) {
    const answers = readTagAnswers(raw)
    return Object.keys(answers).length > 0 ? { [LEGACY_COURSE_ID]: answers } : {}
  }
  const history: Record<string, Record<string, number[]>> = {}
  for (const [courseId, value] of Object.entries(raw as Record<string, unknown>)) {
    const answers = readTagAnswers(value)
    if (Object.keys(answers).length > 0) history[courseId] = answers
  }
  return history
}

/** One course's tags: the answer windows that still look like answer windows. */
function readTagAnswers(raw: unknown): Record<string, number[]> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const answers: Record<string, number[]> = {}
  for (const [tag, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue
    const window = value
      .filter((entry): entry is number => entry === 0 || entry === 1)
      .slice(-TAG_WINDOW)
    if (window.length > 0) answers[tag] = window
  }
  return answers
}

/** Parses exported text. Kept separate so the error mentions the text, not the store. */
export function parseProgressJson(text: string): ProgressState {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('that file is not valid JSON')
  }
  return parseProgress(parsed)
}

/** The default key. Exported so tests and the Tauri swap can name it. */
export const STORAGE_KEY = 'london-trainer.progress'

/**
 * The browser implementation. It fails soft on read: a corrupted entry should
 * not stop the app from opening, so it starts fresh and says so on the console
 * rather than throwing into a render.
 */
export class LocalStorageProgressStore implements ProgressStore {
  private readonly storage: Storage
  private readonly key: string

  constructor(storage: Storage = localStorage, key: string = STORAGE_KEY) {
    this.storage = storage
    this.key = key
  }

  async load(): Promise<LoadedProgress> {
    let text: string | null
    try {
      text = this.storage.getItem(this.key)
    } catch (error) {
      return { state: emptyProgress(), failure: readFailure(describe(error)) }
    }
    // Nothing saved yet is not a failure: it is a new trainee.
    if (text === null) return { state: emptyProgress() }
    try {
      return { state: parseProgressJson(text) }
    } catch (error) {
      return { state: emptyProgress(), failure: readFailure(describe(error)) }
    }
  }

  async save(state: ProgressState): Promise<void> {
    this.storage.setItem(this.key, JSON.stringify(state))
  }

  async exportJson(): Promise<string> {
    return JSON.stringify((await this.load()).state, null, 2)
  }

  async importJson(text: string): Promise<ProgressState> {
    const state = parseProgressJson(text)
    await this.save(state)
    return state
  }
}

/**
 * The banner shown when the saved progress could not be read.
 *
 * One place writes it, because it is a promise: nothing is written while it is
 * showing, and there is a way out. `why` is the fragment that finishes "could
 * not be read:".
 */
export function readFailure(why: string): string {
  return (
    `Your saved progress could not be read: ${why} Nothing will be saved while this is ` +
    'showing, so whatever is on disk is still there. Import a backup from the Progress ' +
    'screen to carry on.'
  )
}

/** An error as a sentence, for showing the trainee. */
export function describe(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error)
  // Error messages rarely end in punctuation, and the failure notice reads
  // them mid-paragraph, so give the sentence its full stop.
  return /[.!?]$/.test(text) ? text : `${text}.`
}

/** True when the line is marked learnt. */
export function isLearnt(state: ProgressState, lineId: string): boolean {
  return state.learntLines.includes(lineId)
}

/** Returns a new state with the line's learnt flag flipped. */
export function toggleLearnt(state: ProgressState, lineId: string): ProgressState {
  const learntLines = isLearnt(state, lineId)
    ? state.learntLines.filter((id) => id !== lineId)
    : [...state.learntLines, lineId]
  return { ...state, learntLines }
}

/** True when the trainee has put this course out of the way. */
export function isHidden(state: ProgressState, courseId: string): boolean {
  return state.hiddenCourses.includes(courseId)
}

/**
 * Returns a new state with the course hidden, or shown again.
 *
 * Nothing else in the state moves. That is the whole promise hiding makes, and
 * it is the same promise deleting a course folder already keeps: learnt lines
 * and card schedules are keyed by course id and nothing prunes them.
 */
export function toggleHidden(state: ProgressState, courseId: string): ProgressState {
  const hiddenCourses = isHidden(state, courseId)
    ? state.hiddenCourses.filter((id) => id !== courseId)
    : [...state.hiddenCourses, courseId]
  return { ...state, hiddenCourses }
}

/** The schedule for a card, or undefined when it has never been answered. */
export function scheduleFor(state: ProgressState, cardKey: string): Schedule | undefined {
  return state.cards[cardKey]
}

/**
 * Records one answer: the card's new schedule, and a mark against every concept
 * the card carries, in the card's own course.
 */
export function recordAnswer(
  state: ProgressState,
  courseId: string,
  key: string,
  tags: string[],
  correct: boolean,
  schedule: Schedule,
): ProgressState {
  const answers = { ...(state.tagHistory[courseId] ?? {}) }
  for (const tag of tags) {
    answers[tag] = [...(answers[tag] ?? []), correct ? 1 : 0].slice(-TAG_WINDOW)
  }
  return {
    ...state,
    cards: { ...state.cards, [key]: schedule },
    tagHistory: { ...state.tagHistory, [courseId]: answers },
  }
}

/** Every concept the trainee has answered in one course. */
export function courseTags(state: ProgressState, courseId: string): string[] {
  return Object.keys(state.tagHistory[courseId] ?? {})
}

/**
 * How often the repertoire move came to mind for a concept lately, from 0 to 1,
 * or null when the concept has not been drilled yet in this course. An untried
 * concept is not a weak one, and saying it scored zero would be a lie.
 */
export function tagAccuracy(state: ProgressState, courseId: string, tag: string): number | null {
  const answers = state.tagHistory[courseId]?.[tag]
  if (!answers || answers.length === 0) return null
  return answers.reduce((sum, answer) => sum + answer, 0) / answers.length
}

/**
 * Puts a finished game in the history, replacing the record with the same
 * `at` if there already is one.
 *
 * `at` is the game's identity, not just its date. A game can now be resumed
 * after it has been reviewed and reviewed again, and it is still one game:
 * appending would count it twice in "Games played" and in "Lines played",
 * once short and once long. The later record wins, because it is the same
 * game with more of it played.
 */
export function recordGame(state: ProgressState, game: PlayRecord): ProgressState {
  const kept = state.playGames.filter((held) => held.at !== game.at)
  return { ...state, playGames: [...kept, game].slice(-PLAY_HISTORY) }
}

/** How many answers the rolling window currently holds for a concept. */
export function tagAnswerCount(state: ProgressState, courseId: string, tag: string): number {
  return state.tagHistory[courseId]?.[tag]?.length ?? 0
}
