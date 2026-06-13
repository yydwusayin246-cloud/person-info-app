# 🚀 快速开始 - 云部署 5 分钟版本

## 最快的方式：只需 5 步！

### 📋 准备 (2 分钟)

1. **创建 GitHub Token**
   - 打开: https://github.com/settings/tokens/new
   - 名称: `person-info-deploy`
   - 勾选: `repo`
   - 点击 "Generate" → 复制 Token

2. **准备账号**
   - GitHub: https://github.com/signup (如果没有)
   - Vercel: https://vercel.com/signup (用 GitHub 登录)

### 🚀 部署 (3 分钟)

3. **运行部署脚本**
   ```bash
   cd d:\YYD\copilot\person_info_app
   deploy.bat
   ```
   输入：GitHub 用户名、仓库名、Token

4. **在 Vercel 部署**
   - 打开: https://vercel.com/new
   - 选择 "Import Git Repository"
   - 选择 `person-info-app` 仓库
   - 点击 "Deploy"
   - **等待 1-2 分钟**

5. **在手机上安装**
   - 打开: `https://person-info-app.vercel.app`
   - Android: 等待"⬇️ 安装应用" → 点击
   - iPhone: 分享 → "添加到主屏幕"

## ✅ 完成！

现在你可以：
- 📱 从任何手机访问应用
- 📴 离线使用应用
- 🌍 全球任何地方

---

## 🔗 重要链接

| 操作 | 链接 |
|------|------|
| 创建 GitHub Token | https://github.com/settings/tokens/new |
| GitHub 新仓库 | https://github.com/new |
| Vercel 导入 | https://vercel.com/new |
| 你的应用 | https://person-info-app.vercel.app |

---

## 🆘 如果遇到问题

**GitHub 上传失败？**
- 检查 Token 是否正确
- 尝试手动上传 (见 CLOUD_DEPLOY.md)

**Vercel 部署失败？**
- 查看部署日志，复制错误信息
- 通常是因为选错了框架

**手机无法安装？**
- 尝试用 Chrome 或 Safari
- 刷新页面 (Ctrl+F5)
- 检查网络连接

---

## 💡 提示

- 每次更新代码后，只需 `git push` 就会自动重新部署
- 数据存储在手机本地，不会丢失
- 可以分享 URL 给朋友使用

---

更详细的说明见: **CLOUD_DEPLOY.md**
