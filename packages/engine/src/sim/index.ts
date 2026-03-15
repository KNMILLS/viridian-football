export {
  type RNG,
  createLCG,
  createSecondaryLCG,
  randomInt,
  weightedChoice,
  shuffle,
  chance,
  normalRandom,
  clamp,
} from './RNG.js';

// ── Team Strength ─────────────────────────────────────────────────
export { calculateTeamStrength } from './TeamStrength.js';
export type { TeamStrength } from './TeamStrength.js';

// ── Game Simulation ───────────────────────────────────────────────
export { simulateGame } from './GameSim.js';
export type {
  GameSimOptions,
  GameResult,
  PlayByPlayEntry,
  PlayerStatLine,
  GameInjury,
  Weather,
} from './GameSim.js';

// ── Schedule Generation ───────────────────────────────────────────
export { generateSchedule, generatePlayoffSchedule } from './ScheduleGenerator.js';
export type { PlayoffMatchup as SchedulePlayoffMatchup } from './ScheduleGenerator.js';

// ── Playoff Engine ────────────────────────────────────────────────
export { seedPlayoffTeams, simulatePlayoffRound } from './PlayoffEngine.js';
export type {
  PlayoffBracket,
  PlayoffSeed,
  PlayoffRoundResult,
  PlayoffGameResult,
  PlayoffRoundName,
  PlayoffMatchup,
} from './PlayoffEngine.js';
