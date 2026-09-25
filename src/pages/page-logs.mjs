/** page-logs.mjs — /logs/ 日志浏览器（S1 主向量）。 */

import { layoutMain, esc } from './layout.mjs';
import { genBeaconLog, genServerLog } from '../content/logs.mjs';

export function render() {
  const beacon = genBeaconLog();
  const server = genServerLog();
  const content = `
<h1>日志</h1>
<p class="meta">树莓派同步过来的运行日志。看看就好，别当新闻读。</p>

<div class="win">
  <div class="win-title"><span>beacon.log — 心跳</span><span class="win-btns"><i>_</i><i>□</i><i>×</i></span></div>
  <div class="win-body"><pre style="border:none;background:transparent;padding:0">${esc(beacon)}</pre></div>
</div>

<div class="win">
  <div class="win-title"><span>server.log — 访问摘录</span><span class="win-btns"><i>_</i><i>□</i><i>×</i></span></div>
  <div class="win-body"><pre style="border:none;background:transparent;padding:0">${esc(server)}</pre></div>
</div>

<div class="notice">
  关于心跳：每 6 小时一行，从 2023-06-21 起，没断过。<a href="/blog/homelab/">这篇</a>说是运维习惯。行吧，就算是吧。
  尾部那些 <code>sig=</code> 单字符是轮换的呼号片段——写信那天手滑删了注释，现在懒得补。懂的人自然懂。
</div>

<p class="tiny" style="color:var(--ink-faint)">这个站的<a href="/old/" data-found="old">前身</a>还挂在旧目录里，皮肤是 2022 年的，懒得迁移。</p>`;

  return layoutMain({
    title: '日志',
    content,
    sidebar: '',
    comment: '<!-- 上面第一行日志的日期很特别。不是随机的。 -->',
  });
}
