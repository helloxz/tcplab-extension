import type { Locale, Translate } from '@/lib/i18n'

function intlLocale(locale: Locale): string {
  return locale === 'zh' ? 'zh-CN' : 'en-US'
}

export function formatDate(value: string | null | undefined, locale: Locale): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatTime(timestamp: number, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function formatDuration(ms: number): string {
  return `${Math.round(ms)} ms`
}

export function formatRetryAfter(seconds: number | null | undefined, t: Translate): string {
  if (seconds == null || seconds <= 0) return ''
  if (seconds >= 3600) return t('errors.retryLater')
  if (seconds >= 60) return t('errors.retryMinutes', { minutes: Math.ceil(seconds / 60) })
  return t('errors.retrySeconds', { seconds })
}
