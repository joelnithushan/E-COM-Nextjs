@echo off
REM ============================================
REM Development Shutdown Script (Windows)
REM ============================================

echo.
echo 🛑 Stopping E-Commerce Development Environment...

docker-compose down

echo.
echo ✅ All services stopped
echo.
echo 💡 To remove volumes (clean database):
echo    docker-compose down -v
echo.

pause



