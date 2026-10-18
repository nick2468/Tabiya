import { describe, expect, it } from 'vitest'
import { migrateDataFolder, migrationNote, type MigrationFiles } from './migrate'
import { pickOldRoot, type DataRoots } from './paths'
import { parseProgressJson } from './progress'

/**
 * Moving the trainee's data folder.
 *
 * The happy path is one copy. Everything else here is a way the copy could go
 * wrong, and every one of them has to end the same way: the old folder
 * untouched, nothing half-written in the new one, and the app blocked from
 * saving rather than starting blank. Starting blank and then saving is how a
 * progress file gets lost.
 */

const OLD: DataRoots = {
  root: 'C:/old',
  progress: 'C:/old/progress.json',
  courses: 'C:/old/courses',
  marker: 'C:/old/progress.marker.json',
}

const NEW: DataRoots = {
  root: 'C:/new',
  progress: 'C:/new/progress.json',
  courses: 'C:/new/courses',
  marker: 'C:/new/progress.marker.json',
}

const SAVED = JSON.stringify(
  {
    version: 4,
    learntLines: ['london-white/ch1:d4 d5 Bf4', 'london-white/ch2:d4 Nf6 Bf4'],
    cards: {},
    tagHistory: {},
    playGames: [],
  },
  null,
  2,
)

/** A filesystem in a map, plus a way to make any one call fail. */
function fake(files: Record<string, string>, folders: string[] = []) {
  const tree = { ...files }
  const dirs = new Set(folders)
  const broken: Record<string, string> = {}

  const api: MigrationFiles = {
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
    async readDir(path) {
      fail('readDir', path)
      const inside = new Set<string>()
      for (const name of [...Object.keys(tree), ...dirs]) {
        if (!name.startsWith(`${path}/`)) continue
        const rest = name.slice(path.length + 1)
        const head = rest.split('/')[0]
        if (head) inside.add(head)
      }
      return [...inside].map((name) => ({
        name,
        isDirectory: dirs.has(`${path}/${name}`),
      }))
    },
    async remove(path) {
      fail('remove', path)
      delete tree[path]
      dirs.delete(path)
    },
    async join(...parts) {
      return parts.join('/')
    },
  }

  function fail(call: string, path: string) {
    const key = `${call} ${path}`
    if (broken[key]) throw new Error(broken[key])
  }

  return {
    api,
    tree,
    dirs,
    /** Makes one call on one path throw, the way a missing grant would. */
    break: (call: string, path: string, why: string) => {
      broken[`${call} ${path}`] = why
    },
  }
}

describe('moving the data folder', () => {
  it('copies the progress file and leaves the old one where it was', async () => {
    const disk = fake({ 'C:/old/progress.json': SAVED })

    const result = await migrateDataFolder(disk.api, OLD, NEW)

    expect(result).toEqual({
      kind: 'migrated',
      from: 'C:/old',
      to: 'C:/new',
      lines: 2,
      courses: 0,
      trouble: [],
    })
    expect(disk.tree['C:/new/progress.json']).toBe(SAVED)
    expect(disk.tree['C:/old/progress.json']).toBe(SAVED)
  })

  it('does nothing at all when the new folder is already live', async () => {
    const disk = fake({ 'C:/old/progress.json': SAVED, 'C:/new/progress.json': '{}' })

    expect(await migrateDataFolder(disk.api, OLD, NEW)).toEqual({ kind: 'not-needed' })
    // The live file is the one thing that must never be written over.
    expect(disk.tree['C:/new/progress.json']).toBe('{}')
  })

  it('does nothing for a trainee who has no old folder', async () => {
    const disk = fake({})

    expect(await migrateDataFolder(disk.api, OLD, NEW)).toEqual({ kind: 'not-needed' })
    expect(disk.tree['C:/new/progress.json']).toBeUndefined()
  })

  it('carries the courses across too', async () => {
    const disk = fake(
      {
        'C:/old/progress.json': SAVED,
        'C:/old/courses/colle/course.json': '{"id":"colle"}',
        'C:/old/courses/colle/ch0.json': '{"id":"ch0"}',
      },
      ['C:/old/courses', 'C:/old/courses/colle'],
    )

    const result = await migrateDataFolder(disk.api, OLD, NEW)

    expect(result).toMatchObject({ kind: 'migrated', courses: 1, trouble: [] })
    expect(disk.tree['C:/new/courses/colle/course.json']).toBe('{"id":"colle"}')
    expect(disk.tree['C:/new/courses/colle/ch0.json']).toBe('{"id":"ch0"}')
  })

  it('still counts as migrated when a course folder will not copy', async () => {
    const disk = fake(
      {
        'C:/old/progress.json': SAVED,
        'C:/old/courses/colle/course.json': '{"id":"colle"}',
      },
      ['C:/old/courses', 'C:/old/courses/colle'],
    )
    disk.break('read', 'C:/old/courses/colle/course.json', 'it is locked')

    const result = await migrateDataFolder(disk.api, OLD, NEW)

    // Progress is the part that cannot be replaced. A course is a file the
    // trainee still has, so a course that will not copy is worth saying and
    // not worth blocking on.
    expect(result).toMatchObject({ kind: 'migrated', lines: 2, courses: 0 })
    expect(result.kind === 'migrated' && result.trouble[0]).toContain('colle')
    expect(disk.tree['C:/new/progress.json']).toBe(SAVED)
  })

  it('blocks rather than starting blank when the old file cannot be read', async () => {
    const disk = fake({ 'C:/old/progress.json': SAVED })
    disk.break('read', 'C:/old/progress.json', 'it is locked')

    const result = await migrateDataFolder(disk.api, OLD, NEW)

    expect(result.kind).toBe('failed')
    expect(result.kind === 'failed' && result.reason).toContain('C:/old')
    expect(disk.tree['C:/new/progress.json']).toBeUndefined()
  })

  it('blocks rather than starting blank when the old file will not parse', async () => {
    const disk = fake({ 'C:/old/progress.json': 'not json at all' })

    const result = await migrateDataFolder(disk.api, OLD, NEW)

    expect(result.kind).toBe('failed')
    expect(disk.tree['C:/new/progress.json']).toBeUndefined()
  })

  it('blocks and writes nothing when the new folder cannot even be checked', async () => {
    const disk = fake({ 'C:/old/progress.json': SAVED })
    disk.break('exists', 'C:/new/progress.json', 'not allowed')

    const result = await migrateDataFolder(disk.api, OLD, NEW)

    expect(result.kind).toBe('failed')
    expect(disk.tree['C:/new/progress.json']).toBeUndefined()
  })

  it('blocks when the copy cannot be written', async () => {
    const disk = fake({ 'C:/old/progress.json': SAVED })
    disk.break('write', 'C:/new/progress.json', 'not allowed')

    const result = await migrateDataFolder(disk.api, OLD, NEW)

    expect(result.kind).toBe('failed')
    expect(disk.tree['C:/new/progress.json']).toBeUndefined()
  })

  it('removes a copy that does not read back as the original', async () => {
    const disk = fake({ 'C:/old/progress.json': SAVED })
    // A write that silently lands short: the case the read-back exists for.
    const original = disk.api.writeTextFile
    disk.api.writeTextFile = async (path, text) => original(path, text.slice(0, 20))

    const result = await migrateDataFolder(disk.api, OLD, NEW)

    expect(result.kind).toBe('failed')
    // Left behind, the short copy would be treated as live at the next start.
    expect(disk.tree['C:/new/progress.json']).toBeUndefined()
    expect(disk.tree['C:/old/progress.json']).toBe(SAVED)
  })

  it('says so when the bad copy cannot be removed either', async () => {
    const disk = fake({ 'C:/old/progress.json': SAVED })
    const original = disk.api.writeTextFile
    disk.api.writeTextFile = async (path, text) => original(path, text.slice(0, 20))
    disk.break('remove', 'C:/new/progress.json', 'not allowed')

    const result = await migrateDataFolder(disk.api, OLD, NEW)

    expect(result.kind).toBe('failed')
    expect(result.kind === 'failed' && result.reason).toContain('by hand')
  })
})

describe('what the trainee is told afterwards', () => {
  it('names both folders and says the old one was left behind', () => {
    const note = migrationNote({
      kind: 'migrated',
      from: 'C:/old',
      to: 'C:/new',
      lines: 2,
      courses: 1,
      trouble: [],
    })

    expect(note).toContain('C:/old')
    expect(note).toContain('C:/new')
    expect(note).toContain('Your 2 learnt lines and 1 course you had added came across')
    expect(note).toContain('delete it yourself')
  })

  it('counts one line as one line', () => {
    const note = migrationNote({
      kind: 'migrated',
      from: 'C:/old',
      to: 'C:/new',
      lines: 1,
      courses: 0,
      trouble: [],
    })

    expect(note).toContain('Your 1 learnt line came across')
    expect(note).not.toContain('course you had added')
  })

  it('does not claim the folder it came from was named after an internal id', () => {
    // True of the identifier folder, false of `Repertoire Trainer`, and the
    // note cannot tell which it came from. So it says what IS true of both:
    // the new folder carries the app's name and the old one no longer does.
    const note = migrationNote({
      kind: 'migrated',
      from: 'C:/AppData/Roaming/Repertoire Trainer',
      to: 'C:/AppData/Roaming/Tabiya',
      lines: 2,
      courses: 0,
      trouble: [],
    })

    expect(note).toContain("carries the app's name")
    expect(note).not.toContain('internal id')
  })

  it('says which courses did not come across', () => {
    const note = migrationNote({
      kind: 'migrated',
      from: 'C:/old',
      to: 'C:/new',
      lines: 0,
      courses: 0,
      trouble: ['colle (it is locked)'],
    })

    expect(note).toContain('Your progress came across')
    expect(note).toContain('colle (it is locked)')
    expect(note).toContain('import them again')
  })
})

/**
 * Two generations of old folder, since phase 47.
 *
 * The app's data has lived in three places: the folder named after the Tauri
 * identifier, then `Repertoire Trainer` from phase 15, then `Tabiya` from phase
 * 47. A trainee arriving from either of the first two has to be carried across,
 * and nobody arriving from neither may have a migration run at them.
 *
 * These drive the real pair: `pickOldRoot` from `paths.ts` chooses the source,
 * `migrateDataFolder` copies it. The folder names are the real ones because
 * which generation wins is the whole question here.
 */
const ROAMING = 'C:/Users/example/AppData/Roaming'

function rootsFor(root: string): DataRoots {
  return {
    root,
    progress: `${root}/progress.json`,
    courses: `${root}/courses`,
    marker: `${root}/progress.marker.json`,
  }
}

const TABIYA = rootsFor(`${ROAMING}/Tabiya`)
/** Newest first, exactly as `oldDataRoots()` returns them. */
const OLDER = [
  rootsFor(`${ROAMING}/Repertoire Trainer`),
  rootsFor(`${ROAMING}/com.nick.london-trainer`),
]

const ONE_LINE = JSON.stringify(
  { version: 4, learntLines: ['london-white/ch1:d4 d5 Bf4'], cards: {}, tagHistory: {}, playGames: [] },
  null,
  2,
)

/** The whole of what the desktop store does on its first read of a session. */
async function carryAcross(files: MigrationFiles) {
  return migrateDataFolder(files, await pickOldRoot(files.exists, OLDER), TABIYA)
}

describe('arriving from an older folder', () => {
  it('carries the phase 15 folder across and counts the lines on the far side', async () => {
    // Both old generations hold a file. The newer one is the one the app was
    // last saving to, so it is the one that must win.
    const disk = fake({
      [OLDER[0].progress]: SAVED,
      [OLDER[1].progress]: ONE_LINE,
    })

    const result = await carryAcross(disk.api)

    expect(result).toMatchObject({
      kind: 'migrated',
      from: `${ROAMING}/Repertoire Trainer`,
      to: `${ROAMING}/Tabiya`,
      lines: 2,
    })
    // Counted in the copy rather than in the source, which is what makes the
    // new folder safe to treat as live.
    expect(parseProgressJson(disk.tree[TABIYA.progress]).learntLines).toHaveLength(2)
    expect(disk.tree[OLDER[0].progress]).toBe(SAVED)
    expect(disk.tree[OLDER[1].progress]).toBe(ONE_LINE)
  })

  it('reaches past the phase 15 folder when nobody ever used it', async () => {
    // A trainee who last ran the app before phase 15 and is upgrading now.
    const disk = fake({ [OLDER[1].progress]: ONE_LINE })

    const result = await carryAcross(disk.api)

    expect(result).toMatchObject({
      kind: 'migrated',
      from: `${ROAMING}/com.nick.london-trainer`,
      lines: 1,
    })
    expect(disk.tree[TABIYA.progress]).toBe(ONE_LINE)
  })

  it('keeps looking when an old folder cannot even be looked at', async () => {
    // A missing capability grant throws rather than answering no. The older
    // generation is still worth asking about.
    const disk = fake({ [OLDER[1].progress]: ONE_LINE })
    disk.break('exists', OLDER[0].progress, 'not allowed')

    expect(await carryAcross(disk.api)).toMatchObject({
      kind: 'migrated',
      from: `${ROAMING}/com.nick.london-trainer`,
    })
  })

  it('runs no migration at all for a fresh install', async () => {
    const disk = fake({})

    expect(await carryAcross(disk.api)).toEqual({ kind: 'not-needed' })
    // Nothing anywhere: not the file, not the folder. A fresh install starts
    // blank because it IS blank, and `safety.ts` owns that decision from here.
    expect(disk.tree[TABIYA.progress]).toBeUndefined()
    expect(disk.dirs.has(TABIYA.root)).toBe(false)
  })

  it('blocks rather than starting blank when the copy cannot be written', async () => {
    // The shape of a capability scope that did not follow the folders.
    const disk = fake({ [OLDER[0].progress]: SAVED })
    disk.break('write', TABIYA.progress, 'not allowed')

    const result = await carryAcross(disk.api)

    expect(result.kind).toBe('failed')
    expect(result.kind === 'failed' && result.reason).toContain(`${ROAMING}/Repertoire Trainer`)
    expect(disk.tree[TABIYA.progress]).toBeUndefined()
    expect(disk.tree[OLDER[0].progress]).toBe(SAVED)
  })
})
