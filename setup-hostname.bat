@echo off
echo 🌐 TimeWise Hostname Setup Tool
echo ===============================
echo.
echo This will add 'timewise' hostname to point to 192.168.1.43
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: This script must be run as Administrator
    echo.
    echo Right-click this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo ✅ Running as Administrator
echo.

REM Check if entry already exists
findstr /C:"192.168.1.43.*timewise" C:\Windows\System32\drivers\etc\hosts >nul 2>&1
if %errorlevel% equ 0 (
    echo ℹ️  Entry already exists in hosts file
    echo.
    goto TEST
)

echo 📝 Adding hostname entry to hosts file...
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
    echo ✅ Hostname 'timewise' resolves correctly!
    echo.
    echo 🚀 You can now access TimeWise at:
    echo    http://timewise:9002
) else (
    echo ⚠️  Hostname resolution may take a moment...
    echo   Try accessing: http://timewise:9002
)

echo.
echo 🎉 Setup complete!
echo.
echo 📱 For other devices on the network:
echo    - Run this same setup on each Windows device
echo    - Or configure your router's DNS settings
echo.
pause