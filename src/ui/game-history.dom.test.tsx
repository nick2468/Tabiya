import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, screen, within } from '@testing-library/react'
import { buttonIn, goTo, playOnRow, renderApp, seedHistory, storedGames } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * Managing the games the app keeps, phase 39.
 *
 * Nick, 2026-09-05: a game in progress should be stoppable without a review
 * and without a record; every saved game should have Archive and Delete
 * beside it on Progress; archived games need a page of their own. These were
 * written before the code and shown red on 1.8.4.
 */

type User = ReturnType<typeof renderApp>['user']

const base = {
  courseId: 'london-white',
  deviated: false,
  level: 4,
  hints: 0,
  finalEval: 0.3,
  outcome: undefined,
  length: 'move15' as const,
}

const first = { ...base, moves: 2, at: '2026-09-01T09:00:00.000Z', sans: ['d4', 'd5', 'Bf4', 'Nf6'] }
const second = { ...base, moves: 2, at: '2026-09-02T09:00:00.000Z', sans: ['d4', 'd5', 'Bf4', 'e6'] }

async function startGame(user: User) {
  await user.selectOptions(await screen.findByLabelText('Course'), 'london-white')
  await goTo(user, 'Play')
  await user.click(await screen.findByRole('button', { name: 'Start the game' }))
  await screen.findByTestId('board')
}

/** The Games played sentence's first number. */
function gamesPlayed(): number {
  const heading = screen.getByRole('heading', { name: 'Games played' })
  const section = heading.closest('section') as HTMLElement
  const strong = section.querySelector('p strong')
  return strong ? Number(strong.textContent) : 0
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Stop and discard', () => {
  it('ends the game with nothing recorded and the start screen back', async () => {
    const { user } = renderApp()
    await startGame(user)
    await user.click(await screen.findByRole('button', { name: 'move d4' }))

    await user.click(screen.getByRole('button', { name: 'Stop and discard' }))

    await screen.findByRole('button', { name: 'Start the game' })
    expect(storedGames()).toEqual([])
    expect(screen.queryByTestId('board')).toBeNull()
  })
})

describe('archiving a game', () => {
  it('takes the row out of the lists and counts, and Unarchive brings it back', async () => {
    seedHistory([first, second])
    const { user } = renderApp()
    await goTo(user, 'Progress')
    expect(gamesPlayed()).toBe(2)
    expect(screen.queryByRole('button', { name: /archived game/ })).toBeNull()

    await user.click(buttonIn(playOnRow('1 September'), 'Archive'))

    expect(gamesPlayed()).toBe(1)
    expect(() => playOnRow('1 September')).toThrow()
    expect(storedGames().find((game) => game.at === first.at)?.archived).toBe(true)

    await user.click(screen.getByRole('button', { name: '1 archived game' }))
    const archived = screen.getByRole('table', { name: 'Archived games' })
    const row = within(archived).getAllByRole('row').find((tr) => tr.textContent?.includes('1 September'))
    if (!row) throw new Error('the archived game is not in the archive')
    // Reading only: no Play on or Replay here.
    expect(within(row).queryByRole('button', { name: 'Play on' })).toBeNull()
    expect(within(row).queryByRole('button', { name: 'Replay' })).toBeNull()

    await user.click(within(row).getByRole('button', { name: 'Unarchive' }))
    await user.click(screen.getByRole('button', { name: 'Back to your games' }))

    expect(gamesPlayed()).toBe(2)
    expect(playOnRow('1 September')).toBeDefined()
    expect(storedGames().find((game) => game.at === first.at)?.archived).toBeUndefined()
  })
})

describe('deleting a game', () => {
  it('needs two clicks inside the window, and the record is then gone for good', async () => {
    seedHistory([first, second])
    const { user } = renderApp()
    await goTo(user, 'Progress')

    const row = playOnRow('2 September')
    await user.click(buttonIn(row, 'Delete'))
    // The first click arms it: the label changes, nothing is deleted yet.
    expect(storedGames()).toHaveLength(2)
    await user.click(buttonIn(row, 'Delete for good?'))

    expect(storedGames().map((game) => game.at)).toEqual([first.at])
    expect(() => playOnRow('2 September')).toThrow()
  })

  it('disarms itself when the window passes, and the record stays', async () => {
    // Fake timers, for the one thing in this feature that is a clock: the
    // five seconds a delete stays armed. Nothing else here is timed.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    seedHistory([first, second])
    const { user } = renderApp()
    await goTo(user, 'Progress')

    const row = playOnRow('2 September')
    await user.click(buttonIn(row, 'Delete'))
    expect(buttonIn(row, 'Delete for good?')).toBeDefined()

    // Inside act, because the timer's state change is React's to flush.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5500)
    })

    expect(buttonIn(row, 'Delete')).toBeDefined()
    expect(within(row).queryByRole('button', { name: 'Delete for good?' })).toBeNull()
    expect(storedGames()).toHaveLength(2)
  })
})

describe('the game on the Play screen', () => {
  it('cannot be archived or deleted from Progress until it leaves Play', async () => {
    seedHistory([first, second])
    const { user } = renderApp()
    await goTo(user, 'Progress')
    // Replay puts the first game on the Play screen with its report.
    await user.click(buttonIn(playOnRow('1 September'), 'Replay'))
    await screen.findByRole('heading', { name: 'The report' })

    await goTo(user, 'Progress')
    const held = playOnRow('1 September')
    for (const name of ['Archive', 'Delete']) {
      const button = buttonIn(held, name)
      expect(button.disabled).toBe(true)
      expect(button.title).toBe('Finish or replace this game on Play first.')
    }
    // The other game is free.
    expect(buttonIn(playOnRow('2 September'), 'Archive').disabled).toBe(false)
  })
})

describe('an armed Delete', () => {
  it('is put back by a click anywhere else', async () => {
    seedHistory([first, second])
    const { user } = renderApp()
    await goTo(user, 'Progress')
    const row = playOnRow('2 September')
    await user.click(buttonIn(row, 'Delete'))
    expect(buttonIn(row, 'Delete for good?')).toBeDefined()

    await user.click(screen.getByRole('heading', { name: 'Games played' }))

    expect(buttonIn(row, 'Delete')).toBeDefined()
    expect(storedGames()).toHaveLength(2)
  })
})
