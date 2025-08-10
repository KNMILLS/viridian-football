# Viridian Football: Vision, Market Brief and System Architecture

## Vision and Product Differentiation

**Viridian Football** aims to become the **most complete, realistic and replayable NFL‐style general‑manager simulator** ever made.  The game focuses on **strategic decision‑making and management** rather than on-field action.  Players act as the general manager (GM) of a fictional American‑football franchise, dealing with roster construction, scouting, drafting, contract negotiation, salary‑cap management, coaching hires, and media/ownership relations.  The core vision emphasises:

* **Depth and realism** – The simulation must reproduce the complexity of NFL front offices.  Features proposed in the design documents include a **Fog of War** system (players and coaches have incomplete information, making scouting and drafting uncertain) and a dynamic environment where coaching schemes, morale and venue factors influence performance【143181529883780†screenshot】.  The game will also model off‑field dynamics such as player personalities, locker‑room chemistry and media relations.
* **Emergent storytelling** – The Unified Simulation Engine (USE) concept describes a modular system that simulates on‑field gameplay and off‑field events in a single underlying model.  Interactions between players, coaches, finances and the environment create **emergent narratives** rather than scripted outcomes【143181529883780†screenshot】.
* **Modding and community support** – Because official NFL licensing is expensive and risky, the game will ship with fictional teams and players but provide tools to import custom names, logos and rosters.  This encourages a **modding community** while avoiding trademark issues【143181529883780†screenshot】.
* **LLM‑first workflow** – The game will be built by a solo developer leveraging GPT‑5, Gemini and Cursor AI agents for nearly all implementation.  The architecture and repo must therefore support automated code generation, testing and continuous integration without human bottlenecks.

## Market Analysis

### Underserved American‑Football Management Niche

Research documents note that the American‑football management space is **underserved**: existing titles like Front Office Football and Football GM offer deep but clunky interfaces, and players tolerate shortcomings simply to enjoy a franchise‑mode experience【143181529883780†screenshot】.  This creates an opportunity for a polished and modern GM simulator.  The success of deep management sims in other sports further validates the potential:

* **Football Manager (soccer)** – Sports Interactive announced that **Football Manager 2024** recorded its **seven‑millionth player** less than 100 days after launch, breaking the previous record of 6.88 million players and making it the best‑selling entry in the series’ history【229978427176433†L144-L165】.  Studio director Miles Jacobson noted that the game has grown from “two million players in 2020 to seven million in 2024”【229978427176433†L161-L183】.  This demonstrates that **hardcore management simulations can achieve mass appeal** when executed well.
* **Global simulation‑game market** – According to a global simulation game industry report, the simulation games market was valued at **US $21.48 million in 2025** and is projected to grow to **US $42.15 million by 2033** (a **compound annual growth rate of 8.79 %**)【551799096061594†L60-L65】.  The report notes that **user‑generated content and modding support** are key trends driving demand【551799096061594†L60-L65】, aligning with Viridian Football’s planned modding features.

### Competitor Landscape

| Game/Series | Platform & Business Model | Strengths | Weaknesses / Gaps |
|---|---|---|---|
| **Front Office Football** (Solecismic Software) | Desktop (Windows), paid download | Deep statistical simulation, longstanding fan base. | User interface is dated and clunky; limited marketing; small development team results in slow updates. Players tolerate poor UX because there are few alternatives【143181529883780†screenshot】. |
| **Football GM** (ZenGM) | Free web-based, open source | Browser‑accessible, mod‑friendly; multiple sports. | Simplistic visuals and limited financial depth.  Not focused on NFL realism; roster and contract rules approximate but not identical to NFL norms. |
| **Axis Football** (Axis Games) | PC/console, premium | Real‑time 3D on‑field simulation with customizable franchise mode. | On‑field play is physics‑based but AI and management depth are shallow; lacks robust GM mechanics. |
| **Madden NFL Franchise Mode** (Electronic Arts) | Console/PC, premium | Official NFL license, polished graphics, large audience. | Franchise mode receives limited attention compared with on-field play; simulation lacks realism, and long‑term depth is shallow; microtransactions frustrate players. |

The competitor analysis shows a gap: **no current product combines robust American‑football management depth with a modern user experience**.  Viridian Football will differentiate itself through emergent realism, modding, and an AI‑assisted GM experience.

### Audience & Target Segments

* **Core market** – Enthusiasts of sports management sims who are dissatisfied with existing NFL franchise modes.  They value realism, strategic depth and long‑term replayability over graphics.
* **Strategy gamers and statisticians** – Players who enjoy running simulations and analyzing data; they may come from sports analytics backgrounds and will appreciate the detailed salary‑cap and scouting systems.
* **Modders and content creators** – People who want to create custom leagues and rosters; modding support fosters community engagement and extends the game’s lifespan.

Pricing will likely be a **premium one‑time purchase** for the base game (e.g., $30–$40), with potential for optional DLC expansions or cosmetic packs.  Distribution channels could include Steam, itch.io and direct download.  The marketing strategy should emphasize authenticity, community engagement (developer diaries, dev streams) and highlight that the project is built **by a solo developer using AI agents**, tapping into the indie‑dev narrative.

## High‑Level System Architecture

### Design Principles

* **Modularity** – Separate modules for on‑field simulation, off‑field management, AI, UI, persistence and analytics enable parallel development by AI agents.  Modules communicate via defined APIs and data contracts.
* **Determinism and reproducibility** – The simulation engine should produce the same results given the same inputs to allow debugging, testing and fair competitive play.
* **Simplicity and performance** – A ratings‑driven engine is preferred over real‑time physics for the first version because it is easier to build and allows faster simulations.  Real‑time 3D could be considered post‑launch if resources allow.

### Unified Simulation Engine (USE)

The USE concept from the research documents proposes a single simulation core that models both **on-field play** and **off-field systems**.  The engine is composed of modules:

| Module | Role |
|---|---|
| **Roster & Player Models** | Data structures representing players (attributes, positions, contracts, morale), teams and coaches.  Should support dynamic rating changes (progression, regression, injuries). |
| **Draft & Scouting** | Implements Fog of War; players’ true abilities are hidden behind scouting grades that depend on scout quality and resources【143181529883780†screenshot】.  The draft system must support custom draft pools and narrative events. |
| **Game Day Simulation** | Simulates matches based on player ratings, coaching strategies, fatigue and weather.  Because the initial version will use a ratings‑driven model, this module computes play outcomes probabilistically rather than rendering 3D animations.  External “physics wrappers” can be added later. |
| **Economics & Finance** | Manages contracts, salary cap, revenue sharing, ticket sales and stadium operations.  Includes AI negotiation and logic for restructures, trades and free agency.  The design document notes the importance of **weaponizing the salary cap** to gain competitive advantage【143181529883780†screenshot】. |
| **AI GM & Coach Agents** | Implements several GM archetypes (aggressive trader, cap miser, culture builder, etc.) and coaching philosophies.  The **Archetypes of Professional Sports GMs** document provides personality templates and decision heuristics (e.g., risk tolerance, focus on analytics, negotiation style)【143181529883780†screenshot】.  These archetypes drive opposing teams’ behaviour and add variety. |
| **Narrative & Events** | Generates dynamic storylines (player controversies, owner demands, media questions) and tracks relationships.  Drives emergent narratives that tie player actions to consequences. |
| **Persistence Layer** | Stores the entire simulation state (teams, players, season history, user settings) in a deterministic, queryable database.  SQLite or PostgreSQL is suitable for the desktop release; an ORM layer facilitates queries from AI agents. |
| **Analytics & Telemetry** | Collects simulation data (play outcomes, team performance, financial reports) for post‑game analysis and tuning.  Provides dashboards for players and for internal balancing.

### Game Wrapper & Front End

* **UI layer** – Built with a modern framework such as **React** (web) or **Tauri/Electron** (desktop) to deliver a responsive, data‑dense dashboard UI.  The **UI/UX Style Guide** suggests a dark “broadcast” theme, modular panels, minimal animations and keyboard‑driven navigation【143181529883780†screenshot】.  The front end will call engine APIs to fetch simulation data and send user actions.
* **Service layer** – A thin API (REST or gRPC) that exposes engine functions (advance week, sign player, propose trade) to the UI.  This allows separation between simulation and presentation and makes automated testing easier.
* **Modding layer** – Tools for importing/exporting JSON or YAML files containing rosters, draft classes and league settings.  The game will include a “workshop” page for sharing mods and will support injecting user‑provided scripts for custom logic.

### Technology Stack Proposal

| Layer | Proposed Technology | Rationale |
|---|---|---|
| **Core Engine** | **Rust** for performance and safety; modules compiled to WebAssembly for cross‑platform embedding.  Python may be used for prototyping AI logic. | Rust’s speed and deterministic behavior make it ideal for simulations; WebAssembly allows embedding in desktop/web front ends. |
| **AI Integration** | Python (with libraries like **NumPy**, **SciPy**, **Pandas**) and LLM services (GPT‑5, Gemini) orchestrated via an agent framework (e.g., **LangChain**). | Python’s ecosystem facilitates machine‑learning prototypes and data analysis; LLMs assist with generating code and narratives. |
| **UI** | **React** + **TypeScript** for a web/desktop hybrid UI; packaged via **Tauri** for native desktop builds. | React provides a component‑based architecture; Tauri bundles the web UI into a lightweight desktop application without heavy Electron overhead. |
| **Database** | **SQLite** for offline mode and **PostgreSQL** for server‑hosted or multiplayer future versions. | Both support transactions and deterministic queries; easily accessible via Rust and Python. |
| **CI/CD & Testing** | GitHub Actions for continuous integration; unit, integration and property‑based tests; static analysis (e.g., Clippy for Rust, ESLint for JavaScript) and determinism checks. | Enables AI agents to push code that is automatically linted, tested and built before merging.

## Next Steps and Research Items

1. **Competitor data & pricing** – Collect more precise sales or player counts for Front Office Football, Football GM, Axis Football and other sports management titles.  Use tools like SteamDB for concurrency and revenue estimates to quantify the gap.
2. **Legal & Licensing** – Consult legal resources to confirm safe use of fictional leagues, evaluate potential costs of an NFLPA license (for player names only) and consider fair‑use limits for referencing real statistics.  Determine whether a fully unlicensed approach suffices for the initial release.
3. **Player retention mechanics** – Research successful retention strategies in Football Manager (e.g., achievements, interactive media, dynamic owner goals) and plan features such as career mode progression, leaderboards and off‑season storylines.
4. **Salary cap & CBA rules** – Build a learning plan to master the NFL Collective Bargaining Agreement (CBA), salary‑cap mechanics, rookie contracts and franchise tags.  Acquire or create data sets of historical contracts for realism.
5. **User research & UI mockups** – Conduct surveys or interviews with sports management enthusiasts to validate UX preferences and information density.  Produce early wireframes following the style guide to test layout.
6. **Prototyping & Proof‑of‑Concept** – Implement a minimal USE prototype in Rust or Python that simulates a simplified game (e.g., two teams, basic player ratings, draft, and finances).  Use this to validate performance and determinism and to refine data structures.
7. **Learning plan & agent orchestration** – Identify your own knowledge gaps (e.g., Rust or WebAssembly proficiency) and gather resources (books, courses).  Design the multi‑LLM workflow (planner, architect, implementer, quality gate) and decide how and when human input intervenes.

## Conclusion

Viridian Football targets a **clear gap** in the video game market: there is **no high‑quality, deep and modern American‑football management simulator**.  Building on lessons from successful titles like Football Manager—whose latest edition reached **seven million players within three months**【229978427176433†L144-L165】—the project will deliver an authentic GM experience with emergent narratives, modding support and a workflow optimized for AI‑driven development.  A modular system architecture, a deterministic simulation engine and a carefully designed GitHub workflow will allow the solo developer to leverage LLM agents efficiently while maintaining high quality.  The next stage involves collecting more detailed competitor data, refining the legal plan, drafting the game design document and finalizing the architecture before scaffolding the repository.