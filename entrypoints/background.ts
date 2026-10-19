type ActionTab = {
  id?: number
  url?: string
  title?: string
}

type ActionApi = {
  onClicked: {
    addListener: (callback: (tab: ActionTab) => void) => void
  }
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

async function toggleOverlay(tab: ActionTab) {
  if (tab.id == null) return

  if (!tab.url) {
    await openRestrictedWindow()
    return
  }

  const params = new URLSearchParams({
    url: tab.url,
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
    // chrome://、扩展页、PDF 阅读器等无法注入的页面
    await openRestrictedWindow()
  }
}

export default defineBackground(() => {
  const action = (browser as unknown as { action?: ActionApi }).action
  action?.onClicked.addListener((tab) => {
    void toggleOverlay(tab)
  })
})
