export type TlsVersionGrade = 'modern' | 'acceptable' | 'deprecated' | 'unknown'

/**
 * 按协商出的 TLS 版本给出展示等级：
 * TLS 1.3 现代、TLS 1.2 可接受、TLS 1.1/1.0（及 SSLv2/3）已废弃。
 */
export function tlsVersionGrade(version: string | null | undefined): TlsVersionGrade {
  const normalized = version?.trim().toLowerCase() ?? ''
  if (!normalized) return 'unknown'
  if (normalized.includes('1.3')) return 'modern'
  if (normalized.includes('1.2')) return 'acceptable'
  if (normalized.includes('1.1') || normalized === 'tlsv1' || normalized.includes('sslv')) return 'deprecated'
  return 'unknown'
}
