// Node types for `node:fs`, which `tsconfig.app.json` does not load: it lists
// `vite/client` alone. Every file here that reads one declares its own, rather
// than leaning on another test file happening to declare it first.
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * One version number, in four places.
 *
 * `package.json` is the source: Vite reads it at build time and substitutes it
 * as `__APP_VERSION__`, which is what the header shows. `tauri.conf.json` is
 * what the installer writes into Apps and Features, and `Cargo.toml` is what
 * the executable carries. Phase 17 made the number visible, and a number the
 * app shows that disagrees with the one the installer wrote is worse than a
 * number nobody can see, so these tests hold the four together.
 *
 * They were needed: before phase 17 the three files said 0.0.0, 1.1.0 and
 * 1.1.0.
 */
const repo = new URL('../', import.meta.url)

function read(name: string): string {
  return readFileSync(new URL(name, repo), 'utf8')
}

describe('the version', () => {
  const declared = (JSON.parse(read('package.json')) as { version: string }).version

  it('is three numbers, so a bump can be read', () => {
    expect(declared).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('is the same in tauri.conf.json, which the installer reads', () => {
    const config = JSON.parse(read('src-tauri/tauri.conf.json')) as { version: string }
    expect(config.version).toBe(declared)
  })

  it('is the same in Cargo.toml, which the executable carries', () => {
    // The first version line in the file is the package's own.
    const found = read('src-tauri/Cargo.toml').match(/^version = "(.+)"$/m)
    expect(found?.[1]).toBe(declared)
  })

  it('is what the app shows', () => {
    expect(__APP_VERSION__).toBe(declared)
  })
})
