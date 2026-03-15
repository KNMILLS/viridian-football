import type { TeamId, PlayerId, CoachId } from './ids.js';
import type { TradeProposal } from './trade.js';

// ── GM Archetype ────────────────────────────────────────────────────

export type GmArchetypeName =
  | 'analytics_architect'
  | 'culture_commander'
  | 'strategic_rebuilder'
  | 'player_centric'
  | 'aggressive_dealmaker';

export interface GmArchetype {
  name: GmArchetypeName;
  displayName: string;
  description: string;

  weights: GmDecisionWeights;
  tendencies: GmTendencies;
  signatureMoves: string[];
}

// ── Decision Weights ────────────────────────────────────────────────
// Each weight is 0-100. Higher = more emphasis on that factor.

export interface GmDecisionWeights {
  analyticsReliance: number;
  scoutingReliance: number;
  draftPriority: number;           // build through draft vs. FA/trades
  freeAgencyAggression: number;
  tradeAggression: number;
  capConservatism: number;         // willingness to create dead money
  riskTolerance: number;
  cultureWeight: number;           // importance of character/personality
  schemeFitWeight: number;
  youthBias: number;               // preference for young players
  veteranBias: number;             // preference for proven veterans
  compPickAwareness: number;       // factors comp picks into FA decisions
}

// ── GM Tendencies ───────────────────────────────────────────────────

export interface GmTendencies {
  rebuildThreshold: number;       // record at which GM switches to rebuild mode
  contendThreshold: number;       // record at which GM goes "all in"
  coachFiringPatience: number;    // losing seasons before firing HC
  starPlayerLoyalty: number;      // how long they keep aging stars
  draftTradeUpFrequency: number;  // 0-100, how often they trade up
  draftTradeDownFrequency: number;
  maxDeadMoneyTolerance: number;  // cap percentage
  franchiseTagUsage: number;      // 0-100, how readily they use the tag
}

// ── AI Decision Context ─────────────────────────────────────────────

export interface AiDecisionContext {
  teamId: TeamId;
  archetype: GmArchetype;
  season: number;
  teamRecord: { wins: number; losses: number };
  capSpace: number;
  draftPickCount: number;
  ownerPressure: number;
  rosterNeeds: { position: string; urgency: number }[];
  mode: 'rebuild' | 'retool' | 'contend' | 'dynasty';
}

// ── AI Actions ──────────────────────────────────────────────────────

export type AiAction =
  | { kind: 'propose_trade'; proposal: TradeProposal }
  | { kind: 'evaluate_trade'; proposal: TradeProposal; accept: boolean }
  | { kind: 'sign_free_agent'; playerId: PlayerId; offer: { years: number; totalValue: number } }
  | { kind: 'release_player'; playerId: PlayerId }
  | { kind: 'draft_player'; playerId: PlayerId }
  | { kind: 'hire_coach'; coachId: CoachId; role: string }
  | { kind: 'fire_coach'; coachId: CoachId }
  | { kind: 'restructure_contract'; playerId: PlayerId }
  | { kind: 'franchise_tag'; playerId: PlayerId; tagType: string }
  | { kind: 'invest_analytics'; amount: number }
  | { kind: 'no_action'; reason: string };

// ── AI GM Engine Interface ──────────────────────────────────────────

export interface IAiGmEngine {
  getArchetype(teamId: TeamId): GmArchetype;
  evaluateTeamState(teamId: TeamId): AiDecisionContext;
  decideAction(context: AiDecisionContext): AiAction;
  evaluateTradeOffer(teamId: TeamId, proposal: TradeProposal): boolean;
  generateDraftBoard(teamId: TeamId): PlayerId[];
  prioritizeCoachingHire(teamId: TeamId): CoachId[];
}
