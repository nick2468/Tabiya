/**
 * The fourth checker: the lines the prose names, played on a board.
 *
 * `note-claims.mjs` plays a note's moves only when the note ALSO makes a
 * material claim in its vocabulary, which over the whole catalogue reaches
 * one mistake entry in twenty. A note that names a line and ends "and Black
 * is better" is never played at all. Phase 19 and its gate found six entries
 * carrying a line the board refuses, and every one of them had been through
 * careful human review, because a wrong line in a note is almost always a
 * line copied from a position that was NEARLY the same.
 *
 * Three ideas make this quiet enough to keep.
 *
 * 1. Place a sequence by its own move NUMBER and side, not by where the entry
 *    sits. Playing from the entry's position reports 36 lines across the
 *    catalogue and every one is a false positive: prose refers backwards,
 *    sideways and to other chapters.
 * 2. Let a note teach the checker as it goes. A note names a line in
 *    fragments - "7.Qxd5 loses a piece to 7...Qxc1" is two runs, and the
 *    second starts where the first ended. So every position a working reading
 *    reaches joins the pool the next run can be placed against.
 * 3. Let a note leave out an obvious reply. "8.Ne1 Qh4 is mate" is written
 *    after a recapture the reader supplies. One inserted reply, captures
 *    first, is allowed, and the report says which move it was.
 *
 * Findings are graded, because only some are safe for a build to fail on:
 *
 *   illegal        the board refuses a move and no reading rescues it
 *   misnumbered    it plays from the position the note is written from, so
 *                  the fault is the number in front of it
 *   marker         a + or # the board does not give, or a mate written as a
 *                  check
 *   unplaceable    nothing this can see is at that move number and side
 *   back-reference every move in it has already been played on this line
 *   deliberate     the prose says the move is illegal, and it is right
 *   widened        it needed a reply the note leaves out
 *
 * The first three are faults and are in the suite. The last four are the
 * false-positive classes, each silenced by understanding it rather than by
 * loosening the legality rule, and each still reported to a human.
 */
import { Chess } from 'chess.js'
import { runsIn, deniedAt, clauseAround } from './note-parse.mjs'

/** Faults. Anything else is a report for a human and never fails a build. */
export const HARD = ['illegal', 'misnumbered', 'marker']

/** Every category, in the order a report should read them. */
export const CATEGORIES = [...HARD, 'unplaceable', 'back-reference', 'widened', 'deliberate']

const markerOf = (san) => (/[+#]$/.test(san) ? san.slice(-1) : '')

const naming = (number, turn) => `${number}${turn === 'w' ? '.' : '...'}`

const nameOf = (station) => naming(station.number, station.turn)

/** A position, with the move number and side that can name it. */
function station(board) {
  return { fen: board.fen(), number: board.moveNumber(), turn: board.turn() }
}

/** Every position along a line: the stations a note's numbering can name. */
function stationsOf(moves) {
  const board = new Chess()
  const out = [station(board)]
  for (const san of moves) {
    board.move(san)
    out.push(station(board))
  }
  return out
}

/**
 * A marker the prose leaves to a word rather than a symbol.
 *
 * "7...Qxc1 mate" is correct prose and writing it `Qxc1#` would be worse, so
 * a bare move whose clause says mate or check is accepted. The reverse is
 * never accepted: a move written `+` when the board says `#` is the fault
 * gate 19 found, and no word in the clause excuses it.
 */
function spelledOut(note, token, gives) {
  if (markerOf(token.san) !== '') return false
  const clause = clauseAround(note, token.start, token.end)
  if (gives === '#') return /\bmate|\bmates\b|\bmating\b/i.test(clause)
  return /\bcheck/i.test(clause)
}

/**
 * Play a run from one position. Reports the move the board refused, or the
 * marker mismatches collected on the way, and the positions it passed
 * through so a later run can start from one of them.
 */
function playFrom(note, fen, run) {
  const board = new Chess(fen)
  const reached = []
  const markers = []
  for (let i = 0; i < run.length; i += 1) {
    let move
    try {
      move = board.move(run[i].san)
    } catch {
      return { ok: false, at: i, markers, reached }
    }
    reached.push(station(board))
    const gives = markerOf(move.san)
    if (markerOf(run[i].san) !== gives && !spelledOut(note, run[i], gives)) {
      markers.push({ wrote: run[i].san, board: move.san })
    }
  }
  return { ok: true, markers, reached }
}

/**
 * A reading of a run that the board allows, from a pool of starts.
 *
 * Prose branches: "7...Kd7 keeps everything. Only 7...g6?? hands it back to
 * 8.Qxe5+" names two different Black seventh moves, so more than one position
 * in the pool can be at White's eighth. A reading with no marker mismatch is
 * preferred over one with, because a check written correctly on one branch is
 * not a fault just because the other branch was tried first.
 */
function readFrom(note, pool, run, side, number) {
  let fallback = null
  for (const start of pool) {
    if (start.number !== number || start.turn !== side) continue
    const played = playFrom(note, start.fen, run)
    if (!played.ok) continue
    if (!played.markers.length) return { start, played }
    fallback = fallback ?? { start, played }
  }
  return fallback
}

/**
 * A reading that needs one move the note leaves out.
 *
 * "8.Ne1 Qh4 is mate again" is written after Black's recapture, and "9.Nxd5!
 * Nxd5 10.Qxd5" breaks its own run on the exclamation mark and resumes a ply
 * later. Both are prose written for a reader. One inserted move is allowed,
 * captures first, and the move is named in the report.
 */
function readWidened(note, pool, run, side, number) {
  let fallback = null
  for (const start of pool) {
    if (start.turn === side) continue
    const board = new Chess(start.fen)
    const replies = board
      .moves({ verbose: true })
      .sort((a, b) => (b.captured ? 1 : 0) - (a.captured ? 1 : 0))
    for (const reply of replies) {
      const aside = new Chess(start.fen)
      aside.move(reply)
      if (aside.moveNumber() !== number || aside.turn() !== side) continue
      const played = playFrom(note, aside.fen(), run)
      if (!played.ok) continue
      if (!played.markers.length) return { reply: reply.san, played }
      fallback = fallback ?? { reply: reply.san, played }
    }
  }
  return fallback
}

/**
 * Every finding in one piece of prose, against the line it hangs off.
 *
 * `stations` is that line from the initial position. Its last entry is the
 * anchor: the position the prose is written from. Runs are read in order and
 * a working reading feeds the next one.
 */
function readNote(note, stations, { anchored = true, line = [] } = {}) {
  const found = []
  const anchor = stations[stations.length - 1]
  const before = new Set(line)
  const reading = []

  for (const run of runsIn(note)) {
    const side = run[0].side ?? 'w'
    const number = run[0].number
    const named = naming(number, side)
    const sans = run.map((token) => token.san)
    const wrote = sans.join(' ')
    const report = (category, detail) => found.push({ category, detail, moves: wrote })
    const keep = (played) => reading.push(...played.reached)

    // The note's own earlier readings come first: they are the strongest
    // evidence about the position the author had in mind.
    const read = readFrom(note, [...reading, ...stations], run, side, number)
    if (read) {
      keep(read.played)
      if (read.played.markers.length) {
        const bad = read.played.markers[0]
        report('marker', `wrote ${bad.wrote}, the board gives ${bad.board}`)
      }
      continue
    }

    // Placed and refused, with the prose saying so: the note is right.
    const at = stations.find((each) => each.number === number && each.turn === side)
    const failure = at ? playFrom(note, at.fen, run) : null
    if (failure && deniedAt(note, run[failure.at])) {
      report('deliberate', `${sans[failure.at]} is refused, and the note says so`)
      continue
    }

    // A reply left out of the note's own line, before anything else: the
    // fragment after an exclamation mark resumes a ply on.
    const carried = readWidened(note, reading, run, side, number)
    if (carried) {
      keep(carried.played)
      report('widened', `plays with ${carried.reply} inserted, which the note leaves out`)
      continue
    }

    // It plays from the position the prose is written from, so the number in
    // front of it is the fault and the fix is one character.
    if (anchored && anchor.turn === side) {
      const here = playFrom(note, anchor.fen, run)
      if (here.ok) {
        keep(here)
        report('misnumbered', `written as ${named}, the board is at ${nameOf(anchor)}`)
        continue
      }
    }

    const skipped = readWidened(note, stations, run, side, number)
    if (skipped) {
      keep(skipped.played)
      report('widened', `plays with ${skipped.reply} inserted, which the note leaves out`)
      continue
    }

    // A note is allowed to point at a move the line has already played, in
    // this chapter's numbering or another chapter's.
    if (sans.every((san) => before.has(san))) {
      report('back-reference', 'every move in it has already been played on this line')
      continue
    }

    if (failure) {
      report('illegal', `the board refuses ${sans[failure.at]}, move ${failure.at + 1} of the run, at ${named}`)
    } else if (anchored) {
      report('unplaceable', `nothing on this line is at ${named}; it runs ${nameOf(stations[0])} to ${nameOf(anchor)}`)
    } else {
      report('unplaceable', `no position this chapter reaches is at ${named}`)
    }
  }
  return found
}

/**
 * Every finding in one chapter's node notes, plans and mistake notes.
 *
 * The chapter shape is the authored one: a stem, and a tree of nodes carrying
 * `san`, `note` and `mistakes`. A loaded chapter satisfies it too, which is
 * how the same code runs in the script and in the suite.
 */
export function checkChapter(chapter) {
  const findings = []
  const consider = (note, field, where, stations, line) => {
    if (!note) return
    for (const finding of readNote(note, stations, { line })) {
      findings.push({ chapter: chapter.id, where, field, note, ...finding })
    }
  }

  // The stations of a line are built once and extended, rather than replayed
  // from move one for every note on it. Over the catalogue that is the
  // difference between the suite noticing this check and not.
  const after = (stations, san) => {
    const board = new Chess(stations[stations.length - 1].fen)
    board.move(san)
    return [...stations, station(board)]
  }

  const walk = (node, path, before) => {
    const line = [...path, node.san]
    const stations = after(before, node.san)
    const where = line.join(' ')
    consider(node.note, 'note', where, stations, line)
    consider(node.plan, 'plan', where, stations, line)
    for (const mistake of node.mistakes ?? []) {
      const alt = [...path, mistake.san]
      const label = `${where} not ${mistake.san}`
      consider(mistake.note, `mistake ${mistake.san}`, label, after(before, mistake.san), alt)
    }
    for (const child of node.children ?? []) walk(child, line, stations)
  }
  const stem = stationsOf(chapter.stem)
  for (const node of chapter.tree) walk(node, chapter.stem, stem)
  return findings
}

/**
 * The intro mode, which is a different problem and stays a report.
 *
 * A chapter intro has no anchor position, so there is no one line to place a
 * sequence against and no misnumbering to detect. The only honest test is to
 * try every position the chapter reaches and report what plays from none of
 * them.
 */
export function checkIntro(chapter) {
  const seen = new Map()
  const walk = (node, path) => {
    const line = [...path, node.san]
    for (const each of stationsOf(line)) seen.set(each.fen, each)
    for (const child of node.children ?? []) walk(child, line)
  }
  for (const node of chapter.tree) walk(node, chapter.stem)
  const all = [...seen.values()]

  return readNote(chapter.intro ?? '', all, { anchored: false }).map((finding) => ({
    chapter: chapter.id,
    where: 'intro',
    field: 'intro',
    note: chapter.intro,
    ...finding,
  }))
}
