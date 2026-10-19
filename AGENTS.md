# TCPLab Browser Extension

## 项目

点击扩展图标打开 popup，自动读取当前**公开 http/https 页面**的标题、DNS、WHOIS、SSL 信息（调用 TCPLab API）。

内网、本地、空白、浏览器内部页面不读取，并给出提示。

## 技术栈

- WXT + Vue 3 + Nuxt UI v4 + Tailwind CSS 4 + TypeScript
- 包管理：**只用 pnpm**，禁止 npm / npx
- 目标：Chrome MV3 优先；代码保持跨浏览器，Firefox 后续补构建和测试

## 命令

```bash
pnpm dev
pnpm build
pnpm typecheck   # 先 pnpm build，确保 Nuxt UI dts 已生成
pnpm test
pnpm zip
```

## 目录

```text
entrypoints/popup       # 主界面，读取 active tab
entrypoints/options     # 语言设置
entrypoints/background  # 预留 API 代理/缓存
lib/api                 # TCPLab / WHOIS API client
lib/i18n                # 中英文文案、语言检测
lib/site                # URL 过滤、内网判断、tab 信息
assets/css/main.css     # Tailwind + Nuxt UI + TCPLab 主题
```

## 产品规则

- 有 popup 时不要写 `action.onClicked`；读取逻辑放在 popup 的 `onMounted`。
- 只用 `activeTab` + `storage` + API `host_permissions`；不要 `tabs`、`<all_urls>`、`scripting`。
- 只把 hostname 发送给 API，不发送完整 URL、查询参数或页面内容。
- 跳过：`about:`、`chrome:`、`edge:`、`chrome-extension:`、`file:`、`view-source:`、`data:`、`blob:`、`javascript:`；`localhost`、`*.local`、`*.internal`、单标签主机名；RFC1918、回环、链路本地、CGNAT、IPv6 ULA 等内网 IP。
- IP 判断用 `ipaddr.js`；不要在发请求前调用后端判断内网地址。
- WHOIS 直接传当前 hostname，后端会归一化为可注册域名；不要引入 tldts。
- DNS / TLS 用完整 hostname；WHOIS 展示后端返回的 `domain` / `domainUnicode`。

## API

- 主 API：`https://tcp.lc/api/v2/*`
- WHOIS：`https://whois.tcp.lc/v1/whois/{domain}`（真实 HTTP 状态码，10 次/分钟）
- `/api/v2/*` 的 HTTP 状态恒为 200，业务看 `body.code`；`body.msg` 是 i18n key。
- 限流时读取 `retry-after`；保留旧缓存并提示，不要自动重试。
- 多个请求用 `Promise.allSettled`，各区块独立展示 loading / error。

## 缓存

- DNS：60 分钟
- TLS：12 小时
- WHOIS：24 小时
- 手动刷新绕过本地缓存；限流时继续展示旧数据。

## 国际化

- 浏览器语言 `zh*` → 中文，其他一律英文。
- 用户手动设置优先；存 `storage.local` 的 `locale`：`auto` / `zh` / `en`。
- 选择 `auto` 时每次重新跟随浏览器语言。
- Nuxt UI locale 用 `zh_cn` / `en`。

## 其他

- MVP 不做暗色模式。
- MVP 不做 content script / sidepanel。
- 未经允许不提交 Git。
