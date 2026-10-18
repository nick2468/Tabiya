import { isDesktop, profilePaths } from '../storage/paths'

/**
 * What the app has to say about the folders it left behind.
 *
 * Phase 15 moved the data folder, phase 16 moved the window's browser profile,
 * and phase 47 moved both again with the app's new name. Every one of those
 * moves followed the same rule: copy or start fresh, never delete, and tell the
 * trainee where the old one is so they can delete it themselves when they are
 * satisfied. The data folder says its half in the migration note. This is the
 * profile's half, and it says nothing at all once the old folders have gone.
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
  /**
   * The folders it used before, newest first, and only the ones still there.
   * There are two since phase 47, and an empty list once both have gone.
   */
  before: string[]
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
  const left: string[] = []
  for (const path of before) {
    if (await there(path)) left.push(path)
  }
  return { now, moved: await there(now), before: left }
}
