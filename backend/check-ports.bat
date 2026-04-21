@echo off
echo Checking for port conflicts...

REM Check if ports are in use
netstat -an | findstr ":80 " >nul
if not errorlevel 1 (
    echo WARNING: Port 80 is already in use
    echo Please stop any web servers or applications using port 80
)

netstat -an | findstr ":443 " >nul
if not errorlevel 1 (
    echo WARNING: Port 443 is already in use
    echo Please stop any HTTPS servers using port 443
)

netstat -an | findstr ":3306 " >nul
if not errorlevel 1 (
    echo WARNING: Port 3306 is already in use
    echo Please stop MySQL or other database services using port 3306
    echo You can stop MySQL with: net stop mysql
)

netstat -an | findstr ":8080 " >nul
if not errorlevel 1 (
    echo WARNING: Port 8080 is already in use
    echo Please stop any applications using port 8080
    echo This might be your Spring Boot application running in IDE
)

echo Port check completed.