import { describe, expect, it } from 'vitest'
import {
  ANY_LINE,
  anyGameRecorded,
  chapterProgress,
  conceptAccuracy,
  courseTotals,
  forkDepth,
  lineFollowed,
  linesPlayed,
  playStats,
  playedLine,
} from './stats'
import { buildCards } from './cards'
import { chapterLines } from './lines'
import { loadFixture as load, manifest } from '../test/fixtures'
import { loadCourse } from './course'
import type { LoadedCourse } from './types'
import { newSchedule, review } from '../scheduler'
import { emptyProgress, recordAnswer, toggleLearnt } from '../storage/progress'

const NOW = new Date('2026-08-27T09:00:00.000Z')

const raw = {
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
          tags: ['development'],
          children: [
            {
              san: 'e6',
              note: 'A Black reply in the fixture.',
              weight: 7,
              children: [{ san: 'Nf3', note: 'Develop.', tags: ['development'], name: 'The Nf3 line', plan: 'Castle.' }],
            },
            {
              san: 'c5',
              note: 'A Black reply in the fixture.',
              weight: 5,
              children: [{ san: 'c3', note: 'Hold d4.', tags: ['vs-c5'], name: 'The c3 line', plan: 'Nbd2 next.' }],
            },
          ],
        },
      ],
    },
  ],
}

const chapter = load(raw)

const lines = chapterLines(chapter)

/** The fixture chapter as the whole course it belongs to. */
const course: LoadedCourse = (() => {
  const result = loadCourse(manifest({ chapters: ['one.json'] }), { 'one.json': raw })
  if (!result.ok) throw new Error(`fixture course failed: ${result.errors[0]?.message}`)
  return result.course
})()

const COURSE = course.id

describe('chapterProgress', () => {
  it('counts nothing learnt to start with', () => {
    const [row] = chapterProgress(course, emptyProgress(), NOW)
    expect(row).toMatchObject({
      id: `${COURSE}/ch-test`,
      title: 'Test chapter',
      learnt: 0,
      lines: 2,
      due: 0,
    })
  })

  it('counts the lines ticked and the cards they make', () => {
    const state = toggleLearnt(emptyProgress(), lines[0].id)
    const [row] = chapterProgress(course, state, NOW)
    expect(row.learnt).toBe(1)
    expect(row.lines).toBe(2)
    // 3.e3 and 4.Nf3, both never answered, so both due and both fresh.
    expect(row.due).toBe(2)
    expect(row.fresh).toBe(2)
  })

  it('stops counting a card as due once it has been answered', () => {
    let state = toggleLearnt(emptyProgress(), lines[0].id)
    const { cards } = buildCards(course, [lines[0].id])
    for (const card of cards) {
      state = recordAnswer(
        state,
        card.courseId,
        card.key,
        card.tags,
        true,
        review(newSchedule(NOW), 'easy', NOW),
      )
    }
    const [row] = chapterProgress(course, state, NOW)
    expect(row.due).toBe(0)
    expect(row.fresh).toBe(0)
  })
})

describe('conceptAccuracy', () => {
  it('counts how many learnt cards carry each concept', () => {
    const { cards } = buildCards(course, [lines[0].id, lines[1].id])
    const rows = conceptAccuracy(course, cards, emptyProgress())
    const development = rows.find((row) => row.tag === 'development')
    expect(development).toMatchObject({ cards: 2, accuracy: null, answers: 0 })
  })

  it('puts the worst concept first and the undrilled ones last', () => {
    const { cards } = buildCards(course, [lines[0].id, lines[1].id])
    let state = emptyProgress()
    for (const correct of [true, true, true, true]) {
      state = recordAnswer(state, COURSE, 'x', ['development'], correct, newSchedule(NOW))
    }
    for (const correct of [false, false, true, false]) {
      state = recordAnswer(state, COURSE, 'y', ['vs-c5'], correct, newSchedule(NOW))
    }
    const rows = conceptAccuracy(course, cards, state)
    expect(rows.map((row) => row.tag)).toEqual(['vs-c5', 'development'])
    expect(rows[0].accuracy).toBe(0.25)
    expect(rows[1].accuracy).toBe(1)
  })

  it('keeps a concept with history even when no learnt card carries it now', () => {
    let state = emptyProgress()
    state = recordAnswer(state, COURSE, 'x', ['h-file'], false, newSchedule(NOW))
    const rows = conceptAccuracy(course, [], state)
    expect(rows.map((row) => row.tag)).toEqual(['h-file'])
    expect(rows[0].cards).toBe(0)
  })
})

describe('courseTotals', () => {
  it('adds up the whole course', () => {
    const state = toggleLearnt(emptyProgress(), lines[0].id)
    const { cards } = buildCards(course, state.learntLines)
    expect(courseTotals(course, cards, state, NOW)).toEqual({
      learntLines: 1,
      totalLines: 2,
      cards: 2,
      due: 2,
      fresh: 2,
    })
  })
})

describe('the labels shown to both colours', () => {
  // Phase 8 found this in the live app: the Play launcher and the play stats
  // both said "defence", which is only true when the student is White. In a
  // Black course the opponent is the side choosing an opening.
  it('names an untargeted game without naming a colour or a defence', () => {
    expect(ANY_LINE.toLowerCase()).not.toContain('defence')
    expect(ANY_LINE.toLowerCase()).not.toContain('white')
    expect(ANY_LINE.toLowerCase()).not.toContain('black')
  })

  it('uses that label for games that were not aimed at a chapter', () => {
    const state = {
      ...emptyProgress(),
      playGames: [{ courseId: 'c', deviated: false, moves: 12, level: 4, at: NOW.toISOString() }],
    }
    expect(playStats([], state).byChapter.map((row) => row.title)).toContain(ANY_LINE)
  })
})

describe('games played against the course', () => {
  const played = (over: object) => ({
    courseId: 'c',
    deviated: false,
    moves: 12,
    level: 4,
    at: NOW.toISOString(),
    ...over,
  })

  it('are counted in the total and said apart', () => {
    const state = {
      ...emptyProgress(),
      playGames: [played({}), played({ side: 'other' }), played({ side: 'other' })],
    }
    const stats = playStats([], state)
    expect(stats.games).toBe(3)
    expect(stats.otherSide).toBe(2)
  })

  it('are left out of the rate at which the trainee left the repertoire', () => {
    // Two games on the course's side, one of them left; two on the other
    // side. The rate is one in two, not one in four: a game where the engine
    // played the repertoire is not one the trainee stayed in.
    const state = {
      ...emptyProgress(),
      playGames: [
        played({ deviated: true, deviationMove: 6 }),
        played({}),
        played({ side: 'other' }),
        played({ side: 'other' }),
      ],
    }
    expect(playStats([], state).deviationRate).toBe(0.5)
  })

  it('count for nothing at all when there are none, so old histories read as before', () => {
    const state = { ...emptyProgress(), playGames: [played({}), played({})] }
    expect(playStats([], state).otherSide).toBe(0)
    expect(playStats([], state).deviationRate).toBe(0)
  })
})

/**
 * Which lines a game followed.
 *
 * The fixture has two lines out of the same trunk: 1.d4 d5 2.Bf4 Nf6 3.e3,
 * then 3...e6 4.Nf3 or 3...c5 4.c3. That trunk is what makes the interesting
 * case testable - a game that stops on move 3 has played into both.
 */
describe('playedLine', () => {
  const nf3 = lines[0].path
  const c3 = lines[1].path

  it('counts a game that played the line right out', () => {
    expect(playedLine([...nf3], nf3)).toBe(true)
  })

  it('counts a game that kept going past the leaf', () => {
    expect(playedLine([...nf3, 'O-O', 'Be7'], nf3)).toBe(true)
  })

  it('counts a game that stopped part way along it', () => {
    expect(playedLine(nf3.slice(0, 4), nf3)).toBe(true)
  })

  it('does not count a game that played something else', () => {
    const wrong = [...nf3.slice(0, 4), 'Nc3']
    expect(playedLine(wrong, nf3)).toBe(false)
  })

  it('does not count a game with no moves at all', () => {
    expect(playedLine([], nf3)).toBe(false)
  })

  it('counts a game that stopped in the shared trunk for BOTH lines', () => {
    // 1.d4 d5 2.Bf4 Nf6 3.e3, which is where the two part company.
    const trunk = nf3.slice(0, 5)
    expect(playedLine(trunk, nf3)).toBe(true)
    expect(playedLine(trunk, c3)).toBe(true)
  })
})

describe('forkDepth', () => {
  it('is the ply after the longest run a line shares with any other', () => {
    expect(forkDepth(lines[0].path, [lines[0].path, lines[1].path])).toBe(6)
    expect(forkDepth(lines[1].path, [lines[0].path, lines[1].path])).toBe(6)
  })

  it('is zero for a line with nothing to part from', () => {
    expect(forkDepth(lines[0].path, [lines[0].path])).toBe(0)
  })
})

describe('linesPlayed', () => {
  const game = (sans?: string[], courseId = COURSE) => ({
    courseId,
    deviated: false,
    moves: 10,
    level: 4,
    at: NOW.toISOString(),
    ...(sans ? { sans } : {}),
  })

  it('has nothing to say before any game kept its moves', () => {
    const state = { ...emptyProgress(), playGames: [game(), game()] }
    expect(anyGameRecorded(course, state)).toBe(false)
    expect(linesPlayed(course, state)).toEqual([])
  })

  it('counts each line a game followed, most played first', () => {
    const state = {
      ...emptyProgress(),
      playGames: [
        game([...lines[0].path]),
        game([...lines[0].path]),
        game([...lines[1].path]),
      ],
    }
    expect(anyGameRecorded(course, state)).toBe(true)
    expect(linesPlayed(course, state).map((row) => [row.name, row.games])).toEqual([
      [lines[0].name, 2],
      [lines[1].name, 1],
    ])
  })

  it('names the chapter the line belongs to', () => {
    const state = { ...emptyProgress(), playGames: [game([...lines[0].path])] }
    expect(linesPlayed(course, state)[0].chapterTitle).toBe('Test chapter')
  })

  /**
   * The hazard the chip names. A game played against the course is the
   * engine playing the line, and the trainee playing the replies: crediting
   * the trainee with that line would make the table say the opposite of
   * what it is for. Absent side is the course's own, so every record before
   * phase 32 still counts exactly as it did.
   */
  it('leaves out a game played against the course, however far it ran', () => {
    const state = {
      ...emptyProgress(),
      playGames: [
        { ...game([...lines[0].path]), side: 'other' as const },
        { ...game([...lines[1].path]), side: 'course' as const },
        game([...lines[1].path]),
      ],
    }
    expect(linesPlayed(course, state).map((row) => [row.name, row.games])).toEqual([
      [lines[1].name, 2],
    ])
  })

  it('counts a game that stopped in the shared trunk for NO line', () => {
    // 1.d4 d5 2.Bf4 Nf6 3.e3 is where the two lines part; a game that stops
    // there has not chosen either. Nick's ruling, 2026-09-03.
    const state = {
      ...emptyProgress(),
      playGames: [game(lines[0].path.slice(0, 5))],
    }
    expect(linesPlayed(course, state)).toEqual([])
  })

  it('counts a game for the one line it reached past the fork', () => {
    const state = {
      ...emptyProgress(),
      playGames: [game(lines[0].path.slice(0, 6))],
    }
    expect(linesPlayed(course, state).map((row) => [row.name, row.games])).toEqual([
      [lines[0].name, 1],
    ])
  })

  it('ignores games from another course', () => {
    const state = {
      ...emptyProgress(),
      playGames: [game([...lines[0].path], 'somebody-elses-course')],
    }
    expect(anyGameRecorded(course, state)).toBe(false)
    expect(linesPlayed(course, state)).toEqual([])
  })

  it('ignores a game that left the repertoire at once', () => {
    const state = { ...emptyProgress(), playGames: [game(['e4', 'e5', 'Nf3'])] }
    expect(linesPlayed(course, state)).toEqual([])
  })
})

describe('lineFollowed', () => {
  // Phase 38: the one line a game followed, for the report and the game
  // list. The fixture's two lines part at 3...e6 / 3...c5 (ply 6).
  const game = (sans: string[]) => ({
    courseId: COURSE,
    deviated: false,
    moves: 10,
    level: 4,
    at: NOW.toISOString(),
    sans,
  })

  it('names the line a game went through to the leaf', () => {
    expect(lineFollowed(course, [...lines[0].path]).line?.name).toBe(lines[0].name)
    expect(lineFollowed(course, [...lines[1].path, 'Nbd2', 'Be7']).line?.name).toBe(lines[1].name)
  })

  it('names the line a game stopped in, once it was past the fork', () => {
    const followed = lineFollowed(course, lines[1].path.slice(0, 6))
    expect(followed.line?.name).toBe(lines[1].name)
    expect(followed.chapter?.title).toBe('Test chapter')
  })

  it('names the chapter and no line for a game that stopped in the trunk', () => {
    const followed = lineFollowed(course, lines[0].path.slice(0, 5))
    expect(followed.line).toBeUndefined()
    expect(followed.chapter?.title).toBe('Test chapter')
  })

  it('names the chapter a game started in when it left on move one, and nothing otherwise', () => {
    // 1.d4 e5 followed the stem for one ply and then left it.
    expect(lineFollowed(course, ['d4', 'e5']).chapter?.title).toBe('Test chapter')
    expect(lineFollowed(course, ['d4', 'e5']).line).toBeUndefined()
    // 1.e4 never agreed with any stem.
    expect(lineFollowed(course, ['e4', 'e5'])).toEqual({})
    expect(lineFollowed(course, [])).toEqual({})
  })

  it('agrees with Lines played about which line a game counts for', () => {
    // The same rule, narrowed to one answer: whatever the table counts a game
    // for, the name is one of those lines, and a game the table counts for
    // nothing because it stopped in the trunk is named no line here either.
    const cases = [
      [...lines[0].path],
      lines[1].path.slice(0, 6),
      lines[0].path.slice(0, 5),
      ['d4', 'e5'],
      [...lines[1].path, 'Nbd2'],
    ]
    for (const sans of cases) {
      const counted = linesPlayed(course, { ...emptyProgress(), playGames: [game(sans)] }).map(
        (row) => row.name,
      )
      const named = lineFollowed(course, sans).line?.name
      if (named) expect(counted).toContain(named)
      else expect(counted).toEqual([])
    }
  })

  it('names the line a game left after choosing it, which the table does not count', () => {
    // The Nf3 line chosen at ply 6 and left at ply 7: the report reads
    // "you were in The Nf3 line and left it", and Lines played, which counts
    // lines a game never contradicted, counts nothing. Both are right.
    const left = [...lines[0].path.slice(0, 6), 'Nc3']
    expect(lineFollowed(course, left).line?.name).toBe(lines[0].name)
    expect(linesPlayed(course, { ...emptyProgress(), playGames: [game(left)] })).toEqual([])
  })
})

describe('lineFollowed between chapters sharing a stem', () => {
  // The London's Classical and ...c5 chapters both begin 1.d4 d5 2.Bf4. A
  // game that played 2...c5 and then left is in the second, not the first
  // in course order: driven at phase 38, the report had named the wrong one.
  it('picks the chapter the first move after the stem belongs to', async () => {
    const { bundledCourses } = await import('../content')
    const london = bundledCourses.find((entry) => entry.id === 'london-white')
    if (!london) throw new Error('the London is not in the bundled set')
    expect(lineFollowed(london, ['d4', 'd5', 'Bf4', 'c5']).chapter?.title).toBe('The ...c5 and ...Qb6 lines')
    expect(lineFollowed(london, ['d4', 'd5', 'Bf4', 'e6']).chapter?.title).toBe('Classical Black')
    expect(lineFollowed(london, ['d4', 'd5', 'Bf4', 'c5']).line).toBeUndefined()
  })
})
