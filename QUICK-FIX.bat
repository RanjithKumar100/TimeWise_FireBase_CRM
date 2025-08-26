@echo off
title TimeWise Quick Fix - Port 9002
echo ⚡ TimeWise Port 9002 Quick Fix
echo ═══════════════════════════════════
echo.
echo 🔧 Killing all processes on port 9002...

REM Kill all processes using port 9002
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":9002" 2^>nul') do (
    echo 🔫 Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

REM Use npx as backup
echo 🧹 Cleaning up with npx...
npx kill-port 9002 >nul 2>&1

echo.
echo ✅ Port 9002 is now free!
echo.
echo 🚀 You can now run: npm run dev
echo.
pause