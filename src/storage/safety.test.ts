import { describe, expect, it } from 'vitest'
import {
  checkBlankStart,
  markerText,
  readMarker,
  writeMarkerAndBackup,
  type SafetyFiles,
} from './safety'
import { emptyProgress, type ProgressState } from './progress'
import type { BackupRoots, DataRoots } from './paths'

/**
 * Refusing to start blank.
 *
 * Every case here is a version of the same question: the progress file is not
 * there, so is this a new trainee or a file that has gone? Getting that wrong
 * once cost Nick his two learnt lines on 2026-08-31, because the app answered
 * "new trainee" and then saved a blank file over the gap.
 *
 * So the tests are mostly about the failure directions. Only the case where
 * nothing anywhere says the app has ever saved is allowed to start blank.
 */

const ROOTS: DataRoots = {
  root: 'C:/data',
  progress: 'C:/data/progress.json',
  courses: 'C:/data/courses',
  marker: 'C:/data/progress.marker.json',
}

const BACKUP: BackupRoots = {
  root: 'C:/local',
  backup: 'C:/local/progress.backup.json',
}

function saved(lines: string[]): ProgressState {
  return { ...emptyProgress(), learntLines: lines }
}

const TWO = saved(['london-white/ch1:d4 d5 Bf4', 'london-white/ch2:d4 Nf6 Bf4'])

/** A filesystem in a map, plus a way to make any one call fail. */
function fake(files: Record<string, string>, folders: string[] = []) {
  const tree = { ...files }
  const dirs = new Set(folders)
  const broken: Record<string, string> = {}
  const times: Record<string, Date> = {}

  const api: SafetyFiles = {
    async exists(path) {
      fail('exists', path)
      return path in tree || dirs.has(path)
    },
    async readTextFile(path) {
      fail('read', path)
      const text = tree[path]
      if (text === undefined) throw new Error(`no such file: ${path}`)
      return text
    },
    async writeTextFile(path, text) {
      fail('write', path)
      tree[path] = text
    },
    async mkdir(path) {
      fail('mkdir', path)
      dirs.add(path)
    },
    async modified(path) {
      fail('stat', path)
      return times[path] ?? null
    },
  }

  function fail(what: string, path: string) {
    const reason = broken[`${what} ${path}`]
    if (reason) throw new Error(reason)
  }

  return {
    api,
    tree,
    dirs,
    /** Makes one call throw: break('read', path, 'why'). */
    break: (what: string, path: string, why: string) => {
      broken[`${what} ${path}`] = why
    },
    at: (path: string, when: Date) => {
      times[path] = when
    },
  }
}

describe('the marker beside the progress file', () => {
  it('says when it was written and how much was in it', () => {
    const text = markerText(TWO, BACKUP.backup, new Date('2026-08-31T02:15:00.000Z'))
    const marker = readMarker(text)

    expect(marker?.wrote).toBe('2026-08-31T02:15:00.000Z')
    expect(marker?.learntLines).toBe(2)
  })

  it('explains itself to whoever finds it in the folder', () => {
    const text = markerText(TWO, BACKUP.backup, new Date())

    expect(text).toContain('refuses to start blank')
    expect(text).toContain(BACKUP.backup)
  })

  it('is not fooled by a file that is not a marker', () => {
    expect(readMarker('not json at all')).toBeNull()
    expect(readMarker('[]')).toBeNull()
    expect(readMarker('{"learntLines": 3}')).toBeNull()
  })
})

describe('writing the marker and the second copy', () => {
  it('puts the marker beside the file and the copy in the other folder', async () => {
    const fs = fake({})

    await writeMarkerAndBackup(fs.api, ROOTS, BACKUP, TWO, JSON.stringify(TWO))

    expect(readMarker(fs.tree[ROOTS.marker])?.learntLines).toBe(2)
    expect(fs.tree[BACKUP.backup]).toBe(JSON.stringify(TWO))
    expect(fs.dirs.has(BACKUP.root)).toBe(true)
  })

  it('writes the copy exactly as the progress file was written', async () => {
    const fs = fake({})
    const text = JSON.stringify(TWO, null, 2)

    await writeMarkerAndBackup(fs.api, ROOTS, BACKUP, TWO, text)

    expect(fs.tree[BACKUP.backup]).toBe(text)
  })
})

describe('starting with no progress file', () => {
  it('is a new trainee when nothing anywhere says otherwise', async () => {
    const fs = fake({})

    expect(await checkBlankStart(fs.api, ROOTS, BACKUP)).toEqual({ kind: 'fresh' })
  })

  it('is a new trainee when the only copy holds nothing to lose', async () => {
    const fs = fake({ [BACKUP.backup]: JSON.stringify(emptyProgress()) })

    expect(await checkBlankStart(fs.api, ROOTS, BACKUP)).toEqual({ kind: 'fresh' })
  })

  it('blocks when the marker says the app has saved here', async () => {
    const fs = fake({
      [ROOTS.marker]: markerText(TWO, BACKUP.backup, new Date('2026-08-31T02:15:00.000Z')),
    })

    const start = await checkBlankStart(fs.api, ROOTS, BACKUP)

    expect(start.kind).toBe('blocked')
    if (start.kind !== 'blocked') return
    expect(start.reason).toContain('C:/data/progress.json is not there')
    expect(start.reason).toContain('2 learnt lines')
    expect(start.reason).toContain('deleted or moved')
    expect(start.offer).toBeUndefined()
  })

  it('blocks on the copy alone, which is what a deleted data folder looks like', async () => {
    // The marker lives in the folder that was deleted, so it is gone too. This
    // is exactly the shape of the incident this whole phase exists for.
    const fs = fake({ [BACKUP.backup]: JSON.stringify(TWO) })

    const start = await checkBlankStart(fs.api, ROOTS, BACKUP)

    expect(start.kind).toBe('blocked')
    if (start.kind !== 'blocked') return
    expect(start.reason).toContain('what a deleted data folder looks like')
    expect(start.offer?.learntLines).toBe(2)
    expect(start.offer?.state.learntLines).toEqual(TWO.learntLines)
  })

  it('names when the copy was written, when the filesystem will say', async () => {
    const fs = fake({ [BACKUP.backup]: JSON.stringify(TWO) })
    fs.at(BACKUP.backup, new Date(2026, 7, 31, 9, 5))

    const start = await checkBlankStart(fs.api, ROOTS, BACKUP)

    expect(start.kind === 'blocked' && start.reason).toContain('2026-08-31 at 09:05')
  })

  it('still offers the copy when the filesystem will not say when', async () => {
    const fs = fake({ [BACKUP.backup]: JSON.stringify(TWO) })
    fs.break('stat', BACKUP.backup, 'stat is not allowed here')

    const start = await checkBlankStart(fs.api, ROOTS, BACKUP)

    expect(start.kind === 'blocked' && start.offer?.learntLines).toBe(2)
  })

  it('offers the copy even when the marker is there too', async () => {
    const fs = fake({
      [ROOTS.marker]: markerText(TWO, BACKUP.backup, new Date()),
      [BACKUP.backup]: JSON.stringify(TWO),
    })

    const start = await checkBlankStart(fs.api, ROOTS, BACKUP)

    expect(start.kind === 'blocked' && start.offer?.learntLines).toBe(2)
  })

  it('blocks when the marker cannot be read, rather than guessing', async () => {
    const fs = fake({ [ROOTS.marker]: 'this is not a marker' })

    const start = await checkBlankStart(fs.api, ROOTS, BACKUP)

    expect(start.kind).toBe('blocked')
    expect(start.kind === 'blocked' && start.reason).toContain('could not tell')
  })

  it('blocks when the folder cannot even be checked', async () => {
    const fs = fake({})
    fs.break('exists', ROOTS.marker, 'access is denied')

    const start = await checkBlankStart(fs.api, ROOTS, BACKUP)

    expect(start.kind).toBe('blocked')
    expect(start.kind === 'blocked' && start.reason).toContain('access is denied')
  })

  it('blocks when the copy is there and will not parse', async () => {
    const fs = fake({ [BACKUP.backup]: '{ this is not json' })

    const start = await checkBlankStart(fs.api, ROOTS, BACKUP)

    expect(start.kind).toBe('blocked')
    if (start.kind !== 'blocked') return
    expect(start.reason).toContain('could not be read either')
    expect(start.offer).toBeUndefined()
  })

  it('never writes anything, whatever it finds', async () => {
    for (const files of [
      {},
      { [ROOTS.marker]: markerText(TWO, BACKUP.backup, new Date()) },
      { [BACKUP.backup]: JSON.stringify(TWO) },
      { [BACKUP.backup]: 'rubbish' },
    ]) {
      const fs = fake(files)
      const before = JSON.stringify(fs.tree)

      await checkBlankStart(fs.api, ROOTS, BACKUP)

      expect(JSON.stringify(fs.tree)).toBe(before)
      expect(fs.dirs.size).toBe(0)
    }
  })

  it('says what to do next in every blocked case', async () => {
    for (const files of [
      { [ROOTS.marker]: markerText(TWO, BACKUP.backup, new Date()) },
      { [BACKUP.backup]: JSON.stringify(TWO) },
      { [BACKUP.backup]: 'rubbish' },
    ]) {
      const start = await checkBlankStart(fake(files).api, ROOTS, BACKUP)

      expect(start.kind).toBe('blocked')
      if (start.kind !== 'blocked') continue
      expect(start.reason).toContain('Progress screen')
      expect(start.reason).toContain('nothing will be')
    }
  })
})
