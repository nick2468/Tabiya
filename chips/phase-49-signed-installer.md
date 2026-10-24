# Chip: phase 49 - the installer is signed in Nick's name

You are a builder session in `C:\Users\nick2\Code\Tabiya`, working on `main` (no worktree -
repo convention). `origin` is `github.com/nick2468/Tabiya`, PUBLIC. **You never push.**
**Run this after phase 48 has passed its gate.** Read `README.md` (its Download section is
what this phase eventually changes), `src-tauri/tauri.conf.json`, `package.json`'s scripts,
`scripts/check-uninstall-hook.mjs` (the style for a small check script), and PLAN.md phases
47 and 48 (the packaged-build walks this follows) before starting.

**THIS PHASE NEEDS NICK AT THE KEYBOARD FOR ITS SECOND HALF, AND THAT HALF IS BLOCKED UNTIL
HIS CERTIFICATE IS ACTIVE.** **Nick bought the certificate on 2026-10-24 and is waiting for
Certum to activate it.** Part A is buildable now with a throwaway certificate. Part B needs
Nick's real certificate, and signing with it needs Nick to log in to SimplySign with a
one-time token from his phone. Do Part A, stop, and report. Do not start Part B until Nick
says the certificate is active and he is present.

## The ruling, and why this route

Nick, 2026-10-24, after seeing that his PdfCraft installers are signed: **Tabiya's Windows
installer is to be code-signed, with Certum's "Open Source Code Signing in the Cloud"
certificate.** Researched in the PdfCraft session and handed over the same day; the facts
below were re-checked at source by the orchestrator before going into this chip.

- Nick publishes as an individual (`LICENSE`: "Copyright (c) 2026 Nick Walker").
- Certum's shop lists the open-source cloud certificate from EUR 49 a year
  (shop.certum.eu/open-source-code-signing-on-simplysign.html). The certificate lives in
  Certum's SimplySign cloud, so there is no USB token.
- Microsoft's own signing service does not serve individuals in Australia, per the PdfCraft
  research; SignPath Foundation is free but would show "SignPath Foundation" as the
  publisher, and Nick wants his own name.
- **Confirmed on Certum's own product page, 2026-10-24:** the certificate contains "natural
  person data prefixed with 'Open Source Developer' phrase". So it IS issued to an
  individual, and Windows will show "Open Source Developer" together with Nick's name, not
  his name alone. The page does NOT say which subject field the phrase lands in, or the
  exact punctuation. **So your code still reads the expected subject from configuration and
  never hard-codes it**; 49.9 records it exactly as issued.
- The page said "Product is out of stock" on 2026-10-24, and Nick bought it the same day
  regardless, so that label did not block a purchase.
- The page states no validity term. Since late February 2026 a code-signing certificate
  lasts at most about 459 days at Certum, so expect to renew, with a new thumbprint, at
  least that often.
- There is no Australian certificate authority to buy from instead: of the 550 roots Windows
  trusts, the only Australian owner is the Department of Defence. Same-shape alternatives
  (Certum's standard cloud certificate, SSL.com's individual certificate with its cloud
  signing) cost four to six times as much. Researched 2026-10-24 and recorded so nobody
  re-runs the search.

**What signing does and does not do.** It replaces "Unknown publisher" with Nick's name,
prefixed "Open Source Developer", and lets Windows build up reputation for the publisher. It does NOT make the SmartScreen warning
disappear on day one: a new publisher, and a new file, still start with no reputation. Say
that wherever the release is described.

## Verified facts (2026-10-24)

- Tauri CLI is **2.11.4**. `npx tauri build` accepts `-c, --config <CONFIG>` to merge
  extra configuration, and `--no-sign`.
- Its config schema has, under `bundle.windows`: `certificateThumbprint` (the SHA-1
  thumbprint), `digestAlgorithm`, `timestampUrl`, `tsp` (true means RFC 3161, the `/tr`
  form) and `signCommand` (a custom command with a `%1` placeholder).
- signtool is at `C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe`.
- Certum's own signtool guide gives
  `signtool sign /sha1 "<thumbprint>" /tr http://time.certum.pl /td sha256 /fd sha256 /v file.exe`
  and `signtool verify /pa /all file.exe` to check it.
- The installer is `Tabiya_<version>_x64-setup.exe`; the program inside is `tabiya.exe`
  (named by the Cargo package). NSIS installs per user, so there is no UAC prompt.
- The README's Download section (lines 21 to 25 today) says the installer is unsigned.

## Part A: buildable now

### 49.1 Signing configuration, kept out of the ordinary build

- [ ] Put the signing settings in their OWN file, `src-tauri/tauri.signing.conf.json`:
  `certificateThumbprint`, `digestAlgorithm: "sha256"`, `timestampUrl:
  "http://time.certum.pl"`, `tsp: true`. Merge it only for a release:
  `npx tauri build --config src-tauri/tauri.signing.conf.json`.
- [ ] **Why a separate file:** the certificate only exists while SimplySign is logged in.
  Put the thumbprint in `tauri.conf.json` and every ordinary packaged build, including every
  walk a phase like 47 or 48 needs, fails unless Nick is present. A plain `npx tauri build`
  must stay unsigned and must not change.
- [ ] Until the real certificate exists the file carries an obvious placeholder thumbprint
  that the preflight in 49.2 refuses with a clear message. **The thumbprint is public, not a
  secret**, so the real one is committed in Part B. It changes whenever Certum renews or
  reissues the certificate, at least yearly.
- [ ] The same file holds the EXPECTED subject and issuer the check in 49.3 asserts, so
  neither is hard-coded in a script. Placeholders until Part B.

### 49.2 A preflight that fails fast and plainly

- [ ] A short Node script, in the style of `scripts/check-uninstall-hook.mjs`, run before
  the multi-minute build: is the thumbprint's certificate present and unexpired in
  `Cert:\CurrentUser\My`, then `Cert:\LocalMachine\My`? If not, stop with a plain sentence
  such as "Log in to SimplySign Desktop first: the signing certificate is not available."
- [ ] **Escalation:** SimplySign presents a virtual card. If signtool can sign with the
  certificate but it appears in neither store, turn the store check into a warning, record
  why in the script's docblock, and say so in the open items.

### 49.3 A check that the signatures are really there

- [ ] A script that runs `signtool verify /pa /all` over the setup exe and the built
  `tabiya.exe` and asserts, for each: the signer subject matches the configured expected
  subject, the issuer matches the configured issuer, an RFC 3161 timestamp is present, and
  the digest is sha256.
- [ ] **Find every file Tauri signs by inspecting real output, never by assumption.** The
  bundler source suggests it signs the app binary, the installer, the uninstaller and the
  NSIS plugin DLLs, but confirm what 2.11.4 actually does from a built installer, and check
  every one it signs.

### 49.4 One command for a signed release

- [ ] An npm script, `build:signed`: preflight, then the signed build, then the check. A
  failure at any step stops the rest.

### 49.5 Prove the wiring with a throwaway certificate

- [ ] Make a self-signed code-signing certificate in the PERSONAL store only:
  `New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=ZZ Tabiya Test Signing"
  -CertStoreLocation Cert:\CurrentUser\My`.
- [ ] Point a SCRATCH, uncommitted copy of the signing config at it, build, and confirm
  every file from 49.3 carries a signature from it, timestamped by `http://time.certum.pl`.
  That also proves Certum's timestamp server works with this setup before any money is
  spent on a certificate.
- [ ] Its chain is not trusted, so the check needs an explicit, narrow allowance for this
  test alone: an option that accepts an untrusted root ONLY when the subject is the ZZ test
  subject. Never a general "ignore trust" switch.
- [ ] **Delete the certificate by thumbprint afterwards and confirm it is gone.** Say in the
  open items that you did, with the command.

### 49.6 Write the release procedure down

- [ ] `docs/releasing.md`, which does not exist today: version and tests (`npx tsc -b`,
  `npx vitest run`); Nick logs in to SimplySign; `npm run build:signed`; install the build
  and check the publisher (file Properties, Digital Signatures, or
  `Get-AuthenticodeSignature`); the `gh release create` step, titled the way v1.10.5 was
  ("Tabiya 1.10.5", one asset); and the yearly renewal, which means a new thumbprint in
  `tauri.signing.conf.json`.
- [ ] README "Running it": one line naming `npm run build:signed` and pointing at the doc.
  **Do not touch the Download paragraph in Part A**: it must stay true for the release it
  links, which is still unsigned.

### 49.7 PLAN and SPEC

- [ ] Tick the Part A boxes in PLAN.md. SPEC section 8: the ruling with its date and the
  reasons for Certum over the alternatives, in two or three sentences.
- [ ] No app change in Part A, so **no version bump**.
- [ ] **Stop here and report.** Part B waits for Nick.

## Part B: blocked on the certificate, needs Nick present

### 49.8 Nick's steps (a person's, never a session's)

- [x] Nick buys the certificate. Done 2026-10-24.
- [ ] He passes Certum's identity check, installs SimplySign Desktop and the SimplySign phone
  app, and activates the certificate. Certum's activation guide: files.certum.eu, "CS Open
  Source Code Signing in the cloud Certificate activation".
- [ ] At signing time he logs in: right-click the SimplySign tray icon, Connect to SimplySign,
  then his username and the one-time token from his phone. **Never ask him to type any of
  that into this session, and never put it in a file or on a command line.**

### 49.9 The real thumbprint and subject

- [ ] Read the thumbprint from SimplySign Desktop (Manage certificates, Certificate list,
  the certificate's Details), and the subject and issuer exactly as issued. Commit them in
  `tauri.signing.conf.json`. Record the exact subject in the open items, since it was
  unconfirmed until now.

### 49.10 The first signed build, installed and checked

- [ ] With Nick present and logged in, `npm run build:signed`. A PIN card may prompt more
  than once, because Tauri runs signtool once per file.
- [ ] Install it and check the INSTALLED `tabiya.exe` and its uninstaller with
  `Get-AuthenticodeSignature`: valid, signed in Nick's name, timestamped. Find their paths
  from the install; do not assume them.

### 49.11 The README, in the release that ships it

- [ ] Rewrite the Download paragraph in the SAME commit as the first signed release, so it is
  true for the release it links: the installer is signed in Nick Walker's name with a Certum
  open-source certificate, quoting the publisher exactly as Windows shows it (49.9 recorded
  it; expect "Open Source Developer" in it), and SmartScreen may still warn on a new release
  until it builds reputation. Keep the sentence that the source is all here and runs without
  installing.
- [ ] Nick's landing page has a general note that his installers are unsigned. Tell the
  orchestrator that it now needs narrowing; do not edit `C:\Users\nick2\Code\nick2468`
  yourself.

### 49.12 The release

- [ ] Hand the signed installer and the version to the orchestrator, who cuts the GitHub
  release after the gate.

## Hazards

- **The throwaway certificate goes in the personal store ONLY. Never in Root or
  TrustedPublisher**: that would make this machine trust it, which is a security change
  nobody asked for. ZZ-prefixed name, its thumbprint never committed, deleted afterwards.
- **The SimplySign username, token and PIN never appear in a transcript, a file or a
  command line.** The login happens in SimplySign's own window, by Nick.
- **The real certificate is Nick's identity.** Sign only Tabiya's own build output with it.
- **Never drop the timestamp to get past a timestamp-server failure: retry.** An
  untimestamped signature stops being valid when the certificate expires.
- The first packaged build after any folder move fails with "failed to read plugin
  permissions ... cannot find the path specified" naming an old folder; the fix is
  `rm -rf src-tauri/target/release/build/tauri-*`.
- No `tauri dev`. `npx tsc -b`, and say you ran it. `npx vitest run` after every change; the
  suite rule is twenty seconds. No em dashes anywhere. Australian English. Commit messages
  through a scratch file and `git commit -F`. Stage explicit paths, `git status` first.

## Out of scope

CI or GitHub Actions builds, SignPath, Microsoft's signing service, an MSI target, other
platforms, auto-update, and submitting files to Microsoft for SmartScreen review, which is
Nick's call later.

## Escalation

On any contradiction between this chip, the README or the code: stop that item, record it,
continue with the rest. If the subject or issuer Certum issues differs from what Part A
expected, that is normal and is what the configuration is for; change the configuration,
not the check.

## Conventions and finish

Commit style follows the log. Tick PLAN.md phase 49 boxes as you go; **the review gate box
is the orchestrator's.** Report to the orchestrator at the end of Part A, and again at the
end of Part B.

Acceptance, Part A: a separate signing configuration that leaves the ordinary build
unchanged; a preflight that refuses plainly when the certificate is absent; a check that
asserts subject, issuer, timestamp and digest on every file Tauri signs, found from real
output; `build:signed` tying them together; all of it proved end to end with a throwaway
certificate that was kept out of the trusted stores and deleted afterwards; the release
procedure written down; no version bump. Part B: the real thumbprint and subject committed,
a signed build installed and checked with Nick present, and the README's Download paragraph
changed in the release that ships it.
