@echo off
REM ========================================
REM TimeWise CRM - Manual Database Backup
REM ========================================
COLOR 0A
title TimeWise - Database Backup

cd /d "%~dp0"
cd ..\..

echo.
echo ════════════════════════════════════════════════════════════════
echo         TimeWise CRM - MongoDB Backup Utility
echo ════════════════════════════════════════════════════════════════
echo.
echo This will create a compressed backup of your TimeWise database
echo.

node scripts/database/mongodb-backup-improved.js

if %errorlevel% equ 0 (
    COLOR 0A
    echo.
    echo ════════════════════════════════════════════════════════════════
    echo Backup completed successfully!
    echo ════════════════════════════════════════════════════════════════
) else (
    COLOR 0C
    echo.
    echo ════════════════════════════════════════════════════════════════
    echo Backup failed! Please check the error messages above.
    echo ════════════════════════════════════════════════════════════════
    echo.
    echo Common issues:
    echo   1. MongoDB Database Tools not installed
    echo      Download from: https://www.mongodb.com/try/download/database-tools
    echo.
    echo   2. MongoDB not running
    echo      Start MongoDB service
    echo.
    echo   3. Wrong connection string in .env.local
    echo      Check MONGODB_URI setting
)

echo.
echo Press any key to exit...
pause >nul
