/**
 * test.mjs — 自动化测试（构建产物与 ARG 逻辑）。
 * 前置：先跑 node scripts/build.mjs（npm test 已串好）。
 * 覆盖：门判定与变体 / 载荷加密一致性 / 金丝雀防剧透 / 时间戳一致性 / 产物完整性 / 编码往返。
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fnv1a, xorEncrypt, xorDecrypt, b64DecodeText, textToMorse, morseToText, morseToPcm, pcmToWav } from '../src/arg/cipher.mjs';
import { normalizeAnswer } from '../src/arg/normalize.mjs';
import { GATES, CANARY, MARKER, checkGate, stageOf } from '../src/arg/puzzles.mjs';
import { FILES } from '../src/content/archive.mjs';
import { POSTS, DRAFTS } from '../src/content/blog.mjs';
import { genBeaconLog, iso08 } from '../src/content/logs.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');

let pass = 0;
let fail = 0;
const failures = [];

/** @param {string} name @param {boolean} ok @param {string} [detail] */
function t(name, ok, detail = '') {
  if (ok) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; failures.push(name); console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
}

console.log('\n== 1. 编码原语往返 ==');
t('fnv1a 稳定', fnv1a('621621') === 'c350e4a3');
t('xor 往返', xorDecrypt(xorEncrypt('守灯人 beacon ●●—●●', 'k1'), 'k1') === '守灯人 beacon ●●—●●');
t('morse 往返', morseToText(textToMorse('CQ DE RX4098')) === 'cq de rx4098');
const pcm = morseToPcm(textToMorse('CQ'));
const wav = pcmToWav(pcm.pcm, pcm.rate);
t('wav 头', Buffer.from(wav.slice(0, 4)).toString() === 'RIFF' && Buffer.from(wav.slice(8, 12)).toString() === 'WAVE');
t('wav 非空音频', pcm.pcm.some((v) => v !== 0));

console.log('\n== 2. 规范化与门判定（正解/变体/错解） ==');
const CASES = {
  g1: { kind: 'digits', yes: ['621,621', '621，621', '(621, 621)', 'X=621 Y=621', '621621'], no: ['4097', '灯塔', '621,622'] },
  g2: { kind: 'digits', yes: ['20141108', '2014-11-08', '2014.11.08', '2014/11/08'], no: ['20190621', '20141107', '20220621'] },
  g3: { kind: 'digits', yes: ['1461', ' 1461 '], no: ['1460', '365', '4年'] },
  r1: { kind: 'letters', yes: ['CQ', 'cq', 'C.Q', '-.-. --.-'], no: ['SOS', 'K', 'DE', '.-.'] },
  r2: { kind: 'raw', yes: ['4097', '萤火', 'firefly', '4097 萤火'], no: ['4098', '白砂', 'Momo'] },
  r3: { kind: 'digits', yes: ['20260621', '2026-06-21', '2026.6.21'], no: ['20201003', '20190621', '20260622'] },
  g5: { kind: 'raw', yes: ['在', 'ssLss', 'sslss'], no: ['不在', 'sos'] },
};
for (const [gate, { kind, yes, no }] of Object.entries(CASES)) {
  for (const a of yes) t(`${gate} 接受 "${a}"`, normalizeAnswer(a, /** @type {'digits'|'letters'|'raw'} */ (kind)) && checkGate(gate, a));
  for (const a of no) t(`${gate} 拒绝 "${a}"`, !checkGate(gate, a));
}
t('stageOf 全锁 = 0', stageOf({ gates: {}, found: [] }) === 0);
t('stageOf keeper = 6', stageOf({ keeper: true }) === 6);
t('stageOf r123 = 5', stageOf({ gates: { r1: 1, r2: 1, r3: 1 } }) === 5);

console.log('\n== 3. 载荷一致性（页面内 CANARY 加密 → 玩家答案解出 MARKER） ==');
for (const gate of Object.keys(GATES)) {
  const key = CANARY[gate];
  const cipher = xorEncrypt(MARKER, key);
  t(`${gate} 正解 → MARKER`, xorDecrypt(cipher, key) === MARKER);
}
// 变体答案解不出（g5 的"在"由 CANARY.g5alt 承载，但 g5 载荷只认 sslss —— 测试确认"在"解不开）
t('g5 载荷不认"在"（由双 marker 承载）', xorDecrypt(xorEncrypt(MARKER, CANARY.g5), CANARY.g5alt) !== MARKER);

const allHtml = walkHtml(DIST);
// 构建产物中的全部载荷：正确密钥必须解出 MARKER 前缀（内容注入的前提）
{
  let payloadTotal = 0;
  let payloadBad = [];
  for (const f of allHtml) {
    const html = readFileSync(f, 'utf8');
    for (const m of html.matchAll(/data-block="([^"]+)" data-key-id="([^"]+)">([A-Za-z0-9+/=]+)</g)) {
      const [, , keyId, payload] = m;
      payloadTotal++;
      const keys = [CANARY[keyId], CANARY[`${keyId}alt`]].filter(Boolean);
      const ok = keys.some((k) => xorDecrypt(b64DecodeText(payload), k).startsWith(MARKER));
      if (!ok) payloadBad.push(`${f.replace(DIST, '')}#${keyId}`);
    }
  }
  t(`产物载荷全部可解出 MARKER（共 ${payloadTotal} 个）`, payloadBad.length === 0 && payloadTotal > 0, payloadBad.join(', '));
}

console.log('\n== 4. 金丝雀防剧透 ==');
const CANARIES = ['复灯计划 · 立项书', '致完成握手的你', 'beacon.conf v2 ——', '好友频道记录', '晚安 弟弟', '把灯交给需要它的人', CANARY.g2, CANARY.g3];
/** @param {string} dir @returns {string[]} */
function walkHtml(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkHtml(p, acc);
    else if (name.endsWith('.html')) acc.push(p);
  }
  return acc;
}
let leak = 0;
for (const f of allHtml) {
  const html = readFileSync(f, 'utf8');
  for (const c of CANARIES) if (html.includes(c)) { leak++; console.error(`  泄漏: ${f.replace(DIST, '')} ← "${c.slice(0, 12)}…"`); }
}
t('HTML 无敏感明文', leak === 0);
// 答案明文不得出现在任何客户端 JS
let jsLeak = 0;
for (const jsName of readdirSync(join(DIST, 'assets', 'js'), { recursive: true }).map(String)) {
  if (!/** @type {string} */ (jsName).endsWith('.mjs')) continue;
  const code = readFileSync(join(DIST, 'assets', 'js', /** @type {string} */ (jsName)), 'utf8');
  for (const v of Object.values(CANARY)) if (new RegExp(`['"\`]${v}['"\`]`).test(code)) jsLeak++;
}
t('客户端 JS 无答案明文', jsLeak === 0);

console.log('\n== 5. 档案加密文件可用正解解开 ==');
const chatEnc = readFileSync(join(DIST, 'archive', 'files', 'guixu', 'chat-2019-06-21.txt.enc'), 'utf8');
const chatPlain = xorDecrypt(chatEnc, CANARY.g2);
t('聊天记录可解', chatPlain.includes('●●—●●') && chatPlain.includes('老地方'));
const confEnc = readFileSync(join(DIST, 'archive', 'files', 'site', 'beacon.conf.v2.enc'), 'utf8');
const confPlain = xorDecrypt(confEnc, CANARY.g2);
t('beacon.conf v2 可解且含 PIN 规则', confPlain.includes('/system/') && confPlain.includes('1461') === false && confPlain.includes('隔了几天'));
const planEnc = readFileSync(join(DIST, 'archive', 'files', 'guixu', 'relight-plan.md.enc'), 'utf8');
t('relight-plan 可解', xorDecrypt(planEnc, CANARY.g2).includes('RE:LIGHT'));
// 错误解应得到不可读内容（不含叙事载荷）
t('错误口令不可读', !xorDecrypt(chatEnc, '99999999').includes('●●—●●'));

console.log('\n== 6. 时间戳一致性 ==');
const beaconLog = genBeaconLog();
const lines = beaconLog.trim().split('\n');
t('beacon 首跳 = 2023-06-21T21:00 点灯', (lines.find((l) => l.includes('BEAT')) ?? '').startsWith('2023-06-21T21:00:00+08:00'));
const lastBeat = /** @type {string} */ (lines.filter((l) => l.includes('BEAT')).at(-1));
const now = Date.now();
const lastT = Date.parse(lastBeat.replace(/^(\S+) .*/, '$1'));
t('末跳在 6h 窗口内（最近心跳 ≤ 6h 前）', lastT <= now && now - lastT <= 6 * 3600e3, `${lastBeat}`);
t('首跳 seq=1', /seq=1 /.test(lines.find((l) => l.includes('BEAT')) ?? ''));
const days = Math.round((Date.parse('2023-06-21T21:00:00+08:00') - Date.parse('2019-06-21T23:59:00+08:00')) / 864e5);
t('G3 数值 1461（关服→点灯）', days === 1461, String(days));
t('meet→now 一致：G2 = 2014-11-08 在博文明文', /** @type {{body:string}} */ (POSTS.find((p) => p.slug === 'eight-years')).body.includes('2014 年 11 月 8 日'));
t('蜜罐记录 = 2026-06-21', beaconLog.includes('2026-06-21T23:12:07+08:00 SIGNAL'));
t('conf/终止 = 2026-10-01', beaconLog.includes('terminate=2026-10-01T00:00:00+08:00'));
t('草稿系列含 2026-06-25（回信后）', /** @type {{date:string}} */ (DRAFTS.at(-1)).date === '2026-06-25');

console.log('\n== 7. 产物完整性 ==');
t('36 个入口页', allHtml.filter((f) => f.split(/[\\/]/).pop() === 'index.html').length === 36,
  String(allHtml.filter((f) => f.split(/[\\/]/).pop() === 'index.html').length));
t('robots.txt', readFileSync(join(DIST, 'robots.txt'), 'utf8').includes('Disallow: /system/'));
const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
t('sitemap 含 /backup/ 与 /license/，不含 /system/', sitemap.includes('/backup/') && sitemap.includes('/license/') && !sitemap.includes('/system/'));
t('sitemap 为绝对地址（含部署域名）', sitemap.includes('https://rx4098.dpdns.org/') && !sitemap.includes('<loc>/'));
t('产物无 rx4098.example 残留', !walkHtml(DIST).some((f) => readFileSync(f, 'utf8').includes('rx4098.example')));
const idx = JSON.parse(readFileSync(join(DIST, 'search', 'index.json'), 'utf8'));
t('搜索索引非空', idx.length >= 25, String(idx.length));
t('PNG 带 tEXt 坐标', readFileSync(join(DIST, 'gallery', 'moon-island.png')).includes(Buffer.from('X:621 Y:621')));
t('WAV 生成', existsSync(join(DIST, 'tmp', 'signal-test.wav')));
t('pcap 红鲱鱼', readFileSync(join(DIST, 'tmp', 'pcap-test.pcap')).slice(0, 4).readUInt32LE(0) === 0xa1b2c3d4);
t('humans.txt', existsSync(join(DIST, '.well-known', 'humans.txt')));
for (const p of ['old/index.html', 'system/index.html', 'fragment/index.html', 'relight/index.html', 'relight/end/index.html', 'license/index.html', '404.html']) {
  t(`存在 ${p}`, existsSync(join(DIST, p)));
}
// 所有页面引用的模块脚本均存在
let scriptMiss = 0;
for (const f of allHtml) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/src="(\/assets\/js\/[^"]+)"/g)) {
    if (!existsSync(join(DIST, m[1]))) scriptMiss++;
  }
}
t('客户端模块引用完整', scriptMiss === 0, String(scriptMiss));
// 终端命令分发必须展开参数（历史 bug：fn(args) 让 unlock/hint/reset 拿不到参数）
const termCode = readFileSync(join(DIST, 'assets', 'js', 'terminal.mjs'), 'utf8');
t('终端命令分发带参数展开（unlock/hint 可用）', termCode.includes('fn(...args)') && !/\bfn\(args\)/.test(termCode));

console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
if (fail) {
  console.error('失败项:', failures.join(' | '));
  process.exit(1);
}
