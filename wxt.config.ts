import { defineConfig } from 'wxt'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  // Chrome 和 Firefox 都使用 MV3
  manifestVersion: 3,

  modules: ['@wxt-dev/module-vue'],

  // AMO 的源码包只需要扩展自身，不包含本地参考的后端源码
  zip: {
    excludeSources: ['tcplab/**', 'auto-imports.d.ts', 'components.d.ts'],
  },

  manifest: ({ browser }) => ({
    default_locale: 'en',
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    permissions: ['activeTab', 'scripting', 'storage'],
    host_permissions: [
      'https://tcp.lc/*',
      'https://whois.tcp.lc/*',
    ],
    action: {
      default_title: 'TCPLab',
    },
    web_accessible_resources: [
      {
        resources: ['overlay.html'],
        matches: ['<all_urls>'],
      },
    ],
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'support@tcp.lc',
              strict_min_version: '140.0',
              data_collection_permissions: {
                required: ['browsingActivity'],
              },
            },
            gecko_android: {
              strict_min_version: '142.0',
            },
          },
        }
      : {}),
  }),

  vite: () => ({
    plugins: [
      ui({
        router: false,
        colorMode: false,
        experimental: { componentDetection: true },
        icon: { clientBundle: { scan: true } },
        ui: {
          colors: { primary: 'brand', neutral: 'graphite' as never },
        },
      }),
    ],
  }),
})
