/**
 * The version from package.json, substituted into the bundle by Vite.
 *
 * A constant rather than a lookup: `src/version.test.ts` holds it to the same
 * number as `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`, so what
 * the app shows is what the installer wrote.
 */
declare const __APP_VERSION__: string
