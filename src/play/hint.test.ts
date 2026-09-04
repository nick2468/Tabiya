import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { bookEndedAt, bookHint, clubEngineHint, clubHint, engineHint } from './hint'
import { buildBook, opponentBookReplies, studentBookMove } from './book'
import { PlaySession } from './session'
import { loadFixture as load } from '../test/fixtures'
import { strengthProfile } from '../engine'
import type { Engine, SearchResult } from '../engine'
import type { PlayedMove } from './report'

/**
 * What a hint says, and the line it draws between teaching and guessing.
 *
 * In book there is an authored answer with a reason. Out of book there is an
 * engine's opinion and nobody's reason, and the hint has to say which it is
 * handing over: a search result dressed as a note would be the app claiming
 * to have taught something it did not.
 */

const chapter = load({
  id: 'ch-hint',
  title: 'Hints',
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
          children: [
            {
              san: 'e6',
              note: 'A Black reply in the fixture.',
              weight: 7,
              children: [{ san: 'Nf3', note: 'Develop.', name: 'The Nf3 line', plan: 'Castle.' }],
            },
          ],
        },
      ],
    },
  ],
})

const book = buildBook({ colour: 'white', chapters: [chapter] })

function fakeEngine(move: string): Engine {
  return {
    start: async () => {},
    setStrength: async () => {},
    newGame: async () => {},
    search: async (): Promise<SearchResult> => ({
      bestMove: move,
      candidates: [{ move, score: { kind: 'cp', centipawns: 20 }, depth: 12 }],
    }),
    stop: () => {},
  }
}

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

function fenAfter(sans: string[]): string {
  const chess = new Chess()
  for (const san of sans) chess.move(san)
  return chess.fen()
}

describe('a hint inside the repertoire', () => {
  it('is the course move and the course note', () => {
    const move = studentBookMove(book, fenAfter(['d4', 'd5', 'Bf4', 'Nf6']))
    expect(move).not.toBeNull()
    const hint = bookHint(move!)
    expect(hint).toEqual({
      san: 'e3',
      source: 'book',
      text: 'The line plays 3.e3. Complete the triangle.',
    })
  })

  it('says the move alone when the author wrote no note', () => {
    const hint = bookHint({ san: 'e3', chapterId: 'ch-hint', label: '3.e3', alternatives: [] })
    expect(hint.text).toBe('The line plays 3.e3.')
    expect(hint.source).toBe('book')
  })
})

describe('a hint after the repertoire has run out', () => {
  it('names the engine, and says where the course stopped', () => {
    const hint = engineHint('Nd4', 9)
    expect(hint).toEqual({
      san: 'Nd4',
      source: 'engine',
      text: 'The engine suggests Nd4. No note: the repertoire ended at move 9.',
    })
  })

  it('says the position is not in the repertoire when it never was', () => {
    expect(engineHint('Nf3', null).text).toBe(
      'The engine suggests Nf3. No note: this position is not in the repertoire.',
    )
  })
})

describe('a hint for the trainee playing against the course', () => {
  it('names the reply club players most often make, from the weights the book carries', () => {
    // From 1.d4 d5 2.Bf4 the fixture weights Nf6 at 9 and c5 at 1.
    const fen = fenAfter(['d4', 'd5', 'Bf4'])
    const hint = clubHint(opponentBookReplies(book, fen), fen)
    expect(hint).toEqual({
      san: 'Nf6',
      source: 'engine',
      text: 'Club players most often play 2...Nf6 here.',
    })
  })

  it('reads the move number off the position, on either side', () => {
    const fen = fenAfter(['d4', 'd5', 'Bf4', 'Nf6', 'e3'])
    expect(clubHint([{ san: 'e6', weight: 5, chapterIds: [] }], fen)?.text).toBe(
      'Club players most often play 3...e6 here.',
    )
    const white = fenAfter(['e4', 'c5'])
    expect(clubHint([{ san: 'Nf3', weight: 9, chapterIds: [] }], white)?.text).toBe(
      'Club players most often play 2.Nf3 here.',
    )
  })

  it('keeps the chapter order between two replies of equal weight', () => {
    const fen = fenAfter(['d4', 'd5', 'Bf4'])
    const tied = [
      { san: 'c5', weight: 5, chapterIds: [] },
      { san: 'Nf6', weight: 5, chapterIds: [] },
    ]
    expect(clubHint(tied, fen)?.san).toBe('c5')
  })

  it('has nothing to say where the course lists no reply, and the engine says so', () => {
    expect(clubHint([], fenAfter(['e4']))).toBeNull()
    expect(clubEngineHint('Nf3').text).toBe(
      'The engine suggests Nf3. The course has nothing here, so there is no usual reply to report.',
    )
    // Blue, not green: it is not the course's move and the arrow must not claim it is.
    expect(clubEngineHint('Nf3').source).toBe('engine')
  })
})

describe('where the repertoire ended', () => {
  it('is the move somebody left it on', () => {
    // 2...a6 is not a reply the book lists, so it left at ply 3, move 2.
    expect(bookEndedAt(playedMoves(['d4', 'd5', 'Bf4', 'a6']), book)).toBe(2)
  })

  it('is the last move played when the line simply ran out', () => {
    // Every move is in book; the chapter has nothing after 4.Nf3.
    const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3'])
    expect(bookEndedAt(moves, book)).toBe(4)
    expect(studentBookMove(book, fenAfter(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'c5']))).toBeNull()
  })

  it('has nothing to name before a move has been played', () => {
    expect(bookEndedAt([], book)).toBeNull()
  })
})

describe('the count on the session', () => {
  const session = () =>
    new PlaySession({
      book,
      engine: fakeEngine('g1f3'),
      profile: strengthProfile(4),
      length: 'full',
      random: () => 0,
    })

  it('starts at none', () => {
    expect(session().hints).toBe(0)
  })

  it('is a fact about the game, so playing on does not clear it', async () => {
    const game = session()
    game.hints += 1
    game.playStudent('d4')
    await game.playOpponent()
    game.hints += 1
    expect(game.hints).toBe(2)
    // Undo moves the game; it does not unask a question that was answered.
    game.undo()
    expect(game.hints).toBe(2)
  })

  it('belongs to the game, so a new one starts again at none', () => {
    const first = session()
    first.hints += 3
    expect(session().hints).toBe(0)
  })
})
