@echo off
title Setup TimeWise Hostname on Server
echo.
echo 🌐 Setting up "timewise" hostname on this server
echo ════════════════════════════════════════════════
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: This script must be run as Administrator
    echo.
    echo ➡️  Right-click this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo ✅ Running as Administrator
echo.

REM Backup the hosts file first
copy C:\Windows\System32\drivers\etc\hosts C:\Windows\System32\drivers\etc\hosts.backup >nul 2>&1
echo 💾 Hosts file backed up

REM Check if entry already exists
findstr /C:"192.168.1.43.*timewise" C:\Windows\System32\drivers\etc\hosts >nul 2>&1
if %errorlevel% equ 0 (
    echo ℹ️  Entry already exists in hosts file
    echo.
    goto TEST
)

REM Add the hostname entry
echo 📝 Adding hostname entry to hosts file...
echo. >> C:\Windows\System32\drivers\etc\hosts
echo # TimeWise Server Hostname >> C:\Windows\System32\drivers\etc\hosts
echo 192.168.1.43    timewise >> C:\Windows\System32\drivers\etc\hosts

if %errorlevel% equ 0 (
    echo ✅ Successfully added hostname entry
) else (
    echo ❌ Failed to add hostname entry
    pause
    exit /b 1
)

:TEST
echo.
echo 🧪 Testing hostname resolution...
ping -n 1 timewise >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ SUCCESS: 'timewise' resolves to 192.168.1.43
    echo.
    echo 🚀 Server can now be accessed at:
    echo    http://timewise:9002
    echo.
    echo 🔄 Flushing DNS cache...
    ipconfig /flushdns >nul 2>&1
    echo ✅ DNS cache flushed
) else (
    echo ⚠️  Hostname resolution may take a moment...
    echo    Try testing: ping timewise
)

echo.
echo 🎉 Server hostname setup complete!
echo.
echo 📋 Next steps:
echo    1. Restart your TimeWise server
echo    2. Test access at http://timewise:9002
echo    3. Set up other devices using the network guide
echo.
pause