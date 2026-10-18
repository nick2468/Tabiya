/**
 * Where the app keeps its data, and where it used to keep it.
 *
 * One place answers that question. The progress store, the course scan and the
 * course installer all need the same root, and until phase 15 each of them
 * worked it out for itself by calling `appDataDir()`. Three copies of one
 * answer is three chances to drift, and the folder they pointed at was named
 * after the Tauri identifier: `com.nick.london-trainer`, for an app that was
 * not called that either.
 *
 * So the root is now built by hand: the user's roaming data folder plus a
 * literal folder name. The identifier is deliberately NOT changed.
 *
 * The reason this comment gave for that until phase 47 was wrong, and the
 * correction is worth keeping because the wrong version sounded convincing. It
 * said that changing the identifier had already left a second application
 * beside the first. It had not. The identifier has held one value since the
 * Tauri commit and has never changed. The second application came from the
 * PRODUCT NAME change at phase 15, because Tauri's NSIS keys its uninstall
 * entry on the product name: the v1 entry was `HKCU\...\Uninstall\London
 * Trainer`, with no key under the identifier anywhere. The true reason the
 * identifier stays is plainer. Nothing but `appDataDir()` reads it, nobody
 * sees it, and changing it would buy nothing while adding a third generation
 * of folder for the migration below to carry a trainee out of.
 *
 * There are now TWO old locations, because phase 47 renamed the app to Tabiya
 * and moved the folders with it. `oldDataRoots()` returns them newest first:
 * `<roaming>/Repertoire Trainer`, which is where phase 15 put the data, and
 * then `appDataDir()`, which still means the identifier folder and is where
 * everything before phase 15 lived. A trainee coming from either one is
 * carried across. Keeping the older of the two costs one `exists` call and
 * means nobody is stranded on a generation the code used to support.
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
export const DATA_FOLDER = 'Tabiya'

/** Where the data folder was between phases 15 and 47. Read only. */
export const FORMER_DATA_FOLDER = 'Repertoire Trainer'

/**
 * Where the LOCAL folder was over the same stretch. Named only so the app can
 * tell the trainee what it left behind there; nothing reads inside it.
 */
export const FORMER_LOCAL_FOLDER = 'Repertoire Trainer Data'

/**
 * The app's folder under the user's LOCAL data folder, which holds the second
 * copy of the progress file and the window's browser profile.
 *
 * NOT `Tabiya`, and the ` Data` on the end is the whole point. On this machine
 * the NSIS installer's `InstallLocation` is `%LOCALAPPDATA%\<product name>`,
 * verified in the registry at phase 16 under
 * `HKCU\...\Uninstall\Repertoire Trainer`, and the product name is what the
 * installer keys on, so the renamed installer will sit at
 * `%LOCALAPPDATA%\Tabiya`. A second copy of the progress file inside the
 * install folder would be deleted by an uninstall, which is precisely the kind
 * of loss it exists to prevent. So it goes in a sibling folder that no
 * installer touches.
 *
 * The same literal is in `src-tauri/src/lib.rs`, which builds the window's
 * profile folder from it, and in `src-tauri/installer-hooks.nsh`, which is
 * allowed to delete it. `installer-hook.test.ts` holds all three together.
 */
export const LOCAL_FOLDER = 'Tabiya Data'

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
let previous: Promise<DataRoots[]> | null = null
let second: Promise<BackupRoots> | null = null

/** Where the app's data lives now: `<roaming>/Tabiya`. */
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
 * Everywhere the data has lived before, newest first.
 *
 * `<roaming>/Repertoire Trainer` is phase 15's folder, abandoned at phase 47.
 * The identifier folder is where everything before phase 15 lived, and
 * `appDataDir()` still means exactly that. Both are read only: nothing in the
 * app writes to either any more, and the capabilities grant reads alone so
 * that it cannot. Write access to an old folder is what would turn the
 * migration from a copy into a move.
 *
 * Newest first matters. A trainee who came through phase 15 has a file in both
 * folders, and the one to carry forward is the one the app was last saving to.
 */
export function oldDataRoots(): Promise<DataRoots[]> {
  if (!previous) {
    previous = (async () => {
      const { dataDir, appDataDir, join } = await api()
      return Promise.all([
        rootsAt(await join(await dataDir(), FORMER_DATA_FOLDER)),
        rootsAt(await appDataDir()),
      ])
    })()
  }
  return previous
}

/**
 * Which of those to carry across: the newest generation that has a progress
 * file in it.
 *
 * An `exists` that throws counts as a no. That is what a missing capability
 * grant looks like, and a folder the app is not allowed to look at is not a
 * folder it could have copied out of anyway, so the next generation is still
 * worth asking about. When none of them holds a file the newest is handed back,
 * because `migrateDataFolder` answers a source with no progress file with
 * `not-needed`, which is the right answer and the only one needed.
 *
 * This lives here rather than in `migrate.ts` on purpose. That module copies
 * one folder into another and verifies the copy before the new one counts as
 * live. It is the one piece of this app standing between the trainee and a
 * second lost progress file, and choosing which folder to hand it is a
 * question about where data has lived, which is this module's question.
 */
export async function pickOldRoot(
  exists: (path: string) => Promise<boolean>,
  candidates: DataRoots[],
): Promise<DataRoots> {
  for (const candidate of candidates) {
    try {
      if (await exists(candidate.progress)) return candidate
    } catch {
      // Unreadable is not a reason to stop looking at the rest.
    }
  }
  return candidates[0]
}

/**
 * The window's WebView2 profile folder, and the ones it has left behind.
 *
 * It has moved twice. Before phase 16 it was Tauri's default, the folder named
 * after the bundle identifier: `com.nick.london-trainer`, again for an app not
 * called that, and about 32 MB of it. Phase 16 gave the window an explicit
 * folder, and phase 47 moved that folder with the app's name. Both old ones are
 * left exactly where they are for the trainee to delete, which is the rule the
 * data folder move follows too. Newest first, like `oldDataRoots()`.
 *
 * A moved profile is a FRESH profile, and that is why the app says this on
 * screen rather than only in a comment. `localStorage` lives inside the
 * profile, so the theme and every remembered Play and Drill setting start
 * again after a move, however carefully their keys were left alone. Progress
 * does not: on the desktop that is a file in the roaming data folder, and the
 * migration carries it across.
 */
export async function profilePaths(): Promise<{ now: string; before: string[] }> {
  const { localDataDir, appLocalDataDir, join } = await api()
  const local = await localDataDir()
  return {
    now: await join(local, LOCAL_FOLDER, WEBVIEW_FOLDER),
    before: [
      await join(local, FORMER_LOCAL_FOLDER, WEBVIEW_FOLDER),
      await appLocalDataDir(),
    ],
  }
}

/**
 * Where the second copy of the progress file lives:
 * `<local data>/Tabiya Data`.
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
