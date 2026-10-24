import MIT_TEXT from '../../LICENSE?raw'
// One of the two GPL files, not both: they are the same text word for word,
// and `licences.test.ts` fails the day that stops being true. Shipping one
// keeps a second 35 KB copy of the same licence out of the bundle.
import GPL_TEXT from '../../node_modules/stockfish/Copying.txt?raw'

/**
 * The licence texts the About screen shows, read from their files at build
 * time and never typed in.
 *
 * Tabiya's own code is MIT, from the repository's LICENSE. The program also
 * contains Stockfish (GPL-3.0) and chessground (GPL-3.0-or-later), so it goes
 * out as a whole under GPL-3.0, and GPL-3.0 section 4 says whoever receives it
 * gets a copy of the licence with it. That copy is this one, imported raw from
 * the library's own licence file, so an update that changed its licence would
 * carry the new text in with it rather than leave a stale one here.
 *
 * Imported by path rather than by package name because chessground's
 * `exports` map would send `chessground/LICENSE` to `dist/LICENSE.js`.
 */
export { GPL_TEXT, MIT_TEXT }

/** The libraries whose licence is shown in full above the list, by name. */
export const GPL_LIBRARIES = ['chessground', 'stockfish']

/**
 * Whether a declared licence is the GNU General Public License.
 *
 * Deliberately simple. Anything stranger, an LGPL or an AGPL or a licence this
 * has never seen, is not decided here: `licences.test.ts` fails on any licence
 * it does not recognise, so a person reads it before the screen lists it.
 */
export function isGpl(licence: string): boolean {
  return /\bGPL\b/.test(licence)
}

/** Every other dependency, with its licence: the list below the full texts. */
export const OTHER_DEPENDENCIES = __DEPENDENCY_LICENCES__.filter(
  (dependency) => !isGpl(dependency.licence),
)
