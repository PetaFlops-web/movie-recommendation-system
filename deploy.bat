# @echo off
REM Deployment Helper Scripts for Smart Movie Recommendation System (Windows)
REM This is a batch file for Windows users

setlocal enabledelayedexpansion

REM Colors simulation (not available in Windows CMD, using text instead)
set GREEN=[SUCCESS]
set BLUE=[INFO]
set YELLOW=[WARNING]
set RED=[ERROR]

REM Functions
goto start

:print_header
cls
echo.
echo ================================
echo %~1
echo ================================
echo.
exit /b

:print_success
echo [SUCCESS] %~1
exit /b

:print_warning
echo [WARNING] %~1
exit /b

:print_error
echo [ERROR] %~1
exit /b

:setup_local
call :print_header "Setting up Local Development Environment"

echo Installing backend dependencies...
cd backend
call npm install
cd ..
echo [SUCCESS] Backend dependencies installed

echo Installing python dependencies...
cd backend\python_service
pip install -r requirements.txt
cd ..\..\
echo [SUCCESS] Python dependencies installed

echo Installing frontend dependencies...
cd frontend
call npm install
cd ..
echo [SUCCESS] Frontend dependencies installed

echo [SUCCESS] Local setup complete!
exit /b

:start
if "%1"=="" (
    goto help
)

if "%1"=="setup-local" goto setup_local
if "%1"=="docker-up" goto docker_up
if "%1"=="docker-down" goto docker_down
if "%1"=="check-deps" goto check_deps
if "%1"=="help" goto help

echo [ERROR] Unknown command: %1
goto help

:docker_up
echo [INFO] Starting Docker services...
docker-compose up -d
echo [SUCCESS] Services started!
echo.
echo Services available at:
echo   - Backend:        http://localhost:3001
echo   - Python Service: http://localhost:5000
echo   - Database:       localhost:5432
exit /b

:docker_down
echo [INFO] Stopping Docker services...
docker-compose down
echo [SUCCESS] Services stopped
exit /b

:check_deps
echo [INFO] Checking dependencies...

node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Node.js installed: !%
) else (
    echo [ERROR] Node.js not installed
)

python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Python installed
) else (
    echo [ERROR] Python not installed
)

git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Git installed
) else (
    echo [ERROR] Git not installed
)

exit /b

:help
echo.
echo Smart Movie Recommendation System - Deployment Helper (Windows)
echo.
echo Usage: %0 [command]
echo.
echo Commands:
echo   setup-local    - Setup local development environment
echo   docker-up      - Start services with Docker Compose
echo   docker-down    - Stop Docker services
echo   check-deps     - Check all dependencies
echo   help           - Show this help message
echo.
echo Examples:
echo   %0 setup-local
echo   %0 docker-up
echo.
exit /b
