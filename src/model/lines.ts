import { courseOfChapterId } from './ids'
import type { LoadedChapter, LoadedCourse, LoadedNode } from './types'

/**
 * Lines: one root-to-leaf path through a chapter tree.
 *
 * A line is what Study walks through and what the learnt toggle marks. Drill
 * builds its cards from the White moves of learnt lines, so this module is the
 * bridge between the content model and the trainee's own progress.
 */

export interface Line {
  /** Stable identity: chapter id plus the full move path. */
  id: string
  chapterId: string
  /** The nodes from the tree root down to the leaf, in order. */
  nodes: LoadedNode[]
  /** The last node of the line. */
  leaf: LoadedNode
  /** Every SAN move from the initial position, stem included. */
  path: string[]
  /** A short label for lists: the moves after the stem, numbered. */
  label: string
}

/**
 * The identity of a line. It is built from the moves themselves, so it survives
 * a chapter being reordered but changes when the moves change - which is right,
 * because a different move is a different line to learn.
 */
export function lineId(chapterId: string, path: string[]): string {
  return `${chapterId}:${path.join(' ')}`
}

/** Every root-to-leaf line in a chapter, in authored order. */
export function chapterLines(chapter: LoadedChapter): Line[] {
  const out: Line[] = []

  const visit = (nodes: LoadedNode[], trail: LoadedNode[]) => {
    for (const node of nodes) {
      const next = [...trail, node]
      if (node.isLeaf) {
        out.push({
          id: lineId(chapter.id, node.path),
          chapterId: chapter.id,
          nodes: next,
          leaf: node,
          path: node.path,
          label: moveList(next),
        })
      } else {
        visit(node.children, next)
      }
    }
  }

  visit(chapter.tree, [])
  return out
}

/**
 * The moves of a line after the stem, written the way a book would: "3...Bd6
 * 4.Bg3 O-O". The first move carries its number even when Black played it.
 */
export function moveList(nodes: LoadedNode[]): string {
  const parts: string[] = []
  nodes.forEach((node, index) => {
    const moveNumber = Math.floor(node.ply / 2) + 1
    if (node.colour === 'white') parts.push(`${moveNumber}.${node.san}`)
    else if (index === 0) parts.push(`${moveNumber}...${node.san}`)
    else parts.push(node.san)
  })
  return parts.join(' ')
}

/** The full move number a node belongs to: ply 0 and 1 are both move 1. */
export function fullMoveNumber(node: LoadedNode): number {
  return Math.floor(node.ply / 2) + 1
}

/** Every line of every chapter, in course order. */
export function allLines(chapters: LoadedChapter[]): Line[] {
  return chapters.flatMap(chapterLines)
}

/** Every line id in a course, which is what the progress file remembers. */
export function courseLineIds(course: LoadedCourse): Set<string> {
  return new Set(allLines(course.chapters).map((line) => line.id))
}

/**
 * How many of the trainee's learnt lines a course still has.
 *
 * A line id carries its own moves, so replacing a course with a different
 * version of itself can orphan what the trainee has learnt: the id stays in
 * the progress file, resolves to nothing, and shows as neither learnt nor
 * available. SPEC.md section 11 puts that count in front of them before
 * anything is written, which is the check review gate 10 relied on, moved to
 * where the person making the decision can see it.
 */
export function survivingLines(
  course: LoadedCourse,
  learnt: string[],
): { kept: number; total: number; lost: string[] } {
  const mine = learnt.filter((id) => courseOfChapterId(id) === course.id)
  const ids = courseLineIds(course)
  const lost = mine.filter((id) => !ids.has(id))
  return { kept: mine.length - lost.length, total: mine.length, lost }
}

/**
 * Walks a chapter down a SAN path, returning the chain of nodes it passes
 * through, or null when the path leaves the tree. Study uses this to restore a
 * position from a line id.
 */
export function nodesForPath(chapter: LoadedChapter, path: string[]): LoadedNode[] | null {
  const moves = path.slice(chapter.stem.length)
  const chain: LoadedNode[] = []
  let level = chapter.tree
  for (const san of moves) {
    const found = level.find((node) => node.san === san)
    if (!found) return null
    chain.push(found)
    level = found.children
  }
  return chain
}
