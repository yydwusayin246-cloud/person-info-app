# 🚀 快速部署 - 3 种方式

遇到问题？这里有 3 种部署方式，选择最适合你的！

---

## 方式 1️⃣：PowerShell 脚本（推荐）

**最简单，全自动！**

### 运行方式

打开 **PowerShell**（不是 CMD），进入项目目录：

```powershell
cd d:\YYD\copilot\person_info_app
```

运行部署脚本：

```powershell
.\deploy.ps1
```

**脚本会自动问你：**
1. GitHub 用户名
2. 仓库名
3. GitHub Token

输入后自动完成所有部署！

### 如果无法运行

可能需要允许执行脚本。运行以下命令：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

然后再次运行 `.\deploy.ps1`

---

## 方式 2️⃣：CMD 启动器

**简单的一键启动！**

直接双击运行：
```
deploy-windows.cmd
```

会自动启动 PowerShell 脚本。

---

## 方式 3️⃣：手动部署（最稳定）

如果脚本仍有问题，**手动部署**最稳定。

打开文档：📄 **`MANUAL_DEPLOY.md`**

按照步骤一条条运行命令，不会出错！

---

## 🎯 选择建议

| 情况 | 推荐 |
|------|------|
| **第一次部署** | 👉 方式 1 或 2（自动） |
| **脚本出现乱码** | 👉 方式 3（手动） |
| **不确定怎么做** | 👉 方式 3（有详细说明） |
| **想快速完成** | 👉 方式 1 或 2 |

---

## ⚡ 最快开始

### 第 1 步：获取 Token （1 分钟）

打开：https://github.com/settings/tokens/new

- Name: `person-info-deploy`
- 勾选 `repo`
- 点击 Generate
- **复制 Token**

### 第 2 步：选择部署方式

**推荐：方式 1（PowerShell 脚本）**

打开 PowerShell：

```powershell
cd d:\YYD\copilot\person_info_app
.\deploy.ps1
```

输入：
- GitHub 用户名
- 仓库名 (person-info-app)
- Token (粘贴)

**自动完成！** ✅

### 第 3 步：Vercel 部署 （2 分钟）

打开：https://vercel.com/new

- 导入 GitHub 仓库
- 选择 `Other` 框架
- 点击 Deploy

完成！🎉

---

## 📞 遇到问题？

| 问题 | 解决 |
|------|------|
| 脚本乱码 | 使用方式 3（手动） |
| PowerShell 无法运行 | 运行 `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| Git 未找到 | 安装 Git: https://git-scm.com/download/win |
| Token 错误 | 重新创建一个新 Token |
| 推送失败 | 重试或查看 MANUAL_DEPLOY.md |

---

## ✅ 验证成功

**推送成功时，会看到：**
```
✅ 代码已成功推送到 GitHub!
```

**部署成功时，会看到：**
```
✅ Production: Ready
   https://person-info-app.vercel.app
```

---

立即开始吧！选择方式 1、2 或 3，开始部署！ 🚀
