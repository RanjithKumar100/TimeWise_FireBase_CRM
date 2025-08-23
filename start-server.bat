@echo off
echo 🚀 Starting Firebase Timesheet Server...

echo.
echo 📋 Checking prerequisites...

REM Check if MongoDB is running
echo 🔍 Checking MongoDB connection...
mongo --eval "db.stats()" TIMEWISE >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MongoDB is not running or not accessible
    echo 💡 Please start MongoDB first:
    echo    - Windows: Start MongoDB service
    echo    - Or run: mongod
    echo.
    pause
    exit /b 1
)

echo ✅ MongoDB is running

echo.
echo 🔧 Setting up server configuration...
call npm run server:setup

echo.
echo 🏗️ Building application...
call npm run build

echo.
echo 🌐 Starting production server...
echo 📍 Server will be accessible at: http://YOUR_IP:9002
echo 🔐 Default credentials:
echo    Admin: admin@timewise.com / admin123
echo    User:  user@timewise.com / user123
echo.

call npm run start:prod