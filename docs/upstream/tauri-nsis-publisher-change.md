# Draft issue for tauri-apps/tauri: NSIS upgrade fails after `bundle.publisher` changes

**Status: draft, not filed. No longer needed by Tabiya** (phase 54 set the publisher to
"Nicholas Walker" while no outside install existed), but the bug is Tauri's and affects any app
whose publisher changes, so it is kept for Nick to file if he chooses. Written 2026-10-28 at Tabiya phase 53. Nick files it from his own
GitHub account, using Tauri's bug report form; the sections below follow that form. A search of
the tracker on 2026-10-28 found no existing report (the nearest, #7317, is a different bug in
tauri-cli 1.4.0). 

---

**Title:** [bug] NSIS: upgrading fails with "Error launching installer" after `bundle.publisher` changes

### Describe the bug

The NSIS installer finds the previous install's directory through a registry key named after the
publisher, `HKCU\Software\${MANUFACTURER}\${PRODUCTNAME}` (`MANUPRODUCTKEY`), and nothing else.
If `bundle.publisher` has changed since the previous version was installed, that key does not
exist under the new name. The installer then runs the old uninstaller as
`"<dir>\uninstall.exe" _?=` with an empty directory. NSIS refuses to start it and shows
**"Error launching installer"**, and the installer then shows **"Unable to uninstall!"** and
returns to the "Already Installed" page. The user cannot upgrade with the default choice,
"Uninstall before installing".

This is easy to walk into. When `bundle.publisher` is not set, the bundler uses the second part
of the identifier (`com.nick.app` gives "nick"). Setting a real publisher name later is a natural
thing to do, and it breaks the upgrade path for every existing user.

The uninstall entry already records the directory in `InstallLocation`, a key that does not
depend on the publisher, but the installer never reads it.

The relevant lines, from the generated `installer.nsi` (tauri-cli 2.11.4; the same lines are on
`dev` as of 2026-10-28):

```nsis
!define MANUKEY "Software\${MANUFACTURER}"
!define MANUPRODUCTKEY "${MANUKEY}\${PRODUCTNAME}"
...
  reinst_uninstall:
    HideWindow
    ClearErrors
    ...
      ReadRegStr $4 SHCTX "${MANUPRODUCTKEY}" ""
      ReadRegStr $R1 SHCTX "${UNINSTKEY}" "UninstallString"
      ...
      StrCpy $R1 "$R1 _?=$4" ; append uninstall directory
      ExecWait '$R1' $0
    ...
    ${IfThen} ${Errors} ${|} StrCpy $0 2 ${|} ; ExecWait failed, set fake exit code
```

Two details make it worse than an empty path:

- `ReadRegStr` sets the error flag when the value is missing. So even if the uninstaller ran, the
  `${Errors}` check above would turn the result into exit code 2 and "Unable to uninstall!".
- `RestorePreviousInstallLocation` reads the same key, so after a publisher change a user who
  installed to a custom directory is offered the default directory instead.

### Reproduction

1. Build and install a version with `"publisher": "Old Name"` (or no publisher, with an
   identifier like `com.oldname.app`), `installMode: "currentUser"`.
2. Change `bundle.publisher` to `"New Name"`, bump the version, and build again.
3. Run the new installer through its windows (not `/S`). On "Already Installed", leave
   "Uninstall before installing" selected and click Next.
4. NSIS shows "Error launching installer". After OK, the installer shows "Unable to uninstall!".
   The old uninstaller's command line ends in a bare `_?=`.

Choosing "Do not uninstall" works around it. A silent `/S` install does not hit it, because the
reinstall page is skipped.

### Expected behavior

The upgrade finds the previous install whatever the publisher was, and runs its uninstaller with
the right directory.

### Suggested fix

Read the directory in one place, fall back to `InstallLocation` from the uninstall key (written
quoted, so strip the quotes), and clear the error flag the failed read leaves behind:

```nsis
; Sets $4 to the previous install directory, or "" if there is none.
; MANUPRODUCTKEY is named after the publisher, so it is missing when the publisher
; has changed since the previous install. InstallLocation does not depend on it.
Function ReadPreviousInstallDir
  ReadRegStr $4 SHCTX "${MANUPRODUCTKEY}" ""
  ${If} $4 == ""
    ReadRegStr $4 SHCTX "${UNINSTKEY}" "InstallLocation"
    StrCpy $5 $4 1
    ${If} $5 == '"'
      StrCpy $4 $4 -1 1
    ${EndIf}
  ${EndIf}
  ClearErrors
FunctionEnd
```

and call it from both `reinst_uninstall` and `RestorePreviousInstallLocation` in place of the
direct `ReadRegStr $4 SHCTX "${MANUPRODUCTKEY}" ""`. It would also be worth refusing to run the
uninstaller when `$4` is still empty, rather than passing `_?=` with nothing after it.

### Full `tauri info` output

```text
[✔] Environment
    - OS: Windows 10.0.26200 x86_64 (X64)
    ✔ WebView2: 156.0.4314.50
    ✔ MSVC: Visual Studio Community 2022
    ✔ rustc: 1.98.0 (88d9e12ae 2026-08-18)
    ✔ cargo: 1.98.0 (797e8a9bc 2026-08-05)
    ✔ rustup: 1.29.0 (28d1352db 2026-03-05)
    ✔ Rust toolchain: stable-x86_64-pc-windows-msvc (default)
    - node: 24.19.0
    - npm: 11.17.0

[-] Packages
    - tauri 🦀: 2.11.5
    - tauri-build 🦀: 2.6.3
    - @tauri-apps/api ⱼₛ: 2.11.1
    - @tauri-apps/cli ⱼₛ: 2.11.4

[-] App
    - build-type: bundle
    - frontendDist: ../dist
    - bundler: Vite
```

### Stack trace

None. It is an installer behaviour, not a crash.

### Additional context

Found in [Tabiya](https://github.com/nick2468/Tabiya), whose 1.10.9 release changed the
publisher from the identifier-derived "nick" to the author's name. We could only recover because no
one outside had installed it yet: a workaround that keeps the old publisher (rewriting the
`Publisher` value in the uninstall key from an `NSIS_HOOK_POSTINSTALL` hook) keeps upgrades
working, but leaves the executable's CompanyName on the old name, since that also comes from
`bundle.publisher`.
