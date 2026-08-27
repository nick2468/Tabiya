import { Chess } from 'chess.js'
import { positionKey } from './position'
import {
  BRUSHES,
  DEFAULT_VARIANT,
  MISTAKE_GRADES,
  TAGS,
  type Brush,
  type Chapter,
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
  private readonly chapter: string

  constructor(chapter: string) {
    this.chapter = chapter
  }

  add(path: string[], message: string): void {
    this.list.push({ chapter: this.chapter, path: path.join(' '), message })
  }

  get any(): boolean {
    return this.list.length > 0
  }
}

/**
 * Validates and loads a chapter read from JSON.
 *
 * @param raw the parsed JSON, of unknown shape
 * @param source a name for error messages when `raw.id` is missing or unusable
 */
export function loadChapter(raw: unknown, source = 'unknown'): LoadResult {
  const id = isObject(raw) && isString(raw.id) ? raw.id : source
  const errors = new Errors(id)

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

  const defaultTags = readTags(raw.defaultTags, errors, [], 'defaultTags')

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

  const tree = walk(chapter.tree, stemFen, chapter.stem.length, stemPath, defaultTags, errors)

  if (errors.any) return { ok: false, chapter: null, errors: errors.list }

  const loaded: LoadedChapter = {
    id: chapter.id,
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
  errors: Errors,
): LoadedNode[] {
  const colour = ply % 2 === 0 ? 'white' : 'black'
  const loaded: LoadedNode[] = []
  const variantsSeen = new Map<string, string>()
  const blackSeen = new Set<string>()

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
      path,
      tags: [],
      isLeaf: true,
      children: [],
    }

    checkNote(raw, colour, path, errors)
    checkPlan(raw, path, errors)
    node.tags = checkTags(raw, colour, path, defaultTags, errors)
    checkWeight(raw, colour, path, errors)
    checkMistakes(raw, colour, parentFen, path, errors)
    checkShapes(raw, path, errors)
    const variant = checkVariant(raw, colour, path, errors)

    // Two Black siblings playing the same move is always a duplicated branch:
    // White siblings get the variant rule, Black siblings get this one.
    if (colour === 'black') {
      if (blackSeen.has(san)) errors.add(path, `two Black replies play "${san}" here`)
      blackSeen.add(san)
    }

    if (colour === 'white' && variant) {
      const clash = variantsSeen.get(variant)
      if (clash !== undefined) {
        errors.add(
          path,
          `two White moves share the variant "${variant}" here: "${clash}" and "${san}"`,
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
        node.children = walk(children, fen, ply + 1, path, defaultTags, errors)
        node.isLeaf = false
      }
    }

    loaded.push(node)
  }

  return loaded
}

function checkNote(raw: Record<string, unknown>, colour: string, path: string[], errors: Errors) {
  const note = raw.note
  if (note === undefined) {
    if (colour === 'white') errors.add(path, 'White moves need a note saying the idea')
    return
  }
  if (!isString(note) || note.trim() === '') errors.add(path, 'note must be a non-empty string')
}

function checkPlan(raw: Record<string, unknown>, path: string[], errors: Errors) {
  const isLeaf = !Array.isArray(raw.children) || raw.children.length === 0
  const plan = raw.plan
  if (plan === undefined) {
    if (isLeaf) errors.add(path, 'leaves need a plan saying how White continues')
    return
  }
  if (!isString(plan) || plan.trim() === '') errors.add(path, 'plan must be a non-empty string')
}

function checkVariant(
  raw: Record<string, unknown>,
  colour: string,
  path: string[],
  errors: Errors,
): string | null {
  const variant = raw.variant
  if (variant === undefined) return colour === 'white' ? DEFAULT_VARIANT : null
  if (colour !== 'white') {
    errors.add(path, 'variant belongs on White moves only')
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
  colour: string,
  path: string[],
  errors: Errors,
) {
  const weight = raw.weight
  if (weight === undefined) return
  if (colour !== 'black') {
    errors.add(path, 'weight belongs on Black moves only')
    return
  }
  if (typeof weight !== 'number' || !Number.isInteger(weight) || weight < 1 || weight > 10) {
    errors.add(path, 'weight must be a whole number from 1 to 10')
  }
}

function checkTags(
  raw: Record<string, unknown>,
  colour: string,
  path: string[],
  defaultTags: string[],
  errors: Errors,
): string[] {
  if (raw.tags === undefined) return colour === 'white' ? defaultTags : []
  if (colour !== 'white') {
    errors.add(path, 'tags belong on White moves only')
    return []
  }
  return readTags(raw.tags, errors, path, 'tags')
}

/** Shared by chapter defaultTags and node tags. */
function readTags(
  value: unknown,
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
    if (!(TAGS as readonly string[]).includes(tag)) {
      errors.add(path, `"${tag}" is not in the concept tag vocabulary`)
      continue
    }
    tags.push(tag)
  }
  return tags
}

function checkMistakes(
  raw: Record<string, unknown>,
  colour: string,
  parentFen: string,
  path: string[],
  errors: Errors,
) {
  const mistakes = raw.mistakes
  if (mistakes === undefined) return
  if (colour !== 'white') {
    errors.add(path, 'mistakes belong on White moves only')
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
