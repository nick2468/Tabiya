import { useState } from 'react'
import { isDesktop } from '../storage/paths'
import { GPL_TEXT, MIT_TEXT, OTHER_DEPENDENCIES } from './licences'
import { loadNotices, type NoticesLoad } from './notices'
import { openRepository, REPOSITORY_SHOWN, REPOSITORY_URL } from './repository'
import './help.css'
import './about.css'

/**
 * Who made this, what the word means, and the notices the program owes.
 *
 * It is a screen rather than a dialog for the reason Help is: it is something
 * to read, and it sits beside Help in the nav.
 *
 * The licence half is not decoration. The installer contains two libraries
 * under the GNU General Public License, Stockfish and chessground, so the
 * program as a whole goes out under GPL-3.0, and a GPL program with a user
 * interface owes whoever runs it the notices this screen carries. SPEC section
 * 8 has the ruling and the reasoning.
 *
 * THE WORDING IS NICK'S, from the phase 48 chip, and it is narrower than it
 * could be on purpose. The meaning and the shatranj history are well attested;
 * the Arabic ROOT is not, and sources split between two different words. So it
 * says "Arabic in origin" and names no root. "Battle array" is everywhere and
 * is one side of that split: do not add it.
 *
 * The version is `__APP_VERSION__`, the build-time value the header shows. A
 * version written here by hand would be wrong by the next release.
 */
export function About() {
  const [licences, setLicences] = useState(false)
  return (
    <div className="help-doc about">
      <h2>
        Tabiya <span className="app-version">v{__APP_VERSION__}</span>
      </h2>
      <p>
        Made by Nick Walker. The source code is at <RepositoryLink />.
      </p>

      <h3>What a tabiya is</h3>
      <p>
        A tabiya is a standard position in an opening: the point a well-known sequence of
        moves reliably reaches, after which the game branches and both players have real
        choices again. Each chapter in this app teaches one, and the plans that follow from
        it.
      </p>
      <p>
        The word is Arabic in origin and comes from shatranj, the medieval game chess grew
        out of. Its pieces moved so slowly that players often began from an agreed tabiya
        instead of the starting position, to get straight to the fight.
      </p>

      <h3>Licence</h3>
      <p>
        Tabiya's own code and course content are copyright (c) 2026 Nick Walker, and are
        free software under the MIT licence.
      </p>
      <p>
        The program you are running also contains two libraries licensed under the GNU
        General Public License: Stockfish (GPL-3.0), the engine you play against, and
        chessground (GPL-3.0-or-later), the board. Because it contains them, this program as
        a whole is distributed under the GNU General Public License version 3. You may copy,
        change and share it under those terms. It comes with no warranty. The complete
        source is at the address above.
      </p>
      <p>
        <button
          type="button"
          aria-expanded={licences}
          aria-controls="about-licences"
          onClick={() => setLicences(!licences)}
        >
          View the licences
        </button>
      </p>
      {licences ? <Licences /> : null}
    </div>
  )
}

/**
 * The full texts, offline: GPL-3.0 section 4 says whoever receives the program
 * gets a copy of its licence with it, and this is that copy.
 *
 * Exported for its test, which cannot click the button in a string render.
 */
export function Licences() {
  return (
    <div id="about-licences" className="licences">
      <h4>Tabiya: the MIT licence</h4>
      <pre>{MIT_TEXT}</pre>

      <h4>Stockfish and chessground: the GNU General Public License, version 3</h4>
      <p>
        This one text covers both libraries. Each ships it as its own licence file, and the
        two are the same word for word.
      </p>
      <pre>{GPL_TEXT}</pre>

      <h4>Its other direct dependencies</h4>
      <ul>
        {OTHER_DEPENDENCIES.map((dependency) => (
          <li key={dependency.name}>
            {dependency.name} {dependency.version}: {dependency.licence}
          </li>
        ))}
      </ul>

      <ThirdPartyNotices />
    </div>
  )
}

/**
 * Every library the program contains, with its own copyright and licence
 * notice, fetched only when it is opened.
 *
 * The list above names the libraries the app asks for. This is everything that
 * ships, theirs included: each JavaScript package with code in the bundle and
 * each Rust crate in the Windows program, a few hundred kilobytes. Fetched on
 * the first open and kept, never imported, so it is not in the main bundle.
 *
 * Exported for its test.
 */
export function ThirdPartyNotices({ load = loadNotices }: { load?: () => Promise<NoticesLoad> }) {
  const [open, setOpen] = useState(false)
  const [notices, setNotices] = useState<NoticesLoad | 'loading' | null>(null)

  const toggle = () => {
    const opening = !open
    setOpen(opening)
    if (opening && notices === null) {
      setNotices('loading')
      void load().then(setNotices)
    }
  }

  return (
    <>
      <h4>Every library it contains</h4>
      <p>
        The copyright and licence notice of every library in the program, those above
        included: each JavaScript package in the app and each Rust crate in the Windows
        program. They are generated from the build itself, every time it is built.
      </p>
      <p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="about-third-party"
          onClick={toggle}
        >
          Third-party notices
        </button>
      </p>
      {open ? <div id="about-third-party">{shown(notices)}</div> : null}
    </>
  )
}

/** What the open section says, for each state the fetch can be in. */
function shown(notices: NoticesLoad | 'loading' | null) {
  if (notices === null || notices === 'loading') return <p>Loading the notices.</p>
  if (notices.kind === 'loaded') return <pre className="notices">{notices.text}</pre>
  if (notices.kind === 'missing') {
    // In development there is no bundle for the notices to be read from. In a
    // release a missing file is a fault, and it is not dressed up as anything else.
    return (
      <p role="note">
        {import.meta.env.DEV
          ? 'The third-party notices are generated when the app is built for release, so a development build has none to show.'
          : 'The third-party notices are missing from this build. Every release build writes them, so this one was not built the usual way.'}
      </p>
    )
  }
  return (
    <p role="alert" className="about-failed">
      The third-party notices could not be loaded ({notices.why}).
    </p>
  )
}

/**
 * The address, as something that opens it.
 *
 * In a browser it is a plain anchor into a new tab. In the desktop window it is
 * a button that asks the opener plugin, because an anchor there would navigate
 * the app's own window if anything went wrong with the click, and a button
 * cannot navigate anything. A refusal or a missing browser is said beside it
 * rather than swallowed: a link that silently does nothing looks broken.
 */
function RepositoryLink() {
  const [failed, setFailed] = useState(false)
  if (!isDesktop()) {
    return (
      <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
        {REPOSITORY_SHOWN}
      </a>
    )
  }
  return (
    <>
      <button
        type="button"
        className="link-button"
        title="Opens in your web browser"
        onClick={() => {
          setFailed(false)
          openRepository().catch((error: unknown) => {
            console.warn('The repository link could not be opened:', error)
            setFailed(true)
          })
        }}
      >
        {REPOSITORY_SHOWN}
      </button>
      {failed ? (
        <span role="alert" className="about-failed">
          {' '}
          (it could not be opened from here, so type the address into a browser)
        </span>
      ) : null}
    </>
  )
}
