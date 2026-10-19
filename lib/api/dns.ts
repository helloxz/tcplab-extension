import { apiGet } from './client'
import type { DnsDomainResult } from './types'

/** 一次查询 A + AAAA，避免为了两类记录发两次请求 */
export function getDnsDomain(hostname: string): Promise<DnsDomainResult> {
  return apiGet<DnsDomainResult>('/dns/domain', { name: hostname })
}
