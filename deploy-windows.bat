@echo off
echo =======================================================
echo   BMVEI Library Management System - Windows Setup
echo =======================================================

echo Checking for Docker...
docker -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running!
    echo Please install Docker Desktop for Windows and make sure it is running.
    pause
    exit /b
)

if not exist .env (
    echo [INFO] .env file not found. Creating one from .env.docker.example...
    copy .env.docker.example .env
    echo [WARNING] Please edit the .env file with secure passwords before production use!
)

echo.
echo Starting BMVEI LMS Services...
docker-compose up -d --build

echo.
echo =======================================================
echo Deployment successful! 
echo The Library Management System should be available at:
echo http://localhost
echo.
echo Initial Admin Credentials (if not changed in .env):
echo Username: admin
echo Password: ChangeMe@12345
echo.
echo Note: If this is the first run, the database is currently being populated.
echo It might take 10-20 seconds before the app is fully ready.
echo =======================================================
pause
