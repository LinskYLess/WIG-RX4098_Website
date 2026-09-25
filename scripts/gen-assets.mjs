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

  // 灯语测试 WAV（摩斯 CQ）
  const morse = textToMorse('CQ');
  const { pcm, rate } = morseToPcm(morse, { unit: 0.14 });
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
