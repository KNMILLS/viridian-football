# Spatial Awareness and Field Context Specification
**Document ID**: USE-SPC-001  
**Version**: 1.0  
**Last Updated**: 2024-12-19  
**Status**: Active

## Executive Summary

The Spatial Awareness and Field Context system is a core component of the USE Engine that models how field position, surroundings, and spatial relationships influence gameplay outcomes. This specification defines field zones, spatial primitives, context multipliers, and pursuit dynamics that enable realistic tackle success modeling and injury risk assessment.

## 1. Spatial Primitives

### 1.1 Field Zones

**USE-SPC-002**: The spatial awareness system MUST define the following field zones:

#### Boundary Band (0-1.5 yards from sideline)
```yaml
boundary_band:
  distance_range: [0.0, 1.5]  # yards from sideline
  description: "Area within 1.5 yards of sideline"
  characteristics:
    - "Reduced evasion space for ball carriers"
    - "Increased tackle success for defenders"
    - "Higher risk of boundary contact injuries"
    - "Limited lateral movement options"
  
  sideline_benefit: "Tackler advantage due to spatial constraints"
    range: [0.0, 0.25]
    default: 0.20
    calculation: "min(0.25, distance_to_sideline / 1.5)"
```

#### Alley (1.5-10 yards from sideline)
```yaml
alley:
  distance_range: [1.5, 10.0]  # yards from sideline
  description: "Area between boundary band and hash marks"
  characteristics:
    - "Moderate spatial constraints"
    - "Balanced tackle success rates"
    - "Moderate injury risk"
    - "Some lateral movement options"
  
  spatial_modifier: "Moderate constraint on ball carrier movement"
    range: [0.0, 0.10]
    default: 0.05
    calculation: "0.05 * (1 - distance_to_sideline / 10.0)"
```

#### Box (Between hash marks)
```yaml
box:
  distance_range: [10.0, 43.33]  # yards from sideline (standard field width)
  description: "Area between hash marks"
  characteristics:
    - "Maximum evasion space"
    - "Standard tackle success rates"
    - "Baseline injury risk"
    - "Full lateral movement options"
  
  spatial_modifier: "No spatial constraints"
    range: [0.0, 0.0]
    default: 0.0
    calculation: "0.0"
```

#### Open Field (Center of field)
```yaml
open_field:
  distance_range: [21.67, 43.33]  # yards from sideline (center half)
  description: "Center area of the field"
  characteristics:
    - "Maximum freedom of movement"
    - "Reduced tackle success due to space"
    - "Lower injury risk from boundary contact"
    - "Full directional options"
  
  open_field_penalty: "Tackler disadvantage due to space"
    range: [0.0, 0.15]
    default: 0.10
    calculation: "0.10 * (distance_from_center / 21.67)"
```

### 1.2 Field Features

**USE-SPC-003**: The system MUST model the following field features:

#### Sideline Plane
```yaml
sideline_plane:
  description: "Boundary line defining field limits"
  properties:
    - "Hard boundary - cannot be crossed"
    - "Contact with sideline affects play outcome"
    - "Distance to sideline influences spatial context"
  
  sideline_contact:
    effects:
      - "Ball carrier out of bounds"
      - "Injury risk from boundary contact"
      - "Tackle completion if contact occurs"
```

#### Hash Marks
```yaml
hash_marks:
  description: "Field markings for ball placement"
  properties:
    - "Standard field width: 53.33 yards"
    - "Hash marks at 18.5 yards from each sideline"
    - "Influence ball placement and play direction"
  
  hash_mark_effect:
    - "Ball placement constraints"
    - "Play direction preferences"
    - "Spatial awareness reference points"
```

#### First-Down Line
```yaml
first_down_line:
  description: "Virtual line marking first down distance"
  properties:
    - "Dynamic position based on ball placement"
    - "Influences player positioning and strategy"
    - "Affects spatial context calculations"
  
  first_down_effect:
    - "Defensive positioning near line"
    - "Offensive strategy adjustments"
    - "Spatial constraint on play development"
```

#### Goal Line
```yaml
goal_line:
  description: "Scoring boundary at each end of field"
  properties:
    - "Hard boundary for scoring plays"
    - "Influences defensive positioning"
    - "Affects spatial context near end zone"
  
  goal_line_effect:
    - "Compressed defensive spacing"
    - "Reduced evasion space"
    - "Increased tackle success probability"
```

### 1.3 Spatial Actors

**USE-SPC-004**: The system MUST track the following spatial actors:

#### Teammates and Enemies
```yaml
spatial_actors:
  teammates:
    description: "Players on same team"
    tracking:
      - "Position (x, y coordinates)"
      - "Velocity and direction"
      - "Distance to ball carrier"
      - "Angle relative to ball carrier"
  
  enemies:
    description: "Players on opposing team"
    tracking:
      - "Position (x, y coordinates)"
      - "Velocity and direction"
      - "Distance to ball carrier"
      - "Angle relative to ball carrier"
      - "Pursuit angle and speed"
```

#### Pursuit Cones
```yaml
pursuit_cones:
  description: "Angular sectors of pursuit for each defender"
  properties:
    - "Cone angle: 45 degrees (configurable)"
    - "Cone range: 20 yards (configurable)"
    - "Overlap detection for multiple defenders"
  
  pursuit_cone_density:
    calculation: "count_defenders_in_cone(ball_carrier, cone_angle, cone_range)"
    effect: "Increases collision probability and tackle success"
```

## 2. Context Multipliers

### 2.1 Sideline Benefit Calculation

**USE-SPC-005**: Sideline benefit MUST be calculated based on ball carrier proximity and momentum:

```python
def calculate_sideline_benefit(ball_carrier_position, ball_carrier_momentum):
    """Calculate sideline benefit for tacklers"""
    # Distance to nearest sideline
    distance_to_sideline = min(
        ball_carrier_position['x'],  # Distance to left sideline
        53.33 - ball_carrier_position['x']  # Distance to right sideline
    )
    
    # Convert to yards
    distance_yards = distance_to_sideline * 1.09361
    
    # Base sideline benefit (maximum at boundary, zero at 1.5 yards)
    if distance_yards <= 1.5:
        base_benefit = 0.25 * (1.5 - distance_yards) / 1.5
    else:
        base_benefit = 0.0
    
    # Momentum factor (inward momentum increases benefit)
    momentum_toward_sideline = calculate_momentum_toward_sideline(ball_carrier_momentum)
    momentum_factor = 1.0 + (momentum_toward_sideline * 0.5)
    
    # Final sideline benefit
    sideline_benefit = base_benefit * momentum_factor
    
    return min(0.25, max(0.0, sideline_benefit))
```

### 2.2 Open Field Penalty Calculation

**USE-SPC-006**: Open field penalty MUST be calculated based on available space:

```python
def calculate_open_field_penalty(ball_carrier_position, defenders):
    """Calculate open field penalty for tacklers"""
    # Distance from field center
    field_center = 26.665  # yards from left sideline
    distance_from_center = abs(ball_carrier_position['x'] - field_center)
    
    # Base penalty (maximum at center, zero at edges)
    max_penalty = 0.15
    center_distance_normalized = distance_from_center / 21.67  # Half field width
    
    base_penalty = max_penalty * (1.0 - center_distance_normalized)
    
    # Defender density factor (fewer defenders = higher penalty)
    defender_density = len(defenders) / 11.0  # Normalize by team size
    density_factor = 1.0 - (defender_density * 0.5)
    
    # Final open field penalty
    open_field_penalty = base_penalty * density_factor
    
    return min(0.15, max(0.0, open_field_penalty))
```

### 2.3 Pursuit Cone Density

**USE-SPC-007**: Pursuit cone density MUST be calculated for collision probability:

```python
def calculate_pursuit_cone_density(ball_carrier_position, defenders, cone_angle=45, cone_range=20):
    """Calculate density of defenders in pursuit cone"""
    defenders_in_cone = []
    
    for defender in defenders:
        # Calculate angle to defender
        angle_to_defender = calculate_angle_to_defender(ball_carrier_position, defender)
        
        # Calculate distance to defender
        distance_to_defender = calculate_distance(ball_carrier_position, defender)
        
        # Check if defender is in cone
        if (abs(angle_to_defender) <= cone_angle/2 and 
            distance_to_defender <= cone_range):
            defenders_in_cone.append(defender)
    
    # Calculate density (normalized by maximum expected defenders)
    max_expected_defenders = 6  # Typical pursuit scenario
    density = len(defenders_in_cone) / max_expected_defenders
    
    return min(1.0, max(0.0, density))
```

## 3. Spatial Context Integration

### 3.1 Tackle Success Modification

**USE-SPC-008**: Spatial context MUST modify tackle success probability:

```python
def modify_tackle_success_with_spatial_context(base_tackle_probability, spatial_context):
    """Modify tackle success probability based on spatial context"""
    # Get spatial multipliers
    sideline_benefit = spatial_context.get('sideline_benefit', 0.0)
    open_field_penalty = spatial_context.get('open_field_penalty', 0.0)
    pursuit_density = spatial_context.get('pursuit_cone_density', 0.0)
    
    # Calculate spatial modifier
    spatial_modifier = sideline_benefit - open_field_penalty + (pursuit_density * 0.1)
    
    # Apply modifier to base probability
    modified_probability = base_tackle_probability * (1.0 + spatial_modifier)
    
    # Ensure bounds
    modified_probability = max(0.0, min(1.0, modified_probability))
    
    return modified_probability
```

### 3.2 Injury Risk Modification

**USE-SPC-009**: Spatial context MUST modify injury risk probability:

```python
def modify_injury_risk_with_spatial_context(base_injury_risk, spatial_context):
    """Modify injury risk based on spatial context"""
    field_zone = spatial_context.get('field_zone', 'box')
    
    # Zone-specific injury risk multipliers
    zone_multipliers = {
        'boundary_band': 1.5,    # Higher risk near sideline
        'alley': 1.2,           # Moderate risk
        'box': 1.0,             # Baseline risk
        'open_field': 0.8       # Lower risk in open space
    }
    
    zone_multiplier = zone_multipliers.get(field_zone, 1.0)
    
    # Boundary contact risk
    distance_to_sideline = spatial_context.get('distance_to_sideline', 10.0)
    boundary_contact_risk = max(0.0, (1.5 - distance_to_sideline) / 1.5) if distance_to_sideline <= 1.5 else 0.0
    
    # Calculate modified injury risk
    modified_risk = base_injury_risk * zone_multiplier * (1.0 + boundary_contact_risk * 0.5)
    
    return modified_risk
```

### 3.3 Fatigue Accumulation Modification

**USE-SPC-010**: Spatial context MUST modify fatigue accumulation rates:

```python
def modify_fatigue_accumulation_with_spatial_context(base_fatigue_rate, spatial_context):
    """Modify fatigue accumulation based on spatial context"""
    field_zone = spatial_context.get('field_zone', 'box')
    pursuit_density = spatial_context.get('pursuit_cone_density', 0.0)
    
    # Zone-specific fatigue multipliers
    zone_fatigue_multipliers = {
        'boundary_band': 1.3,    # Higher fatigue near sideline
        'alley': 1.1,           # Moderate fatigue
        'box': 1.0,             # Baseline fatigue
        'open_field': 0.9       # Lower fatigue in open space
    }
    
    zone_multiplier = zone_fatigue_multipliers.get(field_zone, 1.0)
    
    # Pursuit density factor (more pursuit = higher fatigue)
    pursuit_factor = 1.0 + (pursuit_density * 0.3)
    
    # Calculate modified fatigue rate
    modified_fatigue_rate = base_fatigue_rate * zone_multiplier * pursuit_factor
    
    return modified_fatigue_rate
```

## 4. Field Zone Classification

### 4.1 Zone Determination Algorithm

**USE-SPC-011**: Field zones MUST be determined using the following algorithm:

```python
def determine_field_zone(position_x, field_width=53.33):
    """Determine field zone based on x-coordinate"""
    # Convert to yards
    position_yards = position_x * 1.09361
    
    # Determine zone based on distance from sideline
    if position_yards <= 1.5:
        return 'boundary_band'
    elif position_yards <= 10.0:
        return 'alley'
    elif position_yards <= 43.33:
        return 'box'
    else:
        return 'open_field'
```

### 4.2 Zone Transition Detection

**USE-SPC-012**: Zone transitions MUST be detected and handled:

```python
def detect_zone_transition(current_position, previous_position):
    """Detect transition between field zones"""
    current_zone = determine_field_zone(current_position['x'])
    previous_zone = determine_field_zone(previous_position['x'])
    
    if current_zone != previous_zone:
        return {
            'transition_detected': True,
            'from_zone': previous_zone,
            'to_zone': current_zone,
            'transition_time': get_current_time()
        }
    else:
        return {
            'transition_detected': False,
            'current_zone': current_zone
        }
```

## 5. Spatial Awareness Metrics

### 5.1 Spatial Context Metrics

**USE-SPC-013**: The system MUST track the following spatial metrics:

```yaml
spatial_metrics:
  field_zone_distribution:
    description: "Distribution of plays by field zone"
    measurement: "Percentage of plays in each zone"
    expected_distribution:
      boundary_band: 15.0
      alley: 25.0
      box: 45.0
      open_field: 15.0
  
  sideline_benefit_effectiveness:
    description: "Effectiveness of sideline benefit calculation"
    measurement: "Tackle success rate near sideline vs. open field"
    expected_ratio: "1.5:1 (sideline:open_field)"
  
  pursuit_cone_accuracy:
    description: "Accuracy of pursuit cone predictions"
    measurement: "Correlation between cone density and tackle success"
    expected_correlation: "≥ 0.7"
```

### 5.2 Performance Metrics

**USE-SPC-014**: The system MUST meet performance requirements:

```yaml
performance_requirements:
  spatial_calculation_latency:
    target: "≤ 2ms"
    measurement: "Time to calculate spatial context"
    validation: "95th percentile latency"
  
  zone_detection_accuracy:
    target: "≥ 98%"
    measurement: "Accuracy of field zone classification"
    validation: "Percentage of correct zone assignments"
  
  context_update_frequency:
    target: "≥ 30Hz"
    measurement: "Spatial context update rate"
    validation: "Minimum update frequency"
```

## 6. Integration Examples

### 6.1 Sideline Tackle Scenario

**USE-SPC-015**: Example of spatial context integration:

```python
def sideline_tackle_scenario():
    """Example: Sideline tackle with spatial context"""
    # Initial conditions
    ball_carrier_position = {'x': 1.0, 'y': 25.0}  # Near left sideline
    ball_carrier_momentum = {'x': -2.0, 'y': 0.0}  # Moving toward sideline
    tackler_position = {'x': 2.0, 'y': 25.0}       # Close to ball carrier
    
    # Calculate spatial context
    spatial_context = {
        'field_zone': 'boundary_band',
        'distance_to_sideline': 1.0,
        'sideline_benefit': 0.20,
        'open_field_penalty': 0.0,
        'pursuit_cone_density': 0.8
    }
    
    # Base tackle probability (from body state)
    base_tackle_prob = 0.6
    
    # Apply spatial context
    modified_tackle_prob = modify_tackle_success_with_spatial_context(
        base_tackle_prob, spatial_context
    )
    
    # Result: 0.6 * (1.0 + 0.20 + 0.08) = 0.77
    assert abs(modified_tackle_prob - 0.77) < 0.01
```

### 6.2 Open Field Scenario

**USE-SPC-016**: Contrast with open field situation:

```python
def open_field_scenario():
    """Example: Open field tackle with spatial context"""
    # Initial conditions
    ball_carrier_position = {'x': 26.0, 'y': 25.0}  # Near field center
    ball_carrier_momentum = {'x': 0.0, 'y': 5.0}    # Moving forward
    tackler_position = {'x': 26.0, 'y': 20.0}       # Behind ball carrier
    
    # Calculate spatial context
    spatial_context = {
        'field_zone': 'open_field',
        'distance_to_sideline': 26.0,
        'sideline_benefit': 0.0,
        'open_field_penalty': 0.10,
        'pursuit_cone_density': 0.3
    }
    
    # Base tackle probability (from body state)
    base_tackle_prob = 0.6
    
    # Apply spatial context
    modified_tackle_prob = modify_tackle_success_with_spatial_context(
        base_tackle_prob, spatial_context
    )
    
    # Result: 0.6 * (1.0 - 0.10 + 0.03) = 0.56
    assert abs(modified_tackle_prob - 0.56) < 0.01
```

## 7. Validation and Testing

### 7.1 Spatial Context Validation

**USE-SPC-017**: Spatial context calculations MUST be validated:

#### Test Case 1: Sideline Benefit Calculation
```python
def test_sideline_benefit_calculation():
    """Test sideline benefit calculation"""
    # Test case: Ball carrier at boundary
    position = {'x': 0.5, 'y': 25.0}  # 0.5 yards from sideline
    momentum = {'x': -1.0, 'y': 0.0}  # Moving toward sideline
    
    sideline_benefit = calculate_sideline_benefit(position, momentum)
    
    # Should be maximum benefit
    assert sideline_benefit > 0.20
    assert sideline_benefit <= 0.25
```

#### Test Case 2: Open Field Penalty Calculation
```python
def test_open_field_penalty_calculation():
    """Test open field penalty calculation"""
    # Test case: Ball carrier at center
    position = {'x': 26.665, 'y': 25.0}  # Field center
    defenders = []  # No defenders nearby
    
    open_field_penalty = calculate_open_field_penalty(position, defenders)
    
    # Should be maximum penalty
    assert open_field_penalty > 0.10
    assert open_field_penalty <= 0.15
```

### 7.2 Integration Validation

**USE-SPC-018**: Integration with other systems MUST be validated:

#### Test Case 1: Tackle Success Modification
```python
def test_tackle_success_modification():
    """Test tackle success modification with spatial context"""
    base_probability = 0.5
    spatial_context = {
        'sideline_benefit': 0.20,
        'open_field_penalty': 0.0,
        'pursuit_cone_density': 0.5
    }
    
    modified_probability = modify_tackle_success_with_spatial_context(
        base_probability, spatial_context
    )
    
    # Should increase due to sideline benefit and pursuit density
    assert modified_probability > base_probability
    assert modified_probability <= 1.0
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
