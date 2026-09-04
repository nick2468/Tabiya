import { Chess } from 'chess.js'
import { positionAtPly } from '../play/replay'
import { playedDay } from './play-on'
import type { PlayRequest } from './Play'
import type { PlayedMove } from '../play/report'

/**
 * Starting a fresh game from a position inside a game you have already played.
 *
 * Nick replayed a London game on 1.6.12, was told move 35 had missed a forced
 * mate, and could not see it. The report names the move and the viewer shows
 * the position, but neither lets him try it. Study has offered "Play from
 * here" since v1 and this is the same idea from the other screen.
 *
 * The one thing that matters here is that it is a NEW game. The request
 * carries no `at`, so the first review mints a fresh identity and the game he
 * was reading is left exactly as it was. A request that kept the old `at`
 * would make the new game REPLACE the old record, under the phase 25 rule,
 * which is the one outcome he did not ask for.
 */

/** What a replayed game knows about itself, as the screen holds it. */
export interface ReplayedGame {
  moves: PlayedMove[]
  courseId: string
  chapterId?: string
  level?: number
  /** The record's date, used for the label and for nothing else. */
  at: string
}

/**
 * Whether a position in a replay can be played on from.
 *
 * Two conditions and they are both about the position rather than the game. It
 * has to be the trainee's move, because a game where the engine moves first
 * would open with the engine's answer to a move the trainee never made. And
 * the game cannot be over there: mate is not a position to practise from.
 *
 * The trainee's colour is worked out from the position rather than passed in,
 * because the board is the thing that knows.
 */
export function canPlayFromPly(game: ReplayedGame, ply: number, studentColour: 'white' | 'black'): boolean {
  const fen = positionAtPly(game.moves, ply)
  if (!fen) return false
  const chess = new Chess(fen)
  if (chess.isGameOver()) return false
  return (chess.turn() === 'w' ? 'white' : 'black') === studentColour
}

/** Why the button is off, in the words a person can act on. */
export function whyNotPlayable(game: ReplayedGame, ply: number, studentColour: 'white' | 'black'): string {
  const fen = positionAtPly(game.moves, ply)
  if (!fen) return 'There is no game to play from here.'
  if (new Chess(fen).isGameOver()) return 'The game is over here.'
  if (canPlayFromPly(game, ply, studentColour)) return ''
  return "It is the engine's move here. Step one move on or back."
}

/**
 * The move the replay is standing after, as the move list writes it.
 *
 * A replay ply counts POSITIONS, so ply 1 is the position after White's first
 * move and ply 2 the position after Black's reply. "after move 0" was what a
 * full move count said at ply 1, which is nonsense to a reader, so the label
 * names the move itself: "after 1.e4", "after 1...c6". Ply 0 is the start.
 */
export function moveAtPlyLabel(sans: string[], ply: number): string {
  if (ply <= 0 || sans.length === 0) return 'from the start'
  const index = Math.min(ply, sans.length) - 1
  const number = Math.floor(index / 2) + 1
  return index % 2 === 0 ? `after ${number}.${sans[index]}` : `after ${number}...${sans[index]}`
}

/**
 * The request itself.
 *
 * `moves` are the game's own SAN up to the ply, so the new game's record
 * begins with the same prefix and the deviation report reads from the chapter
 * root exactly as a Study start does. `chapterOnly` follows the chapter: a
 * game sparred against one chapter is practised against the same one.
 *
 * No `at`, no `reviewAtOnce`, and nothing that holds the opponent. This is a
 * game to play, not a game to read.
 */
export function requestFromReplay(game: ReplayedGame, ply: number): PlayRequest | null {
  const fen = positionAtPly(game.moves, ply)
  if (!fen) return null
  return {
    fen,
    moves: game.moves.slice(0, ply).map((move) => move.san),
    chapterId: game.chapterId ?? '',
    chapterOnly: Boolean(game.chapterId),
    courseId: game.courseId,
    level: game.level,
    label: `your game of ${playedDay(game.at)}, ${moveAtPlyLabel(game.moves.map((move) => move.san), ply)}`,
  }
}
