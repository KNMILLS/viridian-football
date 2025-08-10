# Multi-Agent AI Quick Reference Guide

## 🚀 Quick Start for New Agents

### Essential Setup
```bash
# Always use timeout wrappers
subprocess.run(command, timeout=300)  # 5-minute timeout

# PowerShell safety
powershell -InputFormat None -Command "script.ps1" < NUL

# Resource monitoring
import psutil
memory_usage = psutil.Process().memory_info().rss / 1024 / 1024  # MB
```

### Required Communication Format
```json
{
  "agent_id": "your_role",
  "timestamp": "2024-01-01T12:00:00Z",
  "status": "RUNNING|COMPLETED|FAILED|STUCK",
  "progress": "50% or description",
  "current_task": "what you're doing",
  "resource_usage": {"memory_mb": 512, "cpu_percent": 25}
}
```

## 🔧 Common Patterns

### Process Management
```python
# Safe subprocess execution
try:
    result = subprocess.run(
        command,
        timeout=300,  # 5 minutes
        capture_output=True,
        text=True
    )
except subprocess.TimeoutExpired:
    # Kill process and children
    process.kill()
    # Report timeout to orchestrator
```

### Error Handling
```python
# Graceful error handling
try:
    # Your task here
    pass
except Exception as e:
    # Log error
    log_error(e)
    # Report to orchestrator
    report_error(e)
    # Attempt recovery
    attempt_recovery()
    # Escalate if needed
    if recovery_failed:
        escalate_to_human()
```

### Resource Monitoring
```python
# Monitor resources
def check_resources():
    memory = psutil.Process().memory_info().rss / 1024 / 1024
    cpu = psutil.Process().cpu_percent()
    
    if memory > 1024:  # 1GB limit
        report_resource_warning("memory", memory)
    
    if cpu > 80:  # 80% CPU limit
        report_resource_warning("cpu", cpu)
```

## 📋 Role-Specific Requirements

### Orchestrator Agent
- ✅ Decompose tasks into subtasks
- ✅ Assign tasks to appropriate agents
- ✅ Monitor all agent health
- ✅ Manage shared state
- ✅ Handle agent failures

### Engine Development Agent
- ✅ Work on isolated git branches
- ✅ Use timeout wrappers for builds
- ✅ Coordinate with Data Model Agent
- ✅ Report performance metrics
- ✅ Maintain engine documentation

### Testing Agent
- ✅ Run tests in isolated containers
- ✅ Use configurable timeouts
- ✅ Report results in JSON format
- ✅ Coordinate with other agents
- ✅ Implement proper cleanup

### Data Model Agent
- ✅ Use version control for schema changes
- ✅ Coordinate with Engine Development Agent
- ✅ Provide clear interfaces
- ✅ Implement validation
- ✅ Report schema changes

## ⚠️ Common Pitfalls

### Process Management
- ❌ `subprocess.run(command)` - No timeout
- ✅ `subprocess.run(command, timeout=300)` - With timeout

- ❌ `powershell script.ps1` - Interactive mode
- ✅ `powershell -InputFormat None -Command "script.ps1" < NUL` - Non-interactive

- ❌ Leave child processes running
- ✅ Always clean up spawned processes

### Communication
- ❌ Inconsistent output formats
- ✅ Always use JSON for inter-agent communication

- ❌ Work in isolation
- ✅ Send regular progress updates

- ❌ Overlap with other agents
- ✅ Stay within role boundaries

### Error Handling
- ❌ Crash on errors
- ✅ Handle errors gracefully

- ❌ Retry indefinitely
- ✅ Use exponential backoff, escalate after 3 attempts

- ❌ Lose work on failure
- ✅ Preserve state and partial work

## 🔄 Recovery Strategies

### Agent Stuck
1. Send stuck signal to orchestrator
2. Attempt to break out of stuck state
3. Request assistance from other agents
4. Escalate to human if stuck > 5 minutes
5. Preserve current state

### Agent Failed
1. Log error to central log
2. Notify orchestrator of failure
3. Attempt recovery using established strategies
4. Escalate to human if recovery fails
5. Preserve any partial work

### Resource Exhaustion
1. Report resource warning
2. Attempt to free up resources
3. Request resource allocation from orchestrator
4. Escalate if resources cannot be freed
5. Preserve work and restart if needed

## 📊 Success Metrics

### Individual Agent
- Task completion rate: 90%+
- Error rate: < 5%
- Recovery time: < 2 minutes
- Resource efficiency: Within limits

### System-Wide
- Agent coordination: Minimal conflicts
- Communication overhead: Efficient
- System reliability: 95%+ uptime
- Development velocity: Measurable increase

## 🚨 Emergency Procedures

### Agent Unresponsive
1. Check heartbeat (30-second intervals)
2. Attempt restart if no heartbeat for 2 minutes
3. Escalate to human if restart fails
4. Preserve any work in progress

### System Overload
1. Reduce agent load
2. Prioritize critical tasks
3. Request additional resources
4. Escalate to human if needed

### Data Corruption
1. Stop all agents immediately
2. Preserve current state
3. Restore from last known good state
4. Investigate root cause
5. Resume with additional safeguards

## 📞 Escalation Matrix

### Level 1: Agent Self-Recovery
- Retry failed operations
- Attempt alternative approaches
- Request assistance from other agents

### Level 2: Orchestrator Intervention
- Reassign failed tasks
- Restart failed agents
- Adjust resource allocation

### Level 3: Human Intervention
- Investigate persistent failures
- Modify agent configurations
- Implement new recovery strategies

## 🔗 Integration Points

### USE Engine
- Coordinate with Engine Development Agent
- Follow performance requirements
- Use established testing protocols

### Data Models
- Work with Data Model Agent
- Validate data integrity
- Use migration protocols

### APIs
- Follow API specifications
- Coordinate with Testing Agent
- Use authentication protocols

## 📝 Documentation Requirements

### Agent Documentation
- Role and responsibilities
- Dependencies and interfaces
- Error handling procedures
- Performance requirements

### System Documentation
- Agent coordination protocols
- Communication standards
- Recovery procedures
- Success metrics

## 🎯 Best Practices

### Development
- Use isolated workspaces
- Implement comprehensive testing
- Follow established patterns
- Document all changes

### Operations
- Monitor system health
- Track performance metrics
- Maintain backup procedures
- Regular system audits

### Communication
- Clear and concise messages
- Standardized formats
- Regular updates
- Proper escalation

## 📚 Reference Documents

- `multi-agent-ai-resilience-strategies.md` - Comprehensive research
- `multi-agent-implementation-plan.md` - Implementation strategy
- `multi-agent-prompt-template.md` - Detailed templates
- `multi-agent-research-summary.md` - Executive summary

## 🆘 Quick Troubleshooting

### Agent Won't Start
1. Check environment setup
2. Verify dependencies
3. Check resource availability
4. Review error logs

### Agent Stuck in Loop
1. Check iteration limits
2. Review task complexity
3. Verify dependencies
4. Escalate if needed

### Communication Issues
1. Check message format
2. Verify network connectivity
3. Review protocol compliance
4. Check orchestrator status

### Performance Issues
1. Monitor resource usage
2. Check for bottlenecks
3. Review task complexity
4. Optimize if needed

---

**Remember**: The key to success is implementing the system with the expectation that failures will occur and building in automated recovery mechanisms that allow the system to continue operating effectively.
