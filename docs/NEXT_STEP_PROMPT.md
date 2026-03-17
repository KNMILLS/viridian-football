# Next Step: Phase 3 — AI GM System (Single Agent)

**Use only one agent at a time. Copy the prompt below into a single Cursor Agent chat and run it to completion.**

---

## Prompt (copy everything below this line)

You are working on Viridian Football. This is a **single-agent** task. Complete it fully before any other development.

**CRITICAL DESIGN PRINCIPLES**
1. The user is the GM only; coach duties (depth chart, play calling) are coach AI only. See `.cursor/rules/gm-only-scope.mdc`.
2. No hardcoded events; all behaviour via event bus and conditions. See `.cursor/rules/zero-hardcoded-events.mdc`.
3. Use deterministic RNG (`createLCG` from `packages/engine/src/sim/RNG.ts`) for all randomness. Never `Math.random()`.

**YOUR TASK: Implement the AI GM system so that AI-controlled teams make distinct, archetype-driven decisions for trades, draft, free agency, and coaching hires.**

The types are already defined in `packages/engine/src/types/ai.ts`: `GmArchetype`, `GmArchetypeName`, `GmDecisionWeights`, `GmTendencies`, `AiDecisionContext`, `AiAction`, `IAiGmEngine`. You must implement the engine that satisfies `IAiGmEngine` and wires it to existing Phase 2 modules.

**Read these first (in order):**
1. `.cursor/rules/project-overview.mdc` and `.cursor/rules/gm-only-scope.mdc`
2. `packages/engine/src/types/ai.ts` — full file (archetypes, context, actions, interface)
3. `packages/engine/src/types/league.ts` — League, Team, standings
4. `packages/engine/src/types/team.ts` — Team, OwnerProfile, TeamRecord
5. Existing modules the AI will call:
   - `packages/engine/src/trade/TradeNegotiation.ts` — `generateCounterOffer`, `evaluateFromTeamPerspective`
   - `packages/engine/src/trade/TradeValuation.ts` — `getPlayerTradeValue`, `getPickTradeValue`, `computeFairnessScore`
   - `packages/engine/src/trade/TradeValidator.ts` — `validateTradeLegality`
   - `packages/engine/src/draft/DraftEngine.ts` and `DraftBoard.ts` — draft board generation, pick value
   - `packages/engine/src/roster/RosterNeedAnalyzer.ts` — `analyzeRosterNeeds`
   - `packages/engine/src/roster/CoachingHireEngine.ts` — `evaluateCoachPerformance`, `generateCandidatePool`, `conductInterview`, hire/fire
   - `packages/engine/src/roster/FreeAgencyEngine.ts` — market value, demands, comp pick eligibility (for AI FA decisions)
   - `packages/engine/src/cap/CapEngine.ts` — cap space, compliance
   - `packages/engine/src/analytics/AnalyticsDepartment.ts` — tier/noise if needed for AI “scouting” preference

**What to implement**

1. **Archetype definitions** (`packages/engine/src/ai/archetypes.ts` or similar)
   - Define the five archetypes: `analytics_architect`, `culture_commander`, `strategic_rebuilder`, `player_centric`, `aggressive_dealmaker`.
   - Each has: `name`, `displayName`, `description`, `weights` (GmDecisionWeights), `tendencies` (GmTendencies), `signatureMoves` (string[]).
   - Weights must differ meaningfully: e.g. Analytics Architect high `analyticsReliance` and `compPickAwareness`; Culture Commander high `cultureWeight`; Strategic Rebuilder high `draftPriority` and `youthBias`; Aggressive Dealmaker high `tradeAggression` and `freeAgencyAggression`; Player-Centric high `cultureWeight` and lower `riskTolerance`.
   - Tendencies: e.g. rebuild/contend thresholds, coach firing patience, draft trade-up/down frequency, franchise tag usage. Make each archetype feel distinct.

2. **Team state evaluation** (`packages/engine/src/ai/AiGmEngine.ts` or similar)
   - `evaluateTeamState(teamId: TeamId): AiDecisionContext`:
     - Load team, roster, record, cap space (via CapEngine), draft pick count, owner pressure (from OwnerProfile or a simple heuristic), roster needs (via RosterNeedAnalyzer).
     - Determine `mode`: `rebuild` | `retool` | `contend` | `dynasty` from record and archetype tendencies (e.g. compare wins/losses to `rebuildThreshold` and `contendThreshold`).
     - Return full `AiDecisionContext` with the team’s assigned archetype (see below).

3. **Archetype assignment**
   - Each team must have an assigned archetype. Either:
     - Store it on the team (e.g. add `gmArchetype: GmArchetypeName` to the Team type and set it in LeagueGenerator for new leagues), or
     - Derive it deterministically from team id/seed so the same team always has the same archetype.
   - Implement `getArchetype(teamId: TeamId): GmArchetype` (return the full archetype object for that team).

4. **Decision engine** — `decideAction(context: AiDecisionContext): AiAction`
   - Given context (team, mode, cap, needs, draft picks, owner pressure), choose one action per call. Use the archetype’s weights and tendencies to drive the choice.
   - Possible actions: `propose_trade`, `evaluate_trade`, `sign_free_agent`, `release_player`, `draft_player`, `hire_coach`, `fire_coach`, `restructure_contract`, `franchise_tag`, `invest_analytics`, `no_action`.
   - Logic examples (must be archetype-aware and use RNG for variety):
     - Rebuild mode + high draft priority → more likely to consider trading down or accumulating picks; contend mode → more likely to sign FA or trade for win-now player.
     - High comp pick awareness → factor in comp pick value when deciding whether to sign or let a FA walk.
     - Culture Commander → prefer players with strong character grades; Aggressive Dealmaker → more likely to propose trades.
   - Return a single `AiAction`. If no action is appropriate, return `{ kind: 'no_action', reason: string }`.
   - All randomness via `createLCG(seed)`; seed can be derived from league seed + team id + season + week (or similar) so behaviour is deterministic.

5. **Trade evaluation** — `evaluateTradeOffer(teamId: TeamId, proposal: TradeProposal): boolean`
   - Use `TradeValuation` (fairness score, surplus value) and `TradeValidator` (legality). Consider archetype: Aggressive Dealmaker may accept slightly unfair deals; Analytics Architect may reject unless value is clearly positive. Return true/false for accept/reject. Use deterministic RNG for any tie-breaking.

6. **Draft board** — `generateDraftBoard(teamId: TeamId): PlayerId[]`
   - Build the team’s draft board: get roster needs (RosterNeedAnalyzer), get draft prospects (from league), get scouting reports and scheme fit data, then call `generateTeamBoard` (or equivalent) with **archetype-specific weights** (e.g. Analytics Architect weights scouting/analytics higher; Culture Commander weights character; Strategic Rebuilder weights need and youth). Return ordered list of `PlayerId` (prospect ids) by board rank.

7. **Coaching hire priority** — `prioritizeCoachingHire(teamId: TeamId): CoachId[]`
   - When the team needs to hire a coach (e.g. after firing), generate candidate pool (CoachingHireEngine), then rank candidates by archetype: e.g. Analytics Architect prefers innovative scheme fit; Culture Commander prefers experience and leadership. Return ordered list of `CoachId` (best first). Use existing interview/evaluation data if available.

8. **Module layout**
   - Create `packages/engine/src/ai/` (or reuse if stubbed): e.g. `archetypes.ts`, `AiGmEngine.ts`, `decisionEngine.ts`, `index.ts`. Export a class that implements `IAiGmEngine` and the archetype list. Do not break existing Phase 2 APIs; the AI only calls them.

9. **Integration**
   - Export the AI GM engine and archetypes from `packages/engine/src/index.ts` so the orchestrator or game layer can call it (e.g. for “AI team on the clock” during draft, or “AI evaluates trade offer”).
   - Optional: in `SeasonOrchestrator`, when advancing a phase that requires an AI decision (e.g. draft pick for an AI team), call the AI GM’s `generateDraftBoard` and then `decideAction` or a dedicated “execute next draft pick for team” that uses the board. Only add this if it fits the current orchestrator design; otherwise leave a clear hook for the application layer to call the AI.

**Constraints**
- Do not change the existing Phase 2 module public APIs in a breaking way. The AI is a consumer of those APIs.
- If the League or Team type does not have a field for archetype, add a minimal one (e.g. `gmArchetype?: GmArchetypeName` on Team) and set it in league generation or in the AI module from a deterministic seed.
- All AI decisions must be deterministic given the same league state and seed.

**Testing**
- Add unit tests for: archetype definitions (each has distinct weights/tendencies), `evaluateTeamState` (mode is set correctly from record and thresholds), `decideAction` (returns valid action and respects archetype), `evaluateTradeOffer` (accept/reject consistent with fairness and archetype), `generateDraftBoard` (returns ordered list, length matches available prospects), `prioritizeCoachingHire` (returns list of candidate ids).
- Add at least one integration-style test: create a league with multiple teams, assign archetypes, call `evaluateTeamState` and `decideAction` for each; verify no crashes and that different archetypes can produce different actions.
- Run: `cd packages/engine && npm run typecheck && npx vitest run`.

**When you are done**
- Run from repo root: `npm run typecheck && npm run test`.
- Summarize what you implemented: which files, how archetypes differ, and how the orchestrator or app should call the AI (e.g. draft, trade, FA, coaching). Do not start Phase 4 (frontend) in this task.
