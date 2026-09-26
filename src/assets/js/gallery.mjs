/** gallery.mjs — 图库灯箱（键盘可操作：Tab 聚焦条目，Enter/Space 打开，Esc 关闭）。 */

export function initGallery() {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;
  const lb = /** @type {HTMLElement} */ (document.querySelector('.lightbox')) ?? document.createElement('div');
  if (!lb.isConnected) {
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', '图片预览');
    lb.innerHTML = '<button class="lb-close" type="button" aria-label="关闭预览">×</button><div class="lb-media"></div><div class="lb-cap"></div>';
    document.body.appendChild(lb);
  }
  let lastFocus = /** @type {HTMLElement | null} */ (null);
  const closeLb = () => {
    lb.classList.remove('open');
    lastFocus?.focus(); // 焦点归还给触发条目
    lastFocus = null;
  };
  /** @param {HTMLElement} item */
  const openLb = (item) => {
    const media = item.querySelector('.gi-media')?.innerHTML ?? '';
    const cap = item.querySelector('figcaption')?.innerHTML ?? '';
    /** @type {HTMLElement} */ (lb.querySelector('.lb-media')).innerHTML = media;
    /** @type {HTMLElement} */ (lb.querySelector('.lb-cap')).innerHTML = `${cap}<p class="lb-tip">小技巧：图片可以右键"在新标签打开"，看它的属性。</p>`;
    lastFocus = /** @type {HTMLElement} */ (document.activeElement);
    lb.classList.add('open');
    /** @type {HTMLElement} */ (lb.querySelector('.lb-close')).focus();
  };

  lb.addEventListener('click', (e) => {
    if (e.target === lb || /** @type {HTMLElement} */ (e.target).closest('.lb-close')) closeLb();
  });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (!('key' in e)) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'Tab') {
      // 焦点圈闭：灯箱里只有关闭按钮一个可聚焦元素
      e.preventDefault();
      /** @type {HTMLElement} */ (lb.querySelector('.lb-close')).focus();
    }
  });

  grid.querySelectorAll('.gallery-item').forEach((el) => {
    const item = /** @type {HTMLElement} */ (el);
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `查看大图：${item.querySelector('figcaption b')?.textContent ?? ''}`);
    item.addEventListener('click', () => openLb(item));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(item); }
    });
  });
}
