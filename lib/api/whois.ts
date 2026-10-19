import { parseRetryAfter } from './client'
import type { WhoisDsRecord, WhoisNameserver, WhoisRegistrar, WhoisResult } from './types'

const WHOIS_BASE = 'https://whois.tcp.lc/v1/whois'
const TIMEOUT_MS = 20_000

export type WhoisErrorKind =
  | 'invalid'
  | 'unsupported'
  | 'rateLimited'
  | 'timeout'
  | 'unavailable'

export class WhoisError extends Error {
  readonly kind: WhoisErrorKind
  readonly key: string
  readonly retryAfter: number | null

  constructor(kind: WhoisErrorKind, retryAfter: number | null = null) {
    super(kind)
    this.name = 'WhoisError'
    this.kind = kind
    this.key = `whois.error.${kind}`
    this.retryAfter = retryAfter
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function asNullableString(value: unknown): string | null {
  const text = asString(value).trim()
  return text || null
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(asString).filter(Boolean) : []
}

function normalizeRegistrar(input: unknown): WhoisRegistrar {
  const record = isRecord(input) ? input : {}
  return {
    name: asNullableString(record.name),
    ianaId: asNullableString(record.ianaId),
    url: asNullableString(record.url),
    whoisServer: asNullableString(record.whoisServer),
    abuseEmail: asNullableString(record.abuseEmail),
    abusePhone: asNullableString(record.abusePhone),
    reseller: asNullableString(record.reseller),
  }
}

function normalizeNameserver(input: unknown): WhoisNameserver {
  const record = isRecord(input) ? input : {}
  return {
    name: asString(record.name),
    ipv4: asStringArray(record.ipv4),
    ipv6: asStringArray(record.ipv6),
  }
}

function normalizeDsRecord(input: unknown): WhoisDsRecord | null {
  if (!isRecord(input)) return null
  const digest = asString(input.digest)
  if (!digest) return null
  return {
    keyTag: asString(input.keyTag),
    algorithm: asString(input.algorithm),
    digestType: asString(input.digestType),
    digest,
  }
}

function normalizeResult(input: Record<string, unknown>): WhoisResult {
  const registrar = isRecord(input.registrar) ? input.registrar : {}
  const dnssec = isRecord(input.dnssec) ? input.dnssec : {}
  const dates = isRecord(input.dates) ? input.dates : {}
  const meta = isRecord(input.meta) ? input.meta : {}

  const nameservers = Array.isArray(input.nameservers)
    ? input.nameservers.map(normalizeNameserver).filter((item) => item.name)
    : []
  const dsData = Array.isArray(dnssec.dsData)
    ? dnssec.dsData.map(normalizeDsRecord).filter((item): item is WhoisDsRecord => item !== null)
    : []

  return {
    query: asString(input.query),
    domain: asString(input.domain),
    domainUnicode: asNullableString(input.domainUnicode),
    id: asNullableString(input.id),
    tld: asString(input.tld),
    isRegistered: input.isRegistered === true,
    registrar: normalizeRegistrar(registrar),
    status: asStringArray(input.status),
    nameservers,
    dnssec: {
      signed: dnssec.signed === true,
      dsData,
    },
    dates: {
      created: asNullableString(dates.created),
      updated: asNullableString(dates.updated),
      expires: asNullableString(dates.expires),
    },
    meta: {
      source: asString(meta.source),
      server: asNullableString(meta.server),
      fetchedAt: asNullableString(meta.fetchedAt),
      cached: meta.cached === true,
    },
  }
}

function errorKindFor(status: number, body: unknown): WhoisErrorKind {
  const code = isRecord(body) && isRecord(body.error) ? asString(body.error.code) : ''

  switch (code) {
    case 'INVALID_DOMAIN':
      return 'invalid'
    case 'UNSUPPORTED_TLD':
      return 'unsupported'
    case 'RATE_LIMITED':
      return 'rateLimited'
    case 'UPSTREAM_TIMEOUT':
      return 'timeout'
  }

  if (status === 400) return 'invalid'
  if (status === 429) return 'rateLimited'
  if (status === 501) return 'unsupported'
  if (status === 504) return 'timeout'
  return 'unavailable'
}

/** WHOIS 使用真实 HTTP 状态码，不走 /api/v2 的 code 信封 */
export async function lookupWhois(hostname: string): Promise<WhoisResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${WHOIS_BASE}/${encodeURIComponent(hostname)}`, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
    const retryAfter = parseRetryAfter(res)

    const text = await res.text()
    let body: unknown = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      // 边缘限流可能是纯文本，body 保持 null
    }

    if (!res.ok) {
      throw new WhoisError(errorKindFor(res.status, body), retryAfter)
    }
    if (!isRecord(body)) {
      throw new WhoisError('unavailable', retryAfter)
    }

    return normalizeResult(body)
  } catch (err) {
    if (err instanceof WhoisError) throw err
    if (typeof err === 'object' && err !== null && 'name' in err && err.name === 'AbortError') {
      throw new WhoisError('timeout')
    }
    throw new WhoisError('unavailable')
  } finally {
    clearTimeout(timer)
  }
}
