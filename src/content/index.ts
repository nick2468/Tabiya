import { loadCourse } from '../model/course'
import type { ContentError, CourseEntry, LoadedCourse } from '../model/types'

/**
 * The bundled courses, read from courses/ at build time.
 *
 * Vite inlines every file through import.meta.glob, so there is no fetch at
 * runtime and the same code path serves the app and the tests. One folder per
 * course: a course.json manifest naming its chapter files in course order.
 *
 * Bundled courses only. The desktop app also reads courses dropped into a
 * folder under AppData (src/content/external.ts); the merging happens in the
 * catalog above both, not inside either, because the browser build has no such
 * folder to read and the bundled set must not wait on a filesystem.
 */

const manifests = import.meta.glob<{ default: unknown }>('../../courses/*/course.json', {
  eager: true,
})
const chapterFiles = import.meta.glob<{ default: unknown }>('../../courses/*/*.json', {
  eager: true,
})

/** The folder name a bundled path sits in: courses/<folder>/<file>. */
function folderOf(path: string): string {
  return path.split('/').at(-2) ?? path
}

function fileOf(path: string): string {
  return path.split('/').at(-1) ?? path
}

export const bundledEntries: CourseEntry[] = Object.keys(manifests)
  .sort()
  .map((manifestPath) => {
    const folder = folderOf(manifestPath)
    const files: Record<string, unknown> = {}
    for (const path of Object.keys(chapterFiles)) {
      if (folderOf(path) !== folder) continue
      const file = fileOf(path)
      if (file === 'course.json') continue
      files[file] = chapterFiles[path].default
    }
    const result = loadCourse(manifests[manifestPath].default, files)
    return { source: folder, origin: 'bundled', course: result.course, errors: result.errors }
  })

/**
 * Only the bundled courses that loaded cleanly, in folder order.
 *
 * This is what the content suite holds to the quality bar. The app reads the
 * merged catalog instead, which is these plus whatever was dropped in.
 */
export const bundledCourses: LoadedCourse[] = bundledEntries
  .map((entry) => entry.course)
  .filter((course): course is LoadedCourse => course !== null)

/** Every content error across every bundled course. */
export const contentErrors: ContentError[] = bundledEntries.flatMap((entry) => entry.errors)

