/** page-info.mjs — 关于 / 现在 / 联系 / 友链 / 死链页。 */

import { layoutMain, esc } from './layout.mjs';
import { WEBRING, FRIEND_LINKS, BOOKMARKS, TOOLS } from '../content/links.mjs';

export function renderAbout() {
  const content = `
<h1>关于我</h1>
<table>
  <tr><th style="width:90px">ID</th><td>RX4098（本名任霄。R 是姓的首字母，X 是名的；4098 是一个游戏角色编号，见 <a href="/games/">游戏页</a>）</td></tr>
  <tr><th>坐标</th><td>江苏苏州（工作）· 中部 J 市（老家）</td></tr>
  <tr><th>职业</th><td>运维工程师（物流 SaaS）。写巡检脚本、看告警、背值班表</td></tr>
  <tr><th>教育</th><td>江东理工学院 计算机科学与技术 2020–2024</td></tr>
  <tr><th>机龄</th><td>16 年（2010 年家里的 XP 台式机算起）</td></tr>
</table>

<h2>会点什么</h2>
<ul>
  <li>Linux / Shell / Python——能干活水平</li>
  <li>抓包和协议分析——业余爱好，师承一位网友</li>
  <li>装机——八年，从刀卡到水冷都摸过，一次都没漏过水（自豪）</li>
  <li>前端——本站即代表作，你看出来了也别说</li>
</ul>

<h2>性格自述</h2>
<p>寡言。线下话少，线上也话少。打字不爱加句尾标点，爱用省略号，这是老论坛时代留下的。不用表情包，用颜文字，因为颜文字是文本的一部分，表情包是资本的一部分（这句是我编的，听着挺酷）</p>
<p>念旧。硬盘里的东西只进不出。收藏 40 多张驱动光盘，最常用的一次是 2023 年给一台老扫描仪找驱动——真找到了。这就是收藏的意义</p>

<h2>时间线（公开版）</h2>
<ul>
  <li>2010 · 第一台电脑（我爸单位淘汰的 XP）</li>
  <li>2013 · 家里装宽带，注册了第一个论坛号</li>
  <li>2014 · 入坑一款 MMO，认识了一群人，捡了五年垃圾</li>
  <li>2017 · 第一台自己装的机器</li>
  <li>2019 · 那款游戏停运</li>
  <li>2020–2024 · 大学，折腾，毕业</li>
  <li>2022 · 这个站上线</li>
  <li>2023 · 树莓派全家桶，包括一套<a href="/blog/automation/">定时任务</a></li>
  <li>2024 · 上班。博客停更，站还开着</li>
</ul>

<h2>本站</h2>
<p>纯静态，手写 HTML/CSS/JS，无跟踪无统计。托管在 VPS，源备份在树莓派和一块 4T 移动硬盘。有些目录 robots.txt 里写着不让爬——不是针对搜索引擎，是针对所有好奇的东西</p>
<p>想说话去<a href="/guestbook/">留言板</a>，那里回得快一些</p>
<hr>
<p class="tiny" style="color:var(--ink-faint)">隐藏操作：<a href="#" id="reset-link" data-reset>重置本站进度</a>（危险操作，需双重确认）</p>`;

  return layoutMain({ title: '关于', active: '/about/', content });
}

export function renderNow() {
  const content = `
<h1>现在</h1>
<div class="meta">最后更新：2024-11-02（这个页面也会偷懒）</div>
<ul>
  <li>在看：《葬送的芙莉莲》二周目，以及一切 90 年代末的旧番</li>
  <li>在玩：异星工厂 Factorio（这次学会了铁路信号，火车不再对撞了）</li>
  <li>在听：维护着一台自建 RSS 阅读器，订阅 47 个源，其中 9 个已死链接——我舍不得删</li>
  <li>在学：现代前端（学完就忘，忘完再学）</li>
  <li>在值守：一台树莓派。它比我勤快</li>
</ul>
<p>此页灵感来自 <a href="https://nownownow.com/" rel="nofollow">/now page movement</a>（嗯，这个链接是真的的风格的虚构，别点）</p>`;
  return layoutMain({ title: '现在', active: '/now/', content });
}

export function renderContact() {
  const content = `
<h1>联系</h1>
<p>邮件（最慢，大约 6 个月，不夸张）：</p>
<pre>rx4098 [at] mail.rx4098.example
PGP: 4098 6216 2014 1108  8A33 04C1 7CE3 8B01
（指纹是我人生里几个重要数字拼的，猜对没奖）</pre>
<p>更快的方式：<a href="/guestbook/">留言板</a>，我看到就会回。</p>
<p>不接广告，不换友链（除非认识），不参加"站长互推计划"。复古Web风的博主除外——复古Web风的博主看到这句话请立刻联系我</p>`;
  return layoutMain({ title: '联系', active: '/contact/', content });
}

export function renderLinks() {
  const content = `
<h1>友链与收藏</h1>

<h2>旧网环 · Webring</h2>
<div class="notice">
  <b>←</b> <a href="${WEBRING.prev.url}" rel="nofollow">${esc(WEBRING.prev.name)}</a>　
  （本站 · 第 7 站）　
  <a href="${WEBRING.next.url}" rel="nofollow">${esc(WEBRING.next.name)}</a> <b>→</b>
</div>

<h2>朋友们的站</h2>
<table>
  ${FRIEND_LINKS.map((l) => `<tr><td><a href="${l.url}">${esc(l.name)}</a></td><td>${esc(l.note)}</td></tr>`).join('')}
</table>

<h2>收藏夹精选</h2>
<table>
  ${BOOKMARKS.map((l) => `<tr><td><a href="${l.url}" rel="nofollow">${esc(l.name)}</a></td><td>${esc(l.note)}</td></tr>`).join('')}
</table>

<h2>我的工具</h2>
<table>
  ${TOOLS.map((l) => `<tr><td><a href="${l.url}" rel="nofollow">${esc(l.name)}</a></td><td>${esc(l.note)}</td></tr>`).join('')}
</table>
<p class="tiny" style="color:var(--ink-faint)">死链是旧互联网的地貌。我不删它们。</p>`;
  return layoutMain({ title: '友链', active: '/links/', content });
}

export function renderDead() {
  const content = `
<div class="center-page">
  <div class="big">GONE</div>
  <h1>这个站点已经消亡了</h1>
  <p>它曾经存在过。有人在那里发过帖，吵过架，道过歉，告别过。</p>
  <p>域名过期，服务器退租，备份没人认领。这就是一个网站的完整一生。</p>
  <p>本站保留这条死链，作为纪念。</p>
  <p><a href="/links/">← 回友链</a> · <a href="/">← 回首页</a></p>
</div>`;
  return layoutMain({ title: '站点已消亡', content, sidebar: '' });
}
