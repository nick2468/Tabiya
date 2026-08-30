import { describe, expect, it } from 'vitest'
import { loadCourse, loadedCourses, mergeCourses } from './course'
import { COURSE_FORMAT_VERSION, type CourseEntry } from './types'
import { BLACK_CHAPTER, blackCourse, manifest } from '../test/fixtures'

/**
 * The manifest is what turns a folder of chapter files into a course. These
 * are the rules it has to hold up under, including the one that matters most:
 * a course from a future version of the format is refused rather than
 * half-read.
 */

/** A minimal valid chapter, so the manifest is what is being tested. */
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

const files = { 'one.json': CHAPTER }

describe('loadCourse', () => {
  it('loads a valid course and attaches the colours', () => {
    const result = loadCourse(manifest(), files)
    expect(result.errors).toEqual([])
    if (!result.ok) throw new Error('expected the course to load')
    expect(result.course.id).toBe('test-course')
    expect(result.course.colour).toBe('white')
    expect(result.course.opponentColour).toBe('black')
    expect(result.course.chapters).toHaveLength(1)
  })

  it('prefixes every chapter id with the course, and keeps the authored one', () => {
    const { course } = loadCourse(manifest(), files)
    expect(course?.chapters[0].id).toBe('test-course/ch-one')
    expect(course?.chapters[0].fileId).toBe('ch-one')
    expect(course?.chapters[0].courseId).toBe('test-course')
  })

  it('keeps the chapters in the order the manifest lists them', () => {
    const second = { ...CHAPTER, id: 'ch-two', title: 'Two' }
    const { course } = loadCourse(manifest({ chapters: ['two.json', 'one.json'] }), {
      'one.json': CHAPTER,
      'two.json': second,
    })
    expect(course?.chapters.map((chapter) => chapter.fileId)).toEqual(['ch-two', 'ch-one'])
  })

  it('builds the vocabulary from the core set plus the course extensions', () => {
    const { course } = loadCourse(manifest({ tagExtensions: ['vs-c5'] }), files)
    expect(course?.tags).toContain('development')
    expect(course?.tags).toContain('vs-c5')
    expect(course?.tags).not.toContain('vs-kid')
  })

  it('lets a course use a tag it declared, and refuses one it did not', () => {
    const tagged = { ...CHAPTER, tree: [{ ...CHAPTER.tree[0], tags: ['vs-c5'] }] }
    expect(loadCourse(manifest({ tagExtensions: ['vs-c5'] }), { 'one.json': tagged }).ok).toBe(true)
    const undeclared = loadCourse(manifest({ tagExtensions: [] }), { 'one.json': tagged })
    expect(undeclared.ok).toBe(false)
    expect(undeclared.errors[0].message).toContain('not in the concept tag vocabulary')
  })
})

describe('loadCourse, the format version', () => {
  it('refuses a course from a newer format, and checks nothing else about it', () => {
    // The same rule the progress file follows: a file from the future is not a
    // file with a few unknown fields. Note the manifest is also missing a
    // title, and the version is the only thing reported.
    const result = loadCourse(
      { id: 'future', formatVersion: COURSE_FORMAT_VERSION + 1, chapters: [] },
      {},
    )
    expect(result.ok).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('Update the app')
  })

  it('refuses a manifest with no version at all', () => {
    const result = loadCourse(manifest({ formatVersion: undefined }), files)
    expect(result.errors[0].message).toContain('formatVersion')
  })
})

describe('loadCourse, negative fixtures', () => {
  const firstError = (
    over: Record<string, unknown>,
    given: Record<string, unknown> = files,
  ) => loadCourse(manifest(over), given).errors[0]?.message ?? ''

  it('refuses an id that could be mistaken for a path or a card key', () => {
    // Course ids reach into chapter ids and card keys, so the separators
    // cannot appear inside one.
    expect(firstError({ id: 'london/white' })).toContain('lower case letters')
    expect(firstError({ id: 'london#white' })).toContain('lower case letters')
  })

  it('refuses a colour that is not a colour', () => {
    expect(firstError({ colour: 'green' })).toContain('the colour the student plays')
  })

  it('refuses an empty title or tagline', () => {
    expect(firstError({ title: '' })).toContain('title')
    expect(firstError({ tagline: '  ' })).toContain('tagline')
  })

  it('refuses an unknown manifest field, so a typo cannot pass silently', () => {
    expect(firstError({ chapterOrder: ['one.json'] })).toBe('unknown course field "chapterOrder"')
  })

  it('says which listed chapter is missing from the folder', () => {
    expect(firstError({ chapters: ['one.json', 'gone.json'] })).toContain('"gone.json"')
  })

  it('says when a file in the folder is not listed, so no chapter goes unseen', () => {
    const message = firstError({ chapters: ['one.json'] }, {
      'one.json': CHAPTER,
      'stray.json': { ...CHAPTER, id: 'ch-stray' },
    })
    expect(message).toContain('does not list it')
  })

  it('refuses two chapters sharing an id, which would give two lines one id', () => {
    const message = firstError({ chapters: ['one.json', 'copy.json'] }, {
      'one.json': CHAPTER,
      'copy.json': CHAPTER,
    })
    expect(message).toContain('two chapters share the id')
  })

  it('refuses a course redeclaring a core tag', () => {
    expect(firstError({ tagExtensions: ['development'] })).toContain('already a core concept tag')
  })

  it('passes a chapter fault through, naming the course it is in', () => {
    const broken = { ...CHAPTER, tree: [{ ...CHAPTER.tree[0], san: 'Bf7' }] }
    const result = loadCourse(manifest(), { 'one.json': broken })
    expect(result.ok).toBe(false)
    expect(result.errors[0]).toMatchObject({ course: 'test-course', chapter: 'ch-one' })
    expect(result.errors[0].message).toContain('not legal')
  })

  it('refuses something that is not an object', () => {
    expect(loadCourse('nope', {}).errors[0].message).toContain('JSON object')
  })
})

describe('a Black course', () => {
  it('loads with the colours the other way round', () => {
    const course = blackCourse()
    expect(course.colour).toBe('black')
    expect(course.opponentColour).toBe('white')
    expect(course.chapters[0].stem).toEqual(['e4'])
  })

  it('holds its chapter to the same rules, read from Black\'s side', () => {
    // Weights belong on the opponent, who is White here. Putting one on the
    // student's move must fail exactly as it would in a White course.
    const wrong = {
      ...BLACK_CHAPTER,
      tree: [{ ...BLACK_CHAPTER.tree[0], weight: 5 }],
    }
    const result = loadCourse(
      manifest({ id: 'test-black', colour: 'black', chapters: ['caro.json'], tagExtensions: [] }),
      { 'caro.json': wrong },
    )
    expect(result.ok).toBe(false)
    expect(result.errors[0].message).toBe('weight belongs on White moves only')
  })
})

/**
 * Merging the bundled courses with whatever was dropped into the AppData
 * folder. Both rules here exist to stop a folder someone copied in from
 * quietly taking over a course they have been drilling for months.
 */
describe('mergeCourses', () => {
  const entry = (id: string, origin: 'bundled' | 'external'): CourseEntry => {
    const result = loadCourse(manifest({ id, chapters: ['one.json'] }), files)
    if (!result.ok) throw new Error(`fixture failed: ${result.errors[0]?.message}`)
    return { source: id, origin, course: result.course, errors: [] }
  }

  const broken: CourseEntry = {
    source: 'half-a-course',
    origin: 'external',
    course: null,
    errors: [{ course: 'half-a-course', chapter: 'course.json', path: '', message: 'no id' }],
  }

  it('lists the bundled courses first, then the ones dropped in', () => {
    const merged = mergeCourses(
      [entry('london-white', 'bundled')],
      [entry('caro-black', 'external')],
    )
    expect(merged.map((e) => e.course?.id)).toEqual(['london-white', 'caro-black'])
    expect(loadedCourses(merged)).toHaveLength(2)
  })

  it('refuses a dropped-in course claiming a bundled id, and says why', () => {
    const merged = mergeCourses(
      [entry('london-white', 'bundled')],
      [entry('london-white', 'external')],
    )
    expect(merged).toHaveLength(2)
    // The bundled one is untouched, which is the point.
    expect(merged[0].course?.id).toBe('london-white')
    expect(merged[0].origin).toBe('bundled')
    // The copy appears saying what is wrong, rather than vanishing.
    expect(merged[1].course).toBeNull()
    expect(merged[1].errors[0].message).toContain('built in')
    expect(loadedCourses(merged)).toHaveLength(1)
  })

  it('refuses a second dropped-in course claiming the same id', () => {
    // Progress keys hang off the id, so two courses with one id would share a
    // drill schedule and each would answer for the other.
    const merged = mergeCourses([], [entry('caro-black', 'external'), entry('caro-black', 'external')])
    expect(merged[0].course?.id).toBe('caro-black')
    expect(merged[1].course).toBeNull()
    expect(merged[1].errors[0].message).toContain('already uses the course id')
  })

  it('keeps a folder that would not load, with its own errors', () => {
    const merged = mergeCourses([entry('london-white', 'bundled')], [broken])
    expect(merged).toHaveLength(2)
    expect(merged[1]).toBe(broken)
  })

  it('does nothing at all when nothing was dropped in', () => {
    const bundled = [entry('london-white', 'bundled')]
    expect(mergeCourses(bundled, [])).toEqual(bundled)
  })
})

describe('a course that contradicts itself', () => {
  /**
   * Two chapters reaching one position and expecting different moves. Drill
   * asks by position, so one of them could never be asked, and until phase 11
   * only the content suite caught it - which a trainee importing a course
   * cannot run.
   */
  const INTRO = 'Lead.\n\n## Typical mistakes at this level\n\nNone.'

  it('is refused, naming both chapters and both moves', () => {
    const chapter = (id: string, second: string) => ({
      id,
      title: id,
      intro: INTRO,
      stem: ['d4', 'd5'],
      tree: [
        {
          san: 'Bf4',
          note: 'Out with the bishop.',
          tags: ['development'],
          children: [
            {
              san: 'Nf6',
              note: 'Develop.',
              weight: 7,
              children: [
                { san: second, note: 'The follow-up.', tags: ['development'], name: 'The follow-up line', plan: 'Play on.' },
              ],
            },
          ],
        },
      ],
    })
    const result = loadCourse(
      {
        id: 'clash-white',
        title: 'Clash',
        colour: 'white',
        tagline: 'Two answers to one position.',
        formatVersion: 1,
        chapters: ['a.json', 'b.json'],
      },
      { 'a.json': chapter('ch-a', 'e3'), 'b.json': chapter('ch-b', 'Nf3') },
    )
    expect(result.course).toBeNull()
    expect(result.errors.some((error) => error.message.includes('could never be asked'))).toBe(true)
  })
})
