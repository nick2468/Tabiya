import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import {
  blackBookReplies,
  buildBook,
  chooseBlackReply,
  inBook,
  whiteBookMove,
} from './book'
import {
  buildReport,
  describeDeviation,
  describeSlip,
  findDeviation,
  fullMove,
  scanForSlips,
  verdictInWords,
  type PlayedMove,
} from './report'
import { GAME_LENGTHS, PlaySession, lengthCap, scanGame } from './session'
import { loadChapter } from '../model/loader'
import { positionKey } from '../model/position'
import { strengthProfile } from '../engine'
import type { Engine, SearchResult } from '../engine'
import type { LoadedChapter } from '../model/types'

function load(raw: unknown): LoadedChapter {
  const result = loadChapter(raw)
  if (!result.ok) throw new Error(`fixture failed: ${result.errors[0]?.message}`)
  return result.chapter
}

/** 1.d4 d5 2.Bf4, with two Black replies of different popularity. */
const chapter = load({
  id: 'ch-book',
  title: 'Book',
  intro: 'Typical mistakes: none.',
  stem: ['d4', 'd5', 'Bf4'],
  tree: [
    {
      san: 'Nf6',
      weight: 9,
      children: [
        {
          san: 'e3',
          note: 'Complete the triangle.',
          children: [
            {
              san: 'e6',
              weight: 7,
              children: [{ san: 'Nf3', note: 'Develop.', plan: 'Bd3 and castle.' }],
            },
          ],
        },
      ],
    },
    {
      san: 'c5',
      weight: 1,
      children: [{ san: 'e3', note: 'Hold the centre.', plan: 'Meet ...Qb6 with Nc3.' }],
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
      weight: 8,
      children: [{ san: 'e3', note: 'The same move by another route.', plan: 'Nf3 next.' }],
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

/** An engine that always plays the same move, with a fixed evaluation. */
function fakeEngine(overrides: Partial<Engine> & { move?: string; cp?: number } = {}): Engine {
  const search = async (fen: string): Promise<SearchResult> => {
    const chess = new Chess(fen)
    const legal = chess.moves({ verbose: true })
    const move = overrides.move ?? (legal[0] ? legal[0].from + legal[0].to : '')
    return {
      bestMove: move || null,
      candidates: move
        ? [{ move, score: { kind: 'cp', centipawns: overrides.cp ?? 0 }, depth: 10 }]
        : [],
    }
  }
  return {
    start: async () => {},
    setStrength: async () => {},
    newGame: async () => {},
    search,
    stop: () => {},
    ...overrides,
  }
}

describe('buildBook', () => {
  it('indexes White moves by position', () => {
    const book = buildBook([chapter])
    expect(whiteBookMove(book, fenAfter(['d4', 'd5', 'Bf4', 'Nf6']))?.san).toBe('e3')
    expect(whiteBookMove(book, fenAfter(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6']))?.san).toBe('Nf3')
  })

  it('has nothing for a position the repertoire never reaches', () => {
    expect(whiteBookMove(buildBook([chapter]), fenAfter(['e4', 'e5']))).toBeNull()
  })

  it('carries the note, so the report can explain the book move', () => {
    const move = whiteBookMove(buildBook([chapter]), fenAfter(['d4', 'd5', 'Bf4', 'Nf6']))
    expect(move?.note).toBe('Complete the triangle.')
    expect(move?.label).toBe('3.e3')
  })

  it('finds the book by position, so a transposition is still in book', () => {
    // The same position, reached 1.d4 Nf6 2.Bf4 d5 rather than 1.d4 d5 2.Bf4 Nf6.
    const book = buildBook([chapter])
    const viaNf6 = fenAfter(['d4', 'Nf6', 'Bf4', 'd5'])
    expect(whiteBookMove(book, viaNf6)?.san).toBe('e3')
  })

  it('collects Black replies from every chapter, keeping the higher weight', () => {
    const book = buildBook([chapter, transposing])
    const replies = blackBookReplies(book, fenAfter(['d4', 'd5', 'Bf4']))
    expect(replies.map((reply) => reply.san).sort()).toEqual(['Nf6', 'c5'])
    // ch-book weights Nf6 at 9, ch-transpose reaches the same position with 8.
    expect(replies.find((reply) => reply.san === 'Nf6')?.weight).toBe(9)
  })

  it('knows when each side has run out of book', () => {
    const book = buildBook([chapter])
    expect(inBook(book, fenAfter(['d4', 'd5', 'Bf4']), 'black')).toBe(true)
    expect(inBook(book, fenAfter(['d4', 'd5', 'Bf4', 'Nf6']), 'white')).toBe(true)
    expect(inBook(book, fenAfter(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3']), 'black')).toBe(
      false,
    )
  })
})

describe('chooseBlackReply', () => {
  const book = buildBook([chapter])
  const start = fenAfter(['d4', 'd5', 'Bf4'])

  it('follows the weights, so the common reply comes up most', () => {
    // Nf6 is weighted 9 and c5 just 1, so nine tickets in ten are Nf6.
    expect(chooseBlackReply(book, start, 0)?.san).toBe('Nf6')
    expect(chooseBlackReply(book, start, 0.5)?.san).toBe('Nf6')
    expect(chooseBlackReply(book, start, 0.89)?.san).toBe('Nf6')
    expect(chooseBlackReply(book, start, 0.95)?.san).toBe('c5')
  })

  it('still returns something at the very top of the range', () => {
    expect(chooseBlackReply(book, start, 0.999999)).not.toBeNull()
  })

  it('returns nothing once the book has run out', () => {
    expect(chooseBlackReply(book, fenAfter(['e4']), 0.5)).toBeNull()
  })
})

describe('findDeviation', () => {
  const book = buildBook([chapter])

  it('says so when the game never left the book', () => {
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3'])
    expect(findDeviation(moves, book)).toEqual({ kind: 'stayed-in-book' })
  })

  it('names the first White move that left the book, and the move it should have been', () => {
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'Nf3'])
    expect(findDeviation(moves, book)).toMatchObject({
      kind: 'white-left-book',
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
    expect(deviation).toMatchObject({ kind: 'black-left-book-first', ply: 3, played: 'a6' })
    expect(deviation.bookMove).toBeUndefined()
  })

  it('says it was just chess when the book simply ends', () => {
    // The book ends after 4.Nf3; Black's next move cannot be a deviation.
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'Be7'])
    expect(findDeviation(moves, book).kind).toBe('black-left-book-first')
  })

  it('puts the deviation in words', () => {
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'Nf3'])
    expect(describeDeviation(findDeviation(moves, book))).toBe(
      'You left the repertoire on move 3 with Nf3. The line plays e3.',
    )
    expect(describeDeviation({ kind: 'stayed-in-book' })).toContain('stayed in the repertoire')
    expect(
      describeDeviation({ kind: 'black-left-book-first', ply: 3, played: 'a6' }),
    ).toContain('just chess')
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

  it('scans only White, since the report is on the trainee', () => {
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

  it('puts the worst slip first', () => {
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

describe('fullMove', () => {
  it('counts a White move and the Black reply as one move', () => {
    expect(fullMove(0)).toBe(1)
    expect(fullMove(1)).toBe(1)
    expect(fullMove(4)).toBe(3)
  })
})

describe('PlaySession', () => {
  const book = buildBook([chapter])
  const profile = strengthProfile(4)

  it('plays Black out of the book while the book lasts', async () => {
    const session = new PlaySession({ book, engine: fakeEngine(), profile, length: 'full', random: () => 0 })
    expect(session.playWhite('d4')).toBe(true)
    const reply = await session.playBlack()
    // 1...d5 is part of the chapter's stem, so it is book too.
    expect(reply).toEqual({ san: 'd5', fromBook: true })
  })

  it('steers Black by the weights, so the common defence turns up', async () => {
    // From 1.d4 d5 2.Bf4 the book offers Nf6 (weight 9) and c5 (weight 1).
    const session = new PlaySession({
      book,
      engine: fakeEngine(),
      profile,
      length: 'full',
      startMoves: ['d4', 'd5', 'Bf4'],
      random: () => 0.1,
    })
    const reply = await session.playBlack()
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
    const reply = await session.playBlack()
    expect(reply).toEqual({ san: 'Be7', fromBook: false })
  })

  it('refuses an illegal move and an out of turn one', () => {
    const session = new PlaySession({ book, engine: fakeEngine(), profile, length: 'full' })
    expect(session.playWhite('e5')).toBe(false)
    expect(session.playWhite('d4')).toBe(true)
    expect(session.playWhite('d5')).toBe(false)
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
    session.playWhite('e3')
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
      if (session.sideToMove === 'white') session.playWhite(legal[0])
      else await session.playBlack()
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
    const reply = await session.playBlack()
    expect(session.status).toBe('playing')
    expect(reply?.san).toBeDefined()
    const mated = new PlaySession({
      book,
      engine: fakeEngine({ move: 'd8h4' }),
      profile,
      length: 'full',
      startMoves: ['f3', 'e5', 'g4'],
    })
    await mated.playBlack()
    expect(mated.outcome).toBe('Black won by checkmate')
    expect(mated.status).toBe('finished')
  })
})

describe('scanGame', () => {
  it('evaluates every position once, from White\'s point of view', async () => {
    const moves = playedMoves(['d4', 'd5'])
    const engine = fakeEngine({ cp: 30 })
    const evaluations = await scanGame(moves, engine, 50)
    // Three positions: before d4, after d4, after d5.
    expect(evaluations.size).toBe(3)
    // The engine always says +0.30 for the side to move, so White's view flips.
    expect(evaluations.get(positionKey(moves[0].fen))).toBe(0.3)
    expect(evaluations.get(positionKey(moves[1].fen))).toBe(-0.3)
  })

  it('reports progress so a long scan can show it', async () => {
    const seen: number[] = []
    await scanGame(playedMoves(['d4', 'd5']), fakeEngine(), 10, (done) => seen.push(done))
    expect(seen).toEqual([1, 2, 3])
  })
})

describe('buildReport', () => {
  it('puts the deviation, the slips and the verdict together', () => {
    const book = buildBook([chapter])
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'Nf3'])
    const evaluations = new Map<string, number>()
    for (const move of moves) {
      evaluations.set(positionKey(move.fen), 0)
      evaluations.set(positionKey(move.after), 0)
    }
    evaluations.set(positionKey(moves[4].after), -1.2)
    const report = buildReport(moves, book, evaluations, 'Stopped at move 3')
    expect(report.deviation.kind).toBe('white-left-book')
    expect(report.slips.map((slip) => slip.tag)).toEqual(['mistake'])
    expect(report.verdict).toBe('Clearly better for Black')
    expect(report.outcome).toBe('Stopped at move 3')
  })

  it('says the scan did not run rather than inventing a verdict', () => {
    const report = buildReport(playedMoves(['d4']), buildBook([chapter]), new Map())
    expect(report.verdict).toBe('Not scanned')
    expect(report.finalEval).toBeUndefined()
  })
})
