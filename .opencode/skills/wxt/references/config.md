# WXT Configuration

## Manifest

Source: https://wxt.dev/guide/essentials/config/manifest

Are you an LLM? You can read better optimized documentation at /guide/essentials/config/manifest.md for this page in Markdown format

# Manifest [​](#manifest)

In WXT, there is no `manifest.json` file in your source code. Instead, WXT generates the manifest from multiple sources:

* Global options [defined in your wxt.config.ts file](#global-options)
* Entrypoint-specific options [defined in your entrypoints](/guide/essentials/entrypoints.html#defining-manifest-options)
* [WXT Modules](/guide/essentials/wxt-modules.html) added to your project can modify your manifest
* [Hooks](/guide/essentials/config/hooks.html) defined in your project can modify your manifest

Your extension's `manifest.json` will be output to `.output/{target}/manifest.json` when running `wxt build`.

## Global Options [​](#global-options)

To add a property to your manifest, use the `manifest` config inside your `wxt.config.ts`:

```ts
export default defineConfig({
  manifest: {
    // Put manual changes here
  },
});
```

You can also define the manifest as a function, and use JS to generate it based on the target browser, mode, and more.

```ts
export default defineConfig({
  manifest: ({ browser, manifestVersion, mode, command }) => {
    return {
      // ...
    };
  },
});
```

### MV2 and MV3 Compatibility [​](#mv2-and-mv3-compatibility)

When adding properties to the manifest, always define the property in it's MV3 format when possible. When targeting MV2, WXT will automatically convert these properties to their MV2 format.

For example, for this config:

```ts
export default defineConfig({
  manifest: {
    action: {
      default_title: 'Some Title',
    },
    web_accessible_resources: [
      {
        matches: ['*://*.google.com/*'],
        resources: ['icon/*.png'],
      },
    ],
  },
});
```

WXT will generate the following manifests:

:::code-group

```json [MV2]
{
  "manifest_version": 2,
  // ...
  "browser_action": {
    "default_title": "Some Title"
  },
  "web_accessible_resources": ["icon/*.png"]
}
```

```json [MV3]
{
  "manifest_version": 3,
  // ...
  "action": {
    "default_title": "Some Title"
  },
  "web_accessible_resources": [
    {
      "matches": ["*://*.google.com/*"],
      "resources": ["icon/*.png"]
    }
  ]
}
```

:::

You can also specify properties specific to a single manifest version, and they will be stripped out when targeting the other manifest version.

## Name [​](#name)

> [Chrome Docs](https://developer.chrome.com/docs/extensions/mv3/manifest/name/)

If not provided via the `manifest` config, the manifest's `name` property defaults to your `package.json`'s `name` property.

## Version and Version Name [​](#version-and-version-name)

> [Chrome Docs](https://developer.chrome.com/docs/extensions/mv3/manifest/version/)

Your extension's `version` and `version_name` is based on the `version` from your `package.json`.

* `version_name` is the exact string listed
* `version` is the string cleaned up, with any invalid suffixes removed

Example:

```json
// package.json
{
  "version": "1.3.0-alpha2"
}
```

```json
// .output/<target>/manifest.json
{
  "version": "1.3.0",
  "version_name": "1.3.0-alpha2"
}
```

If a version is not present in your `package.json`, it defaults to `"0.0.0"`.

## Icons [​](#icons)

WXT automatically discovers your extension's icon by looking at files in the `public/` directory:

```plaintext
public/
├─ icon-16.png
├─ icon-24.png
├─ icon-48.png
├─ icon-96.png
└─ icon-128.png
```

Specifically, an icon must match one of these regex to be discovered:

```ts
const iconRegex = [
  /^icon-([0-9]+)\.png$/,                 // icon-16.png
  /^icon-([0-9]+)x[0-9]+\.png$/,          // icon-16x16.png
  /^icon@([0-9]+)w\.png$/,                // icon@16w.png
  /^icon@([0-9]+)h\.png$/,                // icon@16h.png
  /^icon@([0-9]+)\.png$/,                 // icon@16.png
  /^icons?[/\\]([0-9]+)\.png$/,           // icon/16.png | icons/16.png
  /^icons?[/\\]([0-9]+)x[0-9]+\.png$/,    // icon/16x16.png | icons/16x16.png
];
```

If you don't like these filename or you're migrating to WXT and don't want to rename the files, you can manually specify an `icon` in your manifest:

```ts
export default defineConfig({
  manifest: {
    icons: {
      16: '/extension-icon-16.png',
      24: '/extension-icon-24.png',
      48: '/extension-icon-48.png',
      96: '/extension-icon-96.png',
      128: '/extension-icon-128.png',
    },
  },
});
```

Alternatively, you can use [@wxt-dev/auto-icons](https://www.npmjs.com/package/@wxt-dev/auto-icons) to let WXT generate your icon at the required sizes.

### Firefox `theme_icons` [​](#firefox-theme-icons)

Firefox supports a [theme\_icons](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/action#theme%5Ficons) field on the toolbar action that swaps between a light and dark variant based on the current browser theme.

When [targeting Firefox](/guide/essentials/target-different-browsers.html), WXT auto-discovers paired light/dark icons in the `public/` directory and attaches them to `action` (MV3) or `browser_action` (MV2). You only need to drop both variants next to your regular icons:

```plaintext
public/
├─ icon-16.png         # regular (default_icon)
├─ icon-light-16.png   # Firefox light theme
├─ icon-dark-16.png    # Firefox dark theme
├─ icon-32.png
├─ icon-light-32.png
└─ icon-dark-32.png
```

A size is only included in `theme_icons` if **both** a light and a dark file are present. The following filename patterns are discovered:

```ts
const themeIconRegex = [
  /^icon-(?<variant>light|dark)-(?<size>[0-9]+)\.png$/,              // icon-light-16.png
  /^icon-(?<variant>light|dark)-(?<size>[0-9]+)x[0-9]+\.png$/,       // icon-light-16x16.png
  /^icon-(?<size>[0-9]+)-(?<variant>light|dark)\.png$/,              // icon-16-light.png
  /^icon-(?<size>[0-9]+)x[0-9]+-(?<variant>light|dark)\.png$/,       // icon-16x16-light.png
  /^icons?[/\\](?<variant>light|dark)-(?<size>[0-9]+)\.png$/,        // icon/light-16.png | icons/light-16.png
  /^icons?[/\\](?<variant>light|dark)-(?<size>[0-9]+)x[0-9]+\.png$/, // icon/light-16x16.png
  /^icons?[/\\](?<size>[0-9]+)-(?<variant>light|dark)\.png$/,        // icon/16-light.png
  /^icons?[/\\](?<size>[0-9]+)x[0-9]+-(?<variant>light|dark)\.png$/, // icon/16x16-light.png
];
```

Only `.png` files are discovered today, even though Firefox supports `.svg` \- follow [#1120](https://github.com/wxt-dev/wxt/issues/1120) for updates.

If you set `manifest.action.theme_icons` (or `manifest.browser_action.theme_icons`) explicitly in `wxt.config.ts`, WXT will not overwrite it.

## Permissions [​](#permissions)

> [Chrome docs](https://developer.chrome.com/docs/extensions/reference/permissions/)

Most of the time, you need to manually add permissions to your manifest. Only in a few specific situations are permissions added automatically:

* During development: the `tabs` and `scripting` permissions will be added to enable hot reloading.
* When a `sidepanel` entrypoint is present: The `sidepanel` permission is added.

```ts
export default defineConfig({
  manifest: {
    permissions: ['storage', 'tabs'],
  },
});
```

:::warning
Different browsers support different permissions. You are responsible for passing only the permissions required for each browser:

```ts
export default defineConfig({
  manifest: ({ browser }) => ({
    permissions:
      browser === 'chrome'
        ? ['storage', 'favicon', 'declarativeNetRequest']
        : ['storage', 'webRequest'],
  }),
});
```
:::

## Host Permissions [​](#host-permissions)

> [Chrome docs](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions#host-permissions)

```ts
export default defineConfig({
  manifest: {
    host_permissions: ['https://www.google.com/*'],
  },
});
```

:::warning
If you use host permissions and target both MV2 and MV3, make sure to only include the required host permissions for each version:

```ts
export default defineConfig({
  manifest: ({ manifestVersion }) => ({
    host_permissions: manifestVersion === 2 ? [...] : [...],
  }),
});
```
:::

## Default Locale [​](#default-locale)

```ts
export default defineConfig({
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
  },
});
```

> See [I18n docs](/guide/essentials/i18n.html) for a full guide on internationalizing your extension.

## Actions [​](#actions)

In MV2, you have two options: [browser\_action](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser%5Faction) and [page\_action](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/page%5Faction). In MV3, they were merged into a single [action](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/action) API.

By default, whenever an `action` is generated, WXT falls back to `browser_action` when targeting MV2.

### Action With Popup [​](#action-with-popup)

To generate a manifest where a UI appears after clicking the icon, just create a [Popup entrypoint](/guide/essentials/entrypoints.html#popup). If you want to use a `page_action` for MV2, add the following meta tag to the HTML document's head:

```html
<meta name="manifest.type" content="page_action" />
```

### Action Without Popup [​](#action-without-popup)

If you want to use the `activeTab` permission or the `browser.action.onClicked` event, but don't want to show a popup:

1. Delete the [Popup entrypoint](/guide/essentials/entrypoints.html#popup) if it exists
2. Add the `action` key to your manifest:  
```ts  
export default defineConfig({  
  manifest: {  
    action: {},  
  },  
});  
```

Same as an action with a popup, WXT will fallback on using `browser_action` for MV2\. To use a `page_action` instead, add that key as well:

```ts
export default defineConfig({
  manifest: {
    action: {},
    page_action: {},
  },
});
```

## Vite

Source: https://wxt.dev/guide/essentials/config/vite

Are you an LLM? You can read better optimized documentation at /guide/essentials/config/vite.md for this page in Markdown format

# Vite [​](#vite)

WXT uses [Vite](https://vitejs.dev/) under the hood to bundle your extension.

This page explains how to customize your project's Vite config. Refer to [Vite's documentation](https://vite.dev/config/) to learn more about configuring the bundler.

:::tip
In most cases, you shouldn't change Vite's build settings. WXT provides sensible defaults that output a valid extension accepted by all stores when publishing.
:::

## Change Vite Config [​](#change-vite-config)

You can change Vite's config via the `wxt.config.ts` file:

wxt.config.ts

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  vite: () => ({
    // Override config here, same as `defineConfig({ ... })`
    // inside vite.config.ts files
  }),
});
```

## Add Vite Plugins [​](#add-vite-plugins)

To add a plugin, install the NPM package and add it to the Vite config:

wxt.config.ts

```ts
import { defineConfig } from 'wxt';
import VueRouter from 'unplugin-vue-router/vite';

export default defineConfig({
  vite: () => ({
    plugins: [
      VueRouter({
        /* ... */
      }),
    ],
  }),
});
```

:::warning
Due to the way WXT orchestrates Vite builds, some plugins may not work as expected. For example, `vite-plugin-remove-console` normally only runs when you build for production (`vite build`). However, WXT uses a combination of dev server and builds during development, so you need to manually tell it when to run:

wxt.config.ts

```ts
import { defineConfig } from 'wxt';
import removeConsole from 'vite-plugin-remove-console';

export default defineConfig({
  vite: (configEnv) => ({
    plugins:
      configEnv.mode === 'production'
        ? [removeConsole({ includes: ['log'] })]
        : [],
  }),
});
```

Search [GitHub issues](https://github.com/wxt-dev/wxt/issues?q=is%3Aissue+label%3A%22vite+plugin%22) if you run into issues with a specific plugin.

If an issue doesn't exist for your plugin, [open a new one](https://github.com/wxt-dev/wxt/issues/new/choose).
:::

## Auto-imports

Source: https://wxt.dev/guide/essentials/config/auto-imports

Are you an LLM? You can read better optimized documentation at /guide/essentials/config/auto-imports.md for this page in Markdown format

# Auto-imports [​](#auto-imports)

WXT uses [unimport](https://www.npmjs.com/package/unimport), the same tool as Nuxt, to setup auto-imports.

```ts
export default defineConfig({
  // See https://www.npmjs.com/package/unimport#configurations
  imports: {
    // ...
  },
});
```

By default, WXT automatically sets up auto-imports for all of it's own APIs and some of your project directories:

* `<srcDir>/components/*`
* `<srcDir>/composables/*`
* `<srcDir>/hooks/*`
* `<srcDir>/utils/*`

All named and default exports from files in these directories are available everywhere else in your project without having to import them.

To see the complete list of auto-imported APIs, run [wxt prepare](/api/cli/wxt-prepare.html) and look at your project's `.wxt/types/imports-module.d.ts` file.

## TypeScript [​](#typescript)

For TypeScript and your editor to recognize auto-imported variables, you need to run the [wxt prepare command](/api/cli/wxt-prepare.html).

Add this command to your `postinstall` script so your editor has everything it needs to report type errors after installing dependencies:

```jsonc
// package.json
{
  "scripts": {
    "postinstall": "wxt prepare", 
  },
}
```

## ESLint [​](#eslint)

ESLint doesn't know about the auto-imported variables unless they are explicitly defined in the ESLint's `globals`. By default, WXT will generate the config if it detects ESLint is installed in your project. If the config isn't generated automatically, you can manually tell WXT to generate it.

:::code-group

```ts [ESLint >=9]
export default defineConfig({
  imports: {
    eslintrc: {
      enabled: 9,
    },
  },
});
```

```ts [ESLint <=8]
export default defineConfig({
  imports: {
    eslintrc: {
      enabled: 8,
    },
  },
});
```

:::

Then in your ESLint config, import and use the generated file:

:::code-group

```js [ESLint >=9]
// eslint.config.mjs
import autoImports from './.wxt/eslint-auto-imports.mjs';

export default [
  autoImports,
  {
    // The rest of your config...
  },
];
```

```js [ESLint <=8]
// .eslintrc.mjs
export default {
  extends: ['./.wxt/eslintrc-auto-import.json'],
  // The rest of your config...
};
```

:::

## Disabling Auto-imports [​](#disabling-auto-imports)

Not all developers like auto-imports. To disable them, set `imports` to `false`.

```ts
export default defineConfig({
  imports: false, 
});
```

## Explicit Imports (`#imports`) [​](#explicit-imports-imports)

You can manually import all of WXT's APIs via the `#imports` module:

```ts
import {
  createShadowRootUi,
  ContentScriptContext,
  MatchPattern,
} from '#imports';
```

To learn more about how the `#imports` module works, read the [related blog post](/blog/2024-12-06-using-imports-module.html).

If you've disabled auto-imports, you should still use `#imports` to import all of WXT's APIs from a single place.

## Environment Variables

Source: https://wxt.dev/guide/essentials/config/environment-variables

Are you an LLM? You can read better optimized documentation at /guide/essentials/config/environment-variables.md for this page in Markdown format

# Environment Variables [​](#environment-variables)

## Dotenv Files [​](#dotenv-files)

WXT supports [dotenv files the same way as Vite](https://vite.dev/guide/env-and-mode.html#env-files). Create any of the following files:

```plaintext
.env
.env.local
.env.[mode]
.env.[mode].local
.env.[browser]
.env.[browser].local
.env.[mode].[browser]
.env.[mode].[browser].local
```

And any environment variables listed inside them will be available at runtime:

```sh
# .env
WXT_API_KEY=...
```

```ts
await fetch(`/some-api?apiKey=${import.meta.env.WXT_API_KEY}`);
```

Remember to prefix any environment variables with `WXT_` or `VITE_`, otherwise they won't be available at runtime, as per [Vite's convention](https://vite.dev/guide/env-and-mode.html#env-files).

## Built-in Environment Variables [​](#built-in-environment-variables)

WXT provides some custom environment variables based on the current command:

| Usage                             | Type    | Description                                         |
| --------------------------------- | ------- | --------------------------------------------------- |
| import.meta.env.MANIFEST\_VERSION | 2 │ 3   | The target manifest version                         |
| import.meta.env.BROWSER           | string  | The target browser                                  |
| import.meta.env.CHROME            | boolean | Equivalent to import.meta.env.BROWSER === "chrome"  |
| import.meta.env.FIREFOX           | boolean | Equivalent to import.meta.env.BROWSER === "firefox" |
| import.meta.env.SAFARI            | boolean | Equivalent to import.meta.env.BROWSER === "safari"  |
| import.meta.env.EDGE              | boolean | Equivalent to import.meta.env.BROWSER === "edge"    |
| import.meta.env.OPERA             | boolean | Equivalent to import.meta.env.BROWSER === "opera"   |

You can set the [targetBrowsers](/api/reference/wxt/interfaces/InlineConfig.html#targetbrowsers) option to make the `BROWSER` variable a more specific type, like `"chrome" | "firefox"`.

You can also access all of [Vite's environment variables](https://vite.dev/guide/env-and-mode.html#env-variables):

| Usage                | Type    | Description                                                                      |
| -------------------- | ------- | -------------------------------------------------------------------------------- |
| import.meta.env.MODE | string  | The [mode](/guide/essentials/config/build-mode.html) the extension is running in |
| import.meta.env.PROD | boolean | When NODE\_ENV='production'                                                      |
| import.meta.env.DEV  | boolean | Opposite of import.meta.env.PROD                                                 |

:::details Other Vite Environment Variables
Vite provides two other environment variables, but they aren't useful in WXT projects:

* `import.meta.env.BASE_URL`: Use `browser.runtime.getURL` instead.
* `import.meta.env.SSR`: Always `false`.
:::

## Manifest [​](#manifest)

To use environment variables in the manifest, you need to use the function syntax:

```ts
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: { 
    oauth2: { 
      client_id: import.meta.env.WXT_APP_CLIENT_ID
    } 
  } 
  manifest: () => ({ 
    oauth2: { 
      client_id: import.meta.env.WXT_APP_CLIENT_ID
    } 
  }), 
});
```

WXT can't load your `.env` files until after the config file has been loaded. So by using the function syntax for `manifest`, it defers creating the object until after the `.env` files are loaded into the process.

Note that Vite's runtime environment variables, like `import.meta.env.DEV`, will not be defined. Instead, access the `mode` like this:

```ts
export default defineConfig({
  manifest: ({ mode }) => {
    const isDev = mode === 'development';
    console.log('Is development mode:', isDev);

    // ...
  },
});
```

## Runtime Config

Source: https://wxt.dev/guide/essentials/config/runtime

Are you an LLM? You can read better optimized documentation at /guide/essentials/config/runtime.md for this page in Markdown format

# Runtime Config [​](#runtime-config)

> This API is still a WIP, with more features coming soon!

Define runtime configuration in a single place, `<srcDir>/app.config.ts`:

```ts
import { defineAppConfig } from '#imports';

// Define types for your config
declare module 'wxt/utils/define-app-config' {
  export interface WxtAppConfig {
    theme?: 'light' | 'dark';
  }
}

export default defineAppConfig({
  theme: 'dark',
});
```

:::warning
This file is committed to the repo, so don't put any secrets here. Instead, use [Environment Variables](/guide/essentials/config/environment-variables.html)
:::

To access runtime config, WXT provides the `getAppConfig` function:

```ts
import { getAppConfig } from '#imports';

console.log(getAppConfig()); // { theme: "dark" }
```

## Environment Variables in App Config [​](#environment-variables-in-app-config)

You can use environment variables in the `app.config.ts` file.

```ts
declare module 'wxt/utils/define-app-config' {
  export interface WxtAppConfig {
    apiKey?: string;
    skipWelcome: boolean;
  }
}

export default defineAppConfig({
  apiKey: import.meta.env.WXT_API_KEY,
  skipWelcome: import.meta.env.WXT_SKIP_WELCOME === 'true',
});
```

This has several advantages:

* Define all expected environment variables in a single file
* Convert strings to other types, like booleans or arrays
* Provide default values if an environment variable is not provided

## Build Modes

Source: https://wxt.dev/guide/essentials/config/build-mode

Are you an LLM? You can read better optimized documentation at /guide/essentials/config/build-mode.md for this page in Markdown format

# Build Modes [​](#build-modes)

Because WXT is powered by Vite, it supports [modes](https://vite.dev/guide/env-and-mode.html#modes) in the same way.

When running any dev or build commands, pass the `--mode` flag:

```sh
wxt --mode production
wxt build --mode development
wxt zip --mode testing
```

By default, `--mode` is `development` for the dev command and `production` for all other commands (build, zip, etc).

## Get Mode at Runtime [​](#get-mode-at-runtime)

You can access the current mode in your extension using `import.meta.env.MODE`:

```ts
switch (import.meta.env.MODE) {
  case 'development': // ...
  case 'production': // ...

  // Custom modes specified with --mode
  case 'testing': // ...
  case 'staging': // ...
  // ...
}
```

## TypeScript Configuration

Source: https://wxt.dev/guide/essentials/config/typescript

Are you an LLM? You can read better optimized documentation at /guide/essentials/config/typescript.md for this page in Markdown format

# TypeScript Configuration [​](#typescript-configuration)

When you run [wxt prepare](/api/cli/wxt-prepare.html), WXT generates a base TSConfig file for your project at `<rootDir>/.wxt/tsconfig.json`.

At a minimum, you need to create a TSConfig in your root directory that looks like this:

```jsonc
// <rootDir>/tsconfig.json
{
  "extends": ".wxt/tsconfig.json",
}
```

Or if you're in a monorepo, you may not want to extend the config. If you don't extend it, you need to add `.wxt/wxt.d.ts` to the TypeScript project:

```ts
/// <reference path="./.wxt/wxt.d.ts" />
```

## TSConfig Paths [​](#tsconfig-paths)

WXT provides a default set of path aliases.

| Alias | To           | Example                                        |
| ----- | ------------ | ---------------------------------------------- |
| \~\~  | <rootDir>/\* | import "\~\~/package.json"                     |
| @@    | <rootDir>/\* | import "@@/package.json"                       |
| \~    | <srcDir>/\*  | import { toLowerCase } from "\~/utils/strings" |
| @     | <srcDir>/\*  | import { toLowerCase } from "@/utils/strings"  |

To add your own, DO NOT add them to your `tsconfig.json`! Instead, use the [alias option](/api/reference/wxt/interfaces/InlineConfig.html#alias) in `wxt.config.ts`.

This will add your custom aliases to `<rootDir>/.wxt/tsconfig.json` next time you run `wxt prepare`. It also adds your alias to the bundler so it can resolve imports.

```ts
import { resolve } from 'node:path';

export default defineConfig({
  alias: {
    // Directory:
    testing: resolve('utils/testing'),
    // File:
    strings: resolve('utils/strings.ts'),
  },
});
```

```ts
import { fakeTab } from 'testing/fake-objects';
import { toLowerCase } from 'strings';
```

## Custom Options [​](#custom-options)

To specify custom compiler or top-level options, you have two options:

1. Override WXT's value completely by setting it in your root `tsconfig.json`:  
```jsonc  
// <rootDir>/tsconfig.json  
{  
  "extends": ".wxt/tsconfig.json",  
  "compilerOptions": {  
    "jsx": "preserve",  
  },  
}  
```
2. Merge custom values into values generated by WXT via the `prepare:tsconfig` hook:  
```ts  
// wxt.config.ts  
export default defineConfig({  
  hooks: {  
    'prepare:tsconfig': (wxt, { tsconfig }) => {  
      tsconfig.compilerOptions.lib.push('WebWorker');  
    },  
  },  
});  
```

Overriding is great for simple boolean values, but not for complex options like `paths` or `libs`, where you can't just "add" a value to the object from your `tsconfig.json` file. So WXT provides the hook that let's you add or merge or delete or do whatever you want to the config file before it's written to the `.wxt/` directory.

## Hooks

Source: https://wxt.dev/guide/essentials/config/hooks

Are you an LLM? You can read better optimized documentation at /guide/essentials/config/hooks.md for this page in Markdown format

# Hooks [​](#hooks)

WXT includes a system that lets you hook into the build process and make changes.

## Adding Hooks [​](#adding-hooks)

The easiest way to add a hook is via the `wxt.config.ts`. Here's an example hook that modifies the `manifest.json` file before it is written to the output directory:

wxt.config.ts

```ts
export default defineConfig({
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (wxt.config.mode === 'development') {
        manifest.name += ' (DEV)';
      }
    },
  },
});
```

Most hooks provide the `wxt` object as the first argument. It contains the resolved config and other info about the current build. The other arguments can be modified by reference to change different parts of the build system.

You can find the [list of all available hooks](/api/reference/wxt/interfaces/WxtHooks.html) in the API reference.

Putting one-off hooks like this in your config file is simple, but if you find yourself writing lots of hooks, you should extract them into [WXT Modules](/guide/essentials/wxt-modules.html) instead.

## Execution Order [​](#execution-order)

Because hooks can be defined in multiple places, including [WXT Modules](/guide/essentials/wxt-modules.html), the order which they're executed can matter. Hooks are executed in the following order:

1. NPM modules in the order listed in the [modules config](/api/reference/wxt/interfaces/InlineConfig.html#modules)
2. User modules in [/modules folder](/guide/essentials/project-structure.html), loaded alphabetically
3. Hooks listed in your `wxt.config.ts`

To see the order for your project, run `wxt prepare --debug` flag and search for the "Hook execution order":

```plaintext
⚙ Hook execution order:
⚙   1. wxt:built-in:unimport
⚙   2. src/modules/auto-icons.ts
⚙   3. src/modules/example.ts
⚙   4. src/modules/i18n.ts
⚙   5. wxt.config.ts > hooks
```

Changing execution order is simple:

* Prefix your user modules with a number (lower numbers are loaded first):  
```html  
📁 modules/  
   📄 0.my-module.ts  
   📄 1.another-module.ts  
```
* If you need to run an NPM module after user modules, just make it a user module and prefix the filename with a number!  
```ts  
// modules/2.i18n.ts  
export { default } from '@wxt-dev/i18n/module';  
```

## Entrypoint Loaders

Source: https://wxt.dev/guide/essentials/config/entrypoint-loaders

Are you an LLM? You can read better optimized documentation at /guide/essentials/config/entrypoint-loaders.md for this page in Markdown format

# Entrypoint Loaders [​](#entrypoint-loaders)

To generate the manifest and other files at build-time, WXT must import each entrypoint to get their options, like content script `matches`. For HTML files, this is easy. For JS/TS entrypoints, the process is more complicated.

When loading your JS/TS entrypoints, they are imported into a NodeJS environment, not the `browser` environment that they normally run in. This can lead to issues commonly seen when running browser-only code in a NodeJS environment, like missing global variables.

WXT does several pre-processing steps to try and prevent errors during this process:

1. Use `linkedom` to make a small set of browser globals (`window`, `document`, etc) available.
2. Use `@webext-core/fake-browser` to create a fake version of the `chrome` and `browser` globals expected by extensions.
3. Pre-process the JS/TS code, stripping out the `main` function then tree-shaking unused code from the file

However, this process is not perfect. It doesn't setup all the globals found in the browser and the APIs may behave differently. As such, **_you should avoid using browser or extension APIs outside the `main` function of your entrypoints!_** See [Entrypoint Limitations](/guide/essentials/extension-apis.html#entrypoint-limitations) for more details.

:::tip
If you're running into errors while importing entrypoints, run `wxt prepare --debug` to see more details about this process. When debugging, WXT will print out the pre-processed code to help you identify issues.
:::

Once the environment has been polyfilled and your code pre-processed, it's up the entrypoint loader to import your code, extracting the options from the default export.

## Browser Startup

Source: https://wxt.dev/guide/essentials/config/browser-startup

Are you an LLM? You can read better optimized documentation at /guide/essentials/config/browser-startup.md for this page in Markdown format

# Browser Startup [​](#browser-startup)

During development, WXT will use any of the below packages to automatically open a browser with your extension installed.

* [web-ext by Mozilla](https://www.npmjs.com/package/web-ext)

Just install the dependency you want WXT to use to open the browser.

## `web-ext` Usage [​](#web-ext-usage)

> See the [API Reference](/api/reference/wxt/interfaces/WebExtConfig.html) for a full list of config.

### Config Files [​](#config-files)

You can configure browser startup in 3 places:

1. `<rootDir>/web-ext.config.ts`: Ignored from version control, this file lets you configure your own options for a specific project without affecting other developers  
web-ext.config.ts  
```ts  
import { defineWebExtConfig } from 'wxt';  
export default defineWebExtConfig({  
  // ...  
});  
```
2. `<rootDir>/wxt.config.ts`: Via the [webExt config](/api/reference/wxt/interfaces/InlineConfig.html#webext), included in version control
3. `$HOME/web-ext.config.ts`: Provide default values for all WXT projects on your computer

### Recipes [​](#recipes)

#### Set Browser Binaries [​](#set-browser-binaries)

To set or customize the browser opened during development:

web-ext.config.ts

```ts
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  binaries: {
    chrome: '/path/to/chrome-beta', // Use Chrome Beta instead of regular Chrome
    firefox: 'firefoxdeveloperedition', // Use Firefox Developer Edition instead of regular Firefox
    edge: '/path/to/edge', // Open MS Edge when running "wxt -b edge"
  },
});
```

wxt.config.ts

```ts
export default defineConfig({
  webExt: {
    binaries: {
      chrome: '/path/to/chrome-beta', // Use Chrome Beta instead of regular Chrome
      firefox: 'firefoxdeveloperedition', // Use Firefox Developer Edition instead of regular Firefox
      edge: '/path/to/edge', // Open MS Edge when running "wxt -b edge"
    },
  },
});
```

By default, WXT will try to automatically discover where Chrome/Firefox are installed. However, if you have chrome installed in a non-standard location, you need to set it manually as shown above.

#### Persist Data [​](#persist-data)

By default, to keep from modifying your browser's existing profiles, `web-ext` creates a brand new profile every time you run the `dev` script.

Right now, Chromium based browsers are the only browsers that support overriding this behavior and persisting data when running the `dev` script multiple times.

To persist data, set the `--user-data-dir` flag in any of the config files mentioned above:

:::code-group

```ts [Mac/Linux]
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
});
```

```ts [Windows]
import { resolve } from 'node:path';
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  // On Windows, the path must be absolute
  chromiumProfile: resolve('.wxt/chrome-data'),
  keepProfileChanges: true,
});
```

:::

Now, next time you run the `dev` script, a persistent profile will be created in `.wxt/chrome-data/{profile-name}`. With a persistent profile, you can install devtools extensions to help with development, allow the browser to remember logins, etc, without worrying about the profile being reset the next time you run the `dev` script.

:::tip
You can use any directory you'd like for `--user-data-dir`, the examples above create a persistent profile for each WXT project. To create a profile for all WXT projects, you can put the `chrome-data` directory inside your user's home directory.
:::

#### Disable Opening Browser [​](#disable-opening-browser)

If you don't want to uninstall `web-ext`, like to test in your normal profile, you can do so via `disabled: true`:

web-ext.config.ts

```ts
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  disabled: true,
});
```

### Enabling Chrome Features [​](#enabling-chrome-features)

Some APIs are disabled in Chrome during development because of the default flags `web-ext` uses to launch Chrome, like the [Prompt API](https://developer.chrome.com/docs/ai/prompt-api).

If your extension depends on new features or services, you can enable them via `chromiumArgs`:

```ts
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  chromiumArgs: [
    // For example, this flag enables the Prompt API
    '--disable-features=DisableLoadExtensionCommandLineSwitch',
  ],
});
```

There is no comprehensive list of what feature flags enable what APIs and services.

Alternatively, if you can't find a flag that enables a feature you're looking for, [disable the opening the browser during development](#disable-opening-browser) and use your regular chrome profile for development.
