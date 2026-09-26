/**
 * gen-assets.mjs — 二进制资产生成（构建时调用，也可独立运行）。
 * 零依赖手写编码器：
 *   - PNG（zlib deflate + tEXt 元数据块）→ gallery/moon-island.png
 *   - WAV（PCM16）→ tmp/signal-test.wav（内容：摩斯 CQ）
 *   - favicon.svg / 88x31 徽章 SVG 直接写出
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { morseToPcm, pcmToWav, textToMorse } from '../src/arg/cipher.mjs';

/* ---------------- PNG 编码器 ---------------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

function tEXt(key, value) {
  const bytes = new Uint8Array(key.length + 1 + value.length);
  for (let i = 0; i < key.length; i++) bytes[i] = key.charCodeAt(i);
  bytes[key.length] = 0;
  for (let i = 0; i < value.length; i++) bytes[key.length + 1 + i] = value.charCodeAt(i);
  return chunk('tEXt', bytes);
}

/**
 * RGB 像素数据（每像素 3 字节）→ PNG 文件字节。
 * @param {number} w @param {number} h @param {(x:number,y:number)=>[number,number,number]} px
 */
function encodePng(w, h, px) {
  const raw = new Uint8Array(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0; // filter: none
    for (let x = 0; x < w; x++) {
      const [r, g, b] = px(x, y);
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w); dv.setUint32(4, h);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: truecolor
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', new Uint8Array(0))];
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}

/* ---------------- 灯塔岛像素画 ---------------- */

/**
 * 192x108 像素夜景：渐变夜空 + 大月亮 + 云絮 + 黑岛剪影 + 断灯塔 + 海面月光带。
 * 与 gallery/moon-island.svg 同题（PNG 是"原件扫描版"，带 tEXt 坐标）。
 */
export function moonIslandPng() {
  const W = 192, H = 108;
  const rand = (seed => () => ((seed = (seed * 16807) % 2147483647) / 2147483647))(621621);
  const noise = Array.from({ length: W * H }, rand);
  const moon = { x: 138, y: 30, r: 16 };
  const islandY = (x) => {
    const c = 96 - x * 0.06;                       // 岛脊线：左高右低
    return 62 + Math.round(c * 0 + Math.sin(x / 14) * 3 + (x < 40 ? (40 - x) * 0.35 : 0));
  };
  return encodePng(W, H, (x, y) => {
    const n = noise[y * W + x] - 0.5;
    // 夜空：深蓝 → 微亮地平线
    const skyT = y / 78;
    let r = 8 + skyT * 26 + n * 4, g = 12 + skyT * 30 + n * 4, b = 26 + skyT * 40 + n * 5;
    // 星星（伪随机稀疏点）
    if (y < 58 && ((x * 31 + y * 17 + 6) % 97 === 0)) { r = 210; g = 215; b = 225; }
    const dm = Math.hypot(x - moon.x, y - moon.y);
    if (dm < moon.r) { const t = 1 - dm / moon.r; r = 235 + t * 20; g = 228 + t * 22; b = 200 + t * 30; } // 月亮
    else if (dm < moon.r + 2.2) { r += 30; g += 28; b += 22; } // 月晕
    // 海面
    if (y >= 78) {
      const wave = Math.sin(x / 6 + y / 3) * 3;
      r = 10; g = 18; b = 30;
      if (Math.abs(x - moon.x + wave) < 3 + (y - 78) * 0.35) { r = 120; g = 110; b = 78; } // 月光带
      r += n * 5; g += n * 5; b += n * 6;
    }
    // 岛剪影 + 灯塔
    if (x > 18 && x < 118 && y >= islandY(x) && y < 80) {
      let c = 6 + n * 3; return [c, c + 2, c + 6];
    }
    if (x >= 64 && x < 74 && y >= 34 && y < 62) {                   // 灯塔塔身
      const taper = Math.floor((x - 64) / 3);
      if (y >= 38 - taper) return [10, 10, 14];
    }
    if (x >= 62 && x < 76 && y >= 31 && y < 35) return [16, 16, 20]; // 顶帽
    if (x >= 66 && x < 72 && y >= 36 && y < 40) {                   // 灯室（亮）
      return [242, 163, 60];
    }
    return [Math.max(0, Math.min(255, r | 0)), Math.max(0, Math.min(255, g | 0)), Math.max(0, Math.min(255, b | 0))];
  });
}

/* ---------------- og-image 与图标 ---------------- */

/** 5x7 像素字体（og-image 用，按需收录字符）。 */
const GLYPHS = {
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  E: ['11111', '10000', '11110', '10000', '10000', '10000', '11111'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

/** 返回判定 (x,y) 是否落在文字笔画内的函数。 */
function textTest(text, tx0, ty0, sc) {
  return (x, y) => {
    let cx = tx0;
    for (const ch of text) {
      const g = GLYPHS[ch] ?? GLYPHS[' '];
      if (x >= cx && x < cx + 5 * sc && y >= ty0 && y < ty0 + 7 * sc) {
        if (g[Math.floor((y - ty0) / sc)][Math.floor((x - cx) / sc)] === '1') return true;
      }
      cx += 6 * sc;
    }
    return false;
  };
}

const clamp8 = (v) => Math.max(0, Math.min(255, v | 0));

/**
 * 1200x630 社交分享图：夜海 + 大月亮 + 灯塔光束 + 像素字 "RX4098 / EST. 2022"。
 * 色板与 main.css 同源（#0b0f14 底、#f2a33c 萤火琥珀）。
 */
export function ogImagePng() {
  const W = 1200, H = 630;
  const rand = (seed => () => ((seed = (seed * 16807) % 2147483647) / 2147483647))(621621);
  const noise = new Float64Array(W * H);
  for (let i = 0; i < noise.length; i++) noise[i] = rand();
  const horizon = 430;
  const moon = { x: 920, y: 130, r: 64 };
  const lamp = { x: 830, y: 222 };   // 灯室中心
  const title = textTest('RX4098', 84, 466, 12);
  const sub = textTest('EST. 2022', 88, 578, 5);
  // 光束：单位方向向量 + 点到射线距离
  const beams = [[-0.93, -0.37, 700, 52], [0.95, -0.31, 640, 46]]; // [dx, dy, 长度, 半宽]
  return encodePng(W, H, (x, y) => {
    const n = noise[y * W + x] - 0.5;
    let r, g, b;
    if (y < horizon) {
      const t = y / horizon;
      r = 7 + t * 24 + n * 4; g = 10 + t * 30 + n * 4; b = 20 + t * 46 + n * 5;
      // 星星：两层亮度，避开月亮
      const dm0 = Math.hypot(x - moon.x, y - moon.y);
      if (dm0 > moon.r + 8) {
        if ((x * 31 + y * 17 + 6) % 997 === 0) { r = 150; g = 158; b = 172; }
        else if ((x * 73 + y * 29 + 41) % 4993 === 0) { r = 214; g = 220; b = 232; }
      }
    } else {
      const wave = Math.sin(x / 7 + y / 3.4) * 4;
      r = 8 + n * 5; g = 16 + n * 5; b = 30 + n * 6;
      if (Math.abs(x - moon.x + wave) < 3 + (y - horizon) * 0.22) { r = 105; g = 98; b = 70; } // 月光带
    }
    // 月亮 + 月晕
    const dm = Math.hypot(x - moon.x, y - moon.y);
    if (dm < moon.r) { const t = 1 - dm / moon.r; r = 232 + t * 23; g = 226 + t * 24; b = 198 + t * 34; }
    else if (dm < moon.r + 9) { const t = (moon.r + 9 - dm) / 9; r += 26 * t; g += 24 * t; b += 18 * t; }
    // 光束（叠加发光）
    for (const [dx, dy, len, half] of beams) {
      const t = (x - lamp.x) * dx + (y - lamp.y) * dy;
      if (t > 0 && t < len) {
        const d = Math.hypot(x - (lamp.x + dx * t), y - (lamp.y + dy * t));
        if (d < half) {
          const f = (1 - d / half) * (1 - t / len) * (d < 4 ? 1 : 0.7);
          r += 120 * f; g += 78 * f; b += 26 * f;
        }
      }
    }
    // 灯室辉光
    const dl = Math.hypot(x - lamp.x, y - lamp.y);
    if (dl < 110) { const f = (1 - dl / 110) ** 2 * 0.9; r += 90 * f; g += 58 * f; b += 18 * f; }
    // 像素字（画在场景之上）
    if (title(x, y)) { r = 242; g = 163; b = 60; }
    else if (sub(x, y)) { r = 176; g = 122; b = 52; }
    // 岛与灯塔（遮挡光束）
    const onIsland = x >= 640 && x <= 1160 && y >= horizon - 22 && y < horizon;
    if (onIsland) { const c = 6 + n * 3; return [c, c + 2, c + 6]; }
    if (y >= 238 && y < horizon) {
      const w = 46 + ((y - 238) / (horizon - 238)) * 34;   // 塔身上窄下宽
      if (x >= lamp.x - w / 2 && x <= lamp.x + w / 2) {
        const c = 10 + n * 3;
        if ((y > 300 && y < 306) || (y > 362 && y < 368)) return [26, 28, 34]; // 层间平台
        return [c, c + 2, c + 5];
      }
    }
    if (y >= 210 && y < 238 && x >= lamp.x - 20 && x <= lamp.x + 20) return [242, 163, 60]; // 灯室
    if (y >= 188 && y < 210) { const hw = 30 - (y - 188) * 1.1; if (x >= lamp.x - hw && x <= lamp.x + hw) return [15, 15, 19]; } // 顶帽
    return [clamp8(r), clamp8(g), clamp8(b)];
  });
}

/** 灯塔灯室图标（无透明通道：深色圆角观感底 + 萤火琥珀灯珠）。size 取 32（favicon）或 180（apple-touch-icon）。 */
export function lampIconPng(size) {
  const c = size / 2;
  const R = size * 0.47;
  const lampY = size * 0.44;
  const lampR = size * 0.2;
  return encodePng(size, size, (x, y) => {
    const d = Math.hypot(x - c, y - c);
    if (d > R) return [0, 0, 0];
    const t = y / size;
    let r = 10 + t * 6, g = 14 + t * 7, b = 22 + t * 10;
    const dl = Math.hypot(x - c, y - lampY);
    if (dl < lampR * 2.1) { const f = (1 - dl / (lampR * 2.1)) ** 2; r += 70 * f; g += 44 * f; b += 12 * f; }
    if (dl < lampR) { const k = 1 - dl / lampR; r = 242 + k * 13; g = 163 + k * 42; b = 60 + k * 24; }
    const dw = Math.abs(y - (lampY + lampR * 1.9));
    if (dw < size * 0.035 && Math.abs(x - c) < size * 0.16) { r = 122; g = 128; b = 138; } // 底座
    return [clamp8(r), clamp8(g), clamp8(b)];
  });
}

/* ---------------- 资产写出 ---------------- */

export function writeAssets(distDir) {
  const files = [];

  // 图库 PNG（带 tEXt 元数据——右键属性可见坐标）
  const png = moonIslandPng();
  const pngPath = join(distDir, 'gallery', 'moon-island.png');
  mkdirSync(dirname(pngPath), { recursive: true });
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const withMeta = new Uint8Array(png.length + 0); // 计算带 tEXt 的完整文件
  // 重新拼装：在 IHDR 后插入 tEXt
  const ihdrEnd = sig.length + 25; // 8 sig + 4 len + 4 type + 13 data + 4 crc
  const meta = [
    tEXt('Title', 'Moon Island, off the map'),
    tEXt('Description', 'Guixu Online / server ChenZhu / spot X:621 Y:621 -- best moon in the whole world. do not forget.'),
    tEXt('Author', 'RX4098'),
  ];
  const totalLen = png.length + meta.reduce((s, m) => s + m.length, 0);
  const full = new Uint8Array(totalLen);
  full.set(png.subarray(0, ihdrEnd), 0);
  let off = ihdrEnd;
  for (const m of meta) { full.set(m, off); off += m.length; }
  full.set(png.subarray(ihdrEnd), off);
  writeFileSync(pngPath, full);
  files.push(pngPath);

  // og-image + favicon 位图回退
  const ogPath = join(distDir, 'og-image.png');
  writeFileSync(ogPath, ogImagePng());
  files.push(ogPath);
  const favPngPath = join(distDir, 'favicon.png');
  writeFileSync(favPngPath, lampIconPng(32));
  files.push(favPngPath);
  const touchPath = join(distDir, 'apple-touch-icon.png');
  writeFileSync(touchPath, lampIconPng(180));
  files.push(touchPath);

  // 灯语测试 WAV（摩斯 CQ）—— morseToPcm 默认 unit=0.14，与 audio.mjs 播放同源
  const morse = textToMorse('CQ');
  const { pcm, rate } = morseToPcm(morse);
  const wavPath = join(distDir, 'tmp', 'signal-test.wav');
  mkdirSync(dirname(wavPath), { recursive: true });
  writeFileSync(wavPath, pcmToWav(pcm, rate));
  files.push(wavPath);

  return files;
}

/* 独立运行：node scripts/gen-assets.mjs [outdir] */
if (process.argv[1] && process.argv[1].endsWith('gen-assets.mjs')) {
  const out = process.argv[2] ?? 'dist';
  const files = writeAssets(out);
  console.log(`[gen-assets] wrote ${files.length} files:`);
  for (const f of files) console.log('  -', f);
}
