/** page-misc.mjs — /tmp/ /dump/ /backup/ 杂项页（robots/sitemap 提及的"半故意"入口）。 */

import { layoutMain, esc } from './layout.mjs';

const explorer = (title, note, files, extra = '') => `
<h1>${esc(title)}</h1>
<p class="meta">${esc(note)}</p>
<table>
  <tr><th>文件</th><th>说明</th></tr>
  ${files.map((f) => `<tr><td><a href="${f.url}"><code>${esc(f.name)}</code></a></td><td>${esc(f.desc)}</td></tr>`).join('')}
</table>
${extra}`;

export function renderTmp() {
  return layoutMain({
    title: '/tmp/',
    content: explorer('tmp', '临时目录。服务器上的 /tmp 会清空，这里的不会——因为这里的东西都还"临时"着。',
      [
        { url: '/tmp/signal-test.wav', name: 'signal-test.wav', desc: '信号测试音频（2023-06-21 21:00 生成的第一段）' },
        { url: '/tmp/sig-note.txt', name: 'sig-note.txt', desc: '给 beacon.conf 的注释草稿' },
        { url: '/tmp/draft_04.txt', name: 'draft_04.txt', desc: '草稿（未发布）' },
        { url: '/tmp/pcap-test.pcap', name: 'pcap-test.pcap', desc: '抓包练习残留' },
      ],
      '<p class="postscript">/tmp 的语义是"总有一天要清理"。总有一天。</p>'),
    sidebar: '',
  });
}

export function renderDump() {
  return layoutMain({
    title: '/dump/',
    content: explorer('dump', '数据导出暂存。游戏数据的遗物。',
      [
        { url: '/dump/scav-route-v3.txt', name: 'scav-route-v3.txt', desc: '拾荒路线图 v3（最后一次修订：2019-05）' },
        { url: '/dump/online-hours.csv', name: 'online-hours.csv', desc: '在线时长统计（月度）' },
        { url: '/dump/signatures.txt', name: 'signatures.txt', desc: '论坛签名档历史' },
      ]),
    sidebar: '',
  });
}

export function renderBackup() {
  return layoutMain({
    title: '/backup/',
    content: explorer('backup', '站点各代快照。旧版首页可以直访——它们是死页，但保存完好。',
      [
        { url: '/backup/index-v1.html', name: 'index-v1.html', desc: '2022-04 v1 首页快照（白底时代）' },
        { url: '/backup/index-v2.html', name: 'index-v2.html', desc: '2022-12 v2 首页快照（暗色起步）' },
        { url: '/backup/config.js', name: 'config.js', desc: '2023 年的前端配置（含失效 token）' },
        { url: '/backup/MANIFEST.txt', name: 'MANIFEST.txt', desc: '全量备份清单' },
      ],
      '<p class="postscript">sitemap 里有这个目录，是 2023 年生成时忘了排除。后来也没删。算是留给搜索引擎的一点温柔。</p>'),
    sidebar: '',
  });
}
