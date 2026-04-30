# AI新闻聚合服务器启动脚本
Write-Host ""
Write-Host "========================================"
Write-Host "  🚀 AI新闻聚合服务器启动脚本"
Write-Host "========================================"
Write-Host ""

# 检查端口是否被占用
$port = 3000
$portUsed = netstat -ano | findstr ":$port "
if ($portUsed) {
    Write-Host "⚠️  端口 $port 已被占用，尝试终止旧进程..." -ForegroundColor Yellow
    $portUsed | ForEach-Object {
        if ($_ -match 'LISTENING\s+(\d+)$') {
            $pid = $matches[1]
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 1
}

# 切换到项目目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "📂 当前目录: $scriptPath"
Write-Host ""
Write-Host "🚀 正在启动服务器..."
Write-Host ""

# 启动服务器
node server-simple.js
