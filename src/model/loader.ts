import { Chess } from 'chess.js'
import { qualifyChapterId } from './ids'
import { positionKey } from './position'
import {
  BRUSHES,
  DEFAULT_VARIANT,
  MISTAKE_GRADES,
  colourName,
  otherColour,
  type Brush,
  type Chapter,
  type ChapterContext,
  type Colour,
  type ContentError,
  type LoadResult,
  type LoadedChapter,
  type LoadedNode,
  type MistakeGrade,
  type Node,
} from './types'

/**
 * Loads and validates one authored chapter. See docs/content-schema.md.
 *
 * Every error is collected rather than thrown, so a content pass shows all the
 * problems at once. Pure TypeScript: Study, Drill and Play share this.
 *
 * The rules are written in terms of the STUDENT and the OPPONENT rather than
 * White and Black, because a course teaches one colour and it need not be
 * White. Which colour a node belongs to still falls out of ply parity, since
 * White always moves first; whether it is the student's is that colour compared
 * with the course's. Everything authored on a move - the variant, the tags, the
 * wrong tries - sits on the student's moves, and the frequency weights sit on
 * the opponent's.
 */

const CHAPTER_FIELDS = new Set(['id', 'title', 'intro', 'defaultTags', 'stem', 'tree'])
const NODE_FIELDS = new Set([
  'san',
  'note',
  'variant',
  'weight',
  'plan',
  'tags',
  'mistakes',
  'shapes',
  'children',
])
const MISTAKE_FIELDS = new Set(['san', 'grade', 'note'])
const SHAPE_FIELDS = new Set(['orig', 'dest', 'brush'])
const SQUARE = /^[a-h][1-8]$/

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === 'string'

/** Collects errors while walking one chapter. */
class Errors {
  readonly list: ContentError[] = []
  private readonly course: string
  private readonly chapter: string

  constructor(course: string, chapter: string) {
    this.course = course
    this.chapter = chapter
  }

  add(path: string[], message: string): void {
    this.list.push({
      course: this.course,
      chapter: this.chapter,
      path: path.join(' '),
      message,
    })
  }

  get any(): boolean {
    return this.list.length > 0
  }
}

/**
 * The two roles at a chapter's positions, with the colour names to say them in.
 * Built once per chapter so every rule below reads the same way.
 */
interface Roles {
  student: Colour
  opponent: Colour
  studentName: string
  opponentName: string
  tags: string[]
}

function rolesFor(context: ChapterContext): Roles {
  const opponent = otherColour(context.colour)
  return {
    student: context.colour,
    opponent,
    studentName: colourName(context.colour),
    opponentName: colourName(opponent),
    tags: context.tags,
  }
}

/**
 * Validates and loads a chapter read from JSON.
 *
 * @param raw the parsed JSON, of unknown shape
 * @param context the course above this chapter: its id, the student's colour,
 * and the tag vocabulary it allows
 */
export function loadChapter(raw: unknown, context: ChapterContext): LoadResult {
  const source = context.source ?? 'unknown'
  const fileId = isObject(raw) && isString(raw.id) ? raw.id : source
  const errors = new Errors(context.courseId, fileId)
  const roles = rolesFor(context)

  if (!isObject(raw)) {
    errors.add([], 'chapter must be a JSON object')
    return { ok: false, chapter: null, errors: errors.list }
  }

  for (const field of Object.keys(raw)) {
    if (!CHAPTER_FIELDS.has(field)) errors.add([], `unknown chapter field "${field}"`)
  }
  if (!isString(raw.id)) errors.add([], 'id must be a string')
  if (!isString(raw.title)) errors.add([], 'title must be a string')
  if (!isString(raw.intro)) errors.add([], 'intro must be a string')
  if (!Array.isArray(raw.stem) || !raw.stem.every(isString)) {
    errors.add([], 'stem must be an array of SAN strings')
  }
  if (!Array.isArray(raw.tree)) errors.add([], 'tree must be an array of nodes')

  const defaultTags = readTags(raw.defaultTags, roles, errors, [], 'defaultTags')

  if (errors.any) return { ok: false, chapter: null, errors: errors.list }

  const chapter = raw as unknown as Chapter

  // Walk the stem first: everything downstream depends on reaching its position.
  const chess = new Chess()
  const stemPath: string[] = []
  for (const san of chapter.stem) {
    if (!playMove(chess, san)) {
      errors.add(stemPath, `stem move "${san}" is not legal here`)
      return { ok: false, chapter: null, errors: errors.list }
    }
    stemPath.push(san)
  }
  const stemFen = chess.fen()

  const tree = walk(chapter.tree, stemFen, chapter.stem.length, stemPath, defaultTags, roles, errors)

  if (errors.any) return { ok: false, chapter: null, errors: errors.list }

  const loaded: LoadedChapter = {
    id: qualifyChapterId(context.courseId, chapter.id),
    fileId: chapter.id,
    courseId: context.courseId,
    title: chapter.title,
    intro: chapter.intro,
    defaultTags,
    stem: chapter.stem,
    stemFen,
    tree,
  }
  return { ok: true, chapter: loaded, errors: [] }
}

/**
 * Plays a SAN move, returning the squares it moved between, or null rather than
 * throwing when the move is illegal.
 */
function playMove(chess: Chess, san: string): { from: string; to: string } | null {
  try {
    const move = chess.move(san)
    return { from: move.from, to: move.to }
  } catch {
    return null
  }
}

/** True when `san` is legal in the given position. */
function isLegal(fen: string, san: string): boolean {
  return playMove(new Chess(fen), san) !== null
}

function walk(
  nodes: unknown[],
  parentFen: string,
  ply: number,
  parentPath: string[],
  defaultTags: string[],
  roles: Roles,
  errors: Errors,
): LoadedNode[] {
  // White always moves first, so parity still gives the colour. Whether it is
  // the student's move is that colour against the course's.
  const colour: Colour = ply % 2 === 0 ? 'white' : 'black'
  const isStudent = colour === roles.student
  const loaded: LoadedNode[] = []
  const variantsSeen = new Map<string, string>()
  const opponentSeen = new Set<string>()

  for (const raw of nodes) {
    if (!isObject(raw)) {
      errors.add(parentPath, 'node must be a JSON object')
      continue
    }
    const san = raw.san
    if (!isString(san)) {
      errors.add(parentPath, 'san must be a string')
      continue
    }
    const path = [...parentPath, san]

    for (const field of Object.keys(raw)) {
      if (!NODE_FIELDS.has(field)) errors.add(path, `unknown node field "${field}"`)
    }

    const chess = new Chess(parentFen)
    const squares = playMove(chess, san)
    if (!squares) {
      errors.add(path, `"${san}" is not legal in this position`)
      continue
    }
    const fen = chess.fen()

    const node: LoadedNode = {
      ...(raw as unknown as Node),
      fen,
      parentFen,
      from: squares.from,
      to: squares.to,
      key: positionKey(parentFen),
      ply,
      colour,
      isStudent,
      path,
      tags: [],
      isLeaf: true,
      children: [],
    }

    checkNote(raw, isStudent, roles, path, errors)
    checkPlan(raw, roles, path, errors)
    node.tags = checkTags(raw, isStudent, roles, path, defaultTags, errors)
    checkWeight(raw, isStudent, roles, path, errors)
    checkMistakes(raw, isStudent, roles, parentFen, path, errors)
    checkShapes(raw, path, errors)
    const variant = checkVariant(raw, isStudent, roles, path, errors)

    // Two opponent siblings playing the same move is always a duplicated
    // branch: the student's siblings get the variant rule, these get this one.
    if (!isStudent) {
      if (opponentSeen.has(san)) {
        errors.add(path, `two ${roles.opponentName} replies play "${san}" here`)
      }
      opponentSeen.add(san)
    }

    if (isStudent && variant) {
      const clash = variantsSeen.get(variant)
      if (clash !== undefined) {
        errors.add(
          path,
          `two ${roles.studentName} moves share the variant "${variant}" here: "${clash}" and "${san}"`,
        )
      } else {
        variantsSeen.set(variant, san)
      }
    }

    const children = raw.children
    if (children !== undefined) {
      if (!Array.isArray(children)) {
        errors.add(path, 'children must be an array of nodes')
      } else if (children.length > 0) {
        node.children = walk(children, fen, ply + 1, path, defaultTags, roles, errors)
        node.isLeaf = false
      }
    }

    loaded.push(node)
  }

  return loaded
}

function checkNote(
  raw: Record<string, unknown>,
  isStudent: boolean,
  roles: Roles,
  path: string[],
  errors: Errors,
) {
  const note = raw.note
  if (note === undefined) {
    // Every move teaches something: the idea for the student's, what the
    // opponent is doing for theirs. Required on both since 2026-08-28 (it was
    // optional on the opponent's moves in v1, which left the student guessing
    // at half of them).
    errors.add(
      path,
      isStudent
        ? `${roles.studentName} moves need a note saying the idea`
        : `${roles.opponentName} moves need a note saying what ${roles.opponentName} is doing`,
    )
    return
  }
  if (!isString(note) || note.trim() === '') errors.add(path, 'note must be a non-empty string')
}

function checkPlan(
  raw: Record<string, unknown>,
  roles: Roles,
  path: string[],
  errors: Errors,
) {
  const isLeaf = !Array.isArray(raw.children) || raw.children.length === 0
  const plan = raw.plan
  if (plan === undefined) {
    if (isLeaf) {
      errors.add(path, `leaves need a plan saying how ${roles.studentName} continues`)
    }
    return
  }
  if (!isString(plan) || plan.trim() === '') errors.add(path, 'plan must be a non-empty string')
}

function checkVariant(
  raw: Record<string, unknown>,
  isStudent: boolean,
  roles: Roles,
  path: string[],
  errors: Errors,
): string | null {
  const variant = raw.variant
  if (variant === undefined) return isStudent ? DEFAULT_VARIANT : null
  if (!isStudent) {
    errors.add(path, `variant belongs on ${roles.studentName} moves only`)
    return null
  }
  if (!isString(variant) || variant.trim() === '') {
    errors.add(path, 'variant must be a non-empty string')
    return null
  }
  return variant
}

function checkWeight(
  raw: Record<string, unknown>,
  isStudent: boolean,
  roles: Roles,
  path: string[],
  errors: Errors,
) {
  const weight = raw.weight
  if (weight === undefined) return
  if (isStudent) {
    errors.add(path, `weight belongs on ${roles.opponentName} moves only`)
    return
  }
  if (typeof weight !== 'number' || !Number.isInteger(weight) || weight < 1 || weight > 10) {
    errors.add(path, 'weight must be a whole number from 1 to 10')
  }
}

function checkTags(
  raw: Record<string, unknown>,
  isStudent: boolean,
  roles: Roles,
  path: string[],
  defaultTags: string[],
  errors: Errors,
): string[] {
  if (raw.tags === undefined) return isStudent ? defaultTags : []
  if (!isStudent) {
    errors.add(path, `tags belong on ${roles.studentName} moves only`)
    return []
  }
  return readTags(raw.tags, roles, errors, path, 'tags')
}

/** Shared by chapter defaultTags and node tags. */
function readTags(
  value: unknown,
  roles: Roles,
  errors: Errors,
  path: string[],
  field: string,
): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) {
    errors.add(path, `${field} must be an array of tags`)
    return []
  }
  const tags: string[] = []
  for (const tag of value) {
    if (!isString(tag)) {
      errors.add(path, `${field} must contain strings`)
      continue
    }
    if (!roles.tags.includes(tag)) {
      errors.add(path, `"${tag}" is not in the concept tag vocabulary`)
      continue
    }
    tags.push(tag)
  }
  return tags
}

function checkMistakes(
  raw: Record<string, unknown>,
  isStudent: boolean,
  roles: Roles,
  parentFen: string,
  path: string[],
  errors: Errors,
) {
  const mistakes = raw.mistakes
  if (mistakes === undefined) return
  if (!isStudent) {
    errors.add(path, `mistakes belong on ${roles.studentName} moves only`)
    return
  }
  if (!Array.isArray(mistakes)) {
    errors.add(path, 'mistakes must be an array')
    return
  }
  for (const entry of mistakes) {
    if (!isObject(entry)) {
      errors.add(path, 'each mistake must be a JSON object')
      continue
    }
    for (const field of Object.keys(entry)) {
      if (!MISTAKE_FIELDS.has(field)) errors.add(path, `unknown mistake field "${field}"`)
    }
    const san = entry.san
    if (!isString(san)) {
      errors.add(path, 'mistake san must be a string')
      continue
    }
    // A mistake is a wrong choice INSTEAD of this move, so it starts from the
    // same position this move was played from.
    if (!isLegal(parentFen, san)) {
      errors.add(path, `mistake "${san}" is not legal in this position`)
    }
    if (!isString(entry.grade) || !MISTAKE_GRADES.includes(entry.grade as MistakeGrade)) {
      errors.add(path, `mistake "${san}" needs a grade of playable, inaccuracy or mistake`)
    }
    if (!isString(entry.note) || entry.note.trim() === '') {
      errors.add(path, `mistake "${san}" needs a note saying why it is wrong`)
    }
  }
}

function checkShapes(raw: Record<string, unknown>, path: string[], errors: Errors) {
  const shapes = raw.shapes
  if (shapes === undefined) return
  if (!Array.isArray(shapes)) {
    errors.add(path, 'shapes must be an array')
    return
  }
  for (const shape of shapes) {
    if (!isObject(shape)) {
      errors.add(path, 'each shape must be a JSON object')
      continue
    }
    for (const field of Object.keys(shape)) {
      if (!SHAPE_FIELDS.has(field)) errors.add(path, `unknown shape field "${field}"`)
    }
    if (!isString(shape.orig) || !SQUARE.test(shape.orig)) {
      errors.add(path, 'shape orig must be a square like f4')
    }
    if (shape.dest !== undefined && (!isString(shape.dest) || !SQUARE.test(shape.dest))) {
      errors.add(path, 'shape dest must be a square like f4')
    }
    if (!isString(shape.brush) || !BRUSHES.includes(shape.brush as Brush)) {
      errors.add(path, `shape brush must be one of ${BRUSHES.join(', ')}`)
    }
  }
}

/** Every node of a loaded chapter, depth first, in authored order. */
export function walkNodes(chapter: LoadedChapter): LoadedNode[] {
  const out: LoadedNode[] = []
  const visit = (nodes: LoadedNode[]) => {
    for (const node of nodes) {
      out.push(node)
      visit(node.children)
    }
  }
  visit(chapter.tree)
  return out
}

/** How many nodes the chapter holds. */
export function nodeCount(chapter: LoadedChapter): number {
  return walkNodes(chapter).length
}

/**
 * The deepest line in full moves, counting from the start of the game. A line
 * ending on White's 12th move reports 12.
 */
export function deepestFullMove(chapter: LoadedChapter): number {
  const plies = walkNodes(chapter).map((node) => node.ply + 1)
  const deepest = plies.length > 0 ? Math.max(...plies) : chapter.stem.length
  return Math.ceil(deepest / 2)
}

/** Positions carrying at least one authored mistake entry. */
export function positionsWithMistakes(chapter: LoadedChapter): number {
  return walkNodes(chapter).filter((node) => (node.mistakes?.length ?? 0) > 0).length
}
