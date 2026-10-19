import { storage } from 'wxt/utils/storage'

export interface CacheEntry<T> {
  data: T
  /** 写入缓存的时间戳（毫秒） */
  fetchedAt: number
}

/** 与产品约定保持一致 */
export const CACHE_TTL_MS = {
  dns: 60 * 60 * 1000,
  tls: 12 * 60 * 60 * 1000,
  whois: 24 * 60 * 60 * 1000,
  /** IP 归属地变动很小，放宽到 7 天以减少额外请求 */
  ipGeo: 7 * 24 * 60 * 60 * 1000,
} as const

export type CacheKind = keyof typeof CACHE_TTL_MS

export function cacheKey(kind: CacheKind, ...parts: string[]): string {
  return `tcplab:cache:v1:${kind}:${parts.join(':')}`
}

export async function readCache<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const entry = await storage.getItem<CacheEntry<T>>(`local:${key}`)
    if (!entry || typeof entry.fetchedAt !== 'number') return null
    return entry
  } catch {
    // 隐私模式 / 存储不可用时按未命中处理
    return null
  }
}

export async function writeCache<T>(key: string, data: T, fetchedAt = Date.now()): Promise<void> {
  try {
    await storage.setItem<CacheEntry<T>>(`local:${key}`, { data, fetchedAt })
  } catch {
    // 配额已满或存储不可用时忽略，不影响本次展示
  }
}

export function isFresh(entry: CacheEntry<unknown>, ttl: number): boolean {
  return Date.now() - entry.fetchedAt < ttl
}
