/** gallery.mjs — 图库灯箱。 */

export function initGallery() {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;
  let lb = document.querySelector('.lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<span class="lb-close" role="button" aria-label="关闭">×</span><div class="lb-media"></div><div class="lb-cap"></div>';
    document.body.appendChild(lb);
    lb.addEventListener('click', (e) => { if (e.target === lb || /** @type {HTMLElement} */ (e.target).classList.contains('lb-close')) lb.classList.remove('open'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.classList.remove('open'); });
  }
  grid.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => {
      const media = item.querySelector('.gi-media')?.innerHTML ?? '';
      const cap = item.querySelector('figcaption')?.innerHTML ?? '';
      lb.querySelector('.lb-media').innerHTML = media;
      lb.querySelector('.lb-cap').innerHTML = `${cap}<p class="tiny" style="opacity:.7;margin-top:6px">小技巧：图片可以右键"在新标签打开"，看它的属性。</p>`;
      lb.classList.add('open');
    });
  });
}
