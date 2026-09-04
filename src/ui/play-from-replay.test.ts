import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import {
  canPlayFromPly,
  moveAtPlyLabel,
  requestFromReplay,
  whyNotPlayable,
  type ReplayedGame,
} from './play-from-replay'
import type { PlayedMove } from '../play/report'

/**
 * The request that starts a new game from a position in an old one.
 *
 * The DOM test beside this drives the whole thing through the screen. This
 * holds the arithmetic: which plies can be played from, what the label says,
 * and above all that the request carries no identity.
 */

/** A game's moves in the shape the session keeps them, built from SAN. */
function played(sans: string[]): PlayedMove[] {
  const chess = new Chess()
  return sans.map((san, ply) => {
    const fen = chess.fen()
    chess.move(san)
    return {
      ply,
      san,
      colour: ply % 2 === 0 ? ('white' as const) : ('black' as const),
      fen,
      after: chess.fen(),
    }
  })
}

function game(sans: string[], extra: Partial<ReplayedGame> = {}): ReplayedGame {
  return {
    moves: played(sans),
    courseId: 'london-white',
    level: 6,
    at: '2026-09-03T14:32:00.000Z',
    ...extra,
  }
}

describe('which positions can be played from', () => {
  const g = game(['d4', 'd5', 'Bf4', 'Nf6'])

  it('says yes where it is the trainee move', () => {
    // White's game: even plies are White to move.
    expect(canPlayFromPly(g, 0, 'white')).toBe(true)
    expect(canPlayFromPly(g, 2, 'white')).toBe(true)
    expect(canPlayFromPly(g, 4, 'white')).toBe(true)
  })

  it('says no where the engine is to move, with a step to take', () => {
    expect(canPlayFromPly(g, 1, 'white')).toBe(false)
    expect(whyNotPlayable(g, 1, 'white')).toBe(
      "It is the engine's move here. Step one move on or back.",
    )
  })

  it('says no at a finished position', () => {
    const mate = game(['f3', 'e5', 'g4', 'Qh4#'])
    expect(canPlayFromPly(mate, 4, 'white')).toBe(false)
    expect(whyNotPlayable(mate, 4, 'white')).toBe('The game is over here.')
    // And the position before the mate is still the engine's move, not the end.
    expect(whyNotPlayable(mate, 3, 'white')).toMatch(/engine/)
  })

  it('says no when there is no game at all', () => {
    expect(canPlayFromPly(game([]), 0, 'white')).toBe(false)
    expect(requestFromReplay(game([]), 0)).toBeNull()
  })

  it('reads the colour it is given, not the one White would have', () => {
    const asBlack = game(['e4', 'c6', 'd4', 'd5'], { courseId: 'caro-kann' })
    expect(canPlayFromPly(asBlack, 1, 'black')).toBe(true)
    expect(canPlayFromPly(asBlack, 2, 'black')).toBe(false)
  })
})

describe('the label', () => {
  it('names the move the replay stands after, as the list writes it', () => {
    const sans = ['d4', 'd5', 'Bf4', 'Nf6']
    expect(moveAtPlyLabel(sans, 0)).toBe('from the start')
    expect(moveAtPlyLabel(sans, 1)).toBe('after 1.d4')
    expect(moveAtPlyLabel(sans, 2)).toBe('after 1...d5')
    expect(moveAtPlyLabel(sans, 3)).toBe('after 2.Bf4')
    expect(moveAtPlyLabel(sans, 4)).toBe('after 2...Nf6')
  })

  it('names the day and the move, and no time', () => {
    const request = requestFromReplay(game(['d4', 'd5', 'Bf4', 'Nf6']), 4)
    expect(request?.label).toMatch(/^your game of .+, after 2...Nf6$/)
    // The Play on list needs a time to tell two games apart. This label is
    // about the game already on the screen, so a time would be noise.
    expect(request?.label).not.toMatch(/\d\d:\d\d/)
  })
})

describe('what the request carries', () => {
  const g = game(['d4', 'd5', 'Bf4', 'Nf6'], { chapterId: 'london-ch2' })

  it('takes the moves up to the ply and the position there', () => {
    const request = requestFromReplay(g, 2)
    expect(request?.moves).toEqual(['d4', 'd5'])
    expect(request?.fen).toBe(g.moves[1].after)
  })

  it('carries the game own course, chapter and strength', () => {
    const request = requestFromReplay(g, 2)
    expect(request?.courseId).toBe('london-white')
    expect(request?.chapterId).toBe('london-ch2')
    expect(request?.chapterOnly).toBe(true)
    expect(request?.level).toBe(6)
  })

  it('leaves the chapter open when the game was not sparring against one', () => {
    const request = requestFromReplay(game(['d4', 'd5']), 2)
    expect(request?.chapterOnly).toBe(false)
  })

  /**
   * The one that matters. `at` is a game's identity, and a request carrying
   * the old one would make the first review of the NEW game replace the record
   * of the old one. `reviewAtOnce` would land the trainee on a report of a
   * game they have not played yet.
   */
  it('carries no identity and does not ask to be reviewed', () => {
    const request = requestFromReplay(g, 2)
    expect(request?.at).toBeUndefined()
    expect(request?.reviewAtOnce).toBeUndefined()
  })
})
