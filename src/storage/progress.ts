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
export const PROGRESS_VERSION = 1

export interface ProgressState {
  version: number
  /** Line ids the trainee has marked as learnt. See src/model/lines.ts. */
  learntLines: string[]
}

export function emptyProgress(): ProgressState {
  return { version: PROGRESS_VERSION, learntLines: [] }
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
  return { version: PROGRESS_VERSION, learntLines: [...new Set(learntLines)] }
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
