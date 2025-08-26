@echo off
title Starting TimeWise Server
echo.
echo ████████╗██╗███╗   ███╗███████╗██╗    ██╗██╗███████╗███████╗
echo ╚══██╔══╝██║████╗ ████║██╔════╝██║    ██║██║██╔════╝██╔════╝
echo    ██║   ██║██╔████╔██║█████╗  ██║ █╗ ██║██║███████╗█████╗  
echo    ██║   ██║██║╚██╔╝██║██╔══╝  ██║███╗██║██║╚════██║██╔══╝  
echo    ██║   ██║██║ ╚═╝ ██║███████╗╚███╔███╔╝██║███████║███████╗
echo    ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝╚══════╝╚══════╝
echo.
echo 🚀 Starting TimeWise Timesheet Server...
echo ════════════════════════════════════════════════════════════
echo.

REM Kill any existing processes on port 9002
echo 🔧 Checking for existing server processes...
netstat -ano | findstr ":9002" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚡ Found existing server, stopping it first...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9002"') do (
        echo    Killing PID %%a...
        taskkill /F /PID %%a >nul 2>&1
    )
    REM Additional cleanup with npx
    npx kill-port 9002 >nul 2>&1
    echo ✅ Previous server stopped
    timeout /t 3 >nul
) else (
    echo ✅ Port 9002 is available
)

REM Change to the correct directory
cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo ✅ Dependencies installed
)

echo 🌐 Starting server on port 9002...
echo.
echo 📍 Access URLs:
echo    Local: http://localhost:9002
echo    Network: http://192.168.1.43:9002
echo    Custom: http://timewise:9002
echo.
echo 🧪 Testing hostname resolution...
ping -n 1 timewise >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Hostname 'timewise' is configured correctly!
    echo 🎯 Recommended URL: http://timewise:9002
) else (
    echo ⚠️  Hostname 'timewise' not configured on this machine
    echo 💡 Run SETUP-TIMEWISE-HOSTNAME.bat as Administrator
    echo 🔗 Use: http://192.168.1.43:9002 for now
)
echo.
echo 🔄 Starting development server...
echo ═══════════════════════════════════════

REM Start the development server
npm run dev