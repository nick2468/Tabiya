/**
 * The version from package.json, substituted into the bundle by Vite.
 *
 * A constant rather than a lookup: `src/version.test.ts` holds it to the same
 * number as `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`, so what
 * the app shows is what the installer wrote.
 */
declare const __APP_VERSION__: string

/**
 * Every library in package.json's `dependencies`, with the version and the
 * licence its own package.json declares, read by Vite at build time.
 *
 * The About screen lists them. Generated rather than written out because it is
 * a licence notice, and a hand-written one is wrong the day a dependency is
 * added. `src/ui/licences.test.ts` holds it to package.json.
 */
declare const __DEPENDENCY_LICENCES__: { name: string; version: string; licence: string }[]
