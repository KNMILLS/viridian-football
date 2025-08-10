# NFL Contract Mechanisms and GM Archetype Research

This report supplements the **Viridian Football** master plan by deep‑diving into salary‑cap mechanics and general‑manager archetypes.  It summarises key rules from the NFL’s collective bargaining agreement (CBA) and extracts leadership lessons from media portrayals to inform the game’s AI general‑manager (GM) personalities.

## 1. Salary‑cap and contract rules

### 1.1 Practice squad rules (2025 CBA)

The 2020 CBA expanded practice squads to 16 players, with up to six veterans (unlimited accrued seasons) as long as the veteran and two‑year categories combined do not exceed ten players【934304283426232†L135-L143】.  Players with no accrued seasons or fewer than nine games in their lone accrued season can fill any of the 16 slots【934304283426232†L119-L126】.  Standard pay is **\$12,500 per week** (~\$225k per season), while veterans can earn **\$21,300 per week** (~\$383k); these salaries count against the cap【934304283426232†L164-L178】.  Other key points:

* Players may not move directly from one practice squad to another; if signed by another club, they must be placed on the 53‑man roster for at least three weeks, receiving a guaranteed three‑week salary【934304283426232†L185-L193】.
* Each team may elevate a practice‑squad player to the active roster up to three times per season without waivers; further elevations require signing to the 53‑man roster【934304283426232†L201-L219】.

### 1.2 Compensatory draft picks

Compensatory picks create an “eighth round” of the draft; they are awarded to teams that lose more qualifying unrestricted free agents (CFAs) than they sign【539062161419306†L118-L126】.  A CFA must be an unrestricted free agent who signed with a new club and ranked in the top **35 %** of players by adjusted average per year【539062161419306†L173-L179】.  The formula starts with a player’s average per year, subtracts non‑countable money, adds points for snap counts and postseason honours, and assigns picks to rounds 3–7 based on percentile thresholds【539062161419306†L199-L214】.  Teams can receive a maximum of **four** compensatory picks per year and the total across the league is capped at **32**【927743783079468†L75-L84】.

### 1.3 Restricted free agency (RFA)

Players with **three accrued seasons** who receive a **qualifying offer** become RFAs when their contract expires【285066973711102†L398-L403】.  During the signing period, RFAs may negotiate with any club; the original team holds the **right of first refusal** and can match any offer.  If the original club declines to match, it receives draft compensation based on the tender level【285066973711102†L410-L420】.  The tender amounts for 2025 are:

| Tender type (2025) | Salary (USD) | Draft‑pick compensation |
|---|---|---|
| Right‑of‑first‑refusal only | **$3.263 M** | None【285066973711102†L425-L440】 |
| Original‑round tender | **$3.406 M** | Same round as player was originally drafted【285066973711102†L425-L440】 |
| Second‑round tender | **$5.346 M** | Second‑round pick【285066973711102†L425-L440】 |
| First‑round tender | **$7.458 M** | First‑round pick【285066973711102†L425-L440】 |

Players with four or more accrued seasons become unrestricted free agents and may sign anywhere without compensation【285066973711102†L398-L403】.

### 1.4 Rookie wage scale

The rookie wage scale sets descending contract values by draft slot.  In 2024 the top pick (Caleb Williams) received a four‑year deal worth **$39.5 M**【412079432858791†L121-L131】.  The minimum rookie salary has risen from **$230k** in 2004 to **$840k** in 2025【236697010703175†L156-L262】.  Late‑round rookies earn much less than top picks; for example, “Mr. Irrelevant” (final pick) signs a contract worth about **$4.1 M** total【412079432858791†L121-L156】.

### 1.5 Contract restructures and signing bonuses

Teams frequently convert base salary or roster bonuses into signing bonuses to create immediate cap space.  The NFL operations site notes that a **typical contract restructure** converts part of a player’s base salary into a signing bonus, lowering the current cap hit but increasing cap charges in subsequent years【246197952663549†L793-L815】.  For example, the Rams lowered Aaron Donald’s 2021 cap hit by reducing his base salary from \$19.9 M to \$1.9 M and converting the remaining \$18 M into a signing bonus prorated over four years; this created \$13.5 M of 2021 cap space but increased his cap hits by \$4.5 M in each of the next three seasons【246197952663549†L804-L834】.

Over The Cap explains two types of restructures:

* **Simple restructure:** converts scheduled payments (base salary or roster bonus) into prorated signing bonuses across the remaining contract.  Teams can usually execute this unilaterally【461408752541330†L116-L135】.
* **Maximum restructure:** adds void years or extends the contract to maximize the amount converted into a signing bonus; this requires player consent【461408752541330†L126-L135】.

SumerSports provides further context: NFL contracts generally consist of base salary (Paragraph 5), prorated bonus money, roster bonuses and per‑game/workout bonuses【40820465663948†L40-L56】.  **Signing bonuses are prorated over up to five years** (or the contract length)【40820465663948†L66-L73】.  Restructures typically convert base salary or roster bonuses into prorated signing bonuses【40820465663948†L81-L109】, freeing up cap space now but pushing cap charges into future seasons【40820465663948†L112-L130】.  Over The Cap notes that converting Dak Prescott’s \$45.75 M salary into a bonus created \$36.6 M in 2025 cap space while increasing his cap numbers by \$9.15 M in later years【532731011451090†L124-L138】.

### 1.6 Void years and dead money

Void years are extra years appended to a contract solely to spread signing‑bonus proration; the player will never actually play under those years.  Over The Cap states that a **void year is a fake contract year used for the sole purpose of parking salary cap charges**, and when the contract expires the remaining prorated amounts accelerate into the current year【800208792836113†L116-L132】.  The Phinsider article (2024) provides an example: Shaq Barrett signed a one‑year deal with four void years; his \$5.5 M signing bonus was prorated over five years to reduce the 2024 cap hit.  Once the void years triggered, the remaining \$4.4 M accelerated into the 2025 cap as dead cap【448514427120040†L112-L151】.

### 1.7 Franchise and transition tags

The NFL allows each team to designate one **franchise player** or one **transition player** among its veteran free agents【442904080199723†L353-L354】.  

* A **non‑exclusive franchise player** receives a one‑year contract for the greater of: (A) the average of the five largest prior‑year salaries at his position (the “Cap Percentage Average”), or (B) 120 % of his prior‑year salary【442904080199723†L369-L378】.  Franchise players may negotiate with other clubs, but if they sign elsewhere, the original club receives **two first‑round picks** as compensation【442904080199723†L380-L383】.
* An **exclusive franchise player** cannot negotiate with other teams and is tendered at the higher of the top‑five average or 120 % of his previous salary【442904080199723†L359-L378】.
* A **transition player** is tendered at the greater of the average of the top ten salaries at his position or 120 % of his previous salary【442904080199723†L447-L450】.  The original club retains the right of first refusal but receives **no draft compensation** if it declines to match another club’s offer【442904080199723†L452-L456】.

### 1.8 Additional mechanisms (future research)

This report does not yet cover franchise/transition tag salary calculations, injury guarantees, roster‑bonus triggers, fifth‑year options for first‑round picks or cap carryover rules.  These details should be researched before finalising the contract simulation modules.

## 2. GM archetype inspiration from media portrayals

To build dynamic AI general managers, we examined leadership lessons from the film **Moneyball** (a dramatized account of Oakland A’s GM Billy Beane).  Product Leadership summarises several qualities exhibited by Beane:

* **Hiring and grooming talent:** great leaders recognise and empower talent, allowing individuals to grow and take on challenging roles【168052973837179†screenshot】.
* **Focusing on real issues:** effective leaders ask the right questions and address root problems rather than following conventional thinking【168052973837179†screenshot】.
* **Challenging the status quo:** leaders are willing to challenge established norms and drive change even in the face of resistance【168052973837179†screenshot】.
* **Identifying meaningful metrics:** leaders concentrate on the metrics that truly matter to success (similar to the sabermetrics revolution in Moneyball)【168052973837179†screenshot】.
* **Prioritising team success over personal credit:** leaders take responsibility for both victories and failures and avoid seeking personal recognition【168052973837179†screenshot】.
* **Connecting and communicating:** maintaining morale through clear communication and positive reinforcement is essential【168052973837179†screenshot】.

These themes highlight archetypes such as **Data‑Driven Innovators** (who embrace analytics and challenge tradition), **Talent Developers** (who prioritise player development), **Status‑Quo Guardians** (who rely on established scouting heuristics), and **Politician GMs** (who focus on relationships and media).  Additional research—interviews, documentaries and podcasts with NFL general managers—should be conducted to capture nuances like risk tolerance, negotiation styles and attitudes toward analytics.

## 3. Implications for the simulation design

1. **Depth of contract modelling:** The engine must simulate practice‑squad dynamics, compensatory pick calculations, RFA tenders, rookie wage scale slots, restructures, void years, franchise/transition tags and eventually other contract triggers.  Data structures should support prorated bonuses, different guarantee types, tender flags and void‑year placeholders.

2. **Emergent cap management:** Non‑deterministic AI GMs should evaluate when to restructure contracts (simple vs maximum), when to use void years, and how to balance immediate cap space versus future dead money.  The simulation must track cap hits across seasons and apply accelerations when contracts void.

3. **Narrative hooks:** Many contract events (franchise tags, tender decisions, restructures) generate storylines.  The newsfeed can report on a team tagging its star receiver or converting a quarterback’s salary into a signing bonus, affecting fan reactions and locker‑room morale.

4. **GM personality models:** The leadership qualities derived from Moneyball inform archetypes for AI GMs—analytics‑driven, conservative, relationship‑focused, etc.  Each archetype should influence drafting, scouting, contract negotiations and media interactions.

## 4. Next steps

* **Research remaining CBA mechanisms:** Investigate injury guarantees, roster bonuses, option bonuses, fifth‑year option rules and cap carryover.  Obtain accessible sources for these topics.
* **Collect real contract datasets:** Use public APIs or web scraping to gather historical and current NFL contracts, including base salaries, bonuses, and contract length, for realistic simulation seeds.
* **Conduct GM archetype analysis:** Review interviews, podcasts and articles about notable NFL GMs to capture behavioural patterns—e.g., Bill Belichick’s information control, Howie Roseman’s aggressive trades, or John Schneider’s focus on value.  Map these patterns to AI decision parameters.
* **Integrate into PRD/TDD:** Translate the rules and archetypes into data models (e.g., `Contract`, `Tender`, `GMArchetype` classes) and algorithms for the game engine.

This domain research ensures that **Viridian Football** captures the full complexity of NFL roster management while grounding AI GMs in authentic personalities.
