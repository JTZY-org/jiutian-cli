# 九天 CLI 运行逻辑

## 用户侧获取

1. GitHub：https://github.com/yangrenshi/jiutian-cli  
2. 安装：`npm install -g github:yangrenshi/jiutian-cli` → 得到全局命令 `jiutian`  
3. 或 Releases 下载 zip → 解压 → `npm install` → `npm link`  
4. 官网说明页：https://forum.9tzy.cn/cli （顶栏入口可关，URL 直达）

## 依赖服务

1. 启动后端 `jt_backend`（默认/本地常见端口 **3001**，与前端 Vite 代理一致；也可用 3000）。
2. 启动前端 `jt_frontend`（Vite，授权页与 `/cli` 说明页）。
3. 后端需已迁移 `CliDeviceAuth` 表；本地授权页请配置 `CLI_AUTH_WEB_ORIGIN=http://localhost:5174`（否则可能跳到生产 `FORUM_PUBLIC_ORIGIN`）。

## 调用链

### 设备授权登录

```
jiutian auth login
  → POST {baseUrl}/api/cli/auth/device/code
  → 打开浏览器 {CLI_AUTH_WEB_ORIGIN}/cli/authorize?user_code=XXXX-XXXX
  → 用户在网页登录（/login?redirect=...）后点「授权」
  → POST /api/cli/auth/device/approve（Bearer 网页 JWT）
  → 网页勾选 scopes → POST /api/cli/auth/device/approve
  → CLI 轮询 POST /api/cli/auth/device/token（JWT 含 cliScopes）
  → 写入 ~/.jiutian/config.json（token + user + scopes）
```

### 业务命令

```
jiutian post list
  → GET /api/posts
jiutian post show <id>
  → GET /api/posts/:id
jiutian post mine
  → GET /api/auth/me/posts
jiutian comment list --post-id
  → GET /api/comments/post/:postId
jiutian mcp serve
  → stdio MCP，内部复用 src/client/http.js
```

### 站内入口

```
Navbar「AI工作台」→ /cli（JiutianCliPage）
Navbar「AI工作台」→ Skill（toast 未开放）
授权页 /cli/authorize（CliAuthorizePage）
```

## 常用命令

```bash
cd jt_cli && pnpm install
node bin/jiutian.js config set-endpoint http://localhost:3001
node bin/jiutian.js auth login
node bin/jiutian.js doctor --json
node bin/jiutian.js post list --json
```
