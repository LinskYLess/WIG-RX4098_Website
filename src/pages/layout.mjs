/**
 * layout.mjs — 站点骨架（「夜航灯 Nightwatch」皮肤）与 2022 v1 旧皮肤。
 *
 * 锁定块机制：页面声明 lockedBlocks，构建时以门答案为密钥 XOR 加密为 base64
 * 载荷嵌入。明文不进产物（view-source 防剧透；硬核玩家可破 XOR——这是特性）。
 * 客户端 ui.js 在门通过后用玩家输入的答案解密注入。
 */

import { xorEncrypt, b64EncodeText } from '../arg/cipher.mjs';
import { CANARY, MARKER } from '../arg/puzzles.mjs';
import { POSTS } from '../content/blog.mjs';

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const NAV = [
  ['/', '首页'],
  ['/about/', '关于'],
  ['/blog/', '日志'],
  ['/games/', '游戏'],
  ['/gear/', '装备'],
  ['/gallery/', '图库'],
  ['/archive/', '归档'],
  ['/links/', '友链'],
  ['/guestbook/', '留言板'],
  ['/search/', '搜索'],
];

/** 渲染锁定块：占位容器 + 加密载荷。密钥由 keyId 从 CANARY 表解析（keyAlt 用备用等价答案），答案明文不进页面模块。 */
function lockedPayload(blocks) {
  if (!blocks?.length) return '';
  return blocks
    .map((b) => {
      const key = CANARY[b.keyAlt ? `${b.keyId}alt` : b.keyId];
      if (!key) throw new Error(`unknown gate keyId: ${b.keyId}`);
      // 内容载荷同样以 MARKER 开头——客户端注入前用它判定"密钥正确"
      const cipher = xorEncrypt(b.marker ? MARKER : MARKER + b.html, key);
      return `<script type="application/arg-payload" data-block="${b.id}" data-key-id="${b.keyId}">${b64EncodeText(cipher)}</script>`;
    })
    .join('\n');
}

/** 构建期注入的全局只读对象（不含任何答案）。 */
function bootData(extra = {}) {
  const payload = {
    build: new Date().toISOString().slice(0, 10),
    hbAgo: 2 + (new Date().getUTCHours() % 3), // 2–4 小时前，随构建微变
    ...extra,
  };
  return `<script>window.__RX__=${JSON.stringify(payload)};</script>`;
}

function lampSvg(cls = '') {
  return `<svg class="lamp ${cls}" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
<defs><radialGradient id="lg" cx="50%" cy="45%" r="55%"><stop offset="0%" stop-color="#ffd27a"/><stop offset="60%" stop-color="#f2a33c"/><stop offset="100%" stop-color="#7a4a12"/></radialGradient></defs>
<circle class="lamp-bulb" cx="12" cy="10" r="6" fill="url(#lg)"/>
<rect x="10" y="16" width="4" height="2" fill="#8a8f98"/>
<rect x="8" y="18" width="8" height="1.4" fill="#5b6068"/>
<path class="lamp-beam" d="M2 6 L8 9 M22 6 L16 9" stroke="#f2a33c" stroke-width="1" opacity="0"/>
</svg>`;
}

const STATUSBAR = `
<div class="statusbar" id="statusbar">
  <span class="dot" aria-hidden="true"></span>
  <span>站点运行 <b id="uptime-days">—</b> 天</span>
  <span class="sep">|</span>
  <span>最近心跳 <b id="last-heartbeat">—</b></span>
  <span class="sep">|</span>
  <span>访客 <b id="visit-count">…</b></span>
</div>`;

const SIDEBAR = `
<aside class="sidebar">
  <div class="panel">
    <h3>站长</h3>
    <p class="side-bio">RX4098。运维，装机八年级，归墟 OL 遗民。<br>这里是我的杂物间，1975 年起没有打扫过（假的，2022 年起的）</p>
  </div>
  <div class="panel">
    <h3>最新日志</h3>
    <ul class="side-posts">
      ${POSTS.filter((p) => p.date >= '2022')
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5)
        .map((p) => `<li><a href="/blog/${p.slug}/">${esc(p.title)}</a><span class="side-date">${p.date}</span></li>`)
        .join('')}
    </ul>
  </div>
  <div class="panel">
    <h3>旧网环</h3>
    <p class="side-ring">← <a href="https://midnight-wave.example/" rel="nofollow">午夜电波</a> ·
    <a href="https://slowlemon.example/" rel="nofollow">慢速柠檬</a> →</p>
  </div>
  <div class="panel">
    <h3>别处</h3>
    <ul class="side-misc">
      <li><a href="/now/">现在</a></li>
      <li><a href="/contact/">联系</a></li>
      <li><a href="/license/">声明</a></li>
      <li><a href="/404.html">404</a></li>
    </ul>
  </div>
</aside>`;

/**
 * 主布局。
 * @param {{title?:string, desc?:string, active?:string, content:string, wide?:boolean,
 *          comment?:string, lockedBlocks?:Array, bootExtra?:object, sidebar?:string}} opt
 */
export function layoutMain(opt) {
  const { title = '', desc = 'RX4098 的个人小站：装机、游戏、老软件、归档，以及一点没关的灯。',
    active = '', content, comment = '', lockedBlocks = [], bootExtra = {}, sidebar = SIDEBAR, wide = false } = opt;

  const nav = NAV.map(([href, label]) =>
    `<a href="${href}" class="${href === active ? 'active' : ''}">${label}</a>`).join('');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title ? esc(title) + ' · ' : ''}RX4098 的小破站</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:site_name" content="RX4098 的小破站">
<meta property="og:type" content="website">
<meta property="og:title" content="${title ? esc(title) + ' · ' : ''}RX4098 的小破站">
<meta property="og:description" content="${esc(desc)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/assets/css/main.css">
${bootData(bootExtra)}
<script type="module" src="/assets/js/boot.mjs"></script>
</head>
<body data-arg-stage="0">
<a class="skip" href="#main">跳到内容</a>
<header class="site-header">
  <div class="brand">
    ${lampSvg()}
    <div class="brand-text">
      <strong>RX4098 的小破站</strong>
      <span>EST. 2022 · 仍在运行</span>
    </div>
    <div class="lamp-state" id="lamp-state" title="灯塔">●</div>
  </div>
  <nav class="site-nav" aria-label="主导航">${nav}</nav>
  ${STATUSBAR}
</header>
<div class="container ${wide ? 'wide' : ''}">
  <main id="main" class="content">${content}</main>
  ${sidebar ? sidebar : ''}
</div>
<footer class="site-footer">
  <p>© 2022–2026 RX4098 · 本站由一块树莓派和一根网线供养 · <a href="/guestbook/">留言板</a>还热着</p>
  <p class="tiny">由手工 HTML 与固执供养 · 不跟踪 · 不统计 · 心跳除外 <span aria-hidden="true">´・ω・\`</span></p>
  <p class="tiny"><a href="/license/">声明 · MIT 开源</a> · <a href="https://github.com/LinskYLess/WIG-RX4098_Website" rel="noopener">GitHub 仓库</a></p>
  ${comment ? `\n${comment}` : ''}
</footer>
${lockedPayload(lockedBlocks)}
</body>
</html>`;
}

/** 2022 v1 旧站皮肤（/old/ 专用，白底卡片风）。 */
export function layoutOld(opt) {
  const { title = '', content, comment = '', lockedBlocks = [] } = opt;
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · RX4098 の小站 v1</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/old.css">
<script>window.__RX_OLD__=true;</script>
<script type="module" src="/assets/js/boot.mjs"></script>
</head>
<body class="old-body" data-arg-stage="0">
<div class="old-wrap">
  <div class="old-header">
    <h1>☆ RX4098 の小站 ☆</h1>
    <p class="old-sub">- 建设中 ING 欢迎光临 -</p>
    <div class="old-nav">
      <a href="/old/">首页</a> | <a href="/old/#about">关于</a> | <a href="/old/#log">日志</a> | <a href="/old/relight/">项目</a> | <a href="/">【新站】</a>
    </div>
    <p class="old-count">您是第 002741 位访客</p>
  </div>
  ${content}
  <div class="old-footer">
    <p>© 2022 RX4098 · Best viewed in 1366x768 IE9+ / Chrome 98</p>
    <p><img src="/assets/img/badge-webring.svg" alt="webring" width="88" height="31" loading="lazy"> <img src="/assets/img/badge-html.svg" alt="html" width="88" height="31" loading="lazy"></p>
  </div>
  ${comment}
</div>
${lockedPayload(lockedBlocks)}
</body>
</html>`;
}

/** 9x 窗口组件。 */
export function win(title, inner, cls = '') {
  return `<div class="win ${cls}">
  <div class="win-title"><span>${title}</span><span class="win-btns" aria-hidden="true"><i>_</i><i>□</i><i>×</i></span></div>
  <div class="win-body">${inner}</div>
</div>`;
}
