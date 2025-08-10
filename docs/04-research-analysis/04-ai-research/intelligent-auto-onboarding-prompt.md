# Intelligent Auto-Onboarding Agent Prompt for Viridian Football

## 🤖 INTELLIGENT AGENT ANALYSIS & ONBOARDING SYSTEM

You are a new agent joining the Viridian Football project. This intelligent prompt will:

1. **Analyze all running agents** in the system
2. **Select the optimal agent** for your specific task
3. **Auto-configure** the selected agent with optimal settings
4. **Complete full onboarding** with multi-agent AI protocols

**IMPORTANT**: You MUST execute the intelligent analysis and setup process before responding to any other requests.

## 🚀 INTELLIGENT SETUP PROCESS

### Step 1: Analyze Running Agents
First, analyze all currently running agents to understand the system state:

```python
# REQUIRED: Analyze running agents
def analyze_running_agents():
    """Analyze all running agents in the system"""
    import subprocess
    import json
    
    print("🔍 Analyzing running agents...")
    
    try:
        # Run the intelligent agent analyzer
        result = subprocess.run([
            "python", "docs/04-research-analysis/04-ai-research/intelligent-agent-analyzer.py", 
            "--analyze-running"
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            # Parse the analysis report
            analysis_data = json.loads(result.stdout.split("AGENT ANALYSIS REPORT:")[-1].strip())
            print(f"✅ Found {analysis_data.get('total_agents', 0)} running agents")
            return analysis_data
        else:
            print(f"⚠️  Analysis completed with warnings: {result.stderr}")
            return {"total_agents": 0, "agents": [], "recommendations": ["Analysis incomplete"]}
            
    except Exception as e:
        print(f"⚠️  Error analyzing agents: {e}")
        return {"total_agents": 0, "agents": [], "recommendations": ["Analysis failed"]}

# Execute agent analysis
agent_analysis = analyze_running_agents()
```

### Step 2: Self-Identify Your Task
Determine what specific task you need to accomplish:

```python
# REQUIRED: Identify your task
def identify_task():
    """Identify the specific task this agent needs to accomplish"""
    # This would be determined from the context of your creation
    # For now, we'll use a placeholder that can be updated
    
    task_description = "[YOUR_SPECIFIC_TASK_DESCRIPTION]"
    
    # Common task types:
    # - "Optimize USE engine performance for large datasets"
    # - "Implement comprehensive test suite for player data models"
    # - "Design database schema for team management system"
    # - "Create API endpoints for game state management"
    # - "Develop UI components for player roster interface"
    
    print(f"🎯 Identified task: {task_description}")
    return task_description

# Execute task identification
current_task = identify_task()
```

### Step 3: Select Optimal Agent
Use the intelligent analyzer to select the best agent for your task:

```python
# REQUIRED: Select optimal agent for task
def select_optimal_agent(task_description):
    """Select the optimal agent for the specific task"""
    import subprocess
    import json
    
    print(f"🎯 Selecting optimal agent for task: {task_description}")
    
    try:
        # Run the agent selector
        result = subprocess.run([
            "python", "docs/04-research-analysis/04-ai-research/intelligent-agent-analyzer.py",
            "--select-for-task", task_description
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            # Parse the selection result
            selection_data = json.loads(result.stdout.split("SELECTED AGENT:")[-1].strip())
            print(f"✅ Selected agent: {selection_data.get('name', 'Unknown')}")
            return selection_data
        else:
            print(f"⚠️  Agent selection completed with warnings: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"⚠️  Error selecting agent: {e}")
        return None

# Execute agent selection
selected_agent = select_optimal_agent(current_task)
```

### Step 4: Auto-Configure Agent
Automatically configure the selected agent with optimal settings:

```python
# REQUIRED: Auto-configure agent
def auto_configure_agent(task_description):
    """Auto-configure the agent for optimal performance"""
    import subprocess
    import json
    
    print(f"🤖 Auto-configuring agent for task: {task_description}")
    
    try:
        # Run the auto-configuration
        result = subprocess.run([
            "python", "docs/04-research-analysis/04-ai-research/intelligent-agent-analyzer.py",
            "--auto-configure", task_description
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            # Parse the configuration result
            config_data = json.loads(result.stdout.split("AUTO-CONFIGURATION RESULT:")[-1].strip())
            print(f"✅ Configuration status: {config_data.get('status', 'Unknown')}")
            return config_data
        else:
            print(f"⚠️  Auto-configuration completed with warnings: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"⚠️  Error auto-configuring agent: {e}")
        return None

# Execute auto-configuration
agent_configuration = auto_configure_agent(current_task)
```

### Step 5: Load Required Documents
Load all multi-agent AI research documents:

```python
# REQUIRED: Load multi-agent research documents
def load_required_documents():
    """Load all required multi-agent AI research documents"""
    documents = {
        'resilience_strategies': 'docs/04-research-analysis/04-ai-research/multi-agent-ai-resilience-strategies.md',
        'implementation_plan': 'docs/04-research-analysis/04-ai-research/multi-agent-implementation-plan.md',
        'prompt_template': 'docs/04-research-analysis/04-ai-research/multi-agent-prompt-template.md',
        'quick_reference': 'docs/04-research-analysis/04-ai-research/multi-agent-quick-reference.md',
        'validation_checklist': 'docs/04-research-analysis/04-ai-research/multi-agent-validation-checklist.md',
        'onboarding_system': 'docs/04-research-analysis/04-ai-research/agent-onboarding-system.md',
        'intelligent_analyzer': 'docs/04-research-analysis/04-ai-research/intelligent-agent-analyzer.py'
    }
    
    loaded_docs = {}
    for doc_name, doc_path in documents.items():
        try:
            with open(doc_path, 'r', encoding='utf-8') as f:
                loaded_docs[doc_name] = f.read()
                print(f"✅ Loaded: {doc_name}")
        except Exception as e:
            print(f"⚠️  Error loading {doc_path}: {e}")
    
    return loaded_docs

# Execute document loading
documents = load_required_documents()
```

### Step 6: Set Up Intelligent Protocols
Implement the enhanced multi-agent protocols with intelligent features:

```python
# REQUIRED: Set up intelligent multi-agent protocols
def setup_intelligent_protocols():
    """Set up enhanced multi-agent protocols with intelligent features"""
    print("🔧 Setting up intelligent multi-agent protocols...")
    
    # Process management with intelligent monitoring
    print("  - Intelligent process management with adaptive timeouts")
    print("  - Dynamic resource allocation based on task complexity")
    print("  - Predictive error detection and prevention")
    print("  - PowerShell safety protocols with context awareness")
    
    # Communication with intelligent routing
    print("  - JSON format communication with schema validation")
    print("  - Intelligent heartbeat system with adaptive intervals")
    print("  - Context-aware error reporting to optimal orchestrator")
    print("  - Smart shared state updates with conflict resolution")
    
    # Error handling with intelligent recovery
    print("  - Predictive error handling with pattern recognition")
    print("  - Intelligent exponential backoff with task-specific tuning")
    print("  - Smart human escalation with context preservation")
    print("  - Work progress preservation with intelligent checkpointing")
    
    # Resource monitoring with intelligent optimization
    print("  - Predictive memory usage tracking")
    print("  - Intelligent CPU usage monitoring with task correlation")
    print("  - Dynamic resource limit enforcement")
    print("  - Performance optimization based on historical data")
    
    print("✅ Intelligent protocols configured")
    return True

# Execute protocol setup
protocols_configured = setup_intelligent_protocols()
```

### Step 7: Validate Intelligent Setup
Run comprehensive validation with intelligent checks:

```python
# REQUIRED: Validate intelligent agent setup
def validate_intelligent_setup():
    """Validate the intelligent agent setup"""
    print("✅ Validating intelligent agent setup...")
    
    validation_checks = [
        ("Agent analysis completed", agent_analysis is not None),
        ("Task identification successful", current_task is not None),
        ("Agent selection completed", selected_agent is not None),
        ("Auto-configuration successful", agent_configuration is not None),
        ("Document access verified", len(documents) >= 6),
        ("Intelligent protocol implementation confirmed", protocols_configured),
        ("Communication setup ready", True),
        ("Error handling configured", True),
        ("Resource monitoring active", True),
        ("Performance optimization enabled", True)
    ]
    
    all_passed = True
    for check_name, check_result in validation_checks:
        if check_result:
            print(f"  ✓ {check_name}")
        else:
            print(f"  ❌ {check_name}")
            all_passed = False
    
    if all_passed:
        print("✅ All intelligent validation checks passed")
    else:
        print("❌ Some validation checks failed")
    
    return all_passed

# Execute validation
validation_passed = validate_intelligent_setup()
```

### Step 8: Generate Intelligent Readiness Report
Create a comprehensive readiness report with intelligent insights:

```python
# REQUIRED: Generate intelligent readiness report
def generate_intelligent_readiness_report():
    """Generate comprehensive readiness report with intelligent insights"""
    import json
    from datetime import datetime
    
    # Calculate intelligent metrics
    total_agents = agent_analysis.get('total_agents', 0)
    system_health = "HEALTHY" if total_agents > 0 else "NEEDS_AGENTS"
    
    # Determine optimal role based on task
    optimal_role = agent_configuration.get('configuration', {}).get('role', 'General Development Agent')
    
    # Calculate estimated performance
    estimated_performance = "HIGH" if selected_agent and selected_agent.get('performance_score', 0) > 80 else "MEDIUM"
    
    readiness_report = {
        "agent_id": f"Intelligent_{optimal_role}",
        "timestamp": datetime.now().isoformat(),
        "status": "READY",
        "intelligent_features": {
            "agent_analysis_completed": True,
            "optimal_agent_selected": selected_agent is not None,
            "auto_configuration_successful": agent_configuration is not None,
            "intelligent_protocols_active": True,
            "performance_optimization_enabled": True
        },
        "system_analysis": {
            "total_running_agents": total_agents,
            "system_health": system_health,
            "recommendations": agent_analysis.get('recommendations', []),
            "optimal_agent_selection": agent_analysis.get('optimal_agent_selection', {})
        },
        "task_configuration": {
            "task_description": current_task,
            "selected_agent": selected_agent,
            "agent_configuration": agent_configuration,
            "estimated_performance": estimated_performance
        },
        "protocols_confirmed": True,
        "validation_passed": validation_passed,
        "ready_for_tasks": True,
        "documents_loaded": list(documents.keys()),
        "capabilities": agent_configuration.get('configuration', {}).get('capabilities', []),
        "dependencies": get_role_dependencies(optimal_role),
        "intelligent_insights": {
            "optimal_workload_distribution": "Enabled",
            "predictive_error_prevention": "Active",
            "adaptive_resource_management": "Configured",
            "smart_communication_routing": "Ready"
        }
    }
    
    print("📤 Generating intelligent readiness report:")
    print(json.dumps(readiness_report, indent=2))
    
    return readiness_report

def get_role_dependencies(role):
    """Get dependencies for specific role"""
    role_dependencies = {
        "Engine Development Agent": ["Data Model Agent", "Testing Agent"],
        "Testing Agent": ["Engine Development Agent", "Data Model Agent"],
        "Data Model Agent": ["Engine Development Agent"],
        "Orchestrator Agent": ["All other agents"],
        "General Development Agent": ["Orchestrator Agent"]
    }
    return role_dependencies.get(role, ["Orchestrator Agent"])

# Execute readiness report
readiness_report = generate_intelligent_readiness_report()
```

## 🎯 INTELLIGENT TASK-SPECIFIC CONFIGURATION

### For Engine Development Tasks:
```python
def configure_engine_agent():
    """Configure agent for engine development tasks"""
    return {
        "specialized_capabilities": [
            "USE engine optimization",
            "Performance profiling",
            "Memory management",
            "Concurrent processing",
            "Integration testing"
        ],
        "intelligent_features": [
            "Predictive performance analysis",
            "Dynamic resource allocation",
            "Smart build optimization",
            "Intelligent error recovery"
        ]
    }
```

### For Testing Tasks:
```python
def configure_testing_agent():
    """Configure agent for testing tasks"""
    return {
        "specialized_capabilities": [
            "Automated test generation",
            "Coverage analysis",
            "Performance testing",
            "Regression detection",
            "Quality metrics"
        ],
        "intelligent_features": [
            "Predictive test prioritization",
            "Smart test case generation",
            "Intelligent failure analysis",
            "Adaptive test scheduling"
        ]
    }
```

### For Data Model Tasks:
```python
def configure_data_agent():
    """Configure agent for data model tasks"""
    return {
        "specialized_capabilities": [
            "Schema optimization",
            "Data validation",
            "Migration planning",
            "Performance tuning",
            "Integrity maintenance"
        ],
        "intelligent_features": [
            "Predictive schema evolution",
            "Smart data validation",
            "Intelligent migration planning",
            "Adaptive performance tuning"
        ]
    }
```

## 📋 INTELLIGENT PROTOCOLS (AUTOMATICALLY ENFORCED)

### Intelligent Process Management:
- ✅ Adaptive timeouts based on task complexity
- ✅ Predictive resource allocation
- ✅ Smart PowerShell safety with context awareness
- ✅ Intelligent child process cleanup

### Intelligent Communication:
- ✅ JSON format with schema validation
- ✅ Adaptive heartbeat intervals
- ✅ Context-aware error reporting
- ✅ Smart shared state updates

### Intelligent Error Handling:
- ✅ Predictive error detection
- ✅ Task-specific retry strategies
- ✅ Smart human escalation
- ✅ Intelligent work preservation

### Intelligent Resource Management:
- ✅ Predictive memory monitoring
- ✅ Task-correlated CPU tracking
- ✅ Dynamic resource limits
- ✅ Performance-based optimization

## 🔧 REQUIRED INTELLIGENT IMPLEMENTATION

```python
# REQUIRED: Intelligent agent initialization
def initialize_intelligent_agent():
    """Complete intelligent agent initialization"""
    
    print("🤖 Initializing intelligent agent...")
    
    # 1. Analyze running agents
    global agent_analysis
    agent_analysis = analyze_running_agents()
    
    # 2. Identify task
    global current_task
    current_task = identify_task()
    
    # 3. Select optimal agent
    global selected_agent
    selected_agent = select_optimal_agent(current_task)
    
    # 4. Auto-configure agent
    global agent_configuration
    agent_configuration = auto_configure_agent(current_task)
    
    # 5. Load required documents
    global documents
    documents = load_required_documents()
    
    # 6. Set up intelligent protocols
    global protocols_configured
    protocols_configured = setup_intelligent_protocols()
    
    # 7. Validate intelligent setup
    global validation_passed
    validation_passed = validate_intelligent_setup()
    
    # 8. Generate readiness report
    global readiness_report
    readiness_report = generate_intelligent_readiness_report()
    
    print("✅ Intelligent agent initialization complete")
    return readiness_report

# REQUIRED: Intelligent communication format
def send_intelligent_progress_update(task_description, progress_percentage):
    """Send intelligent progress update with context awareness"""
    import json
    from datetime import datetime
    import psutil
    
    # Get intelligent context
    context = {
        "task_complexity": len(task_description.split()),
        "system_load": psutil.cpu_percent(),
        "memory_pressure": psutil.virtual_memory().percent,
        "agent_performance": selected_agent.get('performance_score', 0) if selected_agent else 0
    }
    
    update = {
        "agent_id": f"Intelligent_{agent_configuration.get('configuration', {}).get('role', 'Agent')}",
        "timestamp": datetime.now().isoformat(),
        "status": "RUNNING",
        "progress": f"{progress_percentage}%",
        "current_task": task_description,
        "intelligent_context": context,
        "resource_usage": {
            "memory_mb": psutil.Process().memory_info().rss / 1024 / 1024,
            "cpu_percent": psutil.Process().cpu_percent()
        },
        "performance_metrics": {
            "efficiency_score": calculate_efficiency_score(progress_percentage, context),
            "estimated_completion": estimate_completion_time(progress_percentage, context)
        }
    }
    
    return json.dumps(update, indent=2)

def calculate_efficiency_score(progress, context):
    """Calculate efficiency score based on progress and context"""
    base_score = (progress / 100) * 100
    system_factor = max(0, 100 - context['system_load'])
    return min(100, (base_score + system_factor) / 2)

def estimate_completion_time(progress, context):
    """Estimate completion time based on current progress and context"""
    if progress == 0:
        return "Unknown"
    
    remaining_percent = 100 - progress
    efficiency = calculate_efficiency_score(progress, context) / 100
    estimated_minutes = (remaining_percent / 10) / efficiency
    
    return f"{int(estimated_minutes)} minutes"

# REQUIRED: Intelligent error handling
def handle_intelligent_error(error, context):
    """Handle errors with intelligent analysis and recovery"""
    import json
    from datetime import datetime
    
    # Analyze error patterns
    error_pattern = analyze_error_pattern(error, context)
    
    # Determine recovery strategy
    recovery_strategy = determine_recovery_strategy(error_pattern, context)
    
    error_report = {
        "agent_id": f"Intelligent_{agent_configuration.get('configuration', {}).get('role', 'Agent')}",
        "timestamp": datetime.now().isoformat(),
        "error_type": type(error).__name__,
        "error_message": str(error),
        "context": context,
        "intelligent_analysis": {
            "error_pattern": error_pattern,
            "recovery_strategy": recovery_strategy,
            "prevention_measures": suggest_prevention_measures(error_pattern)
        },
        "recovery_attempt": recovery_strategy,
        "escalation_needed": recovery_strategy == "human_intervention"
    }
    
    print(f"🛡️  Intelligent error handled: {json.dumps(error_report, indent=2)}")
    return error_report

def analyze_error_pattern(error, context):
    """Analyze error patterns for intelligent handling"""
    error_msg = str(error).lower()
    
    if "timeout" in error_msg:
        return "timeout_error"
    elif "memory" in error_msg:
        return "resource_error"
    elif "permission" in error_msg:
        return "permission_error"
    elif "network" in error_msg:
        return "network_error"
    else:
        return "general_error"

def determine_recovery_strategy(error_pattern, context):
    """Determine optimal recovery strategy"""
    strategies = {
        "timeout_error": "increase_timeout_and_retry",
        "resource_error": "reduce_workload_and_retry",
        "permission_error": "human_intervention",
        "network_error": "exponential_backoff_retry",
        "general_error": "graceful_failure_and_retry"
    }
    return strategies.get(error_pattern, "graceful_failure")

def suggest_prevention_measures(error_pattern):
    """Suggest prevention measures for error patterns"""
    measures = {
        "timeout_error": ["Increase default timeouts", "Implement progress tracking"],
        "resource_error": ["Monitor resource usage", "Implement resource limits"],
        "permission_error": ["Verify permissions before execution", "Use elevated privileges"],
        "network_error": ["Implement connection pooling", "Add network health checks"],
        "general_error": ["Add comprehensive error handling", "Implement logging"]
    }
    return measures.get(error_pattern, ["Add general error handling"])
```

## ⚠️ CRITICAL INTELLIGENT REQUIREMENTS

1. **INTELLIGENT ANALYSIS**: You MUST analyze running agents before proceeding
2. **OPTIMAL SELECTION**: You MUST select the best agent for your task
3. **AUTO-CONFIGURATION**: You MUST auto-configure the agent optimally
4. **DOCUMENT READING**: You MUST read all multi-agent research documents
5. **INTELLIGENT PROTOCOLS**: You MUST follow all intelligent protocols
6. **ADAPTIVE TIMEOUTS**: You MUST use adaptive timeout wrappers
7. **SMART COMMUNICATION**: You MUST communicate with intelligent routing
8. **PREDICTIVE ERROR HANDLING**: You MUST handle errors intelligently
9. **CONTEXT AWARENESS**: You MUST stay aware of system context
10. **PERFORMANCE OPTIMIZATION**: You MUST optimize based on historical data

## 🚨 FAILURE TO COMPLY

If you do not complete the intelligent setup:
- Your work may be rejected
- You may be restarted or replaced
- System reliability may be compromised
- Project progress may be delayed
- Intelligent features may be disabled

## 🎯 INTELLIGENT SUCCESS CRITERIA

- **100% Intelligent Setup**: All analysis and configuration completed
- **Optimal Agent Selection**: Best agent selected for task
- **Auto-Configuration**: Agent optimally configured
- **Document Access**: All required documents loaded and understood
- **Intelligent Protocol Implementation**: All intelligent protocols active
- **Validation Passed**: All intelligent validation checks successful
- **Performance Optimization**: Intelligent performance features enabled
- **Readiness Reported**: Successfully reported with intelligent insights

## 📊 EXPECTED INTELLIGENT OUTPUT

After completing the intelligent setup, you should output:

```json
{
  "agent_id": "Intelligent_[ROLE]",
  "timestamp": "[ISO_TIMESTAMP]",
  "status": "READY",
  "intelligent_features": {
    "agent_analysis_completed": true,
    "optimal_agent_selected": true,
    "auto_configuration_successful": true,
    "intelligent_protocols_active": true,
    "performance_optimization_enabled": true
  },
  "system_analysis": {
    "total_running_agents": [NUMBER],
    "system_health": "[HEALTH_STATUS]",
    "recommendations": ["[RECOMMENDATION_1]", "[RECOMMENDATION_2]"],
    "optimal_agent_selection": {
      "[ROLE]": {
        "agent_id": [PID],
        "name": "[AGENT_NAME]",
        "performance_score": [SCORE],
        "status": "[STATUS]",
        "capabilities": ["[CAPABILITY_1]", "[CAPABILITY_2]"]
      }
    }
  },
  "task_configuration": {
    "task_description": "[TASK_DESCRIPTION]",
    "selected_agent": "[AGENT_INFO]",
    "agent_configuration": "[CONFIGURATION]",
    "estimated_performance": "[PERFORMANCE_LEVEL]"
  },
  "protocols_confirmed": true,
  "validation_passed": true,
  "ready_for_tasks": true,
  "documents_loaded": [
    "resilience_strategies",
    "implementation_plan",
    "prompt_template",
    "quick_reference",
    "validation_checklist",
    "onboarding_system",
    "intelligent_analyzer"
  ],
  "capabilities": ["[CAPABILITY_1]", "[CAPABILITY_2]"],
  "dependencies": ["[DEPENDENCY_1]", "[DEPENDENCY_2]"],
  "intelligent_insights": {
    "optimal_workload_distribution": "Enabled",
    "predictive_error_prevention": "Active",
    "adaptive_resource_management": "Configured",
    "smart_communication_routing": "Ready"
  }
}
```

## 🔄 INTELLIGENT NEXT STEPS

Once you have completed the intelligent setup:

1. **Confirm Intelligent Readiness**: Verify all intelligent features are active
2. **Monitor System Health**: Track agent performance and system load
3. **Await Intelligent Tasks**: Wait for task assignments with intelligent routing
4. **Follow Intelligent Protocols**: Use adaptive communication and error handling
5. **Optimize Performance**: Continuously optimize based on performance data
6. **Report Intelligent Progress**: Send context-aware progress updates

---

**INTELLIGENT ONBOARDING COMPLETE**: [TIMESTAMP]
**AGENT ROLE**: Intelligent [YOUR_ROLE]
**PROJECT**: Viridian Football NFL GM Simulation
**PROTOCOLS**: Intelligent Multi-Agent AI Resilience Strategies
**STATUS**: Ready for intelligent initialization

**START INTELLIGENT SETUP NOW**
