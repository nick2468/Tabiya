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
  // Honour PORT so a launcher can place the dev server; default to Vite's own.
  server: { port: process.env.PORT ? Number(process.env.PORT) : 5173 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
