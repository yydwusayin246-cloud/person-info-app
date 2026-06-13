# 🚀 手动部署指南 (如果脚本出现问题)

如果脚本出现乱码或不工作，请按照这个指南**手动部署**。

---

## 📋 前置准备

1. **创建 GitHub Token**
   - 打开: https://github.com/settings/tokens/new
   - Name: `person-info-deploy`
   - Expiration: `No expiration`
   - 勾选 `repo`
   - 点击 "Generate token"
   - **复制 Token**（只显示一次！）

2. **准备必要的工具**
   - Git: https://git-scm.com/download/win
   - 命令行工具 (PowerShell 或 CMD)

---

## ✅ 手动部署步骤

### 步骤 1️⃣：初始化 Git 仓库

打开 **PowerShell** 或 **CMD**，进入项目目录：

```powershell
cd d:\YYD\copilot\person_info_app
```

初始化 git：

```powershell
git init
git config user.name "Person Info App"
git config user.email "app@example.com"
```

### 步骤 2️⃣：添加文件到 Git

```powershell
git add .
```

创建第一次提交：

```powershell
git commit -m "初始化: 人员信息管理应用 - PWA 版本"
```

### 步骤 3️⃣：添加 GitHub 远程仓库

**替换以下命令中的 `YOUR_USERNAME` 和 `YOUR_TOKEN`：**

```powershell
git remote add origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/person-info-app.git
```

**例如:**
```powershell
git remote add origin https://ghp_abcdef1234567890@github.com/zhangsan/person-info-app.git
```

修改分支名：

```powershell
git branch -M main
```

### 步骤 4️⃣：推送到 GitHub

```powershell
git push -u origin main
```

如果提示输入密码，输入你的 GitHub Token。

**成功时输出:**
```
Enumerating objects: 14, done.
Writing objects: 100% (14/14), ...
To https://github.com/YOUR_USERNAME/person-info-app.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## 🌐 在 Vercel 部署

### 步骤 1️⃣：打开 Vercel

访问: https://vercel.com/new

### 步骤 2️⃣：用 GitHub 登录

- 如果没有账号，先注册 (用 GitHub 账号注册最简单)

### 步骤 3️⃣：导入仓库

1. 点击 "Import Git Repository"
2. 在 GitHub 仓库中找到 `person-info-app`
3. 点击 "Import"

### 步骤 4️⃣：配置项目

设置以下选项：

| 选项 | 值 |
|------|-----|
| Framework | Other (其他) |
| Root Directory | ./ (默认，不修改) |
| Build Command | (留空) |
| Output Directory | (留空) |

### 步骤 5️⃣：部署

点击 "Deploy" 按钮。

**等待 1-2 分钟，你会看到:**

```
✅ Production: Ready
   https://person-info-app.vercel.app
```

---

## 📱 部署完成后

### 在手机上使用

1. **打开浏览器**
   - 任何浏览器都可以 (Chrome, Safari, Firefox, Edge)

2. **访问应用**
   ```
   https://person-info-app.vercel.app
   ```

3. **第一次打开时**
   ```
   📥 正在缓存应用文件到你的手机...
   ████████████ 100%
   ✅ 应用已完全缓存！
   ```

4. **之后可以离线使用**
   - 断开网络
   - 应用仍然能完全工作
   - 所有数据保存在手机本地

---

## 🔧 常见命令速查

| 任务 | 命令 |
|------|------|
| 初始化 Git | `git init` |
| 添加文件 | `git add .` |
| 创建提交 | `git commit -m "描述"` |
| 添加远程 | `git remote add origin URL` |
| 推送代码 | `git push -u origin main` |
| 查看状态 | `git status` |
| 查看日志 | `git log` |

---

## ❓ 常见问题

### Q: Git 未找到

**A:** 安装 Git:
1. 访问 https://git-scm.com/download/win
2. 下载安装程序
3. 按照默认设置安装
4. 重启 PowerShell/CMD

### Q: Token 错误

**A:** 检查：
1. Token 是否完整复制（不要少复制或多复制空格）
2. Token 是否过期（应该选择 "No expiration"）
3. Token 是否有 `repo` 权限

### Q: 推送失败

**A:** 可能的原因：
1. 网络连接问题，重试一次
2. GitHub 用户名或 Token 错误
3. 仓库已存在，删除后重试

### Q: Vercel 部署失败

**A:** 检查：
1. 框架是否选择 "Other"
2. Root Directory 是否是 "./"
3. 查看 Vercel 的部署日志了解详细错误

---

## ✅ 完成检查表

- [ ] 创建了 GitHub Token
- [ ] 安装了 Git
- [ ] 运行了 `git init` 
- [ ] 运行了 `git add .`
- [ ] 运行了 `git commit`
- [ ] 添加了远程仓库
- [ ] 运行了 `git push`
- [ ] 代码出现在 GitHub 上
- [ ] 在 Vercel 导入了仓库
- [ ] 部署完成
- [ ] 获得了应用 URL
- [ ] 在手机上测试成功

---

## 🎉 完成！

现在你的应用已在云端运行！

- ✅ 全球任何地方都能访问
- ✅ 手机可以离线使用
- ✅ 所有数据保存在手机本地
- ✅ 无需电脑继续启动

享受使用吧！🚀
