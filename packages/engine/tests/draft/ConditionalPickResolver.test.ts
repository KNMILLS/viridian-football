import { describe, it, expect } from 'vitest';
import { resolveConditions, type SeasonData } from '../../src/draft/ConditionalPickResolver.js';
import type { DraftPick } from '../../src/types/draft.js';
import { playerId, teamId, draftPickId } from '../../src/types/ids.js';

function makePick(overrides: Partial<DraftPick> = {}): DraftPick {
  return {
    id: draftPickId('pick-test'),
    originalTeamId: teamId('team-1'),
    currentTeamId: teamId('team-1'),
    season: 2025,
    round: 4,
    pickInRound: null,
    overall: null,
    isConditional: true,
    conditions: [],
    resolvedRound: null,
    ...overrides,
  };
}

function makeSeasonData(overrides: Partial<SeasonData> = {}): SeasonData {
  return {
    proBowlPlayers: new Set(),
    playerSnapPercentages: new Map(),
    playerGamesStarted: new Map(),
    playoffTeams: new Set(),
    playerStats: new Map(),
    ...overrides,
  };
}

describe('ConditionalPickResolver', () => {
  it('resolves pro_bowl condition correctly', () => {
    const pid = playerId('player-1');
    const pick = makePick({
      conditions: [{ kind: 'pro_bowl', playerId: pid, upgradeTo: 3 }],
    });

    const met = resolveConditions([pick], makeSeasonData({ proBowlPlayers: new Set([pid]) }));
    expect(met[0]!.resolvedRound).toBe(3);

    const notMet = resolveConditions([pick], makeSeasonData());
    expect(notMet[0]!.resolvedRound).toBe(4);
  });

  it('resolves snap_percentage condition correctly', () => {
    const pid = playerId('player-1');
    const pick = makePick({
      conditions: [{ kind: 'snap_percentage', playerId: pid, threshold: 60, upgradeTo: 3 }],
    });

    const met = resolveConditions(
      [pick],
      makeSeasonData({ playerSnapPercentages: new Map([[pid, 75]]) }),
    );
    expect(met[0]!.resolvedRound).toBe(3);

    const notMet = resolveConditions(
      [pick],
      makeSeasonData({ playerSnapPercentages: new Map([[pid, 40]]) }),
    );
    expect(notMet[0]!.resolvedRound).toBe(4);
  });

  it('resolves games_started condition correctly', () => {
    const pid = playerId('player-1');
    const pick = makePick({
      conditions: [{ kind: 'games_started', playerId: pid, threshold: 10, upgradeTo: 2 }],
    });

    const met = resolveConditions(
      [pick],
      makeSeasonData({ playerGamesStarted: new Map([[pid, 12]]) }),
    );
    expect(met[0]!.resolvedRound).toBe(2);

    const notMet = resolveConditions(
      [pick],
      makeSeasonData({ playerGamesStarted: new Map([[pid, 5]]) }),
    );
    expect(notMet[0]!.resolvedRound).toBe(4);
  });

  it('resolves playoff_appearance condition correctly', () => {
    const tid = teamId('team-2');
    const pick = makePick({
      conditions: [{ kind: 'playoff_appearance', teamId: tid, upgradeTo: 3 }],
    });

    const met = resolveConditions(
      [pick],
      makeSeasonData({ playoffTeams: new Set([tid]) }),
    );
    expect(met[0]!.resolvedRound).toBe(3);

    const notMet = resolveConditions([pick], makeSeasonData());
    expect(notMet[0]!.resolvedRound).toBe(4);
  });

  it('resolves stat_threshold condition correctly', () => {
    const pid = playerId('player-1');
    const pick = makePick({
      conditions: [{
        kind: 'stat_threshold', playerId: pid, stat: 'touchdowns', threshold: 10, upgradeTo: 2,
      }],
    });

    const met = resolveConditions(
      [pick],
      makeSeasonData({ playerStats: new Map([[pid, { touchdowns: 14 }]]) }),
    );
    expect(met[0]!.resolvedRound).toBe(2);

    const notMet = resolveConditions(
      [pick],
      makeSeasonData({ playerStats: new Map([[pid, { touchdowns: 5 }]]) }),
    );
    expect(notMet[0]!.resolvedRound).toBe(4);
  });

  it('keeps original round when no conditions met', () => {
    const pid = playerId('player-1');
    const pick = makePick({
      round: 5,
      conditions: [{ kind: 'pro_bowl', playerId: pid, upgradeTo: 3 }],
    });

    const result = resolveConditions([pick], makeSeasonData());
    expect(result[0]!.resolvedRound).toBe(5);
  });

  it('takes the best (lowest) round when multiple conditions met', () => {
    const pid = playerId('player-1');
    const tid = teamId('team-2');
    const pick = makePick({
      round: 5,
      conditions: [
        { kind: 'pro_bowl', playerId: pid, upgradeTo: 3 },
        { kind: 'playoff_appearance', teamId: tid, upgradeTo: 2 },
        { kind: 'games_started', playerId: pid, threshold: 10, upgradeTo: 4 },
      ],
    });

    const result = resolveConditions([pick], makeSeasonData({
      proBowlPlayers: new Set([pid]),
      playoffTeams: new Set([tid]),
      playerGamesStarted: new Map([[pid, 16]]),
    }));

    expect(result[0]!.resolvedRound).toBe(2);
  });

  it('skips non-conditional picks', () => {
    const pick = makePick({
      isConditional: false,
      conditions: [],
      round: 6,
    });

    const result = resolveConditions([pick], makeSeasonData());
    expect(result[0]!.resolvedRound).toBeNull();
  });
});
