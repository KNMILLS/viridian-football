import { describe, it, expect } from 'vitest';
import { generateLeague } from '../../src/league/LeagueGenerator.js';

describe('generateLeague', () => {
  it('generates 32 teams', () => {
    const { teams } = generateLeague(42);
    expect(teams).toHaveLength(32);
  });

  it('produces deterministic output for the same seed', () => {
    const league1 = generateLeague(42);
    const league2 = generateLeague(42);

    expect(league1.teams.map(t => t.name)).toEqual(league2.teams.map(t => t.name));
    expect(league1.players.length).toBe(league2.players.length);
    expect(league1.players[0]?.firstName).toBe(league2.players[0]?.firstName);
    expect(league1.players[0]?.physical.speed).toBe(league2.players[0]?.physical.speed);
  });

  it('produces different output for different seeds', () => {
    const league1 = generateLeague(42);
    const league2 = generateLeague(99);

    expect(league1.players[0]?.firstName).not.toBe(league2.players[0]?.firstName);
  });

  it('generates ~53 players per team', () => {
    const { teams, players } = generateLeague(42);
    const totalExpected = 32 * 53;
    expect(players.length).toBe(totalExpected);

    for (const team of teams) {
      expect(team.roster.length).toBe(53);
    }
  });

  it('every player has a contract', () => {
    const { players, contracts } = generateLeague(42);

    for (const player of players) {
      expect(player.contract).not.toBeNull();
    }
    expect(contracts.length).toBe(players.length);
  });

  it('generates coaching staff for every team', () => {
    const { teams, coaches } = generateLeague(42);

    for (const team of teams) {
      expect(team.headCoachId).not.toBeNull();
      expect(team.coachingStaff.length).toBe(11); // HC + OC + DC + STC + 7 position coaches
    }

    expect(coaches.length).toBe(32 * 11);
  });

  it('generates draft picks (7 rounds x 32 teams)', () => {
    const { draftPicks } = generateLeague(42);
    expect(draftPicks.length).toBe(7 * 32);
  });

  it('has correct conference/division structure', () => {
    const { teams } = generateLeague(42);

    const afcTeams = teams.filter(t => t.conference === 'AFC');
    const nfcTeams = teams.filter(t => t.conference === 'NFC');
    expect(afcTeams.length).toBe(16);
    expect(nfcTeams.length).toBe(16);

    const divisions = new Set(teams.map(t => t.division));
    expect(divisions.size).toBe(8);

    for (const div of divisions) {
      const divTeams = teams.filter(t => t.division === div);
      expect(divTeams.length).toBe(4);
    }
  });

  it('player ratings are within valid range', () => {
    const { players } = generateLeague(42);

    for (const player of players) {
      expect(player.physical.speed).toBeGreaterThanOrEqual(25);
      expect(player.physical.speed).toBeLessThanOrEqual(99);
      expect(player.personality.ego).toBeGreaterThanOrEqual(10);
      expect(player.personality.ego).toBeLessThanOrEqual(90);
      expect(player.age).toBeGreaterThanOrEqual(22);
      expect(player.age).toBeLessThanOrEqual(35);
    }
  });

  it('players with higher trueOverall have higher physical ratings on average', () => {
    const { players } = generateLeague(42);

    const highTier = players.filter(p => p.hidden.trueOverall >= 75);
    const lowTier = players.filter(p => p.hidden.trueOverall < 60);

    const avgPhysical = (group: typeof players) => {
      const sum = group.reduce((acc, p) =>
        acc + (p.physical.speed + p.physical.strength + p.physical.agility) / 3, 0);
      return sum / group.length;
    };

    expect(highTier.length).toBeGreaterThan(0);
    expect(lowTier.length).toBeGreaterThan(0);
    expect(avgPhysical(highTier)).toBeGreaterThan(avgPhysical(lowTier));
  });
});
