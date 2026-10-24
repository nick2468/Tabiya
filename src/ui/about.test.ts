import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { About } from './About'
import { REPOSITORY_URL } from './repository'

/**
 * The About screen says a small number of things, and each one is held here
 * because each one is easy to get wrong while making something else work.
 *
 * The version must be the build's own, not a number typed into the screen.
 * The word's origin must stay as narrow as the chip drew it: the meaning and
 * the shatranj history are well attested and the Arabic ROOT is not, so the
 * screen names no root. And the licence paragraph is the notice a GPL program
 * owes its user, so it must keep saying what it says.
 */
const html = renderToStaticMarkup(createElement(About))

/** The rendered text, tags gone and whitespace folded, the way a person reads it. */
const text = html
  .replace(/<[^>]*>/g, ' ')
  .replace(/&#x27;|&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim()

describe('the About screen', () => {
  it('shows the version the build carries, not a number of its own', () => {
    expect(text).toContain(`Tabiya v${__APP_VERSION__}`)
  })

  it('names who made it and where the source is', () => {
    expect(text).toContain('Made by Nick Walker.')
    expect(text).toContain('github.com/nick2468/Tabiya')
  })

  it('links the address, in a browser, into a new tab that cannot reach back', () => {
    // A string render is the browser build: `isDesktop()` is false outside the
    // Tauri window. The desktop's own link is a button that asks the opener,
    // and that one is proved in a packaged build, where its permission lives.
    const anchor = html.match(/<a [^>]*>github\.com\/nick2468\/Tabiya<\/a>/)?.[0] ?? ''
    expect(anchor).toContain(`href="${REPOSITORY_URL}"`)
    expect(anchor).toContain('target="_blank"')
    expect(anchor).toContain('rel="noopener noreferrer"')
  })

  it('says what a tabiya is', () => {
    expect(text).toContain(
      'A tabiya is a standard position in an opening: the point a well-known sequence of ' +
        'moves reliably reaches, after which the game branches and both players have real ' +
        'choices again.',
    )
    expect(text).toContain('Each chapter in this app teaches one, and the plans that follow from it.')
  })

  it('gives the shatranj history and names no Arabic root', () => {
    expect(text).toContain('The word is Arabic in origin and comes from shatranj')
    expect(text).toContain('to get straight to the fight.')
    // The root is disputed between two different words. Both glosses are
    // everywhere, and neither belongs on this screen.
    expect(text.toLowerCase()).not.toContain('battle array')
    expect(text.toLowerCase()).not.toContain('arrangement')
    expect(text.toLowerCase()).not.toContain('normal manner')
  })

  it('carries the notices a GPL program owes whoever runs it', () => {
    // GPL-3.0 section 0: a program with an interactive user interface displays an
    // appropriate copyright notice. "Made by" is not one, so the notice itself is on
    // the face of the screen and not only inside the licence text a click away.
    expect(text).toContain('copyright (c) 2026 Nick Walker')
    expect(text).toContain('free software under the MIT licence.')
    expect(text).toContain('Stockfish (GPL-3.0), the engine you play against')
    expect(text).toContain('chessground (GPL-3.0-or-later), the board')
    expect(text).toContain(
      'this program as a whole is distributed under the GNU General Public License version 3.',
    )
    expect(text).toContain('You may copy, change and share it under those terms.')
    expect(text).toContain('It comes with no warranty.')
    expect(text).toContain('The complete source is at the address above.')
  })
})
