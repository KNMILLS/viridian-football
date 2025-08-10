# Viridian Football Master Plan

This master document consolidates vision, market analysis, product requirements, technical design, development roadmap and operational plans for **Viridian Football**, an NFL‑style general‑manager simulation built by a solo developer using AI coding agents.  It is intended to guide the project from concept through launch and live operations.

## 1. Executive Summary

Viridian Football aims to fill a clear gap in the video‑game market: there is no polished, deeply realistic American‑football GM simulation.  Existing titles either focus on on‑field action (e.g., Madden) or provide deep statistics with outdated interfaces (e.g., Front Office Football).  Meanwhile, sports management sims in other disciplines—most notably Football Manager—have demonstrated that complex simulations can achieve mass appeal; Sports Interactive reported that **Football Manager 2024 recorded its seven‑millionth player** within 100 days【229978427176433†L144-L165】.  By combining the depth of a true NFL front office with a modern user experience, emergent narratives and modding support, Viridian Football targets both hardcore sim fans and the tens of millions of fantasy‑football players who already enjoy roster management【411713604128734†L116-L133】.  Development will leverage GPT‑5, Gemini and Cursor agents for near‑full automation, with a trunk‑based GitHub workflow enabling parallel code generation and continuous integration.

## 2. Vision and Differentiators

**Vision:** Build the most complete, realistic and replayable NFL‑style GM simulator ever made.  The game must feel like running a real football franchise, balancing scouting, drafting, contract negotiation, roster construction, coaching decisions and owner relations.  It must capture the emotional highs and lows of the NFL’s emergent narratives—not just spreadsheets.

**Key differentiators:**

1. **Emergent narrative engine:** The Unified Simulation Engine (USE) models both on‑field and off‑field events.  Dynamic storylines (injuries, personality clashes, media narratives) emerge from the interaction of players, coaches and the environment【143181529883780†screenshot】.
2. **Fog of War scouting:** Players’ true abilities are hidden behind scouting reports that depend on scout skill and resources【143181529883780†screenshot】.  Drafting requires weighing risk vs. reward.
3. **Deep financial and cap management:** The game simulates contracts, salary cap mechanics, revenue sharing, and advanced strategies such as weaponizing the cap【143181529883780†screenshot】.
4. **AI GM archetypes:** Opposing teams are driven by archetypes derived from real GM philosophies (aggressive trader, analytics guru, culture builder)【143181529883780†screenshot】.
5. **Modding & community:** Fictional teams and players circumvent NFL licensing costs but modding tools allow users to import real rosters and logos.  A built‑in workshop fosters a community.
6. **LLM‑first development:** The project leverages AI for planning, coding, testing and content generation, enabling a solo developer to deliver a complete commercial product.

## 3. Market Validation and Opportunity

### 3.1 Fantasy‑Sports Crossover

Fantasy sports participation provides a large ready‑made audience for Viridian Football.  The Fantasy Sports & Gaming Association (FSGA) reports that **19 % of U.S. adults play fantasy sports**【411713604128734†L116-L120】, and **79 % of those fantasy players participate in fantasy football**【411713604128734†L129-L133】.  FSGA represents **nearly 60 million fantasy players in the U.S. and Canada**【8343941963200†L145-L147】.  Research shows that ~203 million U.S. adults did not play fantasy last year, yet about **19 million non‑players are somewhat likely to start**, indicating significant growth potential【8343941963200†L100-L111】.  ESPN’s Fantasy Football app alone hosted **over 13 million players in 2024**【849066203960417†L56-L63】, and ESPN’s broader fantasy portfolio serves **more than 20 million players**【849066203960417†L72-L76】.  Targeting this audience, who already enjoy roster management and statistical analysis, could dramatically widen the game’s reach.

### 3.2 Simulation Game Market

The global simulation game market was valued at **USD 21.48 million in 2025** and is projected to reach **USD 42.15 million by 2033** (CAGR 8.79 %)【551799096061594†L60-L65】.  Modding and user‑generated content are cited as key trends driving growth【551799096061594†L60-L65】, aligning perfectly with Viridian Football’s mod support.

### 3.3 Fantasy Sports Market

The global fantasy sports market is projected to grow from **USD 6.46 billion in 2022** to **USD 12.87 billion by 2028**, a **CAGR of about 12 %**, with fantasy football being the largest segment【536470336479336†L47-L54】.  North America alone hosts **over 60 million fantasy sports players**【536470336479336†L126-L133】.  These players already spend time managing rosters and analyzing stats, making them prime candidates for a deeper simulation game.

### 3.4 Competitor Analysis

| Game/Series | Platform & Model | Strengths | Weaknesses / Gaps |
|---|---|---|---|
| **Front Office Football (Solecismic)** | Desktop (paid) | Rich statistics, long‑running series, niche community. | Outdated UI; limited marketing; small dev team. Players tolerate poor UX due to lack of alternatives【143181529883780†screenshot】. |
| **Football GM (ZenGM)** | Free web app | Accessible, mod‑friendly, multi‑sport. | Simplistic simulation; less realistic contract/salary mechanics. |
| **Axis Football** | PC/console | Real‑time 3D play with customizable franchise mode. | Franchise depth is shallow; AI and management features limited. |
| **Madden NFL Franchise Mode** | Console/PC | Official license, high production values. | Franchise features underdeveloped; microtransactions; unrealistic simulation. |

Viridian Football will compete by combining deep simulation with a modern UI and emergent storytelling, focusing on quality over quantity of animations and avoiding the pitfalls of AAA monetization.

## 4. Product Requirements Document (PRD)

### 4.1 Target Users

1. **Hardcore sim fans** – Players who love sports management games and crave realism.  They demand accurate salary‑cap mechanics, realistic player progression and challenging AI opponents.
2. **Fantasy‑football enthusiasts** – Fans accustomed to drafting and managing rosters.  Viridian offers a persistent, narrative‑driven world beyond weekly matchups.
3. **Statisticians/analytics hobbyists** – Users who enjoy data analysis, modeling and optimizing strategies.  They will appreciate deep reports and modding APIs.

### 4.2 Core Features for MVP (v0.1)

1. **Franchise setup:** Create or select a team; customize league structure (number of teams, salary cap values, schedule length, playoff format).  Fictional teams and players used by default; roster import supported.
2. **Scouting & draft:** Generate draft classes with Fog‑of‑War scouting grades; allow scouting assignments and combine/pro day events.  Draft interface with trade‑up/down options.
3. **Player contracts & salary cap:** Implement rookie scale, veteran contracts, bonuses, guarantees, restructures, trades and free agency.  Adhere to NFL CBA rules (cut penalties, cap carryover, franchise tags).
4. **Game simulation:** Ratings‑driven game‑day simulation producing realistic scores and statistics.  Users select schemes (run/pass ratios, formations) and decide when to go for it on fourth down; AI opponents vary by GM archetype and coach philosophy.
5. **AI GMs & coaches:** Opposing teams manage rosters, trades and game plans based on archetypes and team situations.  Owners set goals (win now, rebuild) and may fire/hire coaches.
6. **Narrative & events:** Newsfeed with injury reports, locker‑room issues, player/coach statements, media questions and owner demands.  Press conferences allow the user to respond, affecting morale and relationships.
7. **User interface:** Modern dashboard showing roster depth chart, finances, schedule, standings, player cards, scouting reports and draft board.  Navigation via side menu and hotkeys; dark broadcast theme as per the UI/UX guide.
8. **Persistence & save system:** Save/load functionality; ability to simulate multiple seasons with historical records.  Save files stored as versioned JSON or SQLite DB; deterministic results on reload.
9. **Modding tools:** Import/export rosters, draft classes and league settings via JSON/YAML.  Modding guidelines and schema definitions included in the docs.

### 4.3 Future Enhancements (post‑MVP)

1. **Enhanced match engine:** Integrate a physics‑based simulation (e.g., with Godot or custom 2D/3D engine) for optional live play viewing.
2. **Online leagues & multiplayer:** Allow multiple users to manage teams in the same league with commissioner tools and asynchronous play.
3. **Women's football league:** Implement WFA or international women’s leagues and support Title IX stories.
4. **Expanded narrative system:** Add cinematics, interactive dialogues, player agents and off‑field incidents (legal issues, endorsements).
5. **Advanced analytics & machine learning:** Provide predictive analytics (win probability models, draft success projections) and integrate user‑contributed AI modules.

### 4.4 Non‑functional Requirements

* **Determinism:** Simulation results must be reproducible when given the same seed and inputs.  Random number generation should be seedable.
* **Performance:** The simulation should run a season (including off‑season) in under 30 seconds on a mid‑range PC for a 32‑team league.
* **Modularity:** Each subsystem (scouting, contracts, simulation, UI) must have a clear API boundary to allow independent development and testing.
* **Accessibility:** Provide font scaling, colorblind modes and keyboard navigation.  Avoid small click targets in the UI.
* **Security and privacy:** Do not collect unnecessary personal data.  Protect mod submissions from malicious code.

## 5. Technical Design Document (TDD)

### 5.1 Architecture Overview

The system is composed of three layers:

1. **Unified Simulation Engine (USE)** – Implements domain models and simulation algorithms.  Written in **Rust** for speed and deterministic behaviour, compiled to both native binaries and WebAssembly.  Modules include:
   * **Entity models:** Data structures for players, teams, contracts, coaches, games, draft classes.
   * **Game logic:** Functions to simulate plays, games, seasons and off‑season events.  Ratings‑driven algorithm determines outcomes.
   * **Financial module:** Handles salary cap, contracts, bonuses, revenue sharing and team budgets.  Exposes functions for signing players, restructuring deals and calculating cap hits.
   * **AI module:** Implements GM archetypes and coaching strategies.  Each AI agent has parameters for risk tolerance, analytics usage, negotiation style and roster philosophy.
   * **Narrative module:** Generates events (injuries, morale issues, owner requests) and manages their effects on players/coaches.  Maintains event history for storylines.
   * **Data persistence:** Serializes and deserializes the entire world state to/from SQLite or JSON.  Versioned to handle schema evolution.
   * **API layer:** Exposes functions for the service layer to call (advanceDay, makeTrade, signContract, runDraft).

2. **Service Layer** – A thin interface between UI and engine.  Implemented in **TypeScript** (Node.js) to orchestrate calls to the Rust engine via WebAssembly bindings.  Provides REST/gRPC endpoints (or direct function calls in desktop builds) for client actions.

3. **Client UI** – Built using **React** with **TypeScript**, styled according to the UI/UX style guide.  The UI consumes the service API and renders dashboards, tables, charts and modal dialogs.  Data visualization libraries (e.g., Recharts) display stats and cap graphs.  State management uses Redux or Zustand.

### 5.2 Data Models (simplified)

```text
Player
  id: UUID
  name: string
  position: enum
  age: int
  ratings: struct { overall: float, potential: float, attributes: map }
  personality: struct { workEthic: float, leadership: float, ego: float }
  contract: Contract
  health: struct { injuryStatus: enum, durability: float }
  morale: float
  teamId: UUID

Contract
  years: int
  totalValue: float
  signingBonus: float
  guaranteed: float
  yearlyBreakdown: list of { year: int, baseSalary: float, rosterBonus: float, capHit: float }
  clauses: map (e.g., noTrade, incentives)

Team
  id: UUID
  name: string
  location: string
  roster: list<UUID>
  salaryCap: float
  capSpace: float
  draftPicks: map<year, list<round>>
  coach: Coach
  owner: Owner

DraftClass
  year: int
  prospects: list<Player>
  scoutingReports: map<UUID, Report>

Game
  id: UUID
  homeTeamId: UUID
  awayTeamId: UUID
  date: date
  score: struct { home: int, away: int }
  plays: list<Play>
  stats: map<UUID, PlayerStats>

```

### 5.3 Algorithms

* **Game simulation:** For each play, select an offensive and defensive strategy, compute success probabilities based on player ratings, fatigue, morale, weather and home‑field advantage.  Use seeded random numbers to determine outcome (e.g., yards gained, turnover).  Accumulate stats and update player fatigue.
* **Draft AI:** Each AI GM evaluates players using a weighted formula of scouted grade, positional need, team philosophy and draft strategy.  They consider trade offers and value charts (e.g., Jimmy Johnson chart) to move up or down.
* **Contract negotiation:** The agent models player interests (money, playing time, market value) and team constraints (cap space, roster needs).  It iteratively offers contract proposals until reaching agreement or stalling.

### 5.4 Integration Points

* **LLM integration:** Python scripts call OpenAI and Gemini to generate scouting reports, narrative event descriptions and world‑building text.  These scripts run asynchronously and feed results into the narrative module.
* **Analytics:** Export game logs and season statistics to CSV/JSON for analysis in Python or Excel.  Provide hooks for third‑party analytic packages.

## 6. Engine Recommendation

After evaluating off‑the‑shelf engines and weighing the project’s unique needs (determinism, deep data modeling, ease of AI integration, modding support, cost), a **custom engine built in Rust** is recommended.  Reasons:

* **Determinism & performance:** Rust’s strict memory and concurrency guarantees allow writing a high‑performance, deterministic simulation.  WebAssembly compilation enables cross‑platform deployment in web/desktop clients.
* **Modularity:** A bespoke engine avoids the complexity and licensing fees of Unity/Unreal.  Modules can be designed around domain entities rather than general game objects.
* **Budget:** Unity and Unreal require licensing/royalties once revenue crosses certain thresholds; building our own engine avoids ongoing costs and fits the USD 10 k budget.  (Official NFL licensing is prohibitively expensive and thus not pursued; fictional leagues with mod support circumvent this.)
* **AI integration:** Rust functions can be exposed to Python and Node.js for AI and scripting; property tests and fuzzing tools support reliability.

If later on a physics‑based match engine becomes necessary, the core simulation can integrate with 2D frameworks like **Bevy (Rust)** or external open‑source engines.

## 7. Development & Delivery Plan

### 7.1 Phases & Timeline (approximate)

| Phase | Duration | Key Milestones |
|---|---|---|
| **Pre‑production** | 2 months | Finalize design documents (PRD, TDD, narrative bible).  Set up repository, tooling and CI/CD.  Build minimal data models and initial API skeleton. |
| **Prototype & core systems** | 4 months | Implement entity models, deterministic random engine, game simulation loop, scouting/draft mechanics, basic AI GMs.  Create simple web UI for debugging.  Validate performance and reproducibility. |
| **MVP development** | 5 months | Implement contract negotiations, salary‑cap logic, narrative events, news feed, UI screens (roster, finances, draft, calendar), save/load.  Integrate LLM narrative generation.  Internal playtesting and balancing. |
| **Alpha & community feedback** | 2 months | Release to closed group of testers.  Gather feedback on UI, difficulty and simulation realism.  Fix bugs and refine mechanics. |
| **Beta & polish** | 3 months | Add remaining features (owner personalities, advanced scouting, achievements), refine AI, optimize performance, finalize art and audio assets.  Prepare for launch (marketing push, store pages, trailers). |
| **Launch (v1.0)** | 1 month | Release on target platforms (Steam, itch.io).  Provide day‑1 patch if needed.  Begin monitoring telemetry and user feedback. |
| **Post‑launch support** | Ongoing | Address bugs, add content updates (new storylines, draft classes), prepare paid expansions (e.g., women’s league, online multiplayer). |

These timelines are estimates; the LLM‑first workflow aims to compress development time by automating coding tasks and enabling multiple agents to work concurrently.

### 7.2 Work Breakdown Structure (WBS)

1. **Design & Planning**
   * Finalize PRD/TDD.
   * Create narrative design bible (personality archetypes, event templates).
   * Define data schemas and file formats.
2. **Infrastructure**
   * Set up GitHub repository, branching rules, issue templates.
   * Configure CI/CD pipelines (linting, tests, build, release packaging).
   * Establish environment for Rust, Node.js, React, Python.  Provide docs for agents.
3. **Core Engine**
   * Implement data models in Rust.
   * Write deterministic random number generator and simulation loop.
   * Build contract & salary‑cap modules.
   * Develop AI archetypes and decision logic.
4. **Narrative & UI**
   * Build narrative module with event templates.
   * Develop UI components for roster, draft, finances, schedule and news feed.
   * Integrate LLM scripts for text generation.
5. **Testing & QA**
   * Write unit tests and property tests for Rust modules.
   * Create integration tests for contract negotiation, draft simulation, game outcomes.
   * Implement deterministic replay testing (seeded runs produce identical results).
6. **Marketing & Community**
   * Design website and Steam page.
   * Prepare dev blogs, social media content, and trailers.
   * Launch Discord server and recruit early testers.
7. **Launch & Post‑Launch**
   * Prepare release candidate, test installers.
   * Monitor telemetry and crash reports.
   * Plan patches and expansions.

### 7.3 Risk Register (top items)

| Risk | Likelihood/Impact | Mitigation |
|---|---|---|
| **Scope creep** | High / High | Define strict MVP; defer physics engine and multiplayer to post‑launch.  Use milestones with go/no‑go criteria. |
| **AI agent inconsistency** | Medium / High | Implement code review gates and determinism tests; assign a “quality gate” agent to verify output. |
| **Performance bottlenecks** | Medium / Medium | Profile early; optimize data structures; run simulation in worker threads. |
| **Legal/licensing issues** | Low / High | Use fictional teams/players; provide modding but require user‑supplied IP for real names.  Avoid use of NFL marks. |
| **Lack of community engagement** | Medium / Medium | Start community building early; share dev progress; encourage modding; partner with fantasy‑football influencers. |
| **Developer burnout** | Medium / High | Leverage automation; schedule rest; maintain manageable backlog. |

## 8. GitHub Repository Plan & Agent Autonomy

### 8.1 Repository Structure

```
viridian-football/
  README.md
  docs/
    prd.md
    tdd.md
    architecture.md
    learning-plan.md
  engine/
    Cargo.toml
    src/
      lib.rs
      game/
      finance/
      ai/
      narrative/
      persistence/
  service/
    package.json
    src/
      index.ts
      api/
      bindings/
  client/
    package.json
    src/
      App.tsx
      components/
      pages/
      styles/
  scripts/
    generate_scouting_reports.py
    generate_events.py
  tests/
    rust/
    js/
    integration/
  .github/
    workflows/
      ci.yml
      release.yml
    ISSUE_TEMPLATE/
      bug_report.md
      feature_request.md
```

### 8.2 Branching & CI/CD

* **Trunk‑based development:** Use a `main` branch as the trunk.  AI agents create short‑lived feature branches prefaced with `agent/` (e.g., `agent/implement-contracts`).  After automated tests pass and a quality gate review approves, the feature branch is merged into `main` via a merge bot.
* **Branch protection:** Require status checks (lint, unit tests, determinism tests) before merging into `main`.  Only the merge bot has permission to merge; agents must trigger the bot by labeling the PR.
* **Continuous integration:** GitHub Actions run tests on each push.  If a test fails, the bot labels the PR as `needs-fix` and the responsible agent must resolve it.
* **Continuous delivery:** On tagged releases (e.g., `v0.1.0`), the `release.yml` workflow builds binaries, packages the web client and uploads artifacts to the appropriate store (Steam build or itch.io).  Releases include changelogs generated by an agent.
* **Code ownership:** Each module folder has a CODEOWNERS file specifying which agent persona (e.g., AI_Bot_Finance) is responsible.  This helps route PR reviews.

### 8.3 Agent Autonomy Protocol

1. **Task creation:** The planning agent decomposes large milestones into tasks and creates GitHub issues with clear acceptance criteria and estimated effort.
2. **Assignment:** Implementer agents pick tasks from the backlog.  They create feature branches, generate code/tests, and open pull requests.
3. **Code generation:** Agents use the TDD and coding standards to write code.  They run tests locally before pushing.
4. **Quality gate:** The reviewer agent examines pull requests, checking for adherence to design, test coverage and performance.  If issues are found, the PR is labeled `needs-rework` and returned.
5. **Merge:** Once checks pass, the merge bot rebases and merges the feature branch into `main`.  The branch is deleted.
6. **Conflict resolution:** If multiple agents modify the same file, the merge bot detects conflicts and requests the planning agent to schedule a resolution task.
7. **Documentation:** Agents update relevant docs in `docs/` when modifying features.  Documentation changes are mandatory for feature PRs.

## 9. LLM Orchestration Plan

### Roles

1. **Planner/Researcher:** GPT‑5 and Gemini cross‑validate research (market data, legal, design patterns).  They produce reports and maintain an open questions board.
2. **Architect/Spec Writer:** GPT‑5 converts high‑level requirements into PRDs, TDDs, API schemas and test plans.
3. **Implementer/Test Author:** Cursor agents (specialized coding LLMs) write code and unit/integration tests according to specs.
4. **Narrative Generator:** LLMs craft scouting reports, news articles and event descriptions using templates.  They ensure tone consistency.
5. **Quality Gate/Reviewer:** GPT‑5 reviews code for style, correctness and performance; ensures determinism tests pass; flags potential design violations.

### Coordination

* Agents communicate via GitHub issues, PR descriptions and commit messages.  The planner maintains a Kanban board.
* The reviewer can request additional clarification from the planner if specs are ambiguous.
* A daily sync (automated summary) logs progress, blockers and tasks for the next day.

## 10. Marketing & Go‑to‑Market Strategy

1. **Positioning:** Market Viridian Football as the definitive NFL GM simulation: “Go beyond fantasy.  Build a dynasty.”  Emphasize emergent storytelling, realism and modding.
2. **Pricing:** Target a premium price of $30–$40 for the base game.  Offer a limited‑time discount for early adopters.  Future DLC (e.g., women’s league, online leagues) sold separately.
3. **Distribution:** Launch on Steam and itch.io with Windows/Mac/Linux builds.  Evaluate console ports post‑launch.  Provide a free demo that allows players to simulate one season with limited features.
4. **Community building:** Open a Discord server and subreddit.  Share development blogs, behind‑the‑scenes videos and dev diaries.  Run fantasy‑style contests (e.g., predict rookie success) with in‑game rewards.
5. **Influencer outreach:** Partner with fantasy‑football podcasts, analytics bloggers and YouTube creators for previews and beta access.  Highlight how the game appeals to fantasy players (draft strategy, roster management) while offering a deeper experience.
6. **Press relations:** Pitch to PC gaming sites, sports outlets and indie game journalists.  Use data points like Football Manager’s success and fantasy‑sports numbers to contextualize the market.
7. **Launch campaign:** Release a trailer showcasing UI, draft excitement and narrative events.  Offer pre‑orders with a discount and exclusive cosmetic pack (fictional team logos).  Engage players through a Twitch stream of the AI simulating a season live.

## 11. Operational Runbook

### Pre‑Launch

* **Internal playtesting:** Simulate multiple seasons, track anomalies (e.g., unrealistic stats), adjust algorithms.  Use property‑based testing to detect regressions.
* **Localization:** Prepare translation files for major languages (English, Spanish, French); recruit volunteer translators early.
* **Store setup:** Create store pages, upload assets, configure pricing.  Prepare store QA checklists.
* **Legal checks:** Ensure there are no infringing names or logos.  Provide clear EULA and modding terms.

### Launch

* **Monitoring:** Use analytics to track crashes, performance metrics and user engagement.  Set up alerting for high crash rates.
* **Support:** Create a support email and ticketing system.  Document troubleshooting steps (e.g., GPU driver issues, corrupted save files).  Provide a FAQ on the website.
* **Community management:** Assign community moderators; enforce code of conduct.  Encourage bug reports and suggestions via Discord and GitHub Issues (for public bug tracker).

### Post‑Launch

* **Patch cadence:** Commit to bi‑weekly hotfixes for critical bugs and monthly content updates.  Use version numbers (v1.0.1, v1.1.0) and maintain release notes.
* **Feedback loop:** Collect telemetry on popular features, time spent in menus, difficulty spikes.  Conduct player surveys.  Adjust balancing and UI based on feedback.
* **Expansion planning:** Evaluate adding women’s leagues, online multiplayer, mobile ports or 3D match engine depending on sales and budget.

## 12. Learning Plan for the Developer

Given the ambitious scope and limited human bandwidth, the solo developer must deepen expertise in several areas.  Prioritized learning objectives include:

1. **Rust & WebAssembly:** Complete the “Rust Book” and “Rustlings” exercises; follow tutorials on writing WebAssembly modules.  Study open‑source Rust game engines (Bevy, Amethyst) for inspiration.
2. **NFL salary cap rules & CBA:** Read resources such as OverTheCap, Spotrac and the NFL CBA to understand contract structures, guaranteed money, cap rollover, franchise tags and trade implications.  Summarize rules in a reference doc for AI agents.
3. **Game AI & Decision‑making:** Review literature on decision trees, utility functions and multi‑agent systems.  Study how Football Manager and Out of the Park Baseball implement AI managers.
4. **UI/UX design:** Learn React best practices, state management patterns (Redux, Zustand), and accessibility guidelines.  Review the provided UI/UX style guide.
5. **Narrative design:** Read articles on emergent narrative and dynamic storytelling.  Examine how games like RimWorld and Crusader Kings generate stories from systems.
6. **CI/CD & DevOps:** Familiarize with GitHub Actions, containerization (Docker) and packaging for cross‑platform releases.  Learn to configure release pipelines and auto‑update mechanisms.

## 13. Conclusion

Viridian Football combines a clear market opportunity—millions of fantasy‑football players hungry for deeper simulation—with a unique development model powered by AI agents.  A modular Rust‑based engine, deterministic simulation and a modern React UI underpin the product.  The project prioritizes emergent narratives and authentic management mechanics while embracing modding and community.  Through disciplined scope control, automated development workflows and targeted marketing, a solo developer can deliver a commercial‑grade NFL GM simulation.  As the game evolves, feedback loops and expansions will keep the community engaged and solidify Viridian Football as the gold standard in its niche.