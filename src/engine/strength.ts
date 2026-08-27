/**
 * The strength scale, 1 to 8.
 *
 * Stockfish cannot be asked to play below about 1320 on its own scale, which is
 * already stronger than the bottom of the range this app is for. So the scale
 * works in two halves.
 *
 * Levels 1 to 3 leave the engine at full strength but give it almost no time
 * and ask for several candidate moves, then pick among them at random. That
 * produces play that is genuinely weak and still looks like chess, rather than
 * an engine playing perfectly and then hanging a queen.
 *
 * Levels 4 to 8 hand the job to the engine's own UCI_LimitStrength setting.
 *
 * The Elo numbers below are the engine's own scale. They are not online rapid
 * ratings and the labels never claim they are.
 */

export interface StrengthProfile {
  level: number
  /** Short name for the picker. */
  label: string
  /** One honest sentence about what this level does. */
  detail: string
  /** Milliseconds per move. */
  movetime: number
  /** How many candidate moves to ask for. 1 means play the best move. */
  multiPv: number
  /** Whether to use the engine's own strength limiter. */
  limitStrength: boolean
  /** The engine's own Elo setting, when the limiter is on. */
  uciElo?: number
}

const PROFILES: StrengthProfile[] = [
  {
    level: 1,
    label: 'Very casual',
    detail: 'Picks at random from the five moves it likes, after a glance. It will miss things.',
    movetime: 50,
    multiPv: 5,
    limitStrength: false,
  },
  {
    level: 2,
    label: 'Casual',
    detail: 'Picks at random from four moves, after a glance.',
    movetime: 80,
    multiPv: 4,
    limitStrength: false,
  },
  {
    level: 3,
    label: 'Improving',
    detail: 'Picks at random from its top three moves, with a little more time to think.',
    movetime: 150,
    multiPv: 3,
    limitStrength: false,
  },
  {
    level: 4,
    label: 'Club',
    detail: "The engine's own strength limiter, at its lowest setting of 1320.",
    movetime: 200,
    multiPv: 1,
    limitStrength: true,
    uciElo: 1320,
  },
  {
    level: 5,
    label: 'Club, stronger',
    detail: "The engine's own limiter at 1500.",
    movetime: 250,
    multiPv: 1,
    limitStrength: true,
    uciElo: 1500,
  },
  {
    level: 6,
    label: 'Strong club',
    detail: "The engine's own limiter at 1750.",
    movetime: 300,
    multiPv: 1,
    limitStrength: true,
    uciElo: 1750,
  },
  {
    level: 7,
    label: 'Tough',
    detail: "The engine's own limiter at 2100.",
    movetime: 400,
    multiPv: 1,
    limitStrength: true,
    uciElo: 2100,
  },
  {
    level: 8,
    label: 'Unpleasant',
    detail: "The engine's own limiter at 2500. Not a fair fight, and not meant to be.",
    movetime: 600,
    multiPv: 1,
    limitStrength: true,
    uciElo: 2500,
  },
]

export const STRENGTH_LEVELS = PROFILES.map((profile) => profile.level)

/** The profile for a level, clamped into range. */
export function strengthProfile(level: number): StrengthProfile {
  const clamped = Math.min(Math.max(Math.round(level), 1), PROFILES.length)
  return PROFILES[clamped - 1]
}

export function allProfiles(): StrengthProfile[] {
  return PROFILES
}

/**
 * Picks one of the engine's candidate moves.
 *
 * At the low levels the choice is uniform among however many candidates came
 * back, which is what makes those levels weak. From level 4 up the engine has
 * already been told to play badly, so the best move is taken as given.
 *
 * @param random a number in [0, 1); injected so the tests are not a coin toss
 */
export function chooseCandidate<T>(
  candidates: T[],
  profile: StrengthProfile,
  random: number,
): T | undefined {
  if (candidates.length === 0) return undefined
  if (profile.multiPv <= 1) return candidates[0]
  const pool = Math.min(profile.multiPv, candidates.length)
  const index = Math.min(Math.floor(random * pool), pool - 1)
  return candidates[index]
}

/** The UCI setoption lines a profile needs, in the order to send them. */
export function optionCommands(profile: StrengthProfile): string[] {
  return [
    `setoption name MultiPV value ${profile.multiPv}`,
    `setoption name UCI_LimitStrength value ${profile.limitStrength}`,
    ...(profile.limitStrength && profile.uciElo
      ? [`setoption name UCI_Elo value ${profile.uciElo}`]
      : []),
  ]
}
