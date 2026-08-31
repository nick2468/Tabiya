import { isDesktop, profilePaths } from '../storage/paths'

/**
 * What the app has to say about the folders it left behind.
 *
 * Phase 15 moved the data folder and phase 16 moved the window's browser
 * profile, and both moves followed the same rule: copy or start fresh, never
 * delete, and tell the trainee where the old one is so they can delete it
 * themselves when they are satisfied. Phase 15 said its half in the migration
 * note. This is phase 16's half, and it says nothing at all once the old folder
 * has gone.
 *
 * It also answers the question a person cannot answer from outside: whether the
 * window really is using the new profile folder. Nothing else creates that
 * folder, so its being there is the proof.
 */

export interface ProfileFolders {
  /** Where the window keeps its browser profile now. */
  now: string
  /** True when that folder is there, which is what shows the move happened. */
  moved: boolean
  /** The folder it used before phase 16, or null once the trainee has deleted it. */
  before: string | null
}

/**
 * Looks at both profile folders. Null in a browser, which has neither.
 *
 * It never throws. A folder that cannot be checked is reported as not being
 * there, because the only thing this drives is a sentence on screen and a
 * sentence is not worth breaking the Progress screen over.
 */
export async function profileFolders(): Promise<ProfileFolders | null> {
  if (!isDesktop()) return null
  const { now, before } = await profilePaths()
  const fs = await import('@tauri-apps/plugin-fs')
  const there = async (path: string) => {
    try {
      return await fs.exists(path)
    } catch {
      return false
    }
  }
  return { now, moved: await there(now), before: (await there(before)) ? before : null }
}
