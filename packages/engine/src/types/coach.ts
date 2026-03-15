import type { CoachId, TeamId, PlayerId } from './ids.js';
import type { Position } from './player.js';

// ── Coaching Role ───────────────────────────────────────────────────

export type CoachRole = 'HC' | 'OC' | 'DC' | 'STC' | 'QB_COACH' | 'RB_COACH' |
  'WR_COACH' | 'OL_COACH' | 'DL_COACH' | 'LB_COACH' | 'DB_COACH';

// ── Offensive Schemes ───────────────────────────────────────────────

export type OffensiveScheme =
  | 'west_coast'
  | 'spread'
  | 'air_raid'
  | 'power_run'
  | 'zone_run'
  | 'rpo_heavy'
  | 'play_action_heavy'
  | 'pro_style';

// ── Defensive Schemes ───────────────────────────────────────────────

export type DefensiveScheme =
  | '4_3_under'
  | '3_4'
  | 'nickel_base'
  | 'cover_3'
  | 'cover_2_tampa'
  | 'multiple'
  | 'aggressive_blitz';

// ── Coach Entity ────────────────────────────────────────────────────
// The coach controls everything on the field. The GM (user) only
// hires/fires coaches — their on-field decisions are autonomous.

export interface Coach {
  id: CoachId;
  firstName: string;
  lastName: string;
  age: number;
  role: CoachRole;
  teamId: TeamId | null;

  offensiveScheme: OffensiveScheme | null;
  defensiveScheme: DefensiveScheme | null;

  attributes: CoachAttributes;
  personality: CoachPersonality;
  tendencies: CoachTendencies;

  coachingTreeOrigin: CoachId | null;
  yearsExperience: number;
  record: { wins: number; losses: number; ties: number };
  playoffAppearances: number;
  championships: number;

  salary: number;
  contractYearsRemaining: number;
}

// ── Coach Attributes ────────────────────────────────────────────────

export interface CoachAttributes {
  gameManagement: number;     // 0-99, clock mgmt, challenges, timeouts
  playerDevelopment: number;  // affects progression rates of players
  playCalling: number;        // game sim performance modifier
  schemeDesign: number;       // how well the scheme adapts
  recruiting: number;         // FA/draft pitch effectiveness
  adaptability: number;       // in-game adjustments
  talentEvaluation: number;   // 0-99, accuracy of depth chart decisions
  situationalAwareness: number; // 0-99, red zone, 2-minute, 4th down decisions
}

// ── Coach Personality ───────────────────────────────────────────────

export interface CoachPersonality {
  aggressiveness: number; // 0-99, 4th down, blitzing, risk tolerance
  discipline: number;     // penalty reduction, player accountability
  motivation: number;     // morale boost to team
  innovation: number;     // willingness to try new schemes/strategies
  ego: number;            // may clash with GM if high
  stubbornness: number;   // 0-99, resists changing scheme even when it isn't working
  trustInYouth: number;   // 0-99, willingness to start young players over veterans
  mediaPresence: 'quiet' | 'professional' | 'fiery' | 'eccentric';
}

// ── Coach Tendencies ───────────────────────────────────────────────
// These drive the autonomous on-field behaviour that makes each
// coach feel distinct. The GM sees the EFFECTS of these tendencies
// (e.g., "our OC is too pass-heavy") but cannot override them.

export interface CoachTendencies {
  // ── Run/pass balance ──────────────────────────────────────────
  runPassRatio: number;         // 0-100, 0=all-run, 100=all-pass, ~55 is league avg
  earlyDownRunRate: number;     // 0-100, tendency to run on 1st/2nd down
  playActionFrequency: number;  // 0-100, how often play-action is called

  // ── Situational preferences ───────────────────────────────────
  fourthDownAggressiveness: number; // 0-100, willingness to go for it on 4th
  redZoneAggression: number;       // 0-100, pass-heavy vs run-heavy in red zone
  twoMinuteDrillEfficiency: number;// 0-100, quality of hurry-up play calling
  blitzRate: number;               // 0-100, how often the defense sends extra rushers
  coverageDisguise: number;        // 0-100, how much pre-snap movement/deception

  // ── Personnel usage ───────────────────────────────────────────
  rotationPhilosophy: 'bell_cow' | 'committee' | 'matchup_based';
  rookieLeash: number;             // 0-100, how quickly rookies earn playing time
  veteranLoyalty: number;          // 0-100, tendency to start vets over better young players
  starterReps: number;             // 0-100, % of snaps starters play (vs resting/rotating)

  // ── Scheme flexibility ────────────────────────────────────────
  tempoPreference: 'slow' | 'balanced' | 'uptempo' | 'no_huddle';
  formationVariety: number;        // 0-100, how many different formations are used
  motionFrequency: number;         // 0-100, pre-snap motion usage
  preferredPersonnelGroupings: PersonnelGrouping[];
}

export interface PersonnelGrouping {
  label: string;           // e.g. "11", "12", "21", "00 (empty)", "Jumbo"
  usagePercentage: number; // how often this grouping is used (should sum to ~100)
}

// ── Depth Chart Decision (coach-controlled) ────────────────────────
// The coaching staff AI produces these based on coach attributes,
// tendencies, and player evaluations. The GM has no direct input.

export interface CoachDepthChartDecision {
  position: Position;
  rankedPlayers: PlayerId[];
  reasoning: string[];           // observable explanations for the GM to read
  confidenceInStarter: number;   // 0-100, how settled the position battle is
}

// ── Game Plan (coach-controlled) ───────────────────────────────────

export interface GamePlan {
  coachId: CoachId;
  opponent: TeamId;
  offensiveEmphasis: string[];   // e.g. ["attack weak secondary", "establish the run"]
  defensiveEmphasis: string[];   // e.g. ["contain mobile QB", "bracket WR1"]
  keyMatchups: string[];
  tempoAdjustment: 'faster' | 'normal' | 'slower';
  riskLevel: 'conservative' | 'balanced' | 'aggressive';
}

// ── Scheme Fit ──────────────────────────────────────────────────────

export interface SchemeFitResult {
  playerId: string;
  coachId: string;
  fitScore: number;           // 0-100, how well the player fits the scheme
  keyAttributes: string[];    // which attributes drive this score
  performanceMultiplier: number; // applied to player's ratings in game sim
}

// ── Coaching Tree ───────────────────────────────────────────────────

export interface CoachingTreeNode {
  coachId: CoachId;
  mentorId: CoachId | null;
  proteges: CoachId[];
  treeBonus: number;
}

// ── Coaching Engine Interface ───────────────────────────────────────

export interface ICoachingEngine {
  calculateSchemeFit(playerId: string, coachId: string): SchemeFitResult;
  getCoachingTree(coachId: CoachId): CoachingTreeNode;
  evaluateCoachPerformance(coachId: CoachId, season: number): number;
  generateCandidatePool(role: CoachRole): Coach[];
  generateDepthChart(teamId: TeamId): CoachDepthChartDecision[];
  generateGamePlan(teamId: TeamId, opponentId: TeamId): GamePlan;
}
