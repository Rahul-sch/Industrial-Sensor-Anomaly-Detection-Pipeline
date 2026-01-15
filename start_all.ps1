# ============================================
# RIG ALPHA - START ALL SERVICES (PowerShell)
# ============================================

Write-Host ""
Write-Host "🚀 Starting Rig Alpha System..." -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Activate venv if exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "✓ Activating virtual environment" -ForegroundColor Green
    & "venv\Scripts\Activate.ps1"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Backend Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Kafka Consumer
Write-Host "[1/3] Starting Kafka Consumer..." -ForegroundColor Green
$consumer = Start-Process python -ArgumentList "consumer.py" -PassThru -NoNewWindow -RedirectStandardOutput "consumer.log" -RedirectStandardError "consumer.err"
Write-Host "      PID: $($consumer.Id)" -ForegroundColor Gray

# Start Flask Dashboard
Write-Host "[2/3] Starting Flask Dashboard..." -ForegroundColor Green
$dashboard = Start-Process python -ArgumentList "dashboard.py" -PassThru -NoNewWindow -RedirectStandardOutput "dashboard.log" -RedirectStandardError "dashboard.err"
Write-Host "      PID: $($dashboard.Id)" -ForegroundColor Gray
Write-Host "      URL: http://localhost:5000" -ForegroundColor Yellow

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Ithena Blueprint" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Ithena Blueprint
if (Test-Path "ithena-blueprint") {
    Write-Host "[3/3] Starting Ithena Blueprint..." -ForegroundColor Green
    Set-Location "ithena-blueprint"
    $blueprint = Start-Process npm -ArgumentList "run", "dev" -PassThru -NoNewWindow
    Set-Location ..
    Write-Host "      PID: $($blueprint.Id)" -ForegroundColor Gray
    Write-Host "      URL: http://localhost:3000" -ForegroundColor Yellow
} else {
    Write-Host "⚠ ithena-blueprint folder not found" -ForegroundColor Yellow
    $blueprint = $null
}

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ ALL SERVICES STARTED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Dashboard:        http://localhost:5000" -ForegroundColor White
Write-Host "  Ithena Blueprint: http://localhost:3000" -ForegroundColor White
Write-Host "    - Code X-Ray:   http://localhost:3000/xray/consumer.py" -ForegroundColor Gray
Write-Host "    - Wiki:         http://localhost:3000/wiki" -ForegroundColor Gray
Write-Host "    - System Map:   http://localhost:3000/map" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter to STOP all services..." -ForegroundColor Yellow
Write-Host ""

# Wait for user input
Read-Host

# Cleanup
Write-Host "Shutting down all services..." -ForegroundColor Red
if ($consumer -and !$consumer.HasExited) { Stop-Process -Id $consumer.Id -Force -ErrorAction SilentlyContinue }
if ($dashboard -and !$dashboard.HasExited) { Stop-Process -Id $dashboard.Id -Force -ErrorAction SilentlyContinue }
if ($blueprint -and !$blueprint.HasExited) { Stop-Process -Id $blueprint.Id -Force -ErrorAction SilentlyContinue }

Write-Host "✓ All services stopped" -ForegroundColor Green
