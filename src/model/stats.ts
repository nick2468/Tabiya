import { buildCards, type Card } from './cards'
import { chapterLines } from './lines'
import { dueCount, newCount } from './queue'
import {
  courseTags,
  isLearnt,
  tagAccuracy,
  tagAnswerCount,
  type PlayRecord,
  type ProgressState,
} from '../storage/progress'
import type { LoadedCourse } from './types'

/**
 * The label for games that were not aimed at a chapter.
 *
 * Not 'Any defence': in a Black course the opponent is the side choosing an
 * opening, so the word only fits half the courses this app now carries.
 */
export const ANY_LINE = 'Any line'

/**
 * The numbers behind the Progress view. Plain counts, no scores out of ten and
 * no badges: the point is to show what has been done and what is going badly,
 * so the trainee can decide what to do next.
 *
 * Everything here is per course. Weak areas especially: pooling two courses'
 * accuracy would let a strong repertoire hide a weak one behind an average
 * that describes neither (SPEC.md section 10). Phase 7's Progress view stacks
 * these rollups; nothing here has to know how many courses there are.
 */

export interface ChapterProgress {
  id: string
  title: string
  /** Lines marked learnt, out of every line in the chapter. */
  learnt: number
  lines: number
  /** Cards from this chapter's learnt lines that are due now. */
  due: number
  /** Cards from this chapter's learnt lines never yet answered. */
  fresh: number
}

export interface ConceptAccuracy {
  tag: string
  /** From 0 to 1, or null when the concept has not been drilled yet. */
  accuracy: number | null
  /** How many answers the rolling window holds. */
  answers: number
  /** How many cards in the learnt set carry this concept. */
  cards: number
}

/** One row per chapter of one course, in course order. */
export function chapterProgress(
  course: LoadedCourse,
  state: ProgressState,
  now: Date = new Date(),
): ChapterProgress[] {
  return course.chapters.map((chapter) => {
    const lines = chapterLines(chapter)
    const learntLines = lines.filter((line) => isLearnt(state, line.id))
    // Cards are built from this chapter alone, so a position shared with
    // another chapter is still counted here: this is the chapter's own work.
    const { cards } = buildCards(
      { id: course.id, chapters: [chapter] },
      learntLines.map((line) => line.id),
    )
    return {
      id: chapter.id,
      title: chapter.title,
      learnt: learntLines.length,
      lines: lines.length,
      due: dueCount(cards, state, now),
      fresh: newCount(cards, state),
    }
  })
}

/**
 * One row per concept one course's learnt cards carry, worst first.
 *
 * Concepts with no answers yet sit at the bottom rather than the top: nothing
 * has gone wrong with them, they simply have not come up.
 *
 * @param cards any card list; the ones from other courses are ignored, so the
 * cross-course drill set can be handed straight in
 */
export function conceptAccuracy(
  course: LoadedCourse,
  cards: Card[],
  state: ProgressState,
): ConceptAccuracy[] {
  const counts = new Map<string, number>()
  for (const card of cards) {
    if (card.courseId !== course.id) continue
    for (const tag of card.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  // A concept drilled in the past still belongs on the list even if no learnt
  // card carries it now, because its history is what the filter reads.
  for (const tag of courseTags(state, course.id)) {
    if (!counts.has(tag)) counts.set(tag, 0)
  }

  return [...counts.entries()]
    .map(([tag, cardCount]) => ({
      tag,
      accuracy: tagAccuracy(state, course.id, tag),
      answers: tagAnswerCount(state, course.id, tag),
      cards: cardCount,
    }))
    .sort((a, b) => {
      if (a.accuracy === null && b.accuracy === null) return a.tag.localeCompare(b.tag)
      if (a.accuracy === null) return 1
      if (b.accuracy === null) return -1
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy
      return a.tag.localeCompare(b.tag)
    })
}

/** Course-wide totals for the top of the Progress view. */
export interface CourseTotals {
  learntLines: number
  totalLines: number
  cards: number
  due: number
  fresh: number
}

export function courseTotals(
  course: LoadedCourse,
  cards: Card[],
  state: ProgressState,
  now: Date = new Date(),
): CourseTotals {
  const lines = course.chapters.flatMap(chapterLines)
  const own = cards.filter((card) => card.courseId === course.id)
  return {
    learntLines: lines.filter((line) => isLearnt(state, line.id)).length,
    totalLines: lines.length,
    cards: own.length,
    due: dueCount(own, state, now),
    fresh: newCount(own, state),
  }
}

/** What the Progress view shows about games played. */
export interface PlayStats {
  games: number
  /** Games where the student was the first to leave the repertoire. */
  deviations: number
  /** From 0 to 1, or null when no games have been played. */
  deviationRate: number | null
  /** The average full move number where the student left, when it happened. */
  averageDeviationMove: number | null
  /** Games against each chapter, in course order, plus the untargeted ones. */
  byChapter: { id: string; title: string; games: number; deviations: number }[]
}

export function playStats(courses: LoadedCourse[], state: ProgressState): PlayStats {
  const games = state.playGames
  const chapters = courses.flatMap((course) => course.chapters)
  const deviated = games.filter((game) => game.deviated)
  const moves = deviated
    .map((game) => game.deviationMove)
    .filter((move): move is number => typeof move === 'number')

  const byChapter = chapters.map((chapter) => {
    const played = games.filter((game) => game.chapterId === chapter.id)
    return {
      id: chapter.id,
      title: chapter.title,
      games: played.length,
      deviations: played.filter((game) => game.deviated).length,
    }
  })

  const untargeted = games.filter((game) => !game.chapterId)
  if (untargeted.length > 0) {
    byChapter.push({
      id: 'any',
      title: ANY_LINE,
      games: untargeted.length,
      deviations: untargeted.filter((game) => game.deviated).length,
    })
  }

  return {
    games: games.length,
    deviations: deviated.length,
    deviationRate: games.length > 0 ? deviated.length / games.length : null,
    averageDeviationMove:
      moves.length > 0 ? moves.reduce((sum, move) => sum + move, 0) / moves.length : null,
    byChapter,
  }
}

export type { PlayRecord }
