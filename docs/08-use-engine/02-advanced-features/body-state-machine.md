# Body State Machine Specification
**Document ID**: USE-BOD-001  
**Version**: 1.0  
**Last Updated**: 2024-12-19  
**Status**: Active

## Executive Summary

The Body State Machine is a core component of the USE Engine that tracks detailed player positioning, movement, and contact preparation states. This specification defines the canonical body states, transition rules, and leverage calculations that enable realistic tackle success modeling and injury risk assessment.

## 1. State Taxonomy

### 1.1 Canonical Body States

**USE-BOD-002**: The body state machine MUST support the following canonical states:

#### Locomotion States
| State ID | State Name | Description | Entry Conditions | Exit Conditions |
|----------|------------|-------------|------------------|-----------------|
| `BOD-LOC-001` | SPRINTING | High-speed forward movement | velocity > 8.0 m/s, direction = forward | velocity < 6.0 m/s OR direction ≠ forward |
| `BOD-LOC-002` | JOGGING | Moderate-speed movement | 3.0 m/s < velocity < 8.0 m/s | velocity < 2.0 m/s OR velocity > 9.0 m/s |
| `BOD-LOC-003` | BACKPEDAL | Backward movement | velocity > 2.0 m/s, direction = backward | velocity < 1.0 m/s OR direction ≠ backward |
| `BOD-LOC-004` | SHUFFLE | Lateral movement | velocity > 1.0 m/s, direction = lateral | velocity < 0.5 m/s OR direction ≠ lateral |
| `BOD-LOC-005` | PLANT_AND_DRIVE | Explosive directional change | deceleration > 5.0 m/s², direction_change > 45° | deceleration < 2.0 m/s² OR direction_change < 15° |
| `BOD-LOC-006` | STUMBLE_EARLY | Early phase of balance loss | lateral_acceleration > 3.0 m/s², unstable_footing = true | lateral_acceleration < 1.0 m/s² OR stable_footing = true |
| `BOD-LOC-007` | STUMBLE_LATE | Late phase of balance loss | lateral_acceleration > 5.0 m/s², recovery_impossible = true | on_ground = true OR recovery_complete = true |
| `BOD-LOC-008` | BALANCED_RECOVERY | Regaining stability | recovery_attempt = true, lateral_acceleration < 2.0 m/s² | stable_footing = true OR on_ground = true |

#### Orientation States
| State ID | State Name | Description | Entry Conditions | Exit Conditions |
|----------|------------|-------------|------------------|-----------------|
| `BOD-ORI-001` | SQUARE_HIPS | Neutral hip alignment | hip_yaw_angle < 15° | hip_yaw_angle > 20° |
| `BOD-ORI-002` | ANGLED_HIPS | Rotated hip position | 15° < hip_yaw_angle < 45° | hip_yaw_angle < 10° OR hip_yaw_angle > 50° |
| `BOD-ORI-003` | LOWERED_PAD | Reduced pad level for leverage | pad_level < 0.7, pad_level > 0.3 | pad_level > 0.8 OR pad_level < 0.2 |
| `BOD-ORI-004` | UPRIGHT | Vertical torso position | torso_pitch < 10°, torso_roll < 10° | torso_pitch > 15° OR torso_roll > 15° |
| `BOD-ORI-005` | LEANING | Lateral torso tilt | torso_roll > 15°, torso_roll < 45° | torso_roll < 10° OR torso_roll > 50° |
| `BOD-ORI-006` | TWISTING | Torso rotation | hip_yaw_rate > 30°/s | hip_yaw_rate < 20°/s |

#### Contact Preparation States
| State ID | State Name | Description | Entry Conditions | Exit Conditions |
|----------|------------|-------------|------------------|-----------------|
| `BOD-CON-001` | LOWERED_SHOULDER | Shoulder position for contact | shoulder_pad_level < 0.6, contact_imminent = true | shoulder_pad_level > 0.8 OR contact_imminent = false |
| `BOD-CON-002` | WRAP_READY | Arms positioned for tackling | arms_extended = true, wrap_angle < 30° | arms_extended = false OR wrap_angle > 45° |
| `BOD-CON-003` | ARM_EXTENDED | Stiff-arm position | arm_extension > 0.8, stiff_arm_active = true | arm_extension < 0.6 OR stiff_arm_active = false |
| `BOD-CON-004` | TWO_HAND_SECURE | Ball security position | ball_held_two_hands = true, ball_position = "high_and_tight" | ball_held_two_hands = false OR ball_position ≠ "high_and_tight" |
| `BOD-CON-005` | OFF_BALL_HAND_POSTED | Hand on ground for stability | hand_on_ground = true, stability_needed = true | hand_on_ground = false OR stability_needed = false |

#### Aerial/Grounded States
| State ID | State Name | Description | Entry Conditions | Exit Conditions |
|----------|------------|-------------|------------------|-----------------|
| `BOD-AER-001` | JUMPING_ASC | Ascending jump | vertical_velocity > 2.0 m/s, feet_off_ground = true | vertical_velocity < 0.5 m/s |
| `BOD-AER-002` | JUMPING_DESC | Descending jump | vertical_velocity < -1.0 m/s, feet_off_ground = true | feet_on_ground = true |
| `BOD-AER-003` | DIVING_LAYOUT | Horizontal dive | horizontal_velocity > 3.0 m/s, body_horizontal = true | horizontal_velocity < 1.0 m/s |
| `BOD-AER-004` | DIVING_PRONE | Face-first dive | body_horizontal = true, face_down = true | body_horizontal = false |
| `BOD-AER-005` | SLIDING_FEET | Feet-first slide | sliding_motion = true, feet_first = true | sliding_motion = false |
| `BOD-AER-006` | SLIDING_SIDE | Side slide | sliding_motion = true, side_contact = true | sliding_motion = false |
| `BOD-AER-007` | ON_KNEE | Kneeling position | knee_contact = true, upright_torso = true | knee_contact = false |
| `BOD-AER-008` | ON_GROUND_PRONE | Face-down on ground | body_on_ground = true, face_down = true | body_on_ground = false |
| `BOD-AER-009` | ON_GROUND_SUPINE | Face-up on ground | body_on_ground = true, face_up = true | body_on_ground = false |
| `BOD-AER-010` | ROLLING | Rolling motion | angular_velocity > 90°/s, body_on_ground = true | angular_velocity < 30°/s |

#### Ball Control Modifiers
| State ID | State Name | Description | Entry Conditions | Exit Conditions |
|----------|------------|-------------|------------------|-----------------|
| `BOD-BAL-001` | HIGH_AND_TIGHT | Ball held high and close | ball_position = "high_and_tight", ball_secure = true | ball_position ≠ "high_and_tight" OR ball_secure = false |
| `BOD-BAL-002` | AWAY_FROM_BODY | Ball held away from body | ball_position = "away_from_body", ball_secure = false | ball_position ≠ "away_from_body" OR ball_secure = true |
| `BOD-BAL-003` | SWITCH_HANDS | Ball switching between hands | hand_switch_motion = true, ball_in_transit = true | hand_switch_motion = false OR ball_in_transit = false |
| `BOD-BAL-004` | COVER_UP | Ball protected from contact | ball_protected = true, contact_imminent = true | ball_protected = false OR contact_imminent = false |

#### Special Movement States
| State ID | State Name | Description | Entry Conditions | Exit Conditions |
|----------|------------|-------------|------------------|-----------------|
| `BOD-SPC-001` | HURDLE | Jumping over obstacle | vertical_velocity > 1.5 m/s, obstacle_present = true | vertical_velocity < 0.5 m/s OR obstacle_present = false |
| `BOD-SPC-002` | SPIN_START | Beginning spin move | angular_velocity > 180°/s, spin_initiated = true | angular_velocity < 90°/s |
| `BOD-SPC-003` | SPIN_MID | Mid-spin motion | angular_velocity > 270°/s, spin_in_progress = true | angular_velocity < 180°/s |
| `BOD-SPC-004` | SPIN_EXIT | Exiting spin move | angular_velocity < 90°/s, spin_complete = true | angular_velocity < 30°/s |
| `BOD-SPC-005` | CUT_START | Beginning cut move | direction_change > 30°, cut_initiated = true | direction_change < 15° |
| `BOD-SPC-006` | CUT_MID | Mid-cut motion | direction_change > 45°, cut_in_progress = true | direction_change < 30° |
| `BOD-SPC-007` | CUT_EXIT | Exiting cut move | direction_change < 15°, cut_complete = true | direction_change < 5° |

## 2. State Variables and Measurements

### 2.1 Position Variables

**USE-BOD-003**: The body state machine MUST track the following position variables:

#### Torso Orientation
```yaml
torso_pitch_deg: "Torso forward/backward tilt in degrees"
  range: [-90, 90]
  units: "degrees"
  precision: 1.0

torso_roll_deg: "Torso left/right tilt in degrees"
  range: [-90, 90]
  units: "degrees"
  precision: 1.0

torso_yaw_deg: "Torso rotation around vertical axis in degrees"
  range: [0, 360]
  units: "degrees"
  precision: 1.0
```

#### Hip Orientation
```yaml
hip_yaw_angle_deg: "Hip rotation relative to torso in degrees"
  range: [-90, 90]
  units: "degrees"
  precision: 1.0

hip_yaw_rate_deg_s: "Rate of hip rotation in degrees per second"
  range: [-360, 360]
  units: "degrees/second"
  precision: 5.0
```

#### Pad Level
```yaml
pad_level_normalized: "Normalized pad level (0 = ground, 1 = standing)"
  range: [0, 1]
  units: "normalized"
  precision: 0.01

shoulder_pad_level_normalized: "Normalized shoulder pad level"
  range: [0, 1]
  units: "normalized"
  precision: 0.01
```

### 2.2 Movement Variables

**USE-BOD-004**: The body state machine MUST track the following movement variables:

#### Velocity and Acceleration
```yaml
velocity_m_s: "Player velocity in meters per second"
  range: [0, 15]
  units: "meters/second"
  precision: 0.1

lateral_acceleration_m_s2: "Lateral acceleration in m/s²"
  range: [-10, 10]
  units: "meters/second²"
  precision: 0.1

vertical_velocity_m_s: "Vertical velocity in meters per second"
  range: [-5, 5]
  units: "meters/second"
  precision: 0.1

angular_velocity_deg_s: "Angular velocity in degrees per second"
  range: [-720, 720]
  units: "degrees/second"
  precision: 5.0
```

#### Direction and Stability
```yaml
direction_deg: "Movement direction in degrees"
  range: [0, 360]
  units: "degrees"
  precision: 1.0

direction_change_deg: "Change in direction in degrees"
  range: [0, 180]
  units: "degrees"
  precision: 1.0

stance_width_m: "Distance between feet in meters"
  range: [0.2, 1.0]
  units: "meters"
  precision: 0.01

footing_stability_normalized: "Normalized footing stability score"
  range: [0, 1]
  units: "normalized"
  precision: 0.01
```

### 2.3 Contact Variables

**USE-BOD-005**: The body state machine MUST track the following contact variables:

#### Contact Preparation
```yaml
contact_imminent: "Whether contact is imminent"
  type: "boolean"
  default: false

distance_to_target_m: "Distance to nearest target in meters"
  range: [0, 50]
  units: "meters"
  precision: 0.1

approach_angle_deg: "Angle of approach to target in degrees"
  range: [0, 180]
  units: "degrees"
  precision: 1.0

arms_extended: "Whether arms are extended"
  type: "boolean"
  default: false

arm_extension_normalized: "Normalized arm extension (0 = retracted, 1 = fully extended)"
  range: [0, 1]
  units: "normalized"
  precision: 0.01
```

#### Ball Control
```yaml
ball_held_two_hands: "Whether ball is held with two hands"
  type: "boolean"
  default: false

ball_position: "Position of ball relative to body"
  values: ["high_and_tight", "away_from_body", "normal", "protected"]
  default: "normal"

ball_secure: "Whether ball is securely held"
  type: "boolean"
  default: true

hand_on_ground: "Whether hand is in contact with ground"
  type: "boolean"
  default: false
```

## 3. Leverage Index Calculation

### 3.1 Leverage Components

**USE-BOD-006**: The leverage index MUST be calculated using four primary components:

#### Pad Level Normalization
```python
def calculate_pad_norm(tackler_pad_level, ball_carrier_pad_level):
    """Calculate normalized pad level differential"""
    pad_differential = ball_carrier_pad_level - tackler_pad_level
    # Normalize to [0, 1] range
    pad_norm = max(0, min(1, (pad_differential + 0.5) / 1.0))
    return pad_norm
```

#### Hip Alignment
```python
def calculate_yaw_align(tackler_yaw, ball_carrier_yaw):
    """Calculate hip alignment between tackler and ball carrier"""
    yaw_difference = abs(tackler_yaw - ball_carrier_yaw)
    # Convert to alignment score (0 = opposite, 1 = aligned)
    yaw_align = max(0, 1 - (yaw_difference / 90))
    return yaw_align
```

#### Footing Stability
```python
def calculate_foot_stability(stance_width, lateral_force, footing_quality):
    """Calculate footing stability score"""
    # Base stability from stance width
    stance_stability = min(1, stance_width / 0.8)
    
    # Adjust for lateral force
    force_factor = max(0, 1 - (lateral_force / 500))  # 500N threshold
    
    # Combine with footing quality
    foot_stability = stance_stability * force_factor * footing_quality
    return max(0, min(1, foot_stability))
```

#### Approach Angle
```python
def calculate_approach_cos(approach_angle_deg):
    """Calculate approach angle cosine"""
    # Convert to radians and calculate cosine
    approach_rad = math.radians(approach_angle_deg)
    approach_cos = math.cos(approach_rad)
    # Normalize to [0, 1] range
    approach_norm = max(0, min(1, (approach_cos + 1) / 2))
    return approach_norm
```

### 3.2 Composite Leverage Index

**USE-BOD-007**: The final leverage index MUST be calculated as:

```python
def calculate_leverage_index(pad_norm, yaw_align, foot_stability, approach_cos):
    """Calculate composite leverage index"""
    # Default weights from specification
    w1, w2, w3, w4 = 0.3, 0.25, 0.25, 0.2
    
    # Weighted sum of components
    leverage_index = (w1 * pad_norm + 
                     w2 * yaw_align + 
                     w3 * foot_stability + 
                     w4 * approach_cos)
    
    # Ensure bounds
    leverage_index = max(0, min(1, leverage_index))
    
    return leverage_index
```

### 3.3 State-Based Modifiers

**USE-BOD-008**: Body states MUST provide modifiers to the leverage calculation:

```python
def get_state_leverage_modifier(body_state):
    """Get leverage modifier based on body state"""
    state_modifiers = {
        'LOWERED_PAD': 0.15,
        'SQUARE_HIPS': 0.10,
        'WRAP_READY': 0.12,
        'STABLE_FOOTING': 0.10,
        'STUMBLE_EARLY': -0.20,
        'STUMBLE_LATE': -0.40,
        'TWISTING': -0.15,
        'LEANING': -0.10
    }
    
    return state_modifiers.get(body_state, 0.0)
```

## 4. State Transition Rules

### 4.1 Transition Validation

**USE-BOD-009**: All state transitions MUST be validated against:

#### Entry Condition Satisfaction
```python
def validate_entry_conditions(new_state, current_conditions):
    """Validate that entry conditions are met for new state"""
    entry_conditions = get_entry_conditions(new_state)
    
    for condition, threshold in entry_conditions.items():
        current_value = current_conditions.get(condition)
        if current_value is None:
            return False, f"Missing condition: {condition}"
        
        if not evaluate_condition(current_value, threshold):
            return False, f"Condition not met: {condition} = {current_value}"
    
    return True, "All entry conditions satisfied"
```

#### Exit Condition Satisfaction
```python
def validate_exit_conditions(current_state, current_conditions):
    """Validate that exit conditions are met for current state"""
    exit_conditions = get_exit_conditions(current_state)
    
    for condition, threshold in exit_conditions.items():
        current_value = current_conditions.get(condition)
        if current_value is None:
            continue  # Missing condition doesn't force exit
        
        if evaluate_condition(current_value, threshold):
            return True, f"Exit condition met: {condition} = {current_value}"
    
    return False, "No exit conditions met"
```

### 4.2 Transition Execution

**USE-BOD-010**: State transitions MUST execute side effects:

```python
def execute_state_transition(from_state, to_state, conditions):
    """Execute state transition with side effects"""
    # Validate transition
    valid, message = validate_transition(from_state, to_state, conditions)
    if not valid:
        raise InvalidTransitionError(message)
    
    # Execute side effects
    side_effects = get_side_effects(from_state, to_state)
    
    for effect in side_effects:
        if effect == "calculate_leverage_index":
            leverage_index = calculate_leverage_index(
                conditions['pad_norm'],
                conditions['yaw_align'],
                conditions['foot_stability'],
                conditions['approach_cos']
            )
            conditions['leverage_index'] = leverage_index
        
        elif effect == "update_spatial_context":
            spatial_context = calculate_spatial_context(conditions)
            conditions['spatial_context'] = spatial_context
        
        elif effect == "update_fatigue":
            fatigue_increase = calculate_fatigue_increase(to_state, conditions)
            conditions['fatigue_acute'] += fatigue_increase
    
    return to_state, conditions
```

## 5. Performance Requirements

### 5.1 Computational Performance

**USE-BOD-011**: The body state machine MUST meet performance requirements:

```yaml
performance_requirements:
  state_transition_latency:
    target: "≤ 1ms"
    measurement: "Time to complete state transition"
    validation: "95th percentile latency"
  
  leverage_calculation_time:
    target: "≤ 0.5ms"
    measurement: "Time to calculate leverage index"
    validation: "Average calculation time"
  
  memory_usage_per_player:
    target: "≤ 1KB"
    measurement: "Memory used for body state tracking"
    validation: "Peak memory usage"
  
  update_frequency:
    target: "≥ 60Hz"
    measurement: "State machine update rate"
    validation: "Minimum update frequency"
```

### 5.2 Accuracy Requirements

**USE-BOD-012**: The body state machine MUST meet accuracy requirements:

```yaml
accuracy_requirements:
  angle_measurement_precision:
    target: "±1°"
    measurement: "Precision of angle measurements"
    validation: "Standard deviation of repeated measurements"
  
  position_measurement_precision:
    target: "±0.01m"
    measurement: "Precision of position measurements"
    validation: "Standard deviation of repeated measurements"
  
  leverage_index_accuracy:
    target: "±0.05"
    measurement: "Accuracy of leverage index calculation"
    validation: "Correlation with expert assessment"
  
  state_classification_accuracy:
    target: "≥ 95%"
    measurement: "Accuracy of state classification"
    validation: "Percentage of correct state assignments"
```

## 6. Integration with Other Systems

### 6.1 Spatial Awareness Integration

**USE-BOD-013**: The body state machine MUST integrate with spatial awareness:

```python
def integrate_spatial_context(body_state, spatial_context):
    """Integrate spatial context with body state"""
    # Modify leverage calculation based on field position
    if spatial_context['field_zone'] == 'sideline':
        leverage_modifier = 0.15  # Sideline benefit
    elif spatial_context['field_zone'] == 'open_field':
        leverage_modifier = -0.10  # Open field penalty
    else:
        leverage_modifier = 0.0
    
    # Apply modifier to leverage index
    body_state['leverage_index'] += leverage_modifier
    body_state['leverage_index'] = max(0, min(1, body_state['leverage_index']))
    
    return body_state
```

### 6.2 Fatigue Model Integration

**USE-BOD-014**: The body state machine MUST integrate with fatigue model:

```python
def integrate_fatigue_effects(body_state, fatigue_levels):
    """Integrate fatigue effects with body state"""
    acute_fatigue = fatigue_levels['acute']
    cumulative_fatigue = fatigue_levels['cumulative']
    
    # Fatigue affects state transition probabilities
    transition_modifier = 1.0 - (acute_fatigue * 0.3 + cumulative_fatigue * 0.1)
    
    # Fatigue affects leverage calculation
    leverage_modifier = 1.0 - (acute_fatigue * 0.2 + cumulative_fatigue * 0.05)
    
    # Apply modifiers
    body_state['transition_probability'] *= transition_modifier
    body_state['leverage_index'] *= leverage_modifier
    
    return body_state
```

### 6.3 Injury Risk Integration

**USE-BOD-015**: The body state machine MUST integrate with injury risk model:

```python
def integrate_injury_risk(body_state, injury_context):
    """Integrate injury risk factors with body state"""
    # Body state affects injury risk
    if body_state['current_state'] in ['STUMBLE_LATE', 'TWISTING', 'DIVING_PRONE']:
        injury_risk_multiplier = 2.0
    elif body_state['current_state'] in ['STUMBLE_EARLY', 'LEANING']:
        injury_risk_multiplier = 1.5
    else:
        injury_risk_multiplier = 1.0
    
    # Unsafe head position detection
    if body_state['torso_pitch_deg'] < -30:  # Head down
        injury_risk_multiplier *= 1.5
        body_state['unsafe_head_position'] = True
    else:
        body_state['unsafe_head_position'] = False
    
    body_state['injury_risk_multiplier'] = injury_risk_multiplier
    
    return body_state
```

## 7. Validation and Testing

### 7.1 State Transition Validation

**USE-BOD-016**: State transitions MUST be validated against test cases:

#### Test Case 1: Sprinting to Tackle Prep
```python
def test_sprinting_to_tackle_prep():
    """Test transition from sprinting to tackle prep"""
    initial_state = 'SPRINTING'
    conditions = {
        'velocity_m_s': 9.0,
        'distance_to_target_m': 1.5,
        'approach_angle_deg': 10.0,
        'pad_level_normalized': 0.8
    }
    
    expected_state = 'TACKLE_PREP'
    actual_state = transition_body_state(initial_state, conditions)
    
    assert actual_state == expected_state
    assert conditions['leverage_index'] > 0.6  # Good leverage
```

#### Test Case 2: Invalid Transition Prevention
```python
def test_invalid_transition_prevention():
    """Test that invalid transitions are prevented"""
    initial_state = 'SPRINTING'
    conditions = {
        'velocity_m_s': 9.0,
        'distance_to_target_m': 10.0,  # Too far
        'approach_angle_deg': 45.0     # Too wide
    }
    
    with pytest.raises(InvalidTransitionError):
        transition_body_state(initial_state, conditions)
```

### 7.2 Leverage Calculation Validation

**USE-BOD-017**: Leverage calculations MUST be validated against expected results:

#### Test Case 1: Perfect Leverage
```python
def test_perfect_leverage():
    """Test leverage calculation with perfect conditions"""
    conditions = {
        'pad_norm': 1.0,      # Perfect pad level
        'yaw_align': 1.0,     # Perfect alignment
        'foot_stability': 1.0, # Perfect footing
        'approach_cos': 1.0    # Perfect approach
    }
    
    expected_leverage = 1.0
    actual_leverage = calculate_leverage_index(**conditions)
    
    assert abs(actual_leverage - expected_leverage) < 0.001
```

#### Test Case 2: Poor Leverage
```python
def test_poor_leverage():
    """Test leverage calculation with poor conditions"""
    conditions = {
        'pad_norm': 0.0,      # Poor pad level
        'yaw_align': 0.0,     # Poor alignment
        'foot_stability': 0.0, # Poor footing
        'approach_cos': 0.0    # Poor approach
    }
    
    expected_leverage = 0.0
    actual_leverage = calculate_leverage_index(**conditions)
    
    assert abs(actual_leverage - expected_leverage) < 0.001
```

## References

- **【message_idx†source】**: "NFL General Manager Simulation Game Design Doc" - Realism priorities and player-centric design
- **【message_idx†source】**: "Designing a Unique NFL General Manager Simulator" - Player interaction and relationship systems
- **【message_idx†source】**: "A Strategic Framework for In-Game AI General Managers" - Dynamic contextual awareness and archetype-driven AI behavior
- **【message_idx†source】**: "Building a Unique Web-Based NFL General Manager Simulator" - Scalability and microservices architecture

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-19 | Architecture Team | Initial creation |
