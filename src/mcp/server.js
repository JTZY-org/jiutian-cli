/**
 * 九天 CLI MCP Server（stdio）
 * 工具映射常用只读/受控写入命令；写入工具 description 标明需用户确认。
 */
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { get, post } = require('../client/http');
const { getBaseUrl, getToken } = require('../config/store');

function textResult(obj) {
  return {
    content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }],
  };
}

function errResult(err) {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            ok: false,
            message: err?.message || String(err),
            status: err?.status,
            body: err?.body,
          },
          null,
          2
        ),
      },
    ],
  };
}

const TOOLS = [
  {
    name: 'jiutian_auth_status',
    description: '查看九天 CLI 登录状态与当前用户（只读）',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'jiutian_post_list',
    description: '列出公开帖子（只读）',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        size: { type: 'number' },
        category: { type: 'string' },
        keyword: { type: 'string' },
        tag: { type: 'string' },
        sort: { type: 'string' },
      },
    },
  },
  {
    name: 'jiutian_post_show',
    description: '帖子详情（只读）',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'jiutian_post_mine',
    description: '我的帖子（需登录，只读）',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number' },
        size: { type: 'number' },
      },
    },
  },
  {
    name: 'jiutian_comment_list',
    description: '帖子评论列表（只读）',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string' },
        page: { type: 'number' },
        size: { type: 'number' },
      },
      required: ['postId'],
    },
  },
  {
    name: 'jiutian_category_list',
    description: '分类列表（只读）',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'jiutian_tag_hot',
    description: '热门标签（只读）',
    inputSchema: {
      type: 'object',
      properties: { size: { type: 'number' } },
    },
  },
  {
    name: 'jiutian_announcement_list',
    description: '公告列表（只读）',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'jiutian_post_create',
    description:
      '【需用户确认｜CLI 令牌等同网页全量登录】创建帖子，默认 pending。调用前必须征得用户明确同意；confirmed 必须为 true（仅客户端约束）。',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        confirmed: {
          type: 'boolean',
          description: '必须为 true 表示用户已确认',
        },
      },
      required: ['title', 'confirmed'],
    },
  },
  {
    name: 'jiutian_comment_create',
    description:
      '【需用户确认】发表评论，默认 pending。调用前必须征得用户明确同意。',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string' },
        content: { type: 'string' },
        parentId: { type: 'string' },
        confirmed: { type: 'boolean' },
      },
      required: ['postId', 'content', 'confirmed'],
    },
  },
  {
    name: 'jiutian_post_like',
    description: '【需用户确认】切换帖子点赞',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        confirmed: { type: 'boolean' },
      },
      required: ['id', 'confirmed'],
    },
  },
];

async function handleTool(name, args = {}) {
  switch (name) {
    case 'jiutian_auth_status': {
      const token = getToken();
      if (!token) {
        return textResult({ ok: false, loggedIn: false, baseUrl: getBaseUrl() });
      }
      const me = await get('/api/auth/me');
      return textResult({ ok: true, loggedIn: true, baseUrl: getBaseUrl(), user: me });
    }
    case 'jiutian_post_list': {
      const page = args.page || 1;
      const limit = args.size || 20;
      const sp = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (args.category) sp.set('category', args.category);
      if (args.keyword) sp.set('search', args.keyword);
      if (args.tag) sp.set('tag', args.tag);
      if (args.sort) sp.set('sort', args.sort);
      return textResult(await get(`/api/posts?${sp}`, { auth: false }));
    }
    case 'jiutian_post_show':
      return textResult(await get(`/api/posts/${encodeURIComponent(args.id)}`));
    case 'jiutian_post_mine': {
      const page = args.page || 1;
      const limit = args.size || 20;
      return textResult(await get(`/api/auth/me/posts?page=${page}&limit=${limit}`));
    }
    case 'jiutian_comment_list': {
      const page = args.page || 1;
      const limit = args.size || 20;
      return textResult(
        await get(
          `/api/comments/post/${encodeURIComponent(args.postId)}?page=${page}&limit=${limit}`
        )
      );
    }
    case 'jiutian_category_list':
      return textResult(await get('/api/categories', { auth: false }));
    case 'jiutian_tag_hot':
      return textResult(
        await get(`/api/tags/hot?limit=${args.size || 20}`, { auth: false })
      );
    case 'jiutian_announcement_list':
      return textResult(await get('/api/announcements', { auth: false }));
    case 'jiutian_post_create': {
      if (!args.confirmed) {
        throw new Error('写入操作需要 confirmed=true（须用户明确确认）');
      }
      return textResult(
        await post('/api/posts', {
          title: args.title,
          content: args.content || '',
          category: args.category || '',
          tags: args.tags || [],
        })
      );
    }
    case 'jiutian_comment_create': {
      if (!args.confirmed) {
        throw new Error('写入操作需要 confirmed=true（须用户明确确认）');
      }
      const body = { postId: args.postId, content: args.content };
      if (args.parentId) body.parentCommentId = args.parentId;
      return textResult(await post('/api/comments', body));
    }
    case 'jiutian_post_like': {
      if (!args.confirmed) {
        throw new Error('写入操作需要 confirmed=true（须用户明确确认）');
      }
      return textResult(await post(`/api/posts/${encodeURIComponent(args.id)}/like`, {}));
    }
    default:
      throw new Error(`未知工具: ${name}`);
  }
}

async function startMcpServer() {
  const server = new Server(
    { name: 'jiutian-cli', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name;
    const args = request.params.arguments || {};
    try {
      return await handleTool(name, args);
    } catch (err) {
      return errResult(err);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

module.exports = { startMcpServer, TOOLS, handleTool };
