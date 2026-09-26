/** page-collections.mjs — 游戏 / 装备 / 图库。 */

import { layoutMain, esc } from './layout.mjs';
import { GAMES, GUIXU_CARD } from '../content/games.mjs';
import { DESKS, DEVICES, COLLECTION } from '../content/gear.mjs';
import { ITEMS } from '../content/gallery.mjs';

const stars = (n) => '★'.repeat(n) + '☆'.repeat(10 - n);

export function renderGames() {
  const content = `
<h1>游戏收藏</h1>
<p class="meta">按时长排序。时长即真爱的度量衡。</p>

<div class="panel">
  <h3>${esc(GUIXU_CARD.title)} · 纪念</h3>
  <table class="kv-table">
    <caption class="sr-only">归墟 OL 纪念卡</caption>
    <tr><th scope="row">运营商</th><td>${esc(GUIXU_CARD.company)}（已转型手游）</td></tr>
    <tr><th scope="row">服役期</th><td>${esc(GUIXU_CARD.period)} · ${esc(GUIXU_CARD.status)}</td></tr>
    <tr><th scope="row">我的角色</th><td>${esc(GUIXU_CARD.character)}</td></tr>
    <tr><th scope="row">公会</th><td>${esc(GUIXU_CARD.guild)}</td></tr>
    <tr><th scope="row">挂机点</th><td><code>${esc(GUIXU_CARD.hangout)}</code></td></tr>
    <tr><th scope="row">时长</th><td>${esc(GUIXU_CARD.playtime)}</td></tr>
    <tr><th scope="row">墓志铭</th><td><em>${esc(GUIXU_CARD.epitaph)}</em></td></tr>
  </table>
</div>

<div class="table-wrap">
<table>
  <caption class="sr-only">游戏收藏列表，按时长排序</caption>
  <tr><th scope="col">游戏</th><th scope="col">平台</th><th scope="col">时长</th><th scope="col">评分</th><th scope="col">一句话</th></tr>
  ${GAMES.map((g) => `<tr><td><b>${esc(g.title)}</b></td><td>${esc(g.platform)}</td><td>${g.hours} h</td><td class="rating-cell">${stars(g.rating)}</td><td>${esc(g.note)}</td></tr>`).join('')}
</table>
</div>
<p class="postscript">评分 10 的游戏太多了？不对，是你玩的游戏太少了。（站长留）</p>`;
  return layoutMain({ title: '游戏收藏', active: '/games/', content });
}

export function renderGear() {
  const content = `
<h1>装备库</h1>

<h2>装机单</h2>
${DESKS.map((d) => `
<div class="panel">
  <h3>${esc(d.name)} <span class="side-date">${esc(d.date)}</span></h3>
  <table class="desk-table">
    <caption class="sr-only">${esc(d.name)} 配件清单</caption>
    ${d.items.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}
  </table>
</div>`).join('')}

<h2>日常设备</h2>
<table>
  <caption class="sr-only">日常设备列表</caption>
  ${DEVICES.map((d) => `<tr><td><b>${esc(d.name)}</b></td><td>${esc(d.note)}</td></tr>`).join('')}
</table>

<h2>收藏品</h2>
<table>
  <caption class="sr-only">收藏品列表</caption>
  ${COLLECTION.map((d) => `<tr><td style="white-space:nowrap"><b>${esc(d.name)}</b></td><td>${esc(d.note)}</td></tr>`).join('')}
</table>
<p class="postscript">都说电子设备是消耗品。可是消耗品为什么会越攒越多呢</p>`;
  return layoutMain({ title: '装备库', active: '/gear/', content });
}

export function renderGallery() {
  const content = `
<h1>图库</h1>
<p class="meta">像素练习 + 场景存档。点击看大图。</p>
<div class="gallery-grid">
  ${ITEMS.map((it) => `
  <figure class="gallery-item">
    <div class="gi-media"><img src="/assets/img/${esc(it.file)}" alt="${esc(it.title)}" loading="lazy"></div>
    <figcaption><b>${esc(it.title)}</b>${esc(it.date)}<br>${esc(it.desc)}</figcaption>
  </figure>`).join('')}
</div>
<div class="keeper-only">
  <div class="notice"><b>守灯人可见</b>：图库里那些没画完的练习，以后可以接着画。灯亮着，就不算烂尾。</div>
</div>`;
  return layoutMain({ title: '图库', active: '/gallery/', content, wide: true });
}
