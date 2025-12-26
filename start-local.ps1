# Start Local Development Servers
# This script starts both backend and frontend servers

Write-Host "=== Starting Local Development Servers ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env files exist
if (-not (Test-Path "backend\.env")) {
    Write-Host "❌ backend/.env not found!" -ForegroundColor Red
    Write-Host "Please run setup-local.ps1 first" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "frontend\.env.local")) {
    Write-Host "❌ frontend/.env.local not found!" -ForegroundColor Red
    Write-Host "Please run setup-local.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '=== Backend Server ===' -ForegroundColor Cyan; Write-Host 'Starting on http://localhost:5000' -ForegroundColor Green; npm run dev"

# Wait a bit before starting frontend
Start-Sleep -Seconds 3

# Start frontend server
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host '=== Frontend Server ===' -ForegroundColor Cyan; Write-Host 'Starting on http://localhost:3000' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "✓ Servers starting in separate windows..." -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Make sure MongoDB is running!" -ForegroundColor Yellow
Write-Host ""



