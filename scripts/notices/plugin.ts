/// <reference types="node" />
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import type { Plugin } from 'vite'
import {
  isLicenceFileName,
  NoticeError,
  renderNotices,
  resolvePackage,
  type PackageFile,
  type PackageInput,
  type Resolved,
} from './core.ts'

/**
 * The Vite plugin that writes `third-party-notices.txt` into every production
 * build, and the reading it needs: the bundle, the Rust crates and the files.
 *
 * The rules are in `core.ts`, which is pure and tested. This half only gathers
 * what those rules are applied to, and it gathers from what SHIPS rather than
 * from what is declared: the JavaScript list is read from the bundle itself in
 * `generateBundle`, where every module of every chunk is visible with the
 * length of the code it contributed, and the Rust list from `cargo metadata`
 * for the Windows target, normal dependencies only.
 *
 * It runs only in `vite build`, which every packaged build runs first, because
 * `tauri.conf.json`'s `beforeBuildCommand` is `npm run build`. In dev there is
 * no bundle, and the About screen says the notices come with a release build.
 */

export const NOTICES_FILE = 'third-party-notices.txt'

/**
 * Packages the app ships without importing their code into the bundle.
 *
 * `scripts/copy-engine.mjs` copies Stockfish's build out of node_modules into
 * `public/engine/`, so it is in every build while never being a module of it.
 * `src/build/notices.test.ts` holds this list to that script.
 */
export const COPIED_INTO_THE_APP = ['stockfish']

/** The Windows target the desktop program is built for. */
const TARGET = 'x86_64-pc-windows-msvc'

const slashes = (path: string) => path.split('\\').join('/')

/* ------------------------------------------------------------------ cargo */

/**
 * Where cargo is: on PATH, or where rustup puts it. Not every shell on this
 * machine has the second on PATH, the orchestrator's among them.
 */
export function findCargo(): string {
  const candidates = ['cargo']
  const home = process.env.USERPROFILE ?? process.env.HOME
  if (home) {
    candidates.push(join(home, '.cargo', 'bin', 'cargo.exe'), join(home, '.cargo', 'bin', 'cargo'))
  }
  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore' })
      return candidate
    } catch {
      // Not this one.
    }
  }
  throw new NoticeError(
    'cargo was not found, on PATH or in ~/.cargo/bin. The third-party notices list every Rust ' +
      'crate in tabiya.exe, so a production build needs it. Install Rust from https://rustup.rs.',
  )
}

interface CargoTarget {
  kind: string[]
}

interface CargoPackage {
  id: string
  name: string
  version: string
  license: string | null
  license_file: string | null
  authors: string[]
  repository: string | null
  manifest_path: string
  targets: CargoTarget[]
}

interface CargoMetadata {
  packages: CargoPackage[]
  resolve: {
    root: string
    nodes: { id: string; deps: { pkg: string; dep_kinds: { kind: string | null }[] }[] }[]
  }
}

/** Every licence-like file in a package's folder, plus the one it names. */
function licenceFiles(dir: string, named: string | null = null): PackageFile[] {
  const names = readdirSync(dir).filter((name) => isLicenceFileName(name) && statSync(join(dir, name)).isFile())
  if (named && !names.includes(named) && existsSync(join(dir, named))) names.push(named)
  return names.sort().map((name) => ({ name, text: readFileSync(join(dir, name), 'utf8') }))
}

/**
 * The crates compiled into tabiya.exe, and the proc-macro crates left out.
 *
 * NORMAL dependencies only, walked from the root: build dependencies run while
 * compiling and so do dev ones. A procedural macro is walked TO but not
 * THROUGH, because it is a compiler plugin: its code runs during the build and
 * is not linked in, and nor is anything only it depends on.
 */
export function rustCrates(srcTauri: string): {
  crates: PackageInput[]
  macros: { name: string; version: string }[]
  compileOnly: number
} {
  const cargo = findCargo()
  // NOT --locked. A version bump changes Cargo.toml and so Cargo.lock's own
  // entry, and a packaged build runs this Vite build BEFORE cargo, so --locked
  // refused every release build after a bump. The phase 50 build found it.
  // `cargo build` updates that line a moment later anyway; this does the same.
  const raw = execFileSync(
    cargo,
    ['metadata', '--format-version', '1', '--filter-platform', TARGET],
    { cwd: srcTauri, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  )
  const meta = JSON.parse(raw) as CargoMetadata
  const packages = new Map(meta.packages.map((p) => [p.id, p]))
  const nodes = new Map(meta.resolve.nodes.map((n) => [n.id, n]))
  const isMacro = (p: CargoPackage) => p.targets.every((t) => t.kind.includes('proc-macro'))

  const walk = (throughMacros: boolean) => {
    const reached = new Set<string>()
    const stack = [meta.resolve.root]
    while (stack.length > 0) {
      const id = stack.pop()!
      if (reached.has(id)) continue
      reached.add(id)
      if (!throughMacros && id !== meta.resolve.root && isMacro(packages.get(id)!)) continue
      for (const dep of nodes.get(id)?.deps ?? []) {
        if (dep.dep_kinds.some((kind) => kind.kind === null)) stack.push(dep.pkg)
      }
    }
    reached.delete(meta.resolve.root)
    return reached
  }
  const reached = walk(false)
  // Walked again, through the macros this time, only to count what that adds.
  const compileOnly = walk(true).size - reached.size

  const crates: PackageInput[] = []
  const macros: { name: string; version: string }[] = []
  for (const id of reached) {
    const p = packages.get(id)!
    if (isMacro(p)) {
      macros.push({ name: p.name, version: p.version })
      continue
    }
    crates.push({
      name: p.name,
      version: p.version,
      licence: p.license,
      authors: p.authors,
      repository: p.repository ? p.repository.replace(/\.git$/, '') : null,
      sourceUrl: `https://crates.io/crates/${p.name}/${p.version}`,
      files: licenceFiles(dirname(p.manifest_path), p.license_file),
    })
  }
  macros.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version))
  return { crates, macros, compileOnly }
}

/* ------------------------------------------------------------- javascript */

interface PackageJson {
  name: string
  version: string
  license?: string | { type: string }
  licenses?: { type: string }[]
  author?: string | { name?: string; email?: string }
  repository?: string | { url?: string }
}

function declaredLicence(json: PackageJson): string | null {
  if (typeof json.license === 'string') return json.license
  if (json.license && typeof json.license === 'object') return json.license.type
  if (Array.isArray(json.licenses) && json.licenses.length > 0) {
    return json.licenses.map((l) => l.type).join(' OR ')
  }
  return null
}

function authorOf(json: PackageJson): string[] {
  if (typeof json.author === 'string') return [json.author]
  if (json.author?.name) return [json.author.email ? `${json.author.name} <${json.author.email}>` : json.author.name]
  return []
}

function repositoryOf(json: PackageJson): string | null {
  const url = typeof json.repository === 'string' ? json.repository : json.repository?.url
  return url ? url.replace(/^git\+/, '').replace(/\.git$/, '') : null
}

/** The folder of the package a module belongs to, from its id. */
export function packageDirOf(moduleId: string): string | null {
  const path = slashes(moduleId).replace(/[?#].*$/, '')
  const at = path.lastIndexOf('/node_modules/')
  if (at === -1) return null
  const rest = path.slice(at + '/node_modules/'.length).split('/')
  const depth = rest[0]?.startsWith('@') ? 2 : 1
  if (rest.length <= depth) return null
  return `${path.slice(0, at)}/node_modules/${rest.slice(0, depth).join('/')}`
}

/**
 * Code a package carries inside itself from another project, such as the tslib
 * in `@tauri-apps/api/external/tslib`. Its notice is a comment at the top of
 * its own file, which the bundler strips, so it is carried as a notice of the
 * package that ships it.
 */
function vendoredNotices(dir: string, moduleIds: string[]): PackageFile[] {
  const found = new Map<string, PackageFile>()
  for (const id of moduleIds) {
    const path = slashes(id).replace(/[?#].*$/, '')
    const inside = path.slice(dir.length + 1)
    const lib = inside.match(/^(?:.*\/)?(?:external|vendor)\/([^/]+)\//)?.[1]
    if (!lib || found.has(lib) || !existsSync(path)) continue
    const header = readFileSync(path, 'utf8').match(/^\s*\/\*([\s\S]*?)\*\//)?.[1]
    if (!header || !/copyright/i.test(header)) continue
    const text = header
      .split('\n')
      .map((line) => line.replace(/^\s*\*+\s?/, '').replace(/\*+\s*$/, ''))
      .join('\n')
      .trim()
    found.set(lib, { name: `NOTICE for ${lib}, vendored at ${inside}`, text })
  }
  return [...found.values()]
}

/** A JavaScript package, read from its folder. */
function javascriptPackage(dir: string, moduleIds: string[]): PackageInput {
  const json = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as PackageJson
  return {
    name: json.name,
    version: json.version,
    licence: declaredLicence(json),
    authors: authorOf(json),
    repository: repositoryOf(json),
    sourceUrl: `https://www.npmjs.com/package/${json.name}/v/${json.version}`,
    files: [...licenceFiles(dir), ...vendoredNotices(dir, moduleIds)],
  }
}

/* ----------------------------------------------------------------- plugin */

/** The canonical texts a package with no licence file falls back to. */
function canonicalTexts(folder: string): Record<string, string> {
  const texts: Record<string, string> = {}
  for (const name of readdirSync(folder)) {
    if (name.endsWith('.txt')) texts[name.slice(0, -'.txt'.length)] = readFileSync(join(folder, name), 'utf8')
  }
  return texts
}

/** Resolves them all, and fails once, listing every package that would not resolve. */
function resolveAll(packages: PackageInput[], canonical: Record<string, string>, failures: string[]): Resolved[] {
  const resolved: Resolved[] = []
  for (const pkg of packages) {
    try {
      resolved.push(resolvePackage(pkg, canonical))
    } catch (error) {
      if (error instanceof NoticeError) failures.push(error.message)
      else throw error
    }
  }
  return resolved
}

export function thirdPartyNotices(options: { root: string; version: string }): Plugin {
  const { root, version } = options
  return {
    name: 'tabiya-third-party-notices',
    apply: 'build',
    generateBundle(_output, bundle) {
      // Every module with code in a chunk, by the package it came from. A
      // module tree-shaken to nothing contributed nothing and is not counted.
      const byPackage = new Map<string, string[]>()
      const note = (id: string) => {
        const dir = packageDirOf(id)
        if (dir) byPackage.set(dir, [...(byPackage.get(dir) ?? []), id])
      }
      for (const item of Object.values(bundle)) {
        if (item.type !== 'chunk') continue
        for (const [id, module] of Object.entries(item.modules)) {
          if (module.renderedLength > 0) note(id)
        }
      }
      // Stylesheets are emitted as assets, not chunks, so they are found in the
      // module graph instead: chessground's board and piece CSS among them.
      for (const id of this.getModuleIds()) {
        if (/\.css($|[?#])/.test(id)) note(id)
      }
      for (const name of COPIED_INTO_THE_APP) {
        const dir = slashes(join(root, 'node_modules', name))
        if (!byPackage.has(dir)) byPackage.set(dir, [])
      }

      const failures: string[] = []
      const canonical = canonicalTexts(join(root, 'scripts', 'licence-texts'))
      const javascript = resolveAll(
        [...byPackage.entries()].map(([dir, ids]) => javascriptPackage(dir, ids)),
        canonical,
        failures,
      )

      let rust: Resolved[] = []
      let macros: { name: string; version: string }[] = []
      let compileOnly = 0
      try {
        const found = rustCrates(join(root, 'src-tauri'))
        macros = found.macros
        compileOnly = found.compileOnly
        rust = resolveAll(found.crates, canonical, failures)
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error))
      }

      if (failures.length > 0) {
        this.error(
          `The third-party notices could not be written, so the build stops rather than ship without them:\n- ${failures.join('\n- ')}`,
        )
      }

      this.emitFile({
        type: 'asset',
        fileName: NOTICES_FILE,
        source: renderNotices({ version, javascript, rust, macros, compileOnly }),
      })
      this.info(
        `${NOTICES_FILE}: ${javascript.length} JavaScript packages, ${rust.length} Rust crates, ` +
          `${macros.length} proc-macro crates left out (relative to ${relative(process.cwd(), root) || '.'})`,
      )
    },
  }
}
