#!/bin/bash
# 一键部署脚本 - 将应用上传到 GitHub

echo "======================================"
echo "👥 人员信息管理 - GitHub 部署脚本"
echo "======================================"
echo ""

# 检查 git 是否安装
if ! command -v git &> /dev/null; then
    echo "❌ 错误：未安装 Git"
    echo "请从 https://git-scm.com/download/win 下载安装"
    exit 1
fi

# 获取用户输入
echo "请输入以下信息来部署应用："
echo ""
read -p "1️⃣ 输入你的 GitHub 用户名: " github_user
read -p "2️⃣ 输入新仓库名称 (例: person-info-app): " repo_name
read -p "3️⃣ 输入你的 GitHub Token（从 https://github.com/settings/tokens 生成）: " github_token

echo ""
echo "⏳ 正在初始化 Git 仓库..."

# 初始化本地 git 仓库
git init
git config user.name "Person Info App"
git config user.email "app@example.com"

# 添加所有文件
git add .

# 创建第一次提交
git commit -m "初始化: 人员信息管理应用 - PWA 版本"

# 添加远程仓库
remote_url="https://${github_token}@github.com/${github_user}/${repo_name}.git"
git remote add origin "$remote_url"

# 修改分支名为 main（GitHub 默认）
git branch -M main

# 推送到 GitHub
echo ""
echo "⏳ 正在推送到 GitHub..."
git push -u origin main

echo ""
echo "✅ 部署成功！"
echo ""
echo "🎉 下一步："
echo "1. 访问 https://github.com/${github_user}/${repo_name}"
echo "2. 打开 https://vercel.com/new"
echo "3. 选择 Import Git Repository"
echo "4. 选择刚创建的仓库"
echo "5. 点击 Deploy"
echo ""
echo "部署完成后，你的应用 URL 会类似："
echo "https://person-info-app.vercel.app"
