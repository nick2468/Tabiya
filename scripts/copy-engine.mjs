/**
 * Copies the Stockfish build the app uses into public/engine/.
 *
 * Two files, about 7 MB together, so they are fetched from node_modules at
 * build time rather than committed. public/engine is gitignored.
 *
 * The single-threaded lite build is the one to use. The threaded builds need
 * SharedArrayBuffer, which needs cross-origin isolation headers, which is a
 * whole problem to solve for no gain: this app asks the engine for one move at
 * a time against a club player. The full builds carry a 113 MB network, which
 * is not something to ship in a desktop app either.
 *
 * Stockfish is GPL-3. Bundling it puts that licence on anything distributed.
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const from = join(root, 'node_modules', 'stockfish', 'bin')
const to = join(root, 'public', 'engine')

const FILES = ['stockfish-18-lite-single.js', 'stockfish-18-lite-single.wasm']

await mkdir(to, { recursive: true })
for (const file of FILES) {
  await copyFile(join(from, file), join(to, file))
}
console.log(`Copied ${FILES.length} engine files into public/engine`)
