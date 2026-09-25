/**
 * boot.mjs — 每页引导：进度 chrome（灯/状态栏/404 文案/keeper 效果）+ 全局彩蛋（Konami）。
 */

import { get, addFound, stage } from './state.mjs';
import { toast, initUi } from './ui.mjs';
import { initTerminal, initCountdown } from './terminal.mjs';
import { initGallery } from './gallery.mjs';
import { initSearch } from './search.mjs';
import { initGuestbook } from './guestbook.mjs';
import { initRelight, initEnd } from './relight.mjs';
import { initArchive } from './archive.mjs';

const UPTIME_FROM = Date.UTC(2022, 3, 5); // 2022-04-05

function initStatusbar() {
  const up = document.getElementById('uptime-days');
  if (up) up.textContent = String(Math.max(0, Math.floor((Date.now() - UPTIME_FROM) / 86400000)));
  const hb = document.getElementById('last-heartbeat');
  if (hb) {
    const h = /** @type {any} */ (window).__RX__?.hbAgo ?? 3;
    const link = document.createElement('a');
    link.href = '/logs/';
    link.textContent = `${h} 小时前`;
    link.title = '心跳？什么心跳？';
    link.addEventListener('click', () => addFound('logs'));
    hb.replaceWith(link);
  }
  const vc = document.getElementById('visit-count');
  if (vc) {
    const s = get();
    s.visits = (s.visits ?? 0) + 1;
    try { localStorage.setItem('rx4098:v1', JSON.stringify(s)); } catch { /* noop */ }
    vc.textContent = String(2739 + s.visits); // 假计数器，站长手艺停留在 2010
  }
}

function initLamp() {
  const st = stage();
  document.body.dataset.argStage = String(st);
  const lamp = document.getElementById('lamp-state');
  if (lamp) {
    const labels = ['●', '●', '◔', '◕', '●', '●!', '★'];
    lamp.textContent = labels[st];
    lamp.title = st >= 4 ? '灯塔：运行中' : '';
  }
}

function init404() {
  const box = /** @type {HTMLElement} */ (document.querySelector('[data-text-variants]'));
  if (!box) return;
  let variants = [];
  try { variants = JSON.parse(box.dataset.textVariants ?? '[]'); } catch { return; }
  const st = stage();
  const idx = st >= 6 ? 3 : st >= 2 ? 2 : st >= 1 ? 1 : 0;
  box.innerHTML = variants[idx] ?? variants[0] ?? '';
}

function initKonami() {
  const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let pos = 0;
  window.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === seq[pos] ? pos + 1 : k === seq[0] ? 1 : 0;
    if (pos === seq.length) {
      pos = 0;
      addFound('konami');
      const ff = document.createElement('div');
      ff.id = 'firefly-fx';
      ff.textContent = '萤';
      document.body.appendChild(ff);
      setTimeout(() => ff.remove(), 6200);
      if (!get().keeper) toast('……？', '一点微光飞了过去。', 3200);
    }
  });
}

function initKeeper() {
  const apply = () => {
    const s = get();
    if (!s.keeper) return;
    document.body.dataset.argStage = '6';
    const lamp = document.getElementById('lamp-state');
    if (lamp) lamp.textContent = '★';
  };
  apply();
  document.addEventListener('rx:keeper', apply);
}

/** webring/robots 等发现型链接：点击即记 found。 */
function initFoundLinks() {
  document.querySelectorAll('[data-found]').forEach((a) => {
    a.addEventListener('click', () => addFound(/** @type {HTMLElement} */ (a).dataset.found));
  });
}

const start = () => {
  // 每个初始化器独立容错：单点失败不拖垮页面其余的 ARG 行为
  const inits = [initStatusbar, initLamp, init404, initKonami, initKeeper, initFoundLinks,
    initUi, initTerminal, initCountdown, initGallery, initSearch, initGuestbook, initRelight, initEnd, initArchive];
  for (const fn of inits) {
    try { fn(); } catch (e) { console.warn(`[rx4098] ${fn.name} failed:`, e); }
  }
};

// 模块执行时机因环境而异（某些内嵌浏览器在 DOMContentLoaded 之后才跑模块）：
// readyState 已过 loading 就直接启动，否则等 DOMContentLoaded。
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
