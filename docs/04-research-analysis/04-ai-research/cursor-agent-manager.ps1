#Requires -Version 5.1
<#
.SYNOPSIS
    Cursor Agent Manager for Viridian Football Project
    
.DESCRIPTION
    This PowerShell script automatically hooks into Cursor, analyzes ongoing agents,
    and configures the maximum number of simultaneous agents for optimal performance.
    
    Features:
    - Detects Cursor processes and their agent instances
    - Analyzes agent performance, resource usage, and task status
    - Configures optimal agent limits based on system resources
    - Provides intelligent agent management recommendations
    - Integrates with the existing Python intelligent agent analyzer
    
.PARAMETER Analyze
    Analyze current Cursor agents and system status
    
.PARAMETER Configure
    Configure optimal agent limits and settings
    
.PARAMETER Monitor
    Start continuous monitoring of agent performance
    
.PARAMETER Optimize
    Optimize agent distribution and resource allocation
    
.PARAMETER Report
    Generate detailed agent analysis report
    
.PARAMETER MaxAgents
    Set maximum number of simultaneous agents (default: auto-detect)
    
.PARAMETER ProjectRoot
    Path to Viridian Football project root (default: current directory)
    
.EXAMPLE
    .\cursor-agent-manager.ps1 -Analyze
    .\cursor-agent-manager.ps1 -Configure -MaxAgents 5
    .\cursor-agent-manager.ps1 -Monitor -ProjectRoot "C:\Projects\Viridian Football"
    
.NOTES
    Requires PowerShell 5.1 or higher
    Requires administrative privileges for some operations
    Integrates with intelligent-agent-analyzer.py
#>

param(
    [switch]$Analyze,
    [switch]$Configure,
    [switch]$Monitor,
    [switch]$Optimize,
    [switch]$Report,
    [int]$MaxAgents = 0,
    [string]$ProjectRoot = "."
)

# Script configuration
$ScriptVersion = "1.0.0"
$ConfigFile = "cursor-agent-config.json"
$LogFile = "cursor-agent-manager.log"

# Agent management settings
$DefaultMaxAgents = 5
$MinMemoryPerAgent = 512  # MB
$MaxCpuPerAgent = 25      # Percentage
$HeartbeatInterval = 30   # Seconds
$ResourceCheckInterval = 60  # Seconds

# Cursor process patterns
$CursorProcessPatterns = @(
    "Cursor",
    "cursor",
    "Cursor.exe",
    "cursor.exe"
)

# Agent detection patterns
$AgentPatterns = @{
    "Engine Development Agent" = @{
        Keywords = @("engine", "USE", "performance", "optimization", "core", "system")
        ProcessPatterns = @("python", "java", "rust")
        FilePatterns = @("engine", "USE", "performance")
        Priority = 1
    }
    "Testing Agent" = @{
        Keywords = @("test", "validation", "quality", "coverage", "qa", "testing")
        ProcessPatterns = @("pytest", "test", "validation")
        FilePatterns = @("test", "validation", "quality")
        Priority = 2
    }
    "Data Model Agent" = @{
        Keywords = @("data", "schema", "database", "model", "structure", "migration")
        ProcessPatterns = @("database", "schema", "migration")
        FilePatterns = @("data", "schema", "database")
        Priority = 3
    }
    "Orchestrator Agent" = @{
        Keywords = @("orchestrator", "coordinate", "manage", "delegate", "supervise")
        ProcessPatterns = @("orchestrator", "coordinator", "manager")
        FilePatterns = @("orchestrator", "coordinate")
        Priority = 4
    }
    "Documentation Agent" = @{
        Keywords = @("documentation", "docs", "markdown", "readme", "guide")
        ProcessPatterns = @("markdown", "docs", "documentation")
        FilePatterns = @("docs", "documentation", "readme")
        Priority = 5
    }
}

# Logging functions
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry
}

function Initialize-CursorAgentManager {
    Write-Log "Initializing Cursor Agent Manager v$ScriptVersion"
    
    # Check PowerShell version
    if ($PSVersionTable.PSVersion.Major -lt 5) {
        throw "PowerShell 5.1 or higher is required"
    }
    
    # Check if running as administrator (for some operations)
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
    
    if (-not $isAdmin) {
        Write-Log "WARNING: Not running as administrator. Some operations may be limited." "WARN"
    }
    
    # Validate project root
    if (-not (Test-Path $ProjectRoot)) {
        throw "Project root path not found: $ProjectRoot"
    }
    
    # Check for Python intelligent agent analyzer
    $analyzerPath = Join-Path $ProjectRoot "docs\04-research-analysis\04-ai-research\intelligent-agent-analyzer.py"
    if (-not (Test-Path $analyzerPath)) {
        Write-Log "WARNING: Python intelligent agent analyzer not found at: $analyzerPath" "WARN"
    }
    
    Write-Log "Cursor Agent Manager initialized successfully"
}

function Get-CursorProcesses {
    Write-Log "Detecting Cursor processes..."
    
    $cursorProcesses = @()
    
    foreach ($pattern in $CursorProcessPatterns) {
        $processes = Get-Process -Name $pattern -ErrorAction SilentlyContinue
        $cursorProcesses += $processes
    }
    
    # Also check for processes with "cursor" in the command line
    $allProcesses = Get-Process | Where-Object { $_.ProcessName -like "*cursor*" -or $_.ProcessName -like "*Cursor*" }
    $cursorProcesses += $allProcesses
    
    # Remove duplicates
    $cursorProcesses = $cursorProcesses | Sort-Object Id -Unique
    
    Write-Log "Found $($cursorProcesses.Count) Cursor processes"
    return $cursorProcesses
}

function Get-AgentProcesses {
    param(
        [array]$CursorProcesses
    )
    
    Write-Log "Analyzing agent processes..."
    
    $agentProcesses = @()
    
    # Get all processes that might be agents
    $allProcesses = Get-Process | Where-Object { 
        $_.ProcessName -match "(python|java|rust|node|powershell)" -and
        $_.Id -ne $PID  # Exclude this script
    }
    
    foreach ($process in $allProcesses) {
        try {
            # Get command line arguments
            $cmdline = (Get-WmiObject -Class Win32_Process -Filter "ProcessId = $($process.Id)").CommandLine
            
            if ($cmdline) {
                # Check if this process matches any agent patterns
                foreach ($agentType in $AgentPatterns.Keys) {
                    $pattern = $AgentPatterns[$agentType]
                    
                    $keywordMatch = $pattern.Keywords | Where-Object { $cmdline -match $_ }
                    $processMatch = $pattern.ProcessPatterns | Where-Object { $process.ProcessName -match $_ }
                    
                    if ($keywordMatch -or $processMatch) {
                        $agentInfo = [PSCustomObject]@{
                            ProcessId = $process.Id
                            ProcessName = $process.ProcessName
                            AgentType = $agentType
                            CommandLine = $cmdline
                            StartTime = $process.StartTime
                            CPU = $process.CPU
                            WorkingSet = $process.WorkingSet
                            Priority = $pattern.Priority
                            Status = "Unknown"
                        }
                        
                        $agentProcesses += $agentInfo
                        break
                    }
                }
            }
        }
        catch {
            Write-Log "Error analyzing process $($process.Id): $($_.Exception.Message)" "ERROR"
        }
    }
    
    Write-Log "Found $($agentProcesses.Count) agent processes"
    return $agentProcesses
}

function Analyze-SystemResources {
    Write-Log "Analyzing system resources..."
    
    $cpuInfo = Get-WmiObject -Class Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors
    $memoryInfo = Get-WmiObject -Class Win32_ComputerSystem | Select-Object TotalPhysicalMemory
    $diskInfo = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DeviceID -eq "C:" } | Select-Object Size, FreeSpace
    
    $totalMemoryGB = [math]::Round($memoryInfo.TotalPhysicalMemory / 1GB, 2)
    $freeMemoryGB = [math]::Round((Get-Counter "\Memory\Available MBytes").CounterSamples[0].CookedValue / 1024, 2)
    $cpuCores = $cpuInfo.NumberOfLogicalProcessors
    $freeDiskGB = [math]::Round($diskInfo.FreeSpace / 1GB, 2)
    
    $systemInfo = [PSCustomObject]@{
        CPU = $cpuInfo
        TotalMemoryGB = $totalMemoryGB
        FreeMemoryGB = $freeMemoryGB
        CPUCores = $cpuCores
        FreeDiskGB = $freeDiskGB
        RecommendedMaxAgents = [math]::Min([math]::Floor($freeMemoryGB / ($MinMemoryPerAgent / 1024)), $cpuCores)
    }
    
    Write-Log "System Analysis: $cpuCores cores, ${totalMemoryGB}GB RAM (${freeMemoryGB}GB free), ${freeDiskGB}GB free disk"
    Write-Log "Recommended max agents: $($systemInfo.RecommendedMaxAgents)"
    
    return $systemInfo
}

function Get-OptimalAgentLimit {
    param(
        [object]$SystemInfo,
        [array]$CurrentAgents
    )
    
    Write-Log "Calculating optimal agent limit..."
    
    # Base recommendation on system resources
    $baseLimit = $SystemInfo.RecommendedMaxAgents
    
    # Adjust based on current agent performance
    if ($CurrentAgents.Count -gt 0) {
        $avgCpuUsage = ($CurrentAgents | Measure-Object -Property CPU -Average).Average
        $avgMemoryUsage = ($CurrentAgents | Measure-Object -Property WorkingSet -Average).Average / 1MB
        
        if ($avgCpuUsage -gt $MaxCpuPerAgent) {
            $baseLimit = [math]::Max(1, $baseLimit - 1)
            Write-Log "Reducing limit due to high CPU usage: $avgCpuUsage%" "WARN"
        }
        
        if ($avgMemoryUsage -gt $MinMemoryPerAgent) {
            $baseLimit = [math]::Max(1, $baseLimit - 1)
            Write-Log "Reducing limit due to high memory usage: $([math]::Round($avgMemoryUsage, 2))MB" "WARN"
        }
    }
    
    # Ensure minimum of 1 agent
    $optimalLimit = [math]::Max(1, $baseLimit)
    
    Write-Log "Optimal agent limit calculated: $optimalLimit"
    return $optimalLimit
}

function Invoke-PythonAnalyzer {
    param(
        [string]$Command
    )
    
    $analyzerPath = Join-Path $ProjectRoot "docs\04-research-analysis\04-ai-research\intelligent-agent-analyzer.py"
    
    if (-not (Test-Path $analyzerPath)) {
        Write-Log "Python analyzer not found, skipping integration" "WARN"
        return $null
    }
    
    try {
        $pythonOutput = python $analyzerPath $Command 2>&1
        return $pythonOutput
    }
    catch {
        Write-Log "Error invoking Python analyzer: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

function New-AgentAnalysisReport {
    param(
        [array]$CursorProcesses,
        [array]$AgentProcesses,
        [object]$SystemInfo,
        [int]$OptimalLimit
    )
    
    Write-Log "Generating agent analysis report..."
    
    $report = [PSCustomObject]@{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        CursorProcesses = $CursorProcesses.Count
        AgentProcesses = $AgentProcesses.Count
        SystemResources = $SystemInfo
        OptimalAgentLimit = $OptimalLimit
        CurrentAgents = $AgentProcesses
        Recommendations = @()
    }
    
    # Generate recommendations
    if ($AgentProcesses.Count -gt $OptimalLimit) {
        $report.Recommendations += "Reduce number of agents from $($AgentProcesses.Count) to $OptimalLimit"
    }
    
    if ($AgentProcesses.Count -eq 0) {
        $report.Recommendations += "No agents detected. Consider starting agents for project tasks."
    }
    
    # Check for resource issues
    $highCpuAgents = $AgentProcesses | Where-Object { $_.CPU -gt $MaxCpuPerAgent }
    if ($highCpuAgents.Count -gt 0) {
        $report.Recommendations += "Some agents using high CPU: $($highCpuAgents.Count) agents"
    }
    
    $highMemoryAgents = $AgentProcesses | Where-Object { $_.WorkingSet / 1MB -gt $MinMemoryPerAgent }
    if ($highMemoryAgents.Count -gt 0) {
        $report.Recommendations += "Some agents using high memory: $($highMemoryAgents.Count) agents"
    }
    
    return $report
}

function Save-AgentConfiguration {
    param(
        [object]$Report,
        [int]$MaxAgents
    )
    
    $config = [PSCustomObject]@{
        LastUpdated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        MaxAgents = $MaxAgents
        SystemInfo = $Report.SystemResources
        AgentPatterns = $AgentPatterns
        Settings = @{
            MinMemoryPerAgent = $MinMemoryPerAgent
            MaxCpuPerAgent = $MaxCpuPerAgent
            HeartbeatInterval = $HeartbeatInterval
            ResourceCheckInterval = $ResourceCheckInterval
        }
    }
    
    $configPath = Join-Path $ProjectRoot $ConfigFile
    $config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath
    
    Write-Log "Configuration saved to: $configPath"
}

function Start-AgentMonitoring {
    param(
        [int]$MaxAgents,
        [string]$ProjectRoot
    )
    
    Write-Log "Starting continuous agent monitoring..."
    Write-Log "Monitoring will check every $ResourceCheckInterval seconds"
    Write-Log "Press Ctrl+C to stop monitoring"
    
    try {
        while ($true) {
            $cursorProcesses = Get-CursorProcesses
            $agentProcesses = Get-AgentProcesses -CursorProcesses $cursorProcesses
            $systemInfo = Analyze-SystemResources
            
            $currentTime = Get-Date -Format "HH:mm:ss"
            Write-Host "[$currentTime] Cursor: $($cursorProcesses.Count), Agents: $($agentProcesses.Count), Free RAM: $($systemInfo.FreeMemoryGB)GB"
            
            # Check if we need to adjust agent limits
            if ($agentProcesses.Count -gt $MaxAgents) {
                Write-Log "WARNING: Agent count ($($agentProcesses.Count)) exceeds limit ($MaxAgents)" "WARN"
            }
            
            Start-Sleep -Seconds $ResourceCheckInterval
        }
    }
    catch {
        Write-Log "Monitoring stopped: $($_.Exception.Message)" "INFO"
    }
}

function Optimize-AgentDistribution {
    param(
        [array]$AgentProcesses,
        [object]$SystemInfo
    )
    
    Write-Log "Optimizing agent distribution..."
    
    $optimizationPlan = @()
    
    # Group agents by type
    $agentsByType = $AgentProcesses | Group-Object AgentType
    
    foreach ($group in $agentsByType) {
        $agentType = $group.Name
        $count = $group.Count
        
        # Check if we have too many of one type
        if ($count -gt 2) {
            $optimizationPlan += "Consider reducing $agentType agents from $count to 2"
        }
        
        # Check resource usage for this type
        $avgCpu = ($group.Group | Measure-Object -Property CPU -Average).Average
        $avgMemory = ($group.Group | Measure-Object -Property WorkingSet -Average).Average / 1MB
        
        if ($avgCpu -gt $MaxCpuPerAgent) {
            $optimizationPlan += "$agentType agents using high CPU ($([math]::Round($avgCpu, 1))%)"
        }
        
        if ($avgMemory -gt $MinMemoryPerAgent) {
            $optimizationPlan += "$agentType agents using high memory ($([math]::Round($avgMemory, 1))MB)"
        }
    }
    
    # Check for missing agent types
    $existingTypes = $agentsByType.Name
    $missingTypes = $AgentPatterns.Keys | Where-Object { $_ -notin $existingTypes }
    
    if ($missingTypes.Count -gt 0) {
        $optimizationPlan += "Missing agent types: $($missingTypes -join ', ')"
    }
    
    return $optimizationPlan
}

# Main execution logic
function Main {
    try {
        Initialize-CursorAgentManager
        
        if ($Analyze) {
            Write-Log "=== CURSOR AGENT ANALYSIS ==="
            
            $cursorProcesses = Get-CursorProcesses
            $agentProcesses = Get-AgentProcesses -CursorProcesses $cursorProcesses
            $systemInfo = Analyze-SystemResources
            
            $optimalLimit = if ($MaxAgents -gt 0) { $MaxAgents } else { Get-OptimalAgentLimit -SystemInfo $systemInfo -CurrentAgents $agentProcesses }
            
            $report = New-AgentAnalysisReport -CursorProcesses $cursorProcesses -AgentProcesses $agentProcesses -SystemInfo $systemInfo -OptimalLimit $optimalLimit
            
            # Display report
            Write-Host "`n=== AGENT ANALYSIS REPORT ===" -ForegroundColor Green
            Write-Host "Timestamp: $($report.Timestamp)"
            Write-Host "Cursor Processes: $($report.CursorProcesses)"
            Write-Host "Agent Processes: $($report.AgentProcesses)"
            Write-Host "Optimal Agent Limit: $($report.OptimalAgentLimit)"
            Write-Host "System: $($report.SystemResources.CPUCores) cores, $($report.SystemResources.FreeMemoryGB)GB free RAM"
            
            if ($report.Recommendations.Count -gt 0) {
                Write-Host "`n=== RECOMMENDATIONS ===" -ForegroundColor Yellow
                foreach ($rec in $report.Recommendations) {
                    Write-Host "- $rec" -ForegroundColor Yellow
                }
            }
            
            # Integrate with Python analyzer
            $pythonResult = Invoke-PythonAnalyzer -Command "--analyze-running"
            if ($pythonResult) {
                Write-Host "`n=== PYTHON ANALYZER INTEGRATION ===" -ForegroundColor Cyan
                Write-Host $pythonResult
            }
        }
        
        if ($Configure) {
            Write-Log "=== CONFIGURING AGENT LIMITS ==="
            
            $cursorProcesses = Get-CursorProcesses
            $agentProcesses = Get-AgentProcesses -CursorProcesses $cursorProcesses
            $systemInfo = Analyze-SystemResources
            
            $optimalLimit = if ($MaxAgents -gt 0) { $MaxAgents } else { Get-OptimalAgentLimit -SystemInfo $systemInfo -CurrentAgents $agentProcesses }
            
            $report = New-AgentAnalysisReport -CursorProcesses $cursorProcesses -AgentProcesses $agentProcesses -SystemInfo $systemInfo -OptimalLimit $optimalLimit
            
            Save-AgentConfiguration -Report $report -MaxAgents $optimalLimit
            
            Write-Host "`n=== CONFIGURATION COMPLETE ===" -ForegroundColor Green
            Write-Host "Maximum agents configured: $optimalLimit"
            Write-Host "Configuration saved to: $ConfigFile"
        }
        
        if ($Monitor) {
            $optimalLimit = if ($MaxAgents -gt 0) { $MaxAgents } else { $DefaultMaxAgents }
            Start-AgentMonitoring -MaxAgents $optimalLimit -ProjectRoot $ProjectRoot
        }
        
        if ($Optimize) {
            Write-Log "=== OPTIMIZING AGENT DISTRIBUTION ==="
            
            $cursorProcesses = Get-CursorProcesses
            $agentProcesses = Get-AgentProcesses -CursorProcesses $cursorProcesses
            $systemInfo = Analyze-SystemResources
            
            $optimizationPlan = Optimize-AgentDistribution -AgentProcesses $agentProcesses -SystemInfo $systemInfo
            
            Write-Host "`n=== OPTIMIZATION PLAN ===" -ForegroundColor Green
            if ($optimizationPlan.Count -gt 0) {
                foreach ($item in $optimizationPlan) {
                    Write-Host "- $item" -ForegroundColor Yellow
                }
            } else {
                Write-Host "No optimization needed - current distribution is optimal" -ForegroundColor Green
            }
        }
        
        if ($Report) {
            Write-Log "=== GENERATING DETAILED REPORT ==="
            
            $cursorProcesses = Get-CursorProcesses
            $agentProcesses = Get-AgentProcesses -CursorProcesses $cursorProcesses
            $systemInfo = Analyze-SystemResources
            $optimalLimit = Get-OptimalAgentLimit -SystemInfo $systemInfo -CurrentAgents $agentProcesses
            
            $report = New-AgentAnalysisReport -CursorProcesses $cursorProcesses -AgentProcesses $agentProcesses -SystemInfo $systemInfo -OptimalLimit $optimalLimit
            
            $reportPath = Join-Path $ProjectRoot "cursor-agent-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
            $report | ConvertTo-Json -Depth 10 | Set-Content -Path $reportPath
            
            Write-Host "`n=== DETAILED REPORT GENERATED ===" -ForegroundColor Green
            Write-Host "Report saved to: $reportPath"
        }
        
        # If no specific action specified, run analysis
        if (-not ($Analyze -or $Configure -or $Monitor -or $Optimize -or $Report)) {
            Write-Log "No specific action specified, running analysis..."
            & $PSCommandPath -Analyze -ProjectRoot $ProjectRoot
        }
    }
    catch {
        Write-Log "Error in main execution: $($_.Exception.Message)" "ERROR"
        Write-Log "Stack trace: $($_.ScriptStackTrace)" "ERROR"
        exit 1
    }
}

# Execute main function
Main
