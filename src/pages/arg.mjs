/**
 * arg.mjs — 页面侧 ARG 组件：门表单 / 内容槽 / 提示数据。
 * 载荷脚本（加密）由 layout 在 </body> 前统一输出；此处只渲染结构与槽位。
 */

import { esc } from './layout.mjs';
import { b64EncodeText } from '../arg/cipher.mjs';
import { GATES, GATE_REWARDS } from '../arg/puzzles.mjs';

/**
 * 门组件：表单 + 提示按钮 + 内容槽。
 * @param {string} gateId
 * @param {{slotId?: string, html?: string}} [opts]
 * @returns {{html:string, blocks:Array}} blocks 交给 layout.lockedBlocks（marker + 内容）
 */
export function gateBlock(gateId, { slotId, html = '' } = {}) {
  const g = GATES[gateId];
  const hintsB64 = g.hints.map((h) => b64EncodeText(h));
  const id = slotId ?? `${gateId}-slot`;
  return {
    html: `
<div class="gate" data-gate="${gateId}" data-hints="${esc(JSON.stringify(hintsB64))}">
  <div class="gate-title">${esc(g.title)}</div>
  <p>${g.question}</p>
  <form class="gate-form" data-gate="${gateId}" data-kind="${g.kind}" data-reward="${esc(GATE_REWARDS[gateId] ?? '……')}">
    <input type="text" placeholder="${esc(g.placeholder)}" aria-label="${esc(g.title)}">
    <button class="btn primary" type="submit">提交</button>
    <button class="btn gate-hint-btn" type="button">要提示吗？</button>
  </form>
  <div class="gate-error" role="alert"></div>
  <p class="gate-hint"><span class="gate-hint-text"></span></p>
  <div class="block-slot" data-block="${id}"></div>
</div>`,
    blocks: [
      { id, keyId: gateId, html },        // 门后内容
      { id: `${id}-mark`, keyId: gateId, marker: true }, // 验证金丝雀
    ],
  };
}

/** 隐藏内容槽（由指定门的密钥解锁；page 负责把 {id,keyId,html} 加进 lockedBlocks）。 */
export function slot(id, keyId, html = '') {
  return { html: `<div class="block-slot" data-block="${id}"></div>`, block: { id, keyId, html } };
}
