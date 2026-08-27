import type { Schedule } from '../scheduler'

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
export const PROGRESS_VERSION = 2

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
   */
  tagHistory: Record<string, number[]>
}

export function emptyProgress(): ProgressState {
  return { version: PROGRESS_VERSION, learntLines: [], cards: {}, tagHistory: {} }
}

export interface ProgressStore {
  /** Reads the saved state, or a fresh one when nothing is saved yet. */
  load(): Promise<ProgressState>
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
  const learntLines = Array.isArray(record.learntLines)
    ? record.learntLines.filter((id): id is string => typeof id === 'string')
    : []
  // A version 1 file has no cards and no history. Reading it as an empty pair
  // of those IS the migration: nothing the trainee did is lost, and the drill
  // schedule simply starts from their learnt lines.
  return {
    version: PROGRESS_VERSION,
    learntLines: [...new Set(learntLines)],
    cards: readCards(record.cards),
    tagHistory: readTagHistory(record.tagHistory),
  }
}

/** Keeps the schedules that look like schedules and drops the rest. */
function readCards(raw: unknown): Record<string, Schedule> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const cards: Record<string, Schedule> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue
    const schedule = value as Record<string, unknown>
    if (typeof schedule.due !== 'string') continue
    if (typeof schedule.state !== 'number') continue
    cards[key] = schedule as unknown as Schedule
  }
  return cards
}

function readTagHistory(raw: unknown): Record<string, number[]> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const history: Record<string, number[]> = {}
  for (const [tag, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue
    const answers = value
      .filter((entry): entry is number => entry === 0 || entry === 1)
      .slice(-TAG_WINDOW)
    if (answers.length > 0) history[tag] = answers
  }
  return history
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

  async load(): Promise<ProgressState> {
    const text = this.storage.getItem(this.key)
    if (text === null) return emptyProgress()
    try {
      return parseProgressJson(text)
    } catch (error) {
      console.warn('Saved progress could not be read, starting fresh:', error)
      return emptyProgress()
    }
  }

  async save(state: ProgressState): Promise<void> {
    this.storage.setItem(this.key, JSON.stringify(state))
  }

  async exportJson(): Promise<string> {
    const state = await this.load()
    return JSON.stringify(state, null, 2)
  }

  async importJson(text: string): Promise<ProgressState> {
    const state = parseProgressJson(text)
    await this.save(state)
    return state
  }
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

/** The schedule for a card, or undefined when it has never been answered. */
export function scheduleFor(state: ProgressState, cardKey: string): Schedule | undefined {
  return state.cards[cardKey]
}

/**
 * Records one answer: the card's new schedule, and a mark against every concept
 * the card carries.
 */
export function recordAnswer(
  state: ProgressState,
  cardKey: string,
  tags: string[],
  correct: boolean,
  schedule: Schedule,
): ProgressState {
  const tagHistory = { ...state.tagHistory }
  for (const tag of tags) {
    tagHistory[tag] = [...(tagHistory[tag] ?? []), correct ? 1 : 0].slice(-TAG_WINDOW)
  }
  return {
    ...state,
    cards: { ...state.cards, [cardKey]: schedule },
    tagHistory,
  }
}

/**
 * How often the repertoire move came to mind for a concept lately, from 0 to 1,
 * or null when the concept has not been drilled yet. An untried concept is not
 * a weak one, and saying it scored zero would be a lie.
 */
export function tagAccuracy(state: ProgressState, tag: string): number | null {
  const answers = state.tagHistory[tag]
  if (!answers || answers.length === 0) return null
  return answers.reduce((sum, answer) => sum + answer, 0) / answers.length
}

/** How many answers the rolling window currently holds for a concept. */
export function tagAnswerCount(state: ProgressState, tag: string): number {
  return state.tagHistory[tag]?.length ?? 0
}
