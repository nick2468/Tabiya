/**
 * The one web address this app opens, and the one way it opens it.
 *
 * Nothing else in the app can open a link, on purpose. `Prose.tsx` renders
 * every markdown link as plain text, because a course note that opens an
 * address out of a shared file is a phishing vector with a chess board on it.
 * The About screen's link to the source is the single exception, and it is
 * its own element rather than a change to how prose renders.
 *
 * On the desktop the link goes through Tauri's opener plugin, and the window
 * is granted `opener:allow-open-url` for EXACTLY this address in
 * `src-tauri/capabilities/default.json`. Not paths under it: the plugin
 * matches the raw string against a glob, so `.../Tabiya/*` would also admit
 * `.../Tabiya/../../anything`, which a browser resolves to any page on
 * github.com. `capabilities.test.ts` holds the grant to this constant.
 *
 * The plugin is registered with its link-click interceptor OFF (`lib.rs`), so
 * this function is the only call that opens anything. With it on, every
 * `target="_blank"` anchor anywhere in the window would be sent to the opener.
 */
export const REPOSITORY_URL = 'https://github.com/nick2468/Tabiya'

/** The address as a person reads it, without the scheme. */
export const REPOSITORY_SHOWN = 'github.com/nick2468/Tabiya'

interface OpenerApi {
  openUrl: (url: string) => Promise<void>
}

/** Opens the repository in the system browser. Desktop only. */
export async function openRepository(): Promise<void> {
  const { openUrl } = (await import('@tauri-apps/plugin-opener')) as unknown as OpenerApi
  await openUrl(REPOSITORY_URL)
}
