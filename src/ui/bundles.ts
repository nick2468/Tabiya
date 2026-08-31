import { dataRoots, isDesktop } from '../storage/paths'
import { MANIFEST_FILE } from '../model/course'
import type { CourseManifest } from '../model/types'

/**
 * Getting a course bundle in and out of the app.
 *
 * The same shape as the progress backup plumbing next door: a browser can only
 * offer a download, and the wrapped window has real dialogs and a filesystem.
 * Importing needs somewhere to put the course, so it is desktop only; exporting
 * works in both, because a bundle is just a file.
 *
 * Installing writes into the folder phase 7 already scans at startup. Nothing
 * about the catalog, the merge rules or the shadowing checks changes: a course
 * that arrives through the file picker lands in exactly the place a course
 * copied in by hand would.
 */

export interface PickedBundle {
  name: string
  text: string
}

/** Opens a bundle. Null when the trainee cancelled the dialog. */
export async function pickBundle(): Promise<PickedBundle | null> {
  if (!isDesktop()) throw new Error('importing a course needs the installed app')
  const { open } = await import('@tauri-apps/plugin-dialog')
  const path = await open({
    multiple: false,
    directory: false,
    filters: [{ name: 'Course bundle', extensions: ['pgn'] }],
  })
  if (typeof path !== 'string') return null
  const { readTextFile } = await import('@tauri-apps/plugin-fs')
  return { name: fileName(path), text: await readTextFile(path) }
}

/** Writes a bundle out. Returns where it went, or null when cancelled. */
export async function saveBundle(courseId: string, text: string): Promise<string | null> {
  const name = `${courseId}.pgn`
  if (isDesktop()) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const path = await save({
      defaultPath: name,
      filters: [{ name: 'Course bundle', extensions: ['pgn'] }],
    })
    if (!path) return null
    const { writeTextFile } = await import('@tauri-apps/plugin-fs')
    await writeTextFile(path, text)
    return path
  }

  const url = URL.createObjectURL(new Blob([text], { type: 'application/x-chess-pgn' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
  return name
}

/**
 * Installs a course into the folder the app scans at startup.
 *
 * Every JSON file already in that folder goes first. A replacement with fewer
 * chapters would otherwise leave one behind, and a file the manifest does not
 * list is a load error - the course would vanish from the catalog and the
 * reason would be a file nobody remembers writing.
 *
 * @returns the folder it wrote to, for telling the trainee where it went.
 */
export async function installCourse(
  manifest: CourseManifest,
  files: Record<string, unknown>,
): Promise<string> {
  if (!isDesktop()) throw new Error('installing a course needs the installed app')
  const { join } = await import('@tauri-apps/api/path')
  const fs = await import('@tauri-apps/plugin-fs')
  const folder = await courseFolder(manifest.id)

  await fs.mkdir(folder, { recursive: true })
  if (await fs.exists(folder)) {
    for (const entry of await fs.readDir(folder)) {
      if (entry.isDirectory || !entry.name.toLowerCase().endsWith('.json')) continue
      await fs.remove(await join(folder, entry.name))
    }
  }

  await fs.writeTextFile(await join(folder, MANIFEST_FILE), pretty(manifest))
  for (const [name, chapter] of Object.entries(files)) {
    await fs.writeTextFile(await join(folder, name), pretty(chapter))
  }
  return folder
}

/** The course folders already installed, so a replacement can be recognised. */
export async function installedCourseIds(): Promise<string[]> {
  if (!isDesktop()) return []
  const fs = await import('@tauri-apps/plugin-fs')
  const root = (await dataRoots()).courses
  if (!(await fs.exists(root))) return []
  return (await fs.readDir(root)).filter((entry) => entry.isDirectory).map((entry) => entry.name)
}

/** One course's folder inside the app's courses folder. */
async function courseFolder(courseId: string): Promise<string> {
  const { join } = await import('@tauri-apps/api/path')
  return join((await dataRoots()).courses, courseId)
}

/** Written the way the bundled courses are, so a person can read it after. */
function pretty(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

function fileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path
}
