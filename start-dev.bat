@echo off
REM ============================================
REM Development Startup Script (Windows)
REM One command to start everything
REM ============================================

echo.
echo 🚀 Starting E-Commerce Development Environment...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo 📦 Building images (if needed)...
docker-compose build

echo.
echo 🔧 Starting services...
docker-compose up -d

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ✨ Services are starting!
echo.
echo 📍 Access your application:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:5000
echo    MongoDB:   localhost:27017
echo    Redis:     localhost:6379
echo.
echo 📊 View logs:
echo    docker-compose logs -f
echo.
echo 🛑 Stop services:
echo    docker-compose down
echo.

pause



