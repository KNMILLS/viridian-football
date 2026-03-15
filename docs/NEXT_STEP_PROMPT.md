# Next Step: Single-Agent Development Prompt

**From now on we use only one agent at a time — no parallel multi-agent work.**

Copy the prompt below into a single Cursor Agent chat and run it to completion.

---

## Prompt (copy everything below this line)

You are working on Viridian Football, a pro football GM simulation game. This is a **single-agent** task: complete it fully before any other development. Do not split work across multiple agents.

**CRITICAL DESIGN PRINCIPLES**
1. The user is the GM only — never the coach. Depth chart, play calling, and game plan are coach AI only (see `.cursor/rules/gm-only-scope.mdc`).
2. No hardcoded events. All behaviour emerges from the event bus and system interactions (see `.cursor/rules/zero-hardcoded-events.mdc`).
3. Use the deterministic RNG (`createLCG` from `packages/engine/src/sim/RNG.ts`) for all randomness. Never use `Math.random()`.
4. Follow existing patterns in `packages/engine/src/orchestrator/SeasonOrchestrator.ts` and the Phase 2 modules (draft, trade, roster, analytics).

**YOUR TASK: Integrate Phase 2 modules into the SeasonOrchestrator so the full NFL calendar drives draft, free agency, coaching carousel, and roster operations.**

Right now, `advanceWeek()` only handles **game phases** (simulate games, injury recovery, morale, locker room). Offseason phases like `combine`, `draft`, `free_agency`, `coaching_carousel`, `post_draft`, `training_camp`, and `roster_cuts` do not yet run the corresponding Phase 2 logic. Your job is to wire them.

**Read these first (in order):**
1. `.cursor/rules/project-overview.mdc` and `.cursor/rules/gm-only-scope.mdc`
2. `packages/engine/src/orchestrator/SeasonOrchestrator.ts` — full file (advanceWeek, processOffseason, phase handling)
3. `packages/engine/src/calendar/Calendar.ts` — phase definitions and week ranges (e.g. combine = week 5, draft = weeks 10–12, free_agency = 8–9, coaching_carousel = 2–3)
4. `packages/engine/src/types/league.ts` — `LeaguePhase`, `League` (teams, players, coaches, draftPicks, draftProspects, contracts)
5. Phase 2 module APIs:
   - `packages/engine/src/draft/index.ts` — `DraftEngine`, `generateDraftClass`, `runCombine`, `executePick`, `executeUDFASignings`, etc.
   - `packages/engine/src/roster/index.ts` — `FreeAgencyEngine`, `CoachingHireEngine`, `TrainingCamp`, `RosterManager`, etc.
   - `packages/engine/src/trade/index.ts` — `TradeEngine` (for validating/executing trades during season)
   - `packages/engine/src/analytics/index.ts` — `AnalyticsDepartment` (tier/noise if needed for scouting)

**What to implement**

1. **Phase-driven advance**
   - In `SeasonOrchestrator.advanceWeek()`, after determining `currentEvent.phase`, branch on phase and run the appropriate Phase 2 logic when the calendar is in an offseason phase. Keep existing behaviour for game phases (sim games, injury recovery, morale, locker room).
   - Ensure the league state is mutated in a way that matches the engine’s expectations (e.g. `league.draftProspects` exists and is populated for the draft; contracts/roster updated after FA and draft).

2. **Coaching carousel** (phases `offseason_start`, `coaching_carousel`)
   - On the first week of `coaching_carousel` (or at end of `offseason_start`): use `CoachingHireEngine` to evaluate which coaches should be fired (e.g. from `processCoachEvaluations` or equivalent), then run the coaching carousel (fire underperformers, generate candidate pool, hire new HCs/coordinators). Update `league.coaches` and team `headCoachId` / coaching staff. Emit `COACH_FIRED` / `COACH_HIRED` / `SCHEME_CHANGED` via the orchestrator’s event bus where the Phase 2 code already does so; if not, add minimal emission so listeners stay consistent.

3. **Combine** (phase `combine`)
   - When phase is `combine`: if `league.draftProspects` is empty for the upcoming draft class, call `generateDraftClass(league.season + 1, seed)` and set `league.draftProspects`. Then run the combine (e.g. `runCombine(prospects, seed)`) and update each prospect’s scouting report / combine results in league state. Use the orchestrator’s RNG seed (e.g. `league.seed + season * 10000 + week`) so behaviour is deterministic.

4. **Free agency** (phases `free_agency_tampering`, `free_agency`)
   - When phase is `free_agency` (and optionally tampering): build the FA pool from expired contracts and released players (from league state), then call the free agency engine to simulate the market (e.g. `conductFreeAgency(...)`). Update `league.players` (teamId, contract), `league.contracts`, and team rosters. Emit `CONTRACT_SIGNED` for each signing. Respect league salary cap and roster limits; the Phase 2 `FreeAgencyEngine` and `CapEngine` should be used for compliance.

5. **Draft** (phase `draft`)
   - When phase is `draft`: ensure draft order is set (from standings or existing `league.draftPicks`). For each pick (or for a “simulate full draft” path), either:
     - Call the draft engine to execute the next pick (e.g. AI or BPA from draft board), update `league.draftPicks`, `league.players` (add drafted player to team, set draftYear/draftRound/draftPick), remove player from `league.draftProspects`, and emit `PLAYER_DRAFTED`; or
     - Leave a clear hook (e.g. `getDraftState()`, `executeDraftPick(teamId, prospectId)`) so the UI can drive picks later, and for “auto-advance” run a simple AI draft (e.g. each team picks BPA from their board). You choose one approach and document it.
   - After the draft (e.g. when moving to `post_draft`): run UDFA signings (e.g. `executeUDFASignings`), update rosters and contracts, and emit events as in the draft module.

6. **Post-draft / UDFA** (phase `post_draft`)
   - Run UDFA signings if not already done at end of draft. Update `league.players`, `league.contracts`, and team rosters.

7. **Training camp / roster cuts** (phases `training_camp`, `roster_cuts`)
   - When phase is `roster_cuts`: run training camp evaluation (e.g. `TrainingCamp.simulateTrainingCamp` or equivalent) and then apply 90→53 cuts. Use existing `delegateTrainingCampCuts` when delegation is set; otherwise use the training camp module’s cut recommendations. Update team rosters and any IR/PS moves via `RosterManager`. Emit `PLAYER_RELEASED` where appropriate.

8. **Trade deadline** (phase `trade_deadline`)
   - No new simulation required here; the phase simply marks the deadline. Optionally ensure `TradeValidator` / trade engine is used elsewhere so that trades after this week are rejected. If the trade module already enforces deadline via calendar, document it; otherwise add a check when evaluating trades that uses `league.week` and the calendar’s trade_deadline week.

9. **Conditional pick resolution**
   - When the season ends (e.g. after `super_bowl` or at start of offseason), call the draft module’s conditional pick resolver (e.g. `resolveConditions(league.draftPicks, seasonData)`) so that pick conditions (Pro Bowl, snap %, etc.) are resolved and `resolvedRound` is set. Use `league` (standings, player stats, awards) to build the minimal `seasonData` required by the resolver.

10. **Orchestrator result types**
   - Extend `WeekAdvanceResult` (and if needed `OffseasonResult`) to include Phase 2 outcomes where useful for the UI: e.g. `draftPicksMade`, `freeAgentSignings`, `coachingChanges`, `rosterCutCount`, or a generic `phaseOutcomes: Record<string, unknown>`. Keep the types in `SeasonOrchestrator.ts` or a shared types file.

**Constraints**
- Do not change the Phase 2 module public APIs unnecessarily; call them from the orchestrator with the league state and a deterministic seed.
- Do not add new engine packages; only orchestration and minimal helpers.
- Ensure that after each advance, `league.week` (and any `league.phase` if stored) is updated so the next advance sees the correct phase.
- If the league type does not yet have `draftProspects` or `draftPicks`, add them to the type and ensure `LeagueGenerator` or another path initializes them for a new league; document any assumptions.

**Testing**
- Add or extend integration tests in `packages/engine/tests/integration/` to cover:
  - Advancing through at least one full offseason: coaching_carousel → combine → free_agency → draft → post_draft → training_camp → roster_cuts, and verifying league state (roster counts, draftProspects reduced after draft, contracts updated after FA).
  - Conditional pick resolution at season end with mock season data.
  - Determinism: same seed produces the same sequence of phase outcomes when advancing through the same phases.
- Run the full engine test suite and fix any regressions: `cd packages/engine && npm run typecheck && npx vitest run`.

**When you are done**
- Run from repo root: `npm run typecheck && npm run test`.
- Summarize what you implemented: which phases now run which Phase 2 logic, and any hooks left for the UI (e.g. draft pick selection).
- Do not start Phase 3 (AI GM) or Phase 4 (frontend); only this integration step.
