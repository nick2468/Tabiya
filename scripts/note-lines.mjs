/**
 * The fourth pass: the LINES the notes name, played out on a board.
 *
 * The two engine passes judge moves and `note-claims.mjs` judges the material
 * a note promises. None of them reads a line a note names unless it also
 * promises material, which is one mistake entry in twenty. This one plays
 * every sequence in every note and reports the ones the board refuses. It
 * needs no engine and runs in milliseconds.
 *
 * The rules it applies live in `lib/note-lines.mjs`, and its parser is shared
 * with `note-claims.mjs` in `lib/note-parse.mjs`. The three hard categories -
 * illegal, misnumbered and marker - are also in the suite, in
 * `src/content/content.test.ts`, so a new course cannot reintroduce them
 * quietly. This script exists for the three soft categories, which need a
 * person to read them, and for the intro mode, which has no anchor position
 * and can only report.
 *
 * Usage: node scripts/note-lines.mjs [course-folder ...]
 * With no argument it reads every course under courses/.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CATEGORIES, HARD, checkChapter, checkIntro } from './lib/note-lines.mjs'

const folders = process.argv.slice(2)
if (!folders.length) {
  for (const entry of readdirSync('courses', { withFileTypes: true })) {
    if (entry.isDirectory()) folders.push(join('courses', entry.name))
  }
}

let hard = 0
let soft = 0

for (const folder of folders) {
  const manifest = JSON.parse(readFileSync(join(folder, 'course.json'), 'utf8'))
  const findings = []
  const intros = []
  let notes = 0
  for (const file of manifest.chapters) {
    const chapter = JSON.parse(readFileSync(join(folder, file), 'utf8'))
    findings.push(...checkChapter(chapter))
    intros.push(...checkIntro(chapter))
    const count = (node) =>
      (node.note ? 1 : 0) +
      (node.plan ? 1 : 0) +
      (node.mistakes ?? []).length +
      (node.children ?? []).reduce((total, child) => total + count(child), 0)
    notes += chapter.tree.reduce((total, node) => total + count(node), 0)
  }

  const counted = CATEGORIES.map((category) => [category, findings.filter((row) => row.category === category).length])
  hard += counted.filter(([category]) => HARD.includes(category)).reduce((total, [, n]) => total + n, 0)
  soft += counted.filter(([category]) => !HARD.includes(category)).reduce((total, [, n]) => total + n, 0)

  console.log(`\n=== ${manifest.id}: ${notes} notes read, ${findings.length} findings, ${intros.length} in intros`)
  console.log(`    ${counted.map(([category, n]) => `${category} ${n}`).join(', ')}`)

  for (const category of CATEGORIES) {
    for (const row of findings.filter((finding) => finding.category === category)) {
      console.log(`\n  [${row.category}] ${row.chapter}  ${row.where}  (${row.field})`)
      console.log(`      "${row.moves}": ${row.detail}`)
      console.log(`      ${row.note}`)
    }
  }
  for (const row of intros) {
    console.log(`\n  [intro/${row.category}] ${row.chapter}`)
    console.log(`      "${row.moves}": ${row.detail}`)
  }
}

console.log(`\n${hard} faults, ${soft} for a human to read.`)
