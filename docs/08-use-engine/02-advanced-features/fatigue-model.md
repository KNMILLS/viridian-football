# Fatigue Model Specification
**Document ID**: USE-FAT-001  
**Version**: 1.0  
**Last Updated**: 2024-12-19  
**Status**: Active

## Executive Summary

The Fatigue Model is a core component of the USE Engine that implements two-timescale fatigue with cumulative wear. The model tracks acute (in-game) fatigue and cumulative (seasonal) fatigue, integrating contact load and environmental factors to provide realistic fatigue progression that affects player performance and injury susceptibility.

## 1. Two-Timescale Architecture

### 1.1 Acute Fatigue (F_acute)

**USE-FAT-002**: Acute fatigue MUST represent in-game fatigue that accumulates during plays and recovers between plays:

```yaml
acute_fatigue:
  description: "In-game fatigue that accumulates during plays"
  range: [0.0, 1.0]
  units: "normalized fatigue level"
  recovery_scope: "Between plays and games"
  impact: "Affects speed, reaction time, and decision-making"
  
  accumulation_factors:
    - "Play duration and intensity"
    - "Contact load from collisions"
    - "Environmental factors (heat, altitude)"
    - "Player conditioning and stamina"
  
  recovery_factors:
    - "Time between plays"
    - "Player conditioning"
    - "Environmental conditions"
    - "Medical treatment and hydration"
```

### 1.2 Cumulative Fatigue (F_cum)

**USE-FAT-003**: Cumulative fatigue MUST represent season-long fatigue that accumulates across games:

```yaml
cumulative_fatigue:
  description: "Season-long fatigue that accumulates across games"
  range: [0.0, 1.0]
  units: "normalized fatigue level"
  recovery_scope: "During bye weeks and off-season"
  impact: "Affects injury susceptibility and long-term performance"
  
  accumulation_factors:
    - "Total contact load over season"
    - "Snap count and playing time"
    - "Travel and turnaround time"
    - "Practice intensity and frequency"
  
  recovery_factors:
    - "Bye weeks"
    - "Off-season rest"
    - "Medical treatment and rehabilitation"
    - "Conditioning and nutrition programs"
```

## 2. Fatigue Accumulation Models

### 2.1 Acute Fatigue Accumulation

**USE-FAT-004**: Acute fatigue MUST accumulate based on play intensity and duration:

```python
def calculate_acute_fatigue_increase(play_intensity, play_duration, contact_load, environmental_factors):
    """Calculate acute fatigue increase from a single play"""
    # Base fatigue rate per second
    base_fatigue_rate = 0.02  # fatigue units per second
    
    # Intensity multiplier based on body state
    intensity_multipliers = {
        'SPRINTING': 2.0,
        'JOGGING': 1.0,
        'BACKPEDAL': 1.2,
        'SHUFFLE': 1.1,
        'PLANT_AND_DRIVE': 2.5,
        'STUMBLE_EARLY': 1.5,
        'STUMBLE_LATE': 2.0,
        'BALANCED_RECOVERY': 1.3
    }
    
    intensity_multiplier = intensity_multipliers.get(play_intensity, 1.0)
    
    # Contact load factor
    contact_load_factor = 1.0 + (contact_load / 1000.0)  # 1000J baseline
    
    # Environmental factor
    environmental_multiplier = calculate_environmental_multiplier(environmental_factors)
    
    # Calculate fatigue increase
    fatigue_increase = (base_fatigue_rate * 
                       play_duration * 
                       intensity_multiplier * 
                       contact_load_factor * 
                       environmental_multiplier)
    
    return min(0.1, fatigue_increase)  # Cap at 0.1 per play
```

### 2.2 Cumulative Fatigue Accumulation

**USE-FAT-005**: Cumulative fatigue MUST accumulate based on game contact load and playing time:

```python
def calculate_cumulative_fatigue_increase(game_contact_load, snap_count, travel_factor, practice_intensity):
    """Calculate cumulative fatigue increase from a game"""
    # Base cumulative fatigue per game
    base_game_fatigue = 0.05  # fatigue units per game
    
    # Contact load factor (normalized by expected contact per game)
    expected_contact_per_game = 2000  # Joules
    contact_factor = 1.0 + (game_contact_load / expected_contact_per_game)
    
    # Snap count factor (normalized by expected snaps per game)
    expected_snaps_per_game = 60
    snap_factor = 1.0 + (snap_count / expected_snaps_per_game - 1.0) * 0.5
    
    # Travel factor (short week, long travel, etc.)
    travel_multiplier = 1.0 + travel_factor * 0.2
    
    # Practice intensity factor
    practice_multiplier = 1.0 + practice_intensity * 0.1
    
    # Calculate cumulative fatigue increase
    fatigue_increase = (base_game_fatigue * 
                       contact_factor * 
                       snap_factor * 
                       travel_multiplier * 
                       practice_multiplier)
    
    return min(0.15, fatigue_increase)  # Cap at 0.15 per game
```

### 2.3 Contact Load Integration

**USE-FAT-006**: Contact load MUST be integrated into fatigue calculations:

```python
def calculate_contact_load(collision_energy, body_state, impact_angle):
    """Calculate contact load from collision"""
    # Base contact load from collision energy
    base_contact_load = collision_energy  # Joules
    
    # Body state multiplier
    body_state_multipliers = {
        'LOWERED_PAD': 1.2,      # More impact absorbed
        'UPRIGHT': 1.0,          # Standard impact
        'LEANING': 1.1,          # Slightly more impact
        'TWISTING': 1.3,         # Higher injury risk
        'STUMBLE_LATE': 1.5,     # Very high impact
        'ON_GROUND_PRONE': 0.8   # Less impact when grounded
    }
    
    body_multiplier = body_state_multipliers.get(body_state, 1.0)
    
    # Impact angle factor (head-on vs. glancing)
    angle_factor = 1.0 + (abs(impact_angle) / 90.0) * 0.5
    
    # Calculate total contact load
    contact_load = base_contact_load * body_multiplier * angle_factor
    
    return contact_load
```

## 3. Fatigue Recovery Models

### 3.1 Acute Fatigue Recovery

**USE-FAT-007**: Acute fatigue MUST recover between plays and games:

```python
def calculate_acute_fatigue_recovery(current_fatigue, time_elapsed, player_conditioning, environmental_factors):
    """Calculate acute fatigue recovery"""
    # Base recovery rate per minute
    base_recovery_rate = 0.1  # fatigue units per minute
    
    # Player conditioning factor
    conditioning_multipliers = {
        'excellent': 1.5,
        'good': 1.2,
        'average': 1.0,
        'poor': 0.8,
        'injured': 0.5
    }
    
    conditioning_multiplier = conditioning_multipliers.get(player_conditioning, 1.0)
    
    # Environmental factor (temperature, humidity, etc.)
    environmental_multiplier = calculate_recovery_environmental_multiplier(environmental_factors)
    
    # Time-based recovery (non-linear)
    recovery_time_factor = 1.0 - math.exp(-time_elapsed / 60.0)  # 1 hour time constant
    
    # Calculate recovery
    recovery_amount = (base_recovery_rate * 
                      time_elapsed * 
                      conditioning_multiplier * 
                      environmental_multiplier * 
                      recovery_time_factor)
    
    # Apply recovery
    new_fatigue = max(0.0, current_fatigue - recovery_amount)
    
    return new_fatigue
```

### 3.2 Cumulative Fatigue Recovery

**USE-FAT-008**: Cumulative fatigue MUST recover during rest periods:

```python
def calculate_cumulative_fatigue_recovery(current_fatigue, rest_days, medical_treatment, conditioning_program):
    """Calculate cumulative fatigue recovery during rest periods"""
    # Base recovery rate per day
    base_recovery_rate = 0.15  # fatigue units per day
    
    # Medical treatment factor
    treatment_multipliers = {
        'excellent': 1.3,
        'good': 1.1,
        'average': 1.0,
        'poor': 0.8,
        'none': 0.6
    }
    
    treatment_multiplier = treatment_multipliers.get(medical_treatment, 1.0)
    
    # Conditioning program factor
    conditioning_multiplier = 1.0 + conditioning_program * 0.2
    
    # Time-based recovery (diminishing returns)
    recovery_efficiency = 1.0 - math.exp(-rest_days / 7.0)  # 1 week time constant
    
    # Calculate recovery
    recovery_amount = (base_recovery_rate * 
                      rest_days * 
                      treatment_multiplier * 
                      conditioning_multiplier * 
                      recovery_efficiency)
    
    # Apply recovery
    new_fatigue = max(0.0, current_fatigue - recovery_amount)
    
    return new_fatigue
```

## 4. Performance Impact Models

### 4.1 Attribute Modification

**USE-FAT-009**: Fatigue MUST affect player attributes:

```python
def calculate_fatigue_performance_impact(acute_fatigue, cumulative_fatigue):
    """Calculate performance impact from fatigue levels"""
    # Performance modifiers for different attributes
    performance_modifiers = {
        'speed': {
            'acute_factor': 0.3,    # Acute fatigue impact on speed
            'cumulative_factor': 0.1,  # Cumulative fatigue impact on speed
            'base_modifier': 1.0
        },
        'reaction_time': {
            'acute_factor': 0.2,    # Acute fatigue impact on reaction
            'cumulative_factor': 0.05,  # Cumulative fatigue impact on reaction
            'base_modifier': 1.0
        },
        'tackle_power': {
            'acute_factor': 0.25,   # Acute fatigue impact on tackle power
            'cumulative_factor': 0.08,  # Cumulative fatigue impact on tackle power
            'base_modifier': 1.0
        },
        'decision_making': {
            'acute_factor': 0.15,   # Acute fatigue impact on decisions
            'cumulative_factor': 0.03,  # Cumulative fatigue impact on decisions
            'base_modifier': 1.0
        }
    }
    
    # Calculate modifiers for each attribute
    modifiers = {}
    for attribute, factors in performance_modifiers.items():
        acute_impact = acute_fatigue * factors['acute_factor']
        cumulative_impact = cumulative_fatigue * factors['cumulative_factor']
        
        total_impact = acute_impact + cumulative_impact
        modifier = factors['base_modifier'] - total_impact
        
        modifiers[attribute] = max(0.5, min(1.0, modifier))  # Bound between 0.5 and 1.0
    
    return modifiers
```

### 4.2 State Transition Impact

**USE-FAT-010**: Fatigue MUST affect body state transitions:

```python
def calculate_fatigue_transition_impact(acute_fatigue, cumulative_fatigue, base_transition_probability):
    """Calculate impact of fatigue on state transition probability"""
    # Fatigue reduces transition probability
    acute_impact = acute_fatigue * 0.3
    cumulative_impact = cumulative_fatigue * 0.1
    
    total_impact = acute_impact + cumulative_impact
    
    # Apply impact to transition probability
    modified_probability = base_transition_probability * (1.0 - total_impact)
    
    return max(0.1, min(1.0, modified_probability))  # Bound between 0.1 and 1.0
```

## 5. Environmental Factors

### 5.1 Temperature Effects

**USE-FAT-011**: Temperature MUST affect fatigue accumulation and recovery:

```python
def calculate_temperature_fatigue_factor(temperature_fahrenheit, humidity_percent):
    """Calculate fatigue factor based on temperature and humidity"""
    # Base temperature factor
    if temperature_fahrenheit < 50:
        # Cold weather - slight increase in fatigue
        temp_factor = 1.1
    elif temperature_fahrenheit < 70:
        # Moderate temperature - normal fatigue
        temp_factor = 1.0
    elif temperature_fahrenheit < 85:
        # Warm weather - increased fatigue
        temp_factor = 1.2
    elif temperature_fahrenheit < 95:
        # Hot weather - significantly increased fatigue
        temp_factor = 1.4
    else:
        # Extreme heat - very high fatigue
        temp_factor = 1.6
    
    # Humidity factor
    if humidity_percent > 80:
        humidity_factor = 1.3
    elif humidity_percent > 60:
        humidity_factor = 1.2
    elif humidity_percent > 40:
        humidity_factor = 1.1
    else:
        humidity_factor = 1.0
    
    # Combined factor
    combined_factor = temp_factor * humidity_factor
    
    return min(2.0, combined_factor)  # Cap at 2.0x
```

### 5.2 Altitude Effects

**USE-FAT-012**: Altitude MUST affect fatigue accumulation:

```python
def calculate_altitude_fatigue_factor(altitude_feet):
    """Calculate fatigue factor based on altitude"""
    if altitude_feet < 1000:
        # Sea level - normal fatigue
        altitude_factor = 1.0
    elif altitude_feet < 3000:
        # Low altitude - slight increase
        altitude_factor = 1.1
    elif altitude_feet < 5000:
        # Moderate altitude - moderate increase
        altitude_factor = 1.2
    elif altitude_feet < 7000:
        # High altitude - significant increase
        altitude_factor = 1.4
    else:
        # Very high altitude - major increase
        altitude_factor = 1.6
    
    return altitude_factor
```

## 6. Fatigue Update Algorithm

### 6.1 Per-Play Update

**USE-FAT-013**: Fatigue MUST be updated after each play:

```python
def update_fatigue_per_play(player_state, play_data, environmental_factors):
    """Update fatigue after a single play"""
    # Calculate acute fatigue increase
    acute_increase = calculate_acute_fatigue_increase(
        play_data['intensity'],
        play_data['duration'],
        play_data['contact_load'],
        environmental_factors
    )
    
    # Update acute fatigue
    player_state['fatigue_acute'] += acute_increase
    player_state['fatigue_acute'] = min(1.0, player_state['fatigue_acute'])
    
    # Calculate performance impact
    performance_modifiers = calculate_fatigue_performance_impact(
        player_state['fatigue_acute'],
        player_state['fatigue_cumulative']
    )
    
    # Apply performance modifiers
    for attribute, modifier in performance_modifiers.items():
        player_state[f'{attribute}_modifier'] = modifier
    
    return player_state
```

### 6.2 Per-Game Update

**USE-FAT-014**: Fatigue MUST be updated after each game:

```python
def update_fatigue_per_game(player_state, game_data, environmental_factors):
    """Update fatigue after a game"""
    # Calculate cumulative fatigue increase
    cumulative_increase = calculate_cumulative_fatigue_increase(
        game_data['total_contact_load'],
        game_data['snap_count'],
        game_data['travel_factor'],
        game_data['practice_intensity']
    )
    
    # Update cumulative fatigue
    player_state['fatigue_cumulative'] += cumulative_increase
    player_state['fatigue_cumulative'] = min(1.0, player_state['fatigue_cumulative'])
    
    # Acute fatigue recovers between games
    recovery_time = game_data['days_until_next_game'] * 24 * 60  # minutes
    player_state['fatigue_acute'] = calculate_acute_fatigue_recovery(
        player_state['fatigue_acute'],
        recovery_time,
        player_state['conditioning'],
        environmental_factors
    )
    
    return player_state
```

## 7. Fatigue Caps and Floors

### 7.1 Acute Fatigue Limits

**USE-FAT-015**: Acute fatigue MUST have appropriate limits:

```python
def apply_acute_fatigue_limits(fatigue_level, player_conditioning):
    """Apply limits to acute fatigue based on player conditioning"""
    # Maximum acute fatigue based on conditioning
    max_fatigue_by_conditioning = {
        'excellent': 0.9,
        'good': 0.85,
        'average': 0.8,
        'poor': 0.7,
        'injured': 0.6
    }
    
    max_fatigue = max_fatigue_by_conditioning.get(player_conditioning, 0.8)
    
    # Apply limits
    limited_fatigue = max(0.0, min(max_fatigue, fatigue_level))
    
    return limited_fatigue
```

### 7.2 Cumulative Fatigue Limits

**USE-FAT-016**: Cumulative fatigue MUST have appropriate limits:

```python
def apply_cumulative_fatigue_limits(fatigue_level, player_age, injury_history):
    """Apply limits to cumulative fatigue based on player factors"""
    # Base maximum cumulative fatigue
    base_max_fatigue = 0.9
    
    # Age factor (older players accumulate fatigue faster)
    age_factor = 1.0 - (player_age - 22) * 0.01  # 1% reduction per year over 22
    age_factor = max(0.7, min(1.0, age_factor))
    
    # Injury history factor
    injury_factor = 1.0 - (injury_history['severity_score'] * 0.1)
    injury_factor = max(0.6, min(1.0, injury_factor))
    
    # Calculate maximum fatigue
    max_fatigue = base_max_fatigue * age_factor * injury_factor
    
    # Apply limits
    limited_fatigue = max(0.0, min(max_fatigue, fatigue_level))
    
    return limited_fatigue
```

## 8. Validation and Testing

### 8.1 Fatigue Accumulation Validation

**USE-FAT-017**: Fatigue accumulation MUST be validated against expected patterns:

#### Test Case 1: High-Intensity Play
```python
def test_high_intensity_fatigue():
    """Test fatigue accumulation during high-intensity play"""
    play_data = {
        'intensity': 'SPRINTING',
        'duration': 10.0,  # seconds
        'contact_load': 500.0,  # Joules
        'environmental_factors': {'temperature': 85, 'humidity': 70}
    }
    
    fatigue_increase = calculate_acute_fatigue_increase(**play_data)
    
    # Should be significant fatigue increase
    assert fatigue_increase > 0.05
    assert fatigue_increase <= 0.1
```

#### Test Case 2: Recovery Between Plays
```python
def test_fatigue_recovery():
    """Test fatigue recovery between plays"""
    current_fatigue = 0.6
    recovery_time = 120  # 2 minutes
    conditioning = 'good'
    environmental_factors = {'temperature': 70, 'humidity': 50}
    
    new_fatigue = calculate_acute_fatigue_recovery(
        current_fatigue, recovery_time, conditioning, environmental_factors
    )
    
    # Should recover some fatigue
    assert new_fatigue < current_fatigue
    assert new_fatigue >= 0.0
```

### 8.2 Performance Impact Validation

**USE-FAT-018**: Performance impact MUST be validated:

#### Test Case 1: High Fatigue Impact
```python
def test_high_fatigue_performance_impact():
    """Test performance impact with high fatigue"""
    acute_fatigue = 0.8
    cumulative_fatigue = 0.6
    
    modifiers = calculate_fatigue_performance_impact(acute_fatigue, cumulative_fatigue)
    
    # All modifiers should be reduced
    for attribute, modifier in modifiers.items():
        assert modifier < 1.0
        assert modifier >= 0.5
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
