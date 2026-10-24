# Chip: phase 48 - an About screen, and the notices an open-source release owes

You are a builder session in `C:\Users\nick2\Code\Tabiya`, working on `main` (no worktree -
repo convention). There is a remote, `origin` at `github.com/nick2468/Tabiya`, and the
repository is PUBLIC. **You never push.** Pushing is the orchestrator's step after the
review gate. Read SPEC.md sections 2, 8 and 10, `README.md` (its Licence section is the
source of truth for the licensing facts below), `src/ui/App.tsx` (the nav and
`__APP_VERSION__`), `src/ui/Help.tsx`, `src/ui/Prose.tsx`, `src/ui/help-text.ts`,
`src-tauri/capabilities/default.json`, `src/storage/capabilities.test.ts`,
`src-tauri/Cargo.toml` and `src-tauri/src/lib.rs` before starting.

Nick, 2026-10-24, releasing Tabiya as open source: **the app gets an About that names him,
links to the GitHub repository, and says what the word tabiya means in chess.** One screen,
no chess content. Version **1.10.6**.

## Why this is more than a credits page

The installer contains two GPL libraries, verified 2026-10-24 from their own `package.json`
files: **Stockfish** 18.0.8 (GPL-3.0), the engine, and **chessground** 9.2.1
(GPL-3.0-or-later), the board. Tabiya's own code is MIT, but the distributed program
contains both, so the program as a whole goes out under GPL-3.0. GPL-3.0 section 0 says a
work with an interactive user interface must display "Appropriate Legal Notices": a
copyright notice, that there is no warranty, that the user may convey the work under the
licence, and how to view a copy of it. Section 4 says recipients get a copy of the licence
with the program. **This screen is where the app meets both**, which is why it carries
more than Nick's name. It is not legal advice and nobody should present it as such; it is
the ordinary, conservative reading every GPL desktop app follows.

## The work

### 48.1 An About screen

- [ ] A nav entry **About**, beside Help and before Diagnostics, opening its own screen the
  way Help does. Not a modal: Help is a screen, and About sits with it.
- [ ] The content, in this order. Use this wording; adjust phrasing only where the layout
  forces it, and add no claim it does not make:

  > **Tabiya** v{version}
  >
  > Made by Nick Walker. The source code is at github.com/nick2468/Tabiya.
  >
  > **What a tabiya is**
  >
  > A tabiya is a standard position in an opening: the point a well-known sequence of moves
  > reliably reaches, after which the game branches and both players have real choices
  > again. Each chapter in this app teaches one, and the plans that follow from it.
  >
  > The word is Arabic in origin and comes from shatranj, the medieval game chess grew out
  > of. Its pieces moved so slowly that players often began from an agreed tabiya instead
  > of the starting position, to get straight to the fight.
  >
  > **Licence**
  >
  > Tabiya's own code and course content are free software under the MIT licence.
  >
  > The program you are running also contains two libraries licensed under the GNU General
  > Public License: Stockfish (GPL-3.0), the engine you play against, and chessground
  > (GPL-3.0-or-later), the board. Because it contains them, this program as a whole is
  > distributed under the GNU General Public License version 3. You may copy, change and
  > share it under those terms. It comes with no warranty. The complete source is at the
  > address above.
  >
  > [View the licences]

- [ ] **The version is `__APP_VERSION__`**, the build-time value the header already uses.
  Never a literal: a hand-written version on this screen would be stale by the next
  release, which is exactly why the README stopped carrying one.
- [ ] **On the word's origin, say only what the draft says.** The meaning and the shatranj
  history are well attested. The Arabic ROOT is not: sources split between a word glossed
  "arrangement" or "battle array" and a different one meaning "normal manner", and most of
  them quote each other (checked 2026-10-24). So the screen says "Arabic in origin" and
  names no root. Do not add "battle array" however often you see it.

### 48.2 The link, and the narrowest permission that opens it

- [ ] **The app cannot open a web link today, on purpose.** `Prose.tsx` renders every link
  as plain text (`a: ({ children: text }) => <>{text}</>`), and there is no opener plugin.
  Leave Prose exactly as it is: the About's link is its own element, not a change to how
  Help or the course notes render.
- [ ] On the desktop, add Tauri 2's official **`tauri-plugin-opener`** (the Rust crate in
  `Cargo.toml`, `@tauri-apps/plugin-opener` in `package.json`, registered in `lib.rs`), and
  grant `opener:allow-open-url` **scoped to the repository's address and nothing wider**:
  `https://github.com/nick2468/Tabiya` and paths under it. Not github.com, not `https://*`.
  An app that can open any URL it is handed is a door nobody needs; this one needs one
  address.
- [ ] In the browser build, a plain anchor with `target="_blank"` and
  `rel="noopener noreferrer"`. Decide between the two by the same `isDesktop()` the storage
  layer uses.
- [ ] **`src/storage/capabilities.test.ts` holds the capability file**, and it will go red
  on the new grant until you teach it. Extend it, do not loosen it: add an assertion that
  the opener scope names exactly the repository address and nothing broader, and
  mutation-check that assertion by widening the scope to `https://*` and watching it fail.

### 48.3 The licence texts, shipped and viewable offline

- [ ] **View the licences** reveals the full texts, offline, with no network needed: Tabiya's
  MIT licence (the repository's `LICENSE`) and the GPL-3.0 text.
- [ ] **Read the texts from the files at build time, never paste them by hand.** The GPL text
  is in `node_modules/stockfish/Copying.txt` and `node_modules/chessground/LICENSE`, both
  the full GPL-3.0, verified 2026-10-24. Import them as raw text through Vite (`?raw`), so
  a library update carries its own licence with it. Show the GPL once, saying it covers
  both libraries.
- [ ] Below the texts, one line per OTHER shipped dependency with its licence name, as the
  README's Licence section lists them: React, react-dom, react-markdown and ts-fsrs under
  MIT, chess.js under BSD-2-Clause, the Tauri libraries under MIT or Apache-2.0. Generate it
  from each dependency's `package.json` at build time rather than writing it out, so it
  cannot drift from what actually ships. **Stop rule:** if generating it needs more than a
  short build-time script, write the list by hand from `package.json`'s `dependencies`, add
  a test that fails when a dependency is added without a line, and record the generator as
  a register entry in SPEC section 6.

### 48.4 Help and SPEC

- [ ] `HELP_CONTROLS` gains **About** and **View the licences**, and the help test is
  mutation-checked on both names.
- [ ] Help, "How it fits together": one sentence pointing at About for who made it and the
  licences.
- [ ] SPEC section 2: the About screen in a sentence. Section 8: the ruling with the date,
  and the GPL reasoning in two sentences, so the next person to wonder why an About screen
  carries a licence does not have to reconstruct it.

### 48.5 Version 1.10.6

- [ ] `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`. The version test
  holds them together.

### 48.6 Prove it, in the browser AND in a packaged build

- [ ] Browser at 1400x980, both themes: About in the nav; the version matches the header;
  the meaning paragraph and the licence paragraph as drafted; View the licences opens both
  texts; the link opens a new tab on the repository.
- [ ] **Packaged build, installed and driven.** The opener permission is the one change here
  that can only fail on the desktop, exactly as the folder capabilities were in phase 47.
  Click the link and confirm the system browser opens on the repository. Then confirm the
  NEGATIVE: an address outside the scope is refused by the real permission layer. Say how
  you tested the negative.
- [ ] Nothing here touches the data folders, so test against the live install freely; but
  never report Nick's data folders from your own shell.

## Hazards

- **Never widen the opener scope past the one address**, and never touch `Prose.tsx`'s link
  stripping. Both are deliberate, and both are easy to loosen "just to make it work".
- **The first packaged build after any folder move fails** with "failed to read plugin
  permissions ... cannot find the path specified" naming an old folder. The fix is
  `rm -rf src-tauri/target/release/build/tauri-*`. Adding a plugin also re-runs those build
  scripts, so if a stale path appears, that is this and nothing else.
- **No `tauri dev`.** A packaged build IS wanted, for 48.6.
- **No em dashes anywhere.** Australian English. `npx tsc -b`, and say you ran it.
  `npx vitest run` after every change; the suite rule is twenty seconds.
- PS 5.1 mangles commit messages: scratch file plus `git commit -F`. Stage explicit paths,
  never `git add -A`, `git status` first.

## Out of scope

A splash screen, an update checker, a donate link, analytics, any link other than the
repository, changing how Help or course notes render links, and any chess content.

## Escalation

On any contradiction between this chip, SPEC.md, the README's Licence section or the code:
stop that item, record it, continue with the rest. If `tauri-plugin-opener` will not scope
to a single address the way described, stop and report rather than granting it more.

## Conventions and finish

Commit style follows the log. The screen and its wording first, then the link and its
permission with the test, then the licence texts, then Help and SPEC, then the version.
Tick PLAN.md phase 48 boxes as you go. **The review gate box belongs to the orchestrator:
leave it.** Report to the orchestrator when done.

Acceptance: an About screen beside Help naming Nick Walker, linking to the repository, and
explaining a tabiya and its shatranj origin without naming a disputed root; the GPL notices
the distributed program owes, with both licence texts viewable offline and read from their
source files at build time; every other shipped dependency named with its licence; the
opener permission scoped to the one repository address, held by the capability test and
mutation-checked; proved in the browser and in an installed build including the refused
address; version 1.10.6; Help and SPEC true; vitest green and `tsc -b` clean; the tree
committed and clean.
