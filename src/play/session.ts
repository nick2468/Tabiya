import { Chess } from 'chess.js'
import { chooseCandidate, splitMove, whitePovPawns, type Engine, type StrengthProfile } from '../engine'
import { positionKey } from '../model/position'
import { chooseOpponentReply, type Book } from './book'
import type { PlayedMove } from './report'
import type { Colour } from '../model/types'

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
 */

/** How long a game runs before it stops and reports. */
export type GameLength = 'move10' | 'move15' | 'full'

export const GAME_LENGTHS: { value: GameLength; label: string }[] = [
  { value: 'move10', label: 'To move 10' },
  { value: 'move15', label: 'To move 15' },
  { value: 'full', label: 'Full game' },
]

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
}

export type SessionStatus = 'playing' | 'finished'

export interface OpponentMoveResult {
  san: string
  /** True when the move came from the repertoire rather than the engine. */
  fromBook: boolean
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
  /** What undo took off, latest removed at the top, for redo to put back. */
  private readonly undone: PlayedMove[] = []
  /** How many of the opponent's moves came out of the book. */
  bookReplies = 0
  /** Set when the game ends by itself: checkmate, stalemate, a draw. */
  outcome?: string

  constructor(options: SessionOptions) {
    this.options = options
    this.random = options.random ?? Math.random
    this.chess = new Chess(options.startFen)
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

  /** The colour the trainee is playing, which came from the course. */
  get studentColour(): Colour {
    return this.options.book.studentColour
  }

  /** True when it is the trainee's turn. */
  get studentToMove(): boolean {
    return this.sideToMove === this.studentColour
  }

  get status(): SessionStatus {
    if (this.outcome) return 'finished'
    if (this.chess.isGameOver()) return 'finished'
    const cap = lengthCap(this.options.length)
    if (cap === null) return 'playing'
    // The cap is reached once both sides have completed that move number.
    return this.completedFullMoves() >= cap ? 'finished' : 'playing'
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

    const bookReply = chooseOpponentReply(this.options.book, before, this.random())
    let san: string | null = null
    let fromBook = false
    if (bookReply) {
      try {
        san = this.chess.move(bookReply.san).san
        fromBook = true
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
      colour: this.options.book.opponentColour,
      fen: before,
      after: this.chess.fen(),
      fromBook,
    })
    this.noteOutcome()
    return { san, fromBook }
  }

  /** Asks the engine for a move, applying the strength profile's randomness. */
  private async engineMove(fen: string): Promise<string | null> {
    const { engine, profile } = this.options
    const result = await engine.search(fen, profile.movetime)
    const candidate = chooseCandidate(result.candidates, profile, this.random())
    return candidate?.move ?? result.bestMove
  }

  private noteOutcome(): void {
    if (this.chess.isCheckmate()) {
      // The side to move is the one that got mated.
      const mated: Colour = this.chess.turn() === 'w' ? 'white' : 'black'
      this.outcome =
        mated === this.studentColour ? 'You were checkmated' : 'You won by checkmate'
    } else if (this.chess.isStalemate()) {
      this.outcome = 'Drawn by stalemate'
    } else if (this.chess.isInsufficientMaterial()) {
      this.outcome = 'Drawn: neither side has enough to mate'
    } else if (this.chess.isThreefoldRepetition()) {
      this.outcome = 'Drawn by repetition'
    } else if (this.chess.isDraw()) {
      this.outcome = 'Drawn by the fifty move rule'
    }
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
): Promise<Map<string, number>> {
  const evaluations = new Map<string, number>(known)
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
    onProgress?.(index + 1, positions.length)
  }
  return evaluations
}
