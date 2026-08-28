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
  /** The square the move started on, for the board's last-move arrow. */
  from: string
  /** The square the move ended on. */
  to: string
  /** parentFen without the move counters: card identity across chapters. */
  key: string
  /** stem.length + depth. */
  ply: number
  /** Whose move this is, from ply parity. */
  colour: Colour
  /** True when this is the student's own move, from the course's colour. */
  isStudent: boolean
  /** SAN moves from the initial position up to and including this one. */
  path: string[]
  /** The author's tags, or the chapter's defaults. */
  tags: string[]
  isLeaf: boolean
  children: LoadedNode[]
}

/** A chapter after loading. */
export interface LoadedChapter extends Omit<Chapter, 'tree'> {
  /** The course this chapter belongs to. */
  courseId: string
  /** The id as authored, before the course prefix. */
  fileId: string
  /** The position at the end of the stem, where the tree starts. */
  stemFen: string
  tree: LoadedNode[]
}

/** One thing wrong with authored content. */
export interface ContentError {
  /** The course the fault is in. */
  course: string
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
 * The concept tags every course shares (SPEC.md section 10). They describe
 * chess, not one opening, so they mean the same thing in every repertoire and
 * the Progress view can put two courses side by side.
 *
 * A course adds its own on top, declared in its manifest: the London's
 * vs-c5 and vs-kid say nothing about a Caro-Kann and would only clutter it.
 */
export const CORE_TAGS = [
  'development',
  'king-safety',
  'bishop-placement',
  'e4-break',
  'c4-break',
  'kingside-attack',
  'dark-squares',
  'h-file',
  'tactics',
  'endgame',
] as const

export type CoreTag = (typeof CORE_TAGS)[number]

export const MISTAKE_GRADES: MistakeGrade[] = ['playable', 'inaccuracy', 'mistake']

export const BRUSHES: Brush[] = ['green', 'red', 'blue', 'yellow']

/** The move order all v1 content uses. */
export const DEFAULT_VARIANT = 'modern'

/**
 * A course: one repertoire for one colour (SPEC.md section 10).
 *
 * The manifest is what turns a folder of chapter files into a course. It is
 * authored beside them as course.json, and it carries the two things the
 * chapter files cannot know on their own: which colour the student is playing,
 * and what the chapters are in course order.
 */
export interface CourseManifest {
  /** Globally unique, kebab case. Progress keys hang off it, so it never changes. */
  id: string
  title: string
  /** The student's colour. Everything else in the schema is relative to it. */
  colour: Colour
  /** One line for the catalog tile. */
  tagline: string
  /** The schema version the course is written to. */
  formatVersion: number
  /** The chapter filenames, in course order. */
  chapters: string[]
  /** Concept tags this course adds to the shared core set. */
  tagExtensions?: string[]
}

/** A course after loading, with every chapter walked and validated. */
export interface LoadedCourse extends Omit<CourseManifest, 'chapters' | 'tagExtensions'> {
  /** The full tag vocabulary: the core set plus this course's extensions. */
  tags: string[]
  /** The colour the student is not, which is the one the engine plays. */
  opponentColour: Colour
  chapters: LoadedChapter[]
}

/**
 * What the chapter loader needs to know about the course above it. Bundled
 * separately from the manifest so a single chapter can be loaded on its own,
 * which is what the loader tests do.
 */
export interface ChapterContext {
  /** Prefixes the chapter id, and through it every line id. */
  courseId: string
  /** The student's colour. */
  colour: Colour
  /** The tag vocabulary this course allows. */
  tags: string[]
  /** A name for error messages when the chapter's own id is unusable. */
  source?: string
}

/** The result of loading one course: the course, or every error found in it. */
export type CourseLoadResult =
  | { ok: true; course: LoadedCourse; errors: [] }
  | { ok: false; course: null; errors: ContentError[] }

/**
 * The course format this build understands. A course written to a newer one is
 * refused rather than half-read, the same rule the progress file follows: a
 * file from the future is not a file with a few unknown fields.
 */
export const COURSE_FORMAT_VERSION = 1

/** The other colour. */
export function otherColour(colour: Colour): Colour {
  return colour === 'white' ? 'black' : 'white'
}

/** "White" or "Black", for error messages and prose. */
export function colourName(colour: Colour): string {
  return colour === 'white' ? 'White' : 'Black'
}
