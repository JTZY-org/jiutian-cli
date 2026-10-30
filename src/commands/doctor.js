const { get, post, ApiError } = require('../client/http');
const { getBaseUrl, getToken, configPath } = require('../config/store');
const { printJson, printHuman } = require('../format/output');
const { CAPABILITIES } = require('./capabilities');

async function doctor(opts) {
  const baseUrl = getBaseUrl();
  const checks = [];
  let ok = true;

  checks.push({
    id: 'config',
    ok: true,
    detail: { baseUrl, configPath: configPath(), hasToken: !!getToken() },
  });

  try {
    await get('/api/categories', { auth: false, baseUrl });
    checks.push({ id: 'api_reachable', ok: true, detail: 'GET /api/categories 成功' });
  } catch (err) {
    ok = false;
    checks.push({
      id: 'api_reachable',
      ok: false,
      detail: err?.message || String(err),
      status: err?.status,
    });
  }

  try {
    await get('/api/cli/auth/device/lookup?user_code=AAAA-AAAA', {
      auth: false,
      baseUrl,
    });
    checks.push({ id: 'cli_auth_routes', ok: true, detail: 'lookup 可访问' });
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      checks.push({ id: 'cli_auth_routes', ok: true, detail: '设备授权路由可用' });
    } else {
      // 再试申请设备码
      try {
        const code = await post('/api/cli/auth/device/code', {}, { auth: false, baseUrl });
        checks.push({
          id: 'cli_auth_routes',
          ok: !!code?.device_code,
          detail: code?.device_code ? 'device/code 可用' : 'device/code 响应异常',
        });
        if (!code?.device_code) ok = false;
      } catch (e2) {
        ok = false;
        checks.push({
          id: 'cli_auth_routes',
          ok: false,
          detail: e2?.message || '设备授权路由不可用',
        });
      }
    }
  }

  const token = getToken();
  if (!token) {
    checks.push({ id: 'auth', ok: false, detail: '未登录；请运行 jiutian auth login' });
    ok = false;
  } else {
    try {
      const me = await get('/api/auth/me', { baseUrl });
      checks.push({
        id: 'auth',
        ok: true,
        detail: { id: me.id, account: me.account, username: me.username },
      });
    } catch (err) {
      ok = false;
      checks.push({ id: 'auth', ok: false, detail: err?.message || 'token 无效' });
    }
  }

  checks.push({
    id: 'capabilities_count',
    ok: true,
    detail: CAPABILITIES.length,
  });

  const out = { ok, baseUrl, checks };
  if (opts.json) printJson(out);
  else {
    printHuman(`九天 CLI 诊断：${ok ? '通过' : '有问题'}（${baseUrl}）`);
    for (const c of checks) {
      printHuman(
        `  [${c.ok ? 'OK' : 'FAIL'}] ${c.id}: ${
          typeof c.detail === 'string' ? c.detail : JSON.stringify(c.detail)
        }`
      );
    }
  }
  if (!ok) process.exitCode = 1;
}

module.exports = { doctor };
