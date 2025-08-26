@echo off
title Setup TimeWise Hostname - Run as Administrator
color 0A

echo.
echo  ████████╗██╗███╗   ███╗███████╗██╗    ██╗██╗███████╗███████╗
echo  ╚══██╔══╝██║████╗ ████║██╔════╝██║    ██║██║██╔════╝██╔════╝
echo     ██║   ██║██╔████╔██║█████╗  ██║ █╗ ██║██║███████╗█████╗  
echo     ██║   ██║██║╚██╔╝██║██╔══╝  ██║███╗██║██║╚════██║██╔══╝  
echo     ██║   ██║██║ ╚═╝ ██║███████╗╚███╔███╔╝██║███████║███████╗
echo     ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝╚══════╝╚══════╝
echo.
echo  🌐 Hostname Setup: http://timewise:9002
echo  ════════════════════════════════════════════════════════════
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: This script must be run as Administrator
    echo.
    echo ➡️  How to run as Administrator:
    echo    1. Right-click this file
    echo    2. Select "Run as administrator"
    echo    3. Click "Yes" when prompted
    echo.
    echo 🔒 Administrator privileges are needed to modify the hosts file
    echo.
    pause
    exit /b 1
)

echo ✅ Running as Administrator
echo.

echo 🔍 Current server IP: 192.168.1.43
echo 🎯 Setting up hostname: timewise
echo.

REM Backup the hosts file
set HOSTS_FILE=C:\Windows\System32\drivers\etc\hosts
copy "%HOSTS_FILE%" "%HOSTS_FILE%.timewise_backup" >nul 2>&1
echo 💾 Hosts file backed up

REM Check if entry already exists
findstr /C:"192.168.1.43.*timewise" "%HOSTS_FILE%" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Hostname entry already exists in hosts file
    echo.
    goto TEST
)

REM Add the hostname entry
echo 📝 Adding hostname entry to hosts file...
echo. >> "%HOSTS_FILE%"
echo # TimeWise Server - Added %date% %time% >> "%HOSTS_FILE%"
echo 192.168.1.43    timewise >> "%HOSTS_FILE%"

if %errorlevel% equ 0 (
    echo ✅ Successfully added hostname entry: 192.168.1.43 → timewise
) else (
    echo ❌ Failed to add hostname entry
    echo 💡 Try running this script as Administrator again
    pause
    exit /b 1
)

:TEST
echo.
echo 🧪 Testing hostname resolution...
ping -n 1 timewise >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ SUCCESS: 'timewise' resolves to 192.168.1.43!
    echo.
    echo 🚀 TimeWise can now be accessed at:
    echo    ➡️  http://timewise:9002
    echo.
) else (
    echo ⚠️  Hostname resolution needs a moment to take effect...
    echo 🔄 Flushing DNS cache...
    ipconfig /flushdns >nul 2>&1
    echo ✅ DNS cache flushed
)

echo.
echo 🎉 SERVER HOSTNAME SETUP COMPLETE!
echo.
echo 📋 Next Steps:
echo    1. ✅ Hostname configured on this server
echo    2. 🔄 Restart your TimeWise server if running
echo    3. 🌐 Set up other devices using NETWORK-TIMEWISE-SETUP.md
echo    4. 📱 For phones/tablets: Use router DNS method
echo.
echo 🧪 Test Steps:
echo    1. ping timewise (should respond from 192.168.1.43)
echo    2. Open http://timewise:9002 in browser
echo    3. Verify TimeWise login page loads
echo.
echo 🌍 For Network-Wide Setup:
echo    - Router DNS (recommended): Configure once for all devices
echo    - Individual Setup: Run similar setup on each computer
echo.
pause