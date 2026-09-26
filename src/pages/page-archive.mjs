/** page-archive.mjs — 归档文件浏览器 / 留言板 / 搜索 / 404。 */

import { layoutMain, esc } from './layout.mjs';
import { FILES } from '../content/archive.mjs';
import { SEED_ENTRIES, FIREFLY_ENTRY } from '../content/guestbook.mjs';

export function renderArchive() {
  const filesJson = JSON.stringify(FILES.map(({ path, mtime, note }) => ({ path, mtime, note })));
  const content = `
<h1>归档</h1>
<p class="meta">硬盘的公开部分。原始文件也可<a href="/archive/files/README.txt">直访</a>（URL 规则：/archive/files/ + 路径）。</p>
<div class="arch-layout">
  <div class="panel"><h3>目录树</h3><div id="arch-tree"></div></div>
  <div class="panel">
    <div id="arch-meta">—</div>
    <div id="arch-view"></div>
  </div>
</div>
<script>window.__RX_FILES__=${filesJson};</script>`;

  return layoutMain({
    title: '归档',
    active: '/archive/',
    content,
    comment: '<!-- note-to-future-me.txt 写给未来的我。如果你不是未来的我，请装作没看见。 -->',
  });
}

export function renderGuestbook() {
  const entries = SEED_ENTRIES.map((e) => `
  <div class="gb-entry ${e.deleted ? 'deleted' : ''}">
    <div class="gb-head"><b>${esc(e.author)}</b>${e.site ? ` · <a href="${e.site}" rel="nofollow">${esc(e.site)}</a>` : ''} · ${esc(e.date)}</div>
    <div class="gb-text">${esc(e.text)}</div>
    ${e.reply ? `<div class="gb-reply">↳ ${esc(e.reply)}</div>` : ''}
  </div>`).join('');

  const content = `
<h1>留言板</h1>
<p class="meta">老规矩：随便写。广告会被删，其他都会被珍惜。</p>
${entries}
<div class="gb-entry firefly keeper-only">
  <div class="gb-head"><b>${esc(FIREFLY_ENTRY.author)}</b> · ${esc(FIREFLY_ENTRY.date)}</div>
  <div class="gb-text">${esc(FIREFLY_ENTRY.text)}</div>
</div>
<hr>
<form id="gb-form" class="win">
  <div class="win-title"><span>签写留言（存本机）</span></div>
  <div class="win-body">
    <p><input type="text" name="name" placeholder="怎么称呼你"></p>
    <p><textarea name="text" rows="3" placeholder="说点什么……（支持灯语）"></textarea></p>
    <button class="btn primary" type="submit">提交</button>
    <span class="tiny"> （无后端，留言只保存在你的浏览器里。这也是一种隐私）</span>
  </div>
</form>
<div id="gb-list"></div>`;
  return layoutMain({ title: '留言板', active: '/guestbook/', content });
}

export function renderSearch() {
  const content = `
<h1>站内搜索</h1>
<p class="meta">纯客户端检索，无隐私顾虑。顺便：试试搜 "心跳"。</p>
<div id="search-app" class="search-app">
  <form><input type="search" placeholder="搜索全站……" aria-label="搜索"> <button class="btn primary" type="submit">搜</button></form>
  <div class="search-out"></div>
</div>`;
  return layoutMain({ title: '搜索', active: '/search/', content });
}

const VARIANTS = [
  '<p>这个页面不存在。<br>不过说实话，这个站上"存在"的标准挺低的——很多页面也只是存在得比较勉强。</p>',
  '<p>这个页面不存在。<br>但你已经发现了状态栏和日志里的东西，是不是？那 404 对你来说只是路标。</p>',
  '<p>这里什么都没有。（大部分时候）<br>——不过你连归档里的便签都读过了，还怕什么 404。</p>',
  '<p>灯亮着，随便逛。<br>守灯人说：404 也是家的一部分。</p>',
];

export function render404() {
  const content = `
<div class="center-page">
  <div class="big">404</div>
  <div id="v404" data-text-variants="${esc(JSON.stringify(VARIANTS))}">${VARIANTS[0]}</div>
  <p class="ascii-art" aria-hidden="true">
      |
     /|\\
    / | \\
     /|\\
    ~~~~~
  </p>
  <p><a href="/">← 回首页</a> · <a href="/archive/">去归档翻翻</a> · <a href="/search/">或者搜搜看</a></p>
</div>`;
  return layoutMain({ title: '404', content, sidebar: '' });
}
