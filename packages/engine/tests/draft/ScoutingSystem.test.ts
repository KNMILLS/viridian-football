import { describe, it, expect } from 'vitest';
import { generateDraftClass } from '../../src/draft/DraftClassGenerator.js';
import { generateInitialReport, conductScoutingVisit } from '../../src/draft/ScoutingSystem.js';
import { EventBus } from '../../src/events/EventBus.js';
import type { GameEventMap } from '../../src/events/GameEvents.js';
import { teamId } from '../../src/types/ids.js';

function getProspect(seed = 42) {
  const prospects = generateDraftClass(2025, seed);
  return prospects[0]!;
}

describe('ScoutingSystem', () => {
  describe('generateInitialReport', () => {
    it('produces a wide gradeRange', () => {
      const prospect = getProspect();
      const report = generateInitialReport(prospect, 3, 100);
      const width = report.gradeRange[1] - report.gradeRange[0];
      expect(width).toBeGreaterThan(1.0);
    });

    it('higher analyticsLevel produces tighter initial range', () => {
      const prospect = getProspect();
      const low = generateInitialReport(prospect, 1, 100);
      const high = generateInitialReport(prospect, 5, 100);

      const lowWidth = low.gradeRange[1] - low.gradeRange[0];
      const highWidth = high.gradeRange[1] - high.gradeRange[0];
      expect(highWidth).toBeLessThan(lowWidth);
    });

    it('starts with null overallGrade and zero investment', () => {
      const prospect = getProspect();
      const report = generateInitialReport(prospect, 3, 100);
      expect(report.overallGrade).toBeNull();
      expect(report.scoutingInvestment).toBe(0);
      expect(report.confidenceLevel).toBe(0);
    });

    it('is deterministic', () => {
      const prospect = getProspect();
      const r1 = generateInitialReport(prospect, 3, 100);
      const r2 = generateInitialReport(prospect, 3, 100);
      expect(r1.gradeRange).toEqual(r2.gradeRange);
      expect(r1.schemeFitGrades.length).toBe(r2.schemeFitGrades.length);
    });
  });

  describe('conductScoutingVisit', () => {
    it('film review narrows gradeRange', () => {
      const prospect = getProspect();
      const initial = generateInitialReport(prospect, 3, 100);
      const initialWidth = initial.gradeRange[1] - initial.gradeRange[0];

      const updated = conductScoutingVisit(prospect, initial, 'film_review', 200);
      const updatedWidth = updated.gradeRange[1] - updated.gradeRange[0];

      expect(updatedWidth).toBeLessThan(initialWidth);
    });

    it('interview reveals characterGrade', () => {
      const prospect = getProspect();
      const initial = generateInitialReport(prospect, 3, 100);
      expect(initial.characterGrade).toBeNull();

      const updated = conductScoutingVisit(prospect, initial, 'formal_interview', 200);
      expect(updated.characterGrade).not.toBeNull();
      expect(['green', 'yellow', 'red']).toContain(updated.characterGrade);
    });

    it('medical check reveals medicalFlag', () => {
      const prospect = getProspect();
      const initial = generateInitialReport(prospect, 3, 100);
      expect(initial.medicalFlag).toBeNull();

      const updated = conductScoutingVisit(prospect, initial, 'medical_check', 200);
      expect(updated.medicalFlag).not.toBeNull();
      expect(['clear', 'minor_concern', 'major_concern']).toContain(updated.medicalFlag);
    });

    it('investment increases with each visit, capped at 100', () => {
      const prospect = getProspect();
      let report = generateInitialReport(prospect, 3, 100);
      expect(report.scoutingInvestment).toBe(0);

      for (let i = 0; i < 12; i++) {
        report = conductScoutingVisit(prospect, report, 'film_review', 200 + i);
      }

      expect(report.scoutingInvestment).toBeLessThanOrEqual(100);
      expect(report.scoutingInvestment).toBeGreaterThan(60);
    });

    it('reveals overallGrade when confidence exceeds 70', () => {
      const prospect = getProspect();
      let report = generateInitialReport(prospect, 5, 100);

      const visits = [
        'film_review', 'film_review', 'campus_visit',
        'private_workout', 'formal_interview', 'medical_check',
        'background_check', 'film_review', 'film_review',
      ] as const;

      for (let i = 0; i < visits.length; i++) {
        report = conductScoutingVisit(prospect, report, visits[i]!, 300 + i);
      }

      if (report.confidenceLevel >= 70) {
        expect(report.overallGrade).not.toBeNull();
        const validGrades = [9.0, 8.0, 7.0, 6.5, 6.0, 5.5, 5.0, 4.0];
        expect(validGrades).toContain(report.overallGrade);
      }
    });

    it('comparisonPlayer appears at confidence > 50', () => {
      const prospect = getProspect();
      let report = generateInitialReport(prospect, 4, 100);

      for (let i = 0; i < 6; i++) {
        report = conductScoutingVisit(prospect, report, 'film_review', 400 + i);
      }

      if (report.confidenceLevel > 50) {
        expect(report.comparisonPlayer).not.toBeNull();
        expect(report.comparisonPlayer).toContain('Plays like');
      }
    });

    it('is deterministic with same inputs', () => {
      const prospect = getProspect();
      const initial = generateInitialReport(prospect, 3, 100);

      const r1 = conductScoutingVisit(prospect, initial, 'film_review', 200);
      const r2 = conductScoutingVisit(prospect, initial, 'film_review', 200);

      expect(r1.gradeRange).toEqual(r2.gradeRange);
      expect(r1.scoutingInvestment).toBe(r2.scoutingInvestment);
      expect(r1.confidenceLevel).toBe(r2.confidenceLevel);
    });

    it('emits SCOUTING_REPORT_UPDATED event via bus', () => {
      const bus = new EventBus<GameEventMap>();
      const events: unknown[] = [];
      bus.on('SCOUTING_REPORT_UPDATED', (p) => events.push(p));

      const prospect = getProspect();
      const initial = generateInitialReport(prospect, 3, 100);
      const tid = teamId('team-1');

      conductScoutingVisit(prospect, initial, 'film_review', 200, bus, tid);

      expect(events.length).toBe(1);
      expect((events[0] as Record<string, unknown>).playerId).toBe(prospect.id);
      expect((events[0] as Record<string, unknown>).teamId).toBe(tid);
    });
  });
});
