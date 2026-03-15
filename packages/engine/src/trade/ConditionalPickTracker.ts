/**
 * Tracks conditional draft pick conditions across seasons and resolves
 * them when criteria are met.
 */

import type { DraftPick, PickCondition } from '../types/draft.js';
import type { DraftPickId, PlayerId, TeamId } from '../types/ids.js';

// ── Season data needed for condition evaluation ─────────────────────

export interface SeasonConditionData {
  season: number;
  proBowlSelections: PlayerId[];
  playerStats: Map<PlayerId, Record<string, number>>;
  playoffTeams: TeamId[];
}

export type ConditionStatus = 'met' | 'not_met' | 'in_progress';

interface TrackedPick {
  pickId: DraftPickId;
  conditions: PickCondition[];
  status: ConditionStatus;
  resolvedRound: number | null;
}

// ── ConditionalPickTracker ──────────────────────────────────────────

export class ConditionalPickTracker {
  private tracked: Map<DraftPickId, TrackedPick> = new Map();

  /** Register conditions to monitor for a given pick. */
  trackCondition(pickId: DraftPickId, conditions: PickCondition[]): void {
    this.tracked.set(pickId, {
      pickId,
      conditions,
      status: 'in_progress',
      resolvedRound: null,
    });
  }

  /** Get current status of a tracked pick's conditions. */
  getConditionStatus(pickId: DraftPickId): ConditionStatus {
    return this.tracked.get(pickId)?.status ?? 'not_met';
  }

  /** Get the resolved round (upgraded) if conditions were met. */
  getResolvedRound(pickId: DraftPickId): number | null {
    return this.tracked.get(pickId)?.resolvedRound ?? null;
  }

  /** Evaluate all tracked conditions against season data. */
  updateProgress(data: SeasonConditionData): void {
    for (const [, tracked] of this.tracked) {
      if (tracked.status !== 'in_progress') continue;

      for (const cond of tracked.conditions) {
        const met = evaluateCondition(cond, data);
        if (met) {
          tracked.status = 'met';
          tracked.resolvedRound = cond.upgradeTo;
          break;
        }
      }
    }
  }

  /** At season end, finalize all remaining in-progress picks as not met. */
  resolveAll(season: number): Map<DraftPickId, { status: ConditionStatus; resolvedRound: number | null }> {
    const results = new Map<DraftPickId, { status: ConditionStatus; resolvedRound: number | null }>();

    for (const [pickId, tracked] of this.tracked) {
      if (tracked.status === 'in_progress') {
        tracked.status = 'not_met';
      }
      results.set(pickId, {
        status: tracked.status,
        resolvedRound: tracked.resolvedRound,
      });
    }

    return results;
  }

  /** Apply resolved conditions to actual draft picks. */
  applyResolutions(draftPicks: DraftPick[]): void {
    for (const pick of draftPicks) {
      const tracked = this.tracked.get(pick.id);
      if (!tracked || tracked.status !== 'met' || tracked.resolvedRound === null) continue;
      pick.resolvedRound = tracked.resolvedRound;
    }
  }

  /** Number of actively tracked picks. */
  get size(): number {
    return this.tracked.size;
  }
}

// ── Condition evaluation ────────────────────────────────────────────

function evaluateCondition(
  condition: PickCondition,
  data: SeasonConditionData,
): boolean {
  switch (condition.kind) {
    case 'pro_bowl':
      return data.proBowlSelections.includes(condition.playerId);

    case 'snap_percentage': {
      const stats = data.playerStats.get(condition.playerId);
      const snapPct = stats?.['snapPercentage'] ?? 0;
      return snapPct >= condition.threshold;
    }

    case 'games_started': {
      const stats = data.playerStats.get(condition.playerId);
      const gs = stats?.['gamesStarted'] ?? 0;
      return gs >= condition.threshold;
    }

    case 'playoff_appearance':
      return data.playoffTeams.includes(condition.teamId);

    case 'stat_threshold': {
      const stats = data.playerStats.get(condition.playerId);
      const val = stats?.[condition.stat] ?? 0;
      return val >= condition.threshold;
    }

    default:
      return false;
  }
}
