@echo off
echo ========================================
echo Viridian Football GitHub Setup
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
echo.

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "setup-github-simple.ps1" -GitHubUsername "%GITHUB_USERNAME%" -RepositoryName "viridian-football"

echo.
echo Setup script completed.
pause
