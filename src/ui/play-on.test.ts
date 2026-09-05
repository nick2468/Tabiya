import { describe, expect, it } from 'vitest'
import {
  PLAY_ON_LIMIT,
  canReplayMoves,
  endedText,
  positionText,
  recentPlayable,
  replayRequest,
  requestFor,
  resumeLabel,
  sparringAgainst,
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
    const games = [record({ at: day(1), sans: undefined }), record({ at: day(2) })]
    expect(recentPlayable(games).map((game) => game.at)).toEqual([day(2)])
  })

  it('leaves out a game whose move list is empty', () => {
    expect(recentPlayable([record({ sans: [] })])).toEqual([])
  })

  const day = (n: number) => `2026-09-${String(n).padStart(2, '0')}T09:00:00.000Z`

  it('offers the newest first', () => {
    const games = [record({ at: day(1) }), record({ at: day(2) }), record({ at: day(3) })]
    expect(recentPlayable(games).map((game) => game.at)).toEqual([day(3), day(2), day(1)])
  })

  /**
   * The history used to be reversed, which was the same thing while records
   * were only ever appended. Phase 25 let one be REPLACED, and a replacement
   * goes to the end: filling a verdict into last week's game put last week at
   * the top of the list. The column says a date, so the date is what it sorts
   * by.
   */
  it('offers the newest first even when an old record was written last', () => {
    const games = [record({ at: day(1) }), record({ at: day(3) }), record({ at: day(2) })]
    expect(recentPlayable(games).map((game) => game.at)).toEqual([day(3), day(2), day(1)])
  })

  it('offers at most ten, which is a screenful', () => {
    const games = Array.from({ length: 25 }, (_, index) =>
      record({ at: `2026-09-04T${String(index % 24).padStart(2, '0')}:00:${String(index).padStart(2, '0')}.000Z` }),
    )
    expect(recentPlayable(games)).toHaveLength(PLAY_ON_LIMIT)
    expect(recentPlayable(games)[0].at).toBe('2026-09-04T23:00:23.000Z')
  })

  it('does not change the history it was given', () => {
    const games = [record({ at: day(1) }), record({ at: day(2) })]
    recentPlayable(games)
    expect(games.map((game) => game.at)).toEqual([day(1), day(2)])
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

  /**
   * A game played against the course is resumed against the course, and one
   * played the usual way carries no side at all, so every request built from
   * a record written before phase 32 is exactly what it was.
   */
  it('carries the side for a game played against the course, and nothing otherwise', () => {
    expect(requestFor(record({ side: 'other' }), london).side).toBe('other')
    expect(requestFor(record(), london).side).toBeUndefined()
    expect(replayRequest(record({ side: 'other' }), london).side).toBe('other')
  })
})

describe('what a game was sparring against', () => {
  it('names the chapter, or any line', () => {
    expect(sparringAgainst(record(), 'The system')).toBe('The system')
    expect(sparringAgainst(record(), undefined)).toBe('Any line')
  })

  it('says other side for a game played against the course, with the chapter when there was one', () => {
    expect(sparringAgainst(record({ side: 'other' }), undefined)).toBe('other side')
    expect(sparringAgainst(record({ side: 'other' }), 'The system')).toBe('other side, The system')
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

  it('says Stopped for a game that was stopped mid-play', () => {
    expect(endedText(record({ finalEval: 1.6 }), 'white')).toBe('Stopped')
  })

  it('says only Stopped for a game recorded before any of this was kept', () => {
    expect(endedText(record({ sans: undefined }), 'white')).toBe('Stopped')
  })

  /**
   * The moves were always kept, and they know. Nick's games ending in
   * checkmate read as merely stopped because nobody had asked them.
   */
  it('works a checkmate out of the moves when the record does not say', () => {
    // Fool's mate: White is mated, so a White course lost it.
    const mate = ['f3', 'e5', 'g4', 'Qh4#']
    expect(endedText(record({ sans: mate, outcome: undefined }), 'white')).toBe(
      'You were checkmated',
    )
  })

  it('reads the same mate the other way round in a Black course', () => {
    const mate = ['f3', 'e5', 'g4', 'Qh4#']
    expect(endedText(record({ sans: mate, outcome: undefined }), 'black')).toBe(
      'You won by checkmate',
    )
  })

  it('works a stalemate out of the moves', () => {
    const stalemate = [
      'e3', 'a5', 'Qh5', 'Ra6', 'Qxa5', 'h5', 'Qxc7', 'Rah6', 'h4', 'f6',
      'Qxd7+', 'Kf7', 'Qxb7', 'Qd3', 'Qxb8', 'Qh7', 'Qxc8', 'Kg6', 'Qe6',
    ]
    expect(endedText(record({ sans: stalemate, outcome: undefined }), 'white')).toBe(
      'Drawn by stalemate',
    )
  })

  it('trusts the recorded ending over the moves, when it has one', () => {
    const mate = ['f3', 'e5', 'g4', 'Qh4#']
    expect(endedText(record({ sans: mate, outcome: 'Drawn by repetition' }), 'white')).toBe(
      'Drawn by repetition',
    )
  })

  it('says Move limit when the game ran out of the length it was given', () => {
    expect(endedText(record({ moves: 10, length: 'move10' }), 'white')).toBe('Move limit')
    expect(endedText(record({ moves: 15, length: 'move15' }), 'white')).toBe('Move limit')
  })

  it('says Stopped when a game with a length stopped short of it', () => {
    expect(endedText(record({ moves: 7, length: 'move10' }), 'white')).toBe('Stopped')
  })

  it('says Stopped when a game was carried on past its old limit', () => {
    // Play on resumes uncapped, so a record at 14 moves with a move10 length
    // did not stop at the limit: it ran through it.
    expect(endedText(record({ moves: 14, length: 'move10' }), 'white')).toBe('Stopped')
  })

  it('says Stopped for a full game, which had no limit to reach', () => {
    expect(endedText(record({ moves: 40, length: 'full' }), 'white')).toBe('Stopped')
  })

  it('says Stopped for a record from before the length was kept', () => {
    expect(endedText(record({ moves: 10 }), 'white')).toBe('Stopped')
  })
})

describe('how the position stood', () => {
  it('is the verdict, capitalised, turned to the side the trainee plays', () => {
    expect(positionText(record({ finalEval: 1.6 }), 'white')).toBe('Clearly better for you')
    expect(positionText(record({ finalEval: 1.6 }), 'black')).toBe(
      'Clearly better for the engine',
    )
  })

  it('says level without taking a side', () => {
    expect(positionText(record({ finalEval: 0.1 }), 'white')).toBe('Level')
    expect(positionText(record({ finalEval: 0.1 }), 'black')).toBe('Level')
  })

  it('is blank for a game recorded before evaluations were kept', () => {
    expect(positionText(record(), 'white')).toBe('')
  })

  it('is blank beside a checkmate, which has already said it', () => {
    const mate = ['f3', 'e5', 'g4', 'Qh4#']
    expect(positionText(record({ sans: mate, finalEval: -9 }), 'white')).toBe('')
    expect(positionText(record({ outcome: 'You won by checkmate', finalEval: 9 }), 'white')).toBe(
      '',
    )
  })

  it('is kept beside a draw, which does not say how it was reached', () => {
    expect(positionText(record({ outcome: 'Drawn by repetition', finalEval: 1.6 }), 'white')).toBe(
      'Clearly better for you',
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
