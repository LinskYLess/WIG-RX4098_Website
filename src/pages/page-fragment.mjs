/** page-fragment.mjs — /fragment/ 剧情碎片集（F1–F5）。 */

import { layoutMain, esc } from './layout.mjs';
import { FRAGMENTS } from '../content/fragments.mjs';
import { FRAGMENT_KEY } from '../arg/puzzles.mjs';

export function render() {
  const content = `
<h1>碎片集</h1>
<p class="meta">时间戳、对话、邮件。按你解开的门逐片显影。</p>
<p>这些碎片之间没有顺序。它们本来就是同一段时间的散落物。</p>
${FRAGMENTS.map((f) => `
<section class="panel">
  <h3>${esc(f.title)}</h3>
  <p class="side-date" style="color:var(--ink-faint);font:11px var(--mono)">来源：${esc(f.source)}</p>
  <div class="block-slot" data-block="${f.id}"></div>
  <noscript><p>（需要浏览器交互才能显影。）</p></noscript>
</section>`).join('\n')}
<p class="postscript">第五片要等你接过灯才会显影。规则不是我定的，是 2022 年的我定的。</p>`;

  return layoutMain({
    title: '碎片',
    content,
    sidebar: '',
    lockedBlocks: FRAGMENTS.map((f) => ({
      id: f.id,
      keyId: FRAGMENT_KEY[f.id],
      html: `<div class="letter-body">${f.body}</div>`,
    })),
    comment: '<!-- 碎片 2 的最后一行，是整个站的重量所在。 -->',
  });
}
