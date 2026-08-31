# Chip: phase 17 - screen polish, a visible version, and an uninstaller that finishes the job

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read `src/ui/Study.tsx`, `src/ui/study.css`, `src/ui/App.tsx`, `src/ui/app.css`,
`src/ui/catalog.css`, `src/ui/Board.tsx`, `src/ui/board.css` and
`src-tauri/tauri.conf.json` before starting.

Eight items, all from Nick using the app on 2026-08-31. Seven are presentation. **One,
task 17.7, is installer code whose whole job is deleting the trainee's data, and it can
destroy his progress on every upgrade if it is written carelessly.** Read that task
twice before writing a line of it, and land it as its own commit.

**Standing rule from today: your shell's view of the filesystem OUTSIDE this repo can be
a stale overlay.** Nick's `cmd.exe` listed 23 directories in `%APPDATA%\Roaming` where an
agent's tools listed 26. Never report his data folders from your own `ls`. Verify through
the app's own screens, and for anything about his real files, ask him to run the command.

## The work

- [ ] **17.1 Centre the Course dropdown in its own row.** `.course-switch` in
  `src/ui/catalog.css:126`. It sits between the tagline above and the chapter list
  below, and its vertical spacing does not match either. Give the row balanced space
  above and below and align the label and the select on their centres.
- [ ] **17.2 Rebuild the board's control row.** Under the board:
  - "Start" becomes **"Reset"**.
  - "Back" and "Forward" become **arrows** rather than words. Keep a real accessible
    name on each (`aria-label`), because an arrow glyph is not a label.
  - **"Play a game from here" moves into this row** from the side column and is renamed
    **"Play from here"**.
  The rename undoes half of phase 16's disambiguation, deliberately and safely: the
  other button no longer says "play" at all, it is called "Auto step this line", and the
  two now sit in different parts of the screen. Say that in the commit so a later
  session does not helpfully rename it back.
- [ ] **17.3 Left-justify "Auto step this line".** It currently sits at the right of the
  lines-table header. Its left edge should line up with the left edge of the moves
  column beside the board, so the eye has one vertical line down that side of the
  screen.
- [ ] **17.4 Show the version**, in a softer weight and colour after the "Repertoire
  Trainer" heading in the app header. Read it from `package.json` at build time through
  a Vite `define`, not from a Tauri call, so the browser build shows it too and no
  runtime API is involved.
- [ ] **17.5 The version becomes 1.5.0**, Nick's numbering: five built-in courses, and
  the last digit is the patch number, unused so far. Three files carry it and they are
  out of step right now - `package.json` says `0.0.0`, `src-tauri/tauri.conf.json` and
  `src-tauri/Cargo.toml` both say `1.1.0`. Set all three to `1.5.0` **and add a test
  that asserts the three agree**, because 17.4 makes the number visible and a version
  that lies is worse than one nobody can see.
- [ ] **17.6 Make the board coordinates snug and legible.**
  - **Position.** Rank numbers sit at the **top left** of the square they label, file
    letters at the **bottom right**. Chessground's own stylesheet is what fights this:
    `chessground.base.css` puts `coords.ranks` at `left: 4px; top: -20px` with a
    `translateY(39%)` on each, and `coords.files` at `bottom: -4px; left: 24px`.
    Override in `src/ui/board.css`, which already owns the board's look.
  - **Colour.** Each label must contrast with the square it sits on. `a1` is a dark
    square, so **rank 1's label is light, rank 2's is dark**, and so on up; file letters
    alternate the same way along rank 1. The brown theme only colours `coords.squares`,
    which is a different coordinate mode from the one in use, so nothing is colouring
    these today.
  - It must still be right with the board **flipped for a Black course** - open the
    Caro-Kann and check, because the ranks and files reverse and the parity does not.
- [ ] **17.7 The uninstaller cleans up everything. READ THIS TWICE.**
  Nick has ruled on the register item found at gate 16: an uninstall that offers to
  remove application data must actually remove it. The stock script removes the folders
  named after the bundle identifier, which the app stopped using at phases 15 and 16.
  - **Tauri supports this properly.** `installerHooks` in
    `bundle.windows.nsis`, pointing at an `.nsh` file that defines
    `NSIS_HOOK_POSTUNINSTALL`. The generated script already calls it
    (`src-tauri/target/release/nsis/x64/installer.nsi:836`), immediately after its own
    data-removal block. Do not hand-edit the generated script; it is regenerated on
    every build.
  - **The folders to remove:** `$APPDATA\Repertoire Trainer` (progress, marker, courses)
    and `$LOCALAPPDATA\Repertoire Trainer Data` (backup copy, WebView2 profile). The
    stock block already removes the two legacy identifier folders, so leave those alone.
  - **THE DANGEROUS PART.** The stock block is guarded:
    ```
    ${If} $DeleteAppDataCheckboxState = 1
    ${AndIf} $UpdateMode <> 1
    ```
    **Your hook must carry the same guard.** Without it, every upgrade runs the
    uninstaller in update mode and deletes the trainee's progress, its marker and its
    backup in one go - all three copies, on a routine version bump. That is a worse
    incident than the one this project has already had. Nothing else in this phase can
    do real damage; this can.
  - **Prove it four ways**, in this order, and record what each showed: install over the
    top (upgrade) and confirm the data folders survive; uninstall with the box
    UNTICKED and confirm they survive; uninstall with the box TICKED and confirm both
    are gone; then reinstall and confirm a clean first run. Use fixture folders you
    created, never Nick's real ones, and if you cannot arrange a fixture for a case,
    say so rather than reporting it as passed.
- [ ] **17.8 Give the chapter prose room on the right.** The text under the course name
  runs too close to the vertical scrollbar. Add right padding inside the scrolling
  container rather than a margin on the text, so the gap is there whether or not the
  scrollbar is showing.
- [ ] **17.9 Prove the seven presentation items in the packaged app** and show Nick the
  board, since 17.6 is the only one a screenshot settles. The board still needs a human
  for moves, but coordinates and layout are visible without touching a piece.

## Hazards

- **17.7 can delete everything the trainee owns.** The guard above is not optional.
  Land 17.7 as its own commit so it can be reverted alone.
- **Nick's progress file is live**, in `%APPDATA%\Repertoire Trainer`. Work against
  fixtures. You cannot verify his file yourself; ask him.
- **`tauri build` runs the frontend build at its START**, so a rebuild proves nothing
  about an edit made while it was running. Confirm a change shipped by searching
  `dist/assets/*.js` for its own string. Cargo needs
  `$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"` first.
- **Do not run `tauri dev`.** Verify against the packaged build. If you genuinely need a
  Vite server it is pinned to **5175** with `--strictPort`; 5173 and 5174 belong to
  Nick's other projects, and a dev window pointed at the wrong port showed him another
  project's site inside a window titled Repertoire Trainer.
- **`packaged-eval.mjs` connects to whatever answers the port**, so check the page title
  before believing a probe. Phase 16 got a DataCrafter page back on 9333.
- **The packaged window is inspectable**: `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"`
  plus `node scripts/packaged-eval.mjs "<expression>"`.
- **The browser pane must be FRONTED to drive or photograph the board**: a hidden pane
  reports zero bounds. Resize to a real size, then `window.__cg.redrawAll()`.
- **`npx tsc -b`**, and say you ran it.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`, written with
  `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Changing the Tauri identifier. Any change to course content, the bundle format, the
drill queue or the hide feature. Restyling anything not named above. A valid follow-up
in a file you already have open: do it now, as its own commit. One needing a ruling: the
SPEC section 6 register, with why it was not taken.

## Escalation

On any contradiction between this chip and the code: stop that item, record it, continue
with the rest. **If the uninstaller hook cannot be proved safe against the upgrade case,
do not ship it** - leave 17.7 undone, say so plainly, and land the other seven. A tidy
uninstall is a convenience; deleting a trainee's progress on an upgrade is the end of
their trust in the app.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the ACTUAL model. Land the presentation items, the version work and the uninstaller hook
as separate commits. Tick PLAN.md phase 17 boxes as you go. **The review gate box belongs
to the orchestrator: leave it.**

Acceptance: the eight items above are done as described; the version reads 1.5.0 in all
three files with a test holding them together, and is visible in the app; the board
coordinates are snug and contrast with their squares in both orientations; an uninstall
with the box ticked removes both data folders, an upgrade and an unticked uninstall leave
them alone, each proved against fixtures; vitest green and `tsc -b` clean.
