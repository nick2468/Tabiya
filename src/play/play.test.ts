import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import {
  buildBook,
  chooseOpponentReply,
  inBook,
  opponentBookReplies,
  studentBookMove,
} from './book'
import {
  buildReport,
  describeAlternatives,
  describeDeviation,
  describeSlip,
  findCourseBookEnd,
  findDeviation,
  fullMove,
  scanForSlips,
  verdictInWords,
  type PlayedMove,
} from './report'
import { GAME_LENGTHS, PlaySession, lengthCap, scanGame, type GameLength } from './session'
import { blackCourse, loadFixture as load } from '../test/fixtures'
import { positionKey } from '../model/position'
import { strengthProfile } from '../engine'
import { fakeEngine } from '../test/fake-engine'

/** 1.d4 d5 2.Bf4, with two Black replies of different popularity. */
const chapter = load({
  id: 'ch-book',
  title: 'Book',
  intro: 'Typical mistakes: none.',
  stem: ['d4', 'd5', 'Bf4'],
  tree: [
    {
      san: 'Nf6',
      note: 'A Black reply in the fixture.',
      weight: 9,
      children: [
        {
          san: 'e3',
          note: 'Complete the triangle.',
          // Two graded alternatives, so a game played against the course has
          // something to pick from at this position.
          mistakes: [
            { san: 'Nf3', grade: 'playable', note: 'Fine, and it lets ...Nh5 in.' },
            { san: 'c3', grade: 'inaccuracy', note: 'A move too early.' },
          ],
          children: [
            {
              san: 'e6',
              note: 'A Black reply in the fixture.',
              weight: 7,
              children: [{ san: 'Nf3', note: 'Develop.', name: 'The Nf3 line', plan: 'Bd3 and castle.' }],
            },
          ],
        },
      ],
    },
    {
      san: 'c5',
      note: 'A Black reply in the fixture.',
      weight: 1,
      children: [{ san: 'e3', note: 'Hold the centre.', name: 'The ...c5 line', plan: 'Meet ...Qb6 with Nc3.' }],
    },
  ],
})

/** A second chapter reaching the same position by another move order. */
const transposing = load({
  id: 'ch-transpose',
  title: 'Transposing',
  intro: 'Typical mistakes: none.',
  stem: ['d4', 'Nf6', 'Bf4'],
  tree: [
    {
      san: 'd5',
      note: 'A Black reply in the fixture.',
      weight: 8,
      children: [{ san: 'e3', note: 'The same move by another route.', name: 'The other route', plan: 'Nf3 next.' }],
    },
  ],
})

/** The position after a list of SAN moves from the start. */
function fenAfter(moves: string[]): string {
  const chess = new Chess()
  for (const san of moves) chess.move(san)
  return chess.fen()
}

/** The moves of a game, in the shape the report wants. */
function playedMoves(moves: string[]): PlayedMove[] {
  const chess = new Chess()
  return moves.map((san, index) => {
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

describe('buildBook', () => {
  it('indexes White moves by position', () => {
    const book = buildBook({ colour: 'white', chapters: [chapter] })
    expect(studentBookMove(book, fenAfter(['d4', 'd5', 'Bf4', 'Nf6']))?.san).toBe('e3')
    expect(studentBookMove(book, fenAfter(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6']))?.san).toBe('Nf3')
  })

  it('has nothing for a position the repertoire never reaches', () => {
    expect(studentBookMove(buildBook({ colour: 'white', chapters: [chapter] }), fenAfter(['e4', 'e5']))).toBeNull()
  })

  it('carries the note, so the report can explain the book move', () => {
    const move = studentBookMove(buildBook({ colour: 'white', chapters: [chapter] }), fenAfter(['d4', 'd5', 'Bf4', 'Nf6']))
    expect(move?.note).toBe('Complete the triangle.')
    expect(move?.label).toBe('3.e3')
  })

  it('finds the book by position, so a transposition is still in book', () => {
    // The same position, reached 1.d4 Nf6 2.Bf4 d5 rather than 1.d4 d5 2.Bf4 Nf6.
    const book = buildBook({ colour: 'white', chapters: [chapter] })
    const viaNf6 = fenAfter(['d4', 'Nf6', 'Bf4', 'd5'])
    expect(studentBookMove(book, viaNf6)?.san).toBe('e3')
  })

  it('collects Black replies from every chapter, keeping the higher weight', () => {
    const book = buildBook({ colour: 'white', chapters: [chapter, transposing] })
    const replies = opponentBookReplies(book, fenAfter(['d4', 'd5', 'Bf4']))
    expect(replies.map((reply) => reply.san).sort()).toEqual(['Nf6', 'c5'])
    // ch-book weights Nf6 at 9, ch-transpose reaches the same position with 8.
    expect(replies.find((reply) => reply.san === 'Nf6')?.weight).toBe(9)
  })

  it('carries the graded alternatives the chapter lists at a position', () => {
    // So a game played against the course can pick one without reaching back
    // into the chapter. In the order the chapter wrote them.
    const book = buildBook({ colour: 'white', chapters: [chapter] })
    const move = studentBookMove(book, fenAfter(['d4', 'd5', 'Bf4', 'Nf6']))
    expect(move?.alternatives).toEqual([
      { san: 'Nf3', grade: 'playable' },
      { san: 'c3', grade: 'inaccuracy' },
    ])
    // A node that lists none, and a stem move, both carry an empty list
    // rather than nothing: the session reads the length and never the shape.
    expect(studentBookMove(book, fenAfter(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6']))?.alternatives).toEqual([])
    expect(studentBookMove(book, fenAfter([]))?.alternatives).toEqual([])
  })

  it('knows when each side has run out of book', () => {
    const book = buildBook({ colour: 'white', chapters: [chapter] })
    expect(inBook(book, fenAfter(['d4', 'd5', 'Bf4']), 'black')).toBe(true)
    expect(inBook(book, fenAfter(['d4', 'd5', 'Bf4', 'Nf6']), 'white')).toBe(true)
    expect(inBook(book, fenAfter(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3']), 'black')).toBe(
      false,
    )
  })
})

describe('chooseOpponentReply', () => {
  const book = buildBook({ colour: 'white', chapters: [chapter] })
  const start = fenAfter(['d4', 'd5', 'Bf4'])

  it('follows the weights, so the common reply comes up most', () => {
    // Nf6 is weighted 9 and c5 just 1, so nine tickets in ten are Nf6.
    expect(chooseOpponentReply(book, start, 0)?.san).toBe('Nf6')
    expect(chooseOpponentReply(book, start, 0.5)?.san).toBe('Nf6')
    expect(chooseOpponentReply(book, start, 0.89)?.san).toBe('Nf6')
    expect(chooseOpponentReply(book, start, 0.95)?.san).toBe('c5')
  })

  it('still returns something at the very top of the range', () => {
    expect(chooseOpponentReply(book, start, 0.999999)).not.toBeNull()
  })

  it('returns nothing once the book has run out', () => {
    expect(chooseOpponentReply(book, fenAfter(['e4']), 0.5)).toBeNull()
  })
})

describe('findDeviation', () => {
  const book = buildBook({ colour: 'white', chapters: [chapter] })

  it('says so when the game never left the book', () => {
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3'])
    expect(findDeviation(moves, book)).toEqual({ kind: 'stayed-in-book' })
  })

  it('names the first White move that left the book, and the move it should have been', () => {
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'Nf3'])
    expect(findDeviation(moves, book)).toMatchObject({
      kind: 'student-left-book',
      ply: 4,
      played: 'Nf3',
      bookMove: 'e3',
      note: 'Complete the triangle.',
    })
  })

  it('reports the FIRST deviation, not the worst or the last', () => {
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'Nf3', 'e6', 'h3'])
    expect(findDeviation(moves, book).ply).toBe(4)
  })

  it('says Black left first, and stops blaming White after that', () => {
    // 2...a6 is not in the book, so White's third move is not a deviation.
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'a6', 'h3'])
    const deviation = findDeviation(moves, book)
    expect(deviation).toMatchObject({
      kind: 'opponent-left-book-first',
      ply: 3,
      played: 'a6',
    })
    expect(deviation.bookMove).toBeUndefined()
  })

  it('says it was just chess when the book simply ends', () => {
    // The book ends after 4.Nf3; Black's next move cannot be a deviation.
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'Be7'])
    expect(findDeviation(moves, book).kind).toBe('opponent-left-book-first')
  })

  it('puts the deviation in words', () => {
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'Nf3'])
    expect(describeDeviation(findDeviation(moves, book), 'black')).toBe(
      'You left the repertoire on move 3 with Nf3. The line plays e3.',
    )
    expect(describeDeviation({ kind: 'stayed-in-book' }, 'black')).toContain(
      'stayed in the repertoire',
    )
    expect(
      describeDeviation({ kind: 'opponent-left-book-first', ply: 3, played: 'a6' }, 'black'),
    ).toContain('just chess')
  })
})

describe('the report for a game played against the course', () => {
  const book = buildBook({ colour: 'white', chapters: [chapter] })

  it('says the course played its book to the end when it did', () => {
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3'])
    const deviation = findCourseBookEnd(moves, book)
    expect(deviation).toEqual({ kind: 'course-book-ended', alternatives: [] })
    expect(describeDeviation(deviation, 'white')).toBe('The course played its book to the end.')
  })

  it('says where the course book ran out, by the first position it had no entry for', () => {
    // After 1.d4 d5 2.Bf4 Nf6 3.e3 the trainee, as Black, plays 3...c5, which
    // the fixture never lists; the engine plays White from there.
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'c5', 'Nf3'])
    const deviation = findCourseBookEnd(moves, book)
    expect(deviation).toMatchObject({ kind: 'course-book-ended', ply: 6, played: 'Nf3' })
    expect(describeDeviation(deviation, 'white')).toBe("The course's book ran out at move 4.")
  })

  it('lists the alternatives the engine took, with their grades, and counts them as in book', () => {
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'c3'])
    moves[4].alternative = 'inaccuracy'
    const deviation = findCourseBookEnd(moves, book)
    expect(deviation.ply).toBeUndefined()
    expect(deviation.alternatives).toEqual([
      { ply: 4, san: 'c3', grade: 'inaccuracy', label: '3.c3' },
    ])
    expect(describeAlternatives(deviation)).toEqual([
      '3.c3, which the course grades an inaccuracy.',
    ])
  })

  it('never judges the trainee against a repertoire, and scans their moves as the other colour', () => {
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6'])
    const evaluations = new Map<string, number>()
    // Black's 3...e6 turned a level position into one clearly better for White.
    evaluations.set(positionKey(moves[5].fen), 0.1)
    evaluations.set(positionKey(moves[5].after), 1.6)
    const report = buildReport(moves, book, evaluations, undefined, 0, 'other')
    expect(report.deviation.kind).toBe('course-book-ended')
    expect(report.slips.map((slip) => slip.san)).toEqual(['e6'])
    expect(report.slips[0].loss).toBeCloseTo(1.5)
    // The same game on the course's own side has no such slip: 3...e6 was
    // not the trainee's move there.
    expect(buildReport(moves, book, evaluations).slips).toEqual([])
  })
})

describe('verdictInWords', () => {
  it('uses the bands from the spec', () => {
    expect(verdictInWords(0)).toBe('Level')
    expect(verdictInWords(0.39)).toBe('Level')
    expect(verdictInWords(0.7)).toBe('Slightly better for White')
    expect(verdictInWords(-0.7)).toBe('Slightly better for Black')
    expect(verdictInWords(1.8)).toBe('Clearly better for White')
    expect(verdictInWords(-3)).toBe('Winning for Black')
  })

  it('names a forced mate rather than showing a number', () => {
    expect(verdictInWords(100)).toBe('White has a forced mate')
    expect(verdictInWords(-100)).toBe('Black has a forced mate')
  })

  it('never puts a number in front of the trainee', () => {
    for (const pawns of [-100, -2.4, -0.2, 0, 0.9, 4, 100]) {
      expect(verdictInWords(pawns)).not.toMatch(/[0-9]/)
    }
  })
})

describe('scanForSlips', () => {
  const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3'])

  function evaluationsFor(values: Record<number, number>) {
    const map = new Map<string, number>()
    for (const [index, value] of Object.entries(values)) {
      const move = moves[Number(index)]
      map.set(positionKey(move.fen), value)
      map.set(positionKey(move.after), value)
    }
    return map
  }

  it('finds nothing when nothing went wrong', () => {
    const evaluations = new Map<string, number>()
    for (const move of moves) {
      evaluations.set(positionKey(move.fen), 0.2)
      evaluations.set(positionKey(move.after), 0.2)
    }
    expect(scanForSlips(moves, evaluations)).toEqual([])
  })

  it('grades a slip by how much it cost', () => {
    const evaluations = new Map<string, number>()
    for (const move of moves) {
      evaluations.set(positionKey(move.fen), 0)
      evaluations.set(positionKey(move.after), 0)
    }
    // White's third move drops three pawns' worth.
    evaluations.set(positionKey(moves[4].fen), 0.5)
    evaluations.set(positionKey(moves[4].after), -2.5)
    const slips = scanForSlips(moves, evaluations)
    expect(slips).toHaveLength(1)
    expect(slips[0]).toMatchObject({ san: 'e3', tag: 'blunder', loss: 3 })
  })

  it('scans only the trainee, since the report is on their play', () => {
    // Black blunders on move 1 and the evaluation stays there. White's moves
    // lose nothing, so the report has nothing to say, however bad Black was.
    const evaluations = new Map<string, number>()
    evaluations.set(positionKey(moves[0].fen), 0)
    evaluations.set(positionKey(moves[0].after), 0)
    for (const move of moves.slice(1)) {
      evaluations.set(positionKey(move.fen), 5)
      evaluations.set(positionKey(move.after), 5)
    }
    expect(scanForSlips(moves, evaluations)).toEqual([])
  })

  it('says nothing about a move it could not evaluate', () => {
    // Only half the positions scanned, so nothing can be compared.
    const evaluations = evaluationsFor({ 0: 0 })
    expect(scanForSlips(moves, evaluations)).toEqual([])
  })

  it('lists slips most recent first, not worst first', () => {
    const evaluations = new Map<string, number>()
    for (const move of moves) {
      evaluations.set(positionKey(move.fen), 0)
      evaluations.set(positionKey(move.after), 0)
    }
    // The blunder is EARLIER than the inaccuracy, so worst-first would put it
    // on top and move order puts it second.
    evaluations.set(positionKey(moves[0].fen), 0)
    evaluations.set(positionKey(moves[0].after), -2.2)
    evaluations.set(positionKey(moves[4].fen), 0)
    evaluations.set(positionKey(moves[4].after), -0.8)
    const slips = scanForSlips(moves, evaluations)
    expect(slips.map((slip) => [slip.ply, slip.tag])).toEqual([
      [4, 'inaccuracy'],
      [0, 'blunder'],
    ])
  })

  it('puts a later slip first whatever its size', () => {
    const evaluations = new Map<string, number>()
    for (const move of moves) {
      evaluations.set(positionKey(move.fen), 0)
      evaluations.set(positionKey(move.after), 0)
    }
    evaluations.set(positionKey(moves[0].fen), 0)
    evaluations.set(positionKey(moves[0].after), -0.8)
    evaluations.set(positionKey(moves[4].fen), 0)
    evaluations.set(positionKey(moves[4].after), -2.2)
    const slips = scanForSlips(moves, evaluations)
    expect(slips.map((slip) => slip.tag)).toEqual(['blunder', 'inaccuracy'])
  })

  it('describes a slip in words, with no numbers', () => {
    const sentence = describeSlip({
      ply: 4,
      san: 'e3',
      before: 0.5,
      after: -2.5,
      loss: 3,
      tag: 'blunder',
    })
    expect(sentence).toBe(
      'A blunder on move 3: e3 turned "slightly better for white" into "winning for black".',
    )
  })

  it('does not say a move turned a verdict into the same verdict', () => {
    // A position can get worse without changing what it is called.
    const sentence = describeSlip({
      ply: 18,
      san: 'Qe2',
      before: -4,
      after: -9,
      loss: 5,
      tag: 'blunder',
    })
    expect(sentence).toBe(
      'A blunder on move 10: Qe2 gave up more ground in a position already winning for black.',
    )
  })
})

describe('what the engine preferred', () => {
  // Phase 37: Nick was told 4.Nf3 was an inaccuracy and nothing said what was
  // better. The scan had the answer all along and threw it away.
  const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3'])

  function allLevel() {
    const map = new Map<string, number>()
    for (const move of moves) {
      map.set(positionKey(move.fen), 0)
      map.set(positionKey(move.after), 0)
    }
    return map
  }

  it('gives a slip the engine\'s move from the position it was played in, as SAN', () => {
    const evaluations = allLevel()
    evaluations.set(positionKey(moves[4].after), -0.8)
    // e3 was the slip; the engine wanted the knight out. UCI, as the engine
    // says it; the slip says it the way a move list does.
    const bestMoves = new Map([[positionKey(moves[4].fen), 'g1f3']])
    const [slip] = scanForSlips(moves, evaluations, 'white', bestMoves)
    expect(slip.san).toBe('e3')
    expect(slip.better).toBe('Nf3')
  })

  it('says nothing when no best move was kept, and carries no key for it', () => {
    const evaluations = allLevel()
    evaluations.set(positionKey(moves[4].after), -0.8)
    const [slip] = scanForSlips(moves, evaluations, 'white')
    expect(slip.better).toBeUndefined()
    expect('better' in slip).toBe(false)
  })

  it('says nothing when the engine\'s move is the move that was played', () => {
    const evaluations = allLevel()
    evaluations.set(positionKey(moves[4].after), -0.8)
    const bestMoves = new Map([[positionKey(moves[4].fen), 'e2e3']])
    const [slip] = scanForSlips(moves, evaluations, 'white', bestMoves)
    expect(slip.better).toBeUndefined()
  })

  it('names it in the sentence, numbered as the move list writes it', () => {
    expect(
      describeSlip({ ply: 6, san: 'Nf3', before: 0.5, after: 0.1, loss: 0.4, tag: 'inaccuracy', better: 'Nc3' }),
    ).toBe(
      'An inaccuracy on move 4: Nf3 turned "slightly better for white" into "level". The engine preferred 4.Nc3.',
    )
    // Black's move, with the dots.
    expect(
      describeSlip({ ply: 7, san: 'e6', before: 0.1, after: 1.2, loss: 1.1, tag: 'mistake', better: 'Bf5' }),
    ).toBe(
      'A mistake on move 4: e6 turned "level" into "clearly better for white". The engine preferred 4...Bf5.',
    )
  })

  it('leaves the sentence alone when there is nothing to prefer', () => {
    expect(
      describeSlip({ ply: 6, san: 'Nf3', before: 0.5, after: 0.1, loss: 0.4, tag: 'inaccuracy' }),
    ).not.toContain('preferred')
  })

  it('reaches the report through buildReport', () => {
    const book = buildBook({ colour: 'white', chapters: [chapter] })
    const evaluations = allLevel()
    evaluations.set(positionKey(moves[4].after), -0.8)
    const bestMoves = new Map([[positionKey(moves[4].fen), 'g1f3']])
    const report = buildReport(moves, book, evaluations, undefined, 0, 'course', bestMoves)
    expect(report.slips[0].better).toBe('Nf3')
  })
})

describe('fullMove', () => {
  it('counts a White move and the Black reply as one move', () => {
    expect(fullMove(0)).toBe(1)
    expect(fullMove(1)).toBe(1)
    expect(fullMove(4)).toBe(3)
  })
})

describe('PlaySession', () => {
  const book = buildBook({ colour: 'white', chapters: [chapter] })
  const profile = strengthProfile(4)

  it('plays the opponent out of the book while the book lasts', async () => {
    const session = new PlaySession({ book, engine: fakeEngine(), profile, length: 'full', random: () => 0 })
    expect(session.playStudent('d4')).toBe(true)
    const reply = await session.playOpponent()
    // 1...d5 is part of the chapter's stem, so it is book too.
    expect(reply).toEqual({ san: 'd5', fromBook: true })
  })

  it('steers the opponent by the weights, so the common defence turns up', async () => {
    // From 1.d4 d5 2.Bf4 the book offers Nf6 (weight 9) and c5 (weight 1).
    const session = new PlaySession({
      book,
      engine: fakeEngine(),
      profile,
      length: 'full',
      startMoves: ['d4', 'd5', 'Bf4'],
      random: () => 0.1,
    })
    const reply = await session.playOpponent()
    expect(reply).toEqual({ san: 'Nf6', fromBook: true })
    expect(session.bookReplies).toBe(1)
  })

  it('hands over to the engine once the book runs out', async () => {
    const session = new PlaySession({
      book,
      engine: fakeEngine({ move: 'f8e7' }),
      profile,
      length: 'full',
      startMoves: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3'],
      random: () => 0.5,
    })
    const reply = await session.playOpponent()
    expect(reply).toEqual({ san: 'Be7', fromBook: false })
  })

  it('refuses an illegal move and an out of turn one', () => {
    const session = new PlaySession({ book, engine: fakeEngine(), profile, length: 'full' })
    expect(session.playStudent('e5')).toBe(false)
    expect(session.playStudent('d4')).toBe(true)
    expect(session.playStudent('d5')).toBe(false)
  })

  it('keeps the ply numbers honest when starting from a Study position', () => {
    const session = new PlaySession({
      book,
      engine: fakeEngine(),
      profile,
      length: 'full',
      startMoves: ['d4', 'd5', 'Bf4', 'Nf6'],
    })
    expect(session.moves).toHaveLength(4)
    expect(session.sideToMove).toBe('white')
    session.playStudent('e3')
    expect(session.moves.at(-1)?.ply).toBe(4)
  })

  it('stops at the length cap', async () => {
    const session = new PlaySession({
      book,
      engine: fakeEngine(),
      profile,
      length: 'move10',
      random: () => 0.5,
    })
    expect(lengthCap('move10')).toBe(10)
    expect(lengthCap('full')).toBeNull()
    // Play out ten full moves of whatever is legal.
    while (session.status === 'playing') {
      const legal = session.chess.moves()
      if (session.studentToMove) session.playStudent(legal[0])
      else await session.playOpponent()
    }
    expect(session.moves).toHaveLength(20)
    expect(session.status).toBe('finished')
  })

  it('offers the three lengths from the spec', () => {
    expect(GAME_LENGTHS.map((entry) => entry.value)).toEqual(['move10', 'move15', 'full'])
  })

  it('notices when the game ends by itself', async () => {
    const session = new PlaySession({
      book,
      engine: fakeEngine(),
      profile,
      length: 'full',
      startMoves: ['f3', 'e5', 'g4'],
    })
    // Black now mates with ...Qh4.
    const reply = await session.playOpponent()
    expect(session.status).toBe('playing')
    expect(reply?.san).toBeDefined()
    const mated = new PlaySession({
      book,
      engine: fakeEngine({ move: 'd8h4' }),
      profile,
      length: 'full',
      startMoves: ['f3', 'e5', 'g4'],
    })
    await mated.playOpponent()
    expect(mated.outcome).toBe('You were checkmated')
    expect(mated.status).toBe('finished')
  })
})

/**
 * Playing the other side: the trainee takes the opponent's colour and the
 * engine plays the course. Every test here runs the fixture as a WHITE course,
 * so the engine is White and opens the game.
 */
describe('a game played against the course', () => {
  const book = buildBook({ colour: 'white', chapters: [chapter] })
  const profile = strengthProfile(4)

  it('gives the trainee the opponent colour, and leaves the usual game alone', () => {
    const other = new PlaySession({ book, engine: fakeEngine(), profile, length: 'full', side: 'other' })
    expect(other.studentColour).toBe('black')
    expect(other.engineColour).toBe('white')
    expect(other.studentToMove).toBe(false)
    // Nothing that exists changes: the default is the course's own side.
    const usual = new PlaySession({ book, engine: fakeEngine(), profile, length: 'full' })
    expect(usual.side).toBe('course')
    expect(usual.studentColour).toBe('white')
    expect(usual.studentToMove).toBe(true)
  })

  it('plays the course move every time under the default', async () => {
    // 1.d4 d5 2.Bf4 Nf6, and the course's 3.e3 has two listed alternatives.
    // A random source pinned to zero would pick an alternative if anything
    // did; under the default it is never asked.
    const session = new PlaySession({
      book,
      engine: fakeEngine(),
      profile,
      length: 'full',
      side: 'other',
      startMoves: ['d4', 'd5', 'Bf4', 'Nf6'],
      random: () => 0,
    })
    const move = await session.playOpponent()
    expect(move).toEqual({ san: 'e3', fromBook: true })
    expect(session.moves.at(-1)?.colour).toBe('white')
    expect(session.moves.at(-1)?.alternative).toBeUndefined()
  })

  it('sometimes plays a listed alternative, at the draws the odds say', async () => {
    // Two draws: the first against ALTERNATIVE_CHANCE, the second picking
    // among the alternatives. 0.1 is under a quarter, so it strays; 0.9 then
    // picks the second of the two listed, which is c3.
    const draws = [0.1, 0.9]
    const session = new PlaySession({
      book,
      engine: fakeEngine(),
      profile,
      length: 'full',
      side: 'other',
      courseMoves: 'sometimes',
      startMoves: ['d4', 'd5', 'Bf4', 'Nf6'],
      random: () => draws.shift() ?? 0,
    })
    const move = await session.playOpponent()
    expect(move).toEqual({ san: 'c3', fromBook: true, alternative: 'inaccuracy' })
    expect(session.moves.at(-1)?.alternative).toBe('inaccuracy')
  })

  it('plays the course move when the first draw is over the odds', async () => {
    const session = new PlaySession({
      book,
      engine: fakeEngine(),
      profile,
      length: 'full',
      side: 'other',
      courseMoves: 'sometimes',
      startMoves: ['d4', 'd5', 'Bf4', 'Nf6'],
      random: () => 0.5,
    })
    expect(await session.playOpponent()).toEqual({ san: 'e3', fromBook: true })
  })

  it('plays the course move where the position lists no alternative', async () => {
    // 1.d4 is a stem move, which carries none. The random source is pinned
    // where it WOULD stray, and there is nothing to stray to.
    const session = new PlaySession({
      book,
      engine: fakeEngine(),
      profile,
      length: 'full',
      side: 'other',
      courseMoves: 'sometimes',
      random: () => 0,
    })
    expect(await session.playOpponent()).toEqual({ san: 'd4', fromBook: true })
  })

  it('asks the engine once the course has nothing to say', async () => {
    // After 1.d4 d5 2.Bf4 Nf6 3.e3 e6 4.Nf3 the fixture's line ends, and the
    // trainee's 4...c5 is nowhere in it. The engine plays White from here.
    const session = new PlaySession({
      book,
      engine: fakeEngine({ move: 'f1d3' }),
      profile,
      length: 'full',
      side: 'other',
      startMoves: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'c5'],
      random: () => 0.5,
    })
    expect(await session.playOpponent()).toEqual({ san: 'Bd3', fromBook: false })
  })

  /**
   * From a position, with the course to move there. The Caro-Kann fixture is
   * a Black course, so on the other side the trainee is White; a position
   * after 1.e4 has Black, the course, to move, and the engine has to answer
   * out of the book before the trainee gets a move at all. Phase 33.
   */
  it('answers at once from a position where the course is to move', async () => {
    const session = new PlaySession({
      book: buildBook(blackCourse()),
      engine: fakeEngine(),
      profile,
      length: 'full',
      side: 'other',
      startMoves: ['e4'],
      random: () => 0.5,
    })
    expect(session.studentColour).toBe('white')
    expect(session.studentToMove).toBe(false)
    expect(await session.playOpponent()).toEqual({ san: 'c6', fromBook: true })
    expect(session.studentToMove).toBe(true)
    expect(session.moves.map((move) => move.san)).toEqual(['e4', 'c6'])
  })

  it('takes the trainee move as Black and refuses one as White', async () => {
    const session = new PlaySession({ book, engine: fakeEngine(), profile, length: 'full', side: 'other' })
    expect(session.playStudent('d4')).toBe(false)
    await session.playOpponent()
    expect(session.playStudent('d5')).toBe(true)
    expect(session.moves.at(-1)?.colour).toBe('black')
  })
})

describe('carrying a capped game on', () => {
  const book = buildBook({ colour: 'white', chapters: [chapter] })
  const profile = strengthProfile(4)

  /** A game played out to its cap, whatever is legal. */
  const toTheCap = async (length: GameLength) => {
    const session = new PlaySession({ book, engine: fakeEngine(), profile, length, random: () => 0 })
    while (session.status === 'playing') {
      const legal = session.chess.moves()
      if (session.studentToMove) session.playStudent(legal[0])
      else await session.playOpponent()
    }
    return session
  }

  it('knows a game that stopped at its length from one that ended', async () => {
    const capped = await toTheCap('move10')
    expect(capped.moves).toHaveLength(20)
    expect(capped.finishedByCap()).toBe(true)
    expect(capped.lengthLimit).toBe(10)
  })

  it('gives five more moves, and stops again when they are played', async () => {
    const session = await toTheCap('move10')
    expect(session.extend(5)).toBe(true)
    expect(session.lengthLimit).toBe(15)
    expect(session.status).toBe('playing')

    while (session.status === 'playing') {
      const legal = session.chess.moves()
      if (session.studentToMove) session.playStudent(legal[0])
      else await session.playOpponent()
    }
    expect(session.moves).toHaveLength(30)
    expect(session.finishedByCap()).toBe(true)
    // And it can be told to carry on again. There is no limit on extending.
    expect(session.extend(5)).toBe(true)
    expect(session.lengthLimit).toBe(20)
  })

  it('takes the cap off altogether for a full game', async () => {
    const session = await toTheCap('move15')
    expect(session.extend('full')).toBe(true)
    expect(session.lengthLimit).toBeNull()
    expect(session.status).toBe('playing')
  })

  it('does nothing to a game that has not reached its cap', () => {
    const session = new PlaySession({ book, engine: fakeEngine(), profile, length: 'move10' })
    expect(session.finishedByCap()).toBe(false)
    expect(session.extend(5)).toBe(false)
    expect(session.lengthLimit).toBe(10)
  })

  it('does nothing to a game that ended in a checkmate', async () => {
    const mated = new PlaySession({
      book: buildBook(blackCourse()),
      engine: fakeEngine(),
      profile,
      length: 'move10',
      startMoves: ['f3', 'e5', 'g4'],
      random: () => 0,
    })
    expect(mated.playStudent('Qh4#')).toBe(true)
    expect(mated.outcome).toBe('You won by checkmate')
    expect(mated.finishedByCap()).toBe(false)
    expect(mated.extend('full')).toBe(false)
    // The outcome is untouched, and status reads it before it reads the cap.
    expect(mated.outcome).toBe('You won by checkmate')
    expect(mated.status).toBe('finished')
  })

  it('leaves a full game alone, since it never had a cap', () => {
    const session = new PlaySession({ book, engine: fakeEngine(), profile, length: 'full' })
    expect(session.lengthLimit).toBeNull()
    expect(session.finishedByCap()).toBe(false)
    expect(session.extend(5)).toBe(false)
  })
})

describe('undo and redo', () => {
  const book = buildBook({ colour: 'white', chapters: [chapter] })
  const blackBook = buildBook(blackCourse())
  const profile = strengthProfile(4)

  const started = (startMoves: string[] = []) =>
    new PlaySession({ book, engine: fakeEngine(), profile, length: 'full', startMoves, random: () => 0 })

  it('takes back the pair, so the trainee is to move again', async () => {
    const session = started()
    session.playStudent('d4')
    await session.playOpponent()
    expect(session.moves).toHaveLength(2)
    expect(session.bookReplies).toBe(1)

    expect(session.undo()).toBe(true)
    expect(session.moves).toHaveLength(0)
    expect(session.studentToMove).toBe(true)
    // The book count is put back from what the move recorded, not guessed.
    expect(session.bookReplies).toBe(0)
  })

  it('takes back one move when the trainee has moved and the opponent has not', () => {
    const session = started()
    session.playStudent('d4')
    expect(session.undo()).toBe(true)
    expect(session.moves).toHaveLength(0)
    expect(session.studentToMove).toBe(true)
  })

  it('will not go back past the position the game started from', async () => {
    const session = started(['d4', 'd5', 'Bf4'])
    expect(session.canUndo()).toBe(false)
    expect(session.undo()).toBe(false)
    expect(session.moves).toHaveLength(3)

    // And once a pair of the trainee's own is on top of them, undo takes that
    // pair off and then stops. The opponent's reply to the starting position
    // stays: taking it off would leave the opponent to move at the floor.
    await session.playOpponent()
    session.playStudent('e3')
    await session.playOpponent()
    expect(session.moves).toHaveLength(6)
    expect(session.undo()).toBe(true)
    expect(session.moves).toHaveLength(4)
    expect(session.studentToMove).toBe(true)
    expect(session.canUndo()).toBe(false)
    expect(session.undo()).toBe(false)
  })

  it('has nothing to undo when only the opponent has moved', async () => {
    const session = new PlaySession({
      book: blackBook,
      engine: fakeEngine(),
      profile,
      length: 'full',
      random: () => 0,
    })
    await session.playOpponent()
    expect(session.moves).toHaveLength(1)
    expect(session.studentToMove).toBe(true)
    // Undoing here would leave White to move with nothing to move it.
    expect(session.canUndo()).toBe(false)
    expect(session.undo()).toBe(false)
  })

  it('replays exactly what undo took off', async () => {
    const session = started()
    session.playStudent('d4')
    await session.playOpponent()
    const before = session.moves.map((move) => move.san)
    const fen = session.fen

    session.undo()
    expect(session.canRedo()).toBe(true)
    expect(session.redo()).toBe(true)
    expect(session.moves.map((move) => move.san)).toEqual(before)
    expect(session.fen).toBe(fen)
    expect(session.bookReplies).toBe(1)
    expect(session.canRedo()).toBe(false)
  })

  it('drops the redo stack the moment a different move is played', async () => {
    const session = started()
    session.playStudent('d4')
    await session.playOpponent()
    session.undo()
    expect(session.canRedo()).toBe(true)
    session.playStudent('e4')
    expect(session.canRedo()).toBe(false)
    expect(session.redo()).toBe(false)
  })

  it('unfinishes a game undone out of a checkmate', async () => {
    const session = new PlaySession({
      book: blackBook,
      engine: fakeEngine({ move: 'd8h4' }),
      profile,
      length: 'full',
      startMoves: ['f3', 'e5', 'g4'],
      random: () => 0,
    })
    // The trainee is Black here, so ...Qh4 is the trainee's own move.
    expect(session.playStudent('Qh4#')).toBe(true)
    expect(session.outcome).toBe('You won by checkmate')
    expect(session.isFinished()).toBe(true)

    expect(session.undo()).toBe(true)
    expect(session.outcome).toBeUndefined()
    expect(session.isFinished()).toBe(false)
    // And putting it back puts the mate back with it.
    session.redo()
    expect(session.outcome).toBe('You won by checkmate')
  })
})

describe('scanGame', () => {
  it('evaluates every position once, from White\'s point of view', async () => {
    const moves = playedMoves(['d4', 'd5'])
    const engine = fakeEngine({ cp: 30 })
    const { evaluations, bestMoves } = await scanGame(moves, engine, 50)
    // Three positions: before d4, after d4, after d5.
    expect(evaluations.size).toBe(3)
    // And the engine's move at each, from the same search: the fake plays
    // the first legal move, which from the start is a3.
    expect(bestMoves.size).toBe(3)
    expect(bestMoves.get(positionKey(moves[0].fen))).toBe('a2a3')
    // The engine always says +0.30 for the side to move, so White's view flips.
    expect(evaluations.get(positionKey(moves[0].fen))).toBe(0.3)
    expect(evaluations.get(positionKey(moves[1].fen))).toBe(-0.3)
  })

  it('reports progress so a long scan can show it', async () => {
    const seen: number[] = []
    await scanGame(playedMoves(['d4', 'd5']), fakeEngine(), 10, (done) => seen.push(done))
    expect(seen).toEqual([1, 2, 3])
  })

  it('keeps what the live bar already worked out rather than searching it again', async () => {
    const moves = playedMoves(['d4', 'd5'])
    const known = new Map([[positionKey(moves[0].fen), 1.5]])
    const seen: number[] = []
    const { evaluations } = await scanGame(
      moves,
      fakeEngine({ cp: 30 }),
      10,
      (_done, total) => seen.push(total),
      known,
    )
    // The report is judged by the number that was on the screen, not by a
    // fresh search that might disagree with it.
    expect(evaluations.get(positionKey(moves[0].fen))).toBe(1.5)
    expect(evaluations.size).toBe(3)
    // And the scan is two positions shorter than it would have been.
    expect(seen).toEqual([2, 2])
  })
})

describe('hints in the report', () => {
  const book = buildBook({ colour: 'white', chapters: [chapter] })

  it('carries the count when there was one', () => {
    const moves = playedMoves(['d4', 'd5'])
    const report = buildReport(moves, book, new Map(), 'Stopped at move 1', 2)
    expect(report.hints).toBe(2)
  })

  it('says nothing about hints for a game played without them', () => {
    const report = buildReport(playedMoves(['d4']), book, new Map(), undefined, 0)
    expect(report.hints).toBeUndefined()
    expect('hints' in report).toBe(false)
  })
})

describe('buildReport', () => {
  it('puts the deviation, the slips and the verdict together', () => {
    const book = buildBook({ colour: 'white', chapters: [chapter] })
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'Nf3'])
    const evaluations = new Map<string, number>()
    for (const move of moves) {
      evaluations.set(positionKey(move.fen), 0)
      evaluations.set(positionKey(move.after), 0)
    }
    evaluations.set(positionKey(moves[4].after), -1.2)
    const report = buildReport(moves, book, evaluations, 'Stopped at move 3')
    expect(report.deviation.kind).toBe('student-left-book')
    expect(report.slips.map((slip) => slip.tag)).toEqual(['mistake'])
    expect(report.verdict).toBe('Clearly better for Black')
    expect(report.outcome).toBe('Stopped at move 3')
  })

  it('says the scan did not run rather than inventing a verdict', () => {
    const report = buildReport(playedMoves(['d4']), buildBook({ colour: 'white', chapters: [chapter] }), new Map())
    expect(report.verdict).toBe('Not scanned')
    expect(report.finalEval).toBeUndefined()
  })

  it('lets the checkmate speak where a mated position has nothing to scan', () => {
    // The engine has no move to search in a mated position, so the final
    // evaluation is missing. "Not scanned" beside a checkmate read as a
    // fault in the scan; the outcome is the verdict.
    const report = buildReport(playedMoves(['d4']), buildBook({ colour: 'white', chapters: [chapter] }), new Map(), 'You won by checkmate')
    expect(report.verdict).toBe('You won by checkmate')
    expect(report.finalEval).toBeUndefined()
  })

  it('knows a game loaded from a record is already over when it ended in mate', () => {
    // Replay and Play on hand the whole game to the constructor. Found from
    // Nick's own PGN: a replayed checkmate reported "Stopped after move 59".
    const book = buildBook({ colour: 'white', chapters: [chapter] })
    const session = new PlaySession({
      book,
      engine: fakeEngine(),
      profile: strengthProfile(1),
      length: 'full',
      startMoves: ['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6', 'Qxf7#'],
    })
    expect(session.outcome).toBe('You won by checkmate')
    expect(session.isFinished()).toBe(true)
  })
})

/**
 * The same three pieces, played as Black.
 *
 * The engine opens the game here, which is the case a White course can never
 * reach: the first thing the session does is play the opponent's move, and the
 * book has to have an opinion about the starting position itself.
 */
describe('playing a Black course', () => {
  const course = blackCourse()
  const book = buildBook(course)
  const profile = strengthProfile(4)

  it('knows the student is Black and the opponent is White', () => {
    expect(book.studentColour).toBe('black')
    expect(book.opponentColour).toBe('white')
  })

  it('has a book move for the starting position, since White opens', () => {
    // 1.e4 is the chapter stem, so it is the opponent's book move, not the
    // student's: the student's first book move is 1...c6.
    expect(studentBookMove(book, fenAfter([]))).toBeNull()
    expect(opponentBookReplies(book, fenAfter([])).map((r) => r.san)).toEqual(['e4'])
    expect(studentBookMove(book, fenAfter(['e4']))?.san).toBe('c6')
    expect(studentBookMove(book, fenAfter(['e4']))?.label).toBe('1...c6')
  })

  it('lets the engine open the game out of the book', async () => {
    const session = new PlaySession({
      book,
      engine: fakeEngine(),
      profile,
      length: 'full',
      random: () => 0,
    })
    expect(session.studentToMove).toBe(false)
    const opening = await session.playOpponent()
    expect(opening).toEqual({ san: 'e4', fromBook: true })
    expect(session.studentToMove).toBe(true)
    expect(session.playStudent('c6')).toBe(true)
  })

  it('refuses a White move from the student', () => {
    const session = new PlaySession({ book, engine: fakeEngine(), profile, length: 'full' })
    // White is to move and the student is Black, so this is out of turn.
    expect(session.playStudent('e4')).toBe(false)
  })

  it('names the deviation from Black\'s side', () => {
    // 1.e4 c6 2.d4 g6: the student left the book, which plays 2...d5.
    const moves = playedMoves(['e4', 'c6', 'd4', 'g6'])
    const deviation = findDeviation(moves, book)
    expect(deviation).toMatchObject({ kind: 'student-left-book', played: 'g6', bookMove: 'd5' })
    expect(describeDeviation(deviation, book.opponentColour)).toBe(
      'You left the repertoire on move 2 with g6. The line plays d5.',
    )
  })

  it('says White left first, and stops blaming the student after that', () => {
    const moves = playedMoves(['e4', 'c6', 'Nf3', 'd5'])
    const deviation = findDeviation(moves, book)
    expect(deviation).toMatchObject({ kind: 'opponent-left-book-first', played: 'Nf3' })
    expect(describeDeviation(deviation, book.opponentColour)).toContain('White left the repertoire')
  })

  it('counts a slip as the trainee losing ground, not White', () => {
    // Evaluations are always from White's point of view, so for a Black course
    // a move that costs the student makes the number go UP.
    const moves = playedMoves(['e4', 'c6', 'd4', 'd5'])
    const evaluations = new Map<string, number>()
    for (const move of moves) {
      evaluations.set(positionKey(move.fen), 0)
      evaluations.set(positionKey(move.after), 0)
    }
    // Black's second move hands White two and a half pawns.
    evaluations.set(positionKey(moves[3].fen), 0)
    evaluations.set(positionKey(moves[3].after), 2.5)
    const slips = scanForSlips(moves, evaluations, 'black')
    expect(slips).toHaveLength(1)
    expect(slips[0]).toMatchObject({ san: 'd5', tag: 'blunder', loss: 2.5 })
    // The same numbers read as a White course would call it a good move.
    expect(scanForSlips(moves, evaluations, 'white')).toEqual([])
  })

  it('builds a whole report from Black\'s side', () => {
    const moves = playedMoves(['e4', 'c6', 'd4', 'g6'])
    const evaluations = new Map<string, number>()
    for (const move of moves) {
      evaluations.set(positionKey(move.fen), 0)
      evaluations.set(positionKey(move.after), 0)
    }
    evaluations.set(positionKey(moves[3].after), 1.5)
    const report = buildReport(moves, book, evaluations, 'Stopped at move 2')
    expect(report.deviation.kind).toBe('student-left-book')
    expect(report.slips.map((slip) => slip.tag)).toEqual(['mistake'])
    // The verdict is absolute, so it still names the side that is better.
    expect(report.verdict).toBe('Clearly better for White')
  })

  it('says the student was checkmated rather than naming a colour', async () => {
    const session = new PlaySession({
      book,
      engine: fakeEngine({ move: 'f3f7' }),
      profile,
      length: 'full',
      startMoves: ['e4', 'e5', 'Bc4', 'Nc6', 'Qf3', 'a6'],
    })
    await session.playOpponent()
    expect(session.outcome).toBe('You were checkmated')
  })
})
