import { describe, expect, it } from 'vitest'
import {
  PLAY_ON_LIMIT,
  canReplayMoves,
  recentPlayable,
  requestFor,
  resumeLabel,
} from './play-on'
import { bundledCourses } from '../content'
import type { PlayRecord } from '../storage/progress'

/**
 * Picking a recorded game back up.
 *
 * Nick's own case: a London game stopped at move 20, the app upgraded, and the
 * game sitting in the progress file with nothing able to turn it back into a
 * game. The rules that matter are which games can be offered at all and what
 * the request carries, because a request that loses the level or the chapter
 * starts a different game from the one he stopped.
 */

const london = bundledCourses.find((entry) => entry.id === 'london-white')
if (!london) throw new Error('the London is not in the bundled set')

const record = (over: Partial<PlayRecord> = {}): PlayRecord => ({
  courseId: 'london-white',
  deviated: false,
  moves: 3,
  level: 4,
  at: '2026-09-03T09:00:00.000Z',
  sans: ['d4', 'd5', 'Bf4', 'Nf6'],
  ...over,
})

describe('which games can be played on', () => {
  it('leaves out the ones that never kept their moves', () => {
    const games = [record({ at: 'a', sans: undefined }), record({ at: 'b' })]
    expect(recentPlayable(games).map((game) => game.at)).toEqual(['b'])
  })

  it('leaves out a game whose move list is empty', () => {
    expect(recentPlayable([record({ sans: [] })])).toEqual([])
  })

  it('offers the newest first, because the history is kept oldest first', () => {
    const games = [record({ at: 'first' }), record({ at: 'second' }), record({ at: 'third' })]
    expect(recentPlayable(games).map((game) => game.at)).toEqual(['third', 'second', 'first'])
  })

  it('offers at most ten, which is a screenful', () => {
    const games = Array.from({ length: 25 }, (_, index) => record({ at: `game-${index}` }))
    expect(recentPlayable(games)).toHaveLength(PLAY_ON_LIMIT)
    expect(recentPlayable(games)[0].at).toBe('game-24')
  })

  it('does not change the history it was given', () => {
    const games = [record({ at: 'a' }), record({ at: 'b' })]
    recentPlayable(games)
    expect(games.map((game) => game.at)).toEqual(['a', 'b'])
  })
})

describe('the request a recorded game builds', () => {
  it('carries the course, the level, the moves and the identity', () => {
    const request = requestFor(record(), london)
    expect(request.courseId).toBe(london.id)
    expect(request.level).toBe(4)
    expect(request.moves).toEqual(['d4', 'd5', 'Bf4', 'Nf6'])
    expect(request.at).toBe('2026-09-03T09:00:00.000Z')
  })

  it('is the position after the last move, so the game carries on from there', () => {
    const request = requestFor(record(), london)
    expect(request.fen.startsWith('rnbqkb1r/ppp1pppp/5n2/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR w')).toBe(
      true,
    )
  })

  it('keeps the book inside the chapter the game was sparring against', () => {
    const chapter = london.chapters[1]
    const request = requestFor(record({ chapterId: chapter.id }), london)
    expect(request.chapterId).toBe(chapter.id)
    expect(request.chapterOnly).toBe(true)
  })

  it('does not narrow to a chapter for a game that was against any line', () => {
    expect(requestFor(record(), london).chapterOnly).toBe(false)
  })

  it('says which game it is, in words a person recognises', () => {
    expect(resumeLabel(record())).toMatch(/^your game of .+, move 3$/)
  })
})

describe('whether a record can go back on a board', () => {
  it('replays a real game', () => {
    expect(canReplayMoves(['d4', 'd5', 'Bf4', 'Nf6'])).toBe(true)
  })

  it('refuses a damaged one rather than letting it throw mid-replay', () => {
    expect(canReplayMoves(['d4', 'd5', 'Qxh8'])).toBe(false)
    expect(canReplayMoves(['not a move'])).toBe(false)
  })

  it('refuses an empty one, which is not a game', () => {
    expect(canReplayMoves([])).toBe(false)
  })
})
