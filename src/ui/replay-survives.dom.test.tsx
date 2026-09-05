import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { board, buttonIn, goTo, playOnRow, renderApp, seedHistory } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * The position a replay was stepped to survives a trip to another screen.
 *
 * Nick, 2026-09-05: stepped a review back to the inaccuracy, went to Study to
 * look the position up, came back to the final move. The game itself survived
 * the trip because it lives in the provider; the replay ply did not, because it
 * was `useState` inside Play, which unmounts on a view change. Phase 36 moves
 * the ply into the provider beside the report it belongs to, and this is the
 * test that was red on the old code.
 */

type User = ReturnType<typeof renderApp>['user']

const recorded = {
  courseId: 'london-white',
  deviated: false,
  moves: 2,
  level: 4,
  at: '2026-09-04T09:00:00.000Z',
  sans: ['d4', 'd5', 'Bf4', 'Nf6'],
  hints: 0,
  finalEval: 0.3,
  outcome: undefined,
  length: 'move15' as const,
}

async function replayIt(user: User) {
  await goTo(user, 'Progress')
  await user.click(buttonIn(playOnRow('The London System'), 'Replay'))
  await screen.findByRole('heading', { name: 'The report' })
}

/** The move the list says the board is standing on. */
function currentMove(): string | null {
  const here = document.querySelector('.move-list [aria-current="true"]')
  return here?.textContent?.trim() ?? null
}

describe('the replay position and the screens', () => {
  it('is still where it was stepped to after a trip to Study', async () => {
    seedHistory([recorded])
    const { user } = renderApp()
    await replayIt(user)
    expect(currentMove()).toBe('Nf6')

    // Back two plies: the position after 1...d5, before the trainee's Bf4.
    await user.click(screen.getByRole('button', { name: 'Back one move' }))
    await user.click(screen.getByRole('button', { name: 'Back one move' }))
    expect(currentMove()).toBe('d5')
    const stepped = board().fen

    await goTo(user, 'Study')
    await goTo(user, 'Play')
    await screen.findByRole('heading', { name: 'The report' })

    expect(currentMove()).toBe('d5')
    expect(board().fen).toBe(stepped)
  })

  it('is cleared with the report, so the next review starts at the end', async () => {
    seedHistory([recorded])
    const { user } = renderApp()
    await replayIt(user)
    await user.click(screen.getByRole('button', { name: 'Back one move' }))
    await user.click(screen.getByRole('button', { name: 'Back one move' }))
    expect(currentMove()).toBe('d5')

    await user.click(screen.getByRole('button', { name: 'New game' }))
    await replayIt(user)
    expect(currentMove()).toBe('Nf6')
  })
})
