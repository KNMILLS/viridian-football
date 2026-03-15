export { EventBus } from './events/index.js';
export type { GameEventMap } from './events/index.js';

export {
  createLCG,
  createSecondaryLCG,
  randomInt,
  weightedChoice,
  shuffle,
  chance,
  normalRandom,
  clamp,
  calculateTeamStrength,
  simulateGame,
  generateSchedule,
  generatePlayoffSchedule,
  seedPlayoffTeams,
  simulatePlayoffRound,
} from './sim/index.js';
export type {
  RNG,
  TeamStrength,
  GameSimOptions,
  GameResult,
  PlayByPlayEntry,
  PlayerStatLine,
  GameInjury,
  Weather,
  PlayoffBracket,
  PlayoffSeed,
  PlayoffRoundResult,
  PlayoffGameResult,
  PlayoffRoundName,
  PlayoffMatchup,
} from './sim/index.js';

export type {
  TeamId,
  PlayerId,
  CoachId,
  DraftPickId,
  LeagueId,
  UserId,
  ContractId,
  LeagueWeek,
} from './types/index.js';

export {
  teamId,
  playerId,
  coachId,
  draftPickId,
  leagueId,
  userId,
  contractId,
} from './types/index.js';

// ── Cap Engine ──────────────────────────────────────────────────────
export { CapEngine } from './cap/index.js';

// ── Calendar Engine ─────────────────────────────────────────────────
export { CalendarEngine } from './calendar/index.js';
