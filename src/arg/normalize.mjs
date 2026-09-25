/**
 * normalize.mjs — 谜题答案规范化。
 * 原则：玩家只要"写对内容"，不因全角/半角、空格、标点、大小写被卡。
 */

import { morseToText } from './cipher.mjs';

/** 全角→半角、去空白、统一小写。 */
export function baseNormalize(input) {
  let s = String(input ?? '');
  s = s.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
  s = s.replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim();
  return s.toLowerCase();
}

/** 提取所有数字（用于坐标/日期/天数类答案）。 */
export function digitsOnly(input) {
  return baseNormalize(input).replace(/[^0-9]/g, '');
}

/** 若输入整体是摩斯符号则先解码为字母。 */
export function morseAware(input) {
  const s = baseNormalize(input)
    .replace(/·|●/g, '.')
    .replace(/—|–|─/g, '-');
  if (/^[.\-/\s]+$/.test(s) && /[.\-]/.test(s)) {
    const decoded = morseToText(s);
    if (decoded) return decoded;
  }
  return s;
}

/**
 * 通用入口：按门类型规范化。
 * @param {'digits'|'letters'|'raw'} kind
 */
export function normalizeAnswer(input, kind = 'raw') {
  const s = baseNormalize(input);
  if (kind === 'digits') return s.replace(/[^0-9]/g, '');
  if (kind === 'letters') return morseAware(s).replace(/[^a-z]/g, '');
  return s.replace(/[\s,，、;；.。()（）=]/g, '');
}
