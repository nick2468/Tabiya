import { describe, expect, it } from 'vitest'
import { activeLineIndex, containsChain, nextOnLine, walkedOn } from './study-lines'
import { chapterLines } from '../model/lines'
import { loadFixture } from '../test/fixtures'
import type { LoadedChapter } from '../model/types'

/**
 * 1.d4 d5 2.Bf4, then three lines. Two share 2...Nf6 3.e3 and split at Black's
 * third move; the third takes a different reply at move two. That is the shape
 * the highlight rule exists for: a shared prefix, then a branch.
 */
function fixture(): LoadedChapter {
  return loadFixture({
    id: 'ch-test',
    title: 'Test chapter',
    intro: 'Typical mistakes: rushing.',
    stem: ['d4', 'd5', 'Bf4'],
    tree: [
      {
        san: 'Nf6',
        note: 'A Black reply in the fixture.',
        weight: 8,
        children: [
          {
            san: 'e3',
            note: 'Complete the triangle.',
            children: [
              {
                san: 'e6',
                note: 'A Black reply in the fixture.',
                weight: 7,
                children: [
                  { san: 'Nf3', note: 'Develop.', name: 'The ...e6 line', plan: 'Bd3 and c3.' },
                ],
              },
              {
                san: 'c5',
                note: 'A Black reply in the fixture.',
                weight: 6,
                children: [{ san: 'c3', note: 'Hold d4.', name: 'The ...c5 line', plan: 'Nbd2.' }],
              },
            ],
          },
        ],
      },
      {
        san: 'e6',
        note: 'The other Black reply in the fixture.',
        weight: 5,
        children: [
          { san: 'e3', note: 'The same setup.', name: 'The 2...e6 line', plan: 'Nf3 next.' },
        ],
      },
    ],
  })
}

const lines = chapterLines(fixture())
const [viaE6, viaC5, other] = lines

/** The nodes of a line, as a chain of the first `depth` moves. */
const chainOf = (index: number, depth: number) => lines[index].nodes.slice(0, depth)

describe('which line the table highlights', () => {
  it('keeps the chosen line while every move played is still inside it', () => {
    // Two moves in, the ...e6 and ...c5 lines are still the same moves.
    expect(activeLineIndex(lines, chainOf(0, 2), 0)).toBe(0)
    expect(activeLineIndex(lines, chainOf(0, 2), 1)).toBe(1)
  })

  it('falls to the first line that does contain them once a branch is taken', () => {
    // 2...Nf6 3.e3 c5 leaves the ...e6 line, so the highlight follows.
    expect(activeLineIndex(lines, chainOf(1, 3), 0)).toBe(1)
  })

  it('names the whole line, not the moves', () => {
    expect(viaE6.name).toBe('The ...e6 line')
    expect(viaC5.name).toBe('The ...c5 line')
    expect(other.name).toBe('The 2...e6 line')
  })

  it('counts how far along a line the moves reach, for the progress colouring', () => {
    expect(walkedOn(viaE6, chainOf(0, 3))).toBe(3)
    // The ...c5 line shares the first two moves and no more.
    expect(walkedOn(viaC5, chainOf(0, 3))).toBe(2)
    expect(containsChain(viaC5, chainOf(0, 3))).toBe(false)
  })

  it('keeps the chosen line when the board is back at the start', () => {
    // A row click clears the chain, and every line contains no moves at all.
    expect(activeLineIndex(lines, [], 2)).toBe(2)
    expect(activeLineIndex(lines, [], 1)).toBe(1)
  })
})

describe('stepping forward', () => {
  it('follows the chosen line rather than the first child', () => {
    // Both branches start 2...Nf6 3.e3. Standing there with the ...c5 line
    // chosen, the next move is ...c5, not the first child ...e6.
    expect(nextOnLine(lines, chainOf(1, 2), 1)?.san).toBe('c5')
    expect(nextOnLine(lines, chainOf(0, 2), 0)?.san).toBe('e6')
  })

  it('has nothing next at the end of a line, which is what disables the buttons', () => {
    expect(nextOnLine(lines, viaE6.nodes, 0)).toBeUndefined()
  })

  it('walks a line from the start to its leaf, one move at a time', () => {
    let chain = chainOf(1, 0)
    for (let step = 0; step < 10; step += 1) {
      const move = nextOnLine(lines, chain, 1)
      if (!move) break
      chain = [...chain, move]
    }
    expect(chain).toEqual(viaC5.nodes)
  })
})
