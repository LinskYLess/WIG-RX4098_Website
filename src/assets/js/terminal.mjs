/**
 * terminal.mjs — 灯塔终端（FAB 悬浮按钮 / #terminal 内嵌容器共用同一实例）。
 * 命令与门判定共用 ui.attemptGate；答案不落产物。
 */

import { get, addFound, stage, exportRescue, importRescue, reset } from './state.mjs';
import { attemptGate, toast } from './ui.mjs';
import { playMorse } from './audio.mjs';
import { textToMorse } from '../../arg/cipher.mjs';

const BANNER = [
  'beacon-terminal v2.6  (c) RX4098',
  'connection: raspberry-pi-4b / 阳台弱电箱',
  '输入 help 查看命令。输入 exit 关闭。',
];

const decodeHint = (b) => { try { return decodeURIComponent(escape(atob(b))); } catch { return b; } };

const HINTS_B64 = {
  'g1': [
    '44CM6ICB5Zyw5pa544CN5piv5Lik5Liq5Lq66YO95Y676L+H5peg5pWw5qyh55qE5Zyw5pa544CC5Zu+5bqT5ZKM5ri45oiP6aG15ZCE55WZ5LqG5LiA5Y2K44CC',
    '5Zu+5bqT6YeM6YKj5byg44CK54Gv5aGU5bKb55yL5pyI5Lqu44CL77yM5pS+5aSn55yL5Y+z5LiL6KeS55qE6KSq6Imy5a2X6L+544CC',
    '5YWt55m+5LqM5Y2B5LiA77yM5YWt55m+5LqM5Y2B5LiA44CC'
  ],
  'g2': [
    '5qGj5qGI5qC555uu5b2V5pyJ5LiA5byg5rKh5LiK6ZSB55qE5L6/562+77yM5YWI6K+75a6D44CC',
    '5Y2a5a6i6YeM5pyJ5LiA56+H5q+P5bm05ZCM5LiA5aSp6YO95Lya5aSN5Y+R5oCA5pen55eF55qE5paH56ug44CC',
    '44CK5YWr5bm05YmN55qE5LuK5aSp44CL77yMMjAxNCDlubQgMTEg5pyIIDgg5pel77yM6Zuq56Wt44CC'
  ],
  'g3': [
    'YmVhY29uLmxvZyDnmoTnrKzkuIDooYzlhpnnnYDngrnnga/nmoTml6XlrZDvvJvnhoTnga3nmoTml6XlrZDlhajnq5nliLDlpITpg73mmK/jgII=',
    'MjAxOS0wNi0yMSDliLAgMjAyMy0wNi0yMe+8jOWbm+W5tOKAlOKAlOWwj+W/g+mXsOW5tOOAgg==',
    'MzY1IMOXIDQgKyAx44CC'
  ],
  'r1': [
    '5Lia5L2Z5peg57q/55S16YeM77yM5ZG85Y+r5Lu75oSP55S15Y+w55qE6YCa55So5ZG85Y+377yM5Lik5Liq5a2X5q+N44CC',
    'YmVhY29uLmxvZyDph4zmr4/ooYznu5PlsL7nmoQgc2lnPSDov57otbfmnaXor7vjgILmiJbogIUgbW9yc2UgLXBsYXkgQ1HjgII=',
    'QyBR44CC'
  ],
  'r2': [
    '6aG555uu6aG155qE5oiQ5ZGY6KGo5LiK77yM5o6S5Zyo5pyA5YmN6Z2i55qE6YKj5Liq5Lq644CC',
    '5q+UIDQwOTgg5pep5Zub56eS5rOo5YaM44CC',
    'NDA5N+OAgg=='
  ],
  'r3': [
    '6Z2i5p2/6YeM5pyJ5Liq56qX5Y+j5LiA55u05Zyo562J5Lq655WZ6KiA44CC5a6D562J5Yiw5LqG5LiA5qyh44CC',
    '5YWz5pyN5LiD5ZGo5bm06YKj5aSp77yMMjAyNiDlubTjgII=',
    'MjAyNi0wNi0yMeOAgg=='
  ],
  'g5': [
    'MjAxOSDlubTpgqPmmZrnmoTogYrlpKnorrDlvZXph4zvvIzmnInkuIDmrrXooqvlj43lpI3kvb/nlKjnmoTnga/or63jgII=',
    '55+t55+t77yM6ZW/77yM55+t55+t44CC',
    '5pWyIOKXj+KXj+KAlOKXj+KXj++8jOaIlui+k+WFpe+8muWcqOOAgg=='
  ]
};
const HINTS = Object.fromEntries(Object.entries(HINTS_B64).map(([k, arr]) => [k, arr.map(decodeHint)]));

let outEl = null;
let inputEl = null;
let winEl = null;
let mode = null;
let hsStep = 0;
let history = [];
let histPos = -1;
let resetArmed = false;

function print(text, cls = '') {
  const line = document.createElement('div');
  line.className = cls;
  line.textContent = text;
  outEl.appendChild(line);
  outEl.scrollTop = outEl.scrollHeight;
}

function printHTML(html, cls = '') {
  const line = document.createElement('div');
  line.className = cls;
  line.innerHTML = html;
  outEl.appendChild(line);
  outEl.scrollTop = outEl.scrollHeight;
}

async function fetchText(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.text();
  } catch { return null; }
}

/* ---------------- 命令 ---------------- */

const COMMANDS = {
  help() {
    printHTML([
      '<span class="t-amber">help</span>                这段话',
      '<span class="t-amber">status</span>              灯塔与你的状态',
      '<span class="t-amber">logs</span> [n]           尾读 beacon.log（默认 10 行）',
      '<span class="t-amber">cat</span> &lt;file&gt;        读站内文本文件（试试 cat /logs/beacon.log）',
      '<span class="t-amber">morse</span> &lt;text&gt;       文本 → 摩斯',
      '<span class="t-amber">morse -play</span> &lt;text&gt;  播放摩斯',
      '<span class="t-amber">unlock</span> &lt;gate&gt; &lt;answer&gt;  提交答案（g1/g2/g3/r1/r2/r3）',
      '<span class="t-amber">hint</span> &lt;gate&gt;        下一档提示',
      '<span class="t-amber">handshake</span>           握手协议（需在 /system/ 面板页）',
      '<span class="t-amber">search</span> &lt;kw&gt;         站内搜索',
      '<span class="t-amber">found</span> / <span class="t-amber">export</span> / <span class="t-amber">import</span> / <span class="t-amber">reset</span>  进度管理',
      '<span class="t-amber">clear / exit</span>        你懂的',
    ].join('<br>'));
  },

  status() {
    const s = get();
    const g = s.gates;
    print(`beacon: lit 2023-06-21 / mode=quiet / waiting=${g.g1 ? '####' : '????'}`);
    print(`gates: g1=${+!!g.g1} g2=${+!!g.g2} g3=${+!!g.g3} r1=${+!!g.r1} r2=${+!!g.r2} r3=${+!!g.r3}`);
    print(`stage: ${stage()}/6  keeper: ${s.keeper ? 'YES（谢谢你）' : 'no'}`);
  },

  async logs(n = 10) {
    const text = await fetchText('/logs/beacon.log');
    if (!text) { print('（beacon.log 拉取失败。它平时很可靠的）', 't-err'); return; }
    for (const line of text.trim().split('\n').slice(-Number(n))) print(line, line.startsWith('#') ? 't-dim' : '');
    addFound('morse');
  },

  async cat(path) {
    if (!path) { print('用法：cat <file>', 't-err'); return; }
    const text = await fetchText(path.startsWith('/') ? path : `/archive/files/${path}`);
    if (!text) { print(`cat: ${path}: 没有那个文件（或它不肯给你看）`, 't-err'); return; }
    if (path.endsWith('.enc')) { print('（内容是密文。得用口令解——去归档页试试）', 't-dim'); return; }
    for (const line of text.trim().split('\n').slice(0, 60)) print(line, line.startsWith('#') ? 't-dim' : '');
  },

  morse(...args) {
    if (args[0] === '-play') {
      const text = args.slice(1).join(' ') || 'CQ';
      const m = textToMorse(text);
      print(`${text} → ${m}`);
      const dur = playMorse(m);
      print(`（播放中，约 ${dur.toFixed(1)}s）`, 't-dim');
      addFound('morse');
      return;
    }
    const text = args.join(' ') || 'CQ';
    print(`${text} → ${textToMorse(text)}`);
  },

  unlock(gate, ...rest) {
    const answer = rest.join(' ');
    if (!gate || !answer) { print('用法：unlock <gate> <answer>', 't-err'); return; }
    const kind = { g1: 'digits', g2: 'digits', g3: 'digits', r1: 'letters', r2: 'raw', r3: 'digits', g5: 'raw' }[gate] ?? 'raw';
    if (!document.querySelector(`script[data-key-id="${gate}"]`)) {
      print(`（当前页没有 ${gate} 的验证载荷。去该门所在的页面运行）`, 't-dim');
      return;
    }
    if (attemptGate(gate, kind, answer)) print(`> ${gate} ACCEPTED`, 't-amber');
    else print('> DENIED', 't-err');
  },

  hint(gate) {
    const list = HINTS[gate];
    if (!list) { print(`没有 ${gate} 这个门`, 't-err'); return; }
    const s = get();
    const level = Math.min(list.length, (s.hintsSeen[gate] ?? 0) + 1);
    import('./state.mjs').then((m) => { for (let i = (s.hintsSeen[gate] ?? 0); i < level; i++) m.addHint(gate); });
    print(`提示 ${level}/3：${list[level - 1]}`, 't-amber');
  },

  search(...kw) {
    if (!kw.length) { print('用法：search <关键词>', 't-err'); return; }
    setTimeout(() => { location.href = `/search/?q=${encodeURIComponent(kw.join(' '))}`; }, 300);
  },

  found() {
    const s = get();
    if (!s.found.length) { print('暂时什么都没翻到。多点点状态栏和页脚。', 't-dim'); return; }
    print(s.found.join(', '));
  },

  export() {
    print('恢复码（收好。换浏览器时 import 它）：', 't-amber');
    print(exportRescue());
  },

  import(...code) {
    const c = code.join(' ');
    if (!c) { print('用法：import <恢复码>', 't-err'); return; }
    try {
      importRescue(c);
      print('进度已恢复。', 't-amber');
      setTimeout(() => location.reload(), 600);
    } catch { print('恢复码无效。', 't-err'); }
  },

  cq() {
    print('CQ CQ DE RX4098 K', 't-amber');
    playMorse(textToMorse('CQ CQ DE RX4098 K'));
    addFound('morse');
  },

  whoami() {
    const s = get();
    print(s.keeper ? 'keeper。守灯人。就是你了。' : stage() >= 4 ? 'visitor，但已经走得很深了。' : 'visitor。一个路过的访客。');
  },

  date() { print(new Date().toLocaleString('zh-CN', { hour12: false })); },

  clear() {
    outEl.innerHTML = '';
    BANNER.forEach((l) => print(l, 't-dim'));
  },

  sudo(...rest) {
    print(rest.length ? `${rest.join(' ')}：权限拒绝。这里唯一有 sudo 权限的人两年没发博了。` : 'sudo: 用法都会写还 sudo？', 't-err');
  },

  exit() { closeTerm(); },

  reset(arg) {
    if (arg !== 'confirm') {
      print('这会清空全部进度（门、碎片、守灯人状态）。');
      print('确定的话：reset confirm（8 秒内再输一次生效）');
      return;
    }
    if (resetArmed) {
      reset();
      print('已清空。灯回到 2022 年的凌晨。', 't-amber');
      setTimeout(() => { location.href = '/'; }, 900);
    } else {
      resetArmed = true;
      print('再来一次以确认。');
      setTimeout(() => { resetArmed = false; }, 8000);
    }
  },

  '621,621'() { print('……你把坐标当命令敲了？有意思。但坐标是拿来导航的，不是拿来执行的。', 't-amber'); },

  handshake() {
    const s = get();
    if (s.keeper) { print('握手早已完成。灯在你手里。'); return; }
    if (s.gates.r1 && s.gates.r2 && s.gates.r3) { print('三轮都已通过。去 /relight/ 读信。', 't-amber'); return; }
    if (!document.querySelector('script[data-key-id="r1"]')) {
      print('（本页没有握手载荷。请在 /system/ 面板页运行 handshake）', 't-err');
      return;
    }
    mode = 'handshake';
    hsStep = s.gates.r1 ? (s.gates.r2 ? 3 : 2) : 1;
    print('—— 握手协议 v1 ——', 't-amber');
    print('三轮问答。答错不扣分，重来即可。exit 中止。');
    askHandshake();
  },
};

COMMANDS['老地方'] = COMMANDS['621,621'];

function askHandshake() {
  if (hsStep === 1) {
    print('[1/3] 认真听。（正在播放灯语……）', 't-dim');
    playMorse(textToMorse('CQ'));
    print('（重听可输入 replay）', 't-dim');
    print('问：它在喊谁？');
  } else if (hsStep === 2) {
    print('[2/3] 问：我在等的那个编号是多少？');
  } else if (hsStep === 3) {
    print('[3/3] 问：最后一次收到回信，是哪天？');
  }
}

function handshakeInput(raw) {
  if (raw === 'exit') { mode = null; print('握手中止。灯不着急。', 't-dim'); return; }
  if (raw === 'replay' && hsStep === 1) { playMorse(textToMorse('CQ')); return; }
  const keyId = hsStep === 1 ? 'r1' : hsStep === 2 ? 'r2' : 'r3';
  const kind = keyId === 'r1' ? 'letters' : keyId === 'r2' ? 'raw' : 'digits';
  if (attemptGate(keyId, kind, raw)) {
    print(`> ${keyId} ACCEPTED`, 't-amber');
    hsStep++;
    if (hsStep > 3) {
      mode = null;
      print('—— 握手完成 ——', 't-amber');
      print('三道题你全答对了。/relight/ 已经亮了。去读信吧。');
      toast('🤝 握手完成', '/relight/ 已开启。');
    } else {
      askHandshake();
    }
  } else {
    print(`> DENIED（提示：hint ${keyId}）`, 't-err');
  }
}

/* ---------------- 终端 UI（单一 win 实例，可在悬浮层与面板间移动） ---------------- */

function buildWin() {
  const win = document.createElement('div');
  win.className = 'win term-win';
  win.innerHTML = `
    <div class="win-title"><span>beacon-terminal — raspberry-pi-4b</span><span class="win-btns"><i data-act="close">×</i></span></div>
    <div class="win-body">
      <div class="term-shell">
        <div class="terminal" tabindex="0"><div class="t-out"></div></div>
        <div class="terminal-input"><span class="t-prompt">rx@beacon:~$</span><input type="text" autocomplete="off" spellcheck="false" aria-label="终端输入"></div>
      </div>
    </div>`;
  outEl = win.querySelector('.t-out');
  inputEl = win.querySelector('input');
  BANNER.forEach((l) => print(l, 't-dim'));
  win.querySelector('[data-act="close"]').addEventListener('click', () => {
    if (win.parentElement?.classList.contains('term-overlay')) closeTerm();
  });
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { exec(inputEl.value); inputEl.value = ''; }
    else if (e.key === 'ArrowUp') { if (histPos > 0) inputEl.value = history[--histPos] ?? ''; e.preventDefault(); }
    else if (e.key === 'ArrowDown') { if (histPos < history.length) inputEl.value = history[++histPos] ?? ''; e.preventDefault(); }
    else if (e.key === 'Escape') closeTerm();
  });
  return win;
}

function ensureWin() {
  if (!winEl) winEl = buildWin();
  return winEl;
}

export function openTerm() {
  let overlay = document.querySelector('.term-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'term-overlay';
    document.body.appendChild(overlay);
  }
  overlay.appendChild(ensureWin());
  overlay.classList.add('open');
  inputEl?.focus();
}

export function closeTerm() {
  document.querySelector('.term-overlay')?.classList.remove('open');
}

function bindFAB() {
  if (!document.getElementById('term-fab')) {
    const fab = document.createElement('button');
    fab.id = 'term-fab';
    fab.textContent = '>_';
    fab.title = 'beacon-terminal';
    fab.setAttribute('aria-label', '打开灯塔终端');
    document.body.appendChild(fab);
  }
  document.getElementById('term-fab').addEventListener('click', () => {
    const overlay = document.querySelector('.term-overlay');
    if (overlay?.classList.contains('open')) closeTerm();
    else openTerm();
  });
}

function exec(raw) {
  const line = raw.trim();
  if (!line) return;
  print(`rx@beacon:~$ ${line}`, 't-in');
  history.push(line);
  histPos = history.length;
  if (mode === 'handshake') { handshakeInput(line); return; }
  const [cmd, ...args] = line.split(/\s+/);
  const fn = COMMANDS[cmd.toLowerCase()];
  if (!fn) { print(`beacon: ${cmd}: 没有这个命令。help 一下？`, 't-err'); return; }
  try {
    const r = fn(...args);
    if (r instanceof Promise) r.catch((/** @type {any} */ e) => print(`错误：${e.message}`, 't-err'));
  } catch (e) {
    print(`错误：${/** @type {any} */ (e).message}`, 't-err');
  }
}

export function initTerminal() {
  const s = get();
  if (stage() >= 4 || s.keeper || document.body.dataset.term === 'on') bindFAB();
  const mount = () => {
    const inline = document.getElementById('terminal');
    // 面板经 innerHTML 注入后 #terminal 才出现（rx:gate g3 之后）
    if (inline && (!winEl || winEl.parentElement !== inline)) inline.appendChild(ensureWin());
  };
  mount();
  document.addEventListener('rx:gate', (e) => { if ((/** @type {CustomEvent} */ (e)).detail?.gateId === 'g3') setTimeout(mount, 100); });
  document.addEventListener('rx:restore', () => setTimeout(mount, 300));
  document.addEventListener('rx:handshake', () => {
    if (outEl) print('—— 握手完成。/relight/ 已亮。 ——', 't-amber');
  });
}

/** 交接窗口倒计时（#countdown 存在时启动；2026-10-01 后显示窗口已过）。 */
export function initCountdown() {
  const tick = () => {
    const el = document.getElementById('countdown');
    if (!el) return;
    const note = document.getElementById('countdown-note');
    const end = Date.parse('2026-10-01T00:00:00+08:00');
    const d = end - Date.now();
    if (d <= 0) {
      el.textContent = '窗口已过 · 灯仍亮着（等待交接）';
      el.style.fontSize = '15px';
      if (note) note.textContent = '窗口关闭了，但没有完成交接。于是灯塔继续亮着——规则里忘了写这种情况怎么办。也许故意的。';
      return;
    }
    const days = Math.floor(d / 86400000);
    const h = Math.floor((d % 86400000) / 3600000);
    const m = Math.floor((d % 3600000) / 60000);
    const s = Math.floor((d % 60000) / 1000);
    const s2 = `${days} 天 ${h} 时 ${m} 分 ${s} 秒`;
    el.textContent = s2;
    setTimeout(tick, 1000);
  };
  tick();
  document.addEventListener('rx:gate', (e) => { if ((/** @type {CustomEvent} */ (e)).detail?.gateId === 'g3') setTimeout(tick, 100); });
}
