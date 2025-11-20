@echo off
REM ========================================
REM TimeWise CRM - Database Restore
REM ========================================
COLOR 0E
title TimeWise - Database Restore

cd /d "%~dp0"
cd ..\..

echo.
echo ════════════════════════════════════════════════════════════════
echo         TimeWise CRM - MongoDB Restore Utility
echo ════════════════════════════════════════════════════════════════
echo.
echo ⚠️  WARNING: This will restore your database from a backup!
echo    Make sure you have a recent backup before proceeding.
echo.
echo ════════════════════════════════════════════════════════════════
echo.

node scripts/database/mongodb-restore.js

if %errorlevel% equ 0 (
    COLOR 0A
    echo.
    echo ════════════════════════════════════════════════════════════════
    echo Restore completed successfully!
    echo ════════════════════════════════════════════════════════════════
) else (
    COLOR 0C
    echo.
    echo ════════════════════════════════════════════════════════════════
    echo Restore failed! Please check the error messages above.
    echo ════════════════════════════════════════════════════════════════
)

echo.
echo Press any key to exit...
pause >nul
