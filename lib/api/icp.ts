import { apiGet } from './client'
import type { IcpQueryResult } from './types'

/** ICP 备案查询；后端会把 hostname 归一化为可注册域名 */
export function queryIcp(hostname: string): Promise<IcpQueryResult> {
  return apiGet<IcpQueryResult>('/icp/query', { domain: hostname })
}
