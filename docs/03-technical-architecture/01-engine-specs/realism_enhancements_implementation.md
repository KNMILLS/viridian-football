# USE Engine Realism Enhancements Implementation Guide
====================================================

## 📋 Document Information
- **Document Type**: Implementation Specification
- **Component**: USE Engine Realism Enhancements
- **Version**: 1.0
- **Last Updated**: [Current Date]
- **Status**: Implementation Ready

## 🎯 Overview

This document provides detailed implementation specifications for the four major realism enhancements to the Unified Simulation Engine (USE):

1. **Body Position State System** - Finite state machine for player positioning and leverage
2. **Field Position Awareness** - Spatial context modeling for tackle dynamics
3. **Advanced Fatigue Modeling** - Multi-level fatigue accumulation and recovery
4. **Context-Aware Injury Risk** - Biomechanical injury probability calculation

## 🏗️ Architecture Integration

### Module Structure
```
/engine/
├── onfield/
│   ├── physics/
│   │   ├── body_state.py          # Body position FSM
│   │   ├── collision_model.py     # Enhanced collision detection
│   │   └── leverage_calculator.py # Leverage and momentum calculations
│   ├── fatigue/
│   │   ├── fatigue_model.py       # Fatigue accumulation and effects
│   │   └── recovery_system.py     # Recovery rates and planning
│   ├── injury/
│   │   ├── injury_model.py        # Injury risk calculation
│   │   └── injury_types.py        # Injury classification and outcomes
│   ├── spatial/
│   │   ├── field_context.py       # Field position awareness
│   │   └── spatial_modifiers.py   # Context-based modifiers
│   └── tackle_model.py            # Enhanced tackle resolution
├── persistence/
│   ├── player_state.py            # Extended player state persistence
│   └── injury_history.py          # Injury tracking and history
└── narrative/
    ├── physics_narrative.py       # Body state and collision narrative
    └── injury_narrative.py        # Injury event narrative generation
```

## 🏃‍♂️ 1. Body Position State System

### Core Implementation

#### Body Position State Machine
```python
# /engine/onfield/physics/body_state.py
from enum import Enum
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

class BodyPosition(Enum):
    UPRIGHT_RUNNING = "upright_running"
    CROUCHED = "crouched"
    DIVING = "diving"
    STUMBLING = "stumbling"
    SPINNING = "spinning"
    WRAPPED_UP = "wrapped_up"
    DRAGGED = "dragged"
    AIRBORNE = "airborne"
    SLIDING = "sliding"
    BRACING = "bracing"

@dataclass
class BiomechanicalModifiers:
    cog_height_factor: float      # Center of gravity height (0.0-1.0)
    momentum_multiplier: float    # Momentum preservation (0.0-2.0)
    contact_area: float          # Contact surface area (0.0-1.0)
    stability_rating: float      # Balance and stability (0.0-1.0)
    speed_modifier: float        # Speed multiplier (0.0-1.0)
    agility_modifier: float      # Agility multiplier (0.0-1.0)

class BodyPositionState:
    def __init__(self, position: BodyPosition):
        self.position = position
        self.modifiers = self._get_modifiers(position)
        self.duration = 0.0  # Time in current state
        self.transition_reason = ""
    
    def _get_modifiers(self, position: BodyPosition) -> BiomechanicalModifiers:
        """Get biomechanical modifiers for each body position state."""
        modifiers = {
            BodyPosition.UPRIGHT_RUNNING: BiomechanicalModifiers(
                cog_height_factor=1.0, momentum_multiplier=1.0,
                contact_area=0.8, stability_rating=0.9, speed_modifier=1.0, agility_modifier=1.0
            ),
            BodyPosition.CROUCHED: BiomechanicalModifiers(
                cog_height_factor=0.7, momentum_multiplier=1.2,
                contact_area=0.9, stability_rating=0.95, speed_modifier=0.9, agility_modifier=0.7
            ),
            BodyPosition.DIVING: BiomechanicalModifiers(
                cog_height_factor=0.3, momentum_multiplier=1.5,
                contact_area=0.4, stability_rating=0.2, speed_modifier=0.6, agility_modifier=0.1
            ),
            BodyPosition.STUMBLING: BiomechanicalModifiers(
                cog_height_factor=0.5, momentum_multiplier=0.6,
                contact_area=0.6, stability_rating=0.3, speed_modifier=0.4, agility_modifier=0.2
            ),
            BodyPosition.SPINNING: BiomechanicalModifiers(
                cog_height_factor=0.8, momentum_multiplier=0.8,
                contact_area=0.5, stability_rating=0.4, speed_modifier=0.7, agility_modifier=0.6
            ),
            BodyPosition.WRAPPED_UP: BiomechanicalModifiers(
                cog_height_factor=0.9, momentum_multiplier=0.3,
                contact_area=1.0, stability_rating=0.6, speed_modifier=0.2, agility_modifier=0.1
            ),
            BodyPosition.DRAGGED: BiomechanicalModifiers(
                cog_height_factor=0.6, momentum_multiplier=0.4,
                contact_area=0.8, stability_rating=0.5, speed_modifier=0.3, agility_modifier=0.2
            ),
            BodyPosition.AIRBORNE: BiomechanicalModifiers(
                cog_height_factor=1.2, momentum_multiplier=0.9,
                contact_area=0.3, stability_rating=0.1, speed_modifier=0.5, agility_modifier=0.1
            ),
            BodyPosition.SLIDING: BiomechanicalModifiers(
                cog_height_factor=0.2, momentum_multiplier=0.2,
                contact_area=0.7, stability_rating=0.8, speed_modifier=0.1, agility_modifier=0.1
            ),
            BodyPosition.BRACING: BiomechanicalModifiers(
                cog_height_factor=0.8, momentum_multiplier=0.7,
                contact_area=0.9, stability_rating=0.9, speed_modifier=0.3, agility_modifier=0.2
            )
        }
        return modifiers[position]
    
    def get_leverage_modifier(self, opponent_state: 'BodyPositionState') -> float:
        """Calculate leverage advantage based on relative body positions."""
        # Lower center of gravity generally provides leverage advantage
        cog_advantage = opponent_state.modifiers.cog_height_factor - self.modifiers.cog_height_factor
        
        # Stability also affects leverage
        stability_advantage = self.modifiers.stability_rating - opponent_state.modifiers.stability_rating
        
        # Contact area affects tackle effectiveness
        contact_advantage = self.modifiers.contact_area - opponent_state.modifiers.contact_area
        
        # Combine factors with weights
        leverage = (cog_advantage * 0.4 + stability_advantage * 0.3 + contact_advantage * 0.3)
        
        # Normalize to reasonable range
        return max(0.5, min(2.0, 1.0 + leverage))
    
    def can_transition_to(self, new_position: BodyPosition, context: Dict) -> bool:
        """Check if transition to new position is valid given current state and context."""
        transition_rules = {
            BodyPosition.UPRIGHT_RUNNING: [BodyPosition.CROUCHED, BodyPosition.DIVING, BodyPosition.SPINNING, BodyPosition.STUMBLING],
            BodyPosition.CROUCHED: [BodyPosition.UPRIGHT_RUNNING, BodyPosition.DIVING, BodyPosition.STUMBLING],
            BodyPosition.DIVING: [BodyPosition.STUMBLING, BodyPosition.WRAPPED_UP, BodyPosition.DOWN],
            BodyPosition.STUMBLING: [BodyPosition.UPRIGHT_RUNNING, BodyPosition.DOWN, BodyPosition.WRAPPED_UP],
            BodyPosition.SPINNING: [BodyPosition.UPRIGHT_RUNNING, BodyPosition.STUMBLING, BodyPosition.WRAPPED_UP],
            BodyPosition.WRAPPED_UP: [BodyPosition.DRAGGED, BodyPosition.DOWN],
            BodyPosition.DRAGGED: [BodyPosition.DOWN, BodyPosition.UPRIGHT_RUNNING],
            BodyPosition.AIRBORNE: [BodyPosition.STUMBLING, BodyPosition.DOWN],
            BodyPosition.SLIDING: [BodyPosition.DOWN],  # Sliding always ends play
            BodyPosition.BRACING: [BodyPosition.WRAPPED_UP, BodyPosition.STUMBLING, BodyPosition.DOWN]
        }
        
        return new_position in transition_rules.get(self.position, [])
```

#### State Transition Manager
```python
# /engine/onfield/physics/state_transitions.py
class StateTransitionManager:
    def __init__(self):
        self.transition_triggers = self._initialize_triggers()
    
    def _initialize_triggers(self) -> Dict:
        """Initialize state transition triggers and conditions."""
        return {
            "tackle_initiated": {
                "from": [BodyPosition.UPRIGHT_RUNNING, BodyPosition.CROUCHED],
                "to": BodyPosition.BRACING,
                "condition": lambda player, context: context.get("tackle_imminent", False)
            },
            "contact_made": {
                "from": [BodyPosition.UPRIGHT_RUNNING, BodyPosition.CROUCHED, BodyPosition.BRACING],
                "to": BodyPosition.WRAPPED_UP,
                "condition": lambda player, context: context.get("solid_contact", False)
            },
            "balance_lost": {
                "from": [BodyPosition.UPRIGHT_RUNNING, BodyPosition.CROUCHED, BodyPosition.SPINNING],
                "to": BodyPosition.STUMBLING,
                "condition": lambda player, context: context.get("balance_disrupted", False)
            },
            "dive_attempt": {
                "from": [BodyPosition.UPRIGHT_RUNNING, BodyPosition.CROUCHED],
                "to": BodyPosition.DIVING,
                "condition": lambda player, context: context.get("diving_attempt", False)
            },
            "spin_move": {
                "from": [BodyPosition.UPRIGHT_RUNNING],
                "to": BodyPosition.SPINNING,
                "condition": lambda player, context: context.get("spin_attempt", False)
            }
        }
    
    def evaluate_transitions(self, player, current_state: BodyPositionState, context: Dict) -> Optional[BodyPosition]:
        """Evaluate possible state transitions based on current context."""
        for trigger_name, trigger_config in self.transition_triggers.items():
            if (current_state.position in trigger_config["from"] and 
                trigger_config["condition"](player, context)):
                return trigger_config["to"]
        return None
```

## 🗺️ 2. Field Position Awareness

### Spatial Context Implementation

#### Field Context Calculator
```python
# /engine/onfield/spatial/field_context.py
from dataclasses import dataclass
from typing import Tuple, Dict

@dataclass
class FieldPosition:
    x: float  # Distance from left sideline (0-53.33 yards)
    y: float  # Distance from own endzone (0-100 yards)
    team_side: str  # "offense" or "defense"

@dataclass
class SpatialContext:
    distance_to_sideline: float
    distance_to_endzone: float
    distance_to_first_down: float
    open_field_one_on_one: bool
    endzone_in_proximity: bool
    sideline_in_proximity: bool
    hashmark_proximity: bool
    spatial_modifiers: Dict[str, float]

class FieldContextCalculator:
    def __init__(self):
        self.field_width = 53.33  # NFL field width in yards
        self.field_length = 100   # NFL field length in yards
        self.sideline_threshold = 2.0  # Yards from sideline to trigger proximity
        self.endzone_threshold = 5.0   # Yards from endzone to trigger proximity
    
    def calculate_spatial_context(self, position: FieldPosition, 
                                down: int, distance: int, 
                                defenders_nearby: int) -> SpatialContext:
        """Calculate spatial context for a player position."""
        
        # Calculate distances
        distance_to_sideline = min(position.x, self.field_width - position.x)
        distance_to_endzone = position.y if position.team_side == "offense" else (self.field_length - position.y)
        distance_to_first_down = distance
        
        # Determine context flags
        sideline_in_proximity = distance_to_sideline < self.sideline_threshold
        endzone_in_proximity = distance_to_endzone < self.endzone_threshold
        open_field_one_on_one = defenders_nearby <= 1 and distance_to_sideline > 5.0
        hashmark_proximity = abs(position.x - self.field_width / 2) < 3.0
        
        # Calculate spatial modifiers
        spatial_modifiers = self._calculate_modifiers(
            sideline_in_proximity, endzone_in_proximity, 
            open_field_one_on_one, down, distance
        )
        
        return SpatialContext(
            distance_to_sideline=distance_to_sideline,
            distance_to_endzone=distance_to_endzone,
            distance_to_first_down=distance_to_first_down,
            open_field_one_on_one=open_field_one_on_one,
            endzone_in_proximity=endzone_in_proximity,
            sideline_in_proximity=sideline_in_proximity,
            hashmark_proximity=hashmark_proximity,
            spatial_modifiers=spatial_modifiers
        )
    
    def _calculate_modifiers(self, sideline_prox: bool, endzone_prox: bool,
                           open_field: bool, down: int, distance: int) -> Dict[str, float]:
        """Calculate spatial context modifiers for tackle and movement decisions."""
        modifiers = {
            "tackle_success_bonus": 1.0,
            "break_tackle_chance": 1.0,
            "juke_probability": 1.0,
            "yac_potential": 1.0,
            "aggression_modifier": 1.0
        }
        
        # Sideline proximity effects
        if sideline_prox:
            modifiers["tackle_success_bonus"] *= 1.10  # +10% tackle success
            modifiers["break_tackle_chance"] *= 0.85   # -15% break tackle chance
            modifiers["juke_probability"] *= 0.70      # -30% juke probability
        
        # Open field effects
        if open_field:
            modifiers["break_tackle_chance"] *= 1.20   # +20% break tackle chance
            modifiers["juke_probability"] *= 1.30      # +30% juke probability
            modifiers["yac_potential"] *= 1.25         # +25% YAC potential
        
        # Endzone proximity effects
        if endzone_prox:
            modifiers["aggression_modifier"] *= 1.15   # +15% aggression
            modifiers["tackle_success_bonus"] *= 1.05  # +5% tackle success
        
        # Down and distance effects
        if down == 4 and distance <= 2:
            modifiers["aggression_modifier"] *= 1.20   # +20% aggression on 4th and short
        
        return modifiers
```

## 💪 3. Advanced Fatigue Modeling

### Fatigue System Implementation

#### Fatigue Model
```python
# /engine/onfield/fatigue/fatigue_model.py
from dataclasses import dataclass
from typing import Dict, List, Optional
import math

@dataclass
class FatigueState:
    current_fatigue: float = 0.0      # 0.0 = fresh, 1.0 = exhausted
    cumulative_fatigue: float = 0.0   # Season-long fatigue accumulation
    recovery_rate: float = 0.12       # Base daily recovery rate
    last_play_fatigue: float = 0.0    # Fatigue from last play
    consecutive_plays: int = 0        # Plays without rest
    drive_fatigue: float = 0.0        # Fatigue within current drive

class FatigueModel:
    def __init__(self):
        self.base_fatigue_per_play = 0.05
        self.collision_fatigue_multiplier = 0.1
        self.exertion_fatigue_multiplier = 0.15
        self.consecutive_play_penalty = 0.02
        self.drive_fatigue_multiplier = 0.1
        self.recovery_per_minute = 0.05
        self.max_fatigue = 1.0
    
    def calculate_play_fatigue(self, player, collision: Optional[Dict], 
                             outcome: str, actions: List[str]) -> float:
        """Calculate fatigue gained from a single play."""
        
        # Base fatigue
        fatigue = self.base_fatigue_per_play
        
        # Collision fatigue
        if collision:
            collision_force = collision.get("force", 0.0)
            fatigue += collision_force * self.collision_fatigue_multiplier
        
        # Exertion fatigue from actions
        exertion_bonus = self._calculate_exertion_fatigue(actions)
        fatigue += exertion_bonus
        
        # Consecutive play penalty
        if player.fatigue_state.consecutive_plays > 0:
            fatigue += (player.fatigue_state.consecutive_plays * self.consecutive_play_penalty)
        
        # Drive fatigue
        fatigue += player.fatigue_state.drive_fatigue * self.drive_fatigue_multiplier
        
        # Environmental modifiers
        fatigue *= self._get_environmental_modifier(player.game_context)
        
        return min(fatigue, self.max_fatigue - player.fatigue_state.current_fatigue)
    
    def _calculate_exertion_fatigue(self, actions: List[str]) -> float:
        """Calculate fatigue from high-exertion actions."""
        exertion_values = {
            "sprint": 0.08,
            "sharp_cut": 0.06,
            "spin_move": 0.05,
            "jump": 0.04,
            "pass_rush": 0.07,
            "block_shed": 0.05,
            "tackle_attempt": 0.06,
            "break_tackle": 0.08
        }
        
        total_exertion = 0.0
        for action in actions:
            total_exertion += exertion_values.get(action, 0.0)
        
        return total_exertion * self.exertion_fatigue_multiplier
    
    def _get_environmental_modifier(self, game_context: Dict) -> float:
        """Get environmental fatigue modifier."""
        modifier = 1.0
        
        # Weather effects
        if game_context.get("temperature", 70) > 85:
            modifier *= 1.2  # Hot weather increases fatigue
        elif game_context.get("temperature", 70) < 40:
            modifier *= 1.1  # Cold weather slightly increases fatigue
        
        # Altitude effects
        altitude = game_context.get("altitude", 0)
        if altitude > 4000:  # High altitude
            modifier *= 1.15
        
        # Humidity effects
        humidity = game_context.get("humidity", 50)
        if humidity > 70:
            modifier *= 1.1
        
        return modifier
    
    def apply_fatigue_effects(self, player) -> None:
        """Apply fatigue effects to player attributes."""
        fatigue_factor = 1.0 - player.fatigue_state.current_fatigue
        
        # Physical attributes affected by fatigue
        player.speed *= fatigue_factor
        player.acceleration *= fatigue_factor
        player.strength *= (0.8 + 0.2 * fatigue_factor)  # Strength less affected
        player.agility *= fatigue_factor
        
        # Mental attributes affected by fatigue
        player.reaction_time *= (1.0 + player.fatigue_state.current_fatigue * 0.5)
        player.decision_making *= (0.9 + 0.1 * fatigue_factor)
        
        # Injury susceptibility increases with fatigue
        player.injury_risk_multiplier = 1.0 + (player.fatigue_state.current_fatigue * 0.3)
    
    def update_fatigue_state(self, player, play_fatigue: float, 
                           on_sideline: bool = False) -> None:
        """Update player's fatigue state after a play."""
        
        # Add play fatigue
        player.fatigue_state.current_fatigue += play_fatigue
        player.fatigue_state.last_play_fatigue = play_fatigue
        
        # Update consecutive plays
        if on_sideline:
            player.fatigue_state.consecutive_plays = 0
            player.fatigue_state.drive_fatigue = 0.0
        else:
            player.fatigue_state.consecutive_plays += 1
            player.fatigue_state.drive_fatigue += play_fatigue
        
        # Cap fatigue at maximum
        player.fatigue_state.current_fatigue = min(
            player.fatigue_state.current_fatigue, self.max_fatigue
        )
```

#### Recovery System
```python
# /engine/onfield/fatigue/recovery_system.py
class RecoverySystem:
    def __init__(self):
        self.base_recovery_rate = 0.12  # Base daily recovery
        self.sideline_recovery_rate = 0.05  # Recovery per minute on sideline
        self.timeout_recovery_bonus = 0.1  # Recovery bonus during timeouts
        self.quarter_break_bonus = 0.15   # Recovery bonus during quarter breaks
        self.halftime_recovery_bonus = 0.25  # Recovery bonus during halftime
    
    def calculate_sideline_recovery(self, player, minutes_on_sideline: float) -> float:
        """Calculate recovery while player is on sideline."""
        base_recovery = minutes_on_sideline * self.sideline_recovery_rate
        
        # Training staff quality affects recovery
        team_training_quality = player.team.training_staff.get("quality", 50) / 100.0
        training_bonus = base_recovery * (team_training_quality - 0.5) * 0.2
        
        return base_recovery + training_bonus
    
    def calculate_post_game_recovery(self, player, days_until_next_game: int) -> float:
        """Calculate recovery between games."""
        if days_until_next_game <= 0:
            return 0.0
        
        # Exponential recovery model
        recovery_rate = self.base_recovery_rate
        
        # Training staff affects recovery rate
        team_training_quality = player.team.training_staff.get("quality", 50) / 100.0
        recovery_rate *= (0.8 + 0.4 * team_training_quality)
        
        # Calculate recovery over days
        total_recovery = 0.0
        remaining_fatigue = player.fatigue_state.current_fatigue
        
        for day in range(days_until_next_game):
            daily_recovery = remaining_fatigue * recovery_rate
            total_recovery += daily_recovery
            remaining_fatigue -= daily_recovery
            
            if remaining_fatigue <= 0:
                break
        
        return total_recovery
    
    def update_cumulative_fatigue(self, player) -> None:
        """Update cumulative fatigue after a game."""
        # Add portion of current fatigue to cumulative
        fatigue_carryover = player.fatigue_state.current_fatigue * 0.3
        player.fatigue_state.cumulative_fatigue += fatigue_carryover
        
        # Cap cumulative fatigue
        player.fatigue_state.cumulative_fatigue = min(
            player.fatigue_state.cumulative_fatigue, 1.0
        )
```

## 🏥 4. Context-Aware Injury Risk Calculation

### Injury System Implementation

#### Injury Model
```python
# /engine/onfield/injury/injury_model.py
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import random

@dataclass
class CollisionData:
    force: float
    angle: float  # 0-360 degrees
    momentum_differential: float
    body_part_targeted: str
    velocity_differential: float
    mass_differential: float

@dataclass
class InjuryEvent:
    player_id: str
    injury_type: str
    severity: str  # "Minor", "Moderate", "Severe"
    body_part: str
    games_missed: int
    cause: str
    collision_data: Optional[CollisionData] = None

class InjuryModel:
    def __init__(self):
        self.base_injury_rates = {
            "glancing_blow": 0.01,
            "square_up_hit": 0.03,
            "high_speed_collision": 0.08,
            "whiplash_low_leverage": 0.12,
            "crush_pileup": 0.15,
            "non_contact_stress": 0.02
        }
        
        self.injury_types = {
            "concussion": {"min_severity": "Moderate", "recovery_range": (1, 4)},
            "ankle_sprain": {"min_severity": "Minor", "recovery_range": (1, 6)},
            "knee_injury": {"min_severity": "Moderate", "recovery_range": (2, 12)},
            "hamstring_strain": {"min_severity": "Minor", "recovery_range": (1, 4)},
            "shoulder_injury": {"min_severity": "Minor", "recovery_range": (1, 8)},
            "rib_injury": {"min_severity": "Minor", "recovery_range": (1, 6)},
            "turf_toe": {"min_severity": "Minor", "recovery_range": (1, 3)},
            "achilles_tear": {"min_severity": "Severe", "recovery_range": (8, 16)}
        }
    
    def check_injury(self, player, opponent, collision: CollisionData, 
                    context: Dict) -> Optional[InjuryEvent]:
        """Check for injury based on collision and context."""
        
        # Calculate base injury risk
        impact_category = self._classify_impact(collision)
        base_risk = self.base_injury_rates[impact_category]
        
        # Apply modifiers
        leverage_modifier = self._calculate_leverage_risk(collision, player, opponent)
        fatigue_modifier = 1.0 + (player.fatigue_state.current_fatigue * 0.3)
        durability_modifier = player.durability / 100.0
        history_modifier = self._get_injury_history_modifier(player, collision)
        
        # Calculate final risk
        final_risk = (base_risk * leverage_modifier * fatigue_modifier * 
                     history_modifier / durability_modifier)
        
        # Check for injury
        if random.random() < final_risk:
            return self._generate_injury_event(player, collision, impact_category, context)
        
        return None
    
    def _classify_impact(self, collision: CollisionData) -> str:
        """Classify the type of impact based on collision data."""
        force = collision.force
        velocity_diff = collision.velocity_differential
        angle = collision.angle
        
        if force < 0.3:
            return "glancing_blow"
        elif force < 0.6 and velocity_diff < 0.5:
            return "square_up_hit"
        elif force > 0.8 or velocity_diff > 0.8:
            return "high_speed_collision"
        elif angle > 45 and angle < 135:  # Side impact
            return "whiplash_low_leverage"
        elif collision.body_part_targeted in ["head", "neck"]:
            return "whiplash_low_leverage"
        else:
            return "square_up_hit"
    
    def _calculate_leverage_risk(self, collision: CollisionData, 
                               player, opponent) -> float:
        """Calculate injury risk based on leverage and body positions."""
        risk = 1.0
        
        # Body position effects
        if player.body_position.position == BodyPosition.AIRBORNE:
            risk *= 1.5  # Airborne players more vulnerable
        elif player.body_position.position == BodyPosition.STUMBLING:
            risk *= 1.3  # Off-balance players more vulnerable
        
        # Angle effects
        if collision.angle < 30:  # Head-on collision
            risk *= 1.2
        elif collision.angle > 150:  # From behind
            risk *= 1.1
        
        # Body part targeting
        if collision.body_part_targeted in ["knee", "ankle"]:
            risk *= 1.4  # Lower body injuries more likely
        elif collision.body_part_targeted in ["head", "neck"]:
            risk *= 1.6  # Head/neck injuries more severe
        
        return risk
    
    def _get_injury_history_modifier(self, player, collision: CollisionData) -> float:
        """Get injury risk modifier based on player's injury history."""
        modifier = 1.0
        
        # Check for similar previous injuries
        for injury in player.injury_history:
            if (injury.body_part == collision.body_part_targeted and
                injury.severity in ["Moderate", "Severe"]):
                modifier *= 1.2  # 20% increased risk for re-injury
        
        # Age factor
        if player.age > 30:
            modifier *= 1.1  # Older players more injury prone
        
        return modifier
    
    def _generate_injury_event(self, player, collision: CollisionData, 
                             impact_category: str, context: Dict) -> InjuryEvent:
        """Generate a specific injury event based on collision and context."""
        
        # Determine injury type based on impact and body part
        injury_type = self._determine_injury_type(collision, impact_category)
        
        # Determine severity
        severity = self._determine_severity(collision, impact_category)
        
        # Calculate games missed
        games_missed = self._calculate_games_missed(injury_type, severity)
        
        # Generate cause description
        cause = self._generate_cause_description(collision, impact_category, context)
        
        return InjuryEvent(
            player_id=player.id,
            injury_type=injury_type,
            severity=severity,
            body_part=collision.body_part_targeted,
            games_missed=games_missed,
            cause=cause,
            collision_data=collision
        )
    
    def _determine_injury_type(self, collision: CollisionData, 
                             impact_category: str) -> str:
        """Determine specific injury type based on collision data."""
        body_part = collision.body_part_targeted
        
        if body_part == "head" or body_part == "neck":
            return "concussion"
        elif body_part == "ankle":
            return "ankle_sprain"
        elif body_part == "knee":
            return "knee_injury"
        elif body_part == "hamstring":
            return "hamstring_strain"
        elif body_part == "shoulder":
            return "shoulder_injury"
        elif body_part == "ribs":
            return "rib_injury"
        elif body_part == "toe" and impact_category == "non_contact_stress":
            return "turf_toe"
        else:
            # Default based on impact category
            defaults = {
                "high_speed_collision": "concussion",
                "whiplash_low_leverage": "shoulder_injury",
                "crush_pileup": "rib_injury",
                "non_contact_stress": "hamstring_strain"
            }
            return defaults.get(impact_category, "hamstring_strain")
    
    def _determine_severity(self, collision: CollisionData, 
                          impact_category: str) -> str:
        """Determine injury severity based on collision force and type."""
        force = collision.force
        
        if impact_category == "high_speed_collision" and force > 0.9:
            return "Severe"
        elif impact_category in ["whiplash_low_leverage", "crush_pileup"]:
            return "Moderate"
        elif force > 0.7:
            return "Moderate"
        else:
            return "Minor"
    
    def _calculate_games_missed(self, injury_type: str, severity: str) -> int:
        """Calculate games missed based on injury type and severity."""
        base_range = self.injury_types[injury_type]["recovery_range"]
        min_games, max_games = base_range
        
        if severity == "Minor":
            return random.randint(1, min_games)
        elif severity == "Moderate":
            return random.randint(min_games, max_games)
        else:  # Severe
            return random.randint(max_games, max_games + 4)
    
    def _generate_cause_description(self, collision: CollisionData, 
                                  impact_category: str, context: Dict) -> str:
        """Generate a human-readable cause description."""
        causes = {
            "glancing_blow": "glancing contact",
            "square_up_hit": "solid tackle",
            "high_speed_collision": "high-speed collision",
            "whiplash_low_leverage": "awkward tackle angle",
            "crush_pileup": "pile-up collision",
            "non_contact_stress": "non-contact injury"
        }
        
        base_cause = causes.get(impact_category, "contact injury")
        
        if collision.body_part_targeted:
            return f"{base_cause} to {collision.body_part_targeted}"
        else:
            return base_cause
```

## 🔗 Integration with Existing Systems

### Enhanced Tackle Resolution
```python
# /engine/onfield/tackle_model.py
class EnhancedTackleModel:
    def __init__(self, body_state_manager, fatigue_model, injury_model, field_context):
        self.body_state_manager = body_state_manager
        self.fatigue_model = fatigue_model
        self.injury_model = injury_model
        self.field_context = field_context
    
    def resolve_tackle(self, ballcarrier, defender, play_context: Dict) -> Dict:
        """Resolve tackle with all realism enhancements."""
        
        # 1. Get current body positions
        bc_state = ballcarrier.body_position
        def_state = defender.body_position
        
        # 2. Calculate leverage
        leverage_modifier = bc_state.get_leverage_modifier(def_state)
        
        # 3. Get spatial context
        spatial_context = self.field_context.calculate_spatial_context(
            ballcarrier.position, play_context["down"], 
            play_context["distance"], play_context["defenders_nearby"]
        )
        
        # 4. Calculate base tackle probability
        base_tackle_prob = self._calculate_base_tackle_probability(defender, ballcarrier)
        
        # 5. Apply all modifiers
        final_tackle_prob = self._apply_all_modifiers(
            base_tackle_prob, leverage_modifier, spatial_context, 
            defender, ballcarrier
        )
        
        # 6. Determine outcome
        success = random.random() < final_tackle_prob
        
        # 7. Handle collision and injury check
        collision_data = self._analyze_collision(ballcarrier, defender, success)
        injury_event = self.injury_model.check_injury(
            ballcarrier, defender, collision_data, play_context
        )
        
        # 8. Update body states
        self._update_body_states(ballcarrier, defender, success, collision_data)
        
        # 9. Calculate and apply fatigue
        bc_fatigue = self.fatigue_model.calculate_play_fatigue(
            ballcarrier, collision_data, "tackled" if success else "broken_tackle",
            ballcarrier.last_actions
        )
        def_fatigue = self.fatigue_model.calculate_play_fatigue(
            defender, collision_data, "tackle_attempt",
            defender.last_actions
        )
        
        self.fatigue_model.update_fatigue_state(ballcarrier, bc_fatigue)
        self.fatigue_model.update_fatigue_state(defender, def_fatigue)
        
        # 10. Apply fatigue effects
        self.fatigue_model.apply_fatigue_effects(ballcarrier)
        self.fatigue_model.apply_fatigue_effects(defender)
        
        return {
            "success": success,
            "leverage_modifier": leverage_modifier,
            "spatial_context": spatial_context,
            "collision_data": collision_data,
            "injury_event": injury_event,
            "fatigue_gained": {"ballcarrier": bc_fatigue, "defender": def_fatigue}
        }
    
    def _apply_all_modifiers(self, base_prob: float, leverage_mod: float,
                           spatial_context: SpatialContext, defender, ballcarrier) -> float:
        """Apply all modifiers to tackle probability."""
        
        # Leverage modifier
        final_prob = base_prob * leverage_mod
        
        # Spatial context modifiers
        final_prob *= spatial_context.spatial_modifiers["tackle_success_bonus"]
        
        # Fatigue modifiers
        def_fatigue_factor = 1.0 - defender.fatigue_state.current_fatigue
        bc_fatigue_factor = 1.0 + ballcarrier.fatigue_state.current_fatigue * 0.2
        
        final_prob *= def_fatigue_factor
        final_prob /= bc_fatigue_factor
        
        return max(0.01, min(0.99, final_prob))
```

## 📊 Data Persistence

### Enhanced Player State
```python
# /engine/persistence/player_state.py
@dataclass
class EnhancedPlayerState:
    # Existing fields
    player_id: str
    name: str
    position: str
    attributes: Dict
    
    # New realism enhancement fields
    body_position: BodyPositionState
    fatigue_state: FatigueState
    injury_history: List[InjuryEvent]
    injury_risk_curve: float
    last_collision_data: Optional[CollisionData]
    spatial_context_history: List[SpatialContext]
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for persistence."""
        return {
            "player_id": self.player_id,
            "name": self.name,
            "position": self.position,
            "attributes": self.attributes,
            "body_position": {
                "current_state": self.body_position.position.value,
                "last_state": getattr(self.body_position, 'last_position', None),
                "state_duration": self.body_position.duration
            },
            "fatigue": {
                "current": self.fatigue_state.current_fatigue,
                "cumulative": self.fatigue_state.cumulative_fatigue,
                "recovery_rate": self.fatigue_state.recovery_rate
            },
            "injury_history": [
                {
                    "year": injury.year,
                    "week": injury.week,
                    "type": injury.injury_type,
                    "severity": injury.severity,
                    "games_missed": injury.games_missed,
                    "cause": injury.cause
                }
                for injury in self.injury_history
            ],
            "injury_risk_curve": self.injury_risk_curve
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'EnhancedPlayerState':
        """Create from dictionary for loading."""
        return cls(
            player_id=data["player_id"],
            name=data["name"],
            position=data["position"],
            attributes=data["attributes"],
            body_position=BodyPositionState(BodyPosition(data["body_position"]["current_state"])),
            fatigue_state=FatigueState(**data["fatigue"]),
            injury_history=[InjuryEvent(**injury) for injury in data["injury_history"]],
            injury_risk_curve=data["injury_risk_curve"],
            last_collision_data=None,
            spatial_context_history=[]
        )
```

## 🎭 Narrative Integration

### Physics Narrative Generation
```python
# /engine/narrative/physics_narrative.py
class PhysicsNarrativeGenerator:
    def __init__(self):
        self.body_state_descriptions = {
            BodyPosition.UPRIGHT_RUNNING: "running upright",
            BodyPosition.CROUCHED: "lowering his shoulders",
            BodyPosition.DIVING: "diving forward",
            BodyPosition.STUMBLING: "stumbling off balance",
            BodyPosition.SPINNING: "spinning away",
            BodyPosition.WRAPPED_UP: "wrapped up by the defender",
            BodyPosition.DRAGGED: "being dragged by the tackler",
            BodyPosition.AIRBORNE: "leaping through the air",
            BodyPosition.SLIDING: "sliding to the ground",
            BodyPosition.BRACING: "bracing for impact"
        }
    
    def generate_tackle_narrative(self, tackle_result: Dict) -> str:
        """Generate narrative for tackle resolution."""
        
        if tackle_result["success"]:
            return self._generate_successful_tackle_narrative(tackle_result)
        else:
            return self._generate_broken_tackle_narrative(tackle_result)
    
    def _generate_successful_tackle_narrative(self, tackle_result: Dict) -> str:
        """Generate narrative for successful tackle."""
        
        leverage_mod = tackle_result["leverage_modifier"]
        spatial_context = tackle_result["spatial_context"]
        
        if leverage_mod > 1.3:
            leverage_desc = "with perfect leverage"
        elif leverage_mod > 1.1:
            leverage_desc = "with good leverage"
        else:
            leverage_desc = ""
        
        if spatial_context.sideline_in_proximity:
            spatial_desc = " and forces him out of bounds"
        elif spatial_context.endzone_in_proximity:
            spatial_desc = " at the goal line"
        else:
            spatial_desc = ""
        
        return f"makes a solid tackle {leverage_desc}{spatial_desc}"
    
    def generate_injury_narrative(self, injury_event: InjuryEvent) -> str:
        """Generate narrative for injury event."""
        
        severity_desc = {
            "Minor": "appears to be shaken up",
            "Moderate": "is slow to get up",
            "Severe": "stays down on the field"
        }
        
        return f"{injury_event.player_name} {severity_desc[injury_event.severity]} after {injury_event.cause}"
```

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | [Current Date] | Initial implementation specification |

---

**Next Review Date**: [Date + 30 days]
**Approved By**: [Technical Lead]
**Distribution**: Development Team, QA Team, Project Management
