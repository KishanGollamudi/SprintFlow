@echo off
echo ========================================
echo JWT Secret Generator for SprintFlow
echo ========================================
echo.
echo Generating secure JWT secret...
echo.

REM Generate a 64-character hex string (256 bits) for JWT secret
powershell -Command "$secret = -join ((1..64) | ForEach {'{0:X}' -f (Get-Random -Max 16)}); Write-Output $secret" > temp_secret.txt

REM Read the generated secret
set /p JWT_SECRET=<temp_secret.txt
del temp_secret.txt

echo Generated JWT Secret (64 hex chars):
echo %JWT_SECRET%
echo.
echo COPY THIS SECRET AND SET IT AS ENVIRONMENT VARIABLE:
echo.
echo For Windows Command Prompt:
echo set APP_JWT_SECRET=%JWT_SECRET%
echo.
echo For PowerShell:
echo $env:APP_JWT_SECRET="%JWT_SECRET%"
echo.
echo For .env file:
echo APP_JWT_SECRET=%JWT_SECRET%
echo.
echo SECURITY WARNING:
echo - Keep this secret private and secure
echo - Never commit it to version control
echo - Use different secrets for different environments
echo.
pause