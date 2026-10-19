# TCPLab Browser Extension

## 项目

点击扩展图标，在当前页面右侧注入一个 **460px 悬浮 iframe**，自动读取当前**公开 http/https 页面**的标题、DNS、WHOIS、SSL 信息（调用 TCPLab API）。

悬浮层覆盖页面但不改变页面宽度；每个 tab 独立，新 tab 不自动打开。内网、本地、空白、浏览器内部页面不读取，并给出提示。

## 技术栈

- WXT + Vue 3 + Nuxt UI v4 + Tailwind CSS 4 + TypeScript
- 包管理：**只用 pnpm**，禁止 npm / npx
- 目标：Chrome + Firefox 统一 **MV3**；通过 `scripting.executeScript` 注入悬浮 iframe，不使用 side_panel / sidebar_action；Firefox 由用户自测

## 命令

```bash
pnpm dev
pnpm build
pnpm build:firefox
pnpm typecheck   # 先 pnpm build，确保 Nuxt UI dts 已生成
pnpm test
pnpm zip
```

## 目录

```text
entrypoints/overlay     # 悬浮层页面，单页展示 DNS / WHOIS / SSL
entrypoints/restricted  # 受限页的 action popup 提示（不写入 default_popup）
entrypoints/options     # 语言设置
entrypoints/background  # action click → 注入/移除 iframe；受限页弹 action popup
components/             # DNS / WHOIS / SSL 面板
composables/            # useCachedResource（缓存/刷新/限流降级）、useIpGeo（IP 归属地）
lib/api                 # TCPLab / WHOIS / ICP API client
lib/audit.ts            # 页面简易评级（S/A/B/C/D/F）
lib/cache.ts            # 本地缓存与 TTL
lib/i18n                # 中英文文案、语言检测、API 错误映射
lib/site                # URL 过滤、内网判断、tab 信息
assets/css/main.css     # Tailwind + Nuxt UI + TCPLab 主题
```

## 产品规则

- 点击 action 时用 `scripting.executeScript` 在当前 tab 注入/移除 `460px` fixed iframe；manifest 不要设置 `default_popup`（会让 `onClicked` 失效）。
- 权限只用 `activeTab` + `scripting` + `storage` + API `host_permissions`；不要 `tabs`、`sidePanel`、`<all_urls>`。
- 背景脚本把当前 tab 的 `url` / `title` 通过 query 参数传给 overlay；不要在页面内再查 tabs。
- 关闭按钮通过 `postMessage({ type: 'tcplab:close' })` 通知父页面移除 iframe；再次点图标也是 toggle。
- 悬浮层按 tab 独立：新 tab 不自动打开；页面刷新/导航后自然消失，需要重新点图标。
- `chrome://` 等无法注入的页面：点击时用 `action.setPopup({ tabId })` + `action.openPopup()` 在图标下方弹出 340px 宽的提示页（`restricted.html`），不打开独立窗口。
- per-tab popup 只用于受限页，且要在 `tabs.onActivated` / `tabs.onUpdated` 时清掉；否则该 tab 之后的点击会被 popup 拦截，无法进入 `onClicked`。
- `openPopup()` 不可用或被拒绝（Chrome < 127、窗口不可用）时，才兜底打开 420×640 的 popup 窗口。
- 单页纵向排列：DNS → WHOIS → SSL，不要 tab；只保留页面整体滚动，不做面板内部滚动。
- 顶部提供“刷新全部”，各面板保留单项刷新。
- 只把 hostname 和 DNS 解析出的 IP 发送给 API，不发送完整 URL、查询参数或页面内容。
- DNS 面板默认只展示第一条 A / AAAA，其余记录可按组展开；首条记录下方展示对应 IP 的归属地，只查这两个 IP，失败时静默隐藏。
- 页面卡片展示简易评级（S/A/B/C/D/F）与分数；证书无效时评级封顶 C，ICP 不参与评分。
- ICP 备案仅中文界面查询和展示，英文界面不发起请求；已备案显示绿色备案块（备案号、单位性质、备案主体），未备案或不可用灰色徽标；仅域名页面显示。
- 域名页面提供“深度检测”入口，跳转 tcp.lc 的 domain-check 并预填域名；IP 页面不显示。
- 跳过：`about:`、`chrome:`、`edge:`、`chrome-extension:`、`file:`、`view-source:`、`data:`、`blob:`、`javascript:`；`localhost`、`*.local`、`*.internal`、单标签主机名；RFC1918、回环、链路本地、CGNAT、IPv6 ULA 等内网 IP。
- IP 判断用 `ipaddr.js`；不要在发请求前调用后端判断内网地址。
- WHOIS 直接传当前 hostname，后端会归一化为可注册域名；不要引入 tldts。
- DNS / TLS 用完整 hostname；WHOIS 展示后端返回的 `domain` / `domainUnicode`。

## API

- 主 API：`https://tcp.lc/api/v2/*`
- IP 归属：`https://tcp.lc/api/v2/ip/{ip}?lang=zh|en`（单 IP 60 次/分钟、1000 次/天）
- ICP 备案：`https://tcp.lc/api/v2/icp/query?domain={hostname}`（20 次/天/IP，缓存命中不计数）
- WHOIS：`https://whois.tcp.lc/v1/whois/{domain}`（真实 HTTP 状态码，10 次/分钟）
- `/api/v2/*` 的 HTTP 状态恒为 200，业务看 `body.code`；`body.msg` 是 i18n key。
- 限流时读取 `retry-after`；保留旧缓存并提示，不要自动重试。
- 多个请求独立加载，各区块独立展示 loading / error，不要让一个失败拖垮全部。

## 缓存

- DNS：60 分钟
- TLS：12 小时
- WHOIS：24 小时
- IP 归属：7 天
- ICP 备案：24 小时
- 手动刷新绕过本地缓存；限流时继续展示旧数据。

## 国际化

- 浏览器语言 `zh*` → 中文，其他一律英文。
- 用户手动设置优先；存 `storage.local` 的 `locale`：`auto` / `zh` / `en`。
- 选择 `auto` 时每次重新跟随浏览器语言。
- Nuxt UI locale 用 `zh_cn` / `en`。

## 其他

- MVP 不做暗色模式。
- MVP 不注册常驻 content script；悬浮层只在点击时按需注入。
- 未经允许不提交 Git。
