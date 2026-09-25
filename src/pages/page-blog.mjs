/** page-blog.mjs — 日志列表与详情。 */

import { layoutMain, esc } from './layout.mjs';
import { POSTS } from '../content/blog.mjs';

export function renderList() {
  const posts = POSTS.slice().sort((a, b) => b.date.localeCompare(a.date));
  const years = [...new Set(posts.map((p) => p.date.slice(0, 4)))];
  const content = `
<h1>日志</h1>
<p class="meta">共 ${posts.length} 篇。更新随缘，怀旧准时。</p>
${years.map((y) => `
<h2>${y}</h2>
${posts.filter((p) => p.date.startsWith(y)).map((p) => `
<article class="gb-entry">
  <div class="gb-head">${p.date}${p.tags.map((t) => ` <span class="tag">${esc(t)}</span>`).join('')}</div>
  <a href="/blog/${p.slug}/"><b>${esc(p.title)}</b></a>
  <p>${esc(p.summary)}</p>
</article>`).join('')}`).join('')}
<div class="keeper-only">
  <div class="notice"><b>2026-06-22</b> · 有一封新写的信。<a href="/relight/">在这里（需要完成握手）</a></div>
</div>`;
  return layoutMain({ title: '日志', active: '/blog/', content });
}

export function renderPost(slug) {
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return null;
  const idx = POSTS.indexOf(post);
  const older = POSTS[idx + 1];
  const newer = POSTS[idx - 1];
  const content = `
<article>
  <h1>${esc(post.title)}</h1>
  <div class="meta">${post.date}${post.tags.map((t) => ` <span class="tag">${esc(t)}</span>`).join('')}</div>
  <div class="post-body">${post.body}</div>
  <hr>
  <p class="meta">
    ${newer ? `上一篇：<a href="/blog/${newer.slug}/">${esc(newer.title)}</a><br>` : ''}
    ${older ? `下一篇：<a href="/blog/${older.slug}/">${esc(older.title)}</a>` : ''}
  </p>
</article>`;
  return layoutMain({
    title: post.title,
    desc: post.summary,
    active: '/blog/',
    content,
    comment: '<!-- 这一篇的发布时间是定时的。有些话只能等到周四凌晨 -->',
  });
}
