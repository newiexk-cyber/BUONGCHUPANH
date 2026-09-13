@echo off
chcp 65001 >nul
title BUỒNG CHỤP ẢNH — BỘ KIỂM THỬ BẢO MẬT & DỊCH VỤ
cd /d "%~dp0"

echo ===============================================================
echo   🧪 ĐANG CHẠY BỘ KIỂM THỬ BẢO MẬT & MAGIC BYTES
echo ===============================================================
echo.

set "NODE_EXE=C:\memay\.superpowers\node.exe"
if not exist "%NODE_EXE%" (
  set "NODE_EXE=node"
)

"%NODE_EXE%" tests/unit/core.test.js
echo.
pause
