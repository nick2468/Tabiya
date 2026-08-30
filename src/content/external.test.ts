import { describe, expect, it } from 'vitest'
import { scanCourses, type CourseFiles } from './external'
import { manifest } from '../test/fixtures'

/**
 * Reading course folders that somebody copied in by hand.
 *
 * These are not tidy folders authored in this repo: they are whatever ended up
 * in AppData, so every case here is a real way that goes wrong. The rule
 * throughout is that one bad folder costs the trainee that folder and nothing
 * else.
 */

const CHAPTER = {
  id: 'ch-one',
  title: 'One',
  intro: 'Typical mistakes: rushing.',
  stem: ['d4', 'd5'],
  tree: [
    {
      san: 'Bf4',
      note: 'Out with the bishop before e3 shuts it in.',
      tags: ['bishop-placement'],
      name: 'The London setup',
      plan: 'Follow with e3, c3 and Nf3.',
    },
  ],
}

/** A fake courses folder: folder name to filename to file text. */
function fake(tree: Record<string, Record<string, string>>): CourseFiles {
  return {
    folders: async () => Object.keys(tree),
    files: async (folder) => Object.keys(tree[folder] ?? {}),
    read: async (folder, file) => {
      const text = tree[folder]?.[file]
      if (text === undefined) throw new Error(`no such file: ${file}`)
      return text
    },
  }
}

const goodFolder = {
  'course.json': JSON.stringify(manifest({ id: 'dropped-in', chapters: ['one.json'] })),
  'one.json': JSON.stringify(CHAPTER),
}

describe('scanCourses', () => {
  it('finds nothing when the folder is empty', async () => {
    expect(await scanCourses(fake({}))).toEqual([])
  })

  it('reads a valid course folder', async () => {
    const [entry] = await scanCourses(fake({ 'my-course': goodFolder }))
    expect(entry.origin).toBe('external')
    expect(entry.errors).toEqual([])
    expect(entry.course?.id).toBe('dropped-in')
    expect(entry.course?.chapters).toHaveLength(1)
    // The folder name is what the catalog falls back to naming.
    expect(entry.source).toBe('my-course')
  })

  it('says so when a folder has no manifest, rather than ignoring it', async () => {
    // A folder of chapter files with no course.json is the likeliest mistake:
    // someone copied the chapters and forgot the manifest.
    const [entry] = await scanCourses(fake({ loose: { 'one.json': JSON.stringify(CHAPTER) } }))
    expect(entry.course).toBeNull()
    expect(entry.errors[0].message).toContain('no course.json')
  })

  it('names the file when one will not parse', async () => {
    const [entry] = await scanCourses(
      fake({ broken: { ...goodFolder, 'one.json': '{ half a file' } }),
    )
    expect(entry.course).toBeNull()
    expect(entry.errors[0].chapter).toBe('one.json')
    expect(entry.errors[0].message).toContain('could not be read')
  })

  it('passes a content fault through, so the trainee sees what to fix', async () => {
    const illegal = { ...CHAPTER, tree: [{ ...CHAPTER.tree[0], san: 'Bf7' }] }
    const [entry] = await scanCourses(
      fake({ wrong: { ...goodFolder, 'one.json': JSON.stringify(illegal) } }),
    )
    expect(entry.course).toBeNull()
    expect(entry.errors[0].message).toContain('not legal')
  })

  it('ignores files that are not JSON', async () => {
    const [entry] = await scanCourses(
      fake({ notes: { ...goodFolder, 'README.txt': 'my notes about this course' } }),
    )
    expect(entry.errors).toEqual([])
    expect(entry.course?.id).toBe('dropped-in')
  })

  it('lets one bad folder cost only itself', async () => {
    const entries = await scanCourses(
      fake({
        broken: { 'one.json': JSON.stringify(CHAPTER) },
        fine: goodFolder,
      }),
    )
    expect(entries).toHaveLength(2)
    expect(entries[0].course).toBeNull()
    expect(entries[1].course?.id).toBe('dropped-in')
  })

  it('reports a folder it cannot read at all, rather than throwing', async () => {
    const unreadable: CourseFiles = {
      folders: async () => ['locked'],
      files: async () => {
        throw new Error('access is denied')
      },
      read: async () => '',
    }
    const [entry] = await scanCourses(unreadable)
    expect(entry.errors[0].message).toContain('access is denied')
  })

  it('reports a courses folder it cannot list at all', async () => {
    const unreadable: CourseFiles = {
      folders: async () => {
        throw new Error('access is denied')
      },
      files: async () => [],
      read: async () => '',
    }
    const [entry] = await scanCourses(unreadable)
    expect(entry.source).toBe('courses')
    expect(entry.errors[0].message).toContain('could not be read')
  })
})
