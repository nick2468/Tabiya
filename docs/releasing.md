# Releasing Tabiya

How a version goes from `main` to a signed installer on the GitHub releases page. Written at
phase 49, when the installer was first signed.

## What signing needs

The installer and the program inside it are signed with Nicholas Walker's Certum "Open Source
Code Signing in the Cloud" certificate. Windows shows the publisher as **Open Source Developer
Nicholas Walker**.

The private key lives in Certum's SimplySign cloud, never on this machine. SimplySign Desktop
makes it look like a smart card to Windows, but only while Nick is logged in. So **a signed
build needs Nick present**, logged in with the one-time code from the SimplySign phone app. A
session never asks for that code, and it never goes in a file or on a command line.

An ordinary `npx tauri build` stays unsigned and needs nobody. Only `npm run build:signed`
signs.

## Steps

1. Bump the version in `package.json`, `src-tauri/tauri.conf.json` and
   `src-tauri/Cargo.toml`, then run `npm install --package-lock-only --no-audit --no-fund` so
   the lockfile follows. `src/version.test.ts` fails if any of them disagree.
2. Run `npx tsc -b` and `npx vitest run`. Commit, so the build comes from a clean tree.
3. Nick logs in to SimplySign Desktop: right-click its icon by the clock, choose
   **Connect to SimplySign**, and enter the code from the phone app.
4. Run `npm run build:signed`. It checks the certificate is available, builds, and then checks
   the installer's signature. Each step stops the rest if it fails. Tauri also signs the
   program, the uninstaller and the installer's plugins, but inside the installer, so those
   are checked after installing, in step 6. If signing fails at the very last step, on the
   installer itself, it is almost always the timestamp server: sign that one file again by hand
   with the same command the build printed, then run `node scripts/build-signed.mjs verify`.
   Never sign without the timestamp to get past it.
5. The build may update `src-tauri/Cargo.lock` with the new version. If it does, commit that.
6. Install it over the previous release **through its windows, as a user would**, with
   `scripts/upgrade-walk.cmd`. It clicks through the installer, picks "Uninstall before
   installing" (or "Uninstall Tabiya" for the same version), checks the old uninstaller was
   given the install folder, leaves "Delete the application data" unticked, and finishes. Then
   it records the installed version, publisher and signatures, and starts the program. Its log
   is `%TEMP%\tabiya-upgrade-walk.log`.
   **A Claude Code session must start it through Explorer**:
   `Start-Process explorer.exe '"<repo>\scripts\upgrade-walk.cmd"'`, then wait for the log's
   `.finished` file before reading the log. The session's own shell runs in a sandbox whose
   writes to the registry and LocalAppData go to a private copy. An install run from it changes
   nothing on the real machine, and its upgrade tests see its own earlier installs. That is how
   1.10.9 and 1.10.10 shipped an upgrade that failed (phase 53). A silent `/S` install is no
   substitute either: it skips the page that runs the old uninstaller.
7. Push, tag `v<version>`, push the tag, and create the release with the installer as its one
   asset, titled "Tabiya <version>":
   `gh release create v<version> src-tauri/target/release/bundle/nsis/Tabiya_<version>_x64-setup.exe --repo nick2468/Tabiya --title "Tabiya <version>" --notes-file <notes>`.
8. Check the released asset's SHA-256 matches the file you tested, and that
   `https://github.com/nick2468/Tabiya/releases/latest` points at the new release.

## What signing does not do

Signing names the publisher. It does not stop the SmartScreen warning on day one. Windows builds
up reputation for a publisher and for each file over time, so a new release may still warn for a
while.

## Renewing the certificate

The certificate runs for one year: the first was issued on 28 October 2026 and expires on
28 October 2027. Renew it with Certum before then. The renewed certificate has a new
thumbprint, so replace both of these together:

- `src-tauri/signing/code-signing.cer`, the new certificate's public file from Certum;
- `certificateThumbprint` in `src-tauri/tauri.signing.conf.json`.

The build's pre-check refuses if the two disagree. Releases signed before the renewal stay
valid, because every signature carries a timestamp from `http://time.certum.pl`. That is also
why a timestamp failure is retried, never skipped.

The certificate allows 5,000 signatures a month. Each signed build uses a few, one per file.
