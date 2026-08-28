import { createContext, useContext, useEffect, useMemo, useState } from 'react'
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
 * Scanned once, at startup. Adding a course means dropping a folder in and
 * restarting, which is what SPEC.md section 10 promises and is also the honest
 * story - a course discovered halfway through a drill session would change the
 * queue under the trainee's hands.
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
}

const CatalogContext = createContext<Catalog | null>(null)

export function useCatalogValue(): Catalog {
  const [external, setExternal] = useState<CourseEntry[]>([])
  const [scanned, setScanned] = useState(false)
  const [folder, setFolder] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([loadExternalCourses(), coursesFolder()]).then(([found, where]) => {
      if (cancelled) return
      setExternal(found)
      setFolder(where)
      setScanned(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

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
    }
  }, [external, folder, scanned])
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
