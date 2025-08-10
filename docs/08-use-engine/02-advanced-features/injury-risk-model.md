# Injury Risk Model Specification
**Document ID**: USE-INJ-001  
**Version**: 1.0  
**Last Updated**: 2024-12-19  
**Status**: Active

## Executive Summary

The Injury Risk Model is a core component of the USE Engine that provides realistic, contact-driven injury probability assessment. The model uses logistic hazard functions with multiplicative context factors to calculate injury risk based on collision energy, body positioning, fatigue levels, and environmental factors.

## 1. Hazard-Style Model Architecture

### 1.1 Logistic Hazard Function

**USE-INJ-002**: Injury probability MUST use a logistic hazard model:

```python
def calculate_injury_probability(base_rate, collision_energy, unsafe_head_pos, twist_load, 
                               acute_fatigue, cumulative_fatigue, context_multipliers):
    """Calculate injury probability using logistic hazard model"""
    # Logistic function parameters
    beta1 = 0.001  # Collision energy coefficient
    beta2 = 0.5    # Unsafe head position coefficient
    beta3 = 0.3    # Twist load coefficient
    gamma1 = 0.5   # Acute fatigue coefficient
    gamma2 = 0.3   # Cumulative fatigue coefficient
    
    # Calculate hazard components
    collision_hazard = math.exp(beta1 * collision_energy)
    head_position_hazard = math.exp(beta2 * unsafe_head_pos)
    twist_hazard = math.exp(beta3 * twist_load)
    
    # Fatigue multipliers
    acute_fatigue_multiplier = 1.0 + gamma1 * acute_fatigue
    cumulative_fatigue_multiplier = 1.0 + gamma2 * cumulative_fatigue
    
    # Context multipliers
    context_multiplier = calculate_context_multiplier(context_multipliers)
    
    # Calculate final injury probability
    injury_probability = (base_rate * 
                         collision_hazard * 
                         head_position_hazard * 
                         twist_hazard * 
                         acute_fatigue_multiplier * 
                         cumulative_fatigue_multiplier * 
                         context_multiplier)
    
    # Ensure bounds
    injury_probability = max(0.0, min(1.0, injury_probability))
    
    return injury_probability
```

### 1.2 Base Injury Rates

**USE-INJ-003**: Position-specific base injury rates MUST be defined:

```yaml
base_injury_rates:
  quarterback:
    base_rate: 0.008  # 0.8% per contact
    description: "Protected position, but vulnerable to specific injuries"
    risk_factors:
      - "Pocket pressure and sacks"
      - "Running plays and designed runs"
      - "Late hits and roughing"
  
  running_back:
    base_rate: 0.015  # 1.5% per contact
    description: "High contact frequency, significant injury risk"
    risk_factors:
      - "High volume of carries"
      - "Contact in traffic"
      - "Tackles from multiple angles"
  
  wide_receiver:
    base_rate: 0.012  # 1.2% per contact
    description: "Speed-based injuries and contact injuries"
    risk_factors:
      - "High-speed collisions"
      - "Landing from catches"
      - "Contact during routes"
  
  tight_end:
    base_rate: 0.014  # 1.4% per contact
    description: "Hybrid role with multiple injury risks"
    risk_factors:
      - "Blocking contact"
      - "Receiving contact"
      - "Mixed role responsibilities"
  
  offensive_line:
    base_rate: 0.010  # 1.0% per contact
    description: "High contact frequency, but controlled environment"
    risk_factors:
      - "Repetitive contact"
      - "Hand and finger injuries"
      - "Lower body stress"
  
  defensive_line:
    base_rate: 0.013  # 1.3% per contact
    description: "High contact intensity, trench warfare"
    risk_factors:
      - "High-intensity collisions"
      - "Hand and arm injuries"
      - "Lower body stress"
  
  linebacker:
    base_rate: 0.016  # 1.6% per contact
    description: "Highest contact frequency and intensity"
    risk_factors:
      - "Multiple contacts per play"
      - "High-speed collisions"
      - "Tackling and shedding blocks"
  
  defensive_back:
    base_rate: 0.011  # 1.1% per contact
    description: "Speed-based injuries and coverage contact"
    risk_factors:
      - "High-speed collisions"
      - "Landing from jumps"
      - "Tackling in space"
  
  special_teams:
    base_rate: 0.020  # 2.0% per contact
    description: "Highest injury risk due to high-speed collisions"
    risk_factors:
      - "Maximum speed collisions"
      - "Uncontrolled contact"
      - "Coverage and return contact"
```

## 2. Injury Risk Factors

### 2.1 Collision Energy

**USE-INJ-004**: Collision energy MUST be calculated from momentum and impact angle:

```python
def calculate_collision_energy(tackler_mass, tackler_velocity, ball_carrier_mass, 
                              ball_carrier_velocity, impact_angle):
    """Calculate collision energy from momentum and impact angle"""
    # Calculate relative velocity
    relative_velocity_x = tackler_velocity['x'] - ball_carrier_velocity['x']
    relative_velocity_y = tackler_velocity['y'] - ball_carrier_velocity['y']
    relative_velocity = math.sqrt(relative_velocity_x**2 + relative_velocity_y**2)
    
    # Calculate impact angle factor (head-on vs. glancing)
    angle_rad = math.radians(impact_angle)
    impact_factor = abs(math.cos(angle_rad))
    
    # Calculate collision energy
    # E = 0.5 * m * v^2 * impact_factor
    effective_mass = (tackler_mass * ball_carrier_mass) / (tackler_mass + ball_carrier_mass)
    collision_energy = 0.5 * effective_mass * relative_velocity**2 * impact_factor
    
    return collision_energy
```

### 2.2 Unsafe Head Position

**USE-INJ-005**: Unsafe head position MUST be detected from body state:

```python
def detect_unsafe_head_position(body_state, torso_pitch, torso_roll, impact_angle):
    """Detect unsafe head position for injury risk"""
    unsafe_head = False
    
    # Head down position (torso pitched forward)
    if torso_pitch < -30:  # Head down more than 30 degrees
        unsafe_head = True
    
    # Head tilted position (torso rolled)
    if abs(torso_roll) > 45:  # Head tilted more than 45 degrees
        unsafe_head = True
    
    # Head-on collision with head down
    if abs(impact_angle) < 15 and torso_pitch < -20:
        unsafe_head = True
    
    # Specific dangerous body states
    dangerous_states = ['STUMBLE_LATE', 'DIVING_PRONE', 'TWISTING']
    if body_state in dangerous_states:
        unsafe_head = True
    
    return unsafe_head
```

### 2.3 Twist Load

**USE-INJ-006**: Twist load MUST be calculated from foot plant and torso rotation:

```python
def calculate_twist_load(foot_plant_angle, torso_yaw_rate, stance_width, body_state):
    """Calculate torsional stress on joints"""
    # Base twist load from foot plant angle
    base_twist = abs(foot_plant_angle) / 90.0  # Normalize to [0, 1]
    
    # Torso rotation rate factor
    rotation_factor = min(1.0, abs(torso_yaw_rate) / 180.0)  # Normalize to [0, 1]
    
    # Stance width factor (wider stance = more stability)
    stance_factor = max(0.5, stance_width / 0.8)  # Normalize to stance width
    
    # Body state multiplier
    state_multipliers = {
        'PLANT_AND_DRIVE': 1.5,    # High twist load
        'TWISTING': 2.0,           # Very high twist load
        'STUMBLE_EARLY': 1.3,      # Moderate twist load
        'STUMBLE_LATE': 1.8,       # High twist load
        'NORMAL': 1.0              # Standard twist load
    }
    
    state_multiplier = state_multipliers.get(body_state, 1.0)
    
    # Calculate total twist load
    twist_load = base_twist * rotation_factor * state_multiplier / stance_factor
    
    return min(1.0, twist_load)  # Cap at 1.0
```

## 3. Context Multipliers

### 3.1 Field Position Context

**USE-INJ-007**: Field position MUST modify injury risk:

```python
def calculate_field_position_multiplier(field_zone, distance_to_sideline, surface_type):
    """Calculate injury risk multiplier based on field position"""
    # Zone-specific multipliers
    zone_multipliers = {
        'boundary_band': 1.5,    # Higher risk near sideline
        'alley': 1.2,           # Moderate risk
        'box': 1.0,             # Baseline risk
        'open_field': 0.8       # Lower risk in open space
    }
    
    zone_multiplier = zone_multipliers.get(field_zone, 1.0)
    
    # Sideline proximity factor
    if distance_to_sideline <= 1.5:
        sideline_factor = 1.0 + (1.5 - distance_to_sideline) / 1.5 * 0.5
    else:
        sideline_factor = 1.0
    
    # Surface type factor
    surface_multipliers = {
        'grass': 1.0,           # Baseline
        'turf': 1.1,           # Slightly higher risk
        'artificial': 1.2,      # Higher risk
        'wet_grass': 1.3,       # Higher risk
        'wet_turf': 1.4         # Highest risk
    }
    
    surface_multiplier = surface_multipliers.get(surface_type, 1.0)
    
    # Calculate total multiplier
    total_multiplier = zone_multiplier * sideline_factor * surface_multiplier
    
    return total_multiplier
```

### 3.2 Weather Context

**USE-INJ-008**: Weather conditions MUST modify injury risk:

```python
def calculate_weather_multiplier(temperature, humidity, precipitation, wind_speed):
    """Calculate injury risk multiplier based on weather"""
    # Temperature factor
    if temperature < 32:  # Freezing
        temp_factor = 1.3
    elif temperature < 50:  # Cold
        temp_factor = 1.1
    elif temperature < 70:  # Moderate
        temp_factor = 1.0
    elif temperature < 85:  # Warm
        temp_factor = 1.1
    elif temperature < 95:  # Hot
        temp_factor = 1.2
    else:  # Extreme heat
        temp_factor = 1.4
    
    # Humidity factor
    if humidity > 80:
        humidity_factor = 1.2
    elif humidity > 60:
        humidity_factor = 1.1
    else:
        humidity_factor = 1.0
    
    # Precipitation factor
    if precipitation == 'heavy_rain':
        precip_factor = 1.4
    elif precipitation == 'light_rain':
        precip_factor = 1.2
    elif precipitation == 'snow':
        precip_factor = 1.3
    else:
        precip_factor = 1.0
    
    # Wind factor
    if wind_speed > 20:  # High winds
        wind_factor = 1.1
    else:
        wind_factor = 1.0
    
    # Calculate total multiplier
    total_multiplier = temp_factor * humidity_factor * precip_factor * wind_factor
    
    return total_multiplier
```

## 4. Injury Taxonomy and Severity

### 4.1 Injury Types

**USE-INJ-009**: The system MUST categorize injuries by type:

```yaml
injury_types:
  concussion:
    description: "Head injury with cognitive impact"
    base_probability: 0.15  # 15% of injuries
    severity_distribution:
      minor: 0.4      # 40% of concussions
      moderate: 0.4   # 40% of concussions
      severe: 0.2     # 20% of concussions
    recovery_curves:
      minor: "1-2 weeks"
      moderate: "3-6 weeks"
      severe: "7-12 weeks"
  
  sprain:
    description: "Joint injury with ligament damage"
    base_probability: 0.40  # 40% of injuries
    severity_distribution:
      minor: 0.5      # 50% of sprains
      moderate: 0.3   # 30% of sprains
      severe: 0.2     # 20% of sprains
    recovery_curves:
      minor: "1-3 weeks"
      moderate: "4-8 weeks"
      severe: "9-16 weeks"
  
  strain:
    description: "Muscle injury with tissue damage"
    base_probability: 0.30  # 30% of injuries
    severity_distribution:
      minor: 0.6      # 60% of strains
      moderate: 0.3   # 30% of strains
      severe: 0.1     # 10% of strains
    recovery_curves:
      minor: "1-2 weeks"
      moderate: "3-6 weeks"
      severe: "7-12 weeks"
  
  fracture:
    description: "Bone injury requiring immobilization"
    base_probability: 0.10  # 10% of injuries
    severity_distribution:
      minor: 0.3      # 30% of fractures
      moderate: 0.4   # 40% of fractures
      severe: 0.3     # 30% of fractures
    recovery_curves:
      minor: "4-8 weeks"
      moderate: "8-16 weeks"
      severe: "16-24 weeks"
  
  other:
    description: "Miscellaneous injuries"
    base_probability: 0.05  # 5% of injuries
    severity_distribution:
      minor: 0.7      # 70% of other injuries
      moderate: 0.2   # 20% of other injuries
      severe: 0.1     # 10% of other injuries
    recovery_curves:
      minor: "1-4 weeks"
      moderate: "4-8 weeks"
      severe: "8-16 weeks"
```

### 4.2 Severity Determination

**USE-INJ-010**: Injury severity MUST be determined probabilistically:

```python
def determine_injury_severity(injury_type, collision_energy, fatigue_levels):
    """Determine injury severity based on type and circumstances"""
    # Get base severity distribution for injury type
    severity_distribution = INJURY_TYPES[injury_type]['severity_distribution']
    
    # Modify distribution based on collision energy
    energy_factor = min(2.0, collision_energy / 500.0)  # Normalize to 500J baseline
    
    # Modify distribution based on fatigue
    fatigue_factor = 1.0 + (fatigue_levels['acute'] * 0.3 + fatigue_levels['cumulative'] * 0.2)
    
    # Adjust severity probabilities
    adjusted_distribution = {}
    for severity, base_prob in severity_distribution.items():
        if severity == 'minor':
            adjusted_prob = base_prob / (energy_factor * fatigue_factor)
        elif severity == 'moderate':
            adjusted_prob = base_prob
        else:  # severe
            adjusted_prob = base_prob * energy_factor * fatigue_factor
        
        adjusted_distribution[severity] = max(0.0, min(1.0, adjusted_prob))
    
    # Normalize probabilities
    total_prob = sum(adjusted_distribution.values())
    if total_prob > 0:
        for severity in adjusted_distribution:
            adjusted_distribution[severity] /= total_prob
    
    # Sample severity based on adjusted distribution
    severity = sample_from_distribution(adjusted_distribution)
    
    return severity
```

## 5. Recovery Modeling

### 5.1 Recovery Curves

**USE-INJ-011**: Injury recovery MUST follow realistic curves:

```python
def calculate_recovery_progress(injury_type, severity, days_since_injury, 
                              medical_treatment, player_conditioning):
    """Calculate recovery progress for an injury"""
    # Get base recovery time for injury type and severity
    base_recovery_weeks = INJURY_TYPES[injury_type]['recovery_curves'][severity]
    base_recovery_days = base_recovery_weeks * 7
    
    # Medical treatment factor
    treatment_multipliers = {
        'excellent': 0.7,  # 30% faster recovery
        'good': 0.85,      # 15% faster recovery
        'average': 1.0,    # Standard recovery
        'poor': 1.2,       # 20% slower recovery
        'none': 1.5        # 50% slower recovery
    }
    
    treatment_multiplier = treatment_multipliers.get(medical_treatment, 1.0)
    
    # Player conditioning factor
    conditioning_multipliers = {
        'excellent': 0.8,  # 20% faster recovery
        'good': 0.9,       # 10% faster recovery
        'average': 1.0,    # Standard recovery
        'poor': 1.1,       # 10% slower recovery
        'injured': 1.3     # 30% slower recovery
    }
    
    conditioning_multiplier = conditioning_multipliers.get(player_conditioning, 1.0)
    
    # Calculate adjusted recovery time
    adjusted_recovery_days = base_recovery_days * treatment_multiplier * conditioning_multiplier
    
    # Calculate recovery progress (non-linear curve)
    recovery_progress = 1.0 - math.exp(-days_since_injury / adjusted_recovery_days)
    
    return max(0.0, min(1.0, recovery_progress))
```

### 5.2 Return to Play Probability

**USE-INJ-012**: Return to play probability MUST consider reinjury risk:

```python
def calculate_return_to_play_probability(recovery_progress, injury_type, 
                                       player_age, injury_history):
    """Calculate probability of successful return to play"""
    # Base return probability based on recovery progress
    base_return_prob = recovery_progress
    
    # Injury type factor (some injuries have higher reinjury risk)
    reinjury_risk_by_type = {
        'concussion': 0.2,      # 20% reinjury risk
        'sprain': 0.15,         # 15% reinjury risk
        'strain': 0.1,          # 10% reinjury risk
        'fracture': 0.05,       # 5% reinjury risk
        'other': 0.1            # 10% reinjury risk
    }
    
    reinjury_risk = reinjury_risk_by_type.get(injury_type, 0.1)
    
    # Age factor (older players have higher reinjury risk)
    age_factor = 1.0 + (player_age - 22) * 0.02  # 2% increase per year over 22
    age_factor = max(1.0, min(1.5, age_factor))
    
    # Injury history factor
    history_factor = 1.0 + injury_history['severity_score'] * 0.1
    history_factor = max(1.0, min(1.3, history_factor))
    
    # Calculate final return probability
    return_probability = base_return_prob * (1.0 - reinjury_risk * age_factor * history_factor)
    
    return max(0.0, min(1.0, return_probability))
```

## 6. Integration with Other Systems

### 6.1 Body State Integration

**USE-INJ-013**: Injury risk MUST integrate with body state machine:

```python
def integrate_body_state_injury_risk(body_state, injury_context):
    """Integrate body state with injury risk calculation"""
    # Body state affects injury risk
    body_state_multipliers = {
        'STUMBLE_LATE': 2.0,      # Very high risk
        'TWISTING': 1.5,          # High risk
        'STUMBLE_EARLY': 1.3,     # Moderate risk
        'LEANING': 1.2,           # Slight risk
        'NORMAL': 1.0,            # Baseline risk
        'LOWERED_PAD': 0.9,       # Slightly reduced risk
        'WRAP_READY': 0.8         # Reduced risk
    }
    
    body_multiplier = body_state_multipliers.get(body_state['current_state'], 1.0)
    
    # Unsafe head position detection
    unsafe_head = detect_unsafe_head_position(
        body_state['current_state'],
        body_state['torso_pitch_deg'],
        body_state['torso_roll_deg'],
        injury_context['impact_angle']
    )
    
    # Update injury context
    injury_context['body_state_multiplier'] = body_multiplier
    injury_context['unsafe_head_position'] = unsafe_head
    
    return injury_context
```

### 6.2 Fatigue Integration

**USE-INJ-014**: Injury risk MUST integrate with fatigue model:

```python
def integrate_fatigue_injury_risk(fatigue_levels, injury_context):
    """Integrate fatigue levels with injury risk calculation"""
    # Fatigue increases injury susceptibility
    acute_fatigue_multiplier = 1.0 + fatigue_levels['acute'] * 0.5
    cumulative_fatigue_multiplier = 1.0 + fatigue_levels['cumulative'] * 0.3
    
    # Update injury context
    injury_context['acute_fatigue_multiplier'] = acute_fatigue_multiplier
    injury_context['cumulative_fatigue_multiplier'] = cumulative_fatigue_multiplier
    
    return injury_context
```

## 7. Validation and Testing

### 7.1 Injury Risk Validation

**USE-INJ-015**: Injury risk calculations MUST be validated:

#### Test Case 1: High-Energy Collision
```python
def test_high_energy_collision_injury_risk():
    """Test injury risk with high-energy collision"""
    injury_context = {
        'base_rate': 0.01,
        'collision_energy': 800,  # High energy
        'unsafe_head_position': True,
        'twist_load': 0.8,
        'acute_fatigue': 0.7,
        'cumulative_fatigue': 0.5,
        'context_multipliers': {'field_position': 1.2, 'weather': 1.1}
    }
    
    injury_probability = calculate_injury_probability(**injury_context)
    
    # Should be high injury probability
    assert injury_probability > 0.05
    assert injury_probability <= 1.0
```

#### Test Case 2: Low-Energy Contact
```python
def test_low_energy_contact_injury_risk():
    """Test injury risk with low-energy contact"""
    injury_context = {
        'base_rate': 0.01,
        'collision_energy': 100,  # Low energy
        'unsafe_head_position': False,
        'twist_load': 0.2,
        'acute_fatigue': 0.2,
        'cumulative_fatigue': 0.1,
        'context_multipliers': {'field_position': 1.0, 'weather': 1.0}
    }
    
    injury_probability = calculate_injury_probability(**injury_context)
    
    # Should be low injury probability
    assert injury_probability < 0.02
    assert injury_probability >= 0.0
```

### 7.2 Recovery Validation

**USE-INJ-016**: Recovery modeling MUST be validated:

#### Test Case 1: Recovery Progress
```python
def test_recovery_progress():
    """Test recovery progress calculation"""
    recovery_progress = calculate_recovery_progress(
        injury_type='sprain',
        severity='moderate',
        days_since_injury=14,  # 2 weeks
        medical_treatment='good',
        player_conditioning='excellent'
    )
    
    # Should show significant recovery after 2 weeks
    assert recovery_progress > 0.3
    assert recovery_progress < 0.8
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
