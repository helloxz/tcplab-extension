import { describe, expect, it } from 'vitest'
import type { DnsDomainResult, TlsCheckResult, WhoisResult } from '@/lib/api/types'
import { computeAudit, gradeForScore } from './audit'

const now = new Date(2026, 9, 19, 12)

function dns(overrides: Partial<DnsDomainResult> = {}): DnsDomainResult {
  return {
    name: 'example.com',
    server: { key: 'cloudflare', label: 'Cloudflare', ip: '1.1.1.1' },
    elapsed: 10,
    a: [{ name: 'example.com', type: 'A', ttl: 300, value: '1.2.3.4' }],
    aaaa: [{ name: 'example.com', type: 'AAAA', ttl: 300, value: '2001:db8::1' }],
    ...overrides,
  }
}

function tls(): TlsCheckResult {
  return {
    host: 'example.com',
    targetType: 'domain',
    port: 443,
    ip: '1.2.3.4',
    addresses: ['1.2.3.4'],
    elapsed: 10,
    connection: {
      version: 'TLSv1.3',
      cipher: 'TLS_AES_128_GCM_SHA256',
      forwardSecrecy: true,
      alpn: 'h2',
      http2: true,
    },
    certificate: {
      subject: 'CN=example.com',
      issuer: 'Test CA',
      validFrom: '2026-01-01T00:00:00Z',
      validTo: '2027-01-01T00:00:00Z',
      daysRemaining: 100,
      san: ['example.com'],
      publicKeyAlgorithm: 'RSA',
      publicKeyBits: 2048,
      publicKeyCurve: null,
    },
    validation: { valid: true, issues: [], errorCode: null },
  }
}

function whois(overrides: Partial<WhoisResult> = {}): WhoisResult {
  return {
    query: 'example.com',
    domain: 'example.com',
    domainUnicode: null,
    id: null,
    tld: 'com',
    isRegistered: true,
    registrar: {
      name: 'Example Registrar',
      ianaId: null,
      url: null,
      whoisServer: null,
      abuseEmail: null,
      abusePhone: null,
      reseller: null,
    },
    status: ['clientTransferProhibited'],
    nameservers: [{ name: 'ns1.example.com', ipv4: [], ipv6: [] }],
    dnssec: { signed: true, dsData: [] },
    dates: {
      created: '2010-01-01T00:00:00Z',
      updated: null,
      expires: '2028-01-01T00:00:00Z',
    },
    meta: { source: 'rdap', server: null, fetchedAt: null },
    ...overrides,
  }
}

describe('computeAudit', () => {
  it('scores a fully modern, valid site at 100 / S', () => {
    const result = computeAudit({ dns: dns(), whois: whois(), tls: tls(), now })
    expect(result).toMatchObject({
      score: 100,
      grade: 'S',
      partial: false,
      capReason: null,
    })
  })

  it('caps an invalid certificate at C', () => {
    const cert = tls()
    cert.validation.valid = false
    const result = computeAudit({ dns: dns(), whois: whois(), tls: cert, now })
    expect(result).toMatchObject({ score: 80, grade: 'C', capReason: 'invalid-cert' })
  })

  it('returns null when TLS data is unavailable', () => {
    expect(computeAudit({ dns: dns(), whois: whois(), tls: null, now })).toBeNull()
  })

  it('penalizes missing WHOIS data and marks the result partial', () => {
    const result = computeAudit({ dns: dns(), whois: null, tls: tls(), now })
    expect(result).toMatchObject({ score: 75, grade: 'B', partial: true })
  })

  it('treats TLS 1.2 as acceptable but not perfect', () => {
    const connection = tls()
    connection.connection.version = 'TLSv1.2'
    expect(computeAudit({ dns: dns(), whois: whois(), tls: connection, now })?.score).toBe(97)
  })

  it('scores certificate expiry in tiers', () => {
    const cases: Array<[number, number]> = [
      [100, 10],
      [45, 7],
      [10, 3],
      [-1, 0],
    ]
    for (const [days, expected] of cases) {
      const cert = tls()
      cert.certificate.daysRemaining = days
      const result = computeAudit({ dns: dns(), whois: whois(), tls: cert, now })
      expect(result?.checks.find(check => check.id === 'certExpiry')?.earned).toBe(expected)
    }
  })

  it('scores domain age in tiers', () => {
    const cases: Array<[string, number]> = [
      ['2020-01-01T00:00:00Z', 5],
      ['2023-01-01T00:00:00Z', 4],
      ['2025-01-01T00:00:00Z', 2],
      ['2026-01-01T00:00:00Z', 1],
    ]
    for (const [created, expected] of cases) {
      const result = computeAudit({
        dns: dns(),
        whois: whois({ dates: { created, updated: null, expires: '2028-01-01T00:00:00Z' } }),
        tls: tls(),
        now,
      })
      expect(result?.checks.find(check => check.id === 'domainAge')?.earned).toBe(expected)
    }
  })

  it('scores domain expiry in tiers', () => {
    const cases: Array<[string, number]> = [
      ['2028-01-01T00:00:00Z', 10],
      ['2027-06-01T00:00:00Z', 7],
      ['2027-01-01T00:00:00Z', 3],
      ['2026-11-01T00:00:00Z', 0],
    ]
    for (const [expires, expected] of cases) {
      const result = computeAudit({
        dns: dns(),
        whois: whois({ dates: { created: '2010-01-01T00:00:00Z', updated: null, expires } }),
        tls: tls(),
        now,
      })
      expect(result?.checks.find(check => check.id === 'domainExpiry')?.earned).toBe(expected)
    }
  })

  it('penalizes hold / pending-delete domain statuses', () => {
    const result = computeAudit({
      dns: dns(),
      whois: whois({ status: ['clientHold'] }),
      tls: tls(),
      now,
    })
    expect(result?.checks.find(check => check.id === 'domainStatus')?.earned).toBe(0)
  })

  it('does not award IPv6 points without an AAAA record', () => {
    const result = computeAudit({ dns: dns({ aaaa: [] }), whois: whois(), tls: tls(), now })
    expect(result?.checks.find(check => check.id === 'ipv6')?.earned).toBe(0)
  })

  it('uses the browser-measured protocol for the HTTP/2 check when available', () => {
    const backendOnlyHttp1 = tls()
    backendOnlyHttp1.connection.http2 = false
    backendOnlyHttp1.connection.alpn = 'http/1.1'

    const h3 = computeAudit({
      dns: dns(),
      whois: whois(),
      tls: backendOnlyHttp1,
      httpProtocol: 'h3',
      now,
    })
    expect(h3?.checks.find(check => check.id === 'http2')?.earned).toBe(10)

    const h1 = computeAudit({
      dns: dns(),
      whois: whois(),
      tls: tls(),
      httpProtocol: 'http/1.1',
      now,
    })
    expect(h1?.checks.find(check => check.id === 'http2')?.earned).toBe(0)
  })
})

describe('gradeForScore', () => {
  it('uses the six grade thresholds', () => {
    expect(gradeForScore(95)).toBe('S')
    expect(gradeForScore(94)).toBe('A')
    expect(gradeForScore(85)).toBe('A')
    expect(gradeForScore(84)).toBe('B')
    expect(gradeForScore(70)).toBe('B')
    expect(gradeForScore(69)).toBe('C')
    expect(gradeForScore(55)).toBe('C')
    expect(gradeForScore(54)).toBe('D')
    expect(gradeForScore(40)).toBe('D')
    expect(gradeForScore(39)).toBe('F')
  })
})
