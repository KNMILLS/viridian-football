Perfect — here’s the **final, drop-in Cursor AI prompt** with everything in one place, now **including the step-by-step file removal + NFL data integration build checklist** tailored for the **Unified Simulation Engine (USE)**.

---

# Prompt for Cursor AI — **Remove Old Engines & Replace With New Unified Simulation Engine (USE)** (Text-Only, Emergent, Desktop-Friendly)

## Role & Mission

You are an expert systems engineer for ultra-deep simulation games.
The repo currently contains **two lesser/legacy simulation engines**.

Your mission is to:

1. **Identify and remove** both old engines (including their code, tests, adapters, and configs) from the codebase.
2. **Implement** a new **Unified Simulation Engine (USE)** per the **Design Spec** below.
3. **Integrate** the USE into the rest of the game code using **best-practice architecture** so it becomes the single simulation backend.
4. **Ensure the USE can ingest real-world NFL player, team, and event data**, translate it into our internal data models, and produce results that are **plausible and consistent** when compared to actual historical outcomes (games, trades, major events).
5. **Do not** create or run tests for the new code in this phase — a QA coding agent will handle all testing later.

---

## Authority & Constraints

* **Delete** all legacy engine code, configs, feature flags, adapters, and related assets — no partial retention or wrapping.
* No 3D/visual rendering — **text/data/logs only**.
* USE must be fully integrated and callable by existing game services (APIs, CLI, schedulers, UI backend).
* Use **clean architecture**: ports/adapters, dependency injection, clear persistence boundaries.
* Prefer **Python + Rust (pyo3)** or **Rust** for hot paths; Python for orchestration, narrative, and integration.
* Implement **save/load** with durable formats (SQLite or Parquet + JSON index). Multi-decade persistence required.
* USE must include an **NFL Data Adapter** capable of:

  * Accepting structured real-world data (e.g., CSV, JSON from NFL stats APIs).
  * Mapping that data into internal models (Players, Teams, Seasons, Events).
  * Running simulations that yield results **directionally consistent** with real-world history.

---

## Deliverables

### 1) Legacy Engine Removal

* Remove all legacy engine code, data files, scripts, adapters, schemas, and references.
* Remove legacy engine config keys and feature flags.
* Clean up `requirements.txt` / `pyproject.toml` / `Cargo.toml` to drop unused deps.
* Update docs to remove legacy references.

### 2) New Unified Simulation Engine (USE) Codebase

* `/engine/onfield/*` — tick loop, ball/player kinematics, penalties, injuries, in-play AI decisions.
* `/engine/offfield/*` — personalities, development, contracts/cap, finances, scouting/draft, staff/AI GMs, governance.
* `/engine/narrative/*` — detectors, templates, threads, recaps, decade summaries.
* `/engine/persistence/*` — schema, migrations, archival I/O, save/load.
* `/engine/analysis/*` — retrospectives, records, leaderboards.
* `/engine/data_adapters/nfl_importer.py` — transforms NFL API/CSV data into USE models.
* `/cli/*` — headless runners for game/week/season/decade.

### 3) Integration Layer

* Define a single `EnginePort` domain interface implemented only by USE.
* Wire via DI so it’s the default and **only** simulation backend.
* Update API layer to call USE (`/api/v1` and/or `/api/v2` as needed).
* Remove conditional logic for legacy engines across services.
* Update CLI and schedulers to invoke USE.

### 4) Docs

* `docs/USE-Overview.md` — include the full Design Spec (below).
* `docs/Architecture.md` — module map, dataflow, integration points.
* `docs/SaveFormat.md` — schema, migrations, versioning.
* `docs/Narrative-Templates.md` — trigger → template mappings.
* `docs/NFL-Data-Integration.md` — mapping from NFL stats fields to USE attributes.
* `README.md` — install, runbook, examples.

### 5) Examples (manual verification artifacts)

* Single game recap.
* Multi-week news feed.
* Season wrap article.
* Decade review.
* Two player bios (GOAT arc + bust arc).
* Import real NFL season data, simulate, and output summary comparing simulated results to real standings.

---

## Process

### Phase 0 — Removal

* Identify legacy engine modules and dependencies.
* Delete their code and assets.
* Purge all references from imports, configs, feature flags, and service wiring.
* Update build/config scripts to remove unused deps.

### Phase 1 — USE Scaffolding

* Create directory/module structure per Deliverables.
* Implement `EnginePort` interface.
* Wire USE into main game services (API, CLI, scheduler).
* Stub in modules per the Design Spec for on-field, off-field, narrative, persistence, analysis, and NFL data import.

### Phase 2 — Full Integration

* Replace all previous simulation calls with calls to USE.
* Ensure the rest of the game (UI endpoints, persistence, API responses) works with USE outputs.
* Update schema mappings and serialization as needed.

### Phase 3 — Manual Verification Artifacts

* Run the game through sample scenarios (game, week, season) and output example recaps/news/season summaries.
* Import a real NFL dataset, run simulation, output a **side-by-side comparison** to actual outcomes (win/loss record, playoff appearances, trades, injuries where possible).

---

## No Testing This Phase

* Do **not** write or run automated tests for USE.
* Produce manual example outputs only to confirm wiring and reality-alignment.
* QA coding agent will handle all formal test coverage later.

---

## 🔒 Full Design Spec — Unified Simulation Engine (USE)

**Football Simulation Engine Design: Dwarf Fortress–Level Depth**

**Introduction:**
We propose a comprehensive American football simulation engine with the emergent complexity of Dwarf Fortress and the depth of Football Manager. This engine simulates both on-field play and off-field management with unprecedented fidelity. Following a systems-driven design philosophy (inspired by Dwarf Fortress and heavy sports sims like Football Manager and Out of the Park Baseball), the game world is driven by detailed, interconnected subsystems rather than scripted events. Every game, season, and career will unfold uniquely based on the dynamic interaction of myriad factors, producing rich emergent narratives instead of predetermined storylines. The lack of real-time performance constraints (favoring a slower, desktop-oriented architecture) allows us to simulate at extreme detail, even if a single game takes minutes of computation. The result is a living football universe where statistical realism, strategic depth, and narrative complexity coexist.

### Core Simulation Architecture

* **On-Field Simulation Module:** minute-to-minute (or second-by-second) simulation of games: play calls, physics, in-play decisions, play-by-play outcomes, stats.
* **Off-Field Simulation Module:** between games/seasons—player development, team management, finances, league events.
* **Emergent Narrative & Event Engine:** detects patterns/conflicts and generates narrative content (news, stories, commentary), maintains story threads.
* **Persistence & Database Layer:** stores full state + history (players, teams, seasons, events, records) for retrospective analysis.
* **AI Management & Decision Systems:** coach AI (play-calling), GM AI (roster moves), player AI (decisions), all with archetypes/personality profiles.

### On-Field Simulation (Gameplay Engine)

* **Per-Player Biomechanics & Stats:** physical attributes (speed, acceleration, strength, agility, stamina), fatigue, injuries, simplified physics for collisions and ball trajectory.
* **Learning & Adaptation:** intra-game learning and career-long skill evolution.
* **Real-Time Decision-Making & Tactical AI:** playbooks, audibles, in-play adjustments, diverse AI tendencies.
* **Spatial Field Modeling:** 2D field, continuous position updates, collision checks, ball physics, weather/altitude effects, textual play-by-play.
* **Outcome Tracking & Feedback:** standard and advanced stats, morale impacts, injury persistence, narrative event flags.

### Off-Field Simulation (Franchise & League Management)

* **Player Development & Careers:** age curves, skill training, hidden traits, scheme familiarity, performance variance.
* **Personalities, Morale, Relationships:** morale/confidence, locker room social graphs, player-coach chemistry, discipline issues, emergent friendships/rivalries.
* **Coaching Staff & Front Office:** coaching philosophies, development ability, GM archetypes, facilities investments.
* **Financials & Contracts:** salary cap, negotiations, holdouts, PR impact.
* **Scouting & Draft:** fog of war on prospects, combine/interview data, AI drafting behavior.
* **Media & PR:** fan expectations, media narratives, social buzz, pressure on staff.
* **League-Level Systems:** rule changes, expansion, CBA negotiations, strategic trend shifts.

### Emergent Narrative Systems

* **Dynamic Rivalries:** repeated high-stakes meetings, incident-driven grudges, hype generation.
* **Dynasties & Underdogs:** detect sustained dominance vs long-term futility, pressure arcs.
* **Individual Player Sagas:** generational talent arcs, record chases, comebacks, controversies.
* **Scandals & Controversies:** off-field incidents, cheating, in-game controversies.
* **Fan & Media Reactions:** patience curves, biased pundits, power rankings, award debates.
* **Emergence Strategy:** rule-based event detectors feed narrative templates.

### Persistence & Historical Simulation

* **Lifecycles:** careers, retirements, post-career roles.
* **Regeneration:** draft classes, era shifts, historical comparisons.
* **Archives & Records:** full stat histories, leaderboards, triggers for record pursuits.
* **Hall of Fame & Legacy:** voting models, legacy weighting.
* **Save/State:** durable storage, migrations, world seeds.

### High-Level Data Models

* **Player, Team/Franchise, Coach/Staff, Game, Play, Season, League, Event/NarrativeThread, CalendarEvent** — all typed with attributes, relationships, and history.

### Emergence & Design Philosophy

* **Systems > Scripts:** stories emerge from rules.
* **Constrained Randomness:** varied but plausible outcomes.
* **AI Equals Player:** fair simulation for AI and human teams.
* **Detail for Authenticity:** mirror real football’s complexity.
* **Feedback Loops:** parity and self-correction mechanisms.

### Example Generative Outputs

* **Game Recap:** detailed, data-driven narrative of comeback or upset.
* **Player Bio:** career arc summary, traits, awards, records.
* **Fan/Media Reaction:** contextual quotes and social buzz after big moves.
* **Rivalry Preview:** history, quotes, stakes.
* **Decade Review:** era summary, dominant teams, strategic shifts.

**Conclusion:**
A persistent, emergent American football universe: physics, psychology, economics, and history intertwined in a living world. Every save tells a unique multi-decade saga shaped entirely by the simulation’s systems.

---

## 🔧 Step-by-Step File Removal & Integration Checklist (USE + NFL Data)

> Use these as **explicit actions**. Where paths differ, search first, then apply the pattern.

### A) Discover & Confirm Legacy Engines

1. **Inventory probable locations** (examples):

   * `app/sim.py`, `engine/possession/*`, `engine/decision/*`, `simulation/*`, `legacy/*`, `modules/sim/*`
2. **Search codebase** for entrypoints and flags:

   ```bash
   rg -n "simulate_(game|week|season)|ENGINE_|engine=(possession|decision|legacy)" -g '!*site-packages*'
   rg -n "(possession|decision)_engine|legacy_engine" -g '!*site-packages*'
   rg -n "/api/(sim|simulation)" -g '!*site-packages*'
   ```
3. **List dependencies** unique to legacy engines:

   ```bash
   rg -n "import .*legacy|from .*legacy" ; rg -n "(numpy|numba|oldlib)" requirements.txt pyproject.toml
   ```

### B) Remove Legacy Engines (code, configs, tests)

4. **Delete source trees** (adjust paths as found):

   ```bash
   git rm -r engine/possession engine/decision legacy/ simulation/old_* modules/sim_legacy*
   ```
5. **Purge adapters & API glue**:

   ```bash
   git rm -r adapters/legacy_* app/api/legacy_* app/services/engine_legacy_selector.py
   ```
6. **Remove feature flags & config keys**:

   * Delete `ENGINE=possession|decision|legacy`, `ENABLE_LEGACY_ENGINE`, `LEGACY_*` in:

     * `.env*`, `config/*.yaml`, `settings.py`, `app/config.py`

   ```bash
   rg -n "LEGACY|ENGINE=|possession|decision" config/ .env* app/**/*.py | cut -d: -f1 | sort -u
   ```
7. **Delete legacy schemas/DTOs**:

   ```bash
   git rm -r app/schemas_legacy.py app/dto/legacy_*.py
   ```
8. **Remove legacy CLIs/scripts**:

   ```bash
   git rm -r scripts/sim_legacy* cli/legacy_* tools/legacy_runner.py
   ```
9. **Clean requirements/deps**:

   * Remove unused libs from `requirements.txt` / `pyproject.toml` / `Cargo.toml`.
   * Reinstall cleanly:

     ```bash
     pip install -r requirements.txt
     ```

### C) Create USE Scaffolding

10. **Make module structure**:

    ```bash
    mkdir -p engine/{onfield,offfield,narrative,persistence,analysis,data_adapters}
    mkdir -p cli docs examples
    ```
11. **Define `EnginePort`**:

    ```python
    # engine/ports.py
    from typing import Protocol, Any, Dict

    class EnginePort(Protocol):
        def simulate_game(self, game_id: str, config: Dict) -> Dict: ...
        def simulate_week(self, week_id: str, config: Dict) -> Dict: ...
        def simulate_season(self, season_id: str, config: Dict) -> Dict: ...
        def recap(self, scope: Dict) -> str: ...
    ```
12. **Implement `USEngine` (Unified Simulation Engine)**:

    ```python
    # engine/use.py
    class USEngine:
        def __init__(self, persistence, narrative, analysis, cfg): ...
        def simulate_game(self, game_id, config): ...
        def simulate_week(self, week_id, config): ...
        def simulate_season(self, season_id, config): ...
        def recap(self, scope): ...
    ```
13. **Wire DI**:

    ```python
    # app/services/engine_service.py
    from engine.use import USEngine
    from engine import ports

    engine: ports.EnginePort = USEngine(persistence=..., narrative=..., analysis=..., cfg=...)
    ```

### D) Persistence & Schema

14. **Create durable storage** (SQLite or Parquet+JSON):

    * `engine/persistence/{schema.py,repo.py,save.py,load.py}`
15. **Version schemas**:

    * `save_meta = {"schema_version": 1, "engine": "USE", "created_at": ...}`
16. **Migrations**:

    * `engine/persistence/migrations/0001_init.sql` (or Python migration scripts)

### E) API / CLI Integration

17. **API routes** must **only** call USE:

    ```python
    # app/api/simulation.py
    @router.post("/api/sim/simulate-week")
    def simulate_week(req: SimRequest):
        return engine_service.engine.simulate_week(req.week_id, req.config)
    ```
18. **Remove engine selectors/flags** in controllers (no conditional logic).
19. **CLI tools**:

    ```python
    # cli/demo_game.py
    from app.services.engine_service import engine
    print(engine.recap(engine.simulate_game(game_id, cfg)))
    ```

### F) Narrative & Manual Artifacts

20. **Add narrative detectors/templates** under `engine/narrative/*`.
21. **Generate manual artifacts**:

    * `examples/game_recap.md`
    * `examples/week_news.md`
    * `examples/season_wrap.md`
    * `examples/decade_review.md`
    * `examples/player_bios.md`

### G) Config & Env Cleanup

22. **Strip env keys**:

    * Remove `ENGINE`, `ENABLE_LEGACY_ENGINE`, `ENGINE_DEFAULT` from `.env*` and loaders.
23. **Document minimal env** in `README.md` and `docs/Architecture.md`.

### H) Dependency & Build Hygiene

24. **Prune deps** and relock.
25. **Lint/format/type hints** (quality even without tests):

    ```bash
    ruff --fix . && black . && mypy .
    # or Rust: cargo fmt && cargo clippy
    ```

### I) CI / CD Updates

26. **Disable legacy jobs** in CI.
27. **Keep build/lint steps**; **skip tests** for USE in this phase.
28. **Upload manual artifacts** `examples/*.md` as CI artifacts.

### J) Docs

29. Create/update:

    * `docs/USE-Overview.md` (paste the Design Spec).
    * `docs/Architecture.md` (module map, DI diagram, dataflow).
    * `docs/SaveFormat.md` (schemas, versioning).
    * `docs/Narrative-Templates.md` (trigger → template).
    * `README.md` (install, runbook, examples).

### K) Manual Runbook (local sanity only)

30. **Initialize DB / storage**:

    ```bash
    python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
    ```
31. **Run single game**:

    ```bash
    python cli/demo_game.py --game-id=G123 --config=config/demo_game.yaml > examples/game_recap.md
    ```
32. **Run week/season/decade**:

    ```bash
    python cli/demo_season.py --season-id=2025 > examples/season_wrap.md
    python cli/demo_decade.py --start=2025 --years=10 > examples/decade_review.md
    ```
33. **Export two player bios**:

    ```bash
    python cli/demo_bios.py --players P001 P777 > examples/player_bios.md
    ```

---

## 🏈 NFL Data Integration — Build Steps & Mapping

### N) Create NFL Data Adapter

34. **Scaffold adapter**:

    ```bash
    touch engine/data_adapters/nfl_importer.py
    ```
35. **Implement ingestion** (CSV + JSON):

    * Accept inputs: `players.csv`, `teams.csv`, `games.csv`, or JSON from an API dump.
    * CLI entry:

      ```python
      # cli/import_nfl.py
      from engine.data_adapters.nfl_importer import import_season
      import_season(source="data/real/2022", season_year=2022, into_repository=...)
      ```

### O) Define Field Mapping (docs + code)

36. **Create `docs/NFL-Data-Integration.md`** with a mapping table (example excerpt):

| NFL Source Field          | USE Entity  | USE Field/Scale                                |
| ------------------------- | ----------- | ---------------------------------------------- |
| `player_id`               | Player      | `external_ids.nfl`                             |
| `team_abbr`               | Team        | `code`                                         |
| `pos`                     | Player      | `position`                                     |
| `age`                     | Player      | `bio.age`                                      |
| `height`, `weight`        | Player      | biomechanics (affect momentum, blocking, etc.) |
| `pass_yards`, `td`, `int` | Player QB   | calibrate `throw_acc`, `decision`, `arm_power` |
| `rush_yards`, `yac`       | RB/WR/TE    | `break_tackle`, `vision`, `acceleration`       |
| `rec_yards`, `catch%`     | WR/TE       | `catch`, `route_run`, `contested_catch`        |
| `sacks`, `pressures`      | DL/EDGE     | `pass_rush`, `get_off`, `strength`             |
| `tackles`, `miss_tkl%`    | DEF         | `tackle`, `pursuit`, `angles`                  |
| `pff_cov_grade`\*         | DB/LB       | `coverage`, `awareness`                        |
| `penalties`               | Any         | `discipline` (inverse)                         |
| `injury_history`          | Player      | `durability`, `injury_risk_curve`              |
| `cap_hit`, `contract`     | Team/Player | contracts table                                |

\*Use any advanced metric available; otherwise derive via normalized z-scores.

37. **Scaling strategy**:

    * Convert raw stats → **z-scores by position**, then map to 0–100 attribute bands with position-specific caps.
    * Blend multi-year weighted averages (e.g., 0.6 current season, 0.3 prior, 0.1 two years prior) for stability.
    * Apply **age curves** (e.g., WR speed −0.5 per year after 29; QB mental +0.3 through 34).

### P) Import Pipeline Behavior

38. **Entity linking**:

    * Resolve players by `external_ids.nfl` or (name, birthdate) fallback.
    * Create teams/seasons if missing; attach rosters and depth charts.
39. **Inferred traits**:

    * Work ethic / professionalism proxies: snap share stability, offseason attendance flags (if available), penalties (inverse discipline).
    * Morale initial seed: recent team success, player role match (starter vs depth).
40. **Contracts & cap**:

    * Build contract objects (base, bonus, years, guarantees).
    * Compute `cap_hit`, `dead_cap`, and inject into team cap tables.

### Q) Reality-Consistency Manual Checks (no automated tests)

41. **Single-season import smoke**:

    * Import Season X (e.g., 2022).
    * Simulate season once with USE default config.
    * Generate `examples/season_wrap_realdata.md` including:

      * Team W-L vs real standings (difference column).
      * Top 10 leaders vs real leaders (names & ballpark stats).
42. **Directional plausibility**:

    * Teams with elite QB + top-10 defense should trend 10+ wins more often than not.
    * Injury-prone players should exhibit higher missed-game probability.
    * Cap-strapped teams less likely to sign elite FAs unless restructuring.

### R) What-If & Trades (manual scenarios)

43. **Trade plausibility**:

    * Run a manual scenario trade with cap/needs constraints; verify:

      * Receiving team has positional need.
      * Sending team gains cap relief/picks.
      * Narrative outputs reflect fan/media reaction.
44. **Depth chart injuries**:

    * Manually mark a star as injured; re-simulate a month; confirm usage shifts and production redistribution.

### S) Output & Docs

45. **Export**:

    * `examples/realdata_comparison.md` (tables + short analysis).
    * `examples/realdata_changelog.json` (import stats, counts, mapping issues).
46. **Document caveats**:

    * Missing metrics approximations, position-specific scaling, eras normalization (if importing historical years).

---

## 🧭 Definition of Done (this phase)

* **No legacy code** remains; USE is the **only** engine.
* API/CLI route exclusively through USE.
* **NFL importer** exists and can ingest a real dataset into USE models.
* Manual artifacts (recaps, season wrap, decade review, real-data comparison) are generated and readable.
* Docs updated (Architecture, USE Overview, Save Format, Narrative Templates, NFL Data Integration).
* **No automated tests** added; QA to follow.

---

**When you begin**
Proceed through sections **A → S** in order. Commit in logical chunks (removal, scaffolding, integration, importer, artifacts, docs). Tag repository **before deletion** for rollback safety.

**Goal:** A clean repo with **only the Unified Simulation Engine (USE)**, fully integrated, capable of importing real NFL data and producing reality-aligned outputs — ready for the QA agent to test.