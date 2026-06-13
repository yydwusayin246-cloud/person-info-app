# 🇨🇳 中国访问友好部署

如果你在中国大陆，Vercel 可能访问较慢或不稳定。这里提供两个解决方案。

---

## 方案 1️⃣：使用国内 CDN (推荐) ⭐

### 关键点
- ✅ 无需 VPN
- ✅ 速度极快
- ✅ 完全国内
- ✅ 免费

### 部署步骤

#### 第 1 步：上传代码到 GitHub

按照 `MANUAL_DEPLOY.md` 的步骤，将代码推送到 GitHub。

#### 第 2 步：在国内 CDN 部署

使用 **Netlify** 的国内节点（推荐）或 **阿里云 OSS** 部署。

**使用 Netlify（最简单）:**

1. 打开: https://app.netlify.com
2. 选择 "New site from Git"
3. 连接 GitHub
4. 选择 `person-info-app` 仓库
5. 部署配置：
   - Build command: (留空)
   - Publish directory: ./
6. 点击 "Deploy site"

**Netlify 已在中国大陆部署节点，访问速度很快！**

---

## 方案 2️⃣：自建服务器（高级）

如果你有自己的服务器或云服务：

### 阿里云部署

1. **创建阿里云账号**
   - 访问: https://www.aliyun.com

2. **创建 OSS Bucket**
   - 服务 → 对象存储 OSS
   - 创建 Bucket
   - 选择最近的地域（如华东）

3. **上传文件**
   ```bash
   # 安装阿里云 CLI
   # 配置凭证
   # 上传所有文件到 OSS
   ```

4. **获得访问 URL**
   - 类似: `https://mybucket.oss-cn-hangzhou.aliyuncs.com/index.html`

---

## 方案 3️⃣：保留 Vercel（如果网络可以）

如果你的网络能够访问 Vercel，继续用 Vercel：

1. 按原计划部署到 Vercel
2. 应用 URL: `https://person-info-app.vercel.app`
3. 手机访问正常（如果网络允许）

---

## 📊 方案对比

| 方案 | 国内速度 | 成本 | 难度 | 推荐 |
|------|--------|------|------|------|
| **Netlify** | ⚡⚡⚡ | 免费 | ⭐ 简单 | ✅ |
| **阿里云** | ⚡⚡⚡ | 便宜 | ⭐⭐ 中等 | 可选 |
| **Vercel** | ⚡⚡ | 免费 | ⭐ 简单 | 备选 |

---

## 🚀 快速使用 Netlify

### 前置：代码已上传到 GitHub

### 第 1 步：注册 Netlify

访问: https://app.netlify.com
- 用 GitHub 账号登录（最简单）

### 第 2 步：导入仓库

1. 点击 "New site from Git"
2. 选择 GitHub
3. 选择 `person-info-app` 仓库

### 第 3 步：部署

配置项：
```
Build command: (留空)
Publish directory: ./
```

点击 "Deploy site" → 等待完成

### 第 4 步：获得 URL

部署完成后：
```
https://person-info-app.netlify.app
```

或自定义域名（可选）

---

## 📱 在手机上使用

### 访问 URL

根据你选择的方案：

**Netlify:**
```
https://person-info-app.netlify.app
```

**Vercel:**
```
https://person-info-app.vercel.app
```

**阿里云:**
```
https://mybucket.oss-cn-hangzhou.aliyuncs.com/index.html
```

### 第一次打开

1. 访问应用 URL
2. 📥 自动缓存所有文件
3. ✅ 缓存完成，可离线使用
4. 💾 数据保存在手机本地

### 中国大陆访问

- ✅ 无需 VPN
- ✅ 快速加载
- ✅ 完全离线可用

---

## 💡 最佳实践

### 建议流程

1. **本地测试** (可选)
   ```bash
   python -m http.server 8000
   ```

2. **推送到 GitHub**
   ```bash
   git push origin main
   ```

3. **部署到国内服务**
   - 推荐: Netlify
   - 备选: 阿里云、腾讯云

4. **在手机上使用**
   - 访问部署的 URL
   - 第一次加载缓存文件
   - 之后离线可用

---

## 🔧 常见问题

### Q: Netlify 部署为什么失败？

**A:** 检查：
- Root directory 是否设置为 "./"
- Build command 是否为空
- 仓库中是否有 index.html

### Q: 在中国怎么没有加速？

**A:** 
- 确保使用 Netlify（有国内节点）
- 或使用阿里云、腾讯云等国内服务
- Vercel 在中国可能较慢

### Q: 如何绑定自己的域名？

**A:** 以 Netlify 为例：
1. 部署完成后
2. 点击 "Domain settings"
3. 添加自定义域名
4. 按照说明修改 DNS

### Q: 数据会保存在云服务器吗？

**A:** 不会！数据只保存在手机本地。云服务器只提供应用代码，不涉及用户数据。

### Q: 多个手机可以使用吗？

**A:** 是的！
- 每个手机访问相同 URL
- 每个手机独立缓存
- 数据各自独立存储
- 互不影响

---

## ✅ 完成检查表

- [ ] 代码已推送到 GitHub
- [ ] 选择了部署方案（推荐 Netlify）
- [ ] 部署完成
- [ ] 获得了应用 URL
- [ ] 在手机上成功访问
- [ ] 第一次加载缓存完成
- [ ] 无需 VPN 可以打开

---

## 🎉 完成！

现在你的应用：
- ✅ 中国大陆无需 VPN 打开
- ✅ 加载速度快
- ✅ 完全离线可用
- ✅ 所有数据本地保存

在任何地方，用任何手机，都能正常使用！🚀
