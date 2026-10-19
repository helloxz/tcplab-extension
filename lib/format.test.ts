import { describe, expect, it } from 'vitest'
import type { Translate } from '@/lib/i18n'
import { domainAgeMonths, formatDomainAge, formatIpLocation } from './format'

function geo(overrides: Partial<Parameters<typeof formatIpLocation>[0]> = {}) {
  return {
    countryName: '',
    province: '',
    city: '',
    district: '',
    isp: '',
    ...overrides,
  }
}

describe('formatIpLocation', () => {
  it('joins place names and ISP', () => {
    expect(formatIpLocation(geo({
      countryName: '中国',
      province: '浙江',
      city: '杭州',
      isp: '阿里公共DNS(AliDNS)',
    }))).toBe('中国 浙江 杭州 · 阿里公共DNS(AliDNS)')
  })

  it('drops adjacent duplicate names', () => {
    expect(formatIpLocation(geo({
      countryName: '中国',
      province: '北京',
      city: '北京',
      district: '北京',
    }))).toBe('中国 北京')
  })

  it('returns only the place when ISP is missing', () => {
    expect(formatIpLocation(geo({ countryName: 'Australia' }))).toBe('Australia')
  })

  it('returns only the ISP when place is missing', () => {
    expect(formatIpLocation(geo({ isp: '114DNS' }))).toBe('114DNS')
  })

  it('returns an empty string when every field is empty', () => {
    expect(formatIpLocation(geo())).toBe('')
  })
})

const t = ((key: string, params?: Record<string, string | number>) => {
  if (key === 'whois.ageLessThanMonth') return '<1m'
  if (key === 'whois.ageMonth' || key === 'whois.ageMonths') return `${params?.months}m`
  if (key === 'whois.ageYear' || key === 'whois.ageYears') return `${params?.years}y`
  return key
}) as Translate

describe('domainAgeMonths', () => {
  const now = new Date(2026, 9, 19, 12)

  it('counts full calendar months', () => {
    expect(domainAgeMonths('2025-11-19T12:00:00', now)).toBe(11)
    expect(domainAgeMonths('2025-10-19T12:00:00', now)).toBe(12)
    expect(domainAgeMonths('2026-09-19T12:00:00', now)).toBe(1)
    expect(domainAgeMonths('2026-09-20T12:00:00', now)).toBe(0)
    expect(domainAgeMonths('2026-10-01T12:00:00', now)).toBe(0)
  })

  it('returns null for missing, invalid or future dates', () => {
    expect(domainAgeMonths(null, now)).toBeNull()
    expect(domainAgeMonths('not-a-date', now)).toBeNull()
    expect(domainAgeMonths('2026-10-20T12:00:00', now)).toBeNull()
  })
})

describe('formatDomainAge', () => {
  const now = new Date(2026, 9, 19, 12)

  it('uses months below one year and whole years from twelve months', () => {
    expect(formatDomainAge('2026-10-01T12:00:00', t, now)).toBe('<1m')
    expect(formatDomainAge('2025-11-19T12:00:00', t, now)).toBe('11m')
    expect(formatDomainAge('2025-10-19T12:00:00', t, now)).toBe('1y')
    expect(formatDomainAge('2010-05-01T12:00:00', t, now)).toBe('16y')
  })

  it('returns an empty string for unusable dates', () => {
    expect(formatDomainAge(null, t, now)).toBe('')
    expect(formatDomainAge('not-a-date', t, now)).toBe('')
  })
})
