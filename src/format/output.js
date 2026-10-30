/**
 * 人类可读 / --json 输出；时间附上海字段
 */

function toShanghai(isoOrDate) {
  if (!isoOrDate) return null;
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function enrichTimes(value) {
  if (Array.isArray(value)) return value.map(enrichTimes);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = enrichTimes(v);
      if (
        typeof v === 'string' &&
        /(At|Time|_at)$/i.test(k) &&
        !Number.isNaN(Date.parse(v))
      ) {
        out[`${k}Shanghai`] = toShanghai(v);
      }
    }
    return out;
  }
  return value;
}

function printJson(data) {
  console.log(JSON.stringify(enrichTimes(data), null, 2));
}

function printHuman(lines) {
  if (Array.isArray(lines)) {
    for (const line of lines) console.log(line);
  } else {
    console.log(String(lines));
  }
}

function exitWithError(err, asJson) {
  const payload = {
    ok: false,
    message: err?.message || String(err),
    status: err?.status,
    body: err?.body,
  };
  if (asJson) {
    console.error(JSON.stringify(payload, null, 2));
  } else {
    console.error(`错误: ${payload.message}`);
  }
  process.exitCode = 1;
}

module.exports = {
  toShanghai,
  enrichTimes,
  printJson,
  printHuman,
  exitWithError,
};
