@echo off
REM ========================================
REM TimeWise CRM - Automated Startup Script
REM ========================================
COLOR 0A
title TimeWise CRM - Starting...

echo.
echo  ████████╗██╗███╗   ███╗███████╗██╗    ██╗██╗███████╗███████╗
echo  ╚══██╔══╝██║████╗ ████║██╔════╝██║    ██║██║██╔════╝██╔════╝
echo     ██║   ██║██╔████╔██║█████╗  ██║ █╗ ██║██║███████╗█████╗
echo     ██║   ██║██║╚██╔╝██║██╔══╝  ██║███╗██║██║╚════██║██╔══╝
echo     ██║   ██║██║ ╚═╝ ██║███████╗╚███╔███╔╝██║███████║███████╗
echo     ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝╚══════╝╚══════╝
echo.
echo            Time Management System - Production Ready
echo            Developed by Lab of Future (LOF)
echo ========================================================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM Check Node.js installation
echo [1/7] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    COLOR 0C
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please download and install Node.js from: https://nodejs.org
    echo Recommended version: 18.x or higher
    pause
    exit /b 1
)
echo [OK] Node.js found:
node --version
echo.

REM Check npm installation
echo [2/7] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    COLOR 0C
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)
echo [OK] npm found:
npm --version
echo.

REM Check if node_modules exists
echo [3/7] Checking dependencies...
if not exist "node_modules\" (
    COLOR 0E
    echo [WARNING] node_modules not found!
    echo Installing dependencies... This may take a few minutes.
    echo.
    call npm install
    if %errorlevel% neq 0 (
        COLOR 0C
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully!
) else (
    echo [OK] Dependencies found
)
echo.

REM Check if .env.local exists
echo [4/7] Checking environment configuration...
if not exist ".env.local" (
    COLOR 0E
    echo [WARNING] .env.local not found!
    echo.
    if exist ".env.example" (
        echo Creating .env.local from .env.example...
        copy .env.example .env.local >nul
        echo [CREATED] .env.local file created
        echo [ACTION REQUIRED] Please edit .env.local with your configuration:
        echo   - MongoDB connection string
        echo   - JWT secret
        echo   - Email credentials (if using email features)
        echo.
        echo Press any key to open .env.local in notepad...
        pause >nul
        notepad .env.local
        echo.
        echo After configuring, press any key to continue...
        pause >nul
    ) else (
        COLOR 0C
        echo [ERROR] .env.example not found! Cannot create .env.local
        pause
        exit /b 1
    )
) else (
    echo [OK] Environment file found
)
echo.

REM Kill existing Node.js processes
echo [5/7] Stopping any existing Node.js processes...
taskkill /f /im node.exe 2>nul
if %errorlevel% equ 0 (
    echo [OK] Stopped existing processes
    timeout /t 2 /nobreak >nul
) else (
    echo [OK] No existing processes found
)
echo.

REM Check if MongoDB is running (optional but recommended)
echo [6/7] Checking MongoDB connection...
echo [INFO] Make sure MongoDB is running:
echo   - Local: mongodb://localhost:27017
echo   - Atlas: Check your .env.local file
echo.
timeout /t 2 /nobreak >nul

REM Start the server
COLOR 0A
echo [7/7] Starting TimeWise CRM Server...
echo ========================================================================
echo.
echo Server will be accessible at:
echo   Local:   http://localhost:9002
echo   Network: http://[your-ip]:9002
echo.
echo Press Ctrl+C to stop the server
echo ========================================================================
echo.

REM Wait 3 seconds then open browser
start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:9002"

REM Start the development server
title TimeWise CRM - Running on http://localhost:9002
call npm run dev

REM If server stops
COLOR 0E
echo.
echo ========================================================================
echo Server has stopped.
echo.
echo If you encountered errors:
echo   1. Check your .env.local configuration
echo   2. Ensure MongoDB is running
echo   3. Run: npm install
echo   4. Check the error messages above
echo.
echo Press any key to exit...
pause >nul
