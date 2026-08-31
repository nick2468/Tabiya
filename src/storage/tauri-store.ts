import { backupRoots, dataRoots, isDesktop, oldDataRoots, type BackupRoots, type DataRoots } from './paths'
import { migrateDataFolder, migrationNote, tauriFiles, type Migration } from './migrate'
import { checkBlankStart, tauriSafetyFiles, writeMarkerAndBackup } from './safety'
import {
  describe,
  emptyProgress,
  parseProgressJson,
  readFailure,
  type LoadedProgress,
  type ProgressState,
  type ProgressStore,
} from './progress'

/**
 * The desktop store: progress in a file in the app's data folder.
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
 * The data folder does not exist until something creates it, and creating it
 * needs a real path to create. Where that folder is lives in `paths.ts`, which
 * is the one place that answers the question for the whole app.
 *
 * The first read of the session also carries the file across from the folder
 * the app used before phase 15. A migration that cannot be completed blocks
 * saving through the same `failure` route a bad read takes, which is the point:
 * the app must never start blank and then save over something real.
 *
 * Phase 16 closed the last way that could still happen. A progress file that is
 * simply NOT THERE used to be read as a new trainee, so deleting the data
 * folder started the app blank and saved the blank state over the gap. Now
 * every save also leaves a marker beside the file and a copy of it in a second
 * folder, and a start with no progress file has to get past both before it is
 * believed. See `safety.ts`.
 *
 * Tauri is imported lazily so this module can be pulled into a browser build
 * without dragging in an API that is not there.
 */

export { isDesktop }

interface FsApi {
  exists: (path: string) => Promise<boolean>
  readTextFile: (path: string) => Promise<string>
  writeTextFile: (path: string, contents: string) => Promise<void>
  mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>
}

export class TauriProgressStore implements ProgressStore {
  private fsApi: Promise<FsApi> | null = null
  private moved: Promise<Migration> | null = null

  private fs(): Promise<FsApi> {
    if (!this.fsApi) this.fsApi = import('@tauri-apps/plugin-fs') as unknown as Promise<FsApi>
    return this.fsApi
  }

  private paths(): Promise<DataRoots> {
    return dataRoots()
  }

  /** Run once per session, before anything reads or writes. */
  private migrate(): Promise<Migration> {
    if (!this.moved) {
      this.moved = (async () => {
        const [from, to] = await Promise.all([oldDataRoots(), dataRoots()])
        return migrateDataFolder(tauriFiles(), from, to)
      })()
    }
    return this.moved
  }

  async load(): Promise<LoadedProgress> {
    let moved: Migration
    try {
      moved = await this.migrate()
    } catch (error) {
      // The migration is written not to throw, so this is the belt to its
      // braces. It still takes the blocked-saving route rather than a blank one.
      moved = { kind: 'failed', reason: describe(error) }
    }
    if (moved.kind === 'failed') {
      console.warn('The data folder could not be moved:', moved.reason)
      return { state: emptyProgress(), failure: readFailure(moved.reason) }
    }
    const note = moved.kind === 'migrated' ? migrationNote(moved) : undefined

    try {
      const [fs, roots] = await Promise.all([this.fs(), this.paths()])
      // No file. That is a new trainee only when nothing says the app has
      // saved here before, which is the whole of phase 16.
      if (!(await fs.exists(roots.progress))) {
        const start = await checkBlankStart(tauriSafetyFiles(), roots, await this.second())
        if (start.kind === 'fresh') return { state: emptyProgress(), note }
        console.warn('The app refused to start blank:', start.reason)
        return { state: emptyProgress(), failure: start.reason, restore: start.offer, note }
      }
      return { state: parseProgressJson(await fs.readTextFile(roots.progress)), note }
    } catch (error) {
      // A file that cannot be read must not stop the app from opening, and
      // must not be written over either. The caller stops saving until the
      // trainee resolves it.
      console.warn('Saved progress could not be read:', error)
      return { state: emptyProgress(), failure: readFailure(describe(error)), note }
    }
  }

  /**
   * Writes the progress file, then the marker beside it and the copy in the
   * second folder.
   *
   * The progress file goes first, because it is the one that matters. The
   * other two are best effort on purpose: a marker or a copy that cannot be
   * written is worth a line on the console, and is not worth failing a save
   * that has already succeeded. The cost of losing them is that the app might
   * later believe a blank start, which is the state the app was in before this
   * phase, so a warning is the honest response rather than an error.
   */
  async save(state: ProgressState): Promise<void> {
    const [fs, roots] = await Promise.all([this.fs(), this.paths()])
    // The folder does not exist until the first save creates it.
    if (!(await fs.exists(roots.root))) await fs.mkdir(roots.root, { recursive: true })
    const text = JSON.stringify(state, null, 2)
    await fs.writeTextFile(roots.progress, text)

    try {
      await writeMarkerAndBackup(tauriSafetyFiles(), roots, await this.second(), state, text)
    } catch (error) {
      console.warn('The second copy of your progress could not be written:', error)
    }
  }

  /** Where the second copy goes. Resolved once, like the data folder. */
  private second(): Promise<BackupRoots> {
    return backupRoots()
  }

  async exportJson(): Promise<string> {
    return JSON.stringify((await this.load()).state, null, 2)
  }

  async importJson(text: string): Promise<ProgressState> {
    const state = parseProgressJson(text)
    await this.save(state)
    return state
  }

  /** Where the file lives, for showing the trainee. */
  async location(): Promise<string> {
    return (await this.paths()).progress
  }
}
