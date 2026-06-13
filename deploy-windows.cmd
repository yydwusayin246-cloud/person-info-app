@echo off
REM Windows CMD - 启动 PowerShell 部署脚本

echo.
echo 正在启动部署向导...
echo.

REM 检查 PowerShell 是否可用
where powershell >nul 2>&1
if errorlevel 1 (
    echo 错误: PowerShell 未找到
    pause
    exit /b 1
)

REM 启动 PowerShell 脚本
powershell -NoProfile -ExecutionPolicy Bypass -File "deploy.ps1"

pause
