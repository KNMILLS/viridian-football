import type { PlayerId, TeamId, DraftPickId } from './ids.js';

// ── Trade Assets ────────────────────────────────────────────────────

export type TradeAssetItem =
  | { type: 'player'; playerId: PlayerId }
  | { type: 'draft_pick'; pickId: DraftPickId }
  | { type: 'conditional_pick'; pickId: DraftPickId; conditions: string };

// ── Trade Proposal ──────────────────────────────────────────────────

export interface TradeProposal {
  id: string;
  proposingTeamId: TeamId;
  targetTeamId: TeamId;
  offering: TradeAssetItem[];
  requesting: TradeAssetItem[];
  expiresAt: { season: number; week: number };
  counterOfferCount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired' | 'withdrawn';
}

// ── Trade Evaluation ────────────────────────────────────────────────

export interface TradeEvaluation {
  proposalId: string;
  offeringValue: number;       // total surplus value of what's being offered
  requestingValue: number;     // total surplus value of what's being requested
  fairnessScore: number;       // -100 to 100, 0 = perfectly fair
  capImpactProposing: number;  // net cap change for proposing team
  capImpactTarget: number;     // net cap change for target team
  rosterFitProposing: number;  // how much the acquisition fills a need
  rosterFitTarget: number;
  recommendation: 'strong_accept' | 'accept' | 'neutral' | 'reject' | 'strong_reject';
}

// ── Trade Value Chart ───────────────────────────────────────────────

export interface TradeValueChart {
  getPickValue(round: number, pick: number): number;
  getPlayerValue(playerId: PlayerId): number;
  getAgingCurveDiscount(age: number, position: string): number;
  getContenderPremium(teamRecord: { wins: number; losses: number }): number;
  getDeadlinePressure(weeksUntilDeadline: number): number;
}

// ── Trade Engine Interface ──────────────────────────────────────────

export interface ITradeEngine {
  evaluateTrade(proposal: TradeProposal): TradeEvaluation;
  generateCounterOffer(proposal: TradeProposal): TradeProposal | null;
  validateTradeLegality(proposal: TradeProposal): { legal: boolean; violations: string[] };
  getTradeHistory(teamId: TeamId): TradeProposal[];
}
