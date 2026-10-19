import { watch } from 'vue'
import { useCachedResource } from '@/composables/useCachedResource'
import { getIpGeo } from '@/lib/api/ip'
import type { IpLookupResult } from '@/lib/api/types'
import { CACHE_TTL_MS, cacheKey } from '@/lib/cache'
import type { Locale } from '@/lib/i18n'

/**
 * 单个 IP 的归属地查询。
 *
 * - IP 不存在时清空数据；IP 或语言变化时自动重新加载
 * - 缓存按 IP + 语言隔离，因为国家 / 省 / 市名称会随语言变化
 * - 失败时静默：归属地只是辅助信息，不影响 DNS 面板本身
 */
export function useIpGeo(ip: () => string | null, locale: () => Locale) {
  const resource = useCachedResource<IpLookupResult>({
    cacheKey: () => cacheKey('ipGeo', ip() ?? 'none', locale()),
    ttl: CACHE_TTL_MS.ipGeo,
    enabled: () => !!ip(),
    fetcher: () => getIpGeo(ip() as string, locale()),
  })

  watch(
    () => [ip(), locale()] as const,
    () => {
      // enabled() 为 false 时 load() 会自行清空旧数据
      void resource.load()
    },
    { immediate: true },
  )

  return {
    data: resource.data,
    refresh: () => resource.load(true),
  }
}
