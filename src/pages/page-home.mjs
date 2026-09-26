/** page-home.mjs — 首页。 */

import { layoutMain, esc, lampSvg } from './layout.mjs';
import { POSTS } from '../content/blog.mjs';

export function render() {
  const latest = POSTS.filter((p) => p.date >= '2022').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const content = `
<section class="hero">
  <div class="hero-lamp">${lampSvg({ variant: 'hero' })}</div>
  <div>
    <h1>欢迎来到我的杂物间</h1>
    <p>我是 RX4098，运维，装机八年级，一个已经关闭的游戏的遗民。这里放着我的装机单、游戏收藏、老软件和一点没关的灯。</p>
    <p>更新随缘（上一次是 2024 年 11 月）。但这个站不会关——电费没几个钱。</p>
    <p class="hero-note">状态栏里的"最近心跳"是什么？<a href="/blog/automation/">这里</a>有个半吊子解释。</p>
  </div>
</section>

<h2>最新日志</h2>
${latest.map((p) => `
<article class="entry-card">
  <div class="gb-head">${p.date}${p.tags.map((t) => ` <span class="tag">${esc(t)}</span>`).join('')}</div>
  <a href="/blog/${p.slug}/"><b>${esc(p.title)}</b></a>
  <p>${esc(p.summary)}</p>
</article>`).join('')}

<h2>几个入口</h2>
<div class="panel-grid">
  <div class="panel"><h3>游戏收藏</h3><p>15 款游戏 + 一张纪念卡。有款游戏的服务器没了，但档案还在。</p><p><a href="/games/">去看看 →</a></p></div>
  <div class="panel"><h3>装备库</h3><p>2017 和 2024 两代装机单、树莓派全家桶、以及三把吵死人的键盘。</p><p><a href="/gear/">去看看 →</a></p></div>
  <div class="panel"><h3>归档</h3><p>发票、旧帖、聊天记录、配置文件。硬盘的公开部分。</p><p><a href="/archive/">去看看 →</a></p></div>
  <div class="panel"><h3>图库</h3><p>像素画和截图。有一张月亮特别大。</p><p><a href="/gallery/">去看看 →</a></p></div>
</div>

<div class="notice">
  <b>旧网环</b>：上一站 <a href="https://midnight-wave.example/" rel="nofollow">午夜电波</a> ·
  下一站 <a href="https://slowlemon.example/" rel="nofollow">慢速柠檬</a> ·
  本站是第 7 站。想加入的话去 <a href="/links/">友链页</a> 看规则。
</div>`;

  return layoutMain({
    title: '首页',
    active: '/',
    content,
    comment: '<!-- 本站没有秘密。真的。-->\n<!-- （好吧，有一个。但它不是藏在这里的。） -->',
  });
}
