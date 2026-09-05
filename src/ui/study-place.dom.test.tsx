import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { board, goTo, renderApp } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * The Study board stays where it was, phase 40.
 *
 * Nick: leaving Study and coming back lost the position, the same fault
 * phase 36 fixed on Play. The chapter, the moves walked and the chosen line
 * were state inside Study, which unmounts on a view change. They live in a
 * provider now, per course, and this was red before they did.
 */

/** The moves the trail shows after the start button. */
function trail(): string[] {
  return [...document.querySelectorAll('.trail .trail-move')].slice(1).map((b) => b.textContent ?? '')
}

describe('the Study place', () => {
  it('survives a trip to Play, and a change of course and back', async () => {
    const { user } = renderApp()
    await user.selectOptions(await screen.findByLabelText('Course'), 'london-white')
    await goTo(user, 'Study')
    await screen.findByRole('button', { name: 'Forward one move' })

    // Two moves into the first chapter's first line.
    await user.click(screen.getByRole('button', { name: 'Forward one move' }))
    await user.click(screen.getByRole('button', { name: 'Forward one move' }))
    const walked = trail()
    expect(walked).toHaveLength(2)
    const position = board().fen

    await goTo(user, 'Play')
    await goTo(user, 'Study')
    await screen.findByRole('button', { name: 'Forward one move' })
    expect(trail()).toEqual(walked)
    expect(board().fen).toBe(position)

    await user.selectOptions(screen.getByLabelText('Course'), 'caro-kann-black')
    await screen.findByRole('heading', { name: 'The Caro-Kann Defence' })
    expect(trail()).toEqual([])
    await user.selectOptions(screen.getByLabelText('Course'), 'london-white')
    await screen.findByRole('heading', { name: 'The London System' })
    expect(trail()).toEqual(walked)
    expect(board().fen).toBe(position)
  })

  it('keeps the chapter that was open', async () => {
    const { user } = renderApp()
    await user.selectOptions(await screen.findByLabelText('Course'), 'london-white')
    await goTo(user, 'Study')
    await user.click(await screen.findByRole('button', { name: /Classical Black/ }))
    expect(screen.getByRole('heading', { name: 'Classical Black' })).toBeDefined()

    await goTo(user, 'Progress')
    await goTo(user, 'Study')
    expect(await screen.findByRole('heading', { name: 'Classical Black' })).toBeDefined()
  })
})
