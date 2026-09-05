import { Chess } from 'chess.js'
import { chooseCandidate, splitMove, whitePovPawns, type Engine, type StrengthProfile } from '../engine'
import { positionKey } from '../model/position'
import { chooseOpponentReply, type Book } from './book'
import { outcomeOf } from './outcome'
import type { PlayedMove } from './report'
import type { Colour, MistakeGrade } from '../model/types'

/**
 * A game of chess against the engine, steered into the repertoire.
 *
 * The opponent's moves come from the book while the position is still in it,
 * chosen by the club-level weights, so a sparring game lands in structures
 * worth training. The engine takes over the moment the book runs out.
 *
 * Which colour the trainee plays comes from the book, which got it from the
 * course. In a Black course the engine opens the game: the session simply
 * starts with the opponent to move, and playOpponent is the first thing called.
 *
 * The engine is injected rather than built here, so the tests drive a fake and
 * never start a worker.
 *
 * Undo works in PAIRS, not plies. Taking back one ply would leave the opponent
 * to move with nothing to make it move, so the game would sit there. So undo
 * goes back to the last position where the trainee was to move, which is the
 * opponent's reply and the move before it in the ordinary case, and one move
 * when the game has just ended on the trainee's own move. It cannot go back
 * past where the game started: a game launched from a Study position replays
 * those moves in the constructor and they are the floor.
 *
 * The length cap is a FIELD rather than a reading of the options, because a
 * game that stopped at move 10 can be told to carry on. That is the only thing
 * `extend` changes: a game that ended by checkmate or a draw has an `outcome`
 * and stays ended, whatever anyone asks of it.
 */

/** How long a game runs before it stops and reports. */
export type GameLength = 'move10' | 'move15' | 'full'

export const GAME_LENGTHS: { value: GameLength; label: string }[] = [
  { value: 'move10', label: 'To move 10' },
  { value: 'move15', label: 'To move 15' },
  { value: 'full', label: 'Full game' },
]

/**
 * Which side of the course the trainee is on.
 *
 * `course` is every game until phase 32: the trainee plays the repertoire and
 * the engine plays the replies. `other` swaps them. The trainee takes the
 * opponent's colour and the engine plays the course's own moves, so a person
 * who has learnt an opening gets to see it coming at them.
 */
export type PlaySide = 'course' | 'other'

/**
 * How the engine plays the course when it is on that side.
 *
 * `always` is the repertoire move every time, which is the default. Under
 * `sometimes` it plays a listed alternative one time in four, chosen among
 * the moves the course grades at that position, so the trainee also meets
 * the ways a club opponent gets the line slightly wrong.
 */
export type CourseMoves = 'always' | 'sometimes'

/**
 * The odds, in one place so they can be tuned. Ruled by the orchestrator at
 * phase 32: the course move three times in four, an alternative the fourth.
 */
export const ALTERNATIVE_CHANCE = 0.25

export interface SessionOptions {
  book: Book
  engine: Engine
  profile: StrengthProfile
  length: GameLength
  /** Where to start. Defaults to the initial position. */
  startFen?: string
  /** Moves already played, when starting from a Study position. */
  startMoves?: string[]
  /** Injected so the tests are not a coin toss. */
  random?: () => number
  /** Which side the trainee plays. Defaults to the course's own. */
  side?: PlaySide
  /** How the engine plays the course when it has that side. */
  courseMoves?: CourseMoves
}

export type SessionStatus = 'playing' | 'finished'

export interface OpponentMoveResult {
  san: string
  /** True when the move came from the repertoire rather than the engine. */
  fromBook: boolean
  /**
   * Set when the engine, playing the course's side, took a listed alternative
   * rather than the repertoire move: the grade the course gives it.
   */
  alternative?: MistakeGrade
}

/** The move number a game of this length stops after. */
export function lengthCap(length: GameLength): number | null {
  if (length === 'move10') return 10
  if (length === 'move15') return 15
  return null
}

export class PlaySession {
  readonly chess: Chess
  readonly moves: PlayedMove[] = []
  private readonly options: SessionOptions
  private readonly random: () => number
  /** How many plies the game started with, which undo may not go below. */
  private readonly floor: number
  /** The move number the game stops after, or null for no limit. */
  private cap: number | null
  /** What undo took off, latest removed at the top, for redo to put back. */
  private readonly undone: PlayedMove[] = []
  /** How many of the opponent's moves came out of the book. */
  bookReplies = 0
  /**
   * How many hints were asked for. Counted on the game rather than the screen
   * because it is a fact about how the game was played, and the report says
   * it: a game played with the answers on is a different game.
   */
  hints = 0
  /** Set when the game ends by itself: checkmate, stalemate, a draw. */
  outcome?: string

  constructor(options: SessionOptions) {
    this.options = options
    this.random = options.random ?? Math.random
    this.chess = new Chess(options.startFen)
    this.cap = lengthCap(options.length)
    // Replaying the moves that led here keeps the ply numbers honest, so a
    // report on a game started from move 8 still says "move 8".
    for (const san of options.startMoves ?? []) {
      const before = this.chess.fen()
      const move = this.chess.move(san)
      this.moves.push({
        ply: this.moves.length,
        san: move.san,
        colour: move.color === 'w' ? 'white' : 'black',
        fen: before,
        after: this.chess.fen(),
      })
    }
    this.floor = this.moves.length
  }

  get fen(): string {
    return this.chess.fen()
  }

  get sideToMove(): Colour {
    return this.chess.turn() === 'w' ? 'white' : 'black'
  }

  /** Which side of the course the trainee is on. */
  get side(): PlaySide {
    return this.options.side ?? 'course'
  }

  /**
   * The colour the trainee is playing. The course's own colour in the usual
   * game, and the other one when the trainee is playing against the course.
   * Everything about whose turn it is reads this and not the book, which is
   * what lets the sides swap without the rest of the session knowing.
   */
  get studentColour(): Colour {
    const { book } = this.options
    return this.side === 'other' ? book.opponentColour : book.studentColour
  }

  /** The colour the engine is playing. */
  get engineColour(): Colour {
    return this.studentColour === 'white' ? 'black' : 'white'
  }

  /** True when it is the trainee's turn. */
  get studentToMove(): boolean {
    return this.sideToMove === this.studentColour
  }

  get status(): SessionStatus {
    if (this.outcome) return 'finished'
    if (this.chess.isGameOver()) return 'finished'
    if (this.cap === null) return 'playing'
    // The cap is reached once both sides have completed that move number.
    return this.completedFullMoves() >= this.cap ? 'finished' : 'playing'
  }

  /**
   * True when the game has stopped only because it ran out of length.
   *
   * The distinction the screen needs: a game that reached its cap can be told
   * to carry on, and a game that ended in a checkmate cannot.
   */
  finishedByCap(): boolean {
    if (this.outcome || this.chess.isGameOver()) return false
    return this.cap !== null && this.completedFullMoves() >= this.cap
  }

  /**
   * Carries a capped game on: five more moves, or as long as it lasts.
   *
   * Returns false when there is nothing to extend, which is any game that did
   * not stop at its cap. A mated game stays mated: `outcome` is not touched
   * here and `status` reads it first.
   */
  extend(by: 5 | 'full'): boolean {
    if (!this.finishedByCap()) return false
    this.cap = by === 'full' ? null : this.completedFullMoves() + by
    return true
  }

  /** The move number the game currently stops after, for the screen to say. */
  get lengthLimit(): number | null {
    return this.cap
  }

  /**
   * True when the game is over. A method rather than a comparison on `status`,
   * because callers check it either side of a move that can change it.
   */
  isFinished(): boolean {
    return this.status === 'finished'
  }

  /** How many full moves both sides have completed. */
  private completedFullMoves(): number {
    return Math.floor(this.moves.length / 2)
  }

  /** Plays the trainee's move. Returns false when it is not legal. */
  playStudent(san: string): boolean {
    if (!this.studentToMove) return false
    const before = this.chess.fen()
    let move
    try {
      move = this.chess.move(san)
    } catch {
      return false
    }
    this.moves.push({
      ply: this.moves.length,
      san: move.san,
      colour: this.studentColour,
      fen: before,
      after: this.chess.fen(),
    })
    // A new move is a new game from here on, so there is nothing to redo.
    this.undone.length = 0
    this.noteOutcome()
    return true
  }

  /** True when there is a move of the trainee's own to take back. */
  canUndo(): boolean {
    return this.undoTarget() !== null
  }

  /** True when undo has taken something off that has not been put back. */
  canRedo(): boolean {
    return this.undone.length > 0
  }

  /**
   * Takes the game back to the last position where the trainee was to move.
   *
   * Returns false when there is nothing to take back, which includes the case
   * where every move since the floor belongs to the opponent: a Black course
   * before the trainee has answered White's first move has nothing of the
   * trainee's in it.
   */
  undo(): boolean {
    const target = this.undoTarget()
    if (target === null) return false
    while (this.moves.length > target) {
      const removed = this.moves.pop()
      if (!removed) break
      this.chess.undo()
      this.undone.push(removed)
      if (removed.fromBook) this.bookReplies -= 1
    }
    this.reoutcome()
    return true
  }

  /** Puts back what undo took off, up to the trainee's next turn. */
  redo(): boolean {
    if (this.undone.length === 0) return false
    do {
      const move = this.undone.pop()
      if (!move) break
      this.chess.move(move.san)
      this.moves.push(move)
      if (move.fromBook) this.bookReplies += 1
    } while (this.undone.length > 0 && !this.studentToMove && !this.chess.isGameOver())
    this.reoutcome()
    return true
  }

  /**
   * How many plies to fall back to, or null when there is nothing to undo.
   *
   * `moves[count].colour` is the side that moved from that position, so it is
   * also the side to move there. The search walks back one ply at a time and
   * stops at the first position that belongs to the trainee, which makes the
   * pairing fall out rather than having to be counted.
   */
  private undoTarget(): number | null {
    for (let count = this.moves.length - 1; count >= this.floor; count -= 1) {
      if (this.moves[count].colour === this.studentColour) return count
    }
    return null
  }

  /**
   * Works the outcome out again after the move list changed.
   *
   * Clearing it first is the whole point: a game undone out of a checkmate
   * would otherwise still be finished, with a board that says otherwise.
   */
  private reoutcome(): void {
    this.outcome = undefined
    this.noteOutcome()
  }

  /**
   * Plays the opponent's reply: from the book while the book still has one,
   * from the engine after that.
   */
  async playOpponent(): Promise<OpponentMoveResult | null> {
    if (this.studentToMove || this.status === 'finished') return null
    const before = this.chess.fen()

    const chosen = this.side === 'other' ? this.courseMove(before) : this.replyMove(before)
    let san: string | null = null
    let fromBook = false
    let alternative: MistakeGrade | undefined
    if (chosen) {
      try {
        san = this.chess.move(chosen.san).san
        fromBook = true
        alternative = chosen.alternative
        this.bookReplies += 1
      } catch {
        // The book and the position disagree, which would be a content fault.
        // Fall through to the engine rather than stopping the game.
        san = null
      }
    }

    if (!san) {
      const engineMove = await this.engineMove(before)
      if (!engineMove) return null
      san = this.chess.move(splitMove(engineMove)).san
    }

    this.moves.push({
      ply: this.moves.length,
      san,
      colour: this.engineColour,
      fen: before,
      after: this.chess.fen(),
      fromBook,
      ...(alternative ? { alternative } : {}),
    })
    this.noteOutcome()
    return { san, fromBook, ...(alternative ? { alternative } : {}) }
  }

  /** The engine's move as the opponent: one of the book's replies, by weight. */
  private replyMove(fen: string): { san: string; alternative?: MistakeGrade } | null {
    const reply = chooseOpponentReply(this.options.book, fen, this.random())
    return reply ? { san: reply.san } : null
  }

  /**
   * The engine's move as the course: the repertoire move, or under the
   * `sometimes` setting a listed alternative one draw in four.
   *
   * Two draws, in a fixed order, so a test with a fixed source can say which
   * one it is exercising. The first decides whether to stray at all; the
   * second picks which alternative, equally among them. A position that lists
   * none plays the course move without drawing a second time.
   */
  private courseMove(fen: string): { san: string; alternative?: MistakeGrade } | null {
    const move = this.options.book.student.get(positionKey(fen))
    if (!move) return null
    if (this.options.courseMoves !== 'sometimes' || move.alternatives.length === 0) {
      return { san: move.san }
    }
    if (this.random() >= ALTERNATIVE_CHANCE) return { san: move.san }
    const pick = Math.min(
      move.alternatives.length - 1,
      Math.floor(this.random() * move.alternatives.length),
    )
    const chosen = move.alternatives[pick]
    return { san: chosen.san, alternative: chosen.grade }
  }

  /** Asks the engine for a move, applying the strength profile's randomness. */
  private async engineMove(fen: string): Promise<string | null> {
    const { engine, profile } = this.options
    const result = await engine.search(fen, profile.movetime)
    const candidate = chooseCandidate(result.candidates, profile, this.random())
    return candidate?.move ?? result.bestMove
  }

  /**
   * The sentences live in `outcome.ts`, not here, because Progress has to say
   * the same thing about a game recorded before the ending was kept.
   */
  private noteOutcome(): void {
    this.outcome = outcomeOf(this.chess, this.studentColour)
  }
}

/**
 * Evaluates every position of a game at a fixed effort, for the blunder scan.
 *
 * Fixed effort matters: the scan compares positions with each other, so they
 * all have to be judged by the same standard.
 *
 * `known` is what the live bar already worked out during the game, at this
 * same effort and this same profile. Handing it over is not only a saving.
 * It means the report judges the game by the exact numbers the trainee was
 * watching, so a position the bar called level cannot be called a blunder
 * afterwards by a search that happened to see one ply further.
 */
export async function scanGame(
  moves: PlayedMove[],
  engine: Engine,
  movetime: number,
  onProgress?: (done: number, total: number) => void,
  known?: Map<string, number>,
  knownBest?: Map<string, string>,
): Promise<{ evaluations: Map<string, number>; bestMoves: Map<string, string> }> {
  const evaluations = new Map<string, number>(known)
  // The engine's move at each position, from the same search as the number.
  // One search per position: the best move is in the answer already.
  const bestMoves = new Map<string, string>(knownBest)
  const positions: { key: string; fen: string; side: 'white' | 'black' }[] = []
  const seen = new Set<string>()

  const add = (fen: string) => {
    const key = positionKey(fen)
    if (seen.has(key) || evaluations.has(key)) return
    seen.add(key)
    positions.push({ key, fen, side: fen.split(' ')[1] === 'b' ? 'black' : 'white' })
  }
  for (const move of moves) {
    add(move.fen)
    add(move.after)
  }

  for (const [index, position] of positions.entries()) {
    const result = await engine.search(position.fen, movetime)
    const best = result.candidates[0]
    if (best) evaluations.set(position.key, whitePovPawns(best.score, position.side))
    const move = result.bestMove ?? best?.move
    if (move) bestMoves.set(position.key, move)
    onProgress?.(index + 1, positions.length)
  }
  return { evaluations, bestMoves }
}
