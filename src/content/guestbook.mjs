/**
 * guestbook.mjs — 留言板种子数据。
 * fireflyEntry：keeper 状态后才显示（Story 收束）。
 */

export const SEED_ENTRIES = [
  {
    date: '2022-04-06', author: '深蓝', site: 'https://deepblue.example/',
    text: '从 webring 溜过来的。这站风格好复古，灯会呼吸，收藏了',
    reply: '欢迎。灯是我自己画的 SVG，呼吸是 CSS，都是假的（笑）',
  },
  {
    date: '2022-05-01', author: '过路的沉舟人', site: '',
    text: '站长，归墟那篇看哭了。我也是沉舟服的，ID 8xxx 段，说不定当年在同个地图卡过雪堆',
    reply: '沉舟服的都是缘分。那篇其实写得克制了，细节都在硬盘里',
  },
  {
    date: '2022-08-14', author: '加班狗', site: '',
    text: '求内网穿透教程！！',
    reply: '已经写了，见 2023-02 那篇（你应该等不了一年吧，对不起）',
  },
  {
    date: '2023-01-08', author: 'Momo', site: '',
    text: '好久不见。我也很久没打开那些工程了。你还好吗',
    reply: '还好。你呢',
  },
  {
    date: '2023-04-01', author: '潜水员', site: '',
    text: '站长的 robots.txt 是不是写错了 lol',
    reply: '没写错。愚人节快乐',
  },
  {
    date: '2023-06-24', author: '路人甲', site: '',
    text: '日志里那个"心跳"是什么，好酷',
    reply: '就是心跳',
  },
  {
    date: '2023-11-11', author: 'fgh89012', site: '',
    text: '【广告已屏蔽】出U收U汇率优势加薇……',
    reply: '（该留言已被站长删除）',
    deleted: true,
  },
  {
    date: '2024-02-14', author: '单身汪', site: '',
    text: '情人节站长发篇硬件教程，是单身到什么程度（没有恶意）',
    reply: '下一个问题',
  },
  {
    date: '2024-09-30', author: '学妹', site: '',
    text: '学长你的站还要更吗？毕业快乐！',
    reply: '更。忙完这阵',
  },
  {
    date: '2025-06-21', author: '沉舟旧友·阿岩', site: '',
    text: '又到 621 了。群里发了蜡烛表情。我把你那个纪念文转群里了，好几个人说记得你，说守灯人公会俩人特能捡',
    reply: '',
  },
];

/** keeper 后浮现（2026-06-21 蜜罐捕获的同款内容）。 */
export const FIREFLY_ENTRY = {
  date: '2026-06-21', author: '●●—●●', site: '',
  text: '灯很亮。谢谢。——●●—●●',
  reply: '',
};
