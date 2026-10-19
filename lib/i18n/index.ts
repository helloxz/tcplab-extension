import { onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { storage } from 'wxt/utils/storage'
import { en, type MessageKey } from './messages/en'
import { zh } from './messages/zh'

export type { MessageKey } from './messages/en'

export type Locale = 'zh' | 'en'
export type LocalePreference = 'auto' | Locale
export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string

/** 手动设置优先；auto 表示每次按浏览器语言判断 */
export const localePreference = storage.defineItem<LocalePreference>('local:locale', {
  fallback: 'auto',
})

const messages = {
  en,
  zh,
} satisfies Record<Locale, Record<MessageKey, string>>

/** 只有中文（zh、zh-CN、zh-TW…）走中文，其余一律英文 */
export function detectLocale(): Locale {
  const uiLanguage = typeof browser !== 'undefined' ? browser.i18n?.getUILanguage?.() : ''
  const raw = uiLanguage
    || (typeof navigator !== 'undefined' ? navigator.language : '')
    || 'en'
  return raw.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export async function resolveLocale(preference?: LocalePreference): Promise<Locale> {
  const value = preference ?? (await localePreference.getValue())
  return value === 'auto' ? detectLocale() : value
}

export function translate(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  let text = messages[locale][key] ?? messages.en[key] ?? key
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}

export function useI18n() {
  const preference = ref<LocalePreference>('auto')
  const locale = ref<Locale>('en')
  let unwatch: (() => void) | undefined

  function apply(next: LocalePreference) {
    preference.value = next
    locale.value = next === 'auto' ? detectLocale() : next
  }

  onMounted(async () => {
    apply(await localePreference.getValue())
    unwatch = localePreference.watch((next) => apply(next))
  })

  onUnmounted(() => {
    unwatch?.()
  })

  watchEffect(() => {
    document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en'
  })

  function t(key: MessageKey, params?: Record<string, string | number>) {
    return translate(locale.value, key, params)
  }

  async function setPreference(next: LocalePreference) {
    apply(next)
    await localePreference.setValue(next)
  }

  return { locale, preference, t, setPreference }
}
