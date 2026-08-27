import { isDesktop } from '../storage/tauri-store'

/**
 * Getting a progress file out of the app and back in.
 *
 * The two places the app runs need different machinery for the same job. A
 * browser can only offer a download and a file input. The wrapped window has
 * real save and open dialogs, and a blob download inside a WebView is not
 * something to rely on, so the desktop path writes the file itself.
 *
 * Both are behind one pair of functions so the view does not care which it is.
 */

const FILE_NAME = 'london-trainer-progress.json'

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
