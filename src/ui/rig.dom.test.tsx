import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Board } from './Board'

/**
 * Why the board is stubbed, written down as a test rather than a comment.
 *
 * Every other DOM test mocks `./Board`, which is a real cost: the stub is code
 * that can drift from the board it stands in for. This says what the stub buys
 * and keeps the reason honest. If a later chessground, or a jsdom that grows a
 * `ResizeObserver`, makes this stop throwing, this test goes red and asks
 * whether the stub is still needed.
 */
describe('the rig', () => {
  it('cannot mount the real board in jsdom', () => {
    expect(() =>
      render(
        <Board
          fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          orientation="white"
          size={416}
        />,
      ),
      // Chessground watches its host for a resize. jsdom has no layout and so
      // no `ResizeObserver`, and the missing global throws on mount.
    ).toThrow(/ResizeObserver/)
  })
})
