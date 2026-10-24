/**
 * The third-party notices, worked out from what each package says about itself.
 *
 * This file is the PURE half of the generator: no disk, no processes, so every
 * rule in it is tested against fixtures in `src/build/notices.test.ts`. The
 * other half, `plugin.ts`, reads the bundle, the crates and the files, and
 * hands them here.
 *
 * WHY IT EXISTS. MIT, BSD, Apache-2.0, ISC and Unicode-3.0 all ask for their
 * copyright and licence notice to go with every copy of the software, in
 * binary form as much as in source. The bundler strips the libraries' own
 * licence comments, and `tabiya.exe` carries none of its crates' notices at
 * all, so until phase 50 the only copyright lines in the shipped program were
 * Nick's and the GPL's own. This is what puts the rest back.
 *
 * THE RULES, each one a decision rather than a default:
 *
 * - A licence expression is SPDX: `OR` is a choice, `AND` needs both, brackets
 *   group, and the old `MIT/Apache-2.0` slash form means OR.
 * - Every licence named anywhere in an expression must be one this file can
 *   recognise. An unknown one fails the build, naming the package. The fix is
 *   to teach it the licence, never to skip the package.
 * - Of the choices, MIT is taken whenever it is offered, otherwise the first,
 *   with one refinement: a choice the package's OWN files cover beats one that
 *   would need a canonical text. A package's own file carries its real
 *   copyright line; the canonical text would carry one filled in from metadata.
 *   So the order is MIT if the package ships its text, then the first choice
 *   the package ships a text for, then MIT or the first choice from the
 *   canonical set. brotli-decompressor is the case today: "BSD-3-Clause/MIT",
 *   shipping only its BSD text with Dropbox's copyright line. The choice and
 *   its reason are always recorded.
 * - The text is the package's own file for that licence, verbatim. Only when it
 *   has none does a canonical text from `scripts/licence-texts/` stand in, with
 *   its copyright line filled from the package's authors, and the notices say
 *   so. No package is ever left out for having no file.
 * - NOTICE and THIRD-PARTY files always go in verbatim beside the licence, and
 *   so does any other licence-like file that is not itself a licence text, such
 *   as a COPYING file that states the copyright and points at a text.
 * - Packages whose whole entry is the same text share one copy.
 */

/** One file from a package: its name in the package, and what it says. */
export interface PackageFile {
  name: string
  text: string
}

/** What the generator knows about one package before resolving it. */
export interface PackageInput {
  name: string
  version: string
  /** The SPDX expression the package declares, or null when it declares none. */
  licence: string | null
  /** Who wrote it, for a canonical text's copyright line. */
  authors: string[]
  repository: string | null
  /** Where its source can be had, for licences that ask for that. */
  sourceUrl: string
  /** Every licence-like file in the package, by name. */
  files: PackageFile[]
}

/** A package, resolved: which licence was taken, and the text that goes with it. */
export interface Resolved {
  name: string
  version: string
  /** The expression as declared. */
  declared: string
  /** The licences taken: one, or more when the expression joins them with AND. */
  chosen: string[]
  /** Why those, when there was a choice. Null when there was none. */
  why: string | null
  /** The licence texts, each from the package or from the canonical set. */
  texts: { licence: string; from: string; text: string }[]
  /** NOTICE, THIRD-PARTY and other notice files, verbatim. */
  notices: PackageFile[]
  repository: string | null
  sourceUrl: string
}

/** A failure that must stop the build rather than drop a package. */
export class NoticeError extends Error {}

/* --------------------------------------------------------------- licences */

/**
 * How to recognise each licence in a file, by the words only its text uses.
 *
 * Texts overlap, and the guards below are what keep them apart. The Unicode
 * licence opens with MIT's "Permission is hereby granted, free of charge" and
 * lacks MIT's "shall be included" clause, which is exactly the shape of MIT-0,
 * so a text is MIT or MIT-0 only when it is not Unicode (unicode-ident ships
 * one). MIT-0 is MIT without the condition that the notice be kept, and 0BSD is
 * ISC without it.
 */
/**
 * A phrase from a licence text, matched across line breaks and runs of spaces,
 * because every package wraps its copy at a different width: the ISC file in
 * @ungap/structured-clone breaks "the above / copyright notice" over a line.
 */
function phrase(words: string): RegExp {
  const pattern = words
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'))
    .join('\\s+')
  return new RegExp(pattern, 'i')
}

const PERMISSION = phrase('Permission is hereby granted, free of charge')
const KEEP_NOTICE = phrase('The above copyright notice and this permission notice shall be included')
const ISC_GRANT = phrase(
  'Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted',
)
const ISC_KEEP = phrase('provided that the above copyright notice and this permission notice appear in all copies')
const REDISTRIBUTION = phrase('Redistribution and use in source and binary forms')
const NEITHER = phrase('Neither the name')
const UNICODE = phrase('UNICODE LICENSE V3')
const APACHE = phrase('Version 2.0, January 2004')
const MPL = /Mozilla\s+Public\s+License,?\s+Version\s+2\.0/i
const GPL3 = phrase('GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007')
const UNLICENSE = phrase('This is free and unencumbered software released into the public domain')
const CC0 = phrase('CC0 1.0 Universal')
// Any one quote mark either side of as-is: straight, curly, or none.
const ZLIB_AS_IS = /provided\s+\S?as-is\S?,\s+without\s+any\s+express\s+or\s+implied/i
const ZLIB_MARKED = phrase('plainly marked')

const SIGNATURES: Record<string, (text: string) => boolean> = {
  'Unicode-3.0': (t) => UNICODE.test(t),
  'Apache-2.0': (t) => /Apache\s+License/i.test(t) && APACHE.test(t),
  'MPL-2.0': (t) => MPL.test(t),
  'GPL-3.0': (t) => GPL3.test(t),
  Unlicense: (t) => UNLICENSE.test(t),
  'CC0-1.0': (t) => CC0.test(t),
  Zlib: (t) => ZLIB_AS_IS.test(t) && ZLIB_MARKED.test(t),
  'BSD-3-Clause': (t) => REDISTRIBUTION.test(t) && NEITHER.test(t),
  'BSD-2-Clause': (t) => REDISTRIBUTION.test(t) && !NEITHER.test(t),
  MIT: (t) => PERMISSION.test(t) && KEEP_NOTICE.test(t) && !UNICODE.test(t),
  'MIT-0': (t) => PERMISSION.test(t) && !KEEP_NOTICE.test(t) && !UNICODE.test(t),
  ISC: (t) => ISC_GRANT.test(t) && ISC_KEEP.test(t),
  '0BSD': (t) => ISC_GRANT.test(t) && !ISC_KEEP.test(t),
}

/** The SPDX ids this file knows, with the text each one is recognised by. */
const ALIASES: Record<string, string> = {
  'GPL-3.0-only': 'GPL-3.0',
  'GPL-3.0-or-later': 'GPL-3.0',
  'GPL-3.0+': 'GPL-3.0',
}

/** The licence whose text an SPDX id is recognised by, or null when unknown. */
export function textKey(id: string): string | null {
  const key = ALIASES[id] ?? id
  return key in SIGNATURES ? key : null
}

/** Every licence a file's text is, by the signatures above. */
export function classify(text: string): string[] {
  return Object.keys(SIGNATURES).filter((key) => SIGNATURES[key](text))
}

/**
 * An SPDX expression, as the choices it offers: each choice is the licences
 * that must all be honoured if it is taken.
 *
 * `(MIT OR Apache-2.0) AND Unicode-3.0` is `[[MIT, Unicode-3.0], [Apache-2.0,
 * Unicode-3.0]]`. The slash form is OR. `WITH` keeps an exception attached to
 * its licence as one id, which no signature knows, so it fails as unknown
 * rather than being read as the plain licence.
 */
export function parseExpression(expression: string): string[][] {
  const tokens = expression
    .replace(/\s*\/\s*/g, ' OR ')
    .replace(/\(/g, ' ( ')
    .replace(/\)/g, ' ) ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  // Glue "X WITH Y" into one token before parsing.
  const glued: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i + 1] === 'WITH' && tokens[i + 2]) {
      glued.push(`${tokens[i]} WITH ${tokens[i + 2]}`)
      i += 2
    } else glued.push(tokens[i])
  }

  let at = 0
  const fail = (why: string): never => {
    throw new NoticeError(`the licence expression "${expression}" ${why}`)
  }
  const or = (): string[][] => {
    let left = and()
    while (glued[at] === 'OR') {
      at++
      left = [...left, ...and()]
    }
    return left
  }
  const and = (): string[][] => {
    let left = atom()
    while (glued[at] === 'AND') {
      at++
      const right = atom()
      left = left.flatMap((a) => right.map((b) => [...a, ...b]))
    }
    return left
  }
  const atom = (): string[][] => {
    const token = glued[at]
    if (token === undefined) return fail('ends too soon')
    if (token === '(') {
      at++
      const inner = or()
      if (glued[at] !== ')') fail('has a bracket that is not closed')
      at++
      return inner
    }
    if (token === ')' || token === 'OR' || token === 'AND') fail(`has "${token}" where a licence should be`)
    at++
    return [[token]]
  }

  const result = or()
  if (at !== glued.length) fail(`has something after its end: "${glued.slice(at).join(' ')}"`)
  return result
}

/* ---------------------------------------------------------------- files */

/** A file that is a notice to be carried, never the licence text itself. */
function isNoticeName(name: string): boolean {
  return /notice|third[-_]?party/i.test(name)
}

/** SPDX metadata files describe a package; they are not a notice to carry. */
function isMetadataName(name: string): boolean {
  return /\.spdx$/i.test(name)
}

/** The licence-like files worth looking at, by name. */
export function isLicenceFileName(name: string): boolean {
  return /^(licen[cs]e|copying|notice|unlicen[cs]e|third[-_]?party)/i.test(name) && !isMetadataName(name)
}

/** Which of a package's files holds the text for a licence, or null. */
function ownTextFor(key: string, files: PackageFile[]): PackageFile | null {
  const holding = files.filter((file) => !isNoticeName(file.name) && classify(file.text).includes(key))
  if (holding.length === 0) return null
  // A file that is ONLY this licence beats one that holds several; then a name
  // that says which licence it is; then the shortest name, for a stable choice.
  const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  return [...holding].sort((a, b) => {
    const single = Number(classify(b.text).length === 1) - Number(classify(a.text).length === 1)
    if (single) return single
    const named = Number(flat(b.name).includes(flat(key))) - Number(flat(a.name).includes(flat(key)))
    if (named) return named
    return a.name.length - b.name.length || a.name.localeCompare(b.name)
  })[0]
}

/**
 * A canonical text with its copyright line filled in from the package.
 *
 * MIT's `<year> <copyright holders>` and BSD-3-Clause's `<year> <owner>` become
 * the authors' names; there is no year to give, so it goes. Apache-2.0 and
 * MPL-2.0 have no copyright line of their own and are used as they are.
 */
export function fillCanonical(text: string, pkg: Pick<PackageInput, 'name' | 'authors' | 'repository'>): string {
  const holders =
    pkg.authors.length > 0
      ? pkg.authors.join(', ')
      : `The ${pkg.name} authors${pkg.repository ? ` (${pkg.repository})` : ''}`
  return text
    .replace(/<year> <copyright holders>/g, holders)
    .replace(/<year> <owner>/g, holders)
}

/* -------------------------------------------------------------- resolving */

/**
 * One package, resolved, or a NoticeError saying why it cannot be.
 *
 * @param canonical the texts in `scripts/licence-texts/`, by SPDX id.
 */
export function resolvePackage(pkg: PackageInput, canonical: Record<string, string>): Resolved {
  const who = `${pkg.name} ${pkg.version}`
  if (!pkg.licence || !pkg.licence.trim()) {
    throw new NoticeError(`${who} declares no licence. Find out what it is licensed under before shipping it.`)
  }

  let choices: string[][]
  try {
    choices = parseExpression(pkg.licence)
  } catch (error) {
    throw new NoticeError(`${who}: ${(error as Error).message}`)
  }

  const unknown = [...new Set(choices.flat())].filter((id) => textKey(id) === null)
  if (unknown.length > 0) {
    throw new NoticeError(
      `${who} is licensed "${pkg.licence}", and the generator does not recognise ${unknown.join(', ')}. ` +
        'Teach scripts/notices/core.ts the licence; never skip the package.',
    )
  }

  const covered = (choice: string[]) => choice.every((id) => ownTextFor(textKey(id)!, pkg.files) !== null)
  const hasMit = (choice: string[]) => choice.includes('MIT')
  const mitChoice = choices.find(hasMit)
  let chosen: string[]
  let why: string | null = null
  const firstCovered = choices.find(covered)
  if (choices.length === 1) {
    chosen = choices[0]
  } else if (mitChoice && covered(mitChoice)) {
    chosen = mitChoice
    why = 'MIT is taken whenever it is offered'
  } else if (firstCovered) {
    chosen = firstCovered
    why = mitChoice
      ? 'MIT is offered, but the package ships no MIT text and its own files cover this choice'
      : 'MIT is not offered, so the first choice its own files cover is taken'
  } else if (mitChoice) {
    chosen = mitChoice
    why = 'MIT is taken whenever it is offered'
  } else {
    chosen = choices[0]
    why = 'MIT is not offered, so the first choice is taken'
  }

  const texts = chosen.map((id) => {
    const key = textKey(id)!
    const own = ownTextFor(key, pkg.files)
    if (own) return { licence: id, from: own.name, text: own.text }
    const stand = canonical[key]
    if (stand === undefined) {
      throw new NoticeError(
        `${who} is licensed ${id} and ships no ${id} text, and scripts/licence-texts/ has no ${key}.txt to stand in. ` +
          'Add the canonical text from spdx.org; never skip the package.',
      )
    }
    return {
      licence: id,
      from: `the canonical ${key} text from SPDX, because the package ships none; its copyright line is filled from the package's authors`,
      text: fillCanonical(stand, pkg),
    }
  })

  const used = new Set(texts.map((t) => t.from))
  const notices = pkg.files.filter(
    (file) => !used.has(file.name) && (isNoticeName(file.name) || classify(file.text).length === 0),
  )

  return {
    name: pkg.name,
    version: pkg.version,
    declared: pkg.licence,
    chosen,
    why,
    texts,
    notices,
    repository: pkg.repository,
    sourceUrl: pkg.sourceUrl,
  }
}

/* ------------------------------------------------------------- rendering */

/** Line endings and trailing spaces are not part of a licence. */
export function normalise(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .trim()
}

/** The body of a package's entry: its licence texts, then its notices. */
function body(entry: Resolved): string {
  const parts = entry.texts.map((t) => normalise(t.text))
  for (const notice of entry.notices) parts.push(`${notice.name}:\n\n${normalise(notice.text)}`)
  return parts.join('\n\n- - - - - - - -\n\n')
}

/** Packages that share one text, and that text. */
export interface Group {
  packages: Resolved[]
  body: string
}

/** Packages whose whole entry is the same, sharing one copy, in a stable order. */
export function group(entries: Resolved[]): Group[] {
  const byBody = new Map<string, Resolved[]>()
  for (const entry of entries) {
    const key = body(entry)
    byBody.set(key, [...(byBody.get(key) ?? []), entry])
  }
  const order = (a: Resolved, b: Resolved) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version)
  return [...byBody.entries()]
    .map(([text, packages]) => ({ body: text, packages: [...packages].sort(order) }))
    .sort((a, b) => order(a.packages[0], b.packages[0]))
}

/** The first line of the file, which the About screen also checks for. */
export const NOTICES_TITLE = 'TABIYA THIRD-PARTY NOTICES'

const RULE = '='.repeat(78)
const THIN = '-'.repeat(78)

/** A paragraph wrapped to the file's width. */
function wrap(text: string, width = 78): string {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line)
      line = word
    } else line = line ? `${line} ${word}` : word
  }
  if (line) lines.push(line)
  return lines.join('\n')
}

function describe(entry: Resolved): string {
  const licence = entry.chosen.join(' AND ')
  const choice = entry.why ? `, chosen from "${entry.declared}" because ${entry.why}` : ''
  const from = entry.texts.map((t) => `${t.licence} text: ${t.from}`).join('; ')
  return wrap(`${entry.name} ${entry.version}. Licence: ${licence}${choice}. ${from}.`)
}

function section(title: string, lead: string, entries: Resolved[]): string {
  const out = [RULE, title, RULE, '', wrap(lead), '']
  for (const g of group(entries)) {
    out.push(THIN)
    for (const entry of g.packages) out.push(describe(entry))
    out.push(THIN, '', g.body, '')
  }
  return out.join('\n')
}

/** Everything the file says, from what the plugin found. */
export interface NoticesInput {
  version: string
  javascript: Resolved[]
  rust: Resolved[]
  /** Proc-macro crates, left out of the Rust section because they are not in the binary. */
  macros: { name: string; version: string }[]
  /** Crates reached only through a proc-macro, left out for the same reason. */
  compileOnly: number
}

/** The whole notices file, as plain text. */
export function renderNotices(input: NoticesInput): string {
  const mpl = [...input.javascript, ...input.rust]
    .filter((entry) => entry.chosen.some((id) => id.startsWith('MPL-')))
    .sort((a, b) => a.name.localeCompare(b.name))
  const macroList = input.macros.map((m) => `${m.name} ${m.version}`).join(', ')

  const header = [
    NOTICES_TITLE,
    `for Tabiya ${input.version}`,
    '',
    wrap(
      'Tabiya contains the work of the people listed below, under the licences listed with ' +
        "each, and owes every one of them this notice. Tabiya's own code is MIT and the program " +
        'as a whole is distributed under the GNU General Public License version 3; both are on ' +
        'the About screen under View the licences.',
    ),
    '',
    wrap(
      'This file is generated during every production build, from what the build actually ' +
        'ships, and is not edited by hand. The JavaScript section lists every package with code ' +
        'in the bundle, read from the bundle itself, plus the Stockfish engine, which is copied ' +
        'into the app beside it. The Windows section lists every Rust crate compiled into ' +
        'tabiya.exe: the normal dependencies of the program, for x86_64-pc-windows-msvc.',
    ),
    '',
    wrap(
      `Left out, and why: ${input.macros.length} procedural-macro crates, whose code runs while ` +
        `the program is compiled and is not in it, and the ${input.compileOnly} crates that only ` +
        `they depend on, for the same reason. The procedural macros are: ${macroList}.`,
    ),
    '',
    wrap(
      'Where a package offers a choice of licences, the one taken is recorded beside it. Where ' +
        'a package ships no licence text of its own, the canonical text from SPDX stands in, ' +
        "with its copyright line filled from the package's authors, and that is recorded too.",
    ),
    '',
    `In every build: ${input.javascript.length} JavaScript packages.`,
    `In the Windows program only: ${input.rust.length} Rust crates.`,
    '',
  ].join('\n')

  const mplSection =
    mpl.length === 0
      ? ''
      : [
          RULE,
          'WHERE TO GET THE SOURCE OF THE MPL-2.0 FILES',
          RULE,
          '',
          wrap(
            'These packages are licensed under the Mozilla Public License 2.0, which asks whoever ' +
              'distributes them in executable form to say where their source is. The source of ' +
              'every MPL-2.0 file in this program is available at the addresses below, at the ' +
              'exact version shipped. Their MPL-2.0 text is with them in the section above. ' +
              'Packages that carry it in the same form share one copy; one that carries it in a ' +
              'slightly different form has its own, because each is printed exactly as its ' +
              'package carries it.',
          ),
          '',
          ...mpl.map((entry) =>
            [`${entry.name} ${entry.version}`, `  ${entry.sourceUrl}`, ...(entry.repository ? [`  ${entry.repository}`] : [])].join(
              '\n',
            ),
          ),
          '',
        ].join('\n')

  return [
    header,
    section(
      'IN EVERY BUILD: THE JAVASCRIPT IN THE APP',
      'In the browser build and the Windows program alike.',
      input.javascript,
    ),
    section(
      'IN THE WINDOWS PROGRAM ONLY: THE RUST CRATES IN TABIYA.EXE',
      'The desktop wrapper. None of this is in the browser build.',
      input.rust,
    ),
    mplSection,
  ]
    .filter(Boolean)
    .join('\n')
}
