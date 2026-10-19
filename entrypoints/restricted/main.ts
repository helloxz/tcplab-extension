import { en, type MessageKey } from '@/lib/i18n/messages/en'
import { zh } from '@/lib/i18n/messages/zh'
import type { UnsupportedReason } from '@/lib/site/url'

/** 后台通过 query 传入；没有 url 可用时统一用 restricted */
type RestrictedReason = UnsupportedReason | 'restricted'

type Locale = 'zh' | 'en'

const reasonKeys: Record<RestrictedReason, MessageKey> = {
  blank: 'popup.unsupported.blank',
  internal: 'popup.unsupported.internal',
  local: 'popup.unsupported.local',
  invalid: 'popup.unsupported.invalid',
  restricted: 'overlay.restricted',
}

const messages = { en, zh } satisfies Record<Locale, Record<MessageKey, string>>

function getBrowserApi() {
  return typeof browser === 'undefined' ? undefined : browser
}

function isRestrictedReason(value: string): value is RestrictedReason {
  return value in reasonKeys
}

function resolveLocale(preference: unknown): Locale {
  if (preference === 'zh' || preference === 'en') return preference

  const raw = getBrowserApi()?.i18n?.getUILanguage?.() || navigator.language || 'en'
  return raw.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

/** 与 lib/i18n 的 useI18n 保持一致：读取 storage.local 的 locale */
async function getLocalePreference(): Promise<unknown> {
  try {
    const stored = await getBrowserApi()?.storage?.local?.get('locale')
    return stored?.locale
  } catch {
    return undefined
  }
}

async function render() {
  const reasonParam = new URLSearchParams(window.location.search).get('reason') ?? ''
  const reason: RestrictedReason = isRestrictedReason(reasonParam) ? reasonParam : 'restricted'

  const locale = resolveLocale(await getLocalePreference())
  const dict = messages[locale]

  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'

  const title = document.querySelector<HTMLElement>('[data-title]')
  const description = document.querySelector<HTMLElement>('[data-description]')

  if (title) title.textContent = dict['popup.unsupported.title']
  if (description) description.textContent = dict[reasonKeys[reason]]
}

void render()
