import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { buttonIn, goTo, movesOnScreen, playOnRow, renderApp, seedHistory, storedGames } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * Replay reads a game. It does not play it, and it does not rewrite it.
 *
 * Phase 27 added Replay and it wrote a second record every time, for two
 * reasons that both live in the provider. The effect that starts a replayed
 * game read the screen's launch state, which an effect declared above it sets
 * in the same commit, so it saw no identity and minted one. And `finish`
 * closed over the identity as it stood when the callback was built, which in
 * this path is BEFORE the start it is sequenced after.
 *
 * The second of those is invisible anywhere else: Keep playing and Play on
 * both put a render between the start and the review, so the callback is
 * rebuilt and the closure is fresh. Only Replay awaits one straight after the
 * other. That is why this file exists separately from the identity tests.
 */

type User = ReturnType<typeof renderApp>['user']

/** A game already in the history, as an upgrade would find it. */
const recorded = {
  courseId: 'london-white',
  deviated: false,
  moves: 2,
  level: 4,
  at: '2026-09-04T09:00:00.000Z',
  sans: ['d4', 'd5', 'Bf4', 'Nf6'],
  hints: 2,
  finalEval: 0.3,
  outcome: undefined,
  length: 'move15' as const,
}

async function replayIt(user: User) {
  await goTo(user, 'Progress')
  await user.click(buttonIn(playOnRow('The London System'), 'Replay'))
  await screen.findByRole('heading', { name: 'The report' })
}

describe('replaying a recorded game', () => {
  it('puts the game up with its report and its moves', async () => {
    seedHistory([recorded])
    const { user } = renderApp()
    await replayIt(user)

    expect(movesOnScreen()).toEqual(['d4', 'd5', 'Bf4', 'Nf6'])
    // The viewer is live: the arrows are there to step through it.
    expect(screen.getByRole('button', { name: 'Back one move' })).toBeDefined()
  })

  /**
   * The phase 27 bug, pinned. It wrote a second record; before that fix it
   * would also have overwritten the first with a re-scan of the same moves.
   */
  it('leaves the record exactly as it was', async () => {
    seedHistory([recorded])
    const { user } = renderApp()
    await replayIt(user)

    // A moment for any write to land, so this cannot pass by being early.
    await vi.waitFor(() => expect(storedGames()).toHaveLength(1))
    const after = storedGames()[0]
    expect(after.at).toBe(recorded.at)
    expect(after.moves).toBe(2)
    expect(after.hints).toBe(2)
    expect(after.finalEval).toBe(0.3)
    expect(after.sans).toEqual(recorded.sans)
  })

  /**
   * The one exception, added at phase 28: a record from before evaluations
   * were kept has nothing to lose and this scan is its only chance at one.
   */
  it('fills in a verdict that was never recorded, and nothing else', async () => {
    const older = { ...recorded, finalEval: undefined, hints: 1 }
    seedHistory([older])
    const { user } = renderApp()
    await replayIt(user)

    await vi.waitFor(() => expect(storedGames()[0].finalEval).toBeDefined())
    const after = storedGames()[0]
    expect(storedGames()).toHaveLength(1)
    expect(after.at).toBe(older.at)
    expect(after.moves).toBe(2)
    expect(after.hints).toBe(1)
    expect(after.sans).toEqual(older.sans)
  })

  /**
   * The opponent is held still for a replay. Without that the provider sees a
   * position where the opponent is to move and asks the engine for one, so a
   * game that was stopped three plies in comes back four plies long: reading a
   * game changed it. Three plies on purpose - a game stopped with the trainee
   * to move never asks the engine anything, and would pass either way.
   */
  it('does not add a reply to a game that was stopped mid-move', async () => {
    seedHistory([{ ...recorded, sans: ['d4', 'd5', 'Bf4'], moves: 2 }])
    const { user } = renderApp()
    await replayIt(user)

    expect(movesOnScreen()).toEqual(['d4', 'd5', 'Bf4'])
    await vi.waitFor(() => expect(storedGames()).toHaveLength(1))
    expect(storedGames()[0].sans).toHaveLength(3)
  })
})
