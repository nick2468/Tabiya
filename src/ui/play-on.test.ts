import { describe, expect, it } from 'vitest'
import {
  PLAY_ON_LIMIT,
  canReplayMoves,
  endedText,
  recentPlayable,
  replayRequest,
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

/**
 * How a recorded game ended, said to the trainee.
 *
 * The rule that matters is the one about colours: the same evaluation has to
 * read the same way in a White course and a Black one, because the reader is
 * the same person and their side is what they care about.
 */
describe('how a game ended', () => {
  it('says the ending in the words the game itself used', () => {
    expect(endedText(record({ outcome: 'You won by checkmate' }), 'white')).toBe(
      'You won by checkmate',
    )
    expect(endedText(record({ outcome: 'Drawn by stalemate' }), 'black')).toBe(
      'Drawn by stalemate',
    )
  })

  it('describes a stopped game by the position it stopped in', () => {
    // +1.6 from White's side, in a White course, is good for the trainee.
    expect(endedText(record({ finalEval: 1.6 }), 'white')).toBe('Stopped, clearly better for you')
    expect(endedText(record({ finalEval: -1.6 }), 'white')).toBe(
      'Stopped, clearly better for the engine',
    )
  })

  it('turns the same numbers round for a Black course', () => {
    // The identical evaluation, read by a trainee playing Black.
    expect(endedText(record({ finalEval: -1.6 }), 'black')).toBe('Stopped, clearly better for you')
    expect(endedText(record({ finalEval: 1.6 }), 'black')).toBe(
      'Stopped, clearly better for the engine',
    )
  })

  it('says level without taking a side', () => {
    expect(endedText(record({ finalEval: 0.1 }), 'white')).toBe('Stopped, level')
    expect(endedText(record({ finalEval: 0.1 }), 'black')).toBe('Stopped, level')
  })

  it('says only Stopped for a game recorded before this was kept', () => {
    expect(endedText(record(), 'white')).toBe('Stopped')
  })

  it('prefers the ending over the evaluation when it has both', () => {
    expect(endedText(record({ outcome: 'You were checkmated', finalEval: 9 }), 'white')).toBe(
      'You were checkmated',
    )
  })
})

describe('the request Replay builds', () => {
  it('is the Play on request, asking for the review at once', () => {
    const replay = replayRequest(record(), london)
    const playOn = requestFor(record(), london)
    expect(replay.reviewAtOnce).toBe(true)
    expect({ ...replay, reviewAtOnce: undefined }).toEqual({ ...playOn, reviewAtOnce: undefined })
  })

  it('keeps the record identity, so a review replaces rather than adds', () => {
    expect(replayRequest(record(), london).at).toBe('2026-09-03T09:00:00.000Z')
  })

  it('is not what Play on builds, which starts a game to carry on', () => {
    expect(requestFor(record(), london).reviewAtOnce).toBeUndefined()
  })
})
