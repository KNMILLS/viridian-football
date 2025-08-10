# Integrated Scheme and Playbook Specification

This document integrates the comprehensive offensive and defensive scheme research into the existing playbook modelling and design specifications for the **Viridian Football** simulation.  It ties foundational philosophies to player traits, summarises personnel requirements and outlines how the unified engine will model scheme selection and adaptation.

## 1 Offensive Philosophies

The simulation must support a broad set of offensive systems.  Each entry below summarises the philosophy and lists the core player traits that maximise its effectiveness.  Citations are drawn from coaching analyses and game‑design research.

### 1.1 West Coast offense

**Philosophy:** A horizontal passing system that emphasises short and intermediate throws, treating the passing game as an extension of the run【842711003000890†L49-L70】.  It relies on precise routes and quick reads to create yards after catch.  The run game features power and iso plays【842711003000890†L78-L90】.

**Ideal traits:**
- **Game Manager** or accurate **Dual‑Threat QB** with strong **Processing** and **Visual‑Spatial** abilities.
- **Possession WRs** and **Slot Receivers** skilled in quick routes and YAC.
- **Receiving TEs** and **All‑Purpose RBs** for underneath options.
- **Tenacious Blockers** and **Ath Blocker** traits on the offensive line.

### 1.2 Air Coryell / Vertical offense

**Philosophy:** Stretches the field vertically with timed deep drops and vertical routes【355019842974166†L36-L59】.  Requires patience and a strong‑armed quarterback.

**Ideal traits:**
- **Gunslinger** quarterbacks with high **Arm Strength** and risk tolerance.
- **Deep Threat** or **Speed WRs** to exploit seams.
- **Power Runner** to draw defenders into the box and set up play‑action.
- **Tenacious Blockers** to protect long‑developing routes.

### 1.3 Erhardt–Perkins system

**Philosophy:** A flexible, pro‑style system that uses a run‑heavy attack to set up play‑action.  It features a complex vocabulary and on‑the‑fly adjustments at the line.

**Ideal traits:**
- Cerebral quarterbacks who are **Film Geeks** and **Perceptive**.
- **All‑Purpose RBs** who excel in pass protection and receiving.
- **Versatile WRs/TEs** who can run diverse route trees.
- **Bruiser** backs and **Tenacious Blockers** for downhill running.

### 1.4 Spread offense and variants

**Philosophy:** Spreads the formation horizontally with four or more receivers; uses tempo and line‑of‑scrimmage audibles【462284417332835†L33-L45】.  Variants include Air Raid, Spread Option, Smashmouth Spread and Pro‑style Spread【462284417332835†L128-L168】.

**Ideal traits:**
- **Air Raid:** **Deep Threat** receivers, **Gunslinger** or strong‑armed QBs and **Scat Backs** for checkdowns.
- **Spread Option:** **Dual‑Threat QBs**, **Bruiser** and **Scat Backs**; **Hybrid LB** and **Zone Corner** on defense.
- **Smashmouth Spread:** **Bruiser** backs, **Tenacious Blockers**, plus **Slot Receivers** for balance.
- **Pro‑Style Spread:** Balanced rosters with **All‑Purpose RB**, **Possession WR**, **Slot Receiver**, **Power Runner** and **Power Kicker**.

### 1.5 Option offense

**Philosophy:** Uses quarterback reads to determine handoff, keep or pitch.  Includes triple option, veer option and flexbone variants.  Emphasises misdirection and disciplined blocking.

**Ideal traits:**
- **Dual‑Threat** quarterbacks with high **Processing Speed** and **Agility**.
- **Bruiser** fullbacks and **Scat Back** halfbacks.
- Offensive linemen with **Tenacious Blocker** and **Ath Blocker** traits.

### 1.6 Run and Shoot offense

**Philosophy:** Four‑receiver sets and a shotgun quarterback; receivers adjust routes based on coverage【296463773246717†L82-L88】.  High‑percentage passing to methodically advance the ball【296463773246717†L65-L72】.

**Ideal traits:**
- **Film Geek** quarterbacks who can process coverage quickly【296463773246717†L44-L49】.
- **Slot Receivers**, **Deep Threats** and **Receiving TEs** comfortable reading coverage.
- **All‑Purpose RBs** for draw plays and checkdowns.

### 1.7 Power run / Smashmouth football

**Philosophy:** Prioritises a downhill run game to wear down defenses.  Passing is secondary and built off play‑action.

**Ideal traits:**
- **Bruiser** or **Power Runner** backs.
- **Tenacious Blocker** linemen and **Blocking TEs**.
- **Game Manager** QBs who execute play‑action efficiently.

### 1.8 Other formations and systems

* **Pro‑style offense:** Balanced run/pass attack with complex formations and versatile personnel【254128993658019†L39-L51】【254128993658019†L61-L74】.  Requires **All‑Purpose RBs** and QBs with strong arms.
* **Pistol alignment:** Combines downhill runs with shotgun passing; suits **Dual‑Threat QBs** and **Power Runner** backs【524210843513336†L44-L58】.
* **Wishbone:** Heavy option formation featuring three backs【362565299932892†L185-L195】; emphasises power running and misdirection【362565299932892†L198-L207】.
* **I‑formation / T‑formation:** Traditional formations for power runs and play‑action.
* **Single Wing / Wildcat:** Specialty packages that give the ball directly to a non‑QB runner.

## 2 Defensive Philosophies

Defenses are modelled through base fronts and coverage shells.  AI coaches will mix and match fronts and coverages based on opponent tendencies.

### 2.1 Base fronts

- **4‑3 defense:** Four linemen and three linebackers.  Each defender has one‑gap responsibility; works against run and pass【630393624974907†L23-L41】.  Suitable for **Press Corners**, **ShutDown Corners**, **Speed Rushers** and **Thumper** linebackers.【630393624974907†L58-L69】
- **3‑4 defense:** Three linemen and four linebackers.  Hides the fourth rusher and confuses protections【167553913613363†L24-L46】; defenders each cover one gap【167553913613363†L87-L99】.  Best with **Nose Tackle**, **Hybrid LB**, **Bull Rusher** and **Zone Corner** traits.
- **5‑2 defense:** Heavy run front; five linemen and two linebackers.  Used in goal‑line and short‑yardage situations.
- **4‑4 defense:** Four linemen and four linebackers.  Designed to stop the run; emphasises **Thumper** and **Run‑Stuffer** traits.
- **3‑3‑5 defense (Stack):** Three linemen, three linebackers and five defensive backs.  Counter to spread offenses with flexible blitz assignments.
- **4‑2‑5 defense (Nickel):** Four linemen, two linebackers and five defensive backs; counters three‑receiver sets.  Requires agile **Nickel Corner** and **Zone Corner**【213508930002408†L70-L97】.
- **Dime/Quarter packages:** Six or seven defensive backs for obvious passing situations.
- **46 defense:** Aggressive front with eight players in the box; pressures the offense and stops the run.

### 2.2 Coverage shells

- **Cover 0:** All‑out man coverage with no deep safety.  High risk, high reward.
- **Cover 1:** Man coverage with a single free safety.
- **Cover 2 / Tampa 2:** Two deep safeties with five underneath zones【803635243678639†L67-L71】; middle linebacker carries vertical routes【803635243678639†L90-L99】.
- **Cover 3:** Three deep defenders and four underneath zones.
- **Cover 4 (Quarters):** Four deep defenders; strong against deep routes.
- **Cover 6:** Combination of Cover 2 on one side and Cover 4 on the other.
- **Zone Blitz:** Drops a lineman and sends a linebacker or defensive back to blitz, creating confusion.
- **Pattern Matching:** Starts as zone but converts to man based on routes.

## 3 Scheme–Label Mapping in the Simulation

The engine’s play‑calling logic must tie schemes to player labels.  This mapping ensures that AI coaches select plays that suit their personnel and adapt to opponents.  The table below builds on the earlier playbook modelling document, expanding to include the newly researched schemes.

| Offensive scheme | Key player labels |
|---|---|
| **West Coast** | Game Manager / accurate Dual‑Threat QB; Possession WR; Slot Receiver; All‑Purpose RB; Receiving TE; Tenacious Blocker |
| **Air Coryell** | Gunslinger QB; Deep Threat WR; Speed WR; Power Runner; Tenacious Blocker |
| **Erhardt–Perkins** | Film Geek / Perceptive QB; All‑Purpose RB; Versatile WR/TE; Bruiser RB; Tenacious Blocker |
| **Air Raid (Spread)** | Gunslinger or strong‑armed QB; Deep Threat WR; Scat Back; Speed Rusher & Coverage LB on defense |
| **Spread Option** | Dual‑Threat QB; Bruiser RB; Scat Back; Hybrid LB; Zone Corner |
| **Smashmouth Spread** | Bruiser RB; Tenacious Blocker; Slot Receiver; Possession WR |
| **Pro‑Style Spread** | All‑Purpose RB; Possession WR; Slot Receiver; Power Runner; Power Kicker |
| **Option (Triple/Veer/Flexbone)** | Dual‑Threat QB; Bruiser FB; Scat Back HB; Tenacious Blocker |
| **Run and Shoot** | Film Geek QB; Slot Receiver; Deep Threat; Receiving TE; All‑Purpose RB |
| **Power/Smashmouth** | Bruiser / Power Runner; Tenacious Blocker; Blocking TE; Game Manager QB |
| **Pro‑style offense** | All‑Purpose RB; Strong‑armed QB; Possession WR; Versatile TE; Tenacious Blocker |

Defensive fronts and coverages will similarly map to player labels: 4‑3 teams prefer Press and ShutDown corners, Speed Rushers and Thumper linebackers; 3‑4 teams need Hybrid linebackers, Nose Tackles and Zone Corners; Nickel packages prioritise agile Slot and Zone corners and Coverage linebackers; and so on.

## 4 Integration with the Unified Simulation Engine

The engine’s coach AI must use this mapping to evaluate its roster and call plays accordingly:

1. **Personnel evaluation:** Each off‑season, AI GMs and coaches analyse player labels and choose offensive and defensive philosophies that maximise fit.  For example, a team with a Dual‑Threat QB and Scat Back will lean toward Spread Option concepts, while a roster with a Bruiser RB and Tenacious Blockers may select a Power run scheme.
2. **Game plan generation:** Before each game, AI coaches assess the opponent’s tendencies and choose a mix of schemes (e.g., running Cover 2 against vertical offenses【803635243678639†L90-L99】).  They adjust call frequency based on game state and matchups.
3. **In‑game adaptation:** During games, coaches adjust formation, front and coverage based on down, distance and personnel usage.  For instance, facing multiple receiver sets, they switch to Nickel (4‑2‑5) or Dime packages to counter【213508930002408†L70-L97】.
4. **Scheme evolution:** Over multiple seasons, coaches may adapt or change schemes as rosters evolve, reflecting real‑world coaching adjustments.

## 5 Conclusion

By integrating the comprehensive scheme research into the design specification and playbook models, the simulation gains the flexibility to model modern football’s vast strategic landscape.  AI GMs and coaches will make more nuanced decisions, and players’ traits will meaningfully influence scheme selection, play‑calling and team success.