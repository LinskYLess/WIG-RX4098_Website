/** page-system.mjs — /system/ 灯塔控制面板（G3 PIN 门 + G4 握手）。 */

import { layoutMain, esc } from './layout.mjs';
import { gateBlock } from './arg.mjs';
import { DRAFTS } from '../content/blog.mjs';
import { FRAGMENTS } from '../content/fragments.mjs';

const HONEYPOT_LINES = `[2026-06-21 23:12:07] SIGNAL src=guestbook signature=●●—●● 判定=守灯人暗号(置信 100%)
[2026-06-21 23:12:07] message="灯很亮。谢谢。"
[2026-06-21 23:12:08] disposition=queued → 通知 operator
[2026-06-22 09:03:11] MAIL operator notified: 1 unread → 0
[2026-06-22 09:41:26] OPERATOR 备注："看到了。手在抖。别关灯，等我写完。"
[2026-06-22 23:59:00] CONF window=100d terminate=2026-10-01T00:00:00+08:00`;

function panelHtml() {
  const mail = FRAGMENTS.find((f) => f.id === 'f3');
  const mailBody = mail?.body ?? '<p>（邮件归档缺失——这不该发生。）</p>';
  return `
<div class="panel-grid">
  <div class="win">
    <div class="win-title"><span>BEACON — 状态</span></div>
    <div class="win-body">
      <p>主机：raspberry-pi-4b（阳台弱电箱）<br>点灯：2023-06-21 21:00 +08<br>心跳：每 6 小时 · 未曾中断<br>等待对象：<code>####</code>（见握手记录）</p>
      <p>交接窗口倒计时：</p>
      <p class="countdown" id="countdown">—</p>
      <p class="tiny" id="countdown-note" style="color:#444">窗口关闭则灯塔转为静态纪念模式。不悲伤，两条路都写好了信。</p>
    </div>
  </div>

  <div class="win">
    <div class="win-title"><span>QUEUE — 排队的草稿</span></div>
    <div class="win-body">
      <p style="color:#444">每周四 04:00 自动生成。大部分不会发布。它们本来是写给一个人的。</p>
      ${DRAFTS.map((d) => `<p><b>${esc(d.date)}</b> · ${esc(d.title)}<br>${esc(d.body)}</p>`).join('<hr style="border:none;border-top:1px dotted #bbb">')}
    </div>
  </div>

  <div class="win">
    <div class="win-title"><span>HONEYPOT — 信号记录</span></div>
    <div class="win-body">
      <pre class="win-pre">${esc(HONEYPOT_LINES)}</pre>
    </div>
  </div>

  <div class="win">
    <div class="win-title"><span>MAIL — 2020-10-03</span></div>
    <div class="win-body letter-body" style="font-family:Georgia,'Songti SC',SimSun,serif">${mailBody}</div>
  </div>

  <div class="win win-span">
    <div class="win-title"><span>TERMINAL</span></div>
    <div class="win-body">
      <div id="terminal"></div>
      <p class="tiny" style="color:#444">第一句试试 <code>help</code>。握手协议：<code>handshake</code>。</p>
    </div>
  </div>

  <div class="win">
    <div class="win-title"><span>HELP — 你现在的位置</span></div>
    <div class="win-body">
      <p>你解开了 PIN。面板全开。剩下的门只有一个：握手协议（三轮，在终端里跑）。</p>
      <p>卡住了：<code>hint r1 / r2 / r3</code>。线索都在你走过的路上——日志、成员表、信号记录。</p>
      <p>碎片集：<a href="/fragment/">/fragment/</a>（有几片刚才已经解锁）</p>
    </div>
  </div>
</div>`;
}

export function render() {
  const gate = gateBlock('g3', { slotId: 'system-panel', html: panelHtml() });
  const content = `
<h1>/system/</h1>
<p class="meta">beacon 控制面板 · 访问受限 · 这个页面在 robots.txt 里，别假装你是搜索引擎。</p>
${gate.html}`;

  return layoutMain({
    title: '系统面板',
    content,
    sidebar: '',
    lockedBlocks: [
      ...gate.blocks,
      // G4 握手的验证金丝雀（r1/r2/r3，无内容槽——纯验证）
      { id: 'r1-mark', keyId: 'r1', marker: true },
      { id: 'r2-mark', keyId: 'r2', marker: true },
      { id: 'r3-mark', keyId: 'r3', marker: true },
    ],
    comment: '<!-- pin 不是日期本身，是两个日期之间的距离。 -->',
  });
}
