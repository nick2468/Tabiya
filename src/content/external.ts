import { loadCourse, MANIFEST_FILE } from '../model/course'
import type { CourseEntry } from '../model/types'

/**
 * Courses dropped into a folder under AppData, read at startup.
 *
 * This is the hybrid delivery ruled in SPEC.md section 10. Built-in courses
 * stay bundled and behind the test suite; adding an opening to the installed
 * app means dropping a folder in here and restarting. No source change, no
 * rebuild, no installer.
 *
 * Only the wrapped Windows app has a folder to read. In a browser there is no
 * filesystem, so this finds nothing and the catalog is the bundled set - which
 * is the honest answer rather than an error, because nothing is missing.
 *
 * Every failure is reported rather than thrown. A folder someone copied in
 * should say why it did not work, and one bad folder must not cost them the
 * others.
 *
 * The scan takes its files through an interface so the whole of it can be
 * tested without a filesystem. Tauri is imported lazily behind that interface,
 * so this module can be pulled into a browser build without dragging in an API
 * that is not there.
 */

/** The folder under AppData that courses are dropped into. */
export const COURSES_FOLDER = 'courses'

/** Where the scan gets its files. One implementation reads Tauri, one is a fake. */
export interface CourseFiles {
  /** The course folders, in the order to show them. */
  folders(): Promise<string[]>
  /** The filenames in one course folder. */
  files(folder: string): Promise<string[]>
  /** The text of one file. */
  read(folder: string, file: string): Promise<string>
}

/**
 * Reads every course folder.
 *
 * @returns one entry per folder, valid or not, in the order the source gave
 * them. An empty list when there is no folder at all, which is the normal case
 * until someone makes one.
 */
export async function scanCourses(source: CourseFiles): Promise<CourseEntry[]> {
  let folders: string[]
  try {
    folders = await source.folders()
  } catch (error) {
    // A folder that cannot be listed at all is worth one line in the catalog,
    // not a blank screen where the trainee's own courses used to be.
    return [failure(COURSES_FOLDER, `the courses folder could not be read: ${message(error)}`)]
  }

  const entries: CourseEntry[] = []
  for (const folder of folders) entries.push(await readOne(source, folder))
  return entries
}

/** Reads one course folder: its manifest, its chapter files, and what is wrong. */
async function readOne(source: CourseFiles, folder: string): Promise<CourseEntry> {
  let names: string[]
  try {
    names = await source.files(folder)
  } catch (error) {
    return failure(folder, `that folder could not be read: ${message(error)}`)
  }

  const json = names.filter((name) => name.toLowerCase().endsWith('.json'))
  if (!json.includes(MANIFEST_FILE)) {
    return failure(folder, `there is no ${MANIFEST_FILE} in that folder, so it is not a course`)
  }

  let manifest: unknown
  const chapters: Record<string, unknown> = {}
  for (const name of json) {
    let parsed: unknown
    try {
      parsed = JSON.parse(await source.read(folder, name))
    } catch (error) {
      return failure(folder, `${name} could not be read: ${message(error)}`, name)
    }
    if (name === MANIFEST_FILE) manifest = parsed
    else chapters[name] = parsed
  }

  const result = loadCourse(manifest, chapters)
  return { source: folder, origin: 'external', course: result.course, errors: result.errors }
}

function failure(source: string, text: string, chapter = MANIFEST_FILE): CourseEntry {
  return {
    source,
    origin: 'external',
    course: null,
    errors: [{ course: source, chapter, path: '', message: text }],
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/* ------------------------------------------------------------------ Tauri */

interface DirEntry {
  name: string
  isDirectory: boolean
}

interface FsApi {
  exists: (path: string) => Promise<boolean>
  readDir: (path: string) => Promise<DirEntry[]>
  readTextFile: (path: string) => Promise<string>
}

interface PathApi {
  appDataDir: () => Promise<string>
  join: (...parts: string[]) => Promise<string>
}

/** True when the app is running inside the Tauri window rather than a browser. */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

let fsApi: Promise<FsApi> | null = null
let pathApi: Promise<PathApi> | null = null

function fs(): Promise<FsApi> {
  if (!fsApi) fsApi = import('@tauri-apps/plugin-fs') as unknown as Promise<FsApi>
  return fsApi
}

function paths(): Promise<PathApi> {
  if (!pathApi) pathApi = import('@tauri-apps/api/path') as unknown as Promise<PathApi>
  return pathApi
}

/** Where dropped-in courses go, for telling the trainee. Null in a browser. */
export async function coursesFolder(): Promise<string | null> {
  if (!isDesktop()) return null
  const api = await paths()
  return api.join(await api.appDataDir(), COURSES_FOLDER)
}

/** The desktop source: the courses folder under this app's own AppData. */
function desktopFiles(root: string): CourseFiles {
  const at = async (...parts: string[]) => (await paths()).join(root, ...parts)
  return {
    async folders() {
      const api = await fs()
      if (!(await api.exists(root))) return []
      return (await api.readDir(root))
        .filter((entry) => entry.isDirectory)
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b))
    },
    async files(folder) {
      const api = await fs()
      return (await api.readDir(await at(folder)))
        .filter((entry) => !entry.isDirectory)
        .map((entry) => entry.name)
    },
    async read(folder, file) {
      return (await fs()).readTextFile(await at(folder, file))
    },
  }
}

/** Every course dropped into the AppData folder. Nothing at all in a browser. */
export async function loadExternalCourses(): Promise<CourseEntry[]> {
  if (!isDesktop()) return []
  const root = await coursesFolder()
  if (!root) return []
  return scanCourses(desktopFiles(root))
}
