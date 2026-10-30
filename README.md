# jiutian-cli（九天 CLI）

九天无人机技术社区官方命令行工具。支持浏览器设备授权登录、帖子/评论查询与互动，以及 MCP（Cursor 等）。

- 官网说明：https://forum.9tzy.cn/cli
- 源码与发行版：https://github.com/yangrenshi/jiutian-cli

## 安装（推荐：GitHub）

需要 Node.js ≥ 18。

### 方式一：直接从 GitHub 安装（全局）

```bash
npm install -g github:yangrenshi/jiutian-cli
```

### 方式二：下载源码包后本地安装

1. 打开 [Releases](https://github.com/yangrenshi/jiutian-cli/releases/latest) 下载 `Source code (zip)`，或直接下载：
   - https://github.com/yangrenshi/jiutian-cli/archive/refs/tags/v0.1.0.zip
2. 解压后进入目录：

```bash
npm install
npm link
```

之后终端即可使用 `jiutian`。

### 方式三：clone

```bash
git clone https://github.com/yangrenshi/jiutian-cli.git
cd jiutian-cli
npm install
npm link
```

> npm 公共 registry 包名同为 `jiutian-cli`；账号恢复后会同步发布 `npm install -g jiutian-cli@latest`。

## 快速开始

```bash
jiutian auth login
jiutian doctor
jiutian post list --json
```

默认 API 为 `https://forum.9tzy.cn`。如需改地址：

```bash
jiutian config set-endpoint https://forum.9tzy.cn
```

## MCP

```bash
jiutian mcp serve
```

## 常用命令

```bash
jiutian auth status
jiutian account show --json
jiutian post show <id>
jiutian comment list --post-id <id>
jiutian --help
```

写入类命令需加 `--yes`；发帖/评论默认进入社区审核。
