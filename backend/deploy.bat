@echo off
setlocal enabledelayedexpansion

REM SprintFlow Production Deployment Script for Windows
REM Run this on your production Windows server

echo =========================================
echo SprintFlow Production Deployment
echo =========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker compose version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose is not available. Please update Docker Desktop.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please copy .env.production to .env and fill in your actual values:
    echo   copy .env.production .env
    echo   notepad .env
    pause
    exit /b 1
)

echo Validating environment configuration...

REM Check for port conflicts first
call check-ports.bat
echo.

REM Load and validate environment variables
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if not "%%a"=="" if not "%%a:~0,1%"=="#" (
        set "%%a=%%b"
    )
)

REM Check required variables
set "missing_vars="
if "!MYSQL_ROOT_PASSWORD!"=="" set "missing_vars=!missing_vars! MYSQL_ROOT_PASSWORD"
if "!DB_USERNAME!"=="" set "missing_vars=!missing_vars! DB_USERNAME"
if "!DB_PASSWORD!"=="" set "missing_vars=!missing_vars! DB_PASSWORD"
if "!APP_JWT_SECRET!"=="" set "missing_vars=!missing_vars! APP_JWT_SECRET"
if "!APP_MAIL_KEY!"=="" set "missing_vars=!missing_vars! APP_MAIL_KEY"
if "!APP_FRONTEND_URL!"=="" set "missing_vars=!missing_vars! APP_FRONTEND_URL"

if not "!missing_vars!"=="" (
    echo ERROR: Missing required environment variables:!missing_vars!
    echo Please update your .env file with actual values
    pause
    exit /b 1
)

REM Check for placeholder values
echo !APP_JWT_SECRET! | findstr "REPLACE_WITH" >nul
if not errorlevel 1 (
    echo ERROR: APP_JWT_SECRET contains placeholder value
    echo Please generate a real secret with: powershell -Command "-join ((1..64) | ForEach {'{0:X}' -f (Get-Random -Max 16)})"
    pause
    exit /b 1
)

echo ✓ Environment validation passed

REM Create SSL directory if it doesn't exist
if not exist docker\ssl mkdir docker\ssl

REM Check if SSL certificates exist
if not exist docker\ssl\server.crt (
    echo WARNING: SSL certificates not found in docker\ssl\
    echo For production, place your SSL certificates there:
    echo   docker\ssl\server.crt
    echo   docker\ssl\server.key
    echo.
    echo Generating self-signed certificates for testing...
    
    call generate-ssl.bat
    
    if not exist docker\ssl\server.crt (
        echo ERROR: Failed to generate SSL certificates
        echo Please install OpenSSL or manually create certificates
        pause
        exit /b 1
    )
)

REM Stop existing containers
echo Stopping existing containers...
docker compose down --remove-orphans 2>nul

REM Pull latest images
echo Pulling latest base images...
docker compose pull

REM Build and start services
echo Building and starting services...
docker compose up -d --build

if errorlevel 1 (
    echo.
    echo ERROR: Docker deployment failed!
    echo.
    echo Common solutions:
    echo 1. Make sure Docker Desktop is running
    echo 2. Check if ports 80, 443, 3306, 8080 are free
    echo 3. Ensure you have enough disk space (at least 2GB)
    echo 4. Try: docker system prune -f
    echo.
    echo Showing recent logs:
    docker compose logs --tail=20
    pause
    exit /b 1
)

REM Wait for services to start
echo Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check service health
echo Checking service health...
docker compose ps

echo.
echo =========================================
echo ✓ Deployment completed successfully!
echo =========================================
echo.
echo Services running:
docker compose ps
echo.
echo Access your application:
echo   HTTP:  http://localhost
echo   HTTPS: https://localhost
echo.
echo To view logs:
echo   docker compose logs -f
echo.
echo To stop services:
echo   docker compose down
echo.
echo IMPORTANT: Configure your firewall and DNS for production access
echo.
pause