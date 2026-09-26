/**
 * archive.mjs — /archive/ 仿真文件浏览器：目录树 + 查看器 + .enc 口令解密。
 */

import { get, setGate } from './state.mjs';
import { decryptEncFile, toast } from './ui.mjs';

/** @type {{path:string, mtime:string, note?:string}[]} */
const FILES = /** @type {any} */ (window).__RX_FILES__ ?? [];

function byPath() {
  const map = new Map();
  for (const f of FILES) map.set(f.path, f);
  return map;
}

function renderTree(sel) {
  const tree = document.querySelector(sel);
  if (!tree) return;
  const dirs = new Map();
  for (const f of FILES) {
    const parts = f.path.split('/');
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
    if (!dirs.has(dir)) dirs.set(dir, []);
    dirs.get(dir).push(f);
  }
  const sorted = [...dirs.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  tree.innerHTML = sorted.map(([dir, files]) => `
    <div class="arch-dir"><b>${dir ? '/' + dir : '/'}</b></div>
    ${files.map((f) => {
      const name = f.path.split('/').pop();
      const enc = f.path.endsWith('.enc');
      return `<button class="arch-file ${enc ? 'is-enc' : ''}" data-path="${f.path}"
        title="${f.mtime}${f.note ? ' · ' + f.note : ''}">${enc ? '🔒 ' : '📄 '}${name}</button>`;
    }).join('')}`).join('');
  tree.querySelectorAll('.arch-file').forEach((btn) => {
    btn.addEventListener('click', () => openFile(btn.dataset.path));
  });
}

async function openFile(path) {
  const view = document.querySelector('#arch-view');
  const meta = document.querySelector('#arch-meta');
  if (!view || !meta) return;
  const info = byPath().get(path);
  meta.textContent = `${path} · ${info?.mtime ?? ''}${info?.note ? ' · ' + info.note : ''}`;
  let text;
  try {
    const r = await fetch(`/archive/files/${path}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    text = await r.text();
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err);
    view.innerHTML = `<pre>读不出来（${why}）。文件可能已经不在了——或者它不想被读到。</pre>`;
    return;
  }

  if (path.endsWith('.enc')) {
    const saved = get().answers?.g2;
    const encWrap = `
      <div class="gate" data-gate="g2-enc">
        <div class="gate-title">🔒 加密文件</div>
        <p>这个文件上着锁。便签说：口令是「我们第一次见面那天」。</p>
        ${saved ? '<p class="t-dim">（检测到已解开的口令，正在尝试……）</p>' : `
        <form class="enc-form"><input type="text" placeholder="YYYYMMDD" aria-label="口令">
        <button class="btn primary" type="submit">解密</button></form>
        <div class="gate-error"></div>`}
        <div class="enc-result"></div>
      </div>`;
    view.innerHTML = encWrap;
    const show = (content, ok) => {
      const box = /** @type {HTMLElement} */ (view.querySelector('.enc-result'));
      box.innerHTML = `<pre>${content.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre>`;
      if (ok) toast('🔓 档案解开', path);
    };
    if (saved) {
      const plain = decryptEncFile(text, saved);
      if (plain) { show(plain, true); return; }
    }
    const form = /** @type {HTMLFormElement | null} */ (view.querySelector('.enc-form'));
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = /** @type {HTMLInputElement} */ (form.querySelector('input')).value;
      const plain = decryptEncFile(text, val);
      const err = /** @type {HTMLElement} */ (view.querySelector('.gate-error'));
      if (plain) {
        show(plain, true);
        err.textContent = '';
        setGate('g2', val.replace(/[^0-9]/g, ''));
      } else {
        err.textContent = '解不开。密钥不对。';
      }
    });
    return;
  }

  view.innerHTML = `<pre>${text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</pre>`;
}

export function initArchive() {
  if (!document.getElementById('arch-tree')) return;
  renderTree('#arch-tree');
  /** @type {HTMLElement} */ (document.querySelector('#arch-view')).innerHTML = '<p class="t-dim">← 从左侧选一个文件。README.txt 是个好起点。</p>';
}
