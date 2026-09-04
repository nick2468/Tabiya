import { Chess } from 'chess.js'
import type { Engine, SearchResult } from '../engine'

/**
 * An engine for tests: it answers at once, and it never starts a worker.
 *
 * It lived in `play.test.ts` and was needed in two places the moment the
 * provider could be given its engine rather than building one. Keeping two
 * copies of a fake is how two suites end up testing slightly different things
 * and neither notices.
 *
 * It plays the first legal move and calls every position the same number, which
 * is enough for everything the tests ask: what matters to them is what the app
 * does with an answer, not which answer it was. `move` and `cp` pin either when
 * a test needs a particular one, and any method can be replaced outright.
 */
export function fakeEngine(
  overrides: Partial<Engine> & { move?: string; cp?: number } = {},
): Engine {
  const search = async (fen: string): Promise<SearchResult> => {
    const chess = new Chess(fen)
    const legal = chess.moves({ verbose: true })
    const move = overrides.move ?? (legal[0] ? legal[0].from + legal[0].to : '')
    return {
      bestMove: move || null,
      candidates: move
        ? [{ move, score: { kind: 'cp', centipawns: overrides.cp ?? 0 }, depth: 10 }]
        : [],
    }
  }
  return {
    start: async () => {},
    setStrength: async () => {},
    newGame: async () => {},
    search,
    stop: () => {},
    ...overrides,
  }
}
