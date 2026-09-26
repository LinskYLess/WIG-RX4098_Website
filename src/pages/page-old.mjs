/** page-old.mjs — /old/ 2022 v1 站快照 + /old/relight/ 项目门（G1）。 */

import { layoutOld } from './layout.mjs';
import { gateBlock } from './arg.mjs';

const ROT13 = (s) => s.replace(/[a-zA-Z]/g, (c) => {
  const base = c <= 'Z' ? 65 : 97;
  return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
});

export function renderOldIndex() {
  const content = `
<div class="old-card">
  <h2>关于我</h2>
  <p>RX4098，中部某市人。装机八年，运维新人（那时还是），捡垃圾五年（游戏里的）。</p>
  <p>这个站是我的第一块自留地。新站在这里：<a href="/">【2022 版新站】</a>（旧站保留作纪念，不再更新）</p>
</div>
<div class="old-card">
  <h2>日志（v1 时代的）</h2>
  <p>· 2022-04-05 <a href="/blog/hello-world/">开张</a></p>
  <p>· 2022-06-21 <a href="/blog/guixu-3y/">三年前的今晚，最后一盏灯熄了</a></p>
  <p>· 2022-08-20 <a href="/blog/pc-2017/">给 2017 年的装机单打个补丁</a></p>
</div>
<div class="old-card">
  <h2>同好项目</h2>
  <p>参与中的项目：<a href="/old/relight/">RE:LIGHT 工作区</a>（成员入口，口令见内部资料）</p>
  <p class="old-sub">（其余条目施工中……）</p>
</div>
<div class="old-card">
  <h2>友情链接</h2>
  <p><a href="https://midnight-wave.example/" rel="nofollow">午夜电波</a> · <a href="https://slowlemon.example/" rel="nofollow">慢速柠檬</a> · 更多见新站</p>
</div>
<marquee style="color:#e80;font-size:12px">★ 欢迎光临 ★ 本站永久域名 rx4098.dpdns.org ★ 记得常来 ★</marquee>`;

  return layoutOld({
    title: '首页',
    content,
    comment: `\n<!-- ${ROT13('GUFR NER GUR SAME FGNEOF, WHFG N BYQ FUVAA.') /* THESE ARE THE SAME STAIRS... */} -->`,
  });
}

export function renderOldRelight() {
  const wiki = `
<h2>RE:LIGHT 复灯计划 · 工作区</h2>
<p>仅供项目成员访问的页面。看到这里的话，欢迎回来。</p>

<div class="old-wiki">
<h3>立项（2019-08-11）</h3>
<p>用"捕包计划"的流量数据 + 客户端静态资源，搭一个<strong>仅内部怀旧</strong>的归墟OL 私服。
不对公众开放，不盈利，不分发。纪律三条：不卖东西、不放群外、撑不住就说话。全文见归档 <code>relight-plan.md.enc</code>。</p>

<h3>成员</h3>
<table>
  <tr><th>ID</th><th>编号</th><th>分工</th><th>状态</th></tr>
  <tr><td><b>萤火</b></td><td>#4097</td><td>服务端 / 发起人</td><td><span style="color:#a55">离线 · 2020-10-03</span></td></tr>
  <tr><td><b>RX4098</b></td><td>#4098</td><td>抓包 / 客户端工具</td><td><span style="color:#080">在线（大概）</span></td></tr>
  <tr><td>白砂</td><td>#51xx</td><td>素材</td><td style="color:#999">已移出任务组</td></tr>
  <tr><td>Momo</td><td>#6xxx</td><td>前端</td><td style="color:#999">退隐</td></tr>
  <tr><td>root919</td><td>#7xxx</td><td>工具脚本</td><td style="color:#999">退圈（据说搞币去了）</td></tr>
</table>

<h3>里程碑</h3>
<pre>M1  登录+走路      [x] 2020-04 鸣炮
M2  打捞系统      [~] 80%（随机数与浮点各卡一处）
M3  灯塔岛（彩蛋） [ ] 月亮贴图要放大 1.5 倍——我们的私货</pre>

<h3>档案索引</h3>
<p>→ <a href="/archive/">文件归档</a>：guixu/ 目录（捕包 README、停运公告、那封争吵帖、以及三个 .enc）
<br>→ <a href="/fragment/">碎片集</a>：散落的对话与时间戳
<br>→ 灯塔运行状态：<a href="/logs/">beacon.log</a></p>
</div>`;

  const gate = gateBlock('g1', { slotId: 'relight-wiki', html: wiki });
  const content = `
<div class="old-card">
  <h2>RE:LIGHT · 成员入口</h2>
  <p>口令是老地方的坐标（X,Y）。</p>
  ${gate.html}
</div>`;

  return layoutOld({
    title: 'RE:LIGHT',
    content,
    lockedBlocks: gate.blocks,
    comment: '\n<!-- 口令不在源码里。在你们一起看过的月亮里。 -->',
  });
}
