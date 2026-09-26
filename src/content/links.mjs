/**
 * links.mjs — 友链与收藏。
 * .example 域名为虚构域；"已消亡"链接指向站内 404（风味文案）。
 */

export const WEBRING = {
  name: '旧网环 Webring · 第 7 站',
  prev: { name: '午夜电波', url: 'https://midnight-wave.example/' },
  next: { name: '慢速柠檬', url: 'https://slowlemon.example/' },
};

export const FRIEND_LINKS = [
  { name: '深蓝的杂记', url: 'https://deepblue.example/', note: 'webring 认识的，写路由器固件' },
  { name: '老码头论坛', url: '/links/dead/', note: '已消亡（2021）。我的账号 rx2002 还躺在那块硬盘里' },
  { name: '归墟残响（同人论坛）', url: '/links/dead/', note: '已消亡（2021）。关服后只活了两年' },
];

export const BOOKMARKS = [
  { name: '旧网存档计划', url: 'https://oldweb-archive.example/', note: '同类人互捞的地方。本站也收录在里面' },
  { name: '个人主页导航 · 手工编辑版', url: 'https://handmade-dir.example/', note: '没有算法，只有站长肉眼' },
  { name: '一个还在更新的 DOS 软件站', url: 'https://dosfan.example/', note: '2003 年风格的 HTML，作者 60 岁了' },
];

export const TOOLS = [
  { name: 'RSS 阅读器（自建）', url: 'https://rx4098.dpdns.org/', note: '反算法抵抗军基地' },
  { name: 'Morse in-browser', url: 'https://morse.example/tool', note: '备用。本站终端也有 morse 命令' },
  { name: 'down for everyone', url: 'https://isfown.example/', note: '查死链用。友情提示：查本站会显示 alive' },
];
