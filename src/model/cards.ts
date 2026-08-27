import { chapterLines } from './lines'
import type { LoadedChapter, LoadedNode, Mistake } from './types'

/**
 * Drill cards, built from the lines the trainee has marked learnt.
 *
 * A card is one question: here is a position, White to move, what does the
 * repertoire play? So there is one card per White move of a learnt line.
 *
 * Cards are keyed by position, not by line, and deduplicated across the whole
 * course. The London reaches the same setup through many move orders, so
 * without that the trainee would answer 3.e3 a dozen times a session and learn
 * nothing from the repetition.
 */

export interface Card {
  /** Card identity: the position, with the move counters stripped. */
  key: string
  /** The position to show. White is to move. */
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
  /** How the move reads in a sentence: "3.e3". */
  label: string
}

/**
 * Two chapters asking the same position but expecting different moves. The
 * repertoire should have one answer per position, so this is a content fault
 * rather than something to paper over at runtime.
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
 * Every card the learnt lines produce.
 *
 * @param chapters every chapter, in course order
 * @param learntLineIds the line ids the trainee has ticked
 */
export function buildCards(chapters: LoadedChapter[], learntLineIds: Iterable<string>): CardSet {
  const learnt = new Set(learntLineIds)
  const byKey = new Map<string, Card>()
  const conflicts: CardConflict[] = []

  for (const chapter of chapters) {
    for (const line of chapterLines(chapter)) {
      if (!learnt.has(line.id)) continue
      for (const node of line.nodes) {
        if (node.colour !== 'white') continue
        const existing = byKey.get(node.key)
        if (!existing) {
          byKey.set(node.key, cardFor(node, chapter, line.id))
          continue
        }
        if (existing.san !== node.san) {
          conflicts.push({
            key: node.key,
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
 * Every card the whole course could ever produce, learnt or not. The Progress
 * view uses it for totals, and the diagnostics view for the conflict check.
 */
export function allCards(chapters: LoadedChapter[]): CardSet {
  const everyLine = chapters.flatMap((chapter) => chapterLines(chapter)).map((line) => line.id)
  return buildCards(chapters, everyLine)
}

function cardFor(node: LoadedNode, chapter: LoadedChapter, lineId: string): Card {
  return {
    key: node.key,
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
    label: `${Math.floor(node.ply / 2) + 1}.${node.san}`,
  }
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
