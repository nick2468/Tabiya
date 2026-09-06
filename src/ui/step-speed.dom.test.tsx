import { describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { board, goTo, renderApp } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * Auto step has a speed, and the speed is remembered.
 *
 * Nick, 2026-09-06: the gap was 850 ms, which he read as about a second and
 * found too fast to read a note in. The default is 2000 ms now and two buttons
 * move it in half-second steps between 500 and 5000.
 *
 * Written red first, per the phase 29 rule: the buttons and the stored speed
 * did not exist. The stepping itself runs on fake timers, because a test that
 * waited two real seconds per move would cost more than it proves.
 */

type User = ReturnType<typeof renderApp>['user']

const speed = () => screen.getByTestId('step-speed').textContent
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement

async function openStudy(user: User) {
  await goTo(user, 'Study')
  await screen.findByRole('button', { name: 'Auto step this line' })
}

describe('the auto step speed', () => {
  it('starts at two seconds and moves in half-second steps', async () => {
    const { user } = renderApp()
    await openStudy(user)
    expect(speed()).toBe('2.0s')

    await user.click(button('Faster'))
    await user.click(button('Faster'))
    expect(speed()).toBe('1.0s')
    await user.click(button('Slower'))
    expect(speed()).toBe('1.5s')
  })

  it('stops at both ends of the range', async () => {
    const { user } = renderApp()
    await openStudy(user)
    for (let press = 0; press < 12; press += 1) await user.click(button('Faster'))
    expect(speed()).toBe('0.5s')
    expect(button('Faster').disabled).toBe(true)

    for (let press = 0; press < 20; press += 1) await user.click(button('Slower'))
    expect(speed()).toBe('5.0s')
    expect(button('Slower').disabled).toBe(true)
  })

  it('remembers the speed between sessions', async () => {
    const first = renderApp()
    await openStudy(first.user)
    await first.user.click(button('Slower'))
    await first.user.click(button('Slower'))
    expect(speed()).toBe('3.0s')

    cleanup()
    const again = renderApp()
    await openStudy(again.user)
    expect(speed()).toBe('3.0s')
  })

  it('falls back to two seconds when what is stored means nothing', async () => {
    window.localStorage.setItem('london-trainer.study.step-ms', 'soon')
    const { user } = renderApp()
    await openStudy(user)
    expect(speed()).toBe('2.0s')

    cleanup()
    window.localStorage.setItem('london-trainer.study.step-ms', '99999')
    const again = renderApp()
    await openStudy(again.user)
    expect(speed()).toBe('2.0s')
  })
})

describe('stepping at the chosen speed', () => {
  it('waits the gap the buttons say, and changes speed from the next move', async () => {
    const { user } = renderApp()
    await openStudy(user)
    const start = board().fen

    // Fake timers only now: the app's own startup wants a real tick, and what
    // this test is about is the gap between two moves.
    vi.useFakeTimers()
    try {
      fireEvent.click(button('Auto step this line'))
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })
      expect(board().fen).toBe(start)

      await act(async () => {
        vi.advanceTimersByTime(1100)
      })
      const afterOne = board().fen
      expect(afterOne).not.toBe(start)

      // Faster restarts the wait that is pending rather than serving out the
      // old gap first, which is what the effect's dependency on it buys.
      fireEvent.click(button('Faster'))
      await act(async () => {
        vi.advanceTimersByTime(1600)
      })
      expect(board().fen).not.toBe(afterOne)
    } finally {
      vi.useRealTimers()
    }
  })
})
