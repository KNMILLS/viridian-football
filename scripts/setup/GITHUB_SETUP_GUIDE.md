# GitHub Setup Guide for Viridian Football

This guide will walk you through setting up your Viridian Football project on GitHub and configuring Cursor AI agents with write access.

## 🚀 Quick Setup (Recommended)

### Option 1: Automated Setup (Easiest)

1. **Double-click** `setup-github.bat` in your project directory
2. **Follow the prompts** - the script will handle everything automatically
3. **Create the GitHub repository** manually if prompted (see manual instructions below)

### Option 2: PowerShell Script

1. **Open PowerShell** in your project directory
2. **Run the script**:
   ```powershell
   .\setup-github-simple.ps1 -GitHubUsername "KNMILLS" -RepositoryName "viridian-football"
   ```

### Option 3: Manual Setup

If you prefer to set up everything manually, follow the steps below.

## 📋 Manual Setup Steps

### Step 1: Create GitHub Repository

1. **Go to GitHub.com** and sign in to your account
2. **Click the "+" icon** in the top right corner and select "New repository"
3. **Fill in the repository details**:
   - **Repository name**: `viridian-football`
   - **Description**: `A comprehensive football game engine and documentation system for creating engaging, data-driven football simulations`
   - **Visibility**: Choose Public or Private (your preference)
   - **DO NOT** check "Add a README file" (we already have one)
   - **DO NOT** check "Add .gitignore" (we already have one)
   - **DO NOT** check "Choose a license" (we already have one)
4. **Click "Create repository"**

### Step 2: Connect Local Repository to GitHub

Run these commands in your project directory:

```bash
# Set the main branch
git branch -M main

# Add the remote repository
git remote add origin https://github.com/KNMILLS/viridian-football.git

# Push to GitHub
git push -u origin main
```

## 🎯 Configuring Cursor AI Agents with Write Access

### Method 1: Personal Access Token (Recommended)

1. **Create a Personal Access Token**:
   - Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Give it a name like "Cursor AI Access"
   - Select scopes: `repo` (full control of private repositories)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **Configure Cursor**:
   - In Cursor, go to Settings → Extensions → GitHub Copilot
   - Add your GitHub credentials or use the token for authentication
   - If prompted for a token, paste the one you just created

### Method 2: GitHub App (For Organizations)

1. **Create a GitHub App**:
   - Go to GitHub.com → Settings → Developer settings → GitHub Apps
   - Click "New GitHub App"
   - Configure permissions for repository access
   - Install the app on your repository

### Method 3: Repository Collaborators

1. **Add Cursor as a collaborator** (if using a service account):
   - Go to your repository → Settings → Collaborators and teams
   - Add the Cursor service account with Write permissions

## 🧪 Testing the Setup

1. **Make a small change** in Cursor (add a comment to any file)
2. **Commit the change**:
   ```bash
   git add .
   git commit -m "Test commit from Cursor"
   ```
3. **Push to GitHub**:
   ```bash
   git push origin main
   ```
4. **Check GitHub** to verify the change appears

## 📁 Project Structure After Setup

Your repository will contain:

```
viridian-football/
├── .gitignore                    # Git ignore rules
├── README.md                     # Project documentation
├── LICENSE                       # MIT License
├── setup-github.ps1             # Full setup script
├── setup-github-simple.ps1      # Simplified setup script
├── setup-github.bat             # Batch file for easy execution
├── GITHUB_SETUP_GUIDE.md        # This guide
├── docs/                         # Comprehensive documentation
│   ├── 00-project-overview/      # Project overview
│   ├── 01-vision-strategy/       # Vision and strategy
│   ├── 03-technical-architecture/ # Technical specs
│   ├── 04-research-analysis/     # Research documents
│   ├── 05-data-models/          # Data models
│   ├── 06-development/          # Development guides
│   ├── 07-governance/           # Governance
│   ├── 08-use-engine/           # Engine usage
│   └── 09-archive/              # Archived docs
├── 02-game-design/              # Game design documents
│   └── 01-core-gameplay/        # Core gameplay
├── *.py                         # Python scripts
├── *.png                        # Generated images
└── documentation_audit_report.md # Audit report
```

## 🔧 Troubleshooting

### Common Issues

1. **"Repository not found" error**:
   - Make sure you've created the repository on GitHub first
   - Check that the repository name matches exactly

2. **Authentication errors**:
   - Ensure you're logged into GitHub in your terminal
   - Try using a Personal Access Token

3. **Permission denied**:
   - Check that you have write access to the repository
   - Verify your GitHub credentials

4. **PowerShell execution policy**:
   - Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Getting Help

- **GitHub Issues**: Create an issue in your repository
- **Git Documentation**: https://git-scm.com/doc
- **GitHub Help**: https://help.github.com/

## 🎉 Next Steps

After successful setup:

1. **Explore your repository** on GitHub
2. **Test Cursor AI features** by making small changes
3. **Start developing** your football game engine
4. **Collaborate** with team members
5. **Set up CI/CD** if needed

## 📞 Support

For questions or issues:
- Check the troubleshooting section above
- Create an issue in your GitHub repository
- Contact the development team

---

*Happy coding! 🏈*
