import { createContext, useCallback, useContext, useState } from 'react'
import type { LoadedNode } from '../model/types'

/**
 * Where each course's Study screen was left: the chapter, the moves walked,
 * and the chosen line.
 *
 * Nick, phase 40: leaving Study and coming back lost the position, the same
 * fault phase 36 fixed on Play. The screen unmounts on a view change and the
 * state went with it. It lives here now, keyed by course id so each course
 * keeps its own place, in memory only: a restart starts fresh. The auto-step
 * flag is NOT here on purpose. Its timer must not run unseen, so it stays on
 * the screen, stops when the screen unmounts, and does not start again by
 * itself on return.
 */

export interface StudyPlace {
  chapterId: string
  /** The nodes walked from the chapter root, in order. */
  chain: LoadedNode[]
  /** The row of the lines table the board is following. */
  chosen: number
}

export interface StudyPlaces {
  /** The place for a course, or undefined when it has not been opened. */
  place: (courseId: string) => StudyPlace | undefined
  /** Replaces a course's place. Undefined fields keep what is there. */
  update: (courseId: string, change: Partial<StudyPlace>) => void
}

// eslint-disable-next-line react/only-export-components
export const StudyContext = createContext<StudyPlaces | null>(null)

const FRESH: Omit<StudyPlace, 'chapterId'> = { chain: [], chosen: 0 }

function useStudyValue(): StudyPlaces {
  const [places, setPlaces] = useState<Map<string, StudyPlace>>(() => new Map())

  const place = useCallback((courseId: string) => places.get(courseId), [places])

  const update = useCallback((courseId: string, change: Partial<StudyPlace>) => {
    setPlaces((previous) => {
      const held = previous.get(courseId)
      const chapterId = change.chapterId ?? held?.chapterId
      if (!chapterId) return previous
      const next = new Map(previous)
      next.set(courseId, { ...FRESH, ...held, ...change, chapterId })
      return next
    })
  }, [])

  // A fresh object every render, the same reasoning as the play provider:
  // nothing here is expensive, and a memo would need to list every field.
  return { place, update }
}

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const value = useStudyValue()
  return <StudyContext value={value}>{children}</StudyContext>
}

export function useStudy(): StudyPlaces {
  const value = useContext(StudyContext)
  if (!value) throw new Error('useStudy needs a StudyProvider above it')
  return value
}
