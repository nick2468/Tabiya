import { beforeEach, describe, expect, it } from 'vitest'
import {
  LEGACY_COURSE_ID,
  LocalStorageProgressStore,
  PLAY_HISTORY,
  PROGRESS_VERSION,
  TAG_WINDOW,
  emptyProgress,
  isHidden,
  isLearnt,
  parseProgress,
  parseProgressJson,
  recordAnswer,
  recordGame,
  scheduleFor,
  tagAccuracy,
  tagAnswerCount,
  toggleHidden,
  toggleLearnt,
} from './progress'
import { newSchedule, review } from '../scheduler'
import { cardKey } from '../model/ids'

/** The course the answer-recording tests attribute their answers to. */
const COURSE = 'test-course'

/** A stand-in for localStorage, since the tests run under node. */
function fakeStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, value),
  }
}

describe('parseProgress', () => {
  it('reads a well formed state', () => {
    const state = parseProgress({ version: 1, learntLines: ['ch0:d4 d5'] })
    expect(state).toEqual({
      version: PROGRESS_VERSION,
      // Pre-course line ids gain the course they always belonged to.
      learntLines: [`${LEGACY_COURSE_ID}/ch0:d4 d5`],
      cards: {},
      tagHistory: {},
      playGames: [],
      hiddenCourses: [],
    })
  })

  it('reads a version 2 file, which had no games in it', () => {
    const state = parseProgress({ version: 2, learntLines: ['a'], cards: {}, tagHistory: {} })
    expect(state.version).toBe(PROGRESS_VERSION)
    expect(state.playGames).toEqual([])
  })

  it('keeps game records and drops anything that is not one', () => {
    const state = parseProgress({
      version: 3,
      learntLines: [],
      playGames: [
        { deviated: true, deviationMove: 7, moves: 20, level: 4, at: '2026-08-27T09:00:00.000Z' },
        { nonsense: true },
        'not a game',
      ],
    })
    expect(state.playGames).toHaveLength(1)
    expect(state.playGames[0].deviationMove).toBe(7)
    expect(state.playGames[0].courseId).toBe(LEGACY_COURSE_ID)
  })

  it('reads a version 1 file, which is the whole migration', () => {
    // Version 1 held only learnt lines. Nothing is lost: the drill schedule
    // simply starts fresh from the lines the trainee had already ticked.
    const state = parseProgress({ version: 1, learntLines: ['ch1:d4 d5 Bf4'] })
    expect(state.version).toBe(PROGRESS_VERSION)
    expect(state.learntLines).toEqual([`${LEGACY_COURSE_ID}/ch1:d4 d5 Bf4`])
    expect(state.cards).toEqual({})
    expect(state.tagHistory).toEqual({})
  })

  it('keeps saved schedules and drops anything that is not one', () => {
    const good = newSchedule(new Date('2026-08-27T09:00:00.000Z'))
    const state = parseProgress({
      version: 2,
      learntLines: [],
      cards: { keep: good, nonsense: 'not a schedule', partial: { due: 'x' } },
      tagHistory: {},
    })
    expect(Object.keys(state.cards)).toEqual([cardKey(LEGACY_COURSE_ID, 'keep')])
  })

  it('keeps tag history within the rolling window', () => {
    const tooMany = Array.from({ length: TAG_WINDOW + 10 }, (_, i) => (i % 2 === 0 ? 1 : 0))
    const state = parseProgress({
      version: 2,
      learntLines: [],
      cards: {},
      tagHistory: { development: tooMany, rubbish: ['yes', 'no'], empty: [] },
    })
    const london = state.tagHistory[LEGACY_COURSE_ID]
    expect(london.development).toHaveLength(TAG_WINDOW)
    expect(london.rubbish).toBeUndefined()
    expect(london.empty).toBeUndefined()
  })

  it('drops entries that are not line ids rather than losing the rest', () => {
    const state = parseProgress({ version: 1, learntLines: ['ch0:d4', 42, null, 'ch1:d4'] })
    expect(state.learntLines).toEqual([
      `${LEGACY_COURSE_ID}/ch0:d4`,
      `${LEGACY_COURSE_ID}/ch1:d4`,
    ])
  })

  it('removes duplicates', () => {
    expect(parseProgress({ version: 1, learntLines: ['a', 'a', 'b'] }).learntLines).toEqual([
      `${LEGACY_COURSE_ID}/a`,
      `${LEGACY_COURSE_ID}/b`,
    ])
  })

  it('accepts a state with no learnt lines at all', () => {
    expect(parseProgress({ version: 1 }).learntLines).toEqual([])
  })

  it('refuses a state from a newer build rather than discarding it', () => {
    expect(() => parseProgress({ version: 99, learntLines: [] })).toThrow(/newer version/)
  })

  it('refuses something that is not an object', () => {
    expect(() => parseProgress(['a'])).toThrow(/JSON object/)
    expect(() => parseProgress('nope')).toThrow(/JSON object/)
  })
})

describe('the version 3 to version 4 migration', () => {
  // Version 3 is what the shipped v1 app wrote. This is Nick's real file in
  // miniature: learnt lines, card schedules, tag history and a game, none of
  // them naming a course because there was only one.
  const v3 = {
    version: 3,
    learntLines: ['ch2-c5-qb6:d4 d5 Bf4 c5 e3', 'ch1-classical:d4 d5 Bf4 e6'],
    cards: {
      'rnbqkbnr/pp2pppp/8/2pp4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq -': newSchedule(
        new Date('2026-08-27T09:00:00.000Z'),
      ),
    },
    tagHistory: { 'vs-c5': [1, 0, 1], development: [1, 1] },
    playGames: [
      {
        chapterId: 'ch2-c5-qb6',
        deviated: true,
        deviationMove: 6,
        moves: 15,
        level: 4,
        at: '2026-08-27T09:00:00.000Z',
      },
    ],
  }

  it('loses nothing, and puts all of it in the London course', () => {
    const state = parseProgress(v3)
    expect(state.version).toBe(PROGRESS_VERSION)

    expect(state.learntLines).toEqual([
      'london-white/ch2-c5-qb6:d4 d5 Bf4 c5 e3',
      'london-white/ch1-classical:d4 d5 Bf4 e6',
    ])

    const [[position, schedule]] = Object.entries(v3.cards)
    expect(Object.keys(state.cards)).toEqual([`london-white#${position}`])
    expect(state.cards[`london-white#${position}`]).toEqual(schedule)

    expect(state.tagHistory).toEqual({
      'london-white': { 'vs-c5': [1, 0, 1], development: [1, 1] },
    })

    expect(state.playGames[0]).toMatchObject({
      courseId: 'london-white',
      chapterId: 'london-white/ch2-c5-qb6',
      deviated: true,
      deviationMove: 6,
    })
  })

  it('reads a version 4 file back unchanged, so the migration runs once', () => {
    const migrated = parseProgress(v3)
    expect(parseProgress(migrated)).toEqual(migrated)
  })

  it('leaves an untargeted pre-course game without a chapter', () => {
    const state = parseProgress({
      version: 3,
      learntLines: [],
      playGames: [{ deviated: false, moves: 10, level: 3, at: '2026-08-27T09:00:00.000Z' }],
    })
    expect(state.playGames[0].courseId).toBe('london-white')
    expect(state.playGames[0].chapterId).toBeUndefined()
  })
})

describe('parseProgressJson', () => {
  it('says plainly when the text is not JSON', () => {
    expect(() => parseProgressJson('{ not json')).toThrow(/not valid JSON/)
  })
})

describe('LocalStorageProgressStore', () => {
  let storage: Storage

  beforeEach(() => {
    storage = fakeStorage()
  })

  it('starts empty when nothing has been saved', async () => {
    const store = new LocalStorageProgressStore(storage)
    expect(await store.load()).toEqual({ state: emptyProgress() })
  })

  it('saves and reads back', async () => {
    const store = new LocalStorageProgressStore(storage)
    await store.save({ ...emptyProgress(), learntLines: ['ch1:d4 d5 Bf4'] })
    expect((await store.load()).state.learntLines).toEqual(['ch1:d4 d5 Bf4'])
  })

  it('survives a restart, which is a new store over the same storage', async () => {
    await new LocalStorageProgressStore(storage).save({
      ...emptyProgress(),
      learntLines: ['ch2:d4 d5 Bf4 c5 e3'],
    })
    const afterRestart = await new LocalStorageProgressStore(storage).load()
    expect(afterRestart.state.learntLines).toEqual(['ch2:d4 d5 Bf4 c5 e3'])
  })

  it('starts fresh and SAYS SO when the saved entry is corrupt', async () => {
    // The failure is the important half. Without it the caller writes the
    // blank state straight back over the file it could not read, which is how
    // one bad read used to cost the trainee everything.
    storage.setItem('london-trainer.progress', '{ half a file')
    const loaded = await new LocalStorageProgressStore(storage).load()
    expect(loaded.state).toEqual(emptyProgress())
    expect(loaded.failure).toContain('not valid JSON')
  })

  it('says nothing failed when there is simply nothing saved yet', async () => {
    // A new trainee is not a failure, and saving over nothing loses nothing.
    expect((await new LocalStorageProgressStore(storage).load()).failure).toBeUndefined()
  })

  it('reports a storage that refuses to be read at all', async () => {
    const refuses = {
      ...fakeStorage(),
      getItem: () => {
        throw new Error('storage is disabled in this browser')
      },
    } as Storage
    const loaded = await new LocalStorageProgressStore(refuses).load()
    expect(loaded.failure).toContain('storage is disabled')
  })

  it('round-trips through export and import', async () => {
    const first = new LocalStorageProgressStore(storage)
    await first.save({ ...emptyProgress(), learntLines: ['ch0:d4', 'ch1:d4 d5'] })
    const exported = await first.exportJson()

    const elsewhere = new LocalStorageProgressStore(fakeStorage())
    const imported = await elsewhere.importJson(exported)
    expect(imported.learntLines).toEqual(['ch0:d4', 'ch1:d4 d5'])
    expect((await elsewhere.load()).state.learntLines).toEqual(['ch0:d4', 'ch1:d4 d5'])
  })

  it('refuses to import rubbish and leaves the saved state alone', async () => {
    const store = new LocalStorageProgressStore(storage)
    await store.save({ ...emptyProgress(), learntLines: ['keep me'] })
    await expect(store.importJson('not json at all')).rejects.toThrow(/not valid JSON/)
    expect((await store.load()).state.learntLines).toEqual(['keep me'])
  })
})

describe('learnt lines', () => {
  it('turns a line on and off again', () => {
    let state = emptyProgress()
    expect(isLearnt(state, 'ch1:line')).toBe(false)
    state = toggleLearnt(state, 'ch1:line')
    expect(isLearnt(state, 'ch1:line')).toBe(true)
    state = toggleLearnt(state, 'ch1:line')
    expect(isLearnt(state, 'ch1:line')).toBe(false)
  })

  it('never changes the state it was given', () => {
    const before = emptyProgress()
    toggleLearnt(before, 'ch1:line')
    expect(before.learntLines).toEqual([])
  })
})

describe('recording answers', () => {
  const NOW = new Date('2026-08-27T09:00:00.000Z')

  it('saves the card schedule and marks every concept the card carries', () => {
    const schedule = review(newSchedule(NOW), 'good', NOW)
    const state = recordAnswer(emptyProgress(), COURSE, 'card-key', ['development', 'vs-c5'], true, schedule)
    expect(scheduleFor(state, 'card-key')).toEqual(schedule)
    expect(tagAccuracy(state, COURSE, 'development')).toBe(1)
    expect(tagAccuracy(state, COURSE, 'vs-c5')).toBe(1)
  })

  it('works out accuracy from the answers so far', () => {
    let state = emptyProgress()
    const schedule = newSchedule(NOW)
    for (const correct of [true, false, true, true]) {
      state = recordAnswer(state, COURSE, 'card', ['development'], correct, schedule)
    }
    expect(tagAccuracy(state, COURSE, 'development')).toBe(0.75)
    expect(tagAnswerCount(state, COURSE, 'development')).toBe(4)
  })

  it('says nothing rather than zero for a concept never drilled', () => {
    // An untried concept is not a weak one, and scoring it zero would send the
    // weak-area filter straight at whatever the trainee has not reached yet.
    expect(tagAccuracy(emptyProgress(), COURSE, 'endgame')).toBeNull()
  })

  it('forgets answers older than the rolling window', () => {
    let state = emptyProgress()
    const schedule = newSchedule(NOW)
    // A bad run, then a clean one long enough to push it out of the window.
    for (let i = 0; i < TAG_WINDOW; i++) {
      state = recordAnswer(state, COURSE, 'card', ['h-file'], false, schedule)
    }
    expect(tagAccuracy(state, COURSE, 'h-file')).toBe(0)
    for (let i = 0; i < TAG_WINDOW; i++) {
      state = recordAnswer(state, COURSE, 'card', ['h-file'], true, schedule)
    }
    expect(tagAnswerCount(state, COURSE, 'h-file')).toBe(TAG_WINDOW)
    expect(tagAccuracy(state, COURSE, 'h-file')).toBe(1)
  })

  it('never changes the state it was given', () => {
    const before = emptyProgress()
    recordAnswer(before, COURSE, 'card', ['development'], true, newSchedule(NOW))
    expect(before.cards).toEqual({})
    expect(before.tagHistory).toEqual({})
  })

  it('round-trips a full state through export and import', async () => {
    const storage = fakeStorage()
    const store = new LocalStorageProgressStore(storage)
    let state = emptyProgress()
    state = toggleLearnt(state, 'ch1:d4 d5 Bf4 e6 e3')
    state = recordAnswer(state, COURSE, 'a-position', ['development'], true, review(newSchedule(NOW), 'good', NOW))
    state = recordAnswer(state, COURSE, 'another', ['vs-qb6'], false, review(newSchedule(NOW), 'again', NOW))
    await store.save(state)

    const exported = await store.exportJson()
    const elsewhere = new LocalStorageProgressStore(fakeStorage())
    const imported = await elsewhere.importJson(exported)
    expect(imported).toEqual(state)
    expect((await elsewhere.load()).state).toEqual(state)
  })
})

describe('play history', () => {
  const game = {
    courseId: 'london-white',
    chapterId: 'london-white/ch3-kings-indian',
    deviated: false,
    moves: 20,
    level: 4,
    at: '2026-08-27T09:00:00.000Z',
  }

  it('remembers a finished game', () => {
    const state = recordGame(emptyProgress(), game)
    expect(state.playGames).toEqual([game])
  })

  it('keeps only the most recent games', () => {
    let state = emptyProgress()
    for (let i = 0; i < PLAY_HISTORY + 10; i++) {
      // Each game gets its own `at`, because `at` is the game's identity and
      // two games played a second apart are two games.
      state = recordGame(state, { ...game, moves: i, at: `2026-08-27T09:00:${String(i % 60).padStart(2, '0')}.${String(i).padStart(3, '0')}Z` })
    }
    expect(state.playGames).toHaveLength(PLAY_HISTORY)
    // The oldest ten have gone, so the first one left is game ten.
    expect(state.playGames[0].moves).toBe(10)
  })

  it('never changes the state it was given', () => {
    const before = emptyProgress()
    recordGame(before, game)
    expect(before.playGames).toEqual([])
  })

  /**
   * A game can be reviewed, carried on and reviewed again. It is still one
   * game, and `at` is what says so.
   */
  it('replaces the record of a game reviewed twice rather than adding one', () => {
    const first = recordGame(emptyProgress(), { ...game, moves: 3 })
    const second = recordGame(first, { ...game, moves: 9, deviated: true })
    expect(second.playGames).toHaveLength(1)
    expect(second.playGames[0]).toMatchObject({ moves: 9, deviated: true })
  })

  it('puts the replacement where a new game would go, at the end', () => {
    let state = recordGame(emptyProgress(), { ...game, moves: 3 })
    state = recordGame(state, { ...game, moves: 5, at: '2026-08-28T09:00:00.000Z' })
    state = recordGame(state, { ...game, moves: 12 })
    expect(state.playGames.map((held) => held.moves)).toEqual([5, 12])
  })

  /**
   * The reader keeps fields it was never told about, which is what lets a
   * record grow without a version bump. Phase 24 added `sans` this way, 26
   * added `hints`, and 27 adds these two.
   */
  it('reads back the fields added since the version was last moved', () => {
    const full = {
      ...game,
      sans: ['d4', 'd5'],
      hints: 2,
      outcome: 'You won by checkmate',
      finalEval: 1.4,
    }
    const state = parseProgress({ ...emptyProgress(), playGames: [full] })
    expect(state.playGames[0]).toMatchObject({
      sans: ['d4', 'd5'],
      hints: 2,
      outcome: 'You won by checkmate',
      finalEval: 1.4,
    })
  })

  it('reads an older record that has none of them', () => {
    const state = parseProgress({ ...emptyProgress(), playGames: [game] })
    expect(state.playGames[0].outcome).toBeUndefined()
    expect(state.playGames[0].finalEval).toBeUndefined()
  })

  it('still counts two games as two when they were played at different times', () => {
    let state = recordGame(emptyProgress(), game)
    state = recordGame(state, { ...game, at: '2026-08-27T09:00:01.000Z' })
    expect(state.playGames).toHaveLength(2)
  })
})

describe('hidden courses', () => {
  it('starts with none', () => {
    expect(emptyProgress().hiddenCourses).toEqual([])
  })

  it('hides and shows again, and touches nothing else', () => {
    const before = { ...emptyProgress(), learntLines: ['london-white/ch1:d4'] }

    const hidden = toggleHidden(before, 'london-white')

    expect(isHidden(hidden, 'london-white')).toBe(true)
    expect(hidden.learntLines).toEqual(before.learntLines)
    expect(hidden.cards).toEqual(before.cards)
    expect(hidden.tagHistory).toEqual(before.tagHistory)
    expect(toggleHidden(hidden, 'london-white').hiddenCourses).toEqual([])
    expect(toggleHidden(hidden, 'london-white').learntLines).toEqual(before.learntLines)
  })

  it('reads a list of ids and drops anything that is not one', () => {
    const state = parseProgress({
      version: 4,
      hiddenCourses: ['london-white', 7, null, 'slav-black', 'london-white'],
    })

    expect(state.hiddenCourses).toEqual(['london-white', 'slav-black'])
  })

  it('reads a file that predates it as hiding nothing', () => {
    expect(parseProgress({ version: 4 }).hiddenCourses).toEqual([])
    expect(parseProgress({ version: 3, learntLines: [] }).hiddenCourses).toEqual([])
  })

  it('does not bump the version', () => {
    // Ruled 2026-08-31. parseProgress refuses any file from a newer build
    // outright, so a bump would make a cosmetic flag a wall between this build
    // and the last one. An older build drops the field and shows every course,
    // which is the right way for this to fail.
    expect(PROGRESS_VERSION).toBe(4)
    expect(toggleHidden(emptyProgress(), 'london-white').version).toBe(4)
  })
})
