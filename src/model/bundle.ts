import { Movetext, parsePgn, pgnTag, type PgnGame, type PgnMove } from './pgn'
import {
  CORE_TAGS,
  COURSE_FORMAT_VERSION,
  type Brush,
  type Chapter,
  type ContentError,
  type CourseManifest,
  type LoadedChapter,
  type LoadedCourse,
  type LoadedNode,
  type Mistake,
  type MistakeGrade,
  type Node,
  type Shape,
} from './types'

/**
 * A course as one file: reading a bundle in, and writing one out.
 *
 * SPEC.md section 11. A bundle is a PGN, because chess players already author
 * trees of moves with comments and alternatives in tools they already own, and
 * every chess GUI exports exactly that. The only app-specific syntax is a
 * handful of optional tokens inside comments, all of which Lichess already
 * writes or would accept.
 *
 * This module does the mapping and nothing else. It does not check legality,
 * notes, tags or structure: it produces the same shape a course folder has, and
 * `loadCourse` then applies exactly the validation a folder gets. A bundle is
 * held to the schema, not to a second copy of it.
 *
 * Two things here are additions to the table in SPEC.md section 11, both forced
 * by the round trip and both recorded at the gate rather than made quietly. A
 * chapter's `defaultTags` had nowhere to live, so it is the header tag
 * `[DefaultTags]`; a node's `variant` had nowhere to live, so it is the comment
 * token `[%variant]`. Without them a course cannot survive a trip through its
 * own file format, which is the one thing the format has to do.
 */

/** What a bundle turns into: the same two things a course folder holds. */
export interface BundleRead {
  ok: boolean
  /** The manifest, or null when the file could not be read that far. */
  manifest: CourseManifest | null
  /** Chapter files keyed by the name they would have on disk. */
  files: Record<string, unknown>
  errors: ContentError[]
}

/** A written bundle, or the reasons it could not be written. */
export interface BundleWrite {
  ok: boolean
  text: string
  errors: ContentError[]
}

/** The glyphs a graded alternative may carry, and what each one means. */
const GRADES: Record<string, MistakeGrade> = {
  '!?': 'playable',
  '?!': 'inaccuracy',
  '?': 'mistake',
  '??': 'mistake',
}

/** The grade a course writes back out for each grade it holds. */
const GLYPHS: Record<MistakeGrade, string> = {
  playable: '!?',
  inaccuracy: '?!',
  mistake: '?',
}

/** The letters Lichess uses for the four brushes chessground ships with. */
const BRUSH_LETTERS: Record<string, Brush> = { G: 'green', R: 'red', B: 'blue', Y: 'yellow' }
const BRUSH_CODES: Record<Brush, string> = { green: 'G', red: 'R', blue: 'B', yellow: 'Y' }

/** The header tags that describe the course rather than one chapter. */
const COURSE_TAGS = [
  'CourseId',
  'CourseTitle',
  'StudentColour',
  'Tagline',
  'FormatVersion',
  'TagExtensions',
] as const

/* ------------------------------------------------------------------ reading */

/**
 * Reads a bundle into the shape `loadCourse` takes.
 *
 * Nothing here decides whether the course is any good. It decides whether the
 * file says what a course needs, and hands the rest on.
 */
export function pgnToCourse(text: string): BundleRead {
  const errors: ContentError[] = []
  const parsed = parsePgn(text)

  const courseId =
    parsed.games.find((game) => game.tags.CourseId)?.tags.CourseId ?? 'bundle'
  const fail = (message: string, chapter = 'the bundle', path = '') =>
    errors.push({ course: courseId, chapter, path, message })

  for (const error of parsed.errors) {
    fail(
      error.line ? `line ${error.line}: ${error.message}` : error.message,
      error.game ? `game ${error.game}` : 'the bundle',
    )
  }
  if (errors.length) return { ok: false, manifest: null, files: {}, errors }

  if (!parsed.games.length) {
    fail('there is no game in this file, so there is no chapter in it either')
    return { ok: false, manifest: null, files: {}, errors }
  }

  // Course identity is repeated on every game so that a single extracted
  // chapter still knows what it belongs to. That only works if they agree.
  const first = parsed.games[0]
  for (const [index, game] of parsed.games.entries()) {
    for (const tag of COURSE_TAGS) {
      const here = game.tags[tag]
      const there = first.tags[tag]
      if (here !== there) {
        fail(
          `[${tag}] is "${here ?? 'missing'}" here and "${there ?? 'missing'}" in the first ` +
            'game. Course details are repeated on every game and have to match.',
          chapterName(game, index),
        )
      }
    }
  }

  for (const tag of ['CourseId', 'CourseTitle', 'StudentColour', 'Tagline'] as const) {
    if (!first.tags[tag]) fail(`every game needs a [${tag} "..."] header tag`)
  }

  const colour = first.tags.StudentColour
  if (colour && colour !== 'white' && colour !== 'black') {
    fail(`[StudentColour "${colour}"] has to be "white" or "black"`)
  }

  const versionTag = first.tags.FormatVersion
  const formatVersion = versionTag === undefined ? COURSE_FORMAT_VERSION : Number(versionTag)
  if (versionTag !== undefined && !Number.isInteger(formatVersion)) {
    fail(`[FormatVersion "${versionTag}"] has to be a whole number`)
  }

  const files: Record<string, unknown> = {}
  const chapters: string[] = []
  const seen = new Set<string>()

  for (const [index, game] of parsed.games.entries()) {
    const id = game.tags.ChapterId
    const title = game.tags.ChapterTitle
    const where = chapterName(game, index)
    if (!id) {
      fail('this game needs a [ChapterId "..."] header tag', where)
      continue
    }
    if (!title) fail('this game needs a [ChapterTitle "..."] header tag', where)
    if (seen.has(id)) {
      fail(`two games both call themselves [ChapterId "${id}"]`, where)
      continue
    }
    seen.add(id)

    const chapter = readChapter(game, id, title ?? id, courseId, errors)
    files[`${id}.json`] = chapter
    chapters.push(`${id}.json`)
  }

  const manifest: CourseManifest = {
    id: first.tags.CourseId ?? '',
    title: first.tags.CourseTitle ?? '',
    colour: colour === 'black' ? 'black' : 'white',
    tagline: first.tags.Tagline ?? '',
    formatVersion,
    chapters,
  }
  const extensions = splitWords(first.tags.TagExtensions)
  if (extensions.length) manifest.tagExtensions = extensions

  return { ok: errors.length === 0, manifest, files, errors }
}

/** A name for this game in an error message, before its id is known to be usable. */
function chapterName(game: PgnGame, index: number): string {
  return game.tags.ChapterId || `game ${index + 1}`
}

/** One game into one chapter file. */
function readChapter(
  game: PgnGame,
  id: string,
  title: string,
  courseId: string,
  errors: ContentError[],
): Chapter {
  // The stem is the run of moves before anything is said about them. A tree
  // node always carries a note, so the first annotated move is where the
  // chapter's own content starts, and that makes the split reversible.
  let split = 0
  while (
    split < game.moves.length &&
    !game.moves[split].comment &&
    !game.moves[split].glyph &&
    !game.moves[split].variations.length
  ) {
    split += 1
  }

  const chapter: Chapter = {
    id,
    title,
    intro: game.intro ?? '',
    stem: game.moves.slice(0, split).map((move) => move.san),
    tree: readLine(game.moves.slice(split), courseId, id, [], errors),
  }
  const defaults = splitWords(game.tags.DefaultTags)
  if (defaults.length) chapter.defaultTags = defaults
  return chapter
}

/**
 * A line of PGN moves into the nodes it describes.
 *
 * A line is a chain: each move is the child of the one before it. What makes it
 * a tree is the variations, which are alternatives to the move they follow, so
 * they become that move's siblings - or, when they carry a glyph, its mistake
 * entries.
 */
function readLine(
  moves: PgnMove[],
  courseId: string,
  chapterId: string,
  trail: string[],
  errors: ContentError[],
): Node[] {
  if (!moves.length) return []
  const [head, ...rest] = moves
  const path = [...trail, head.san]
  const fail = (message: string) =>
    errors.push({ course: courseId, chapter: chapterId, path: path.join(' '), message })

  const node: Node = { san: head.san }
  const parsedComment = readComment(head.comment, fail)
  Object.assign(node, parsedComment)

  const siblings: Node[] = []
  for (const variation of head.variations) {
    const start = variation[0]
    const glyph = start.glyph
    if (!glyph) {
      // No glyph: a real alternative, and a sibling of this move.
      siblings.push(...readLine(variation, courseId, chapterId, trail, errors))
      continue
    }
    const grade = GRADES[glyph]
    if (!grade) {
      errors.push({
        course: courseId,
        chapter: chapterId,
        path: [...trail, start.san].join(' '),
        message:
          `"${start.san}${glyph}" uses a glyph a bundle has no meaning for. A graded ` +
          'alternative is marked ? for a mistake, ?! for an inaccuracy or !? for playable.',
      })
      continue
    }
    if (variation.length > 1) {
      errors.push({
        course: courseId,
        chapter: chapterId,
        path: [...trail, start.san].join(' '),
        message:
          `the graded alternative "${start.san}${glyph}" is followed by more moves, and a ` +
          'course has nowhere to keep them. Put the refutation in the comment instead.',
      })
      continue
    }
    const mistake: Mistake = {
      san: start.san,
      grade,
      note: readComment(start.comment, fail).note ?? '',
    }
    node.mistakes = [...(node.mistakes ?? []), mistake]
  }

  const children = readLine(rest, courseId, chapterId, path, errors)
  if (children.length) node.children = children

  return [node, ...siblings]
}

/** What a token found inside a comment adds to a node. */
type CommentFields = Pick<
  Node,
  'note' | 'tags' | 'weight' | 'plan' | 'name' | 'variant' | 'shapes'
>

/**
 * A comment into a note and the fields its tokens name.
 *
 * Every token is optional, and a comment with nothing but prose in it is a
 * note. That is the promise the format makes to a chess player who has never
 * heard of any of this: write what you would write anyway.
 */
export function readComment(
  comment: string | null,
  fail: (message: string) => void,
): CommentFields {
  const fields: CommentFields = {}
  if (comment === null) return fields

  const shapes: Shape[] = []
  let note = ''
  let at = 0

  while (at < comment.length) {
    if (comment.startsWith('[%', at)) {
      const end = comment.indexOf(']', at)
      if (end === -1) {
        fail('a [% token in a comment that is never closed with ]')
        note += comment.slice(at)
        break
      }
      const body = comment.slice(at + 2, end)
      const space = body.indexOf(' ')
      const name = (space === -1 ? body : body.slice(0, space)).trim()
      const value = space === -1 ? '' : body.slice(space + 1).trim()
      applyToken(name, value, fields, shapes, fail)
      at = end + 1
      continue
    }
    note += comment[at]
    at += 1
  }

  const text = note.replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').trim()
  if (text) fields.note = text
  if (shapes.length) fields.shapes = shapes
  return fields
}

function applyToken(
  name: string,
  value: string,
  fields: CommentFields,
  shapes: Shape[],
  fail: (message: string) => void,
): void {
  switch (name) {
    case 'tags': {
      const tags = splitWords(value)
      if (tags.length) fields.tags = tags
      return
    }
    case 'weight': {
      const weight = Number(value)
      if (!Number.isInteger(weight)) {
        fail(`[%weight ${value}] has to be a whole number from 1 to 10`)
        return
      }
      fields.weight = weight
      return
    }
    case 'plan': {
      if (value) fields.plan = value
      return
    }
    case 'line': {
      if (value) fields.name = value
      return
    }
    case 'variant': {
      if (value) fields.variant = value
      return
    }
    case 'cal': {
      for (const arrow of splitList(value)) {
        const brush = BRUSH_LETTERS[arrow[0]]
        if (!brush || arrow.length < 5) {
          fail(`[%cal ${arrow}] is not a colour letter followed by two squares`)
          continue
        }
        shapes.push({ orig: arrow.slice(1, 3), dest: arrow.slice(3, 5), brush })
      }
      return
    }
    case 'csl': {
      for (const circle of splitList(value)) {
        const brush = BRUSH_LETTERS[circle[0]]
        if (!brush || circle.length < 3) {
          fail(`[%csl ${circle}] is not a colour letter followed by a square`)
          continue
        }
        shapes.push({ orig: circle.slice(1, 3), brush })
      }
      return
    }
    default:
      // Lichess writes clock and evaluation tokens into study comments and
      // they mean nothing here. Dropping them silently is right: refusing a
      // bundle because it remembers how long a move took would be absurd.
      return
  }
}

function splitWords(value: string | undefined): string[] {
  return (value ?? '').split(/[\s,]+/).filter(Boolean)
}

function splitList(value: string): string[] {
  return value.split(/[\s,]+/).filter(Boolean)
}

/* ------------------------------------------------------------------ writing */

/**
 * Writes a loaded course out as a bundle.
 *
 * The inverse of the reader, and the round-trip test in bundle.test.ts is what
 * keeps the two in step: export every bundled course, read it back, and it has
 * to be the same course.
 */
export function courseToPgn(course: LoadedCourse): BundleWrite {
  const errors: ContentError[] = []
  const games = course.chapters.map((chapter) => writeChapter(course, chapter, errors))
  return { ok: errors.length === 0, text: games.join('\n\n'), errors }
}

function writeChapter(
  course: LoadedCourse,
  chapter: LoadedChapter,
  errors: ContentError[],
): string {
  const fail = (message: string, path = '') =>
    errors.push({ course: course.id, chapter: chapter.fileId, path, message })

  const header: string[] = [
    pgnTag('CourseId', course.id),
    pgnTag('CourseTitle', course.title),
    pgnTag('StudentColour', course.colour),
    pgnTag('Tagline', course.tagline),
    pgnTag('FormatVersion', String(course.formatVersion)),
  ]
  const extensions = course.tags.filter((name) => !CORE.has(name))
  if (extensions.length) header.push(pgnTag('TagExtensions', extensions.join(' ')))
  header.push(pgnTag('ChapterId', chapter.fileId), pgnTag('ChapterTitle', chapter.title))
  if (chapter.defaultTags?.length) header.push(pgnTag('DefaultTags', chapter.defaultTags.join(' ')))

  const out = new Movetext()
  if (chapter.intro) out.comment(checkedProse(chapter.intro, 'the chapter intro', fail))
  for (const [index, san] of chapter.stem.entries()) out.move(san, index)
  writeLine(chapter.tree, out, chapter.defaultTags ?? [], fail)
  out.token('*')

  return `${header.join('\n')}\n\n${out.text()}\n`
}

/**
 * One list of sibling nodes.
 *
 * The first is the mainline and the rest are variations of it, which is the
 * same relationship the tree already holds: siblings are the alternatives at
 * that point. Mistake entries are variations too, carrying a glyph.
 */
function writeLine(
  nodes: LoadedNode[],
  out: Movetext,
  defaults: string[],
  fail: (message: string, path?: string) => void,
): void {
  if (!nodes.length) return
  const [main, ...alternatives] = nodes

  out.move(main.san, main.ply)
  const comment = nodeComment(main, defaults, fail)
  if (comment) out.comment(comment)

  for (const mistake of main.mistakes ?? []) {
    out.open()
    out.move(`${mistake.san}${GLYPHS[mistake.grade]}`, main.ply)
    if (mistake.note) out.comment(checkedProse(mistake.note, `the note on ${mistake.san}`, fail))
    out.close()
  }
  for (const alternative of alternatives) {
    out.open()
    writeLine([alternative], out, defaults, fail)
    out.close()
  }

  writeLine(main.children, out, defaults, fail)
}

/** The comment for one node: its note, then whatever tokens it needs. */
function nodeComment(
  node: LoadedNode,
  defaults: string[],
  fail: (message: string, path?: string) => void,
): string {
  const path = node.path.join(' ')
  const parts: string[] = []
  if (node.note) parts.push(checkedProse(node.note, `the note on ${node.san}`, fail))
  // Tags that are just the chapter's defaults are left out: the reader applies
  // the same defaults, so writing them would only make the file longer.
  if (node.tags.length && !sameWords(node.tags, defaults)) {
    parts.push(`[%tags ${node.tags.join(' ')}]`)
  }
  if (node.weight !== undefined) parts.push(`[%weight ${node.weight}]`)
  if (node.variant !== undefined) parts.push(`[%variant ${node.variant}]`)
  if (node.plan) {
    const plan = checkedProse(node.plan, `the plan on ${node.san}`, fail)
    if (plan.includes(']')) {
      fail(
        'a plan cannot contain a closing bracket, because the [%plan ...] token ends at one',
        path,
      )
    }
    parts.push(`[%plan ${plan}]`)
  }
  if (node.name) {
    const name = checkedProse(node.name, `the name on ${node.san}`, fail)
    if (name.includes(']')) {
      fail(
        'a line name cannot contain a closing bracket, because the [%line ...] token ends at one',
        path,
      )
    }
    parts.push(`[%line ${name}]`)
  }
  parts.push(...shapeTokens(node.shapes ?? []))
  return parts.join(' ')
}

/**
 * The shape tokens for one node, in the order the author drew them.
 *
 * Arrows and circles have separate tokens, so the obvious thing is to write all
 * the circles and then all the arrows. The round trip caught that: the London's
 * chapter 7 draws an arrow and then a circle, and grouping them silently
 * reordered the pair. Consecutive shapes of a kind share a token instead, which
 * keeps the order and still writes what Lichess writes for the common case of
 * all one kind.
 */
function shapeTokens(shapes: Shape[]): string[] {
  const tokens: string[] = []
  let run: Shape[] = []
  const flush = () => {
    if (!run.length) return
    const arrows = run[0].dest !== undefined
    const body = run
      .map((shape) => `${BRUSH_CODES[shape.brush]}${shape.orig}${shape.dest ?? ''}`)
      .join(',')
    tokens.push(`[%${arrows ? 'cal' : 'csl'} ${body}]`)
    run = []
  }
  for (const shape of shapes) {
    if (run.length && (run[0].dest !== undefined) !== (shape.dest !== undefined)) flush()
    run.push(shape)
  }
  flush()
  return tokens
}

/**
 * Prose has to survive being a PGN comment.
 *
 * A brace would end the comment early and a `[%` would be read back as a token,
 * so both are refused here rather than written and lost. SPEC.md section 11
 * asks for a clear message rather than a silent truncation, and this is where
 * that promise is kept for the writing half.
 */
function checkedProse(
  text: string,
  what: string,
  fail: (message: string, path?: string) => void,
): string {
  if (text.includes('{') || text.includes('}')) {
    fail(`${what} contains a brace, and prose in a bundle cannot: a comment ends at one`)
  }
  if (text.includes('[%')) {
    fail(`${what} contains "[%", which would be read back as one of the bundle's own tokens`)
  }
  return text
}

const CORE = new Set<string>(CORE_TAGS)

function sameWords(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((word, index) => word === b[index])
}

