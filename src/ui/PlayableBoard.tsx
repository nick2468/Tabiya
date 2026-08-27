import { useCallback, useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { Board } from './Board'
import { isPromotion, legalDests, sideToMove } from '../model/position'

/**
 * A board you can play both sides of, with chess.js enforcing the rules.
 *
 * Illegal moves cannot be made: chessground is given only the legal
 * destinations, so it refuses anything else and snaps the piece back.
 */
export function PlayableBoard() {
  const [game] = useState(() => new Chess())
  const [fen, setFen] = useState(() => game.fen())
  const [lastMove, setLastMove] = useState<[string, string] | undefined>()

  const dests = useMemo(() => legalDests(fen), [fen])
  const moves = useMemo(() => game.history(), [fen, game])

  const onMove = useCallback(
    (orig: string, dest: string) => {
      // Phase 1 promotes to a queen without asking. A picker arrives with Play.
      const promotion = isPromotion(fen, orig, dest) ? 'q' : undefined
      game.move({ from: orig, to: dest, promotion })
      setFen(game.fen())
      setLastMove([orig, dest])
    },
    [fen, game],
  )

  const reset = useCallback(() => {
    game.reset()
    setFen(game.fen())
    setLastMove(undefined)
  }, [game])

  const takeBack = useCallback(() => {
    const undone = game.undo()
    if (!undone) return
    setFen(game.fen())
    setLastMove([undone.from, undone.to])
  }, [game])

  return (
    <div className="playable">
      <Board
        fen={fen}
        turnColor={sideToMove(fen)}
        movableColor={sideToMove(fen)}
        dests={dests}
        lastMove={lastMove}
        onMove={onMove}
      />
      <div className="playable-side">
        <div className="playable-buttons">
          <button type="button" onClick={takeBack}>
            Take back
          </button>
          <button type="button" onClick={reset}>
            Reset
          </button>
        </div>
        <p className="playable-status">
          {game.isGameOver() ? 'Game over' : `${sideToMove(fen) === 'white' ? 'White' : 'Black'} to move`}
        </p>
        <p className="playable-moves">{moves.join(' ') || 'No moves yet.'}</p>
      </div>
    </div>
  )
}
