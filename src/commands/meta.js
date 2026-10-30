const { get } = require('../client/http');
const { printJson, printHuman, exitWithError } = require('../format/output');

async function categoryList(opts) {
  try {
    const data = await get('/api/categories', { auth: false });
    if (opts.json) printJson(data);
    else {
      for (const c of data.categories || []) {
        printHuman(`- ${c.id || c._id}  ${c.name}  (${c.count ?? 0})`);
      }
    }
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

async function tagHot(opts) {
  try {
    const limit = opts.size || 20;
    const data = await get(`/api/tags/hot?limit=${limit}`, { auth: false });
    if (opts.json) printJson(data);
    else {
      for (const t of data.tags || []) {
        printHuman(`- ${t.name}  (${t.count ?? 0})`);
      }
    }
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

async function announcementList(opts) {
  try {
    const data = await get('/api/announcements', { auth: false });
    if (opts.json) printJson(data);
    else {
      for (const a of data.announcements || []) {
        printHuman(`- ${a.id}  ${a.title}`);
      }
    }
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

async function announcementShow(id, opts) {
  try {
    const data = await get(`/api/announcements/${encodeURIComponent(id)}`, { auth: false });
    if (opts.json) printJson(data);
    else {
      const a = data.announcement || data;
      printHuman([`标题: ${a.title}`, '', a.content || '']);
    }
  } catch (err) {
    exitWithError(err, opts.json);
  }
}

module.exports = {
  categoryList,
  tagHot,
  announcementList,
  announcementShow,
};
