/**
 * 九天 CLI 本地配置：~/.jiutian/config.json
 * 目录 0700、文件 0600（Windows 上 mode 可能被忽略）
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

/** 发布包默认指向生产社区；本地开发可用 config set-endpoint 覆盖 */
const DEFAULT_BASE_URL = 'https://forum.9tzy.cn';

function configDir() {
  return path.join(os.homedir(), '.jiutian');
}

function configPath() {
  return path.join(configDir(), 'config.json');
}

function ensureSecureDir() {
  const dir = configDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  try {
    fs.chmodSync(dir, 0o700);
  } catch {
    // Windows 等平台可能不支持 chmod
  }
  return dir;
}

function readConfig() {
  try {
    const raw = fs.readFileSync(configPath(), 'utf8');
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function writeConfig(partial) {
  ensureSecureDir();
  const next = { ...readConfig(), ...partial };
  // 禁止把密码写入配置
  delete next.password;
  const file = configPath();
  fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  try {
    fs.chmodSync(file, 0o600);
  } catch {
    // ignore
  }
  return next;
}

function clearToken() {
  const cfg = readConfig();
  delete cfg.token;
  delete cfg.user;
  delete cfg.scopes;
  writeConfig(cfg);
  return cfg;
}

function getBaseUrl() {
  const fromEnv = String(process.env.JIUTIAN_BASE_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const cfg = readConfig();
  const fromCfg = String(cfg.baseUrl || '').trim();
  if (fromCfg) return fromCfg.replace(/\/$/, '');
  return DEFAULT_BASE_URL;
}

function getToken() {
  const fromEnv = String(process.env.JIUTIAN_TOKEN || '').trim();
  if (fromEnv) return fromEnv;
  return String(readConfig().token || '').trim() || null;
}

module.exports = {
  DEFAULT_BASE_URL,
  configDir,
  configPath,
  readConfig,
  writeConfig,
  clearToken,
  getBaseUrl,
  getToken,
};
