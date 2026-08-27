import { describe, expect, it } from 'vitest'
import { LAST_MOVE_BRUSH, nodeShapes } from './shapes'
import type { LoadedNode, Shape } from './types'

function node(from: string, to: string, shapes?: Shape[]): LoadedNode {
  return {
    san: 'Bf4',
    fen: '',
    parentFen: '',
    from,
    to,
    key: '',
    ply: 2,
    colour: 'white',
    path: ['d4', 'd5', 'Bf4'],
    tags: [],
    isLeaf: true,
    children: [],
    shapes,
  }
}

describe('nodeShapes', () => {
  it('draws nothing at the start of a chapter', () => {
    expect(nodeShapes(undefined)).toEqual([])
  })

  it('draws an arrow for the move just played', () => {
    expect(nodeShapes(node('c1', 'f4'))).toEqual([
      { orig: 'c1', dest: 'f4', brush: LAST_MOVE_BRUSH },
    ])
  })

  it('keeps the authored shapes after the arrow', () => {
    const authored: Shape[] = [
      { orig: 'e5', brush: 'green' },
      { orig: 'f1', dest: 'f3', brush: 'red' },
    ]
    expect(nodeShapes(node('f2', 'f4', authored))).toEqual([
      { orig: 'f2', dest: 'f4', brush: LAST_MOVE_BRUSH },
      ...authored,
    ])
  })

  it("draws one arrow, in the author's colour, when they repeat the move", () => {
    const authored: Shape[] = [{ orig: 'c1', dest: 'f4', brush: 'green' }]
    expect(nodeShapes(node('c1', 'f4', authored))).toEqual([
      { orig: 'c1', dest: 'f4', brush: 'green' },
    ])
  })

  it('still draws the other authored shapes alongside a repeated arrow', () => {
    const authored: Shape[] = [
      { orig: 'c1', dest: 'f4', brush: 'green' },
      { orig: 'd4', brush: 'green' },
    ]
    expect(nodeShapes(node('c1', 'f4', authored))).toEqual([
      { orig: 'c1', dest: 'f4', brush: 'green' },
      { orig: 'd4', brush: 'green' },
    ])
  })

  it('does not treat a circle on the origin square as the move arrow', () => {
    const authored: Shape[] = [{ orig: 'c1', brush: 'red' }]
    expect(nodeShapes(node('c1', 'f4', authored))).toEqual([
      { orig: 'c1', dest: 'f4', brush: LAST_MOVE_BRUSH },
      { orig: 'c1', brush: 'red' },
    ])
  })
})
