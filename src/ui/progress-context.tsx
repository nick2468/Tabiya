import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  LocalStorageProgressStore,
  emptyProgress,
  isLearnt,
  toggleLearnt,
  type ProgressState,
  type ProgressStore,
} from '../storage/progress'

/**
 * The trainee's progress, held once for the whole app.
 *
 * It lives in a context rather than a hook per view, so Study, and later Drill
 * and Progress, all read and write the same state instead of drifting apart.
 *
 * Loading is async, so the value starts empty with a `loaded` flag. Nothing is
 * written back before the first read finishes: saving too early would overwrite
 * real progress with the blank state the app started with.
 */

export interface Progress {
  state: ProgressState
  loaded: boolean
  learnt: (lineId: string) => boolean
  toggle: (lineId: string) => void
}

const ProgressContext = createContext<Progress | null>(null)

export function useProgressStateFor(store: ProgressStore): Progress {
  const [state, setState] = useState<ProgressState>(emptyProgress)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    void store.load().then((saved) => {
      if (cancelled) return
      setState(saved)
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [store])

  useEffect(() => {
    if (loaded) void store.save(state)
  }, [loaded, state, store])

  const toggle = useCallback((lineId: string) => {
    setState((previous) => toggleLearnt(previous, lineId))
  }, [])

  const learnt = useCallback((lineId: string) => isLearnt(state, lineId), [state])

  return { state, loaded, learnt, toggle }
}

export function ProgressProvider({
  children,
  store,
}: {
  children: React.ReactNode
  store?: ProgressStore
}) {
  // Built once, and only when the app runs: the browser store touches
  // localStorage, which does not exist under the node test environment.
  const resolved = useMemo(() => store ?? new LocalStorageProgressStore(), [store])
  const value = useProgressStateFor(resolved)
  return <ProgressContext value={value}>{children}</ProgressContext>
}

export function useProgress(): Progress {
  const value = useContext(ProgressContext)
  if (!value) throw new Error('useProgress needs a ProgressProvider above it')
  return value
}
