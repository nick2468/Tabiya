import { describe, expect, it } from 'vitest'
import { courseToPgn, pgnToCourse } from './bundle'
import { loadCourse } from './course'
import { bundledCourses } from '../content'
import type { Chapter, LoadedCourse } from './types'

/**
 * The bundle format, both ways.
 *
 * The round trip at the bottom is the test that matters. It exports every
 * course that ships with the app, reads the file back, and asserts the result
 * is the same course. That one assertion keeps the reader and the writer in
 * step with each other and with the schema, and it costs a second to run.
 */

const HEADER = [
  '[CourseId "demo-white"]',
  '[CourseTitle "A demonstration"]',
  '[StudentColour "white"]',
  '[Tagline "One line for the tile."]',
  '[FormatVersion "1"]',
].join('\n')

function bundle(body: string, header = HEADER): string {
  return `${header}\n[ChapterId "ch0-demo"]\n[ChapterTitle "The demo"]\n\n${body}\n`
}

/** The chapter a bundle produced, for looking at what the mapping did. */
function chapterOf(text: string): Chapter {
  const read = pgnToCourse(text)
  expect(read.errors).toEqual([])
  return read.files['ch0-demo.json'] as Chapter
}

describe('reading a bundle', () => {
  it('takes the course from the header tags and the chapter from the game', () => {
    const read = pgnToCourse(bundle('{The intro.}\n\n1. d4 {Out first.} *'))
    expect(read.ok).toBe(true)
    expect(read.manifest).toMatchObject({
      id: 'demo-white',
      title: 'A demonstration',
      colour: 'white',
      tagline: 'One line for the tile.',
      formatVersion: 1,
      chapters: ['ch0-demo.json'],
    })
    const chapter = read.files['ch0-demo.json'] as Chapter
    expect(chapter).toMatchObject({ id: 'ch0-demo', title: 'The demo', intro: 'The intro.' })
  })

  it('puts the moves before the first comment in the stem', () => {
    const chapter = chapterOf(bundle('1. d4 d5 2. Bf4 {The system.} *'))
    expect(chapter.stem).toEqual(['d4', 'd5'])
    expect(chapter.tree).toHaveLength(1)
    expect(chapter.tree[0]).toMatchObject({ san: 'Bf4', note: 'The system.' })
  })

  it('turns a plain variation into a sibling and a glyphed one into a mistake', () => {
    const chapter = chapterOf(
      bundle('1. d4 {Out.} (1. Nf3 {Also playable, a different course.}) (1. e4? {Not this one.}) *'),
    )
    expect(chapter.tree.map((node) => node.san)).toEqual(['d4', 'Nf3'])
    expect(chapter.tree[0].mistakes).toEqual([
      { san: 'e4', grade: 'mistake', note: 'Not this one.' },
    ])
  })

  it('reads all three grades from their glyphs', () => {
    const chapter = chapterOf(
      bundle('1. d4 {Out.} (1. c4!? {Fine.}) (1. e4?! {Loose.}) (1. f4? {Bad.}) *'),
    )
    expect(chapter.tree[0].mistakes?.map((m) => m.grade)).toEqual([
      'playable',
      'inaccuracy',
      'mistake',
    ])
  })

  it('reads the optional tokens out of a comment and leaves the note behind', () => {
    const chapter = chapterOf(
      bundle(
        '1. d4 {Out first. [%tags development bishop-placement] [%weight 7] ' +
          '[%plan Castle, then break.] [%csl Gd4] [%cal Gc1f4,Re1e8]} *',
      ),
    )
    expect(chapter.tree[0]).toMatchObject({
      note: 'Out first.',
      tags: ['development', 'bishop-placement'],
      weight: 7,
      plan: 'Castle, then break.',
      shapes: [
        { orig: 'd4', brush: 'green' },
        { orig: 'c1', dest: 'f4', brush: 'green' },
        { orig: 'e1', dest: 'e8', brush: 'red' },
      ],
    })
  })

  it('ignores a token it has no use for rather than refusing the file', () => {
    // Lichess writes clocks and evaluations into study comments.
    const chapter = chapterOf(bundle('1. d4 {Out. [%clk 0:05:00] [%eval 0.2]} *'))
    expect(chapter.tree[0].note).toBe('Out.')
  })

  it('reads a chapter default tag list from the header', () => {
    const chapter = chapterOf(
      bundle('1. d4 {Out.} *').replace(
        '[ChapterTitle "The demo"]',
        '[ChapterTitle "The demo"]\n[DefaultTags "development"]',
      ),
    )
    expect(chapter.defaultTags).toEqual(['development'])
  })

  it('takes chapter order from game order', () => {
    const read = pgnToCourse(
      `${HEADER}\n[ChapterId "ch0-a"]\n[ChapterTitle "A"]\n\n1. d4 {One.} *\n\n` +
        `${HEADER}\n[ChapterId "ch1-b"]\n[ChapterTitle "B"]\n\n1. d4 {Two.} *\n`,
    )
    expect(read.manifest?.chapters).toEqual(['ch0-a.json', 'ch1-b.json'])
  })

  describe('what it refuses', () => {
    const messages = (text: string) => pgnToCourse(text).errors.map((error) => error.message)

    it('refuses course details that disagree between games', () => {
      const other = HEADER.replace('demo-white', 'other-white')
      const text =
        `${HEADER}\n[ChapterId "ch0-a"]\n[ChapterTitle "A"]\n\n1. d4 {One.} *\n\n` +
        `${other}\n[ChapterId "ch1-b"]\n[ChapterTitle "B"]\n\n1. d4 {Two.} *\n`
      expect(messages(text).some((m) => m.includes('have to match'))).toBe(true)
    })

    it('names a missing course header tag', () => {
      const text = bundle('1. d4 {Out.} *', HEADER.replace('[Tagline "One line for the tile."]', ''))
      expect(messages(text).some((m) => m.includes('[Tagline'))).toBe(true)
    })

    it('names a game with no chapter id', () => {
      const text = `${HEADER}\n[ChapterTitle "The demo"]\n\n1. d4 {Out.} *\n`
      expect(messages(text).some((m) => m.includes('[ChapterId'))).toBe(true)
    })

    it('names two chapters that share an id', () => {
      const text =
        `${HEADER}\n[ChapterId "same"]\n[ChapterTitle "A"]\n\n1. d4 {One.} *\n\n` +
        `${HEADER}\n[ChapterId "same"]\n[ChapterTitle "B"]\n\n1. d4 {Two.} *\n`
      expect(messages(text).some((m) => m.includes('both call themselves'))).toBe(true)
    })

    it('refuses a colour that is not white or black', () => {
      const text = bundle('1. d4 {Out.} *', HEADER.replace('"white"', '"green"'))
      expect(messages(text).some((m) => m.includes('StudentColour'))).toBe(true)
    })

    it('names a graded alternative that carries a continuation, and says what to do', () => {
      const text = bundle('1. d4 {Out.} (1. e4? {Bad.} e5 2. Nf3) *')
      const said = messages(text)
      expect(said.some((m) => m.includes('nowhere to keep them'))).toBe(true)
      expect(said.some((m) => m.includes('Put the refutation in the comment'))).toBe(true)
    })

    it('names a glyph it has no meaning for rather than guessing', () => {
      const text = bundle('1. d4 {Out.} (1. e4! {Good?}) *')
      expect(messages(text).some((m) => m.includes('no meaning for'))).toBe(true)
    })

    it('refuses the whole file when the movetext will not parse', () => {
      const read = pgnToCourse(bundle('1. d4 {never closed'))
      expect(read.ok).toBe(false)
      expect(read.manifest).toBeNull()
      expect(read.files).toEqual({})
    })

    it('refuses a file with no games in it', () => {
      expect(messages('')).toEqual(['there is no game in this file, so there is no chapter in it either'])
    })
  })
})

describe('writing a bundle', () => {
  it('refuses to write prose containing a brace, rather than truncating it', () => {
    const course = fakeCourse('A note with a { in it.')
    const written = courseToPgn(course)
    expect(written.ok).toBe(false)
    expect(written.errors[0].message).toContain('brace')
  })

  it('refuses to write prose that would read back as one of its own tokens', () => {
    const course = fakeCourse('A note mentioning [%weight 3] somehow.')
    expect(courseToPgn(course).errors[0].message).toContain('[%')
  })
})

/** A one-move course with a chosen note, for the two writer refusals. */
function fakeCourse(note: string): LoadedCourse {
  const result = loadCourse(
    {
      id: 'fake-white',
      title: 'Fake',
      colour: 'white',
      tagline: 'For a test.',
      formatVersion: 1,
      chapters: ['ch0.json'],
    },
    {
      'ch0.json': {
        id: 'ch0',
        title: 'Only',
        intro: 'Lead.\n\n## Typical mistakes at this level\n\nNone.',
        stem: [],
        tree: [
          {
            san: 'd4',
            note,
            tags: ['development'],
            name: 'The one-move line',
            plan: 'Play on.',
          },
        ],
      },
    },
  )
  if (!result.course) throw new Error(result.errors.map((error) => error.message).join('; '))
  return result.course
}

describe('the bundles checked into docs', () => {
  // The PGN copies under docs/bundles are generated by scripts/export-bundles.mjs
  // and are what a person shares or re-imports. Generated files in a repo go
  // stale silently, so the suite holds them to the writer's current output
  // rather than trusting whoever last edited a course to have re-exported.
  // Read the same way the app reads its content, through Vite, so the test
  // needs no filesystem and runs wherever the suite does.
  const onDisk = import.meta.glob<string>('../../docs/bundles/*.pgn', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  it.each(bundledCourses.map((course) => [course.id, course] as const))(
    'has docs/bundles/%s.pgn matching what the writer produces now',
    (id, course) => {
      const path = `../../docs/bundles/${id}.pgn`
      expect(Object.keys(onDisk), `${id} has no exported bundle`).toContain(path)
      expect(onDisk[path], 'run: node scripts/export-bundles.mjs').toBe(courseToPgn(course).text)
    },
  )
})

describe('the round trip', () => {
  /**
   * Every course that ships with the app, out to a bundle and back.
   *
   * This is the only thing keeping the reader and the writer honest at the same
   * time. If the format cannot carry something the schema holds, this is where
   * it shows up, and it shows up as a difference rather than as silence.
   */
  it.each(bundledCourses.map((course) => [course.id, course] as const))(
    'exports %s and reads it back as the same course',
    (_id, course) => {
      const written = courseToPgn(course)
      expect(written.errors).toEqual([])

      const read = pgnToCourse(written.text)
      expect(read.errors).toEqual([])

      const reloaded = loadCourse(read.manifest, read.files)
      expect(reloaded.errors).toEqual([])
      expect(reloaded.course).toEqual(course)
    },
  )

  it('keeps board shapes in the order they were drawn', () => {
    // The round trip caught this one: the London draws an arrow and then a
    // circle, and writing all the circles first quietly swapped them.
    const chapter = chapterOf(
      bundle('1. d4 {Out. [%cal Re5d6] [%csl Ge5] [%cal Bc1f4]} *'),
    )
    expect(chapter.tree[0].shapes).toEqual([
      { orig: 'e5', dest: 'd6', brush: 'red' },
      { orig: 'e5', brush: 'green' },
      { orig: 'c1', dest: 'f4', brush: 'blue' },
    ])
  })

  it('writes a file a chess GUI would recognise, with numbered moves and a result', () => {
    const text = courseToPgn(bundledCourses[0]).text
    expect(text).toMatch(/\[CourseId "/)
    expect(text).toMatch(/\n1\. /)
    expect(text.trimEnd().endsWith('*')).toBe(true)
  })
})
