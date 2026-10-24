# Chip: phase 50 - every library the app ships, credited inside it

You are a builder session in `C:\Users\nick2\Code\Tabiya`, working on `main` (no worktree -
repo convention). `origin` is `github.com/nick2468/Tabiya`, PUBLIC. **You never push.**
Read `vite.config.ts` (phase 48's `__DEPENDENCY_LICENCES__` is the precedent to extend),
`src/ui/About.tsx` and its tests, `src/ui/licences.test.ts`, the README's Licence section,
SPEC section 6 (the register entry phase 48 opened, which this phase closes) and PLAN.md's
gate 48 paragraph before starting.

**Run this BEFORE phase 49.** Phase 49 is chipped but its second half waits on Nick buying a
certificate; this one needs nothing from him.

Nick, 2026-10-24: **the app credits every third-party library it ships.** Version **1.10.7**.

## Why, and what was measured

MIT, BSD, Apache-2.0 and Unicode-3.0 all ask for their copyright and licence notice to go
with every copy, in source OR binary form. Confirmed at gate 48 in the built bundle: the only
copyright lines in the shipped program are Nick's and the GPL text's own. React's notice, and
those of every other bundled package and of every Rust crate in `tabiya.exe`, are absent. True
of every installer this app has shipped. Now that the repository is public with a download
link, it gets fixed properly.

Measured 2026-10-24, so you know the size before you start:

- **JavaScript.** 95 packages in `package-lock.json` are not marked `dev`. That is a safe
  upper bound on what is bundled; tree-shaking ships fewer.
- **Rust.** `cargo metadata --filter-platform x86_64-pc-windows-msvc`, walking NORMAL
  dependencies from the root (not build, not dev), reaches **247 crates**. Their licences:
  122 "MIT OR Apache-2.0", 40 "MIT", 27 "Apache-2.0 OR MIT", 18 "Unicode-3.0", 10
  "MIT/Apache-2.0" (the old slash form of OR), 8 "Unlicense OR MIT", 5 "MPL-2.0", 2 "MIT OR
  Apache-2.0 OR Zlib", and a few singletons.
- **11 crates ship no licence file in their source**, so a generator that only copies files
  would silently drop them: webview2-com, webview2-com-macros, webview2-com-sys (MIT);
  unic-ucd-ident, unic-char-property, unic-char-range, unic-ucd-version, unic-common
  (MIT/Apache-2.0); defmt-parser (MIT OR Apache-2.0); selectors (MPL-2.0); alloc-stdlib
  (BSD-3-Clause).
- **5 crates are MPL-2.0**: cssparser 0.36.0, selectors 0.36.1, cssparser-macros 0.6.1,
  dtoa-short 0.3.5, option-ext 0.2.0. MPL-2.0 section 3.2(a) asks more than a notice: whoever
  distributes the program in executable form must tell recipients how to get those files'
  source. `cssparser-macros` is a procedural macro, which runs at compile time and is not in
  the binary.
- **No crate carries a NOTICE file** today. Apache-2.0 section 4(d) would require one to be
  reproduced, so handle the case even though it is empty now.
- `npm run build` is `npm run engine && tsc -b && vite build`, and `tauri.conf.json`'s
  `beforeBuildCommand` is `npm run build`, so anything wired into the Vite build runs for
  every packaged build too. Vite is 8.2.2, which bundles with Rolldown.

## The work

### 50.1 A generator, built from what actually ships

- [ ] Generate a plain-text notices file during the PRODUCTION build and emit it as its own
  asset in `dist/`. Prefer doing it as a small Vite plugin in the `generateBundle` hook, which
  sees every module in every chunk, so the JavaScript list is exactly the set of packages
  whose code is in the bundle. Emit the result with `this.emitFile` rather than writing into
  `public/`, so there is no generated file to gitignore or to drift.
- [ ] **Fallback, if the bundle-derived set is impractical under Rolldown:** use the
  lockfile's non-`dev` packages, a safe superset (95 today), and say so in the open items and
  the file's header. Over-including a notice is harmless; leaving one out is the fault this
  phase exists to fix.
- [ ] Two sections, because the browser build has no Rust in it: **"In every build"** (the
  JavaScript) and **"In the Windows program only"** (the Rust crates in `tabiya.exe`).
- [ ] Nothing runs in `vite` dev mode, where there is no bundle. The About handles a missing
  file (50.4).

### 50.2 The Rust crates in the binary

- [ ] Run `cargo metadata --format-version 1 --filter-platform x86_64-pc-windows-msvc` in
  `src-tauri`, and walk NORMAL dependencies from the root package. Leave out crates whose
  only target is `proc-macro`: their code runs at compile time and is not in the binary. Say
  in the file's header that they are left out and why, and report the count.
- [ ] Find `cargo` on `PATH`, then in `%USERPROFILE%\.cargo\bin`; if neither, fail the build
  with a plain message. The orchestrator's own shell does not have it on `PATH` by default.

### 50.3 Resolving each licence

- [ ] **An OR expression is a choice.** Treat `MIT/Apache-2.0` as `MIT OR Apache-2.0`. Choose
  MIT whenever it is offered, otherwise the first option, and record which was chosen.
- [ ] **The text comes from the package's own file** matching the chosen licence (`LICENSE`,
  `LICENSE-MIT`, `LICENSE-APACHE`, `COPYING`, and so on), verbatim.
- [ ] **No file (11 crates today): fall back to the canonical text**, from a small vendored
  folder `scripts/licence-texts/` holding only the texts that are needed (MIT, Apache-2.0,
  BSD-3-Clause, MPL-2.0, and any other the fallback reaches), each copied from
  spdx.org/licenses with its source URL noted. Where the licence has a copyright line, fill it
  from the crate's `authors` in its metadata, or its name and repository if that is empty.
  **Never leave a package out because it has no file.**
- [ ] Any NOTICE file a package carries is included verbatim beside its licence.
- [ ] **An unrecognised or missing licence expression FAILS the build**, naming the package.
  The fix is to add the text, never to skip the package.
- [ ] Packages whose full licence text is identical (after normalising line endings and
  trailing spaces) share one copy, with all their names and versions listed above it.

### 50.4 The MPL crates' source

- [ ] For each MPL-2.0 crate that is in the binary (four today, `cssparser-macros` being
  compile-time only), list its exact version and where its source is: its crates.io page and
  its repository URL. State plainly that the source of those files is available there. That
  is the information MPL-2.0 section 3.2(a) asks a distributor to give. Include the MPL-2.0
  text once.

### 50.5 Readable inside the app

- [ ] The About's **View the licences** gains a **Third-party notices** section that loads
  the emitted file ON DEMAND when it is opened, rather than importing it into the main
  bundle: it will be hundreds of kilobytes, and nobody should download it to start the app.
  It scrolls inside itself the way phase 48's licence boxes do.
- [ ] In dev mode, where the file does not exist, it says the notices are generated when the
  app is built for release, rather than showing an error.
- [ ] Phase 48's MIT and GPL texts and its direct-dependency list stay as they are.

### 50.6 README, SPEC and Help

- [ ] README, Licence section: one sentence that the full third-party notices ship inside
  the app under View the licences and are generated from the build itself.
- [ ] SPEC section 6: close phase 48's register entry, saying what closed it. Section 8: the
  ruling with its date.
- [ ] `HELP_CONTROLS` gains **Third-party notices** if it is a control, and the help test is
  mutation-checked on it.

### 50.7 Tests

- [ ] Unit tests of the generator's pure parts against fixtures: the OR choice including the
  slash form; the fallback to vendored text with an `authors` copyright line; deduplication;
  NOTICE inclusion; and the build failing on an unknown licence. Mutation-check each.
- [ ] A test that each vendored text is the licence its file name says (its title line).

### 50.8 Version 1.10.7

- [ ] `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`.

### 50.9 Prove it

- [ ] Browser production build: the emitted file exists and its JavaScript section holds
  React's own notice ("Copyright (c) Meta Platforms, Inc. and affiliates.") and the other
  bundled packages. Report how many packages it lists.
- [ ] Packaged build, installed and driven: View the licences shows the notices in the
  installed app, including the Rust section. Report how many crates it lists. Spot-check one
  fallback crate (webview2-com) and the four MPL crates with their source links.
- [ ] Measure the file's size and the main bundle's size before and after, to prove the
  notices did not land in the main bundle.

## Hazards

- **Never drop a package to make the build pass**, and never hand-edit the generated file.
- **Never inline the notices into the main bundle.**
- The first packaged build after any folder move fails with "failed to read plugin
  permissions ... cannot find the path specified" naming an old folder; the fix is
  `rm -rf src-tauri/target/release/build/tauri-*`.
- No `tauri dev`. A packaged build IS wanted, for 50.9. `npx tsc -b`, and say you ran it.
  `npx vitest run` after every change; the suite rule is twenty seconds. No em dashes
  anywhere. Australian English. Commit messages through a scratch file and `git commit -F`.
  Stage explicit paths, `git status` first.

## Out of scope

The NSIS installer stub and its plugins (check their licences, and if any requires a notice
in binary form, register it in SPEC section 6 with what it would take); the WebView2 runtime,
which is part of Windows and not shipped; new tools such as cargo-about or a licence-checker
dependency, unless you can show the generator above is impractical without one; and any
change to the licences themselves.

## Escalation

On any contradiction between this chip, the README or the code: stop that item, record it,
continue with the rest. If a crate's licence cannot be resolved by the rules above, fail the
build and report it rather than guessing.

## Conventions and finish

Commit style follows the log. Tick PLAN.md phase 50 boxes as you go; **the review gate box is
the orchestrator's.** Report to the orchestrator when done.

Acceptance: a notices file generated during every production build from what actually ships,
in two sections, covering every bundled JavaScript package and every Rust crate compiled into
`tabiya.exe`, with no package dropped for lack of a licence file; OR choices resolved and
recorded; the MPL crates' source locations stated; unknown licences failing the build; the
notices readable in the installed app, loaded on demand and kept out of the main bundle;
phase 48's register entry closed; version 1.10.7; vitest green and `tsc -b` clean; the tree
committed and clean.
