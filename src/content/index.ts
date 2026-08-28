import { loadCourse } from '../model/course'
import type { ContentError, LoadedChapter, LoadedCourse } from '../model/types'

/**
 * The bundled courses, read from courses/ at build time.
 *
 * Vite inlines every file through import.meta.glob, so there is no fetch at
 * runtime and the same code path serves the app and the tests. One folder per
 * course: a course.json manifest naming its chapter files in course order.
 *
 * Bundled courses only. The desktop app also reads courses dropped into a
 * folder under AppData, which is phase 7's job and lands beside this one - the
 * merging happens above here, not inside it, because the browser build has no
 * such folder to read.
 */

const manifests = import.meta.glob<{ default: unknown }>('../../courses/*/course.json', {
  eager: true,
})
const chapterFiles = import.meta.glob<{ default: unknown }>('../../courses/*/*.json', {
  eager: true,
})

/** One course folder after loading: either the course or the errors in it. */
export interface CourseEntry {
  /** The folder name, used in error messages and when the id is unusable. */
  source: string
  course: LoadedCourse | null
  errors: ContentError[]
}

/** The folder name a bundled path sits in: courses/<folder>/<file>. */
function folderOf(path: string): string {
  return path.split('/').at(-2) ?? path
}

function fileOf(path: string): string {
  return path.split('/').at(-1) ?? path
}

export const courseEntries: CourseEntry[] = Object.keys(manifests)
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
    return { source: folder, course: result.course, errors: result.errors }
  })

/** Only the courses that loaded cleanly, in folder order. */
export const courses: LoadedCourse[] = courseEntries
  .map((entry) => entry.course)
  .filter((course): course is LoadedCourse => course !== null)

/** Every content error across every course. */
export const contentErrors: ContentError[] = courseEntries.flatMap((entry) => entry.errors)

/**
 * Every chapter of every course, in course order.
 *
 * v1 had one course, so the views read a flat chapter list. They still can:
 * the catalog shell in phase 7 is what makes a course something the trainee
 * chooses, and until then this keeps the app behaving exactly as it did.
 */
export const chapters: LoadedChapter[] = courses.flatMap((course) => course.chapters)

/**
 * The course the views work in until the catalog arrives.
 *
 * Phase 7 makes a course something the trainee picks, with Study and Play
 * scoped to it and a switcher in the header. Until then there is one, and this
 * names it rather than leaving `courses[0]` scattered through the views.
 */
export const currentCourse: LoadedCourse | undefined = courses[0]
