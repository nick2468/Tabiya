# Chip: phase 16 - never start blank, one name everywhere, and hiding a course

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 5, 6 and 10, `src/storage/progress.ts`, `src/storage/tauri-store.ts`,
`src/storage/paths.ts`, `src/ui/progress-context.tsx`, `src/ui/Catalog.tsx`,
`src-tauri/Cargo.toml`, `src-tauri/src/lib.rs` and `src-tauri/tauri.conf.json` before
starting.

**Read this first, because it changes how you verify anything in this phase.**

On 2026-08-31 Nick lost his two learnt lines, and the orchestrator told him twice that
they were safe. Both are now understood:

- **A builder or reviewer shell's view of the filesystem OUTSIDE this repo can be a
  stale overlay.** Proved: his `cmd.exe` listed 23 directories in `%APPDATA%\Roaming`,
  the agent's tools listed 26 - the extras being a folder he had deleted hours earlier
  plus two sandbox-internal `Claude*` folders - and the agent's timestamp for a folder
  they both saw was nine minutes behind his. So `ls` and `Test-Path` against AppData
  prove nothing about the real machine.
- **The data loss itself was the app's own design.** He deleted the data folder, then
  opened the app. A missing progress file is indistinguishable from a new trainee, so
  the app started blank and saved a blank file. Task 16.1 is that hole.

**So in this phase: never report the state of Nick's data folder from your own shell.**
Verify through the packaged app's own screens, which read the real filesystem, and when
it comes to his real progress file, ask HIM to run the command and read his answer. His
file currently holds the two London lines again, restored by hand through the UI.

## The rulings, settled 2026-08-31

- **Blank is a claim, not a default.** If the app has evidence it has run before, it
  must refuse to start blank and must not write over the gap. Same banner and same
  blocked saving as a failed read.
- **A second copy, in a different folder.** A marker inside the data folder dies with
  the folder, which is exactly the case that cost Nick his lines, so the app also keeps
  a backup copy under `%LOCALAPPDATA%\Repertoire Trainer`. Two folders now have to be
  destroyed to lose anything, and the backup is only ever read when the main file is
  missing and the app is about to start blank.
  **This is an addition beyond what Nick asked for. It is included because without it
  16.1 does not cover the incident that caused it. If the orchestrator's review or Nick
  disagrees, it comes out and the rest of 16.1 still stands.**
- **One name everywhere.** The WebView2 profile folder, the executable and the Rust
  crate all still say `london-trainer`. They change. **The Tauri identifier still does
  not** - phase 15's reasoning is unchanged: it is what NSIS keys the install on, it is
  invisible, and changing it once already put a second app beside the first.
- **The version bumps to 1.1.0**, and bumps with every installer from here. Two builds
  a week apart currently produce the same filename and both report 1.0.0 in Apps and
  Features, which is no good when installers are how courses reach him.
- **Hide, not delete, for bundled courses.** A bundled course is compiled into the
  binary; hiding is reversible, keeps every learnt line, and works for imported courses
  too.
- **`hiddenCourses` does NOT bump the progress version.** Version 4 stays. An older
  build reading a version 5 file refuses it outright (`parseProgress` throws on a
  version above its own), which would turn a cosmetic flag into a downgrade wall. An
  older build simply dropping an unknown field and showing every course is the right
  failure.

## The work

- [ ] **16.1 Never start blank when the app has evidence it should not.**
  - **The marker.** On every successful save, the app also knows it has saved. Write
    something durable next to the progress file so that "the folder is here and the
    progress file is not" is detectable, and treat that state as a failure: blank
    state, saving blocked, banner explaining that the file has gone and that a backup
    can be imported from the Progress screen. Do NOT write a fresh blank file over it.
  - **The backup copy.** After each successful save, also write the same JSON to
    `%LOCALAPPDATA%\Repertoire Trainer\progress.backup.json`. It is written blind and
    never read, except in one case: the app is about to start blank AND the backup
    exists AND it parses AND it holds at least one learnt line. Then say so and offer
    to restore it, naming how many learnt lines it holds and when it was written. The
    trainee chooses; the app never restores silently.
  - **Capabilities** for the new file, literal paths as always
    (`$LOCALDATA/Repertoire Trainer/...`), read, write, exists and mkdir. No remove.
  - The failure paths matter more than the happy one, and they are all the same shape:
    when in doubt, block and say why rather than writing anything.
- [ ] **16.2 One name everywhere.**
  - `src-tauri/Cargo.toml`: package `name` to `repertoire-trainer`, `[lib] name` to
    `repertoire_trainer_lib`, and `src-tauri/src/main.rs` updated to call it. That
    renames the installed executable.
  - **The WebView2 profile folder.** It is `%LOCALAPPDATA%\com.nick.london-trainer\EBWebView`
    today, 32 MB, named from the identifier. Point it at
    `%LOCALAPPDATA%\Repertoire Trainer\WebView2` instead. The window is currently built
    entirely from `tauri.conf.json` with no Rust builder, so this is the first real
    Rust in the project: build the window in `lib.rs` with an explicit data directory.
    **Check the exact Tauri 2 API against the installed version rather than trusting
    this chip's memory of it**, and if the window has to move out of `tauri.conf.json`
    to do it, carry every setting across exactly (title, size, minimum size, resizable,
    centre, label `main`).
  - The old profile folder is left for Nick to delete, like the last one. Say so on
    screen once, next to whatever 15.1 already says about the folder that moved.
  - **What this costs:** the theme choice, which lives in `localStorage` inside that
    profile. Nothing else does - progress is a file. Note it in the open items.
  - `version` to `1.1.0` in `tauri.conf.json` and `Cargo.toml`.
- [ ] **16.3 Hide a course.**
  - `hiddenCourses: string[]` in the progress state, parsed with the same care as
    `learntLines` (filter to strings, default to empty, no version bump).
  - Tile action "Hide", beside Export and the Delete that phase 15 added. Available on
    every course, bundled or imported. Hiding is reversible and loses nothing.
  - The catalog shows visible courses, then a quiet "N hidden" control that reveals
    them with an "Unhide" on each. A hidden course does not appear in the course
    switcher, contributes no cards to the drill queue, and is not offered in Play.
  - **Learnt lines and card schedules are untouched by hiding**, exactly as they are by
    deleting. Unhide and everything is where it was.
  - Check the drill queue really does drop a hidden course's cards, and that the
    Progress screen's totals agree with what the catalog shows.
- [ ] **16.4 Prove all three in the packaged app**, and prove the names with a CLEAN
  uninstall and reinstall, not an upgrade: uninstall the current app, install the new
  one, and confirm the install folder holds `repertoire-trainer.exe` and NOT a leftover
  `london-trainer.exe`. That orphan is the specific risk the SPEC register named when
  this was deferred at phase 15. Then: the WebView2 folder is the new one; a missing
  progress file blocks rather than blanks; the backup offer appears and restores when
  accepted; hiding a course removes it from the catalog, the switcher and the drill
  queue, and unhiding brings it and its cards back.
  **Verify all of it through the app's own screens.** Do not report folder listings from
  your shell as evidence, and end by asking Nick to confirm his own progress file with
  `type "%APPDATA%\Repertoire Trainer\progress.json"`.

## Hazards

- **Nick's progress file is live and was just restored by hand.** It should hold two
  `london-white` learnt lines. You cannot verify that yourself; ask him. Back it up to
  the scratchpad by asking him to copy it, or work only against fixtures you create.
- **Your own filesystem reads outside this repo may be stale.** See the top of this
  chip. This is the single most important thing about working on this phase.
- **A clean uninstall removes the old app's uninstaller.** Do the uninstall while the
  current install is intact, and do not leave Nick without a working app: if the new
  build will not install, reinstall the existing installer at
  `src-tauri/target/release/bundle/nsis/` before finishing.
- **Renaming the Cargo package changes the build output path.** `target/release/london-trainer.exe`
  becomes `repertoire-trainer.exe`; anything that greps the built artefact needs updating.
- **`tauri build` runs the frontend build at its START**, so a rebuild proves nothing
  about an edit made while it was running. Confirm a change shipped by searching
  `dist/assets/*.js` for its own string. Cargo needs
  `$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"` first.
- **The packaged window is inspectable**: `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"`
  plus `node scripts/packaged-eval.mjs "<expression>"`. The board and the file picker
  both need a human or a Windows-level workaround (phase 15 open item 1 says how).
- **`npx tsc -b`**, and say you ran it.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`, written with
  `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Changing the Tauri identifier. Deleting bundled courses. A folder watcher. Automatic
restore without asking. Any change to course content, the bundle format or the Study
screen. A valid follow-up in a file you already have open: do it now, as its own commit.
One needing a ruling: the SPEC section 6 register, with why it was not taken.

## Escalation

On any contradiction between this chip, SPEC.md and the code: stop that item, record it
in the open items, continue with the rest. **If 16.2's window rebuild cannot carry every
setting across, or the Tauri API is not what this chip assumes, STOP that task and
report** rather than shipping a window that differs from the one Nick has been using.
16.1 and 16.3 do not depend on it.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the ACTUAL model. Land the three tasks as separate commits. Tick PLAN.md phase 16 boxes
as you go. **The review gate box belongs to the orchestrator: leave it.**

Acceptance: the app refuses to start blank when it has evidence it should not, and offers
the backup when there is one; the executable, crate and WebView2 folder all say
Repertoire Trainer, proved across a clean uninstall and reinstall with no orphaned exe;
the version reads 1.1.0; any course can be hidden and unhidden, with learnt lines and
card schedules untouched and the drill queue agreeing; vitest green and `tsc -b` clean.
