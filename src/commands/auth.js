/**
 * auth login（设备授权）/ status / logout；可选 --password 本地兜底
 */
const open = require('open');
const readline = require('readline');
const { post, get, ApiError } = require('../client/http');
const {
  writeConfig,
  clearToken,
  getToken,
  getBaseUrl,
  readConfig,
} = require('../config/store');
const { printJson, printHuman, exitWithError } = require('../format/output');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function ask(question, { silent = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    if (!silent) {
      rl.question(question, (ans) => {
        rl.close();
        resolve(ans);
      });
      return;
    }
    // 简易静默密码（Windows 仍可能回显；优先环境变量）
    process.stdout.write(question);
    let buf = '';
    const onData = (char) => {
      const c = char.toString('utf8');
      if (c === '\n' || c === '\r' || c === '\u0004') {
        process.stdin.off('data', onData);
        rl.close();
        process.stdout.write('\n');
        resolve(buf);
      } else if (c === '\u0003') {
        process.exit(130);
      } else if (c === '\u007f' || c === '\b') {
        buf = buf.slice(0, -1);
      } else {
        buf += c;
      }
    };
    process.stdin.on('data', onData);
  });
}

async function deviceLogin({ json, noOpen }) {
  const baseUrl = getBaseUrl();
  if (!json) printHuman(`向 ${baseUrl} 申请设备授权码…`);
  const codeRes = await post(
    '/api/cli/auth/device/code',
    {},
    { auth: false, baseUrl }
  );

  const userCode = codeRes.user_code;
  const deviceCode = codeRes.device_code;
  const uri =
    codeRes.verification_uri_complete ||
    `${codeRes.verification_uri}?user_code=${encodeURIComponent(userCode)}`;
  const intervalSec = Math.max(3, Number(codeRes.interval) || 5);
  const expiresIn = Number(codeRes.expires_in) || 900;

  if (json) {
    // 设备流进行中仍向 stderr 提示，stdout 留给最终结果
    console.error(
      JSON.stringify(
        {
          phase: 'awaiting_authorization',
          user_code: userCode,
          verification_uri: uri,
          expires_in: expiresIn,
          interval: intervalSec,
        },
        null,
        2
      )
    );
  } else {
    printHuman([
      '',
      '请在浏览器中打开并授权九天 CLI：',
      `  ${uri}`,
      `用户码: ${userCode}`,
      '',
      '等待授权中…（授权完成后终端会自动继续）',
    ]);
  }

  if (!noOpen) {
    try {
      await open(uri);
    } catch {
      // 忽略无法打开浏览器
    }
  }

  const deadline = Date.now() + expiresIn * 1000;
  while (Date.now() < deadline) {
    await sleep(intervalSec * 1000);
    try {
      const tokenRes = await post(
        '/api/cli/auth/device/token',
        { device_code: deviceCode },
        { auth: false, baseUrl }
      );
      if (tokenRes?.access_token) {
        const scopes = Array.isArray(tokenRes.scopes) ? tokenRes.scopes : null;
        writeConfig({
          baseUrl,
          token: tokenRes.access_token,
          user: tokenRes.user || null,
          scopes,
        });
        const out = {
          ok: true,
          message: '登录成功',
          user: tokenRes.user,
          scopes,
          baseUrl,
        };
        if (json) printJson(out);
        else {
          const scopeLine = scopes?.length ? `权限: ${scopes.join(', ')}` : null;
          printHuman(
            [
              `登录成功：${tokenRes.user?.username || tokenRes.user?.account || tokenRes.user?.id || ''}`,
              scopeLine,
            ].filter(Boolean)
          );
        }
        return;
      }
    } catch (err) {
      const errCode = err?.body?.error;
      if (errCode === 'authorization_pending') continue;
      if (errCode === 'slow_down') {
        await sleep(2000);
        continue;
      }
      throw err;
    }
  }
  throw new Error('授权超时，请重新运行 jiutian auth login');
}

async function passwordLogin({ json, account }) {
  const baseUrl = getBaseUrl();
  let acc = account || process.env.JIUTIAN_ACCOUNT || '';
  if (!acc) acc = await ask('账号或邮箱: ');
  let password = process.env.JIUTIAN_PASSWORD || '';
  if (!password) password = await ask('密码: ', { silent: true });

  const data = await post(
    '/api/auth/login',
    { account: acc.trim(), password },
    { auth: false, baseUrl }
  );
  writeConfig({
    baseUrl,
    token: data.token,
    user: data.user || null,
  });
  const out = { ok: true, message: '登录成功（密码模式）', user: data.user, baseUrl };
  if (json) printJson(out);
  else printHuman(`登录成功：${data.user?.username || data.user?.account || ''}`);
}

async function authLogin(opts) {
  try {
    if (opts.password) {
      await passwordLogin({ json: opts.json, account: opts.account });
    } else {
      await deviceLogin({ json: opts.json, noOpen: opts.noOpen });
    }
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

async function authStatus(opts) {
  try {
    const token = getToken();
    const baseUrl = getBaseUrl();
    if (!token) {
      const out = { ok: false, loggedIn: false, baseUrl, message: '未登录' };
      if (opts.json) printJson(out);
      else printHuman(`未登录（API: ${baseUrl}）。请运行: jiutian auth login`);
      process.exitCode = 1;
      return;
    }
    const me = await get('/api/auth/me', { baseUrl });
    const scopes = readConfig().scopes || null;
    const out = { ok: true, loggedIn: true, baseUrl, user: me, scopes };
    if (opts.json) printJson(out);
    else {
      printHuman([
        `已登录: ${me.username || me.account || me.id}`,
        `API: ${baseUrl}`,
        `角色: ${me.role || 'user'}`,
        scopes?.length ? `权限: ${scopes.join(', ')}` : '权限: （未记录，请重新 auth login）',
      ]);
    }
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      clearToken();
      const out = { ok: false, loggedIn: false, message: '登录已失效，请重新授权' };
      if (opts.json) printJson(out);
      else printHuman(out.message);
      process.exitCode = 1;
      return;
    }
    exitWithError(err, opts.json);
  }
}

function authLogout(opts) {
  clearToken();
  const out = { ok: true, message: '已清除本地凭据' };
  if (opts.json) printJson(out);
  else printHuman(out.message);
}

async function accountShow(opts) {
  return authStatus(opts);
}

function configShow(opts) {
  const cfg = { ...readConfig() };
  if (cfg.token) cfg.token = `${String(cfg.token).slice(0, 8)}…`;
  const out = { ...cfg, baseUrl: getBaseUrl(), configPath: require('../config/store').configPath() };
  if (opts.json) printJson(out);
  else printJson(out);
}

function configSetEndpoint(url, opts) {
  const baseUrl = String(url || '').trim().replace(/\/$/, '');
  if (!baseUrl) {
    exitWithError(new Error('请提供 API 根地址，例如 http://localhost:3001'), opts.json);
    return;
  }
  writeConfig({ baseUrl });
  const out = { ok: true, baseUrl };
  if (opts.json) printJson(out);
  else printHuman(`已设置 API: ${baseUrl}`);
}

module.exports = {
  authLogin,
  authStatus,
  authLogout,
  accountShow,
  configShow,
  configSetEndpoint,
};
