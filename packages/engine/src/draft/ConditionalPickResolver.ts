import type { DraftPick, PickCondition } from '../types/draft.js';
import type { PlayerId, TeamId } from '../types/ids.js';

export interface SeasonData {
  proBowlPlayers: Set<PlayerId>;
  playerSnapPercentages: Map<PlayerId, number>;
  playerGamesStarted: Map<PlayerId, number>;
  playoffTeams: Set<TeamId>;
  playerStats: Map<PlayerId, Record<string, number>>;
}

export function resolveConditions(picks: DraftPick[], seasonData: SeasonData): DraftPick[] {
  return picks.map(pick => {
    if (!pick.isConditional || pick.conditions.length === 0) {
      return pick;
    }

    let bestRound: number | null = null;

    for (const condition of pick.conditions) {
      if (evaluateCondition(condition, seasonData)) {
        const upgrade = condition.upgradeTo;
        if (bestRound === null || upgrade < bestRound) {
          bestRound = upgrade;
        }
      }
    }

    return {
      ...pick,
      resolvedRound: bestRound ?? pick.round,
    };
  });
}

function evaluateCondition(condition: PickCondition, data: SeasonData): boolean {
  switch (condition.kind) {
    case 'pro_bowl':
      return data.proBowlPlayers.has(condition.playerId);

    case 'snap_percentage': {
      const snaps = data.playerSnapPercentages.get(condition.playerId);
      return snaps !== undefined && snaps >= condition.threshold;
    }

    case 'games_started': {
      const games = data.playerGamesStarted.get(condition.playerId);
      return games !== undefined && games >= condition.threshold;
    }

    case 'playoff_appearance':
      return data.playoffTeams.has(condition.teamId);

    case 'stat_threshold': {
      const stats = data.playerStats.get(condition.playerId);
      if (!stats) return false;
      const value = stats[condition.stat];
      return value !== undefined && value >= condition.threshold;
    }
  }
}
