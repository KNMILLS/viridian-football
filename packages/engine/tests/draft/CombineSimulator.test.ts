import { describe, it, expect } from 'vitest';
import { generateDraftClass } from '../../src/draft/DraftClassGenerator.js';
import { runCombine, runProDay } from '../../src/draft/CombineSimulator.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';
import { teamId } from '../../src/types/ids.js';

function getProspects(seed = 42, count = 20) {
  return generateDraftClass(2025, seed).slice(0, count);
}

describe('CombineSimulator', () => {
  describe('runCombine', () => {
    it('generates results for all participants', () => {
      const prospects = getProspects();
      const event = runCombine(prospects, 2025, 42);

      expect(event.participants.length).toBe(prospects.length);
      expect(event.results.size).toBe(prospects.length);

      for (const prospect of prospects) {
        expect(event.results.has(prospect.id)).toBe(true);
      }
    });

    it('is deterministic', () => {
      const prospects1 = getProspects(42);
      const prospects2 = getProspects(42);

      const event1 = runCombine(prospects1, 2025, 42);
      const event2 = runCombine(prospects2, 2025, 42);

      for (const p of prospects1) {
        const r1 = event1.results.get(p.id)!;
        const r2 = event2.results.get(p.id)!;
        expect(r1.fortyYardDash).toBe(r2.fortyYardDash);
        expect(r1.benchPress).toBe(r2.benchPress);
        expect(r1.verticalJump).toBe(r2.verticalJump);
      }
    });

    it('faster players have better 40-yard dash times', () => {
      const prospects = generateDraftClass(2025, 42);
      const event = runCombine(prospects, 2025, 42);

      const fastPlayers = prospects.filter(p => p.physical.speed > 80);
      const slowPlayers = prospects.filter(p => p.physical.speed < 40);

      if (fastPlayers.length > 0 && slowPlayers.length > 0) {
        const avgFast = fastPlayers.reduce((sum, p) => {
          const r = event.results.get(p.id)!;
          return sum + (r.fortyYardDash ?? 5.0);
        }, 0) / fastPlayers.length;

        const avgSlow = slowPlayers.reduce((sum, p) => {
          const r = event.results.get(p.id)!;
          return sum + (r.fortyYardDash ?? 5.0);
        }, 0) / slowPlayers.length;

        expect(avgFast).toBeLessThan(avgSlow);
      }
    });

    it('interviewScore is null by default', () => {
      const prospects = getProspects();
      const event = runCombine(prospects, 2025, 42);

      for (const [, result] of event.results) {
        expect(result.interviewScore).toBeNull();
      }
    });

    it('narrows prospect scouting gradeRange', () => {
      const prospects = getProspects(42, 5);
      const gradeWidthsBefore = prospects.map(p =>
        p.scoutingReport.gradeRange[1] - p.scoutingReport.gradeRange[0],
      );

      runCombine(prospects, 2025, 42);

      const gradeWidthsAfter = prospects.map(p =>
        p.scoutingReport.gradeRange[1] - p.scoutingReport.gradeRange[0],
      );

      let anyNarrowed = false;
      for (let i = 0; i < prospects.length; i++) {
        if (gradeWidthsAfter[i]! < gradeWidthsBefore[i]!) {
          anyNarrowed = true;
          break;
        }
      }
      expect(anyNarrowed).toBe(true);
    });

    it('sets combineResults on prospect', () => {
      const prospects = getProspects(42, 3);
      runCombine(prospects, 2025, 42);

      for (const prospect of prospects) {
        expect(prospect.combineResults).toBeDefined();
        expect(prospect.combineResults!.benchPress).toBeTypeOf('number');
      }
    });

    it('emits SCOUTING_REPORT_UPDATED events via bus', () => {
      const bus = new EventBus<GameEventMap>();
      const events: unknown[] = [];
      bus.on('SCOUTING_REPORT_UPDATED', (p) => events.push(p));

      const prospects = getProspects(42, 5);
      const tid = teamId('team-1');
      runCombine(prospects, 2025, 42, bus, tid);

      expect(events.length).toBe(5);
    });
  });

  describe('runProDay', () => {
    it('produces single-player results', () => {
      const prospect = getProspects(42, 1)[0]!;
      const result = runProDay(prospect, 42);

      expect(result.prospectId).toBe(prospect.id);
      expect(result.fortyYardDash).toBeTypeOf('number');
      expect(result.benchPress).toBeTypeOf('number');
      expect(result.verticalJump).toBeTypeOf('number');
      expect(result.broadJump).toBeTypeOf('number');
      expect(result.threeConeDrill).toBeTypeOf('number');
      expect(result.twentyYardShuttle).toBeTypeOf('number');
      expect(result.interviewScore).toBeNull();
    });
  });
});
