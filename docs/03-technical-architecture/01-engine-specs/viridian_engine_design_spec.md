# Viridian Football – Unified Simulation Engine Design Specification

## Overview

This specification defines the data structures, algorithms and modules that compose the **Unified Simulation Engine (USE)** for *Viridian Football*.  The engine’s purpose is to deliver a highly realistic American‑football management simulation driven by emergent behaviour rather than pre‑canned outcomes.  It models on‑field play, off‑field management decisions, player psychology and relationships, league structures, and narrative events.  It is intentionally research‑driven: variables and formulas draw from cognitive psychology, team dynamics literature and NFL rules to avoid arbitrary modifiers.

## 1. Core Entities and Relationships

### 1.1 Player

| Field | Type / Range | Description |
| --- | --- | --- |
| `id` | UUID | Unique identifier. |
| `name` | String | Fictional name generated via procedural system; anonymised when scraped from real data. |
| `position` | Enum (QB, RB, WR, etc.) | Primary role. |
| `age` | Integer | Current age in years. |
| `physicalAttributes` | Struct | Speed, strength, agility, endurance, height, weight. |
| `cognitiveAbilities` | Struct | Derived from AIQ/S2 tests: processing speed, visual–spatial processing, reaction time, working memory, decision‑making quality, impulse control【258899860156224†L230-L246】【258899860156224†L314-L322】. |
| `skills` | Struct | Position‑specific ratings (e.g., throw power, accuracy, route running, pass block). |
| `learningEfficiency` | Float 0–1 | Measures how quickly a player learns the playbook and adapts to new strategies【826565933762949†L530-L540】. |
| `playbookKnowledge` | Float 0–1 | Current familiarity with team’s playbook; increases with practice and film study. |
| `experienceYears` | Integer | Seasons played in league. |
| `relationshipEdges` | List of Relationship | Outgoing relationships to teammates/coaches (trust, communication quality, shared history). |
| `personality` | Struct | Traits (competitiveness, work ethic, coachability, ego) that influence behaviour and event outcomes. |
| `contract` | Object | Contract details: years, salary, bonuses, guarantees, void years, etc. |
| `injuryState` | Struct | Current injuries and durability factors. |
| `morale` | Float 0–1 | Player satisfaction level; influenced by play time, contracts, relationships, team performance. |
| `mindset` | Enum (Engaged, Enthusiastic, Believer, Devoted, Skeptical, Detached) | Reflects the player’s buy‑in to the coach’s principles and team culture.  Players with high buy‑in respond better to coaching and training initiatives, while negative mindsets resist change【250365274266774†L84-L120】.  Mindset can shift with results and interactions. |
| `leadership` | Float 0–1 | Captures a player’s ability to influence teammates and serve as a locker‑room leader.  High leadership players may become captains and can mitigate the effects of negative personalities on cohesion. |
| `developmentPotential` | Float 0–1 | A latent ceiling representing how much a player can improve through training and experience.  Derived from scouting reports and athletic pedigree.  High potential players respond strongly to focused training; low potential players plateau quickly. |
| `progressRate` | Float 0–1 | Tracks how quickly the player’s skills have improved relative to expected growth.  Updated during training and development sessions. |
| `careerGoals` | Struct | Encapsulates the player’s personal motivations and priorities.  Fields include `championshipAspiration` (0–1) representing the desire to play for a title contender versus maximise earnings, `financialPriority` (0–1) representing willingness to accept pay cuts, and `playingTimePriority` (0–1) representing desire for touches or snaps.  These variables influence contract negotiations, team selection and in‑game behaviour.  For example, veteran cornerback Xavien Howard publicly stated that he would take a pay cut to join a playoff contender because he has "already got [his] money" and wants to win a Super Bowl【520924155616406†L693-L694】.  Players with high championship aspiration may choose a lower contract or accept a backup role on a strong team, while players with high playing‑time priority may complain about lack of targets or snaps and demand trades. |


### 1.2 Team

| Field | Description |
| --- | --- |
| `teamId`, `name`, `city`, `colors`, `logo` | Identity fields for fictional franchises. |
| `players` | Roster of Player objects, including practice‑squad slots with eligibility and salary rules【934304283426232†L135-L143】. |
| `coachingStaff` | Head coach and coordinators; each has strategies, preferences and relationships. |
| `gmProfile` | AI GM archetype (Analytics Architect, Culture Commander, Strategic Rebuilder, Player‑Centric Collaborator, Aggressive Dealmaker) with behavioural parameters drawn from the archetypes document. |
| `playbook` | A dynamic collection of offensive and defensive schemes and play concepts.  Each playbook entry contains required personnel labels, cognitive load, primary read progressions and situational hints.  Playbooks draw from a library of schemes (West Coast, Air Coryell, Erhardt‑Perkins, Spread variants, Option, Run and Shoot, Power/Smashmouth, Pro‑style and others) and defensive fronts (4‑3, 3‑4, 4‑2‑5, 3‑3‑5, 5‑2, etc.) with associated coverage shells.  The engine maps schemes to player labels to determine fit (e.g., Gunslinger QBs and Deep Threat WRs in Air Coryell; Dual‑Threat QBs and Scat Backs in Spread Option) as defined in the integrated playbook specification. |
| `salaryCapState` | Current cap room, dead money (from restructures/void years)【448514427120040†L112-L151】, carryover, and future obligations. |
| `draftCapital` | Current and future draft picks, including compensatory picks determined by the CBA formula【539062161419306†L199-L232】. |
| `teamCohesion` | Aggregate measure of inter‑player trust, communication and shared experience【824117808319156†L682-L690】.  High cohesion reduces execution noise and boosts performance; low cohesion increases miscommunication penalties. |
| `cultureScore` | Reflects locker‑room climate and adherence to team ethos; influenced by coach leadership style and GM archetype. |
| `stadium` | Struct describing home venue attributes (name, capacity, surface type, roof state).  These attributes feed into environmental simulation (e.g., crowd noise from capacity, weather impact based on roof status).  Additional fields include `altitude` and typical `windPatterns`, which modify kicking accuracy and player stamina. |
| `specialTeamsUnit` | Roster assignments and ratings for kickers, punters, returners and coverage teams.  Special teams performances are simulated separately, with modifiers for kicker `power` and `accuracy`, punter `hangTime`, and returner `elusiveness`.  Field‑position outcomes feed back into offensive and defensive modules. |
| `trainingSchedule` | Weekly plan defining training focus for offense, defense and special teams.  Each week comprises multiple sessions (e.g., fundamentals, situational drills, conditioning) and assigns players to training units (quarterbacks, skill positions, linemen, defenders).  The plan determines how much emphasis is placed on physical conditioning, skill refinement, scheme installation and cognitive development. |
| `developmentLab` | Facility state tracking the effectiveness of training (level 0–3).  Higher levels unlock more advanced drills and provide mid‑offseason progress reports, similar to the development labs in OOTP【334256692261342†L25-L90】.  Investments in the lab increase progress rates for young players. |
| `hierarchy` | Structure describing team leadership tiers.  Captains and veteran leaders occupy upper tiers and influence younger players.  The hierarchy is used in the dynamics system to compute how player opinions and buy‑in propagate through the roster, inspired by Football Manager’s dynamics module【250365274266774†L84-L120】. |
| `buyInDistribution` | Distribution of players across mindset categories (Engaged → Devoted).  Coaches track this distribution to assess whether their philosophy is taking hold.  A skew towards detached or skeptical indicates a fractured locker room. |

### 1.3 League / Season Structure
The engine supports **multiple game modes** and flexible league configurations to accommodate career, scenario and sandbox experiences:

* **League definition:** Users can configure the number of teams (from small custom leagues to the standard 32 and beyond), conference/division structures, schedule length (14–18 games), and salary cap values.  League definitions may include historical rule variants (e.g., 1970s salary caps, playoff formats) and custom league names.  The default league mirrors the modern NFL with fictional franchises, but sandbox mode allows full customisation, including creating expansion teams or contracting existing ones as part of the League Governance module.
* **Calendar generation:** The system generates balanced schedules that ensure each team plays divisional opponents twice and rotates inter‑conference opponents based on league rules.  Bye weeks are inserted mid‑season, and the calendar includes training camp, preseason, regular season, postseason and offseason phases (free agency, franchise tag window, restricted free agency, draft combine, draft, rookie mini‑camp, training camp and preseason).  Schedule generation algorithms can be seeded for replayability or randomised for variability.
* **Multiple leagues:** The engine can host multiple concurrent leagues (e.g., developmental or international leagues) with promotion/relegation or feeder systems.  Inter‑league transfers and scouting between leagues are supported, enabling expanded universe simulations akin to OOTP’s international and independent leagues【334256692261342†L25-L90】.  Historical seasons may be loaded as starting points, with rule sets and salary caps reflecting the chosen era.
* **Game modes:**
  * **Career mode** – The default mode where the human GM guides a team through multiple seasons with realistic financial rules, owner expectations and long‑term objectives.
  * **Scenario mode** – Starts with predefined conditions and goals (e.g., “Take over a 2‑14 team with cap issues and make the playoffs within two seasons”).  Scenarios include scripted events and constraints, allowing curated challenges and historical reenactments.
  * **Sandbox mode** – Removes win/loss pressures and allows users to freely edit league parameters, rosters, salary caps and rules.  This mode supports true experimentation, modding and custom leagues.

League rules enforce salary caps, roster limits (53‑man active roster, 16 practice‑squad players with eligibility restrictions【934304283426232†L119-L126】), compensatory pick limits【539062161419306†L199-L232】, and restricted free agency tender amounts【285066973711102†L425-L447】.

### 1.4 Relationship

Each `Relationship` is a directed edge from a player to another player or coach/GM.  It contains:

| Field | Description |
| --- | --- |
| `trust` | Float 0–1 representing confidence in the other’s competence and integrity; increases through successful collaborations, decreases after conflicts or negative events. |
| `communicationQuality` | Float 0–1 capturing how effectively information flows between parties; improved through practice, meetings and shared experiences. |
| `sharedHistory` | Integer representing games or seasons together; longer history boosts familiarity and reduces miscommunication. |
| `roleCompatibility` | Enum (Highly Compatible, Neutral, In Conflict) denoting schematic fit (e.g., route tree vs QB preference), affecting synergy.

These edges form a dynamic social network used to compute team cohesion and feed into decision‑making during plays.

### 1.5 Owner

The **Owner** represents the franchise’s financial backer and ultimate decision maker.  Owners influence long‑term strategy, approve major expenditures and set expectations for coaches and GMs.  Attributes include:

| Field | Type / Range | Description |
| --- | --- | --- |
| `ownerId` | UUID | Unique identifier. |
| `name` | String | Fictional name; anonymised when scraped. |
| `netWorth` | Float | Net worth in millions of dollars; influences willingness to spend on facilities, coaches and signing bonuses. |
| `riskTolerance` | Float 0–1 | Degree to which the owner tolerates aggressive trades, big contracts and cap manoeuvres. |
| `involvementLevel` | Enum (Hands‑Off, Consultative, Micromanaging) | How often the owner intervenes in roster decisions and coaching hires. |
| `mediaPersona` | Struct | Tendency to make public statements (outspoken vs reserved), which can affect team morale and media narratives. |
| `relationships` | List of Relationship | Directed edges to GM, coach and players capturing trust and communication quality. |
| `approvalRating` | Float 0–1 | Fan sentiment toward the owner, influenced by team success and PR events. |
| `vision` | Struct | Long‑term objectives set by the owner/board (e.g., win a championship within five years, maintain positive cash flow, rebuild with young players).  The vision influences performance reviews and contract negotiations with the GM and coaching staff. |
| `boardObjectives` | List | Season‑specific targets (e.g., reach playoffs, improve home attendance, increase merchandise revenue).  Meeting or exceeding objectives increases `approvalRating` and job security; failing them triggers warnings or possible termination. |
| `patience` | Float 0–1 | Determines how many losing seasons the owner tolerates before demanding changes. |


### 1.6 Coach

Coaches implement schemes and manage players on a day‑to‑day basis.  The design models head coaches and coordinators.  Attributes include:

| Field | Type / Range | Description |
| --- | --- | --- |
| `coachId` | UUID | Unique identifier. |
| `name` | String | Fictional coach name. |
| `role` | Enum (Head Coach, Offensive Coordinator, Defensive Coordinator, Special Teams Coordinator, Position Coach) | Coaching position. |
| `philosophy` | Struct | Preferred offensive/defensive schemes (e.g., West Coast, 4‑3), aggressiveness level (conservative to aggressive), and situational tendencies (4th‑down decisions, blitz frequency). |
| `adaptability` | Float 0–1 | Ability to adjust schemes to personnel and in‑game situations. |
| `communicationStyle` | Enum (Authoritative, Collaborative, Player‑Centric) | Influences player morale and learning efficiency. |
| `relationshipEdges` | List of Relationship | Relationships with GM, owner and players.  Coaches with high trust from players gain cohesion bonuses. |
| `contract` | Object | Contract details (years, salary, guarantees). |
| `morale` | Float 0–1 | Satisfaction level influenced by team performance and front‑office support. |

### 1.7 General Manager (GM)

The **General Manager** runs player personnel operations and negotiates contracts.  In single‑player mode the human player occupies this role; AI GMs run other teams.  Attributes include:

| Field | Type / Range | Description |
| --- | --- | --- |
| `gmId` | UUID | Unique identifier. |
| `name` | String | GM name. |
| `archetype` | Enum (Analytics Architect, Culture Commander, Strategic Rebuilder, Player‑Centric Collaborator, Aggressive Dealmaker) | Behavioural template that influences draft, trade and contract strategies. |
| `riskAppetite` | Float 0–1 | Probability of making high‑variance decisions (big trades, cap shenanigans). |
| `negotiationSkill` | Float 0–1 | Determines success in contract negotiations and trade discussions. |
| `analyticsBias` | Float 0–1 | Weight given to data‑driven metrics vs scouting intuition.  High values mimic the **Analytics Architect** archetype. |
| `relationships` | List of Relationship | Directed edges with owner, coaches, scouts and players; trust modulates willingness to override coach decisions. |
| `contract` | Object | Terms of employment and severance. |
| `morale` | Float 0–1 | Personal satisfaction tied to owner approval and team progress. |

### 1.8 Scout

Scouts evaluate college prospects and opposing teams.  They generate scouting reports and feed into the draft board.  Attributes include:

| Field | Type / Range | Description |
| --- | --- | --- |
| `scoutId` | UUID | Unique identifier. |
| `name` | String | Scout name. |
| `region` | Enum (Northeast, Southeast, Midwest, West, International) | Geographic focus for college scouting, or `positionGroup` when assigned to a specific position (OL, QB, etc.). |
| `evaluationAccuracy` | Float 0–1 | Probability that a scout’s grade reflects the true player ability.  Higher values produce tighter confidence intervals in scouting reports. |
| `bias` | Struct | Tendencies that skew evaluations (e.g., favouring traits like speed over technique). |
| `relationships` | List of Relationship | Trust and communication with GM and coaches. |
| `experienceYears` | Integer | Years of scouting experience. |
| `morale` | Float 0–1 | Satisfaction influenced by recognition and career progression. |


## 2. On‑Field Simulation Modules

### 2.1 Continuous Decision Logic and Pre‑Snap Assessment

For each play, every participant – not just the quarterback – engages in continuous decision‑making from the moment players break the huddle until the whistle blows.  Decision logic unfolds in discrete simulation ticks (e.g., every 100 ms of game time) and comprises both a pre‑snap scanning phase and in‑play continuous evaluation.

* **Pre‑snap assessment:** Before the snap, players scan the defense (or offense) to identify fronts, coverage shells, blitz indicators and alignment clues.  Teaching receivers and quarterbacks to read the “roofline” of the coverage – scanning from the strong‑side to the weak‑side and noting high and low points that reveal Cover 2, Cover 3 or quarters – is a fundamental coaching technique【324366088094709†L94-L132】.  These pre‑snap reads help players decide on optimal releases, route conversions and blocking assignments【324366088094709†L94-L132】.  The engine therefore models a pre‑snap assessment step for all players:

1. **Stimulus identification:** For each player, calculate how many relevant defensive (or offensive) features are correctly identified.  Offensive players evaluate defensive fronts, coverage roofs and blitz threats; defensive players identify formation strength, motion and potential run/pass keys.  Use a logistic function of the player’s processing speed, visual–spatial ability and position‑specific recognition skill, minus a pressure modifier that increases with blitz intensity, crowd noise and game situation【258899860156224†L230-L246】.  Position groups have different key lists – for example, receivers look at safety depth and corner leverage【324366088094709†L94-L132】, while offensive linemen look for linebacker alignment and stunts.
2. **Memory retrieval:** Determine how many potential adjustments the player can recall from the playbook.  This depends on the player’s learning efficiency【826565933762949†L530-L540】 and playbook knowledge.  For a receiver, adjustments might include converting a route against specific coverages; for a lineman, it might be switching blocking calls based on blitz indicators.
3. **Decision selection:** Assign probabilities to each recalled option using a soft‑max.  The utility of each option combines expected yardage or success probability, trust bonuses with nearby teammates, and scheme fit.  A temperature parameter derived from the player’s impulse control modulates randomness.  Players with poor knowledge or low processing speed may misread the coverage, leading to wrong route conversions or missed blitz pickups.
4. **Execution:** After the snap, execution actions (throwing, running, blocking) depend on reaction time, physical attributes, mechanical skill and cohesion.  For instance, throw accuracy is modelled as a linear combination of mechanical skill and visual–spatial ability minus fatigue; blockers’ ability to pick up late blitzers depends on processing speed and playbook knowledge.  The random noise term in execution is smaller when trust and cohesion are high, reflecting smoother communication.

* **Relationship‑driven targeting and adjustments:**  Beyond pure physical and cognitive factors, the engine incorporates social and coaching context into pre‑snap and continuous decisions:
  * **Favourite targets:** Quarterbacks develop preferences for receivers they trust.  The target selection algorithm biases the probability distribution towards receivers with high `trust` and `communicationQuality` edges, reflecting real‑world chemistry.  Unless the play design enforces a strict progression, the QB is more likely to throw to a favourite target—even if another receiver is nominally open—mirroring the comments of receivers who emphasise the need to earn a quarterback’s trust by being exactly where he expects【292096963054959†L243-L270】.
  * **On‑field adjustments:** Veterans and players with high leadership may instruct teammates on the line.  A defensive tackle might tell a defensive end to switch his gap responsibility, or a slot receiver might signal a hot route to a teammate when sensing a blitz.  Teammates only heed adjustments if mutual trust and communication are strong; otherwise they may ignore or misinterpret the directive.
  * **Audible permissions:** Each head coach’s philosophy includes an `audiblePermission` scalar indicating how much freedom the quarterback has to change the play at the line.  In systems with “check‑with‑me” options, the QB can audibilize when the defense shows a loaded front or coverage mismatch【183104291067897†L188-L242】.  The QB’s cognitive abilities and relationship trust determine whether audibles are attempted and accepted; conservative coaches with low `audiblePermission` restrict changes and expect the QB to run the called play.

* **In‑play continuous evaluation:** As the play unfolds, players constantly reassess their environment.  Each simulation tick, quarterbacks, ball carriers and receivers evaluate defender positions, separation, pressure levels and coverage rotations; defensive players assess ball‑carrier location, blocking angles and pursuit paths.  Decision logic uses reaction time, processing speed and working memory to determine whether to stick with the current read, progress to the next option or improvise (e.g. scramble, cutback, peel off coverage).  This continuous evaluation allows for emergent behaviour such as broken‑play improvisation or cutback runs.
  * **Perception window:** Players only react to opponents within their field of vision; orientation and line‑of‑sight matter.  For example, a backside pass rusher may go unnoticed until he enters the quarterback’s peripheral vision, at which point the QB’s reaction time dictates whether he escapes the sack.  Similarly, a receiver may not see a safety rotating down until he scans during his route stem.
  * **Update cadence:** The engine advances the state machine at fixed time steps (e.g., 10 frames per second) and recomputes decisions based on updated positions and velocities.  This ensures that decision‑making is continuous rather than a single pre‑snap choice.

### 2.2 Play Execution
Simulate the play outcome using player abilities (speed, route running, blocking), opponent abilities, game situation and random variance.  Successful collaborations strengthen relationships; drops or misreads weaken them.

Simulate the play outcome using player abilities (speed, route running, blocking), opponent abilities, environmental conditions and game situation.  Weather (temperature, precipitation, wind) and altitude modify passing accuracy, kick distance and fatigue.  Crowd noise influences the pre‑snap identification step by increasing the pressure modifier.  Special teams plays (kickoffs, punts, field goals, PATs) are modelled separately, incorporating kicker `power` and `accuracy`, punter `hangTime`, long snapper reliability, coverage team ratings, returner `elusiveness` and the effects of wind.  Successful collaborations strengthen relationships; drops, misreads or special teams mistakes weaken them.

### 2.3 Physical Interaction and Tackling Mechanics

To determine whether a tackle attempt succeeds or a ball carrier evades a defender, the engine computes a **tackle probability** at the moment of contact using the following factors:

* **Angles and momentum:** The relative angle between tackler and ball carrier and their respective velocities.  A head‑on, squared tackle with low relative angle is easier; an attempt from the side or trailing angle reduces success probability.  Higher tackler momentum (mass × speed) increases force and success; higher ball‑carrier momentum raises the chance of breaking the tackle.
* **Attributes and skills:** The tackler’s `physicalAttributes` (strength, agility), `skills.tackle` rating and fatigue versus the ball carrier’s `physicalAttributes` (speed, strength, balance) and `skills.breakTackle` or `elusiveness`.  Technique matters: players with high tackling fundamentals wrap up better, while bruiser runners drive through contact.
* **Environmental modifiers:** Surface conditions (wet turf, snow) reduce footing and slightly lower both tackle and break‑tackle success.  Crowd noise and pressure do not directly affect tackling but can influence preceding decisions (e.g., route recognition).
* **Random variation:** A small random component simulates the inherent unpredictability of contact sports.  Greater cohesion and trust between defenders (e.g., linebackers with high familiarity) reduce the magnitude of randomness due to better pursuit angles and communication.

If a tackle fails, the play continues with updated momentum and positions, allowing for broken tackles and yards after contact.  Successful tackles end the play, update fatigue and injuries, and influence relationship edges (e.g., trust in a defender grows after a clutch stop).

### 2.4 Post‑Play and Drive Updates

- Update fatigue, morale and injuries.
- Adjust relationship edges based on success or failure.
- Record detailed stats (e.g., big‑time throw rate, turnover‑worthy plays, throw accuracy) for analytics【826565933762949†L575-L596】.

### 2.5 Play Learning and Scheme Adaptation

The **playbookKnowledge** attribute in each player encapsulates the familiarity with the team’s offensive and defensive play concepts.  This knowledge evolves dynamically through practice, film study and in‑game experience:

* **Learning curves and concept families:** Each play in the team’s playbook belongs to a *concept family* (e.g., mesh, smash, zone read) and has a *complexity score*.  When a player executes or studies a play, his `playbookKnowledge` for that concept increases.  The rate of improvement depends on `learningEfficiency`, `working memory` and `experienceYears`.  Simple concepts and those similar to previously learned schemes are mastered quickly, whereas complex or novel concepts require more repetitions.
* **Scheme similarity:** When a player joins a new team, the engine computes a similarity index between the player’s previous scheme and the current team’s scheme by comparing their concept families and terminology.  For instance, a receiver moving from a West Coast offense to a Pro‑Style Spread will find many short‑passing concepts familiar, resulting in higher initial `playbookKnowledge` and faster adaptation.  In contrast, switching from a Run and Shoot attack to a Power/Smashmouth system offers little conceptual overlap and requires a longer learning curve.  The index modifies the initial `playbookKnowledge` and determines how quickly new concepts are absorbed.
* **Retention and decay:** Knowledge decays during the offseason and for unused portions of the playbook.  Players with high `learningEfficiency` and veteran experience retain concepts better; rookies and raw talents experience greater decay.  Offseason mini‑camps and individual study can rebuild knowledge.
* **In‑game impact:** `PlaybookKnowledge` directly influences the pre‑snap assessment algorithm.  Low familiarity reduces the number of adjustments a quarterback can recall, increases processing time, and raises the likelihood of execution errors.  As knowledge improves, players react more quickly, adjust routes in real time and maintain timing with teammates.

This system encourages teams to consider scheme fit when signing free agents and drafting rookies and reflects the reality that familiarity with a concept-rich playbook provides a significant advantage on the field.

## 3. Off‑Field Modules

### 3.1 Scouting and Draft

* **Fog of war:** To mimic real NFL scouting uncertainty, the engine layers a probabilistic *fog of war* over all prospect evaluations.  Each scouted attribute is represented as a range (e.g., 65–75 speed) rather than a single number.  The width of the range (confidence interval) depends on the scout’s `evaluationAccuracy`, the volume of film study and combine testing, and whether the prospect participates in pre‑draft workouts.  Some traits—such as work ethic, durability, learning efficiency and off‑field red flags—remain hidden until uncovered through interviews, psychological tests or background checks.  The fog gradually lifts as the player gains experience in the league; after one or two seasons real values are fully visible.  GMs must therefore weigh risk versus upside based on incomplete information.
* **Combine and cognitive tests:** Simulate combine metrics (speed, agility) and cognitive scores (AIQ, S2) to produce attributes for prospects【258899860156224†L314-L322】.
* **Draft AI:** AI GMs evaluate prospects according to archetype, team needs and risk appetite, trading up or down based on draft charts and roster strategy.

### 3.2 Contracts and Salary Cap

Implement full NFL contract mechanics, including:

- Rookie wage scale with pick‑based values【412079432858791†L121-L156】【236697010703175†L156-L262】.
- Restricted free agent tenders and associated draft compensation【285066973711102†L425-L447】.
- Practice‑squad salaries and eligibility【934304283426232†L164-L178】.
- Compensatory pick formula when losing more CFAs than signing【539062161419306†L199-L232】.
- Contract restructures and void years, where signing bonuses are prorated over void years and accelerate into dead cap when voided【448514427120040†L112-L151】.

### 3.3 Free Agency and Trades

- Free agency uses a bidding system where AI GMs weigh player value, cap space and risk tolerance.
- Trade logic evaluates player and pick values, contract context and compensatory effects.  Players with low morale or relationships may request trades.

### 3.4 Practice Squad and Roster Management

- Support 16 practice‑squad slots; enforce eligibility rules by accrued seasons【934304283426232†L135-L143】.
- Players can be elevated to the active roster three times before they must be signed【934304283426232†L201-L219】.
- Practice‑squad signings by other teams require a guaranteed three‑week roster spot【934304283426232†L185-L193】.

### 3.5 Narrative and Event System

Generate news items (injuries, trades, locker‑room disputes, contract controversies, coach comments, owner directives, fan protests, philanthropic initiatives, labour negotiations, extreme weather, relocation rumours) that affect morale, relationships and finances.  Player and coach responses at press conferences adjust trust and morale.  The narrative engine supports both **procedurally generated events** and **scenario‑scripted triggers**.  Events reflect the underlying variables in the simulation: for instance, a receiver with a high `playingTimePriority` and low target share may publicly complain about his usage, creating a “diva WR demands more targets” storyline that stresses cohesion; veteran free agents with high `championshipAspiration` may leak to the media that they are willing to take pay cuts to join contenders【520924155616406†L693-L694】; owners threatening to relocate may spark fan protests or civic battles; and hurricanes may postpone games or force relocations.  In scenario mode, custom event definitions (via YAML/JSON) can introduce bespoke storylines (e.g., an owner demands a mid‑season trade, a key player retires unexpectedly, a strike shortens the season, or a relocation vote looms) at specified weeks, with conditional consequences for compliance or defiance.  Events can modify morale, relationships, finances, contracts, draft capital or owner objectives, creating narrative arcs that intertwine with simulation outcomes.

### 3.6 Training and Development

Realistic sports simulations include robust training modules where managers shape player growth throughout the season.  To mirror systems found in titles like **Out of the Park Baseball** and **Football Manager**, the engine introduces a **training system** with the following components:

* **Weekly training schedule:** Each club maintains a week‑by‑week schedule of sessions.  Sessions have a designated focus—conditioning, technical drills, scheme installation, cognitive training—and assign players to units (quarterbacks, skill positions, linemen, defenders, special teams).  Coaches adjust the balance of session types based on upcoming opponents and individual player needs.  Session outcomes interact with player `mindset`: engaged players gain more from practice, while detached players plateau despite training【250365274266774†L84-L120】.
* **Development lab and progress reports:** Teams invest in facilities that improve training effectiveness.  Higher‑level labs unlock advanced drills and provide **mid‑offseason progress reports** akin to OOTP’s Development Lab【334256692261342†L25-L90】.  These reports reveal which players are trending up or regressing and adjust the `progressRate` field, generating narrative events like “QB Jordan Hunts made great strides reading Cover 2 shells this offseason.”
* **Individual development plans:** Coaches can assign extra work on specific skill categories (e.g., footwork for linemen, route precision for receivers, processing speed drills for quarterbacks).  These plans accelerate targeted growth but increase fatigue and injury risk.
* **Fatigue and injury risk:** The system balances growth and health.  Intense training accelerates improvement but raises the likelihood of over‑training injuries and fatigue.  Strategic rest days and recovery sessions mitigate risks.

During each training cycle, the module updates a player’s `playbookKnowledge`, `skills`, `physicalAttributes` and `cognitiveAbilities` based on session types, lab level and individual plans.  It also modifies morale: players aligned with their personal goals (e.g., a developmental star in extra drills) become more engaged, while misalignment or neglect erodes buy‑in.

### 3.7 Team Dynamics and Leadership

Locker‑room health and leadership structure play a significant role in team performance.  Drawing inspiration from **Football Manager’s** dynamics system【250365274266774†L84-L120】, the engine implements a **team dynamics module**:

* **Hierarchy and captains:** Each team has a hierarchy of leaders—captains, leadership group, core players and peripheral members.  Players with high `leadership` and positive traits (e.g., Role Model, Team Player) rise through the ranks and propagate the coach’s philosophy.  Negative personalities (Diva, BadInfluence, Under Investigation) suppress progression and drag others down.
* **Buy‑in tracking:** The distribution of `mindset` values across the roster is summarised as `buyInDistribution` within the team entity.  Coaches monitor this distribution; a shift towards skeptical or detached categories signals discontent with tactics or culture and triggers interventions such as team meetings or changes in training emphasis.
* **Leadership events:** Narrative events (player‑only meetings, coach speeches, media controversies) modify the hierarchy and culture.  For instance, trading away a beloved captain may lower the `cultureScore` and destabilise the hierarchy, whereas appointing a veteran as captain can enhance cohesion.
* **Chemistry effects:** High cohesion within position groups amplifies training benefits and reduces execution errors.  Friction from unresolved conflicts introduces penalties and can spark locker‑room disputes, leading to morale dips and possible trade requests.

This dynamics system ensures that management decisions and interpersonal relationships have meaningful, emergent consequences beyond raw attributes and cap numbers.

### 3.10 Discipline: Holdouts, Hold‑Ins and Suspensions

Real NFL seasons are shaped by contract disputes and disciplinary actions.  To faithfully mirror this reality, the engine models **holdouts**, **hold‑ins** and **player suspensions** using research‑based rules:

* **Holdouts:** Players who believe their performance has outpaced their contract may refuse to report to mandatory minicamps or training camp.  Under the 2020 CBA, veterans who skip camp are fined $16,459 for the first missed day, $32,920 for the second, $49,374 for the third and $50,000 per day thereafter【268175057422694†L103-L123】.  Fines cannot be waived for veterans but may be forgiven for rookies【268175057422694†L109-L117】.  The engine tracks the **holdout state** on each player, accruing fines daily and reducing `morale` and `teamCohesion`.  AI GMs must decide weekly whether to: (a) offer a contract extension; (b) trade the disgruntled player; or (c) allow fines to accumulate, risking locker‑room unrest.  Media narratives and fan sentiment reflect these choices.

* **Hold‑ins:** Some players avoid fines by reporting to camp but refusing to participate in drills or team activities【268175057422694†L139-L147】.  During a hold‑in the player appears on the roster but does not accrue practice reps, slowing playbook knowledge growth and reducing practice‑squad chemistry.  The negotiation logic is similar to a holdout; however, no fines accumulate and the team must weigh the cost of limited preparation against the risk of alienating the player.

* **Disciplinary suspensions:** The NFL conducts random steroid and drug tests and has imposed suspensions since 1989【858630473397054†L219-L326】.  To simulate this, the engine randomly selects players each season based on league‑wide testing rules and personality risk factors (players with `BadInfluence` or `UnderInvestigation` traits have higher probabilities).  A failed test triggers a suspension of 4–8 games, removal from the active roster, forfeiture of game checks and a reputation hit.  The simulation also supports suspensions stemming from substance abuse and personal conduct violations (DUIs, domestic violence, gambling).  Off‑field incidents are generated stochastically and, when triggered, cause multi‑game suspensions and narrative fallout.

Disciplinary events integrate with the narrative feed and have cascading effects: practice‑squad promotions, cap relief (in cases where guarantees void), morale impacts and potential GM/coach firings if scandals are mishandled.  The **suspension state** is stored on the player and persists across games until the penalty is served.  Suspended players cannot practice or attend team facilities.

### 3.11 Retirements and Trade Demands

While roster building focuses on developing young talent, careers eventually end.  The engine models **retirements** and **trade demands**:

* **Retirement probability:** Each offseason, the simulation computes a retirement probability for every player based on age, injury history, cumulative hits, contract status and personal motivations.  Players with recurring injuries or high concern for long‑term health (reflected in their `careerGoals`) are more likely to retire early.  The system accommodates abrupt retirements mid‑season, echoing real‑world cases where players step away due to health concerns.

* **Post‑career roles:** Retired players may re‑enter the league as coaches, scouts or broadcasters.  The narrative engine occasionally generates storylines where ex‑players interview for coordinator jobs or appear on media panels, enriching continuity across seasons.

* **Trade requests and target complaints:** Players with high `playingTimePriority` and low snap counts—or receivers who go several games without being targeted—may formally request trades.  Divas or BadInfluence personalities amplify these demands.  When a trade request occurs, the GM can placate the player (promise more touches), initiate trade discussions or ignore the request at risk of a locker‑room rift.  Trust and cohesion variables adjust accordingly.  Trade requests can also arise from veteran players with high `championshipAspiration` stuck on rebuilding teams; they may seek a contender even at reduced salary.【520924155616406†L693-L694】

These additions ensure that the simulation captures the full lifecycle of a player’s career and the negotiations and conflicts that shape rosters beyond injuries and contracts.

### 3.12 League Governance, Facilities and External Events

Beyond standard team management, real football seasons are influenced by league‑wide governance decisions, facilities investment and external factors.  To emulate this, the engine introduces a **League Governance & External Events** module that handles rare but impactful situations:

* **Franchise relocation and expansion:** Owners may propose relocating the franchise to a new city or expanding the league with additional teams.  Relocation requires board approval and negotiations with city councils or stadium authorities; success depends on owner `riskTolerance`, market size and fan sentiment.  Expansion triggers league votes, expansion drafts and schedule realignment.  Sandbox mode allows users to manually trigger relocations or create expansion teams.

* **Stadium & facility management:** Teams maintain and improve infrastructure.  Owners and boards can approve budgets for stadium renovations (increasing capacity, adding roofs, improving turf) and training facility upgrades (development labs, rehabilitation centres).  Upgrades improve player health, development and fan satisfaction but reduce available cash for contracts.  Public‑funding debates may impact owner approval and fan morale.

* **Rule changes and CBA negotiations:** Periodically, the league may hold governance meetings to adjust rules (e.g., overtime format, kickoff placement) or renegotiate the Collective Bargaining Agreement.  Owners vote on proposals; GMs must prepare for shifting salary caps, roster sizes or draft compensation.  Rule‑change events are rare and often tied to scenario mode or long‑term simulations.

* **Labor disputes and strikes:** The game can simulate labour disputes between the league and the players’ union.  Strikes or lockouts shorten seasons, introduce replacement players, and force tough decisions on contracts and finances.  These events are best used in scenario mode but can emerge stochastically in extended simulations.

* **Fan & media interactions:** Fan sentiment and media narratives influence finances and morale.  Positive engagement (e.g., community outreach, winning streaks) increases attendance, merchandise sales and approval ratings; scandals, poor performance or controversial moves drive protests and revenue declines.  Press conferences, social‑media posts and marketing campaigns appear in the narrative feed with associated choices.

* **Extreme weather and natural disasters:** While routine weather (rain, snow, wind) affects gameplay in the simulation, rare extreme events (hurricanes, wildfires, stadium roof collapses) may postpone or relocate games.  The schedule generator reschedules games or moves them to neutral sites.  These events are tied to geographic data in the `stadium` entity and produce narrative consequences.

* **Philanthropy and community involvement:** Players, coaches and owners may engage in charitable events or foundations.  Successful community programs increase approval ratings and morale; ignoring civic responsibilities may lead to negative press.  Philanthropy events can be initiated proactively or generated by narrative triggers.

* **Draft‑day and combine drama:** Beyond the fog of war, the engine introduces randomised or scripted incidents at the NFL Combine and during the draft: prospects suffering last‑minute injuries, medical red flags surfacing, or arrests creating character concerns.  These events alter draft boards, trigger media stories and test the GM’s risk appetite.

This module ties external influences and rare events into the broader narrative and strategic fabric of Viridian.  It ensures that each playthrough can feature unique twists—relocation sagas, stadium debates, rule changes or labour disputes—without overwhelming users, thanks to the layered information architecture described in the UI section.

### 3.8 Owner and Board Dynamics

The GM operates under the scrutiny of ownership or a board of directors.  This module formalises the relationship between management and ownership:

* **Vision and objectives:** Owners define a long‑term `vision` (e.g., build a perennial contender, maximise profits, execute a youth rebuild) and a set of `boardObjectives` for the current season (e.g., make the playoffs, achieve a top‑10 offense, stay under the cap).  These objectives are used to evaluate GM performance at season checkpoints.
* **Performance reviews:** At mid‑season and postseason, the board reviews progress against objectives.  Meeting goals increases the owner’s `approvalRating` and may unlock additional resources (increased budget for free agency, facility upgrades).  Failure triggers warnings, contract renegotiations or even dismissal.  Owners with low `patience` quickly lose faith after a string of losses.
* **Financial oversight:** The owner monitors cash flow, stadium revenues and media deals.  Large signing bonuses or cap manoeuvres must align with the owner’s `riskTolerance`.  Proposals such as stadium renovations or relocating the franchise require board approval.
* **Infrastructure decisions:** Owners and boards periodically vote on stadium upgrades, facility investments and potential relocation.  Approving a new stadium increases home revenue, reduces injury risk and improves morale, but may require public funding or tax incentives, affecting fan sentiment.  Relocation decisions factor in market size, fan loyalty and league approval; a successful move involves narrative events (city council meetings, relocation votes) and triggers rebranding, new stadium construction and schedule realignment.
* **Interference levels:** Owners vary in `involvementLevel` (hands‑off, consultative, micromanaging).  Micromanagers may veto trades or demand the signing of star free agents; hands‑off owners delegate authority to the GM.  Negotiating these interactions adds another layer to gameplay.

This board dynamics system forces players (and AI GMs) to balance long‑term strategy with ownership directives, creating tension between immediate results and sustainable team building.

### 3.9 GM Decision Framework

Artificial GMs evaluate their teams, drafts and markets using a structured decision framework grounded in analytics and archetype preferences:

* **Team needs assessment:** Each offseason and at key points during the season, the AI GM evaluates roster depth charts relative to the current scheme and projected injuries or retirements.  Positions are scored based on starter quality, backup quality, and future contract expirations.  A **positional value curve** (e.g., quarterbacks and edge rushers are higher impact than kickers) weights needs.  The GM’s archetype influences tolerance for weaknesses (e.g., Analytics Architects devalue running backs, Culture Commanders prioritise locker‑room leaders).  This produces a ranked list of positional needs.
* **Draft board construction:** Scouts provide graded ranges (with fog‑of‑war uncertainties).  The GM aggregates scout grades, combine metrics and cognitive scores into a prospect *expected value* using a weighted formula: expected value = (athletic grade × athletic weight) + (cognitive grade × cognitive weight) + (skill grade × skill weight) − (off‑field concerns × penalty).  The weights vary by archetype and team needs.  Scheme fit and personality fit add modifiers.  Prospects are sorted into tiers on the draft board.  The GM also factors in positional scarcity and the draft’s depth at each position.
* **Pick selection and trades:** When on the clock, the AI compares the top available prospect’s expected value against the marginal value of trading down (acquiring additional picks) or addressing a pressing need.  Risk appetite influences willingness to reach for a high‑variance player or trade future picks.  The GM may trade up if the prospect’s expected value significantly exceeds the cost of the trade, using a draft pick value chart tuned to the league.  Cultural or board objectives can override purely analytical decisions (e.g., drafting a local college star to boost fan engagement).
* **Free agency and contract offers:** AI GMs project each free agent’s **surplus value** (expected on‑field contribution minus expected salary) adjusted for scheme fit and personality risks.  Offers are generated using negotiation strategies aligned with the GM’s archetype—Aggressive Dealmakers front‑load contracts with guarantees; Strategic Rebuilders prefer shorter, flexible deals.  Cap space, owner risk tolerance and future draft capital constrain these decisions.
  In addition, GMs consider the player’s `careerGoals` when structuring offers.  Veterans with high `championshipAspiration` may accept lower salaries to join contenders【520924155616406†L693-L694】, while players with high `financialPriority` demand top‑dollar deals.  Players with high `playingTimePriority` factor into depth‑chart promises; failing to satisfy these preferences increases the risk of holdouts or locker‑room discontent.
* **In‑season adjustments:** AI GMs monitor team performance and adjust strategy: signing street free agents to replace injured players, promoting practice squad members, or shopping underperforming veterans.  They also evaluate trade offers using the same expected‑value calculations.
  When considering trades or promotions, AI GMs also weigh players’ personal motivations.  For example, a receiver with high `playingTimePriority` and few targets may request a trade; a veteran with high `championshipAspiration` may prefer to be traded to a contender rather than re‑sign in a rebuild.  GMs can mitigate such situations by restructuring roles or promising increased usage.

This decision framework produces believable front‑office behaviour tailored to each GM archetype and ensures that AI teams evaluate prospects, free agents and trades using a combination of analytics, scheme considerations and personality factors.

### 3.13 Media and Reputation System

Modern football is as much about perception as performance.  To emulate the league’s ever‑present spotlight, the engine includes a **Media and Reputation** module that operates alongside the narrative system.  It provides a unified framework for how press coverage, social‑media chatter and public relations campaigns influence morale, finances and decision‑making:

* **Media personas and reputation:** Each actor (player, coach, GM, owner) has a `mediaPersona` profile—e.g. *Charismatic*, *Reserved*, *Outspoken*, *Controversial*—and a `reputationScore` that reflects on‑field success, past scandals, philanthropy and media friendliness.  Positive reputations increase fan sentiment and sponsor interest; negative reputations draw scrutiny, reduce merchandise sales and may trigger narrative events.
* **Media outlets and narrative tone:** The narrative engine instantiates virtual journalists and outlets with varying biases—analytics‑driven, sensationalist, local fan‑focused—who generate stories based on events.  Coverage tone depends on the actor’s media persona and the outlet’s style.  Big markets attract more coverage; small markets fly under the radar.  Stories propagate into the `newsFeed` and affect `fanSentiment`, `ownerApproval` and `lockerRoomMorale`.
* **Press conferences and interviews:** After major events (wins, losses, trades, injuries), actors give statements.  Users (or AI agents) choose a tone—diplomatic, candid, deflective—and the engine simulates follow‑up questions.  Responses adjust the speaker’s `reputationScore` and can calm or inflame controversies.  Poorly handled pressers lower morale and may incite board intervention.
* **Social‑media dynamics:** Players and coaches occasionally post on fictional social platforms.  Posts can boost reputation (charity work, motivational messages) or spark scandals (criticising coaches, revealing trade demands).  Viral posts produce narrative events and may accelerate relationship changes (e.g., a veteran calling out a rookie increases `rivalryScore`).
* **Rumours and leaks:** Scouts, agents or disgruntled players can leak draft strategies or trade negotiations to friendly reporters.  Leaks impact draft positioning (other GMs may jump ahead), trade values and team morale.  AI GMs decide whether to confirm, deny or ignore rumours; each choice affects `reputationScore` and future leaks.
* **Public relations strategy:** Teams can invest in PR staff and media training.  A strong PR department reduces the chance that negative stories spiral and helps spin holdouts, suspensions or relocations.  PR spending comes from the operating budget and competes with stadium upgrades or free‑agent signings.
* **Fan sentiment and commercial impact:** Coverage directly influences game attendance, merchandise sales and civic support for stadium funding.  Sustained negative press lowers `fanSentiment`; sustained positive coverage increases it.  Fan protests, petitions or rallies may be generated if public opinion is ignored, forcing owners to act.

The media system ties seamlessly into existing modules: narrative events now include press‑conference choices; reputation influences contract negotiations (agents may demand premium deals for high‑profile clients); and fan sentiment feeds into owner approval and relocation votes.  By giving the press its own mechanics, the engine captures the real NFL’s feedback loops between headlines and decision‑making.

### 3.14 Relationship Dynamics and Temporal Evolution

Relationships in the engine are not static; they evolve through interactions, performance and time.  To model this dynamism, the `Relationship` struct between two actors includes:

* **Trust and communication:** Core metrics carried over from earlier sections, representing confidence in each other’s competence and the quality of information exchanged.
* **Sentiment:** A scalar capturing the emotional tone of the relationship, ranging from strongly positive (close friendship) to strongly negative (rivalry or resentment).  Sentiment influences willingness to cooperate on the field (e.g., a QB looking off a receiver he dislikes) and to accept team‑friendly contracts.
* **Rivalry score:** A specialised metric for animosity between players on opposing teams (or even within a locker room).  Rivalries can boost performance in head‑to‑head matchups but increase personal foul risk.
* **Decay and reinforcement:** Relationships naturally drift towards neutral over time.  Each simulation tick applies a decay factor that nudges `sentiment` and `rivalryScore` toward zero.  Positive events (clutch plays, shared charity work) increment trust and sentiment; negative events (public criticism, missed assignments, contract disputes) decrement them.  A “half‑life” parameter controls how quickly grudges fade and friendships cool if not reinforced.
* **Event triggers:** Thresholds in `sentiment` and `rivalryScore` generate further events.  Extremely negative sentiment can trigger trade demands, holdouts or locker‑room incidents.  High positive sentiment may lead players to accept hometown discounts or restructure contracts.  Elevated rivalry can produce extra aggression, leading to higher tackle success but also higher penalty rates.
* **Integration with media and narrative:** Media stories can inflame or soothe relationships.  Rumours may push sentiment down; successful PR campaigns can repair it.  Social‑media spats between players lower trust; joint public appearances raise it.

These dynamics ensure that relationships mirror the fluid nature of real locker rooms.  They interact with on‑field modules (trust influences targeting decisions and audible compliance), off‑field decisions (sentiment affects willingness to negotiate) and narrative systems (grudges spark storylines, reconciliations produce feel‑good arcs).  Over long simulations, the ebb and flow of sentiment and rivalry contribute significantly to emergent narratives.

### 3.15 Trust‑Driven Decision Logic and Favourite Targets

Building on the relationship model, the engine explicitly incorporates **trust‑driven decision‑making** in several core mechanics:

* **Quarterback target preferences:**  Research on quarterback–receiver rapport shows that trust and timing are critical to offensive success.  Quarterbacks who trust their receivers are more willing to throw on anticipation, knowing their target will be in the right place at the right time【496932750756233†L54-L62】.  As rapport develops, QBs release the ball earlier and more accurately【496932750756233†L66-L72】.  The engine uses the `trust` value between a QB and each receiver to weight the **Option selection** probabilities (Section 2); high‑trust receivers receive more targets in tight windows, while low‑trust receivers must earn targets through consistent performance.  Off‑field bonding and shared practice reps increase trust【496932750756233†L84-L92】, while drops and route miscommunications reduce it.

* **Offensive line coordination:**  Offensive linemen repeatedly emphasise that communication without trust is ineffective【353051572430034†L354-L363】.  Linemen must believe that their teammates will execute the correct block; otherwise, calls and adjustments are meaningless.  The engine therefore factors `trust` into **Blocking success**: linemen with high mutual trust require fewer explicit calls to handle blitzes and stunts.  Lines with low trust suffer coordination penalties, increasing the chance of blown assignments.  Trust builds through offseason bonding, weight‑room effort and practice reps【353051572430034†L365-L377】 and decays with lineup churn.

* **Veteran guidance and silent adjustments:**  Veteran players often develop a “private language” with teammates.  In Geoff Schwartz’s account of Miami’s line resurgence, he notes that he and tackle Marshall Newhouse could simply nod or say “You good?” to handle pressures【353051572430034†L390-L405】.  The engine models this by allowing trusted pairs to make silent pre‑snap adjustments that reduce defensive pressure recognition delay.  Low‑trust pairs must rely on explicit calls, which take more ticks and risk miscommunication.

* **Player satisfaction and target complaints:**  Receivers with high `playingTimePriority` track their target share versus expectations.  If a trusted receiver goes multiple games without targets, their sentiment towards the quarterback and coach declines, potentially triggering trade demands or media outbursts.  Conversely, a QB may consciously spread the ball to avoid creating locker‑room friction, balancing trust with team harmony.

* **Coach‑granted audibles:**  Coaches assign an `audiblePermission` level to quarterbacks based on experience, cognitive skills and trust.  Novice QBs must run the play as called; veterans with proven processing speed and high trust scores may override the play at the line.  Audibles adhere to a **decision tree**—similar to option offences—where the QB picks from a small set of coach‑approved alternatives when a defence shows a certain front.  Trust between the QB and coach determines how often audibles are used; frequent successful audibles increase trust and may earn more freedom.

These enhancements ensure that relationship dynamics are not just abstract numbers but directly influence play selection, execution and the broader narrative arc of the franchise.

## 4. AI GM and Coach Behaviour

- **GM archetypes**: Behavioural parameters are loaded from the archetype framework (Analytics Architect, Culture Commander, Strategic Rebuilder, Player‑Centric Collaborator, Aggressive Dealmaker).  Each archetype weighs analytics vs intuition differently and uses distinct strategies in drafts, trades and contract negotiations.
- **Coach philosophies**: Offense/defense tendencies (run/pass ratios, aggressiveness), adaptability to personnel and communication style.  Coaches adjust schemes automatically; players do not control play calls.
- **Social influence:** AI considers the social network when making roster decisions; high trust between a QB and WR may discourage trading the receiver even if analytics suggest otherwise.

### 4.1 Scheme and Playbook Integration

To support the broad range of offensive and defensive philosophies documented in the integrated scheme research, the engine maintains a **scheme library** and a **playbook mapping**.  Each entry in the library represents an offensive or defensive system (e.g., West Coast, Air Coryell, Erhardt–Perkins, various Spread and Option variants, Run and Shoot, Power/Smashmouth, Pro‑style, 4‑3, 3‑4, 4‑2‑5, 3‑3‑5 and other specialty fronts).  For each scheme the engine records:

1. **Core concepts and play families** – such as mesh, slant‑flat and four verticals for passing games【29466877305428†L46-L69】【511194355291526†L32-L56】【355019842974166†L36-L59】.
2. **Required player labels and attributes** – mapping to the player archetype system (e.g., Gunslinger QBs and Deep Threat WRs for Air Coryell; Dual‑Threat QBs and Scat Backs for Spread Option).  This mapping is derived from the integrated specification and ensures that play calls align with roster strengths.
3. **Cognitive demands** – approximate mental load for quarterbacks and other key positions, used when calculating pre‑snap scans and decision selection.  Schemes like Run and Shoot have high cognitive load due to route adjustments, whereas Smashmouth calls are simpler.
4. **Situational preferences** – guidelines for when a scheme is favoured (e.g., Air Coryell on long‑yardage downs; 46 defense in short‑yardage; Nickel and Dime versus spread sets【213508930002408†L70-L97】).

During **personnel evaluation**, AI GMs and coaches use this mapping to pick an offensive and defensive philosophy that maximises fit.  They may switch schemes across seasons as rosters evolve.  **Game plan generation** uses situational preferences to select formations and plays based on opponent tendencies and down‑distance scenarios.  **In‑game adaptation** allows coaches to swap fronts and coverages mid‑drive (e.g., moving from a 4‑3 to a Nickel against three‑receiver sets or from Cover 2 to Cover 3 against vertical routes【803635243678639†L90-L99】).

## 5. Persistence and Data Management

The engine serialises the entire league state—rosters, contracts, relationships, playbooks, schedule, and historical statistics—into versioned save files.  Supported formats include JSON and SQLite; each save includes a schema version to support future migrations.  Because the simulation is non‑deterministic, reloading a save does not reproduce identical results, but long‑term distributional properties remain stable.

**Modding and editing:** To encourage community involvement, the engine exposes import/export tools for rosters, draft classes, league definitions and playbooks.  These tools accept human‑readable JSON/YAML or CSV formats with documented schema definitions.  Users can create custom fictional leagues, import real historical data (scrubbed of trademarks) or edit schedules.  A **scenario scripting format** (e.g., YAML or JSON) allows definition of starting conditions, objectives, narrative triggers and custom events for scenario mode.  For example:

```yaml
scenarioName: The Win‑Now Ultimatum
startingTeam: Memphis Knights
startingYear: 2035
initialSalaryCap: 220
objectives:
  - reachPlayoffs: true
  - winRate: 0.6
events:
  - week: 4
    type: ownerDirective
    details:
      directive: "Trade for a star receiver"
      consequence: moraleDropIfIgnored
```

Modding support is a key pillar for long‑term engagement.  While advanced modding tools may ship post‑v1, the base engine will be designed with extensibility in mind, including a plugin architecture for adding new schemes or metrics.

## 6. Calibration and Testing

- **Anchoring:** Use anonymised real player data to set initial distributions for physical and cognitive attributes.  Cognitive test correlations (AIQ/S2 scores vs passer rating) help weight variables【258899860156224†L314-L322】.
- **Monte Carlo runs:** Simulate thousands of seasons to ensure league statistics (points per game, interception rates, contract distributions) align with real NFL ranges.  Tune weights accordingly.
- **Feedback loop:** Collect tester feedback on realism and fairness.  Use analytics dashboards to identify anomalies (e.g., too many interceptions, unrealistic contract values) and adjust parameters.

## 7. Analytics, Visualisation and Future Enhancements

### 7.1 Analytics and Visualisation

To support both player immersion and developer tuning, the engine exposes an **analytics interface** and flexible visualisation hooks:

* **Data export:** All play‑by‑play logs, player statistics, team performance metrics (e.g., EPA per play, success rates by down and distance, blitz frequency, cap spending) and relationship metrics are available through API endpoints or file exports.  These exports power external dashboards and enable advanced statistical analysis.
* **In‑game dashboards:** Within the game UI, statistics are presented via sortable tables and charts.  Users can view player progression curves, salary breakdowns, morale trends, hierarchy diagrams and buy‑in distributions.  Comparable to Football Manager’s data hub, these dashboards aid decision‑making.
* **Match visualisation:** Though the engine focuses on data simulation, it produces structured play descriptions (down, distance, formation, play concept, players involved, outcome) that the UI can render as a text commentary feed or a simple top‑down animation with X/O or sprite representations.  This supports a progressive enhancement path—from raw text to 2D representation and beyond—without altering core logic.

### 7.2 Future Enhancements (Post‑v1)

* **Enhanced visualisation:** Once core fidelity is validated, introduce richer match‑day visualisations (2D or simple 3D) and highlight reels built from play descriptors.
* **Expanded modding API:** Provide scripting hooks and comprehensive schema documentation for rosters, contracts, events and UI customisation.  Allow community creation of new schemes, metrics and narrative scripts.
* **Online leagues:** Build optional server infrastructure for asynchronous multi‑user leagues with commissioner tools, standings, and shared draft rooms.
* **Advanced AI and analytics:** Incorporate machine‑learning models to evolve AI GM and coach behaviours over time, and display advanced metrics like Expected Points Added, win probability models and fourth‑down decision calculators.
* **Accessibility and localisation:** If the game gains traction, add colour‑blind modes, adjustable font sizes and support for multiple languages to broaden the audience.

## Conclusion
## 8. Architecture Clarification and Technology Stack

The Viridian engine utilises a clear separation of concerns between core simulation, deployment targets and user interfaces.  Earlier drafts contained conflicting proposals (Java core vs. WebAssembly vs. JavaFX); this section clarifies the final stack.

- **Simulation core:** The heart of the engine is written in **Java**, chosen for its mature concurrency model, extensive ecosystem and the ability to compile to portable bytecode.  All deterministic and probabilistic logic, data models and algorithms are implemented in Java.
- **WebAssembly optimisation:** To achieve near‑native performance in a web browser, the Java simulation core can be ahead‑of‑time compiled to **WebAssembly**.  This allows the same codebase to run both server‑side and client‑side, providing responsive browser‑based play without sacrificing complexity.  WebAssembly is an optimisation layer rather than a separate language; there is no independent Rust or C++ simulation.
- **Desktop UI:** For offline play and advanced visualisations, the desktop build uses **JavaFX**.  JavaFX integrates seamlessly with the Java core and provides rich UI widgets for charts, tables and interactive dashboards.
- **Web UI:** The browser client is built with **React** and **TypeScript**.  It communicates with the WebAssembly module via a thin **REST API**.  React handles rendering of data‑dense dashboards and narrative feeds, while TypeScript’s static typing aids AI‑generated code quality.

This architecture allows the game to be delivered as a standalone desktop application or as a progressive web application without duplicating simulation code.  It resolves previous contradictions by positioning Java as the single source of truth and using WebAssembly for browser optimisation.

## 9. Unified Relationship Model

Multiple documents previously defined relationship graphs with different terminology and formulas.  This section consolidates them into a single model used across the engine.

Every **Relationship** between two actors (players, coaches, GMs, owners) is represented as a struct with the following fields:

| Field | Type / Range | Description |
| --- | --- | --- |
| `trust` | Float 0–1 | Confidence that the other actor will execute assignments and act in the team’s best interest.  High trust reduces randomness in decision outcomes and improves responsiveness to adjustments【353051572430034†L348-L362】. |
| `communicationQuality` | Float 0–1 | Measures clarity and frequency of information exchange.  High values enable complex pre‑snap adjustments and efficient problem solving【353051572430034†L365-L379】. |
| `sharedHistory` | Float 0–1 | Length and significance of past interactions.  Players who have practised or played together for years accrue higher shared history. |
| `sentiment` | Float −1 to 1 | Captures personal affection or animosity.  Positive sentiment indicates friendship; negative sentiment indicates rivalry or dislike.  Sentiment evolves based on events and decays toward neutral over time. |
| `cohesionWeight` | Float 0–1 | Importance of this relationship to overall team cohesion.  Relationships within the same position group (QB–WR, offensive line) have higher weights than cross‑unit relationships.  Cohesion scores for position groups are a weighted average of trust, communicationQuality and sentiment.

Relationships are updated through **event‑driven adjustments** (e.g., successful plays, disagreements, media controversies) and **time‑based decay** (sentiment drifts toward neutral if no new events occur).  Thresholds on trust and sentiment trigger secondary behaviour: extremely high trust leads to favourite‑target tendencies【270028755934373†L420-L431】【63934293188083†L80-L85】, whereas extremely low sentiment can cause trade requests or locker‑room incidents.

## 10. GM Archetype Implementation

The AI general managers are driven by archetypes inspired by research on real sports executives.  The five archetypes—**Analytics Architect**, **Culture Commander**, **Strategic Rebuilder**, **Player‑Centric Collaborator** and **Aggressive Dealmaker**—affect decision heuristics across drafting, trading, free agency and contracts.  To integrate them concretely:

1. **Trait tolerance matrices:**  Each archetype defines a matrix of weights representing tolerance for player traits (e.g., diva, locker‑room cancer, hidden gem).  For instance, a Culture Commander assigns a high penalty weight to negative personalities, while an Aggressive Dealmaker discounts personality in favour of value.
2. **Decision heuristics:**  Archetypes use different weights when calculating **ProspectEV** and **SurplusValue**.  Analytics Architects emphasise long‑term value and compensatory pick formulas; Culture Commanders prioritise high character and cohesion; Strategic Rebuilders favour draft picks and cap flexibility; Player‑Centric Collaborators weigh careerGoals heavily; Aggressive Dealmakers chase star talent and headline trades.
3. **Narrative triggers:**  Each archetype has bespoke narrative events that can influence morale or ownership approval.  For example, a Player‑Centric Collaborator might be praised in the media for supporting a player’s charity initiative, while an Aggressive Dealmaker may be criticised for a cold trade.
4. **Adaptive behaviour:**  GMs track outcomes of past decisions and adjust heuristics slightly over time (e.g., recalibrate tolerance for diva receivers after a locker‑room blowup).  This allows AI GMs to learn within archetypal boundaries and generate emergent strategies.

Including these details eliminates previous gaps where archetypes were referenced but not implemented.

This design specification outlines a comprehensive blueprint for the Viridian Football engine.  By grounding the simulation in empirical research on cognitive processing【258899860156224†L230-L246】【826565933762949†L530-L540】 and team dynamics【824117808319156†L682-L690】【824117808319156†L727-L737】, the engine can deliver emergent, realistic gameplay rather than arbitrary modifiers.  Before coding begins, this spec should be reviewed and refined to ensure alignment with budget and scope.  Once finalized, AI coding agents can implement the modules in parallel, confident that every variable and algorithm supports the vision of the deepest and most authentic NFL‑style GM simulator on the market.