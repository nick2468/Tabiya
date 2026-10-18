import { parseProgressJson } from './progress'
import type { DataRoots } from './paths'

/**
 * Carrying the trainee's data from the old folder to the new one.
 *
 * Phase 15 renamed the data folder from the Tauri identifier to the product
 * name, and phase 47 renamed it again when the product was renamed. The rename
 * is cosmetic; the file inside it is not. So the move is a COPY, verified
 * before the new location counts as live, and the old folder is left exactly as
 * it was for the trainee to delete when they are satisfied. A migration that
 * deletes has one chance to be right.
 *
 * It still takes ONE source folder and one destination, which is why phase 47
 * changed nothing in here but a sentence of the note. There are two older
 * generations now, and choosing between them is `pickOldRoot` in `paths.ts`:
 * that is a question about where data has lived, not about how to copy it.
 *
 * The failure rule matters more than the happy path. If the old file is there
 * and cannot be read, copied or verified, the app must not start blank and must
 * not leave a half-written file in the new location: it takes the same route a
 * failed read already takes, which blocks saving and says so on screen. Starting
 * blank and then saving over it is how a progress file gets lost, and this
 * project has already lost one that way.
 *
 * The filesystem comes in through an interface so the whole of it can be tested
 * without Tauri, and against copies of the real folders before it is ever
 * pointed at them.
 */

/** One entry in a folder listing. */
export interface FolderEntry {
  name: string
  isDirectory: boolean
}

/** Where the migration gets its files. One implementation is Tauri, one a fake. */
export interface MigrationFiles {
  exists(path: string): Promise<boolean>
  readTextFile(path: string): Promise<string>
  writeTextFile(path: string, text: string): Promise<void>
  mkdir(path: string): Promise<void>
  readDir(path: string): Promise<FolderEntry[]>
  remove(path: string): Promise<void>
  join(...parts: string[]): Promise<string>
}

export type Migration =
  /** Nothing to do: the new folder is already live, or there is nothing to carry. */
  | { kind: 'not-needed' }
  /** The data is in the new folder and was checked after it got there. */
  | {
      kind: 'migrated'
      from: string
      to: string
      /** Learnt lines carried across, counted in the copy rather than the source. */
      lines: number
      /** Course folders carried across. */
      courses: number
      /** Course folders that did not make it. Never blocks: a course is re-importable. */
      trouble: string[]
    }
  /** The progress file could not be carried. Saving must stay blocked. */
  | { kind: 'failed'; reason: string }

/**
 * Copies the old data folder into the new one, once.
 *
 * @param from the old folder, read only.
 * @param to the new folder, which is only treated as live once the copy of the
 * progress file has been read back and found to hold the same learnt lines.
 */
export async function migrateDataFolder(
  files: MigrationFiles,
  from: DataRoots,
  to: DataRoots,
): Promise<Migration> {
  // Already moved. This is the normal case from the second run onwards, and it
  // is checked first so that nothing can copy over live data. A check that
  // cannot be answered is treated as a failure rather than as a no: the one
  // thing this function must never do is write where it did not look.
  try {
    if (await files.exists(to.progress)) return { kind: 'not-needed' }
  } catch (error) {
    return {
      kind: 'failed',
      reason: `the app's new folder ${to.root} could not be checked (${message(error)}), so nothing was written to it and ${from.root} is untouched.`,
    }
  }

  let source: string
  try {
    if (!(await files.exists(from.progress))) return { kind: 'not-needed' }
    source = await files.readTextFile(from.progress)
  } catch (error) {
    return {
      kind: 'failed',
      reason: `it is in ${from.root}, which the app has moved away from, and it could not be read there (${message(error)}).`,
    }
  }

  // A file that will not parse is not carried across. It would parse no better
  // in the new folder, and the trainee needs to be told rather than handed a
  // blank slate on top of it.
  let expected: number
  try {
    expected = parseProgressJson(source).learntLines.length
  } catch (error) {
    return {
      kind: 'failed',
      reason: `it is in ${from.root}, which the app has moved away from, and it could not be read there (${message(error)}).`,
    }
  }

  try {
    await files.mkdir(to.root)
    await files.writeTextFile(to.progress, source)
  } catch (error) {
    return {
      kind: 'failed',
      reason: `it is still in ${from.root} and could not be copied to the app's new folder ${to.root} (${message(error)}).`,
    }
  }

  const verified = await verify(files, to.progress, source, expected)
  if (verified) {
    // The copy is wrong, so it must not be there: the next start would see a
    // progress file in the new folder and treat it as live.
    const swept = await safely(async () => {
      await files.remove(to.progress)
      return true
    }, false)
    return {
      kind: 'failed',
      reason: swept
        ? `it is still in ${from.root}, but the copy made in the app's new folder ${to.root} ${verified} so the copy was removed and nothing was kept there.`
        : `it is still in ${from.root}, but the copy made in the app's new folder ${to.root} ${verified} and the bad copy could not be removed either, so delete it by hand.`,
    }
  }

  const carried = await copyCourses(files, from.courses, to.courses)
  return {
    kind: 'migrated',
    from: from.root,
    to: to.root,
    lines: expected,
    courses: carried.copied,
    trouble: carried.trouble,
  }
}

/** Reads the copy back. Returns what is wrong with it, or null when it is right. */
async function verify(
  files: MigrationFiles,
  path: string,
  source: string,
  expected: number,
): Promise<string | null> {
  let written: string
  try {
    written = await files.readTextFile(path)
  } catch (error) {
    return `could not be read back (${message(error)}),`
  }
  if (written !== source) return 'did not match the original,'
  try {
    const lines = parseProgressJson(written).learntLines.length
    if (lines !== expected) {
      return `holds ${lines} learnt lines where the original holds ${expected},`
    }
  } catch (error) {
    return `could not be read back (${message(error)}),`
  }
  return null
}

/**
 * Copies the dropped-in course folders across.
 *
 * A course that does not make it is reported and never blocks the migration: a
 * course is a file the trainee still has and can import again, and the progress
 * that hangs off its id has already been carried.
 */
async function copyCourses(
  files: MigrationFiles,
  from: string,
  to: string,
): Promise<{ copied: number; trouble: string[] }> {
  const trouble: string[] = []
  let folders: FolderEntry[]
  try {
    if (!(await files.exists(from))) return { copied: 0, trouble }
    folders = (await files.readDir(from)).filter((entry) => entry.isDirectory)
  } catch (error) {
    return { copied: 0, trouble: [`the courses folder could not be read (${message(error)})`] }
  }

  let copied = 0
  for (const folder of folders) {
    try {
      const source = await files.join(from, folder.name)
      const target = await files.join(to, folder.name)
      await files.mkdir(target)
      for (const entry of await files.readDir(source)) {
        if (entry.isDirectory) continue
        const text = await files.readTextFile(await files.join(source, entry.name))
        await files.writeTextFile(await files.join(target, entry.name), text)
      }
      copied += 1
    } catch (error) {
      trouble.push(`${folder.name} (${message(error)})`)
    }
  }
  return { copied, trouble }
}

/** What to say on screen after a migration that worked. */
export function migrationNote(done: Extract<Migration, { kind: 'migrated' }>): string {
  const carried: string[] = []
  if (done.lines > 0) {
    carried.push(`${done.lines} learnt ${done.lines === 1 ? 'line' : 'lines'}`)
  }
  if (done.courses > 0) {
    carried.push(`${done.courses} ${done.courses === 1 ? 'course' : 'courses'} you had added`)
  }
  const what =
    carried.length === 0
      ? 'Your progress came across'
      : `Your ${carried.join(' and ')} came across`
  const trouble =
    done.trouble.length === 0
      ? ''
      : ` These course folders did not come across, so import them again if you want them: ${done.trouble.join('; ')}.`
  return (
    `Your data folder moved to ${done.to}. It carries the app's name, which the old one ` +
    `does not any more. ${what}, and the copy was checked afterwards. The old folder ` +
    `${done.from} was left exactly as it was, so nothing is at risk: delete it yourself ` +
    `once you are happy.${trouble}`
  )
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Runs a check that must never throw, whatever the filesystem says. */
async function safely<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run()
  } catch {
    return fallback
  }
}

/* ------------------------------------------------------------------ Tauri */

interface FsApi {
  exists: (path: string) => Promise<boolean>
  readTextFile: (path: string) => Promise<string>
  writeTextFile: (path: string, contents: string) => Promise<void>
  mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>
  readDir: (path: string) => Promise<FolderEntry[]>
  remove: (path: string) => Promise<void>
}

/**
 * The real filesystem, through Tauri.
 *
 * Every folder is made recursively, because the new root does not exist until
 * this makes it and a recursive mkdir is also the one that does not complain
 * about a folder that is already there.
 */
export function tauriFiles(): MigrationFiles {
  const fs = () => import('@tauri-apps/plugin-fs') as unknown as Promise<FsApi>
  const path = () => import('@tauri-apps/api/path')
  return {
    async exists(target) {
      return (await fs()).exists(target)
    },
    async readTextFile(target) {
      return (await fs()).readTextFile(target)
    },
    async writeTextFile(target, text) {
      return (await fs()).writeTextFile(target, text)
    },
    async mkdir(target) {
      return (await fs()).mkdir(target, { recursive: true })
    },
    async readDir(target) {
      return (await fs()).readDir(target)
    },
    async remove(target) {
      return (await fs()).remove(target)
    },
    async join(...parts) {
      return (await path()).join(...parts)
    },
  }
}
