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
  return (
    <div className="help-doc about">
      <h2>
        Tabiya <span className="app-version">v{__APP_VERSION__}</span>
      </h2>
      <p>Made by Nick Walker. The source code is at github.com/nick2468/Tabiya.</p>

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
      <p>Tabiya's own code and course content are free software under the MIT licence.</p>
      <p>
        The program you are running also contains two libraries licensed under the GNU
        General Public License: Stockfish (GPL-3.0), the engine you play against, and
        chessground (GPL-3.0-or-later), the board. Because it contains them, this program as
        a whole is distributed under the GNU General Public License version 3. You may copy,
        change and share it under those terms. It comes with no warranty. The complete
        source is at the address above.
      </p>
    </div>
  )
}
