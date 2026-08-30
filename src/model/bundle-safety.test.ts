import { describe, expect, it } from 'vitest'
import { pgnToCourse } from './bundle'
import { loadCourse } from './course'

/**
 * A bundle comes from a stranger, and its ids become paths.
 *
 * `src/model/bundle.ts` names each chapter file `<ChapterId>.json`, and
 * `src/ui/bundles.ts` joins that onto the course folder before writing it. So a
 * chapter id holding a slash or a `..` escapes the folder and lands wherever it
 * points. The app's own `progress.json` sits two levels up, and the write scope
 * covers the home directory, so the reach was real rather than theoretical.
 *
 * Found at review gate 11 and fixed in the loader, which is the root: the same
 * check then guards a folder copied in by hand, and the id also travels into
 * every line id in the progress file.
 */

function bundleWith(chapterId: string, courseId = 'test-course') {
  return [
    `[CourseId "${courseId}"]`,
    '[CourseTitle "Test"]',
    '[StudentColour "white"]',
    '[Tagline "A test bundle."]',
    '[FormatVersion "1"]',
    `[ChapterId "${chapterId}"]`,
    '[ChapterTitle "One"]',
    '',
    '{An intro. Typical mistakes at this level: none.}',
    '',
    '1. e4 {The move. [%tags development]} 1... e5 {A reply. [%weight 5]} ' +
      '2. Nf3 {Develop. [%tags development] [%plan Castle.] [%line The only line]} *',
    '',
  ].join('\n')
}

/** The whole import path, short of touching the filesystem. */
function importPath(text: string) {
  const read = pgnToCourse(text)
  if (!read.manifest || read.errors.length > 0) return { blocked: true, names: [] as string[] }
  const loaded = loadCourse(read.manifest, read.files)
  return {
    blocked: loaded.errors.length > 0 || !loaded.course,
    names: Object.keys(read.files),
  }
}

describe('a hostile bundle cannot choose where its files land', () => {
  it('accepts an ordinary chapter id, so the refusals below mean something', () => {
    const result = importPath(bundleWith('ch0-intro'))
    expect(result.blocked).toBe(false)
    expect(result.names).toEqual(['ch0-intro.json'])
  })

  const attacks: [string, string][] = [
    ['parent traversal', '../../../evil'],
    ['windows traversal', '..\\..\\..\\evil'],
    ['an absolute path', '/etc/passwd'],
    ['a drive letter', 'C:/Users/nick2/evil'],
    ['a slash anywhere', 'ch0/../../evil'],
    ['a trailing dot', 'ch0.'],
    ['bare dots', '..'],
    ['a null byte', 'ch0\u0000evil'],
  ]

  for (const [name, id] of attacks) {
    it(`refuses ${name}`, () => {
      const result = importPath(bundleWith(id))
      expect(
        result.blocked,
        `"${id}" was accepted and would be written as ${JSON.stringify(result.names)}`,
      ).toBe(true)
    })
  }

  it('refuses a course id that escapes its folder', () => {
    // Already guarded when this was written; pinned so it stays that way.
    expect(importPath(bundleWith('ch0-intro', '../../../evil')).blocked).toBe(true)
  })
})
