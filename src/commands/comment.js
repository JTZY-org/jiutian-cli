const { get, post, del } = require('../client/http');
const { printJson, printHuman, exitWithError } = require('../format/output');

async function commentList(opts) {
  try {
    const postId = opts.postId;
    if (!postId) throw new Error('请提供 --post-id');
    const page = opts.page || 1;
    const limit = opts.size || 20;
    const data = await get(
      `/api/comments/post/${encodeURIComponent(postId)}?page=${page}&limit=${limit}`
    );
    if (opts.json) printJson(data);
    else {
      const comments = data.comments || [];
      printHuman(`评论 ${data.total ?? comments.length} 条`);
      for (const c of comments) {
        const author = c.author?.username || c.author?.account || c.authorId;
        printHuman(`- ${c.id}  [${c.status}]  ${author}: ${String(c.content || '').slice(0, 80)}`);
      }
    }
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

async function commentCreate(opts) {
  try {
    if (!opts.yes) throw new Error('发表评论请加 --yes 确认（默认 pending 审核）');
    if (!opts.postId) throw new Error('请提供 --post-id');
    if (!opts.content) throw new Error('请提供 --content');
    const body = {
      postId: opts.postId,
      content: opts.content,
    };
    if (opts.parentId) body.parentCommentId = opts.parentId;
    const data = await post('/api/comments', body);
    if (opts.json) printJson({ ...data, _note: '默认 pending' });
    else printHuman(`已提交评论: ${data.id || data._id}  状态: ${data.status || 'pending'}`);
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

async function commentDelete(id, opts) {
  try {
    if (!opts.yes) throw new Error('删除评论请加 --yes 确认');
    const data = await del(`/api/comments/${encodeURIComponent(id)}`);
    if (opts.json) printJson(data || { ok: true, id });
    else printHuman(`已删除评论: ${id}`);
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

async function commentLike(id, opts) {
  try {
    if (!opts.yes) throw new Error('评论点赞请加 --yes 确认');
    const data = await post(`/api/comments/${encodeURIComponent(id)}/like`, {});
    if (opts.json) printJson(data);
    else printHuman(data.message || '已切换点赞');
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

module.exports = {
  commentList,
  commentCreate,
  commentDelete,
  commentLike,
};
