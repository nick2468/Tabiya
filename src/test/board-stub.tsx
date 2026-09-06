import { Chess } from 'chess.js'
import type { BoardProps } from '../ui/Board'

/**
 * The board, for tests, as a list of moves you can click.
 *
 * The real board is chessground, which measures its host through a
 * `ResizeObserver`; jsdom has neither the observer nor a non-zero rectangle to
 * measure, and mounting it throws "ResizeObserver is not defined". So the DOM
 * tests swap it out at the component boundary.
 *
 * That is a gain rather than a compromise. Driving a drag through chessground
 * would test chessground; what these tests want to say is "play d4", and a
 * button per legal move says exactly that. The move seam is the real one:
 * `onMove(from, to)` is what the live board calls and what `Play` passes to
 * the provider, so everything under it is the code that ships.
 *
 * The position, the last-move highlight and the arrows come out as data
 * attributes, because they are what a person looks at on this screen and a
 * test should be able to look at them too. An arrow reads as brush, origin,
 * destination: "greend2d4".
 */
export function Board({ fen, onMove, lastMove, movableColor, shapes }: BoardProps) {
  const legal = movableColor ? new Chess(fen).moves({ verbose: true }) : []
  return (
    <div
      data-testid="board"
      data-fen={fen}
      data-last-move={lastMove ? lastMove.join('') : ''}
      data-shapes={(shapes ?? []).map((shape) => `${shape.brush}${shape.orig}${shape.dest ?? ''}`).join(' ')}
    >
      {legal.map((move) => (
        <button
          key={`${move.from}${move.to}${move.promotion ?? ''}`}
          type="button"
          onClick={() => onMove?.(move.from, move.to)}
        >
          {`move ${move.san}`}
        </button>
      ))}
    </div>
  )
}
