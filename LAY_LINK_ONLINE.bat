@echo off
chcp 65001 >nul
title KÊNH ONLINE PHOTOBOOTH (CLOUDFLARE TUNNEL)
cd /d "%~dp0"

echo ===============================================================
echo   🌐 ĐANG KẾT NỐI ĐƯỜNG LINK ONLINE CHO BUỒNG CHỤP PHOTOBOOTH
echo ===============================================================
echo.

if exist "cloudflared.exe" (
    echo [OK] Tìm thấy file cloudflared.exe!
    echo.
    echo Đang mở đường truyền Internet cho buồng chụp...
    echo (Vui lòng ĐỂ NGUYÊN cửa sổ này trong suốt thời gian chụp)
    echo.
    echo ===============================================================
    echo 👉 Tìm dòng có link "https://....trycloudflare.com" bên dưới:
    echo    - Lấy điện thoại bật 4G truy cập link đó để test
    echo    - Khách quét mã QR sẽ tải ảnh qua link đó!
    echo ===============================================================
    echo.
    
    :: Kiểm tra nếu cổng 80 (Docker Nginx) đang mở thì trỏ vào 80, ngược lại trỏ vào 3000
    netstat -ano | findstr "LISTENING" | findstr ":80 " >nul
    if %errorlevel% equ 0 (
        echo Đang kết nối vào Cổng 80 (Docker Nginx)...
        cloudflared.exe tunnel --url http://localhost:80
    ) else (
        echo Đang kết nối vào Cổng 3000 (Local Studio)...
        cloudflared.exe tunnel --url http://localhost:3000
    )
) else (
    echo Đang kiểm tra link từ Docker Container...
    docker compose logs tunnel | findstr "trycloudflare.com"
    if %errorlevel% neq 0 (
        echo Chưa thấy link Docker. Hãy chắc chắn bạn đã bật Docker Desktop!
    )
)

echo.
pause

