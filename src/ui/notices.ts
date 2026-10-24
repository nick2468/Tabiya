/**
 * The third-party notices, fetched when someone asks to read them.
 *
 * The file is written into every production build by
 * `scripts/notices/plugin.ts`: the copyright and licence notice of every
 * library the program contains, a few hundred kilobytes of it. It is fetched,
 * not imported, so nobody downloads it to start the app and the main bundle
 * does not carry it.
 *
 * A development server has no file to serve, because the notices are read from
 * a finished bundle. It answers with a 404 or with the app's own page instead,
 * so the title line is what decides whether what came back is the notices.
 * `notices.test.ts` holds both strings here to the generator's own.
 */

/** The file's name in `dist`, which is the generator's `NOTICES_FILE`. */
export const NOTICES_PATH = 'third-party-notices.txt'

/** The file's first line, which is the generator's `NOTICES_TITLE`. */
export const NOTICES_TITLE = 'TABIYA THIRD-PARTY NOTICES'

export type NoticesLoad =
  | { kind: 'loaded'; text: string }
  /** No notices to show: a development build, which never has them. */
  | { kind: 'missing' }
  | { kind: 'failed'; why: string }

/** Fetches the notices from beside the app's own page. Never throws. */
export async function loadNotices(fetcher: typeof fetch = fetch): Promise<NoticesLoad> {
  let response: Response
  try {
    response = await fetcher(`${import.meta.env.BASE_URL}${NOTICES_PATH}`)
  } catch (error) {
    return { kind: 'failed', why: error instanceof Error ? error.message : String(error) }
  }
  if (!response.ok) return { kind: 'missing' }
  const text = await response.text()
  return text.startsWith(NOTICES_TITLE) ? { kind: 'loaded', text } : { kind: 'missing' }
}
