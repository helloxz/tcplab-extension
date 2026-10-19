# WXT Testing & Publishing

## Unit Testing

Source: https://wxt.dev/guide/essentials/unit-testing

Are you an LLM? You can read better optimized documentation at /guide/essentials/unit-testing.md for this page in Markdown format

# Unit Testing [​](#unit-testing)

* [Vitest](#vitest)  
   * [Example Tests](#example-tests)  
   * [Mocking WXT APIs](#mocking-wxt-apis)
* [Other Testing Frameworks](#other-testing-frameworks)

## Vitest [​](#vitest)

WXT provides first class support for Vitest for unit testing:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [WxtVitest()],
});
```

This plugin does several things:

* Polyfills the extension API, `browser`, with an in-memory implementation using [@webext-core/fake-browser](https://webext-core.aklinker1.io/fake-browser/installation)
* Adds all vite config or plugins in `wxt.config.ts`
* Configures auto-imports (if enabled)
* Sets up global variables provided by WXT (`import.meta.env.BROWSER`, `import.meta.env.MANIFEST_VERSION`, `import.meta.env.IS_CHROME`, etc)
* Configures aliases (`@/*`, `@@/*`, etc) so imports can be resolved

Here are real projects with unit testing setup. Look at the code and tests to see how they're written.

* [aklinker1/github-better-line-counts](https://github.com/aklinker1/github-better-line-counts)
* [wxt-dev/examples's Vitest Example](https://github.com/wxt-dev/examples/tree/main/examples/vitest-unit-testing)

### Example Tests [​](#example-tests)

This example demonstrates that you don't have to mock `browser.storage` (used by `wxt/utils/storage`) in tests - [@webext-core/fake-browser](https://webext-core.aklinker1.io/fake-browser/installation) implements storage in-memory so it behaves like it would in a real extension!

```ts
import { describe, it, expect } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

const accountStorage = storage.defineItem<Account>('local:account');

async function isLoggedIn(): Promise<Account> {
  const value = await accountStorage.getValue();
  return value != null;
}

describe('isLoggedIn', () => {
  beforeEach(() => {
    // See https://webext-core.aklinker1.io/fake-browser/reseting-state
    fakeBrowser.reset();
  });

  it('should return true when the account exists in storage', async () => {
    const account: Account = {
      username: '...',
      preferences: {
        // ...
      },
    };
    await accountStorage.setValue(account);

    expect(await isLoggedIn()).toBe(true);
  });

  it('should return false when the account does not exist in storage', async () => {
    await accountStorage.deleteValue();

    expect(await isLoggedIn()).toBe(false);
  });
});
```

### Mocking WXT APIs [​](#mocking-wxt-apis)

First, you need to understand how the `#imports` module works. When WXT (and vitest) sees this import during a preprocessing step, the import is replaced with multiple imports pointing to their "real" import path.

For example, this is what your write in your source code:

```ts
// What you write
import { injectScript, createShadowRootUi } from '#imports';
```

But Vitest sees this:

```ts
import { injectScript } from 'wxt/utils/inject-script';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
```

So in this case, if you wanted to mock `injectScript`, you need to pass in `"wxt/utils/inject-script"`, not `"#imports"`.

```ts
vi.mock("wxt/utils/inject-script", () => ({
  injectScript: ...
}))
```

Refer to your project's `.wxt/types/imports-module.d.ts` file to lookup real import paths for `#imports`. If the file doesn't exist, run [wxt prepare](/guide/essentials/config/typescript.html).

## Other Testing Frameworks [​](#other-testing-frameworks)

To use a different framework, you will likely have to disable auto-imports, setup import aliases, manually mock the extension APIs, and setup the test environment to support all of WXT's features that you use.

It is possible to do, but will require a bit more setup. Refer to Vitest's setup for an example of how to setup a test environment:

<https://github.com/wxt-dev/wxt/blob/main/packages/wxt/src/testing/wxt-vitest-plugin.ts>

## E2E Testing

Source: https://wxt.dev/guide/essentials/e2e-testing

Are you an LLM? You can read better optimized documentation at /guide/essentials/e2e-testing.md for this page in Markdown format

# E2E Testing [​](#e2e-testing)

## Playwright [​](#playwright)

[Playwright](https://playwright.dev) is the only good option for writing Chrome Extension end-to-end tests.

To add E2E tests to your project, follow Playwright's [Chrome Extension docs](https://playwright.dev/docs/chrome-extensions). When you have to pass the path to your extension, pass the output directory, `/path/to/project/.output/chrome-mv3`.

For a complete example, see the [WXT's Playwright Example](https://github.com/wxt-dev/examples/tree/main/examples/playwright-e2e-testing).

## Publishing

Source: https://wxt.dev/guide/essentials/publishing

Are you an LLM? You can read better optimized documentation at /guide/essentials/publishing.md for this page in Markdown format

# Publishing [​](#publishing)

WXT can ZIP your extension and submit it to various stores for review or for self-hosting.

## First Time Publishing [​](#first-time-publishing)

If you're publishing an extension to a store for the first time, you must manually navigate the process. WXT doesn't help you create listings, each store has unique steps and requirements that you need to familiarize yourself with.

For specific details about each store, see the stores sections below.

* [Chrome Web Store](#chrome-web-store)
* [Firefox Addon Store](#firefox-addon-store)
* [Edge Addons](#edge-addons)

## Automation [​](#automation)

WXT provides two commands to help automate submitting a new version for review and publishing:

* `wxt submit init`: Setup all the required secrets and options for the `wxt submit` command
* `wxt submit`: Submit new versions of your extension for review (and publish them automatically once approved)

To get started, run `wxt submit init` and follow the prompts, or run `wxt submit --help` to view all available options. Once finished, you should have a `.env.submit` file! WXT will use this file to submit your updates.

> In CI, make sure you add all the environment variables to the submit step.

To submit a new version for publishing, build all the ZIPs you plan on releasing:

```sh
wxt zip
wxt zip -b firefox
```

Then run the `wxt submit` command, passing in all the ZIP files you want to release. In this case, we'll do a release for all 3 major stores: Chrome Web Store, Edge Addons, and Firefox Addons Store.

If it's your first time running the command or you recently made changes to the release process, you'll want to test your secrets by passing the `--dry-run` flag.

```sh
wxt submit --dry-run \
  --chrome-zip .output/{your-extension}-{version}-chrome.zip \
  --firefox-zip .output/{your-extension}-{version}-firefox.zip --firefox-sources-zip .output/{your-extension}-{version}-sources.zip \
  --edge-zip .output/{your-extension}-{version}-chrome.zip
```

If the dry run passes, remove the flag and do the actual release:

```sh
wxt submit \
  --chrome-zip .output/{your-extension}-{version}-chrome.zip \
  --firefox-zip .output/{your-extension}-{version}-firefox.zip --firefox-sources-zip .output/{your-extension}-{version}-sources.zip \
  --edge-zip .output/{your-extension}-{version}-chrome.zip
```

:::warning
See the [Firefox Addon Store](#firefox-addon-store) section for more details about the `--firefox-sources-zip` option.
:::

## GitHub Action [​](#github-action)

Here's an example of a GitHub Action that submits new versions of an extension for review. Ensure that you've added all required secrets used in the workflow to the repo's settings.

```yml
name: Release

on:
  workflow_dispatch:

jobs:
  submit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Zip extensions
        run: |
          pnpm zip
          pnpm zip:firefox

      - name: Submit to stores
        run: |
          pnpm wxt submit \
            --chrome-zip .output/*-chrome.zip \
            --firefox-zip .output/*-firefox.zip --firefox-sources-zip .output/*-sources.zip
        env:
          CHROME_EXTENSION_ID: ${{ secrets.CHROME_EXTENSION_ID }}
          CHROME_CLIENT_ID: ${{ secrets.CHROME_CLIENT_ID }}
          CHROME_CLIENT_SECRET: ${{ secrets.CHROME_CLIENT_SECRET }}
          CHROME_REFRESH_TOKEN: ${{ secrets.CHROME_REFRESH_TOKEN }}
          FIREFOX_EXTENSION_ID: ${{ secrets.FIREFOX_EXTENSION_ID }}
          FIREFOX_JWT_ISSUER: ${{ secrets.FIREFOX_JWT_ISSUER }}
          FIREFOX_JWT_SECRET: ${{ secrets.FIREFOX_JWT_SECRET }}
```

The action above lays the foundation for a basic workflow, including `zip` and `submit` steps. To further enhance your GitHub Action and delve into more complex scenarios, consider exploring the following examples from real projects. They introduce advanced features such as version management, changelog generation, and GitHub releases, tailored for different needs:

* [aklinker1/github-better-line-counts](https://github.com/aklinker1/github-better-line-counts/blob/main/.github/workflows/submit.yml) \- Conventional commits, automated version bump and changelog generation, triggered manually, optional dry run for testing
* [GuiEpi/plex-skipper](https://github.com/GuiEpi/plex-skipper/blob/main/.github/workflows/deploy.yml) \- Triggered automatically when `package.json` version is changed, creates and uploads artifacts to GitHub release.

> These examples are designed to provide clear insights and are a good starting point for customizing your own workflows. Feel free to explore and adapt them to your project needs.

## Stores [​](#stores)

### Chrome Web Store [​](#chrome-web-store)

> ✅ Supported • [Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard) • [Publishing Docs](https://developer.chrome.com/docs/webstore/publish/)

To create a ZIP for Chrome:

```sh
wxt zip
```

### Firefox Addon Store [​](#firefox-addon-store)

> ✅ Supported • [Developer Dashboard](https://addons.mozilla.org/developers/) • [Publishing Docs](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/)

Firefox requires you to upload a ZIP of your source code. This allows them to rebuild your extension and review the code in a readable way. More details can be found in [Firefox's docs](https://extensionworkshop.com/documentation/publish/source-code-submission/).

When running `wxt zip -b firefox`, WXT will zip both your extension and sources. Certain files (such as config files, hidden files, tests, and excluded entrypoints) are automatically excluded from your sources. However, it's important to manually check the ZIP to ensure it only contains the files necessary to rebuild your extension.

To customize which files are zipped, add the `zip` option to your config file.

wxt.config.ts

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  zip: {
    // ...
  },
});
```

If it's your first time submitting to the Firefox Addon Store, or if you've updated your project layout, always test your sources ZIP! The commands below should allow you to rebuild your extension from inside the extracted ZIP.

:::code-group

```sh [pnpm]
pnpm i
pnpm zip:firefox
```

```sh [npm]
npm i
npm run zip:firefox
```

```sh [yarn]
yarn
yarn zip:firefox
```

```sh [bun]
bun install
bun run zip:firefox
```

:::

Ensure that you have a `README.md` or `SOURCE_CODE_REVIEW.md` file with the above commands so that the Firefox team knows how to build your extension.

Make sure the build output is the exact same when running `wxt build -b firefox` in your main project and inside the zipped sources.

:::warning
If you use a `.env` files, they can affect the chunk hashes in the output directory. Either delete the .env file before running `wxt zip -b firefox`, or include it in your sources zip with the [zip.includeSources](/api/reference/wxt/interfaces/InlineConfig.html#includesources) option. Be careful to not include any secrets in your `.env` files.

See Issue [#377](https://github.com/wxt-dev/wxt/issues/377) for more details.
:::

#### Private Packages [​](#private-packages)

If you use private packages and you don't want to provide your auth token to the Firefox team during the review process, you can use `zip.downloadPackages` to download any private packages and include them in the zip.

wxt.config.ts

```ts
export default defineConfig({
  zip: {
    downloadPackages: [
      '@mycompany/some-package',
      //...
    ],
  },
});
```

Depending on your package manager, the `package.json` in the sources zip will be modified to use the downloaded dependencies via the `overrides` or `resolutions` field.

:::warning
WXT uses the command `npm pack <package-name>` to download the package. That means regardless of your package manager, you need to properly setup a `.npmrc` file. NPM and PNPM both respect `.npmrc` files, but Yarn and Bun have their own ways of authorizing private registries, so you'll need to add a `.npmrc` file.
:::

### Safari [​](#safari)

> 🚧 Not supported yet

WXT does not currently support automated publishing for Safari. Safari extensions require a native MacOS or iOS app wrapper, which WXT does not create yet. For now, if you want to publish to Safari, follow this guide:

* [Packaging a web extension for Safari](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari) \- "Package your existing extension as a Safari web extension using Xcode’s command-line tool."

When running the `safari-web-extension-packager` CLI tool, pass the `.output/safari-mv2` or `.output/safari-mv3` directory, not your source code directory.

```sh
pnpm wxt build -b safari
xcrun safari-web-extension-packager .output/safari-mv2
```

### Edge Addons [​](#edge-addons)

> ✅ Supported • [Developer Dashboard](https://aka.ms/PartnerCenterLogin) • [Publishing Docs](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/publish/publish-extension)

No need to create a specific ZIP for Edge. If you're already publishing to the Chrome Web Store, you can reuse your Chrome ZIP.

However, if you have features specifically for Edge, create a separate ZIP with:

```sh
wxt zip -b edge
```

## Testing Updates

Source: https://wxt.dev/guide/essentials/testing-updates

Are you an LLM? You can read better optimized documentation at /guide/essentials/testing-updates.md for this page in Markdown format

# Testing Updates [​](#testing-updates)

## Testing Permission Changes [​](#testing-permission-changes)

When `permissions`/`host_permissions` change during an update, depending on what exactly changed, the browser will disable your extension until the user accepts the new permissions.

You can test if your permission changes will result in a disabled extension:

* Chromium: Use [Google's Extension Update Testing tool](https://github.com/GoogleChromeLabs/extension-update-testing-tool)
* Firefox: See their [Test Permission Requests](https://extensionworkshop.com/documentation/develop/test-permission-requests/) page
* Safari: Everyone breaks something in production eventually... 🫡 Good luck soldier

## Update Event [​](#update-event)

You can setup a callback that runs after your extension updates like so:

```ts
browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'update') {
    // Do something
  }
});
```

If the logic is simple, write a unit test to cover this logic. If you feel the need to manually test this callback, you can either:

1. In dev mode, remove the `if` statement and reload the extension from `chrome://extensions`
2. Use [Google's Extension Update Testing tool](https://github.com/GoogleChromeLabs/extension-update-testing-tool)

## FAQ

Source: https://wxt.dev/guide/resources/faq

Are you an LLM? You can read better optimized documentation at /guide/resources/faq.md for this page in Markdown format

# FAQ [​](#faq)

Commonly asked questions about how to use WXT or why it behaves the way it does.

* [Why aren't content scripts added to the manifest?](#why-aren-t-content-scripts-added-to-the-manifest)
* [How do I disable opening the browser automatically during development?](#how-do-i-disable-opening-the-browser-automatically-during-development)
* [How do I stay logged into a website during development?](#how-do-i-stay-logged-into-a-website-during-development)
* [My component library doesn't work in content scripts](#my-component-library-doesn-t-work-in-content-scripts)
* [My content script UI looks different on certain websites](#my-content-script-ui-looks-different-on-certain-websites)
* [Does WXT provide docs for LLMs?](#does-wxt-provide-docs-for-llms)
* [Is there an LLM trained on WXT's docs that I chat with?](#is-there-an-llm-trained-on-wxt-s-docs-that-i-chat-with)
* [How do I run my WXT project with docker / devcontainers?](#how-do-i-run-my-wxt-project-with-docker-devcontainers)
* [How do I use the new Prompt API in Chrome?](#how-do-i-use-the-new-prompt-api-in-chrome)

## Why aren't content scripts added to the manifest? [​](#why-aren-t-content-scripts-added-to-the-manifest)

During development, WXT registers content scripts dynamically so they can be reloaded individually when a file is saved without reloading your entire extension.

To list the content scripts registered during development, open the service worker's console and run:

```js
await chrome.scripting.getRegisteredContentScripts();
```

## How do I disable opening the browser automatically during development? [​](#how-do-i-disable-opening-the-browser-automatically-during-development)

See <https://wxt.dev/guide/essentials/config/browser-startup.html#disable-opening-browser>

## How do I stay logged into a website during development? [​](#how-do-i-stay-logged-into-a-website-during-development)

See <https://wxt.dev/guide/essentials/config/browser-startup.html#persist-data>

## My component library doesn't work in content scripts [​](#my-component-library-doesn-t-work-in-content-scripts)

This is usually caused by one of two things (or both) when using `createShadowRootUi`:

1. Styles are added outside the `ShadowRoot`  
:::details  
Some component libraries manually add CSS to the page by adding a `<style>` or `<link>` element. They place this element in the document's `<head>` by default. This causes your styles to be placed outside the `ShadowRoot` and it's isolation blocks the styles from being applied to your UI.  
When a library does this, **you need to tell the library where to put its styles**. Here's the documentation for a few popular component libraries:  
* Ant Design: [StyleProvider](https://ant.design/docs/react/compatible-style#shadow-dom-usage)  
* Mantine: [MantineProvider#getRootElement and MantineProvider#cssVariablesSelector](https://mantine.dev/theming/mantine-provider/)  
> If your library isn't listed above, try searching it's docs/issues for "shadow root", "shadow dom", or "css container". Not all libraries support shadow DOMs, you may have to open an issue to request this feature.  
Here's an example of configuring Antd's styles:  
```tsx  
import { StyleProvider } from '@ant-design/cssinjs';  
import ReactDOM from 'react-dom/client';  
import App from './App.tsx';  
const ui = await createShadowRootUi(ctx, {  
  // ...  
  onMount: (container, shadow) => {  
    const cssContainer = shadow.querySelector('head')!;  
    const root = ReactDOM.createRoot(container);  
    root.render(  
      <StyleProvider container={cssContainer}>  
        <App />  
      </StyleProvider>,  
    );  
    return root;  
  },  
});  
```  
:::
2. UI elements are added outside the `ShadowRoot`  
:::details  
This is mostly caused by `Teleport` or `Portal` components that render an element somewhere else in the DOM, usually in the document's `<body>`. This is usually done for dialogs or popover components. This renders the element is outside the `ShadowRoot`, so styles are not applied to it.  
To fix this, **you need to both provide a target to your app AND pass the target to the `Teleport`/`Portal`**.  
First, store the reference to the `ShadowRoot`'s `<body>` element (not the document's `<body>`):  
:::code-group  
```ts [Vue]  
import { createApp } from 'vue';  
import App from './App.vue';  
const ui = await createShadowRootUi(ctx, {  
  // ...  
  onMount: (container, shadow) => {  
    const teleportTarget = shadow.querySelector('body')!;  
    const app = createApp(App)  
      .provide('TeleportTarget', teleportTarget)  
      .mount(container);  
    return app;  
  },  
});  
ui.mount();  
```  
```tsx [React]  
// hooks/PortalTargetContext.ts  
import { createContext } from 'react';  
export const PortalTargetContext = createContext<HTMLElement>();  
// entrypoints/example.content.ts  
import ReactDOM from 'react-dom/client';  
import App from './App.tsx';  
import PortalTargetContext from '~/hooks/PortalTargetContext';  
const ui = await createShadowRootUi(ctx, {  
  // ...  
  onMount: (container, shadow) => {  
    const portalTarget = shadow.querySelector('body')!;  
    const root = ReactDOM.createRoot(container);  
    root.render(  
      <PortalTargetContext.Provider value={portalTarget}>  
        <App />  
      </PortalTargetContext.Provider>,  
    );  
    return root;  
  },  
});  
ui.mount();  
```  
:::  
Then use the reference when teleporting/portaling part of your UI to a different place in the DOM:  
:::code-group  
```vue [Vue]  
<script lang="ts" setup>  
import { Teleport } from 'vue';  
const teleportTarget = inject('TeleportTarget');  
</script>  
<template>  
  <div>  
    <Teleport :to="teleportTarget">  
      <dialog>My dialog</dialog>  
    </Teleport>  
  </div>  
</template>  
```  
```tsx [React]  
import { useContext } from 'react';  
import { createPortal } from 'react-dom';  
import PortalTargetContext from '~/hooks/PortalTargetContext';  
const MyComponent = () => {  
  const portalTarget = useContext(PortalTargetContext);  
  return <div>{createPortal(<dialog>My dialog</dialog>, portalTarget)}</div>;  
};  
```  
:::  
If you use ShadCN, [see this blog post](https://aabidk.dev/blog/building-modern-cross-browser-web-extensions-content-scripts-and-ui/#using-radixui-portals-to-move-the-dialog-to-shadow-dom).  
:::

Both issues have the same cause: the library puts something outside the `ShadowRoot`, and the `ShadowRoot`'s isolation prevents CSS from being applied to your UI.

Both issues have the same fix: tell the library to put elements inside the `ShadowRoot`, not outside it. See the details above for more information and example fixes for each problem.

## My content script UI looks different on certain websites [​](#my-content-script-ui-looks-different-on-certain-websites)

If your `createShadowRootUi` looks correct on most sites but appears at the wrong size on others (e.g., Reddit), it's because `rem` unit is relative to the `<html>` element's `font-size`, which lives outside the Shadow DOM. When a website overrides it, your UI scales incorrectly.

The fix is to convert `rem` units to `px` at build time using [postcss-rem-to-responsive-pixel](https://www.npmjs.com/package/postcss-rem-to-responsive-pixel). This eliminates the dependency on the host page's root font-size.

1. Install the package:  
```sh  
bun i -D postcss-rem-to-responsive-pixel  
```
2. Configure your PostCSS config:  
postcss.config.mjs  
```js  
import remToPx from 'postcss-rem-to-responsive-pixel';  
export default {  
  plugins: [  
    remToPx({  
      rootValue: 16,  
      propList: ['*'],  
      transformUnit: 'px',  
    }),  
  ],  
};  
```

See [Issue #678](https://github.com/wxt-dev/wxt/issues/678) for additional context on this behavior.

## Does WXT provide docs for LLMs? [​](#does-wxt-provide-docs-for-llms)

Yes, WXT's documentation provides markdown files based on the [the /llms.txt proposal](https://llmstxt.org/).

## Is there an LLM trained on WXT's docs that I chat with? [​](#is-there-an-llm-trained-on-wxt-s-docs-that-i-chat-with)

Yes! There's a "Ask AI" button in the bottom right of the page, try it out! Or visit <https://knowledge.wxt.dev/> for a fullscreen experience.

Additionally, if you want to train your own model or provide context to your editor, you can use the LLM knowledge files hosted by the site:

<https://wxt.dev/knowledge/index.json>

You don't need to crawl the entire website, these files already contain all the relevant docs for training a LLM on WXT. But feel free to crawl it and generate your own files if you want!

## How do I run my WXT project with docker / [devcontainers](https://containers.dev)? [​](#how-do-i-run-my-wxt-project-with-docker-devcontainers)

To run the WXT dev server in a devcontainer, but load the dev build of your extension in your browser:

1. **Bind-mount your project directory to your host** If you're using VS Code, you can open your project folder with the `Dev Containers: Open Folder in Container...` command. This keeps the folder synchronized between your host and the devcontainer, ensuring that the extension `dist` directory remains accessible from the host.
2. **Disable auto-opening the browser** WXT automatically opens your browser during development, but since you're running inside a container, it won't be able to access it. Follow [the guide here](https://wxt.dev/guide/essentials/config/browser-startup.html#disable-opening-browser) to disable browser auto-opening in your `wxt.config.ts`.
3. **Tell WXT to listen on all network interfaces** To enable hot-reloading, your extension has to connect to the WXT dev server running inside your container. WXT will only listen on `localhost` by default, which prevents connections from outside the devcontainer. To fix this you can instruct WXT to listen on all interfaces with `wxt --host 0.0.0.0`.
4. **Enable polling if file changes are not detected** Some container, WSL, and network file system setups do not emit native file events reliably. Configure Chokidar polling in `wxt.config.ts`:  
```ts  
export default defineConfig({  
  watchOptions: {  
    usePolling: true,  
    interval: 1000,  
  },  
});  
```

## How do I use the new Prompt API in Chrome? [​](#how-do-i-use-the-new-prompt-api-in-chrome)

The service responsible for the [Prompt API](https://developer.chrome.com/docs/ai/prompt-api) is not enabled by default if you let WXT open the browser during dev mode. When checking `LanguageModel.availability`, you will always receive "unavailable".

You have two options:

1. Pass the `--disable-features=DisableLoadExtensionCommandLineSwitch` feature flag to enable the service in the browser WXT opens:  
```ts  
// wxt.config.ts  
export default defineConfig({  
  webExt: {  
    chromiumArgs: [  
      '--disable-features=DisableLoadExtensionCommandLineSwitch',  
    ],  
  },  
});  
```
2. Disable the runner and install your extension in your regular chrome profile manually:  
```ts  
// wxt.config.ts  
export default defineConfig({  
  webExt: {  
    disabled: true,  
  },  
});  
```
