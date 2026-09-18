@echo off
title Online Photo Booth Server (Port 3000)
cd /d "%~dp0\.."
echo =======================================================
echo   ONLINE PHOTO BOOTH STUDIO - LOCAL SERVER
echo   URL: http://localhost:3000
echo =======================================================
echo.
python -m http.server 3000
pause
