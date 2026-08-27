import { useEffect, useRef } from 'react'
import { Chessground } from 'chessground'
import type { Api } from 'chessground/api'
import type { Config } from 'chessground/config'
import type { Key } from 'chessground/types'
import type { Dests } from '../model/position'
import type { Shape } from '../model/types'

import 'chessground/assets/chessground.base.css'
import 'chessground/assets/chessground.brown.css'
import 'chessground/assets/chessground.cburnett.css'
import './board.css'

export interface BoardProps {
  /** The position to show. */
  fen: string
  /** Which way up the board sits. */
  orientation?: 'white' | 'black'
  /** Whose turn it is; chessground refuses to move the other colour. */
  turnColor?: 'white' | 'black'
  /** Who the user may move: one colour, both, or nobody. */
  movableColor?: 'white' | 'black' | 'both'
  /** Legal destinations per origin. Anything not listed is rejected. */
  dests?: Dests
  /** Squares of the previous move, highlighted. */
  lastMove?: [string, string]
  /** Arrows and circles to draw: the last move, plus anything authored. */
  shapes?: Shape[]
  /** Called after a legal drag or click move. */
  onMove?: (orig: string, dest: string) => void
  /** Board width and height in CSS pixels. */
  size?: number
}

/**
 * A thin React wrapper over chessground, the lichess board widget.
 *
 * Chessground owns its own DOM and mutates it through an imperative API, so the
 * wrapper mounts it once into a container div and pushes prop changes with
 * api.set(). React never re-renders the board itself. The wrapper enforces
 * nothing about chess: it shows what it is given and reports moves the caller
 * declared legal through `dests`.
 */
export function Board({
  fen,
  orientation = 'white',
  turnColor,
  movableColor,
  dests,
  lastMove,
  shapes,
  onMove,
  size = 480,
}: BoardProps) {
  const host = useRef<HTMLDivElement>(null)
  const api = useRef<Api | null>(null)

  // The latest onMove, so the config handler installed at mount never goes stale.
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove

  useEffect(() => {
    if (!host.current) return
    const config: Config = {
      fen,
      orientation,
      movable: {
        free: false,
        showDests: true,
        events: {
          after: (orig: Key, dest: Key) => onMoveRef.current?.(orig, dest),
        },
      },
      drawable: { enabled: true, visible: true },
      // Chessground ignores synthetic events by default. Allowing them in dev
      // builds lets an automated check drive the board; real users only ever
      // produce trusted events, so shipped behaviour is unchanged.
      trustAllEvents: import.meta.env.DEV,
      highlight: { lastMove: true, check: true },
      animation: { enabled: true, duration: 180 },
    }
    api.current = Chessground(host.current, config)
    // Chessground measures its host once, at mount. A board mounted while its
    // host is hidden or collapsed keeps zero-width bounds until told to look
    // again, so re-measure whenever the host's size changes.
    const observer = new ResizeObserver(() => api.current?.redrawAll())
    observer.observe(host.current)
    return () => {
      observer.disconnect()
      api.current?.destroy()
      api.current = null
    }
    // Mount once. Every later change flows through the api.set() effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Dev-only handle on the board API, so a browser check can read the state
    // chessground actually holds (turn, movable colour, dests) rather than guess.
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__cg = api.current
    api.current?.set({
      fen,
      orientation,
      turnColor,
      lastMove: lastMove as Key[] | undefined,
      movable: {
        color: movableColor,
        dests: dests as Map<Key, Key[]> | undefined,
      },
    })
  }, [fen, orientation, turnColor, movableColor, dests, lastMove])

  useEffect(() => {
    api.current?.setAutoShapes(
      (shapes ?? []).map((shape) => ({
        orig: shape.orig as Key,
        dest: shape.dest as Key | undefined,
        brush: shape.brush,
      })),
    )
  }, [shapes])

  return <div className="board" ref={host} style={{ width: size, height: size }} />
}
