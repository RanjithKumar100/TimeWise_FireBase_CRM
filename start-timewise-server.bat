@echo off
echo ========================================
echo Starting TimeWise Server (Network Mode)
echo ========================================

echo Killing any existing Node processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting TimeWise server on 0.0.0.0:9002...
echo Server will be accessible at:
echo - Local: http://localhost:9002
echo - Network: http://192.168.1.92:9002
echo.

cd /d "%~dp0"
call npm run dev

echo.
echo If you see any errors, press Ctrl+C and run:
echo npm install
echo Then run this script again.
pause