// Writes every bundled course out as a PGN under docs/bundles/, which is the
// same text the Catalog's export button produces.
//
// The writer lives in TypeScript and this repo has no TypeScript runner, so
// the script borrows Vite's: a dev server in middleware mode loads the module
// exactly as the app does, which also gives it import.meta.glob and therefore
// the bundled content index for free.
import { mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, logLevel: 'error' })
try {
  const { bundledCourses, contentErrors } = await server.ssrLoadModule('/src/content/index.ts')
  const { courseToPgn } = await server.ssrLoadModule('/src/model/bundle.ts')
  if (contentErrors.length) {
    console.error('content does not load cleanly, refusing to export:')
    for (const error of contentErrors) console.error(' ', error.chapter, error.message)
    process.exitCode = 1
  } else {
    mkdirSync('docs/bundles', { recursive: true })
    for (const course of bundledCourses) {
      const written = courseToPgn(course)
      writeFileSync(`docs/bundles/${course.id}.pgn`, written.text, 'utf8')
      console.log(`docs/bundles/${course.id}.pgn  ${written.text.length} bytes`)
    }
  }
} finally {
  await server.close()
}
