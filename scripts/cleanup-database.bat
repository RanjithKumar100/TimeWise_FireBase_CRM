@echo off
setlocal EnableDelayedExpansion

REM Batch Script for Database Cleanup - Production Phase 1
title TIMEWISE - Database Cleanup

echo.
echo ========================================
echo   TIMEWISE - Database Cleanup Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if !errorlevel! neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo [INFO] Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Get Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js detected: !NODE_VERSION!

REM Check if cleanup script exists
if not exist "%~dp0cleanup-database.js" (
    echo [ERROR] Cleanup script not found: cleanup-database.js
    pause
    exit /b 1
)

REM Check if .env.production.local exists
if not exist "%~dp0..\.env.production.local" (
    echo [ERROR] Environment file not found: .env.production.local
    echo [INFO] Please ensure .env.production.local is configured with MONGODB_URI
    pause
    exit /b 1
)

echo [OK] Environment file found: .env.production.local
echo.

REM Warning and confirmation
echo ========================================
echo   WARNING: DATABASE CLEANUP
echo ========================================
echo.
echo This will permanently delete ALL data from the database!
echo Make sure you have backups if needed.
echo.
set /p CONFIRM="Type 'YES' to proceed: "

if /i "!CONFIRM!" neq "YES" (
    echo.
    echo [CANCELLED] Cleanup cancelled by user
    echo [INFO] No changes were made to the database
    pause
    exit /b 0
)

echo.
echo [STARTING] Launching database cleanup script...
echo.

REM Change to project directory and run cleanup
cd /d "%~dp0.."
node "%~dp0cleanup-database.js"

set EXIT_CODE=!errorlevel!

if !EXIT_CODE! equ 0 (
    echo.
    echo ========================================
    echo   CLEANUP COMPLETED SUCCESSFULLY
    echo ========================================
    echo.
    echo [SUCCESS] Database is ready for Production Phase 1
    echo.
    echo Next Steps:
    echo   1. Verify your production environment configuration
    echo   2. Create your admin user account
    echo   3. Test the application functionality
    echo   4. Deploy to production server
    echo.
    echo Ready to start Production Phase 1!
) else (
    echo.
    echo [ERROR] Cleanup script failed with exit code: !EXIT_CODE!
)

echo.
echo Press any key to exit...
pause >nul
exit /b !EXIT_CODE!