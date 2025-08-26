# PowerShell Script for Database Cleanup - Production Phase 1
# This script runs the Node.js database cleanup script

param(
    [switch]$Force = $false
)

Write-Host "🧹 TIMEWISE - Database Cleanup (PowerShell Launcher)" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
    Write-Host "✅ Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "💡 Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if the cleanup script exists
$scriptPath = Join-Path $PSScriptRoot "cleanup-database.js"
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Cleanup script not found: $scriptPath" -ForegroundColor Red
    exit 1
}

# Check if .env.production.local exists
$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) ".env.production.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Environment file not found: .env.production.local" -ForegroundColor Red
    Write-Host "💡 Please ensure .env.production.local is configured with MONGODB_URI" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment file found: .env.production.local" -ForegroundColor Green

# Warning if not forced
if (-not $Force) {
    Write-Host "" 
    Write-Host "⚠️  WARNING: This will permanently delete ALL data from the database!" -ForegroundColor Yellow
    Write-Host "💡 Use -Force parameter to skip this confirmation" -ForegroundColor Gray
    Write-Host ""
    
    $confirmation = Read-Host "❓ Type 'YES' to proceed with cleanup"
    
    if ($confirmation -ne "YES") {
        Write-Host "❌ Cleanup cancelled by user" -ForegroundColor Red
        Write-Host "💡 No changes were made to the database" -ForegroundColor Gray
        exit 0
    }
}

Write-Host ""
Write-Host "🚀 Launching database cleanup script..." -ForegroundColor Cyan
Write-Host ""

# Change to the project directory
$projectDir = Split-Path $PSScriptRoot -Parent
Set-Location $projectDir

# Run the Node.js cleanup script
try {
    if ($Force) {
        # For force mode, pipe "YES" to the script
        "YES" | node $scriptPath
    } else {
        node $scriptPath
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Database cleanup completed successfully!" -ForegroundColor Green
        Write-Host "🚀 Database is ready for Production Phase 1" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Cleanup script failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "❌ Error running cleanup script: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Verify your production environment configuration" -ForegroundColor Gray
Write-Host "   2. Create your admin user account" -ForegroundColor Gray  
Write-Host "   3. Test the application functionality" -ForegroundColor Gray
Write-Host "   4. Deploy to production server" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Ready to start Production Phase 1!" -ForegroundColor Green