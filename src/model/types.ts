/**
 * The content model. See docs/content-schema.md for the authored shape and the
 * rules the validator enforces. Nothing here imports React: Study, Drill and
 * Play all consume these types.
 */

/** How bad a listed wrong move is. Drill maps these onto FSRS ratings. */
export type MistakeGrade = 'playable' | 'inaccuracy' | 'mistake'

/** Colours, in the wording chessground uses. */
export type Colour = 'white' | 'black'

/** Arrow and circle colours chessground ships with. */
export type Brush = 'green' | 'red' | 'blue' | 'yellow'

/** A common wrong try at a position, with the reason it is wrong. */
export interface Mistake {
  san: string
  grade: MistakeGrade
  note: string
}

/** An authored board highlight: a circle when `dest` is absent, else an arrow. */
export interface Shape {
  orig: string
  dest?: string
  brush: Brush
}

/** One authored move in a chapter tree. */
export interface Node {
  san: string
  note?: string
  variant?: string
  weight?: number
  plan?: string
  tags?: string[]
  mistakes?: Mistake[]
  shapes?: Shape[]
  children?: Node[]
}

/** One authored chapter file in content/. */
export interface Chapter {
  id: string
  title: string
  intro: string
  defaultTags?: string[]
  stem: string[]
  tree: Node[]
}

/** A node after the loader has walked it: authored fields plus computed ones. */
export interface LoadedNode extends Node {
  /** The position after this move. */
  fen: string
  /** The position this move was played from - where a drill card asks. */
  parentFen: string
  /** parentFen without the move counters: card identity across chapters. */
  key: string
  /** stem.length + depth. */
  ply: number
  /** Whose move this is, from ply parity. */
  colour: Colour
  /** SAN moves from the initial position up to and including this one. */
  path: string[]
  /** The author's tags, or the chapter's defaults. */
  tags: string[]
  isLeaf: boolean
  children: LoadedNode[]
}

/** A chapter after loading. */
export interface LoadedChapter extends Omit<Chapter, 'tree'> {
  /** The position at the end of the stem, where the tree starts. */
  stemFen: string
  tree: LoadedNode[]
}

/** One thing wrong with authored content. */
export interface ContentError {
  /** The chapter id, or the filename when the id itself is unusable. */
  chapter: string
  /** SAN path to the offending node, joined with spaces. Empty at chapter level. */
  path: string
  message: string
}

/** The result of loading one chapter: either the chapter or every error found. */
export type LoadResult =
  | { ok: true; chapter: LoadedChapter; errors: [] }
  | { ok: false; chapter: null; errors: ContentError[] }

/**
 * The controlled concept-tag vocabulary (SPEC.md section 4). Extending it needs a
 * line in the change log of docs/content-schema.md saying why.
 */
export const TAGS = [
  'development',
  'king-safety',
  'bishop-placement',
  'e4-break',
  'c4-break',
  'kingside-attack',
  'dark-squares',
  'h-file',
  'vs-c5',
  'vs-qb6',
  'vs-kid',
  'vs-gruenfeld',
  'vs-bf5',
  'vs-dutch',
  'tactics',
  'endgame',
] as const

export type Tag = (typeof TAGS)[number]

export const MISTAKE_GRADES: MistakeGrade[] = ['playable', 'inaccuracy', 'mistake']

export const BRUSHES: Brush[] = ['green', 'red', 'blue', 'yellow']

/** The move order all v1 content uses. */
export const DEFAULT_VARIANT = 'modern'
