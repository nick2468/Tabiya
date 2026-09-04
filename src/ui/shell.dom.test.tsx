import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { buttonIn, goTo, movesOnScreen, playOnRow, renderApp, seedHistory } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * The shell: the mode buttons, the course dropdown beside them, and what
 * survives a move between screens.
 *
 * Two entries in the register said this needed a DOM environment and were
 * deferred for want of one. Both are settled here. The greyed course
 * switcher, from phase 22, needs the shell rendered on the Drill view, and the
 * view is internal state with no way in from a test that renders to a string.
 * The view change itself, from phase 23, needs a test that can click Study and
 * click back. Both were driven by hand in a browser instead.
 */

type User = ReturnType<typeof renderApp>['user']

/** The course dropdown in the header, which every mode is looked at through. */
function switcher() {
  return screen.getByLabelText('Course') as HTMLSelectElement
}

async function startGame(user: User) {
  await user.selectOptions(switcher(), 'london-white')
  await goTo(user, 'Play')
  await user.click(await screen.findByRole('button', { name: 'Start the game' }))
  await screen.findByTestId('board')
}

/**
 * Learns one line, which is what gives Drill something to ask about and puts
 * the mixed-or-selected radios on the screen. Done through the Study table
 * rather than by writing a line id into storage: the ids are derived, and a
 * test that invents one would pass while the real ones drifted.
 */
async function learnALine(user: User) {
  await goTo(user, 'Study')
  const ticks = await screen.findAllByRole('checkbox', { name: /^I have learnt / })
  await user.click(ticks[0])
}

describe('the course switcher', () => {
  it('is idle on Drill while Drill is mixing every course', async () => {
    const { user } = renderApp()
    await learnALine(user)
    await goTo(user, 'Drill')

    // Drill mixed is the default, and the queue is not following the header.
    const mixed = (await screen.findByLabelText(/Drill mixed/)) as HTMLInputElement
    expect(mixed.checked).toBe(true)
    expect(switcher().disabled).toBe(true)
    expect(switcher().title).toMatch(/Drill is mixing every course/)
  })

  it('comes back the moment Drill is narrowed to one course', async () => {
    const { user } = renderApp()
    await learnALine(user)
    await goTo(user, 'Drill')
    expect(switcher().disabled).toBe(true)

    await user.click(await screen.findByLabelText(/Drill selected/))
    expect(switcher().disabled).toBe(false)
    expect(switcher().title).toBe('')
  })

  it('is live on every other screen, a running game included', async () => {
    const { user } = renderApp()
    await startGame(user)

    // A game used to grey it. That was overruled at phase 22: the game names
    // its own course, so the header is free to look elsewhere.
    expect(switcher().disabled).toBe(false)
  })
})

describe('changing screens', () => {
  /**
   * Phase 23 moved the running game above the screen so that looking at Study
   * mid-game no longer throws it away. Put the game back into Play's own state
   * and this goes red on the second line of the last block.
   */
  it('keeps a running game while the trainee looks at Study', async () => {
    const { user } = renderApp()
    await startGame(user)
    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    const played = movesOnScreen()

    // Study has a board of its own, so the game leaving the screen is read
    // from the move list rather than from the board being gone.
    await goTo(user, 'Study')
    expect(screen.getByRole('heading', { name: 'Chapters' })).toBeDefined()

    await goTo(user, 'Play')
    await screen.findByTestId('board')
    expect(movesOnScreen()).toEqual(played)
  })
})

describe('Progress', () => {
  it('lands on the launch options with the game own line already chosen', async () => {
    seedHistory([
      {
        courseId: 'london-white',
        deviated: false,
        moves: 2,
        level: 4,
        at: '2026-09-04T09:00:00.000Z',
        sans: ['d4', 'd5', 'Bf4', 'Nf6'],
        chapterId: 'london-ch1',
      },
    ])
    const { user } = renderApp()
    await goTo(user, 'Progress')

    const row = playOnRow('The London System')
    await user.click(buttonIn(row, 'Play on'))

    // Play on carries the game to Play, which offers to start it rather than
    // starting it: the trainee still chooses how long and how strong.
    const from = await screen.findByLabelText(/^From /)
    expect((from as HTMLInputElement).checked).toBe(true)
    expect(screen.getByRole('button', { name: 'Start the game' })).toBeDefined()
  })
})
