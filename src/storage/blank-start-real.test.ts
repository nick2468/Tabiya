/// <reference types="node" />
import { afterAll, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readdir, rm, writeFile, readFile, stat, access } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { checkBlankStart, writeMarkerAndBackup, type SafetyFiles } from './safety'
import { emptyProgress, type ProgressState } from './progress'
import { DATA_FOLDER, LOCAL_FOLDER, type BackupRoots, type DataRoots } from './paths'

/**
 * The blank-start guard, against a real filesystem.
 *
 * The tests next door run it on a filesystem in a map, which is where the
 * failure directions are worked out. This runs the same function on real
 * folders, real files and real errors, because this project has twice been
 * caught by the difference between what code says it does and what a machine
 * does with it.
 *
 * It exists because the packaged app cannot show this. On Nick's machine the
 * phase 15 migration runs before the guard does, and it copies his progress
 * file back from the folder the app moved away from, so a start with no
 * progress file never reaches the guard at all. That is a good thing and a
 * third layer of safety, and it also means the only honest packaged proof
 * would need his old folder emptied, which this phase must not do. So the
 * proof is here instead, on folders it makes and removes itself.
 *
 * Everything happens under the OS temp folder and is cleaned up afterwards.
 *
 * The reference above is this file's own. The app's tsconfig deliberately knows
 * nothing about node, because app code must not reach for it, so every test file
 * that reads the real filesystem declares the types itself rather than leaning on
 * another one happening to declare them first. Phase 46 found that this file was
 * declaring them for all three.
 */

const files: SafetyFiles = {
  async exists(path) {
    try {
      await access(path)
      return true
    } catch {
      return false
    }
  },
  readTextFile: (path) => readFile(path, 'utf8'),
  writeTextFile: (path, text) => writeFile(path, text, 'utf8'),
  mkdir: async (path) => void (await mkdir(path, { recursive: true })),
  async modified(path) {
    return (await stat(path)).mtime
  },
}

const roots: string[] = []

/** A fresh pair of folders: the app's data folder, and the local one. */
async function folders(): Promise<{ data: DataRoots; local: BackupRoots }> {
  const root = await mkdtemp(join(tmpdir(), 'tabiya-blank-start-'))
  roots.push(root)
  const data = join(root, DATA_FOLDER)
  const local = join(root, LOCAL_FOLDER)
  await mkdir(data, { recursive: true })
  return {
    data: {
      root: data,
      progress: join(data, 'progress.json'),
      courses: join(data, 'courses'),
      marker: join(data, 'progress.marker.json'),
    },
    local: { root: local, backup: join(local, 'progress.backup.json') },
  }
}

const TWO: ProgressState = {
  ...emptyProgress(),
  learntLines: ['london-white/ch1:d4 d5 Bf4', 'london-white/ch3:d4 Nf6 Bf4'],
}

/** What a real save does: the progress file, then the marker and the copy. */
async function save(
  data: DataRoots,
  local: BackupRoots,
  state: ProgressState = TWO,
): Promise<void> {
  const text = JSON.stringify(state, null, 2)
  await writeFile(data.progress, text, 'utf8')
  await writeMarkerAndBackup(files, data, local, state, text)
}

afterAll(async () => {
  for (const root of roots) await rm(root, { recursive: true, force: true })
})

describe('the blank-start guard on a real filesystem', () => {
  it('lets a genuinely new trainee start blank', async () => {
    const { data, local } = await folders()

    expect(await checkBlankStart(files, data, local)).toEqual({ kind: 'fresh' })
  })

  it('writes both pieces of evidence on a save, in two different folders', async () => {
    const { data, local } = await folders()

    await save(data, local)

    expect(await readdir(data.root)).toEqual(['progress.json', 'progress.marker.json'])
    expect(await readdir(local.root)).toEqual(['progress.backup.json'])
    expect(await readFile(local.backup, 'utf8')).toBe(await readFile(data.progress, 'utf8'))
  })

  it('blocks when the progress file is deleted and the folder is left', async () => {
    const { data, local } = await folders()
    await save(data, local)
    await rm(data.progress)

    const start = await checkBlankStart(files, data, local)

    expect(start.kind).toBe('blocked')
    if (start.kind !== 'blocked') return
    expect(start.reason).toContain('deleted or moved')
    expect(start.reason).toContain('2 learnt lines')
    expect(start.offer?.learntLines).toBe(2)
    expect(start.offer?.state.learntLines).toEqual(TWO.learntLines)
  })

  it('blocks on the copy alone when the whole data folder is deleted', async () => {
    // This is Nick's incident of 2026-08-31, exactly: the folder goes, and the
    // marker in it goes with it. Only the copy in the other folder is left.
    const { data, local } = await folders()
    await save(data, local)
    await rm(data.root, { recursive: true })

    const start = await checkBlankStart(files, data, local)

    expect(start.kind).toBe('blocked')
    if (start.kind !== 'blocked') return
    expect(start.reason).toContain('what a deleted data folder looks like')
    expect(start.offer?.learntLines).toBe(2)
    expect(start.offer?.wrote).toBeInstanceOf(Date)
  })

  it('starts blank when the only copy holds nothing to lose', async () => {
    const { data, local } = await folders()
    await save(data, local, emptyProgress())
    await rm(data.root, { recursive: true })

    expect(await checkBlankStart(files, data, local)).toEqual({ kind: 'fresh' })
  })

  it('blocks without an offer when the copy is there and will not parse', async () => {
    const { data, local } = await folders()
    await save(data, local)
    await rm(data.root, { recursive: true })
    await writeFile(local.backup, '{ half a file', 'utf8')

    const start = await checkBlankStart(files, data, local)

    expect(start.kind).toBe('blocked')
    if (start.kind !== 'blocked') return
    expect(start.reason).toContain('could not be read either')
    expect(start.offer).toBeUndefined()
  })

  it('writes nothing at all, whatever it finds', async () => {
    const { data, local } = await folders()
    await save(data, local)
    await rm(data.progress)
    const before = [await readdir(data.root), await readdir(local.root)]

    await checkBlankStart(files, data, local)

    expect([await readdir(data.root), await readdir(local.root)]).toEqual(before)
  })

  it('puts back exactly what was saved, byte for byte', async () => {
    // The offer carries a parsed state; writing it out again has to give the
    // same file, because that file is what the trainee gets back.
    const { data, local } = await folders()
    await save(data, local)
    const original = await readFile(data.progress, 'utf8')
    await rm(data.root, { recursive: true })

    const start = await checkBlankStart(files, data, local)
    if (start.kind !== 'blocked' || !start.offer) throw new Error('expected an offer')
    await mkdir(data.root, { recursive: true })
    await writeFile(data.progress, JSON.stringify(start.offer.state, null, 2), 'utf8')

    expect(await readFile(data.progress, 'utf8')).toBe(original)
  })
})
