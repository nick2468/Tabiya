// Run the uninstaller's data-removal hook four ways, against scratch folders.
//
// `src-tauri/installer-hooks.nsh` is the one piece of this app that exists to
// delete the trainee's data. It is guarded so that it only ever fires when the
// trainee ticked the box AND this is not the uninstall an upgrade runs on its
// way past. That guard cannot be checked by reading it, and it cannot be
// checked by running the real uninstaller either: the only folders the real
// hook can name are the live ones.
//
// So this script compiles the SAME macro text with the two folder names
// pointed at scratch folders, and runs the resulting program once for each of
// the four combinations of the two variables. The program reports what it can
// see itself, with the same NSIS file test, rather than being asked from
// outside.
//
// Run it with: node scripts/check-uninstall-hook.mjs
// It needs makensis, which Tauri downloads to %LOCALAPPDATA%\tauri\NSIS.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)))
const hook = join(repo, 'src-tauri', 'installer-hooks.nsh')

const makensis = [
  join(process.env.LOCALAPPDATA ?? '', 'tauri', 'NSIS', 'makensis.exe'),
  join(process.env.LOCALAPPDATA ?? '', 'tauri', 'NSIS', 'Bin', 'makensis.exe'),
].find((path) => existsSync(path))

if (!makensis) {
  console.error('makensis not found. Build once with `npm run tauri build` to fetch it.')
  process.exit(2)
}

const work = mkdtempSync(join(tmpdir(), 'hook-check-'))
const data = join(work, 'Scratch Trainer')
const local = join(work, 'Scratch Trainer Data')
const report = join(work, 'report.txt')

// The harness: the real hook file, with the two folder names redirected, and a
// section that sets the two variables from the command line and inserts the
// macro. Everything outside the !insertmacro is scaffolding; the macro itself
// is the shipped one, read from disk.
const harness = `
Name "uninstall hook check"
OutFile "${join(work, 'hook-check.exe')}"
RequestExecutionLevel user
SilentInstall silent

!include LogicLib.nsh
!include FileFunc.nsh

Var UpdateMode
Var DeleteAppDataCheckboxState

!define APP_DATA_FOLDER "${data}"
!define APP_LOCAL_FOLDER "${local}"
!include "${hook}"

Section
  \${GetParameters} $R0
  \${GetOptions} $R0 "/TICKED=" $DeleteAppDataCheckboxState
  \${GetOptions} $R0 "/UPDATE=" $UpdateMode
  \${GetOptions} $R0 "/REPORT=" $R1

  !insertmacro NSIS_HOOK_POSTUNINSTALL

  FileOpen $R2 $R1 w
  FileWrite $R2 "ticked=$DeleteAppDataCheckboxState$\\r$\\n"
  FileWrite $R2 "update=$UpdateMode$\\r$\\n"
  \${If} \${FileExists} "\${APP_DATA_FOLDER}\\*.*"
    FileWrite $R2 "data=present$\\r$\\n"
  \${Else}
    FileWrite $R2 "data=gone$\\r$\\n"
  \${EndIf}
  \${If} \${FileExists} "\${APP_LOCAL_FOLDER}\\*.*"
    FileWrite $R2 "local=present$\\r$\\n"
  \${Else}
    FileWrite $R2 "local=gone$\\r$\\n"
  \${EndIf}
  FileClose $R2
SectionEnd
`

const script = join(work, 'hook-check.nsi')
writeFileSync(script, harness, 'utf8')
execFileSync(makensis, ['/V2', script], { stdio: 'inherit' })

/** Fresh fixtures, each with a file in it, so an empty folder cannot pass. */
function makeFixtures() {
  for (const folder of [data, local]) {
    rmSync(folder, { recursive: true, force: true })
    mkdirSync(folder, { recursive: true })
    writeFileSync(join(folder, 'progress.json'), '{"version":4}', 'utf8')
  }
}

const cases = [
  { name: 'ticked, ordinary uninstall', ticked: 1, update: 0, want: 'gone' },
  { name: 'ticked, but an upgrade', ticked: 1, update: 1, want: 'present' },
  { name: 'not ticked, ordinary uninstall', ticked: 0, update: 0, want: 'present' },
  { name: 'not ticked, and an upgrade', ticked: 0, update: 1, want: 'present' },
]

let failed = 0
for (const each of cases) {
  makeFixtures()
  rmSync(report, { force: true })
  execFileSync(join(work, 'hook-check.exe'), [
    `/TICKED=${each.ticked}`,
    `/UPDATE=${each.update}`,
    `/REPORT=${report}`,
  ])
  const said = readFileSync(report, 'utf8')
  const seen = Object.fromEntries(
    said
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.split('=')),
  )
  const ok = seen.data === each.want && seen.local === each.want
  if (!ok) failed += 1
  console.log(`      the program saw ticked=${seen.ticked} update=${seen.update}`)
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${each.name}: wanted both ${each.want}, ` +
      `got data=${seen.data} local=${seen.local}`,
  )
}

rmSync(work, { recursive: true, force: true })
console.log(failed === 0 ? 'All four cases behaved.' : `${failed} of 4 cases were wrong.`)
process.exit(failed === 0 ? 0 : 1)
