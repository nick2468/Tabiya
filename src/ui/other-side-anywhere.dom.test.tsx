import { describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { board, buttonIn, goTo, movesOnScreen, playOnRow, renderApp, seedHistory } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * Play the other side from any start.
 *
 * Phase 32 built it as a fourth radio, which made it exclusive with "From a
 * Study position": Nick could play against the course from move one and not
 * from a position he had just been looking at. Phase 33 makes it a checkbox
 * that goes with whichever way the game is started.
 *
 * The Caro-Kann is used on purpose. It is a Black course, so on the other
 * side the trainee is White; and a Study position after 1.e4 has the COURSE
 * to move, which is the case the chip names: the engine has to answer at
 * once, out of the book, and only then hand the trainee the move.
 */

type User = ReturnType<typeof renderApp>['user']

const otherSideBox = () => screen.getByRole('checkbox', { name: 'Play the other side' }) as HTMLInputElement

async function openCaroKann(user: User) {
  await user.selectOptions(await screen.findByLabelText('Course'), 'caro-kann-black')
}

describe('the other side from a Study position', () => {
  it('starts at the position with the trainee as White, and the course has already answered', async () => {
    const { user } = renderApp()
    await openCaroKann(user)
    await goTo(user, 'Study')
    // One step along the chapter's line: 1.e4, with Black, the course, to move.
    await user.click(await screen.findByRole('button', { name: 'Forward one move' }))
    await user.click(screen.getByRole('button', { name: 'Play from here' }))

    // The request landed: the From radio is chosen, and the box is beside it
    // rather than instead of it.
    const from = (await screen.findByLabelText(/^From /)) as HTMLInputElement
    expect(from.checked).toBe(true)
    await user.click(otherSideBox())
    expect(from.checked).toBe(true)
    expect(otherSideBox().checked).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Start the game' }))
    await screen.findByTestId('board')

    // The engine played the course's 1...c6 to the position it was handed,
    // and the trainee, as White, is to move.
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(['e4', 'c6']))
    expect(board().fen.split(' ')[1]).toBe('w')
    expect(screen.getByText(/playing the other side/)).toBeDefined()
  })
})

describe('the box on a resumed game', () => {
  const recorded = {
    courseId: 'caro-kann-black',
    deviated: false,
    moves: 2,
    level: 4,
    at: '2026-09-05T09:00:00.000Z',
    sans: ['e4', 'c6', 'd4', 'd5'],
    side: 'other' as const,
  }

  it('is ticked and disabled for Play on of a game played on the other side', async () => {
    seedHistory([recorded])
    const { user } = renderApp()
    await goTo(user, 'Progress')
    await user.click(buttonIn(playOnRow('The Caro-Kann Defence'), 'Play on'))

    await screen.findByLabelText(/^From your game/)
    expect(otherSideBox().checked).toBe(true)
    expect(otherSideBox().disabled).toBe(true)
    expect(otherSideBox().title).toMatch(/played on the other side/)
  })

  it('is free for Play on of a game played the usual way, and unticked', async () => {
    seedHistory([{ ...recorded, side: undefined }])
    const { user } = renderApp()
    await goTo(user, 'Progress')
    await user.click(buttonIn(playOnRow('The Caro-Kann Defence'), 'Play on'))

    await screen.findByLabelText(/^From your game/)
    expect(otherSideBox().checked).toBe(false)
    expect(otherSideBox().disabled).toBe(false)
  })
})

describe('what is remembered', () => {
  it('forgets the box across a reload and keeps the setting under it', async () => {
    const { user } = renderApp()
    await openCaroKann(user)
    await goTo(user, 'Play')
    expect(otherSideBox().checked).toBe(false)

    await user.click(otherSideBox())
    await user.click(await screen.findByLabelText('Sometimes a listed alternative'))

    cleanup()
    const again = renderApp()
    await openCaroKann(again.user)
    await goTo(again.user, 'Play')
    expect(otherSideBox().checked).toBe(false)
    // The setting is a preference and the box is a launch choice: tick the
    // box again and the setting is still what it was set to.
    await again.user.click(otherSideBox())
    const held = (await screen.findByLabelText('Sometimes a listed alternative')) as HTMLInputElement
    expect(held.checked).toBe(true)
  })
})
