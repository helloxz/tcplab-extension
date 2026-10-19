import ipaddr from 'ipaddr.js'

export type UnsupportedReason = 'blank' | 'internal' | 'local' | 'invalid'

export interface SiteTarget {
  kind: 'supported'
  url: URL
  hostname: string
  protocol: 'http:' | 'https:'
  port: number | null
  isIp: boolean
  ipVersion: 4 | 6 | null
}

export type SiteClassification =
  | SiteTarget
  | { kind: 'unsupported'; reason: UnsupportedReason }

const BLANK_URLS = new Set(['about:blank', 'about:newtab', 'about:home'])

const INTERNAL_SCHEMES = new Set([
  'about:',
  'chrome:',
  'edge:',
  'brave:',
  'opera:',
  'vivaldi:',
  'chrome-extension:',
  'moz-extension:',
  'safari-extension:',
  'view-source:',
  'data:',
  'blob:',
  'javascript:',
  'filesystem:',
  'ws:',
  'wss:',
  'ftp:',
])

/** 常见本地 / 内网域名后缀；单标签主机名也按内网处理 */
const LOCAL_SUFFIXES = [
  '.localhost',
  '.local',
  '.internal',
  '.lan',
  '.home',
  '.corp',
  '.intranet',
  '.private',
  '.test',
  '.example',
  '.invalid',
]

const BLOCKED_IP_RANGES = new Set([
  'private',
  'loopback',
  'linkLocal',
  'carrierGradeNat',
  'uniqueLocal',
  'unspecified',
  'multicast',
  'reserved',
  'broadcast',
])

function normalizeHostname(hostname: string): string {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
}

function isLocalHostname(hostname: string): boolean {
  if (hostname === 'localhost') return true
  if (LOCAL_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) return true
  // 没有点的主机名（如 http://router）几乎都是内网
  return !hostname.includes('.')
}

function parseIp(hostname: string): ipaddr.IPv4 | ipaddr.IPv6 | null {
  try {
    return ipaddr.parse(hostname)
  } catch {
    return null
  }
}

function isBlockedIp(ip: ipaddr.IPv4 | ipaddr.IPv6): boolean {
  const range = ip.range()
  if (range === 'ipv4Mapped') {
    return isBlockedIp((ip as ipaddr.IPv6).toIPv4Address())
  }
  return BLOCKED_IP_RANGES.has(range)
}

/**
 * 判断当前 tab 是否属于可以读取的公网页面。
 * 该判断完全在本地完成：内网/本地地址不会被发送到任何 API。
 */
export function classifyUrl(raw: string | undefined | null): SiteClassification {
  if (!raw) return { kind: 'unsupported', reason: 'blank' }
  if (BLANK_URLS.has(raw)) return { kind: 'unsupported', reason: 'blank' }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { kind: 'unsupported', reason: 'invalid' }
  }

  if (url.protocol === 'about:') {
    return { kind: 'unsupported', reason: 'internal' }
  }
  if (url.protocol === 'file:') {
    return { kind: 'unsupported', reason: 'local' }
  }
  if (INTERNAL_SCHEMES.has(url.protocol)) {
    return { kind: 'unsupported', reason: 'internal' }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { kind: 'unsupported', reason: 'internal' }
  }

  const hostname = normalizeHostname(url.hostname)
  if (!hostname) return { kind: 'unsupported', reason: 'invalid' }

  // 先判断 IP，再做“无点主机名=内网”的判断；否则公网 IPv6 会被误判
  const ip = parseIp(hostname)
  if (ip) {
    if (isBlockedIp(ip)) return { kind: 'unsupported', reason: 'local' }
    return {
      kind: 'supported',
      url,
      hostname,
      protocol: url.protocol,
      port: url.port ? Number(url.port) : null,
      isIp: true,
      ipVersion: ip.kind() === 'ipv4' ? 4 : 6,
    }
  }

  if (isLocalHostname(hostname)) return { kind: 'unsupported', reason: 'local' }

  return {
    kind: 'supported',
    url,
    hostname,
    protocol: url.protocol,
    port: url.port ? Number(url.port) : null,
    isIp: false,
    ipVersion: null,
  }
}
