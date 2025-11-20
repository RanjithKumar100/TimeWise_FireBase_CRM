@echo off
echo.
echo ============================================
echo    TimeWise MongoDB Backup Script
echo ============================================
echo.

cd /d "%~dp0"
node mongodb-backup.js

echo.
echo Press any key to exit...
pause >nul