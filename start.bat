@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   AI新闻聚合服务器启动脚本
echo ========================================
echo.
echo 正在启动服务器...
echo.
cd /d "%~dp0"
node server.js
pause
