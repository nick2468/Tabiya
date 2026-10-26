// Node types for `node:fs`, which `tsconfig.app.json` does not load: it lists
// `vite/client` alone. Every file here that reads one declares its own, rather
// than leaning on another test file happening to declare it first.
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { About, Licences } from './About'
import { GPL_LIBRARIES, GPL_TEXT, isGpl, MIT_TEXT, OTHER_DEPENDENCIES } from './licences'

/**
 * The licence notices, held to the files they come from.
 *
 * The About screen carries them because the program contains two GPL
 * libraries, and a GPL program owes whoever runs it a copy of the licence. A
 * notice that is quietly wrong is worse than none, so everything here is
 * checked against its source rather than trusted: the texts against their
 * files, the dependency list against package.json and each package's own
 * manifest, and the screen's wording against the set of GPL libraries it
 * names.
 */
const repo = new URL('../../', import.meta.url)

function read(name: string): string {
  return readFileSync(new URL(name, repo), 'utf8')
}

/** Line endings differ between a checkout and a package; the words do not. */
function words(text: string): string {
  return text.replace(/\r\n/g, '\n').trim()
}

const declared = Object.keys(
  (JSON.parse(read('package.json')) as { dependencies: Record<string, string> }).dependencies,
).sort()

/**
 * The licences this list has been read for. A dependency arriving under any
 * other one fails here, so a person reads it before the About screen names it:
 * an AGPL, an LGPL or something stranger is a decision, not a line in a list.
 */
const RECOGNISED = new Set([
  'MIT',
  'BSD-2-Clause',
  'Apache-2.0 OR MIT',
  'MIT OR Apache-2.0',
  'GPL-3.0',
  'GPL-3.0-or-later',
])

describe('the licence texts', () => {
  it('ship the repository LICENSE as the MIT text', () => {
    expect(MIT_TEXT).toBe(read('LICENSE'))
    expect(MIT_TEXT).toContain('Copyright (c) 2026 Nicholas Walker')
  })

  it('ship the full GPL version 3, from the library file', () => {
    expect(GPL_TEXT).toBe(read('node_modules/stockfish/Copying.txt'))
    expect(GPL_TEXT).toContain('GNU GENERAL PUBLIC LICENSE')
    expect(GPL_TEXT).toContain('Version 3, 29 June 2007')
    expect(GPL_TEXT).toContain('END OF TERMS AND CONDITIONS')
  })

  /**
   * The screen shows the GPL once and says it covers both libraries. That is
   * only true while the two files say the same thing, so this is the test that
   * fails the day a chessground or Stockfish update changes its licence.
   */
  it('are one text for both GPL libraries, word for word', () => {
    expect(words(read('node_modules/chessground/LICENSE'))).toBe(words(GPL_TEXT))
  })
})

describe('the dependency list', () => {
  const generated = __DEPENDENCY_LICENCES__

  it('names every dependency in package.json, and nothing else', () => {
    expect(generated.map((dependency) => dependency.name)).toEqual(declared)
  })

  it('reads each version and licence from the package itself', () => {
    for (const dependency of generated) {
      const theirs = JSON.parse(read(`node_modules/${dependency.name}/package.json`)) as {
        version: string
        license: string
      }
      expect(dependency.version, dependency.name).toBe(theirs.version)
      expect(dependency.licence, dependency.name).toBe(theirs.license)
    }
  })

  it('knows every licence it lists', () => {
    const strangers = generated.filter((dependency) => !RECOGNISED.has(dependency.licence))
    expect(strangers).toEqual([])
  })

  /**
   * The About screen's licence paragraph names Stockfish and chessground as the
   * two GPL libraries, in words. A third one arriving would make that sentence
   * false while every other test stayed green.
   */
  it('has exactly the GPL libraries the About screen names', () => {
    const gpl = generated.filter((dependency) => isGpl(dependency.licence)).map((d) => d.name)
    expect(gpl.sort()).toEqual([...GPL_LIBRARIES].sort())
  })

  it('lists everything else below the full texts', () => {
    expect(OTHER_DEPENDENCIES.map((dependency) => dependency.name)).toEqual(
      declared.filter((name) => !GPL_LIBRARIES.includes(name)),
    )
  })
})

describe('the licences on screen', () => {
  const shown = renderToStaticMarkup(createElement(Licences))

  it('carries both texts', () => {
    expect(shown).toContain('Copyright (c) 2026 Nicholas Walker')
    expect(shown).toContain('Version 3, 29 June 2007')
    expect(shown).toContain('This one text covers both libraries.')
  })

  it('gives every other dependency a line with its licence', () => {
    const items = [...shown.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((match) =>
      match[1].replace(/<!-- -->/g, ''),
    )
    expect(items).toEqual(
      OTHER_DEPENDENCIES.map(
        (dependency) => `${dependency.name} ${dependency.version}: ${dependency.licence}`,
      ),
    )
  })

  it('stay folded away until asked for', () => {
    const about = renderToStaticMarkup(createElement(About))
    expect(about).toContain('aria-expanded="false"')
    expect(about).toContain('View the licences')
    expect(about).not.toContain('Version 3, 29 June 2007')
  })
})
