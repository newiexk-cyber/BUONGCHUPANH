@echo off
chcp 65001 >nul
title BUỒNG CHỤP ẢNH 35MM — KIOSK STUDIO SERVER
cd /d "%~dp0"

echo ===============================================================
echo   📸 ĐANG KHỞI ĐỘNG BUỒNG CHỤP ẢNH 35MM STUDIO KIOSK
echo ===============================================================
echo.

echo [1/2] Đang đảm bảo hệ thống Docker Container hoạt động...
docker compose up -d

echo [2/2] Đang mở giao diện Kiosk Studio trên trình duyệt...
start "" "http://localhost/studio"

echo.
echo ===============================================================
echo   ✅ HỆ THỐNG BUỒNG CHỤP ĐÃ SẴN SÀNG!
echo   👉 Địa chỉ Kiosk Studio: http://localhost/studio
echo   👉 Địa chỉ Quản trị Admin: http://localhost/admin
echo ===============================================================
echo.
timeout /t 4 >nul
