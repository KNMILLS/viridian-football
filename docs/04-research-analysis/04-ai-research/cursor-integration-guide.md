# Cursor Integration Guide for Viridian Football

## Overview

This guide explains how to use the PowerShell scripts that provide deep integration with Cursor IDE for automatic agent management, resource optimization, and intelligent configuration of the maximum number of simultaneous agents.

## Scripts Overview

### 1. `cursor-agent-manager.ps1` (Basic Version)
- **Purpose**: Basic Cursor agent detection and management
- **Features**: Agent analysis, resource monitoring, configuration management
- **Best for**: Simple agent management and monitoring

### 2. `cursor-integration-manager.ps1` (Advanced Version)
- **Purpose**: Advanced Cursor integration with deep process analysis
- **Features**: Enhanced monitoring, automatic scaling, performance optimization
- **Best for**: Production environments and complex agent management

## Prerequisites

### System Requirements
- Windows 10/11
- PowerShell 5.1 or higher
- Administrative privileges (recommended)
- Cursor IDE installed

### Project Setup
- Viridian Football project cloned locally
- Python intelligent agent analyzer available
- PowerShell execution policy allowing script execution

## Quick Start

### 1. Initialize the Integration System

```powershell
# Navigate to project directory
cd "C:\Users\KenGM\OneDrive\Documents\Viridian Football"

# Initialize basic agent manager
.\docs\04-research-analysis\04-ai-research\cursor-agent-manager.ps1 -Initialize

# Initialize advanced integration manager
.\docs\04-research-analysis\04-ai-research\cursor-integration-manager.ps1 -Initialize
```

### 2. Analyze Current Agents

```powershell
# Basic analysis
.\docs\04-research-analysis\04-ai-research\cursor-agent-manager.ps1 -Analyze

# Advanced analysis with detailed reporting
.\docs\04-research-analysis\04-ai-research\cursor-integration-manager.ps1 -Report
```

### 3. Start Monitoring

```powershell
# Basic monitoring
.\docs\04-research-analysis\04-ai-research\cursor-agent-manager.ps1 -Monitor

# Advanced monitoring with auto-management
.\docs\04-research-analysis\04-ai-research\cursor-integration-manager.ps1 -Monitor -AutoManage
```

## Detailed Usage

### Agent Analysis

#### Basic Analysis
```powershell
.\cursor-agent-manager.ps1 -Analyze
```
**Output**: Shows current Cursor processes, agent count, system resources, and recommendations.

#### Advanced Analysis
```powershell
.\cursor-integration-manager.ps1 -Report
```
**Output**: Comprehensive report including:
- Detailed agent performance metrics
- Resource efficiency analysis
- Optimization recommendations
- System load analysis

### Agent Optimization

#### Basic Optimization
```powershell
.\cursor-agent-manager.ps1 -Optimize
```
**What it does**: Analyzes current agent distribution and suggests improvements.

#### Advanced Optimization
```powershell
.\cursor-integration-manager.ps1 -Optimize
```
**What it does**: 
- Analyzes agent performance scores
- Identifies resource bottlenecks
- Suggests specific scaling actions
- Provides priority-based recommendations

### Agent Scaling

#### Manual Scaling
```powershell
.\cursor-integration-manager.ps1 -Scale
```
**What it does**: Shows scaling recommendations based on current workload and system resources.

#### Automatic Scaling
```powershell
.\cursor-integration-manager.ps1 -Monitor -AutoManage
```
**What it does**: 
- Continuously monitors system load
- Automatically scales agents up/down
- Maintains optimal performance
- Logs all scaling actions

### Configuration Management

#### Configure Cursor Settings
```powershell
.\cursor-integration-manager.ps1 -Configure
```
**What it does**: 
- Updates Cursor configuration files
- Sets optimal agent management settings
- Creates backup of existing configuration
- Enables auto-scaling features

#### Set Custom Agent Limits
```powershell
.\cursor-agent-manager.ps1 -Configure -MaxAgents 7
```
**What it does**: Sets maximum number of simultaneous agents to 7.

## Advanced Features

### Real-Time Monitoring

#### Basic Monitoring
```powershell
.\cursor-agent-manager.ps1 -Monitor
```
**Displays**: Live updates of agent count, system resources, and basic status.

#### Enhanced Monitoring
```powershell
.\cursor-integration-manager.ps1 -Monitor -AutoManage
```
**Displays**: 
- Real-time performance metrics
- Agent status and health
- System load indicators
- Auto-optimization actions
- Critical alerts

### Performance Metrics

The advanced script calculates several performance metrics:

#### Agent Performance Score
- **CPU Efficiency**: Lower CPU usage = higher score
- **Memory Efficiency**: Lower memory usage = higher score
- **Uptime**: Longer uptime = higher score
- **Weighted Average**: Combined performance indicator

#### Resource Efficiency
- **Memory Efficiency**: Actual vs. expected memory usage
- **Resource Weight**: Agent-specific resource requirements
- **Efficiency Score**: Percentage-based efficiency rating

#### Agent Status Classification
- **Optimal**: Performance score > 80
- **Good**: Performance score 60-80
- **Fair**: Performance score 40-60
- **Poor**: Performance score 20-40
- **Critical**: Performance score < 20

### Auto-Scaling Logic

#### Scale-Up Triggers
- System load < 30%
- Agent count below minimum instances
- High-priority tasks requiring more agents

#### Scale-Down Triggers
- System load > 80%
- Agent count above maximum instances
- Poor performing agents detected
- Resource constraints

## Configuration Files

### Generated Files

#### `cursor-agent-config.json`
- Basic agent manager configuration
- System settings and limits
- Agent pattern definitions

#### `cursor-integration-config.json`
- Advanced integration configuration
- Performance thresholds
- Auto-scaling settings
- Monitoring preferences

#### `cursor-agent-report-YYYYMMDD-HHMMSS.json`
- Detailed analysis reports
- Performance metrics
- Optimization recommendations
- Historical data

### Cursor Configuration Integration

The advanced script can modify Cursor's settings.json file to include:
- Agent management settings
- Auto-scaling preferences
- Performance monitoring
- Resource limits

## Troubleshooting

### Common Issues

#### PowerShell Execution Policy
```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy to allow scripts (run as administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Missing Dependencies
```powershell
# Check if Python analyzer exists
Test-Path "docs\04-research-analysis\04-ai-research\intelligent-agent-analyzer.py"

# Check if Cursor is installed
Test-Path "$env:LOCALAPPDATA\Programs\Cursor\Cursor.exe"
```

#### Permission Issues
```powershell
# Run as administrator for full functionality
Start-Process PowerShell -Verb RunAs
```

### Error Messages

#### "PowerShell 5.1 or higher is required"
- Update PowerShell to latest version
- Use Windows PowerShell 5.1 or PowerShell Core 6+

#### "Cursor installation not detected"
- Verify Cursor is installed
- Check common installation paths
- Ensure Cursor processes are running

#### "Project root path not found"
- Verify current directory
- Use `-ProjectRoot` parameter to specify correct path
- Check if project structure is intact

## Best Practices

### For Development
1. **Start with basic analysis**: Use `-Analyze` to understand current state
2. **Monitor during development**: Use `-Monitor` to track agent performance
3. **Optimize regularly**: Use `-Optimize` to maintain efficiency
4. **Generate reports**: Use `-Report` for detailed analysis

### For Production
1. **Initialize first**: Always run `-Initialize` before other operations
2. **Enable auto-management**: Use `-Monitor -AutoManage` for hands-off operation
3. **Set appropriate limits**: Configure `-MaxAgents` based on system capacity
4. **Monitor logs**: Check generated log files for issues
5. **Backup configurations**: Scripts create backups automatically

### Performance Optimization
1. **Monitor system load**: Keep system load below 80%
2. **Balance agent types**: Ensure proper distribution across agent types
3. **Regular optimization**: Run optimization weekly
4. **Resource monitoring**: Watch memory and CPU usage
5. **Scale appropriately**: Adjust agent limits based on workload

## Integration with Existing Systems

### Python Analyzer Integration
Both scripts integrate with the existing Python intelligent agent analyzer:
- Automatic invocation of Python scripts
- Shared configuration and patterns
- Complementary analysis capabilities

### Multi-Agent Research Integration
Scripts implement strategies from the multi-agent AI resilience research:
- Process isolation and monitoring
- Resource management and optimization
- Error handling and recovery
- Performance tracking and analysis

## Script Comparison

| Feature | Basic Manager | Advanced Manager |
|---------|---------------|------------------|
| Agent Detection | Basic | Enhanced |
| Performance Metrics | Simple | Advanced |
| Auto-Scaling | No | Yes |
| Cursor Integration | Limited | Deep |
| Configuration Management | Basic | Advanced |
| Monitoring | Simple | Real-time |
| Reporting | Basic | Comprehensive |
| Resource Optimization | Manual | Automatic |

## Next Steps

1. **Start with basic analysis**: Understand your current agent setup
2. **Configure optimal settings**: Set appropriate limits and thresholds
3. **Enable monitoring**: Start real-time monitoring
4. **Optimize performance**: Use optimization features regularly
5. **Scale as needed**: Adjust based on workload and system capacity

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review generated log files
3. Examine configuration files
4. Consult the multi-agent research documentation
5. Use the Python analyzer for additional insights

## Version History

- **v1.0.0**: Basic agent manager with core functionality
- **v2.0.0**: Advanced integration manager with auto-scaling and deep Cursor integration

---

*This guide is part of the Viridian Football project's multi-agent AI resilience system.*
