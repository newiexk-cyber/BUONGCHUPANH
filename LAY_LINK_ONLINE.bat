@echo off
title DUONG LINK ONLINE PHOTOBOOTH (CLOUDFLARE TUNNEL)
chcp 65001 >nul
cls
echo ===============================================================
echo   DUONG LINK ONLINE CHO BUONG CHUP PHOTOBOOTH (ZUMP.PI)
echo ===============================================================
echo.
echo Dang lay duong link Cloudflare dang hoat dong tu Docker...
echo.
docker logs photobooth_tunnel 2>&1 | findstr /i "trycloudflare.com"
echo.
echo ===============================================================
echo HUONG DAN TRUY CAP:
echo  1. Trang Chup Anh: Vao link tren (tu dong vao /studio)
echo  2. Trang Quan Tri: Vao link tren/admin
echo     Mat khau Admin: zumppi_photobooth_secure_key_2026
echo ===============================================================
echo.
pause

