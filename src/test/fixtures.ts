import { loadCourse } from '../model/course'
import { loadChapter } from '../model/loader'
import { CORE_TAGS, type ChapterContext, type LoadedChapter, type LoadedCourse } from '../model/types'

/**
 * Fixtures shared by the tests. Nothing in the app imports this file.
 *
 * A chapter can no longer be read on its own: it is read as part of a course,
 * which is where the student's colour and the tag vocabulary come from. That
 * makes a context needed at every call, and one shared here beats twenty
 * copies drifting apart.
 *
 * The Black course matters more than it looks. It is the proof that the colour
 * rules generalised rather than being renamed: its stem starts with the
 * opponent's move, so every parity assumption in the loader, the book and the
 * session gets tested from the other side before a real Black course exists.
 */

/** The vocabulary the fixtures author against: the core set plus two London tags. */
export const FIXTURE_TAGS: string[] = [...CORE_TAGS, 'vs-c5', 'vs-qb6']

/** A context for a White course, which is what most fixtures are. */
export function whiteContext(over: Partial<ChapterContext> = {}): ChapterContext {
  return { courseId: 'test-course', colour: 'white', tags: FIXTURE_TAGS, ...over }
}

/** A context for a Black course: the opponent moves first. */
export function blackContext(over: Partial<ChapterContext> = {}): ChapterContext {
  return { courseId: 'test-black', colour: 'black', tags: FIXTURE_TAGS, ...over }
}

/** Loads a fixture chapter, failing loudly with the first error when it will not load. */
export function loadFixture(raw: unknown, context: ChapterContext = whiteContext()): LoadedChapter {
  const result = loadChapter(raw, context)
  if (!result.ok) throw new Error(`fixture failed: ${result.errors[0]?.message}`)
  return result.chapter
}

/** Loads a fixture course, failing loudly the same way. */
export function loadFixtureCourse(
  manifest: Record<string, unknown>,
  files: Record<string, unknown>,
): LoadedCourse {
  const result = loadCourse(manifest, files)
  if (!result.ok) throw new Error(`fixture course failed: ${result.errors[0]?.message}`)
  return result.course
}

/** A manifest with the boring fields filled in. */
export function manifest(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'test-course',
    title: 'Test course',
    colour: 'white',
    tagline: 'A course that exists to be tested.',
    formatVersion: 1,
    chapters: ['one.json'],
    tagExtensions: ['vs-c5', 'vs-qb6'],
    ...over,
  }
}

/**
 * A small Black course: the Caro-Kann's first moves, seen from Black's side.
 *
 * White opens, so the stem starts with the opponent's move and the tree roots
 * are the student's. Weights sit on White's replies here, which is the mirror
 * image of every White-course fixture.
 */
export const BLACK_CHAPTER = {
  id: 'ch-caro',
  title: 'The Caro-Kann, first moves',
  intro: 'Typical mistakes: playing ...c6 and then forgetting to play ...d5.',
  stem: ['e4'],
  tree: [
    {
      san: 'c6',
      note: 'Prepare ...d5 without shutting the light-squared bishop in behind it.',
      tags: ['development'],
      mistakes: [
        { san: 'e5', grade: 'inaccuracy', note: 'Playable, but it is a different opening.' },
      ],
      children: [
        {
          san: 'd4',
          note: 'White takes the whole centre, which is what the Caro-Kann invites.',
          weight: 8,
          children: [
            {
              san: 'd5',
              note: 'The point: hit e4 now, while the bishop still has c8-h3 to come.',
              tags: ['development'],
              children: [
                {
                  san: 'e5',
                  note: 'The Advance. White gains space and shuts the centre.',
                  weight: 6,
                  children: [
                    {
                      san: 'Bf5',
                      note: 'Out with the bishop before ...e6 locks it in. The whole reason for ...c6.',
                      tags: ['bishop-placement'],
                      name: 'The Advance, with ...Bf5',
                      plan: 'Follow with ...e6, ...Nd7 and ...c5, hitting the base of the chain.',
                    },
                  ],
                },
                {
                  san: 'Nc3',
                  note: 'The main line. White defends e4 and invites the trade.',
                  weight: 5,
                  children: [
                    {
                      san: 'dxe4',
                      note: 'Take, so the knight comes to a square Black can live with.',
                      tags: ['development'],
                      name: 'The main line, with ...dxe4',
                      plan: 'Meet Nxe4 with ...Bf5, trade the good bishop off, and castle.',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

/** The Black fixture as a whole course. */
export function blackCourse(): LoadedCourse {
  return loadFixtureCourse(
    manifest({
      id: 'test-black',
      title: 'Test Caro-Kann',
      colour: 'black',
      tagline: 'A Black course, to prove the colour rules generalised.',
      chapters: ['caro.json'],
      tagExtensions: [],
    }),
    { 'caro.json': BLACK_CHAPTER },
  )
}
