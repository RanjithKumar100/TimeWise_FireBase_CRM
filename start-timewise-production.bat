@echo off
REM ========================================
REM TimeWise CRM - Production Startup with PM2
REM ========================================
COLOR 0A
title TimeWise CRM - Production Mode

echo.
echo  ████████╗██╗███╗   ███╗███████╗██╗    ██╗██╗███████╗███████╗
echo  ╚══██╔══╝██║████╗ ████║██╔════╝██║    ██║██║██╔════╝██╔════╝
echo     ██║   ██║██╔████╔██║█████╗  ██║ █╗ ██║██║███████╗█████╗
echo     ██║   ██║██║╚██╔╝██║██╔══╝  ██║███╗██║██║╚════██║██╔══╝
echo     ██║   ██║██║ ╚═╝ ██║███████╗╚███╔███╔╝██║███████║███████╗
echo     ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝╚══════╝╚══════╝
echo.
echo            PRODUCTION MODE - PM2 Process Manager
echo            Developed by Lab of Future (LOF)
echo ========================================================================
echo.

cd /d "%~dp0"

REM Check if PM2 is installed
echo [1/5] Checking PM2 installation...
pm2 --version >nul 2>&1
if %errorlevel% neq 0 (
    COLOR 0E
    echo [WARNING] PM2 is not installed globally!
    echo Installing PM2...
    call npm install -g pm2
    if %errorlevel% neq 0 (
        COLOR 0C
        echo [ERROR] Failed to install PM2!
        echo.
        echo Try running this command manually as Administrator:
        echo   npm install -g pm2
        pause
        exit /b 1
    )
    echo [OK] PM2 installed successfully!
) else (
    echo [OK] PM2 found:
    pm2 --version
)
echo.

REM Check dependencies
echo [2/5] Checking dependencies...
if not exist "node_modules\" (
    COLOR 0E
    echo [WARNING] Dependencies not found! Installing...
    call npm install
    if %errorlevel% neq 0 (
        COLOR 0C
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
)
echo [OK] Dependencies ready
echo.

REM Build the application
echo [3/5] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    COLOR 0C
    echo [ERROR] Build failed! Check the errors above.
    pause
    exit /b 1
)
echo [OK] Build completed successfully!
echo.

REM Stop existing PM2 processes
echo [4/5] Stopping existing processes...
call pm2 delete timewise-crm 2>nul
echo [OK] Cleaned up old processes
echo.

REM Start with PM2
echo [5/5] Starting TimeWise CRM with PM2...
call npm run pm2:start
if %errorlevel% neq 0 (
    COLOR 0C
    echo [ERROR] Failed to start with PM2!
    pause
    exit /b 1
)
echo.

COLOR 0A
echo ========================================================================
echo    TimeWise CRM is now running in PRODUCTION MODE!
echo ========================================================================
echo.
echo Status: http://localhost:9002
echo.
echo PM2 Commands:
echo   View logs:     npm run pm2:logs
echo   Restart:       npm run pm2:restart
echo   Stop:          npm run pm2:stop
echo   Monitor:       pm2 monit
echo.
echo The application will:
echo   - Run in the background
echo   - Auto-restart on crash
echo   - Survive terminal close
echo   - Start on system reboot (after: pm2 startup)
echo ========================================================================
echo.
echo Opening PM2 logs in 3 seconds...
timeout /t 3 /nobreak >nul
call pm2 logs timewise-crm
