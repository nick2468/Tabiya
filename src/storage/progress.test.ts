import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LocalStorageProgressStore,
  PLAY_HISTORY,
  PROGRESS_VERSION,
  TAG_WINDOW,
  emptyProgress,
  isLearnt,
  parseProgress,
  parseProgressJson,
  recordAnswer,
  recordGame,
  scheduleFor,
  tagAccuracy,
  tagAnswerCount,
  toggleLearnt,
} from './progress'
import { newSchedule, review } from '../scheduler'

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
      learntLines: ['ch0:d4 d5'],
      cards: {},
      tagHistory: {},
      playGames: [],
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
  })

  it('reads a version 1 file, which is the whole migration', () => {
    // Version 1 held only learnt lines. Nothing is lost: the drill schedule
    // simply starts fresh from the lines the trainee had already ticked.
    const state = parseProgress({ version: 1, learntLines: ['ch1:d4 d5 Bf4'] })
    expect(state.version).toBe(PROGRESS_VERSION)
    expect(state.learntLines).toEqual(['ch1:d4 d5 Bf4'])
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
    expect(Object.keys(state.cards)).toEqual(['keep'])
  })

  it('keeps tag history within the rolling window', () => {
    const tooMany = Array.from({ length: TAG_WINDOW + 10 }, (_, i) => (i % 2 === 0 ? 1 : 0))
    const state = parseProgress({
      version: 2,
      learntLines: [],
      cards: {},
      tagHistory: { development: tooMany, rubbish: ['yes', 'no'], empty: [] },
    })
    expect(state.tagHistory.development).toHaveLength(TAG_WINDOW)
    expect(state.tagHistory.rubbish).toBeUndefined()
    expect(state.tagHistory.empty).toBeUndefined()
  })

  it('drops entries that are not line ids rather than losing the rest', () => {
    const state = parseProgress({ version: 1, learntLines: ['ch0:d4', 42, null, 'ch1:d4'] })
    expect(state.learntLines).toEqual(['ch0:d4', 'ch1:d4'])
  })

  it('removes duplicates', () => {
    expect(parseProgress({ version: 1, learntLines: ['a', 'a', 'b'] }).learntLines).toEqual([
      'a',
      'b',
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
    expect(await store.load()).toEqual(emptyProgress())
  })

  it('saves and reads back', async () => {
    const store = new LocalStorageProgressStore(storage)
    await store.save({ ...emptyProgress(), learntLines: ['ch1:d4 d5 Bf4'] })
    expect((await store.load()).learntLines).toEqual(['ch1:d4 d5 Bf4'])
  })

  it('survives a restart, which is a new store over the same storage', async () => {
    await new LocalStorageProgressStore(storage).save({
      ...emptyProgress(),
      learntLines: ['ch2:d4 d5 Bf4 c5 e3'],
    })
    const afterRestart = await new LocalStorageProgressStore(storage).load()
    expect(afterRestart.learntLines).toEqual(['ch2:d4 d5 Bf4 c5 e3'])
  })

  it('starts fresh and warns when the saved entry is corrupt', async () => {
    storage.setItem('london-trainer.progress', '{ half a file')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const state = await new LocalStorageProgressStore(storage).load()
    expect(state).toEqual(emptyProgress())
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('round-trips through export and import', async () => {
    const first = new LocalStorageProgressStore(storage)
    await first.save({ ...emptyProgress(), learntLines: ['ch0:d4', 'ch1:d4 d5'] })
    const exported = await first.exportJson()

    const elsewhere = new LocalStorageProgressStore(fakeStorage())
    const imported = await elsewhere.importJson(exported)
    expect(imported.learntLines).toEqual(['ch0:d4', 'ch1:d4 d5'])
    expect((await elsewhere.load()).learntLines).toEqual(['ch0:d4', 'ch1:d4 d5'])
  })

  it('refuses to import rubbish and leaves the saved state alone', async () => {
    const store = new LocalStorageProgressStore(storage)
    await store.save({ ...emptyProgress(), learntLines: ['keep me'] })
    await expect(store.importJson('not json at all')).rejects.toThrow(/not valid JSON/)
    expect((await store.load()).learntLines).toEqual(['keep me'])
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
    const state = recordAnswer(emptyProgress(), 'card-key', ['development', 'vs-c5'], true, schedule)
    expect(scheduleFor(state, 'card-key')).toEqual(schedule)
    expect(tagAccuracy(state, 'development')).toBe(1)
    expect(tagAccuracy(state, 'vs-c5')).toBe(1)
  })

  it('works out accuracy from the answers so far', () => {
    let state = emptyProgress()
    const schedule = newSchedule(NOW)
    for (const correct of [true, false, true, true]) {
      state = recordAnswer(state, 'card', ['development'], correct, schedule)
    }
    expect(tagAccuracy(state, 'development')).toBe(0.75)
    expect(tagAnswerCount(state, 'development')).toBe(4)
  })

  it('says nothing rather than zero for a concept never drilled', () => {
    // An untried concept is not a weak one, and scoring it zero would send the
    // weak-area filter straight at whatever the trainee has not reached yet.
    expect(tagAccuracy(emptyProgress(), 'endgame')).toBeNull()
  })

  it('forgets answers older than the rolling window', () => {
    let state = emptyProgress()
    const schedule = newSchedule(NOW)
    // A bad run, then a clean one long enough to push it out of the window.
    for (let i = 0; i < TAG_WINDOW; i++) {
      state = recordAnswer(state, 'card', ['h-file'], false, schedule)
    }
    expect(tagAccuracy(state, 'h-file')).toBe(0)
    for (let i = 0; i < TAG_WINDOW; i++) {
      state = recordAnswer(state, 'card', ['h-file'], true, schedule)
    }
    expect(tagAnswerCount(state, 'h-file')).toBe(TAG_WINDOW)
    expect(tagAccuracy(state, 'h-file')).toBe(1)
  })

  it('never changes the state it was given', () => {
    const before = emptyProgress()
    recordAnswer(before, 'card', ['development'], true, newSchedule(NOW))
    expect(before.cards).toEqual({})
    expect(before.tagHistory).toEqual({})
  })

  it('round-trips a full state through export and import', async () => {
    const storage = fakeStorage()
    const store = new LocalStorageProgressStore(storage)
    let state = emptyProgress()
    state = toggleLearnt(state, 'ch1:d4 d5 Bf4 e6 e3')
    state = recordAnswer(state, 'a-position', ['development'], true, review(newSchedule(NOW), 'good', NOW))
    state = recordAnswer(state, 'another', ['vs-qb6'], false, review(newSchedule(NOW), 'again', NOW))
    await store.save(state)

    const exported = await store.exportJson()
    const elsewhere = new LocalStorageProgressStore(fakeStorage())
    const imported = await elsewhere.importJson(exported)
    expect(imported).toEqual(state)
    expect(await elsewhere.load()).toEqual(state)
  })
})

describe('play history', () => {
  const game = {
    chapterId: 'ch3-kings-indian',
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
      state = recordGame(state, { ...game, moves: i })
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
})
