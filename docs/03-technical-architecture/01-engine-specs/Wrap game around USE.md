Great. I’ll research how to wrap the Unified Simulation Engine (USE) into a complete, realistic NFL GM simulation game using fake teams and players. The goal is to analyze how to structure and build the full game stack around USE using Cursor AI.

The resulting prompt will:

* Review all non-USE code in the repo to decide whether it should be kept, adapted, or removed.
* Recommend a clean architecture for wrapping USE with full game systems (UI, API, persistence, frontend/backend).
* Provide a step-by-step plan for using Cursor agents to build each system.

I’ll get started and let you know once the research and final integration prompt are ready.


# Integrating the USE Engine into an Ideal NFL GM Simulator Game

Building the ideal NFL General Manager simulator involves more than just a powerful simulation engine – it requires wrapping that engine in a full-fledged game framework. This “game wrapper” includes the user interface, data management (teams, players, schedules), and supporting systems that turn the raw **Unified Simulation Engine (USE)** into a playable game. Below, we detail how to put a game wrapper around the USE engine using fictional teams and players (no NFL license), achieving a **100% realistic pro football universe** in gameplay. We also discuss whether to target web or desktop platforms, how to structure the codebase, and how to leverage AI agents to implement the remaining features.

## Overview of the USE Engine and Game Wrapper Role

The **Unified Simulation Engine (USE)** is the core simulation module that handles the heavy lifting of realism – from play-by-play game outcomes to player progression and AI decisions. It’s essentially the “brain” of the simulator, modeled to reflect NFL complexity (e.g. play results factoring player skills, morale, chemistry, etc.). By itself, however, the engine is just a library or service; a *game wrapper* is needed to present a playable experience. This wrapper encompasses all the elements external to the engine, such as:

* **User Interface (UI) and User Experience (UX):** Menus, screens, and interactions that allow the player to act as a GM (roster management, draft war room, contract negotiation, etc.). The UI must surface the engine’s data in a clear, immersive way.
* **Game State Management:** Loading or initializing league data (teams, players), advancing through the league calendar (season schedule, offseason phases), and saving/loading progress. These systems feed the engine with data and handle outputs (e.g. updating standings or player stats after the engine simulates games).
* **Control Logic:** The “game loop” that ties everything together – e.g. prompting the engine to simulate a week or a game when the player advances, then updating the UI and databases accordingly.
* **Data Persistence:** Storing league information. For a web app this likely means a server-side database (like PostgreSQL) to store teams, players, and stats. For a desktop game, it could mean local files or an embedded DB (SQLite/H2) for saves.
* **Auxiliary Features:** Anything not in the engine’s scope, such as a news feed, tutorial guidance, or modding support, implemented at the game layer.

In short, the game wrapper is what turns the USE engine into a **playable GM simulator**, managing input/output and ensuring the simulation results are presented meaningfully to the player.

## Using Fictional Teams and Players (No NFL License)

To avoid legal issues and high licensing costs, the game will use **fictional teams, players, and leagues** by default. This means the wrapper must generate or load fake names and identities that still feel authentic to pro football. Fortunately, the target audience of hardcore sim players is generally accepting of unlicensed content as long as the strategic depth and realism are top-notch. Here’s how to implement a convincing fictional football universe:

* **League Structure:** Mirror the NFL’s structure for realism, but with fictional franchises. For example, a 32-team league with divisions and conferences can be created, but with made-up team names, logos, and cities. The game could ship with a set of pre-made fictional teams (e.g. *"Santa Fe Scorpions"* or *"Memphis Knights"*) to provide an immersive starting point. Ensure all NFL rules and calendar events are represented (e.g. 53-man rosters, a 16/17-game regular season, playoffs, franchise tag, etc.) so that despite fake names, the *experience* is true to the NFL.
* **Player Generation:** Develop a system to create fictional players with realistic attributes and names. This could involve databases of first and last names (possibly drawn from common American names or past player name data) to randomly generate names. Attributes can be assigned based on position prototypes and some randomness, so that the distribution of talent feels natural (e.g. only a few “elite” players, many average, some busts, etc.). Ensure that hidden traits and personality values are included to support the engine’s deep dynamics. The goal is a roster set that could plausibly exist in an NFL-like world, just without real people.
* **No Real Logos/Trademarks:** Use custom logos or simple color schemes for teams. The UI should avoid any NFL trademarks. Many indie sports sims handle this by providing basic geometric logos or letting the community create their own.
* **Modding Support:** **Encourage community mods** so players who crave real NFL rosters can import them easily. A truly dedicated fan base will often create a roster pack with real names, and if the game is moddable (e.g. allows importing a CSV of team/player data or adding custom images), it adds value. For example, **Draft Day Sports: Pro Football** ships with generic teams/players due to no NFL license, but it relies on user-made mods to swap in real NFL names and logos. Your simulator should likewise make it easy to load custom team names, player data, and images. Designing the data format for teams/players in a human-editable way (like JSON or spreadsheets) and providing modding guides as part of the wrapper can help the community extend the game.
* **Realism with Fiction:** Even with fictional names, strive for **100% realism in rules and behavior**. The engine already targets ultra-realistic outcomes and decision-making. The wrapper should complement that by enforcing things like realistic salary cap rules, contract structures, draft order logic, etc.. The lack of real names does **not** mean a lack of authenticity – fans will appreciate a “real NFL universe in all but name.” In fact, many players are willing to overlook missing licenses if the game nails the NFL’s strategic nuances and complexity.

By using fictional content out-of-the-box, you save costs and retain flexibility. Just be sure the game wrapper treats this as a feature: highlight the customization ability and perhaps include multiple fictional league setups (for example, a default 32-team league, but also the ability to create a smaller custom league if desired). This can turn a licensing limitation into a selling point for creativity and community involvement.

## Platform Considerations: Web-Based vs Desktop Application

An important early decision for the game wrapper is whether the simulator will run as a **web-based application** or a **desktop application**. Each approach has trade-offs, and given the complexity of the USE engine, you must consider performance, accessibility, and development effort. In fact, the project can be structured to support both platforms from a single codebase – a hybrid approach that many sports sims use.

**Web-Based (Browser) Game:** This would involve running the simulation engine on a server and providing a web front-end (HTML/JavaScript) for the user. The front-end (built with a framework like React, Vue, or Angular) would communicate with the backend via API calls. Key points for a web approach:

* *Pros:* Instant accessibility (players just go to a website, no install), easy to push updates to all users, and inherently ready for online multiplayer or leagues since the server can host a shared world. It’s also platform-agnostic – works on PC, Mac, mobile browsers, etc..
* *Cons:* Heavy simulations can be taxing on a server and may require significant optimization or expensive hosting to handle long multi-season runs. There are ongoing server costs and maintenance, and offline play is not possible unless you package a local version or PWA (Progressive Web App) for users. Also, developing both a backend and frontend is essentially building two applications (though the backend can be minimal if the logic is mostly in the engine).
* *Engine Integration:* You’d likely wrap the Java-based USE engine in a web API (for example, a Spring Boot or Node.js server that calls the engine’s Java code). This could mean running the engine as a separate process or service the web server calls, or using something like Java’s built-in web server capabilities. The conversation design recommended exposing the engine via REST API calls for a web deployment. Essentially, the engine becomes a microservice: the client (browser) requests “simulate week 5” or “execute trade X”, and the server side uses the engine to process it and returns the results.

**Desktop (PC) Game:** This would bundle the engine and UI into a standalone program (for Windows/Mac/Linux). Likely, you’d use a UI toolkit or game library in Java (since the engine is in Java) such as **JavaFX** or a lightweight game framework like **LibGDX** to build the interface. Key points for a desktop approach:

* *Pros:* Better performance potential (everything runs locally – no network overhead – so decades of simulation can run faster), full access to the user’s hardware resources, and the ability to play offline. No ongoing server costs or dependencies. Modding might be easier because users can directly modify files in their install.
* *Cons:* Reaching users is harder (they must download and install the game), and updates require patch downloads. Multiplayer is not inherently supported without building networking, limiting it mostly to single-player unless you invest more effort. Also, you’d need to ensure the Java UI is polished; some desktop Java UIs can feel dated if not carefully designed.
* *Engine Integration:* The engine can be called directly as a library within the desktop application. For example, the JavaFX UI can instantiate the simulation engine classes and call their methods in response to user actions (possibly on a background thread for long simulations to keep the UI responsive). This is a simpler integration than the web case, since it’s just in-process calls.

**Hybrid Approach – Best of Both:** It’s possible (and often ideal) to design the project such that the core engine is platform-independent and you build both a web interface and a desktop interface on top of it. This was actually the recommended path in the design conversation: develop the **core engine in Java** and then have **two front-ends** – one as a web service + browser UI, and another as a desktop app using Java UI libraries. Both front-ends use the same underlying logic. In practice, this means structuring the code into modules (more on that below) such that the engine is isolated and can be invoked by either a web controller or a desktop UI. Out of the Park Baseball and Football Manager use a similar model – a shared simulation core with multiple platform targets (FM even has a Touch version vs PC version using the same logic).

Given the goal of widespread adoption **and** the heavy simulation complexity, supporting both might be wise. You could prioritize one for initial development (perhaps desktop for a robust offline single-player beta, then web for a later online experience) but keep the architecture flexible. The **hybrid architecture** allows, for example, a hardcore player to run long offline careers on their PC, while also allowing the possibility of an online league mode hosted on a server in the future.

To summarize platform guidance: *if feasible, design for both.* If you must choose one to start, decide based on your resources:

* If you want quick tester access and easier UI development with web tech, start with a web app (engine as a service).
* If you need maximum simulation performance and have more Java expertise, start with a desktop app (engine and UI together).
  Either way, ensure the engine’s APIs are clean so it can be reused if you later expand to the other platform.

## Codebase Structure and Legacy Code Audit

With the new USE engine in hand, the next step is to organize the project and integrate (or replace) any existing components outside the engine. A clear module structure will help separate concerns and make it easier to maintain both a web and desktop version. Here’s a suggested high-level code structure adapted from the hybrid approach mentioned above:

* **Core Engine Module (`/core-engine`):** Contains all simulation logic and models. This is the heart: Java classes for players, teams, games, the simulation processing (game outcomes, season progression), AI decision-making, etc. **No UI or platform-specific code** lives here – it should be usable by any interface. For example, classes like `Player`, `Team`, `LeagueManager`, `GameSimulator`, `TradeAI` would reside in this module.
* **Desktop Client (`/desktop-client`):** The desktop application code. For instance, a JavaFX UI implementation with screens for roster view, draft, etc., and a `DesktopLauncher.java` to start the app. This module would depend on `core-engine` (calling its APIs). It might also include desktop-specific utilities (e.g. file I/O for saves, or integration with OS windows).
* **Web Server (`/web-server`):** The web service layer for an online version. This would be a separate program (e.g. a Spring Boot app, or Node.js service calling a Java library) that exposes RESTful endpoints to a web client. For example, endpoints like `/api/simulateWeek`, `/api/getTeamRoster` would invoke the core engine logic and return data. This module also handles persistence (connection to a database like PostgreSQL, and translating between engine objects and database records). It essentially wraps the engine for remote use.
* **Web Client:** (If building a full web app) – the browser-based UI (HTML/JS/CSS, possibly in a separate repository or directory since it could be a pure front-end). This isn’t applicable to a desktop-only approach, but in a web/hybrid scenario, you’d have a React or Vue project for the client that communicates with the web-server API.

This separation ensures that upgrading the engine or adjusting simulation details doesn’t break the UI, and vice versa – they interact through well-defined interfaces. It also allows parallel development (one can work on UI while another works on engine logic, etc.).

**Reviewing Existing Code (“Outside” the USE Engine):** If you have legacy code or previous project files in the repository, now is the time to audit them for relevance:

* **Identify Redundant or Outdated Code:** Anything that the new USE engine replaces should be removed or refactored. For example, if there was an older simulation engine or stub functions for game outcomes, those are now superseded. Keeping old simulation code could cause confusion or conflicts. Similarly, old data models (player/team classes) might be redundant if the engine introduces new ones – prefer the engine’s versions for consistency.
* **Salvage Useful Components:** There may be parts of the old code that still serve a purpose and can integrate with the new engine. Common examples:

  * *UI prototypes:* If you had started a frontend (say a web page or a Java Swing UI) that can be adapted to use the engine’s outputs, consider keeping it as a foundation (keeping in mind it might need rewiring to call the engine’s API). If the old UI was in a different technology (e.g. an unfinished Unity or Unreal attempt), it may not be directly reusable – evaluate if rewriting in the new chosen framework is easier.
  * *Utility Functions:* Perhaps code for loading data from files, configuration settings, or helper math functions – if these are still useful, port them into the new structure. For instance, a CSV parser for roster input could be reused to load fictional rosters.
  * *Database or Persistence Code:* If you have existing SQL schemas, migration scripts, or save/load logic from a prior iteration, assess if it fits the new design. The new engine’s data needs might differ, but earlier work on persistence could provide a starting point. Ensure that any schema aligns with the engine’s object model (e.g. tables for players, teams, contracts, etc. as outlined in design docs).
  * *AI or Algorithm Prototypes:* Perhaps you experimented with a trade logic or draft algorithm outside the engine. Compare it to the engine’s built-in AI. If the engine lacks something (say, no schedule generator or a certain AI behavior), you might integrate your prototype into the engine module. Otherwise, drop the old version in favor of the engine’s approach.
* **Remove Completely Obsolete Files:** Anything that is not going to be used or updated should be pruned to avoid confusion. For example, placeholder text files, old design sketches, or scripts for a different engine. Keeping the repo clean will also help your AI agents (and human collaborators) focus on the current plan.

Performing this audit will ensure that only relevant, adaptable code remains. The outcome should be a repository where the **new engine is central**, and all supporting code is either updated to work with it or cleared out. Remember to update documentation as well – if the README or design notes still reference the old approach, revise them to prevent missteps by anyone reading them.

**Adapting Kept Code:** For any code outside the engine that you decide is worth keeping, plan the necessary adaptations:

* Change old data structures to use the engine’s structures. For example, if the old UI had its own Player class, refactor it to use the `core-engine.models.Player` class instead (or to display data from it).
* Update function calls to go through the engine’s API. If the old code directly manipulated game state, it should now call engine methods. For instance, instead of directly adjusting a player’s rating in UI code, call an engine function to do so (or adjust, then inform the engine).
* Re-test any integrated piece to ensure compatibility with the engine. This is where writing some unit tests or using AI to quickly sanity-check integration can help.

By the end of this process, your codebase should be well-structured with a clean separation of concerns. A developer (or AI agent) should be able to clearly see the **engine module** vs the **UI/Wrapper modules**, and any extraneous remnants of previous versions will be gone or refactored.

## Ensuring a Realistic Pro Football Experience

Achieving a *“100% realistic pro football universe”* is a guiding principle for this project. This goes hand-in-hand with the engine’s design, but the wrapper must reinforce it. A few considerations to ensure no detail is missed:

* **Implement Full NFL Rules & Mechanics:** The game wrapper should enforce things like roster limits, game clock rules for simulations, trade deadlines, draft rules (e.g. draft order, compensatory picks), free agency timing, salary cap and contract rules (the engine likely calculates cap and contract effects, but the UI should present and restrict inputs accordingly). The design docs listed many of these as must-have features. For example, include preseason and roster cutdown phases, a practice squad, injured reserve rules – these add authenticity.
* **Accurate Scheduling:** Ensure the league schedule generation mimics the NFL (if using 32 teams, follow the NFL’s pattern of intra-division, inter-division matchups, etc.). If the engine doesn’t generate schedules, create a schedule maker or use a known algorithm to produce a balanced schedule and playoffs bracket.
* **Statistical Realism:** The wrapper should perhaps include a **data calibration step** or at least configuration for the engine so that simulated stats fall in realistic ranges. Using historical NFL data as a reference can be useful. For instance, if the engine outputs seem too high-scoring or too many player injuries, the wrapper (or engine config) might adjust modifiers. This might be done by feeding the engine certain tuning parameters (which could be stored in a config file the game loads on start, making it easy to tweak without recompiling the engine).
* **Dynamic World and News:** Consider adding a news/events system outside the engine to report what’s happening in the league (trades, signings, injuries). While not strictly necessary for simulation, it significantly increases the *“living world”* feel. It can be relatively simple text generation or a template-driven system that reads engine outputs (e.g. “Star QB of \[Team] broke a record with 5000 yards this season”). This makes the world feel authentic and alive, addressing common immersion feedback from players who want a *“living league”* beyond just numbers. An AI agent could even help generate flavorful news blurbs given some data (using a GPT model to turn a stat line into a short news story, for example).
* **Balance and AI Logic Checks:** The wrapper is where you can implement difficulty settings or AI behavior tuning. For realism, ensure that AI GM decisions (trades, draft picks, etc.) make sense – you might have a configuration for how strict the AI follows certain archetypes or if any handicaps are needed to keep challenge appropriate. Any observation of un-realistic AI moves in testing can often be adjusted either in the engine or via constraints in the game logic (e.g. “disallow trading a franchise QB unless certain conditions” if the AI does something wild).
* **User Feedback Loops:** Provide the player with enough information to understand the realism. For example, include detailed statistics pages, history logs, and maybe comparison to real-world benchmarks (if not with real names, perhaps with hall-of-fame records or generic records to chase). This gives context that the simulated universe is behaving like a real one. If a fictional running back gains 2,000 yards, the game could note “(League Record)” to signal the magnitude, much like real NFL commentary.

All these elements ensure that even though the teams and players are fictional, the **feel is authentic NFL**. This dedication to realism will likely satisfy the enthusiast audience (who, as research showed, are willing to overlook lack of official names as long as the depth and authenticity are there).

## Development Plan and AI Assistance for Completion

With the plan set for *what* to build, the final step is *how* to build it efficiently. This is where leveraging **AI agents** (like ChatGPT or coding assistants) can dramatically speed up development. In fact, you can prepare a single comprehensive prompt (as you requested) to guide an AI through the code integration and creation process. Below is a suggested development roadmap, with notes on how to utilize AI at each stage:

1. **Automated Codebase Review:** Use an AI agent to analyze the current repository structure. For instance, you could prompt: *“Here is a list of files in my project... (list them) ...Please determine which files pertain to the old simulation logic or other outdated code. Propose which ones to keep for integration with the new USE engine and which to discard.”* The AI can read file names and even contents (if provided) to identify duplicates or obsolete modules. This helps ensure nothing important is overlooked in the cleanup. The agent might respond with a categorized list of modules and recommendations (e.g. “OldEngine.java – likely obsolete given USE engine; recommend removal”, “UIPrototype.jsx – could be adapted to new API”).
2. **Codebase Refactoring & Structure Setup:** Once you confirm which parts to keep, instruct the AI to reorganize the project. For example: *“Restructure the project into the following modules: core-engine, desktop-client, web-server. Create necessary directories and move files accordingly (we will do this conceptually). Ensure import paths are updated. Outline the new project structure in a tree format.”* The AI, understanding the plan, can generate a file tree and even the build configuration (e.g. Gradle or Maven subprojects, if using Java) to support the multi-module setup. This establishes the skeleton.
3. **Integrating Existing Code with the Engine:** Use the AI to update kept code to work with the USE engine. For instance: *“Here is the code for the previous `TeamScreen.java`. Modify it to use the new `Team` model from the core engine (fields X, Y, Z) and to remove any direct simulation calls in favor of calls to the engine API.”* By providing a snippet of old code and details of the new engine’s interface, the AI can output a revised version. Do this for each component that needs adjusting. This step-by-step guidance to the AI can systematically eliminate references to old systems and replace them with engine calls.
4. **Implementing New UI and Features:** Many parts of the game wrapper will likely need to be created from scratch – for example, a brand new **Draft interface**, **Free Agency bidding UI**, etc. Tackle these one at a time using AI as a coding partner:

   * **Design the Interface:** Prompt the AI to generate React components or JavaFX scenes for each screen. E.g., *“Create a React component for the Draft War Room screen. It should display a list of available players (with attributes), my team needs, and incoming trade offers (if any). Include placeholders for functionality like ‘Draft Player’ button and ‘Review Offer’ dialog.”* The AI can output JSX code or Java code for UI, which you can then integrate and tweak.
   * **Connect to Engine/API:** For web, have the AI generate stub API endpoint code. E.g., *“In the Spring Boot controller, write an endpoint `/api/draftPlayer` that takes a playerId and teamId, calls the engine’s draft function, and returns an updated list of team players.”* It can produce a draft implementation that you then adjust to the engine’s actual method signatures. For desktop, you might ask for an event handler: *“When the user clicks ‘Draft Player’, call `LeagueManager.draftPlayer(teamId, playerId)` from the core engine and then refresh the UI list.”*
   * **Validate and Refine:** After each AI-generated piece, test it (or have the AI write a quick unit test). Use the AI to fix any errors or adjust logic. This interactive development can rapidly build out all the screens and menus specified in the design (roster management, trades, contracts, etc.), guided by the design document’s requirements which you can feed to the AI in pieces.
5. **AI-Generated Content & Tuning:** You can even use AI for content generation tasks in the game:

   * **Name Generation:** Ask the AI to output a list of 1000 fictional player names or team nicknames. These could seed your name databases.
   * **News Blurbs:** Use prompting for template texts, as mentioned earlier, to make the news system more colorful.
   * **Testing Scenarios:** You could instruct the AI to simulate certain league scenarios by calling engine functions (if you expose a scripting console or simply by writing a test) – this can help in quickly verifying that, say, trades work or a full season runs without crashes. The AI might catch edge cases or suggest improvements (for instance, if it observes that many teams end up 8-8, it might hint at parity being very high – something you then adjust).
6. **Iteration and Feedback:** After implementing core features, run a few simulated seasons and gather feedback (from testers or your own observations). Use the AI to analyze this feedback. For example, compile notes like *“AI teams rarely sign free agents due to cap mismanagement”* and ask the AI how to improve the free agency AI. It could suggest adjustments to the algorithm (perhaps the engine’s AI module) which you can then implement. Essentially, the AI can serve as a rubber duck and an advisor for tough design tweaks (citing known strategies from other games or logical approaches).
7. **Final Polishing:** Use AI to polish text in the UI (tooltip explanations, tutorial text), ensure consistency in terminology, and even optimize performance (ask for tips on profiling Java code or reducing React render bottlenecks). Each small aspect can be queried. For example, *“Suggest optimizations for a turn-based simulation running on a single thread – how to best utilize multi-threading in Java for simulating games in parallel?”*, and then implement those suggestions in the engine if needed.

When constructing the **“massive single prompt”** to drop into your repo context (for tools like Cursor or Copilot that have repo awareness), consider including:

* A brief recap of the project goal and what the engine is/does.
* The desired architecture (possibly bullet points or a short tree of the structure).
* Specific tasks you want the AI to perform (as outlined above: e.g. list files to delete, modify X to use Y, create new component Z, etc.).
* Any relevant code or interface of the USE engine it should know (function signatures or class names).
* References to the design requirements (you can even paste snippets from your design docs that define how a feature should work, so the AI has context).

The prompt might be very large, but modern GPT-4 models can handle several thousand tokens of context. Just ensure it’s well-organized (you can use sections or numbered tasks). For example:

```
(Introduction with project summary and architecture)
Task 1: Analyze repository and suggest cleanup...
<<list of files>>
Task 2: Restructure into modules...
(desired module structure)
Task 3: For each of the following files, refactor as specified...
<<code snippets or descriptions>>
Task 4: Plan out UI implementation steps for these features...
<<list features>>
...
```

By giving such a structured prompt to an AI that has access to the repository, you enable it to act almost like an autonomous project manager and coder – it can sequentially go through reviewing, refactoring, planning, and even start coding according to the plan. Always review the AI’s output carefully (especially code) before trusting it fully – but it should handle a lot of boilerplate and even complex logic generation.

Finally, maintain an iterative loop: you might not get everything perfect in one giant prompt (even if it’s massive). Be prepared to follow up with smaller, focused prompts for specific issues the AI didn’t fully resolve or for new ideas that emerge. Each iteration will bring the game closer to the vision outlined in your design docs.

**Conclusion:** By wrapping the USE engine in a well-designed game structure, using fictional data intelligently, and organizing for both web and desktop platforms, you can create the ideal NFL GM simulator with unmatched realism. The process is intensive, but leveraging AI agents for planning, coding, and content generation can dramatically accelerate development. This approach not only preserves the depth and authenticity core to the project’s vision, but also addresses practical concerns (licensing, deployment, community mod support) that can make the difference between a niche prototype and a widely adopted simulator. With a clear roadmap and the power of the USE engine at the center, you’re equipped to build a game that fills the longstanding gap for a true NFL General Manager experience. Good luck, and enjoy the journey of bringing this ambitious simulation to life!

**Sources:**

1. Project design conversation excerpts – hybrid architecture and multi-platform strategy.
2. Project design conversation – recommended project structure and module breakdown.
3. Project research document – handling lack of NFL license via fictional content and mods.
4. Game design document – emphasis on including authentic NFL rules and depth for realism.
