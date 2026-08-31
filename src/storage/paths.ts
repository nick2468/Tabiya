/**
 * Where the app keeps its data, and where it used to keep it.
 *
 * One place answers that question. The progress store, the course scan and the
 * course installer all need the same root, and until phase 15 each of them
 * worked it out for itself by calling `appDataDir()`. Three copies of one
 * answer is three chances to drift, and the folder they pointed at was named
 * after the Tauri identifier: `com.nick.london-trainer`, for an app called
 * Repertoire Trainer.
 *
 * So the root is now built by hand: the user's roaming data folder plus a
 * literal folder name. The identifier is deliberately NOT changed. It is the
 * bundle id the installer hangs its uninstall entry off, and changing it once
 * already left a second application beside the first. The identifier is
 * invisible; the folder is what a person reads.
 *
 * `appDataDir()` still means the identifier folder, which is exactly the old
 * location, so it is how the migration finds what to carry across.
 *
 * Phase 16 added a second folder, under the user's LOCAL data folder, holding
 * a copy of the progress file and the window's browser profile. It is separate
 * on purpose, and it is deliberately not the folder the installer writes to.
 * See LOCAL_FOLDER below and `safety.ts`.
 *
 * Tauri is imported lazily so this module can be pulled into a browser build
 * without dragging in an API that is not there.
 */

/** The app's data folder, under the user's roaming data folder. */
export const DATA_FOLDER = 'Repertoire Trainer'

/**
 * The app's folder under the user's LOCAL data folder, which holds the second
 * copy of the progress file and the window's browser profile.
 *
 * NOT `Repertoire Trainer`, which is what phase 16's chip asked for and what
 * this deliberately is not. On this machine the NSIS installer's
 * `InstallLocation` is exactly `%LOCALAPPDATA%\Repertoire Trainer`, verified in
 * the registry under `HKCU\...\Uninstall\Repertoire Trainer`. A second copy of
 * the progress file inside the install folder would be deleted by an uninstall,
 * which is precisely the kind of loss it exists to prevent. So it goes in a
 * sibling folder that no installer touches.
 *
 * The same literal is in `src-tauri/src/lib.rs`, which builds the window's
 * profile folder from it.
 */
export const LOCAL_FOLDER = 'Repertoire Trainer Data'

/** The folder inside it that courses are dropped into. */
export const COURSES_FOLDER = 'courses'

/** The progress file, inside it. */
export const PROGRESS_FILE = 'progress.json'

/**
 * The file the app leaves beside the progress file to say it has saved here.
 *
 * It exists so that "this folder is here and the progress file is not" can be
 * told apart from "this trainee is new". Those two look identical otherwise,
 * and treating the first as the second is how Nick lost his learnt lines on
 * 2026-08-31: he deleted the data folder, the app started blank, and the blank
 * state was saved straight over the gap.
 */
export const MARKER_FILE = 'progress.marker.json'

/** The second copy, in the folder below. */
export const BACKUP_FILE = 'progress.backup.json'

/**
 * The window's browser profile, in the same local folder as the second copy.
 *
 * The Rust side owns this folder: `src-tauri/src/lib.rs` builds the window
 * with it. The name is repeated here, and only here, so the app can tell the
 * trainee where the profile went. Two literals for one folder is a thing to
 * watch, and it is cheaper than a Tauri command that exists to say a constant.
 */
export const WEBVIEW_FOLDER = 'WebView2'

/** One data folder: the root and the three things the app keeps in it. */
export interface DataRoots {
  root: string
  progress: string
  courses: string
  /** The marker beside the progress file. See MARKER_FILE. */
  marker: string
}

/**
 * The second copy's folder, and the file in it.
 *
 * It is deliberately NOT inside the data folder. A marker inside that folder
 * dies with the folder, which is exactly the case that cost Nick his lines, so
 * the copy goes somewhere a person deleting the data folder would not also be
 * deleting. Two folders now have to go before anything is lost.
 */
export interface BackupRoots {
  root: string
  backup: string
}

/** True when the app is running inside the Tauri window rather than a browser. */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

interface PathApi {
  dataDir: () => Promise<string>
  appDataDir: () => Promise<string>
  localDataDir: () => Promise<string>
  appLocalDataDir: () => Promise<string>
  join: (...parts: string[]) => Promise<string>
}

let pathApi: Promise<PathApi> | null = null

function api(): Promise<PathApi> {
  if (!pathApi) pathApi = import('@tauri-apps/api/path') as unknown as Promise<PathApi>
  return pathApi
}

async function rootsAt(root: string): Promise<DataRoots> {
  const { join } = await api()
  return {
    root,
    progress: await join(root, PROGRESS_FILE),
    courses: await join(root, COURSES_FOLDER),
    marker: await join(root, MARKER_FILE),
  }
}

let current: Promise<DataRoots> | null = null
let previous: Promise<DataRoots> | null = null
let second: Promise<BackupRoots> | null = null

/** Where the app's data lives now: `<roaming>/Repertoire Trainer`. */
export function dataRoots(): Promise<DataRoots> {
  if (!current) {
    current = (async () => {
      const { dataDir, join } = await api()
      return rootsAt(await join(await dataDir(), DATA_FOLDER))
    })()
  }
  return current
}

/**
 * Where it lived before phase 15: the folder named after the identifier.
 * Read only. Nothing in the app writes there any more, and the capabilities
 * are cut down to reads so that it cannot.
 */
export function oldDataRoots(): Promise<DataRoots> {
  if (!previous) {
    previous = (async () => rootsAt(await (await api()).appDataDir()))()
  }
  return previous
}

/**
 * The two WebView2 profile folders: the one the window uses now, and the one it
 * used before phase 16.
 *
 * Before phase 16 the profile was Tauri's default, which is the folder named
 * after the bundle identifier - `com.nick.london-trainer`, again for an app
 * called Repertoire Trainer, and about 32 MB of it. The window now builds its
 * own with an explicit folder. The old one is left exactly where it is for the
 * trainee to delete, the same rule the data folder move followed.
 */
export async function profilePaths(): Promise<{ now: string; before: string }> {
  const { localDataDir, appLocalDataDir, join } = await api()
  return {
    now: await join(await localDataDir(), LOCAL_FOLDER, WEBVIEW_FOLDER),
    before: await appLocalDataDir(),
  }
}

/**
 * Where the second copy of the progress file lives:
 * `<local data>/Repertoire Trainer`.
 *
 * The local data folder rather than the roaming one, so that the two copies
 * are in genuinely different places, and a folder of its own rather than the
 * one the installer owns. See LOCAL_FOLDER for why that distinction matters.
 */
export function backupRoots(): Promise<BackupRoots> {
  if (!second) {
    second = (async () => {
      const { localDataDir, join } = await api()
      const root = await join(await localDataDir(), LOCAL_FOLDER)
      return { root, backup: await join(root, BACKUP_FILE) }
    })()
  }
  return second
}
