import { Chess } from 'chess.js'
import { moveLabel } from '../model/cards'
import { chapterLines } from '../model/lines'
import { positionKey } from '../model/position'
import type { Colour, LoadedChapter } from '../model/types'

/**
 * The opening book: the repertoire tree, indexed by position so a game can be
 * steered into it whatever move order it takes.
 *
 * Indexing by position rather than by move list is what makes transpositions
 * work. The London reaches the same setup a dozen ways, and a game that arrives
 * through one chapter's move order should still be in book when the position
 * belongs to another chapter.
 *
 * The two sides are the STUDENT and the OPPONENT, not White and Black. A course
 * teaches one colour and it need not be White: in a Black course the opponent
 * is the one who opens the game, and the book has to answer for that position
 * before the student has moved at all.
 *
 * The student has at most one book move per position, which the content suite
 * enforces. The opponent has as many as the chapters between them offer, each
 * with a weight saying how often it turns up at club level.
 *
 * Chapter stems count too. A stem is the moves that lead into a chapter, so
 * without them the book would have nothing to say about 1.d4 itself, and every
 * game would leave the repertoire on move one. Stem moves carry no authored
 * note or weight, so they get a neutral one.
 */

/**
 * The weight an opponent's stem move gets. Stems are the main routes into whole
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
  /** How the move reads in a sentence: "3.e3", or "3...Bf5" in a Black course. */
  label: string
}

export interface Book {
  /** The colour the trainee plays, which is the course's. */
  studentColour: Colour
  /** The colour the engine plays. */
  opponentColour: Colour
  /** The repertoire move, by position key. */
  student: Map<string, BookMove>
  /** The opponent's replies, by position key, in the order the chapters list them. */
  opponent: Map<string, BookReply[]>
}

/**
 * Just enough of a course to build a book from: the student's colour and the
 * chapters to draw on. A whole course fits it, and so does one chapter of one,
 * which is how a chapter-targeted sparring game is set up.
 */
export interface BookSource {
  colour: Colour
  chapters: LoadedChapter[]
}

/** Builds the book from whichever chapters of a course are wanted. */
export function buildBook(source: BookSource): Book {
  const student = new Map<string, BookMove>()
  const opponent = new Map<string, BookReply[]>()
  const studentColour = source.colour
  const opponentColour: Colour = studentColour === 'white' ? 'black' : 'white'

  const addReply = (key: string, san: string, weight: number, chapterId: string) => {
    const replies = opponent.get(key) ?? []
    const held = replies.find((reply) => reply.san === san)
    if (held) {
      // The same reply taught in two chapters keeps the higher estimate.
      held.weight = Math.max(held.weight, weight)
      if (!held.chapterIds.includes(chapterId)) held.chapterIds.push(chapterId)
    } else {
      replies.push({ san, weight, chapterIds: [chapterId] })
    }
    opponent.set(key, replies)
  }

  for (const chapter of source.chapters) {
    // The stem first: the moves that lead into the chapter are book too.
    const chess = new Chess()
    chapter.stem.forEach((san, index) => {
      const key = positionKey(chess.fen())
      // White always moves first, so parity gives the colour here as well.
      const colour: Colour = index % 2 === 0 ? 'white' : 'black'
      chess.move(san)
      if (colour === studentColour) {
        if (!student.has(key)) {
          const number = Math.floor(index / 2) + 1
          student.set(key, {
            san,
            chapterId: chapter.id,
            label: colour === 'white' ? `${number}.${san}` : `${number}...${san}`,
          })
        }
      } else {
        addReply(key, san, STEM_WEIGHT, chapter.id)
      }
    })

    for (const line of chapterLines(chapter)) {
      for (const node of line.nodes) {
        if (node.isStudent) {
          if (!student.has(node.key)) {
            student.set(node.key, {
              san: node.san,
              note: node.note,
              chapterId: chapter.id,
              label: moveLabel(node),
            })
          }
          continue
        }
        addReply(node.key, node.san, node.weight ?? 1, chapter.id)
      }
    }
  }

  return { studentColour, opponentColour, student, opponent }
}

/** The repertoire move in this position, or null when the book has run out. */
export function studentBookMove(book: Book, fen: string): BookMove | null {
  return book.student.get(positionKey(fen)) ?? null
}

/** The opponent's book replies here, in the order the chapters list them. */
export function opponentBookReplies(book: Book, fen: string): BookReply[] {
  return book.opponent.get(positionKey(fen)) ?? []
}

/**
 * Picks one of the opponent's replies, weighted by how often it turns up.
 *
 * The weights are what make a sparring game land in structures worth training:
 * the common defences come up often, the odd ones now and then.
 *
 * @param random a number in [0, 1); injected so the tests are not a coin toss
 */
export function chooseOpponentReply(book: Book, fen: string, random: number): BookReply | null {
  const replies = opponentBookReplies(book, fen)
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
export function inBook(book: Book, fen: string, side: Colour): boolean {
  return side === book.studentColour
    ? book.student.has(positionKey(fen))
    : (book.opponent.get(positionKey(fen))?.length ?? 0) > 0
}

/** How many positions the book covers, for the diagnostics view. */
export function bookSize(book: Book): { student: number; opponent: number } {
  return { student: book.student.size, opponent: book.opponent.size }
}
