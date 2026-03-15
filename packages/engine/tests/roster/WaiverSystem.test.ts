import { describe, it, expect } from 'vitest';
import { getWaiverOrder, processWaiverClaims } from '../../src/roster/WaiverSystem.js';
import type { TeamStanding } from '../../src/types/league.js';
import type { WaiverClaim } from '../../src/roster/WaiverSystem.js';
import { teamId, playerId } from '../../src/types/ids.js';
import { createLCG } from '../../src/sim/RNG.js';

// ── Helpers ────────────────────────────────────────────────────────

function makeStanding(overrides: Partial<TeamStanding> = {}): TeamStanding {
  return {
    teamId: teamId('t1'),
    wins: 8,
    losses: 9,
    ties: 0,
    winPercentage: 0.471,
    pointsFor: 350,
    pointsAgainst: 370,
    divisionRecord: { wins: 3, losses: 3, ties: 0 },
    conferenceRecord: { wins: 5, losses: 7, ties: 0 },
    streak: { type: 'L', count: 1 },
    playoffSeed: null,
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────

describe('WaiverSystem', () => {
  describe('getWaiverOrder', () => {
    it('returns teams in inverse win-percentage order (worst first)', () => {
      const standings: TeamStanding[] = [
        makeStanding({ teamId: teamId('best'), winPercentage: 0.75 }),
        makeStanding({ teamId: teamId('worst'), winPercentage: 0.25 }),
        makeStanding({ teamId: teamId('mid'), winPercentage: 0.50 }),
      ];

      const order = getWaiverOrder(standings, createLCG(42));
      expect(order[0]).toBe(teamId('worst'));
      expect(order[1]).toBe(teamId('mid'));
      expect(order[2]).toBe(teamId('best'));
    });

    it('resolves tied standings deterministically via RNG', () => {
      const standings: TeamStanding[] = [
        makeStanding({ teamId: teamId('a'), winPercentage: 0.50 }),
        makeStanding({ teamId: teamId('b'), winPercentage: 0.50 }),
        makeStanding({ teamId: teamId('c'), winPercentage: 0.50 }),
      ];

      const order1 = getWaiverOrder(standings, createLCG(42));
      const order2 = getWaiverOrder(standings, createLCG(42));
      expect(order1).toEqual(order2);
    });
  });

  describe('processWaiverClaims', () => {
    it('awards claim to the highest-priority team (lowest priority number)', () => {
      const claims: WaiverClaim[] = [
        { teamId: teamId('low_priority'), priority: 10 },
        { teamId: teamId('high_priority'), priority: 1 },
        { teamId: teamId('mid_priority'), priority: 5 },
      ];

      const result = processWaiverClaims(playerId('p1'), claims, false);
      expect(result.claimedBy).toBe(teamId('high_priority'));
      expect(result.becameFreeAgent).toBe(false);
    });

    it('post-deadline: player becomes free agent regardless of claims', () => {
      const claims: WaiverClaim[] = [
        { teamId: teamId('t1'), priority: 1 },
      ];

      const result = processWaiverClaims(playerId('p1'), claims, true);
      expect(result.claimedBy).toBeNull();
      expect(result.becameFreeAgent).toBe(true);
    });

    it('empty claims list with no post-deadline flag returns no claim and no FA', () => {
      const result = processWaiverClaims(playerId('p1'), [], false);
      expect(result.claimedBy).toBeNull();
      expect(result.becameFreeAgent).toBe(false);
    });
  });
});
