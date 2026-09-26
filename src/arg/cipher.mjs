/**
 * cipher.mjs — ARG 加密/编码核心（Node 与 Browser 同构）。
 * 用途：答案哈希（FNV-1a，防 view-source 剧透）、档案伪加密（XOR+Base64）、摩斯电码、PCM 音频合成。
 * 这里没有任何真正的密码学——对 ARG 而言"可被硬核玩家绕过"反而是特性。
 */

/** FNV-1a 32bit，返回 8 位十六进制。仅用于答案比对，非安全用途。 */
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/* ---------- Base64（跨平台：浏览器用 atob/btoa，Node 用 Buffer） ---------- */

/** @returns {string} base64 */
export function bytesToB64(bytes) {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** @returns {Uint8Array} */
export function b64ToBytes(b64) {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b64, 'base64'));
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

/** XOR 伪加密：text xor key(循环) → base64。 */
export function xorEncrypt(text, key) {
  const tb = enc.encode(text);
  const kb = enc.encode(key);
  const out = new Uint8Array(tb.length);
  for (let i = 0; i < tb.length; i++) out[i] = tb[i] ^ kb[i % kb.length];
  return bytesToB64(out);
}

/** @returns {string} 解密文本（密钥错误时得到乱码——这就是全部"安全性"） */
export function xorDecrypt(b64, key) {
  const tb = b64ToBytes(b64);
  const kb = enc.encode(key);
  const out = new Uint8Array(tb.length);
  for (let i = 0; i < tb.length; i++) out[i] = tb[i] ^ kb[i % kb.length];
  return dec.decode(out);
}

export function b64EncodeText(text) {
  return bytesToB64(enc.encode(text));
}

export function b64DecodeText(b64) {
  return dec.decode(b64ToBytes(b64));
}

const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

/** 宽松 base64 文本解码：不是合法 base64 或解出乱码时原样返回。
 *  站内提示串（hint/彩蛋键）统一从这里走，Node/浏览器行为一致。 */
export function decodeMaybeB64(s) {
  const t = String(s).trim();
  if (!t || t.length % 4 !== 0 || !B64_RE.test(t)) return s;
  try {
    const out = dec.decode(b64ToBytes(t));
    return out.includes('\uFFFD') || /[\u0000-\u0008\u000e-\u001f]/.test(out) ? s : out;
  } catch {
    return s;
  }
}

/* ---------- 摩斯电码 ---------- */

export const MORSE_TABLE = {
  a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.',
  h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.',
  o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-',
  u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};

const MORSE_REV = Object.fromEntries(Object.entries(MORSE_TABLE).map(([k, v]) => [v, k]));

export function textToMorse(text) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word
        .split('')
        .map((ch) => MORSE_TABLE[ch] ?? '')
        .filter(Boolean)
        .join(' '),
    )
    .filter(Boolean)
    .join(' / ');
}

export function morseToText(morse) {
  return morse
    .split('/')
    .map((w) =>
      w
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((c) => MORSE_REV[c] ?? '')
        .join(''),
    )
    .filter(Boolean)
    .join(' ')
    .trim();
}

/* ---------- PCM/WAV：灯语音频（Node 写文件 / 浏览器播放共用时序） ---------- */

/**
 * 把摩斯串合成为 PCM 时序事件。（unit 默认 0.14s —— 与 audio.mjs 的播放时序同源，
 * 两处曾经漂移过默认值，现在只允许这一份实现。）
 * @returns {{events: Array<{t:number, d:number}>, duration:number}} t=开始秒 d=时长秒
 */
export function morseTimeline(morse, unit = 0.14) {
  const events = [];
  let t = 0;
  for (const ch of morse) {
    if (ch === '.') { events.push({ t, d: unit }); t += unit * 2; }
    else if (ch === '-') { events.push({ t, d: unit * 3 }); t += unit * 4; }
    else if (ch === ' ') { t += unit * 2; }
    else if (ch === '/') { t += unit * 6; }
  }
  return { events, duration: t };
}

/** 合成 44.1kHz 16bit 单声道 PCM（正弦 + 轻微包络，模拟"灯"的哔声）。 */
export function morseToPcm(morse, { unit = 0.14, freq = 620, rate = 44100 } = {}) {
  const { events, duration } = morseTimeline(morse, unit);
  const n = Math.ceil((duration + 0.3) * rate);
  const pcm = new Int16Array(n);
  for (const ev of events) {
    const s = Math.floor(ev.t * rate);
    const len = Math.floor(ev.d * rate);
    for (let i = 0; i < len && s + i < n; i++) {
      const p = i / len;
      const env = Math.min(1, p * 24, (1 - p) * 24); // 快速起落，避免爆音
      pcm[s + i] = Math.round(Math.sin((2 * Math.PI * freq * i) / rate) * 0.55 * env * 32767);
    }
  }
  return { pcm, rate };
}

/** PCM → WAV 文件字节（Node 侧写文件、浏览器侧做下载 Blob 共用）。 */
export function pcmToWav(pcm, rate) {
  const header = 44;
  const buf = new Uint8Array(header + pcm.length * 2);
  const dv = new DataView(buf.buffer);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) buf[o + i] = s.charCodeAt(i); };
  ws(0, 'RIFF');
  dv.setUint32(4, 36 + pcm.length * 2, true);
  ws(8, 'WAVE');
  ws(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);   // PCM
  dv.setUint16(22, 1, true);   // mono
  dv.setUint32(24, rate, true);
  dv.setUint32(28, rate * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  ws(36, 'data');
  dv.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) dv.setInt16(44 + i * 2, pcm[i], true);
  return buf;
}

/* ---------- 萤火灯语（自定义，非标准摩斯） ---------- */

/** ●●—●● =「在」。站内以 ssLss 表示（short/short/Long/short/short）。 */
export const FIREFLY_SIGN = 'ssLss';

/** 灯语敲击序列 → 规范串，如 ['s','s','L','s','s'] -> 'ssLss'。 */
export function tapsToSign(taps) {
  return taps.map((t) => (t === 'L' || t === 'l' ? 'L' : 's')).join('');
}

/** 灯语的可视化字符表示。 */
export function signToGlyphs(sign) {
  return sign.split('').map((c) => (c === 'L' ? '—' : '●')).join('');
}
