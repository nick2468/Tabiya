import {
  emptyProgress,
  parseProgressJson,
  type ProgressState,
  type ProgressStore,
} from './progress'

/**
 * The desktop store: progress in a file under AppData.
 *
 * This is the whole reason ProgressStore was an interface with async methods
 * from phase 2. Nothing above it changes: the same load, save, export and
 * import, backed by a file instead of localStorage.
 *
 * A file survives things localStorage does not. Clearing browser data, a
 * WebView2 reset, or moving the app to another machine all leave the file
 * alone, and the trainee can copy it or read it.
 *
 * Tauri is imported lazily so this module can be pulled into a browser build
 * without dragging in an API that is not there.
 */

const FILE = 'progress.json'

/** True when the app is running inside the Tauri window rather than a browser. */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

interface FsApi {
  exists: (path: string, options?: unknown) => Promise<boolean>
  readTextFile: (path: string, options?: unknown) => Promise<string>
  writeTextFile: (path: string, contents: string, options?: unknown) => Promise<void>
  mkdir: (path: string, options?: unknown) => Promise<void>
  BaseDirectory: { AppData: number }
}

export class TauriProgressStore implements ProgressStore {
  private fs: Promise<FsApi> | null = null

  private api(): Promise<FsApi> {
    if (!this.fs) this.fs = import('@tauri-apps/plugin-fs') as unknown as Promise<FsApi>
    return this.fs
  }

  async load(): Promise<ProgressState> {
    try {
      const fs = await this.api()
      const there = await fs.exists(FILE, { baseDir: fs.BaseDirectory.AppData })
      if (!there) return emptyProgress()
      return parseProgressJson(await fs.readTextFile(FILE, { baseDir: fs.BaseDirectory.AppData }))
    } catch (error) {
      // Same rule as the browser store: a file that cannot be read must not
      // stop the app from opening. It is not overwritten until a real save.
      console.warn('Saved progress could not be read, starting fresh:', error)
      return emptyProgress()
    }
  }

  async save(state: ProgressState): Promise<void> {
    const fs = await this.api()
    // The app data folder does not exist until something writes to it.
    await fs.mkdir('', { baseDir: fs.BaseDirectory.AppData, recursive: true }).catch(() => undefined)
    await fs.writeTextFile(FILE, JSON.stringify(state, null, 2), {
      baseDir: fs.BaseDirectory.AppData,
    })
  }

  async exportJson(): Promise<string> {
    return JSON.stringify(await this.load(), null, 2)
  }

  async importJson(text: string): Promise<ProgressState> {
    const state = parseProgressJson(text)
    await this.save(state)
    return state
  }
}
