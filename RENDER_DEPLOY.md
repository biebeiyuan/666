# Claude Escape Game - Render 部署指南

## 🚀 在 Render 上部署

### 前置准备
1. 注册 [Render](https://render.com/) 账号
2. 确保你的代码已推送到 GitHub

### 部署步骤

#### 1. 创建 Web Service
1. 登录 Render Dashboard
2. 点击 **"New +"** → **"Web Service"**
3. 连接你的 GitHub 仓库：`https://github.com/biebeiyuan/666.git`

#### 2. 配置 Web Service

填写以下配置：

- **Name**: `claude-escape-game` (或任意名称)
- **Region**: 选择离你最近的区域（如 Singapore）
- **Branch**: `master`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

#### 3. 配置环境变量

在 **Environment** 部分添加以下环境变量：

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | 你的 Claude API Key |
| `ANTHROPIC_BASE_URL` | 你的代理 URL（如果使用代理） |
| `PORT` | `3001` (Render 会自动设置，可选) |

#### 4. 部署

1. 点击 **"Create Web Service"**
2. Render 会自动开始构建和部署
3. 等待部署完成（通常需要 3-5 分钟）

#### 5. 访问你的网站

部署成功后，Render 会提供一个 URL，类似：
```
https://claude-escape-game.onrender.com
```

## 📝 注意事项

### 免费计划限制
- Render 免费计划在 15 分钟无活动后会休眠
- 首次访问可能需要 30-60 秒唤醒
- 每月有 750 小时的免费使用时间

### API Key 安全
- ⚠️ **不要**将 API Key 提交到 GitHub
- 始终使用环境变量配置敏感信息
- 在 Render Dashboard 中配置环境变量

### 自动部署
- 每次推送到 `master` 分支，Render 会自动重新部署
- 可以在 Settings 中关闭自动部署

## 🔧 本地开发

### 启动后端
```bash
cd server
npm install
npm start
```

### 启动前端
```bash
cd client
npm install
npm run dev
```

访问 `http://localhost:5173`

## 📦 项目结构

```
claude-escape-game/
├── client/          # React 前端
│   ├── src/
│   └── package.json
├── server/          # Express 后端
│   ├── index.js
│   └── package.json
└── build.sh         # Render 构建脚本
```

## 🎮 游戏主题

- 穿进赛博游戏
- 无期迷途
- 中式民俗
- 盗墓探险
- 规则怪谈（带重点提示功能）

## 📄 License

ISC
