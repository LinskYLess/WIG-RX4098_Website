/**
 * puzzles.mjs — 谜题门定义（单一事实源，构建/页面/终端/测试共用）。
 * 答案只以 FNV-1a 哈希出现；明文仅存在于 docs/arg-master-solution.md。
 * hintExplanation 用于门旁的"这是什么"说明，hints 为 3 档软提示。
 */

import { fnv1a } from './cipher.mjs';
import { normalizeAnswer } from './normalize.mjs';

/**
 * @typedef {Object} Gate
 * @property {string} id
 * @property {string} title
 * @property {string} question 题面（HTML）
 * @property {string} placeholder
 * @property {'digits'|'letters'|'raw'} kind
 * @property {string[]} hashes 规范化答案的 fnv1a 集合
 * @property {string[]} hints 3 档提示
 */

const H = (...answers) => answers.map(fnv1a);

export const GATES = {
  g1: {
    id: 'g1',
    title: '成员口令',
    question: '老地方在哪？（格式：X,Y）',
    placeholder: 'X,Y',
    kind: 'digits',
    hashes: H('621621'),
    hints: [
      '「老地方」是两个人都去过无数次的地方。图库和游戏页各留了一半。',
      '图库里那张《灯塔岛看月亮》，放大看右下角的褪色字迹。',
      '六百二十一，六百二十一。两个数字一模一样。',
    ],
  },
  g2: {
    id: 'g2',
    title: '档案口令',
    question: '我们第一次见面那天。（日期格式和文件名一样：YYYYMMDD）',
    placeholder: 'YYYYMMDD',
    kind: 'digits',
    hashes: H('20141108'),
    hints: [
      '档案根目录有一张没上锁的便签，先读它。',
      '博客里有一篇每年同一天都会复发怀旧病的文章。八年，从 2022 往回数。',
      '《八年前的今天》，2014 年 11 月 8 日，雪祭。',
    ],
  },
  g3: {
    id: 'g3',
    title: '面板 PIN',
    question: '从灯塔熄灭，到重新点亮，隔了多少天？',
    placeholder: '天数',
    kind: 'digits',
    hashes: H('1461'),
    hints: [
      'beacon.log 的第一行写着点灯的日子；熄灭的日子全站到处都是。',
      '2019-06-21 数到 2023-06-21，整整四年——小心中间有一个闰年。',
      '365 × 4 + 1。',
    ],
  },
  r1: {
    id: 'r1',
    title: '握手 · 一',
    question: '灯语在喊谁？（三个字母不到）',
    placeholder: '……',
    kind: 'letters',
    hashes: H('cq'),
    hints: [
      '业余无线电里，呼叫任意电台的通用呼号，两个字母。',
      '把 beacon.log 里每行结尾的 sig= 片段连起来读。或者用终端的 morse 命令。',
      'C Q。',
    ],
  },
  r2: {
    id: 'r2',
    title: '握手 · 二',
    question: '我在等的那个编号是多少？',
    placeholder: '####',
    kind: 'raw',
    hashes: H('4097', '萤火', 'firefly', '4097萤火'),
    hints: [
      '项目页的成员表上，排在最前面的那个人。',
      '比 4098 早四秒注册。聊天记录里也提过。',
      '4097。',
    ],
  },
  r3: {
    id: 'r3',
    title: '握手 · 三',
    question: '最后一次收到回信，是哪天？',
    placeholder: 'YYYYMMDD',
    kind: 'digits',
    hashes: H('20260621', '2026621'),
    hints: [
      '面板里有个窗口一直在等人留言。它等到了一次。',
      '关服七周年那天，2026 年。',
      '2026-06-21。',
    ],
  },
  g5: {
    id: 'g5',
    title: '回应',
    question: '现在，轮到你回应。（敲出那个信号，或直接说出它的意思）',
    placeholder: '……',
    kind: 'raw',
    hashes: H('在', 'sslss', '..-..'),
    hints: [
      '2019 年那晚的聊天记录里，有一段被反复使用的灯语。',
      '短短，长，短短。萤火的签名。',
      '敲 ●●—●●，或者输入一个字：在。',
    ],
  },
};

/** 门判定：规范化 → 哈希 → 比对。 */
export function checkGate(gateId, input) {
  const g = GATES[gateId];
  if (!g) return false;
  return g.hashes.includes(fnv1a(normalizeAnswer(input, g.kind)));
}

/* ---------- 加密档案（.enc 文件）清单：文件名 → 密钥派生规则 ---------- */
/** 密钥即 G2 答案（canonical 形式），构建时用于 XOR。 */
export const ENC_KEY = '20141108';
export const ENC_FILES = ['chat-2019-06-21.txt.enc', 'beacon.conf.v2.enc', 'relight-plan.md.enc'];

/** 门 → 解锁后的叙事提示（toast 文案）。 */
export const GATE_REWARDS = {
  g1: '项目页解锁了。里面有一个你还不认识的人。',
  g2: '口令正确。档案解开了——那是关服前最后的二十四小时。',
  g3: 'PIN 正确。欢迎来到灯塔的控制室。',
  r1: '对。它一直在喊：CQ，CQ，这里是 RX4098。',
  r2: '对。4097。',
  r3: '对。七周年那天，灯等到了回应。',
  g5: '灯常亮了。从现在起，由你守灯。',
};

/**
 * CANARY：各门的规范答案（仅构建期使用：加密载荷/金丝雀校验）。
 * 产物中不存在明文——验证靠"用答案解密出 MARKER"，哈希都不需要。
 * 本表视为与 docs/arg-master-solution.md 同级的机密。
 */
export const CANARY = {
  g1: '621621',
  g2: '20141108',
  g3: '1461',
  r1: 'cq',
  r2: '4097',
  r3: '20260621',
  g5: 'sslss',
  g5alt: '在', // g5 的文本等价答案
};

/** 解锁成功的魔法标记（载荷解密后以此开头）。 */
export const MARKER = 'RX4098::OK';

/** 碎片解锁条件 → keyId 映射。 */
export const FRAGMENT_KEY = { f1: 'g1', f2: 'g2', f3: 'g3', f4: 'r3', f5: 'g5' };

/** 阶段推进（用于 chrome 灯图标亮度与 404 文案分层）。 */
export function stageOf(state) {
  if (!state) return 0;
  if (state.keeper) return 6;
  const { g1, g2, g3, r1, r2, r3 } = state.gates ?? {};
  if (r1 && r2 && r3) return 5;
  if (g3) return 4;
  if (g2) return 3;
  if (g1) return 2;
  if ((state.found ?? []).length > 0) return 1;
  return 0;
}
