# Chip: phase 47 - the app is called Tabiya

You are a builder session in the Repertoire Trainer repository, working on `main` (no
worktree - repo convention, and there is no remote yet: never push, never create one).
**The folder is either `C:\Users\nick2\Code\London` or `C:\Users\nick2\Code\Tabiya`**,
depending on whether Nick has renamed it yet (see the out of scope note). Work in whichever
one you were started in and do not try to rename it: a session cannot rename the directory
it is running in, which was confirmed at this phase.
Read SPEC.md sections 8 and 10, PLAN.md phases 15, 16 and 17 (the folder move, the second
copy and the uninstaller: this phase is the same job a second time),
`src/storage/paths.ts` in full, `src/storage/migrate.ts` in full, `src/storage/safety.ts`,
`src-tauri/capabilities/default.json`, `src-tauri/installer-hooks.nsh`,
`src-tauri/src/lib.rs`, `src/ui/prefs.ts` and `src/ui/theme.ts` before starting.

Nick, 2026-10-17, preparing to make the GitHub repository public: **the app is renamed
Tabiya.** A tabiya is the standard position an opening heads for, before play diverges,
which is what every chapter in every course teaches. The old name sat in a field of
near-identical descriptive titles (Chess Opening Trainer, Chess Opener, Chess Prep Pro,
ChessAtlas), which is what it was changed to get out of.

**No chess content. The data folders move, so this is a migration phase and the phase 15
rules bind in full.** Version: the next patch after phase 46, so **1.10.5** if phase 46
has landed, **1.10.4** if it has not. Say which you used and why.

## What the name is, and where it goes

`Tabiya`, capitalised, as one word, everywhere a person reads it. No tagline change: "Learn
your openings by understanding them." still fits and is already in the header.

## The three identities, and which of them move

This is the part to get right before touching anything. The app has three names and they
are not interchangeable.

| | Value now | Changes? |
|---|---|---|
| Product name | `Repertoire Trainer` | **YES.** Window title, header, installer, Start menu, install folder. |
| Data folders | `Repertoire Trainer`, `Repertoire Trainer Data` | **YES, with a migration.** This is where the trainee's progress lives. |
| Tauri identifier | `com.nick.london-trainer` | **NO.** |
| localStorage keys | `london-trainer.*` | **NO.** |

- [ ] **47.1 The identifier does not change, and the comment that says why is corrected.**
  `paths.ts` currently says changing the identifier "already left a second application
  beside the first". That is **wrong** and was found wrong at this phase: the identifier
  has had exactly one value since the Tauri commit and has never changed. The second
  application came from the PRODUCT NAME change at phase 15's rename, because Tauri's NSIS
  keys its uninstall entry on the product name (verified then: the v1 entry was
  `HKCU\...\Uninstall\London Trainer` with no key under the identifier anywhere). Fix that
  sentence where it appears in `paths.ts` and in SPEC.md. The reason the identifier stays
  is the true one: it is invisible, nothing reads it but `appDataDir()`, and changing it
  buys nothing while costing a third folder generation to migrate from.
- [ ] **47.2 The localStorage keys stay `london-trainer.*`.** Thirteen of them across
  `prefs.ts` and `theme.ts`, holding the theme, the selected course, and every Play and
  Drill setting phase 44 made persistent. They are invisible, and renaming them would
  silently reset the lot. Add one comment at the key block saying they are deliberately
  not renamed and why, so a later tidy-up does not do it. This is the same reasoning as
  the identifier and should read that way.

## The work

### 47.3 The data folders move, and the migration carries the trainee across

- [ ] `DATA_FOLDER` becomes `Tabiya` and `LOCAL_FOLDER` becomes `Tabiya Data` in
  `src/storage/paths.ts`, and the same `LOCAL_FOLDER` literal in `src-tauri/src/lib.rs`.
- [ ] **`oldDataRoots()` becomes a CHAIN, tried newest first.** It returns one location
  today, the identifier folder. It needs two: `<roaming>/Repertoire Trainer` first, then
  the identifier folder. Return a list and have the caller take the first that exists.
  Keeping the identifier folder at the end costs one `exists` call and means nobody on any
  generation is stranded; dropping it would quietly remove support the code has today.
- [ ] **The migration itself is NOT rewritten.** `migrate.ts` was built at phase 15 for
  exactly this job and its docblock says so. It takes the roots it is given, COPIES,
  verifies by reading back and counting learnt lines before the new location counts as
  live, leaves the old folder for the trainee to delete, and on any failure takes the
  blocked-save route rather than starting blank. All of that stands. What changes is which
  roots it is handed. If it turns out the module cannot take a chain without being
  reshaped, STOP and say so rather than reshaping it in passing.
- [ ] The second copy under the local folder moves with it, and `safety.ts` keeps working:
  the copy must still land somewhere no installer touches, which is the whole reason
  `LOCAL_FOLDER` is `<name> Data` and not `<name>`.
- [ ] Tests: a migration from `Repertoire Trainer` to `Tabiya` with the learnt lines
  counted on the far side; a migration from the identifier folder when the middle
  generation is absent; a fresh install with neither, which must start blank WITHOUT a
  migration running; and a failure part way through that blocks saving rather than
  starting blank. The existing fakes cover all four without Tauri.

### 47.4 The capability scopes follow the folders

- [ ] `src-tauri/capabilities/default.json` grants the window its filesystem paths by
  literal name, thirty-one of them. Every `$DATA/Repertoire Trainer/...` becomes
  `$DATA/Tabiya/...` and every `$LOCALDATA/Repertoire Trainer Data/...` becomes
  `$LOCALDATA/Tabiya Data/...`.
- [ ] **Three generations must now be readable**, which is the subtlety: the new folder
  read and write, `Repertoire Trainer` READ ONLY so the migration can copy out of it, and
  the identifier folder read only as it already is. Write access to an old folder is what
  makes a migration a move instead of a copy, so neither old generation gets it. The
  file's `description` field is prose that explains the grants: rewrite it to say what is
  now true, including the second old folder.
- [ ] Get this wrong and the app cannot read its own progress file. Drive the desktop
  build, not just the browser one, before calling it done.

### 47.5 The installer and its uninstall hook

- [ ] `src-tauri/installer-hooks.nsh` names both data folders in its offer to remove
  application data: `APP_DATA_FOLDER` and `APP_LOCAL_FOLDER` become the Tabiya ones.
- [ ] **A second installed application will appear, and that is expected.** NSIS keys its
  uninstall entry on the product name, so installing Tabiya leaves "Repertoire Trainer"
  registered beside it exactly as "London Trainer" was left at phase 15. Nick uninstalls
  the old one by hand, once. Say so in the open items in those words, because it looks
  like a bug if nobody warned him. An NSIS hook that removes the predecessor is in the
  register from phase 15 with the reason it was not taken; it is still not taken.
- [ ] The old uninstaller must not take the new data with it. Nick's "Repertoire Trainer"
  uninstall offers to remove `$APPDATA\Repertoire Trainer` and
  `$LOCALAPPDATA\Repertoire Trainer Data`, which after the migration are the OLD copies and
  are his to delete anyway. Confirm by reading the hook that it names those literals and
  cannot touch the Tabiya folders, and say so.

### 47.6 Every place a person reads the name

- [ ] `src-tauri/tauri.conf.json` `productName`; `index.html` title; `src/ui/App.tsx`
  header; `src/ui/Play.tsx`; `src/ui/help-text.ts`; `src/ui/prefs.ts`'s docblock;
  `src/play/game-pgn.ts` (the PGN tag the app stamps on an exported game);
  `vite.config.ts`. Their tests move with them: `help.test.ts`,
  `blank-start-real.test.ts`, `game-pgn.test.ts`.
- [ ] `package.json` `name` becomes `tabiya`; `src-tauri/Cargo.toml` `name` becomes
  `tabiya` and the lib name follows (`repertoire_trainer_lib`), which means
  `src-tauri/src/main.rs` and the `lib.rs` export change with it. `Cargo.lock` is
  regenerated by the build, not hand-edited.
- [ ] `README.md`: the title and the first line. The licence section and the Stockfish
  paragraph stay as they are.

### 47.7 What must NOT be renamed

- [ ] **`chips/` is history and is not touched.** Forty-odd files name the old app
  because that is what it was called when they were written. Rewriting them would make the
  record of the build a record of something that never happened.
- [ ] **PLAN.md's existing phase sections are history too.** Phase 15's entry describes
  renaming to Repertoire Trainer and must keep saying that. Only the NEW phase 47 section
  uses the new name. Same for SPEC.md section 8: the rulings log is dated entries, and an
  old entry keeps the name it was written with.
- [ ] `BRIEF.md` says at the top that it is superseded and kept for history. Leave it.
  `docs/multi-opening-concept.md` and `docs/v1-acceptance.md` are the same.
  `docs/engine-runs/**` are measurement records and are never edited.
- [ ] A find-and-replace across the repository would break every one of these. Change the
  files 47.1 to 47.6 name, and nothing else. List in the open items every file you
  changed, so the review can check that list against this rule.

### 47.8 SPEC and PLAN

- [ ] SPEC.md section 8: the ruling with the date, the name, Nick's reason (the repository
  is going public and the old name was one of a crowd), and the three-identities table
  above in prose. Also the 47.1 correction, which contradicts what section 8 says today.
- [ ] SPEC.md section 10 and anywhere else that states the product name as current fact.
- [ ] PLAN.md phase 47 section, ticking boxes as you go.

### 47.9 Prove it

- [ ] Browser build at 1400x980: the header, the title bar and the help all say Tabiya.
- [ ] **The desktop build matters more here than in any phase since 15, because the
  capabilities and the migration can only fail there.** Build the app, install it beside
  the existing one, and confirm: the new folders are created, the progress file is carried
  across, the learnt line count on the far side equals the count before, the old folder is
  still there untouched, and a drill answer saves into the new location. **Do this against
  a COPY of Nick's folders, never against his live ones**, and say how you made the copy.
- [ ] Clear browser storage afterwards. Reset the viewport.

## Hazards

- **Nick's progress file is live and he has lost one before.** Never test against his real
  folders, never list or report his data folders from your own shell, and never let the
  migration delete anything. A migration that deletes has one chance to be right; this one
  does not delete.
- **The capability scopes are the one change that cannot be tested in the browser.** A
  missing grant looks exactly like a corrupt install to a user.
- **Three literals must agree**: `LOCAL_FOLDER` in `paths.ts`, the same string in
  `lib.rs`, and `APP_LOCAL_FOLDER` in the NSIS hook. Phase 16 shipped them disagreeing
  once.
- **No `tauri dev`.** A packaged build IS wanted this time, for 47.9; it is the only phase
  where the builder needs one. Build it, test it, and say so.
- **Commit before you stop.** `npx tsc -b`, and say you ran it. `npx vitest run` after
  every change; the rule is twenty seconds.
- **No em dashes anywhere.** Australian English.
- **PS 5.1 mangles commit messages**: scratch file plus `git commit -F`.
- Stage explicit paths, never `git add -A`, `git status` first. There is an untracked
  `chips/phase-46-bar-number.md` in the tree that belongs to Nick: leave it alone.

## Out of scope

Renaming the repository FOLDER on disk. This was tried at chip-writing time and failed
with "the process cannot access the file because it is being used by another process":
the open Claude session holds its own project directory, and the harness resets the shell
back into it after every command, so changing directory inside a call does not help. It is
Nick's step, and with the session closed it is two commands:

```
cd C:\Users\nick2\Code
ren London Tabiya
```

then reopen the session on `C:\Users\nick2\Code\Tabiya`. Nothing inside the repository
depends on the folder name: `.claude/launch.json` runs npm relatively, and the only
absolute paths in tracked files are stack traces inside `docs/engine-runs/**` and one
path-traversal test fixture, none of which are ever read as paths. The open items should
say whether the folder had already been renamed when this phase ran.

Creating the GitHub remote. The identifier. The localStorage keys. Any chess content.
Any change to the four checkers. Phase 46's eval bar number, which is its own chip.

## Escalation

On any contradiction between this chip, SPEC.md, the schema doc or the code: stop that
item, record it, continue with the rest. **If the migration cannot be pointed at a chain
without reshaping `migrate.ts`, stop and report rather than reshaping it** - that module
is the one piece of this app that stands between Nick and losing his learnt lines twice.

## Conventions and finish

Commit style follows the log. The identity rulings and their corrected comments first,
then the folders and the migration with its tests, then the capabilities, then the
installer, then the visible strings, then the docs and the version, each its own commit.
Tick PLAN.md phase 47 boxes as you go. **The review gate box belongs to the orchestrator:
leave it.** The open items list every file whose name text changed, the version used and
why, how the folder copy for testing was made, the learnt line count either side of the
migration, and the sentence telling Nick to uninstall the old application by hand.

Acceptance: the app is Tabiya everywhere a person reads it; the identifier and the
localStorage keys unchanged with a comment saying why, and the false claim about the
identifier corrected in both places it appears; the data folders renamed with the phase 15
migration carrying the progress across as a verified copy, tested for both old generations,
a fresh install and a failure; the capability scopes matching the new folders with both old
generations readable and neither writable; the NSIS hook naming the new folders; `chips/`,
`BRIEF.md`, the historical PLAN and SPEC entries and `docs/engine-runs/**` untouched; SPEC
section 8 carrying the ruling and the correction; the version bumped with its reason; a
packaged build installed and driven against a copy of the real folders; vitest green and
`tsc -b` clean; the tree committed and clean.
