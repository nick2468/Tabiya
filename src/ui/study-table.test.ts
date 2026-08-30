import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LinesTable } from './Study'
import { walkedOn } from './study-lines'
import { chapterLines } from '../model/lines'
import { bundledCourses } from '../content'

/**
 * The lines table, rendered to a string.
 *
 * There is no DOM in this suite and this needs none: what is worth checking is
 * what the table SAYS. Rendered from the real London chapter 1, which is the
 * chapter Nick opened and could not read - all seven of its lines begin
 * "2...e6 3.e3 Nf6 4.Nf3", so the move column alone named nothing.
 */
const london = bundledCourses.find((course) => course.id === 'london-white')
if (!london) throw new Error('the London is not in the bundled set')
const chapter = london.chapters.find((entry) => entry.id.endsWith('ch1-classical'))
if (!chapter) throw new Error('the London has no classical chapter')
const lines = chapterLines(chapter)

/** Two moves into the main line: past the branch, inside four of the lines. */
const chain = lines[0].nodes.slice(0, 4)

function render(over: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    createElement(LinesTable, {
      lines,
      chain: [],
      active: 0,
      learntCount: 0,
      stepping: false,
      canStep: true,
      isLearnt: () => false,
      onToggle: () => {},
      onPick: () => {},
      onStep: () => {},
      ...over,
    } as never),
  )
}

describe('the lines table', () => {
  it('lists every line by name, not by its moves', () => {
    const html = render()
    expect(lines).toHaveLength(7)
    for (const line of lines) expect(html).toContain(line.name)
    expect(html).toContain('Black trades on g3')
  })

  it('puts the learnt count in its header', () => {
    expect(render({ learntCount: 2 })).toContain('2 of 7 learnt')
    expect(render()).toContain('0 of 7 learnt')
  })

  it('marks the highlighted row and no other', () => {
    const html = render({ active: 1 })
    expect(html.match(/<tr class="active"/g)).toHaveLength(1)
  })

  it('colours the moves already walked on the highlighted row alone', () => {
    const html = render({ chain, active: 0 })
    // Four moves walked, and they are the four in the accent class.
    expect(walkedOn(lines[0], chain)).toBe(4)
    expect(html.match(/class="walked"/g)).toHaveLength(4)
  })

  it('leaves a row that is not highlighted uncoloured, even where the moves match', () => {
    // Line 1 shares the first four moves, so only the highlight rule keeps it
    // from being coloured too.
    expect(walkedOn(lines[1], chain)).toBe(4)
    const html = render({ chain, active: 0 })
    // Split on the row tag: [0] is the head markup, [1] is the header row,
    // [2] is the highlighted line and [3] is the one below it.
    const rows = html.split('<tr')
    expect(rows[2]).toContain('walked')
    expect(rows[3]).not.toContain('walked')
  })

  it('names the stepping button after what it will do', () => {
    expect(render()).toContain('Auto step this line')
    expect(render({ stepping: true })).toContain('Stop stepping')
    expect(render({ canStep: false })).toContain('disabled')
  })
})
