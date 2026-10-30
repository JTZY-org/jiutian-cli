const { printJson, printHuman } = require('../format/output');

/** 静态能力表（与第一期命令面对齐） */
const CAPABILITIES = [
  { id: 'auth.login', risk: 'write', role: 'any', desc: '设备授权登录' },
  { id: 'auth.status', risk: 'read', role: 'any', desc: '登录状态' },
  { id: 'auth.logout', risk: 'write', role: 'any', desc: '清除本地凭据' },
  { id: 'account.show', risk: 'read', role: 'user', desc: '当前用户资料' },
  { id: 'post.list', risk: 'read', role: 'any', desc: '公开帖子列表' },
  { id: 'post.show', risk: 'read', role: 'any', desc: '帖子详情' },
  { id: 'post.mine', risk: 'read', role: 'user', desc: '我的帖子' },
  { id: 'post.create', risk: 'write', role: 'user', desc: '发帖（默认 pending）' },
  { id: 'post.update', risk: 'write', role: 'user', desc: '更新自己的帖子' },
  { id: 'post.delete', risk: 'write', role: 'user', desc: '删除自己的帖子' },
  { id: 'post.like', risk: 'write', role: 'user', desc: '点赞切换' },
  { id: 'comment.list', risk: 'read', role: 'any', desc: '帖子评论列表' },
  { id: 'comment.create', risk: 'write', role: 'user', desc: '发表评论（默认 pending）' },
  { id: 'comment.delete', risk: 'write', role: 'user', desc: '删除自己的评论' },
  { id: 'comment.like', risk: 'write', role: 'user', desc: '评论点赞' },
  { id: 'category.list', risk: 'read', role: 'any', desc: '分类列表' },
  { id: 'tag.hot', risk: 'read', role: 'any', desc: '热门标签' },
  { id: 'announcement.list', risk: 'read', role: 'any', desc: '公告列表' },
  { id: 'announcement.show', risk: 'read', role: 'any', desc: '公告详情' },
  { id: 'doctor', risk: 'read', role: 'any', desc: '环境诊断' },
  { id: 'mcp.serve', risk: 'read', role: 'any', desc: 'MCP stdio 服务' },
];

function capabilitiesList(opts) {
  if (opts.json) printJson({ capabilities: CAPABILITIES });
  else {
    printHuman('九天 CLI 能力清单：');
    for (const c of CAPABILITIES) {
      printHuman(`  ${c.id}  [${c.risk}]  ${c.desc}`);
    }
  }
}

function capabilitiesDescribe(id, opts) {
  const c = CAPABILITIES.find((x) => x.id === id);
  if (!c) {
    printHuman(`未找到能力: ${id}`);
    process.exitCode = 1;
    return;
  }
  if (opts.json) printJson(c);
  else printHuman(`${c.id}\nrisk=${c.risk}\nrole=${c.role}\n${c.desc}`);
}

module.exports = {
  CAPABILITIES,
  capabilitiesList,
  capabilitiesDescribe,
};
