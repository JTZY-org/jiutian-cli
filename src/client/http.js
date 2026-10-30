/**
 * 九天 CLI HTTP 客户端：Bearer + JSON
 */
const { getBaseUrl, getToken } = require('../config/store');

class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request(method, apiPath, { body, token, baseUrl, auth = true } = {}) {
  const root = (baseUrl || getBaseUrl()).replace(/\/$/, '');
  const url = `${root}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
  const headers = {
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const bearer = token !== undefined ? token : getToken();
  if (auth && bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error || data.msg)) ||
      `HTTP ${res.status}`;
    throw new ApiError(String(msg), { status: res.status, body: data });
  }
  return data;
}

function get(apiPath, opts) {
  return request('GET', apiPath, opts);
}

function post(apiPath, body, opts) {
  return request('POST', apiPath, { ...opts, body });
}

function put(apiPath, body, opts) {
  return request('PUT', apiPath, { ...opts, body });
}

function del(apiPath, opts) {
  return request('DELETE', apiPath, opts);
}

module.exports = {
  ApiError,
  request,
  get,
  post,
  put,
  del,
};
