import { Chess } from 'chess.js'
import { MATE_PAWNS } from '../engine/uci'
import { positionKey } from '../model/position'
import { lineFollowed } from '../model/stats'
import { colourName, type Colour, type LoadedCourse, type MistakeGrade } from '../model/types'
import type { Book } from './book'
import type { Evaluation } from './evalbar'

/**
 * The post-game report, and the rules it follows.
 *
 * Two promises from SPEC.md section 2 are kept here. Verdicts are given in
 * words, never as a bare number, because a club player reading "+0.73" learns
 * nothing they can use. And the report is honest about who left the book first:
 * once the opponent plays something the repertoire never mentioned, the
 * trainee's moves are not deviations from anything, and the report says so.
 *
 * Everything is written from the STUDENT's side, which the book carries. That
 * matters most for the evaluations: they arrive in pawns from White's point of
 * view, so in a Black course a move that costs the trainee something makes the
 * number go up, not down.
 */

export interface PlayedMove {
  /** Half-move number from the start of the game, 0 for White's first. */
  ply: number
  san: string
  colour: Colour
  /** The position the move was played from. */
  fen: string
  /** The position after it. */
  after: string
  /**
   * True when an opponent move came out of the repertoire rather than the
   * engine. Recorded so undo can put the book count back honestly rather than
   * guessing that whatever it removed was a book move.
   */
  fromBook?: boolean
  /**
   * Set on a move the engine played FOR the course, when it took a listed
   * alternative rather than the repertoire move: the grade the course gives
   * that alternative. The other-side report lists these, so the trainee can
   * see where the game left the pure line.
   */
  alternative?: MistakeGrade
}

/**
 * What the engine thought of a position: the pawns from White's point of
 * view, and the text the live bar prints for them.
 *
 * One map, made where the score is read and the side to move is still known,
 * because that is the only place a mate's sign can be worked out. Everything
 * that wants the number reads `.pawns`; only the bar reads the text.
 */
export type Evaluations = Map<string, Evaluation>

/**
 * And what it would have played there, as UCI, from the same search. Kept
 * beside the evaluations rather than inside them so that everything reading
 * a number keeps reading a number.
 */
export type BestMoves = Map<string, string>

export type DeviationKind =
  | 'student-left-book'
  | 'opponent-left-book-first'
  | 'stayed-in-book'
  /**
   * The other-side game's one kind. There is no repertoire for the trainee to
   * be judged against, so the only question is how far the course's own book
   * lasted, and which graded alternatives the engine took on the way.
   */
  | 'course-book-ended'

/** An alternative the engine played for the course, and what the course calls it. */
export interface AlternativePlayed {
  ply: number
  san: string
  grade: MistakeGrade
  /** How it reads in a sentence: "3.c3". */
  label: string
}

export interface Deviation {
  kind: DeviationKind
  /** The ply where the book ran out, when it did. */
  ply?: number
  /** What was actually played there. */
  played?: string
  /** What the repertoire plays, when the trainee is the one who left. */
  bookMove?: string
  /** The note on the book move. */
  note?: string
  /** How the book move reads in a sentence: "7.c3". */
  label?: string
  /** For a game against the course: the alternatives the engine took, in order. */
  alternatives?: AlternativePlayed[]
  /**
   * The named line the game followed, up to where it left the course, under
   * the Lines played rule (`lineFollowed`). Phase 38: Nick could read which
   * course and chapter a game was against and never which line.
   */
  lineName?: string
  /** The chapter the game was in, when it never reached a line. */
  chapterTitle?: string
}

export type MoveTag = 'blunder' | 'mistake' | 'inaccuracy'

export interface MoveReview {
  ply: number
  san: string
  /** Pawns from White's point of view before the move. */
  before: number
  /** And after it. */
  after: number
  /** How much the STUDENT's position got worse. Negative means it improved. */
  loss: number
  tag: MoveTag
  /**
   * The engine's move in the position BEFORE this one, as SAN, when the scan
   * kept it and it is not the move that was played. Phase 37: Nick was told a
   * move was an inaccuracy and nothing told him what was better.
   */
  better?: string
}

export interface GameReport {
  deviation: Deviation
  /** The trainee's slips, most recent first. */
  slips: MoveReview[]
  /** The verdict on the final position, in words. */
  verdict: string
  /** The final evaluation in pawns from White's point of view, when known. */
  finalEval?: number
  /** How the game ended, when it ended by itself. */
  outcome?: string
  /** How many hints were used, when any were. */
  hints?: number
}

/**
 * Finds where the game left the repertoire.
 *
 * Walking in order matters. If the opponent steps outside the book first,
 * everything after that is a normal game of chess rather than a repertoire
 * question, and the trainee cannot be marked down for a move the book never had
 * an opinion on.
 */
export function findDeviation(moves: PlayedMove[], book: Book): Deviation {
  for (const move of moves) {
    const key = positionKey(move.fen)
    if (move.colour === book.studentColour) {
      const expected = book.student.get(key)
      if (!expected) {
        return { kind: 'opponent-left-book-first', ply: move.ply, played: move.san }
      }
      if (expected.san !== move.san) {
        return {
          kind: 'student-left-book',
          ply: move.ply,
          played: move.san,
          bookMove: expected.san,
          note: expected.note,
          label: expected.label,
        }
      }
    } else {
      const replies = book.opponent.get(key) ?? []
      if (!replies.some((reply) => reply.san === move.san)) {
        return { kind: 'opponent-left-book-first', ply: move.ply, played: move.san }
      }
    }
  }
  return { kind: 'stayed-in-book' }
}

/**
 * Where the course's own book ran out, in a game played against it.
 *
 * The course side's moves are looked up by position, the same way the book
 * looks them up when it plays: the first position it has no entry for is
 * where the engine took over. An alternative counts as in book, because the
 * course listed it; it is recorded separately so the report can say which
 * were played. The trainee's own moves are not judged at all here. They are
 * not deviations from anything, and the scan of their quality is elsewhere.
 */
export function findCourseBookEnd(moves: PlayedMove[], book: Book): Deviation {
  const alternatives: AlternativePlayed[] = []
  for (const move of moves) {
    if (move.colour !== book.studentColour) continue
    const entry = book.student.get(positionKey(move.fen))
    if (!entry) {
      return { kind: 'course-book-ended', ply: move.ply, played: move.san, alternatives }
    }
    if (move.alternative) {
      alternatives.push({
        ply: move.ply,
        san: move.san,
        grade: move.alternative,
        label: moveLabelAt(move),
      })
    }
  }
  return { kind: 'course-book-ended', alternatives }
}

/** "3.c3" or "3...c5": how a played move reads in a sentence. */
function moveLabelAt(move: PlayedMove): string {
  const number = fullMove(move.ply)
  return move.colour === 'white' ? `${number}.${move.san}` : `${number}...${move.san}`
}

/** The full move number a ply belongs to: plies 0 and 1 are both move 1. */
export function fullMove(ply: number): number {
  return Math.floor(ply / 2) + 1
}

/**
 * The deviation as a sentence, ready to show.
 *
 * @param opponentColour so the sentence names the side the engine played
 */
export function describeDeviation(deviation: Deviation, opponentColour: Colour): string {
  // Where the game was, in the words the chip rules: the line by name, or
  // "the X chapter" when it never reached one, or nothing when the course
  // was not known (the tests that build a deviation by hand, and any record
  // whose course has gone).
  const where = deviation.lineName ?? (deviation.chapterTitle ? chapterPhrase(deviation.chapterTitle) : undefined)
  const move = fullMove(deviation.ply ?? 0)
  switch (deviation.kind) {
    case 'stayed-in-book':
      if (deviation.lineName) return `You stayed in ${deviation.lineName} for the whole game.`
      return where
        ? `You stayed in the repertoire for the whole game, in ${where}.`
        : 'You stayed in the repertoire for the whole game.'
    case 'student-left-book':
      return where
        ? `You were in ${where} and left it on move ${move} with ${deviation.played}. The line plays ${deviation.bookMove}.`
        : `You left the repertoire on move ${move} with ${deviation.played}. The line plays ${deviation.bookMove}.`
    case 'opponent-left-book-first':
      return `${where ? 'The engine' : colourName(opponentColour)} left ${where ?? 'the repertoire'} on move ${move} with ${deviation.played}. From there it was just chess, so nothing after it counts as a deviation.`
    case 'course-book-ended':
      // No "you left" sentence exists on this side: the trainee was never in
      // the book to leave it.
      if (deviation.ply === undefined) {
        return deviation.lineName
          ? `The course played ${deviation.lineName} to the end.`
          : where
            ? `The course played its book to the end, in ${where}.`
            : 'The course played its book to the end.'
      }
      return where
        ? `The course's book ran out at move ${fullMove(deviation.ply)}, in ${where}.`
        : `The course's book ran out at move ${fullMove(deviation.ply)}.`
  }
}

/**
 * "the Classical Black chapter", or "The ...c5 and ...Qb6 lines chapter" when
 * the title brings its own article: driven at phase 38, the sentence had read
 * "in the The ...c5 and ...Qb6 lines chapter".
 */
function chapterPhrase(title: string): string {
  return /^the\s/i.test(title) ? `${title} chapter` : `the ${title} chapter`
}

/**
 * Names the line, or failing that the chapter, a game was in. The whole game
 * goes to `lineFollowed`, which counts agreement from the first move and
 * stops counting where the game and the line part, so the Play on list,
 * which has only the record's moves, gets the same answer from the same
 * call. The chosen chapter wins over the one the moves point at, because a
 * game sparring against a chapter was in that chapter whatever its first
 * moves have in common with another.
 */
export function placeDeviation(
  deviation: Deviation,
  moves: PlayedMove[],
  course: LoadedCourse | undefined,
  chapterTitle?: string,
): Deviation {
  if (!course) return chapterTitle ? { ...deviation, chapterTitle } : deviation
  const followed = lineFollowed(course, moves.map((move) => move.san))
  const title = chapterTitle ?? followed.chapter?.title
  return {
    ...deviation,
    ...(followed.line ? { lineName: followed.line.name } : {}),
    ...(title ? { chapterTitle: title } : {}),
  }
}

/**
 * The alternatives the engine took for the course, as one sentence each.
 * Empty when the course played the pure line, which is the usual case and
 * the only case under the default setting.
 */
export function describeAlternatives(deviation: Deviation): string[] {
  const names = { playable: 'playable', inaccuracy: 'an inaccuracy', mistake: 'a mistake' }
  return (deviation.alternatives ?? []).map(
    (played) => `${played.label}, which the course grades ${names[played.grade]}.`,
  )
}

/**
 * How much a move cost the trainee, in pawns.
 *
 * The evaluations are from White's point of view, so the subtraction is turned
 * round for a Black course. A positive loss always means the trainee's position
 * got worse.
 */
export const SLIP_THRESHOLDS: { tag: MoveTag; loss: number }[] = [
  { tag: 'blunder', loss: 2 },
  { tag: 'mistake', loss: 1 },
  { tag: 'inaccuracy', loss: 0.5 },
]

function tagFor(loss: number): MoveTag | null {
  for (const level of SLIP_THRESHOLDS) {
    if (loss >= level.loss) return level.tag
  }
  return null
}

/**
 * Scans the trainee's moves for the ones that threw something away.
 *
 * Only the trainee's moves are scanned: this is a report on their play, not a
 * commentary on the engine's. A move is only judged when both positions around
 * it were evaluated, so a partial scan reports less rather than guessing.
 */
export function scanForSlips(
  moves: PlayedMove[],
  evaluations: Evaluations,
  studentColour: Colour = 'white',
  bestMoves?: BestMoves,
): MoveReview[] {
  const slips: MoveReview[] = []
  for (const move of moves) {
    if (move.colour !== studentColour) continue
    const before = evaluations.get(positionKey(move.fen))?.pawns
    const after = evaluations.get(positionKey(move.after))?.pawns
    if (before === undefined || after === undefined) continue
    const loss = studentColour === 'white' ? before - after : after - before
    const tag = tagFor(loss)
    if (!tag) continue
    const better = betterMove(move, bestMoves?.get(positionKey(move.fen)))
    slips.push({
      ply: move.ply,
      san: move.san,
      before,
      after,
      loss,
      tag,
      ...(better ? { better } : {}),
    })
  }
  // Most recent first, not worst first: Nick reads the report against the
  // game he has just played, and the end of it is what he remembers.
  return slips.sort((a, b) => b.ply - a.ply)
}

/**
 * The verdict on a position, in words.
 *
 * The bands come from SPEC.md section 5: under 0.4 of a pawn is equal, up to 1
 * is slightly better, up to 2.5 is clearly better, and beyond that is winning.
 */
export function verdictInWords(pawns: number): string {
  const { band, ahead } = verdictBand(pawns)
  const side = ahead ? 'White' : 'Black'
  switch (band) {
    case 'mate':
      return `${side} has a forced mate`
    case 'level':
      return 'Level'
    case 'slight':
      return `Slightly better for ${side}`
    case 'clear':
      return `Clearly better for ${side}`
    case 'winning':
      return `Winning for ${side}`
  }
}

/** How big an advantage is, and whose. The bands are SPEC.md section 5's. */
export function verdictBand(pawns: number): {
  band: 'mate' | 'level' | 'slight' | 'clear' | 'winning'
  /** True when the number favours White. Meaningless when the band is level. */
  ahead: boolean
} {
  const size = Math.abs(pawns)
  const ahead = pawns > 0
  if (size >= MATE_PAWNS) return { band: 'mate', ahead }
  if (size < 0.4) return { band: 'level', ahead }
  if (size < 1) return { band: 'slight', ahead }
  if (size < 2.5) return { band: 'clear', ahead }
  return { band: 'winning', ahead }
}

/**
 * The same verdict said to the trainee: "clearly better for you".
 *
 * Never a bare colour. The trainee is White in one course and Black in the
 * next, so "clearly better for black" is a sentence they have to translate
 * before they can read it, and half the time they will translate it wrong.
 * Lower case, because it is written into a sentence rather than starting one.
 */
export function verdictForYou(pawns: number, studentColour: Colour): string {
  const mine = studentColour === 'white' ? pawns : -pawns
  const { band, ahead } = verdictBand(mine)
  const who = ahead ? 'you' : 'the engine'
  switch (band) {
    case 'mate':
      return `${who} ${ahead ? 'have' : 'has'} a forced mate`
    case 'level':
      return 'level'
    case 'slight':
      return `slightly better for ${who}`
    case 'clear':
      return `clearly better for ${who}`
    case 'winning':
      return `winning for ${who}`
  }
}

/**
 * A slip as a sentence.
 *
 * When both sides of the move fall in the same band, saying it turned one
 * verdict into the same verdict reads as nonsense, however true it is. A
 * position can get worse without changing what it is called, so say that
 * instead.
 */
export function describeSlip(slip: MoveReview): string {
  const name = { blunder: 'A blunder', mistake: 'A mistake', inaccuracy: 'An inaccuracy' }[slip.tag]
  const before = verdictInWords(slip.before).toLowerCase()
  const after = verdictInWords(slip.after).toLowerCase()
  const where = `${name} on move ${fullMove(slip.ply)}: ${slip.san}`
  const said =
    before === after
      ? `${where} gave up more ground in a position already ${before}.`
      : `${where} turned "${before}" into "${after}".`
  // "Preferred", not "better was": at the scan's fixed effort this is the
  // engine's choice, and the wording keeps that honest.
  return slip.better ? `${said} The engine preferred ${numberedMove(slip.ply, slip.better)}.` : said
}

/**
 * The engine's move as SAN, converted on the position the slip was played
 * FROM: the same UCI string means a different move on any other board. Absent
 * when the engine's move is the move that was played, which cannot be a slip
 * and would only say so to a reader who already knows.
 */
function betterMove(move: PlayedMove, uci: string | undefined): string | undefined {
  if (!uci) return undefined
  try {
    const chess = new Chess(move.fen)
    const played = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    })
    return played.san === move.san ? undefined : played.san
  } catch {
    return undefined
  }
}

/**
 * A move as the move list writes it: "4.Nc3" for White, "4...Nc3" for Black.
 * The ply is the move's own, so the number is the move's own too.
 */
export function numberedMove(ply: number, san: string): string {
  return `${fullMove(ply)}${ply % 2 === 0 ? '.' : '...'}${san}`
}

/** Puts the whole report together. */
export function buildReport(
  moves: PlayedMove[],
  book: Book,
  evaluations: Evaluations,
  outcome?: string,
  hints = 0,
  side: 'course' | 'other' = 'course',
  bestMoves?: BestMoves,
  /** The course the game was in, so the report can name the line it followed. */
  context?: { course?: LoadedCourse; chapterTitle?: string },
): GameReport {
  const last = moves.at(-1)
  // The number alone: the record and the report's own bar have always held
  // a number, so nothing on disk changes and no migration is needed.
  const finalEval = last ? evaluations.get(positionKey(last.after))?.pawns : undefined
  // On the other side the trainee holds the book's opponent colour, and the
  // scan of their moves has to know it: a Black trainee's loss is the number
  // going up.
  const trainee: Colour =
    side === 'other' ? book.opponentColour : book.studentColour
  return {
    deviation: placeDeviation(
      side === 'other' ? findCourseBookEnd(moves, book) : findDeviation(moves, book),
      moves,
      context?.course,
      context?.chapterTitle,
    ),
    slips: scanForSlips(moves, evaluations, trainee, bestMoves),
    // A mated final position has no evaluation to scan, because the engine
    // has no move to search. The outcome has already said what the position
    // is, and "Not scanned" beside a checkmate reads as a fault in the scan.
    verdict:
      finalEval !== undefined
        ? verdictInWords(finalEval)
        : outcome && /checkmate/.test(outcome)
          ? outcome
          : 'Not scanned',
    finalEval,
    outcome,
    // Left off entirely when there were none, so a clean game carries no
    // mention of hints anywhere: not in the report, not in the PGN.
    ...(hints > 0 ? { hints } : {}),
  }
}
