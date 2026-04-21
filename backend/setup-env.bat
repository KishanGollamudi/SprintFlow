@echo off
echo ========================================
echo SprintFlow Backend - Secure Setup
echo ========================================
echo.

REM Check if .env already exists
if exist .env (
    echo WARNING: .env file already exists!
    echo Do you want to overwrite it? [Y/N]
    set /p choice=
    if /i not "%choice%"=="Y" (
        echo Setup cancelled.
        pause
        exit /b
    )
)

echo Generating secure secrets...
echo.

REM Generate JWT Secret (64 hex chars = 256 bits)
powershell -Command "$jwt = -join ((1..64) | ForEach {'{0:X}' -f (Get-Random -Max 16)}); Write-Output $jwt" > temp_jwt.txt
set /p JWT_SECRET=<temp_jwt.txt
del temp_jwt.txt

REM Generate Mail Key (32 hex chars = 128 bits)
powershell -Command "$mail = -join ((1..32) | ForEach {'{0:X}' -f (Get-Random -Max 16)}); Write-Output $mail" > temp_mail.txt
set /p MAIL_KEY=<temp_mail.txt
del temp_mail.txt

echo Creating .env file...

REM Create .env file with generated secrets
(
echo # SprintFlow Backend Environment Variables
echo # Generated on %date% at %time%
echo # KEEP THIS FILE SECURE - DO NOT COMMIT TO VERSION CONTROL
echo.
echo # JWT Configuration ^(REQUIRED - 64 hex characters^)
echo APP_JWT_SECRET=%JWT_SECRET%
echo.
echo # Database Configuration ^(Update with your actual values^)
echo DB_URL=jdbc:mysql://localhost:3306/sprintflow_db?useSSL=false^&serverTimezone=UTC^&allowPublicKeyRetrieval=true
echo DB_USERNAME=root
echo DB_PASSWORD=root
echo.
echo # Mail Encryption Key ^(32 hex characters^)
echo APP_MAIL_KEY=%MAIL_KEY%
echo.
echo # Frontend URL
echo APP_FRONTEND_URL=http://localhost:5173
echo.
echo # CORS Origins
echo APP_CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
echo.
echo # Database DDL Mode ^(update for dev, validate for prod^)
echo DDL_AUTO=update
echo.
echo # Swagger ^(true for dev, false for prod^)
echo SWAGGER_ENABLED=true
) > .env

echo.
echo ========================================
echo SUCCESS: .env file created successfully!
echo ========================================
echo.
echo Generated secrets:
echo - JWT Secret: %JWT_SECRET%
echo - Mail Key: %MAIL_KEY%
echo.
echo IMPORTANT SECURITY NOTES:
echo 1. .env file has been created with secure random secrets
echo 2. Update DB_USERNAME and DB_PASSWORD with your actual database credentials
echo 3. NEVER commit .env file to version control
echo 4. Keep these secrets secure and private
echo.
echo Your Spring Boot application should now start without JWT errors!
echo.
pause