/**
 * Course-scoped identity: how a course id gets into a chapter id, a line id
 * and a card key.
 *
 * The reason it is worth its own module is the progress file. Every one of
 * these strings is written into it, so the shape of them is a data format, not
 * an implementation detail, and the v3-to-v4 migration in src/storage is
 * written against exactly these functions.
 *
 * Two separators, chosen so nothing can be mistaken for anything else. Course
 * ids are kebab case, so neither turns up inside one.
 *
 * - `/` joins a course to a chapter: `london-white/ch2-c5-qb6`.
 * - `#` joins a course to a position: `london-white#rnbq...`. A FEN carries
 *   slashes and spaces of its own, so it needs a separator a FEN cannot hold.
 */

const CHAPTER_SEPARATOR = '/'
const CARD_SEPARATOR = '#'

/** The chapter id as everything above the loader sees it. */
export function qualifyChapterId(courseId: string, fileId: string): string {
  return `${courseId}${CHAPTER_SEPARATOR}${fileId}`
}

/** The course a qualified chapter id belongs to, or null when it carries none. */
export function courseOfChapterId(chapterId: string): string | null {
  const cut = chapterId.indexOf(CHAPTER_SEPARATOR)
  return cut === -1 ? null : chapterId.slice(0, cut)
}

/**
 * A drill card's identity: the course plus the position.
 *
 * Scoped by course on purpose (SPEC.md section 10). The same position can turn
 * up in two repertoires meaning two different things, and one schedule for both
 * would say the trainee knows a move they have never been asked for.
 */
export function cardKey(courseId: string, positionKey: string): string {
  return `${courseId}${CARD_SEPARATOR}${positionKey}`
}

/** The course a card key belongs to, or null when it carries none. */
export function courseOfCardKey(key: string): string | null {
  const cut = key.indexOf(CARD_SEPARATOR)
  return cut === -1 ? null : key.slice(0, cut)
}
