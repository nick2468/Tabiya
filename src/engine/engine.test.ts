import { describe, expect, it } from 'vitest'
import { MATE_PAWNS, isMate, parseBestMove, parseInfo, splitMove, whitePovPawns } from './uci'
import { allProfiles, chooseCandidate, optionCommands, strengthProfile } from './strength'

describe('parseInfo', () => {
  it('reads depth, score and the line', () => {
    const info = parseInfo('info depth 14 seldepth 29 multipv 1 score cp 20 nodes 152900 pv c1f4 c8f5')
    expect(info).toEqual({
      depth: 14,
      multipv: 1,
      score: { kind: 'cp', centipawns: 20 },
      pv: ['c1f4', 'c8f5'],
    })
  })

  it('reads a mate score, including one against the engine', () => {
    expect(parseInfo('info depth 5 score mate 3 pv a1a8')?.score).toEqual({ kind: 'mate', moves: 3 })
    expect(parseInfo('info depth 5 score mate -2 pv a1a8')?.score).toEqual({
      kind: 'mate',
      moves: -2,
    })
  })

  it('ignores the chatter engines emit between real lines', () => {
    expect(parseInfo('info string NNUE evaluation using nn-9067e33176e8.nnue')).toBeNull()
    expect(parseInfo('readyok')).toBeNull()
    expect(parseInfo('')).toBeNull()
  })

  it('keeps the whole line after pv, since pv comes last', () => {
    const info = parseInfo('info depth 3 score cp 10 pv e2e4 e7e5 g1f3')
    expect(info?.pv).toEqual(['e2e4', 'e7e5', 'g1f3'])
  })
})

describe('parseBestMove', () => {
  it('reads the move and ignores the ponder move', () => {
    expect(parseBestMove('bestmove c1f4 ponder c8f5')).toBe('c1f4')
    expect(parseBestMove('bestmove e7e8q')).toBe('e7e8q')
  })

  it('returns nothing when there is no move to make', () => {
    expect(parseBestMove('bestmove (none)')).toBeNull()
    expect(parseBestMove('info depth 1')).toBeNull()
  })
})

describe('whitePovPawns', () => {
  it('keeps the sign when White is to move and flips it when Black is', () => {
    const score = { kind: 'cp', centipawns: 150 } as const
    expect(whitePovPawns(score, 'white')).toBe(1.5)
    expect(whitePovPawns(score, 'black')).toBe(-1.5)
  })

  it('turns mate into a number that still sorts above any evaluation', () => {
    expect(whitePovPawns({ kind: 'mate', moves: 3 }, 'white')).toBe(MATE_PAWNS)
    expect(whitePovPawns({ kind: 'mate', moves: 3 }, 'black')).toBe(-MATE_PAWNS)
    // Mate against the side to move is a loss for them.
    expect(whitePovPawns({ kind: 'mate', moves: -1 }, 'white')).toBe(-MATE_PAWNS)
  })

  it('gives a mate already delivered to the side NOT to move', () => {
    // `mate 0` says the side to move is mated, so the mate is the other
    // side's. Read as a win for the mover it would have put the bar's number
    // on the wrong end of the board.
    expect(whitePovPawns({ kind: 'mate', moves: 0 }, 'white')).toBe(-MATE_PAWNS)
    expect(whitePovPawns({ kind: 'mate', moves: 0 }, 'black')).toBe(MATE_PAWNS)
  })

  it('knows a mate score from an evaluation', () => {
    expect(isMate({ kind: 'mate', moves: 1 })).toBe(true)
    expect(isMate({ kind: 'cp', centipawns: 900 })).toBe(false)
  })
})

describe('splitMove', () => {
  it('splits a coordinate move, promotion and all', () => {
    expect(splitMove('e2e4')).toEqual({ from: 'e2', to: 'e4', promotion: undefined })
    expect(splitMove('e7e8q')).toEqual({ from: 'e7', to: 'e8', promotion: 'q' })
  })
})

describe('the strength scale', () => {
  it('offers eight levels', () => {
    expect(allProfiles().map((profile) => profile.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('clamps a level outside the scale rather than failing', () => {
    expect(strengthProfile(0).level).toBe(1)
    expect(strengthProfile(99).level).toBe(8)
  })

  it('makes the low levels weak by choosing among candidates, not by Elo', () => {
    // Stockfish cannot be limited below about 1320, which is already too strong
    // for the bottom of this scale, so levels 1 to 3 work a different way.
    for (const level of [1, 2, 3]) {
      const profile = strengthProfile(level)
      expect(profile.limitStrength).toBe(false)
      expect(profile.multiPv).toBeGreaterThan(1)
    }
  })

  it('hands the top levels to the engine limiter', () => {
    for (const level of [4, 5, 6, 7, 8]) {
      const profile = strengthProfile(level)
      expect(profile.limitStrength).toBe(true)
      expect(profile.uciElo).toBeGreaterThanOrEqual(1320)
      expect(profile.multiPv).toBe(1)
    }
  })

  it('gets stronger the whole way up', () => {
    const profiles = allProfiles()
    for (let i = 1; i < profiles.length; i++) {
      expect(profiles[i].movetime).toBeGreaterThanOrEqual(profiles[i - 1].movetime)
      expect(profiles[i].multiPv).toBeLessThanOrEqual(profiles[i - 1].multiPv)
    }
  })
})

describe('chooseCandidate', () => {
  it('takes the best move at the levels that do not randomise', () => {
    const profile = strengthProfile(6)
    expect(chooseCandidate(['best', 'second'], profile, 0.99)).toBe('best')
  })

  it('spreads the choice over the candidates at the low levels', () => {
    const profile = strengthProfile(1)
    const candidates = ['a', 'b', 'c', 'd', 'e']
    expect(chooseCandidate(candidates, profile, 0)).toBe('a')
    expect(chooseCandidate(candidates, profile, 0.5)).toBe('c')
    expect(chooseCandidate(candidates, profile, 0.999)).toBe('e')
  })

  it('copes when the engine returns fewer candidates than asked for', () => {
    const profile = strengthProfile(1)
    expect(chooseCandidate(['only'], profile, 0.9)).toBe('only')
    expect(chooseCandidate([], profile, 0.5)).toBeUndefined()
  })
})

describe('optionCommands', () => {
  it('sends MultiPV and turns the limiter off at the low levels', () => {
    expect(optionCommands(strengthProfile(1))).toEqual([
      'setoption name MultiPV value 5',
      'setoption name UCI_LimitStrength value false',
    ])
  })

  it('sends the Elo only when the limiter is on', () => {
    expect(optionCommands(strengthProfile(5))).toEqual([
      'setoption name MultiPV value 1',
      'setoption name UCI_LimitStrength value true',
      'setoption name UCI_Elo value 1500',
    ])
  })
})
