@echo off
echo ========================================
echo   Stopping Tellyou EAI Services
echo ========================================

echo.
echo Stopping Node.js processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Stopping Docker containers...
docker compose stop

echo.
echo ========================================
echo   All Services Stopped!
echo ========================================
pause




