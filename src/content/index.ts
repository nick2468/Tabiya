import { loadChapter } from '../model/loader'
import type { ContentError, LoadedChapter } from '../model/types'

/**
 * The authored repertoire, read from content/ at build time.
 *
 * Vite inlines every chapter file through import.meta.glob, so there is no
 * fetch at runtime and the same code path serves the app and the tests.
 * Chapters keep filename order, which is course order: ch0, ch1, ch2 and so on.
 */

const files = import.meta.glob<{ default: unknown }>('../../content/*.json', { eager: true })

/** One chapter file after loading: either the chapter or the errors in it. */
export interface ChapterEntry {
  /** The filename, used in error messages and when the id is unusable. */
  source: string
  chapter: LoadedChapter | null
  errors: ContentError[]
}

export const chapterEntries: ChapterEntry[] = Object.keys(files)
  .sort()
  .map((path) => {
    const source = path.split('/').pop() ?? path
    const result = loadChapter(files[path].default, source)
    return { source, chapter: result.chapter, errors: result.errors }
  })

/** Only the chapters that loaded cleanly, in course order. */
export const chapters: LoadedChapter[] = chapterEntries
  .map((entry) => entry.chapter)
  .filter((chapter): chapter is LoadedChapter => chapter !== null)

/** Every content error across every chapter. */
export const contentErrors: ContentError[] = chapterEntries.flatMap((entry) => entry.errors)
