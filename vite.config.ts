import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Honour PORT so a launcher can place the dev server; default to Vite's own.
  server: { port: process.env.PORT ? Number(process.env.PORT) : 5173 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
