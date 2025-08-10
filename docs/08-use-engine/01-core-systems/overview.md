# USE Engine Overview
**Document ID**: USE-OVW-001  
**Version**: 1.0  
**Last Updated**: 2024-12-19  
**Status**: Active

## Executive Summary

The USE (Under-the-Skin Engine) is the core simulation engine for the Viridian Football project, implementing four integrated realism systems that provide unprecedented depth and authenticity in NFL General Manager simulation. The engine combines body state tracking, spatial awareness, fatigue modeling, and injury risk assessment to create a living, dynamic world where every decision has realistic consequences.

## 1. Engine Architecture

### 1.1 Core Systems

The USE Engine consists of four primary systems that work together to create realistic football simulation:

```
Body State Machine → Spatial Awareness → Fatigue Model → Injury Risk Model
```

### 1.2 System Integration

**USE-INT-001**: All four systems MUST integrate seamlessly to provide realistic outcomes:
- Body states influence spatial context calculations
- Spatial context affects fatigue accumulation rates
- Fatigue levels modify injury risk probabilities
- Injury events impact body state transitions

### 1.3 Data Flow

```
Player Input → Body State → Spatial Context → Fatigue Update → Injury Check → Output
```

## 2. Body State Machine

### 2.1 Purpose and Scope

**USE-BOD-001**: The body state machine MUST track detailed player positioning and movement states to enable realistic tackle success modeling and injury risk assessment.

### 2.2 Key Components

#### Locomotion States
- **Sprinting**: High-speed forward movement
- **Jogging**: Moderate-speed movement
- **Backpedal**: Backward movement
- **Shuffle**: Lateral movement
- **Plant-and-Drive**: Explosive directional change
- **Stumble**: Loss of balance (early/late phases)
- **Balanced Recovery**: Regaining stability

#### Orientation States
- **Square Hips**: Neutral hip alignment
- **Angled Hips**: Rotated hip position (± yaw)
- **Lowered Pad**: Reduced pad level for leverage
- **Upright**: Vertical torso position
- **Leaning**: Lateral torso tilt (roll)
- **Twisting**: Torso rotation (yaw-rate)

#### Contact Preparation States
- **Lowered Shoulder**: Shoulder position for contact
- **Wrap Ready**: Arms positioned for tackling
- **Arm Extended**: Stiff-arm position
- **Two-Hand Secure**: Ball security position
- **Off-Ball Hand Posted**: Hand on ground for stability

### 2.3 Leverage Index Calculation

**USE-BOD-002**: The engine MUST compute a leverage index L per tackle attempt using:

```
L = w1*pad_norm + w2*yaw_align + w3*foot_stability + w4*approach_cos
```

Where:
- `pad_norm`: Normalized pad level differential [0,1]
- `yaw_align`: Hip orientation alignment [0,1]
- `foot_stability`: Footing stability score [0,1]
- `approach_cos`: Approach angle cosine [0,1]
- `w1, w2, w3, w4`: Weighting factors (default: 0.3, 0.25, 0.25, 0.2)

### 2.4 State Transition Rules

**USE-BOD-003**: State transitions MUST define:
- **Trigger**: Sensor or animation event
- **Guard**: Measurable thresholds
- **Side Effects**: Additional state updates (e.g., leverage index calculation)

#### Example Transition
```
From: SPRINTING
To: TACKLE_PREP
Trigger: distance_to_target <= 2.0 meters
Guard: approach_angle <= 15.0 degrees AND pad_level >= 0.8
Side Effects: calculate_leverage_index(), update_spatial_context()
```

## 3. Spatial Awareness and Field Context

### 3.1 Purpose and Scope

**USE-SPC-001**: The spatial awareness system MUST model how field position and surroundings influence gameplay outcomes, particularly tackle success and injury risk.

### 3.2 Field Zones

#### Boundary Band (0-1.5 yards from sideline)
- **Sideline Benefit**: Tacklers gain advantage due to reduced evasion space
- **Injury Risk**: Increased risk of awkward steps and boundary contact
- **Context Multiplier**: `sideline_benefit ∈ [0, 0.25]`

#### Alley (1.5-10 yards from sideline)
- **Moderate Constraint**: Some spatial limitation but more options than boundary
- **Balanced Risk**: Moderate injury risk with good tackle opportunities

#### Box (Between hash marks)
- **Open Space**: Maximum evasion options for ball carriers
- **Standard Risk**: Baseline injury and tackle probabilities

#### Open Field (Center of field)
- **Maximum Freedom**: Greatest evasion options
- **Lower Tackle Success**: Reduced tackle success due to space

### 3.3 Spatial Context Multipliers

**USE-SPC-002**: Field context MUST modify tackle success probability:

```
P(tackle_with_context) = P(tackle_base) * (1 + sideline_benefit - open_field_penalty)
```

Where:
- `sideline_benefit`: Advantage near boundary [0, 0.25]
- `open_field_penalty`: Disadvantage in open space [0, 0.15]

### 3.4 Pursuit Dynamics

**USE-SPC-003**: The system MUST model pursuit angles and defender density:

```
pursuit_cone_density = count_defenders_in_angle(ball_carrier, pursuit_angle)
collision_probability = base_collision_prob * (1 + pursuit_cone_density * 0.1)
```

## 4. Fatigue Model

### 4.1 Purpose and Scope

**USE-FAT-001**: The fatigue model MUST implement two-timescale fatigue with cumulative wear that affects player performance and injury susceptibility.

### 4.2 Two-Timescale Architecture

#### Acute Fatigue (F_acute)
- **Scope**: In-game fatigue that accumulates during plays
- **Recovery**: Recovers between plays and games
- **Impact**: Affects speed, reaction time, and decision-making

#### Cumulative Fatigue (F_cum)
- **Scope**: Season-long fatigue that accumulates across games
- **Recovery**: Recovers during bye weeks and off-season
- **Impact**: Affects injury susceptibility and long-term performance

### 4.3 Fatigue Accumulation

**USE-FAT-002**: Fatigue MUST accumulate based on:

```
F_acute(t+1) = decay(F_acute(t)) + load_acute(play)
F_cum(week+1) = recover(F_cum(week)) + load_cum(game)
```

Where:
- `load_acute(play)`: Fatigue from individual play intensity
- `load_cum(game)`: Fatigue from entire game contact load
- `decay()`: Natural recovery function
- `recover()`: Enhanced recovery during rest periods

### 4.4 Contact Load Integration

**USE-FAT-003**: Contact load MUST be integrated into fatigue calculations:

```
contact_load = Σ(collision_energy * body_state_multiplier)
fatigue_increase = base_fatigue_rate * (1 + contact_load_factor * contact_load)
```

### 4.5 Performance Impact

**USE-FAT-004**: Fatigue MUST affect player attributes:

```
speed_modifier = 1.0 - (F_acute * 0.3 + F_cum * 0.1)
reaction_modifier = 1.0 - (F_acute * 0.2 + F_cum * 0.05)
tackle_power_modifier = 1.0 - (F_acute * 0.25 + F_cum * 0.08)
```

## 5. Injury Risk Model

### 5.1 Purpose and Scope

**USE-INJ-001**: The injury risk model MUST provide realistic, contact-driven injury probability that integrates with body states, fatigue, and spatial context.

### 5.2 Hazard-Style Model

**USE-INJ-002**: Injury probability MUST use a logistic hazard model:

```
p_injury = base_rate(position) 
           * exp(β1*collision_energy + β2*unsafe_head_pos + β3*twist_load)
           * (1 + γ1*F_acute + γ2*F_cum)
           * context_mult(field_zone, surface, weather)
```

Where:
- `base_rate(position)`: Position-specific baseline injury rate
- `collision_energy`: Impact energy from contact (Joules)
- `unsafe_head_pos`: Binary flag for dangerous head position
- `twist_load`: Torsional stress on joints (N⋅m)
- `F_acute, F_cum`: Acute and cumulative fatigue levels
- `context_mult`: Environmental and situational multipliers

### 5.3 Injury Taxonomy

**USE-INJ-003**: The system MUST categorize injuries by type and severity:

#### Injury Types
- **Concussion**: Head injury with cognitive impact
- **Sprain**: Joint injury with ligament damage
- **Strain**: Muscle injury with tissue damage
- **Fracture**: Bone injury requiring immobilization
- **Other**: Miscellaneous injuries

#### Severity Levels
- **Minor**: 1-2 weeks recovery
- **Moderate**: 3-6 weeks recovery
- **Severe**: 7-12 weeks recovery
- **Career-threatening**: Long-term or permanent impact

### 5.4 Recovery Modeling

**USE-INJ-004**: Injury recovery MUST follow realistic curves:

```
recovery_progress = 1 - exp(-recovery_rate * time_since_injury)
return_to_play_probability = recovery_progress * (1 - reinjury_risk)
```

## 6. System Integration Examples

### 6.1 Sideline Tackle Scenario

**USE-INT-002**: Example of integrated system behavior:

```
1. Body State: Player in TACKLE_PREP with lowered_pad (+0.15 leverage)
2. Spatial Context: Near sideline (sideline_benefit = 0.20)
3. Fatigue Level: Moderate (F_acute = 0.4, F_cum = 0.3)
4. Contact: High-energy collision (500J)

Calculations:
- Leverage Index: L = 0.3*0.9 + 0.25*0.8 + 0.25*0.7 + 0.2*0.9 = 0.825
- Tackle Success: P(tackle) = σ(-0.5 + 2.0*0.825 + 0.8*0.20) = 0.78
- Injury Risk: p_injury = 0.01 * exp(0.001*500 + 0.5*0.4 + 0.3*0.3) = 0.025
- Fatigue Increase: ΔF_acute = 0.02 * (1 + 0.1*500) = 0.12
```

### 6.2 Open Field Scenario

**USE-INT-003**: Contrast with open field situation:

```
1. Body State: Player in SPRINTING with poor leverage (0.2)
2. Spatial Context: Open field (open_field_penalty = 0.10)
3. Fatigue Level: Low (F_acute = 0.1, F_cum = 0.1)
4. Contact: Moderate collision (300J)

Calculations:
- Leverage Index: L = 0.2 (poor positioning)
- Tackle Success: P(tackle) = σ(-0.5 + 2.0*0.2 - 0.8*0.10) = 0.28
- Injury Risk: p_injury = 0.01 * exp(0.001*300 + 0.5*0.1 + 0.3*0.1) = 0.015
- Fatigue Increase: ΔF_acute = 0.02 * (1 + 0.1*300) = 0.08
```

## 7. Performance Requirements

### 7.1 Computational Performance

**USE-PER-001**: The USE Engine MUST meet performance requirements:

- **State Transition Latency**: ≤ 1ms per transition
- **Fatigue Calculation Time**: ≤ 5ms per update
- **Injury Risk Calculation**: ≤ 3ms per assessment
- **Memory Usage**: ≤ 512MB for full team simulation
- **CPU Utilization**: ≤ 70% during peak simulation

### 7.2 Scalability Requirements

**USE-PER-002**: The engine MUST scale to support:

- **Team Size**: 53 active players per team
- **League Size**: 32 teams (1,696 total players)
- **Simulation Frequency**: Real-time game simulation
- **Concurrent Users**: 1,000+ simultaneous players

## 8. Validation and Testing

### 8.1 Golden Scenarios

**USE-VAL-001**: The engine MUST pass validation against golden scenarios:

#### Scenario 1: Open Field, Poor Leverage
- **Expected Outcome**: Low tackle success (≤ 30%)
- **Validation**: P(tackle) ≤ 0.30 for leverage ≤ 0.3 in open field

#### Scenario 2: Sideline Squeeze, Good Leverage
- **Expected Outcome**: High tackle success (≥ 75%)
- **Validation**: P(tackle) ≥ 0.75 for leverage ≥ 0.8 near sideline

#### Scenario 3: High Contact Game
- **Expected Outcome**: End-game speed drop and elevated fatigue
- **Validation**: Speed reduction ≥ 15% and F_cum increase ≥ 0.2

#### Scenario 4: Awkward Plant Sequence
- **Expected Outcome**: Elevated lower-limb injury risk
- **Validation**: Injury probability ≥ 3x baseline for repeated awkward plants

### 8.2 Property-Based Tests

**USE-VAL-002**: The engine MUST maintain system invariants:

- **Energy Conservation**: Total energy in system remains constant
- **Probability Bounds**: All probabilities remain in [0, 1]
- **Monotonicity**: Increasing leverage increases tackle success
- **Fatigue Bounds**: Fatigue levels remain in [0, 1]

## 9. Integration with Game Systems

### 9.1 CPU GM Integration

**USE-GAM-001**: The USE Engine MUST integrate with CPU GM decision-making:

- **Player Evaluation**: Fatigue and injury history affect player value
- **Roster Management**: Injury risk influences depth chart decisions
- **Game Strategy**: Fatigue levels affect play calling and personnel usage
- **Long-term Planning**: Cumulative fatigue impacts development decisions

### 9.2 Player Development Integration

**USE-GAM-002**: The engine MUST support player development systems:

- **Attribute Progression**: Fatigue affects skill development rates
- **Injury Recovery**: Recovery curves influence player availability
- **Performance Tracking**: Realistic performance variation based on condition
- **Career Longevity**: Cumulative wear affects career length

## 10. Future Enhancements

### 10.1 Planned Extensions

**USE-FUT-001**: Future USE Engine enhancements may include:

- **Weather Integration**: Environmental effects on fatigue and injury
- **Equipment Modeling**: Impact of different equipment on performance
- **Medical Staff Effects**: Influence of medical resources on recovery
- **Advanced Analytics**: Machine learning integration for pattern recognition

### 10.2 Research Integration

**USE-FUT-002**: The engine MUST support integration with:

- **Biomechanical Research**: Latest findings on injury mechanisms
- **Sports Science Data**: Real-world fatigue and performance data
- **Medical Studies**: Injury epidemiology and recovery patterns
- **Player Analytics**: Advanced statistical modeling of player performance

## References

- **【message_idx†source】**: "NFL General Manager Simulation Game Design Doc" - Realism priorities and player-centric design
- **【message_idx†source】**: "Designing a Unique NFL General Manager Simulator" - Player interaction and relationship systems
- **【message_idx†source】**: "A Strategic Framework for In-Game AI General Managers" - Dynamic contextual awareness and archetype-driven AI behavior
- **【message_idx†source】**: "Building a Unique Web-Based NFL General Manager Simulator" - Scalability and microservices architecture

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-19 | Architecture Team | Initial creation |
