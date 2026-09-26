/** guestbook.mjs — 本地留言 + 蜜罐彩蛋。 */

import { get, addGuestbookEntry, addFound } from './state.mjs';
import { toast } from './ui.mjs';

export function initGuestbook() {
  const form = document.getElementById('gb-form');
  const list = document.getElementById('gb-list');
  if (!form || !list) return;
  const renderMine = () => {
    for (const el of list.querySelectorAll('[data-local]')) el.remove();
    const mine = get().guestbook ?? [];
    for (const e of mine.slice().reverse()) {
      const d = new Date(e.date);
      const el = document.createElement('div');
      el.className = 'gb-entry';
      el.dataset.local = '1';
      el.innerHTML = `<div class="gb-head"><b></b> · ${d.toLocaleDateString('zh-CN')} · 仅本机可见</div><div class="gb-text"></div>`;
      /** @type {HTMLElement} */ (el.querySelector('b')).textContent = e.name || '路人';
      /** @type {HTMLElement} */ (el.querySelector('.gb-text')).textContent = e.text;
      list.prepend(el);
    }
  };
  renderMine();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = /** @type {HTMLInputElement} */ (form.querySelector('[name=name]')).value.trim();
    const text = /** @type {HTMLTextAreaElement} */ (form.querySelector('[name=text]')).value.trim();
    if (!text) return;
    addGuestbookEntry({ name, text });
    /** @type {HTMLTextAreaElement} */ (form.querySelector('[name=text]')).value = '';
    renderMine();
    // 蜜罐彩蛋：识别灯语
    if (text.includes('●●—●●') || /^在$/.test(text)) {
      toast('…？', '留言板沉默了一秒，好像有什么被记录了下来。', 6000);
      addFound('sign-post');
    }
  });
}
