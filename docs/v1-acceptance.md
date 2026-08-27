# v1 acceptance, checked

Phase 5 task 5.5: SPEC.md section 9, item by item, with what was actually done to
check each one. Written 2026-08-27.

Where something was checked by driving the app, it was driven: the dev build through
the browser pane, and the production bundle served from `dist/`. Where a check could
not be made in this session, it says so rather than claiming otherwise.

## 1. Study

**Green.** All eight chapters open. Every one of the 41 lines was walked end to end in
the app: each leaf carried its "your plan from here" note, no White move was missing a
note, the learnt toggle was reachable at every leaf, and every leaf had at least the
last-move arrow on the board. Chapter intros all render their typical-mistakes section.
Learnt toggles survive a reload, and the same walk passes on the production bundle.

## 2. Drill

**Green.** Learnt lines generate cards keyed by position: across the whole course 161
chapter-local cards collapse to 123 unique ones, so a setup move shared by several
chapters is asked once. The due queue works, and all three grading paths were driven
live: the repertoire move, a listed wrong try with the author's own grade and reason,
and an unlisted move told only that it is not the repertoire move. The weak-area filter
demonstrably reorders the queue toward the concept going worst. Everything survives a
restart. Export and import round-trip, including a deliberately corrupt file that left
the saved progress untouched.

## 3. Play

**Green in the browser.** All three launch shapes work: any defence, a chapter's
defence (verified reaching the King's Indian setup), and from a Study position with the
moves replayed. All three lengths and all eight strengths are offered; full games ran
to checkmate at strengths 3 and 6. The report names the first White deviation with the
book move and its note, handles the case where Black left book first, flags blunders at
fixed effort, and speaks in words. No evaluation appears while a game is running; the
bar exists in the report only.

## 4. Progress

**Green.** Chapter completion, per-concept accuracy and play stats all render from real
state, and every number was reconciled against the card arithmetic behind it.

## 5. Content

**Green.** Eight chapters, 41 lines, validator green, and no two chapters expecting
different moves in the same position. Every chapter has now had an engine pass over
every White move: chapter 2 in full plus spot checks in phase 4, the remaining four in
phase 5. Seven real faults were found and fixed across those passes, none of which the
legality validator could have caught.

## 6. Tests

**Green.** 231 vitest tests over the model, the scheduler, the play logic with the
engine mocked, and storage.

## 7. Ships

**Green, closed by Nick's first-run check below.** The Tauri bundler produces
`London Trainer_1.0.0_x64-setup.exe`, 6.9 MB. Running the packaged binary opens the
window and the app renders: that is how the AppData bug was found, and the fix was
confirmed the same way. Progress lands in
`%APPDATA%\com.nick.london-trainer\progress.json`.

The migration path was driven end to end in the packaged app. A version 1 file, the
shape the browser phase wrote before drills existed, was put in that location; the app
read it, migrated it to version 3, and both learnt lines came through unchanged.

Two things a human still has to do once, because this session had no display:

- **Click through the installer.** The silent flag left the installer waiting on a
  dialog nobody could see, so it was stopped rather than left on screen. The bundle
  itself is built and the binary it installs has been run.
- **Make one move on the board in the packaged app.** The board deliberately ignores
  synthetic events outside dev builds, which is what makes the automated checks
  impossible there. Everything either side of that click is verified.

Both were done by Nick on 2026-08-27: the installer ran and a move was played on the
board in the installed app. Every item in SPEC.md section 9 is now green.

## What the checking itself got wrong

Worth recording, because it cost time twice. A hidden browser pane throttles React's
scheduler: a move played through synthetic events lands in the session immediately, but
the screen can take a second or more to catch up. Read once and it looks exactly like a
broken re-render. It was not one, either time. Any headless check of this app has to
poll for the DOM to change rather than read once and conclude.
