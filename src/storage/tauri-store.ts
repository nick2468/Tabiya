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
 * Paths are resolved in full rather than left relative to a base directory.
 * The app data folder does not exist until something creates it, and creating
 * it needs a real path to create.
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
  exists: (path: string) => Promise<boolean>
  readTextFile: (path: string) => Promise<string>
  writeTextFile: (path: string, contents: string) => Promise<void>
  mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>
}

interface PathApi {
  appDataDir: () => Promise<string>
  join: (...parts: string[]) => Promise<string>
}

export class TauriProgressStore implements ProgressStore {
  private fsApi: Promise<FsApi> | null = null
  private pathApi: Promise<PathApi> | null = null
  private resolved: Promise<{ dir: string; file: string }> | null = null

  private fs(): Promise<FsApi> {
    if (!this.fsApi) this.fsApi = import('@tauri-apps/plugin-fs') as unknown as Promise<FsApi>
    return this.fsApi
  }

  private paths(): Promise<{ dir: string; file: string }> {
    if (!this.resolved) {
      this.resolved = (async () => {
        if (!this.pathApi) this.pathApi = import('@tauri-apps/api/path') as unknown as Promise<PathApi>
        const path = await this.pathApi
        const dir = await path.appDataDir()
        return { dir, file: await path.join(dir, FILE) }
      })()
    }
    return this.resolved
  }

  async load(): Promise<ProgressState> {
    try {
      const [fs, { file }] = await Promise.all([this.fs(), this.paths()])
      if (!(await fs.exists(file))) return emptyProgress()
      return parseProgressJson(await fs.readTextFile(file))
    } catch (error) {
      // Same rule as the browser store: a file that cannot be read must not
      // stop the app from opening. It is not overwritten until a real save.
      console.warn('Saved progress could not be read, starting fresh:', error)
      return emptyProgress()
    }
  }

  async save(state: ProgressState): Promise<void> {
    const [fs, { dir, file }] = await Promise.all([this.fs(), this.paths()])
    // The folder does not exist until the first save creates it.
    if (!(await fs.exists(dir))) await fs.mkdir(dir, { recursive: true })
    await fs.writeTextFile(file, JSON.stringify(state, null, 2))
  }

  async exportJson(): Promise<string> {
    return JSON.stringify(await this.load(), null, 2)
  }

  async importJson(text: string): Promise<ProgressState> {
    const state = parseProgressJson(text)
    await this.save(state)
    return state
  }

  /** Where the file lives, for showing the trainee. */
  async location(): Promise<string> {
    return (await this.paths()).file
  }
}
