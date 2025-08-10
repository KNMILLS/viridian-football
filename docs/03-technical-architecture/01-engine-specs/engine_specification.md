# USE Engine Specification
==========================

## 📋 Document Information
- **Document Type**: Technical Specification
- **Component**: Unified Simulation Engine (USE)
- **Version**: 2.0
- **Last Updated**: [Current Date]
- **Status**: Enhanced Draft

## 🎯 Purpose
This document provides a comprehensive specification for the Unified Simulation Engine (USE), the core simulation component of the Viridian Football project, including advanced realism enhancements for body positioning, spatial awareness, fatigue modeling, and injury risk calculation.

## 🏗️ Architecture Overview

### Core Components
1. **Simulation Core** - Main game loop and state management
2. **Player Engine** - Player behavior and relationship simulation
3. **Team Engine** - Team dynamics and strategy simulation
4. **League Engine** - League-wide simulation and scheduling
5. **AI Engine** - Artificial intelligence for GM and player decisions
6. **Data Engine** - Data persistence and retrieval
7. **Physics Engine** - Advanced collision and biomechanical modeling
8. **Fatigue Engine** - Multi-level fatigue accumulation and recovery
9. **Injury Engine** - Context-aware injury risk calculation

### Technology Stack
- **Primary Language**: Java
- **Web Integration**: WebAssembly (WASM)
- **API Layer**: REST API
- **Data Storage**: [To be specified]
- **Platform**: Cross-platform (web/desktop)

## 🔧 Technical Specifications

### Performance Requirements
- **Simulation Speed**: 60 FPS minimum
- **Memory Usage**: < 512MB for standard game session
- **Load Time**: < 5 seconds for initial game load
- **Save Time**: < 2 seconds for game state persistence

### Scalability Requirements
- **Concurrent Users**: Support for 1000+ simultaneous users
- **Data Volume**: Handle 10,000+ Player records
- **Simulation Complexity**: Support for complex multi-season simulations

### Platform Compatibility
- **Web Browser**: Chrome 90+, Firefox 88+, Safari 14+
- **Desktop**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
- **Mobile**: Responsive design for tablet interfaces

## 🎮 Game Simulation Features

### Player Simulation
- **Attributes**: Physical, mental, and skill attributes
- **Development**: Age-based progression and regression
- **Relationships**: Inter-player relationship dynamics
- **Personality**: GM archetype influence on behavior
- **Performance**: Statistical modeling and variance
- **Body Position States**: Finite state machine for player positioning and leverage
- **Fatigue Modeling**: Multi-level fatigue accumulation and recovery
- **Injury Risk**: Context-aware injury probability based on contact dynamics

### Team Simulation
- **Roster Management**: Player acquisition and retention
- **Strategy**: Playbook and scheme implementation
- **Chemistry**: Team cohesion and morale effects
- **Performance**: Win/loss prediction and analysis

### League Simulation
- **Scheduling**: Season and playoff scheduling
- **Competition**: Inter-team competition simulation
- **Rules**: NFL rule enforcement and compliance
- **History**: Multi-season continuity and records

## 🏃‍♂️ Advanced Realism Enhancements

### 1. Body Position State System (Leverage & Tackle Modeling)

#### Overview
The engine implements a finite state machine (FSM) for player **Body Positions** to enhance tackle realism. Each player on the field has a `body_position` state that evolves during a play, influencing leverage, momentum, and collision outcomes.

#### Body Position States
- **Upright Running**: Normal running posture (high center of gravity, full speed)
- **Crouched (Lowered Shoulders)**: Lowers center of gravity and pad level
- **Diving**: Horizontal or head-first lunge (high forward momentum, low center of gravity)
- **Stumbling (One-Hand Braced)**: Occurs when hit but not downed
- **Spinning**: Player performing a spin move (momentum vector rapidly changing)
- **Wrapped-Up**: Player in grasp of tackler but not yet down
- **Dragged**: Ballcarrier being dragged by tackler while moving forward
- **Airborne (Leaping)**: Player off the ground (extremely vulnerable)
- **Sliding**: Feet-first or forearm-first slide (play ending)
- **Bracing for Impact**: Player tucks head/arms, planting feet before hit

#### State Transitions & Biomechanical Modifiers
Each state has defined triggers and carries biomechanical modifiers:
- `cog_height_factor`: Center of gravity height multiplier
- `momentum_multiplier`: Momentum preservation factor
- `contact_area`: Contact surface area profile
- `stability_rating`: Balance and stability factor

#### Leverage & Collision Outcomes
The tackle engine uses both players' states to compute leverage:
- **Lower vs Higher**: Defender gains leverage bonus against upright ballcarrier
- **State Combinations**: Specific state pairings influence outcomes
- **Contact Area Modeling**: Different body parts targeted based on states

#### Implementation
```python
# /engine/onfield/physics/body_state.py
class BodyPositionState:
    def __init__(self, state_type: str):
        self.state_type = state_type
        self.cog_height_factor = self.get_cog_factor()
        self.momentum_multiplier = self.get_momentum_factor()
        self.contact_area = self.get_contact_profile()
        self.stability_rating = self.get_stability_factor()
    
    def get_leverage_modifier(self, opponent_state: 'BodyPositionState') -> float:
        # Calculate leverage advantage based on relative positions
        pass
```

### 2. Field Position Awareness (Sideline vs. Open Field)

#### Overview
The simulation accounts for where on the field an interaction occurs, modifying tackle dynamics and AI decisions based on spatial context.

#### Spatial Context Types
- **Sideline Proximity**: Within ~1-2 yards of boundary
- **Open Field**: Center of field, far from boundaries
- **End Zone Awareness**: Near goal line or pylon
- **Hashmarks & Field Landmarks**: Position relative to field markings

#### Context Modifiers
- **Sideline Bonus**: +10% base tackle chance when ballcarrier has limited escape options
- **Open Field Evasiveness**: Increased juke probability and YAC potential
- **End Zone Aggression**: Defenders more aggressive, ballcarriers more likely to dive
- **First Down Awareness**: Influences cutting decisions

#### Implementation
```python
# /engine/onfield/play_context.py
class PlayContext:
    def __init__(self):
        self.distance_to_sideline: float = 0.0
        self.distance_to_endzone: float = 0.0
        self.open_field_one_on_one: bool = False
        self.endzone_in_proximity: bool = False
    
    def apply_spatial_modifiers(self, tackle_probability: float) -> float:
        if self.distance_to_sideline < 1.5:
            tackle_probability *= 1.10  # Sideline bonus
        if self.open_field_one_on_one:
            tackle_probability *= 0.90  # Open field penalty
        return tackle_probability
```

### 3. Advanced Fatigue Modeling (In-Play, Cumulative Fatigue & Recovery)

#### Overview
The engine features a granular fatigue model that accumulates within games and across the season, affecting performance and injury susceptibility.

#### Fatigue Components
- **In-Play Fatigue**: Accumulates during drives and high-exertion actions
- **Collision Fatigue**: Each hit taken or delivered increases fatigue
- **High-Exertion Moves**: Sprinting, pass rushing, sharp cuts add fatigue
- **Environmental Factors**: Weather and altitude amplify fatigue gain

#### Fatigue Effects
- **Performance Reduction**: Speed, acceleration, and reaction time decrease
- **Injury Susceptibility**: Exhausted players more likely to get hurt
- **Recovery During Game**: Sideline recovery between plays
- **Post-Game Fatigue**: Carries into next week with recovery periods

#### Cumulative Fatigue
- **Season Fatigue**: Accumulates if player overused week after week
- **Late-Season Degradation**: Performance dips for heavily utilized players
- **Recovery Planning**: Training staff can influence recovery rates
- **Offseason Recovery**: All fatigue resets during offseason

#### Implementation
```python
# /engine/onfield/fatigue_model.py
class FatigueModel:
    def __init__(self):
        self.current_fatigue: float = 0.0  # 0.0 = fresh, 1.0 = exhausted
        self.cumulative_fatigue: float = 0.0
        self.recovery_rate: float = 0.12  # Base daily recovery
    
    def calc_play_fatigue(self, player, collision, outcome) -> float:
        base_fatigue = 0.05  # Base fatigue per play
        collision_bonus = collision.force * 0.1 if collision else 0.0
        exertion_bonus = self.get_exertion_bonus(player.actions)
        return base_fatigue + collision_bonus + exertion_bonus
    
    def apply_fatigue_effects(self, player) -> None:
        # Reduce attributes based on fatigue level
        fatigue_factor = 1.0 - self.current_fatigue
        player.speed *= fatigue_factor
        player.acceleration *= fatigue_factor
        player.reaction_time *= (1.0 + self.current_fatigue * 0.5)
```

### 4. Context-Aware Injury Risk Calculation

#### Overview
Injuries are determined by a contact dynamics model rather than random rolls, evaluating every significant collision based on multiple biomechanical factors.

#### Injury Risk Factors
- **Collision Force & Momentum**: Mass × velocity calculations
- **Leverage Mismatch**: Relative body positions and vulnerability
- **Angle of Impact**: Head-on, side, or behind impacts
- **Accumulated Fatigue**: Tired players less coordinated
- **Player Durability & History**: Baseline resilience and injury patterns

#### Impact Classification
- **Glancing Blow**: Low force, partial hit (very low injury chance)
- **Square-Up Hit**: Solid form tackle (moderate injury chance)
- **High-Speed Collision**: Both players at high speed (high injury probability)
- **Whiplash/Low-Leverage Hit**: Violent rotation or awkward positioning
- **Crush/Pile-up**: Multiple-player collision
- **Non-Contact Stress**: Sudden movement or cut injuries

#### Injury Outcomes
```python
# /engine/onfield/injury_model.py
class InjuryModel:
    def check_injury(self, player, opponent, collision) -> Optional[InjuryEvent]:
        base_risk = self.calculate_base_risk(collision)
        leverage_modifier = self.get_leverage_risk(collision)
        fatigue_modifier = 1.0 + (player.fatigue_current * 0.2)
        durability_modifier = player.durability / 100.0
        
        final_risk = base_risk * leverage_modifier * fatigue_modifier / durability_modifier
        
        if random.random() < final_risk:
            return self.generate_injury_event(player, collision)
        return None
```

## 🤖 AI System Specifications

### GM AI Archetypes
1. **Analytical GM** - Data-driven decision making
2. **Risk-Taker GM** - Aggressive player acquisition
3. **Conservative GM** - Safe, steady team building
4. **Rebuilder GM** - Long-term development focus
5. **Win-Now GM** - Short-term championship focus

### AI Decision Making
- **Scouting**: Player evaluation and assessment
- **Trading**: Negotiation and deal structuring
- **Drafting**: Draft strategy and player selection
- **Free Agency**: Contract negotiation and bidding
- **Roster Management**: Depth chart and rotation decisions

## 📊 Enhanced Data Models

### Player Data Structure
```json
{
  "player_id": "string",
  "name": "string",
  "position": "string",
  "attributes": {
    "physical": {},
    "mental": {},
    "skills": {}
  },
  "personality": {
    "archetype": "string",
    "traits": []
  },
  "relationships": [],
  "contract": {},
  "performance_history": [],
  "body_position": {
    "current_state": "string",
    "last_state": "string",
    "state_duration": "float"
  },
  "fatigue": {
    "current": "float",
    "cumulative": "float",
    "recovery_rate": "float"
  },
  "injury_history": [
    {
      "year": "integer",
      "week": "integer",
      "type": "string",
      "severity": "string",
      "games_missed": "integer",
      "cause": "string"
    }
  ],
  "injury_risk_curve": "float"
}
```

### Team Data Structure
```json
{
  "team_id": "string",
  "name": "string",
  "roster": [],
  "depth_chart": {},
  "playbook": {},
  "chemistry": {},
  "performance_metrics": {},
  "training_staff": {
    "quality": "integer",
    "recovery_bonus": "float"
  }
}
```

### League Data Structure
```json
{
  "league_id": "string",
  "teams": [],
  "schedule": {},
  "standings": {},
  "rules": {},
  "history": {},
  "physics_config": {
    "body_state_modifiers": {},
    "fatigue_rates": {},
    "injury_probabilities": {}
  }
}
```

## 🔌 API Specifications

### Core Endpoints
- `GET /api/players` - Retrieve player data
- `POST /api/players` - Create new player
- `PUT /api/players/{id}` - Update player data
- `DELETE /api/players/{id}` - Remove player

- `GET /api/teams` - Retrieve team data
- `POST /api/teams` - Create new team
- `PUT /api/teams/{id}` - Update team data

- `GET /api/league` - Retrieve league data
- `POST /api/simulation/advance` - Advance simulation
- `GET /api/simulation/state` - Get current state

### Enhanced Simulation Endpoints
- `POST /api/simulation/tackle` - Resolve tackle with body position states
- `GET /api/simulation/fatigue/{player_id}` - Get player fatigue status
- `POST /api/simulation/injury-check` - Check for injuries based on collision
- `GET /api/simulation/field-context` - Get spatial awareness data

### WebSocket Events
- `simulation.tick` - Simulation update
- `player.update` - Player data change
- `team.update` - Team data change
- `league.update` - League data change
- `body_state.change` - Player body position state change
- `fatigue.update` - Player fatigue level update
- `injury.event` - Injury occurrence event

## 🔒 Security Requirements

### Data Protection
- **Encryption**: All data encrypted in transit and at rest
- **Authentication**: Secure user authentication system
- **Authorization**: Role-based access control
- **Audit Trail**: Complete action logging and tracking

### Privacy Compliance
- **GDPR**: European data protection compliance
- **CCPA**: California privacy law compliance
- **Data Retention**: Configurable data retention policies

## 🧪 Testing Strategy

### Unit Testing
- **Coverage Target**: 90% code coverage
- **Framework**: JUnit 5
- **Mocking**: Mockito for external dependencies

### Integration Testing
- **API Testing**: REST API endpoint validation
- **Database Testing**: Data persistence verification
- **Performance Testing**: Load and stress testing

### Simulation Testing
- **Accuracy Testing**: Historical data validation
- **Balance Testing**: Game balance verification
- **Edge Case Testing**: Unusual scenario handling
- **Physics Testing**: Body state and collision validation
- **Fatigue Testing**: Multi-game fatigue accumulation
- **Injury Testing**: Injury probability and outcome validation

## 📈 Monitoring and Logging

### Performance Monitoring
- **Metrics**: Response time, throughput, error rates
- **Alerts**: Automated alerting for performance issues
- **Dashboards**: Real-time performance visualization

### Enhanced Simulation Monitoring
- **Physics Metrics**: Body state transition frequency, collision force distribution
- **Fatigue Tracking**: Average fatigue levels, recovery rates
- **Injury Analytics**: Injury frequency by type, player, and situation

### Logging Standards
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Structured Logging**: JSON format for machine readability
- **Log Aggregation**: Centralized log collection and analysis

## 🚀 Deployment Strategy

### Development Environment
- **Local Development**: Docker containerization
- **CI/CD**: Automated testing and deployment
- **Version Control**: Git-based workflow

### Production Environment
- **Container Orchestration**: Kubernetes deployment
- **Load Balancing**: High availability configuration
- **Backup Strategy**: Automated backup and recovery

## 📚 Related Documents

- `viridian_engine_design_spec.md` - High-level design overview
- `USE Implementation.md` - Implementation details
- `performance_optimization_strategy.md` - Performance guidelines
- `testing_and_QA_framework.md` - Testing procedures
- `physics_engine_spec.md` - Detailed physics modeling specification
- `fatigue_modeling_spec.md` - Fatigue system detailed specification
- `injury_risk_spec.md` - Injury calculation detailed specification

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | [Previous Date] | Initial specification |
| 2.0 | [Current Date] | Added body position states, field awareness, fatigue modeling, and injury risk calculation |

---

**Next Review Date**: [Date + 30 days]
**Approved By**: [Technical Lead]
**Distribution**: Development Team, QA Team, Project Management
