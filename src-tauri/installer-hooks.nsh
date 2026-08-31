; Installer hooks for Repertoire Trainer.
;
; One hook only: the one NSIS runs at the end of an uninstall, immediately
; after its own data-removal block.
;
; WHY IT EXISTS. That stock block removes $APPDATA\${BUNDLEID} and
; $LOCALAPPDATA\${BUNDLEID}, the two folders named after the bundle identifier.
; This app stopped keeping anything in either of them at phases 15 and 16: its
; data lives in $APPDATA\Repertoire Trainer, and its backup copy and browser
; profile in $LOCALAPPDATA\Repertoire Trainer Data. So the uninstaller's offer
; to remove application data was removing nothing that existed. An offer that
; does not do what it says is worse than no offer at all.
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
  !define APP_DATA_FOLDER "$APPDATA\Repertoire Trainer"
!endif

!ifndef APP_LOCAL_FOLDER
  !define APP_LOCAL_FOLDER "$LOCALAPPDATA\Repertoire Trainer Data"
!endif

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
