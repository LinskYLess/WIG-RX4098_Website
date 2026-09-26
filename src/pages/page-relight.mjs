/** page-relight.mjs — /relight/ 终局三封信 + 灯语回应；/relight/end/ 守灯人终局页。 */

import { layoutMain, esc } from './layout.mjs';
import { LETTERS } from '../content/fragments.mjs';

export function renderRelight() {
  const content = `
<h1>RE:LIGHT</h1>
<p class="meta">三封信。第一封来自等的人，第二封来自等的人留下的机，第三封是给你的。</p>

<div class="notice">三封信在你通过握手的那一刻就已解锁。如果这里还是空的，说明进度没带上——去 <a href="/system/">面板</a> 完成握手。</div>

<div class="panel letter-body">
  <h2>第一封</h2>
  <div class="block-slot" data-block="letter-firefly"></div>
</div>

<div class="panel letter-body">
  <h2>第二封</h2>
  <div class="block-slot" data-block="letter-rx"></div>
</div>

<div class="panel letter-body">
  <h2>第三封</h2>
  <div class="block-slot" data-block="letter-handover"></div>
</div>

<hr>
<div id="tapper"></div>`;

  return layoutMain({
    title: '终局',
    content,
    sidebar: '',
    lockedBlocks: [
      { id: 'letter-firefly', keyId: 'r3', html: `<h2>${esc(LETTERS.fromFirefly.title)}</h2><pre class="letter-pre">${LETTERS.fromFirefly.body.replace(/<\/?pre[^>]*>/g, '').trim()}</pre>` },
      { id: 'letter-rx', keyId: 'r3', html: `<h2>${esc(LETTERS.fromRx.title)}</h2>${LETTERS.fromRx.body}` },
      { id: 'letter-handover', keyId: 'r3', html: `<h2>${esc(LETTERS.handover.title)}</h2>${LETTERS.handover.body}` },
      // G5 双金丝雀：敲击路径解 sslss；文本"在"解 alt
      { id: 'g5-mark', keyId: 'g5', marker: true },
      { id: 'g5-mark-alt', keyId: 'g5', keyAlt: true, marker: true },
    ],
    comment: '<!-- 你现在读到的一切，2026-06-22 23:59 就写完了。 -->',
  });
}

export function renderRelightEnd() {
  const content = `
<script>try{var s=JSON.parse(localStorage.getItem('rx4098:v1')||'{}');if(!s.keeper)location.href='/relight/';}catch(e){}</script>
<div class="block-slot" data-block="end-content"></div>`;

  const endHtml = `
<div class="center-page">
  <div class="big t-amber">●●—●●</div>
  <h1>故事完</h1>
  <p class="postscript">—— 但灯还亮着 ——</p>
</div>

<h2>你刚刚走过的路</h2>
<ul>
  <li><strong>异常</strong>：状态栏的心跳、robots.txt 的欲盖弥彰、日志里轮换的呼号碎片</li>
  <li><strong>入口</strong>：旧站深处，一座用坐标上锁的工作区——621, 621</li>
  <li><strong>钥匙</strong>：一场雪祭的开始——20141108</li>
  <li><strong>门</strong>：从熄灭到点灯的天数——1461（闰年没骗你）</li>
  <li><strong>握手</strong>：CQ · 4097 · 2026-06-21（它喊了三年，等到过一次回应）</li>
  <li><strong>回应</strong>：短短长短短。在。</li>
</ul>

<h2>守灯人须知</h2>
<ul>
  <li>你接下的是仪式，不是责任。这个站的浪漫全靠你自己。</li>
  <li>进度存在你的浏览器里，随时可以走（终端 <code>reset</code>）。灯不会怪你。</li>
  <li>恢复码：<button class="btn primary" id="rescue-btn">导出</button><br><textarea id="rescue-out" class="rescue-out" rows="3" readonly placeholder="点导出后，这里会出现一串可以带走的进度"></textarea></li>
  <li>彩蛋：试试老式的 ↑↑↓↓←→←→BA。以及终端里没有列出来的命令。</li>
</ul>

<h2>致谢</h2>
<p>谢谢你，真的。一个陌生人为一个陌生人的六年花了几个小时——这件事本身就是灯存在的意义。</p>
<p>去玩你想玩的游戏。去给很久没联系的人发条消息。</p>
<p class="sign">—— RX4098，以及 ●●—●●</p>
<p><button class="btn" id="end-cq">播放最后一次呼叫</button></p>`;

  return layoutMain({
    title: '守灯人',
    content,
    sidebar: '',
    lockedBlocks: [{ id: 'end-content', keyId: 'g5', html: endHtml }],
    comment: '<!-- 终局页的访客计数器没有假。 -->',
  });
}
