@echo off
title TimeWise Server Manager
color 0A

:MENU
cls
echo.
echo  ████████╗██╗███╗   ███╗███████╗██╗    ██╗██╗███████╗███████╗
echo  ╚══██╔══╝██║████╗ ████║██╔════╝██║    ██║██║██╔════╝██╔════╝
echo     ██║   ██║██╔████╔██║█████╗  ██║ █╗ ██║██║███████╗█████╗  
echo     ██║   ██║██║╚██╔╝██║██╔══╝  ██║███╗██║██║╚════██║██╔══╝  
echo     ██║   ██║██║ ╚═╝ ██║███████╗╚███╔███╔╝██║███████║███████╗
echo     ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝╚══════╝╚══════╝
echo.
echo  🌐 Server Manager - Port 9002
echo  ════════════════════════════════════════════════════════════
echo.

REM Check if server is running
netstat -ano | findstr ":9002" >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ Server Status: RUNNING
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9002"') do (
        set PID=%%a
        goto :found
    )
    :found
    echo  🔧 Process ID: %PID%
    echo  🌐 Local Access: http://localhost:9002
    echo  🌍 Network Access: http://192.168.1.43:9002
    echo  🏷️  Custom Hostname: http://timewise:9002
) else (
    echo  ❌ Server Status: NOT RUNNING
    echo  💡 Use option 1 to start the server
)

echo.
echo  ════════════════════════════════════════════════════════════
echo  🚀 ACTIONS:
echo.
echo  [1] Start Server
echo  [2] Stop Server  
echo  [3] Restart Server
echo  [4] Kill All on Port 9002
echo  [5] Check Server Status
echo  [6] Open TimeWise (Browser)
echo  [7] View Server Logs
echo  [0] Exit
echo.
echo  ════════════════════════════════════════════════════════════
echo.
set /p choice="Select option (0-7): "

if "%choice%"=="1" goto START_SERVER
if "%choice%"=="2" goto STOP_SERVER
if "%choice%"=="3" goto RESTART_SERVER
if "%choice%"=="4" goto KILL_PORT
if "%choice%"=="5" goto CHECK_STATUS
if "%choice%"=="6" goto OPEN_BROWSER
if "%choice%"=="7" goto VIEW_LOGS
if "%choice%"=="0" goto EXIT
goto MENU

:START_SERVER
echo.
echo 🚀 Starting TimeWise server...
echo ════════════════════════════════════════
start "TimeWise Server" cmd /c "cd /d %~dp0 && npm run dev && pause"
timeout /t 3 >nul
echo ✅ Server start command issued!
echo 💡 Check the new window for server output
pause
goto MENU

:STOP_SERVER
echo.
echo 🛑 Stopping TimeWise server...
echo ════════════════════════════════════════
netstat -ano | findstr ":9002" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ No server running on port 9002
    pause
    goto MENU
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9002"') do (
    echo 🔧 Stopping process %%a...
    taskkill /F /PID %%a >nul 2>&1
)
echo ✅ Server stopped successfully!
pause
goto MENU

:RESTART_SERVER
echo.
echo 🔄 Restarting TimeWise server...
echo ════════════════════════════════════════
call :STOP_SERVER_QUIET
timeout /t 2 >nul
call :START_SERVER_QUIET
echo ✅ Server restarted!
pause
goto MENU

:KILL_PORT
echo.
echo ⚡ Force killing all processes on port 9002...
echo ════════════════════════════════════════════
netstat -ano | findstr ":9002"
echo.
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9002"') do (
    echo 🔧 Force killing PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)
npx kill-port 9002 2>nul
echo ✅ Port 9002 is now free!
pause
goto MENU

:CHECK_STATUS
echo.
echo 📊 Server Status Check
echo ════════════════════════════════════════════
netstat -ano | findstr ":9002"
if %errorlevel% neq 0 (
    echo ❌ No processes found on port 9002
) else (
    echo ✅ Port 9002 is in use
)
echo.
echo 🧪 Testing server response...
curl -I http://localhost:9002 2>nul | findstr "HTTP"
if %errorlevel% equ 0 (
    echo ✅ Server is responding correctly
) else (
    echo ❌ Server is not responding
)
pause
goto MENU

:OPEN_BROWSER
echo.
echo 🌐 Opening TimeWise in browser...
echo ════════════════════════════════════════════
echo 🚀 Trying custom hostname first...
start http://timewise:9002 2>nul
if %errorlevel% neq 0 (
    echo 🔄 Hostname not configured, using IP...
    start http://192.168.1.43:9002
)
timeout /t 2 >nul
goto MENU

:VIEW_LOGS
echo.
echo 📋 Server Logs
echo ════════════════════════════════════════════
echo 💡 Server logs appear in the server window
echo 💡 Or check the terminal where you started the server
echo.
echo 🔍 Quick status check:
curl -s http://localhost:9002 | findstr "TimeWise" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Server is running and responding
) else (
    echo ❌ Server may not be running properly
)
pause
goto MENU

:START_SERVER_QUIET
start /min "TimeWise Server" cmd /c "cd /d %~dp0 && npm run dev"
timeout /t 3 >nul
exit /b

:STOP_SERVER_QUIET
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9002" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
exit /b

:EXIT
echo.
echo 👋 Thanks for using TimeWise Server Manager!
echo ✅ Server will continue running in background
timeout /t 2 >nul
exit