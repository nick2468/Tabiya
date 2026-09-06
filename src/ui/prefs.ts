import { useCallback, useEffect, useState } from 'react'
import type { LoadedChapter, LoadedCourse } from '../model/types'
import type { CourseMoves, GameLength } from '../play'
import type { DrillGap } from '../scheduler'

export type { DrillGap } from '../scheduler'

/**
 * The choices that belong to a screen rather than to what has been learnt.
 *
 * EVERY Play and Drill setting is remembered (Nick's ruling, 2026-09-06),
 * which reversed two earlier ones: phase 23 made "Include cards that are not
 * due yet" a one-sitting choice and phase 33 made "Play the other side" a
 * launch choice. Both are settings like any other now. The reasoning behind
 * the reversal is that a setting the app forgets is one the trainee has to
 * re-make every time they come back, and the app is used every day.
 *
 * Two things are still NOT remembered, and neither is a setting. A play
 * request belongs to a position, so "From a Study position" cannot be
 * restored on a screen the position is no longer on. And which side of the
 * board a recorded game was played on comes from the record.
 *
 * They are remembered the way `theme.ts` remembers dark or light, for the same
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
const OTHER_SIDE_KEY = 'london-trainer.other-side'
const DRILL_GAP_KEY = 'london-trainer.drill.gap'
const DRILL_WEAK_KEY = 'london-trainer.drill.weak-areas'
const DRILL_EARLY_KEY = 'london-trainer.drill.include-early'
const PLAY_LAUNCH_KEY = 'london-trainer.play.launch'
const PLAY_CHAPTER_KEY = 'london-trainer.play.chapter'
const PLAY_LENGTH_KEY = 'london-trainer.play.length'
const PLAY_LEVEL_KEY = 'london-trainer.play.level'
const PLAY_OTHER_SIDE_KEY = 'london-trainer.play.other-side'

/** What Drill draws its queue from. */
export type DrillScope = 'mixed' | 'selected'

/**
 * How a game starts, as far as it is worth remembering.
 *
 * "From a Study position" is the third way on the screen and is deliberately
 * absent: it names a position, and a position is not a preference.
 */
export type PlayLaunch = 'any' | 'chapter'

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

/** One of a fixed set of words, or the default when storage says anything else. */
function readOneOf<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const saved = read(key)
  return allowed.includes(saved as T) ? (saved as T) : fallback
}

/** A tick box. Anything but "yes" is off, so a scrambled value is not a surprise. */
function readFlag(key: string, fallback = false): boolean {
  const saved = read(key)
  if (saved === null) return fallback
  return saved === 'yes'
}

/**
 * A remembered choice: read once when the hook mounts, written on change.
 *
 * Never read during a render. Storage is not React state, and a component
 * that read it while rendering would be one that renders differently for
 * reasons React cannot see.
 */
function useRemembered<T>(initial: () => T, save: (value: T) => void) {
  const [value, setStored] = useState<T>(initial)
  const set = useCallback(
    (next: T) => {
      setStored(next)
      save(next)
    },
    [save],
  )
  return [value, set] as const
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
 * How the engine plays the course when the trainee plays the other side,
 * remembered between sessions the way the drill scope is.
 *
 * The SIDE is not remembered. It is a launch choice like the others, made
 * fresh each game; the setting is a preference about how those games go,
 * and a preference is what this file is for. Default "always", which is the
 * ruling: the course move every time unless the trainee asks otherwise.
 */
export function useCourseMoves(): {
  courseMoves: CourseMoves
  setCourseMoves: (next: CourseMoves) => void
} {
  const [courseMoves, setStored] = useState<CourseMoves>(
    () => (read(OTHER_SIDE_KEY) === 'sometimes' ? 'sometimes' : 'always'),
  )

  const setCourseMoves = useCallback((next: CourseMoves) => {
    setStored(next)
    write(OTHER_SIDE_KEY, next)
  }, [])

  return { courseMoves, setCourseMoves }
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

/**
 * The unit the gap before a card comes back is spent in.
 *
 * Hours by default (Nick's ruling, 2026-09-06). Days is spaced repetition and
 * is what the scheduler computes; minutes and hours spend the same number in a
 * smaller unit, for hammering one line in an afternoon.
 *
 * Called ONCE, in the shell, beside `useDrillScope`, and handed down. Drill
 * shows the radios and the progress store applies the unit, and a hook called
 * in both places would be two pieces of state that drift the moment somebody
 * presses a radio.
 */
export function useDrillGap(): { gap: DrillGap; setGap: (gap: DrillGap) => void } {
  const [gap, setGap] = useRemembered<DrillGap>(
    () => readOneOf(DRILL_GAP_KEY, ['minutes', 'hours', 'days'] as const, 'hours'),
    useCallback((next: DrillGap) => write(DRILL_GAP_KEY, next), []),
  )
  return { gap, setGap }
}

/** The two Drill boxes, remembered like everything else since phase 44. */
export function useDrillBoxes(): {
  weakAreasFirst: boolean
  setWeakAreasFirst: (on: boolean) => void
  includeEarly: boolean
  setIncludeEarly: (on: boolean) => void
} {
  const [weakAreasFirst, setWeakAreasFirst] = useRemembered(
    () => readFlag(DRILL_WEAK_KEY),
    useCallback((on: boolean) => write(DRILL_WEAK_KEY, on ? 'yes' : 'no'), []),
  )
  const [includeEarly, setIncludeEarly] = useRemembered(
    () => readFlag(DRILL_EARLY_KEY),
    useCallback((on: boolean) => write(DRILL_EARLY_KEY, on ? 'yes' : 'no'), []),
  )
  return { weakAreasFirst, setWeakAreasFirst, includeEarly, setIncludeEarly }
}

/**
 * The chapter Play spars against, per course.
 *
 * Per course because a chapter id from another course means nothing: the ids
 * are not unique across courses and would not resolve if they were.
 */
export function savedPlayChapter(courseId: string): string | null {
  return read(`${PLAY_CHAPTER_KEY}.${courseId}`)
}

/**
 * The chapter to spar against, given what was remembered and what is there.
 *
 * The same shape as `resolveCourse` and for the same reason: a remembered
 * chapter can be renamed, removed, or belong to a course that has since been
 * hidden, and none of those may leave the screen with no chapter selected.
 */
export function resolvePlayChapter(
  remembered: string | null,
  chapters: LoadedChapter[],
): LoadedChapter | undefined {
  return chapters.find((chapter) => chapter.id === remembered) ?? chapters[0]
}

/**
 * Every Play launch setting, remembered between sessions.
 *
 * Called ONCE, at the top of the Play screen. Play is not remounted when the
 * course changes, so the chapter follows the course in an effect rather than
 * being read while rendering.
 */
export function usePlayPrefs(courseId: string): {
  launch: PlayLaunch
  setLaunch: (launch: PlayLaunch) => void
  chapterId: string | null
  setChapterId: (id: string) => void
  length: GameLength
  setLength: (length: GameLength) => void
  level: number
  setLevel: (level: number) => void
  otherSide: boolean
  setOtherSide: (on: boolean) => void
} {
  const [launch, setLaunch] = useRemembered<PlayLaunch>(
    () => readOneOf(PLAY_LAUNCH_KEY, ['any', 'chapter'] as const, 'any'),
    useCallback((next: PlayLaunch) => write(PLAY_LAUNCH_KEY, next), []),
  )
  const [length, setLength] = useRemembered<GameLength>(
    () => readOneOf(PLAY_LENGTH_KEY, ['move10', 'move15', 'full'] as const, 'move15'),
    useCallback((next: GameLength) => write(PLAY_LENGTH_KEY, next), []),
  )
  const [level, setLevel] = useRemembered<number>(
    () => {
      const saved = Number(read(PLAY_LEVEL_KEY))
      return Number.isInteger(saved) && saved >= 1 && saved <= 8 ? saved : 4
    },
    useCallback((next: number) => write(PLAY_LEVEL_KEY, String(next)), []),
  )
  const [otherSide, setOtherSide] = useRemembered(
    () => readFlag(PLAY_OTHER_SIDE_KEY),
    useCallback((on: boolean) => write(PLAY_OTHER_SIDE_KEY, on ? 'yes' : 'no'), []),
  )

  const [chapterId, setStoredChapter] = useState<string | null>(() => savedPlayChapter(courseId))
  const setChapterId = useCallback(
    (id: string) => {
      setStoredChapter(id)
      write(`${PLAY_CHAPTER_KEY}.${courseId}`, id)
    },
    [courseId],
  )
  // The course can change under a mounted Play screen, and each course
  // remembers its own chapter. Read in an effect, never while rendering.
  useEffect(() => {
    setStoredChapter(savedPlayChapter(courseId))
  }, [courseId])

  return {
    launch,
    setLaunch,
    chapterId,
    setChapterId,
    length,
    setLength,
    level,
    setLevel,
    otherSide,
    setOtherSide,
  }
}
