; Installer hooks for Tabiya.
;
; Two hooks: one at the end of an install, which names the publisher, and one
; at the end of an uninstall, immediately after NSIS's own data-removal block.
;
; THE INSTALL HOOK (phase 53, 2026-10-28). Tauri names one registry key after
; `bundle.publisher`: HKCU\Software\<publisher>\Tabiya, whose default value is
; the install folder. An upgrade reads it to tell the OLD uninstaller where to
; run (`uninstall.exe _?=<folder>`). Phase 52 changed the publisher from "nick"
; to "Nicholas Walker", so 1.10.9 and 1.10.10 looked under a key no earlier
; install had written, passed an empty folder, and the old uninstaller failed
; with "Error launching installer" and then "Unable to uninstall!". So the
; publisher in tauri.conf.json is "nick" again and must never change: it is a
; registry key name now, not a label. What Apps and Features SHOWS is written
; here instead, after Tauri has written "nick" into it.
;
; It also removes HKCU\Software\Nicholas Walker\Tabiya, the key 1.10.9 and
; 1.10.10 wrote and nothing reads any more, and its parent if that leaves it
; empty. /ifempty means a key anything else put there survives.
;
; WHY IT EXISTS. That stock block removes $APPDATA\${BUNDLEID} and
; $LOCALAPPDATA\${BUNDLEID}, the two folders named after the bundle identifier.
; This app stopped keeping anything in either of them at phases 15 and 16: its
; data lives in $APPDATA\Tabiya, and its backup copy and browser profile in
; $LOCALAPPDATA\Tabiya Data. So the uninstaller's offer to remove application
; data was removing nothing that existed. An offer that does not do what it
; says is worse than no offer at all.
;
; THE FOLDERS WERE RENAMED AGAIN AT PHASE 47, when the app became Tabiya. This
; hook names the folders the app writes to TODAY, which means a trainee who
; upgrades keeps their old $APPDATA\Repertoire Trainer and
; $LOCALAPPDATA\Repertoire Trainer Data until they delete them, and the
; PREVIOUS product's uninstaller, still registered beside this one, names those
; old folders and can reach nothing of Tabiya's. That is the right way round:
; each uninstaller removes what its own install wrote.
;
; THE GUARD IS NOT OPTIONAL, and it is not this file's invention. It is copied
; character for character from the stock block three lines above where this
; macro is inserted, and it means the same two things there and here:
;
;   $DeleteAppDataCheckboxState = 1
;       The trainee ticked "delete application data" on the confirm page. That
;       page is the only thing that ever sets this variable, and a silent or
;       passive uninstall skips it, so the variable stays 0 and nothing is
;       removed.
;
;   $UpdateMode <> 1
;       This uninstall is not the one an UPGRADE runs on its way past. Tauri's
;       updater appends /UPDATE to the old uninstaller's command line, and the
;       old uninstaller can still show its confirm page while doing it. Without
;       this half of the guard, a routine version bump would delete the
;       trainee's progress file, its marker and its backup copy in one go.
;
; So this hook is exactly as safe as Tauri's own block, and unsafe in exactly
; the same cases, of which there are none.
;
; The folder names are literals. They match DATA_FOLDER in src/storage/paths.ts
; and LOCAL_FOLDER in src-tauri/src/lib.rs, which are what the app actually
; writes to. They are deliberately NOT ${PRODUCTNAME}: the folder name and the
; product name are the same string today by choice rather than by
; construction, and a deletion that followed a renamed product would be a
; deletion of the wrong folder.
;
; The !ifndef around each one is what lets scripts/check-uninstall-hook.mjs
; compile this same macro text against scratch folders and run all four cases
; for real. Nothing in a build defines them, so a build gets the literals.

!ifndef APP_DATA_FOLDER
  !define APP_DATA_FOLDER "$APPDATA\Tabiya"
!endif

!ifndef APP_LOCAL_FOLDER
  !define APP_LOCAL_FOLDER "$LOCALAPPDATA\Tabiya Data"
!endif

!macro NSIS_HOOK_POSTINSTALL
  WriteRegStr SHCTX "${UNINSTKEY}" "Publisher" "Nicholas Walker"
  DeleteRegKey HKCU "Software\Nicholas Walker\Tabiya"
  DeleteRegKey /ifempty HKCU "Software\Nicholas Walker"
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ${If} $DeleteAppDataCheckboxState = 1
  ${AndIf} $UpdateMode <> 1
    ; The stock block sets this inside its own guard, so it is set again here
    ; rather than inherited: these two folders belong to the current user.
    SetShellVarContext current
    RMDir /r "${APP_DATA_FOLDER}"
    RMDir /r "${APP_LOCAL_FOLDER}"
  ${EndIf}
!macroend
