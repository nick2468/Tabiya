/**
 * Splitting a chapter intro for the Study layout: a short lead above the
 * board, everything else below the board in its own scrolling panel.
 *
 * The split point is the intro's first "##" section heading. The leading "#"
 * title line is dropped entirely: the view already shows the chapter title,
 * and saying it twice helps nobody.
 */

export interface IntroParts {
  /** The opening prose before the first section heading. */
  lead: string
  /** Everything from the first section heading on. Empty when there are none. */
  rest: string
}

export function splitIntro(intro: string): IntroParts {
  const withoutTitle = intro.replace(/^# [^\n]*\n+/, '')
  const at = withoutTitle.indexOf('\n## ')
  if (at === -1) return { lead: withoutTitle.trim(), rest: '' }
  return { lead: withoutTitle.slice(0, at).trim(), rest: withoutTitle.slice(at + 1).trim() }
}
