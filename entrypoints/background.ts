import { classifyUrl, type UnsupportedReason } from '@/lib/site/url'

type ActionTab = {
  id?: number
  url?: string
  title?: string
}

type ActionApi = {
  onClicked: {
    addListener: (callback: (tab: ActionTab) => void) => void
  }
  setPopup?: (details: { tabId: number; popup: string }) => Promise<void>
  openPopup?: (options?: { windowId?: number }) => Promise<void>
}

type RestrictedReason = UnsupportedReason | 'restricted'

function getAction(): ActionApi | undefined {
  return (browser as unknown as { action?: ActionApi }).action
}

/**
 * 在页面内注入/移除悬浮 iframe。
 * 该函数会被 scripting.executeScript 序列化到页面执行，不能引用外部变量。
 */
function toggleOverlayInPage(overlayUrl: string) {
  const ID = 'tcplab-extension-overlay-frame'
  const win = window as Window & { __tcplabOverlayCleanup?: () => void }
  const existing = document.getElementById(ID)

  if (existing) {
    existing.remove()
    win.__tcplabOverlayCleanup?.()
    delete win.__tcplabOverlayCleanup
    return
  }

  const iframe = document.createElement('iframe')
  iframe.id = ID
  iframe.src = overlayUrl
  iframe.title = 'TCPLab'
  iframe.setAttribute('allow', 'clipboard-write')

  const styles: Record<string, string> = {
    position: 'fixed',
    top: '0',
    right: '0',
    width: 'min(460px, 100vw)',
    height: '100vh',
    border: '0',
    'border-left': '1px solid rgba(13, 13, 12, 0.12)',
    'box-shadow': '-12px 0 32px rgba(13, 13, 12, 0.14)',
    'z-index': '2147483647',
    background: '#fafaf9',
    'color-scheme': 'light',
  }
  for (const [key, value] of Object.entries(styles)) {
    iframe.style.setProperty(key, value, 'important')
  }

  const onMessage = (event: MessageEvent) => {
    if (event.source !== iframe.contentWindow) return
    if (event.data && event.data.type === 'tcplab:close') {
      iframe.remove()
      window.removeEventListener('message', onMessage)
      delete win.__tcplabOverlayCleanup
    }
  }

  window.addEventListener('message', onMessage)
  win.__tcplabOverlayCleanup = () => {
    window.removeEventListener('message', onMessage)
    delete win.__tcplabOverlayCleanup
  }

  document.documentElement.appendChild(iframe)
}

/**
 * 兜底提示：Chrome 127 以下或 action popup 被浏览器拒绝时使用。
 */
async function openRestrictedWindow() {
  const url = browser.runtime.getURL('/overlay.html?error=restricted')

  try {
    await browser.windows.create({
      url,
      type: 'popup',
      width: 420,
      height: 640,
    })
  } catch {
    await browser.tabs.create({ url })
  }
}

/**
 * 清掉当前 tab 的临时 popup。
 * per-tab popup 会跨导航保留（后台可能已重启），所以无条件清一次最稳妥；
 * 对没有 popup 的 tab 传入空字符串是 no-op。
 */
async function clearRestrictedPopup(tabId: number) {
  try {
    await getAction()?.setPopup?.({ tabId, popup: '' })
  } catch {
    // tab 可能已经关闭
  }
}

function restrictedReason(tab: ActionTab): RestrictedReason {
  if (!tab.url) return 'restricted'
  const site = classifyUrl(tab.url)
  return site.kind === 'unsupported' ? site.reason : 'restricted'
}

/** 只有 http/https 页面才可能注入悬浮层 */
function isInjectableUrl(raw: string | undefined): raw is string {
  if (!raw) return false
  try {
    const { protocol } = new URL(raw)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * 在工具栏图标下方弹出受限提示。
 * manifest 不能设置 default_popup（否则 onClicked 不再触发），
 * 因此只在需要时给当前 tab 临时注册 popup，再用 openPopup 打开。
 */
async function showRestrictedPopup(tab: ActionTab, reason: RestrictedReason) {
  const tabId = tab.id
  const action = getAction()

  if (tabId == null || !action?.setPopup || !action.openPopup) {
    await openRestrictedWindow()
    return
  }

  const params = new URLSearchParams({ reason })

  try {
    await action.setPopup({ tabId, popup: `/restricted.html?${params.toString()}` })
    await action.openPopup()
  } catch {
    await clearRestrictedPopup(tabId)
    await openRestrictedWindow()
  }
}

async function toggleOverlay(tab: ActionTab) {
  if (tab.id == null) return

  const url = tab.url
  if (!isInjectableUrl(url)) {
    // 浏览器内部页、空白页、file:// 等注定无法注入，不必先试一次 executeScript
    await showRestrictedPopup(tab, restrictedReason(tab))
    return
  }

  const params = new URLSearchParams({
    url,
    title: tab.title ?? '',
  })
  const overlayUrl = browser.runtime.getURL(`/overlay.html?${params.toString()}`)

  try {
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: toggleOverlayInPage,
      args: [overlayUrl],
    })
  } catch {
    // 应用商店、PDF 阅读器等 https 页面同样拒绝注入
    await showRestrictedPopup(tab, restrictedReason(tab))
  }
}

export default defineBackground(() => {
  const action = getAction()

  action?.onClicked.addListener((tab) => {
    void toggleOverlay(tab)
  })

  // per-tab popup 会跨导航保留：切换 tab 或发生导航后清掉，
  // 否则该 tab 后续点击会被 popup 拦截，无法再走 onClicked。
  // 只响应真正的导航（status=loading / url 变化），避免标题、图标更新误清。
  browser.tabs.onActivated.addListener(({ tabId }) => {
    void clearRestrictedPopup(tabId)
  })
  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading' || changeInfo.url) {
      void clearRestrictedPopup(tabId)
    }
  })
})
