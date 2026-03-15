import { describe, it, expect } from 'vitest';
import { simulateGame } from '../../src/sim/GameSim.js';
import type { TeamStrength } from '../../src/sim/TeamStrength.js';
import type { TeamId } from '../../src/types/ids.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';

function makeStrength(
  teamId: string,
  overrides: Partial<TeamStrength> = {},
): TeamStrength & { teamId: TeamId } {
  return {
    overall: 70,
    offense: 70,
    defense: 70,
    specialTeams: 60,
    coaching: 5,
    homeFieldAdvantage: 3,
    ...overrides,
    teamId: teamId as TeamId,
  };
}

describe('GameSim', () => {
  describe('determinism', () => {
    it('produces identical results for the same seed', () => {
      const home = makeStrength('home');
      const away = makeStrength('away');

      const result1 = simulateGame(home, away, 12345);
      const result2 = simulateGame(home, away, 12345);

      expect(result1.homeScore).toBe(result2.homeScore);
      expect(result1.awayScore).toBe(result2.awayScore);
      expect(result1.playByPlay.length).toBe(result2.playByPlay.length);
      expect(result1.injuries.length).toBe(result2.injuries.length);
    });

    it('produces different results for different seeds', () => {
      const home = makeStrength('home');
      const away = makeStrength('away');

      const result1 = simulateGame(home, away, 100);
      const result2 = simulateGame(home, away, 200);

      const different =
        result1.homeScore !== result2.homeScore ||
        result1.awayScore !== result2.awayScore;
      expect(different).toBe(true);
    });
  });

  describe('score distribution', () => {
    it('produces realistic average scores over 1000 simulations', () => {
      const home = makeStrength('home');
      const away = makeStrength('away');

      let totalHome = 0;
      let totalAway = 0;

      for (let i = 1; i <= 1000; i++) {
        const result = simulateGame(home, away, i);
        totalHome += result.homeScore;
        totalAway += result.awayScore;
        expect(result.homeScore).toBeGreaterThanOrEqual(0);
        expect(result.awayScore).toBeGreaterThanOrEqual(0);
        expect(result.homeScore).toBeLessThanOrEqual(70);
        expect(result.awayScore).toBeLessThanOrEqual(70);
      }

      const avgHome = totalHome / 1000;
      const avgAway = totalAway / 1000;

      expect(avgHome).toBeGreaterThan(12);
      expect(avgHome).toBeLessThan(35);
      expect(avgAway).toBeGreaterThan(12);
      expect(avgAway).toBeLessThan(35);
    });
  });

  describe('play-by-play', () => {
    it('generates a non-empty play-by-play log', () => {
      const home = makeStrength('home');
      const away = makeStrength('away');
      const result = simulateGame(home, away, 42);

      expect(result.playByPlay.length).toBeGreaterThan(0);
      expect(result.playByPlay.length).toBeLessThanOrEqual(40);
    });

    it('each entry has required fields', () => {
      const home = makeStrength('home');
      const away = makeStrength('away');
      const result = simulateGame(home, away, 99);

      for (const entry of result.playByPlay) {
        expect(entry.quarter).toBeGreaterThanOrEqual(1);
        expect(entry.quarter).toBeLessThanOrEqual(4);
        expect(typeof entry.time).toBe('string');
        expect(entry.time).toMatch(/^\d+:\d{2}$/);
        expect(typeof entry.description).toBe('string');
        expect(entry.description.length).toBeGreaterThan(0);
        expect(typeof entry.impact).toBe('string');
        expect(typeof entry.scoreHome).toBe('number');
        expect(typeof entry.scoreAway).toBe('number');
      }
    });

    it('includes key moments', () => {
      const home = makeStrength('home');
      const away = makeStrength('away');
      const result = simulateGame(home, away, 42);

      expect(result.keyMoments.length).toBeGreaterThan(0);
      for (const moment of result.keyMoments) {
        expect(['touchdown', 'turnover', 'injury']).toContain(moment.impact);
      }
    });
  });

  describe('home field advantage', () => {
    it('home team wins more than 50% over many simulations', () => {
      const home = makeStrength('home');
      const away = makeStrength('away');

      let homeWins = 0;
      const N = 1000;

      for (let i = 1; i <= N; i++) {
        const result = simulateGame(home, away, i * 7);
        if (result.homeScore > result.awayScore) homeWins++;
      }

      const homeWinRate = homeWins / N;
      expect(homeWinRate).toBeGreaterThan(0.50);
    });
  });

  describe('weather effects', () => {
    it('rain/snow games produce lower average scores', () => {
      const home = makeStrength('home');
      const away = makeStrength('away');

      let clearTotal = 0;
      let rainTotal = 0;
      const N = 500;

      for (let i = 1; i <= N; i++) {
        const clear = simulateGame(home, away, i, { weather: 'clear' });
        clearTotal += clear.homeScore + clear.awayScore;
        const rain = simulateGame(home, away, i + 100000, { weather: 'rain' });
        rainTotal += rain.homeScore + rain.awayScore;
      }

      expect(rainTotal / N).toBeLessThan(clearTotal / N);
    });
  });

  describe('event bus integration', () => {
    it('emits GAME_RESULT when eventBus and week are provided', () => {
      const bus = new EventBus<GameEventMap>();
      const results: unknown[] = [];
      bus.on('GAME_RESULT', (payload) => results.push(payload));

      const home = makeStrength('home');
      const away = makeStrength('away');

      simulateGame(home, away, 42, {
        eventBus: bus,
        week: { season: 2025, week: 1, phase: 'regular' },
      });

      expect(results.length).toBe(1);
    });
  });

  describe('time of possession', () => {
    it('time of possession sums to roughly 3600 seconds', () => {
      const home = makeStrength('home');
      const away = makeStrength('away');
      const result = simulateGame(home, away, 42);

      const total = result.timeOfPossession.home + result.timeOfPossession.away;
      expect(total).toBeGreaterThan(3000);
      expect(total).toBeLessThan(4200);
    });
  });

  describe('strong vs weak team', () => {
    it('strong team wins significantly more often', () => {
      const strong = makeStrength('strong', {
        overall: 90, offense: 90, defense: 90, coaching: 9,
      });
      const weak = makeStrength('weak', {
        overall: 40, offense: 40, defense: 40, coaching: 2,
      });

      let strongWins = 0;
      const N = 500;

      for (let i = 1; i <= N; i++) {
        const result = simulateGame(strong, weak, i);
        if (result.homeScore > result.awayScore) strongWins++;
      }

      expect(strongWins / N).toBeGreaterThan(0.60);
    });
  });
});
