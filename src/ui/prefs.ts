import { useCallback, useEffect, useState } from 'react'
import type { LoadedCourse } from '../model/types'

/**
 * The choices that belong to this screen rather than to what has been learnt.
 *
 * Two of them so far: which course is open, and whether Drill mixes every
 * course or narrows to that one. Both are remembered between sessions, and
 * both are remembered the way `theme.ts` remembers dark or light, for the same
 * reason it does.
 *
 * NOT in the progress file. `progress.json` is versioned, exported and
 * imported, and a course id inside it would travel with an export to a machine
 * that may not have that course. Losing one of these costs a click; carrying
 * one to the wrong machine costs a puzzle. `localStorage` lives in the
 * WebView2 profile under `Repertoire Trainer Data`, which survives an upgrade
 * and goes on a ticked uninstall, and that is the right life for a preference.
 *
 * Storage can be refused outright, in a private window or a locked-down
 * profile. Every read and write here catches and carries on: the app works, it
 * just forgets.
 */

const COURSE_KEY = 'london-trainer.course'
const DRILL_KEY = 'london-trainer.drill'

/** What Drill draws its queue from. */
export type DrillScope = 'mixed' | 'selected'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Not worth telling anyone about: the choice just will not be remembered.
  }
}

/** The course id last opened, or null if nothing has been remembered yet. */
export function savedCourse(): string | null {
  return read(COURSE_KEY)
}

/** Remembers a course id for next time. */
export function rememberCourse(id: string): void {
  write(COURSE_KEY, id)
}

/**
 * The course to open, given what was remembered and what is actually there.
 *
 * A remembered id can fail four ways and they are all the same case: a fresh
 * install with nothing remembered, a course the trainee has since hidden, a
 * folder they deleted, and an id that was renamed. None of them is an error
 * and none of them may leave the app with no course, so every one falls back
 * to the first course in catalog order.
 *
 * `courses` is the VISIBLE, loaded list. A hidden course is not a candidate
 * because the trainee put it away, and a course that would not load has no id
 * to be selected by.
 */
export function resolveCourse(
  remembered: string | null,
  courses: LoadedCourse[],
): LoadedCourse | undefined {
  return courses.find((course) => course.id === remembered) ?? courses[0]
}

/**
 * Which cards Drill draws on, remembered between sessions.
 *
 * The default is mixed, which is the v2 ruling in SPEC.md section 10: due is
 * due, whichever repertoire the card belongs to.
 *
 * Called ONCE, in the shell, and handed down. Both Drill and the shell need
 * it - Drill to build its queue, the shell to grey the course switcher while
 * the queue is ignoring it - and a hook called in two places would be two
 * pieces of state that drift apart the moment somebody presses the radio.
 */
export function useDrillScope(): { scope: DrillScope; setScope: (scope: DrillScope) => void } {
  const [scope, setStored] = useState<DrillScope>(
    () => (read(DRILL_KEY) === 'selected' ? 'selected' : 'mixed'),
  )

  const setScope = useCallback((next: DrillScope) => {
    setStored(next)
    write(DRILL_KEY, next)
  }, [])

  return { scope, setScope }
}

/**
 * Keeps the remembered course id honest.
 *
 * Written back whenever the resolved course is not the one storage names, so
 * a memory pointing at a hidden or deleted course heals itself the first time
 * the app runs without it.
 *
 * It waits for the folder scan. In the installed app external courses arrive
 * after the first render, so a remembered external course is briefly not in
 * the list; writing the fallback back before the scan finished would forget
 * the trainee's own course to fix a problem that was about to go away.
 */
export function useRememberedCourse(id: string | undefined, scanned: boolean): void {
  useEffect(() => {
    if (!scanned || !id) return
    if (savedCourse() !== id) rememberCourse(id)
  }, [id, scanned])
}
