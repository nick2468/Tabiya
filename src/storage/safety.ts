import { parseProgressJson, type ProgressState } from './progress'
import type { BackupRoots, DataRoots } from './paths'

/**
 * Refusing to start blank, and the second copy that makes it possible.
 *
 * On 2026-08-31 Nick deleted the app's data folder and opened the app. A
 * missing progress file is indistinguishable from a new trainee, so the app
 * started blank and saved a blank file. Two learnt lines went with it.
 *
 * Blank is a claim, not a default. This module is the evidence the claim is
 * checked against, and it comes from two places on purpose:
 *
 * - **The marker**, written beside the progress file after every save. It
 *   answers "the folder is here and the progress file is not", which is a
 *   deleted or moved file rather than a new trainee.
 * - **The backup copy**, in a different folder entirely. A marker inside the
 *   data folder dies with the folder, which is exactly what happened, so the
 *   app also keeps the whole progress file under the user's LOCAL data folder.
 *   Two folders now have to be destroyed to lose anything.
 *
 * The backup is written blind and never read, except in the one case it exists
 * for: the app is about to start blank and the backup holds something. Then it
 * is offered, with what it holds and when it was written, and the trainee
 * chooses. The app never puts it back on its own.
 *
 * Every failure here ends the same way, which is the rule the whole module is
 * built on: when in doubt, block and say why rather than writing anything. A
 * blocked start is recoverable from the Progress screen. A blank start that
 * saves itself is not.
 *
 * The filesystem comes in through an interface so all of it can be tested
 * without Tauri, the way the folder migration next door is.
 */

/** Where this module gets its files. One implementation is Tauri, one a fake. */
export interface SafetyFiles {
  exists(path: string): Promise<boolean>
  readTextFile(path: string): Promise<string>
  writeTextFile(path: string, text: string): Promise<void>
  mkdir(path: string): Promise<void>
  /** When a file was last written, or null when that cannot be told. */
  modified(path: string): Promise<Date | null>
}

/** What the marker says, once it has been read. */
export interface Marker {
  /** When the app last saved, as an ISO timestamp. */
  wrote: string
  /** How many learnt lines that save held. */
  learntLines: number
}

/**
 * The marker's text.
 *
 * It explains itself, because a person who opens the data folder and finds it
 * deserves to know what it is for and that deleting it weakens the app's only
 * defence against starting blank.
 */
export function markerText(state: ProgressState, backup: string, now: Date): string {
  return `${JSON.stringify(
    {
      wrote: now.toISOString(),
      learntLines: state.learntLines.length,
      whatThisIs:
        'The app wrote progress.json in this folder. If progress.json is missing and this ' +
        'file is here, the app refuses to start blank and will not write over the gap. ' +
        `A second copy of your progress is kept at ${backup}.`,
    },
    null,
    2,
  )}\n`
}

/** Reads the marker. Null when the text is not a marker this build understands. */
export function readMarker(text: string): Marker | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
  const record = parsed as Record<string, unknown>
  if (typeof record.wrote !== 'string') return null
  const learntLines = typeof record.learntLines === 'number' ? record.learntLines : 0
  return { wrote: record.wrote, learntLines }
}

/** The second copy, when there is one worth putting back. */
export interface BackupOffer {
  /** Where it is, for saying so on screen. */
  path: string
  /** When it was written, or null when the filesystem would not say. */
  wrote: Date | null
  /** How many learnt lines it holds. */
  learntLines: number
  /** The state itself, parsed and ready. Nothing is written until asked. */
  state: ProgressState
}

/**
 * What a start with no progress file should do.
 *
 * `fresh` means nothing anywhere says this app has saved before, so a blank
 * start loses nothing. Anything else is `blocked`: the app opens on a blank
 * state, saves nothing at all, and says why.
 */
export type BlankStart =
  | { kind: 'fresh' }
  | { kind: 'blocked'; reason: string; offer?: BackupOffer }

/**
 * Decides whether the app may start blank.
 *
 * Called only when the progress file is not there. A progress file that exists
 * and will not read is already a failure by the older rule in `tauri-store.ts`.
 */
export async function checkBlankStart(
  files: SafetyFiles,
  roots: DataRoots,
  backup: BackupRoots,
): Promise<BlankStart> {
  const [marker, copy] = await Promise.all([
    lookForMarker(files, roots.marker),
    lookForBackup(files, backup.backup),
  ])

  // Nothing anywhere has ever been written. A new trainee, which is the only
  // case where starting blank is the truth.
  if (marker.kind === 'none' && copy.kind === 'none') return { kind: 'fresh' }

  // A copy holding no learnt lines is not worth blocking a start over. There
  // is nothing in it to lose and nothing to put back, and blocking here would
  // trap a trainee who opened the app once, changed nothing, and tidied up.
  if (marker.kind === 'none' && copy.kind === 'empty') return { kind: 'fresh' }

  const reason = whyBlocked(marker, copy, roots, backup)
  return copy.kind === 'offer' ? { kind: 'blocked', reason, offer: copy.offer } : { kind: 'blocked', reason }
}

/** What the app leaves beside the progress file, and where the copy goes. */
export async function writeMarkerAndBackup(
  files: SafetyFiles,
  roots: DataRoots,
  backup: BackupRoots,
  state: ProgressState,
  text: string,
  now: Date = new Date(),
): Promise<void> {
  await files.writeTextFile(roots.marker, markerText(state, backup.backup, now))
  if (!(await files.exists(backup.root))) await files.mkdir(backup.root)
  await files.writeTextFile(backup.backup, text)
}

/* --------------------------------------------------------------- looking */

type MarkerLook =
  | { kind: 'none' }
  | { kind: 'saved'; marker: Marker }
  /** It is there, or might be, and could not be read. In doubt is a block. */
  | { kind: 'unreadable'; why: string }

async function lookForMarker(files: SafetyFiles, path: string): Promise<MarkerLook> {
  let there: boolean
  try {
    there = await files.exists(path)
  } catch (error) {
    return { kind: 'unreadable', why: message(error) }
  }
  if (!there) return { kind: 'none' }
  let marker: Marker | null
  try {
    marker = readMarker(await files.readTextFile(path))
  } catch (error) {
    return { kind: 'unreadable', why: message(error) }
  }
  return marker ? { kind: 'saved', marker } : { kind: 'unreadable', why: 'it is not a marker this app wrote' }
}

type BackupLook =
  | { kind: 'none' }
  /** It parses and holds no learnt lines, so it is not worth offering. */
  | { kind: 'empty' }
  | { kind: 'offer'; offer: BackupOffer }
  | { kind: 'unreadable'; why: string }

async function lookForBackup(files: SafetyFiles, path: string): Promise<BackupLook> {
  let there: boolean
  try {
    there = await files.exists(path)
  } catch (error) {
    return { kind: 'unreadable', why: message(error) }
  }
  if (!there) return { kind: 'none' }

  let state: ProgressState
  try {
    state = parseProgressJson(await files.readTextFile(path))
  } catch (error) {
    return { kind: 'unreadable', why: message(error) }
  }
  if (state.learntLines.length === 0) return { kind: 'empty' }

  // When it was written is worth saying and never worth failing over.
  let wrote: Date | null = null
  try {
    wrote = await files.modified(path)
  } catch {
    wrote = null
  }
  return {
    kind: 'offer',
    offer: { path, wrote, learntLines: state.learntLines.length, state },
  }
}

/* ---------------------------------------------------------------- saying */

/** The sentence the banner shows. It has to say what happened and what is safe. */
function whyBlocked(
  marker: MarkerLook,
  copy: BackupLook,
  roots: DataRoots,
  backup: BackupRoots,
): string {
  const head = openingLine(marker, roots)
  if (copy.kind === 'offer') {
    const when = copy.offer.wrote ? `, last written ${plainDate(copy.offer.wrote)}` : ''
    const lines = copy.offer.learntLines
    return (
      `${head} The app keeps a second copy at ${backup.backup}${when}, and that copy ` +
      `holds ${lines} learnt ${lines === 1 ? 'line' : 'lines'}. Nothing has been written ` +
      'and nothing will be while this is showing. Put the copy back below, or import a ' +
      'backup of your own from the Progress screen.'
    )
  }
  if (copy.kind === 'unreadable') {
    return (
      `${head} The second copy at ${backup.backup} could not be read either (${copy.why}). ` +
      'Nothing has been written and nothing will be while this is showing. Import a ' +
      'backup from the Progress screen to carry on.'
    )
  }
  return (
    `${head} There is no second copy at ${backup.backup} to put back. Nothing has been ` +
    'written and nothing will be while this is showing. Import a backup from the ' +
    'Progress screen to carry on.'
  )
}

function openingLine(marker: MarkerLook, roots: DataRoots): string {
  if (marker.kind === 'saved') {
    const lines = marker.marker.learntLines
    return (
      `Your progress file ${roots.progress} is not there. The app saved it on ` +
      `${plainDate(new Date(marker.marker.wrote))} with ${lines} learnt ` +
      `${lines === 1 ? 'line' : 'lines'} in it, so it has been deleted or moved since.`
    )
  }
  if (marker.kind === 'unreadable') {
    return (
      `Your progress file ${roots.progress} is not there, and the app could not tell ` +
      `whether it once was (${marker.why}), so it is treating that as a file that has gone.`
    )
  }
  return (
    `Your progress file ${roots.progress} is not there, and neither is the record the ` +
    'app leaves beside it, which is what a deleted data folder looks like.'
  )
}

/** A date a person can read, without depending on the machine's locale. */
function plainDate(date: Date): string {
  if (Number.isNaN(date.getTime())) return 'at an unknown time'
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} at ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/* ------------------------------------------------------------------ Tauri */

interface FsApi {
  exists: (path: string) => Promise<boolean>
  readTextFile: (path: string) => Promise<string>
  writeTextFile: (path: string, contents: string) => Promise<void>
  mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>
  stat: (path: string) => Promise<{ mtime: Date | null }>
}

/** The real filesystem, through Tauri. */
export function tauriSafetyFiles(): SafetyFiles {
  const fs = () => import('@tauri-apps/plugin-fs') as unknown as Promise<FsApi>
  return {
    async exists(path) {
      return (await fs()).exists(path)
    },
    async readTextFile(path) {
      return (await fs()).readTextFile(path)
    },
    async writeTextFile(path, text) {
      return (await fs()).writeTextFile(path, text)
    },
    async mkdir(path) {
      return (await fs()).mkdir(path, { recursive: true })
    },
    async modified(path) {
      return (await (await fs()).stat(path)).mtime ?? null
    },
  }
}
