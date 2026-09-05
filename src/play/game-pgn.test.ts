import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { gameToPgn, pgnDate, pgnResult, type GameForPgn } from './game-pgn'
import { parsePgn } from '../model/pgn'
import type { GameReport, PlayedMove } from './report'

/**
 * The game as text, which is how it leaves the app.
 *
 * The test that matters most is the round trip: whatever this writes has to be
 * readable by a chess program, and the app already owns a reader, so the
 * reader is the judge rather than a string comparison nobody can check.
 */

function playedMoves(sans: string[]): PlayedMove[] {
  const chess = new Chess()
  return sans.map((san, index) => {
    const fen = chess.fen()
    const move = chess.move(san)
    return {
      ply: index,
      san: move.san,
      colour: move.color === 'w' ? ('white' as const) : ('black' as const),
      fen,
      after: chess.fen(),
    }
  })
}

const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'Nf3', 'e6'])

const report: GameReport = {
  deviation: {
    kind: 'student-left-book',
    ply: 4,
    played: 'Nf3',
    bookMove: 'e3',
    note: 'Complete the triangle.',
    label: '3.e3',
  },
  slips: [
    { ply: 4, san: 'Nf3', before: 0.2, after: -1.4, loss: 1.6, tag: 'mistake', better: 'e3' },
    { ply: 2, san: 'Bf4', before: 0.3, after: -0.3, loss: 0.6, tag: 'inaccuracy' },
  ],
  verdict: 'Clearly better for Black',
  finalEval: -1.4,
}

const game: GameForPgn = {
  moves,
  report,
  courseTitle: 'The London System',
  studentColour: 'white',
  level: 4,
  at: '2026-09-03T22:15:00.000Z',
}

describe('gameToPgn', () => {
  it('is read back by the app own reader, with no errors', () => {
    const result = parsePgn(gameToPgn(game))
    expect(result.errors).toEqual([])
    expect(result.games).toHaveLength(1)
    expect(result.games[0].moves.map((move) => move.san)).toEqual(
      moves.map((move) => move.san),
    )
  })

  it('fills the seven tags, and invents nothing', () => {
    const { tags } = parsePgn(gameToPgn(game)).games[0]
    expect(tags).toMatchObject({
      Event: 'Repertoire Trainer',
      Site: 'The London System',
      Round: '-',
      White: 'You',
      Black: 'Stockfish level 4',
      Result: '*',
    })
    // The date is the record's own, read in this machine's timezone, so the
    // shape is what is pinned rather than the day.
    expect(tags.Date).toMatch(/^\d{4}\.\d{2}\.\d{2}$/)
  })

  it('puts you on the right side of the board in a Black course', () => {
    const { tags } = parsePgn(gameToPgn({ ...game, studentColour: 'black' })).games[0]
    expect(tags.White).toBe('Stockfish level 4')
    expect(tags.Black).toBe('You')
  })

  it('comments every slip on its own move', () => {
    const played = parsePgn(gameToPgn(game)).games[0].moves
    expect(played[2].san).toBe('Bf4')
    expect(played[2].comment).toContain('inaccuracy:')
    expect(played[4].san).toBe('Nf3')
    expect(played[4].comment).toContain('mistake:')
    // And the moves the report said nothing about carry nothing.
    expect(played[0].comment).toBeNull()
  })

  it('says what the engine preferred, on the slip that has it', () => {
    const played = parsePgn(gameToPgn(game)).games[0].moves
    expect(played[4].comment).toContain('the engine preferred 3.e3')
    expect(played[2].comment).not.toContain('preferred')
  })

  it('says where the game left the repertoire, on the move that left it', () => {
    const played = parsePgn(gameToPgn(game)).games[0].moves
    expect(played[4].comment).toContain('You left the repertoire on move 3 with Nf3')
  })

  it('names the line the game was in, when the report knows it', () => {
    // Phase 38: the comment goes through the same words as the report.
    const named = {
      ...game,
      report: { ...report, deviation: { ...report.deviation, lineName: 'The Nf3 line' } },
    }
    const text = gameToPgn(named)
    const played = parsePgn(text).games[0].moves
    expect(played[4].comment).toContain('You were in The Nf3 line and left it on move 3 with Nf3')
    expect(parsePgn(text).errors).toEqual([])
  })

  it('ends on the verdict', () => {
    const played = parsePgn(gameToPgn(game)).games[0].moves
    expect(played.at(-1)?.comment).toBe(
      'Clearly better for Black. White was played by you at level 4.',
    )
  })

  it('says nothing about a repertoire the game never left', () => {
    const stayed = { ...game, report: { ...report, deviation: { kind: 'stayed-in-book' } as const } }
    const text = gameToPgn(stayed)
    expect(text).not.toContain('left the repertoire')
    expect(parsePgn(text).errors).toEqual([])
  })
})

describe('a game played against the course', () => {
  // A White course played from the other side: the trainee is Black and the
  // engine, playing the course, took one graded alternative on move 3.
  const against: GameForPgn = {
    ...game,
    studentColour: 'black',
    side: 'other',
    report: {
      deviation: {
        kind: 'course-book-ended',
        ply: 4,
        played: 'Nf3',
        alternatives: [{ ply: 2, san: 'Bf4', grade: 'playable', label: '2.Bf4' }],
      },
      slips: [],
      verdict: 'Level',
      finalEval: 0.1,
    },
  }

  it('puts the colours the right way round for the swapped sides', () => {
    const { tags } = parsePgn(gameToPgn(against)).games[0]
    expect(tags.White).toBe('Stockfish level 4')
    expect(tags.Black).toBe('You')
  })

  it('says the game was played against the course', () => {
    const text = gameToPgn(against)
    expect(text).toContain('Black was played by you against the course, at level 4')
    expect(text).not.toContain('left the repertoire')
  })

  it('says where the course book ran out, and grades the alternative where it was played', () => {
    const played = parsePgn(gameToPgn(against)).games[0].moves
    expect(played[4].comment).toContain("The course's book ran out at move 3")
    expect(played[2].comment).toContain('The course grades this playable')
  })
})

describe('hints in the text', () => {
  it('says so before the first move, where a note about the game belongs', () => {
    const helped = gameToPgn({ ...game, report: { ...report, hints: 2 } })
    expect(parsePgn(helped).games[0].intro).toBe('Played with 2 hints.')
    expect(parsePgn(helped).errors).toEqual([])
  })

  it('counts one properly', () => {
    const helped = gameToPgn({ ...game, report: { ...report, hints: 1 } })
    expect(parsePgn(helped).games[0].intro).toBe('Played with 1 hint.')
  })

  it('says nothing at all about a game played without them', () => {
    expect(parsePgn(gameToPgn(game)).games[0].intro).toBeNull()
    expect(gameToPgn(game)).not.toContain('hint')
  })
})

describe('the result', () => {
  it('is a star for a game that was stopped rather than finished', () => {
    expect(pgnResult(undefined, 'white')).toBe('*')
    expect(pgnResult('Stopped after move 12', 'white')).toBe('*')
  })

  it('turns the outcome round for the colour the trainee played', () => {
    expect(pgnResult('You won by checkmate', 'white')).toBe('1-0')
    expect(pgnResult('You won by checkmate', 'black')).toBe('0-1')
    expect(pgnResult('You were checkmated', 'white')).toBe('0-1')
    expect(pgnResult('You were checkmated', 'black')).toBe('1-0')
  })

  it('calls every draw a draw', () => {
    expect(pgnResult('Drawn by stalemate', 'white')).toBe('1/2-1/2')
    expect(pgnResult('Drawn by repetition', 'black')).toBe('1/2-1/2')
  })

  it('reaches the header and the movetext together', () => {
    const won = { ...game, report: { ...report, outcome: 'You won by checkmate' } }
    const text = gameToPgn(won)
    expect(parsePgn(text).games[0].tags.Result).toBe('1-0')
    expect(text.trimEnd().endsWith('1-0')).toBe(true)
  })
})

describe('the date', () => {
  it('is the PGN shape', () => {
    expect(pgnDate('2026-09-03T02:15:00.000Z')).toMatch(/^\d{4}\.\d{2}\.\d{2}$/)
  })

  it('is the standard unknown date when the record has no usable one', () => {
    expect(pgnDate('not a date')).toBe('????.??.??')
  })
})
