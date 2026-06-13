@echo off
REM 一键部署脚本 - Windows 版本
REM 将应用上传到 GitHub 和 Vercel

setlocal enabledelayedexpansion

echo.
echo ======================================
echo.
echo     人员信息管理 - 云部署向导
echo.
echo ======================================
echo.

REM 检查 git 是否安装
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未检测到 Git
    echo.
    echo 请按照以下步骤安装 Git：
    echo 1. 访问 https://git-scm.com/download/win
    echo 2. 下载并安装 (推荐使用默认设置)
    echo 3. 重启电脑
    echo 4. 重新运行此脚本
    echo.
    pause
    exit /b 1
)

echo ✅ 已检测到 Git
echo.
echo 现在进行以下配置：
echo.

REM 获取用户输入
set /p github_user="1️⃣ 输入你的 GitHub 用户名: "
set /p repo_name="2️⃣ 输入新仓库名称 (例: person-info-app): "
set /p github_token="3️⃣ 输入你的 GitHub Token (从 https://github.com/settings/tokens 生成): "

echo.
echo ⏳ 正在初始化 Git 仓库...
echo.

REM 初始化 git 仓库
git init
git config user.name "Person Info App"
git config user.email "app@example.com"

REM 创建 .gitignore
echo .DS_Store > .gitignore
echo node_modules >> .gitignore
echo *.log >> .gitignore

REM 添加所有文件
git add .

REM 创建提交
git commit -m "初始化：人员信息管理应用 - PWA 版本"

REM 检查是否已添加远程仓库
git remote -v | find "origin" >nul
if errorlevel 1 (
    REM 添加远程仓库
    set "remote_url=https://%github_token%@github.com/%github_user%/%repo_name%.git"
    git remote add origin !remote_url!
) else (
    echo ⚠️ 远程仓库已存在，跳过添加步骤
)

REM 修改分支名为 main
git branch -M main

REM 推送到 GitHub
echo.
echo ⏳ 正在推送到 GitHub...
echo.

git push -u origin main

if errorlevel 1 (
    echo.
    echo ❌ 推送失败，请检查：
    echo 1. GitHub Token 是否正确
    echo 2. 用户名是否正确
    echo 3. 仓库名是否正确
    echo 4. 网络连接是否正常
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ 代码已成功推送到 GitHub！
echo.
echo 🎉 现在进行以下步骤来部署到 Vercel：
echo.
echo ========== 手动部署步骤 ==========
echo.
echo 1️⃣ 打开浏览器访问：https://vercel.com/new
echo.
echo 2️⃣ 使用 GitHub 账号登录 (或创建账号)
echo.
echo 3️⃣ 选择 "Import Git Repository"
echo.
echo 4️⃣ 找到 "%repo_name%" 仓库并选择
echo.
echo 5️⃣ 点击 "Import"
echo.
echo 6️⃣ 在部署配置页面，选择：
echo    - Framework: Other (其他)
echo    - Root Directory: ./ (默认)
echo    - Build Command: (留空)
echo.
echo 7️⃣ 点击 "Deploy"
echo.
echo 8️⃣ 等待部署完成（通常 1-2 分钟）
echo.
echo 9️⃣ 你会获得一个 URL，类似：
echo    https://person-info-app.vercel.app
echo.
echo ================================
echo.
echo 📱 之后在手机上使用：
echo   访问你的应用 URL，点击"⬇️ 安装应用"
echo.
echo ✅ 完成！现在可以在任何地方访问和使用应用了！
echo.
echo.
pause
