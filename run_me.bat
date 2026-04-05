@echo off
TITLE EasyDownloader Setup
echo --------------------------------------------------
echo 🚀 Setting up EasyDownloader...
echo --------------------------------------------------

REM Step 1: Kill any existing Node.js processes on Port 3000
echo 🧹 Cleaning up old server instances...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1

REM Step 2: Check if node_modules exists
if not exist "node_modules\" (
    echo 📦 Installing dependencies (this may take a minute)...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo ❌ ERROR: Failed to install dependencies. 
        echo Please make sure Node.js is installed from: https://nodejs.org/
        pause
        exit /b %errorlevel%
    )
    echo ✅ Dependencies installed successfully!
)

echo.
echo 🚀 Starting the backend server...
echo.
echo 🏠 Once started, visit: http://localhost:3000
echo.
node server.js
pause
