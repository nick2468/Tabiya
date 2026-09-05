import { describe, expect, it, vi } from 'vitest'
import { within } from '@testing-library/react'
import { goTo, playOnRow, renderApp, seedHistory } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * The Line column on the Play on list, phase 38.
 *
 * Three games of the London in the history: one that reached a named line,
 * one that stopped in the trunk every line shares, and one that kept no
 * moves. The column says the line, the chapter faintly, and nothing.
 */

const base = {
  courseId: 'london-white',
  deviated: false,
  level: 4,
  hints: 0,
  finalEval: 0.3,
  outcome: undefined,
  length: 'move15' as const,
}

/** The Line cell of a row, by the row's date, with whether it is faint. */
function lineCell(row: HTMLElement): { text: string; faint: boolean } {
  const cells = within(row).getAllByRole('cell')
  // Played, Course, Sparring against, Line, ...
  const cell = cells[3]
  return { text: cell.textContent ?? '', faint: cell.classList.contains('faint') }
}

describe('the Line column', () => {
  it('names the line, the chapter faintly, or nothing', async () => {
    seedHistory([
      { ...base, moves: 4, at: '2026-09-01T09:00:00.000Z', sans: ['d4', 'd5', 'Bf4', 'e6', 'e3', 'Nf6', 'Nf3', 'Be7'] },
      { ...base, moves: 2, at: '2026-09-02T09:00:00.000Z', sans: ['d4', 'd5', 'Bf4', 'Nf6'] },
      { ...base, moves: 2, at: '2026-09-03T09:00:00.000Z' },
    ])
    const { user } = renderApp()
    await goTo(user, 'Progress')

    expect(lineCell(playOnRow('1 September'))).toEqual({ text: 'The modest ...Be7', faint: false })
    const trunk = lineCell(playOnRow('2 September'))
    expect(trunk.faint).toBe(true)
    expect(trunk.text.length).toBeGreaterThan(0)
    expect(trunk.text).not.toBe('The modest ...Be7')
  })
})
