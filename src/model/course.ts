import { loadChapter } from './loader'
import {
  CORE_TAGS,
  COURSE_FORMAT_VERSION,
  otherColour,
  type Colour,
  type ContentError,
  type CourseLoadResult,
  type CourseManifest,
  type LoadedChapter,
  type LoadedCourse,
} from './types'

/**
 * Loading a course: a manifest plus the chapter files it names.
 *
 * A course is one repertoire for one colour (SPEC.md section 10). The chapter
 * format did not change to make this work - what changed is that a chapter is
 * no longer read on its own. It is read as part of a course, which is where the
 * student's colour and the tag vocabulary come from.
 *
 * The same discipline as the chapter loader: every error is collected, none
 * thrown, so one pass shows everything wrong. A course with a fault still
 * appears, with its errors, rather than vanishing.
 *
 * One error is different in kind. A course written to a newer format version is
 * refused outright and nothing else about it is checked, because this build
 * cannot know what the fields it does not recognise were meant to mean. That is
 * the rule the progress file already follows.
 */

const MANIFEST_FIELDS = new Set([
  'id',
  'title',
  'colour',
  'tagline',
  'formatVersion',
  'chapters',
  'tagExtensions',
])

/** The name manifest-level errors are reported against. */
export const MANIFEST_FILE = 'course.json'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === 'string'

/** Course ids reach into chapter ids and card keys, so they cannot hold the separators. */
const ID = /^[a-z0-9][a-z0-9-]*$/

/**
 * Loads one course.
 *
 * @param rawManifest the parsed course.json, of unknown shape
 * @param files the chapter files of the course folder, parsed, keyed by filename
 */
export function loadCourse(rawManifest: unknown, files: Record<string, unknown>): CourseLoadResult {
  const id = isObject(rawManifest) && isString(rawManifest.id) ? rawManifest.id : MANIFEST_FILE
  const errors: ContentError[] = []
  const fail = (message: string, chapter = MANIFEST_FILE) =>
    errors.push({ course: id, chapter, path: '', message })

  if (!isObject(rawManifest)) {
    fail('course.json must be a JSON object')
    return { ok: false, course: null, errors }
  }

  // The version first, and alone. Everything below assumes this build knows
  // what the fields mean, which is exactly what a newer version denies.
  const formatVersion = rawManifest.formatVersion
  if (typeof formatVersion !== 'number' || !Number.isInteger(formatVersion) || formatVersion < 1) {
    fail('formatVersion must be a whole number of 1 or more')
    return { ok: false, course: null, errors }
  }
  if (formatVersion > COURSE_FORMAT_VERSION) {
    fail(
      `this course is written to course format ${formatVersion}, and this app knows ${COURSE_FORMAT_VERSION}. Update the app to open it.`,
    )
    return { ok: false, course: null, errors }
  }

  for (const field of Object.keys(rawManifest)) {
    if (!MANIFEST_FIELDS.has(field)) fail(`unknown course field "${field}"`)
  }
  if (!isString(rawManifest.id) || !ID.test(rawManifest.id)) {
    fail('id must be lower case letters, numbers and hyphens')
  }
  if (!isString(rawManifest.title) || rawManifest.title.trim() === '') {
    fail('title must be a non-empty string')
  }
  if (!isString(rawManifest.tagline) || rawManifest.tagline.trim() === '') {
    fail('tagline must be a non-empty string')
  }
  if (rawManifest.colour !== 'white' && rawManifest.colour !== 'black') {
    fail('colour must be white or black: it is the colour the student plays')
  }

  const chapterFiles = rawManifest.chapters
  if (!Array.isArray(chapterFiles) || !chapterFiles.every(isString) || chapterFiles.length === 0) {
    fail('chapters must be a non-empty array of filenames, in course order')
  }

  const tags = readTagExtensions(rawManifest.tagExtensions, fail)

  if (errors.length > 0) return { ok: false, course: null, errors }

  const manifest = rawManifest as unknown as CourseManifest
  const colour = manifest.colour as Colour
  const chapters: LoadedChapter[] = []
  const seenIds = new Set<string>()

  for (const file of manifest.chapters) {
    const raw = files[file]
    if (raw === undefined) {
      fail(`the course lists "${file}", which is not in the folder`)
      continue
    }
    const result = loadChapter(raw, { courseId: manifest.id, colour, tags, source: file })
    if (!result.ok) {
      errors.push(...result.errors)
      continue
    }
    // Two chapters with one id would give two lines the same id, and the
    // trainee would tick one and learn the other.
    if (seenIds.has(result.chapter.id)) {
      fail(`two chapters share the id "${result.chapter.fileId}"`, file)
      continue
    }
    seenIds.add(result.chapter.id)
    chapters.push(result.chapter)
  }

  // A file in the folder that the manifest never lists is content nobody will
  // ever see. Worth saying so rather than leaving it to be noticed one day.
  for (const file of Object.keys(files)) {
    if (!manifest.chapters.includes(file)) {
      fail(`"${file}" is in the folder but the course does not list it`, file)
    }
  }

  if (errors.length > 0) return { ok: false, course: null, errors }

  const course: LoadedCourse = {
    id: manifest.id,
    title: manifest.title,
    colour,
    opponentColour: otherColour(colour),
    tagline: manifest.tagline,
    formatVersion: manifest.formatVersion,
    tags,
    chapters,
  }
  return { ok: true, course, errors: [] }
}

/**
 * The course's full tag vocabulary: the shared core plus whatever it adds.
 *
 * A course cannot redeclare a core tag. It would read as though the course
 * owned it, and the Progress view compares courses by exactly these strings.
 */
function readTagExtensions(value: unknown, fail: (message: string) => void): string[] {
  const core = [...CORE_TAGS] as string[]
  if (value === undefined) return core
  if (!Array.isArray(value) || !value.every(isString)) {
    fail('tagExtensions must be an array of tag names')
    return core
  }
  const extensions: string[] = []
  for (const tag of value) {
    if (core.includes(tag)) {
      fail(`"${tag}" is already a core concept tag, so the course need not add it`)
      continue
    }
    if (extensions.includes(tag)) {
      fail(`tagExtensions lists "${tag}" twice`)
      continue
    }
    extensions.push(tag)
  }
  return [...core, ...extensions]
}

/** Every chapter of every course, in course order then chapter order. */
export function allChapters(courses: LoadedCourse[]): LoadedChapter[] {
  return courses.flatMap((course) => course.chapters)
}

/** The course a chapter belongs to, or undefined when it is not in the list. */
export function courseOf(courses: LoadedCourse[], courseId: string): LoadedCourse | undefined {
  return courses.find((course) => course.id === courseId)
}
