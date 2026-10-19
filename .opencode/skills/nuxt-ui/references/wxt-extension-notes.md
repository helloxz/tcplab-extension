# Nuxt UI in a WXT Browser Extension

This project is a **WXT + Vue 3 (Vite)** browser extension, not a Nuxt app. Use the official skill's **Vue (Vite)** installation path, not the Nuxt module path.

## Install

```bash
pnpm add @nuxt/ui tailwindcss
pnpm add -D @iconify-json/lucide
```

Do not use `npm` or `npx` in this repository.

## WXT configuration

`@nuxt/ui/vite` is added through WXT's Vite config. A typical setup:

```ts
// wxt.config.ts
import { defineConfig } from 'wxt'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  vite: () => ({
    plugins: [
      ui({
        // This extension does not use vue-router at first.
        router: false,
        // No dark mode in MVP; do not inject color-mode logic.
        colorMode: false,
        // Only generate theme CSS for components that are actually used.
        experimental: { componentDetection: true },
        // Bundle icons into the extension instead of fetching them at runtime.
        icon: { clientBundle: { scan: true } },
        ui: {
          colors: { primary: 'brand', neutral: 'graphite' },
        },
      }),
    ],
  }),
})
```

## CSS

Each UI entrypoint imports one shared CSS file:

```css
/* assets/css/main.css */
@import "tailwindcss";
@import "@nuxt/ui";

@theme static {
  /* TCPLab brand / graphite palette */
}

:root, :host {
  --ui-radius: 0.25rem;
  --ui-primary: var(--color-brand-600);
}
```

- Use `:root, :host` rather than plain `:root` so the same file works inside a Shadow Root later.
- Do not add a `.dark` class in MVP. `colorMode: false` and light-only styling.
- Never import remote fonts or icon CSS; bundle assets into the extension.

## Vue entrypoints

Every Vue root (popup, options, future side panel/content script) needs the plugin and `UApp`:

```ts
// entrypoints/popup/main.ts
import '@/assets/css/main.css'
import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'

createApp(App).use(ui).mount('#app')
```

```vue
<!-- App.vue -->
<template>
  <UApp :locale="uiLocale">
    <main>...</main>
  </UApp>
</template>
```

- `UApp` is required for toast, tooltip, and programmatic overlays.
- Add `class="isolate"` to the root `<div id="app">` in each HTML page to avoid stacking-context issues.
- Locale objects: `import * as locales from '@nuxt/ui/locale'`; use `locales.zh_cn` and `locales.en`.

## Routing

- For a single-view popup, set `router: false` and use click handlers, not `UButton to`.
- If multiple views are needed, use `vue-router` in **hash mode** because extension pages have a static path. Then remove `router: false`.
- Do not use Nuxt's `NuxtLink`, `useHead`, `@nuxt/fonts`, or Nuxt Content. They are Nuxt-only.

## Icons

- Use Iconify names such as `i-lucide-settings`, `i-lucide-shield-alert`.
- Keep `icon.clientBundle.scan: true` and `@iconify-json/lucide` installed so icons are bundled at build time.
- Avoid runtime requests to `api.iconify.design`; they can fail under extension CSP or offline.

## Type declarations and typecheck

The Vite plugin generates `auto-imports.d.ts` and `components.d.ts` only when Vite runs.

```bash
pnpm build        # generates Nuxt UI theme + dts
pnpm typecheck    # run after build on a clean checkout
```

Add the generated files to TypeScript's include set if the WXT-generated tsconfig does not already cover them. If you need theme type completion, add the `#build/ui` aliases from the official Nuxt UI Vue installation docs.

## Content scripts (future)

Nuxt UI assumes a normal document. If this project later injects UI into pages:

- Use WXT `createShadowRootUi` with `cssInjectionMode: 'ui'`.
- Set `<UApp :portal="false">` or provide a portal target inside the Shadow Root; otherwise overlays teleport to the page `<body>` and lose styles.
- Put the `dark` class inside the Shadow Root if dark mode is ever added; a class on the host page's `<html>` does not cross the shadow boundary.
- Tailwind `rem` units depend on the host page's root font size. If the UI scales incorrectly, use `postcss-rem-to-responsive-pixel` or an iframe.
- For complex injected panels, prefer WXT's iframe UI; it runs as a normal extension page and avoids most shadow-DOM issues.

## Project conventions

- No dark mode in MVP.
- No content script in MVP; the popup reads the active tab using `activeTab`.
- Do not use Nuxt UI Pro/paid-only assumptions unless the installed package explicitly provides the component.
- Follow the TCPLab design tokens (`brand`, `graphite`) instead of raw Tailwind palette colors.
