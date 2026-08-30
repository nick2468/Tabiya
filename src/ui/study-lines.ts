import type { Line } from '../model/lines'
import type { LoadedNode } from '../model/types'

/**
 * Which line the Study table highlights, and where stepping goes next.
 *
 * The rule Nick settled on 2026-08-30: the highlighted row is the one he last
 * chose, for as long as every move played is still inside it. Step off it and
 * the highlight falls to the first line that does contain the moves, which is
 * where he now is. So the chosen row is state and the highlight is derived from
 * it, rather than the other way round.
 *
 * Nodes are compared by identity, not by move. Every chain and every line comes
 * from one loaded chapter, so the same move at the same point is the same
 * object - and two sibling moves can share a SAN when they carry different
 * variants, which a comparison by name would confuse.
 */

/** How many of the walked moves this line has, counting from the first. */
export function walkedOn(line: Line, chain: LoadedNode[]): number {
  let walked = 0
  while (walked < chain.length && walked < line.nodes.length && line.nodes[walked] === chain[walked]) {
    walked += 1
  }
  return walked
}

/** True when every move walked so far is still inside this line. */
export function containsChain(line: Line, chain: LoadedNode[]): boolean {
  return walkedOn(line, chain) === chain.length
}

/**
 * The highlighted line: the chosen one while it still holds the moves played,
 * else the first line that does. Every chain is a prefix of some line, because
 * every path down the tree ends at a leaf, so this always finds one; the chosen
 * index comes back unchanged only when the chapter has no lines at all.
 */
export function activeLineIndex(lines: Line[], chain: LoadedNode[], chosen: number): number {
  const current = lines[chosen]
  if (current && containsChain(current, chain)) return chosen
  const found = lines.findIndex((line) => containsChain(line, chain))
  return found === -1 ? chosen : found
}

/**
 * The next move along the highlighted line, or undefined at its end.
 *
 * Forward and Auto step both use this. They used to disagree: Forward took the
 * first child, so pressing it after choosing a row walked off into another line
 * without saying so.
 */
export function nextOnLine(lines: Line[], chain: LoadedNode[], chosen: number): LoadedNode | undefined {
  return lines[activeLineIndex(lines, chain, chosen)]?.nodes[chain.length]
}
