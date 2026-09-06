import { describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { board, goTo, movesOnScreen, playOnRow, buttonIn, renderApp, storedGames } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * Playing the other side, driven the way a person drives it.
 *
 * Phase 32 swaps the colours: the trainee takes the opponent's colour and the
 * engine plays the course. That runs through the provider and the session,
 * which is the part of the app three earlier bugs shipped through with a
 * green bar, so this is written the phase 29 way: against the screen, red
 * before the feature existed, and reading the stored history rather than
 * anything the screen says about it.
 *
 * The Najdorf is used on purpose. It is a BLACK course, so playing the other
 * side means the trainee is White and moves first, and the first thing the
 * engine does is answer 1.e4 with the course's own 1...c5. A White course
 * would have the engine open, which hides whether the trainee's move went in.
 */

type User = ReturnType<typeof renderApp>['user']

async function startOtherSide(user: User) {
  await user.selectOptions(await screen.findByLabelText('Course'), 'najdorf-black')
  await goTo(user, 'Play')
  await user.click(await screen.findByLabelText('Play the other side'))
  await user.click(await screen.findByRole('button', { name: 'Start the game' }))
  await screen.findByTestId('board')
}

describe('playing against the course', () => {
  it('has the trainee move first as White, and the course answer with its own reply', async () => {
    const { user } = renderApp()
    await startOtherSide(user)

    // Nothing has been played and it is the trainee's move: the stub only
    // offers moves when the board is movable, and e4 is one of them.
    expect(movesOnScreen()).toEqual([])
    await user.click(await screen.findByRole('button', { name: 'move e4' }))

    // The engine's reply is the course's first move, not the fake engine's
    // first legal move, which is a7a6 on this board.
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    expect(movesOnScreen()).toEqual(['e4', 'c5'])
    expect(board().fen.split(' ')[1]).toBe('w')
  })

  it('says which side in the opening line', async () => {
    const { user } = renderApp()
    await startOtherSide(user)
    expect(screen.getByText(/Opening: The Sicilian Najdorf, playing the other side/)).toBeDefined()
  })

  it('reports on the course rather than the repertoire, and records the side', async () => {
    const { user } = renderApp()
    await startOtherSide(user)
    await user.click(await screen.findByRole('button', { name: 'move e4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))

    await user.click(screen.getByRole('button', { name: 'Stop and review' }))
    await screen.findByRole('heading', { name: 'The report' })

    // The first part of the report is about the course, and there is no
    // sentence about the trainee leaving a repertoire they were never in.
    const headings = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)
    expect(headings[0]).toBe('The course')
    expect(headings).not.toContain('The repertoire')
    expect(document.body.textContent).not.toMatch(/You (left|stayed in) the repertoire/)

    await vi.waitFor(() => expect(storedGames()).toHaveLength(1))
    const [record] = storedGames()
    expect(record.side).toBe('other')
    expect(record.sans).toEqual(['e4', 'c5'])
    // Nobody left a repertoire in this game.
    expect(record.deviated).toBe(false)
  })

  it('shows the other-side game on Progress and offers to play it on against the course', async () => {
    const { user } = renderApp()
    await startOtherSide(user)
    await user.click(await screen.findByRole('button', { name: 'move e4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    await user.click(screen.getByRole('button', { name: 'Stop and review' }))
    await screen.findByRole('heading', { name: 'The report' })
    await vi.waitFor(() => expect(storedGames()).toHaveLength(1))

    await goTo(user, 'Progress')
    expect(screen.getByText(/1 of them playing the other side/)).toBeDefined()
    const row = playOnRow('The Sicilian Najdorf')
    expect(row.textContent).toContain('other side')

    // Play on lands on the launch options with the game's own line chosen,
    // and starting it keeps the trainee on White's side of the course.
    await user.click(buttonIn(row, 'Play on'))
    await user.click(await screen.findByRole('button', { name: 'Start the game' }))
    await screen.findByTestId('board')
    expect(screen.getByText(/playing the other side/)).toBeDefined()
    expect(movesOnScreen()).toEqual(['e4', 'c5'])
  })
})

describe('how the course plays', () => {
  it('defaults to the course move every time, and remembers a change across a reload', async () => {
    const { user } = renderApp()
    await user.selectOptions(await screen.findByLabelText('Course'), 'najdorf-black')
    await goTo(user, 'Play')
    await user.click(await screen.findByLabelText('Play the other side'))

    const every = (await screen.findByLabelText('The course move every time')) as HTMLInputElement
    const sometimes = screen.getByLabelText('Sometimes a listed alternative') as HTMLInputElement
    expect(every.checked).toBe(true)
    expect(sometimes.checked).toBe(false)

    await user.click(sometimes)
    expect(sometimes.checked).toBe(true)

    // A reload of the shell: unmount everything and render it again. Storage
    // is not cleared between the two, only between tests.
    cleanup()
    const again = renderApp()
    await again.user.selectOptions(await screen.findByLabelText('Course'), 'najdorf-black')
    await goTo(again.user, 'Play')
    // The box comes back ticked since phase 44, so the setting under it is
    // already showing and does not have to be revealed again.
    const held = (await screen.findByLabelText('Sometimes a listed alternative')) as HTMLInputElement
    expect(held.checked).toBe(true)
    expect(window.localStorage.getItem('london-trainer.other-side')).toBe('sometimes')
  })
})
