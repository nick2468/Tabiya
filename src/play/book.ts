import { Chess } from 'chess.js'
import { chapterLines } from '../model/lines'
import { positionKey } from '../model/position'
import type { LoadedChapter } from '../model/types'

/**
 * The opening book: the repertoire tree, indexed by position so a game can be
 * steered into it whatever move order it takes.
 *
 * Indexing by position rather than by move list is what makes transpositions
 * work. The London reaches the same setup a dozen ways, and a game that arrives
 * through one chapter's move order should still be in book when the position
 * belongs to another chapter.
 *
 * White has at most one book move per position, which the content suite
 * enforces. Black has as many as the chapters between them offer, each with a
 * weight saying how often it turns up at club level.
 *
 * Chapter stems count too. A stem is the moves that lead into a chapter, so
 * without them the book would have nothing to say about 1.d4 itself, and every
 * game would leave the repertoire on move one. Stem moves carry no authored
 * note or weight, so they get a neutral one.
 */

/**
 * The weight a Black stem move gets. Stems are the main routes into whole
 * chapters, so a middling estimate is right: common enough to come up often,
 * not so heavy that it drowns out the replies an author actually weighted.
 */
export const STEM_WEIGHT = 5

export interface BookReply {
  san: string
  weight: number
  /** The chapters this reply comes from, in course order. */
  chapterIds: string[]
}

export interface BookMove {
  san: string
  note?: string
  chapterId: string
  /** How the move reads in a sentence: "3.e3". */
  label: string
}

export interface Book {
  /** White's repertoire move, by position key. */
  white: Map<string, BookMove>
  /** Black's replies, by position key, in the order the chapters list them. */
  black: Map<string, BookReply[]>
}

/**
 * Builds the book from whichever chapters are wanted.
 *
 * @param chapters every chapter for an "any defence" game, or one chapter to
 * spar against a single setup
 */
export function buildBook(chapters: LoadedChapter[]): Book {
  const white = new Map<string, BookMove>()
  const black = new Map<string, BookReply[]>()

  const addReply = (key: string, san: string, weight: number, chapterId: string) => {
    const replies = black.get(key) ?? []
    const held = replies.find((reply) => reply.san === san)
    if (held) {
      // The same reply taught in two chapters keeps the higher estimate.
      held.weight = Math.max(held.weight, weight)
      if (!held.chapterIds.includes(chapterId)) held.chapterIds.push(chapterId)
    } else {
      replies.push({ san, weight, chapterIds: [chapterId] })
    }
    black.set(key, replies)
  }

  for (const chapter of chapters) {
    // The stem first: the moves that lead into the chapter are book too.
    const chess = new Chess()
    chapter.stem.forEach((san, index) => {
      const key = positionKey(chess.fen())
      const colour = index % 2 === 0 ? 'white' : 'black'
      chess.move(san)
      if (colour === 'white') {
        if (!white.has(key)) {
          white.set(key, {
            san,
            chapterId: chapter.id,
            label: `${Math.floor(index / 2) + 1}.${san}`,
          })
        }
      } else {
        addReply(key, san, STEM_WEIGHT, chapter.id)
      }
    })

    for (const line of chapterLines(chapter)) {
      for (const node of line.nodes) {
        if (node.colour === 'white') {
          if (!white.has(node.key)) {
            white.set(node.key, {
              san: node.san,
              note: node.note,
              chapterId: chapter.id,
              label: `${Math.floor(node.ply / 2) + 1}.${node.san}`,
            })
          }
          continue
        }
        addReply(node.key, node.san, node.weight ?? 1, chapter.id)
      }
    }
  }

  return { white, black }
}

/** White's book move in this position, or null when the book has run out. */
export function whiteBookMove(book: Book, fen: string): BookMove | null {
  return book.white.get(positionKey(fen)) ?? null
}

/** Black's book replies in this position, in the order the chapters list them. */
export function blackBookReplies(book: Book, fen: string): BookReply[] {
  return book.black.get(positionKey(fen)) ?? []
}

/**
 * Picks one of Black's replies, weighted by how often it turns up.
 *
 * The weights are what make a sparring game land in structures worth training:
 * the common defences come up often, the odd ones now and then.
 *
 * @param random a number in [0, 1); injected so the tests are not a coin toss
 */
export function chooseBlackReply(book: Book, fen: string, random: number): BookReply | null {
  const replies = blackBookReplies(book, fen)
  if (replies.length === 0) return null
  const total = replies.reduce((sum, reply) => sum + reply.weight, 0)
  let ticket = random * total
  for (const reply of replies) {
    ticket -= reply.weight
    if (ticket < 0) return reply
  }
  return replies[replies.length - 1]
}

/** True when the side to move still has something in the book. */
export function inBook(book: Book, fen: string, side: 'white' | 'black'): boolean {
  return side === 'white'
    ? book.white.has(positionKey(fen))
    : (book.black.get(positionKey(fen))?.length ?? 0) > 0
}

/** How many positions the book covers, for the diagnostics view. */
export function bookSize(book: Book): { white: number; black: number } {
  return { white: book.white.size, black: book.black.size }
}
