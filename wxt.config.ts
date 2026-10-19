import { defineConfig } from 'wxt'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],

  manifest: {
    name: 'TCPLab',
    description: 'Inspect the current public page: DNS, WHOIS and TLS.',
    permissions: ['activeTab', 'storage'],
    host_permissions: [
      'https://tcp.lc/*',
      'https://whois.tcp.lc/*',
    ],
  },

  vite: () => ({
    plugins: [
      ui({
        // 当前只有单视图 popup，不需要 vue-router
        router: false,
        // MVP 不做暗色模式，关闭 Nuxt UI 的 color-mode 集成
        colorMode: false,
        // 只生成实际用到组件的主题 CSS
        experimental: { componentDetection: true },
        // 图标打包进扩展，避免运行时请求 Iconify API
        icon: { clientBundle: { scan: true } },
        ui: {
          // Nuxt UI 的 Vite 插件类型只列内置 neutral 色板；
          // 运行时允许自定义色板，这里保留 graphite。
          colors: { primary: 'brand', neutral: 'graphite' as never },
        },
      }),
    ],
  }),
})
