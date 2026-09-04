import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import {
  buttonIn,
  goTo,
  movesOnScreen,
  playOnRow,
  renderApp,
  storedGames,
} from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * One game is one record, however many times it is reviewed.
 *
 * This is the rule that has broken three times, always in the provider and
 * never in a way a test could see.
 *
 * Phase 25 made `at` a game's identity and `recordGame` replace by it, and
 * `finish` minted a fresh `at` on every review, so a game reviewed twice was
 * counted twice. Phase 27 fixed a second door into the same room: `finish`
 * closed over the identity as it stood when the callback was built, which for
 * a caller that starts a game and then reviews it is before the start. Both
 * were found by playing a game and looking at Progress afterwards; the tests
 * of `recordGame` and of the request builders were green throughout.
 *
 * So this drives the whole sequence and asks the stored history, which is the
 * only place the bug was ever visible.
 */

type User = ReturnType<typeof renderApp>['user']

async function startGame(user: User) {
  await user.selectOptions(await screen.findByLabelText('Course'), 'london-white')
  await goTo(user, 'Play')
  await user.click(await screen.findByRole('button', { name: 'Start the game' }))
  await screen.findByTestId('board')
}

/** Plays one move and waits for the answer, so the game has moved on. */
async function playAMove(user: User, san: string) {
  const before = movesOnScreen().length
  await user.click(await screen.findByRole('button', { name: `move ${san}` }))
  await vi.waitFor(() => expect(movesOnScreen().length).toBeGreaterThan(before + 1))
}

/** Presses whichever review button is showing and waits for the report. */
async function review(user: User) {
  const button =
    screen.queryByRole('button', { name: 'Stop and review' }) ??
    screen.getByRole('button', { name: 'Review the game' })
  await user.click(button)
  await screen.findByRole('heading', { name: 'The report' })
}

describe('one game, one record', () => {
  it('replaces the record when a game is carried on and reviewed again', async () => {
    const { user } = renderApp()
    await startGame(user)

    await playAMove(user, 'd4')
    await review(user)

    await vi.waitFor(() => expect(storedGames()).toHaveLength(1))
    const first = storedGames()[0]
    expect(first.moves).toBe(1)

    // Keep playing, play on, and review the same game a second time.
    await user.click(screen.getByRole('button', { name: 'Keep playing' }))
    await playAMove(user, 'Nf3')
    await review(user)

    await vi.waitFor(() => expect(storedGames()[0].moves).toBe(2))
    const games = storedGames()
    expect(games).toHaveLength(1)
    expect(games[0].at).toBe(first.at)
    expect(games[0].sans).toHaveLength(4)
  })

  it('keeps one record through a Play on from Progress', async () => {
    const { user } = renderApp()
    await startGame(user)
    await playAMove(user, 'd4')
    await review(user)
    await vi.waitFor(() => expect(storedGames()).toHaveLength(1))
    const identity = storedGames()[0].at

    await goTo(user, 'Progress')
    await user.click(buttonIn(playOnRow('The London System'), 'Play on'))

    // Play on lands on the launch options with the game's own radio chosen.
    await user.click(await screen.findByRole('button', { name: 'Start the game' }))
    await screen.findByTestId('board')
    await playAMove(user, 'Nf3')
    await review(user)

    await vi.waitFor(() => expect(storedGames()[0].moves).toBe(2))
    expect(storedGames()).toHaveLength(1)
    expect(storedGames()[0].at).toBe(identity)
  })

  it('counts two games as two when they are two games', async () => {
    const { user } = renderApp()
    await startGame(user)
    await playAMove(user, 'd4')
    await review(user)
    await vi.waitFor(() => expect(storedGames()).toHaveLength(1))

    await user.click(screen.getByRole('button', { name: 'New game' }))
    await user.click(await screen.findByRole('button', { name: 'Start the game' }))
    await screen.findByTestId('board')
    await playAMove(user, 'd4')
    await review(user)

    await vi.waitFor(() => expect(storedGames()).toHaveLength(2))
    const [one, two] = storedGames()
    expect(one.at).not.toBe(two.at)
  })
})
