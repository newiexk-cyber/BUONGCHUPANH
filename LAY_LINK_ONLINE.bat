@echo off
title KET NOI ONLINE CLOUDFLARE TUNNEL
cd /d "%~dp0"

echo ===============================================================
echo   DANG KET NOI INTERNET CHO BUONG CHUP PHOTOBOOTH
echo ===============================================================
echo.

if not exist "%~dp0cloudflared.exe" (
    echo [LOI] Khong tim thay file cloudflared.exe trong thu muc!
    echo Vui long kiem tra lai file cloudflared.exe
    pause
    exit /b
)

echo [OK] Da tim thay cloudflared.exe
echo.
echo ===============================================================
echo HUONG DAN:
echo - Cho 5-10 giay de he thong tao duong link Online.
echo - Tim dong chu co dang: https://xxxx.trycloudflare.com
echo - Gui link do hoac dung dien thoai 4G truy cap thu!
echo - GIU NGUYEN cua so nay trong suot buoi chup anh.
echo ===============================================================
echo.

"%~dp0cloudflared.exe" tunnel --url http://localhost:3000

echo.
pause
