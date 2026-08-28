import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { TauriProgressStore, isDesktop } from '../storage/tauri-store'
import {
  LocalStorageProgressStore,
  emptyProgress,
  isLearnt,
  recordAnswer,
  recordGame,
  toggleLearnt,
  type PlayRecord,
  type ProgressState,
  type ProgressStore,
} from '../storage/progress'
import { newSchedule, review, type Rating } from '../scheduler'
import { countsAsCorrect, ratingFor, type Verdict } from '../model/grade'
import type { Card } from '../model/cards'

/**
 * The trainee's progress, held once for the whole app.
 *
 * It lives in a context rather than a hook per view, so Study, Drill and
 * Progress all read and write the same state instead of drifting apart.
 *
 * Loading is async, so the value starts empty with a `loaded` flag. Nothing is
 * written back before the first read finishes: saving too early would overwrite
 * real progress with the blank state the app started with.
 *
 * The same reasoning covers a read that FAILS rather than one that has not
 * finished. A store that could not read its own file hands back a blank state
 * and says why; writing that blank state back would destroy exactly the file
 * it could not read. So a failed read stops saving altogether until the
 * trainee replaces the state themselves, and the shell says so on screen.
 */

export interface Progress {
  state: ProgressState
  loaded: boolean
  /**
   * Why the saved progress could not be read, when it could not. While this is
   * set nothing is written, so whatever is on disk stays there.
   */
  failure: string | null
  learnt: (lineId: string) => boolean
  toggle: (lineId: string) => void
  /**
   * Records a drill answer: reschedules the card and marks its concepts.
   * `rating` overrides the one the verdict earns, which is how the Easy
   * button works.
   */
  answer: (card: Card, verdict: Verdict, rating?: Rating) => void
  /** Records a finished game, for the play stats. */
  recordPlay: (game: PlayRecord) => void
  /** The whole state as JSON text, for keeping somewhere safe. */
  exportJson: () => Promise<string>
  /** Replaces everything from exported text. Rejects when the text is bad. */
  importJson: (text: string) => Promise<void>
}

const ProgressContext = createContext<Progress | null>(null)

export function useProgressStateFor(store: ProgressStore): Progress {
  const [state, setState] = useState<ProgressState>(emptyProgress)
  const [loaded, setLoaded] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void store.load().then((saved) => {
      if (cancelled) return
      setState(saved.state)
      setFailure(saved.failure ?? null)
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [store])

  useEffect(() => {
    // Never write over a file that could not be read.
    if (loaded && !failure) void store.save(state)
  }, [failure, loaded, state, store])

  const toggle = useCallback((lineId: string) => {
    setState((previous) => toggleLearnt(previous, lineId))
  }, [])

  const learnt = useCallback((lineId: string) => isLearnt(state, lineId), [state])

  const answer = useCallback((card: Card, verdict: Verdict, rating?: Rating) => {
    const now = new Date()
    setState((previous) => {
      const schedule = review(
        previous.cards[card.key] ?? newSchedule(now),
        rating ?? ratingFor(verdict),
        now,
      )
      return recordAnswer(
        previous,
        card.courseId,
        card.key,
        card.tags,
        countsAsCorrect(verdict),
        schedule,
      )
    })
  }, [])

  const recordPlay = useCallback((game: PlayRecord) => {
    setState((previous) => recordGame(previous, game))
  }, [])

  // Exported from what is in memory, not from storage: the two are kept in
  // step by the effect above, and in memory is the one that cannot be stale.
  const exportJson = useCallback(async () => JSON.stringify(state, null, 2), [state])

  const importJson = useCallback(
    async (text: string) => {
      const imported = await store.importJson(text)
      setState(imported)
      // An import is the trainee deliberately replacing the state, which is
      // also how they get out of a failed read.
      setFailure(null)
    },
    [store],
  )

  return { state, loaded, failure, learnt, toggle, answer, recordPlay, exportJson, importJson }
}

export function ProgressProvider({
  children,
  store,
}: {
  children: React.ReactNode
  store?: ProgressStore
}) {
  // Built once, and only when the app runs: the browser store touches
  // localStorage, which does not exist under the node test environment. In the
  // wrapped Windows app the same interface is backed by a file in AppData.
  const resolved = useMemo(
    () => store ?? (isDesktop() ? new TauriProgressStore() : new LocalStorageProgressStore()),
    [store],
  )
  const value = useProgressStateFor(resolved)
  return <ProgressContext value={value}>{children}</ProgressContext>
}

export function useProgress(): Progress {
  const value = useContext(ProgressContext)
  if (!value) throw new Error('useProgress needs a ProgressProvider above it')
  return value
}
