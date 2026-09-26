/** search.mjs — 客户端全文搜索 + 彩蛋词 + daycount 计算器。 */

import { addFound, get } from './state.mjs';
import { toast } from './ui.mjs';
import { decodeMaybeB64 } from '../../arg/cipher.mjs';

const EGGS = {
  '6JCk54Gr': { t: '……这个名字，这个站不会检索。', d: '但它似乎被谁记住了。', found: 'firefly' },
  '5b2S5aKf': { t: '百川归处。', d: '相关条目归在「游戏」与「归档」里。服务器没有了，海还在。' },
  'cmVsaWdodA==': { t: 'RE:LIGHT', d: '检索到一条 2020 年的记录，权限：项目成员。入口似乎在旧站深处。', found: 'relight' },
  'NDA5Nw==': { t: '#4097', d: '比某个编号早四秒。这个站好像在等这个号码。', found: 'the-number' },
  '5Zyo': { t: '●●—●●', d: '短短，长，短短。你在哪里见过这个？', found: 'sign' },
  'Y3E=': { t: 'CQ CQ DE RX4098 K', d: '业余无线电通用呼叫。日志里喊了三年。', found: 'radio-call' },
};

/** @param {HTMLElement} box @param {string} a @param {string} b */
function daycountWidget(box, a, b) {
  const d1 = new Date(a).getTime(), d2 = new Date(b).getTime();
  if (Number.isNaN(d1) || Number.isNaN(d2)) { box.textContent = '日期格式看不懂。试试 2019-06-21 这种。'; return; }
  const days = Math.round(Math.abs(d2 - d1) / 86400000);
  // 用户输入（a/b）只经 textContent 进 DOM，不拼 innerHTML
  const b1 = document.createElement('b'); b1.textContent = a;
  const b2 = document.createElement('b'); b2.textContent = b;
  const b3 = document.createElement('b'); b3.className = 't-amber'; b3.textContent = String(days);
  const note = document.createElement('span');
  note.className = 't-dim';
  note.textContent = '（含头不含尾？含尾不含头？站长说：他数的是整段，两端都算有的年份有 366 天）';
  box.replaceChildren(b1, ' → ', b2, '，共 ', b3, ' 天。', document.createElement('br'), note);
}

export async function initSearch() {
  const box = document.getElementById('search-app');
  if (!box) return;
  const input = /** @type {HTMLInputElement} */ (box.querySelector('input'));
  const out = /** @type {HTMLElement} */ (box.querySelector('.search-out'));
  if (!input || !out) return;
  let INDEX = [];
  try { INDEX = await (await fetch('/search/index.json')).json(); } catch { /* 本地 file:// 预览时为空 */ }

  const run = () => {
    const q = input.value.trim();
    out.innerHTML = '';
    if (!q) return;
    const lq = q.toLowerCase();

    // 彩蛋层
    for (const [rawKey, egg] of Object.entries(EGGS)) {
      const k = decodeMaybeB64(rawKey);
      if (lq === k.toLowerCase()) {
        if (egg.found) addFound(egg.found);
        out.insertAdjacentHTML('afterbegin', `
          <div class="entry-card firefly"><div class="gb-head">🔍 特殊检索结果</div>
          <b>${egg.t}</b><p>${egg.d}</p></div>`);
      }
    }
    if (lq === 'daycount') {
      addFound('daycount');
      out.insertAdjacentHTML('afterbegin', `
        <div class="entry-card"><div class="gb-head">🧮 daycount · 内置工具</div>
        <div class="dc-form"><input id="dc-a" placeholder="2019-06-21" value="2019-06-21"> →
        <input id="dc-b" placeholder="2023-06-21" value="2023-06-21">
        <button class="btn" id="dc-go">算</button></div>
        <p id="dc-out" class="countdown"></p></div>`);
      const dcOut = /** @type {HTMLElement} */ (out.querySelector('#dc-out'));
      const calc = () => daycountWidget(dcOut, /** @type {HTMLInputElement} */ (out.querySelector('#dc-a')).value, /** @type {HTMLInputElement} */ (out.querySelector('#dc-b')).value);
      /** @type {HTMLElement} */ (out.querySelector('#dc-go')).addEventListener('click', calc);
      calc();
      return;
    }

    // 全文层
    const hits = INDEX.filter((doc) => {
      const hay = `${doc.title} ${doc.tags?.join(' ') ?? ''} ${doc.text}`.toLowerCase();
      return lq.split(/\s+/).every((w) => hay.includes(w));
    }).slice(0, 12);
    if (!hits.length) { out.insertAdjacentHTML('beforeend', '<p>没有找到。要么它不存在，要么它不想被找到。</p>'); return; }
    for (const h of hits) {
      out.insertAdjacentHTML('beforeend', `
        <div class="entry-card"><div class="gb-head">${h.date ?? ''}</div>
        <a href="${h.url}"><b>${h.title}</b></a>
        <p>${h.summary ?? ''}</p></div>`);
    }
  };

  box.querySelector('form')?.addEventListener('submit', (e) => { e.preventDefault(); run(); });
  input.addEventListener('input', run);

  const q = new URLSearchParams(location.search).get('q');
  if (q) { input.value = q; run(); }
}
