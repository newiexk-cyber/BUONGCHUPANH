@echo off
chcp 65001 >nul
title BUỒNG CHỤP ẢNH 35MM — KIOSK STUDIO SERVER
cd /d "%~dp0"

echo ===============================================================
echo   📸 ĐANG KHỞI ĐỘNG BUỒNG CHỤP ẢNH 35MM STUDIO KIOSK
echo ===============================================================
echo.

set "NODE_EXE=C:\memay\.superpowers\node.exe"
if not exist "%NODE_EXE%" (
  set "NODE_EXE=node"
)

echo [1/2] Đang mở giao diện trên trình duyệt web...
start "" "http://localhost:3000/selfbooth.html"

echo [2/2] Đang khởi chạy Server tại cổng 3000...
echo Nhấn Ctrl + C để dừng server khi muốn tắt.
"%NODE_EXE%" backend/server-legacy.js
pause
