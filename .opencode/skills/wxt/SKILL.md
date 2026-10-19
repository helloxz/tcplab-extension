---
name: WXT
description: 在 TCPLab 浏览器扩展（WXT + Vue 3 + Nuxt UI v4）中开发、调试、构建扩展时使用。涵盖 entrypoints、manifest、content scripts、storage、messaging、Vue 集成、测试与发布。始终优先查阅 references/ 或官方文档，不要凭记忆猜 WXT API。
---

# WXT 浏览器扩展开发

本项目是 **WXT + Vue 3 + Nuxt UI v4 + Tailwind CSS v4 + TypeScript** 的 Chrome 扩展。包管理只用 **pnpm**，禁止 `npm` / `npx`。

## 何时使用

- 新建或修改 `entrypoints/`（popup、options、background、content script）
- 配置 `wxt.config.ts`、manifest 权限、host_permissions
- 使用 WXT 的 storage、messaging、content script UI、i18n
- 调试 `wxt dev` / `wxt build` / `wxt zip`
- 把 Vue 组件挂到 popup 或 content script
- 需要确认 WXT API 的签名、生命周期或浏览器差异

## 先读文档

WXT 文档变化较快。写代码前先看：

| 需要什么 | 看哪里 |
| --- | --- |
| 项目结构 / entrypoints | `references/essentials.md` 的 Project Structure、Entrypoints |
| manifest / 权限 / vite / 环境变量 | `references/config.md` |
| content script + Shadow Root / iframe UI | `references/essentials.md` 的 Content Scripts |
| storage / messaging / i18n | `references/essentials.md` 对应章节 |
| API 签名 | `references/api.md` |
| 测试 / 发布 | `references/testing-publishing.md` |
| 在线全文 | <https://wxt.dev/knowledge/docs.txt> |
| API 全文 | <https://wxt.dev/knowledge/api-reference.txt> |

需要刷新 references 时运行：

```bash
bash .opencode/skills/wxt/scripts/sync-docs.sh
```

## 本项目约定

- **包管理**：`pnpm`、`pnpm dlx`；不要用 npm/npx。
- **Vue**：`@wxt-dev/module-vue`；组件用 `<script setup lang="ts">`。
- **UI**：Nuxt UI v4；每个 Vue 入口都必须用 `<UApp>` 包裹。主题与组件用法见 `nuxt-ui` skill。
- **权限最小化**：当前只需要 `activeTab` + `storage` + API host_permissions；不要加 `tabs`、`<all_urls>`、`scripting`。
- **读取当前页**：用 `browser.tabs.query({ active: true, currentWindow: true })`；`activeTab` 在用户点击扩展时临时授权，足够读取 `tab.url` / `tab.title`。
- **不要发完整 URL 给 API**：只发 hostname。
- **API 错误**：TCPLab `/api/v2/*` 的 HTTP 状态恒为 200，业务看 `body.code`；`body.msg` 是 i18n key。
- **部分失败**：多个 API 并行时用 `Promise.allSettled`，不要让一个失败拖垮全部。
- **缓存**：DNS 60 分钟、TLS 12 小时、WHOIS 24 小时；手动刷新绕过本地缓存；限流时保留旧数据并提示 `retry-after`。
- **i18n**：浏览器语言 `zh*` → 中文，其他 → 英文；手动设置优先。MVP 不做暗色模式。
- **不要提交 Git**：未经用户明确允许，不执行 commit。

## 目录

```text
entrypoints/
  popup/          # 点击扩展图标打开
  options/        # 设置（语言等）
  background.ts   # service worker（预留 API 代理/缓存）
  content/        # 暂不启用；以后做页面注入再用
components/
composables/
lib/
  api/            # TCPLab / WHOIS API client
  i18n/           # zh/en 文案与语言检测
  site/           # 当前 tab、URL 过滤、内网判断
assets/css/main.css
public/icon/
```

## 常用命令

```bash
pnpm dev                 # Chrome 开发模式
pnpm build               # Chrome MV3 构建
pnpm zip                 # 打包 Chrome
pnpm dev:firefox         # Firefox（后续）
pnpm build:firefox
pnpm typecheck           # 先 pnpm build，确保 Nuxt UI dts 已生成
```

## 关键写法

### Popup 读取当前 tab

```ts
const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
if (!tab?.url) {
  // 受限页面 / 浏览器内部页面
}
```

### 用 WXT storage 保存设置

```ts
import { storage } from 'wxt/utils/storage'

const locale = storage.defineItem<'auto' | 'zh' | 'en'>('local:locale', {
  fallback: 'auto',
})

await locale.setValue('zh')
const value = await locale.getValue()
const unwatch = locale.watch((next) => console.log(next))
```

### Content script UI（以后用）

优先用 `createShadowRootUi` + `cssInjectionMode: 'ui'`；复杂面板用 `createIframeUi`。注意 Tailwind 的 rem 会受宿主页面影响，必要时用 `postcss-rem-to-responsive-pixel`。Nuxt UI 的 Teleport 默认到 `document.body`，在 Shadow DOM 中要设 `:portal="false"` 或提供 Shadow Root 内的目标。

## 常见坑

- `pnpm dev` 不自动打开浏览器：`web-ext` 是 WXT 的 optional peer dependency，必须单独 `pnpm add -D web-ext`。缺失时 WXT 会静默回退到 manual runner，只写 debug 日志。
- 有 `default_popup` 时，`action.onClicked` 不会触发；读取逻辑放在 popup 的 `onMounted`。
- `tabs` 权限会提示“读取浏览历史”；能用 `activeTab` 就不要用 `tabs`。
- content script 的 HMR 不是完整热更新；改完看 WXT 是否需要重载扩展。
- WXT 在开发时动态注册 content scripts；manifest 里看不到是正常的。
- Nuxt UI 的 `auto-imports.d.ts` / `components.d.ts` 由 Vite 插件生成；干净 checkout 下先 `pnpm build` 再 `pnpm typecheck`。
- 扩展 CSP 不允许远程代码；图标/字体尽量打包进扩展，不要运行时从 CDN 拉。
- 不要把 API Key、Cookie、完整浏览 URL 写进日志。

## 发布前检查

1. `pnpm build` 成功，`.output/chrome-mv3` 可加载。
2. `pnpm typecheck` 通过。
3. manifest 权限最小化，host_permissions 只列实际 API 域名。
4. popup 在 `chrome://` / `about:blank` / 内网地址下有友好提示。
5. 中英文切换、手动覆盖、刷新后保留设置。
6. 限流、超时、部分失败都有可读提示。
