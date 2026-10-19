import type { DnsDomainResult, TlsCheckResult, WhoisResult } from '@/lib/api/types'
import { domainAgeMonths } from './format'
import { isHttp2OrH3, parseHttpProtocol } from './http-protocol'
import { tlsVersionGrade } from './tls-grade'

export type AuditGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

/** 触发段位封顶的原因 */
export type AuditCapReason = 'invalid-cert'

export type AuditCheckId =
  | 'https'
  | 'certificate'
  | 'certExpiry'
  | 'tlsVersion'
  | 'forwardSecrecy'
  | 'http2'
  | 'ipv6'
  | 'dnssec'
  | 'domainAge'
  | 'domainStatus'
  | 'domainExpiry'

export interface AuditCheck {
  id: AuditCheckId
  earned: number
  max: number
  /** 数据缺失，按 0 分计入，并提示评分不完整 */
  missing: boolean
}

export interface AuditResult {
  score: number
  grade: AuditGrade
  capReason: AuditCapReason | null
  checks: AuditCheck[]
  /** 是否有检查项因数据缺失未得分 */
  partial: boolean
}

export interface AuditInput {
  dns: DnsDomainResult | null
  whois: WhoisResult | null
  tls: TlsCheckResult | null
  /** 浏览器实测的应用层协议；优先于后端探测的 http2 */
  httpProtocol?: string | null
  now?: Date
}

const GRADES: readonly AuditGrade[] = ['S', 'A', 'B', 'C', 'D', 'F']

/** 6 档段位，与 tcp.lc 深度检测报告保持一致 */
export function gradeForScore(score: number): AuditGrade {
  if (score >= 95) return 'S'
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

/** 取两个段位中较差的一个，用于封顶 */
function capAt(grade: AuditGrade, cap: AuditGrade): AuditGrade {
  return GRADES.indexOf(grade) > GRADES.indexOf(cap) ? grade : cap
}

function daysUntil(iso: string | null | undefined, now: Date): number | null {
  if (!iso) return null
  const time = Date.parse(iso)
  if (Number.isNaN(time)) return null
  return Math.floor((time - now.getTime()) / 86_400_000)
}

const BAD_STATUSES = new Set([
  'clienthold',
  'serverhold',
  'pendingdelete',
  'pendingtransfer',
  'redemptionperiod',
  'pendingrestore',
])

/**
 * 扩展内的简易评级：基于当前页面已加载的 DNS / WHOIS / TLS 数据，满分 100。
 *
 * 权重合计 100；缺失项按 0 分计入并标记 partial，避免用少量数据折算出一
 * 个虚高的总分。TLS 数据完全缺失时返回 null，由调用方展示“无法评级”。
 */
export function computeAudit(input: AuditInput): AuditResult | null {
  const { dns, whois, tls } = input
  if (!tls) return null

  const now = input.now ?? new Date()
  const checks: AuditCheck[] = []

  // —— TLS：安全核心 ——
  checks.push({ id: 'https', earned: 10, max: 10, missing: false })
  checks.push({ id: 'certificate', earned: tls.validation.valid ? 20 : 0, max: 20, missing: false })

  const daysRemaining = tls.certificate.daysRemaining
  const certExpiry = daysRemaining > 60 ? 10 : daysRemaining > 30 ? 7 : daysRemaining > 0 ? 3 : 0
  checks.push({ id: 'certExpiry', earned: certExpiry, max: 10, missing: false })

  const versionGrade = tlsVersionGrade(tls.connection.version)
  const versionPoints = versionGrade === 'modern' ? 10 : versionGrade === 'acceptable' ? 7 : 0
  checks.push({ id: 'tlsVersion', earned: versionPoints, max: 10, missing: versionGrade === 'unknown' })

  checks.push({
    id: 'forwardSecrecy',
    earned: tls.connection.forwardSecrecy ? 10 : 0,
    max: 10,
    missing: false,
  })
  const modernHttp = parseHttpProtocol(input.httpProtocol) === 'unknown'
    ? tls.connection.http2
    : isHttp2OrH3(input.httpProtocol)
  checks.push({ id: 'http2', earned: modernHttp ? 10 : 0, max: 10, missing: false })

  // —— DNS：IPv6 ——
  checks.push({
    id: 'ipv6',
    earned: dns ? (dns.aaaa.length > 0 ? 5 : 0) : 0,
    max: 5,
    missing: !dns,
  })

  // —— WHOIS：域名年龄 / DNSSEC / 状态 / 到期时间 ——
  const domain = whois?.isRegistered ? whois : null

  checks.push({
    id: 'dnssec',
    earned: domain?.dnssec.signed ? 5 : 0,
    max: 5,
    missing: !domain,
  })

  const ageMonths = domain ? domainAgeMonths(domain.dates.created, now) : null
  const agePoints = ageMonths === null
    ? 0
    : ageMonths >= 60
      ? 5
      : ageMonths >= 24
        ? 4
        : ageMonths >= 12
          ? 2
          : 1
  checks.push({ id: 'domainAge', earned: agePoints, max: 5, missing: ageMonths === null })

  const badStatus = domain?.status.some(status => BAD_STATUSES.has(status.toLowerCase()))
  checks.push({
    id: 'domainStatus',
    earned: domain && !badStatus ? 5 : 0,
    max: 5,
    missing: !domain,
  })

  const expiresIn = domain ? daysUntil(domain.dates.expires, now) : null
  const domainExpiry = expiresIn === null
    ? 0
    : expiresIn > 365
      ? 10
      : expiresIn > 90
        ? 7
        : expiresIn > 30
          ? 3
          : 0
  checks.push({
    id: 'domainExpiry',
    earned: domainExpiry,
    max: 10,
    missing: expiresIn === null,
  })

  const score = Math.round(checks.reduce((sum, check) => sum + check.earned, 0))

  let grade = gradeForScore(score)
  let capReason: AuditCapReason | null = null
  if (!tls.validation.valid) {
    grade = capAt(grade, 'C')
    capReason = 'invalid-cert'
  }

  return {
    score,
    grade,
    capReason,
    checks,
    partial: checks.some(check => check.missing),
  }
}
