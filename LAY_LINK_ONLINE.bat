@echo off
chcp 65001 >nul
title LẤY ĐƯỜNG LINK ONLINE (CLOUDFLARE TUNNEL)
cd /d "%~dp0"

echo ===============================================================
echo   🌐 ĐANG LẤY ĐƯỜNG LINK ONLINE CHO BUỒNG CHỤP PHOTOBOOTH
echo ===============================================================
echo.
echo Đang kiểm tra link Cloudflare Tunnel...
echo.

docker compose logs tunnel | findstr "trycloudflare.com"

echo.
echo ===============================================================
echo 👉 Bạn copy link https://....trycloudflare.com ở trên:
echo    - Dùng điện thoại 4G truy cập thử để test
echo    - Khách quét mã QR sẽ tải ảnh qua đường link này!
echo ===============================================================
pause
