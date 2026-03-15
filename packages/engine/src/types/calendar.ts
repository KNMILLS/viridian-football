import type { LeaguePhase } from './league.js';

// ── Calendar Event ──────────────────────────────────────────────────

export interface CalendarEvent {
  phase: LeaguePhase;
  week: number;
  label: string;
  description: string;
  isDeadline: boolean;
  requiresUserAction: boolean;
  autoSimulable: boolean;      // can be batched in "quiet period" advance
}

// ── Advance Preview ─────────────────────────────────────────────────
// Shown in the "Continue" button tooltip before advancing.

export interface AdvancePreview {
  nextPhase: LeaguePhase;
  nextWeek: number;
  upcomingEvents: string[];
  pendingDecisions: number;
  gamesThisWeek: number;
  tradeOffersPending: number;
  injuryUpdates: number;
}

// ── Calendar Engine Interface ───────────────────────────────────────

export interface ICalendarEngine {
  getFullCalendar(season: number): CalendarEvent[];
  getCurrentEvent(season: number, week: number): CalendarEvent;
  getAdvancePreview(season: number, week: number): AdvancePreview;
  canBatchAdvance(fromWeek: number, toWeek: number): boolean;
  getNextInterestingEvent(season: number, week: number): CalendarEvent;
}
