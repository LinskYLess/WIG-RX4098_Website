/**
 * ui.mjs — 门组件 / 载荷解密 / toast / 提示系统。
 *
 * 载荷协议（构建期生成）：
 *   <script type="application/arg-payload" data-block="slot-id" data-key-id="g1">B64(XOR(HTML, KEY))</script>
 * 验证方式：用玩家答案（规范化后）作为密钥解密任一 keyId 匹配的载荷，
 * 明文以 "RX4098::OK" 开头即门开——产物中不存在答案哈希，也不存在明文内容。
 * 已通过的答案存入 localStorage（玩家自己的输入），刷新后重放注入。
 */

import { xorDecrypt, b64DecodeText } from '../../arg/cipher.mjs';
import { normalizeAnswer } from '../../arg/normalize.mjs';
import { get, setGate } from './state.mjs';

const MARKER = 'RX4098::OK';

/** @param {string} title @param {string} body @param {number} [ms] */
export function toast(title, body, ms = 5200) {
  let root = document.getElementById('toast-root');
  if (!root) { root = document.createElement('div'); root.id = 'toast-root'; document.body.appendChild(root); }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = '<div class="toast-title"></div><div class="toast-body"></div>';
  el.querySelector('.toast-title').textContent = title;
  el.querySelector('.toast-body').textContent = body;
  root.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/** keyId 匹配的全部载荷脚本元素。 */
/** @param {string} keyId @returns {NodeListOf<HTMLElement>} */
function payloadEls(keyId) {
  return /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll(`script[type="application/arg-payload"][data-key-id="${keyId}"]`));
}

/** 用答案解密 keyId 匹配的全部载荷；返回以 MARKER 开头的明文列表。 */
/** @param {string} keyId @param {string} answer @returns {string[]} */
export function tryPayloads(keyId, answer) {
  const out = [];
  for (const el of payloadEls(keyId)) {
    try {
      const text = xorDecrypt(b64DecodeText(el.textContent.trim()), answer);
      if (text.startsWith(MARKER)) out.push(text.slice(MARKER.length));
    } catch { /* 密钥不对，正常失败 */ }
  }
  return out;
}

const verified = new Set();

/** @param {string} keyId */
export function gateOpen(keyId) {
  return verified.has(keyId) || !!get().gates[keyId];
}

/** 把解密内容注入对应 slot。 */
/** @param {string} keyId @param {string} answer */
function injectAll(keyId, answer) {
  for (const el of payloadEls(keyId)) {
    const slot = /** @type {HTMLElement} */ (document.querySelector(`.block-slot[data-block="${el.dataset.block}"]`));
    if (!slot || slot.classList.contains('open')) continue;
    try {
      const text = xorDecrypt(b64DecodeText(el.textContent.trim()), answer);
      if (text.startsWith(MARKER)) {
        slot.innerHTML = text.slice(MARKER.length);
        slot.classList.add('open');
      }
    } catch { /* skip */ }
  }
}

/** 用答案尝试开门。成功：注入载荷 + 持久化 + 视觉反馈。 */
/** @param {string} keyId @param {'digits'|'letters'|'raw'} kind @param {string} input */
export function attemptGate(keyId, kind, input) {
  const answer = normalizeAnswer(input, kind);
  const payloads = tryPayloads(keyId, answer);
  if (!payloads.length) return false;
  verified.add(keyId);
  injectAll(keyId, answer);
  setGate(keyId, answer);
  document.body.classList.add(`gate-${keyId}-open`);
  if (keyId === 'g3') {
    document.body.classList.add('signal-flash');
    setTimeout(() => document.body.classList.remove('signal-flash'), 900);
  }
  return true;
}

/** 页面加载时对已持久化的门重放注入（用存储的玩家答案）。 */
export function replayGates() {
  const s = get();
  for (const [id, answer] of Object.entries(s.answers ?? {})) {
    if (s.gates[id] && answer) {
      injectAll(id, answer);
      verified.add(id);
      const gate = /** @type {HTMLElement} */ (document.querySelector(`.gate[data-gate="${id}"]`));
      if (gate) { gate.classList.add('open'); const f = /** @type {HTMLElement} */ (gate.querySelector('form')); if (f) f.style.display = 'none'; }
    }
  }
  if (s.keeper) {
    document.body.classList.add('gate-g5-open');
    if (s.answers.g5) { injectAll('g5', s.answers.g5); verified.add('g5'); }
  }
}

/* ---------------- 提示系统（3 档，渐进显示；内容服务端以 base64 内嵌） ---------------- */

/** @param {string} s */
function decodeMaybeB64(s) {
  try { return decodeURIComponent(escape(atob(s))); } catch { return s; }
}

function bindHints() {
  /** @type {NodeListOf<HTMLElement>} */
  const gates = document.querySelectorAll('.gate[data-gate]');
  gates.forEach((gate) => {
    const id = gate.dataset.gate ?? '';
    const btn = gate.querySelector('.gate-hint-btn');
    const area = gate.querySelector('.gate-hint-text');
    if (!btn || !area) return;
    let hints = [];
    try { hints = JSON.parse(gate.dataset.hints ?? '[]').map(decodeMaybeB64); } catch { /* noop */ }
    let level = get().hintsSeen[id] ?? 0;
    const render = () => { area.textContent = level > 0 ? `提示 ${level}/3：${hints[level - 1] ?? ''}` : ''; };
    render();
    btn.addEventListener('click', () => {
      if (level >= hints.length) { area.textContent = '没有了。答案你已经有了，只是还没整理。'; return; }
      level = Math.min(3, level + 1);
      import('./state.mjs').then((m) => m.addHint(id));
      render();
    });
  });
}

/* ---------------- 门表单 ---------------- */

export function bindGates() {
  /** @type {NodeListOf<HTMLFormElement>} */
  const forms = document.querySelectorAll('form.gate-form[data-gate]');
  forms.forEach((form) => {
    const gate = /** @type {HTMLElement} */ (form.closest('.gate'));
    const id = form.dataset.gate ?? '';
    const kind = /** @type {'digits'|'letters'|'raw'} */ (form.dataset.kind ?? 'raw');
    const input = form.querySelector('input');
    const err = gate.querySelector('.gate-error');
    const reward = form.dataset.reward ?? '……';

    if (gateOpen(id)) {
      gate.classList.add('open');
      form.style.display = 'none';
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input?.value ?? '';
      if (!val.trim()) return;
      if (attemptGate(id, kind, val)) {
        gate.classList.add('open');
        form.style.display = 'none';
        if (err) err.textContent = '';
        toast('🔓 门开了', reward);
      } else {
        if (err) err.textContent = '解不开。不对。（失败两次后会出现提示）';
        const fails = parseInt(gate.dataset.fails ?? '0', 10) + 1;
        gate.dataset.fails = String(fails);
        if (fails >= 2) {
          const hintBtn = gate.querySelector('.gate-hint-btn');
          if (hintBtn) { /** @type {HTMLElement} */ (hintBtn).style.display = 'inline'; hintBtn.textContent = '要提示吗？'; }
        }
      }
    });
  });
}

/** 用答案解密一段 .enc 文件内容（原始 base64 文本，密钥恒为 G2 的规范化答案）。 */
/** @param {string} b64Content @param {string} answer */
export function decryptEncFile(b64Content, answer) {
  const key = normalizeAnswer(answer, 'digits');
  if (!key) return null;
  const text = xorDecrypt(b64Content.trim(), key);
  return /[\u4e00-\u9fff]/.test(text) && !text.includes('\uFFFD') ? text : null;
}

export function initUi() {
  replayGates();
  bindGates();
  bindHints();
}
