import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LocalStorageProgressStore,
  PROGRESS_VERSION,
  emptyProgress,
  isLearnt,
  parseProgress,
  parseProgressJson,
  toggleLearnt,
} from './progress'

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
    expect(state).toEqual({ version: PROGRESS_VERSION, learntLines: ['ch0:d4 d5'] })
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
    await store.save({ version: PROGRESS_VERSION, learntLines: ['ch1:d4 d5 Bf4'] })
    expect((await store.load()).learntLines).toEqual(['ch1:d4 d5 Bf4'])
  })

  it('survives a restart, which is a new store over the same storage', async () => {
    await new LocalStorageProgressStore(storage).save({
      version: PROGRESS_VERSION,
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
    await first.save({ version: PROGRESS_VERSION, learntLines: ['ch0:d4', 'ch1:d4 d5'] })
    const exported = await first.exportJson()

    const elsewhere = new LocalStorageProgressStore(fakeStorage())
    const imported = await elsewhere.importJson(exported)
    expect(imported.learntLines).toEqual(['ch0:d4', 'ch1:d4 d5'])
    expect((await elsewhere.load()).learntLines).toEqual(['ch0:d4', 'ch1:d4 d5'])
  })

  it('refuses to import rubbish and leaves the saved state alone', async () => {
    const store = new LocalStorageProgressStore(storage)
    await store.save({ version: PROGRESS_VERSION, learntLines: ['keep me'] })
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
