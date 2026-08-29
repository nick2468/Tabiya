/**
 * A PGN reader that keeps the tree.
 *
 * chess.js has a PGN loader and it cannot be used for this. Verified at design
 * time: `loadPgn` on a file containing `(3. e5 {The Advance.} Bf5)` returns the
 * mainline with the variation gone, no error and no warning. A repertoire IS a
 * tree, so a parser that drops variations would delete most of a course and say
 * nothing, which is the worst failure mode a content pipeline can have.
 *
 * So this is ours. It is a tokeniser and a recursive descent parser over the
 * movetext, and it knows nothing about chess: no board, no legality, no colours.
 * That is deliberate. It produces the shape the file describes, and
 * `src/model/bundle.ts` turns that into a course, where the existing loader
 * does every check it already does for a folder of JSON.
 *
 * Errors are collected rather than thrown, the discipline the rest of the model
 * uses: one pass should show everything wrong with a file. The one thing it
 * will not do is half-read a file quietly. An unterminated comment, a variation
 * that never closes, a brace inside prose - each of those is a named error, and
 * a file with any of them yields no games at all.
 */

/** One thing wrong with a PGN file. */
export interface PgnError {
  /** The 1-based game the fault is in, or 0 for the file itself. */
  game: number
  /** The 1-based line in the file, for a reader looking at it in an editor. */
  line: number
  message: string
}

/** One move in the movetext, with whatever hangs off it. */
export interface PgnMove {
  san: string
  /**
   * The suffix annotation, as written: `!`, `?`, `!!`, `??`, `!?` or `?!`.
   * NAG numbers are translated into these, because Lichess writes `$6` where a
   * person writes `?!` and they mean the same thing.
   */
  glyph: string | null
  /** The `{comment}` following this move, verbatim and trimmed. */
  comment: string | null
  /** Alternatives to THIS move, each one a line of its own. */
  variations: PgnMove[][]
}

/** One game: its header tags, the comment before the first move, and the moves. */
export interface PgnGame {
  tags: Record<string, string>
  /** The comment before the first move. A chapter's intro lives here. */
  intro: string | null
  moves: PgnMove[]
}

export interface PgnParseResult {
  games: PgnGame[]
  errors: PgnError[]
}

/* ------------------------------------------------------------- tokenising */

type Token =
  | { kind: 'tag'; name: string; value: string; line: number }
  | { kind: 'san'; text: string; glyph: string | null; line: number }
  | { kind: 'glyph'; text: string; line: number }
  | { kind: 'comment'; text: string; line: number }
  | { kind: 'open'; line: number }
  | { kind: 'close'; line: number }
  | { kind: 'result'; line: number }

/** NAG numbers that mean something a person would write as a suffix. */
const NAGS: Record<string, string> = {
  $1: '!',
  $2: '?',
  $3: '!!',
  $4: '??',
  $5: '!?',
  $6: '?!',
}

const SAN = /^(?:O-O-O|O-O|0-0-0|0-0|[PNBRQK]?[a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?)[+#]?/
const RESULT = /^(?:1-0|0-1|1\/2-1\/2|\*)/
const MOVE_NUMBER = /^\d+\s*\.{1,3}/
const TAG = /^\[\s*([A-Za-z][A-Za-z0-9_]*)\s+"((?:[^"\\]|\\.)*)"\s*\]/

/** Reads the file into tokens. Anything it cannot make sense of is an error. */
function tokenise(text: string): { tokens: Token[]; errors: PgnError[] } {
  const tokens: Token[] = []
  const errors: PgnError[] = []
  let at = 0
  let line = 1

  const fail = (message: string) => errors.push({ game: 0, line, message })

  while (at < text.length) {
    const char = text[at]

    if (char === '\n') {
      line += 1
      at += 1
      continue
    }
    if (/\s/.test(char)) {
      at += 1
      continue
    }

    // A semicolon comment runs to the end of the line. PGN allows it and no
    // chess GUI writes one, so it is skipped rather than kept.
    if (char === ';') {
      while (at < text.length && text[at] !== '\n') at += 1
      continue
    }

    if (char === '{') {
      const start = line
      let out = ''
      at += 1
      let closed = false
      while (at < text.length) {
        if (text[at] === '}') {
          at += 1
          closed = true
          break
        }
        if (text[at] === '{') {
          errors.push({
            game: 0,
            line,
            message:
              'an opening brace inside a comment: prose in a bundle cannot contain { or }, ' +
              'because a comment ends at the first closing brace',
          })
          at += 1
          continue
        }
        if (text[at] === '\n') line += 1
        out += text[at]
        at += 1
      }
      if (!closed) {
        errors.push({ game: 0, line: start, message: 'a comment that is never closed with }' })
        break
      }
      tokens.push({ kind: 'comment', text: out.trim(), line: start })
      continue
    }

    if (char === '}') {
      fail('a closing brace with no comment open: prose in a bundle cannot contain { or }')
      at += 1
      continue
    }

    if (char === '(') {
      tokens.push({ kind: 'open', line })
      at += 1
      continue
    }
    if (char === ')') {
      tokens.push({ kind: 'close', line })
      at += 1
      continue
    }

    if (char === '[') {
      const tag = TAG.exec(text.slice(at))
      if (!tag) {
        fail('a header tag that is not in the form [Name "value"]')
        // Step past the bracket so the rest of the file is still read.
        at += 1
        continue
      }
      tokens.push({ kind: 'tag', name: tag[1], value: unescapeTag(tag[2]), line })
      at += tag[0].length
      continue
    }

    const rest = text.slice(at)

    const result = RESULT.exec(rest)
    if (result) {
      tokens.push({ kind: 'result', line })
      at += result[0].length
      continue
    }

    const number = MOVE_NUMBER.exec(rest)
    if (number) {
      // Move numbers carry no information this parser needs: whose move it is
      // falls out of the tree position, exactly as it does in the JSON.
      at += number[0].length
      continue
    }

    if (char === '$') {
      const nag = /^\$\d+/.exec(rest)
      if (nag) {
        const glyph = NAGS[nag[0]]
        if (glyph) tokens.push({ kind: 'glyph', text: glyph, line })
        at += nag[0].length
        continue
      }
    }

    if (char === '!' || char === '?') {
      const suffix = /^[!?]{1,2}/.exec(rest)
      if (suffix) {
        tokens.push({ kind: 'glyph', text: suffix[0], line })
        at += suffix[0].length
        continue
      }
    }

    const san = SAN.exec(rest)
    if (san) {
      at += san[0].length
      // A suffix written against the move, as most people write it.
      const attached = /^[!?]{1,2}/.exec(text.slice(at))
      if (attached) at += attached[0].length
      tokens.push({
        kind: 'san',
        text: normaliseCastling(san[0]),
        glyph: attached ? attached[0] : null,
        line,
      })
      continue
    }

    // Anything else is junk. Report it once and skip the run, so one stray word
    // does not turn into one error per character.
    const junk = /^\S+/.exec(rest)?.[0] ?? char
    fail(`"${junk}" is not a move, a comment, a variation or a header tag`)
    at += junk.length
  }

  return { tokens, errors }
}

/** Some tools write castling with zeros. The schema uses letters. */
function normaliseCastling(san: string): string {
  return san.replace(/^0-0-0/, 'O-O-O').replace(/^0-0/, 'O-O')
}

function unescapeTag(value: string): string {
  return value.replace(/\\(["\\])/g, '$1')
}

/* ---------------------------------------------------------------- parsing */

/**
 * Reads a whole PGN file.
 *
 * @returns every game in it and every error found. When there are errors the
 * games are still returned for a caller that wants to show both, but the course
 * builder refuses the file: a half-read repertoire is the failure this parser
 * exists to prevent.
 */
export function parsePgn(text: string): PgnParseResult {
  const { tokens, errors } = tokenise(text)
  const games: PgnGame[] = []
  let at = 0

  while (at < tokens.length) {
    const start = at
    const tags: Record<string, string> = {}
    while (at < tokens.length && tokens[at].kind === 'tag') {
      const tag = tokens[at] as Extract<Token, { kind: 'tag' }>
      if (tag.name in tags) {
        errors.push({
          game: games.length + 1,
          line: tag.line,
          message: `the header tag ${tag.name} appears twice in one game`,
        })
      }
      tags[tag.name] = tag.value
      at += 1
    }

    const game: PgnGame = { tags, intro: null, moves: [] }

    // The comment before the first move is the chapter intro.
    if (at < tokens.length && tokens[at].kind === 'comment') {
      game.intro = (tokens[at] as Extract<Token, { kind: 'comment' }>).text
      at += 1
    }

    const line = parseLine(tokens, at, games.length + 1, errors, 0)
    game.moves = line.moves
    at = line.at

    if (at < tokens.length && tokens[at].kind === 'result') at += 1

    if (at === start) {
      // Nothing was consumed, which would loop forever. Report and step on.
      errors.push({
        game: games.length + 1,
        line: tokens[at]?.line ?? 0,
        message: 'a stray ) with no variation open',
      })
      at += 1
      continue
    }

    if (Object.keys(tags).length || game.moves.length || game.intro !== null) games.push(game)
  }

  return { games, errors }
}

/**
 * One line of moves, which ends at a `)`, a result, the next game's tags, or
 * the end of the file. Variations recurse through here.
 */
function parseLine(
  tokens: Token[],
  from: number,
  game: number,
  errors: PgnError[],
  depth: number,
): { moves: PgnMove[]; at: number } {
  const moves: PgnMove[] = []
  let at = from

  while (at < tokens.length) {
    const token = tokens[at]

    if (token.kind === 'close' || token.kind === 'result' || token.kind === 'tag') break

    if (token.kind === 'san') {
      const move: PgnMove = {
        san: token.text,
        glyph: token.glyph,
        comment: null,
        variations: [],
      }
      at += 1

      // Whatever hangs off this move, in whatever order it was written.
      for (;;) {
        const next = tokens[at]
        if (!next) break
        if (next.kind === 'glyph') {
          move.glyph = move.glyph ?? next.text
          at += 1
          continue
        }
        if (next.kind === 'comment') {
          move.comment =
            move.comment === null ? next.text : `${move.comment}\n\n${next.text}`
          at += 1
          continue
        }
        if (next.kind === 'open') {
          at += 1
          const variation = parseLine(tokens, at, game, errors, depth + 1)
          at = variation.at
          if (tokens[at]?.kind === 'close') at += 1
          else
            errors.push({
              game,
              line: next.line,
              message: 'a variation that is never closed with )',
            })
          if (variation.moves.length) move.variations.push(variation.moves)
          else
            errors.push({
              game,
              line: next.line,
              message: 'an empty variation, with no move in it',
            })
          continue
        }
        break
      }

      moves.push(move)
      continue
    }

    if (token.kind === 'comment') {
      // A comment with no move before it, other than the intro one already
      // taken. It belongs to nothing, so say so rather than dropping it.
      errors.push({
        game,
        line: token.line,
        message: 'a comment that follows no move, so there is nothing for it to describe',
      })
      at += 1
      continue
    }

    if (token.kind === 'glyph') {
      errors.push({ game, line: token.line, message: 'a glyph that follows no move' })
      at += 1
      continue
    }

    if (token.kind === 'open') {
      errors.push({
        game,
        line: token.line,
        message: 'a variation that starts before any move it could be an alternative to',
      })
      at += 1
      const skipped = parseLine(tokens, at, game, errors, depth + 1)
      at = skipped.at
      if (tokens[at]?.kind === 'close') at += 1
      continue
    }

    at += 1
  }

  return { moves, at }
}

/* ---------------------------------------------------------------- writing */

/** Escapes a header tag value, which is a quoted string with two escapes. */
export function escapeTag(value: string): string {
  return value.replace(/[\\"]/g, (match) => `\\${match}`)
}
