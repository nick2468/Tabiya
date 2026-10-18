import { isDesktop } from '../storage/tauri-store'
import { backupRoots } from '../storage/paths'
import { parseProgressJson } from '../storage/progress'

/**
 * Getting a progress file out of the app and back in.
 *
 * The two places the app runs need different machinery for the same job. A
 * browser can only offer a download and a file input. The wrapped window has
 * real save and open dialogs, and a blob download inside a WebView is not
 * something to rely on, so the desktop path writes the file itself.
 *
 * Both are behind one pair of functions so the view does not care which it is.
 *
 * The app's OWN second copy is a third thing, added in phase 16, and it is read
 * here only so the Progress screen can say where it is and what is in it. The
 * app writes that copy after every save and never reads it back except when the
 * main file has gone; showing it is how a trainee can see that the safety net
 * is really there rather than take the app's word for it.
 */

/**
 * What an exported progress file is called by default.
 *
 * Renamed in phase 16 with the executable and the profile folder, and again in
 * phase 47 with the app. It is only a suggestion in a Save dialog and nothing
 * reads it back by name, so every older export the trainee already has still
 * imports, under whichever of the three names it was saved with.
 */
const FILE_NAME = 'tabiya-progress.json'

export interface BackupResult {
  /** Something to show the trainee. Null when they cancelled. */
  message: string | null
}

/** Writes the progress out. Returns what to say about it. */
export async function saveBackup(text: string): Promise<BackupResult> {
  if (isDesktop()) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const path = await save({
      defaultPath: FILE_NAME,
      filters: [{ name: 'Progress', extensions: ['json'] }],
    })
    if (!path) return { message: null }
    const { writeTextFile } = await import('@tauri-apps/plugin-fs')
    await writeTextFile(path, text)
    return { message: `Progress written to ${path}.` }
  }

  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = FILE_NAME
  link.click()
  URL.revokeObjectURL(url)
  return { message: 'Progress saved to your downloads folder.' }
}

/**
 * Reads a progress file back. Returns its text, or null when the trainee
 * cancelled the dialog.
 */
export async function readBackup(): Promise<string | null> {
  if (!isDesktop()) throw new Error('the browser build uses a file input instead')
  const { open } = await import('@tauri-apps/plugin-dialog')
  const path = await open({
    multiple: false,
    directory: false,
    filters: [{ name: 'Progress', extensions: ['json'] }],
  })
  if (typeof path !== 'string') return null
  const { readTextFile } = await import('@tauri-apps/plugin-fs')
  return readTextFile(path)
}

export { isDesktop }

/** What the app's own second copy holds, for showing on the Progress screen. */
export interface BackupCopy {
  path: string
  /** True when the file is there. */
  there: boolean
  /** How many learnt lines it holds, or null when it could not be read. */
  learntLines: number | null
  /** What went wrong reading it, when something did. */
  trouble: string | null
}

/**
 * Looks at the app's own second copy. Null in a browser, which has no folders.
 *
 * It never throws: a copy that cannot be read is a thing to say on screen, not
 * a thing to break the Progress screen over.
 */
export async function backupCopy(): Promise<BackupCopy | null> {
  if (!isDesktop()) return null
  const { backup } = await backupRoots()
  const fs = await import('@tauri-apps/plugin-fs')
  try {
    if (!(await fs.exists(backup))) {
      return { path: backup, there: false, learntLines: null, trouble: null }
    }
    const state = parseProgressJson(await fs.readTextFile(backup))
    return { path: backup, there: true, learntLines: state.learntLines.length, trouble: null }
  } catch (error) {
    return { path: backup, there: true, learntLines: null, trouble: asMessage(error) }
  }
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
