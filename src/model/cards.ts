import { cardKey } from './ids'
import { chapterLines } from './lines'
import type { LoadedChapter, LoadedNode, Mistake } from './types'

/**
 * Drill cards, built from the lines the trainee has marked learnt.
 *
 * A card is one question: here is a position, you are to move, what does the
 * repertoire play? So there is one card per student move of a learnt line.
 *
 * Cards are keyed by course and position, and deduplicated inside the course.
 * The London reaches the same setup through many move orders, so without the
 * dedup the trainee would answer 3.e3 a dozen times a session and learn nothing
 * from the repetition.
 *
 * The course half of the key is what stops two repertoires blurring together
 * (SPEC.md section 10). One position can turn up in two courses meaning two
 * different things, and a single schedule across both would claim the trainee
 * knows a move they have never been asked for.
 */

/**
 * Just enough of a course to build cards from.
 *
 * A `LoadedCourse` fits it. So does one chapter of one, which is how the
 * Progress view counts a chapter's own work without losing the course id that
 * the card keys hang off.
 */
export interface CardSource {
  id: string
  chapters: LoadedChapter[]
}

export interface Card {
  /** Card identity: the course, then the position with the move counters stripped. */
  key: string
  /** The course this card belongs to. */
  courseId: string
  /** The position half of the key, on its own. */
  position: string
  /** The position to show. The student is to move. */
  fen: string
  /** The move the repertoire plays. */
  san: string
  /** Where that move runs, for showing the answer on the board. */
  from: string
  to: string
  /** Why it is the move. */
  note?: string
  /** On a leaf, what to do next. */
  plan?: string
  /** The wrong tries the author listed here, with their grades. */
  mistakes: Mistake[]
  /** Concept tags, merged from every line this card came from. */
  tags: string[]
  /** The chapters this position turns up in, in course order. */
  chapterIds: string[]
  /** The learnt lines this card belongs to. */
  lineIds: string[]
  /** How the move reads in a sentence: "3.e3", or "3...Bf5" for a Black course. */
  label: string
}

/**
 * Two chapters asking the same position but expecting different moves. The
 * repertoire should have one answer per position, so this is a content fault
 * rather than something to paper over at runtime.
 *
 * Within one course only. Two courses disagreeing about a position is not a
 * fault: it is two repertoires, and each keeps its own card.
 */
export interface CardConflict {
  key: string
  fen: string
  /** The move that was kept: the first one, in course order. */
  kept: string
  keptChapter: string
  /** The move that disagreed. */
  other: string
  otherChapter: string
}

export interface CardSet {
  cards: Card[]
  conflicts: CardConflict[]
}

/**
 * Every card the learnt lines of one course produce.
 *
 * @param course the course, or a slice of one
 * @param learntLineIds the line ids the trainee has ticked, across every course
 */
export function buildCards(course: CardSource, learntLineIds: Iterable<string>): CardSet {
  const learnt = new Set(learntLineIds)
  const byKey = new Map<string, Card>()
  const conflicts: CardConflict[] = []

  for (const chapter of course.chapters) {
    for (const line of chapterLines(chapter)) {
      if (!learnt.has(line.id)) continue
      for (const node of line.nodes) {
        if (!node.isStudent) continue
        const key = cardKey(course.id, node.key)
        const existing = byKey.get(key)
        if (!existing) {
          byKey.set(key, cardFor(key, node, course.id, chapter, line.id))
          continue
        }
        if (existing.san !== node.san) {
          conflicts.push({
            key,
            fen: node.parentFen,
            kept: existing.san,
            keptChapter: existing.chapterIds[0],
            other: node.san,
            otherChapter: chapter.id,
          })
          continue
        }
        merge(existing, node, chapter, line.id)
      }
    }
  }

  return { cards: [...byKey.values()], conflicts }
}

/**
 * Every card a whole course could ever produce, learnt or not. The Progress
 * view uses it for totals, and the content suite for the conflict check.
 */
export function allCards(course: CardSource): CardSet {
  const everyLine = course.chapters.flatMap((chapter) => chapterLines(chapter)).map((l) => l.id)
  return buildCards(course, everyLine)
}

/**
 * Cards from every course at once, which is what the drill queue asks for.
 *
 * One queue across all courses is Nick's ruling (SPEC.md section 10): due is
 * due, whichever repertoire it belongs to. Conflicts stay per course, so two
 * courses teaching different moves in one position produce two cards and no
 * complaint.
 */
export function buildCardsAcross(
  courses: CardSource[],
  learntLineIds: Iterable<string>,
): CardSet {
  const learnt = [...learntLineIds]
  const sets = courses.map((course) => buildCards(course, learnt))
  return {
    cards: sets.flatMap((set) => set.cards),
    conflicts: sets.flatMap((set) => set.conflicts),
  }
}

function cardFor(
  key: string,
  node: LoadedNode,
  courseId: string,
  chapter: LoadedChapter,
  lineId: string,
): Card {
  return {
    key,
    courseId,
    position: node.key,
    fen: node.parentFen,
    san: node.san,
    from: node.from,
    to: node.to,
    note: node.note,
    plan: node.isLeaf ? node.plan : undefined,
    mistakes: [...(node.mistakes ?? [])],
    tags: [...node.tags],
    chapterIds: [chapter.id],
    lineIds: [lineId],
    label: moveLabel(node),
  }
}

/** "3.e3" for a White move, "3...Bf5" for a Black one, the way a book writes it. */
export function moveLabel(node: LoadedNode): string {
  const number = Math.floor(node.ply / 2) + 1
  return node.colour === 'white' ? `${number}.${node.san}` : `${number}...${node.san}`
}

/**
 * Folds another sighting of the same position into the card already held.
 *
 * Tags and mistakes are unions: a position that two chapters teach carries
 * everything either chapter said about it, so the weak-area stats and the
 * feedback are as complete as the content allows.
 */
function merge(card: Card, node: LoadedNode, chapter: LoadedChapter, lineId: string): void {
  for (const tag of node.tags) if (!card.tags.includes(tag)) card.tags.push(tag)
  for (const mistake of node.mistakes ?? []) {
    if (!card.mistakes.some((held) => held.san === mistake.san)) card.mistakes.push(mistake)
  }
  if (!card.chapterIds.includes(chapter.id)) card.chapterIds.push(chapter.id)
  if (!card.lineIds.includes(lineId)) card.lineIds.push(lineId)
  // The first note wins, but a later leaf can supply a plan the first had not.
  if (!card.note && node.note) card.note = node.note
  if (!card.plan && node.isLeaf && node.plan) card.plan = node.plan
}
