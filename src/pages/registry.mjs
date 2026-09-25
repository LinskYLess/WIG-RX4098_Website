/**
 * registry.mjs — 页面注册表（构建清单）。
 * out 相对 dist；render 为异步函数返回 HTML。
 */

import { POSTS } from '../content/blog.mjs';
import * as home from './page-home.mjs';
import * as blog from './page-blog.mjs';
import * as info from './page-info.mjs';
import * as col from './page-collections.mjs';
import * as arch from './page-archive.mjs';
import * as logs from './page-logs.mjs';
import * as old from './page-old.mjs';
import * as system from './page-system.mjs';
import * as frag from './page-fragment.mjs';
import * as relight from './page-relight.mjs';

export const PAGES = [
  { out: 'index.html', render: () => home.render() },
  { out: '404.html', render: () => arch.render404() },

  // 公开层
  { out: 'about/index.html', render: () => info.renderAbout() },
  { out: 'now/index.html', render: () => info.renderNow() },
  { out: 'contact/index.html', render: () => info.renderContact() },
  { out: 'links/index.html', render: () => info.renderLinks() },
  { out: 'links/dead/index.html', render: () => info.renderDead() },
  { out: 'blog/index.html', render: () => blog.renderList() },
  ...POSTS.map((p) => ({ out: `blog/${p.slug}/index.html`, render: () => blog.renderPost(p.slug) })),
  { out: 'games/index.html', render: () => col.renderGames() },
  { out: 'gear/index.html', render: () => col.renderGear() },
  { out: 'gallery/index.html', render: () => col.renderGallery() },
  { out: 'archive/index.html', render: () => arch.renderArchive() },
  { out: 'guestbook/index.html', render: () => arch.renderGuestbook() },
  { out: 'search/index.html', render: () => arch.renderSearch() },

  // 旧网层
  { out: 'logs/index.html', render: () => logs.render() },
  { out: 'old/index.html', render: () => old.renderOldIndex() },
  { out: 'old/relight/index.html', render: () => old.renderOldRelight() },

  // 深层
  { out: 'system/index.html', render: () => system.render() },
  { out: 'fragment/index.html', render: () => frag.render() },
  { out: 'relight/index.html', render: () => relight.renderRelight() },
  { out: 'relight/end/index.html', render: () => relight.renderRelightEnd() },

  // 隐藏杂项（页面在 build 中内联生成）
  { out: 'tmp/index.html', render: () => import('./page-misc.mjs').then((m) => m.renderTmp()) },
  { out: 'dump/index.html', render: () => import('./page-misc.mjs').then((m) => m.renderDump()) },
  { out: 'backup/index.html', render: () => import('./page-misc.mjs').then((m) => m.renderBackup()) },
];
