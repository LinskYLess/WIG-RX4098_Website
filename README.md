# RX4098 的小破站 — 一个可玩的 ARG 个人网站

一个完全虚构的静态 ARG 项目：表面是一个"技术宅的旧个人主页"，深入探索后是一条完整的隐藏叙事线（灯塔、旧游戏、等待与交接）。**所有人物、公司、游戏、事件均为创作，不对应任何真实人物或事件。**

- 玩家视角：正常浏览 → 发现异常 → 解谜 → 读到故事 → 接灯（结局会改变整站状态）
- 完整设计文档见 [`docs/`](docs/)（Story Bible / 时间线 / 谜题设计 / 站点地图 / 技术架构 / 测试报告）
- **剧透警告**：完整答案在 [`docs/arg-master-solution.md`](docs/arg-master-solution.md)，想自己玩就别点开

---

## 环境要求

- Node.js ≥ 18（开发依赖仅 `typescript` 用于类型门禁；运行时零依赖）

## 安装依赖

```bash
npm install
```

## 启动开发服务器

开发 = 构建 + 预览（本项目为纯静态生成，无 dev server 热更新）：

```bash
npm start          # 等价于 npm run build && npm run serve
# → http://127.0.0.1:8080
```

> 必须通过 HTTP 访问（`node scripts/serve.mjs` 或任意静态服务器）。
> 直接双击 `dist/index.html`（file://）会因浏览器模块/localStorage 限制导致 ARG 交互失效。

## 构建生产版本

```bash
npm run build      # 产物输出到 dist/
npm run check      # TypeScript 类型门禁（tsc --checkJs，双 tsconfig）
npm test           # 构建 + 自动化测试（门判定/载荷/金丝雀防剧透/时间戳/产物完整性）
```

构建过程：渲染 36 个入口页 → 复制静态资产 → 写 robots/sitemap/manifest/humans.txt →
XOR 加密档案与页面载荷 → 生成心跳日志（6h 周期，保证"最近心跳"永远新鲜）→
生成二进制资产（带 tEXt 元数据的 PNG、摩斯 WAV、pcap 红鲱鱼）→ 内链爬取检查 → 防剧透金丝雀检查。

## 本地预览

```bash
npm run serve                # 预览 dist/（默认 8080 端口）
node scripts/serve.mjs dist 3000   # 自定义目录与端口
```

## 部署到 Cloudflare Pages

1. 把本仓库推到 GitHub / GitLab；
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**；
3. 构建配置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - Node version: 环境变量 `NODE_VERSION` = `20`（或更高）
4. 部署完成。每次 push 自动重新构建。

其他静态主机（GitHub Pages / Vercel / Netlify）：直接发布 `dist/` 目录即可。
站点全部使用真实路径 + 根级 `404.html`，无需 SPA 回退规则。

---

## 项目结构

```
docs/                    设计文档（6 份，含完整答案库——剧透）
scripts/
  build.mjs              零依赖静态站点生成器
  serve.mjs              零依赖静态服务器
  gen-assets.mjs         PNG（zlib+tEXt）/ WAV 手写编码器
  test.mjs               自动化测试
src/
  arg/                   ARG 核心（同构）：cipher / normalize / puzzles
  content/               全部内容数据：博客 / 游戏 / 装备 / 图库 / 档案 / 日志 / 碎片 / 留言板
  pages/                 页面模板（layout 双皮肤 + 各页面）与构建注册表
  assets/
    css/                 「夜航灯」设计系统 + 2022 旧站皮肤
    js/                  客户端模块（state/ui/terminal/audio/archive/search/…）
    img/                 手绘 SVG（图库 12 张、favicon、徽章）
```

## 玩家进度与存档

- 进度存于浏览器 `localStorage`（键 `rx4098:v1`），刷新/关闭后保留；
- 终局页可导出**恢复码**（一段文本），换浏览器用终端 `import` 导入；
- `reset` 命令（终端内，双重确认）或关于页底部的隐藏链接可清档重来。

## 技术要点

- 运行时依赖 **0**；产物 100% 静态，可永久托管；
- 答案明文只存在于 `docs/arg-master-solution.md`；产物中的门验证基于
  "用玩家答案作为 XOR 密钥解出 `RX4098::OK` 标记"，无哈希、无明文（硬核玩家可破——这是特性）；
- 灯语音频：Web Audio 运行时合成 + 构建期 WAV 生成共用同一时序模块；
- 无后端、无跟踪、无统计——"这个站的浪漫全靠你自己"。

## 许可证

本项目以 [MIT License](LICENSE) 开源。站内叙事（人物、公司、游戏、事件）均为虚构，与任何真实人物或事件无关；
虚构声明、许可与仓库链接亦见站内 `/license/` 页面。
