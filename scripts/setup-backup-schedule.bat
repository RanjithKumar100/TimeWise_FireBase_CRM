@echo off
echo.
echo =====================================================
echo    Setting up TimeWise MongoDB Backup Schedule
echo    (Every 15 days at 2:00 AM)
echo =====================================================
echo.

set SCRIPT_DIR=%~dp0
set BACKUP_SCRIPT=%SCRIPT_DIR%backup-database.bat

echo Creating scheduled task...
echo.

schtasks /create ^
  /tn "TimeWise MongoDB Backup" ^
  /tr "\"%BACKUP_SCRIPT%\"" ^
  /sc daily ^
  /mo 15 ^
  /st 02:00 ^
  /ru "SYSTEM" ^
  /f

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS: Backup schedule created successfully!
    echo.
    echo 📅 Schedule Details:
    echo    - Task Name: TimeWise MongoDB Backup
    echo    - Frequency: Every 15 days
    echo    - Time: 2:00 AM
    echo    - Runs as: SYSTEM user
    echo.
    echo 🔍 To view the scheduled task:
    echo    1. Open Task Scheduler (taskschd.msc)
    echo    2. Look for "TimeWise MongoDB Backup"
    echo.
    echo 🧪 To test the backup manually, run:
    echo    %BACKUP_SCRIPT%
    echo.
) else (
    echo.
    echo ❌ ERROR: Failed to create scheduled task!
    echo Please run this script as Administrator.
    echo.
)

echo Press any key to exit...
pause >nul