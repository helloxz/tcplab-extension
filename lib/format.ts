import type { Locale, Translate } from '@/lib/i18n'
import type { IpLookupResult } from '@/lib/api/types'

function intlLocale(locale: Locale): string {
  return locale === 'zh' ? 'zh-CN' : 'en-US'
}

/**
 * 拼接 IP 归属地的紧凑文案，例如「中国 浙江 杭州 · 阿里公共DNS(AliDNS)」。
 * 后端返回的名称可能省市同名（如北京 / 北京），去掉相邻重复项避免啰嗦。
 */
export function formatIpLocation(
  geo: Pick<IpLookupResult, 'countryName' | 'province' | 'city' | 'district' | 'isp'>,
): string {
  const parts: string[] = []
  for (const value of [geo.countryName, geo.province, geo.city, geo.district]) {
    const text = value.trim()
    if (text && parts[parts.length - 1] !== text) parts.push(text)
  }

  const place = parts.join(' ')
  const isp = geo.isp.trim()
  if (!isp) return place
  return place ? `${place} · ${isp}` : isp
}

/**
 * 计算从创建日期到现在的完整月数；无效或未来日期返回 null。
 * 按日历月计算（而不是 days / 30），避免跨月误差。
 */
export function domainAgeMonths(
  created: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!created) return null

  const date = new Date(created)
  if (Number.isNaN(date.getTime()) || date.getTime() > now.getTime()) return null

  let months = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())
  if (now.getDate() < date.getDate()) months -= 1
  return Math.max(0, months)
}

/** 域名年龄文案：不足 1 个月 / N 个月 / N 年（满 12 个月进位为年） */
export function formatDomainAge(
  created: string | null | undefined,
  t: Translate,
  now: Date = new Date(),
): string {
  const months = domainAgeMonths(created, now)
  if (months === null) return ''
  if (months < 1) return t('whois.ageLessThanMonth')
  if (months < 12) return t(months === 1 ? 'whois.ageMonth' : 'whois.ageMonths', { months })

  const years = Math.floor(months / 12)
  return t(years === 1 ? 'whois.ageYear' : 'whois.ageYears', { years })
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

export function formatRetryAfter(seconds: number | null | undefined, t: Translate): string {
  if (seconds == null || seconds <= 0) return ''
  if (seconds >= 3600) return t('errors.retryLater')
  if (seconds >= 60) return t('errors.retryMinutes', { minutes: Math.ceil(seconds / 60) })
  return t('errors.retrySeconds', { seconds })
}
