<p align="center">
  <a href="./README.md">English</a>
  &nbsp;·&nbsp;
  <a href="./README.zh-CN.md"><strong>简体中文</strong></a>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: AGPL-3.0" src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg"></a>
  <a href="wxt.config.ts"><img alt="Manifest V3" src="https://img.shields.io/badge/manifest-v3-4285F4.svg"></a>
  <a href="https://wxt.dev"><img alt="Built with WXT" src="https://img.shields.io/badge/built%20with-WXT-0F172A.svg"></a>
  <a href="https://vuejs.org"><img alt="Vue 3" src="https://img.shields.io/badge/Vue-3-42B883.svg"></a>
</p>

# TCPLab

TCPLab 是一个面向 Chrome 和 Firefox 的 Manifest V3 浏览器扩展。点击工具栏图标后，它会在当前标签页右侧注入一个 **460px** 宽的固定悬浮层，让你无需离开当前页面即可查看该页面的 DNS、WHOIS 和 TLS 信息。

不使用 side panel，不注册常驻 content script，也不会改变原页面的布局。

[官网](https://tcp.lc) · [GitHub](https://github.com/helloxz/tcplab-extension) · [问题反馈](https://github.com/helloxz/tcplab-extension/issues)

## 简介

TCPLab 是一个随手可用的网络检测工具。它读取当前公开页面的 hostname，然后分别加载三个独立面板：

1. **DNS** — A / AAAA 记录，以及每组首条地址的归属地。
2. **WHOIS** — 注册商、域名日期、名称服务器、域名状态和 DNSSEC。
3. **SSL / TLS** — 证书、协议和连接详情。

三个面板独立加载，一个面板失败不会影响其他面板。

## 功能

- **一键悬浮** — 在当前页面右侧显示 460px 宽的固定 iframe，按标签页独立，不改变原页面布局。
- **DNS** — 展示 A / AAAA 记录及 TTL；每组首条记录显示 IP 归属地；支持一键复制 IP。
- **WHOIS** — 展示注册商、注册 / 到期时间、域名年龄、名称服务器、DNSSEC，以及易读的域名状态说明。
- **SSL / TLS** — 展示证书主体、签发机构、有效期、SAN、公钥、TLS 版本、加密套件、ALPN、HTTP/2、前向保密和连接 IP。对于 HTTP 页面，会检查 443 端口并给出提示。
- **快速评级** — 根据证书、HTTPS/TLS、HTTP/2、IPv6、DNSSEC 和域名信息给出 S / A / B / C / D / F 与 0–100 分；证书无效时评级最高为 C。
- **ICP 备案** — 仅在中文界面、且当前页面是域名时查询和展示。ICP 备案不参与评分。
- **深度检测** — 跳转到 TCPLab 域名检测页，并预填当前域名。仅域名页面显示。
- **刷新** — 支持刷新全部或单个面板。手动刷新会绕过本地缓存。
- **缓存兜底** — 请求失败或触发限流时保留上一次缓存结果，并提示重试时间。
- **中英文界面** — 支持英文和简体中文，默认跟随浏览器语言。

## 使用方法

1. 打开一个公开的 `http://` 或 `https://` 页面。
2. 点击工具栏中的 TCPLab 图标。
3. 在悬浮层中依次查看 **DNS → WHOIS → SSL / TLS**。
4. 再次点击图标，或点击 **×** 关闭悬浮层。

悬浮层按标签页独立。页面刷新或导航后会消失，重新点击图标即可打开。

## 支持的页面

TCPLab 只读取公开网页。浏览器内部页面、扩展页面、本地文件、空白页以及内网 / 本地地址都不会被读取。扩展会在悬浮层中显示提示；如果页面完全无法注入（例如 `chrome://` 页面），则会在工具栏图标下方弹出一个小提示。会被拒绝的页面包括：

- `chrome://`、`edge://`、`about:`、`file:`、`view-source:`、`data:`、`blob:` 等非 Web 协议
- `localhost`、`*.local`、`*.internal` 以及单标签主机名
- 私有地址、回环地址、链路本地地址、CGNAT、组播、保留地址和 IPv6 ULA

这些判断完全在扩展本地完成，内网地址不会被发送到任何 API。

## 隐私与权限

TCPLab 只申请必要的权限：

| 权限 | 用途 |
| --- | --- |
| `activeTab`、`scripting` | 点击图标后注入或移除悬浮层 |
| `storage` | 缓存接口结果、保存语言设置 |
| `https://tcp.lc/*`、`https://whois.tcp.lc/*` | 调用 TCPLab API |

扩展不会申请 `tabs`、`<all_urls>` 或 side panel 权限。

只会把当前页面的 **hostname** 和 **DNS 解析出的 IP** 发送给 API，不会发送完整 URL、查询参数、页面内容、Cookie 或浏览历史。

## 技术栈

- [WXT](https://wxt.dev) + Manifest V3
- Vue 3 + TypeScript
- Nuxt UI 4 + Tailwind CSS 4
- [`ipaddr.js`](https://github.com/whitequark/ipaddr.js) 用于 IP 类型与内网范围判断
- Vitest 单元测试

## 快速开始

### 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`
- pnpm 9+（`packageManager` 固定为 `pnpm@9.12.2`）

> 只使用 **pnpm**，不支持 `npm` / `npx`。

### 安装与开发

```bash
pnpm install
pnpm dev
```

WXT 会启动一个已加载扩展的开发浏览器。Firefox：

```bash
pnpm dev:firefox
```

### 构建与打包

```bash
pnpm build            # Chrome，输出到 .output/chrome-mv3
pnpm build:firefox    # Firefox，输出到 .output/firefox-mv3
pnpm zip              # 打包 Chrome
pnpm zip:firefox      # 打包 Firefox
```

手动加载生产构建：打开 `chrome://extensions`，开启“开发者模式”，选择“加载已解压的扩展程序”，然后选择 `.output/chrome-mv3`。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动 Chrome 开发环境 |
| `pnpm dev:firefox` | 启动 Firefox 开发环境 |
| `pnpm build` | 构建 Chrome 生产版本 |
| `pnpm build:firefox` | 构建 Firefox 生产版本 |
| `pnpm zip` | 打包 Chrome 版本 |
| `pnpm zip:firefox` | 打包 Firefox 版本 |
| `pnpm typecheck` | 运行 `vue-tsc` 类型检查 |
| `pnpm test` | 运行 Vitest 单元测试 |

## 目录结构

```text
entrypoints/
  background.ts        # 点击图标 → 注入/移除悬浮层
  overlay/             # 460px 悬浮层页面（DNS / WHOIS / TLS）
  options/             # 语言设置
components/            # DNS、WHOIS、TLS 面板
composables/           # 缓存资源加载、IP 归属地
lib/
  api/                 # TCPLab / WHOIS / ICP API 客户端
  i18n/                # 中英文文案
  site/                # URL 过滤与内网判断
  audit.ts             # S–F 简易评级
  cache.ts             # 本地缓存与 TTL
assets/css/main.css    # Tailwind + Nuxt UI 主题
public/icon/           # 扩展图标
wxt.config.ts          # WXT / manifest 配置
```

## 数据来源与缓存

| 数据 | 接口 | 本地缓存 |
| --- | --- | --- |
| DNS | `GET https://tcp.lc/api/v2/dns/domain?name={hostname}` | 60 分钟 |
| WHOIS | `GET https://whois.tcp.lc/v1/whois/{hostname}` | 24 小时 |
| TLS | `POST https://tcp.lc/api/v2/tls/check` | 12 小时 |
| IP 归属地 | `GET https://tcp.lc/api/v2/ip/{ip}?lang={lang}` | 7 天 |
| ICP 备案（仅中文界面） | `GET https://tcp.lc/api/v2/icp/query?domain={hostname}` | 24 小时 |

说明：

- `/api/v2/*` 的 HTTP 状态恒为 `200`，业务状态看 `body.code`，`body.msg` 是 i18n key。WHOIS 接口使用真实 HTTP 状态码。
- 限流：IP 归属地单 IP 60 次/分钟、1000 次/天；WHOIS 10 次/分钟；ICP 20 次/天/IP。
- 手动刷新会绕过本地缓存。请求失败或限流时保留旧缓存，读取 `retry-after` 提示重试时间，不自动重试。
- WHOIS 直接传当前 hostname，由后端归一化为可注册域名。

## 国际化

- 默认跟随浏览器语言：`zh*` → 简体中文，其他语言 → 英文。
- 设置页可选择“自动”“中文”“English”，保存在 `storage.local` 的 `locale` 中。
- 选择“自动”时，每次都会重新跟随浏览器语言。
- ICP 备案只在中文界面查询和展示。

## 开发说明

- 悬浮层只在点击图标时通过 `scripting.executeScript` 注入，没有常驻 content script。
- 每个标签页独立，新标签页不会自动打开。
- 悬浮层是页面内右侧固定 iframe，不改变原页面宽度。
- `pnpm test` 覆盖 URL 判断、缓存、评级、格式化和 API 辅助逻辑。
- 如果 Nuxt UI 生成的类型声明缺失，先执行一次 `pnpm build` 再运行 `pnpm typecheck`。

## 已知限制

- 评级只是基于已加载数据的简易参考，不是安全审计，也不能替代完整的域名检测。
- 证书无效时评级最高为 C；ICP 备案不参与评分。
- Firefox 版按 MV3 实现，目前由用户自行测试。
- MVP 暂不支持暗色模式。

## 许可证

本项目采用 [AGPL-3.0](LICENSE) 许可证。

---

<p align="center">
  <a href="https://tcp.lc">官网</a> ·
  <a href="https://github.com/helloxz/tcplab-extension">GitHub</a> ·
  <a href="https://github.com/helloxz/tcplab-extension/issues">问题反馈</a> ·
  <a href="./README.md">English</a>
</p>
