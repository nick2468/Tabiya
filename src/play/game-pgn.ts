import { Movetext, pgnTag } from '../model/pgn'
import { colourName, type Colour } from '../model/types'
import { describeDeviation, verdictInWords, type GameReport, type PlayedMove } from './report'

/**
 * A played game written out as PGN, with the report written into it.
 *
 * Nick had one way to show anyone a game he had played: a screenshot. Text is
 * what a game is, and a PGN can be pasted into a chat, a file or another
 * engine and played through by whoever reads it.
 *
 * The report goes in as comments rather than being left behind, because the
 * comments are the only part a chess program will not work out for itself:
 * where the game left the repertoire, which moves the engine calls mistakes,
 * and what it made of the final position.
 *
 * Seven tag pairs, and every one of them says something true. `Site` is the
 * course rather than a place, which is the tag's honest use here: it is where
 * the game happened as far as this app is concerned. Nothing is invented to
 * fill a slot, so `Round` is the "-" the standard has for exactly that.
 */

export interface GameForPgn {
  moves: PlayedMove[]
  report: GameReport
  /** The course the game belongs to, as the catalog prints it. */
  courseTitle: string
  studentColour: Colour
  /** The strength level the engine played at. */
  level: number
  /** When the game was recorded, as an ISO timestamp. */
  at: string
}

/** The PGN date field: "2026.09.03", or the standard's own unknown date. */
export function pgnDate(at: string): string {
  const when = new Date(at)
  if (Number.isNaN(when.getTime())) return '????.??.??'
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${when.getFullYear()}.${pad(when.getMonth() + 1)}.${pad(when.getDate())}`
}

/**
 * The result, from the outcome the session recorded.
 *
 * A game that was stopped rather than finished has no result, and `*` is what
 * the standard has for that. Guessing one from the evaluation would be putting
 * a number's opinion where a fact belongs.
 */
export function pgnResult(outcome: string | undefined, studentColour: Colour): string {
  if (!outcome) return '*'
  if (outcome.includes('You won')) return studentColour === 'white' ? '1-0' : '0-1'
  if (outcome.includes('You were checkmated')) return studentColour === 'white' ? '0-1' : '1-0'
  if (outcome.startsWith('Drawn')) return '1/2-1/2'
  return '*'
}

/** How a slip reads in a comment: short, because it sits inside the moves. */
function slipComment(tag: string, before: number, after: number): string {
  const was = verdictInWords(before).toLowerCase()
  const now = verdictInWords(after).toLowerCase()
  return was === now
    ? `${tag}: gave up more ground in a position already ${was}`
    : `${tag}: ${was} to ${now}`
}

export function gameToPgn(game: GameForPgn): string {
  const { moves, report, studentColour, level } = game
  const opponentColour: Colour = studentColour === 'white' ? 'black' : 'white'
  const engine = `Stockfish level ${level}`
  const result = pgnResult(report.outcome, studentColour)

  const header = [
    pgnTag('Event', 'Repertoire Trainer'),
    pgnTag('Site', game.courseTitle),
    pgnTag('Date', pgnDate(game.at)),
    pgnTag('Round', '-'),
    pgnTag('White', studentColour === 'white' ? 'You' : engine),
    pgnTag('Black', studentColour === 'black' ? 'You' : engine),
    pgnTag('Result', result),
  ]

  // Both are keyed by the ply of the move they belong to, so the writer can
  // ask each move what the report had to say about it.
  const slips = new Map(report.slips.map((slip) => [slip.ply, slip]))
  const deviationPly =
    report.deviation.kind === 'stayed-in-book' ? undefined : report.deviation.ply

  const out = new Movetext()
  // Before the first move, which is where PGN puts a comment about the game
  // rather than about a position. A game played with help is a different game
  // from one played without it, and anyone reading this should know which.
  if (report.hints) {
    out.comment(`Played with ${report.hints} ${report.hints === 1 ? 'hint' : 'hints'}.`)
  }
  for (const move of moves) {
    out.move(move.san, move.ply)
    const notes: string[] = []
    if (move.ply === deviationPly) {
      notes.push(describeDeviation(report.deviation, opponentColour))
    }
    const slip = slips.get(move.ply)
    if (slip) notes.push(slipComment(slip.tag, slip.before, slip.after))
    if (notes.length) out.comment(notes.join(' '))
  }

  // The verdict last, so a reader ends on what the engine made of it. The
  // outcome is said too when the game ended by itself, because "1-0" does not
  // say whether it was a mate or a resignation, and this app never resigns.
  const closing = [report.verdict]
  if (report.outcome) closing.push(report.outcome)
  closing.push(`${colourName(studentColour)} was played by you at level ${level}`)
  // Full stops between them: the verdict and the outcome are both written
  // without one, because on screen each has a line of its own.
  out.comment(`${closing.join('. ')}.`)
  out.token(result)

  return `${header.join('\n')}\n\n${out.text()}\n`
}
