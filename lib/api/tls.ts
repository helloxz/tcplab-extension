import { apiPost } from './client'
import type { TlsCheckResult } from './types'

/** TLS 检测；IPv6 字面量由调用方按需加方括号 */
export function checkTls(host: string, port: number): Promise<TlsCheckResult> {
  return apiPost<TlsCheckResult>('/tls/check', { host, port })
}
