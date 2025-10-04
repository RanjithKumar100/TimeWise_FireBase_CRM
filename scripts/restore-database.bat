@echo off
echo.
echo ============================================
echo    TimeWise MongoDB Restore Script
echo ============================================
echo.

cd /d "%~dp0"
node mongodb-restore.js

echo.
echo Press any key to exit...
pause >nul