@echo off
echo ========================================
echo TimeWise Firewall Setup (ADMIN REQUIRED)
echo ========================================

echo Checking admin privileges...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: This script requires Administrator privileges
    echo Right-click this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo SUCCESS: Running as Administrator

echo.
echo 1. Adding Windows Firewall Rules...
echo ----------------------------------------

echo Adding Inbound Rule for port 9002...
netsh advfirewall firewall delete rule name="TimeWise-Port-9002-Inbound" >nul 2>&1
netsh advfirewall firewall add rule name="TimeWise-Port-9002-Inbound" dir=in action=allow protocol=TCP localport=9002
if %errorlevel% equ 0 (
    echo ✅ SUCCESS: Inbound rule added
) else (
    echo ❌ FAILED: Could not add inbound rule
)

echo Adding Outbound Rule for port 9002...
netsh advfirewall firewall delete rule name="TimeWise-Port-9002-Outbound" >nul 2>&1
netsh advfirewall firewall add rule name="TimeWise-Port-9002-Outbound" dir=out action=allow protocol=TCP localport=9002
if %errorlevel% equ 0 (
    echo ✅ SUCCESS: Outbound rule added
) else (
    echo ❌ FAILED: Could not add outbound rule
)

echo.
echo 2. Adding Node.js Application Rules...
echo ----------------------------------------

echo Adding Node.js Inbound Rule...
netsh advfirewall firewall delete rule name="Node.js TimeWise" >nul 2>&1
netsh advfirewall firewall add rule name="Node.js TimeWise" dir=in action=allow program="%ProgramFiles%\nodejs\node.exe"
if %errorlevel% equ 0 (
    echo ✅ SUCCESS: Node.js inbound rule added
) else (
    echo ⚠️ WARNING: Could not add Node.js rule (may not be needed)
)

echo.
echo 3. Checking Firewall Status...
echo ----------------------------------------
netsh advfirewall show currentprofile state

echo.
echo 4. Verifying Rules...
echo ----------------------------------------
netsh advfirewall firewall show rule name="TimeWise-Port-9002-Inbound"
echo.
netsh advfirewall firewall show rule name="TimeWise-Port-9002-Outbound"

echo.
echo ========================================
echo FIREWALL SETUP COMPLETE!
echo ========================================
echo Next steps:
echo 1. Run "start-timewise-server.bat" to start the server
echo 2. Test locally: http://localhost:9002
echo 3. Test from network: http://192.168.1.92:9002
echo ========================================
pause