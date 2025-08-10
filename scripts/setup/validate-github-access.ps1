# GitHub Access Validation Script for Background Agents
# This script validates GitHub access without requiring GitHub CLI

Write-Host "Validating GitHub setup for background agents..." -ForegroundColor Cyan

# Check 1: Git repository exists
try {
    $null = git rev-parse --git-dir 2>$null
    Write-Host "Git repository found" -ForegroundColor Green
    $gitRepo = $true
} catch {
    Write-Host "Git repository not found" -ForegroundColor Red
    $gitRepo = $false
}

# Check 2: Remote origin exists
try {
    $remotes = git remote -v
    if ($remotes -match "origin") {
        Write-Host "Git remote origin found" -ForegroundColor Green
        $gitRemote = $true
    } else {
        Write-Host "Git remote origin not found" -ForegroundColor Red
        $gitRemote = $false
    }
} catch {
    Write-Host "Git remote origin not found" -ForegroundColor Red
    $gitRemote = $false
}

# Check 3: GitHub remote exists
try {
    $remotes = git remote -v
    if ($remotes -match "github\.com") {
        Write-Host "GitHub remote found" -ForegroundColor Green
        $githubRemote = $true
    } else {
        Write-Host "GitHub remote not found" -ForegroundColor Red
        $githubRemote = $false
    }
} catch {
    Write-Host "GitHub remote not found" -ForegroundColor Red
    $githubRemote = $false
}

# Overall validation
$overallSuccess = $gitRepo -and $gitRemote -and $githubRemote

if ($overallSuccess) {
    Write-Host "GitHub setup validation PASSED!" -ForegroundColor Green
    Write-Host "Background agents can proceed with GitHub operations." -ForegroundColor Green
    exit 0
} else {
    Write-Host "GitHub setup validation FAILED!" -ForegroundColor Red
    Write-Host "Please fix the issues above before running background agents." -ForegroundColor Red
    exit 1
}

