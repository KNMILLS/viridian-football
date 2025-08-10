# Viridian Football GitHub Setup Script
# This script automates the complete GitHub setup process

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$RepositoryName = "viridian-football",
    
    [Parameter(Mandatory=$false)]
    [string]$RepositoryDescription = "A comprehensive football game engine and documentation system for creating engaging, data-driven football simulations",
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateRepository = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipConfirmation = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

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

function Test-GitHubCLIInstalled {
    try {
        $null = gh --version
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

function Initialize-GitRepository {
    Write-ColorOutput "🔧 Initializing Git repository..." $Cyan
    
    if (Test-GitRepository) {
        Write-ColorOutput "⚠️  Git repository already exists. Skipping initialization." $Yellow
        return
    }
    
    git init
    Write-ColorOutput "✅ Git repository initialized successfully!" $Green
}

function Create-GitIgnore {
    Write-ColorOutput "📝 Creating .gitignore file..." $Cyan
    
    $gitignoreContent = @"
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Virtual environments
venv/
env/
ENV/
env.bak/
venv.bak/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp
*.log

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Jupyter Notebook
.ipynb_checkpoints

# pyenv
.python-version

# pipenv
Pipfile.lock

# PEP 582
__pypackages__/

# Celery
celerybeat-schedule
celerybeat.pid

# SageMath parsed files
*.sage.py

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/

# Project specific
*.zip
*.tar.gz
*.rar
"@

    $gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-ColorOutput "✅ .gitignore file created successfully!" $Green
}

function Create-README {
    Write-ColorOutput "📖 Creating README.md file..." $Cyan
    
    $readmeContent = @"
# Viridian Football

A comprehensive football game engine and documentation system for creating engaging, data-driven football simulations.

## 🏈 Project Overview

Viridian Football is an innovative football game engine that combines advanced engagement formulas, comprehensive documentation, and modular architecture to create the most realistic and engaging football simulation experience.

## 📁 Project Structure

\`\`\`
Viridian Football/
├── docs/                           # Comprehensive documentation
│   ├── 00-project-overview/        # Project overview and introduction
│   ├── 01-vision-strategy/         # Vision, strategy, and master planning
│   ├── 03-technical-architecture/  # Technical architecture and design
│   ├── 04-research-analysis/       # Research and analysis documents
│   ├── 05-data-models/            # Data models and schemas
│   ├── 06-development/            # Development guidelines and processes
│   ├── 07-governance/             # Governance and decision-making
│   ├── 08-use-engine/             # How to use the engine
│   └── 09-archive/                # Archived documents
├── 02-game-design/                # Game design documents
│   └── 01-core-gameplay/          # Core gameplay mechanics
├── *.py                           # Python scripts for formula visualization
├── *.png                          # Generated formula flowcharts and diagrams
└── documentation_audit_report.md  # Documentation audit and progress report
\`\`\`

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- Git
- GitHub account

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/$GitHubUsername/$RepositoryName.git
   cd $RepositoryName
   \`\`\`

2. Set up a virtual environment (recommended):
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   \`\`\`

3. Install dependencies (if any):
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

## 📊 Key Features

- **Engagement Formula System**: Advanced mathematical models for player and team engagement
- **Comprehensive Documentation**: Extensive documentation covering all aspects of the project
- **Modular Architecture**: Scalable and maintainable codebase
- **Visual Documentation**: Flowcharts and diagrams for complex formulas
- **Game Design Integration**: Seamless integration between technical and design aspects

## 🛠️ Development

### Running Scripts

The project includes several Python scripts for generating visual representations of formulas:

- \`engagement_formula_image.py\` - Generates engagement formula diagrams
- \`flowchart_formula_image.py\` - Creates flowchart representations
- \`pseudocode_formula_image.py\` - Generates pseudocode diagrams
- \`simple_formula_image.py\` - Creates simplified formula visualizations

### Documentation

The documentation is organized into logical sections covering:
- Project vision and strategy
- Technical architecture
- Research and analysis
- Data models
- Development processes
- Governance
- Engine usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

For questions or support, please open an issue on GitHub or contact the development team.

## 🔄 Version History

- **v1.0.0** - Initial release with core documentation and formula system
- **v1.1.0** - Enhanced documentation structure and visual representations
- **v1.2.0** - Added game design integration and governance framework

---

*Built with ❤️ for the football community*
"@

    $readmeContent | Out-File -FilePath "README.md" -Encoding UTF8
    Write-ColorOutput "✅ README.md file created successfully!" $Green
}

function Create-License {
    Write-ColorOutput "📄 Creating MIT License file..." $Cyan
    
    $licenseContent = @"
MIT License

Copyright (c) $(Get-Date -Format "yyyy") $GitHubUsername

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"@

    $licenseContent | Out-File -FilePath "LICENSE" -Encoding UTF8
    Write-ColorOutput "✅ LICENSE file created successfully!" $Green
}

function Create-GitHubRepository {
    Write-ColorOutput "🌐 Creating GitHub repository..." $Cyan
    
    if (-not (Test-GitHubCLIInstalled)) {
        Write-ColorOutput "❌ GitHub CLI is not installed. Please install it first:" $Red
        Write-ColorOutput "   Visit: https://cli.github.com/" $Yellow
        Write-ColorOutput "   Or run: winget install GitHub.cli" $Yellow
        return $false
    }
    
    try {
        # Check if user is authenticated
        $authStatus = gh auth status 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "❌ Not authenticated with GitHub CLI. Please run 'gh auth login' first." $Red
            return $false
        }
        
        # Create repository
        gh repo create $RepositoryName --description $RepositoryDescription --public --source=. --remote=origin --push
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ GitHub repository created and pushed successfully!" $Green
            return $true
        } else {
            Write-ColorOutput "❌ Failed to create GitHub repository." $Red
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Error creating GitHub repository: $($_.Exception.Message)" $Red
        return $false
    }
}

function Setup-GitRepository {
    Write-ColorOutput "🔧 Setting up Git repository..." $Cyan
    
    # Add all files
    git add .
    
    # Commit
    git commit -m "Initial commit: Viridian Football project with comprehensive documentation and formula system"
    
    # Set main branch
    git branch -M main
    
    Write-ColorOutput "✅ Git repository setup completed!" $Green
}

function Setup-RemoteRepository {
    Write-ColorOutput "🔗 Setting up remote repository..." $Cyan
    
    $remoteUrl = "https://github.com/$GitHubUsername/$RepositoryName.git"
    
    # Remove existing remote if it exists
    git remote remove origin 2>$null
    
    # Add new remote
    git remote add origin $remoteUrl
    
    # Push to GitHub
    git push -u origin main
    
    Write-ColorOutput "✅ Remote repository setup completed!" $Green
}

function Show-CursorSetupInstructions {
    Write-ColorOutput "`n🎯 Cursor AI Agent Setup Instructions:" $Cyan
    Write-ColorOutput "=====================================" $Cyan
    
    Write-ColorOutput "`n1. Create a Personal Access Token:" $Yellow
    Write-ColorOutput "   - Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)" $White
    Write-ColorOutput "   - Click 'Generate new token (classic)'" $White
    Write-ColorOutput "   - Give it a name like 'Cursor AI Access'" $White
    Write-ColorOutput "   - Select scopes: repo (full control of private repositories)" $White
    Write-ColorOutput "   - Click 'Generate token' and copy it" $White
    
    Write-ColorOutput "`n2. Configure Cursor:" $Yellow
    Write-ColorOutput "   - In Cursor, go to Settings → Extensions → GitHub Copilot" $White
    Write-ColorOutput "   - Add your GitHub credentials or use the token for authentication" $White
    
    Write-ColorOutput "`n3. Alternative: Repository Collaborators" $Yellow
    Write-ColorOutput "   - Go to your repository → Settings → Collaborators and teams" $White
    Write-ColorOutput "   - Add the Cursor service account with Write permissions" $White
    
    Write-ColorOutput "`n4. Test Access:" $Yellow
    Write-ColorOutput "   - Try making a small change in Cursor" $White
    Write-ColorOutput "   - Commit and push to verify write access works" $White
}

function Show-SuccessMessage {
    Write-ColorOutput "`n🎉 Setup Complete!" $Green
    Write-ColorOutput "=================" $Green
    Write-ColorOutput "Your Viridian Football project has been successfully set up on GitHub!" $White
    Write-ColorOutput "Repository URL: https://github.com/$GitHubUsername/$RepositoryName" $Cyan
    
    Write-ColorOutput "`nNext Steps:" $Yellow
    Write-ColorOutput "1. Follow the Cursor AI Agent setup instructions above" $White
    Write-ColorOutput "2. Test the setup by making a small change and pushing it" $White
    Write-ColorOutput "3. Start developing your football game engine!" $White
}

# Main execution
function Main {
    Write-ColorOutput "🚀 Viridian Football GitHub Setup Script" $Cyan
    Write-ColorOutput "=========================================" $Cyan
    Write-ColorOutput "GitHub Username: $GitHubUsername" $White
    Write-ColorOutput "Repository Name: $RepositoryName" $White
    Write-ColorOutput "Description: $RepositoryDescription" $White
    
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
    
    # Initialize Git repository
    Initialize-GitRepository
    
    # Create essential files
    Create-GitIgnore
    Create-README
    Create-License
    
    # Setup Git repository
    Setup-GitRepository
    
    # Create GitHub repository if requested
    if ($CreateRepository) {
        $repoCreated = Create-GitHubRepository
        if (-not $repoCreated) {
            Write-ColorOutput "`n⚠️  GitHub repository creation failed. You can create it manually:" $Yellow
            Write-ColorOutput "1. Go to https://github.com/new" $White
            Write-ColorOutput "2. Repository name: $RepositoryName" $White
            Write-ColorOutput "3. Description: $RepositoryDescription" $White
            Write-ColorOutput "4. Make it Public or Private" $White
            Write-ColorOutput "5. Don't initialize with README, .gitignore, or license" $White
        }
    } else {
        Write-ColorOutput "`n⚠️  Skipping GitHub repository creation. You can create it manually:" $Yellow
        Write-ColorOutput "1. Go to https://github.com/new" $White
        Write-ColorOutput "2. Repository name: $RepositoryName" $White
        Write-ColorOutput "3. Description: $RepositoryDescription" $White
        Write-ColorOutput "4. Make it Public or Private" $White
        Write-ColorOutput "5. Don't initialize with README, .gitignore, or license" $White
        Write-ColorOutput "6. After creating, run: git remote add origin https://github.com/$GitHubUsername/$RepositoryName.git" $White
        Write-ColorOutput "7. Then run: git push -u origin main" $White
    }
    
    # Show Cursor setup instructions
    Show-CursorSetupInstructions
    
    # Show success message
    Show-SuccessMessage
}

# Run the main function
Main
