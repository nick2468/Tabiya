import { describe, expect, it } from 'vitest'
import {
  deepestFullMove,
  loadChapter,
  nodeCount,
  positionsWithMistakes,
  walkNodes,
} from './loader'
import { positionKey } from './position'
import { BLACK_CHAPTER, blackContext, loadFixture, whiteContext } from '../test/fixtures'
import type { LoadedChapter } from './types'

/**
 * A small valid chapter reused across the tests: 1.d4 d5 2.Bf4, with a Black
 * branch so there is something to walk.
 */
function chapter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ch-test',
    title: 'Test chapter',
    intro: '# Test\n\n## Typical mistakes at this level\n\nRushing the attack.',
    stem: ['d4', 'd5'],
    tree: [
      {
        san: 'Bf4',
        note: 'Out with the bishop before e3 shuts it in. That is the London in one move.',
        tags: ['bishop-placement'],
        mistakes: [
          { san: 'Nf3', grade: 'playable', note: 'Sound, but it invites ...Bf5 first.' },
        ],
        shapes: [{ orig: 'c1', dest: 'f4', brush: 'green' }],
        children: [
          {
            san: 'Nf6',
            note: 'Black develops the knight.',
            weight: 8,
            children: [
              {
                san: 'e3',
                note: 'Complete the triangle and give the king a home.',
                name: 'The ...Nf6 line',
                plan: 'Develop with Nf3, Bd3 and c3, then castle short.',
              },
            ],
          },
          {
            san: 'c5',
            weight: 6,
            note: 'The critical try: Black hits the base of the triangle at once.',
            children: [
              {
                san: 'e3',
                note: 'Hold the centre. Black cannot win the d-pawn by force.',
                name: 'The ...c5 line',
                plan: 'Meet ...Qb6 with Nc3, keeping b2 defended by tactics rather than passivity.',
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  }
}

/** Loads the fixture and fails loudly if it did not load. */
function loadOk(raw: unknown): LoadedChapter {
  const result = loadChapter(raw, whiteContext())
  expect(result.errors).toEqual([])
  if (!result.ok) throw new Error('expected the chapter to load')
  return result.chapter
}

describe('loadChapter, valid content', () => {
  it('loads the fixture and attaches positions to every node', () => {
    const loaded = loadOk(chapter())
    const nodes = walkNodes(loaded)
    expect(nodes.map((n) => n.san)).toEqual(['Bf4', 'Nf6', 'e3', 'c5', 'e3'])
    for (const node of nodes) {
      expect(node.fen).toMatch(/^[rnbqkpRNBQKP1-8/]+ [wb] /)
      expect(node.key).toBe(positionKey(node.parentFen))
    }
  })

  it('works out whose move each node is from ply parity', () => {
    const loaded = loadOk(chapter())
    const byPath = new Map(walkNodes(loaded).map((n) => [n.path.join(' '), n]))
    expect(byPath.get('d4 d5 Bf4')?.colour).toBe('white')
    expect(byPath.get('d4 d5 Bf4 Nf6')?.colour).toBe('black')
    expect(byPath.get('d4 d5 Bf4 Nf6 e3')?.colour).toBe('white')
    expect(byPath.get('d4 d5 Bf4')?.ply).toBe(2)
  })

  it('records the parent position, which is where a drill card asks', () => {
    const loaded = loadOk(chapter())
    const bf4 = walkNodes(loaded).find((n) => n.san === 'Bf4')
    expect(bf4?.parentFen).toBe(loaded.stemFen)
    expect(bf4?.parentFen).toContain('rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w')
  })

  it('gives the same key to one position reached two ways', () => {
    // 1.d4 d5 2.Bf4 Nf6 3.e3 and 1.d4 Nf6 2.Bf4 d5 3.e3 are the same position.
    const viaD5 = loadOk(chapter())
    const viaNf6 = loadOk(
      chapter({
        stem: ['d4', 'Nf6'],
        tree: [
          {
            san: 'Bf4',
            note: 'The same setup, reached through the other move order.',
            children: [
              {
                san: 'd5',
                note: 'Black claims the centre.',
                weight: 7,
                children: [
                  {
                    san: 'e3',
                    note: 'Complete the triangle and give the king a home.',
                    name: 'The deep line',
                    plan: 'Develop with Nf3, Bd3 and c3, then castle short.',
                  },
                ],
              },
            ],
          },
        ],
      }),
    )
    const keyOf = (loaded: LoadedChapter, path: string) =>
      walkNodes(loaded).find((n) => n.path.join(' ') === path)?.key
    expect(keyOf(viaD5, 'd4 d5 Bf4 Nf6 e3')).toBe(keyOf(viaNf6, 'd4 Nf6 Bf4 d5 e3'))
  })

  it('falls back to the chapter default tags on White moves that set none', () => {
    const loaded = loadOk(chapter({ defaultTags: ['vs-c5'] }))
    const byPath = new Map(walkNodes(loaded).map((n) => [n.path.join(' '), n]))
    // Bf4 sets its own tags, so the defaults do not apply there.
    expect(byPath.get('d4 d5 Bf4')?.tags).toEqual(['bishop-placement'])
    expect(byPath.get('d4 d5 Bf4 Nf6 e3')?.tags).toEqual(['vs-c5'])
    // Black nodes never carry tags.
    expect(byPath.get('d4 d5 Bf4 Nf6')?.tags).toEqual([])
  })

  it('marks leaves and counts the chapter', () => {
    const loaded = loadOk(chapter())
    expect(nodeCount(loaded)).toBe(5)
    expect(walkNodes(loaded).filter((n) => n.isLeaf).map((n) => n.path.join(' '))).toEqual([
      'd4 d5 Bf4 Nf6 e3',
      'd4 d5 Bf4 c5 e3',
    ])
    // The deepest line ends on White's third move.
    expect(deepestFullMove(loaded)).toBe(3)
    expect(positionsWithMistakes(loaded)).toBe(1)
  })

  it('accepts an empty stem, so a chapter can start at move one', () => {
    const loaded = loadOk({
      id: 'ch-open',
      title: 'From the start',
      intro: 'Prose.',
      stem: [],
      tree: [
        {
          san: 'd4',
          note: 'The move order this repertoire uses.',
          name: 'The stemless line',
          plan: 'Answer almost anything with Bf4, e3, c3 and Nf3.',
        },
      ],
    })
    expect(loaded.tree[0].colour).toBe('white')
    expect(loaded.tree[0].ply).toBe(0)
  })
})

/** The message of the first error, for the negative cases below. */
function firstError(raw: unknown): string {
  const result = loadChapter(raw, whiteContext())
  expect(result.ok).toBe(false)
  return result.errors[0]?.message ?? ''
}

describe('loadChapter, negative fixtures', () => {
  it('rejects an illegal move', () => {
    const bad = chapter()
    bad.tree[0].san = 'Bf7'
    expect(firstError(bad)).toBe('"Bf7" is not legal in this position')
  })

  it('rejects an illegal stem move', () => {
    // The d4 pawn cannot move to an occupied d5.
    expect(firstError(chapter({ stem: ['d4', 'd5', 'd5'] }))).toContain('stem move "d5"')
  })

  it('rejects an illegal mistake entry', () => {
    const bad = chapter()
    bad.tree[0].mistakes = [{ san: 'Qh5', grade: 'mistake', note: 'The queen cannot get there.' }]
    expect(firstError(bad)).toBe('mistake "Qh5" is not legal in this position')
  })

  it('rejects a mistake entry with no grade', () => {
    const bad = chapter()
    bad.tree[0].mistakes = [{ san: 'Nf3', grade: 'dubious', note: 'Not a listed grade.' }]
    expect(firstError(bad)).toContain('needs a grade of playable, inaccuracy or mistake')
  })

  it('rejects a leaf with no plan', () => {
    const bad = chapter()
    delete (bad.tree[0].children![0].children![0] as Record<string, unknown>).plan
    expect(firstError(bad)).toBe('leaves need a plan saying how White continues')
  })

  it('rejects a plan on a move that is not a leaf', () => {
    const bad = chapter()
    ;(bad.tree[0] as Record<string, unknown>).plan = 'A plan nobody would ever see.'
    expect(firstError(bad)).toBe(
      'plan belongs on leaves only: this move continues, so its plan is the line below it',
    )
  })

  it('rejects a name on a move that is not a leaf', () => {
    const bad = chapter()
    ;(bad.tree[0] as Record<string, unknown>).name = 'Not a whole line'
    expect(firstError(bad)).toBe(
      'name belongs on leaves only: it names a whole line, and this move continues',
    )
  })

  it('rejects two lines in one chapter sharing a name', () => {
    const bad = chapter()
    ;(bad.tree[0].children![1].children![0] as Record<string, unknown>).name = 'The ...Nf6 line'
    expect(firstError(bad)).toContain('another line in this chapter is already called')
  })

  it('rejects a name too long for the lines table', () => {
    const bad = chapter()
    ;(bad.tree[0].children![0].children![0] as Record<string, unknown>).name = 'x'.repeat(41)
    expect(firstError(bad)).toContain('40 characters or fewer')
  })

  it('rejects a name holding the bracket that ends its own token', () => {
    const bad = chapter()
    ;(bad.tree[0].children![0].children![0] as Record<string, unknown>).name = 'The ...Nf6] line'
    expect(firstError(bad)).toContain('[%line ...] token ends at one')
  })

  it('rejects a White move with no note', () => {
    const bad = chapter()
    delete (bad.tree[0] as Record<string, unknown>).note
    expect(firstError(bad)).toBe('White moves need a note saying the idea')
  })

  it('rejects a Black move with no note', () => {
    const bad = chapter()
    delete (bad.tree[0].children![0] as Record<string, unknown>).note
    expect(firstError(bad)).toBe('Black moves need a note saying what Black is doing')
  })

  it('rejects two White siblings in the same variant', () => {
    const bad = chapter()
    bad.tree.push({
      san: 'Nf3',
      note: 'A second White move at the same point, which v1 does not allow.',
      name: 'The first branch',
      plan: 'Follow up with Bf4 anyway.',
    } as never)
    expect(firstError(bad)).toContain('two White moves share the variant "modern"')
  })

  it('accepts two White siblings once their variants differ', () => {
    const bad = chapter()
    bad.tree.push({
      san: 'Nf3',
      variant: 'classical',
      note: 'The classical move order, kept out of v1 content but allowed by the schema.',
      name: 'The classical branch',
      plan: 'Play Bf4 next.',
    } as never)
    expect(loadChapter(bad, whiteContext()).ok).toBe(true)
  })

  it('rejects two Black replies playing the same move', () => {
    const bad = chapter()
    bad.tree[0].children!.push({
      san: 'Nf6',
      note: 'A duplicated reply.',
      weight: 2,
      children: [
        {
          san: 'e3',
          note: 'A duplicated branch, which the validator must refuse.',
          name: 'The duplicated branch',
          plan: 'Never reached.',
        },
      ],
    } as never)
    expect(firstError(bad)).toContain('two Black replies play "Nf6"')
  })

  it('rejects a weight on a White move', () => {
    const bad = chapter()
    ;(bad.tree[0] as Record<string, unknown>).weight = 5
    expect(firstError(bad)).toBe('weight belongs on Black moves only')
  })

  it('rejects a weight outside one to ten', () => {
    const bad = chapter()
    bad.tree[0].children![0].weight = 12
    expect(firstError(bad)).toBe('weight must be a whole number from 1 to 10')
  })

  it('rejects a tag outside the vocabulary', () => {
    const bad = chapter()
    bad.tree[0].tags = ['bishop-placement', 'queenside-squeeze']
    expect(firstError(bad)).toBe('"queenside-squeeze" is not in the concept tag vocabulary')
  })

  it('rejects tags on a Black move', () => {
    const bad = chapter()
    ;(bad.tree[0].children![0] as Record<string, unknown>).tags = ['vs-c5']
    expect(firstError(bad)).toBe('tags belong on White moves only')
  })

  it('rejects an unknown field, so a typo cannot pass silently', () => {
    const bad = chapter()
    ;(bad.tree[0] as Record<string, unknown>).notes = 'Typo for note.'
    expect(firstError(bad)).toBe('unknown node field "notes"')
  })

  it('rejects a bad shape', () => {
    const bad = chapter()
    bad.tree[0].shapes = [{ orig: 'c9', dest: 'f4', brush: 'green' }]
    expect(firstError(bad)).toBe('shape orig must be a square like f4')
  })

  it('names the chapter and the path on every error', () => {
    const bad = chapter()
    bad.tree[0].san = 'Bf7'
    const result = loadChapter(bad, whiteContext())
    expect(result.errors[0].chapter).toBe('ch-test')
    expect(result.errors[0].path).toBe('d4 d5 Bf7')
  })

  it('collects every error rather than stopping at the first', () => {
    const bad = chapter()
    delete (bad.tree[0] as Record<string, unknown>).note
    delete (bad.tree[0].children![0].children![0] as Record<string, unknown>).plan
    expect(loadChapter(bad, whiteContext()).errors.length).toBe(2)
  })
})

/**
 * The same rules, read from Black's side.
 *
 * This is what "generalised" has to mean: not that the loader was renamed, but
 * that a course whose student moves second is held to the same standard. The
 * stem starts with the opponent's move here, so every parity assumption in the
 * walk is exercised from the other end.
 */
describe('loadChapter, a Black course', () => {
  it('makes the student the side that moves second', () => {
    const loaded = loadFixture(BLACK_CHAPTER, blackContext())
    const byPath = new Map(walkNodes(loaded).map((n) => [n.path.join(' '), n]))
    // 1.e4 is the stem, so the tree roots are Black's first move.
    const c6 = byPath.get('e4 c6')!
    expect(c6.colour).toBe('black')
    expect(c6.isStudent).toBe(true)
    expect(c6.ply).toBe(1)
    const d4 = byPath.get('e4 c6 d4')!
    expect(d4.colour).toBe('white')
    expect(d4.isStudent).toBe(false)
  })

  it('puts the authored judgement on Black and the weights on White', () => {
    const loaded = loadFixture(BLACK_CHAPTER, blackContext())
    const byPath = new Map(walkNodes(loaded).map((n) => [n.path.join(' '), n]))
    expect(byPath.get('e4 c6')?.tags).toEqual(['development'])
    expect(byPath.get('e4 c6')?.mistakes?.[0].san).toBe('e5')
    expect(byPath.get('e4 c6 d4')?.weight).toBe(8)
    // And nothing authored for the student sits on the opponent's move.
    expect(byPath.get('e4 c6 d4')?.tags).toEqual([])
  })

  it('asks the student from the position before their own move', () => {
    const loaded = loadFixture(BLACK_CHAPTER, blackContext())
    const c6 = walkNodes(loaded).find((n) => n.san === 'c6')!
    // The card position is after 1.e4, with Black to move.
    expect(c6.parentFen).toBe(loaded.stemFen)
    expect(c6.parentFen.split(' ')[1]).toBe('b')
  })

  it('names Black in the messages when Black is the student', () => {
    const bad = structuredClone(BLACK_CHAPTER) as Record<string, unknown>
    const tree = bad.tree as Record<string, unknown>[]
    delete tree[0].note
    const result = loadChapter(bad, blackContext())
    expect(result.errors[0].message).toBe('Black moves need a note saying the idea')
  })

  it('says leaves plan for Black, not for White', () => {
    const bad = structuredClone(BLACK_CHAPTER) as Record<string, unknown>
    const tree = bad.tree as Record<string, unknown>[]
    const children = tree[0].children as Record<string, unknown>[]
    const grandchildren = children[0].children as Record<string, unknown>[]
    const line = (grandchildren[0].children as Record<string, unknown>[])[0]
    delete ((line.children as Record<string, unknown>[])[0]).plan
    const result = loadChapter(bad, blackContext())
    expect(result.errors[0].message).toBe('leaves need a plan saying how Black continues')
  })

  it('refuses a variant on the opponent\'s move', () => {
    const bad = structuredClone(BLACK_CHAPTER) as Record<string, unknown>
    const tree = bad.tree as Record<string, unknown>[]
    const children = tree[0].children as Record<string, unknown>[]
    children[0].variant = 'classical'
    const result = loadChapter(bad, blackContext())
    expect(result.errors[0].message).toBe('variant belongs on Black moves only')
  })

  it('refuses two White replies playing the same move', () => {
    const bad = structuredClone(BLACK_CHAPTER) as Record<string, unknown>
    const tree = bad.tree as Record<string, unknown>[]
    const children = tree[0].children as Record<string, unknown>[]
    children.push({
      san: 'd4',
      note: 'A duplicated reply.',
      weight: 2,
      children: [{ san: 'd5', note: 'Never reached.', name: 'The duplicated White reply', plan: 'Never reached.' }],
    })
    const result = loadChapter(bad, blackContext())
    expect(result.errors[0].message).toContain('two White replies play "d4"')
  })
})
