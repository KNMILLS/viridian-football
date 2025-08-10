# Cleanup Old Directories Script
# Removes old documentation directories that are no longer needed after reorganization

param(
    [int]$TimeoutSeconds = 30,
    [switch]$Force = $false
)

function Write-ProgressWithTimeout {
    param(
        [string]$Activity,
        [string]$Status,
        [int]$PercentComplete
    )
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Activity - $Status ($PercentComplete%)" -ForegroundColor Cyan
    Start-Sleep -Milliseconds 100
}

function Remove-DirectoryWithTimeout {
    param(
        [string]$Path,
        [int]$TimeoutSeconds = 30,
        [string]$Description
    )
    
    Write-ProgressWithTimeout -Activity "Cleaning up old directories" -Status "Checking $Description" -PercentComplete 0
    
    if (-not (Test-Path $Path)) {
        Write-Host "✓ $Description - Already removed" -ForegroundColor Green
        return $true
    }
    
    try {
        Write-ProgressWithTimeout -Activity "Cleaning up old directories" -Status "Removing $Description" -PercentComplete 50
        
        # Use a job to handle the removal with timeout
        $job = Start-Job -ScriptBlock {
            param($Path)
            Remove-Item $Path -Recurse -Force -ErrorAction Stop
        } -ArgumentList $Path
        
        # Wait for the job with timeout
        $result = Wait-Job $job -Timeout $TimeoutSeconds
        
        if ($result) {
            $jobResult = Receive-Job $job
            Remove-Job $job
            Write-Host "✓ $Description - Successfully removed" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ $Description - Timeout after $TimeoutSeconds seconds" -ForegroundColor Red
            Stop-Job $job
            Remove-Job $job
            return $false
        }
    }
    catch {
        Write-Host "✗ $Description - Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main cleanup function
function Start-Cleanup {
    Write-Host "Starting cleanup of old documentation directories..." -ForegroundColor Yellow
    Write-Host "Timeout per operation: $TimeoutSeconds seconds" -ForegroundColor Yellow
    Write-Host ""
    
    $directoriesToRemove = @(
        @{Path = "01-core-design"; Description = "Old core design directory"},
        @{Path = "02-game-design"; Description = "Old game design directory"},
        @{Path = "03-technical-specs"; Description = "Old technical specs directory"},
        @{Path = "04-research"; Description = "Old research directory"},
        @{Path = "05-data-content"; Description = "Old data content directory"},
        @{Path = "06-development"; Description = "Old development directory"},
        @{Path = "07-tools-scripts"; Description = "Old tools scripts directory"},
        @{Path = "08-archive"; Description = "Old archive directory"},
        @{Path = "governance"; Description = "Old governance directory"},
        @{Path = "use-engine"; Description = "Old use-engine directory"}
    )
    
    $totalDirectories = $directoriesToRemove.Count
    $successCount = 0
    $failureCount = 0
    
    for ($i = 0; $i -lt $totalDirectories; $i++) {
        $dir = $directoriesToRemove[$i]
        $progressPercent = [math]::Round((($i + 1) / $totalDirectories) * 100)
        
        Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Processing $($i + 1) of $totalDirectories" -ForegroundColor White
        Write-Host "Progress: $progressPercent% complete" -ForegroundColor White
        
        $result = Remove-DirectoryWithTimeout -Path $dir.Path -TimeoutSeconds $TimeoutSeconds -Description $dir.Description
        
        if ($result) {
            $successCount++
        } else {
            $failureCount++
        }
        
        # Brief pause between operations
        Start-Sleep -Milliseconds 200
    }
    
    Write-Host "`n" -ForegroundColor White
    Write-Host "=== CLEANUP SUMMARY ===" -ForegroundColor Yellow
    Write-Host "Total directories processed: $totalDirectories" -ForegroundColor White
    Write-Host "Successfully removed: $successCount" -ForegroundColor Green
    Write-Host "Failed to remove: $failureCount" -ForegroundColor Red
    
    if ($failureCount -gt 0) {
        Write-Host "`nSome directories could not be removed. You may need to:" -ForegroundColor Yellow
        Write-Host "1. Close any applications using files in these directories" -ForegroundColor Yellow
        Write-Host "2. Run this script with elevated privileges" -ForegroundColor Yellow
        Write-Host "3. Manually remove the remaining directories" -ForegroundColor Yellow
    }
    
    Write-Host "`nCleanup completed at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Yellow
}

# Execute the cleanup
Start-Cleanup
