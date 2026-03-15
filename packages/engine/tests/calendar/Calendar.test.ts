import { describe, it, expect } from 'vitest';
import { CalendarEngine } from '../../src/calendar/Calendar.js';
import type { LeaguePhase } from '../../src/types/league.js';

const ALL_PHASES: LeaguePhase[] = [
  'offseason_start', 'coaching_carousel', 'senior_bowl', 'combine',
  'pro_days', 'free_agency_tampering', 'free_agency', 'draft',
  'post_draft', 'otas', 'minicamp', 'training_camp', 'preseason',
  'roster_cuts', 'regular_season', 'trade_deadline', 'bye_week',
  'playoffs_wildcard', 'playoffs_divisional', 'playoffs_conference',
  'super_bowl', 'pro_bowl',
];

describe('CalendarEngine', () => {
  const engine = new CalendarEngine();

  describe('getFullCalendar', () => {
    it('returns events for all LeaguePhase values', () => {
      const calendar = engine.getFullCalendar(2025);
      const phases = new Set(calendar.map((e) => e.phase));

      for (const phase of ALL_PHASES) {
        expect(phases.has(phase)).toBe(true);
      }
    });

    it('returns a non-empty calendar', () => {
      const calendar = engine.getFullCalendar(2025);
      expect(calendar.length).toBeGreaterThan(20);
    });

    it('each event has required fields', () => {
      const calendar = engine.getFullCalendar(2025);

      for (const event of calendar) {
        expect(typeof event.phase).toBe('string');
        expect(typeof event.week).toBe('number');
        expect(typeof event.label).toBe('string');
        expect(event.label.length).toBeGreaterThan(0);
        expect(typeof event.description).toBe('string');
        expect(event.description.length).toBeGreaterThan(0);
        expect(typeof event.isDeadline).toBe('boolean');
        expect(typeof event.requiresUserAction).toBe('boolean');
        expect(typeof event.autoSimulable).toBe('boolean');
      }
    });

    it('includes deadline events', () => {
      const calendar = engine.getFullCalendar(2025);
      const deadlines = calendar.filter((e) => e.isDeadline);
      expect(deadlines.length).toBeGreaterThan(0);
    });
  });

  describe('getCurrentEvent', () => {
    it('returns offseason_start for week 1', () => {
      const event = engine.getCurrentEvent(2025, 1);
      expect(event.phase).toBe('offseason_start');
      expect(event.week).toBe(1);
    });

    it('returns regular_season for week 30', () => {
      const event = engine.getCurrentEvent(2025, 30);
      expect(event.phase).toBe('regular_season');
    });

    it('returns trade_deadline for week 33', () => {
      const event = engine.getCurrentEvent(2025, 33);
      expect(event.phase).toBe('trade_deadline');
    });

    it('returns super_bowl for week 45', () => {
      const event = engine.getCurrentEvent(2025, 45);
      expect(event.phase).toBe('super_bowl');
    });

    it('returns pro_bowl for week 46', () => {
      const event = engine.getCurrentEvent(2025, 46);
      expect(event.phase).toBe('pro_bowl');
    });

    it('returns a fallback for out-of-range weeks', () => {
      const event = engine.getCurrentEvent(2025, 99);
      expect(event.phase).toBe('offseason_start');
    });
  });

  describe('getAdvancePreview', () => {
    it('returns valid preview data', () => {
      const preview = engine.getAdvancePreview(2025, 1);

      expect(typeof preview.nextPhase).toBe('string');
      expect(preview.nextWeek).toBe(2);
      expect(Array.isArray(preview.upcomingEvents)).toBe(true);
      expect(preview.upcomingEvents.length).toBeGreaterThan(0);
      expect(typeof preview.pendingDecisions).toBe('number');
      expect(typeof preview.gamesThisWeek).toBe('number');
      expect(typeof preview.tradeOffersPending).toBe('number');
      expect(typeof preview.injuryUpdates).toBe('number');
    });

    it('shows games for regular season weeks', () => {
      const preview = engine.getAdvancePreview(2025, 30);
      expect(preview.gamesThisWeek).toBeGreaterThan(0);
    });

    it('shows no games for offseason weeks', () => {
      const preview = engine.getAdvancePreview(2025, 1);
      expect(preview.gamesThisWeek).toBe(0);
    });

    it('next phase for coaching_carousel week leads forward', () => {
      const preview = engine.getAdvancePreview(2025, 3);
      expect(preview.nextWeek).toBe(4);
    });
  });

  describe('canBatchAdvance', () => {
    it('returns true for auto-simulable range (OTAs and minicamp)', () => {
      const canBatch = engine.canBatchAdvance(14, 16);
      expect(canBatch).toBe(true);
    });

    it('returns false when range includes non-auto-simulable events', () => {
      const canBatch = engine.canBatchAdvance(7, 10);
      expect(canBatch).toBe(false);
    });

    it('returns true for a single auto-simulable week', () => {
      const canBatch = engine.canBatchAdvance(1, 1);
      expect(canBatch).toBe(true);
    });

    it('returns false for draft weeks', () => {
      const canBatch = engine.canBatchAdvance(10, 12);
      expect(canBatch).toBe(false);
    });
  });

  describe('getNextInterestingEvent', () => {
    it('skips auto-simulable weeks', () => {
      const event = engine.getNextInterestingEvent(2025, 1);
      expect(event.requiresUserAction || event.phase === 'preseason' || event.phase === 'regular_season').toBe(true);
      expect(event.week).toBeGreaterThan(1);
    });

    it('from offseason, finds coaching carousel', () => {
      const event = engine.getNextInterestingEvent(2025, 1);
      expect(event.phase).toBe('coaching_carousel');
      expect(event.week).toBe(2);
    });

    it('from after OTAs, finds training camp', () => {
      const event = engine.getNextInterestingEvent(2025, 16);
      expect(event.phase).toBe('training_camp');
      expect(event.week).toBe(17);
    });

    it('returns current event if nothing interesting ahead', () => {
      const event = engine.getNextInterestingEvent(2025, 46);
      expect(event.phase).toBe('pro_bowl');
    });
  });
});
