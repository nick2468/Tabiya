import { parseBestMove, parseInfo, type Score } from './uci'
import { optionCommands, type StrengthProfile } from './strength'

/**
 * The Stockfish adapter: a web worker with a promise in front of it.
 *
 * Stockfish is a WASM build living in public/engine, put there by
 * scripts/copy-engine.mjs. It is the single-threaded lite build, so it needs no
 * SharedArrayBuffer and therefore no cross-origin isolation headers.
 *
 * The engine speaks one search at a time. Everything is queued behind a single
 * promise chain, so a caller can fire requests without worrying about it.
 */

/** One candidate move from a search. */
export interface Candidate {
  /** Coordinate notation, like "e2e4". */
  move: string
  score: Score
  depth: number
}

export interface SearchResult {
  /** What the engine would play. */
  bestMove: string | null
  /** The candidates, best first. One entry unless MultiPV was asked for. */
  candidates: Candidate[]
}

export interface Engine {
  /** Starts the worker and waits for the engine to be ready. */
  start(): Promise<void>
  /** Applies a strength profile. */
  setStrength(profile: StrengthProfile): Promise<void>
  /** Tells the engine a new game has begun, so it forgets the last one. */
  newGame(): Promise<void>
  /** Searches a position and returns what it found. */
  search(fen: string, movetime: number): Promise<SearchResult>
  /** Stops the worker. */
  stop(): void
}

const ENGINE_URL = '/engine/stockfish-18-lite-single.js'

export class StockfishEngine implements Engine {
  private worker: Worker | null = null
  private listeners: ((line: string) => void)[] = []
  private queue: Promise<unknown> = Promise.resolve()
  private readonly url: string

  constructor(url: string = ENGINE_URL) {
    this.url = url
  }

  async start(): Promise<void> {
    if (this.worker) return
    const worker = new Worker(this.url)
    this.worker = worker
    worker.onmessage = (event: MessageEvent) => {
      const line = typeof event.data === 'string' ? event.data : String(event.data)
      for (const listener of [...this.listeners]) listener(line)
    }
    await this.run(async () => {
      this.send('uci')
      await this.waitFor((line) => line.trim() === 'uciok')
      this.send('isready')
      await this.waitFor((line) => line.trim() === 'readyok')
    })
  }

  async setStrength(profile: StrengthProfile): Promise<void> {
    await this.run(async () => {
      for (const command of optionCommands(profile)) this.send(command)
      this.send('isready')
      await this.waitFor((line) => line.trim() === 'readyok')
    })
  }

  async newGame(): Promise<void> {
    await this.run(async () => {
      this.send('ucinewgame')
      this.send('isready')
      await this.waitFor((line) => line.trim() === 'readyok')
    })
  }

  async search(fen: string, movetime: number): Promise<SearchResult> {
    return this.run(async () => {
      // Candidates are collected by MultiPV index, keeping the deepest line
      // reported for each. Engines repeat each index as the search deepens.
      const byIndex = new Map<number, Candidate>()
      const collect = (line: string) => {
        const info = parseInfo(line)
        if (!info?.score || info.pv.length === 0) return
        const index = info.multipv ?? 1
        const held = byIndex.get(index)
        const depth = info.depth ?? 0
        if (!held || depth >= held.depth) {
          byIndex.set(index, { move: info.pv[0], score: info.score, depth })
        }
      }

      this.listeners.push(collect)
      let bestMove: string | null = null
      try {
        this.send(`position fen ${fen}`)
        this.send(`go movetime ${Math.max(1, Math.round(movetime))}`)
        const line = await this.waitFor((text) => text.startsWith('bestmove'))
        bestMove = parseBestMove(line)
      } finally {
        this.listeners = this.listeners.filter((listener) => listener !== collect)
      }

      const candidates = [...byIndex.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, candidate]) => candidate)

      // A search cut short can return a best move that no info line mentioned.
      // The best move is what the engine would play, so it leads the list.
      if (bestMove && candidates[0]?.move !== bestMove) {
        const found = candidates.findIndex((candidate) => candidate.move === bestMove)
        if (found > 0) candidates.unshift(...candidates.splice(found, 1))
        else if (found === -1 && candidates.length > 0) {
          candidates.unshift({ move: bestMove, score: candidates[0].score, depth: 0 })
        }
      }

      return { bestMove, candidates }
    })
  }

  stop(): void {
    if (!this.worker) return
    try {
      this.worker.postMessage('quit')
    } catch {
      // The worker may already be gone; terminating below is what matters.
    }
    this.worker.terminate()
    this.worker = null
    this.listeners = []
  }

  private send(command: string): void {
    this.worker?.postMessage(command)
  }

  /** Resolves with the first line the test accepts. */
  private waitFor(test: (line: string) => boolean, timeoutMs = 20_000): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup()
        reject(new Error('the engine did not answer in time'))
      }, timeoutMs)
      const listener = (line: string) => {
        if (!test(line)) return
        cleanup()
        resolve(line)
      }
      const cleanup = () => {
        clearTimeout(timer)
        this.listeners = this.listeners.filter((held) => held !== listener)
      }
      this.listeners.push(listener)
    })
  }

  /** Serialises work: the engine answers one question at a time. */
  private run<T>(work: () => Promise<T>): Promise<T> {
    const next = this.queue.then(work, work)
    // Keep the chain alive whatever happens to this caller's promise.
    this.queue = next.catch(() => undefined)
    return next
  }
}
