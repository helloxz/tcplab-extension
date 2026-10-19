import { defineConfig } from 'wxt'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  // Chrome 和 Firefox 都使用 MV3
  manifestVersion: 3,

  modules: ['@wxt-dev/module-vue'],

  manifest: {
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
  },

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
