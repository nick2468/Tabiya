# Chip: phase 15 - a folder with the right name, and courses you can remove

You are a builder session in `C:\Users\nick2\Code\London`, working on `main` (no
worktree - repo convention, and there is no remote: never push, never create one).
Read SPEC.md sections 5, 10 and 11, `src/storage/tauri-store.ts`, `src/content/external.ts`,
`src/ui/bundles.ts`, `src/ui/catalog-context.tsx` and `src/ui/Catalog.tsx` before starting.

This phase comes from Nick using the app for real on 2026-08-31: he imported the Colle
bundle through the file picker (it worked), was made to restart to see it, deleted the
folder by hand because there is no other way, and found the folder is called
`com.nick.london-trainer` for an app called Repertoire Trainer.

**Task 15.1 moves the file that has been destroyed once already. Do it first, do it
carefully, and never delete anything.** The other two tasks work on the folder whose
location 15.1 changes, so the order is not negotiable.

## The rulings, settled 2026-08-31

- **The data folder becomes `%APPDATA%\Roaming\Repertoire Trainer`**, matching the
  product name.
- **The Tauri identifier does NOT change.** It stays `com.nick.london-trainer`. The
  identifier is the bundle id that NSIS and the uninstall entry hang off, and Nick has
  already lived through one identity change that installed a second app beside the
  first. Keeping it means the installer keeps upgrading in place. The identifier is an
  internal name nobody sees; the FOLDER is what he reads, and that is what changes. So
  the app stops using `appDataDir()` and builds its root from `dataDir()` plus the
  literal folder name instead.
- **The migration copies and never moves.** The old folder stays exactly as it is, and
  Nick deletes it himself when he is satisfied. A migration that deletes has one chance
  to be right.
- **Import refreshes the catalog; no restart.** The existing "scan once at startup"
  comment worries that a course appearing mid-session would change the drill queue. It
  cannot: a newly imported course has no learnt lines, so it contributes no cards.
- **Delete lives on imported tiles only.** A bundled course is compiled into the binary
  and would be back at the next restart, so offering to delete one would be a lie.
- **The confirm says what is actually lost, which is nothing much.** Learnt lines and
  drill history are keyed by course id and nothing prunes them (verified at source:
  `src/storage/progress.ts` filters only for type, and `buildCardsAcross` simply builds
  no cards for a course that is not loaded). Deleting a course and importing it again
  restores all of it.
- **Export first is a button in that dialog, not a pre-ticked box.** It is a
  convenience, not a safety net, and defaulting it to yes puts a file dialog in front of
  the common case.
- **Exports keep the save dialog.** No fixed export folder, and nothing is ever written
  into the installation directory: that folder belongs to the program and an uninstall
  takes it with them.

## The work

- [ ] **15.1 Move the data folder, by copying.**
  - One shared function for the app's data root, used by BOTH the progress store
    (`src/storage/tauri-store.ts:63`) and the external course scan
    (`src/content/external.ts:145`). They each call `appDataDir()` independently today,
    which is how they could drift apart. New root: `dataDir()` joined with
    `Repertoire Trainer`.
  - **Capabilities.** Grant the new root literally: `$DATA/Repertoire Trainer/progress.json`,
    `$DATA/Repertoire Trainer/courses/*`, `$DATA/Repertoire Trainer/courses/**` and so
    on, mirroring exactly the shapes `$APPDATA/...` has today for read, write, exists,
    mkdir, read-dir and remove. **Phase 7's lesson binds: grants are literal paths, and
    a grant on a folder does not cover a file sitting directly in it.**
    **Keep the existing `$APPDATA/...` read grants.** As far as Tauri is concerned
    `$APPDATA` still means the identifier folder, which is exactly the old location the
    migration has to read. That is why no new path syntax is needed for the read side.
  - **The migration, on startup, in this order.** If the new root already has a
    `progress.json`, do nothing at all. Otherwise, if the OLD root has one: copy it,
    then re-read the copy, parse it, and confirm it has the same number of learnt lines
    as the source before treating the new location as live. Copy the `courses` folder
    across too if it exists. **Never delete the old folder, never move a file.**
  - **The failure rule, which matters more than the happy path.** If the old file exists
    but cannot be read or copied or verified, the app must NOT start blank and must NOT
    write anything to the new location. It takes the same route a failed read already
    takes: saving is blocked and the banner explains why (`src/ui/App.tsx:144` renders
    it from `useProgress().failure`). Starting blank and then saving over it is exactly
    the phase 7 incident, one folder to the left.
  - **Say it once, on screen.** After a successful migration, tell the trainee the
    folder moved, name both paths, and say the old one was left behind and is theirs to
    delete. The Progress view is a reasonable home for it.
- [ ] **15.2 Import refreshes the catalog.** Add a rescan to the catalog context and
  call it when an import succeeds, so the course appears without a restart. Replace the
  "restart the app to see it" message with one that says it is ready. Update the
  scanned-once comment in `src/ui/catalog-context.tsx` to say what is now true and why
  the drill-queue worry does not apply to import.
- [ ] **15.3 Delete an imported course from its tile.**
  - The X goes in the tile's actions row beside "Export as a file", NOT in the tile
    corner: the whole tile is currently one `<button>` and a button cannot contain
    another one. Tooltip "Delete". It appears only when `entry.origin === 'external'`.
  - The confirm names the course, says the files go and the progress stays, and counts
    what stays. The re-import confirmation in `src/ui/ImportCourse.tsx` is the model for
    tone and for counting; `survivingLines` in `src/model/lines.ts` is next door.
    Wording to build from:
    > **Delete The Colle-Zukertort?**
    > The course files are removed. Your 6 learnt lines and their drill schedule stay
    > saved, and come back if you import it again.
    > `[Export it first]` `[Delete]` `[Cancel]`
  - Deleting removes the course folder under the courses root and refreshes the catalog,
    so the tile goes without a restart. `fs:allow-remove` is already granted for that
    path and `installCourse` already calls `fs.remove` there, so this needs no new
    permission - but it will need the new root's grant from 15.1.
  - Cancel writes nothing and removes nothing.
- [ ] **15.4 Prove all three in the packaged app**, in one sitting, in this order: the
  migration carries Nick's real progress across and the old folder is still there
  afterwards; an import appears without a restart; a delete removes the tile and the
  folder; and after the delete, re-importing the same bundle brings the learnt lines
  back. That last one is the claim the confirm dialog makes, so it is the one that has
  to be seen rather than reasoned about.

## Hazards

- **Nick's progress file is sacred and this phase moves it.**
  `%APPDATA%\Roaming\com.nick.london-trainer\progress.json`, currently 315 bytes,
  SHA256 `db071a7f99454d3ca5f830b1e0f76bcf2631f803180f51c550d741c7f846a741`, holding
  two learnt London lines. Copy it to scratch and hash it before you run anything. After
  every packaged run, verify BOTH locations: the old file byte-identical to the backup,
  and the new file parsing with the same two lines. If either is wrong, stop and say so
  before doing anything else.
- **Test the migration against a COPY first**, in a scratch folder, before ever running
  it against the real one.
- **A grant on `$APPDATA` does not cover a file directly inside it for `exists`** - the
  phase 7 incident. Check every new grant shape against what the code actually calls.
- **`tauri build` runs the frontend build at its START**, so a rebuild proves nothing
  about an edit made while it was running. Confirm a change shipped by searching
  `dist/assets/*.js` for its own string. Cargo needs
  `$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"` first.
- **The packaged window is inspectable**: `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"`
  plus `node scripts/packaged-eval.mjs "<expression>"`. Only the board needs a human.
- **`npx tsc -b`**, and say you ran it.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`, written with
  `[IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($false)))`.
- **`$TMPDIR` is empty in the Bash tool here**; use the absolute scratchpad path.
- Stage explicit paths, never `git add -A`, `git status` first.

## Out of scope

Renaming the Tauri identifier. Renaming the binary (`london-trainer.exe`, from
`src-tauri/Cargo.toml`) - it is the same class of wart and it risks leaving an orphaned
exe in the install folder after an upgrade, so it wants its own thought: put it in the
SPEC section 6 register with that reasoning. Any change to course content. Any change to
the bundle format. Deleting bundled courses. A fixed export folder.

A valid follow-up in a file you already have open: do it now, as its own commit. One
needing a ruling: the register, with why it was not taken.

## Escalation

On any contradiction between this chip, SPEC.md and the code: stop that item, record
what contradicts what in the open items, continue with the rest. **If the migration
cannot be made safe - if Tauri will not grant what it needs, or the verification cannot
be written - STOP and report rather than shipping a best effort.** A course that fails
to appear is an annoyance; a progress file that goes missing is the incident this
project has already had once.

## Conventions and finish

Commit style follows the log: short imperative subject, body saying why, trailer naming
the ACTUAL model. Land the three tasks as separate commits. Tick PLAN.md phase 15 boxes
as you go. **The review gate box belongs to the orchestrator: leave it.**

Acceptance: the app reads and writes `%APPDATA%\Roaming\Repertoire Trainer`; Nick's two
learnt lines are live in the new location and the old folder is untouched; a failed
migration blocks saving and says so rather than starting blank; an imported course
appears without a restart; an imported tile can be deleted with the confirm above and
its progress survives a delete-and-reimport, proved in the packaged app; bundled tiles
have no delete; vitest green and `tsc -b` clean.
