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
  /**
   * Games played against the course, with the engine on the course's side.
   * Counted in `games` and said apart, because "you left the repertoire
   * first" is not a sentence that can be about one of them.
   */
  otherSide: number
  /** Games where the student was the first to leave the repertoire. */
  deviations: number
  /**
   * From 0 to 1, or null when no games have been played. Over the games the
   * trainee played the course's side: a game where the engine played the
   * repertoire cannot count as one the trainee stayed in.
   */
  deviationRate: number | null
  /** The average full move number where the student left, when it happened. */
  averageDeviationMove: number | null
  /** Games against each chapter, in course order, plus the untargeted ones. */
  byChapter: { id: string; title: string; games: number; deviations: number }[]
}

export function playStats(courses: LoadedCourse[], state: ProgressState): PlayStats {
  const games = state.playGames
  const chapters = courses.flatMap((course) => course.chapters)
  const otherSide = games.filter((game) => game.side === 'other')
  const own = games.filter((game) => game.side !== 'other')
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
    otherSide: otherSide.length,
    deviations: deviated.length,
    deviationRate: own.length > 0 ? deviated.length / own.length : null,
    averageDeviationMove:
      moves.length > 0 ? moves.reduce((sum, move) => sum + move, 0) / moves.length : null,
    byChapter,
  }
}

/** One line a game followed, and how many games followed it. */
export interface LinePlayed {
  id: string
  /** What the line is called, as the Study table prints it. */
  name: string
  chapterTitle: string
  games: number
}

/**
 * Whether a game played a line: the two agree for the whole of the shorter one.
 *
 * Three cases, and they are all the same test. A game that ran past the leaf
 * played the line and then kept going. A game that stopped inside the line
 * played into it. A game that played something else at ply n did not play it,
 * however far it agreed before that.
 *
 * The consequence worth being honest about: a game that stopped in a trunk
 * several lines share counts for every one of them, because it did play into
 * every one of them. The Progress hint says so, or the numbers would surprise.
 */
export function playedLine(sans: string[], path: string[]): boolean {
  const shorter = Math.min(sans.length, path.length)
  if (shorter === 0) return false
  for (let index = 0; index < shorter; index += 1) {
    if (sans[index] !== path[index]) return false
  }
  return true
}

/**
 * How many plies of a line a game must play before it is THAT line.
 *
 * Lines share their opening moves, and a game that stops in the shared part
 * has not chosen between them. The fork is the first ply after which no other
 * line of the course has the same moves; a game has reached the line once it
 * has played that ply. Nick ruled 2026-09-03 that only the lines a game
 * reached count, after seeing a three move game counted for eleven lines.
 */
export function forkDepth(path: string[], others: string[][]): number {
  let depth = 0
  for (const other of others) {
    if (other === path) continue
    let shared = 0
    while (shared < path.length && shared < other.length && path[shared] === other[shared]) {
      shared += 1
    }
    // The ply that parts them is the one after the shared run.
    depth = Math.max(depth, Math.min(shared + 1, path.length))
  }
  return depth
}

/**
 * The lines of one course that games have followed, most played first.
 *
 * A game counts for a line it never left AND got far enough into to have
 * chosen it: past the ply where the line parts from every other line in the
 * course. A game that stops in a trunk several lines share counts for none of
 * them, because it did not get as far as any one of them.
 *
 * Only games of THIS course, and only games that kept their moves. A game
 * recorded before phase 24 has no `sans` and counts for nothing, which the
 * screen says rather than leaving a trainee with fifty games wondering.
 */
export function linesPlayed(course: LoadedCourse, state: ProgressState): LinePlayed[] {
  // Not games played against the course. The engine played the line in
  // those, and crediting the trainee with a line the engine played would make
  // this table say the opposite of what it is for.
  const games = state.playGames.filter(
    (game) =>
      game.courseId === course.id &&
      game.side !== 'other' &&
      game.sans &&
      game.sans.length > 0,
  )
  if (games.length === 0) return []

  const every = course.chapters.flatMap((chapter) => chapterLines(chapter).map((line) => line.path))
  const rows: LinePlayed[] = []
  for (const chapter of course.chapters) {
    for (const line of chapterLines(chapter)) {
      const reached = forkDepth(line.path, every)
      const played = games.filter(
        (game) =>
          (game.sans ?? []).length >= reached && playedLine(game.sans ?? [], line.path),
      ).length
      if (played > 0) {
        rows.push({ id: line.id, name: line.name, chapterTitle: chapter.title, games: played })
      }
    }
  }
  return rows.sort((a, b) => b.games - a.games || a.name.localeCompare(b.name))
}

/** True when any game of this course kept its moves, so the section is worth showing. */
export function anyGameRecorded(course: LoadedCourse, state: ProgressState): boolean {
  return state.playGames.some(
    (game) => game.courseId === course.id && game.sans && game.sans.length > 0,
  )
}

export type { PlayRecord }
