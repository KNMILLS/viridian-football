/**
 * Trade negotiation — AI counter-offer generation and trade evaluation
 * from a team's perspective. Uses deterministic RNG for all randomness.
 */

import type { TradeProposal, TradeAssetItem, TradeEvaluation } from '../types/trade.js';
import type { League } from '../types/league.js';
import type { DraftPick } from '../types/draft.js';
import type { Player } from '../types/player.js';
import type { Contract } from '../types/contract.js';
import type { TeamId, PlayerId, DraftPickId } from '../types/ids.js';
import type { AiDecisionContext, GmArchetypeName } from '../types/ai.js';
import type { RNG } from '../sim/RNG.js';
import { createLCG, chance } from '../sim/RNG.js';
import {
  getPlayerTradeValue,
  getPickTradeValue,
  computeFairnessScore,
  getContenderPremium,
} from './TradeValuation.js';
import {
  FAIRNESS_THRESHOLD_CLOSE,
  FAIRNESS_THRESHOLD_UNFAIR,
} from './constants.js';

// ── Public API ──────────────────────────────────────────────────────

/**
 * Generate a counter-offer from the target team's AI.
 * Returns null if the proposal is so unfair the AI rejects outright.
 */
export function generateCounterOffer(
  proposal: TradeProposal,
  league: League,
  targetContext: AiDecisionContext,
  seed: number,
): TradeProposal | null {
  const rng = createLCG(seed);

  const offeringValue = sumAssetValues(proposal.offering, league);
  const requestingValue = sumAssetValues(proposal.requesting, league);
  const fairness = computeFairnessScore(offeringValue, requestingValue);

  const archetype = targetContext.archetype.name;
  const rejectThreshold = getRejectThreshold(archetype);
  const closeThreshold = getCloseThreshold(archetype);

  if (fairness > closeThreshold && fairness <= rejectThreshold) {
    return null;
  }

  if (fairness > rejectThreshold) {
    return null;
  }

  if (Math.abs(fairness) <= closeThreshold) {
    if (chance(rng, 0.6)) return null;
    return makeSmallAdjustment(proposal, league, targetContext, rng);
  }

  if (fairness < -closeThreshold && fairness >= -rejectThreshold) {
    return makeCounterProposal(proposal, league, targetContext, rng, fairness);
  }

  if (fairness < -rejectThreshold) {
    return null;
  }

  return null;
}

/**
 * Evaluate a trade proposal from a specific team's perspective.
 * Returns a recommendation string and numeric score.
 */
export function evaluateFromTeamPerspective(
  proposal: TradeProposal,
  league: League,
  teamContext: AiDecisionContext,
): { score: number; recommendation: TradeEvaluation['recommendation'] } {
  const isProposing = teamContext.teamId === proposal.proposingTeamId;
  const incoming = isProposing ? proposal.requesting : proposal.offering;
  const outgoing = isProposing ? proposal.offering : proposal.requesting;

  const incomingValue = sumAssetValues(incoming, league);
  const outgoingValue = sumAssetValues(outgoing, league);

  let score = incomingValue - outgoingValue;

  const premium = getContenderPremium(teamContext.teamRecord);
  if (teamContext.mode === 'contend' || teamContext.mode === 'dynasty') {
    const playerIncoming = incoming.filter(a => a.type === 'player');
    score += playerIncoming.length * 50 * (premium - 1) * 10;
  }

  if (teamContext.mode === 'rebuild' || teamContext.mode === 'retool') {
    const pickIncoming = incoming.filter(a => a.type !== 'player');
    score += pickIncoming.length * 30;
  }

  for (const need of teamContext.rosterNeeds) {
    for (const asset of incoming) {
      if (asset.type !== 'player') continue;
      const player = league.players.find(p => p.id === asset.playerId);
      if (player?.position === need.position) {
        score += need.urgency * 2;
      }
    }
  }

  const recommendation = scoreToRecommendation(score);
  return { score: Math.round(score), recommendation };
}

// ── Internal helpers ────────────────────────────────────────────────

function sumAssetValues(assets: TradeAssetItem[], league: League): number {
  let total = 0;
  for (const asset of assets) {
    if (asset.type === 'player') {
      const player = league.players.find(p => p.id === asset.playerId);
      const contract = league.contracts.find(
        c => c.playerId === asset.playerId && c.status === 'active',
      );
      if (player) {
        total += getPlayerTradeValue(player, contract ?? null);
      }
    } else {
      const pick = league.draftPicks.find(p => p.id === asset.pickId);
      if (pick) {
        total += getPickTradeValue(pick, league.season);
      }
    }
  }
  return total;
}

function getRejectThreshold(archetype: GmArchetypeName): number {
  switch (archetype) {
    case 'aggressive_dealmaker':
      return FAIRNESS_THRESHOLD_UNFAIR + 15;
    case 'analytics_architect':
      return FAIRNESS_THRESHOLD_UNFAIR - 10;
    case 'strategic_rebuilder':
      return FAIRNESS_THRESHOLD_UNFAIR;
    case 'player_centric':
      return FAIRNESS_THRESHOLD_UNFAIR + 5;
    case 'culture_commander':
      return FAIRNESS_THRESHOLD_UNFAIR;
    default:
      return FAIRNESS_THRESHOLD_UNFAIR;
  }
}

function getCloseThreshold(archetype: GmArchetypeName): number {
  switch (archetype) {
    case 'aggressive_dealmaker':
      return FAIRNESS_THRESHOLD_CLOSE + 10;
    case 'analytics_architect':
      return FAIRNESS_THRESHOLD_CLOSE - 5;
    default:
      return FAIRNESS_THRESHOLD_CLOSE;
  }
}

function makeSmallAdjustment(
  proposal: TradeProposal,
  league: League,
  _ctx: AiDecisionContext,
  _rng: RNG,
): TradeProposal | null {
  const availablePicks = league.draftPicks.filter(
    p =>
      p.currentTeamId === proposal.proposingTeamId &&
      p.round >= 5 &&
      !proposal.offering.some(a => a.type !== 'player' && a.pickId === p.id),
  );

  if (availablePicks.length === 0) return null;

  const latestPick = availablePicks.sort((a, b) => b.round - a.round)[0]!;
  return {
    ...proposal,
    id: `${proposal.id}_counter_${proposal.counterOfferCount + 1}`,
    proposingTeamId: proposal.targetTeamId,
    targetTeamId: proposal.proposingTeamId,
    offering: [...proposal.requesting],
    requesting: [
      ...proposal.offering,
      { type: 'draft_pick', pickId: latestPick.id },
    ],
    counterOfferCount: proposal.counterOfferCount + 1,
    status: 'countered',
  };
}

function makeCounterProposal(
  proposal: TradeProposal,
  league: League,
  ctx: AiDecisionContext,
  rng: RNG,
  fairness: number,
): TradeProposal | null {
  const wantsPicksMore = ctx.mode === 'rebuild' || ctx.mode === 'retool';

  if (wantsPicksMore) {
    const availablePicks = league.draftPicks.filter(
      p =>
        p.currentTeamId === proposal.proposingTeamId &&
        !proposal.offering.some(a => a.type !== 'player' && a.pickId === p.id),
    );

    if (availablePicks.length > 0) {
      const bestPick = availablePicks.sort((a, b) => a.round - b.round)[0]!;
      return {
        ...proposal,
        id: `${proposal.id}_counter_${proposal.counterOfferCount + 1}`,
        proposingTeamId: proposal.targetTeamId,
        targetTeamId: proposal.proposingTeamId,
        offering: [...proposal.requesting],
        requesting: [
          ...proposal.offering,
          { type: 'draft_pick', pickId: bestPick.id },
        ],
        counterOfferCount: proposal.counterOfferCount + 1,
        status: 'countered',
      };
    }
  }

  const availablePlayers = league.players.filter(
    p =>
      p.teamId === proposal.proposingTeamId &&
      !proposal.offering.some(a => a.type === 'player' && a.playerId === p.id),
  );

  if (availablePlayers.length > 0) {
    const sortedByValue = availablePlayers
      .map(p => ({
        player: p,
        value: getPlayerTradeValue(
          p,
          league.contracts.find(c => c.playerId === p.id && c.status === 'active') ?? null,
        ),
      }))
      .sort((a, b) => b.value - a.value);

    const deficitTarget = Math.abs(fairness) * 10;
    const bestFit = sortedByValue.find(pv => pv.value >= deficitTarget * 0.5 && pv.value <= deficitTarget * 2);
    const chosen = bestFit ?? sortedByValue[0];

    if (chosen) {
      return {
        ...proposal,
        id: `${proposal.id}_counter_${proposal.counterOfferCount + 1}`,
        proposingTeamId: proposal.targetTeamId,
        targetTeamId: proposal.proposingTeamId,
        offering: [...proposal.requesting],
        requesting: [
          ...proposal.offering,
          { type: 'player', playerId: chosen.player.id },
        ],
        counterOfferCount: proposal.counterOfferCount + 1,
        status: 'countered',
      };
    }
  }

  return null;
}

function scoreToRecommendation(
  score: number,
): TradeEvaluation['recommendation'] {
  if (score > 300) return 'strong_accept';
  if (score > 100) return 'accept';
  if (score > -100) return 'neutral';
  if (score > -300) return 'reject';
  return 'strong_reject';
}
