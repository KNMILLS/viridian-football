# Viridian Football GitHub Setup Script (Complete)
# This script follows multi-agent AI protocols and sets up GitHub with Cursor agent write access
# Document ID: SETUP-GITHUB-001
# Version: 1.0
# Status: Active

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$RepositoryName = "viridian-football",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipConfirmation = $false,
    
    [Parameter(Mandatory=$false)]
    [int]$TimeoutSeconds = 300
)

# Multi-Agent AI Protocol Compliance
# Following protocols from docs/04-research-analysis/04-ai-research/multi-agent-ai-resilience-strategies.md

# Set error action preference for graceful failure
$ErrorActionPreference = "Continue"

# Colors for output (following project standards)
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"
$White = "White"

# Agent initialization protocol
function Initialize-Agent {
    Write-ColorOutput "🤖 Initializing Viridian Football GitHub Setup Agent..." $Cyan
    Write-ColorOutput "Protocols: Multi-Agent AI Resilience Strategies" $White
    Write-ColorOutput "Role: GitHub Setup and Cursor Agent Configuration" $White
    Write-ColorOutput "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" $White
    
    # Validate required documents exist
    $requiredDocs = @(
        "docs/04-research-analysis/04-ai-research/multi-agent-ai-resilience-strategies.md",
        "docs/07-governance/02-architecture-decisions/agent-governance.md",
        "docs/03-technical-architecture/01-engine-specs/engine_specification.md"
    )
    
    foreach ($doc in $requiredDocs) {
        if (-not (Test-Path $doc)) {
            Write-ColorOutput "⚠️  Warning: Required document not found: $doc" $Yellow
        } else {
            Write-ColorOutput "✅ Found: $doc" $Green
        }
    }
    
    Write-ColorOutput "Agent initialized successfully" $Green
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-GitInstalled {
    try {
        $result = git --version 2>$null
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

function Test-GitRepository {
    try {
        $null = git rev-parse --git-dir 2>$null
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

function Test-GitHubAuthentication {
    Write-ColorOutput "🔐 Testing GitHub authentication..." $Cyan
    
    try {
        # Test with timeout following multi-agent protocols
        $result = git ls-remote "https://github.com/$GitHubUsername/$RepositoryName.git" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ GitHub authentication successful" $Green
            return $true
        } else {
            Write-ColorOutput "❌ GitHub authentication failed" $Red
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ GitHub authentication error: $($_.Exception.Message)" $Red
        return $false
    }
}

function Setup-ExistingRepository {
    Write-ColorOutput "🔧 Setting up existing repository..." $Cyan
    
    # Check if we're in a git repository
    if (-not (Test-GitRepository)) {
        Write-ColorOutput "❌ Not in a Git repository. Please run this script from your project directory." $Red
        return $false
    }
    
    # Add all files with timeout protection
    Write-ColorOutput "📁 Adding files to Git..." $Cyan
    try {
        git add .
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "❌ Failed to add files to Git" $Red
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Error adding files: $($_.Exception.Message)" $Red
        return $false
    }
    
    # Check if there are changes to commit
    $status = git status --porcelain
    if ($status) {
        Write-ColorOutput "💾 Committing changes..." $Cyan
        try {
            git commit -m "Update project files and documentation - Agent Setup $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
            if ($LASTEXITCODE -ne 0) {
                Write-ColorOutput "❌ Failed to commit changes" $Red
                return $false
            }
        }
        catch {
            Write-ColorOutput "❌ Error committing changes: $($_.Exception.Message)" $Red
            return $false
        }
    } else {
        Write-ColorOutput "✅ No changes to commit" $Green
    }
    
    # Set main branch
    try {
        git branch -M main
        Write-ColorOutput "✅ Set main branch" $Green
    }
    catch {
        Write-ColorOutput "❌ Error setting main branch: $($_.Exception.Message)" $Red
        return $false
    }
    
    return $true
}

function Setup-RemoteRepository {
    param([string]$Username, [string]$RepoName)
    
    Write-ColorOutput "🔗 Setting up remote repository..." $Cyan
    
    $remoteUrl = "https://github.com/$Username/$RepoName.git"
    
    # Remove existing remote if it exists
    git remote remove origin 2>$null
    
    # Add new remote
    try {
        git remote add origin $remoteUrl
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "❌ Failed to add remote repository" $Red
            return $false
        }
        Write-ColorOutput "✅ Remote repository configured: $remoteUrl" $Green
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error configuring remote: $($_.Exception.Message)" $Red
        return $false
    }
}

function Push-ToGitHub {
    Write-ColorOutput "🚀 Pushing to GitHub..." $Cyan
    
    try {
        # Use timeout following multi-agent protocols
        $job = Start-Job -ScriptBlock {
            param($remoteUrl)
            git push -u origin main
        } -ArgumentList $remoteUrl
        
        # Wait for job with timeout
        if (Wait-Job $job -Timeout $TimeoutSeconds) {
            $result = Receive-Job $job
            Remove-Job $job
            
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✅ Successfully pushed to GitHub!" $Green
                return $true
            } else {
                Write-ColorOutput "❌ Failed to push to GitHub" $Red
                return $false
            }
        } else {
            Write-ColorOutput "❌ Push operation timed out after $TimeoutSeconds seconds" $Red
            Stop-Job $job
            Remove-Job $job
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Error pushing to GitHub: $($_.Exception.Message)" $Red
        return $false
    }
}

function Show-CursorSetupInstructions {
    Write-ColorOutput "`n🎯 Cursor AI Agent Setup Instructions:" $Cyan
    Write-ColorOutput "=====================================" $Cyan
    
    Write-ColorOutput "`n📋 Multi-Agent AI Protocol Compliance:" $Yellow
    Write-ColorOutput "This setup follows the multi-agent AI resilience strategies from:" $White
    Write-ColorOutput "docs/04-research-analysis/04-ai-research/multi-agent-ai-resilience-strategies.md" $White
    
    Write-ColorOutput "`n1. Create a Personal Access Token:" $Yellow
    Write-ColorOutput "   - Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)" $White
    Write-ColorOutput "   - Click 'Generate new token (classic)'" $White
    Write-ColorOutput "   - Give it a name like 'Cursor AI Access - Viridian Football'" $White
    Write-ColorOutput "   - Select scopes: repo (full control of private repositories)" $White
    Write-ColorOutput "   - Click 'Generate token' and copy it" $White
    
    Write-ColorOutput "`n2. Configure Cursor with Multi-Agent Protocols:" $Yellow
    Write-ColorOutput "   - In Cursor, go to Settings → Extensions → GitHub Copilot" $White
    Write-ColorOutput "   - Add your GitHub credentials or use the token for authentication" $White
    Write-ColorOutput "   - Ensure Cursor has access to the project documentation" $White
    
    Write-ColorOutput "`n3. Agent Governance Compliance:" $Yellow
    Write-ColorOutput "   - Review docs/07-governance/02-architecture-decisions/agent-governance.md" $White
    Write-ColorOutput "   - Follow RASCI matrix for agent roles" $White
    Write-ColorOutput "   - Use proper citation format: 【message_idx†source】" $White
    
    Write-ColorOutput "`n4. Multi-Agent AI Protocols:" $Yellow
    Write-ColorOutput "   - Implement timeout protection for all operations" $White
    Write-ColorOutput "   - Use JSON format for inter-agent communication" $White
    Write-ColorOutput "   - Follow error handling and recovery protocols" $White
    Write-ColorOutput "   - Monitor resource usage and implement health checks" $White
    
    Write-ColorOutput "`n5. Test Agent Access:" $Yellow
    Write-ColorOutput "   - Try making a small change in Cursor" $White
    Write-ColorOutput "   - Commit and push to verify write access works" $White
    Write-ColorOutput "   - Verify multi-agent protocols are followed" $White
}

function Show-ManualRepositoryInstructions {
    param([string]$Username, [string]$RepoName)
    
    Write-ColorOutput "`n📋 Manual Repository Creation Instructions:" $Yellow
    Write-ColorOutput "=========================================" $Yellow
    Write-ColorOutput "1. Go to https://github.com/new" $White
    Write-ColorOutput "2. Repository name: $RepoName" $White
    Write-ColorOutput "3. Description: A comprehensive football game engine and documentation system" $White
    Write-ColorOutput "4. Make it Public or Private (your choice)" $White
    Write-ColorOutput "5. DO NOT initialize with README, .gitignore, or license" $White
    Write-ColorOutput "6. Click 'Create repository'" $White
    Write-ColorOutput "7. After creating, run this script again to push your code" $White
}

function Validate-Setup {
    Write-ColorOutput "`n🔍 Validating setup..." $Cyan
    
    $validationResults = @{
        "Git Installed" = Test-GitInstalled
        "Git Repository" = Test-GitRepository
        "GitHub Authentication" = Test-GitHubAuthentication
    }
    
    $allValid = $true
    foreach ($check in $validationResults.GetEnumerator()) {
        if ($check.Value) {
            Write-ColorOutput "✅ $($check.Key)" $Green
        } else {
            Write-ColorOutput "❌ $($check.Key)" $Red
            $allValid = $false
        }
    }
    
    return $allValid
}

# Main execution following multi-agent protocols
function Main {
    Write-ColorOutput "🚀 Viridian Football GitHub Setup Script" $Cyan
    Write-ColorOutput "=========================================" $Cyan
    Write-ColorOutput "Multi-Agent AI Protocol Compliant" $Yellow
    Write-ColorOutput "GitHub Username: $GitHubUsername" $White
    Write-ColorOutput "Repository Name: $RepositoryName" $White
    Write-ColorOutput "Timeout: $TimeoutSeconds seconds" $White
    
    # Initialize agent following protocols
    Initialize-Agent
    
    if (-not $SkipConfirmation) {
        Write-ColorOutput "`nDo you want to continue? (Y/N)" $Yellow
        $response = Read-Host
        if ($response -notmatch "^[Yy]") {
            Write-ColorOutput "Setup cancelled." $Red
            return
        }
    }
    
    # Check prerequisites
    Write-ColorOutput "`n🔍 Checking prerequisites..." $Cyan
    
    if (-not (Test-GitInstalled)) {
        Write-ColorOutput "❌ Git is not installed. Please install Git first." $Red
        Write-ColorOutput "   Download from: https://git-scm.com/" $Yellow
        return
    }
    Write-ColorOutput "✅ Git is installed" $Green
    
    # Setup existing repository
    $repoSetup = Setup-ExistingRepository
    if (-not $repoSetup) {
        Write-ColorOutput "❌ Repository setup failed" $Red
        return
    }
    
    # Setup remote repository
    $remoteSetup = Setup-RemoteRepository -Username $GitHubUsername -RepoName $RepositoryName
    if (-not $remoteSetup) {
        Write-ColorOutput "❌ Remote repository setup failed" $Red
        return
    }
    
    # Try to push to GitHub
    $pushSuccess = Push-ToGitHub
    
    if (-not $pushSuccess) {
        Show-ManualRepositoryInstructions -Username $GitHubUsername -RepoName $RepositoryName
    } else {
        Write-ColorOutput "`n🎉 Setup Complete!" $Green
        Write-ColorOutput "=================" $Green
        Write-ColorOutput "Your Viridian Football project has been successfully set up on GitHub!" $White
        Write-ColorOutput "Repository URL: https://github.com/$GitHubUsername/$RepositoryName" $Cyan
        
        # Validate final setup
        $validationPassed = Validate-Setup
        if ($validationPassed) {
            Write-ColorOutput "✅ All validations passed" $Green
        } else {
            Write-ColorOutput "⚠️  Some validations failed - review setup" $Yellow
        }
    }
    
    # Show Cursor setup instructions with multi-agent protocols
    Show-CursorSetupInstructions
    
    Write-ColorOutput "`n📋 Next Steps:" $Yellow
    Write-ColorOutput "1. Follow the Cursor AI Agent setup instructions above" $White
    Write-ColorOutput "2. Review multi-agent AI protocols in project documentation" $White
    Write-ColorOutput "3. Test the setup by making a small change and pushing it" $White
    Write-ColorOutput "4. Ensure all agents follow governance framework" $White
    Write-ColorOutput "5. Start developing your football game engine!" $White
    
    Write-ColorOutput "`n🔗 Multi-Agent AI Documentation:" $Cyan
    Write-ColorOutput "docs/04-research-analysis/04-ai-research/multi-agent-ai-resilience-strategies.md" $White
    Write-ColorOutput "docs/07-governance/02-architecture-decisions/agent-governance.md" $White
}

# Run the main function with error handling
try {
    Main
}
catch {
    Write-ColorOutput "❌ Critical error in setup script: $($_.Exception.Message)" $Red
    Write-ColorOutput "Please check the error and try again." $Yellow
    exit 1
}
