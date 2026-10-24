// Node types for `node:fs`, which `tsconfig.app.json` does not load: it lists
// `vite/client` alone. Every file here that reads one declares its own, rather
// than leaning on another test file happening to declare it first.
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  classify,
  fillCanonical,
  group,
  NoticeError,
  NOTICES_TITLE,
  parseExpression,
  renderNotices,
  resolvePackage,
  type PackageInput,
} from '../../scripts/notices/core.ts'
import { COPIED_INTO_THE_APP, NOTICES_FILE, packageDirOf } from '../../scripts/notices/plugin.ts'
import { NOTICES_PATH, NOTICES_TITLE as SCREEN_TITLE } from '../ui/notices'

/**
 * The third-party notices generator, held rule by rule.
 *
 * Each rule here is one a careless generator gets wrong in a way that ships:
 * a package dropped because it has no licence file, a choice read the wrong
 * way, an unknown licence skipped instead of stopping the build, two copies of
 * one text, or a notice file left behind. The fixtures are small and made up,
 * except where a real package's quirk is the point, and then the quirk is
 * named.
 */
const repo = new URL('../../', import.meta.url)
const read = (name: string) => readFileSync(new URL(name, repo), 'utf8')

const CANONICAL = {
  MIT: read('scripts/licence-texts/MIT.txt'),
  'Apache-2.0': read('scripts/licence-texts/Apache-2.0.txt'),
  'BSD-3-Clause': read('scripts/licence-texts/BSD-3-Clause.txt'),
  'MPL-2.0': read('scripts/licence-texts/MPL-2.0.txt'),
}

const MIT_TEXT = `MIT License

Copyright (c) 2020 Ada Example

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction.

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.`

const BSD_TEXT = `Copyright (c) 2016 Example, Inc.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
3. Neither the name of the copyright holder nor the names of its contributors
may be used to endorse or promote products.`

const APACHE_TEXT = `                              Apache License
                        Version 2.0, January 2004
                     http://www.apache.org/licenses/`

/** The Unicode licence carries the MIT sentence, which is the trap. */
const UNICODE_TEXT = `UNICODE LICENSE V3

Permission is hereby granted, free of charge, to any person obtaining a copy
of data files and any associated documentation.`

/** @ungap/structured-clone's ISC file breaks a key phrase over a line. */
const ISC_WRAPPED = `ISC License

Copyright (c) 2021, Andrea Giammarchi, @WebReflection

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.`

function pkg(overrides: Partial<PackageInput>): PackageInput {
  return {
    name: 'example',
    version: '1.0.0',
    licence: 'MIT',
    authors: ['Ada Example <ada@example.com>'],
    repository: 'https://github.com/example/example',
    sourceUrl: 'https://crates.io/crates/example/1.0.0',
    files: [],
    ...overrides,
  }
}

describe('a licence expression', () => {
  it('reads OR as a choice and AND as both', () => {
    expect(parseExpression('MIT OR Apache-2.0')).toEqual([['MIT'], ['Apache-2.0']])
    expect(parseExpression('Apache-2.0 AND MIT')).toEqual([['Apache-2.0', 'MIT']])
  })

  it('reads the old slash form as OR, with or without spaces round it', () => {
    expect(parseExpression('MIT/Apache-2.0')).toEqual([['MIT'], ['Apache-2.0']])
    expect(parseExpression('Apache-2.0 / MIT')).toEqual([['Apache-2.0'], ['MIT']])
  })

  it('distributes AND over a bracketed choice, as unicode-ident needs', () => {
    expect(parseExpression('(MIT OR Apache-2.0) AND Unicode-3.0')).toEqual([
      ['MIT', 'Unicode-3.0'],
      ['Apache-2.0', 'Unicode-3.0'],
    ])
  })

  it('keeps an exception attached to its licence rather than reading it as the plain one', () => {
    expect(parseExpression('Apache-2.0 WITH LLVM-exception OR MIT')).toEqual([
      ['Apache-2.0 WITH LLVM-exception'],
      ['MIT'],
    ])
  })

  it('refuses an expression it cannot read', () => {
    expect(() => parseExpression('(MIT OR Apache-2.0')).toThrow(NoticeError)
    expect(() => parseExpression('MIT OR')).toThrow(NoticeError)
  })
})

describe('recognising a licence text', () => {
  it('does not mistake the Unicode licence for MIT or MIT-0', () => {
    expect(classify(UNICODE_TEXT)).toEqual(['Unicode-3.0'])
    expect(classify(MIT_TEXT)).toEqual(['MIT'])
  })

  it('reads a phrase broken over a line', () => {
    expect(classify(ISC_WRAPPED)).toEqual(['ISC'])
  })

  it('tells the no-notice variants from their parents', () => {
    expect(classify(MIT_TEXT.replace(/The above copyright notice[\s\S]*$/, ''))).toEqual(['MIT-0'])
    expect(classify(ISC_WRAPPED.replace(/, provided that[\s\S]*$/, '.'))).toEqual(['0BSD'])
  })
})

describe('resolving a package', () => {
  it('takes MIT when it is offered, and records the choice', () => {
    const done = resolvePackage(
      pkg({
        licence: 'MIT OR Apache-2.0',
        files: [
          { name: 'LICENSE-APACHE', text: APACHE_TEXT },
          { name: 'LICENSE-MIT', text: MIT_TEXT },
        ],
      }),
      CANONICAL,
    )
    expect(done.chosen).toEqual(['MIT'])
    expect(done.why).toContain('MIT is taken whenever it is offered')
    expect(done.texts).toEqual([{ licence: 'MIT', from: 'LICENSE-MIT', text: MIT_TEXT }])
    // The licence not taken does not ride along.
    expect(done.notices).toEqual([])
  })

  it('takes MIT from the slash form too', () => {
    const done = resolvePackage(pkg({ licence: 'MIT/Apache-2.0', files: [{ name: 'LICENSE-MIT', text: MIT_TEXT }] }), CANONICAL)
    expect(done.chosen).toEqual(['MIT'])
  })

  it("prefers a choice the package's own files cover over MIT from the canonical text", () => {
    // brotli-decompressor: "BSD-3-Clause/MIT", and only its BSD text, with
    // Dropbox's own copyright line, in the package.
    const done = resolvePackage(pkg({ licence: 'BSD-3-Clause/MIT', files: [{ name: 'LICENSE', text: BSD_TEXT }] }), CANONICAL)
    expect(done.chosen).toEqual(['BSD-3-Clause'])
    expect(done.why).toContain('ships no MIT text')
    expect(done.texts[0].text).toBe(BSD_TEXT)
  })

  it('takes the first choice the package ships a text for, when MIT is not offered', () => {
    const done = resolvePackage(
      pkg({ licence: 'Zlib OR Apache-2.0', files: [{ name: 'LICENSE-APACHE', text: APACHE_TEXT }] }),
      CANONICAL,
    )
    expect(done.chosen).toEqual(['Apache-2.0'])
    expect(done.why).toContain('the first choice its own files cover')
  })

  it('takes the very first choice when MIT is not offered and nothing is covered', () => {
    const done = resolvePackage(pkg({ licence: 'MPL-2.0 OR Apache-2.0', files: [] }), CANONICAL)
    expect(done.chosen).toEqual(['MPL-2.0'])
    expect(done.why).toContain('so the first choice is taken')
    expect(done.texts[0].from).toContain('canonical MPL-2.0 text')
  })

  it('needs every licence an AND names', () => {
    const done = resolvePackage(
      pkg({
        licence: '(MIT OR Apache-2.0) AND Unicode-3.0',
        files: [
          { name: 'LICENSE-MIT', text: MIT_TEXT },
          { name: 'LICENSE-UNICODE', text: UNICODE_TEXT },
        ],
      }),
      CANONICAL,
    )
    expect(done.chosen).toEqual(['MIT', 'Unicode-3.0'])
    expect(done.texts.map((t) => t.from)).toEqual(['LICENSE-MIT', 'LICENSE-UNICODE'])
  })

  it('never leaves out a package with no licence file: the canonical text stands in', () => {
    // webview2-com and nine more crates ship no licence file at all.
    const done = resolvePackage(pkg({ name: 'webview2-com', licence: 'MIT', files: [] }), CANONICAL)
    expect(done.texts).toHaveLength(1)
    expect(done.texts[0].from).toContain('canonical MIT text from SPDX')
    expect(done.texts[0].text).toContain('Copyright (c) Ada Example <ada@example.com>')
    expect(done.texts[0].text).not.toContain('<year>')
    expect(done.texts[0].text).not.toContain('<copyright holders>')
  })

  it("names the project when a canonical text's copyright line has no authors to fill it", () => {
    const filled = fillCanonical(CANONICAL.MIT, { name: 'webview2-com', authors: [], repository: 'https://github.com/wravery/webview2-rs' })
    expect(filled).toContain('Copyright (c) The webview2-com authors (https://github.com/wravery/webview2-rs)')
    expect(fillCanonical(CANONICAL['BSD-3-Clause'], { name: 'alloc-stdlib', authors: ['Dropbox'], repository: null })).toContain(
      'Copyright (c) Dropbox.',
    )
  })

  it('carries NOTICE, THIRD-PARTY and copyright-statement files verbatim', () => {
    const done = resolvePackage(
      pkg({
        licence: 'MIT/Apache-2.0',
        files: [
          { name: 'LICENSE-MIT', text: MIT_TEXT },
          { name: 'NOTICE', text: 'This product includes software developed by Example.' },
          // crossbeam-channel's: it holds an MIT text, and must not be taken for the licence.
          { name: 'LICENSE-THIRD-PARTY', text: `matching.go\n\n${MIT_TEXT}` },
          // siphasher's: a statement of the copyright that points at a text.
          { name: 'COPYING', text: 'Copyright 2016-2026 Frank Denis.\n\nLicensed under the MIT license.' },
        ],
      }),
      CANONICAL,
    )
    expect(done.texts[0].from).toBe('LICENSE-MIT')
    expect(done.notices.map((n) => n.name)).toEqual(['NOTICE', 'LICENSE-THIRD-PARTY', 'COPYING'])
  })

  it('stops the build on a licence it does not recognise, naming the package', () => {
    expect(() => resolvePackage(pkg({ name: 'odd-crate', licence: 'WTFPL' }), CANONICAL)).toThrow(/odd-crate 1\.0\.0.*WTFPL/)
  })

  it('stops even when the unknown licence is a choice that would not be taken', () => {
    expect(() => resolvePackage(pkg({ licence: 'MIT OR WTFPL', files: [{ name: 'LICENSE', text: MIT_TEXT }] }), CANONICAL)).toThrow(
      NoticeError,
    )
  })

  it('stops on a package that declares no licence at all', () => {
    expect(() => resolvePackage(pkg({ licence: null }), CANONICAL)).toThrow(/declares no licence/)
  })

  it('stops when there is neither a file nor a canonical text for the licence', () => {
    expect(() => resolvePackage(pkg({ licence: 'Zlib', files: [] }), CANONICAL)).toThrow(/no Zlib\.txt to stand in/)
  })
})

describe('sharing one copy of one text', () => {
  const entry = (name: string, text: string) =>
    resolvePackage(pkg({ name, files: [{ name: 'LICENSE', text }] }), CANONICAL)

  it('merges texts that differ only in line endings and trailing spaces', () => {
    const groups = group([
      entry('b-crate', MIT_TEXT),
      entry('a-crate', `${MIT_TEXT.replace(/\n/g, '\r\n').replace('MIT License', 'MIT License   ')}\r\n`),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].packages.map((p) => p.name)).toEqual(['a-crate', 'b-crate'])
  })

  it('keeps texts apart that differ in a single word', () => {
    // cssparser's MPL-2.0 says http:// where SPDX's says https://.
    const groups = group([entry('one', MIT_TEXT), entry('two', MIT_TEXT.replace('2020', '2021'))])
    expect(groups).toHaveLength(2)
  })
})

describe('the file', () => {
  const resolved = (name: string, licence: string, text: string) =>
    resolvePackage(pkg({ name, licence, files: [{ name: 'LICENSE', text }] }), CANONICAL)

  const text = renderNotices({
    version: '9.9.9',
    javascript: [resolved('react', 'MIT', MIT_TEXT)],
    rust: [resolved('cssparser', 'MPL-2.0', CANONICAL['MPL-2.0'])],
    macros: [{ name: 'serde_derive', version: '1.0.0' }],
    compileOnly: 3,
  })
  /** The file's prose wraps at 78 columns, so a phrase is read the way a person reads it. */
  const prose = (s: string) => s.replace(/\s+/g, ' ')

  it('opens with the title the About screen checks for, and the version', () => {
    expect(text.split('\n')[0]).toBe(NOTICES_TITLE)
    expect(text).toContain('for Tabiya 9.9.9')
  })

  it('has the two sections, in order, with their counts', () => {
    const js = text.indexOf('IN EVERY BUILD: THE JAVASCRIPT IN THE APP')
    const rust = text.indexOf('IN THE WINDOWS PROGRAM ONLY: THE RUST CRATES IN TABIYA.EXE')
    expect(js).toBeGreaterThan(0)
    expect(rust).toBeGreaterThan(js)
    expect(text).toContain('In every build: 1 JavaScript packages.')
    expect(text).toContain('In the Windows program only: 1 Rust crates.')
  })

  it('says what it left out, how many and why', () => {
    expect(prose(text)).toContain('1 procedural-macro crates')
    expect(prose(text)).toContain('the 3 crates that only they depend on')
    expect(prose(text)).toContain('serde_derive 1.0.0')
  })

  it('says where the source of every MPL-2.0 package is', () => {
    const mpl = text.slice(text.indexOf('WHERE TO GET THE SOURCE OF THE MPL-2.0 FILES'))
    expect(prose(mpl)).toContain('is available at the addresses below')
    expect(mpl).toContain('cssparser 1.0.0')
    expect(mpl).toContain('https://crates.io/crates/example/1.0.0')
    expect(mpl).toContain('https://github.com/example/example')
    expect(mpl).not.toContain('react')
  })

  it('has no MPL section when nothing is MPL', () => {
    const none = renderNotices({ version: '1', javascript: [resolved('react', 'MIT', MIT_TEXT)], rust: [], macros: [], compileOnly: 0 })
    expect(none).not.toContain('WHERE TO GET THE SOURCE')
  })
})

describe('the canonical texts', () => {
  it.each(Object.keys(CANONICAL))('%s.txt is the licence its name says', (id) => {
    const textOf = CANONICAL[id as keyof typeof CANONICAL]
    expect(classify(textOf)).toEqual([id])
    const title = textOf.split('\n').find((line) => line.trim())!.trim()
    const expected: Record<string, RegExp> = {
      MIT: /^MIT License$/,
      'Apache-2.0': /^Apache License$/,
      'BSD-3-Clause': /^Copyright \(c\) <year> <owner>\.$/,
      'MPL-2.0': /^Mozilla Public License Version 2\.0$/,
    }
    expect(title).toMatch(expected[id])
  })
})

describe('the About screen and the generator', () => {
  /**
   * The screen fetches the file by name and recognises it by its first line.
   * Two copies of two strings in two places, and a mismatch would not fail a
   * build: the screen would quietly say the notices are missing.
   */
  it('agree on the file and its title', () => {
    expect(NOTICES_PATH).toBe(NOTICES_FILE)
    expect(SCREEN_TITLE).toBe(NOTICES_TITLE)
  })
})

describe('finding what ships', () => {
  it('maps a module to the package it came from', () => {
    expect(packageDirOf('C:/app/node_modules/react/cjs/react.production.js')).toBe('C:/app/node_modules/react')
    expect(packageDirOf('C:\\app\\node_modules\\@tauri-apps\\api\\core.js')).toBe('C:/app/node_modules/@tauri-apps/api')
    expect(packageDirOf('C:/app/node_modules/stockfish/Copying.txt?raw')).toBe('C:/app/node_modules/stockfish')
    expect(packageDirOf('C:/app/node_modules/a/node_modules/b/index.js')).toBe('C:/app/node_modules/a/node_modules/b')
    expect(packageDirOf('C:/app/src/main.tsx')).toBeNull()
  })

  it('credits what copy-engine.mjs copies into the app beside the bundle', () => {
    // Stockfish never enters the bundle: it is copied into public/engine/.
    const script = read('scripts/copy-engine.mjs')
    expect(script).toContain("join(root, 'node_modules', 'stockfish'")
    expect(COPIED_INTO_THE_APP).toContain('stockfish')
  })
})
