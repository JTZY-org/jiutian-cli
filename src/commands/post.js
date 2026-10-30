const { get, post, put, del } = require('../client/http');
const { printJson, printHuman, exitWithError } = require('../format/output');

function qs(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

async function postList(opts) {
  try {
    const data = await get(
      `/api/posts${qs({
        page: opts.page,
        limit: opts.size,
        category: opts.category,
        search: opts.keyword || opts.search,
        tag: opts.tag,
        sort: opts.sort,
        authorId: opts.authorId,
        pinned: opts.pinned ? '1' : undefined,
      })}`,
      { auth: false }
    );
    if (opts.json) printJson(data);
    else {
      const posts = data.posts || [];
      printHuman(`共 ${data.total ?? posts.length} 篇（第 ${data.currentPage}/${data.totalPages} 页）`);
      for (const p of posts) {
        printHuman(`- ${p.id}  ${p.title}  [${p.category || '-'}]  赞${p.likes ?? 0} 阅${p.views ?? 0}`);
      }
    }
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

async function postShow(id, opts) {
  try {
    const data = await get(`/api/posts/${encodeURIComponent(id)}`);
    if (opts.json) printJson(data);
    else {
      printHuman([
        `标题: ${data.title}`,
        `ID: ${data.id}`,
        `状态: ${data.status}  可见性: ${data.visibility}`,
        `作者: ${data.author?.username || data.authorId}`,
        `分类: ${data.category || '-'}  标签: ${(data.tags || []).join(',') || '-'}`,
        '',
        data.content || data.summary || '',
      ]);
    }
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

async function postMine(opts) {
  try {
    const data = await get(
      `/api/auth/me/posts${qs({ page: opts.page, limit: opts.size })}`
    );
    if (opts.json) printJson(data);
    else {
      const posts = data.posts || data.records || [];
      printHuman(`我的帖子 ${posts.length} 条`);
      for (const p of posts) {
        printHuman(`- ${p.id || p._id}  [${p.status}]  ${p.title}`);
      }
    }
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

async function postCreate(opts) {
  try {
    if (!opts.yes) {
      throw new Error('发帖为写入操作，请加 --yes 确认（创建后默认进入 pending 审核）');
    }
    const body = {
      title: opts.title,
      content: opts.content || '',
      category: opts.category || '',
      tags: opts.tags ? String(opts.tags).split(/[,，]/).map((s) => s.trim()).filter(Boolean) : [],
      summary: opts.summary || '',
      visibility: opts.visibility || 'public',
    };
    const data = await post('/api/posts', body);
    if (opts.json) printJson({ ...data, _note: '默认 pending，审核通过后公开' });
    else {
      printHuman([
        `已提交审核: ${data.id}`,
        `状态: ${data.review?.status || data.status || 'pending'}`,
        data.postUrl ? `链接: ${data.postUrl}` : '',
        data.message || '',
      ].filter(Boolean));
    }
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

async function postUpdate(id, opts) {
  try {
    if (!opts.yes) throw new Error('更新帖子请加 --yes 确认');
    const body = {};
    if (opts.title) body.title = opts.title;
    if (opts.content) body.content = opts.content;
    if (opts.category) body.category = opts.category;
    if (opts.tags) body.tags = String(opts.tags).split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    const data = await put(`/api/posts/${encodeURIComponent(id)}`, body);
    if (opts.json) printJson(data);
    else printHuman(`已更新: ${id}`);
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

async function postDelete(id, opts) {
  try {
    if (!opts.yes) throw new Error('删除帖子请加 --yes 确认');
    const data = await del(`/api/posts/${encodeURIComponent(id)}`);
    if (opts.json) printJson(data || { ok: true, id });
    else printHuman(`已删除: ${id}`);
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

async function postLike(id, opts) {
  try {
    if (!opts.yes) throw new Error('点赞请加 --yes 确认');
    const data = await post(`/api/posts/${encodeURIComponent(id)}/like`, {});
    if (opts.json) printJson(data);
    else printHuman(data.message || `点赞状态: ${data.isLiked}  总数: ${data.likesCount}`);
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

module.exports = {
  postList,
  postShow,
  postMine,
  postCreate,
  postUpdate,
  postDelete,
  postLike,
};
