import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DATA_FOLDER, LOCAL_FOLDER } from './paths'

/**
 * The uninstaller's hook names two folders, and this holds those names to the
 * ones the app actually writes to.
 *
 * `src-tauri/installer-hooks.nsh` is the only code in this app whose job is
 * deleting the trainee's data. It cannot import anything: NSIS is compiled by
 * the installer build, so the folder names in it are literals. That makes them
 * a copy, and a copy of a constant drifts. If someone renames `DATA_FOLDER`
 * here, the hook keeps deleting a folder nothing uses and the offer to remove
 * application data goes quietly back to removing nothing, which is the exact
 * fault phase 17 was written to fix.
 *
 * `scripts/check-uninstall-hook.mjs` proves the macro BEHAVES, by compiling it
 * with makensis and running all four cases. It cannot prove the names, because
 * it redirects them at scratch folders to run at all, and it needs makensis so
 * it is run by hand. This runs on every `npm test` and covers what that one
 * cannot: the names, and the presence of both halves of the guard.
 *
 * Added at review gate 17, in the same spirit as `src/version.test.ts`.
 */
const repo = new URL('../../', import.meta.url)

function read(name: string): string {
  return readFileSync(new URL(name, repo), 'utf8')
}

describe('the uninstaller hook', () => {
  const hook = read('src-tauri/installer-hooks.nsh')

  it('deletes the roaming folder the app writes its progress to', () => {
    const found = hook.match(/!define APP_DATA_FOLDER "\$APPDATA\\(.+)"/)
    expect(found?.[1]).toBe(DATA_FOLDER)
  })

  it('deletes the local folder the app keeps the second copy in', () => {
    const found = hook.match(/!define APP_LOCAL_FOLDER "\$LOCALAPPDATA\\(.+)"/)
    expect(found?.[1]).toBe(LOCAL_FOLDER)
  })

  it('is the same local folder the window builds its profile in', () => {
    // src-tauri/src/lib.rs owns the WebView2 profile and names the folder again.
    const found = read('src-tauri/src/lib.rs').match(/const LOCAL_FOLDER: &str = "(.+)"/)
    expect(found?.[1]).toBe(LOCAL_FOLDER)
  })

  it('only fires when the trainee ticked the box', () => {
    expect(hook).toContain('${If} $DeleteAppDataCheckboxState = 1')
  })

  /**
   * The half that matters most. Tauri's updater runs the OLD uninstaller on its
   * way past with /UPDATE on the command line, and that uninstaller can still
   * show its confirm page. Without this line a routine version bump deletes the
   * progress file, its marker and its backup copy at once.
   */
  it('never fires on the uninstall an upgrade runs', () => {
    expect(hook).toContain('${AndIf} $UpdateMode <> 1')
  })
})
