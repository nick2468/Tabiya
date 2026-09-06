import { describe, expect, it, vi } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { Chess } from 'chess.js'
import { board, goTo, renderApp } from '../test/dom'
import { bundledCourses } from '../content'
import { buildCardsAcross, type Card } from '../model/cards'
import { STORAGE_KEY } from '../storage/progress'
import { newSchedule, review, type Schedule } from '../scheduler'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * What Drill shows once an answer is in, and how far away the card is put.
 *
 * Phase 44, and the phase 29 rule applies: the scheduler and the progress
 * store both change, so these were written and watched fail first.
 *
 * Nick's rulings of 2026-09-06. The board used to redraw the card's own
 * position after any answer, so the piece he had just moved jumped back to
 * where it started and a green arrow pointed after it. Now the board shows the
 * position AFTER the repertoire move, right or wrong, because the visual
 * memory of the right position serves better than an arrow alone. And the gap
 * before a card returns has a unit he chooses, so an afternoon on one line is
 * possible without lying to the memory model.
 */

type User = ReturnType<typeof renderApp>['user']

/** Learns the first line of the course the header names, which fills Drill. */
async function learnALine(user: User) {
  await goTo(user, 'Study')
  const ticks = await screen.findAllByRole('checkbox', { name: /^I have learnt / })
  await user.click(ticks[0])
}

/**
 * The card on the board, found by matching the position rather than guessed.
 *
 * The test has to know the repertoire move to play it, and the app will not
 * say until it has been answered. Reading it out of the same builder the
 * screen uses keeps the two honest: a card that moved would move here too.
 */
function cardOnBoard(): Card {
  const { fen } = board()
  const raw = window.localStorage.getItem(STORAGE_KEY)
  const learnt = raw ? (JSON.parse(raw).learntLines as string[]) : []
  const card = buildCardsAcross(bundledCourses, learnt).cards.find((entry) => entry.fen === fen)
  if (!card) throw new Error(`no card matches the position on the board: ${fen}`)
  return card
}

/** Every schedule in the progress file, by card key. */
function storedCards(): Record<string, Schedule> {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw).cards as Record<string, Schedule>) : {}
}

async function startDrilling(user: User) {
  await learnALine(user)
  await goTo(user, 'Drill')
  await user.click(await screen.findByRole('button', { name: 'Start drilling' }))
  await screen.findByTestId('board')
}

describe('the board after an answer', () => {
  it('leaves the piece where the repertoire move put it, when the answer was right', async () => {
    const { user } = renderApp()
    await startDrilling(user)

    const card = cardOnBoard()
    await user.click(await screen.findByRole('button', { name: `move ${card.san}` }))

    const shown = board()
    expect(shown.fen).not.toBe(card.fen)
    expect(shown.fen).toBe(afterMove(card))
    expect(shown.lastMove).toBe(`${card.from}${card.to}`)
    expect(shown.shapes).toEqual([`green${card.from}${card.to}`])
  })

  it('shows the repertoire move played and both arrows, when the answer was wrong', async () => {
    const { user } = renderApp()
    await startDrilling(user)

    const card = cardOnBoard()
    const wrong = otherMoveOn(card)
    await user.click(await screen.findByRole('button', { name: `move ${wrong.san}` }))

    const shown = board()
    expect(shown.fen).toBe(afterMove(card))
    expect(shown.lastMove).toBe(`${card.from}${card.to}`)
    expect(shown.shapes).toEqual([
      `red${wrong.from}${wrong.to}`,
      `green${card.from}${card.to}`,
    ])
  })
})

describe('the gap unit', () => {
  it('puts the card minutes away rather than the days FSRS asked for', async () => {
    const { user } = renderApp()
    await learnALine(user)
    await goTo(user, 'Drill')
    await user.click(await screen.findByLabelText('Minutes'))
    await user.click(await screen.findByRole('button', { name: 'Start drilling' }))
    await screen.findByTestId('board')

    const card = cardOnBoard()
    const scheduledDays = daysUnitWouldGive()
    await user.click(await screen.findByRole('button', { name: `move ${card.san}` }))
    await user.click(await screen.findByRole('button', { name: /^Got it, back / }))

    const stored = storedCards()[card.key]
    expect(stored).toBeDefined()
    const away = new Date(stored.due).getTime() - Date.now()
    expect(away).toBeGreaterThan(0)
    expect(away).toBeLessThanOrEqual(90_000)
    // The memory model is untouched: FSRS's own number is still on the card.
    expect(stored.scheduled_days).toBe(scheduledDays)
  })

  it('starts on hours, which is the default Nick ruled', async () => {
    // Added at review gate 44. Hours was his second thought about this screen
    // and nothing held it, so a later tidy-up could have put days back and the
    // suite would have stayed green.
    const { user } = renderApp()
    await learnALine(user)
    await goTo(user, 'Drill')
    expect(((await screen.findByLabelText('Hours')) as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText('Days') as HTMLInputElement).checked).toBe(false)
    expect((screen.getByLabelText('Minutes') as HTMLInputElement).checked).toBe(false)
  })

  it('remembers the unit between sessions', async () => {
    const first = renderApp()
    await learnALine(first.user)
    await goTo(first.user, 'Drill')
    await first.user.click(await screen.findByLabelText('Minutes'))

    cleanup()
    const second = renderApp()
    await goTo(second.user, 'Drill')
    const minutes = (await screen.findByLabelText('Minutes')) as HTMLInputElement
    expect(minutes.checked).toBe(true)
  })
})

/** The position after the card's own move, worked out with chess.js. */
function afterMove(card: Card): string {
  return applied(card.fen, card.san)
}

function applied(fen: string, san: string): string {
  const game = new Chess(fen)
  game.move(san)
  return game.fen()
}

/** Some legal move that is not the repertoire move, for answering wrongly. */
function otherMoveOn(card: Card): { san: string; from: string; to: string } {
  const move = new Chess(card.fen)
    .moves({ verbose: true })
    .find((entry) => entry.san !== card.san)
  if (!move) throw new Error('the position has only one legal move')
  return { san: move.san, from: move.from, to: move.to }
}

/** What FSRS schedules in days for this answer, which the unit must not move. */
function daysUnitWouldGive(): number {
  const now = new Date()
  return review(newSchedule(now), 'good', now, 'days').scheduled_days
}
