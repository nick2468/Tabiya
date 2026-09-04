import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The version the app shows comes from package.json, read here at BUILD time
// and substituted into the bundle. Not from a Tauri call: the browser build has
// no Tauri, and a number the app has to ask for at runtime is a number that can
// be missing on the one screen that shows it.
const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  // Honour PORT so a launcher can place the dev server. The default is 5175,
  // not Vite's own 5173: Nick holds 5173 and 5174 for other projects, and the
  // `dev` script and `devUrl` in tauri.conf.json both name 5175. A config that
  // still said 5173 was one bare `npx vite` away from serving this app where
  // another project answers, which is how a window titled Repertoire Trainer
  // once showed someone else's site.
  server: { port: process.env.PORT ? Number(process.env.PORT) : 5175 },
  test: {
    /**
     * Two kinds of test, and they want different rooms.
     *
     * The `.test.ts` files render React to a STRING and assert on the markup.
     * They need no DOM, they run in milliseconds, and they are the bar that
     * runs on every change. Nothing about them is migrating.
     *
     * The `.dom.test.tsx` files mount the app in jsdom and drive it the way a
     * person does, because three identity bugs in `play-context.tsx` passed
     * every string test and were found only by playing in the browser. They
     * cost seconds rather than milliseconds, which is why they are a separate
     * kind rather than the default.
     *
     * `projects` rather than `environmentMatchGlobs`: the glob form is
     * deprecated, and two projects also keep the node tests from paying for
     * jsdom's globals. `npx vitest run` still runs both, which is the point.
     */
    projects: [
      {
        extends: true,
        test: {
          name: 'string',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.dom.test.tsx'],
          setupFiles: ['src/test/dom-setup.ts'],
        },
      },
    ],
  },
})
