#Requires -Version 5.1
<#
.SYNOPSIS
    Cursor Integration Manager for Viridian Football Project
    
.DESCRIPTION
    Advanced PowerShell script that provides deep integration with Cursor IDE,
    including automatic agent lifecycle management, resource optimization,
    and intelligent configuration management.
    
    Features:
    - Deep Cursor process integration and monitoring
    - Automatic agent lifecycle management
    - Intelligent resource allocation and optimization
    - Configuration file management for Cursor
    - Real-time agent performance tracking
    - Automatic agent scaling based on workload
    - Integration with project-specific agent patterns
    
.PARAMETER Initialize
    Initialize the Cursor integration system
    
.PARAMETER Monitor
    Start real-time monitoring of Cursor and agents
    
.PARAMETER Optimize
    Optimize current agent distribution and resources
    
.PARAMETER Scale
    Scale agents up or down based on current workload
    
.PARAMETER Configure
    Configure Cursor settings for optimal agent management
    
.PARAMETER Report
    Generate comprehensive integration report
    
.PARAMETER AutoManage
    Enable automatic agent management mode
    
.PARAMETER ProjectRoot
    Path to Viridian Football project root
    
.EXAMPLE
    .\cursor-integration-manager.ps1 -Initialize
    .\cursor-integration-manager.ps1 -Monitor -AutoManage
    .\cursor-integration-manager.ps1 -Scale -ProjectRoot "C:\Projects\Viridian Football"
    
.NOTES
    Requires PowerShell 5.1 or higher
    Requires administrative privileges for full functionality
    Integrates with intelligent-agent-analyzer.py
#>

param(
    [switch]$Initialize,
    [switch]$Monitor,
    [switch]$Optimize,
    [switch]$Scale,
    [switch]$Configure,
    [switch]$Report,
    [switch]$AutoManage,
    [string]$ProjectRoot = "."
)

# Script configuration
$ScriptVersion = "2.0.0"
$ConfigFile = "cursor-integration-config.json"
$LogFile = "cursor-integration-manager.log"
$CursorConfigDir = "$env:APPDATA\Cursor\User"
$CursorConfigFile = "settings.json"

# Advanced agent management settings
$DefaultMaxAgents = 5
$MinMemoryPerAgent = 512  # MB
$MaxCpuPerAgent = 25      # Percentage
$HeartbeatInterval = 30   # Seconds
$ResourceCheckInterval = 60  # Seconds
$AutoScaleThreshold = 0.8  # 80% resource usage triggers scaling
$ScaleDownThreshold = 0.3  # 30% resource usage triggers scale down

# Cursor process patterns (enhanced)
$CursorProcessPatterns = @(
    "Cursor",
    "cursor",
    "Cursor.exe",
    "cursor.exe",
    "Cursor Helper",
    "Cursor Helper (Renderer)",
    "Cursor Helper (GPU)",
    "Cursor Helper (Plugin Host)"
)

# Enhanced agent detection patterns
$AgentPatterns = @{
    "Engine Development Agent" = @{
        Keywords = @("engine", "USE", "performance", "optimization", "core", "system", "simulation")
        ProcessPatterns = @("python", "java", "rust", "node")
        FilePatterns = @("engine", "USE", "performance", "simulation")
        Priority = 1
        MinInstances = 1
        MaxInstances = 3
        ResourceWeight = 1.2
    }
    "Testing Agent" = @{
        Keywords = @("test", "validation", "quality", "coverage", "qa", "testing", "pytest")
        ProcessPatterns = @("pytest", "test", "validation", "python")
        FilePatterns = @("test", "validation", "quality", "pytest")
        Priority = 2
        MinInstances = 1
        MaxInstances = 2
        ResourceWeight = 0.8
    }
    "Data Model Agent" = @{
        Keywords = @("data", "schema", "database", "model", "structure", "migration", "entity")
        ProcessPatterns = @("database", "schema", "migration", "python")
        FilePatterns = @("data", "schema", "database", "model")
        Priority = 3
        MinInstances = 1
        MaxInstances = 2
        ResourceWeight = 1.0
    }
    "Orchestrator Agent" = @{
        Keywords = @("orchestrator", "coordinate", "manage", "delegate", "supervise", "orchestrate")
        ProcessPatterns = @("orchestrator", "coordinator", "manager", "python")
        FilePatterns = @("orchestrator", "coordinate", "manage")
        Priority = 4
        MinInstances = 1
        MaxInstances = 1
        ResourceWeight = 1.5
    }
    "Documentation Agent" = @{
        Keywords = @("documentation", "docs", "markdown", "readme", "guide", "doc")
        ProcessPatterns = @("markdown", "docs", "documentation", "python")
        FilePatterns = @("docs", "documentation", "readme", "markdown")
        Priority = 5
        MinInstances = 1
        MaxInstances = 2
        ResourceWeight = 0.6
    }
    "AI Research Agent" = @{
        Keywords = @("ai", "research", "analysis", "intelligence", "ml", "machine learning")
        ProcessPatterns = @("python", "research", "analysis", "ai")
        FilePatterns = @("ai", "research", "analysis", "intelligence")
        Priority = 6
        MinInstances = 1
        MaxInstances = 2
        ResourceWeight = 1.1
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
    
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN" { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        "INFO" { Write-Host $logEntry -ForegroundColor White }
        default { Write-Host $logEntry }
    }
    
    Add-Content -Path $LogFile -Value $logEntry
}

function Initialize-CursorIntegration {
    Write-Log "Initializing Cursor Integration Manager v$ScriptVersion" "INFO"
    
    # Check PowerShell version
    if ($PSVersionTable.PSVersion.Major -lt 5) {
        throw "PowerShell 5.1 or higher is required"
    }
    
    # Check if running as administrator
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
    
    # Check Cursor installation
    $cursorInstalled = Test-CursorInstallation
    if (-not $cursorInstalled) {
        Write-Log "WARNING: Cursor installation not detected" "WARN"
    }
    
    # Create configuration directory if it doesn't exist
    $configDir = Split-Path (Join-Path $ProjectRoot $ConfigFile) -Parent
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }
    
    Write-Log "Cursor Integration Manager initialized successfully" "SUCCESS"
}

function Test-CursorInstallation {
    Write-Log "Checking Cursor installation..." "INFO"
    
    # Check common installation paths
    $cursorPaths = @(
        "$env:LOCALAPPDATA\Programs\Cursor\Cursor.exe",
        "$env:ProgramFiles\Cursor\Cursor.exe",
        "$env:ProgramFiles(x86)\Cursor\Cursor.exe"
    )
    
    foreach ($path in $cursorPaths) {
        if (Test-Path $path) {
            Write-Log "Cursor found at: $path" "SUCCESS"
            return $true
        }
    }
    
    # Check if Cursor is running
    $cursorProcesses = Get-Process | Where-Object { $_.ProcessName -like "*cursor*" -or $_.ProcessName -like "*Cursor*" }
    if ($cursorProcesses.Count -gt 0) {
        Write-Log "Cursor is running (processes detected)" "SUCCESS"
        return $true
    }
    
    return $false
}

function Get-CursorConfiguration {
    Write-Log "Reading Cursor configuration..." "INFO"
    
    $configPath = Join-Path $CursorConfigDir $CursorConfigFile
    
    if (Test-Path $configPath) {
        try {
            $config = Get-Content -Path $configPath -Raw | ConvertFrom-Json
            Write-Log "Cursor configuration loaded successfully" "SUCCESS"
            return $config
        }
        catch {
            Write-Log "Error reading Cursor configuration: $($_.Exception.Message)" "ERROR"
            return $null
        }
    } else {
        Write-Log "Cursor configuration file not found at: $configPath" "WARN"
        return $null
    }
}

function Set-CursorConfiguration {
    param(
        [object]$Config
    )
    
    Write-Log "Updating Cursor configuration..." "INFO"
    
    $configPath = Join-Path $CursorConfigDir $CursorConfigFile
    
    try {
        # Create backup of existing config
        if (Test-Path $configPath) {
            $backupPath = "$configPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Copy-Item -Path $configPath -Destination $backupPath
            Write-Log "Configuration backup created: $backupPath" "INFO"
        }
        
        # Ensure directory exists
        $configDir = Split-Path $configPath -Parent
        if (-not (Test-Path $configDir)) {
            New-Item -ItemType Directory -Path $configDir -Force | Out-Null
        }
        
        # Save new configuration
        $Config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath
        
        Write-Log "Cursor configuration updated successfully" "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Error updating Cursor configuration: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Get-EnhancedCursorProcesses {
    Write-Log "Detecting enhanced Cursor processes..." "INFO"
    
    $cursorProcesses = @()
    
    # Get processes by name pattern
    foreach ($pattern in $CursorProcessPatterns) {
        $processes = Get-Process -Name $pattern -ErrorAction SilentlyContinue
        $cursorProcesses += $processes
    }
    
    # Get processes with "cursor" in command line
    $allProcesses = Get-Process | Where-Object { 
        $_.ProcessName -like "*cursor*" -or $_.ProcessName -like "*Cursor*" 
    }
    $cursorProcesses += $allProcesses
    
    # Remove duplicates and add enhanced information
    $enhancedProcesses = @()
    $cursorProcesses | Sort-Object Id -Unique | ForEach-Object {
        try {
            $process = $_
            $cmdline = (Get-WmiObject -Class Win32_Process -Filter "ProcessId = $($process.Id)").CommandLine
            
            $enhancedProcess = [PSCustomObject]@{
                ProcessId = $process.Id
                ProcessName = $process.ProcessName
                StartTime = $process.StartTime
                CPU = $process.CPU
                WorkingSet = $process.WorkingSet
                PrivateMemorySize = $process.PrivateMemorySize
                VirtualMemorySize = $process.VirtualMemorySize
                CommandLine = $cmdline
                ProcessType = Get-CursorProcessType -ProcessName $process.ProcessName -CommandLine $cmdline
                IsMainProcess = $process.ProcessName -eq "Cursor" -or $process.ProcessName -eq "cursor"
            }
            
            $enhancedProcesses += $enhancedProcess
        }
        catch {
            Write-Log "Error enhancing process $($process.Id): $($_.Exception.Message)" "ERROR"
        }
    }
    
    Write-Log "Found $($enhancedProcesses.Count) enhanced Cursor processes" "SUCCESS"
    return $enhancedProcesses
}

function Get-CursorProcessType {
    param(
        [string]$ProcessName,
        [string]$CommandLine
    )
    
    if ($ProcessName -eq "Cursor" -or $ProcessName -eq "cursor") {
        return "Main"
    } elseif ($ProcessName -like "*Helper*") {
        if ($ProcessName -like "*Renderer*") {
            return "Renderer"
        } elseif ($ProcessName -like "*GPU*") {
            return "GPU"
        } elseif ($ProcessName -like "*Plugin*") {
            return "Plugin"
        } else {
            return "Helper"
        }
    } elseif ($ProcessName -like "*Extension*") {
        return "Extension"
    } else {
        return "Unknown"
    }
}

function Get-EnhancedAgentProcesses {
    param(
        [array]$CursorProcesses
    )
    
    Write-Log "Analyzing enhanced agent processes..." "INFO"
    
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
                        # Calculate performance metrics
                        $performanceScore = Calculate-AgentPerformance -Process $process -Pattern $pattern
                        $resourceEfficiency = Calculate-ResourceEfficiency -Process $process -Pattern $pattern
                        
                        $agentInfo = [PSCustomObject]@{
                            ProcessId = $process.Id
                            ProcessName = $process.ProcessName
                            AgentType = $agentType
                            CommandLine = $cmdline
                            StartTime = $process.StartTime
                            CPU = $process.CPU
                            WorkingSet = $process.WorkingSet
                            PrivateMemorySize = $process.PrivateMemorySize
                            VirtualMemorySize = $process.VirtualMemorySize
                            Priority = $pattern.Priority
                            MinInstances = $pattern.MinInstances
                            MaxInstances = $pattern.MaxInstances
                            ResourceWeight = $pattern.ResourceWeight
                            PerformanceScore = $performanceScore
                            ResourceEfficiency = $resourceEfficiency
                            Status = Get-AgentStatus -Process $process -PerformanceScore $performanceScore
                            Uptime = (Get-Date) - $process.StartTime
                            LastHeartbeat = Get-Date
                        }
                        
                        $agentProcesses += $agentInfo
                        break
                    }
                }
            }
        }
        catch {
            Write-Log "Error analyzing enhanced process $($process.Id): $($_.Exception.Message)" "ERROR"
        }
    }
    
    Write-Log "Found $($agentProcesses.Count) enhanced agent processes" "SUCCESS"
    return $agentProcesses
}

function Calculate-AgentPerformance {
    param(
        [object]$Process,
        [hashtable]$Pattern
    )
    
    # Base score on resource usage and uptime
    $cpuScore = [math]::Max(0, 100 - $Process.CPU)
    $memoryScore = [math]::Max(0, 100 - ($Process.WorkingSet / 1MB / 100))
    $uptimeScore = [math]::Min(100, $Process.StartTime.Ticks / [DateTime]::Now.Ticks * 100)
    
    # Weighted average
    $performanceScore = ($cpuScore * 0.4) + ($memoryScore * 0.4) + ($uptimeScore * 0.2)
    
    return [math]::Round($performanceScore, 2)
}

function Calculate-ResourceEfficiency {
    param(
        [object]$Process,
        [hashtable]$Pattern
    )
    
    # Calculate efficiency based on resource usage vs. expected
    $expectedMemory = $MinMemoryPerAgent * $Pattern.ResourceWeight
    $actualMemory = $Process.WorkingSet / 1MB
    
    $memoryEfficiency = [math]::Max(0, 100 - (($actualMemory - $expectedMemory) / $expectedMemory * 100))
    
    return [math]::Round($memoryEfficiency, 2)
}

function Get-AgentStatus {
    param(
        [object]$Process,
        [double]$PerformanceScore
    )
    
    if ($PerformanceScore -gt 80) {
        return "Optimal"
    } elseif ($PerformanceScore -gt 60) {
        return "Good"
    } elseif ($PerformanceScore -gt 40) {
        return "Fair"
    } elseif ($PerformanceScore -gt 20) {
        return "Poor"
    } else {
        return "Critical"
    }
}

function Analyze-SystemResources {
    Write-Log "Analyzing enhanced system resources..." "INFO"
    
    $cpuInfo = Get-WmiObject -Class Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors
    $memoryInfo = Get-WmiObject -Class Win32_ComputerSystem | Select-Object TotalPhysicalMemory
    $diskInfo = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DeviceID -eq "C:" } | Select-Object Size, FreeSpace
    
    $totalMemoryGB = [math]::Round($memoryInfo.TotalPhysicalMemory / 1GB, 2)
    $freeMemoryGB = [math]::Round((Get-Counter "\Memory\Available MBytes").CounterSamples[0].CookedValue / 1024, 2)
    $cpuCores = $cpuInfo.NumberOfLogicalProcessors
    $freeDiskGB = [math]::Round($diskInfo.FreeSpace / 1GB, 2)
    
    # Calculate CPU usage
    $cpuUsage = (Get-Counter "\Processor(_Total)\% Processor Time").CounterSamples[0].CookedValue
    
    # Calculate memory usage
    $memoryUsage = (Get-Counter "\Memory\% Committed Bytes In Use").CounterSamples[0].CookedValue
    
    $systemInfo = [PSCustomObject]@{
        CPU = $cpuInfo
        TotalMemoryGB = $totalMemoryGB
        FreeMemoryGB = $freeMemoryGB
        CPUCores = $cpuCores
        FreeDiskGB = $freeDiskGB
        CPUUsage = [math]::Round($cpuUsage, 2)
        MemoryUsage = [math]::Round($memoryUsage, 2)
        RecommendedMaxAgents = [math]::Min([math]::Floor($freeMemoryGB / ($MinMemoryPerAgent / 1024)), $cpuCores)
        SystemLoad = [math]::Max($cpuUsage / 100, $memoryUsage / 100)
    }
    
    Write-Log "Enhanced System Analysis: $cpuCores cores, ${totalMemoryGB}GB RAM (${freeMemoryGB}GB free), CPU: $($systemInfo.CPUUsage)%, Memory: $($systemInfo.MemoryUsage)%" "SUCCESS"
    Write-Log "System load: $([math]::Round($systemInfo.SystemLoad * 100, 1))%, Recommended max agents: $($systemInfo.RecommendedMaxAgents)" "INFO"
    
    return $systemInfo
}

function Optimize-AgentDistribution {
    param(
        [array]$AgentProcesses,
        [object]$SystemInfo
    )
    
    Write-Log "Optimizing agent distribution..." "INFO"
    
    $optimizationPlan = @()
    $agentsByType = $AgentProcesses | Group-Object AgentType
    
    foreach ($group in $agentsByType) {
        $agentType = $group.Name
        $pattern = $AgentPatterns[$agentType]
        $count = $group.Count
        
        # Check instance limits
        if ($count -gt $pattern.MaxInstances) {
            $optimizationPlan += @{
                Action = "Reduce"
                AgentType = $agentType
                Current = $count
                Target = $pattern.MaxInstances
                Reason = "Exceeds maximum instances"
                Priority = "High"
            }
        } elseif ($count -lt $pattern.MinInstances) {
            $optimizationPlan += @{
                Action = "Increase"
                AgentType = $agentType
                Current = $count
                Target = $pattern.MinInstances
                Reason = "Below minimum instances"
                Priority = "Medium"
            }
        }
        
        # Check performance
        $poorPerformers = $group.Group | Where-Object { $_.Status -in @("Poor", "Critical") }
        if ($poorPerformers.Count -gt 0) {
            $optimizationPlan += @{
                Action = "Optimize"
                AgentType = $agentType
                Current = $poorPerformers.Count
                Target = 0
                Reason = "Poor performance agents detected"
                Priority = "High"
            }
        }
    }
    
    # Check system load
    if ($SystemInfo.SystemLoad -gt $AutoScaleThreshold) {
        $optimizationPlan += @{
            Action = "ScaleDown"
            AgentType = "All"
            Current = $AgentProcesses.Count
            Target = [math]::Max(1, [math]::Floor($AgentProcesses.Count * 0.8))
            Reason = "High system load: $([math]::Round($SystemInfo.SystemLoad * 100, 1))%"
            Priority = "Critical"
        }
    } elseif ($SystemInfo.SystemLoad -lt $ScaleDownThreshold -and $AgentProcesses.Count -gt 1) {
        $optimizationPlan += @{
            Action = "ScaleDown"
            AgentType = "All"
            Current = $AgentProcesses.Count
            Target = [math]::Max(1, [math]::Floor($AgentProcesses.Count * 0.9))
            Reason = "Low system load: $([math]::Round($SystemInfo.SystemLoad * 100, 1))%"
            Priority = "Low"
        }
    }
    
    return $optimizationPlan
}

function Start-EnhancedMonitoring {
    param(
        [switch]$AutoManage
    )
    
    Write-Log "Starting enhanced agent monitoring..." "INFO"
    Write-Log "Monitoring interval: $ResourceCheckInterval seconds" "INFO"
    if ($AutoManage) {
        Write-Log "Auto-management mode: ENABLED" "SUCCESS"
    }
    Write-Log "Press Ctrl+C to stop monitoring" "INFO"
    
    $monitoringData = @{
        StartTime = Get-Date
        CheckCount = 0
        Optimizations = @()
        Alerts = @()
    }
    
    try {
        while ($true) {
            $monitoringData.CheckCount++
            $currentTime = Get-Date
            
            # Get current state
            $cursorProcesses = Get-EnhancedCursorProcesses
            $agentProcesses = Get-EnhancedAgentProcesses -CursorProcesses $cursorProcesses
            $systemInfo = Analyze-SystemResources
            
            # Display status
            $statusLine = "[$($currentTime.ToString('HH:mm:ss'))] Check #$($monitoringData.CheckCount) | "
            $statusLine += "Cursor: $($cursorProcesses.Count) | "
            $statusLine += "Agents: $($agentProcesses.Count) | "
            $statusLine += "CPU: $($systemInfo.CPUUsage)% | "
            $statusLine += "RAM: $($systemInfo.MemoryUsage)% | "
            $statusLine += "Load: $([math]::Round($systemInfo.SystemLoad * 100, 1))%"
            
            Write-Host $statusLine
            
            # Auto-management logic
            if ($AutoManage) {
                $optimizationPlan = Optimize-AgentDistribution -AgentProcesses $agentProcesses -SystemInfo $systemInfo
                
                foreach ($optimization in $optimizationPlan) {
                    if ($optimization.Priority -in @("Critical", "High")) {
                        Write-Log "Auto-optimization: $($optimization.Action) $($optimization.AgentType) - $($optimization.Reason)" "WARN"
                        $monitoringData.Optimizations += @{
                            Time = $currentTime
                            Action = $optimization.Action
                            AgentType = $optimization.AgentType
                            Reason = $optimization.Reason
                        }
                    }
                }
                
                # Check for critical alerts
                if ($systemInfo.SystemLoad -gt 0.95) {
                    $alert = "CRITICAL: System load at $([math]::Round($systemInfo.SystemLoad * 100, 1))%"
                    Write-Log $alert "ERROR"
                    $monitoringData.Alerts += @{
                        Time = $currentTime
                        Level = "Critical"
                        Message = $alert
                    }
                }
            }
            
            Start-Sleep -Seconds $ResourceCheckInterval
        }
    }
    catch {
        Write-Log "Monitoring stopped: $($_.Exception.Message)" "INFO"
        
        # Save monitoring report
        $reportPath = Join-Path $ProjectRoot "monitoring-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        $monitoringData | ConvertTo-Json -Depth 10 | Set-Content -Path $reportPath
        Write-Log "Monitoring report saved to: $reportPath" "INFO"
    }
}

function Generate-IntegrationReport {
    param(
        [array]$CursorProcesses,
        [array]$AgentProcesses,
        [object]$SystemInfo
    )
    
    Write-Log "Generating comprehensive integration report..." "INFO"
    
    $report = [PSCustomObject]@{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        ScriptVersion = $ScriptVersion
        CursorProcesses = @{
            Count = $CursorProcesses.Count
            Details = $CursorProcesses
        }
        AgentProcesses = @{
            Count = $AgentProcesses.Count
            Details = $AgentProcesses
            ByType = $AgentProcesses | Group-Object AgentType | ForEach-Object {
                @{
                    Type = $_.Name
                    Count = $_.Count
                    AveragePerformance = [math]::Round(($_.Group | Measure-Object -Property PerformanceScore -Average).Average, 2)
                    AverageEfficiency = [math]::Round(($_.Group | Measure-Object -Property ResourceEfficiency -Average).Average, 2)
                }
            }
        }
        SystemResources = $SystemInfo
        OptimizationPlan = Optimize-AgentDistribution -AgentProcesses $AgentProcesses -SystemInfo $SystemInfo
        Recommendations = @()
    }
    
    # Generate recommendations
    if ($AgentProcesses.Count -eq 0) {
        $report.Recommendations += "No agents detected. Consider starting agents for project tasks."
    }
    
    if ($SystemInfo.SystemLoad -gt $AutoScaleThreshold) {
        $report.Recommendations += "High system load detected. Consider reducing agent count or optimizing resource usage."
    }
    
    $poorPerformers = $AgentProcesses | Where-Object { $_.Status -in @("Poor", "Critical") }
    if ($poorPerformers.Count -gt 0) {
        $report.Recommendations += "$($poorPerformers.Count) agents performing poorly. Consider restarting or optimizing these agents."
    }
    
    return $report
}

# Main execution logic
function Main {
    try {
        Initialize-CursorIntegration
        
        if ($Initialize) {
            Write-Log "=== INITIALIZING CURSOR INTEGRATION ===" "INFO"
            
            # Test Cursor installation
            $cursorInstalled = Test-CursorInstallation
            if (-not $cursorInstalled) {
                Write-Log "WARNING: Cursor installation not detected. Some features may not work." "WARN"
            }
            
            # Get current Cursor configuration
            $cursorConfig = Get-CursorConfiguration
            if ($cursorConfig) {
                Write-Log "Current Cursor configuration loaded" "SUCCESS"
            }
            
            # Create integration configuration
            $integrationConfig = [PSCustomObject]@{
                LastUpdated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                ScriptVersion = $ScriptVersion
                CursorInstalled = $cursorInstalled
                AgentPatterns = $AgentPatterns
                Settings = @{
                    DefaultMaxAgents = $DefaultMaxAgents
                    MinMemoryPerAgent = $MinMemoryPerAgent
                    MaxCpuPerAgent = $MaxCpuPerAgent
                    HeartbeatInterval = $HeartbeatInterval
                    ResourceCheckInterval = $ResourceCheckInterval
                    AutoScaleThreshold = $AutoScaleThreshold
                    ScaleDownThreshold = $ScaleDownThreshold
                }
            }
            
            $configPath = Join-Path $ProjectRoot $ConfigFile
            $integrationConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath
            
            Write-Log "Integration configuration saved to: $configPath" "SUCCESS"
        }
        
        if ($Monitor) {
            Write-Log "=== STARTING ENHANCED MONITORING ===" "INFO"
            Start-EnhancedMonitoring -AutoManage:$AutoManage
        }
        
        if ($Optimize) {
            Write-Log "=== OPTIMIZING AGENT DISTRIBUTION ===" "INFO"
            
            $cursorProcesses = Get-EnhancedCursorProcesses
            $agentProcesses = Get-EnhancedAgentProcesses -CursorProcesses $cursorProcesses
            $systemInfo = Analyze-SystemResources
            
            $optimizationPlan = Optimize-AgentDistribution -AgentProcesses $agentProcesses -SystemInfo $systemInfo
            
            Write-Host "`n=== OPTIMIZATION PLAN ===" -ForegroundColor Green
            if ($optimizationPlan.Count -gt 0) {
                foreach ($item in $optimizationPlan) {
                    $color = switch ($item.Priority) {
                        "Critical" { "Red" }
                        "High" { "Yellow" }
                        "Medium" { "Cyan" }
                        "Low" { "White" }
                    }
                    Write-Host "- [$($item.Priority)] $($item.Action) $($item.AgentType): $($item.Reason)" -ForegroundColor $color
                }
            } else {
                Write-Host "No optimization needed - current distribution is optimal" -ForegroundColor Green
            }
        }
        
        if ($Scale) {
            Write-Log "=== SCALING AGENTS ===" "INFO"
            
            $cursorProcesses = Get-EnhancedCursorProcesses
            $agentProcesses = Get-EnhancedAgentProcesses -CursorProcesses $cursorProcesses
            $systemInfo = Analyze-SystemResources
            
            $optimizationPlan = Optimize-AgentDistribution -AgentProcesses $agentProcesses -SystemInfo $systemInfo
            
            $scaleActions = $optimizationPlan | Where-Object { $_.Action -in @("ScaleDown", "Increase", "Reduce") }
            
            if ($scaleActions.Count -gt 0) {
                Write-Host "`n=== SCALING ACTIONS ===" -ForegroundColor Green
                foreach ($action in $scaleActions) {
                    Write-Host "- $($action.Action) $($action.AgentType): $($action.Current) → $($action.Target) ($($action.Reason))" -ForegroundColor Yellow
                }
            } else {
                Write-Host "No scaling actions needed" -ForegroundColor Green
            }
        }
        
        if ($Configure) {
            Write-Log "=== CONFIGURING CURSOR SETTINGS ===" "INFO"
            
            $cursorConfig = Get-CursorConfiguration
            
            if ($cursorConfig) {
                # Add or update agent management settings
                if (-not $cursorConfig.PSObject.Properties.Name -contains "agentManagement") {
                    $cursorConfig | Add-Member -MemberType NoteProperty -Name "agentManagement" -Value @{}
                }
                
                $cursorConfig.agentManagement = @{
                    enabled = $true
                    maxAgents = $DefaultMaxAgents
                    autoScale = $true
                    monitoring = $true
                    lastConfigured = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                }
                
                $success = Set-CursorConfiguration -Config $cursorConfig
                if ($success) {
                    Write-Log "Cursor configuration updated successfully" "SUCCESS"
                }
            }
        }
        
        if ($Report) {
            Write-Log "=== GENERATING INTEGRATION REPORT ===" "INFO"
            
            $cursorProcesses = Get-EnhancedCursorProcesses
            $agentProcesses = Get-EnhancedAgentProcesses -CursorProcesses $cursorProcesses
            $systemInfo = Analyze-SystemResources
            
            $report = Generate-IntegrationReport -CursorProcesses $cursorProcesses -AgentProcesses $agentProcesses -SystemInfo $systemInfo
            
            $reportPath = Join-Path $ProjectRoot "cursor-integration-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
            $report | ConvertTo-Json -Depth 10 | Set-Content -Path $reportPath
            
            Write-Host "`n=== INTEGRATION REPORT GENERATED ===" -ForegroundColor Green
            Write-Host "Report saved to: $reportPath" -ForegroundColor Green
            
            # Display summary
            Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
            Write-Host "Cursor Processes: $($report.CursorProcesses.Count)"
            Write-Host "Agent Processes: $($report.AgentProcesses.Count)"
            Write-Host "System Load: $([math]::Round($report.SystemResources.SystemLoad * 100, 1))%"
            Write-Host "Optimization Actions: $($report.OptimizationPlan.Count)"
            Write-Host "Recommendations: $($report.Recommendations.Count)"
        }
        
        # If no specific action specified, run initialization
        if (-not ($Initialize -or $Monitor -or $Optimize -or $Scale -or $Configure -or $Report)) {
            Write-Log "No specific action specified, running initialization..." "INFO"
            & $PSCommandPath -Initialize -ProjectRoot $ProjectRoot
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
