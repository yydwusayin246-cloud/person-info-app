# Windows PowerShell 部署脚本 - 人员信息管理应用
# 将代码上传到 GitHub 并部署到 Vercel

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "    人员信息管理 - 云部署向导" -ForegroundColor Green
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Git 是否安装
Write-Host "检查 Git 是否已安装..." -ForegroundColor Yellow
$gitCheck = git --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "错误: 未检测到 Git" -ForegroundColor Red
    Write-Host ""
    Write-Host "请从以下网址下载安装 Git:" -ForegroundColor Yellow
    Write-Host "https://git-scm.com/download/win" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "安装完成后，重启 PowerShell 或命令行工具再试" -ForegroundColor Yellow
    Read-Host "按 Enter 键退出"
    exit 1
}

Write-Host "✓ Git 已安装: $gitCheck" -ForegroundColor Green
Write-Host ""

# 获取用户输入
Write-Host "请输入以下信息来部署应用:" -ForegroundColor Cyan
Write-Host ""

$github_user = Read-Host "1️⃣ 输入你的 GitHub 用户名 (例: zhangsan)"
$repo_name = Read-Host "2️⃣ 输入新仓库名称 (例: person-info-app)"
$github_token = Read-Host "3️⃣ 输入你的 GitHub Token (从 https://github.com/settings/tokens 生成)"

Write-Host ""
Write-Host "现在开始部署..." -ForegroundColor Cyan
Write-Host ""

# 初始化 git
Write-Host "初始化 Git 仓库..." -ForegroundColor Yellow
git init
git config user.name "Person Info App"
git config user.email "app@example.com"

# 创建 .gitignore
Write-Host "创建 .gitignore 文件..." -ForegroundColor Yellow
@"
.DS_Store
node_modules
*.log
.vscode
"@ | Out-File -Encoding UTF8 .gitignore

# 添加文件
Write-Host "添加所有文件到 Git..." -ForegroundColor Yellow
git add .

# 创建提交
Write-Host "创建第一次提交..." -ForegroundColor Yellow
git commit -m "初始化: 人员信息管理应用 - PWA 版本"

# 检查是否已添加远程仓库
Write-Host "检查远程仓库..." -ForegroundColor Yellow
$remoteExists = git remote -v | Select-String "origin"

if ($remoteExists) {
    Write-Host "远程仓库已存在，跳过添加步骤" -ForegroundColor Yellow
} else {
    Write-Host "添加 GitHub 远程仓库..." -ForegroundColor Yellow
    $remote_url = "https://${github_token}@github.com/${github_user}/${repo_name}.git"
    git remote add origin $remote_url
}

# 修改分支名
Write-Host "修改分支名为 main..." -ForegroundColor Yellow
git branch -M main

# 推送到 GitHub
Write-Host ""
Write-Host "正在推送代码到 GitHub (这可能需要几秒钟)..." -ForegroundColor Yellow
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "错误: 推送到 GitHub 失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "请检查:" -ForegroundColor Yellow
    Write-Host "1. GitHub Token 是否正确?" -ForegroundColor White
    Write-Host "2. GitHub 用户名是否正确?" -ForegroundColor White
    Write-Host "3. 网络连接是否正常?" -ForegroundColor White
    Write-Host ""
    Read-Host "按 Enter 键退出"
    exit 1
}

Write-Host ""
Write-Host "✅ 代码已成功推送到 GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "现在进行以下步骤来部署到 Vercel:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣ 打开浏览器访问:" -ForegroundColor Green
Write-Host "   https://vercel.com/new" -ForegroundColor Cyan
Write-Host ""
Write-Host "2️⃣ 用 GitHub 账号登录 (如果还没注册，先注册)" -ForegroundColor Green
Write-Host ""
Write-Host "3️⃣ 选择 'Import Git Repository'" -ForegroundColor Green
Write-Host ""
Write-Host "4️⃣ 找到并选择 '$repo_name' 仓库" -ForegroundColor Green
Write-Host ""
Write-Host "5️⃣ 配置部署设置:" -ForegroundColor Green
Write-Host "   - Framework: Other (其他)" -ForegroundColor Yellow
Write-Host "   - Root Directory: ./ (默认)" -ForegroundColor Yellow
Write-Host "   - Build Command: (留空)" -ForegroundColor Yellow
Write-Host ""
Write-Host "6️⃣ 点击 'Deploy'" -ForegroundColor Green
Write-Host ""
Write-Host "7️⃣ 等待 1-2 分钟，部署完成!" -ForegroundColor Green
Write-Host ""
Write-Host "8️⃣ 你会获得一个 URL，类似:" -ForegroundColor Green
Write-Host "   https://$repo_name.vercel.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "部署完成后，在手机上:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 打开浏览器访问你的应用 URL" -ForegroundColor Yellow
Write-Host "2. 第一次打开时会自动缓存文件" -ForegroundColor Yellow
Write-Host "3. 缓存完成后即可离线使用" -ForegroundColor Yellow
Write-Host "4. 所有数据保存在手机本地" -ForegroundColor Yellow
Write-Host ""
Write-Host "祝你使用愉快！🚀" -ForegroundColor Green
Write-Host ""

Read-Host "按 Enter 键完成"
