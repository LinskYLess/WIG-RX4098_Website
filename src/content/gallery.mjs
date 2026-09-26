/**
 * gallery.mjs — 图库。SVG 资产在 src/assets/img/，构建时复制到 dist/assets/img/。
 * moon-island 额外生成带 tEXt 元数据的真实 PNG 副本（右键属性可见）。
 */

export const ITEMS = [
  {
    id: 'moon-island',
    file: 'moon-island.svg',
    // png 字段不参与页面渲染——对应 gen-assets.mjs 生成的 /gallery/moon-island.png
    // （带 tEXt 隐藏坐标，ARG 可直访资产）。别当死代码删。
    png: 'moon-island.png',
    title: '灯塔岛看月亮',
    date: '2019-06-21',
    desc: '关服前最后一张" screenshots"。月亮贴图在岛上看是全服最大的。右下角有当时的手写备注',
    clue: 'G1 线索 A：右下角褪色坐标 621,621',
  },
  {
    id: 'clocktower',
    file: 'clocktower.svg',
    title: '归墟城 · 时钟塔广场',
    date: '2019-06-21',
    desc: '最后一天全服都在这。名字密密麻麻，NPC 卡成幻灯片',
  },
  {
    id: 'crt-desk',
    file: 'crt-desk.svg',
    title: '深夜工位',
    date: '2023',
    desc: '画的是我出租屋。显示器不是 CRT，但我给它调了层 CRT 滤镜，心理上的',
  },
  {
    id: 'rpi',
    file: 'rpi.svg',
    title: '树莓派和它的朋友们',
    date: '2023-02',
    desc: '阳台弱电箱实景写生。左边散热片是我 3D 打的，打歪了',
  },
  {
    id: 'keyboard',
    file: 'keyboard.svg',
    title: 'AT101W',
    date: '2022',
    desc: 'Alps 轴。打字声像在敲算盘，办公室不让带，家里随便敲',
  },
  {
    id: 'discs',
    file: 'discs.svg',
    title: '盘柜',
    date: '2022',
    desc: '驱动光盘收藏的一面墙。总有一天我会给它们全部做镜像，总有一天',
  },
  {
    id: 'starmap',
    file: 'starmap.svg',
    title: '六月廿一夜的星图',
    date: '2019-06-21',
    desc: '关服那晚的实拍星图（照着 stellarium 描的）。哪颗是哪颗不重要',
  },
  {
    id: 'ascii-lighthouse',
    file: 'ascii-lighthouse.svg',
    title: '灯塔（终端绘制）',
    date: '2023-06',
    desc: '某天凌晨用 figlet 和字符拼的。光束那几行是它唯一的动画',
  },
  {
    id: 'gb-screen',
    file: 'gb-screen.svg',
    title: '掌机屏幕',
    date: '2024',
    desc: '新 3DSLL 开机画面。字是像素的，快乐也是',
  },
  {
    id: 'badge',
    file: 'badge.svg',
    title: '守灯人 · 公会徽章',
    date: '2015',
    desc: '两人小公会的徽章。原型就是那座没贴图的灯塔模型',
  },
  {
    id: 'noise',
    file: 'noise.svg',
    title: '噪声地板',
    date: '2023',
    desc: '抓包软件里一段安静流量的波形。看着像海。就是海',
  },
  {
    id: 'wip-grid',
    file: 'wip-grid.svg',
    title: '像素练习 · 未完成',
    date: '2024-11',
    desc: '最后一张练习，没画完。网格里藏着几个测试色块，没有意义（真的没有，别找了）',
    clue: '红鲱鱼：ALT 明说是练习稿',
  },
];
