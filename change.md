# 修改记录（jt_cli）

## 2026-10-31 记录授权 scopes

- 设备流换 token 后把 `scopes` 写入 `~/.jiutian/config.json`；`auth status` / 登录成功提示展示权限。
- `logout` 时清除 `scopes`。

## 2026-10-31 GitHub 公开仓库分发

- 独立仓库：https://github.com/yangrenshi/jiutian-cli （Release `v0.1.0`）。
- 安装：`npm install -g github:yangrenshi/jiutian-cli`；或 Releases 下 zip 后 `npm link`。
- `package.json` 增加 `repository` / `bugs`；README 以 GitHub 安装为主（npm registry 待账号解封再发）。

## 2026-10-31 准备 npm 发布 jiutian-cli

- 包名 `jiutian-cli`，默认 API `https://forum.9tzy.cn`；`files` 仅含 `bin`/`src`/`README`。
- 官网 `/cli` 安装文案改为 `npm install -g jiutian-cli@latest`（去掉本地仓库路径）。
- 发布需有效 npm 登录：`npm login` 后于 `jt_cli` 执行 `npm publish --access public`。

## 2026-10-30 首版九天 CLI

- 新增包 `jiutian-cli`，可执行命令 `jiutian`。
- 设备授权登录：`auth login` → 打开官网 `/cli/authorize` → 轮询换 JWT；可选 `--password` 本地兜底。
- 命令面：`post` / `comment` / `category` / `tag` / `announcement` / `doctor` / `capabilities` / `config`。
- MCP：`jiutian mcp serve`（stdio），写入工具需 `confirmed=true`。
- 本地配置目录：`~/.jiutian/config.json`；默认 API `http://localhost:3001`。
