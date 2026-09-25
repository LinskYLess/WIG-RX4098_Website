/**
 * state.mjs — 玩家进度存档（localStorage，跨标签同步）。
 * 结构：{ gates, keeper, found, guestbook, visits, hintsSeen }
 */

const KEY = 'rx4098:v1';

const DEFAULT = {
  gates: { g1: false, g2: false, g3: false, r1: false, r2: false, r3: false, g5: false },
  answers: {},      // 各门玩家提交的规范化答案（重放载荷/解密档案用）
  keeper: false,
  found: [],        // 发现类成就：logs / old / robots / konami / morse / daycount ...
  guestbook: [],    // 玩家本地留言
  visits: 0,
  hintsSeen: {},    // { gateId: 已展示的提示档数 }
};

let cache = null;

/**
 * @typedef {Object} SaveState
 * @property {Object<string,boolean>} gates
 * @property {Object<string,string>} answers 各门玩家提交的规范化答案
 * @property {boolean} keeper
 * @property {string[]} found
 * @property {any[]} guestbook
 * @property {number} visits
 * @property {Object<string,number>} hintsSeen
 */

/** @returns {SaveState} */
export function get() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...structuredClone(DEFAULT), ...JSON.parse(raw) } : structuredClone(DEFAULT);
  } catch {
    cache = structuredClone(DEFAULT);
  }
  return cache;
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* 隐身模式等：进度不持久，但不崩 */ }
}

function emit(name, detail) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

export function setGate(gateId, answer = '') {
  const s = get();
  if (!s.gates[gateId]) {
    s.gates[gateId] = true;
    if (answer) s.answers[gateId] = answer;
    save();
    emit('rx:gate', { gateId });
  } else if (answer && !s.answers[gateId]) {
    s.answers[gateId] = answer;
    save();
  }
  maybeKeeper(s);
}

function maybeKeeper(s) {
  const { r1, r2, r3 } = s.gates;
  if (r1 && r2 && r3 && !s._handshakeDone) {
    s._handshakeDone = true;
    save();
    emit('rx:handshake', {});
  }
}

export function setKeeper() {
  const s = get();
  if (s.keeper) return;
  s.keeper = true;
  s.gates.g5 = true;
  save();
  emit('rx:keeper', {});
}

/** @param {string} id 发现类成就 id */
export function addFound(id) {
  const s = get();
  if (s.found.includes(id)) return false;
  s.found.push(id);
  save();
  emit('rx:found', { id });
  return true;
}

export function addHint(gateId) {
  const s = get();
  s.hintsSeen[gateId] = Math.min(3, (s.hintsSeen[gateId] ?? 0) + 1);
  save();
  return s.hintsSeen[gateId];
}

export function addGuestbookEntry(entry) {
  const s = get();
  s.guestbook.push({ date: new Date().toISOString(), ...entry });
  save();
}

/** 导出恢复码（进度 base64）。 */
export function exportRescue() {
  return btoa(unescape(encodeURIComponent(JSON.stringify(get()))));
}

/** 导入恢复码。 */
export function importRescue(code) {
  const obj = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  cache = { ...structuredClone(DEFAULT), ...obj };
  save();
  emit('rx:restore', {});
  return true;
}

export function reset() {
  cache = structuredClone(DEFAULT);
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
  emit('rx:reset', {});
}

/** 跨标签同步。 */
window.addEventListener('storage', (e) => {
  if (e.key !== KEY) return;
  cache = null;
  emit('rx:restore', {});
});

/** 当前叙事阶段（0–6），与 puzzles.mjs stageOf 对应。 */
export function stage() {
  const s = get();
  if (s.keeper) return 6;
  const g = s.gates;
  if (g.r1 && g.r2 && g.r3) return 5;
  if (g.g3) return 4;
  if (g.g2) return 3;
  if (g.g1) return 2;
  if (s.found.length > 0) return 1;
  return 0;
}
