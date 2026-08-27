/**
 * The UCI protocol, as far as this app needs it.
 *
 * UCI is the text protocol chess engines speak: you send lines like
 * "go movetime 300" and read lines like "info depth 12 score cp 34 pv e2e4"
 * back. Everything here is pure string work, so it is tested without starting
 * an engine at all.
 *
 * One thing to keep straight: an engine reports a score from the point of view
 * of the side to move. A report shown to the trainee always speaks from White's
 * point of view, so the sign has to be flipped when Black is to move.
 */

/** A score as the engine reports it: centipawns, or mate in N. */
export type Score =
  | { kind: 'cp'; centipawns: number }
  | { kind: 'mate'; moves: number }

export interface InfoLine {
  depth?: number
  /** Which candidate this is, when MultiPV is on. 1 is the best. */
  multipv?: number
  score?: Score
  /** The line the engine expects, in coordinate notation like "e2e4". */
  pv: string[]
}

/** Parses one "info ..." line. Returns null for lines with nothing useful. */
export function parseInfo(line: string): InfoLine | null {
  if (!line.startsWith('info ')) return null
  const tokens = line.split(/\s+/)
  const info: InfoLine = { pv: [] }
  let found = false

  for (let i = 1; i < tokens.length; i++) {
    switch (tokens[i]) {
      case 'depth':
        info.depth = Number(tokens[++i])
        found = true
        break
      case 'multipv':
        info.multipv = Number(tokens[++i])
        found = true
        break
      case 'score': {
        const kind = tokens[++i]
        const value = Number(tokens[++i])
        if (kind === 'cp') info.score = { kind: 'cp', centipawns: value }
        else if (kind === 'mate') info.score = { kind: 'mate', moves: value }
        found = true
        break
      }
      case 'pv':
        info.pv = tokens.slice(i + 1)
        i = tokens.length
        found = true
        break
      default:
        break
    }
  }

  return found ? info : null
}

/** The move from a "bestmove e2e4 ponder e7e5" line, or null. */
export function parseBestMove(line: string): string | null {
  if (!line.startsWith('bestmove')) return null
  const move = line.split(/\s+/)[1]
  return move && move !== '(none)' ? move : null
}

/**
 * A score in pawns from White's point of view.
 *
 * Mate is reported as a large number rather than infinity so that the same
 * arithmetic works everywhere. Its size still orders correctly against any real
 * evaluation, and the report never shows the number itself.
 */
export const MATE_PAWNS = 100

export function whitePovPawns(score: Score, sideToMove: 'white' | 'black'): number {
  const raw =
    score.kind === 'cp'
      ? score.centipawns / 100
      : score.moves >= 0
        ? MATE_PAWNS
        : -MATE_PAWNS
  return sideToMove === 'white' ? raw : -raw
}

/** True when the score is a forced mate rather than an evaluation. */
export function isMate(score: Score): boolean {
  return score.kind === 'mate'
}

/** A move in coordinate notation, split for chess.js. */
export function splitMove(move: string): { from: string; to: string; promotion?: string } {
  return {
    from: move.slice(0, 2),
    to: move.slice(2, 4),
    promotion: move.length > 4 ? move.slice(4, 5) : undefined,
  }
}
