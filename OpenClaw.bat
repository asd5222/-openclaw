@echo off
chcp 65001 >nul
title AI新闻聚合服务器

echo.
echo ========================================
echo   🚀 启动 OpenClaw
echo ========================================
echo.
cd /d "%~dp0"

echo ✅ 正在启动服务器...
start /b node server-simple.js

echo ⏳ 等待服务器启动...
timeout /t 3 /nobreak >nul

echo 🌐 正在打开浏览器...
start "" http://localhost:3000

echo.
echo ✅ OpenClaw 已启动！按任意键停止服务器...
pause >nul

taskkill /f /im node.exe >nul 2>&1
