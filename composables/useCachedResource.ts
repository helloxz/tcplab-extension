import { ref, type Ref } from 'vue'
import { isFresh, readCache, writeCache } from '@/lib/cache'
import { isAppError } from '@/lib/errors'

export type ResourceStatus = 'idle' | 'loading' | 'success' | 'error'

export interface ResourceError {
  key: string
  args?: Record<string, unknown>
  retryAfter: number | null
}

export interface UseCachedResourceOptions<T> {
  /** 缓存键；传函数可读取响应式 hostname */
  cacheKey: string | (() => string)
  /** 本地缓存有效期（毫秒） */
  ttl: number
  /** false 时不发请求（例如 IP 页面不需要 DNS/WHOIS） */
  enabled?: () => boolean
  fetcher: () => Promise<T>
}

function normalizeError(err: unknown): ResourceError {
  if (isAppError(err)) {
    return {
      key: err.key,
      args: err.args,
      retryAfter: err.retryAfter ?? null,
    }
  }
  return { key: 'errors.unknown', retryAfter: null }
}

/**
 * 带本地缓存、手动刷新、限流降级的资源加载器。
 *
 * - 缓存新鲜：直接返回，不发请求
 * - 缓存过期：先展示旧数据，再刷新
 * - 刷新失败：保留旧数据并暴露 error，供 UI 显示 retry-after
 * - force=true：手动刷新，绕过本地缓存
 */
export function useCachedResource<T>(options: UseCachedResourceOptions<T>) {
  const status = ref<ResourceStatus>('idle')
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<ResourceError | null>(null)
  const fromCache = ref(false)
  const stale = ref(false)
  const fetchedAt = ref<number | null>(null)

  let runId = 0

  function resolveKey(): string {
    return typeof options.cacheKey === 'function' ? options.cacheKey() : options.cacheKey
  }

  async function load(force = false): Promise<void> {
    const id = ++runId

    if (options.enabled && !options.enabled()) {
      status.value = 'idle'
      data.value = null
      error.value = null
      fromCache.value = false
      stale.value = false
      fetchedAt.value = null
      return
    }

    const key = resolveKey()
    const cached = await readCache<T>(key)
    if (id !== runId) return

    if (cached && !force && isFresh(cached, options.ttl)) {
      data.value = cached.data
      fetchedAt.value = cached.fetchedAt
      fromCache.value = true
      stale.value = false
      error.value = null
      status.value = 'success'
      return
    }

    if (cached) {
      data.value = cached.data
      fetchedAt.value = cached.fetchedAt
      fromCache.value = true
      stale.value = true
    } else {
      data.value = null
      fetchedAt.value = null
      fromCache.value = false
      stale.value = false
    }

    status.value = 'loading'
    error.value = null

    try {
      const fresh = await options.fetcher()
      if (id !== runId) return

      const now = Date.now()
      data.value = fresh
      fetchedAt.value = now
      fromCache.value = false
      stale.value = false
      error.value = null
      status.value = 'success'
      await writeCache(key, fresh, now)
    } catch (err) {
      if (id !== runId) return

      error.value = normalizeError(err)
      if (data.value !== null) {
        // 保留旧缓存：限流 / 超时时仍然能看到上一次结果
        status.value = 'success'
        stale.value = true
      } else {
        status.value = 'error'
      }
    }
  }

  return {
    status,
    data,
    error,
    fromCache,
    stale,
    fetchedAt,
    load,
  }
}
