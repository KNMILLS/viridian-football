# Viridian Football GitHub Setup Script (Simplified)
# This script handles the GitHub setup for an existing project

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$RepositoryName = "viridian-football",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipConfirmation = $false
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-GitInstalled {
    try {
        $null = git --version
        return $true
    }
    catch {
        return $false
    }
}

function Test-GitRepository {
    try {
        $null = git rev-parse --git-dir 2>$null
        return $true
    }
    catch {
        return $false
    }
}

function Setup-ExistingRepository {
    Write-ColorOutput "🔧 Setting up existing repository..." "Cyan"
    
    # Check if we're in a git repository
    if (-not (Test-GitRepository)) {
        Write-ColorOutput "❌ Not in a Git repository. Please run this script from your project directory." "Red"
        return $false
    }
    
    # Add all files
    Write-ColorOutput "📁 Adding files to Git..." "Cyan"
    git add .
    
    # Check if there are changes to commit
    $status = git status --porcelain
    if ($status) {
        Write-ColorOutput "💾 Committing changes..." "Cyan"
        git commit -m "Update project files and documentation"
    } else {
        Write-ColorOutput "✅ No changes to commit" "Green"
    }
    
    # Set main branch
    git branch -M main
    
    return $true
}

function Setup-RemoteRepository {
    param([string]$Username, [string]$RepoName)
    
    Write-ColorOutput "🔗 Setting up remote repository..." "Cyan"
    
    $remoteUrl = "https://github.com/$Username/$RepoName.git"
    
    # Remove existing remote if it exists
    git remote remove origin 2>$null
    
    # Add new remote
    git remote add origin $remoteUrl
    
    Write-ColorOutput "✅ Remote repository configured: $remoteUrl" "Green"
}

function Push-ToGitHub {
    Write-ColorOutput "🚀 Pushing to GitHub..." "Cyan"
    
    try {
        git push -u origin main
        Write-ColorOutput "✅ Successfully pushed to GitHub!" "Green"
        return $true
    }
    catch {
        Write-ColorOutput "❌ Failed to push to GitHub. You may need to:" "Red"
        Write-ColorOutput "   1. Create the repository on GitHub first" "Yellow"
        Write-ColorOutput "   2. Authenticate with GitHub" "Yellow"
        Write-ColorOutput "   3. Check your internet connection" "Yellow"
        return $false
    }
}

function Show-CursorSetupInstructions {
    Write-ColorOutput "`n🎯 Cursor AI Agent Setup Instructions:" "Cyan"
    Write-ColorOutput "=====================================" "Cyan"
    
    Write-ColorOutput "`n1. Create a Personal Access Token:" "Yellow"
    Write-ColorOutput "   - Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)" "White"
    Write-ColorOutput "   - Click 'Generate new token (classic)'" "White"
    Write-ColorOutput "   - Give it a name like 'Cursor AI Access'" "White"
    Write-ColorOutput "   - Select scopes: repo (full control of private repositories)" "White"
    Write-ColorOutput "   - Click 'Generate token' and copy it" "White"
    
    Write-ColorOutput "`n2. Configure Cursor:" "Yellow"
    Write-ColorOutput "   - In Cursor, go to Settings → Extensions → GitHub Copilot" "White"
    Write-ColorOutput "   - Add your GitHub credentials or use the token for authentication" "White"
    
    Write-ColorOutput "`n3. Alternative: Repository Collaborators" "Yellow"
    Write-ColorOutput "   - Go to your repository → Settings → Collaborators and teams" "White"
    Write-ColorOutput "   - Add the Cursor service account with Write permissions" "White"
    
    Write-ColorOutput "`n4. Test Access:" "Yellow"
    Write-ColorOutput "   - Try making a small change in Cursor" "White"
    Write-ColorOutput "   - Commit and push to verify write access works" "White"
}

function Show-ManualRepositoryInstructions {
    param([string]$Username, [string]$RepoName)
    
    Write-ColorOutput "`n📋 Manual Repository Creation Instructions:" "Yellow"
    Write-ColorOutput "=========================================" "Yellow"
    Write-ColorOutput "1. Go to https://github.com/new" "White"
    Write-ColorOutput "2. Repository name: $RepoName" "White"
    Write-ColorOutput "3. Description: A comprehensive football game engine and documentation system" "White"
    Write-ColorOutput "4. Make it Public or Private (your choice)" "White"
    Write-ColorOutput "5. DO NOT initialize with README, .gitignore, or license" "White"
    Write-ColorOutput "6. Click 'Create repository'" "White"
    Write-ColorOutput "7. After creating, run this script again to push your code" "White"
}

# Main execution
function Main {
    Write-ColorOutput "🚀 Viridian Football GitHub Setup Script" "Cyan"
    Write-ColorOutput "=========================================" "Cyan"
    Write-ColorOutput "GitHub Username: $GitHubUsername" "White"
    Write-ColorOutput "Repository Name: $RepositoryName" "White"
    
    if (-not $SkipConfirmation) {
        Write-ColorOutput "`nDo you want to continue? (Y/N)" "Yellow"
        $response = Read-Host
        if ($response -notmatch "^[Yy]") {
            Write-ColorOutput "Setup cancelled." "Red"
            return
        }
    }
    
    # Check prerequisites
    Write-ColorOutput "`n🔍 Checking prerequisites..." "Cyan"
    
    if (-not (Test-GitInstalled)) {
        Write-ColorOutput "❌ Git is not installed. Please install Git first." "Red"
        Write-ColorOutput "   Download from: https://git-scm.com/" "Yellow"
        return
    }
    Write-ColorOutput "✅ Git is installed" "Green"
    
    # Setup existing repository
    $repoSetup = Setup-ExistingRepository
    if (-not $repoSetup) {
        return
    }
    
    # Setup remote repository
    Setup-RemoteRepository -Username $GitHubUsername -RepoName $RepositoryName
    
    # Try to push to GitHub
    $pushSuccess = Push-ToGitHub
    
    if (-not $pushSuccess) {
        Show-ManualRepositoryInstructions -Username $GitHubUsername -RepoName $RepositoryName
    } else {
        Write-ColorOutput "`n🎉 Setup Complete!" "Green"
        Write-ColorOutput "=================" "Green"
        Write-ColorOutput "Your Viridian Football project has been successfully set up on GitHub!" "White"
        Write-ColorOutput "Repository URL: https://github.com/$GitHubUsername/$RepositoryName" "Cyan"
    }
    
    # Show Cursor setup instructions
    Show-CursorSetupInstructions
    
    Write-ColorOutput "`nNext Steps:" "Yellow"
    Write-ColorOutput "1. Follow the Cursor AI Agent setup instructions above" "White"
    Write-ColorOutput "2. Test the setup by making a small change and pushing it" "White"
    Write-ColorOutput "3. Start developing your football game engine!" "White"
}

# Run the main function
Main
