/**
 * 九天 CLI 入口：jiutian <command>
 */
const { Command } = require('commander');
const {
  authLogin,
  authStatus,
  authLogout,
  accountShow,
  configShow,
  configSetEndpoint,
} = require('./commands/auth');
const { doctor } = require('./commands/doctor');
const { capabilitiesList, capabilitiesDescribe } = require('./commands/capabilities');
const {
  postList,
  postShow,
  postMine,
  postCreate,
  postUpdate,
  postDelete,
  postLike,
} = require('./commands/post');
const {
  commentList,
  commentCreate,
  commentDelete,
  commentLike,
} = require('./commands/comment');
const {
  categoryList,
  tagHot,
  announcementList,
  announcementShow,
} = require('./commands/meta');

const program = new Command();

program
  .name('jiutian')
  .description('九天无人机技术社区 CLI')
  .version('0.1.0')
  .option('--json', '以 JSON 输出', false);

function withGlobal(opts = {}) {
  const g = program.opts();
  return { ...opts, json: !!(opts.json || g.json) };
}

const auth = program.command('auth').description('登录与凭据');
auth
  .command('login')
  .description('浏览器设备授权登录（推荐）')
  .option('--password', '本地密码登录兜底', false)
  .option('--account <account>', '密码模式下的账号')
  .option('--no-open', '不自动打开浏览器')
  .option('--json', 'JSON 输出')
  .action((opts) => authLogin(withGlobal(opts)));
auth
  .command('status')
  .option('--json', 'JSON 输出')
  .action((opts) => authStatus(withGlobal(opts)));
auth
  .command('logout')
  .option('--json', 'JSON 输出')
  .action((opts) => authLogout(withGlobal(opts)));

const account = program.command('account').description('账号');
account
  .command('show')
  .option('--json', 'JSON 输出')
  .action((opts) => accountShow(withGlobal(opts)));

const config = program.command('config').description('本地配置');
config
  .command('show')
  .option('--json', 'JSON 输出')
  .action((opts) => configShow(withGlobal(opts)));
config
  .command('set-endpoint')
  .argument('<url>', 'API 根地址')
  .option('--json', 'JSON 输出')
  .action((url, opts) => configSetEndpoint(url, withGlobal(opts)));

program
  .command('doctor')
  .description('环境诊断')
  .option('--json', 'JSON 输出')
  .action((opts) => doctor(withGlobal(opts)));

const caps = program.command('capabilities').description('能力清单');
caps
  .option('--json', 'JSON 输出')
  .action((opts) => capabilitiesList(withGlobal(opts)));
caps
  .command('list')
  .option('--json', 'JSON 输出')
  .action((opts) => capabilitiesList(withGlobal(opts)));
caps
  .command('describe')
  .argument('<id>', '能力 ID')
  .option('--json', 'JSON 输出')
  .action((id, opts) => capabilitiesDescribe(id, withGlobal(opts)));

const postCmd = program.command('post').description('帖子');
postCmd
  .command('list')
  .option('-p, --page <n>', '页码', '1')
  .option('-s, --size <n>', '每页条数', '20')
  .option('--category <name>', '分类')
  .option('-k, --keyword <q>', '搜索')
  .option('--tag <tag>', '标签')
  .option('--sort <sort>', '排序 hot|comments|views')
  .option('--author-id <id>', '作者 ID')
  .option('--pinned', '仅置顶')
  .option('--json', 'JSON 输出')
  .action((opts) => postList(withGlobal(opts)));
postCmd
  .command('show')
  .argument('<id>', '帖子 ID')
  .option('--json', 'JSON 输出')
  .action((id, opts) => postShow(id, withGlobal(opts)));
postCmd
  .command('mine')
  .option('-p, --page <n>', '页码', '1')
  .option('-s, --size <n>', '每页条数', '20')
  .option('--json', 'JSON 输出')
  .action((opts) => postMine(withGlobal(opts)));
postCmd
  .command('create')
  .requiredOption('--title <title>', '标题')
  .option('--content <content>', '正文')
  .option('--category <name>', '分类')
  .option('--tags <tags>', '逗号分隔标签')
  .option('--summary <summary>', '摘要')
  .option('--visibility <v>', 'public|private', 'public')
  .option('--yes', '确认写入')
  .option('--json', 'JSON 输出')
  .action((opts) => postCreate(withGlobal(opts)));
postCmd
  .command('update')
  .argument('<id>', '帖子 ID')
  .option('--title <title>', '标题')
  .option('--content <content>', '正文')
  .option('--category <name>', '分类')
  .option('--tags <tags>', '标签')
  .option('--yes', '确认写入')
  .option('--json', 'JSON 输出')
  .action((id, opts) => postUpdate(id, withGlobal(opts)));
postCmd
  .command('delete')
  .argument('<id>', '帖子 ID')
  .option('--yes', '确认删除')
  .option('--json', 'JSON 输出')
  .action((id, opts) => postDelete(id, withGlobal(opts)));
postCmd
  .command('like')
  .argument('<id>', '帖子 ID')
  .option('--yes', '确认')
  .option('--json', 'JSON 输出')
  .action((id, opts) => postLike(id, withGlobal(opts)));

const commentCmd = program.command('comment').description('评论');
commentCmd
  .command('list')
  .requiredOption('--post-id <id>', '帖子 ID')
  .option('-p, --page <n>', '页码', '1')
  .option('-s, --size <n>', '每页条数', '20')
  .option('--json', 'JSON 输出')
  .action((opts) =>
    commentList(
      withGlobal({
        postId: opts.postId,
        page: opts.page,
        size: opts.size,
        json: opts.json,
      })
    )
  );
commentCmd
  .command('create')
  .requiredOption('--post-id <id>', '帖子 ID')
  .requiredOption('--content <content>', '内容')
  .option('--parent-id <id>', '父评论 ID')
  .option('--yes', '确认写入')
  .option('--json', 'JSON 输出')
  .action((opts) =>
    commentCreate(
      withGlobal({
        postId: opts.postId,
        content: opts.content,
        parentId: opts.parentId,
        yes: opts.yes,
        json: opts.json,
      })
    )
  );
commentCmd
  .command('delete')
  .argument('<id>', '评论 ID')
  .option('--yes', '确认')
  .option('--json', 'JSON 输出')
  .action((id, opts) => commentDelete(id, withGlobal(opts)));
commentCmd
  .command('like')
  .argument('<id>', '评论 ID')
  .option('--yes', '确认')
  .option('--json', 'JSON 输出')
  .action((id, opts) => commentLike(id, withGlobal(opts)));

const category = program.command('category').description('分类');
category
  .command('list')
  .option('--json', 'JSON 输出')
  .action((opts) => categoryList(withGlobal(opts)));

const tag = program.command('tag').description('标签');
tag
  .command('hot')
  .option('-s, --size <n>', '数量', '20')
  .option('--json', 'JSON 输出')
  .action((opts) => tagHot(withGlobal({ size: opts.size, json: opts.json })));

const announcement = program.command('announcement').description('公告');
announcement
  .command('list')
  .option('--json', 'JSON 输出')
  .action((opts) => announcementList(withGlobal(opts)));
announcement
  .command('show')
  .argument('<id>', '公告 ID')
  .option('--json', 'JSON 输出')
  .action((id, opts) => announcementShow(id, withGlobal(opts)));

const mcp = program.command('mcp').description('MCP');
mcp
  .command('serve')
  .description('以 stdio 启动 MCP Server')
  .action(async () => {
    const { startMcpServer } = require('./mcp/server');
    await startMcpServer();
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err?.message || err);
  process.exitCode = 1;
});
