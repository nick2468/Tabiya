import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { buttonIn, goTo, movesOnScreen, playOnRow, renderApp, seedHistory, storedGames } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * Playing on from a position inside a game already played.
 *
 * Nick was told move 35 of a replayed game missed a forced mate and could not
 * see it. This is the button that lets him try, and the thing it must not do
 * is touch the game he was reading. `at` is a record's identity: a request
 * carrying the old one would make the first review of the new game REPLACE
 * the old record instead of adding one.
 *
 * So the assertion is two records, different identities, the first unchanged.
 */

type User = ReturnType<typeof renderApp>['user']

const recorded = {
  courseId: 'london-white',
  deviated: false,
  moves: 2,
  level: 4,
  at: '2026-09-03T14:32:00.000Z',
  sans: ['d4', 'd5', 'Bf4', 'Nf6'],
  hints: 1,
  finalEval: 0.3,
  length: 'move15' as const,
}

async function replayIt(user: User) {
  await goTo(user, 'Progress')
  await user.click(buttonIn(playOnRow('The London System'), 'Replay'))
  await screen.findByRole('heading', { name: 'The report' })
}

describe('Play from here, out of a replay', () => {
  it('starts a new game and leaves the replayed one alone', async () => {
    seedHistory([recorded])
    const { user } = renderApp()
    await replayIt(user)
    await vi.waitFor(() => expect(storedGames()).toHaveLength(1))
    const before = storedGames()[0]

    // Back two plies, to the position before the trainee played Bf4. That is
    // the shape of the question: what else was there.
    await user.click(screen.getByRole('button', { name: 'Back one move' }))
    await user.click(screen.getByRole('button', { name: 'Back one move' }))

    await user.click(screen.getByRole('button', { name: 'Play from here' }))

    // The launch options, with the game's own position offered and the
    // pickers live. Nothing is started until Start is pressed.
    const from = (await screen.findByLabelText(/^From your game of /)) as HTMLInputElement
    expect(from.checked).toBe(true)
    expect(storedGames()).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Start the game' }))
    await screen.findByTestId('board')
    // The two moves it started from are on the board already.
    expect(movesOnScreen()).toEqual(['d4', 'd5'])

    await user.click(await screen.findByRole('button', { name: 'move Bf4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(4))
    await user.click(screen.getByRole('button', { name: 'Stop and review' }))
    await screen.findByRole('heading', { name: 'The report' })

    await vi.waitFor(() => expect(storedGames()).toHaveLength(2))
    const [first, second] = storedGames()
    expect(first).toEqual(before)
    expect(second.at).not.toBe(before.at)
    // The new game's record begins with the moves it started from, so the
    // deviation report and Lines played read from the chapter root.
    expect(second.sans?.slice(0, 2)).toEqual(['d4', 'd5'])
  })

  it('is off where the engine is to move, and says which way to step', async () => {
    seedHistory([recorded])
    const { user } = renderApp()
    await replayIt(user)

    // The end of the game is after Black's Nf6, so it is White's move and the
    // button is live. One step back is Black's move and it is not.
    const button = () => screen.getByRole('button', { name: 'Play from here' }) as HTMLButtonElement
    expect(button().disabled).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Back one move' }))
    expect(button().disabled).toBe(true)
    expect(button().title).toBe("It is the engine's move here. Step one move on or back.")
  })

  it('is off at a finished position', async () => {
    // A game the trainee lost to Fool's mate. The last position is mate with
    // the trainee to move, and there is nothing to practise from a board that
    // is over.
    seedHistory([{ ...recorded, sans: ['f3', 'e5', 'g4', 'Qh4#'], moves: 2 }])
    const { user } = renderApp()
    await replayIt(user)

    const button = screen.getByRole('button', { name: 'Play from here' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.title).toBe('The game is over here.')
  })
})
