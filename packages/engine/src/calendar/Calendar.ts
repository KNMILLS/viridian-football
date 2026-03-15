import type { LeaguePhase } from '../types/league.js';
import type { CalendarEvent, AdvancePreview, ICalendarEngine } from '../types/calendar.js';

// ── Phase-to-week mapping ──────────────────────────────────────────

interface PhaseDefinition {
  phase: LeaguePhase;
  startWeek: number;
  endWeek: number;
  label: string;
  description: string;
  isDeadline: boolean;
  requiresUserAction: boolean;
  autoSimulable: boolean;
}

const PHASE_DEFINITIONS: PhaseDefinition[] = [
  { phase: 'offseason_start', startWeek: 1, endWeek: 1, label: 'Black Monday', description: 'Season is over. Coaching changes and front office decisions begin.', isDeadline: false, requiresUserAction: false, autoSimulable: true },
  { phase: 'coaching_carousel', startWeek: 2, endWeek: 3, label: 'Coaching Carousel', description: 'Teams hire and fire coaches. Review coaching candidates.', isDeadline: false, requiresUserAction: true, autoSimulable: false },
  { phase: 'senior_bowl', startWeek: 4, endWeek: 4, label: 'Senior Bowl', description: 'Top college seniors showcase their skills.', isDeadline: false, requiresUserAction: false, autoSimulable: true },
  { phase: 'combine', startWeek: 5, endWeek: 5, label: 'NFL Combine', description: 'Draft prospects are evaluated with physical and mental tests.', isDeadline: false, requiresUserAction: false, autoSimulable: true },
  { phase: 'pro_days', startWeek: 6, endWeek: 6, label: 'Pro Days', description: 'College programs host individual workouts for scouts.', isDeadline: false, requiresUserAction: false, autoSimulable: true },
  { phase: 'free_agency_tampering', startWeek: 7, endWeek: 7, label: 'Legal Tampering', description: 'Teams may begin negotiating with pending free agents.', isDeadline: true, requiresUserAction: true, autoSimulable: false },
  { phase: 'free_agency', startWeek: 8, endWeek: 9, label: 'Free Agency', description: 'The market opens. Sign free agents to fill roster needs.', isDeadline: false, requiresUserAction: true, autoSimulable: false },
  { phase: 'draft', startWeek: 10, endWeek: 12, label: 'NFL Draft', description: 'Seven rounds of selections. Build your future.', isDeadline: false, requiresUserAction: true, autoSimulable: false },
  { phase: 'post_draft', startWeek: 13, endWeek: 13, label: 'Post-Draft / UDFA', description: 'Sign undrafted free agents to fill remaining roster spots.', isDeadline: false, requiresUserAction: true, autoSimulable: false },
  { phase: 'otas', startWeek: 14, endWeek: 15, label: 'OTAs', description: 'Organized team activities. Voluntary workouts and scheme installation.', isDeadline: false, requiresUserAction: false, autoSimulable: true },
  { phase: 'minicamp', startWeek: 16, endWeek: 16, label: 'Minicamp', description: 'Mandatory minicamp. Players must attend.', isDeadline: false, requiresUserAction: false, autoSimulable: true },
  { phase: 'training_camp', startWeek: 17, endWeek: 19, label: 'Training Camp', description: 'Full team practices and roster battles begin.', isDeadline: false, requiresUserAction: true, autoSimulable: false },
  { phase: 'preseason', startWeek: 20, endWeek: 22, label: 'Preseason Games', description: 'Exhibition games to evaluate roster depth.', isDeadline: false, requiresUserAction: false, autoSimulable: true },
  { phase: 'roster_cuts', startWeek: 23, endWeek: 23, label: 'Roster Cuts', description: 'Trim the roster from 90 to 53 players.', isDeadline: true, requiresUserAction: true, autoSimulable: false },
  { phase: 'regular_season', startWeek: 24, endWeek: 41, label: 'Regular Season', description: '18-week regular season. Compete for playoff positioning.', isDeadline: false, requiresUserAction: false, autoSimulable: false },
  { phase: 'trade_deadline', startWeek: 33, endWeek: 33, label: 'Trade Deadline', description: 'Last chance to make trades this season.', isDeadline: true, requiresUserAction: true, autoSimulable: false },
  { phase: 'playoffs_wildcard', startWeek: 42, endWeek: 42, label: 'Wild Card Round', description: 'Six playoff games. Win or go home.', isDeadline: false, requiresUserAction: false, autoSimulable: false },
  { phase: 'playoffs_divisional', startWeek: 43, endWeek: 43, label: 'Divisional Round', description: 'Four games. The road to the championship narrows.', isDeadline: false, requiresUserAction: false, autoSimulable: false },
  { phase: 'playoffs_conference', startWeek: 44, endWeek: 44, label: 'Conference Championships', description: 'Two games decide who plays in the Super Bowl.', isDeadline: false, requiresUserAction: false, autoSimulable: false },
  { phase: 'super_bowl', startWeek: 45, endWeek: 45, label: 'Super Bowl', description: 'The championship game. Winner takes all.', isDeadline: false, requiresUserAction: false, autoSimulable: false },
  { phase: 'pro_bowl', startWeek: 46, endWeek: 46, label: 'Pro Bowl', description: 'All-star exhibition game.', isDeadline: false, requiresUserAction: false, autoSimulable: true },
];

const GAME_PHASES: Set<LeaguePhase> = new Set([
  'preseason', 'regular_season', 'playoffs_wildcard',
  'playoffs_divisional', 'playoffs_conference', 'super_bowl',
]);

// ── Helpers ────────────────────────────────────────────────────────

function getDefinitionForWeek(week: number): PhaseDefinition | undefined {
  const tradeDeadline = PHASE_DEFINITIONS.find(
    (p) => p.phase === 'trade_deadline' && week >= p.startWeek && week <= p.endWeek,
  );
  if (tradeDeadline) return tradeDeadline;

  return PHASE_DEFINITIONS.find(
    (p) => p.phase !== 'trade_deadline' && week >= p.startWeek && week <= p.endWeek,
  );
}

function defToEvent(def: PhaseDefinition, week: number): CalendarEvent {
  return {
    phase: def.phase,
    week,
    label: def.label,
    description: def.description,
    isDeadline: def.isDeadline,
    requiresUserAction: def.requiresUserAction,
    autoSimulable: def.autoSimulable,
  };
}

// ── Calendar Engine ────────────────────────────────────────────────

export class CalendarEngine implements ICalendarEngine {
  getFullCalendar(season: number): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const maxWeek = 46;

    for (let w = 1; w <= maxWeek; w++) {
      const def = getDefinitionForWeek(w);
      if (def) {
        events.push(defToEvent(def, w));
      }
    }

    const byeEvent: CalendarEvent = {
      phase: 'bye_week',
      week: 0,
      label: 'Bye Week',
      description: 'Teams on bye rest for the week.',
      isDeadline: false,
      requiresUserAction: false,
      autoSimulable: true,
    };
    events.push(byeEvent);

    return events;
  }

  getCurrentEvent(season: number, week: number): CalendarEvent {
    const def = getDefinitionForWeek(week);
    if (!def) {
      return {
        phase: 'offseason_start',
        week,
        label: 'Offseason',
        description: 'No scheduled events.',
        isDeadline: false,
        requiresUserAction: false,
        autoSimulable: true,
      };
    }
    return defToEvent(def, week);
  }

  getAdvancePreview(season: number, week: number): AdvancePreview {
    const nextWeek = week + 1;
    const nextDef = getDefinitionForWeek(nextWeek);
    const nextPhase: LeaguePhase = nextDef?.phase ?? 'offseason_start';

    const upcomingEvents: string[] = [];
    for (let w = nextWeek; w <= Math.min(nextWeek + 2, 46); w++) {
      const d = getDefinitionForWeek(w);
      if (d) upcomingEvents.push(d.label);
    }

    const currentDef = getDefinitionForWeek(week);
    const hasGames = currentDef ? GAME_PHASES.has(currentDef.phase) : false;
    const gamesThisWeek = hasGames ? 16 : 0;

    const pendingDecisions = currentDef?.requiresUserAction ? 1 : 0;

    return {
      nextPhase,
      nextWeek,
      upcomingEvents,
      pendingDecisions,
      gamesThisWeek,
      tradeOffersPending: 0,
      injuryUpdates: 0,
    };
  }

  canBatchAdvance(fromWeek: number, toWeek: number): boolean {
    for (let w = fromWeek; w <= toWeek; w++) {
      const def = getDefinitionForWeek(w);
      if (!def) continue;
      if (!def.autoSimulable) return false;
    }
    return true;
  }

  getNextInterestingEvent(season: number, week: number): CalendarEvent {
    const maxWeek = 46;
    for (let w = week + 1; w <= maxWeek; w++) {
      const def = getDefinitionForWeek(w);
      if (!def) continue;
      if (def.requiresUserAction || GAME_PHASES.has(def.phase)) {
        return defToEvent(def, w);
      }
    }

    return this.getCurrentEvent(season, week);
  }
}
