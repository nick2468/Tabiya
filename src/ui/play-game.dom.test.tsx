import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { barNumber, board, goTo, movesOnScreen, renderApp } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * Playing a game, in a DOM, through the buttons a person presses.
 *
 * This file exists because of a bug. Phase 23 lifted the running game into a
 * provider and memoised the provider's value; the session is a mutable object,
 * so the counter that says it changed was not a field of that value and was
 * left out of the memo's dependencies. React skips a provider's children
 * unless the context value changes, so Undo moved the game and left the screen
 * showing the position before it. Every test passed. It was found by pressing
 * Undo in a browser.
 *
 * Nothing here mocks the provider, the session or the report. The engine is a
 * fake because the alternative is a Stockfish worker in the suite, and the
 * board is a stub because chessground wants a `ResizeObserver` jsdom does not
 * have; everything between them is the code that ships.
 */

/**
 * Starts a game in the London, and waits for the board.
 *
 * The London on purpose: the app opens on the first course in the list, which
 * is a Black repertoire where the engine moves first, and a test that says
 * "play d4" should be playing d4 rather than whatever Black has after 1.e4.
 */
async function startGame(user: ReturnType<typeof renderApp>['user']) {
  await user.selectOptions(await screen.findByLabelText('Course'), 'london-white')
  await goTo(user, 'Play')
  await user.click(await screen.findByRole('button', { name: 'Start the game' }))
  await screen.findByTestId('board')
}

describe('a game on screen', () => {
  it('shows the move that was played, and the one that answered it', async () => {
    const { user } = renderApp()
    await startGame(user)

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    // Two moves: the trainee's, and the fake engine's reply.
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    expect(movesOnScreen()[0]).toBe('d4')
    expect(board().lastMove).not.toBe('')
  })

  /**
   * The number is the thing a person actually reads off the bar, and its sign
   * is the half of it that can be wrong without looking wrong.
   *
   * The fake engine answers +0.30 from the SIDE TO MOVE for every position,
   * as a real one does. So after d4, with Black to move, the bar is Black's
   * 0.4 and prints -0.4; after Black's reply it is White's and prints +0.4.
   * One sign error anywhere between the engine and the screen flips both.
   */
  it('prints the engine number on the bar, from White point of view', async () => {
    const { user } = renderApp({ cp: 40 })
    await startGame(user)

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    await vi.waitFor(() => expect(barNumber()).toBe('+0.4'))

    // And the accessible name is the same number rather than the report's
    // words, which is the part of the phase 23 ruling that was reversed.
    expect(screen.getByRole('img', { name: 'Evaluation: +0.4' })).toBeTruthy()
  })

  /**
   * The other sign and the other end of the bar, in one test.
   *
   * In a Black course the engine moves first, so the bar is read with BLACK
   * to move: the same +0.30 from the side to move is -0.3 from White's, and
   * the number goes to the bottom of the bar, because a Black trainee's own
   * colour is the one at the bottom.
   */
  it('turns the number round for a trainee playing Black', async () => {
    const { user } = renderApp({ cp: 30 })
    await user.selectOptions(await screen.findByLabelText('Course'), 'slav-black')
    await goTo(user, 'Play')
    await user.click(await screen.findByRole('button', { name: 'Start the game' }))
    await screen.findByTestId('board')

    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(1))
    await vi.waitFor(() => expect(barNumber()).toBe('-0.3'))
    expect(document.querySelector('.live-eval-number')?.className).toContain('at-bottom')
  })

  /**
   * The phase 23 bug, pinned. With the provider's value memoised and the
   * counter left out of its dependencies, the session goes back and the screen
   * does not: the move list still shows both moves and the board still
   * highlights the reply.
   */
  it('takes the moves off the screen when Undo takes them off the game', async () => {
    const { user } = renderApp()
    await startGame(user)

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    const afterTwo = board().fen

    await user.click(screen.getByRole('button', { name: 'Undo' }))

    // Undo works in pairs, so the trainee is to move again with nothing played.
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(0))
    expect(board().fen).not.toBe(afterTwo)
    expect(board().lastMove).toBe('')
  })

  it('puts them back when Redo puts them back', async () => {
    const { user } = renderApp()
    await startGame(user)

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    const played = movesOnScreen()

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(0))

    await user.click(screen.getByRole('button', { name: 'Redo' }))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(played))
  })

  /**
   * The guard the whole rig rests on. A real engine here would be a worker
   * spawning per test and a suite that fails on a machine with no engine
   * build, which is the reason the provider was unreachable in the first
   * place.
   */
  it('never starts a Stockfish worker', async () => {
    // jsdom has no `Worker` at all, so one is put there to be caught. If the
    // provider ever built its own engine again this would be constructed, and
    // on a real browser it would be a Stockfish worker per test.
    const built: string[] = []
    ;(globalThis as unknown as { Worker: unknown }).Worker = class {
      constructor(url: string) {
        built.push(url)
      }
    }
    try {
      const { user } = renderApp()
      await startGame(user)
      await user.click(await screen.findByRole('button', { name: 'move d4' }))
      await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
      expect(built).toEqual([])
    } finally {
      delete (globalThis as unknown as { Worker?: unknown }).Worker
    }
  })
})
