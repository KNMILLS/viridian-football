import type { Team, DepthChart, PlayerId, TeamId, Player, Position } from '../types/index.js';
import type { EventBus } from '../events/EventBus.js';
import type { GameEventMap } from '../events/GameEvents.js';
import { POSITION_PEAK_AGE } from './constants.js';

// ── Types ──────────────────────────────────────────────────────────

export type NeedUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface RosterNeed {
  position: Position;
  urgency: NeedUrgency;
  notes: string;
}

// ── Analysis ───────────────────────────────────────────────────────

/**
 * Identify positional weaknesses on a team's roster.
 *
 * Factors:
 *  - Starter rating vs league average at that position
 *  - Age relative to position peak window
 *  - Contract years remaining (expiring = potential need)
 *  - Depth (only 1 player = high urgency)
 */
export function analyzeRosterNeeds(
  _team: Team,
  players: Player[],
  depthChart: DepthChart,
  leagueAverages?: Record<string, number>,
): RosterNeed[] {
  const needs: RosterNeed[] = [];
  const defaults = leagueAverages ?? {};

  for (const [pos, ids] of Object.entries(depthChart) as [Position, PlayerId[]][]) {
    if (ids.length === 0) {
      needs.push({ position: pos, urgency: 'critical', notes: 'No players at position' });
      continue;
    }

    const starters = ids
      .map((id) => players.find((p) => p.id === id))
      .filter((p): p is Player => p != null);

    if (starters.length === 0) {
      needs.push({ position: pos, urgency: 'critical', notes: 'No matching player data for position' });
      continue;
    }

    const starter = starters[0]!;
    let urgencyScore = 0;
    const notesParts: string[] = [];

    // Depth factor
    if (ids.length === 1) {
      urgencyScore += 2;
      notesParts.push('No depth behind starter');
    }

    // Rating vs league average
    const avgRating = defaults[pos] ?? 70;
    const ratingGap = avgRating - starter.hidden.trueOverall;
    if (ratingGap > 15) {
      urgencyScore += 3;
      notesParts.push(`Starter rated ${ratingGap.toFixed(0)} points below league average`);
    } else if (ratingGap > 5) {
      urgencyScore += 1;
      notesParts.push(`Starter slightly below league average`);
    }

    // Age factor
    const peakWindow = POSITION_PEAK_AGE[pos];
    if (peakWindow && starter.age > peakWindow.end) {
      urgencyScore += 2;
      notesParts.push(`Starter age ${starter.age} past peak window (${peakWindow.end})`);
    } else if (peakWindow && starter.age === peakWindow.end) {
      urgencyScore += 1;
      notesParts.push('Starter at edge of peak window');
    }

    // Contract factor
    if (starter.contract && starter.contract.yearsRemaining <= 1) {
      urgencyScore += 1;
      notesParts.push('Starter on expiring contract');
    }

    const urgency = scoreToUrgency(urgencyScore);
    if (urgency !== 'low' || notesParts.length > 0) {
      needs.push({
        position: pos,
        urgency,
        notes: notesParts.length > 0 ? notesParts.join('; ') : 'Adequate',
      });
    }
  }

  needs.sort((a, b) => urgencyRank(b.urgency) - urgencyRank(a.urgency));
  return needs;
}

// ── Event Emission ─────────────────────────────────────────────────

/**
 * Emit ROSTER_NEED_IDENTIFIED for every need at 'high' or 'critical' urgency.
 */
export function produceNeedEvents(
  needs: RosterNeed[],
  teamId: TeamId,
  bus: EventBus<GameEventMap>,
): void {
  for (const need of needs) {
    if (need.urgency === 'high' || need.urgency === 'critical') {
      bus.emit('ROSTER_NEED_IDENTIFIED', {
        teamId,
        position: need.position,
        urgency: need.urgency,
      });
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function scoreToUrgency(score: number): NeedUrgency {
  if (score >= 5) return 'critical';
  if (score >= 3) return 'high';
  if (score >= 1) return 'medium';
  return 'low';
}

function urgencyRank(u: NeedUrgency): number {
  switch (u) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
  }
}
