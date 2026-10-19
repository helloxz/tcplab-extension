import { apiGet } from './client'
import type { IpLookupResult } from './types'

/** 查询单个 IP 的归属地；lang 控制国家 / 省 / 市名称的语言 */
export function getIpGeo(ip: string, lang: 'zh' | 'en'): Promise<IpLookupResult> {
  // IPv6 包含冒号，编码后再拼进路径，避免被当成特殊字符
  return apiGet<IpLookupResult>(`/ip/${encodeURIComponent(ip)}`, { lang })
}
