/**
 * logs.mjs — 日志生成（构建时按当前时间生成，保证"最近心跳 3 小时内"永远成立）。
 * 全部时间固定 UTC+8。
 */

const TZ = '+08:00';
const LIT = Date.UTC(2023, 5, 21, 13, 0, 0); // 2023-06-21 21:00 +08
const SIX_H = 6 * 3600 * 1000;

/** Date -> "2023-06-21T21:00:00+08:00" */
export function iso08(ms) {
  const d = new Date(ms + 8 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}${TZ}`;
}

/** 心跳尾部呼号片段：逐行拼出 "CQ CQ DE RX4098 K"（· 为填充）。 */
const SIG_CHUNKS = ['C', 'Q', '·', 'C', 'Q', '·', 'D', 'E', '·', 'R', 'X', '4', '0', '9', '8', '·', 'K'];

function beatLine(t) {
  const seq = Math.floor((t - LIT) / SIX_H) + 1;
  const sig = SIG_CHUNKS[(seq - 1) % SIG_CHUNKS.length];
  // waiting 字段打码：等谁，日志里永远不说破（sig 的呼号是公开的，等待对象不是）
  return `${iso08(t)} BEAT seq=${seq} light=on mode=quiet waiting=#### sig=${sig}`;
}

/**
 * beacon.log 全文。
 * 结构：头部注释 → 点灯首跳 → 关键事件（2026-06）固定保留 → 近期心跳（logrotate 窗口）。
 */
export function genBeaconLog(now = Date.now()) {
  const head = [
    '# beacon.log — 灯塔心跳日志',
    '# host: raspberry-pi-4b (阳台弱电箱) / crontab: */360min',
    '# 注意：本文件按 logrotate 规则仅保留近期条目，关键事件永久保留。',
    beatLine(LIT),
    `# ...（2023-06-21 起共 ${Math.floor((now - LIT) / SIX_H) + 1} 跳，中间条目已轮转）...`,
    '#',
    '# ---- 关键事件（永久保留） ----',
    '2026-06-21T23:12:07+08:00 SIGNAL src=guestbook signature=●●—●● msg="灯很亮。谢谢。" disposition=queued',
    '2026-06-22T09:03:11+08:00 MAIL operator notified: 1 unread → 0',
    '2026-06-22T09:41:26+08:00 OPERATOR note="看到了。手在抖。别关灯，等我写完。"',
    '2026-06-22T23:59:00+08:00 CONF window=100d terminate=2026-10-01T00:00:00+08:00',
    '#',
    '# ---- 近期条目 ----',
  ];

  const tail = [];
  const end = Math.floor(now / SIX_H) * SIX_H;
  for (let i = 39; i >= 0; i--) {
    const t = end - i * SIX_H;
    if (t <= LIT) continue;
    tail.push(beatLine(t));
    // 周四 04:00 的草稿任务：心跳 04:00 那条附加 POST 行
    const d = new Date(t + 8 * 3600 * 1000);
    if (d.getUTCHours() === 4 && d.getUTCDay() === 4) {
      tail.push(`${iso08(t)} POST draft queued #${Math.floor((t - LIT) / (7 * 86400000))} publish=false`);
    }
  }
  return [...head, ...tail].join('\n') + '\n';
}

/** server.log（nginx 风格 + 站长注释，含 502 红鲱鱼）。 */
export function genServerLog(now = Date.now()) {
  const lines = [
    '# server.log — nginx/access 摘录（含站长手记）',
    '# 家宽回源，波动属正常。别问，问就是电信师傅已经上门三次了',
    '# （2024-08-12 师傅原话："小伙子你这线路比我岁数都大"）',
  ];
  const paths = ['/', '/blog/', '/games/', '/archive/', '/guestbook/', '/robots.txt', '/sitemap.xml', '/assets/css/main.css'];
  const agents = ['Mozilla/5.0 (compatible; oldweb-bot/2.1)', 'Mozilla/5.0 (webring-crawler)', 'Mozilla/5.0 (Firefox/115.0)'];
  const ips = ['116.21.***.***', '223.104.***.***', '112.10.***.***', '157.55.***.***'];
  const day = 86400000;
  let seed = 20260926;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  for (let i = 13; i >= 0; i--) {
    const t = now - i * day;
    const d = new Date(t + 8 * 3600 * 1000);
    const p = (n) => String(n).padStart(2, '0');
    const ds = `${d.getUTCFullYear()}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())}`;
    const n = 3 + Math.floor(rnd() * 4);
    for (let j = 0; j < n; j++) {
      const hour = Math.floor(rnd() * 24);
      const path = paths[Math.floor(rnd() * paths.length)];
      const ip = ips[Math.floor(rnd() * ips.length)];
      const ua = agents[Math.floor(rnd() * agents.length)];
      const burst = i === 9 && j === 2; // 某天一次 502 尖峰
      const status = burst ? 502 : rnd() > 0.15 ? 200 : 304;
      lines.push(`${ip} - - [${ds}:${p(hour)}:${p(Math.floor(rnd() * 60))}:00 +0800] "GET ${path} HTTP/1.1" ${status} ${Math.floor(900 + rnd() * 2600)} "${ua}"`);
    }
    if (i === 9) lines.push('# ↑ 08:1x 的 502 是光猫抽风。与"异常"无关。真无关');
  }
  return lines.join('\n') + '\n';
}
