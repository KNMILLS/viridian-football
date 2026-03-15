import type { TeamId, PlayerId } from '../types/index.js';
import type { TeamStanding } from '../types/index.js';
import type { RNG } from '../sim/RNG.js';

// ── Types ──────────────────────────────────────────────────────────

export interface WaiverClaim {
  teamId: TeamId;
  priority: number;
}

export interface WaiverResult {
  claimedBy: TeamId | null;
  becameFreeAgent: boolean;
}

// ── Waiver Order ───────────────────────────────────────────────────

/**
 * Return waiver priority order based on inverse standings.
 * Worst record gets highest priority. Ties broken by RNG for determinism.
 */
export function getWaiverOrder(standings: TeamStanding[], rng: RNG): TeamId[] {
  const sorted = [...standings].sort((a, b) => {
    const diff = a.winPercentage - b.winPercentage;
    if (Math.abs(diff) > 0.001) return diff;
    return rng() - 0.5;
  });
  return sorted.map((s) => s.teamId);
}

// ── Process Claims ─────────────────────────────────────────────────

/**
 * Process waiver claims for a released player.
 *
 * Pre-trade-deadline: the team with the highest priority (lowest standing)
 * wins the claim.
 *
 * Post-trade-deadline (outright waivers): if no claims, the player becomes
 * a free agent rather than being assigned to the claiming team.
 */
export function processWaiverClaims(
  _releasedPlayerId: PlayerId,
  claims: WaiverClaim[],
  isPostDeadline: boolean,
): WaiverResult {
  if (claims.length === 0) {
    return { claimedBy: null, becameFreeAgent: isPostDeadline };
  }

  const sorted = [...claims].sort((a, b) => a.priority - b.priority);
  const winner = sorted[0]!;

  if (isPostDeadline) {
    return { claimedBy: null, becameFreeAgent: true };
  }

  return { claimedBy: winner.teamId, becameFreeAgent: false };
}
