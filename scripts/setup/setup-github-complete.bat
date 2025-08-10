@echo off
echo ========================================
echo Viridian Football GitHub Setup
echo ========================================
echo Multi-Agent AI Protocol Compliant
echo ========================================
echo.

REM Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell is available'" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell is not available on this system.
    echo Please install PowerShell and try again.
    pause
    exit /b 1
)

REM Set the GitHub username
set GITHUB_USERNAME=KNMILLS

echo GitHub Username: %GITHUB_USERNAME%
echo Repository Name: viridian-football
echo Protocol: Multi-Agent AI Resilience Strategies
echo.

REM Run the comprehensive PowerShell script
powershell -ExecutionPolicy Bypass -File "setup-github-complete.ps1" -GitHubUsername "%GITHUB_USERNAME%" -RepositoryName "viridian-football" -TimeoutSeconds 300

echo.
echo Setup script completed.
echo.
echo Next Steps:
echo 1. Follow the Cursor AI Agent setup instructions above
echo 2. Review multi-agent AI protocols in project documentation
echo 3. Test the setup by making a small change and pushing it
echo 4. Ensure all agents follow governance framework
echo.
pause
