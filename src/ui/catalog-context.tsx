import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { bundledEntries } from '../content'
import { coursesFolder, loadExternalCourses } from '../content/external'
import { loadedCourses, mergeCourses } from '../model/course'
import type { CourseEntry, LoadedChapter, LoadedCourse } from '../model/types'

/**
 * The catalog: every course the app knows about, bundled or dropped in.
 *
 * It starts as the bundled set and stays usable from the first render. The
 * folder scan is a filesystem read and therefore async, and there is no reason
 * for the London to wait on it: the courses that ship with the app are already
 * in memory when the window opens.
 *
 * Scanned at startup, and again whenever the app itself changes the folder.
 * Importing a course used to ask for a restart, on the worry that a course
 * appearing mid-session would change the drill queue under the trainee's hands.
 * It cannot: a course that has just arrived has no learnt lines, so it builds
 * no cards and the queue is exactly what it was. A folder copied in by hand
 * behind the app's back is still only noticed at the next start, because
 * nothing tells the app to look.
 */

export interface Catalog {
  /** Every course folder, valid or not, bundled first. */
  entries: CourseEntry[]
  /** Only the ones that loaded, in catalog order. */
  courses: LoadedCourse[]
  /** Every chapter of every loaded course. */
  chapters: LoadedChapter[]
  /** False until the folder scan has finished. */
  scanned: boolean
  /** Where dropped-in courses go. Null in a browser, which has no such folder. */
  folder: string | null
  /** The course with this id, or undefined. */
  find: (id: string) => LoadedCourse | undefined
  /** Reads the courses folder again, after the app has written to it. */
  rescan: () => Promise<void>
}

const CatalogContext = createContext<Catalog | null>(null)

export function useCatalogValue(): Catalog {
  const [external, setExternal] = useState<CourseEntry[]>([])
  const [scanned, setScanned] = useState(false)
  const [folder, setFolder] = useState<string | null>(null)

  // Which scan is the current one. Two can be in flight at once - the one at
  // startup and one an import asked for - and the older must not put its own
  // answer back afterwards.
  const run = useRef(0)

  const rescan = useCallback(async () => {
    const mine = run.current + 1
    run.current = mine
    const [found, where] = await Promise.all([loadExternalCourses(), coursesFolder()])
    if (mine !== run.current) return
    setExternal(found)
    setFolder(where)
    setScanned(true)
  }, [])

  useEffect(() => {
    void rescan()
  }, [rescan])

  return useMemo(() => {
    const entries = mergeCourses(bundledEntries, external)
    const courses = loadedCourses(entries)
    return {
      entries,
      courses,
      chapters: courses.flatMap((course) => course.chapters),
      scanned,
      folder,
      find: (id: string) => courses.find((course) => course.id === id),
      rescan,
    }
  }, [external, folder, rescan, scanned])
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const value = useCatalogValue()
  return <CatalogContext value={value}>{children}</CatalogContext>
}

export function useCatalog(): Catalog {
  const value = useContext(CatalogContext)
  if (!value) throw new Error('useCatalog needs a CatalogProvider above it')
  return value
}
