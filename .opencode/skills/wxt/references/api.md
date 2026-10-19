# WXT API Reference (selected)

## "Function: defineContentScript()"

Source: https://wxt.dev/api/reference/wxt/utils/define-content-script/functions/defineContentScript

Are you an LLM? You can read better optimized documentation at /api/reference/wxt/utils/define-content-script/functions/defineContentScript.md for this page in Markdown format

[API](./../../../../packages.html) / [wxt/utils/define-content-script](./../) / defineContentScript

# Function: defineContentScript() [​](#function-definecontentscript)

> **defineContentScript**(`definition`): [ContentScriptDefinition](./../../../type-aliases/ContentScriptDefinition.html)

Source: [packages/wxt/src/utils/define-content-script.ts:4](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/define-content-script.ts#L4)

## Parameters [​](#parameters)

### definition [​](#definition)

[ContentScriptDefinition](./../../../type-aliases/ContentScriptDefinition.html)

## Returns [​](#returns)

[ContentScriptDefinition](./../../../type-aliases/ContentScriptDefinition.html)

---

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)

## "Function: defineBackground()"

Source: https://wxt.dev/api/reference/wxt/utils/define-background/functions/defineBackground

Are you an LLM? You can read better optimized documentation at /api/reference/wxt/utils/define-background/functions/defineBackground.md for this page in Markdown format

[API](./../../../../packages.html) / [wxt/utils/define-background](./../) / defineBackground

# Function: defineBackground() [​](#function-definebackground)

## Call Signature [​](#call-signature)

> **defineBackground**(`main`): [BackgroundDefinition](./../../../interfaces/BackgroundDefinition.html)

Source: [packages/wxt/src/utils/define-background.ts:4](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/define-background.ts#L4)

### Parameters [​](#parameters)

#### main [​](#main)

() => `void`

### Returns [​](#returns)

[BackgroundDefinition](./../../../interfaces/BackgroundDefinition.html)

## Call Signature [​](#call-signature-1)

> **defineBackground**(`definition`): [BackgroundDefinition](./../../../interfaces/BackgroundDefinition.html)

Source: [packages/wxt/src/utils/define-background.ts:5](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/define-background.ts#L5)

### Parameters [​](#parameters-1)

#### definition [​](#definition)

[BackgroundDefinition](./../../../interfaces/BackgroundDefinition.html)

### Returns [​](#returns-1)

[BackgroundDefinition](./../../../interfaces/BackgroundDefinition.html)

---

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)

## "Function: defineUnlistedScript()"

Source: https://wxt.dev/api/reference/wxt/utils/define-unlisted-script/functions/defineUnlistedScript

Are you an LLM? You can read better optimized documentation at /api/reference/wxt/utils/define-unlisted-script/functions/defineUnlistedScript.md for this page in Markdown format

[API](./../../../../packages.html) / [wxt/utils/define-unlisted-script](./../) / defineUnlistedScript

# Function: defineUnlistedScript() [​](#function-defineunlistedscript)

## Call Signature [​](#call-signature)

> **defineUnlistedScript**(`main`): [UnlistedScriptDefinition](./../../../interfaces/UnlistedScriptDefinition.html)

Source: [packages/wxt/src/utils/define-unlisted-script.ts:4](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/define-unlisted-script.ts#L4)

### Parameters [​](#parameters)

#### main [​](#main)

() => `void`

### Returns [​](#returns)

[UnlistedScriptDefinition](./../../../interfaces/UnlistedScriptDefinition.html)

## Call Signature [​](#call-signature-1)

> **defineUnlistedScript**(`definition`): [UnlistedScriptDefinition](./../../../interfaces/UnlistedScriptDefinition.html)

Source: [packages/wxt/src/utils/define-unlisted-script.ts:7](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/define-unlisted-script.ts#L7)

### Parameters [​](#parameters-1)

#### definition [​](#definition)

[UnlistedScriptDefinition](./../../../interfaces/UnlistedScriptDefinition.html)

### Returns [​](#returns-1)

[UnlistedScriptDefinition](./../../../interfaces/UnlistedScriptDefinition.html)

---

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)

## "Class: ContentScriptContext"

Source: https://wxt.dev/api/reference/wxt/utils/content-script-context/classes/ContentScriptContext

Are you an LLM? You can read better optimized documentation at /api/reference/wxt/utils/content-script-context/classes/ContentScriptContext.md for this page in Markdown format

[API](./../../../../packages.html) / [wxt/utils/content-script-context](./../) / ContentScriptContext

# Class: ContentScriptContext [​](#class-contentscriptcontext)

Source: [packages/wxt/src/utils/content-script-context.ts:45](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L45)

Implements [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController). Used to detect and stop content script code when the script is invalidated.

It also provides several utilities like `ctx.setTimeout` and `ctx.setInterval` that should be used in content scripts instead of `window.setTimeout` or `window.setInterval`.

To create context for testing, you can use the class's constructor:

```ts
import { ContentScriptContext } from 'wxt/utils/content-scripts-context';

test('storage listener should be removed when context is invalidated', () => {
  const ctx = new ContentScriptContext('test');
  const item = storage.defineItem('local:count', { defaultValue: 0 });
  const watcher = vi.fn();

  const unwatch = item.watch(watcher);
  ctx.onInvalidated(unwatch); // Listen for invalidate here

  await item.setValue(1);
  expect(watcher).toBeCalledTimes(1);
  expect(watcher).toBeCalledWith(1, 0);

  ctx.notifyInvalidated(); // Use this function to invalidate the context
  await item.setValue(2);
  expect(watcher).toBeCalledTimes(1);
});
```

## Contents [​](#contents)

* [Implements](#implements)
* [Constructors](#constructors)  
   * [Constructor](#constructor)
* [Properties](#properties)  
   * [options?](#options)
* [Accessors](#accessors)  
   * [isInvalid](#isinvalid)  
   * [isValid](#isvalid)  
   * [signal](#signal)
* [Methods](#methods)  
   * [abort()](#abort)  
   * [addEventListener()](#addeventlistener)  
   * [block()](#block)  
   * [listenForNewerScripts()](#listenfornewerscripts)  
   * [notifyInvalidated()](#notifyinvalidated)  
   * [onInvalidated()](#oninvalidated)  
   * [requestAnimationFrame()](#requestanimationframe)  
   * [requestIdleCallback()](#requestidlecallback)  
   * [setInterval()](#setinterval)  
   * [setTimeout()](#settimeout)  
   * [stopOldScripts()](#stopoldscripts)  
   * [verifyScriptStartedEvent()](#verifyscriptstartedevent)

## Implements [​](#implements)

* `AbortController`

## Constructors [​](#constructors)

### Constructor [​](#constructor)

> **new ContentScriptContext**(`contentScriptName`, `options?`): `ContentScriptContext`

Source: [packages/wxt/src/utils/content-script-context.ts:54](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L54)

#### Parameters [​](#parameters)

##### contentScriptName [​](#contentscriptname)

`string`

##### options? [​](#options)

`Omit`<[ContentScriptDefinition](./../../../type-aliases/ContentScriptDefinition.html), `"main"`\>

#### Returns [​](#returns)

`ContentScriptContext`

## Properties [​](#properties)

### options? [​](#options-1)

> `readonly` `optional` **options?**: `Omit`<[ContentScriptDefinition](./../../../type-aliases/ContentScriptDefinition.html), `"main"`\>

Source: [packages/wxt/src/utils/content-script-context.ts:56](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L56)

## Accessors [​](#accessors)

### isInvalid [​](#isinvalid)

#### Get Signature [​](#get-signature)

> **get** **isInvalid**(): `boolean`

Source: [packages/wxt/src/utils/content-script-context.ts:73](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L73)

##### Returns [​](#returns-1)

`boolean`

---

### isValid [​](#isvalid)

#### Get Signature [​](#get-signature-1)

> **get** **isValid**(): `boolean`

Source: [packages/wxt/src/utils/content-script-context.ts:80](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L80)

##### Returns [​](#returns-2)

`boolean`

---

### signal [​](#signal)

#### Get Signature [​](#get-signature-2)

> **get** **signal**(): `AbortSignal`

Source: [packages/wxt/src/utils/content-script-context.ts:65](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L65)

The **`signal`** read-only property of the AbortController interface returns an AbortSignal object instance, which can be used to communicate with/abort an asynchronous operation as desired.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/AbortController/signal)

##### Returns [​](#returns-3)

`AbortSignal`

#### Implementation of [​](#implementation-of)

`AbortController.signal`

## Methods [​](#methods)

### abort() [​](#abort)

> **abort**(`reason?`): `void`

Source: [packages/wxt/src/utils/content-script-context.ts:69](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L69)

The **`abort()`** method of the AbortController interface aborts an asynchronous operation before it has completed. This is able to abort fetch requests, the consumption of any response bodies, or streams.

[MDN Reference](https://developer.mozilla.org/docs/Web/API/AbortController/abort)

#### Parameters [​](#parameters-1)

##### reason? [​](#reason)

`any`

#### Returns [​](#returns-4)

`void`

#### Implementation of [​](#implementation-of-1)

`AbortController.abort`

---

### addEventListener() [​](#addeventlistener)

#### Call Signature [​](#call-signature)

> **addEventListener**<`TType`\>(`target`, `type`, `handler`, `options?`): `void`

Source: [packages/wxt/src/utils/content-script-context.ts:205](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L205)

Call `target.addEventListener` and remove the event listener when the context is invalidated.

Listeners can be canceled by calling the normal `removeEventListener` function.

Includes additional events useful for content scripts:

* `"wxt:locationchange"` \- Triggered when HTML5 history mode is used to change URL. Content scripts are not reloaded when navigating this way, so this can be used to reset the content script state on URL change, or run custom code.

##### Type Parameters [​](#type-parameters)

###### TType [​](#ttype)

`TType` _extends_ keyof [WxtWindowEventMap](./../interfaces/WxtWindowEventMap.html)

##### Parameters [​](#parameters-2)

###### target [​](#target)

`Window`

###### type [​](#type)

`TType`

###### handler [​](#handler)

(`event`) => `void`

###### options? [​](#options-2)

`AddEventListenerOptions`

##### Returns [​](#returns-5)

`void`

##### Example [​](#example)

```ts
ctx.addEventListener(document, 'visibilitychange', () => {
    // ...
  });
  ctx.addEventListener(window, 'wxt:locationchange', () => {
    // ...
  });
```

#### Call Signature [​](#call-signature-1)

> **addEventListener**<`TType`\>(`target`, `type`, `handler`, `options?`): `void`

Source: [packages/wxt/src/utils/content-script-context.ts:211](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L211)

Call `target.addEventListener` and remove the event listener when the context is invalidated.

Listeners can be canceled by calling the normal `removeEventListener` function.

Includes additional events useful for content scripts:

* `"wxt:locationchange"` \- Triggered when HTML5 history mode is used to change URL. Content scripts are not reloaded when navigating this way, so this can be used to reset the content script state on URL change, or run custom code.

##### Type Parameters [​](#type-parameters-1)

###### TType [​](#ttype-1)

`TType` _extends_ keyof `DocumentEventMap`

##### Parameters [​](#parameters-3)

###### target [​](#target-1)

`Document`

###### type [​](#type-1)

`TType`

###### handler [​](#handler-1)

(`event`) => `void`

###### options? [​](#options-3)

`AddEventListenerOptions`

##### Returns [​](#returns-6)

`void`

##### Example [​](#example-1)

```ts
ctx.addEventListener(document, 'visibilitychange', () => {
    // ...
  });
  ctx.addEventListener(window, 'wxt:locationchange', () => {
    // ...
  });
```

#### Call Signature [​](#call-signature-2)

> **addEventListener**<`TTarget`\>(`target`, ...`params`): `void`

Source: [packages/wxt/src/utils/content-script-context.ts:217](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L217)

Call `target.addEventListener` and remove the event listener when the context is invalidated.

Listeners can be canceled by calling the normal `removeEventListener` function.

Includes additional events useful for content scripts:

* `"wxt:locationchange"` \- Triggered when HTML5 history mode is used to change URL. Content scripts are not reloaded when navigating this way, so this can be used to reset the content script state on URL change, or run custom code.

##### Type Parameters [​](#type-parameters-2)

###### TTarget [​](#ttarget)

`TTarget` _extends_ `EventTarget`

##### Parameters [​](#parameters-4)

###### target [​](#target-2)

`TTarget`

###### params [​](#params)

...`Parameters`<`TTarget`\[`"addEventListener"`\]>

##### Returns [​](#returns-7)

`void`

##### Example [​](#example-2)

```ts
ctx.addEventListener(document, 'visibilitychange', () => {
    // ...
  });
  ctx.addEventListener(window, 'wxt:locationchange', () => {
    // ...
  });
```

---

### block() [​](#block)

> **block**<`T`\>(): `Promise`<`T`\>

Source: [packages/wxt/src/utils/content-script-context.ts:114](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L114)

Return a promise that never resolves. Useful if you have an async function that shouldn't run after the context is expired.

#### Type Parameters [​](#type-parameters-3)

##### T [​](#t)

`T`

#### Returns [​](#returns-8)

`Promise`<`T`\>

#### Example [​](#example-3)

```ts
const getValueFromStorage = async () => {
    if (ctx.isInvalid) return ctx.block();

    // ...
  };
```

---

### listenForNewerScripts() [​](#listenfornewerscripts)

> **listenForNewerScripts**(): `void`

Source: [packages/wxt/src/utils/content-script-context.ts:285](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L285)

#### Returns [​](#returns-9)

`void`

---

### notifyInvalidated() [​](#notifyinvalidated)

> **notifyInvalidated**(): `void`

Source: [packages/wxt/src/utils/content-script-context.ts:246](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L246)

**`Internal`**

Abort the abort controller and execute all `onInvalidated` listeners.

#### Returns [​](#returns-10)

`void`

---

### onInvalidated() [​](#oninvalidated)

> **onInvalidated**(`cb`): () => `void`

Source: [packages/wxt/src/utils/content-script-context.ts:98](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L98)

Add a listener that is called when the content script's context is invalidated.

#### Parameters [​](#parameters-5)

##### cb [​](#cb)

() => `void`

#### Returns [​](#returns-11)

A function to remove the listener.

() => `void`

#### Example [​](#example-4)

```ts
browser.runtime.onMessage.addListener(cb);
  const removeInvalidatedListener = ctx.onInvalidated(() => {
    browser.runtime.onMessage.removeListener(cb);
  });
  // ...
  removeInvalidatedListener();
```

---

### requestAnimationFrame() [​](#requestanimationframe)

> **requestAnimationFrame**(`callback`): `number`

Source: [packages/wxt/src/utils/content-script-context.ts:155](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L155)

Wrapper around `window.requestAnimationFrame` that automatically cancels the request when invalidated.

Callbacks can be canceled by calling the normal `cancelAnimationFrame` function.

#### Parameters [​](#parameters-6)

##### callback [​](#callback)

`FrameRequestCallback`

#### Returns [​](#returns-12)

`number`

---

### requestIdleCallback() [​](#requestidlecallback)

> **requestIdleCallback**(`callback`, `options?`): `number`

Source: [packages/wxt/src/utils/content-script-context.ts:171](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L171)

Wrapper around `window.requestIdleCallback` that automatically cancels the request when invalidated.

Callbacks can be canceled by calling the normal `cancelIdleCallback` function.

#### Parameters [​](#parameters-7)

##### callback [​](#callback-1)

`IdleRequestCallback`

##### options? [​](#options-4)

`IdleRequestOptions`

#### Returns [​](#returns-13)

`number`

---

### setInterval() [​](#setinterval)

> **setInterval**(`handler`, `timeout?`): `number`

Source: [packages/wxt/src/utils/content-script-context.ts:126](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L126)

Wrapper around `window.setInterval` that automatically clears the interval when invalidated.

Intervals can be cleared by calling the normal `clearInterval` function.

#### Parameters [​](#parameters-8)

##### handler [​](#handler-2)

() => `void`

##### timeout? [​](#timeout)

`number`

#### Returns [​](#returns-14)

`number`

---

### setTimeout() [​](#settimeout)

> **setTimeout**(`handler`, `timeout?`): `number`

Source: [packages/wxt/src/utils/content-script-context.ts:140](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L140)

Wrapper around `window.setTimeout` that automatically clears the interval when invalidated.

Timeouts can be cleared by calling the normal `setTimeout` function.

#### Parameters [​](#parameters-9)

##### handler [​](#handler-3)

() => `void`

##### timeout? [​](#timeout-1)

`number`

#### Returns [​](#returns-15)

`number`

---

### stopOldScripts() [​](#stopoldscripts)

> **stopOldScripts**(): `void`

Source: [packages/wxt/src/utils/content-script-context.ts:253](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L253)

#### Returns [​](#returns-16)

`void`

---

### verifyScriptStartedEvent() [​](#verifyscriptstartedevent)

> **verifyScriptStartedEvent**(`event`): `boolean`

Source: [packages/wxt/src/utils/content-script-context.ts:277](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-context.ts#L277)

#### Parameters [​](#parameters-10)

##### event [​](#event)

`CustomEvent`

#### Returns [​](#returns-17)

`boolean`

---

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)

## "Function: createShadowRootUi()"

Source: https://wxt.dev/api/reference/wxt/utils/content-script-ui/shadow-root/functions/createShadowRootUi

Are you an LLM? You can read better optimized documentation at /api/reference/wxt/utils/content-script-ui/shadow-root/functions/createShadowRootUi.md for this page in Markdown format

[API](./../../../../../packages.html) / [wxt/utils/content-script-ui/shadow-root](./../) / createShadowRootUi

# Function: createShadowRootUi() [​](#function-createshadowrootui)

> **createShadowRootUi**<`TMounted`\>(`ctx`, `options`): `Promise`<[ShadowRootContentScriptUi](./../interfaces/ShadowRootContentScriptUi.html)<`TMounted`\>>

Source: [packages/wxt/src/utils/content-script-ui/shadow-root.ts:20](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-ui/shadow-root.ts#L20)

Create a content script UI inside a [ShadowRoot](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot).

> This function is async because it has to load the CSS via a network call.

## Type Parameters [​](#type-parameters)

### TMounted [​](#tmounted)

`TMounted`

## Parameters [​](#parameters)

### ctx [​](#ctx)

[ContentScriptContext](./../../../content-script-context/classes/ContentScriptContext.html)

### options [​](#options)

[ShadowRootContentScriptUiOptions](./../interfaces/ShadowRootContentScriptUiOptions.html)<`TMounted`\>

Shadow root options. See [ContentScriptUiOptions](./../../types/type-aliases/ContentScriptUiOptions.html) for shared positioning, anchoring, `append`, and removal options.

## Returns [​](#returns)

`Promise`<[ShadowRootContentScriptUi](./../interfaces/ShadowRootContentScriptUi.html)<`TMounted`\>>

## See [​](#see)

<https://wxt.dev/guide/essentials/content-scripts.html#shadow-root>

---

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)

## "Function: createIntegratedUi()"

Source: https://wxt.dev/api/reference/wxt/utils/content-script-ui/integrated/functions/createIntegratedUi

Are you an LLM? You can read better optimized documentation at /api/reference/wxt/utils/content-script-ui/integrated/functions/createIntegratedUi.md for this page in Markdown format

[API](./../../../../../packages.html) / [wxt/utils/content-script-ui/integrated](./../) / createIntegratedUi

# Function: createIntegratedUi() [​](#function-createintegratedui)

> **createIntegratedUi**<`TMounted`\>(`ctx`, `options`): [IntegratedContentScriptUi](./../interfaces/IntegratedContentScriptUi.html)<`TMounted`\>

Source: [packages/wxt/src/utils/content-script-ui/integrated.ts:13](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-ui/integrated.ts#L13)

Create a content script UI without any isolation.

## Type Parameters [​](#type-parameters)

### TMounted [​](#tmounted)

`TMounted`

## Parameters [​](#parameters)

### ctx [​](#ctx)

[ContentScriptContext](./../../../content-script-context/classes/ContentScriptContext.html)

### options [​](#options)

[IntegratedContentScriptUiOptions](./../interfaces/IntegratedContentScriptUiOptions.html)<`TMounted`\>

Integrated UI options. See [ContentScriptUiOptions](./../../types/type-aliases/ContentScriptUiOptions.html) for shared positioning, anchoring, `append`, and removal options.

## Returns [​](#returns)

[IntegratedContentScriptUi](./../interfaces/IntegratedContentScriptUi.html)<`TMounted`\>

## See [​](#see)

<https://wxt.dev/guide/essentials/content-scripts.html#integrated>

---

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)

## "Function: createIframeUi()"

Source: https://wxt.dev/api/reference/wxt/utils/content-script-ui/iframe/functions/createIframeUi

Are you an LLM? You can read better optimized documentation at /api/reference/wxt/utils/content-script-ui/iframe/functions/createIframeUi.md for this page in Markdown format

[API](./../../../../../packages.html) / [wxt/utils/content-script-ui/iframe](./../) / createIframeUi

# Function: createIframeUi() [​](#function-createiframeui)

> **createIframeUi**<`TMounted`\>(`ctx`, `options`): [IframeContentScriptUi](./../interfaces/IframeContentScriptUi.html)<`TMounted`\>

Source: [packages/wxt/src/utils/content-script-ui/iframe.ts:14](https://github.com/wxt-dev/wxt/blob/46d4ead399e077d7985ea52b4d732bc55819b5d8/packages/wxt/src/utils/content-script-ui/iframe.ts#L14)

Create a content script UI using an iframe.

## Type Parameters [​](#type-parameters)

### TMounted [​](#tmounted)

`TMounted`

## Parameters [​](#parameters)

### ctx [​](#ctx)

[ContentScriptContext](./../../../content-script-context/classes/ContentScriptContext.html)

### options [​](#options)

[IframeContentScriptUiOptions](./../interfaces/IframeContentScriptUiOptions.html)<`TMounted`\>

Iframe options. See [ContentScriptUiOptions](./../../types/type-aliases/ContentScriptUiOptions.html) for shared positioning, anchoring, `append`, and removal options.

## Returns [​](#returns)

[IframeContentScriptUi](./../interfaces/IframeContentScriptUi.html)<`TMounted`\>

## See [​](#see)

<https://wxt.dev/guide/essentials/content-scripts.html#iframe>

---

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)

## "Variable: storage"

Source: https://wxt.dev/api/reference/wxt/utils/storage/variables/storage

Are you an LLM? You can read better optimized documentation at /api/reference/wxt/utils/storage/variables/storage.md for this page in Markdown format

[API](./../../../../packages.html) / [wxt/utils/storage](./../) / storage

# Variable: storage [​](#variable-storage)

> `const` **storage**: [WxtStorage](./../interfaces/WxtStorage.html)

Source: packages/storage/dist/index.d.mts:4

---

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)

## "Interface: WxtStorage"

Source: https://wxt.dev/api/reference/wxt/utils/storage/interfaces/WxtStorage

Are you an LLM? You can read better optimized documentation at /api/reference/wxt/utils/storage/interfaces/WxtStorage.md for this page in Markdown format

[API](./../../../../packages.html) / [wxt/utils/storage](./../) / WxtStorage

# Interface: WxtStorage [​](#interface-wxtstorage)

Source: packages/storage/dist/index.d.mts:5

## Contents [​](#contents)

* [Methods](#methods)  
   * [clear()](#clear)  
   * [defineItem()](#defineitem)  
   * [getItem()](#getitem)  
   * [getItems()](#getitems)  
   * [getMeta()](#getmeta)  
   * [getMetas()](#getmetas)  
   * [removeItem()](#removeitem)  
   * [removeItems()](#removeitems)  
   * [removeMeta()](#removemeta)  
   * [restoreSnapshot()](#restoresnapshot)  
   * [setItem()](#setitem)  
   * [setItems()](#setitems)  
   * [setMeta()](#setmeta)  
   * [setMetas()](#setmetas)  
   * [snapshot()](#snapshot)  
   * [unwatch()](#unwatch)  
   * [watch()](#watch)  
   * [watchMeta()](#watchmeta)

## Methods [​](#methods)

### clear() [​](#clear)

> **clear**(`base`): `Promise`<`void`\>

Source: packages/storage/dist/index.d.mts:109

Removes all items from the provided storage area.

#### Parameters [​](#parameters)

##### base [​](#base)

[StorageArea](./../type-aliases/StorageArea.html)

#### Returns [​](#returns)

`Promise`<`void`\>

---

### defineItem() [​](#defineitem)

#### Call Signature [​](#call-signature)

> **defineItem**<`TValue`, `TMetadata`\>(`key`): [WxtStorageItem](./WxtStorageItem.html)<`TValue` | `null`, `TMetadata`\>

Source: packages/storage/dist/index.d.mts:140

Define a storage item with a default value, type, or versioning.

Read full docs: <https://wxt.dev/storage.html#defining-storage-items>

##### Type Parameters [​](#type-parameters)

###### TValue [​](#tvalue)

`TValue`

###### TMetadata [​](#tmetadata)

`TMetadata` _extends_ `Record`<`string`, `unknown`\> = { }

##### Parameters [​](#parameters-1)

###### key [​](#key)

`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

##### Returns [​](#returns-1)

[WxtStorageItem](./WxtStorageItem.html)<`TValue` | `null`, `TMetadata`\>

#### Call Signature [​](#call-signature-1)

> **defineItem**<`TValue`, `TMetadata`\>(`key`, `options`): [WxtStorageItem](./WxtStorageItem.html)<`TValue`, `TMetadata`\>

Source: packages/storage/dist/index.d.mts:141

##### Type Parameters [​](#type-parameters-1)

###### TValue [​](#tvalue-1)

`TValue`

###### TMetadata [​](#tmetadata-1)

`TMetadata` _extends_ `Record`<`string`, `unknown`\> = { }

##### Parameters [​](#parameters-2)

###### key [​](#key-1)

`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

###### options [​](#options)

[WxtStorageItemOptions](./WxtStorageItemOptions.html)<`TValue`\> & `object`

##### Returns [​](#returns-2)

[WxtStorageItem](./WxtStorageItem.html)<`TValue`, `TMetadata`\>

#### Call Signature [​](#call-signature-2)

> **defineItem**<`TValue`, `TMetadata`\>(`key`, `options`): [WxtStorageItem](./WxtStorageItem.html)<`TValue`, `TMetadata`\>

Source: packages/storage/dist/index.d.mts:144

##### Type Parameters [​](#type-parameters-2)

###### TValue [​](#tvalue-2)

`TValue`

###### TMetadata [​](#tmetadata-2)

`TMetadata` _extends_ `Record`<`string`, `unknown`\> = { }

##### Parameters [​](#parameters-3)

###### key [​](#key-2)

`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

###### options [​](#options-1)

[WxtStorageItemOptions](./WxtStorageItemOptions.html)<`TValue`\> & `object`

##### Returns [​](#returns-3)

[WxtStorageItem](./WxtStorageItem.html)<`TValue`, `TMetadata`\>

#### Call Signature [​](#call-signature-3)

> **defineItem**<`TValue`, `TMetadata`\>(`key`, `options`): [WxtStorageItem](./WxtStorageItem.html)<`TValue`, `TMetadata`\>

Source: packages/storage/dist/index.d.mts:147

##### Type Parameters [​](#type-parameters-3)

###### TValue [​](#tvalue-3)

`TValue`

###### TMetadata [​](#tmetadata-3)

`TMetadata` _extends_ `Record`<`string`, `unknown`\> = { }

##### Parameters [​](#parameters-4)

###### key [​](#key-3)

`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

###### options [​](#options-2)

[WxtStorageItemOptions](./WxtStorageItemOptions.html)<`TValue`\> & `object`

##### Returns [​](#returns-4)

[WxtStorageItem](./WxtStorageItem.html)<`TValue`, `TMetadata`\>

#### Call Signature [​](#call-signature-4)

> **defineItem**<`TValue`, `TMetadata`\>(`key`, `options`): [WxtStorageItem](./WxtStorageItem.html)<`TValue` | `null`, `TMetadata`\>

Source: packages/storage/dist/index.d.mts:150

##### Type Parameters [​](#type-parameters-4)

###### TValue [​](#tvalue-4)

`TValue`

###### TMetadata [​](#tmetadata-4)

`TMetadata` _extends_ `Record`<`string`, `unknown`\> = { }

##### Parameters [​](#parameters-5)

###### key [​](#key-4)

`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

###### options [​](#options-3)

[WxtStorageItemOptions](./WxtStorageItemOptions.html)<`TValue`\>

##### Returns [​](#returns-5)

[WxtStorageItem](./WxtStorageItem.html)<`TValue` | `null`, `TMetadata`\>

---

### getItem() [​](#getitem)

#### Call Signature [​](#call-signature-5)

> **getItem**<`TValue`\>(`key`, `opts`): `Promise`<`TValue`\>

Source: packages/storage/dist/index.d.mts:12

Get an item from storage, or return `null` if it doesn't exist.

##### Type Parameters [​](#type-parameters-5)

###### TValue [​](#tvalue-5)

`TValue`

##### Parameters [​](#parameters-6)

###### key [​](#key-5)

`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

###### opts [​](#opts)

[GetItemOptions](./GetItemOptions.html)<`TValue`\> & `object`

##### Returns [​](#returns-6)

`Promise`<`TValue`\>

##### Example [​](#example)

```ts
await storage.getItem<number>('local:installDate');
```

#### Call Signature [​](#call-signature-6)

> **getItem**<`TValue`\>(`key`, `opts?`): `Promise`<`TValue` | `null`\>

Source: packages/storage/dist/index.d.mts:15

##### Type Parameters [​](#type-parameters-6)

###### TValue [​](#tvalue-6)

`TValue`

##### Parameters [​](#parameters-7)

###### key [​](#key-6)

`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

###### opts? [​](#opts-1)

[GetItemOptions](./GetItemOptions.html)<`TValue`\>

##### Returns [​](#returns-7)

`Promise`<`TValue` | `null`\>

---

### getItems() [​](#getitems)

> **getItems**(`keys`): `Promise`<`object`\[\]>

Source: packages/storage/dist/index.d.mts:23

Get multiple items from storage. The return order is guaranteed to be the same as the order requested.

#### Parameters [​](#parameters-8)

##### keys [​](#keys)

(`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` `` | [WxtStorageItem](./WxtStorageItem.html)<`any`, `any`\> | { `key`: `` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``; `options?`: [GetItemOptions](./GetItemOptions.html)<`any`\>; })\[\]

#### Returns [​](#returns-8)

`Promise`<`object`\[\]>

#### Example [​](#example-1)

```ts
await storage.getItems(['local:installDate', 'session:someCounter']);
```

---

### getMeta() [​](#getmeta)

> **getMeta**<`T`\>(`key`): `Promise`<`T`\>

Source: packages/storage/dist/index.d.mts:37

Return an object containing metadata about the key. Object is stored at `key + "$"`. If value is not an object, it returns an empty object.

#### Type Parameters [​](#type-parameters-7)

##### T [​](#t)

`T` _extends_ `Record`<`string`, `unknown`\>

#### Parameters [​](#parameters-9)

##### key [​](#key-7)

`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

#### Returns [​](#returns-9)

`Promise`<`T`\>

#### Example [​](#example-2)

```ts
await storage.getMeta('local:installDate');
```

---

### getMetas() [​](#getmetas)

> **getMetas**(`keys`): `Promise`<`object`\[\]>

Source: packages/storage/dist/index.d.mts:44

Get the metadata of multiple storage items.

#### Parameters [​](#parameters-10)

##### keys [​](#keys-1)

(`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` `` | [WxtStorageItem](./WxtStorageItem.html)<`any`, `any`\>)\[\]

List of keys or items to get the metadata of.

#### Returns [​](#returns-10)

`Promise`<`object`\[\]>

An array containing storage keys and their metadata.

---

### removeItem() [​](#removeitem)

> **removeItem**(`key`, `opts?`): `Promise`<`void`\>

Source: packages/storage/dist/index.d.mts:99

Removes an item from storage.

#### Parameters [​](#parameters-11)

##### key [​](#key-8)

`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

##### opts? [​](#opts-2)

[RemoveItemOptions](./RemoveItemOptions.html)

#### Returns [​](#returns-11)

`Promise`<`void`\>

#### Example [​](#example-3)

```ts
await storage.removeItem('local:installDate');
```

---

### removeItems() [​](#removeitems)

> **removeItems**(`keys`): `Promise`<`void`\>

Source: packages/storage/dist/index.d.mts:101

Remove a list of keys from storage.

#### Parameters [​](#parameters-12)

##### keys [​](#keys-2)

(`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` `` | [WxtStorageItem](./WxtStorageItem.html)<`any`, `any`\> | { `key`: `` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``; `options?`: [RemoveItemOptions](./RemoveItemOptions.html); } | { `item`: [WxtStorageItem](./WxtStorageItem.html)<`any`, `any`\>; `options?`: [RemoveItemOptions](./RemoveItemOptions.html); })\[\]

#### Returns [​](#returns-12)

`Promise`<`void`\>

---

### removeMeta() [​](#removemeta)

> **removeMeta**(`key`, `properties?`): `Promise`<`void`\>

Source: packages/storage/dist/index.d.mts:120

Remove the entire metadata for a key, or specific properties by name.

#### Parameters [​](#parameters-13)

##### key [​](#key-9)

`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

##### properties? [​](#properties)

`string` | `string`\[\]

#### Returns [​](#returns-13)

`Promise`<`void`\>

#### Example [​](#example-4)

```ts
// Remove all metadata properties from the item
  await storage.removeMeta('local:installDate');

  // Remove only specific the "v" field
  await storage.removeMeta('local:installDate', 'v');
```

---

### restoreSnapshot() [​](#restoresnapshot)

> **restoreSnapshot**(`base`, `data`): `Promise`<`void`\>

Source: packages/storage/dist/index.d.mts:128

Restores the results of `snapshot`. If new properties have been saved since the snapshot, they are not overridden. Only values existing in the snapshot are overridden.

#### Parameters [​](#parameters-14)

##### base [​](#base-1)

[StorageArea](./../type-aliases/StorageArea.html)

##### data [​](#data)

`any`

#### Returns [​](#returns-14)

`Promise`<`void`\>

---

### setItem() [​](#setitem)

> **setItem**<`T`\>(`key`, `value`): `Promise`<`void`\>

Source: packages/storage/dist/index.d.mts:55

Set a value in storage. Setting a value to `null` or `undefined` is equivalent to calling `removeItem`.

#### Type Parameters [​](#type-parameters-8)

##### T [​](#t-1)

`T`

#### Parameters [​](#parameters-15)

##### key [​](#key-10)

`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

##### value [​](#value)

`T` | `null`

#### Returns [​](#returns-15)

`Promise`<`void`\>

#### Example [​](#example-5)

```ts
await storage.setItem<number>('local:installDate', Date.now());
```

---

### setItems() [​](#setitems)

> **setItems**(`values`): `Promise`<`void`\>

Source: packages/storage/dist/index.d.mts:66

Set multiple values in storage. If a value is set to `null` or `undefined`, the key is removed.

#### Parameters [​](#parameters-16)

##### values [​](#values)

({ `key`: `` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``; `value`: `any`; } | { `item`: [WxtStorageItem](./WxtStorageItem.html)<`any`, `any`\>; `value`: `any`; })\[\]

#### Returns [​](#returns-16)

`Promise`<`void`\>

#### Example [​](#example-6)

```ts
await storage.setItem([
  { key: "local:installDate", value: Date.now() },
  { key: "session:someCounter, value: 5 },
  ]);
```

---

### setMeta() [​](#setmeta)

> **setMeta**<`T`\>(`key`, `properties`): `Promise`<`void`\>

Source: packages/storage/dist/index.d.mts:80

Sets metadata properties. If some properties are already set, but are not included in the `properties` parameter, they will not be removed.

#### Type Parameters [​](#type-parameters-9)

##### T [​](#t-2)

`T` _extends_ `Record`<`string`, `unknown`\>

#### Parameters [​](#parameters-17)

##### key [​](#key-11)

`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

##### properties [​](#properties-1)

`T` | `null`

#### Returns [​](#returns-17)

`Promise`<`void`\>

#### Example [​](#example-7)

```ts
await storage.setMeta('local:installDate', { appVersion });
```

---

### setMetas() [​](#setmetas)

> **setMetas**(`metas`): `Promise`<`void`\>

Source: packages/storage/dist/index.d.mts:86

Set the metadata of multiple storage items.

#### Parameters [​](#parameters-18)

##### metas [​](#metas)

({ `key`: `` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``; `meta`: `Record`<`string`, `any`\>; } | { `item`: [WxtStorageItem](./WxtStorageItem.html)<`any`, `any`\>; `meta`: `Record`<`string`, `any`\>; })\[\]

List of storage keys or items and metadata to set for each.

#### Returns [​](#returns-18)

`Promise`<`void`\>

---

### snapshot() [​](#snapshot)

> **snapshot**(`base`, `opts?`): `Promise`<`Record`<`string`, `unknown`\>>

Source: packages/storage/dist/index.d.mts:122

Return all the items in storage.

#### Parameters [​](#parameters-19)

##### base [​](#base-2)

[StorageArea](./../type-aliases/StorageArea.html)

##### opts? [​](#opts-3)

[SnapshotOptions](./SnapshotOptions.html)

#### Returns [​](#returns-19)

`Promise`<`Record`<`string`, `unknown`\>>

---

### unwatch() [​](#unwatch)

> **unwatch**(): `void`

Source: packages/storage/dist/index.d.mts:134

Remove all watch listeners.

#### Returns [​](#returns-20)

`void`

---

### watch() [​](#watch)

> **watch**<`T`\>(`key`, `cb`): [Unwatch](./../type-aliases/Unwatch.html)

Source: packages/storage/dist/index.d.mts:130

Watch for changes to a specific key in storage.

#### Type Parameters [​](#type-parameters-10)

##### T [​](#t-3)

`T`

#### Parameters [​](#parameters-20)

##### key [​](#key-12)

`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

##### cb [​](#cb)

[WatchCallback](./../type-aliases/WatchCallback.html)<`T` | `null`\>

#### Returns [​](#returns-21)

[Unwatch](./../type-aliases/Unwatch.html)

---

### watchMeta() [​](#watchmeta)

> **watchMeta**<`T`\>(`key`, `cb`): [Unwatch](./../type-aliases/Unwatch.html)

Source: packages/storage/dist/index.d.mts:132

Watch for changes to a specific key's metadata in storage.

#### Type Parameters [​](#type-parameters-11)

##### T [​](#t-4)

`T` _extends_ `Record`<`string`, `unknown`\>

#### Parameters [​](#parameters-21)

##### key [​](#key-13)

`` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

##### cb [​](#cb-1)

[WatchCallback](./../type-aliases/WatchCallback.html)<`T`\>

#### Returns [​](#returns-22)

[Unwatch](./../type-aliases/Unwatch.html)

---

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)

## "Interface: WxtStorageItem<TValue, TMetadata>"

Source: https://wxt.dev/api/reference/wxt/utils/storage/interfaces/WxtStorageItem

Are you an LLM? You can read better optimized documentation at /api/reference/wxt/utils/storage/interfaces/WxtStorageItem.md for this page in Markdown format

[API](./../../../../packages.html) / [wxt/utils/storage](./../) / WxtStorageItem

# Interface: WxtStorageItem<TValue, TMetadata> [​](#interface-wxtstorageitem-tvalue-tmetadata)

Source: packages/storage/dist/index.d.mts:152

## Contents [​](#contents)

* [Type Parameters](#type-parameters)  
   * [TValue](#tvalue)  
   * [TMetadata](#tmetadata)
* [Properties](#properties)  
   * [defaultValue](#defaultvalue)  
   * [fallback](#fallback)  
   * [key](#key)
* [Methods](#methods)  
   * [getMeta()](#getmeta)  
   * [getValue()](#getvalue)  
   * [migrate()](#migrate)  
   * [removeMeta()](#removemeta)  
   * [removeValue()](#removevalue)  
   * [setMeta()](#setmeta)  
   * [setValue()](#setvalue)  
   * [watch()](#watch)  
   * [watchMeta()](#watchmeta)

## Type Parameters [​](#type-parameters)

### TValue [​](#tvalue)

`TValue`

### TMetadata [​](#tmetadata)

`TMetadata` _extends_ `Record`<`string`, `unknown`\>

## Properties [​](#properties)

### ~~defaultValue~~ [​](#defaultvalue)

> **defaultValue**: `TValue`

Source: packages/storage/dist/index.d.mts:156

#### Deprecated [​](#deprecated)

Renamed to fallback, use it instead.

---

### fallback [​](#fallback)

> **fallback**: `TValue`

Source: packages/storage/dist/index.d.mts:158

The value provided by the `fallback` option.

---

### key [​](#key)

> **key**: `` `local:${string}` `` | `` `session:${string}` `` | `` `sync:${string}` `` | `` `managed:${string}` ``

Source: packages/storage/dist/index.d.mts:154

The storage key passed when creating the storage item.

## Methods [​](#methods)

### getMeta() [​](#getmeta)

> **getMeta**(): `Promise`<`NullablePartial`<`TMetadata`\>>

Source: packages/storage/dist/index.d.mts:162

Get metadata.

#### Returns [​](#returns)

`Promise`<`NullablePartial`<`TMetadata`\>>

---

### getValue() [​](#getvalue)

> **getValue**(): `Promise`<`TValue`\>

Source: packages/storage/dist/index.d.mts:160

Get the latest value from storage.

#### Returns [​](#returns-1)

`Promise`<`TValue`\>

---

### migrate() [​](#migrate)

> **migrate**(): `Promise`<`void`\>

Source: packages/storage/dist/index.d.mts:182

If there are migrations defined on the storage item, migrate to the latest version.

**This function is ran automatically whenever the extension updates**, so you don't have to call it manually.

#### Returns [​](#returns-2)

`Promise`<`void`\>

---

### removeMeta() [​](#removemeta)

> **removeMeta**(`properties?`): `Promise`<`void`\>

Source: packages/storage/dist/index.d.mts:170

Remove all metadata or certain properties from metadata.

#### Parameters [​](#parameters)

##### properties? [​](#properties-1)

`string`\[\]

#### Returns [​](#returns-3)

`Promise`<`void`\>

---

### removeValue() [​](#removevalue)

> **removeValue**(`opts?`): `Promise`<`void`\>

Source: packages/storage/dist/index.d.mts:168

Remove the value from storage.

#### Parameters [​](#parameters-1)

##### opts? [​](#opts)

[RemoveItemOptions](./RemoveItemOptions.html)

#### Returns [​](#returns-4)

`Promise`<`void`\>

---

### setMeta() [​](#setmeta)

> **setMeta**(`properties`): `Promise`<`void`\>

Source: packages/storage/dist/index.d.mts:166

Set metadata properties.

#### Parameters [​](#parameters-2)

##### properties [​](#properties-2)

`NullablePartial`<`TMetadata`\>

#### Returns [​](#returns-5)

`Promise`<`void`\>

---

### setValue() [​](#setvalue)

> **setValue**(`value`): `Promise`<`void`\>

Source: packages/storage/dist/index.d.mts:164

Set the value in storage.

#### Parameters [​](#parameters-3)

##### value [​](#value)

`TValue`

#### Returns [​](#returns-6)

`Promise`<`void`\>

---

### watch() [​](#watch)

> **watch**(`cb`): [Unwatch](./../type-aliases/Unwatch.html)

Source: packages/storage/dist/index.d.mts:172

Listen for changes to the value in storage.

#### Parameters [​](#parameters-4)

##### cb [​](#cb)

[WatchCallback](./../type-aliases/WatchCallback.html)<`TValue`\>

#### Returns [​](#returns-7)

[Unwatch](./../type-aliases/Unwatch.html)

---

### watchMeta() [​](#watchmeta)

> **watchMeta**(`cb`): [Unwatch](./../type-aliases/Unwatch.html)

Source: packages/storage/dist/index.d.mts:174

Listen for changes to the metadata in storage.

#### Parameters [​](#parameters-5)

##### cb [​](#cb-1)

[WatchCallback](./../type-aliases/WatchCallback.html)<`NullablePartial`<`TMetadata`\>>

#### Returns [​](#returns-8)

[Unwatch](./../type-aliases/Unwatch.html)

---

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)

## "Class: MatchPattern"

Source: https://wxt.dev/api/reference/wxt/utils/match-patterns/classes/MatchPattern

Are you an LLM? You can read better optimized documentation at /api/reference/wxt/utils/match-patterns/classes/MatchPattern.md for this page in Markdown format

[API](./../../../../packages.html) / [wxt/utils/match-patterns](./../) / MatchPattern

# Class: MatchPattern [​](#class-matchpattern)

Source: node\_modules/.bun/@webext-core+match-patterns@2.0.0/node\_modules/@webext-core/match-patterns/dist/index.d.mts:11

Class for parsing and performing operations on match patterns.

## Contents [​](#contents)

* [Example](#example)
* [Constructors](#constructors)  
   * [Constructor](#constructor)
* [Properties](#properties)  
   * [PROTOCOLS](#protocols)
* [Methods](#methods)  
   * [includes()](#includes)

## Example [​](#example)

```ts
const pattern = new MatchPattern('*://google.com/*');

  pattern.includes('https://google.com'); // true
  pattern.includes('http://youtube.com/watch?v=123'); // false
```

## Constructors [​](#constructors)

### Constructor [​](#constructor)

> **new MatchPattern**(`matchPattern`): `MatchPattern`

Source: node\_modules/.bun/@webext-core+match-patterns@2.0.0/node\_modules/@webext-core/match-patterns/dist/index.d.mts:23

Parse a match pattern string. If it is invalid, the constructor will throw an `InvalidMatchPattern` error.

#### Parameters [​](#parameters)

##### matchPattern [​](#matchpattern)

`string`

The match pattern to parse.

#### Returns [​](#returns)

`MatchPattern`

## Properties [​](#properties)

### PROTOCOLS [​](#protocols)

> `static` **PROTOCOLS**: `string`\[\]

Source: node\_modules/.bun/@webext-core+match-patterns@2.0.0/node\_modules/@webext-core/match-patterns/dist/index.d.mts:12

## Methods [​](#methods)

### includes() [​](#includes)

> **includes**(`url`): `boolean`

Source: node\_modules/.bun/@webext-core+match-patterns@2.0.0/node\_modules/@webext-core/match-patterns/dist/index.d.mts:25

Check if a URL is included in a pattern.

#### Parameters [​](#parameters-1)

##### url [​](#url)

`string` | `URL` | `Location`

#### Returns [​](#returns-1)

`boolean`

---

Generated using [typedoc-plugin-markdown](https://www.npmjs.com/package/typedoc-plugin-markdown) and [TypeDoc](https://typedoc.org/)
