/**
 * build.mjs — 零依赖静态站点生成器。
 * 流程：清空 dist → 渲染页面 → 复制静态资产 → 写根文件（robots/sitemap/manifest/humans）
 *       → 写档案文件（.enc 加密）→ 生成日志 → 生成二进制资产 → 内链检查 → 金丝雀防剧透检查。
 * 任一检查失败则以非零码退出（生产构建必须成功）。
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { xorEncrypt } from '../src/arg/cipher.mjs';
import { ENC_KEY } from '../src/arg/puzzles.mjs';
import { FILES } from '../src/content/archive.mjs';
import { POSTS, DRAFTS } from '../src/content/blog.mjs';
import { GAMES } from '../src/content/games.mjs';
import { ITEMS } from '../src/content/gallery.mjs';
import { genBeaconLog, genServerLog } from '../src/content/logs.mjs';
import { PAGES } from '../src/pages/registry.mjs';
import { writeAssets } from './gen-assets.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');
const SITE_URL = 'https://rx4098.dpdns.org';

/* ---------- 1. 清空与重建 dist ---------- */
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

/* ---------- 2. 渲染页面 ---------- */
let pageCount = 0;
for (const page of PAGES) {
  let html = await page.render();
  if (typeof html !== 'string' || !html) {
    console.error(`[build] 页面渲染失败（返回空）：${page.out}`);
    process.exit(1);
  }
  // SEO：canonical + og:url（404 页不参与索引，跳过）
  if (page.out !== '404.html') {
    const urlPath = page.out === 'index.html' ? '/' : `/${page.out.replace(/index\.html$/, '')}`;
    const seoTags = `<link rel="canonical" href="${SITE_URL}${urlPath}">\n<meta property="og:url" content="${SITE_URL}${urlPath}">`;
    html = html.replace('</head>', `${seoTags}\n</head>`);
  }
  const out = join(DIST, page.out);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  pageCount++;
}

/* ---------- 3. 复制静态资产 ---------- */
for (const sub of ['css', 'img']) {
  const src = join(ROOT, 'src', 'assets', sub);
  if (existsSync(src)) cpSync(src, join(DIST, 'assets', sub), { recursive: true });
}
// 同构库（cipher/normalize）：客户端在源码中从 ../../arg/ 导入，
// dist 布局是扁平的 assets/js/ + assets/js/lib/ —— 复制时重写导入路径。
mkdirSync(join(DIST, 'assets', 'js', 'lib'), { recursive: true });
for (const lib of ['cipher.mjs', 'normalize.mjs']) {
  cpSync(join(ROOT, 'src', 'arg', lib), join(DIST, 'assets', 'js', 'lib', lib));
}
for (const js of ['boot', 'state', 'ui', 'terminal', 'audio', 'archive', 'search', 'gallery', 'guestbook', 'relight']) {
  const src = join(ROOT, 'src', 'assets', 'js', `${js}.mjs`);
  const code = readFileSync(src, 'utf8').replace(/from '\.\.\/\.\.\/arg\//g, "from './lib/");
  writeFileSync(join(DIST, 'assets', 'js', `${js}.mjs`), code);
}

/* ---------- 4. 根文件 ---------- */

cpSync(join(ROOT, 'src', 'assets', 'img', 'favicon.svg'), join(DIST, 'favicon.svg'));

writeFileSync(join(DIST, 'robots.txt'), `# robots.txt — RX4098 的小破站
# 搜索引擎请只看公开页。以下目录与站点运营无关，请勿爬取。
# （写了三年了，希望这次没写错。 —— RX）

User-agent: *
Disallow: /logs/
Disallow: /system/
Disallow: /fragment/
Disallow: /old/relight/
Disallow: /tmp/
Disallow: /dump/

Sitemap: ${SITE_URL}/sitemap.xml
`);

const publicUrls = ['', 'about/', 'blog/', 'games/', 'gear/', 'gallery/', 'archive/', 'links/', 'guestbook/', 'contact/', 'now/', 'search/', 'backup/', 'license/'];
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicUrls.map((u) => `  <url><loc>${SITE_URL}/${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);

writeFileSync(join(DIST, 'manifest.webmanifest'), JSON.stringify({
  name: 'RX4098 的小破站',
  short_name: 'RX4098',
  start_url: '/',
  display: 'standalone',
  background_color: '#0b0f14',
  theme_color: '#0b0f14',
  icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
}, null, 2));

mkdirSync(join(DIST, '.well-known'), { recursive: true });
writeFileSync(join(DIST, '.well-known', 'humans.txt'), `/* TEAM */
站长 / 开发 / 运维 / 客服 / 保洁: 任霄 (RX4098)
上线时间: 深夜

/* THANKS */
萤火 — 教会我所有值得会的东西
旧互联网 — 提供了本站的全部审美

/* SITE */
标准: 手写 HTML/CSS/JS
构建: 一台树莓派 + node
公开层最后更新: 2024-11-02
`);

/* ---------- 5. 档案文件（含 .enc 伪加密） ---------- */
for (const f of FILES) {
  const out = join(DIST, 'archive', 'files', f.path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, f.encrypted ? xorEncrypt(f.content, ENC_KEY) : f.content);
}

/* ---------- 6. 日志 ---------- */
mkdirSync(join(DIST, 'logs'), { recursive: true });
writeFileSync(join(DIST, 'logs', 'beacon.log'), genBeaconLog());
writeFileSync(join(DIST, 'logs', 'server.log'), genServerLog());

/* ---------- 6.5 杂项目录：/tmp/ /dump/ /backup/ 的实体文件 ---------- */
mkdirSync(join(DIST, 'tmp'), { recursive: true });
writeFileSync(join(DIST, 'tmp', 'sig-note.txt'), `# 给 beacon.conf 的注释草稿（2023-06-19）
# sig 字段想写成完整的呼号，但那样一眼就看穿写给人看了。
# 拆成单字符轮换。火腿看得懂，搜索引擎看不懂。
# CQ = 呼叫任意站。DE = 这里是。K = 请回答。
# 什么时候有人回答呢。
`);
writeFileSync(join(DIST, 'tmp', 'draft_04.txt'), `草稿 04（未发布 · 2023-07-06）
========================================
今晚心跳第 588 次的时候突然想到：
如果有一天 beacon 报错了，谁会第一个发现？
大概是我。然后呢。
大概没有然后。日志修好，继续跳。
这大概就是成年人和灯塔的区别：
灯塔坏了会有人修，因为它对别人有用。
我这个，对别人没用，只能自己修。
挺好的。自己修，就不用解释为什么。
`);

// pcap 红鲱鱼：合法 pcap 头 + 若干包，payload 内嵌 ASCII 说明
function fakePcap() {
  const packets = [
    'TEST CAPTURE - guixu-20190504-1420.pcap (练习)',
    'scenario: login/heartbeat/loot x3',
    'NOTE: this is a dry run for the capture plan.',
    'if you can read this, you are doing exactly',
    'what the README said not to do with pcaps.',
    'nothing here. seriously. go read packet-capture-README.md',
    '-- 白砂, 2019-05-04 (after 3 failed attempts)',
  ];
  const parts = [];
  // 全局头：magic 0xa1b2c3d4, v2.4, tz0, sigfigs0, snaplen 65535, network=ethernet(1)
  const gh = Buffer.alloc(24);
  gh.writeUInt32LE(0xa1b2c3d4, 0);
  gh.writeUInt16LE(2, 4); gh.writeUInt16LE(4, 6);
  gh.writeUInt32LE(0, 8); gh.writeUInt32LE(0, 12);
  gh.writeUInt32LE(65535, 16); gh.writeUInt32LE(1, 20);
  parts.push(gh);
  let ts = 1556953200; // 2019-05-04 14:20 +08
  for (const text of packets) {
    const payload = Buffer.from(text, 'ascii');
    const frame = Buffer.alloc(58 + payload.length);
    frame.writeUInt32LE(ts, 0); frame.writeUInt32LE(0, 4);
    frame.writeUInt32LE(frame.length - 16, 8); frame.writeUInt32LE(frame.length - 16, 12);
    frame.writeUInt32LE(ts, 16); frame.writeUInt32LE(0, 20);
    payload.copy(frame, 58);
    parts.push(frame);
    ts += 7;
  }
  return Buffer.concat(parts);
}
writeFileSync(join(DIST, 'tmp', 'pcap-test.pcap'), fakePcap());

mkdirSync(join(DIST, 'dump'), { recursive: true });
writeFileSync(join(DIST, 'dump', 'scav-route-v3.txt'), `拾荒路线图 v3（双人修订版 · 最终版 2019-05）
========================================
约定：
  ~ = 环线   | = 支线   括号 = 期望贝壳
  夜潮 +40%，雾天 -20%（能见度惩罚）
  灯塔岛外围是顺路捡的，不算任务。岛上不打捞。这是规矩。

环线 A ~ 沉船A-暗礁带-返航            (1200)
环线 B ~ 鲸落-深渊口-鲸落            (2600, 需潜水服耐久3)
支线 | 沉船B-鲸落                     (2200, 夜潮限定)
全图 ~ 环线A+环线B+灯塔岛外围        (3100+)

（2019-05-02 注：地图会随服务器一起消失。
   导出一份放在 dump。数字没有意义了，
   但数字后面是我们俩一整个 2016 年。）—— RX
`);
cpSync(join(DIST, 'archive', 'files', 'personal', 'online-hours.csv'), join(DIST, 'dump', 'online-hours.csv'));
cpSync(join(DIST, 'archive', 'files', 'personal', 'laomatou-signatures.txt'), join(DIST, 'dump', 'signatures.txt'));

mkdirSync(join(DIST, 'backup'), { recursive: true });
writeFileSync(join(DIST, 'backup', 'config.js'), `// config.js — 2023 年的前端配置（v2.6 时代）
// 已废弃。留着做个纪念。
export default {
  SITE_TITLE: 'RX4098 的小破站',
  SINCE: '2022-04-05',
  CDN: null, // 后来撤了，树莓派直供
  // 2023-02 接过一晚上的免费图床 token，第二天就凉了
  // （别试了，失效两年多了，这个格式也不是真的 token）
  ACCESS_TOKEN: '***REDACTED-BY-MYSELF-2023-03***',
  HEARTBEAT_LOG: '/logs/beacon.log',
};
`);
writeFileSync(join(DIST, 'backup', 'index-v1.html'), `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>RX4098 の小站 v1（快照）</title>
<style>body{background:#f2f0eb;font-family:SimSun,sans-serif;color:#333;max-width:720px;margin:2em auto;padding:0 1em}h1{color:#1c47d0;text-shadow:2px 2px 0 #ffd27a}.box{background:#fff;border:1px solid #c9c4b8;box-shadow:3px 3px 0 #dcd8cf;padding:1em;margin:1em 0}</style>
</head><body><h1>☆ RX4098 の小站 ☆</h1>
<div class="box"><b>2022-04-05</b> 开张。这是第一版首页的快照，白底卡片，当年审美尽力了。</div>
<div class="box">本快照保存在 /backup/。活页面在 <a href="/old/">/old/</a>。</div>
</body></html>`);
writeFileSync(join(DIST, 'backup', 'index-v2.html'), `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>RX4098 的小破站 v2（快照）</title>
<style>body{background:#0b0f14;color:#d9dfe7;font-family:Georgia,serif;max-width:720px;margin:2em auto;padding:0 1em}a{color:#ffd27a}h1{color:#f2a33c;border-left:3px solid #f2a33c;padding-left:.4em}</style>
</head><body><h1>RX4098 的小破站</h1>
<p><b>2022-12</b> 多页改版第一版首页快照。暗色主题在这一版定型。</p>
<p>这版的状态栏还没有"心跳"。那个是 2023 年 6 月以后的事。</p>
</body></html>`);
writeFileSync(join(DIST, 'backup', 'MANIFEST.txt'), `备份清单（2024-11-02 · 最后一次全量）
========================================
  site-dist-v2.9.tar.gz     3.1 MB   本站静态产物
  assets-raw/               812 MB   图库原图与设计源文件
  guixu-archive/            44 GB    截图/抓包/录像/聊天记录导出
  keys/                     不告诉你  （不在本站，永远不在）

3-2-1 原则：树莓派 + 4T 移动硬盘（抽屉）+ 记忆（不可靠但增量）。

（快照说明：index-v1 / index-v2 可直访。老页面是死页，
 但"死页保存完好"这件事，是老互联网最温柔的部分。）
`);

/* ---------- 6.6 搜索索引 ---------- */
const strip = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const indexDocs = [
  ...POSTS.map((p) => ({ url: `/blog/${p.slug}/`, title: p.title, date: p.date, tags: p.tags, summary: p.summary, text: strip(p.body).slice(0, 1200) })),
  ...GAMES.map((g) => ({ url: '/games/', title: g.title, summary: g.note, text: g.note })),
  ...ITEMS.map((i) => ({ url: '/gallery/', title: i.title, summary: i.desc, text: `${i.desc} ${i.date ?? ''}` })),
  ...FILES.map((f) => ({ url: '/archive/', title: f.path, summary: `归档文件 · ${f.mtime}`, text: f.encrypted ? '加密文件 需要口令' : strip(f.content).slice(0, 600) })),
  { url: '/now/', title: '现在', summary: '此刻在做的事', text: '芙莉莲 异星工厂 RSS 树莓派' },
  { url: '/license/', title: '声明 · License', summary: 'ARG 虚构声明 / MIT 开源 / GitHub 仓库', text: '声明 license MIT 开源 GitHub 仓库 虚构 ARG 版权' },
  { url: '/links/', title: '友链与收藏', summary: 'wering 朋友们的站', text: '旧网环 webring 友链 收藏' },
  { url: '/guestbook/', title: '留言板', summary: '老规矩：随便写', text: '留言 心跳 robots' },
  { url: '/about/', title: '关于我', summary: 'RX4098 = 任霄', text: '运维 装机 抓包 2014 2019 2022' },
];
writeFileSync(join(DIST, 'search', 'index.json'), JSON.stringify(indexDocs));

/* ---------- 7. 二进制资产 ---------- */
const assetFiles = writeAssets(DIST);

/* ---------- 8. 内链检查 ---------- */
/** 递归收集 dist 内全部 html 文件。 */
function walkHtml(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkHtml(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const broken = [];
for (const htmlPath of walkHtml(DIST)) {
  const html = readFileSync(htmlPath, 'utf8');
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (!ref.startsWith('/') || ref.startsWith('//')) continue;
    const clean = ref.split('#')[0].split('?')[0];
    if (!clean || clean === '/') { if (!existsSync(join(DIST, 'index.html'))) broken.push([htmlPath, ref]); continue; }
    let target = join(DIST, clean);
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    if (!existsSync(target)) broken.push([htmlPath, ref]);
  }
}
if (broken.length) {
  console.error('[build] 内链检查失败：');
  for (const [f, r] of broken) console.error('  -', f.replace(DIST, ''), '→', r);
  process.exit(1);
}

/* ---------- 9. 金丝雀防剧透检查（锁定内容不得以明文出现在产物中） ---------- */
const CANARIES = ['复灯计划 · 立项书', '致完成握手的你', 'beacon.conf v2 ——', '好友频道记录', '晚安 弟弟', '把灯交给需要它的人'];
for (const htmlPath of walkHtml(DIST)) {
  const html = readFileSync(htmlPath, 'utf8');
  for (const c of CANARIES) {
    if (html.includes(c)) {
      console.error(`[build] 金丝雀触发：'${c}' 以明文出现在 ${htmlPath.replace(DIST, '')}`);
      process.exit(1);
    }
  }
}

console.log(`[build] OK — ${pageCount} 页 / 档案 ${FILES.length} 个 / 二进制资产 ${assetFiles.length} 个 → dist/`);
