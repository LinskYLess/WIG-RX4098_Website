# Technical Architecture — 技术架构（开发者文档）

## 1. 技术栈决策

| 层 | 选型 | 理由 |
|---|---|---|
| 站点生成 | **零依赖 Node ≥18 静态生成器**（`scripts/build.mjs`，~300 行） | 本项目需要：任意真实路径（`/old/`、`/archive/files/*.enc`、`/.well-known/`）、同一站两套皮肤、逐页控制 HTML 注释与源码层线索、生成二进制资产（PNG/WAV）。手写 SSG 对这些是零阻力，框架反而是阻抗。产物 100% 静态，任何主机可部署 |
| 页面模板 | 原生 ES Module 模板函数（`src/pages/*.mjs`） | 内容与模板分离、无构建魔法、输出即所见 |
| 客户端脚本 | 原生 ES Modules（`<script type="module">`），**不打包** | 站点交互量（状态/终端/灯语/图库/搜索）不需要 bundler；view-source 可读性是 ARG 的美德 |
| 类型与 lint | TypeScript 仅作开发期门禁：`tsc --noEmit --checkJs`（JSDoc 注解） | 获得 TS 级类型安全而不引入转译层；`npm run check` 是 CI 门禁之一 |
| 样式 | 手写 CSS（`src/assets/css/`），CSS 变量设计系统「夜航灯 Nightwatch」 | 复古 UI 需要像素级控制；不引 Tailwind |
| 状态 | localStorage（`rx4098:v1`）+ `storage` 事件跨标签同步 | 静态部署下唯一合规的存档方式；详见 §5 |
| 音频 | Web Audio API 运行时合成 Morse；构建期同一模块在 Node 侧生成真实 WAV 文件 | 零二进制资产入库，音频逻辑单源复用 |
| 测试 | `scripts/test.mjs`（答案规范化/门判定/链接爬取/构建完整性/状态机模拟）+ Playwright 式人工浏览器走查（三类玩家剧本） | 全部可自动化部分自动化 |

**依赖**：运行时依赖 **0**；开发依赖仅 `typescript` + `@types/node`（类型门禁用，可离线跳过）。

## 2. 目录结构

```
rx_4098/
├─ docs/                        # 6 份设计文档（不部署）
├─ scripts/
│  ├─ build.mjs                 # SSG：渲染 HTML、复制静态、生成二进制资产
│  ├─ serve.mjs                 # 零依赖静态服务器（支持 dist/ 预览）
│  ├─ gen-assets.mjs            # PNG（含 tEXt）/WAV 生成（被 build 调用）
│  └─ test.mjs                  # 自动化测试套件
├─ src/
│  ├─ content/                  # 内容数据（全部 .mjs，可被 build/test 引用）
│  │  ├─ blog.mjs  games.mjs  gear.mjs  gallery.mjs  links.mjs
│  │  ├─ guestbook.mjs  archive.mjs（目录树+文件内容）  fragments.mjs
│  │  └─ logs.mjs（日志生成规则）
│  ├─ arg/
│  │  ├─ puzzles.mjs            # 门定义：id、题面、规范化答案 FNV-1a、提示 3 档（共享于构建/测试）
│  │  ├─ normalize.mjs          # 答案规范化（全半角/空白/标点）
│  │  └─ cipher.mjs             # XOR+Base64 伪加密、FNV-1a、Morse 编解码（Node/Browser 同构）
│  ├─ pages/                    # 模板：layout.mjs（站点chrome）+ 每页一个函数
│  └─ assets/
│     ├─ css/ main.css  old.css  print.css
│     ├─ js/ state.mjs ui.mjs terminal.mjs audio.mjs morse-ui.mjs
│     │        archive.mjs gallery.mjs search.mjs guestbook.mjs boot.mjs
│     └─ img/ *.svg（手绘矢量/像素）+ favicon
├─ dist/                        # 构建产物（部署这个目录）
├─ package.json  README.md
```

## 3. 构建流水线（`npm run build`）

1. 清空 `dist/`；
2. 渲染全部页面 HTML（含每页定制的 HTML 注释源码层线索）；
3. 复制静态资产（css/js/img）与根文件（robots.txt、sitemap.xml、manifest、404.html、humans.txt）；
4. 生成 `dist/archive/files/*`：明文文件原样写入；`.enc` 文件写入 `base64(xor(明文, 密钥))`（密钥即谜题答案，构建时从 puzzles 数据取）；
5. 生成二进制资产：`dist/gallery/moon-island.png`（手写 PNG 编码器：zlib deflate + tEXt 块）、`dist/tmp/signal-test.wav`（PCM WAV 编码器，内容 = CQ 的 Morse）；
6. 生成日志：`beacon.log` 以 6 小时周期从 2023-06-21T21:00 生成到构建当日（保证"最近心跳 3 小时内"永远成立）；`server.log` 按规则掺杂 502；
7. 校验：内部链接爬取（见测试），失败则构建失败。

部署 = 上传 `dist/`。**无任何后端**；蜜罐/倒计时/心跳全部是"叙事静态化"（日志文件预生成 + 客户端状态机），这是本作 ARG 设计上最重要的技术妥协，也是它能永续静态部署的原因。

## 4. 谜题引擎（同构共享）

```
src/arg/puzzles.mjs —— 单一事实源：
  GATES = {
    g1: { prompt, placeholder, accept: [fnv1a(normalize(x)) ...], hints: [h1,h2,h3] },
    g2/g3/r1/r2/r3 同构
  }
```

- 浏览器：门组件提交 → normalize → FNV-1a → 比对 → 写 state → 派发全局事件 `rx:gate`；
- 终端 `unlock g1 621,621` 与页面表单共用同一判定函数；
- 测试直接调用判定函数穷举变体；
- 答案明文**只存在于** `docs/arg-master-solution.md` 与构建机内存（.enc 加密时），不进 `dist/`。

## 5. 状态系统

- `localStorage['rx4098:v1']`：`{ gates, keeper, found, guestbook, visits, hintsSeen }`；
- `state.mjs` 提供 `get()/set()/on(evt,fn)`；`storage` 事件保证多标签一致；
- `boot.mjs` 在每个页面：读取状态 → 更新 chrome（灯图标/公告/404 文案/导航徽标）→ 绑定 Konami；
- 全局自定义事件：`rx:gate`、`rx:keeper`、`rx:found`；
- `reset`（终端命令 + /about/ 页脚隐藏链接）双重确认后清档——防误触，也防"刷新卡死"恐慌。

## 6. 视觉设计系统「夜航灯 Nightwatch」

- **概念**："深夜里没关机的老机器"：近黑蓝底 + 纸白正文 + 单一强调色**萤火琥珀** `#f2a33c`，系统元素用 CRT 绿 `#7ce38b`；Windows 9x 立体边框窗口（`#c0c0c0` 面板 + 2px 反白描边）作为 Modal/终端/文件浏览器——"暗桌面上浮着旧窗口"。
- 字体栈：正文 `Georgia, "Songti SC", SimSun, serif`（老网页质感）；界面/终端 `"Cascadia Mono", Consolas, "Courier New", monospace`。零 webfont 下载。
- 组件：`.win`（9x 窗口）、`.btn`（9x 按钮）、`.statusbar`、`.terminal`（扫描线）、`.blink`（呼吸灯动画）、`.tag`、表格、灯箱、toast（右下角 9x 气泡）。
- 动效纪律：仅呼吸灯、光标闪烁、模态浮入、CRT 扫描线（subtle）；**无 glitch 滥用**——只在 `/system/` 解锁瞬间用一次 0.4s 的信号噪声转场（叙事需要）。
- 响应式：≥960px 双栏（内容+侧栏），<720px 单栏 + 汉堡；终端/门组件在移动端可用（短/长按钮代替键盘灯语）。

## 7. 部署

| 目标 | 配置 |
|---|---|
| Cloudflare Pages | 构建命令 `npm run build`，输出目录 `dist`，无环境变量 |
| GitHub Pages / 任意静态 | 直接发布 `dist/`（全站真实路径 + `404.html`，无需 SPA 回退） |
| 本地 | `npm run build && npm run serve`（http://127.0.0.1:8080） |

## 8. 风险与对策

| 风险 | 对策 |
|---|---|
| 玩家清 localStorage 失进度 | 设计上接受（ARG 常态）；终局后提供"恢复码"（state 的 base64，可保存/导入） |
| 真实时间越过 2026-10-01 | 倒计时组件切换"窗口已过 · 灯仍亮着（等待交接）"文案；谜题全部仍可解 |
| `file://` 打开（无 localStorage/模块限制） | README 明示需经 HTTP；serve.mjs 兜底 |
| 答案被 view-source 剧透 | 答案只以 FNV-1a 哈希存在于 dist 的 JS；.enc 为 XOR 密文 |
| 移动端音频不可播 | 灯语谜题附波形 Canvas 可视化（视觉路径替代听觉） |
