// Node types for `node:fs`, which `tsconfig.app.json` does not load: it lists
// `vite/client` alone. Every file here that reads one declares its own, rather
// than leaning on another test file happening to declare it first.
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DATA_FOLDER, FORMER_DATA_FOLDER, FORMER_LOCAL_FOLDER, LOCAL_FOLDER } from './paths'

/**
 * The window's filesystem grants name their folders by literal, and this holds
 * those literals to the ones the app actually uses.
 *
 * `src-tauri/capabilities/default.json` cannot import a constant: it is read by
 * the Tauri build, not by the bundler, so all fifty-odd of its paths are copies
 * of `DATA_FOLDER` and `LOCAL_FOLDER`. A copy of a constant drifts, and this
 * one drifts silently in the worst possible direction. A grant that names a
 * folder the app no longer writes to does not fail a test or a build: it fails
 * on the trainee's machine, where a refused read of `progress.json` looks
 * exactly like a corrupt install. Phase 7 lost a progress file that way.
 *
 * What this can prove is the names and the shape of the grants. What it cannot
 * prove is that Tauri honours them, which needs a packaged build and is why
 * every phase that touches this file drives one.
 *
 * Same spirit, and the same reason, as `installer-hook.test.ts`.
 */
const repo = new URL('../../', import.meta.url)

interface Scope {
  identifier: string
  allow: { path: string }[]
}

const capability = JSON.parse(
  readFileSync(new URL('src-tauri/capabilities/default.json', repo), 'utf8'),
) as { description: string; permissions: (string | Scope)[] }

const scopes = capability.permissions.filter((entry): entry is Scope => typeof entry !== 'string')

function paths(identifier: string): string[] {
  return scopes.filter((scope) => scope.identifier === identifier).flatMap((scope) => scope.allow.map((a) => a.path))
}

/** Every path in the file, whatever it grants. */
const every = scopes.flatMap((scope) => scope.allow.map((a) => a.path))

/** The folder name a path sits under, for the two roots that have one. */
function folderUnder(root: string, path: string): string | null {
  if (!path.startsWith(`${root}/`)) return null
  return path.slice(root.length + 1).split('/')[0]
}

/** The three ways the window can change a file. */
const WRITING = ['fs:allow-write-text-file', 'fs:allow-mkdir', 'fs:allow-remove']

describe('the window filesystem grants', () => {
  it('names no folder that no constant knows about', () => {
    // The drift guard. A rename that misses a path leaves a stranger here.
    const strangers = every
      .map((path) => ({ path, data: folderUnder('$DATA', path), local: folderUnder('$LOCALDATA', path) }))
      .filter(
        (entry) =>
          (entry.data !== null && entry.data !== DATA_FOLDER && entry.data !== FORMER_DATA_FOLDER) ||
          (entry.local !== null && entry.local !== LOCAL_FOLDER && entry.local !== FORMER_LOCAL_FOLDER),
      )
      .map((entry) => entry.path)

    expect(strangers).toEqual([])
  })

  it('writes only inside the folders the app owns now', () => {
    // Write access to an old folder is what turns a migration into a move.
    const wrong = WRITING.flatMap(paths).filter((path) => {
      if (path.startsWith('$HOME/')) return false
      const data = folderUnder('$DATA', path)
      const local = folderUnder('$LOCALDATA', path)
      if (data !== null) return data !== DATA_FOLDER
      if (local !== null) return local !== LOCAL_FOLDER
      // $APPDATA and $APPLOCALDATA are the identifier folders, read only.
      return true
    })

    expect(wrong).toEqual([])
  })

  it('lets the migration read the folder used between phases 15 and 47', () => {
    const old = `$DATA/${FORMER_DATA_FOLDER}`
    // Exactly what migrate.ts and pickOldRoot call on their source.
    expect(paths('fs:allow-exists')).toContain(`${old}/progress.json`)
    expect(paths('fs:allow-read-text-file')).toContain(`${old}/progress.json`)
    expect(paths('fs:allow-exists')).toContain(`${old}/courses`)
    expect(paths('fs:allow-read-dir')).toContain(`${old}/courses`)
    expect(paths('fs:allow-read-dir')).toContain(`${old}/courses/*`)
    expect(paths('fs:allow-read-text-file')).toContain(`${old}/courses/**`)
  })

  it('still lets it read the identifier folder used before phase 15', () => {
    expect(paths('fs:allow-exists')).toContain('$APPDATA/progress.json')
    expect(paths('fs:allow-read-text-file')).toContain('$APPDATA/progress.json')
    expect(paths('fs:allow-read-text-file')).toContain('$APPDATA/courses/**')
    expect(paths('fs:allow-read-dir')).toContain('$APPDATA/courses')
  })

  it('reads and writes the progress file, its marker and the second copy', () => {
    expect(paths('fs:allow-read-text-file')).toContain(`$DATA/${DATA_FOLDER}/progress.json`)
    expect(paths('fs:allow-write-text-file')).toContain(`$DATA/${DATA_FOLDER}/progress.json`)
    expect(paths('fs:allow-write-text-file')).toContain(`$DATA/${DATA_FOLDER}/progress.marker.json`)
    expect(paths('fs:allow-write-text-file')).toContain(`$LOCALDATA/${LOCAL_FOLDER}/progress.backup.json`)
    expect(paths('fs:allow-mkdir')).toContain(`$LOCALDATA/${LOCAL_FOLDER}`)
  })

  it('never grants a way to remove the second copy', () => {
    // It is written blind and read only when the main file has gone. Nothing in
    // the app deletes it, and nothing here may.
    expect(paths('fs:allow-remove').some((path) => path.startsWith('$LOCALDATA'))).toBe(false)
  })

  it('sees both profile folders the window has left behind', () => {
    // The Progress screen names them so the trainee can delete them.
    expect(paths('fs:allow-exists')).toContain(`$LOCALDATA/${LOCAL_FOLDER}/WebView2`)
    expect(paths('fs:allow-exists')).toContain(`$LOCALDATA/${FORMER_LOCAL_FOLDER}/WebView2`)
    expect(paths('fs:allow-exists')).toContain('$APPLOCALDATA')
  })

  it('has a description that names the folders it grants', () => {
    // The field is prose for a human, and prose goes stale quietly.
    expect(capability.description).toContain(`$DATA/${DATA_FOLDER}`)
    expect(capability.description).toContain(`$LOCALDATA/${LOCAL_FOLDER}`)
    expect(capability.description).toContain(`$DATA/${FORMER_DATA_FOLDER}`)
  })
})
