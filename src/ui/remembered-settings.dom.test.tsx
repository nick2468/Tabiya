import { describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { buttonIn, goTo, movesOnScreen, playOnRow, renderApp, storedGames } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * Every Play and Drill setting survives a restart.
 *
 * Nick's ruling of 2026-09-06, which reverses two earlier ones: phase 23 made
 * "Include cards that are not due yet" a one-sitting choice and phase 33 made
 * "Play the other side" a launch choice. A setting the app forgets is one he
 * has to make again every day, and he uses this every day.
 *
 * Written red first, per the phase 29 rule. A remount is the closest thing a
 * jsdom test has to a restart: `cleanup` throws the tree away and `renderApp`
 * builds a new one over the same storage, which is what happens when the
 * window opens again.
 */

type User = ReturnType<typeof renderApp>['user']

/** What the second run of the app sees, after everything is put away. */
async function restart(): Promise<User> {
  cleanup()
  const { user } = renderApp()
  return user
}

const switcher = () => screen.getByLabelText('Course') as HTMLSelectElement
const box = (name: string | RegExp) => screen.getByLabelText(name) as HTMLInputElement

async function learnALine(user: User) {
  await goTo(user, 'Study')
  const ticks = await screen.findAllByRole('checkbox', { name: /^I have learnt / })
  await user.click(ticks[0])
}

describe('the Play settings', () => {
  it('remembers the launch shape, the length, the strength and the other side', async () => {
    const first = renderApp()
    await goTo(first.user, 'Play')
    await first.user.click(await screen.findByLabelText("This chapter's line"))
    await first.user.click(screen.getByLabelText('To move 10'))
    await first.user.selectOptions(screen.getByLabelText('How strong'), '7')
    await first.user.click(screen.getByLabelText('Play the other side'))

    const user = await restart()
    await goTo(user, 'Play')
    expect(box("This chapter's line").checked).toBe(true)
    expect(box('To move 10').checked).toBe(true)
    expect((screen.getByLabelText('How strong') as HTMLSelectElement).value).toBe('7')
    expect(box('Play the other side').checked).toBe(true)
  })

  it('remembers the chapter per course, and falls back when it is gone', async () => {
    const first = renderApp()
    await goTo(first.user, 'Play')
    await first.user.click(await screen.findByLabelText("This chapter's line"))
    const chapters = screen.getByRole('combobox', { name: /chapter/i }) as HTMLSelectElement
    const second = chapters.options[2].value
    await first.user.selectOptions(chapters, second)

    // Another course remembers its own, and does not inherit this one's.
    await first.user.selectOptions(switcher(), 'london-white')
    const londonChapters = screen.getByRole('combobox', { name: /chapter/i }) as HTMLSelectElement
    expect(londonChapters.value).toBe(londonChapters.options[0].value)

    const user = await restart()
    await goTo(user, 'Play')
    const back = screen.getByRole('combobox', { name: /chapter/i }) as HTMLSelectElement
    expect(back.value).toBe(back.options[0].value)
    await user.selectOptions(switcher(), 'alapin-sicilian')
    const alapin = screen.getByRole('combobox', { name: /chapter/i }) as HTMLSelectElement
    expect(alapin.value).toBe(second)
  })

  it('falls back to the first chapter when the remembered one has gone', async () => {
    window.localStorage.setItem('london-trainer.play.chapter.alapin-sicilian', 'no-such-chapter')
    window.localStorage.setItem('london-trainer.play.launch', 'chapter')
    const { user } = renderApp()
    await user.selectOptions(switcher(), 'alapin-sicilian')
    await goTo(user, 'Play')
    const chapters = screen.getByRole('combobox', { name: /chapter/i }) as HTMLSelectElement
    expect(chapters.value).toBe(chapters.options[0].value)
    // And the game starts, which is the thing a broken memory must not stop.
    await user.click(screen.getByRole('button', { name: 'Start the game' }))
    expect(await screen.findByTestId('board')).toBeTruthy()
  })
})

/**
 * A game picked up from Progress is not a setting being chosen.
 *
 * Found at review gate 44. The resumed game's strength and length are shown
 * on the launch options so the screen says what is about to happen, and both
 * setters had just become the ones that write to storage. So a Play on from a
 * game recorded at level 7 with no cap replaced the strength and length the
 * trainee had chosen, for that game and for every game after it.
 */
describe('a resumed game', () => {
  it('shows its own strength and length without remembering either', async () => {
    const { user } = renderApp()
    await user.selectOptions(await screen.findByLabelText('Course'), 'london-white')
    await goTo(user, 'Play')
    await user.selectOptions(screen.getByLabelText('How strong'), '7')
    await user.click(screen.getByLabelText('To move 10'))
    await user.click(await screen.findByRole('button', { name: 'Start the game' }))
    await screen.findByTestId('board')
    const before = movesOnScreen().length
    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen().length).toBeGreaterThan(before + 1))
    await user.click(screen.getByRole('button', { name: 'Stop and review' }))
    await screen.findByRole('heading', { name: 'The report' })
    await vi.waitFor(() => expect(storedGames()).toHaveLength(1))

    // The trainee changes their mind about how they want to play from now on.
    await user.click(screen.getByRole('button', { name: 'New game' }))
    await user.selectOptions(await screen.findByLabelText('How strong'), '2')
    await user.click(screen.getByLabelText('To move 15'))

    // And then picks the old, stronger, uncapped game back up.
    await goTo(user, 'Progress')
    await user.click(buttonIn(playOnRow('The London System'), 'Play on'))

    // The screen says what that game is about to do.
    expect((await screen.findByLabelText('How strong') as HTMLSelectElement).value).toBe('7')
    expect(box('Full game').checked).toBe(true)

    // The settings it was picked up with are untouched, this session and next.
    expect(window.localStorage.getItem('london-trainer.play.level')).toBe('2')
    expect(window.localStorage.getItem('london-trainer.play.length')).toBe('move15')
    const again = await restart()
    await goTo(again, 'Play')
    expect((screen.getByLabelText('How strong') as HTMLSelectElement).value).toBe('2')
    expect(box('To move 15').checked).toBe(true)
  })
})

describe('the Drill settings', () => {
  it('remembers both boxes', async () => {
    const first = renderApp()
    await learnALine(first.user)
    await goTo(first.user, 'Drill')
    await first.user.click(await screen.findByLabelText('Drill my weak areas first'))
    await first.user.click(screen.getByLabelText('Include cards that are not due yet'))

    const user = await restart()
    await goTo(user, 'Drill')
    expect((await screen.findByLabelText('Drill my weak areas first')) as HTMLInputElement).toHaveProperty(
      'checked',
      true,
    )
    expect(box('Include cards that are not due yet').checked).toBe(true)
  })
})
