# Test Harness and Validation Specification
**Document ID**: USE-TST-001  
**Version**: 1.0  
**Last Updated**: 2024-12-19  
**Status**: Active

## Executive Summary

The Test Harness and Validation Specification defines the comprehensive testing framework for the USE Engine, including golden scenarios, property-based tests, integration validation, and performance benchmarks. This specification ensures that all four realism systems (body state, spatial awareness, fatigue, and injury risk) work together correctly and produce realistic outcomes.

## 1. Test Architecture

### 1.1 Test Categories

**USE-TST-002**: The test harness MUST include the following test categories:

```yaml
test_categories:
  unit_tests:
    description: "Individual component testing"
    scope: "Single system validation"
    frequency: "Every commit"
    examples:
      - "Body state transition validation"
      - "Leverage index calculation"
      - "Fatigue accumulation formulas"
      - "Injury risk computation"
  
  integration_tests:
    description: "Cross-system interaction testing"
    scope: "Multiple system validation"
    frequency: "Every commit"
    examples:
      - "Body state ↔ Spatial context integration"
      - "Fatigue ↔ Injury risk coupling"
      - "Spatial context ↔ Performance impact"
      - "Full system data flow"
  
  property_based_tests:
    description: "System invariant validation"
    scope: "Mathematical and logical properties"
    frequency: "Daily"
    examples:
      - "Energy conservation"
      - "Probability bounds"
      - "Monotonicity properties"
      - "Physical constraints"
  
  golden_scenarios:
    description: "Real-world scenario validation"
    scope: "End-to-end realistic situations"
    frequency: "Weekly"
    examples:
      - "Sideline tackle with good leverage"
      - "Open field tackle with poor leverage"
      - "High contact game fatigue accumulation"
      - "Injury sequence validation"
  
  performance_tests:
    description: "Performance and scalability validation"
    scope: "System performance under load"
    frequency: "Daily"
    examples:
      - "Real-time simulation performance"
      - "Memory usage validation"
      - "Concurrent user simulation"
      - "Scalability benchmarks"
```

### 1.2 Test Execution Framework

**USE-TST-003**: Test execution MUST follow a structured framework:

```python
class USE_TestHarness:
    """Comprehensive test harness for USE Engine"""
    
    def __init__(self):
        self.test_results = {}
        self.performance_metrics = {}
        self.validation_reports = {}
    
    def run_unit_tests(self):
        """Execute all unit tests"""
        test_suites = [
            BodyStateUnitTests(),
            SpatialAwarenessUnitTests(),
            FatigueModelUnitTests(),
            InjuryRiskUnitTests()
        ]
        
        for suite in test_suites:
            results = suite.run_all_tests()
            self.test_results[f"unit_{suite.name}"] = results
    
    def run_integration_tests(self):
        """Execute all integration tests"""
        test_suites = [
            BodyStateIntegrationTests(),
            FatigueIntegrationTests(),
            InjuryRiskIntegrationTests(),
            FullSystemIntegrationTests()
        ]
        
        for suite in test_suites:
            results = suite.run_all_tests()
            self.test_results[f"integration_{suite.name}"] = results
    
    def run_property_tests(self):
        """Execute all property-based tests"""
        property_tests = [
            EnergyConservationTests(),
            ProbabilityBoundsTests(),
            MonotonicityTests(),
            PhysicalConstraintTests()
        ]
        
        for test in property_tests:
            results = test.run_property_validation()
            self.test_results[f"property_{test.name}"] = results
    
    def run_golden_scenarios(self):
        """Execute all golden scenario tests"""
        scenarios = [
            SidelineTackleScenario(),
            OpenFieldTackleScenario(),
            HighContactGameScenario(),
            InjurySequenceScenario()
        ]
        
        for scenario in scenarios:
            results = scenario.validate_scenario()
            self.test_results[f"scenario_{scenario.name}"] = results
```

## 2. Golden Scenarios

### 2.1 Sideline Tackle Scenario

**USE-TST-004**: Sideline tackle with good leverage MUST produce realistic outcomes:

```python
class SidelineTackleScenario:
    """Golden scenario: Sideline tackle with good leverage"""
    
    def setup_scenario(self):
        """Setup sideline tackle scenario"""
        return {
            'ball_carrier': {
                'position': {'x': 1.0, 'y': 25.0},  # Near left sideline
                'velocity': {'x': -2.0, 'y': 0.0},   # Moving toward sideline
                'body_state': 'SPRINTING',
                'fatigue': {'acute': 0.3, 'cumulative': 0.2}
            },
            'tackler': {
                'position': {'x': 2.0, 'y': 25.0},   # Close to ball carrier
                'velocity': {'x': -3.0, 'y': 0.0},   # Faster than ball carrier
                'body_state': 'TACKLE_PREP',
                'fatigue': {'acute': 0.4, 'cumulative': 0.3}
            },
            'environment': {
                'field_zone': 'boundary_band',
                'distance_to_sideline': 1.0,
                'weather': {'temperature': 70, 'humidity': 50},
                'surface': 'grass'
            }
        }
    
    def validate_scenario(self):
        """Validate sideline tackle scenario outcomes"""
        scenario = self.setup_scenario()
        
        # Calculate expected outcomes
        expected_outcomes = {
            'leverage_index': 0.8,           # High leverage near sideline
            'tackle_success_probability': 0.75,  # High success rate
            'injury_risk': 0.02,             # Low injury risk
            'fatigue_increase': 0.08,        # Moderate fatigue increase
            'sideline_benefit': 0.20         # Significant sideline benefit
        }
        
        # Execute scenario
        actual_outcomes = self.execute_scenario(scenario)
        
        # Validate outcomes
        validation_results = {}
        for metric, expected in expected_outcomes.items():
            actual = actual_outcomes[metric]
            tolerance = self.get_tolerance(metric)
            
            validation_results[metric] = {
                'expected': expected,
                'actual': actual,
                'tolerance': tolerance,
                'passed': abs(actual - expected) <= tolerance
            }
        
        return validation_results
    
    def get_tolerance(self, metric):
        """Get tolerance for metric validation"""
        tolerances = {
            'leverage_index': 0.05,
            'tackle_success_probability': 0.05,
            'injury_risk': 0.005,
            'fatigue_increase': 0.02,
            'sideline_benefit': 0.05
        }
        return tolerances.get(metric, 0.01)
```

### 2.2 Open Field Tackle Scenario

**USE-TST-005**: Open field tackle with poor leverage MUST produce realistic outcomes:

```python
class OpenFieldTackleScenario:
    """Golden scenario: Open field tackle with poor leverage"""
    
    def setup_scenario(self):
        """Setup open field tackle scenario"""
        return {
            'ball_carrier': {
                'position': {'x': 26.0, 'y': 25.0},  # Near field center
                'velocity': {'x': 0.0, 'y': 5.0},     # Moving forward
                'body_state': 'SPRINTING',
                'fatigue': {'acute': 0.2, 'cumulative': 0.1}
            },
            'tackler': {
                'position': {'x': 26.0, 'y': 20.0},   # Behind ball carrier
                'velocity': {'x': 0.0, 'y': 6.0},     # Catching up
                'body_state': 'SPRINTING',
                'fatigue': {'acute': 0.5, 'cumulative': 0.3}
            },
            'environment': {
                'field_zone': 'open_field',
                'distance_to_sideline': 26.0,
                'weather': {'temperature': 75, 'humidity': 60},
                'surface': 'turf'
            }
        }
    
    def validate_scenario(self):
        """Validate open field tackle scenario outcomes"""
        scenario = self.setup_scenario()
        
        # Calculate expected outcomes
        expected_outcomes = {
            'leverage_index': 0.2,           # Poor leverage in open field
            'tackle_success_probability': 0.28,  # Low success rate
            'injury_risk': 0.015,            # Low injury risk
            'fatigue_increase': 0.06,        # Low fatigue increase
            'open_field_penalty': 0.10       # Open field penalty
        }
        
        # Execute scenario
        actual_outcomes = self.execute_scenario(scenario)
        
        # Validate outcomes
        validation_results = {}
        for metric, expected in expected_outcomes.items():
            actual = actual_outcomes[metric]
            tolerance = self.get_tolerance(metric)
            
            validation_results[metric] = {
                'expected': expected,
                'actual': actual,
                'tolerance': tolerance,
                'passed': abs(actual - expected) <= tolerance
            }
        
        return validation_results
```

### 2.3 High Contact Game Scenario

**USE-TST-006**: High contact game MUST produce realistic fatigue accumulation:

```python
class HighContactGameScenario:
    """Golden scenario: High contact game with fatigue accumulation"""
    
    def setup_scenario(self):
        """Setup high contact game scenario"""
        return {
            'game_conditions': {
                'duration': '4 quarters',
                'contact_frequency': 'high',
                'environmental_factors': {'temperature': 85, 'humidity': 70},
                'surface': 'turf'
            },
            'player_initial_state': {
                'fatigue_acute': 0.1,
                'fatigue_cumulative': 0.2,
                'conditioning': 'good',
                'position': 'linebacker'
            },
            'contact_sequence': [
                {'energy': 400, 'body_state': 'TACKLE_PREP', 'time': 300},
                {'energy': 600, 'body_state': 'SPRINTING', 'time': 600},
                {'energy': 300, 'body_state': 'PLANT_AND_DRIVE', 'time': 900},
                {'energy': 500, 'body_state': 'TACKLE_PREP', 'time': 1200}
            ]
        }
    
    def validate_scenario(self):
        """Validate high contact game scenario outcomes"""
        scenario = self.setup_scenario()
        
        # Calculate expected outcomes
        expected_outcomes = {
            'end_game_speed_drop': 0.15,     # 15% speed reduction
            'next_week_cumulative_fatigue': 0.35,  # Elevated cumulative fatigue
            'injury_incidence': 0.025,       # 2.5% injury rate
            'total_contact_load': 1800,      # High total contact load
            'recovery_time': 72             # 72 hours to recover acute fatigue
        }
        
        # Execute scenario
        actual_outcomes = self.execute_scenario(scenario)
        
        # Validate outcomes
        validation_results = {}
        for metric, expected in expected_outcomes.items():
            actual = actual_outcomes[metric]
            tolerance = self.get_tolerance(metric)
            
            validation_results[metric] = {
                'expected': expected,
                'actual': actual,
                'tolerance': tolerance,
                'passed': abs(actual - expected) <= tolerance
            }
        
        return validation_results
```

## 3. Property-Based Tests

### 3.1 Energy Conservation Property

**USE-TST-007**: The system MUST conserve energy across all interactions:

```python
class EnergyConservationTests:
    """Property-based tests for energy conservation"""
    
    @given(
        collision_energy=st.floats(min_value=0.0, max_value=1000.0),
        fatigue_level=st.floats(min_value=0.0, max_value=1.0),
        body_state=st.sampled_from(list(BodyState))
    )
    def test_energy_conservation_property(self, collision_energy, fatigue_level, body_state):
        """Test that total energy is conserved in fatigue calculations"""
        # Calculate fatigue increase from collision
        fatigue_increase = calculate_fatigue_increase(collision_energy, body_state)
        
        # Calculate injury risk from collision
        injury_risk = calculate_injury_risk(collision_energy, fatigue_level, body_state)
        
        # Calculate energy dissipation
        energy_dissipation = calculate_energy_dissipation(collision_energy)
        
        # Total energy should be conserved
        total_energy_used = fatigue_increase + injury_risk + energy_dissipation
        
        # Should not exceed input energy (allowing for small numerical errors)
        assert total_energy_used <= collision_energy * 1.001
        
        # Should not be significantly less than input energy
        assert total_energy_used >= collision_energy * 0.95
```

### 3.2 Probability Bounds Property

**USE-TST-008**: All probabilities MUST remain within valid bounds:

```python
class ProbabilityBoundsTests:
    """Property-based tests for probability bounds"""
    
    @given(
        leverage_index=st.floats(min_value=0.0, max_value=1.0),
        mass_difference=st.floats(min_value=-50.0, max_value=50.0),
        momentum_difference=st.floats(min_value=-100.0, max_value=100.0)
    )
    def test_tackle_probability_bounds(self, leverage_index, mass_difference, momentum_difference):
        """Test that tackle success probability remains in valid bounds"""
        tackle_probability = calculate_tackle_probability(
            leverage_index, mass_difference, momentum_difference
        )
        
        # Probability must be between 0 and 1
        assert 0.0 <= tackle_probability <= 1.0
        
        # Zero leverage should result in low probability
        if leverage_index == 0.0:
            assert tackle_probability < 0.5
        
        # Perfect leverage should result in high probability
        if leverage_index == 1.0:
            assert tackle_probability > 0.5
    
    @given(
        collision_energy=st.floats(min_value=0.0, max_value=1000.0),
        fatigue_level=st.floats(min_value=0.0, max_value=1.0),
        body_state=st.sampled_from(list(BodyState))
    )
    def test_injury_probability_bounds(self, collision_energy, fatigue_level, body_state):
        """Test that injury probability remains in valid bounds"""
        injury_probability = calculate_injury_probability(
            collision_energy, fatigue_level, body_state
        )
        
        # Probability must be between 0 and 1
        assert 0.0 <= injury_probability <= 1.0
        
        # Zero collision energy should result in baseline injury risk only
        if collision_energy == 0.0:
            assert injury_probability <= 0.01  # Baseline risk
```

### 3.3 Monotonicity Property

**USE-TST-009**: System responses MUST be monotonic where appropriate:

```python
class MonotonicityTests:
    """Property-based tests for monotonicity properties"""
    
    @given(
        contact_load=st.floats(min_value=0.0, max_value=500.0),
        play_duration=st.floats(min_value=0.0, max_value=60.0)
    )
    def test_fatigue_monotonicity(self, contact_load, play_duration):
        """Test that fatigue increases monotonically with contact load and duration"""
        initial_fatigue = 0.1
        
        # Test monotonicity with respect to contact load
        fatigue_low = calculate_fatigue(initial_fatigue, contact_load * 0.5, play_duration)
        fatigue_high = calculate_fatigue(initial_fatigue, contact_load, play_duration)
        
        assert fatigue_high >= fatigue_low
        
        # Test monotonicity with respect to play duration
        fatigue_short = calculate_fatigue(initial_fatigue, contact_load, play_duration * 0.5)
        fatigue_long = calculate_fatigue(initial_fatigue, contact_load, play_duration)
        
        assert fatigue_long >= fatigue_short
    
    @given(
        leverage_index=st.floats(min_value=0.0, max_value=1.0),
        sideline_benefit=st.floats(min_value=0.0, max_value=0.25)
    )
    def test_tackle_success_monotonicity(self, leverage_index, sideline_benefit):
        """Test that tackle success increases monotonically with leverage and sideline benefit"""
        base_probability = 0.5
        
        # Test monotonicity with respect to leverage
        prob_low = calculate_tackle_success(base_probability, leverage_index * 0.5, sideline_benefit)
        prob_high = calculate_tackle_success(base_probability, leverage_index, sideline_benefit)
        
        assert prob_high >= prob_low
        
        # Test monotonicity with respect to sideline benefit
        prob_no_benefit = calculate_tackle_success(base_probability, leverage_index, 0.0)
        prob_with_benefit = calculate_tackle_success(base_probability, leverage_index, sideline_benefit)
        
        assert prob_with_benefit >= prob_no_benefit
```

## 4. Integration Tests

### 4.1 Body State Integration Tests

**USE-TST-010**: Body state machine MUST integrate correctly with other systems:

```python
class BodyStateIntegrationTests:
    """Integration tests for body state machine"""
    
    def test_body_state_spatial_integration(self):
        """Test integration between body state and spatial context"""
        # Setup test scenario
        body_state = 'LOWERED_PAD'
        spatial_context = {
            'field_zone': 'boundary_band',
            'distance_to_sideline': 0.5,
            'sideline_benefit': 0.20
        }
        
        # Calculate leverage with spatial context
        leverage_index = calculate_leverage_with_spatial_context(body_state, spatial_context)
        
        # Should be high leverage due to body state and spatial context
        assert leverage_index > 0.7
        assert leverage_index <= 1.0
    
    def test_body_state_fatigue_integration(self):
        """Test integration between body state and fatigue model"""
        # Setup test scenario
        body_state = 'SPRINTING'
        fatigue_levels = {'acute': 0.8, 'cumulative': 0.6}
        
        # Calculate state transition probability with fatigue
        transition_prob = calculate_transition_probability_with_fatigue(body_state, fatigue_levels)
        
        # Should be reduced due to high fatigue
        assert transition_prob < 0.8
        assert transition_prob >= 0.1
```

### 4.2 Fatigue Integration Tests

**USE-TST-011**: Fatigue model MUST integrate correctly with other systems:

```python
class FatigueIntegrationTests:
    """Integration tests for fatigue model"""
    
    def test_fatigue_injury_integration(self):
        """Test integration between fatigue and injury risk"""
        # Setup test scenario
        fatigue_levels = {'acute': 0.9, 'cumulative': 0.7}
        collision_energy = 500
        
        # Calculate injury risk with fatigue
        injury_risk = calculate_injury_risk_with_fatigue(collision_energy, fatigue_levels)
        
        # Should be elevated due to high fatigue
        assert injury_risk > 0.02
        assert injury_risk <= 0.1
    
    def test_fatigue_performance_integration(self):
        """Test integration between fatigue and performance"""
        # Setup test scenario
        fatigue_levels = {'acute': 0.8, 'cumulative': 0.5}
        
        # Calculate performance modifiers
        performance_modifiers = calculate_fatigue_performance_impact(fatigue_levels)
        
        # All modifiers should be reduced
        for attribute, modifier in performance_modifiers.items():
            assert modifier < 1.0
            assert modifier >= 0.5
```

## 5. Performance Tests

### 5.1 Real-Time Performance Tests

**USE-TST-012**: The system MUST meet real-time performance requirements:

```python
class PerformanceTests:
    """Performance tests for USE Engine"""
    
    def test_state_transition_performance(self):
        """Test state transition performance"""
        # Setup performance test
        num_transitions = 10000
        start_time = time.time()
        
        # Execute state transitions
        for i in range(num_transitions):
            body_state = random.choice(list(BodyState))
            conditions = generate_random_conditions()
            new_state = transition_body_state(body_state, conditions)
        
        end_time = time.time()
        total_time = end_time - start_time
        avg_time_per_transition = total_time / num_transitions
        
        # Should meet performance requirements
        assert avg_time_per_transition <= 0.001  # 1ms per transition
    
    def test_fatigue_calculation_performance(self):
        """Test fatigue calculation performance"""
        # Setup performance test
        num_calculations = 10000
        start_time = time.time()
        
        # Execute fatigue calculations
        for i in range(num_calculations):
            play_data = generate_random_play_data()
            fatigue_increase = calculate_fatigue_increase(**play_data)
        
        end_time = time.time()
        total_time = end_time - start_time
        avg_time_per_calculation = total_time / num_calculations
        
        # Should meet performance requirements
        assert avg_time_per_calculation <= 0.005  # 5ms per calculation
```

### 5.2 Memory Usage Tests

**USE-TST-013**: The system MUST meet memory usage requirements:

```python
class MemoryUsageTests:
    """Memory usage tests for USE Engine"""
    
    def test_memory_usage_per_player(self):
        """Test memory usage per player"""
        import psutil
        import os
        
        # Get initial memory usage
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Create player state
        player_state = create_player_state()
        
        # Get memory usage after player creation
        final_memory = process.memory_info().rss
        memory_used = final_memory - initial_memory
        
        # Should meet memory requirements
        assert memory_used <= 1024  # 1KB per player
    
    def test_memory_usage_scalability(self):
        """Test memory usage scalability"""
        import psutil
        import os
        
        # Get initial memory usage
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Create multiple player states
        num_players = 1000
        player_states = []
        
        for i in range(num_players):
            player_state = create_player_state()
            player_states.append(player_state)
        
        # Get memory usage after creating players
        final_memory = process.memory_info().rss
        memory_used = final_memory - initial_memory
        memory_per_player = memory_used / num_players
        
        # Should meet scalability requirements
        assert memory_per_player <= 2.0  # 2KB per player for scalability
```

## 6. Validation Framework

### 6.1 Test Result Aggregation

**USE-TST-014**: Test results MUST be aggregated and reported:

```python
class TestResultAggregator:
    """Aggregate and report test results"""
    
    def __init__(self):
        self.results = {}
        self.performance_metrics = {}
        self.validation_reports = {}
    
    def aggregate_results(self, test_results):
        """Aggregate test results"""
        for test_category, results in test_results.items():
            total_tests = len(results)
            passed_tests = sum(1 for result in results if result['passed'])
            failed_tests = total_tests - passed_tests
            
            self.results[test_category] = {
                'total': total_tests,
                'passed': passed_tests,
                'failed': failed_tests,
                'pass_rate': passed_tests / total_tests if total_tests > 0 else 0.0
            }
    
    def generate_report(self):
        """Generate comprehensive test report"""
        report = {
            'summary': {
                'total_tests': sum(result['total'] for result in self.results.values()),
                'total_passed': sum(result['passed'] for result in self.results.values()),
                'total_failed': sum(result['failed'] for result in self.results.values()),
                'overall_pass_rate': 0.0
            },
            'category_results': self.results,
            'performance_metrics': self.performance_metrics,
            'validation_reports': self.validation_reports,
            'recommendations': self.generate_recommendations()
        }
        
        # Calculate overall pass rate
        total_tests = report['summary']['total_tests']
        if total_tests > 0:
            report['summary']['overall_pass_rate'] = report['summary']['total_passed'] / total_tests
        
        return report
    
    def generate_recommendations(self):
        """Generate recommendations based on test results"""
        recommendations = []
        
        # Check pass rates
        for category, result in self.results.items():
            if result['pass_rate'] < 0.95:
                recommendations.append(f"Improve {category} test coverage: {result['pass_rate']:.1%} pass rate")
        
        # Check performance metrics
        for metric, value in self.performance_metrics.items():
            if value > self.get_performance_threshold(metric):
                recommendations.append(f"Optimize {metric}: {value} exceeds threshold")
        
        return recommendations
```

### 6.2 Continuous Validation

**USE-TST-015**: The system MUST support continuous validation:

```python
class ContinuousValidator:
    """Continuous validation framework"""
    
    def __init__(self):
        self.validation_rules = self.load_validation_rules()
        self.alert_thresholds = self.load_alert_thresholds()
    
    def validate_continuous_metrics(self, metrics):
        """Validate continuous metrics"""
        violations = []
        
        for metric_name, metric_value in metrics.items():
            if metric_name in self.validation_rules:
                rule = self.validation_rules[metric_name]
                
                if not self.check_rule(metric_value, rule):
                    violations.append({
                        'metric': metric_name,
                        'value': metric_value,
                        'rule': rule,
                        'severity': 'warning' if rule.get('severity') == 'warning' else 'critical'
                    })
        
        return violations
    
    def check_rule(self, value, rule):
        """Check if value satisfies rule"""
        rule_type = rule.get('type', 'range')
        
        if rule_type == 'range':
            min_val = rule.get('min')
            max_val = rule.get('max')
            return (min_val is None or value >= min_val) and (max_val is None or value <= max_val)
        
        elif rule_type == 'threshold':
            threshold = rule.get('threshold')
            operator = rule.get('operator', '<=')
            
            if operator == '<=':
                return value <= threshold
            elif operator == '>=':
                return value >= threshold
            elif operator == '<':
                return value < threshold
            elif operator == '>':
                return value > threshold
        
        return True
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
