# Integration of Archetypes, Playbook Modelling, and Relationship Calibration

This document outlines how to integrate the general manager (GM) and coach archetypes into the personality model, refine playbook modelling, and calibrate relationship and cohesion formulas using historical data.

## 1. Integrating GM and Coach Archetypes with the Personality Model

### GM Archetypes
The research documents identify several GM archetypes: **Analytics Architect**, **Culture Commander**, **Strategic Rebuilder**, **Player‑Centric Collaborator** and **Aggressive Dealmaker**.  To integrate these:

- **Trait tolerance matrix.**  For each GM archetype, define tolerance or aversion levels for each player personality label.  For instance, a Culture Commander strongly dislikes "Diva" or "BadInfluence" labels and will seek to trade or discipline those players, while an Aggressive Dealmaker may tolerate them if they improve on‑field performance.
- **Decision heuristics.**  Map archetype to decision‑making patterns: Analytics Architects prioritise metrics like Expected Points Added (EPA) and draft value charts, Culture Commanders prioritise locker‑room cohesion scores, Strategic Rebuilders emphasise future draft capital and long‑term cap flexibility, Player‑Centric Collaborators focus on morale and relationships, and Aggressive Dealmakers pursue high‑variance trades.
- **Narrative triggers.**  Use archetypes to trigger news‑feed stories.  For example, a Culture Commander GM may hold a press conference about team culture after a "Locker‑Room Cancer" event, while an Aggressive Dealmaker will generate headlines during trade deadlines.

### Coach Archetypes and Schemes

- **Define coach profiles.**  Each coach has a preferred offensive and defensive philosophy (e.g., West Coast offense, Air Raid, Run & Shoot; 4‑3 or 3‑4 defense).  They may also have tendencies such as being conservative on fourth downs or aggressive blitzers.
- **Player label affinities.**  For each scheme, list the labels that fit best (e.g., a West Coast coach favours Slot Receivers, Possession WRs and FilmGeek QBs; an Air Raid coach wants DeepThreats, Dual‑Threat QBs and Ball Hawk corners).  Misalignment between coach and roster should reduce efficiency and cohesion until players or scheme change.
- **Evolution.**  Coaches can adapt or be replaced; GM archetype influences hiring decisions (e.g., Analytics Architects hire coaches who embrace data‑driven play‑calling).

## 2. Playbook Modelling

### Offensive Play Concepts

- **West Coast Offense.**  Characterised by short, horizontal passing to stretch the defense and create yards after catch【167853978738021†L142-L145】.  Core plays: mesh, slant/flat, quick outs, curl concepts.  Requires accurate QBs, reliable possession receivers and a strong short‑passing offensive line.  Good fit for Slot Receivers and all‑purpose RBs.
- **Air Coryell / Vertical Offense.**  Emphasises deep passing, utilizing vertical routes like go, post and dig.  Relies on strong‑armed QBs, DeepThreat WRs and max‑protect pass blocking.
- **Run & Shoot.**  Ball‑control offense that uses high‑percentage passes to move methodically downfield with four‑receiver sets【304347513238379†L44-L59】.  Demands an accurate QB and receivers who adjust routes on the fly.
- **Spread Offense.**  A family of schemes (Air Raid, Spread Option, Smashmouth, Pro‑Style) that spreads the formation across the field and runs up‑tempo plays【462284417332835†L40-L48】.  Uses quick reads, option routes and RPOs.  Personnel groupings vary: Air Raid leans pass‑heavy with four WRs【462284417332835†L144-L167】; Spread Option mixes QB runs with zone reads.

### Defensive Alignments

- **4‑3 Defense.**  Four defensive linemen and three linebackers; strong against run and pass; one‑gap responsibilities; supports zone and man coverage【630393624974907†L23-L41】【630393624974907†L58-L69】.  Favours Thumper linebackers and a deep defensive line rotation.
- **3‑4 Defense.**  Three down linemen and four linebackers; hides the fourth pass rusher; each front‑seven player has one‑gap assignment; effective against varied offenses【167553913613363†L24-L46】【167553913613363†L87-L99】.  Suits hybrid linebackers, BullRushers and versatile nose tackles.

### Mapping to Player Labels

- Each play concept in the engine should include metadata specifying the roles and labels required for optimal execution.  For example, the "mesh" concept needs two Slot Receivers or Tight Ends with good hands, while "four verticals" benefits from DeepThreat receivers and a strong‑armed QB.  Defensive calls like Cover 2 rely on Lockdown corners and Field‑General safeties; blitz packages need SpeedRushers and Coverage linebackers.
- AI coaches evaluate their current roster’s labels when selecting plays.  If personnel mismatch occurs, efficiency drops and players may become unhappy, influencing relationship scores.

## 3. Relationship & Cohesion Calibration

### Historical Data Collection

- **Offensive line continuity vs sacks:** Analyse seasons where line combinations remain stable and compare sack rates and yards per carry to seasons with constant shuffling.  Data from publicly available NFL statistics can provide correlation coefficients.
- **QB–WR cohesion:** Examine target share continuity (e.g., quarterback throwing to the same top receivers) vs passer rating or Expected Points Added.  Determine if strong familiarity significantly reduces miscommunications and interceptions.
- **Defensive secondary continuity:** Explore how consistent corner–safety pairings affect yards per attempt allowed and completion percentage.

### Parameter Estimation

- Use regression or machine‑learning models on historical data to estimate the magnitude of cohesion effects.  For example, a 10 % increase in offensive‑line continuity may reduce sack rate by a certain percentage.  Translate these findings into simulation modifiers.
- Differentiate weightings by unit importance.  Cohesion among offensive linemen and between QBs and primary receivers should have higher impact than cohesion among backup running backs and wide receivers.

### Validation and Tuning

- **Simulated seasons:** Run thousands of simulated seasons with different cohesion parameters to identify ranges that produce realistic league‑wide statistics (e.g., distribution of sacks, completion rates, yards per play).
- **User feedback:** In closed beta, collect player perception of whether team chemistry effects feel realistic.  Adjust weighting accordingly to avoid over‑ or under‑representing cohesion.

## 4. Next steps for implementation

1. **Populate the player‑label database** by scraping and compiling data from scouting reports, draft analyses and media articles.  Store this in a structured format (e.g., JSON or CSV) for the simulation engine.
2. **Extend the GM/coach archetype classes** to include tolerance matrices and decision heuristics.  Implement functions that adjust trade proposals, draft preferences and hiring decisions based on these archetypes.
3. **Implement a playbook module** that stores offensive and defensive play concepts with metadata on required player labels, down‑and‑distance preferences and situational modifiers.
4. **Develop the relationship model** with position‑group granularity, incorporating the calibration weights derived from historical analysis.  Simulate initial seasons to test the model’s realism and iteratively refine the coefficients.

